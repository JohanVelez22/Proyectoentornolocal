<script setup lang="ts">
import { NAlert, NButton, NCheckbox, NInput, NModal, NSpin } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { ObjetivoSqlIpc, ResultadoImportar, VistaPreviaImportar } from '../../shared/api';
import { api, plano } from '../api';
import { mensajeDeError } from '../composables/useAccion';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import {
  basesDeLaSeleccion,
  destinoSugerido,
  destinosBd,
  idsImportables,
  opcionesDeEjecucion,
  origenValido,
  resumenResultado,
} from '../utilidades/importar';
import { traducirError } from '../utilidades/errores';
import Desplegable from './Desplegable.vue';
import FilaImportar from './FilaImportar.vue';

/**
 * Asistente "Importar desde Laragon, XAMPP o Herd": vista previa con casillas → confirmación →
 * resultado por fila. Los sitios se vinculan donde están (nunca se mueven ni se copian) y las
 * bases se vuelcan del servidor de origen que enciende el usuario; una base que ya existe solo se
 * reemplaza si se marca (con copia previa). La clave de origen solo vive en este componente.
 */
const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ cerrar: [] }>();

type Fase = 'vista' | 'confirmar' | 'importando' | 'fin';

const t = textos.importar;
const servicios = useServicios();

const fase = ref<Fase>('vista');
const cargando = ref(false);
const errorVista = ref<string | null>(null);
const vista = ref<VistaPreviaImportar | null>(null);
const seleccion = ref<string[]>([]);
const conBases = ref(false);
const destino = ref<ObjetivoSqlIpc | null>(null);
const origen = ref({ puerto: '3306', usuario: 'root', clave: '' });
const reemplazar = ref<string[]>([]);
const resultado = ref<ResultadoImportar | null>(null);
const errorImportar = ref<string | null>(null);
const cancelando = ref(false);

const destinos = computed(() => destinosBd(servicios.lista));
const opcionesDestino = computed(() =>
  destinos.value.map((d) => ({
    value: d.value,
    label: d.apagada ? `${d.label} (${t.bases.apagada})` : d.label,
  })),
);
const filas = computed(() => vista.value?.filas ?? []);
const bases = computed(() => basesDeLaSeleccion(filas.value, seleccion.value));
const hayBases = computed(() => bases.value.length > 0);
const origenOk = computed(() => origenValido(origen.value) !== null);
const reemplazos = computed(() =>
  bases.value.filter((b) => b.existe === true && reemplazar.value.includes(b.nombre.toLowerCase())),
);
const sinTocar = computed(() =>
  bases.value.filter((b) => b.existe === true && !reemplazos.value.includes(b)),
);
const nuevas = computed(() => bases.value.filter((b) => b.existe !== true));
const importaBases = computed(() => conBases.value && hayBases.value && destino.value !== null);
const puedeContinuar = computed(
  () => seleccion.value.length > 0 && (!importaBases.value || origenOk.value),
);
const motivoNo = computed(() => {
  if (seleccion.value.length === 0) return t.sinSeleccion;
  if (importaBases.value && !origenOk.value) return t.origenIncompleto;
  return null;
});
const resumen = computed(() => (resultado.value ? resumenResultado(resultado.value) : null));
const filaDe = (id: string) => filas.value.find((f) => f.id === id);

async function cargar(): Promise<void> {
  cargando.value = true;
  errorVista.value = null;
  try {
    const v = await api().importar.vistaPrevia(destino.value ?? undefined);
    vista.value = v;
    // Lo que ya estaba marcado se conserva (al cambiar de servidor solo cambia "ya existe").
    const ids = new Set(v.filas.map((f) => f.id));
    const previa = seleccion.value.filter((i) => ids.has(i));
    seleccion.value = previa.length > 0 ? previa : idsImportables(v.filas);
  } catch (e) {
    vista.value = null;
    errorVista.value = `${t.errorVista}: ${mensajeDeError(e)}`;
  } finally {
    cargando.value = false;
  }
}

watch(
  () => props.show,
  (v) => {
    if (!v) {
      // La clave no se queda en memoria de la interfaz al cerrar.
      origen.value = { puerto: '3306', usuario: 'root', clave: '' };
      return;
    }
    fase.value = 'vista';
    vista.value = null;
    seleccion.value = [];
    reemplazar.value = [];
    resultado.value = null;
    errorImportar.value = null;
    conBases.value = false;
    origen.value = { puerto: '3306', usuario: 'root', clave: '' };
    destino.value = destinoSugerido(destinos.value);
    void cargar();
  },
  { immediate: true },
);
watch(destino, (d, anterior) => {
  if (!props.show || d === anterior || !vista.value) return;
  // Lo que se mostraba ("ya existe", reemplazos marcados) era del servidor anterior.
  vista.value = null;
  reemplazar.value = [];
  void cargar();
});

function alternar(id: string, v: boolean): void {
  seleccion.value = v
    ? [...new Set([...seleccion.value, id])]
    : seleccion.value.filter((i) => i !== id);
}
function marcarReemplazo(nombre: string, v: boolean): void {
  const k = nombre.toLowerCase();
  reemplazar.value = v
    ? [...new Set([...reemplazar.value, k])]
    : reemplazar.value.filter((n) => n !== k);
}

/** Corta el volcado en curso (solo el proceso de esta importación) y deja cada base como estaba. */
async function cancelar(): Promise<void> {
  cancelando.value = true;
  try {
    await api().importar.cancelar();
  } catch {
    // si ya terminó, el resultado lo dirá
  } finally {
    cancelando.value = false;
  }
}

async function importar(): Promise<void> {
  fase.value = 'importando';
  errorImportar.value = null;
  try {
    const opciones = opcionesDeEjecucion({
      conBases: conBases.value,
      destino: destino.value,
      origen: origen.value,
      reemplazar: reemplazar.value,
      bases: bases.value,
    });
    resultado.value = await api().importar.ejecutar(seleccion.value.slice(), plano(opciones));
  } catch (e) {
    errorImportar.value = mensajeDeError(e);
  } finally {
    // La clave de origen se borra apenas termina, salga bien o mal.
    origen.value = { ...origen.value, clave: '' };
    fase.value = 'fin';
  }
}

const lista = (b: { nombre: string }[]): string => b.map((x) => x.nombre).join(', ');
const textoCodigo = (codigo: string | undefined, datos?: Record<string, string | number>): string =>
  traducirError({ codigo, ...(datos ? { datos } : {}) });
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t.titulo"
    :style="{ width: '720px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="fase !== 'importando'"
    :closable="fase !== 'importando'"
    :auto-focus="false"
    @update:show="(v: boolean) => !v && emit('cerrar')"
  >
    <!-- Vista previa -->
    <template v-if="fase === 'vista'">
      <p class="intro">{{ t.intro }}</p>
      <div v-if="cargando && !vista" class="estado"><NSpin :size="16" /> {{ t.buscando }}</div>
      <NAlert v-else-if="errorVista" type="error" :bordered="false">{{ errorVista }}</NAlert>
      <p v-else-if="vista && filas.length === 0" class="nada">{{ t.nada }}</p>
      <template v-else-if="vista">
        <div class="titulo-lista">
          <strong>{{ t.sitios.titulo }}</strong>
          <span class="acciones">
            <NButton size="tiny" text @click="seleccion = idsImportables(filas)">{{
              t.sitios.todos
            }}</NButton>
            <NButton size="tiny" text @click="seleccion = []">{{ t.sitios.ninguno }}</NButton>
          </span>
        </div>
        <ul class="lista">
          <FilaImportar
            v-for="f in filas"
            :key="f.id"
            :fila="f"
            :elegido="seleccion.includes(f.id)"
            :con-bases="conBases"
            :reemplaza="!!f.base && reemplazar.includes(f.base.nombre.toLowerCase())"
            @update:elegido="(v: boolean) => alternar(f.id, v)"
            @reemplazar="(v: boolean) => f.base && marcarReemplazo(f.base.nombre, v)"
          />
        </ul>
        <details v-if="vista.problemas.length > 0" class="problemas">
          <summary>{{ t.problemas.titulo(vista.problemas.length) }}</summary>
          <ul>
            <li v-for="(p, i) in vista.problemas" :key="i">
              <code>{{ p.donde }}</code> — {{ textoCodigo(p.codigo, { maximo: 1024 }) }}
            </li>
          </ul>
        </details>

        <section v-if="hayBases" class="bases">
          <NCheckbox v-model:checked="conBases">{{ t.bases.importarBases }}</NCheckbox>
          <template v-if="conBases">
            <NAlert v-if="destinos.length === 0" type="warning" :bordered="false">{{
              t.bases.sinMotores
            }}</NAlert>
            <template v-else>
              <p class="ayuda">{{ t.bases.ayuda }}</p>
              <div class="campos">
                <label class="campo ancho">
                  <span>{{ t.bases.destino }}</span>
                  <Desplegable
                    v-model:value="destino"
                    size="small"
                    :options="opcionesDestino"
                    :aria-label="t.bases.destino"
                  />
                </label>
                <label class="campo">
                  <span>{{ t.bases.puerto }}</span>
                  <NInput
                    v-model:value="origen.puerto"
                    size="small"
                    maxlength="5"
                    :input-props="{ inputmode: 'numeric', autocomplete: 'off' }"
                  />
                </label>
                <label class="campo">
                  <span>{{ t.bases.usuario }}</span>
                  <NInput
                    v-model:value="origen.usuario"
                    size="small"
                    maxlength="64"
                    :input-props="{ autocomplete: 'off', spellcheck: false }"
                  />
                </label>
                <label class="campo">
                  <span>{{ t.bases.clave }}</span>
                  <NInput
                    v-model:value="origen.clave"
                    size="small"
                    type="password"
                    show-password-on="click"
                    maxlength="256"
                    :input-props="{ autocomplete: 'off' }"
                  />
                </label>
              </div>
              <small class="nota">{{ t.bases.claveAyuda }}</small>
            </template>
          </template>
        </section>
      </template>
    </template>

    <!-- Confirmación -->
    <template v-else-if="fase === 'confirmar'">
      <h3 class="subtitulo">{{ t.confirmar.titulo }}</h3>
      <ul class="resumen">
        <li>{{ t.confirmar.sitios(seleccion.length) }}</li>
        <li>{{ t.confirmar.sinConfianza }}</li>
        <li>{{ t.confirmar.hosts }}</li>
        <template v-if="importaBases">
          <li v-if="nuevas.length">{{ t.confirmar.basesNuevas(lista(nuevas)) }}</li>
          <li v-if="reemplazos.length" class="peligro">
            {{ t.confirmar.basesReemplazo(lista(reemplazos)) }}
          </li>
          <li v-if="sinTocar.length">{{ t.confirmar.basesSinTocar(lista(sinTocar)) }}</li>
          <li>
            {{ t.confirmar.origen(origenValido(origen)?.puerto ?? 0, origen.usuario.trim()) }}
          </li>
          <li>{{ t.confirmar.proteccion }}</li>
        </template>
        <li v-else>{{ t.confirmar.sinBases }}</li>
      </ul>
    </template>

    <!-- Importando -->
    <div v-else-if="fase === 'importando'" class="estado">
      <NSpin :size="16" /> {{ t.resultado.importando }}
    </div>

    <!-- Resultado -->
    <template v-else>
      <h3 class="subtitulo">{{ t.resultado.titulo }}</h3>
      <NAlert
        v-if="errorImportar"
        type="error"
        :bordered="false"
        :title="t.resultado.errorImportar"
        >{{ errorImportar }}</NAlert
      >
      <template v-else-if="resultado">
        <p v-if="resumen">{{ t.resultado.resumen(resumen.sitios, resumen.bases) }}</p>
        <NAlert v-if="resultado.aplicado === false" type="warning" :bordered="false">{{
          t.resultado.sinAplicar
        }}</NAlert>
        <ul class="filas-resultado">
          <li v-for="s in resultado.sitios" :key="s.id" :class="s.ok ? 'ok' : 'mal'">
            <strong>{{ filaDe(s.id)?.nombre ?? s.id }}</strong>
            <span>{{ s.ok ? t.resultado.sitioOk : t.resultado.sitioFallo }}</span>
            <small v-if="s.codigo">{{
              textoCodigo(s.codigo, { dominio: filaDe(s.id)?.dominioFinal ?? '' })
            }}</small>
            <small v-if="s.ok && s.phpDistinto && s.php">{{
              t.resultado.phpDistinto(s.php)
            }}</small>
          </li>
          <li v-for="b in resultado.bases" :key="b.nombre" :class="b.ok ? 'ok' : 'mal'">
            <strong>{{
              b.ok ? t.resultado.baseOk(b.nombre) : t.resultado.baseFallo(b.nombre)
            }}</strong>
            <small v-if="b.codigo">{{ textoCodigo(b.codigo, { nombre: b.nombre }) }}</small>
            <small v-if="b.respaldoPrevio">{{ t.resultado.copiaPrevia(b.respaldoPrevio) }}</small>
            <small v-if="b.restaurada">{{ t.resultado.restaurada }}</small>
          </li>
        </ul>
      </template>
    </template>

    <template #footer>
      <div class="pie">
        <p
          v-if="fase === 'vista' && motivoNo && vista && filas.length"
          class="motivo"
          role="status"
        >
          {{ motivoNo }}
        </p>
        <NButton v-if="fase === 'importando'" :loading="cancelando" @click="cancelar">{{
          t.resultado.cancelar
        }}</NButton>
        <NButton v-else-if="fase === 'fin'" type="primary" @click="emit('cerrar')">{{
          t.cerrar
        }}</NButton>
        <template v-else>
          <NButton @click="fase === 'confirmar' ? (fase = 'vista') : emit('cerrar')">{{
            fase === 'confirmar' ? t.volver : t.cancelar
          }}</NButton>
          <NButton
            v-if="fase === 'vista'"
            type="primary"
            :disabled="!puedeContinuar"
            @click="fase = 'confirmar'"
            >{{ t.continuar }}</NButton
          >
          <NButton v-else type="primary" @click="importar">{{ t.importar }}</NButton>
        </template>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.intro {
  margin: 0 0 12px;
  font-size: 12.5px;
  opacity: 0.8;
}
.estado {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}
.nada {
  margin: 8px 0;
  opacity: 0.7;
}
.titulo-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.acciones {
  display: flex;
  gap: 12px;
}
.lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  max-height: 340px;
  overflow: auto;
}
.problemas {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.8;
}
.problemas ul {
  margin: 6px 0 0;
  padding-left: 18px;
}
code {
  font-family: var(--fuente-mono);
}
.bases {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ayuda,
.nota {
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
}
.campos {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  min-width: 130px;
  flex: 1;
}
.campo.ancho {
  flex-basis: 100%;
}
.campo > span {
  opacity: 0.7;
}
.subtitulo {
  margin: 0 0 8px;
  font-size: 15px;
}
.resumen {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.peligro {
  color: var(--texto-error);
}
.filas-resultado {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
}
.filas-resultado li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  font-size: 13px;
}
.filas-resultado li.mal {
  border-color: rgba(220, 38, 38, 0.45);
}
.filas-resultado small {
  opacity: 0.75;
}
.pie {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.motivo {
  margin: 0 auto 0 0;
  font-size: 12px;
  opacity: 0.7;
}
</style>

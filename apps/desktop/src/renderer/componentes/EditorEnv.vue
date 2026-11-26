<script setup lang="ts">
import { NAlert, NButton, NCheckbox, NInput, NModal, NSpin, useDialog, useMessage } from 'naive-ui';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import type { PedidoEnv, Sitio, VistaEnv } from '../../shared/api';
import { api, plano } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import Desplegable from './Desplegable.vue';
import FilaEnv from './FilaEnv.vue';
import {
  armarPedido,
  contarPendientes,
  etiquetaCopia,
  exigeAceptarVersionado,
  nombreNuevoValido,
  SEGUNDOS_REVELADO,
} from '../utilidades/env';
import VistaDiff from './VistaDiff.vue';

/**
 * Gestor de .env de un proyecto. Los valores secretos llegan enmascarados; uno completo solo se
 * pide con «Mostrar» en su fila y se olvida a los 30 segundos o al cerrar. Guardar muestra antes
 * un diff (también enmascarado), hace una copia con fecha y escribe de forma atómica.
 */
const props = defineProps<{
  sitio: Sitio | null;
  /** Variables propuestas (p. ej. REVERB_*): se cargan como cambios y se abre la vista previa. */
  propuesta?: Record<string, string> | null;
}>();
const emit = defineEmits<{ cerrar: [] }>();

type Bloque = NonNullable<PedidoEnv['bloques']>[number];
const BLOQUES: Bloque[] = ['bd', 'correo', 'ia', 'redis'];

const t = textos.env;
const message = useMessage();
const dialog = useDialog();
const { ejecutar, ocupado } = useAccion();

const vista = ref<VistaEnv | null>(null);
const cargando = ref(false);
const errorCarga = ref<string | null>(null);

/** Cambios sin guardar: valor nuevo, o null si la variable se quita. */
const cambios = reactive<Record<string, string | null>>({});
const desdeEjemplo = ref<string[]>([]);
const bloques = ref<Bloque[]>([]);
/** Valores completos que el usuario pidió con «Mostrar» (solo en memoria, un rato). */
const reveladas = reactive<Record<string, string>>({});
const temporizadores = new Map<string, ReturnType<typeof setTimeout>>();

const nuevoNombre = ref('');
const nuevoValor = ref('');

const confirmando = ref(false);
const diffTexto = ref('');
/** Huella del .env que mostró la vista previa: guardar falla si cambió por fuera entretanto. */
const huellaVista = ref('');
const aceptarVersionado = ref(false);
const agregarGitignore = ref(false);

const copias = ref<string[]>([]);
const copiaElegida = ref<string | null>(null);

const pendientes = computed(() => contarPendientes(pedido()));
const gitSigue = computed(() => vista.value?.gitignore.envVersionado === true);
const gitDesconocido = computed(
  () => vista.value !== null && vista.value.gitignore.envVersionado === null,
);
const exigeAceptar = computed(() => exigeAceptarVersionado(vista.value?.gitignore));
const puedeGuardar = computed(() => !exigeAceptar.value || aceptarVersionado.value);
const opcionesCopias = computed(() =>
  copias.value.map((c) => ({ label: etiquetaCopia(c), value: c })),
);
const nuevoValido = computed(() => nombreNuevoValido(nuevoNombre.value, vista.value?.filas ?? []));

function olvidarReveladas(): void {
  for (const k of Object.keys(reveladas)) delete reveladas[k];
  for (const h of temporizadores.values()) clearTimeout(h);
  temporizadores.clear();
}

function descartar(): void {
  for (const k of Object.keys(cambios)) delete cambios[k];
  desdeEjemplo.value = [];
  bloques.value = [];
  nuevoNombre.value = '';
  nuevoValor.value = '';
}

async function cargar(): Promise<void> {
  const sitio = props.sitio;
  if (!sitio) return;
  cargando.value = true;
  errorCarga.value = null;
  try {
    vista.value = await api().env.ver(sitio.id);
    copias.value = await api().env.copias(sitio.id);
    copiaElegida.value = copias.value[0] ?? null;
  } catch (e) {
    vista.value = null;
    errorCarga.value = mensajeDeError(e);
  } finally {
    cargando.value = false;
  }
  // Una propuesta no escribe nada: solo llena los cambios y abre la vista previa (con su confirmación).
  if (vista.value && props.propuesta && Object.keys(props.propuesta).length > 0) {
    for (const [k, v] of Object.entries(props.propuesta)) cambios[k] = v;
    await revisar();
  }
}

watch(
  () => props.sitio,
  (s) => {
    olvidarReveladas();
    descartar();
    vista.value = null;
    confirmando.value = false;
    if (s) void cargar();
  },
  { immediate: true },
);
onBeforeUnmount(olvidarReveladas);

async function revelar(clave: string): Promise<void> {
  const sitio = props.sitio;
  if (!sitio) return;
  const valor = await ejecutar('revelar-' + clave, () => api().env.revelar(sitio.id, clave), {
    tituloError: t.errorRevelar,
  });
  if (valor === undefined) return;
  reveladas[clave] = valor;
  clearTimeout(temporizadores.get(clave));
  temporizadores.set(
    clave,
    setTimeout(() => ocultar(clave), SEGUNDOS_REVELADO * 1000),
  );
}

function ocultar(clave: string): void {
  delete reveladas[clave];
  clearTimeout(temporizadores.get(clave));
  temporizadores.delete(clave);
}

function cambiar(clave: string, valor: string): void {
  cambios[clave] = valor;
}

function deshacer(clave: string): void {
  delete cambios[clave];
}

function agregarVariable(): void {
  if (!nuevoValido.value) return;
  cambios[nuevoNombre.value] = nuevoValor.value;
  nuevoNombre.value = '';
  nuevoValor.value = '';
}

function agregarFaltantes(): void {
  const faltan = vista.value?.diff.faltan ?? [];
  desdeEjemplo.value = [...new Set([...desdeEjemplo.value, ...faltan])];
}

function alternarBloque(b: Bloque): void {
  bloques.value = bloques.value.includes(b)
    ? bloques.value.filter((x) => x !== b)
    : [...bloques.value, b];
}

function pedido(): PedidoEnv {
  return plano(armarPedido(cambios, desdeEjemplo.value, bloques.value));
}

async function revisar(): Promise<void> {
  const sitio = props.sitio;
  if (!sitio || pendientes.value === 0) return;
  const r = await ejecutar('vista-previa', () => api().env.vistaPrevia(sitio.id, pedido()), {
    tituloError: t.errorVistaPrevia,
  });
  if (!r) return;
  diffTexto.value = r.diff;
  huellaVista.value = r.huella;
  aceptarVersionado.value = false;
  agregarGitignore.value = false;
  confirmando.value = true;
}

async function guardar(): Promise<void> {
  const sitio = props.sitio;
  if (!sitio || !puedeGuardar.value) return;
  const r = await ejecutar(
    'guardar',
    () =>
      api().env.guardar(
        sitio.id,
        pedido(),
        plano({
          confirmado: true as const,
          huella: huellaVista.value,
          ...(aceptarVersionado.value ? { aceptarVersionado: true } : {}),
          ...(agregarGitignore.value ? { agregarGitignore: true } : {}),
        }),
      ),
    { tituloError: t.errorGuardar },
  );
  if (!r) return;
  message.success(r.copia ? t.guardadoConCopia : t.guardado);
  confirmando.value = false;
  olvidarReveladas();
  descartar();
  await cargar();
}

function pedirCerrar(): void {
  if (pendientes.value === 0) {
    emit('cerrar');
    return;
  }
  const d = dialog.warning({
    title: t.cerrarTitulo,
    content: t.cerrarTexto(pendientes.value),
    positiveText: t.cerrarDescartar,
    negativeText: t.seguirEditando,
    autoFocus: false,
    onPositiveClick: () => {
      d.destroy();
      emit('cerrar');
    },
  });
}

function pedirVolver(): void {
  const sitio = props.sitio;
  const nombre = copiaElegida.value;
  if (!sitio || !nombre) return;
  const d = dialog.warning({
    title: t.copias.confirmarTitulo,
    content: t.copias.confirmarTexto(etiquetaCopia(nombre)),
    positiveText: t.copias.volver,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: async () => {
      d.loading = true;
      const r = await ejecutar(
        'volver',
        () => api().env.restaurarCopia(sitio.id, nombre, { confirmado: true }),
        { tituloError: t.copias.error },
      );
      if (!r) return false;
      message.success(t.copias.hecho);
      olvidarReveladas();
      descartar();
      await cargar();
      return true;
    },
  });
}

function pedirUsuarioPropio(): void {
  const sitio = props.sitio;
  if (!sitio) return;
  const d = dialog.warning({
    title: t.usuarioPropio.confirmarTitulo,
    content: t.usuarioPropio.confirmarTexto,
    positiveText: t.usuarioPropio.confirmar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: async () => {
      d.loading = true;
      return usarUsuarioPropio(sitio.id, false);
    },
  });
}

/**
 * Llama a "Usar usuario propio". Si otro proyecto ya usa ese usuario con la misma base, el núcleo
 * no comparte su clave sin una confirmación aparte que lo nombra: se pide y se vuelve a llamar.
 */
async function usarUsuarioPropio(sitioId: string, compartir: boolean): Promise<boolean> {
  let compartido: { base: string; proyecto: string } | null = null;
  const r = await ejecutar(
    'usuario-propio',
    async () => {
      try {
        return await api().env.usarUsuarioPropio(
          sitioId,
          plano({
            confirmado: true as const,
            ...(aceptarVersionado.value ? { aceptarVersionado: true } : {}),
            ...(compartir ? { compartirUsuario: true } : {}),
          }),
        );
      } catch (e) {
        const x = e as { codigo?: unknown; datos?: Record<string, unknown> };
        if (x.codigo === 'env.usuario_compartido' && !compartir) {
          compartido = {
            base: String(x.datos?.['base'] ?? ''),
            proyecto: String(x.datos?.['proyecto'] ?? ''),
          };
          return null;
        }
        throw e;
      }
    },
    { tituloError: t.usuarioPropio.error },
  );
  if (compartido) {
    const { base, proyecto } = compartido;
    dialog.warning({
      title: t.usuarioPropio.compartirTitulo,
      content: t.usuarioPropio.compartirTexto(base, proyecto),
      positiveText: t.usuarioPropio.compartir,
      negativeText: textos.acciones.cancelar,
      autoFocus: false,
      onPositiveClick: () => usarUsuarioPropio(sitioId, true),
    });
    return true;
  }
  if (!r) return false;
  message.success(t.usuarioPropio.hecho(r.usuario));
  olvidarReveladas();
  descartar();
  await cargar();
  return true;
}
</script>

<template>
  <NModal
    :show="sitio !== null"
    preset="card"
    :title="sitio ? t.titulo(sitio.nombre || sitio.dominio) : ''"
    :style="{ width: '860px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false"
    :auto-focus="false"
    @update:show="(v: boolean) => !v && pedirCerrar()"
  >
    <p class="intro">{{ t.intro }}</p>

    <NSpin v-if="cargando && !vista" :size="18" />
    <NAlert v-else-if="errorCarga" type="error" :bordered="false">{{ errorCarga }}</NAlert>

    <template v-else-if="vista">
      <NAlert v-if="!vista.existe" type="info" :bordered="false" class="aviso">
        {{ t.noExiste }}
      </NAlert>
      <NAlert v-if="gitSigue" type="warning" :bordered="false" class="aviso">
        {{ t.confirmar.versionado }}
      </NAlert>
      <NAlert v-else-if="gitDesconocido" type="warning" :bordered="false" class="aviso">
        {{ t.confirmar.versionadoDesconocido }}
      </NAlert>

      <section class="tabla" :aria-label="t.tablaEtiqueta">
        <FilaEnv
          v-for="f in vista.filas"
          :key="f.clave"
          :fila="f"
          :revelado="reveladas[f.clave] ?? null"
          :cambio="cambios[f.clave]"
          :cargando-revelar="ocupado('revelar-' + f.clave)"
          @revelar="revelar(f.clave)"
          @ocultar="ocultar(f.clave)"
          @cambiar="(v: string) => cambiar(f.clave, v)"
          @quitar="cambios[f.clave] = null"
          @deshacer="deshacer(f.clave)"
        />
        <p v-if="!vista.filas.length" class="nota">{{ t.sinVariables }}</p>
      </section>

      <section class="bloque">
        <h4>{{ t.agregarTitulo }}</h4>
        <div class="agregar">
          <NInput
            v-model:value="nuevoNombre"
            size="small"
            :placeholder="t.agregarNombre"
            :input-props="{ spellcheck: false, 'aria-label': t.agregarNombre }"
          />
          <NInput
            v-model:value="nuevoValor"
            size="small"
            :placeholder="t.agregarValor"
            :input-props="{ spellcheck: false, 'aria-label': t.agregarValor }"
            @keydown.enter="agregarVariable"
          />
          <NButton size="small" :disabled="!nuevoValido" @click="agregarVariable">
            {{ t.agregar }}
          </NButton>
        </div>
        <small v-if="nuevoNombre && !nuevoValido" class="nota">{{ t.nombreInvalido }}</small>
      </section>

      <section class="bloque">
        <h4>{{ t.comparar.titulo }}</h4>
        <p v-if="!vista.hayEjemplo" class="nota">{{ t.comparar.sinEjemplo }}</p>
        <template v-else>
          <p
            v-if="
              !vista.diff.faltan.length && !vista.diff.sobran.length && !vista.diff.distintas.length
            "
            class="nota"
          >
            {{ t.comparar.alDia }}
          </p>
          <div v-if="vista.diff.faltan.length" class="lista">
            <strong>{{ t.comparar.faltan(vista.diff.faltan.length) }}</strong>
            <code>{{ vista.diff.faltan.join(', ') }}</code>
            <NButton size="tiny" :disabled="desdeEjemplo.length > 0" @click="agregarFaltantes">
              {{ t.comparar.agregarFaltantes }}
            </NButton>
          </div>
          <div v-if="vista.diff.sobran.length" class="lista">
            <strong>{{ t.comparar.sobran(vista.diff.sobran.length) }}</strong>
            <code>{{ vista.diff.sobran.join(', ') }}</code>
          </div>
          <div v-if="vista.diff.distintas.length" class="lista">
            <strong>{{ t.comparar.distintas(vista.diff.distintas.length) }}</strong>
            <code>{{ vista.diff.distintas.join(', ') }}</code>
          </div>
        </template>
      </section>

      <section class="bloque">
        <h4>{{ t.bloques.titulo }}</h4>
        <p class="nota">{{ t.bloques.ayuda }}</p>
        <div class="botones">
          <NButton
            v-for="b in BLOQUES"
            :key="b"
            size="small"
            :type="bloques.includes(b) ? 'primary' : 'default'"
            :aria-pressed="bloques.includes(b)"
            @click="alternarBloque(b)"
          >
            {{ t.bloques[b] }}
          </NButton>
        </div>
      </section>

      <section class="bloque">
        <h4>{{ t.usuarioPropio.titulo }}</h4>
        <p class="nota">{{ t.usuarioPropio.ayuda }}</p>
        <NButton size="small" :loading="ocupado('usuario-propio')" @click="pedirUsuarioPropio">
          {{ t.usuarioPropio.titulo }}
        </NButton>
      </section>

      <section class="bloque">
        <h4>{{ t.copias.titulo }}</h4>
        <p v-if="!copias.length" class="nota">{{ t.copias.ninguna }}</p>
        <div v-else class="agregar">
          <Desplegable v-model:value="copiaElegida" size="small" :options="opcionesCopias" />
          <NButton size="small" :loading="ocupado('volver')" @click="pedirVolver">
            {{ t.copias.volver }}
          </NButton>
        </div>
      </section>
    </template>

    <template #footer>
      <div class="pie">
        <span class="nota" aria-live="polite">{{
          pendientes ? t.cambiosPendientes(pendientes) : ''
        }}</span>
        <NButton :disabled="pendientes === 0" @click="descartar">{{ t.descartar }}</NButton>
        <NButton
          type="primary"
          :disabled="pendientes === 0"
          :loading="ocupado('vista-previa')"
          @click="revisar"
        >
          {{ t.guardar }}
        </NButton>
        <NButton @click="pedirCerrar">{{ t.cerrar }}</NButton>
      </div>
    </template>
  </NModal>

  <NModal
    v-model:show="confirmando"
    preset="card"
    :title="t.confirmar.titulo"
    :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="!ocupado('guardar')"
    :closable="!ocupado('guardar')"
    :auto-focus="false"
  >
    <p class="intro">{{ t.confirmar.texto }}</p>
    <VistaDiff v-if="diffTexto" :diff="diffTexto" />
    <p v-else class="nota">{{ t.confirmar.sinCambios }}</p>
    <div class="opciones">
      <NCheckbox v-if="vista && !vista.gitignore.ignoraEnv" v-model:checked="agregarGitignore">
        {{ t.confirmar.agregarGitignore }}
      </NCheckbox>
      <NCheckbox v-if="exigeAceptar" v-model:checked="aceptarVersionado">
        {{ t.confirmar.aceptarVersionado }}
      </NCheckbox>
    </div>
    <template #footer>
      <div class="pie">
        <NButton :disabled="ocupado('guardar')" @click="confirmando = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton
          type="primary"
          :loading="ocupado('guardar')"
          :disabled="!puedeGuardar || !diffTexto"
          @click="guardar"
        >
          {{ t.confirmar.guardar }}
        </NButton>
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
.aviso {
  margin-bottom: 10px;
}
.tabla {
  max-height: 38vh;
  overflow: auto;
  margin-bottom: 12px;
}
.bloque {
  margin-bottom: 14px;
}
.bloque h4 {
  margin: 0 0 6px;
  font-size: 13px;
}
.agregar {
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(0, 1.6fr) auto;
  gap: 8px;
  align-items: center;
}
.lista {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12.5px;
}
.botones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.nota {
  margin: 0 0 6px;
  font-size: 12px;
  opacity: 0.76;
}
.opciones {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  font-size: 12.5px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.pie .nota {
  margin: 0 auto 0 0;
}
code {
  font-family: var(--fuente-mono);
}
</style>

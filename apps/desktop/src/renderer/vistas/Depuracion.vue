<script setup lang="ts">
import { Refresh, Trash } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NEmpty,
  NIcon,
  NInput,
  NModal,
  NPopconfirm,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  useMessage,
} from 'naive-ui';
import Desplegable from '../componentes/Desplegable.vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Sitio } from '../../shared/api';
import { api } from '../api';
import DetalleError from '../componentes/DetalleError.vue';
import ListaDumps from '../componentes/ListaDumps.vue';
import ListaErrores from '../componentes/ListaErrores.vue';
import VistaDump from '../componentes/VistaDump.vue';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useDepuracion } from '../stores/depuracion';
import { useSitios } from '../stores/sitios';
import { avisoEditorSustituido } from '../utilidades/editores';

const t = textos.depuracion;
const dep = useDepuracion();
const sitios = useSitios();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const TIPOS_PHP = ['laravel', 'codeigniter3', 'codeigniter4', 'wordpress', 'personalizado'];
const esPhp = (s: Sitio): boolean => TIPOS_PHP.includes(s.tipo);

/** Sitios donde la captura tiene sentido: PHP (con versión elegida) y FastAPI. */
const candidatos = computed(() => sitios.lista.filter((s) => esPhp(s) || s.tipo === 'fastapi'));

const nombreSitio = (id: string | null): string =>
  id ? (sitios.porId(id)?.dominio ?? id) : t.sinSitio;

onMounted(() => {
  dep.iniciar();
  sitios.iniciar();
  void ejecutar('cargar', async () => {
    sitios.hidratar(await api().sitios.listar());
    await dep.cargarEstado();
    await dep.refrescar();
  });
});
onBeforeUnmount(() => {
  dep.detener();
  pararErrores();
});

/* ───────────── Pestañas: volcados y errores ───────────── */

/** Refresco de los errores cada 5 s, solo con la pestaña a la vista. */
const REFRESCO_ERRORES_MS = 5000;
const pestana = ref<'volcados' | 'errores'>('volcados');
let temporizadorErrores: ReturnType<typeof setInterval> | null = null;

function pararErrores(): void {
  if (temporizadorErrores) clearInterval(temporizadorErrores);
  temporizadorErrores = null;
}

watch(pestana, (p) => {
  pararErrores();
  if (p !== 'errores') return;
  void ejecutar('errores', () => dep.refrescarErrores());
  temporizadorErrores = setInterval(
    () => void dep.refrescarErrores().catch(() => undefined),
    REFRESCO_ERRORES_MS,
  );
});

const opcionesSitioErrores = computed(() => [
  { label: t.filtroSitio, value: '' },
  ...sitios.lista.map((s) => ({ label: s.dominio, value: s.id })),
]);

function elegirError(huella: string): void {
  void ejecutar('leerError', () => dep.elegirError(huella));
}

/** "Abrir en el editor": el núcleo comprueba que el archivo esté dentro de la carpeta del sitio. */
function abrirEnEditor(): void {
  const e = dep.errorElegido;
  if (!e || !e.sitioId || !e.archivo || e.linea === null) return;
  const { sitioId, archivo, linea } = e;
  void ejecutar('editor', async () => {
    const r = await api().editor.abrirEn(sitioId, archivo, linea);
    const aviso = avisoEditorSustituido(r);
    if (aviso) message.info(aviso);
  });
}

/* ───────────── Receptor y captura por sitio ───────────── */

function activarReceptor(v: boolean): void {
  void ejecutar('receptor', () => dep.activar(v));
}

/** Pedido de activar la captura de un sitio: el diálogo explica qué se define y cómo usarlo. */
const pedido = ref<Sitio | null>(null);

function cambiarCaptura(s: Sitio, v: boolean): void {
  if (v) {
    pedido.value = s;
    return;
  }
  void ejecutar(`sitio-${s.id}`, async () => {
    await api().depuracion.captura(s.id, false);
    await dep.cargarEstado();
  });
}

/** Única vía a encender la captura: el botón del diálogo, que pasa la confirmación. */
function confirmar(): void {
  const s = pedido.value;
  if (!s) return;
  pedido.value = null;
  void ejecutar(`sitio-${s.id}`, async () => {
    await api().depuracion.captura(s.id, true, true);
    await dep.cargarEstado();
    if (!esPhp(s)) message.info(t.reiniciarProcesos, { duration: 8000 });
  });
}

/* ───────────── Lista y filtros ───────────── */

const opcionesSitio = computed(() => [
  { label: t.filtroSitio, value: '' },
  ...candidatos.value.map((s) => ({ label: s.dominio, value: s.id })),
]);
const opcionesOrigen = computed(() => [
  { label: t.filtroOrigen, value: '' },
  { label: t.php, value: 'php' },
  { label: t.python, value: 'python' },
]);

const filtroSitio = computed({
  get: () => dep.filtro.sitioId ?? '',
  set: (v: string) => {
    const f = { ...dep.filtro };
    if (v) f.sitioId = v;
    else delete f.sitioId;
    dep.filtro = f;
  },
});
const filtroOrigen = computed({
  get: () => dep.filtro.origen ?? '',
  set: (v: string) => {
    const f = { ...dep.filtro };
    if (v === 'php' || v === 'python') f.origen = v;
    else delete f.origen;
    dep.filtro = f;
  },
});
const filtroTexto = computed({
  get: () => dep.filtro.texto ?? '',
  set: (v: string) => {
    dep.filtro = { ...dep.filtro, texto: v.slice(0, 200) };
  },
});

function elegir(id: string): void {
  void ejecutar('leer', () => dep.elegir(id));
}

function copiar(): void {
  const d = dep.elegido;
  if (!d) return;
  void ejecutar('copiar', () => api().depuracion.copiar(d.id), { exito: t.copiado });
}

function limpiar(): void {
  void ejecutar('limpiar', () => dep.limpiar());
}
</script>

<template>
  <div class="depuracion">
    <p class="descripcion">{{ t.descripcion }}</p>

    <NTabs v-model:value="pestana" type="line" class="pestanas" pane-class="pestana">
      <NTabPane name="volcados" :tab="t.pestanaVolcados">
        <section class="receptor">
          <label class="interruptor">
            <NSwitch
              :value="dep.activo"
              :loading="ocupado('receptor')"
              @update:value="activarReceptor"
            />
            <strong>{{ t.receptor }}</strong>
          </label>
          <NTag size="small" :bordered="false" :type="dep.activo ? 'success' : 'default'">
            {{
              dep.activo && dep.estado?.puerto
                ? t.escuchando(dep.estado.direccion, dep.estado.puerto)
                : t.apagado
            }}
          </NTag>
          <span v-if="dep.estado" class="total">{{ t.total(dep.estado.total) }}</span>
        </section>
        <NAlert type="info" :show-icon="false" class="memoria">{{ t.memoria }}</NAlert>

        <section class="sitios">
          <h3>{{ t.sitios }}</h3>
          <p v-if="candidatos.length === 0" class="descripcion">{{ t.sinSitios }}</p>
          <ul v-else>
            <li v-for="s in candidatos" :key="s.id">
              <NSwitch
                size="small"
                :value="s.capturaDumps === true"
                :loading="ocupado(`sitio-${s.id}`)"
                :disabled="esPhp(s) && !s.php"
                @update:value="(v: boolean) => cambiarCaptura(s, v)"
              />
              <span class="dominio">{{ s.dominio }}</span>
              <NTag size="small" :bordered="false" :type="esPhp(s) ? 'info' : 'success'">
                {{ esPhp(s) ? t.php : t.python }}
              </NTag>
              <span v-if="esPhp(s) && !s.php" class="nota">{{ t.sinPhp }}</span>
            </li>
          </ul>
        </section>

        <section class="filtros">
          <Desplegable
            v-model:value="filtroSitio"
            :options="opcionesSitio"
            size="small"
            class="sel"
          />
          <Desplegable
            v-model:value="filtroOrigen"
            :options="opcionesOrigen"
            size="small"
            class="sel"
          />
          <NInput
            v-model:value="filtroTexto"
            size="small"
            clearable
            :maxlength="200"
            :placeholder="t.buscar"
            class="buscar"
          />
          <NPopconfirm @positive-click="limpiar">
            <template #trigger>
              <NButton size="small" secondary :loading="ocupado('limpiar')">
                <template #icon
                  ><NIcon><Trash /></NIcon
                ></template>
                {{ t.limpiar }}
              </NButton>
            </template>
            {{ t.confirmarLimpiar }}
          </NPopconfirm>
        </section>

        <div class="panel">
          <div class="columna-lista">
            <NEmpty
              v-if="dep.lista.length === 0"
              :description="dep.activo ? t.vacio : t.vacioApagado"
              class="vacio"
            />
            <ListaDumps
              v-else
              :lista="dep.lista"
              :elegido-id="dep.elegido?.id ?? null"
              :nombre-sitio="nombreSitio"
              @elegir="elegir"
            />
          </div>
          <div class="columna-vista">
            <VistaDump
              v-if="dep.elegido"
              :dump="dep.elegido"
              :nombre-sitio="nombreSitio"
              :copiando="ocupado('copiar')"
              @copiar="copiar"
            />
            <NEmpty v-else :description="t.elegir" class="vacio" />
          </div>
        </div>
      </NTabPane>

      <NTabPane name="errores" :tab="t.pestanaErrores">
        <p class="descripcion">{{ t.erroresDescripcion }}</p>
        <section class="filtros">
          <Desplegable
            v-model:value="dep.sitioErrores"
            :options="opcionesSitioErrores"
            size="small"
            class="sel"
          />
          <NButton
            size="small"
            secondary
            :loading="ocupado('errores')"
            @click="ejecutar('errores', () => dep.refrescarErrores())"
          >
            <template #icon
              ><NIcon><Refresh /></NIcon
            ></template>
            {{ t.actualizar }}
          </NButton>
        </section>
        <div class="panel">
          <div class="columna-lista">
            <NEmpty v-if="dep.errores.length === 0" :description="t.erroresVacio" class="vacio" />
            <ListaErrores
              v-else
              :lista="dep.errores"
              :elegida="dep.errorElegido?.huella ?? null"
              :nombre-sitio="nombreSitio"
              @elegir="elegirError"
            />
          </div>
          <div class="columna-vista">
            <DetalleError
              v-if="dep.errorElegido"
              :error="dep.errorElegido"
              :nombre-sitio="nombreSitio"
              :abriendo="ocupado('editor')"
              @abrir="abrirEnEditor"
            />
            <NEmpty v-else :description="t.erroresElegir" class="vacio" />
          </div>
        </div>
      </NTabPane>
    </NTabs>

    <NModal
      :show="pedido !== null"
      preset="dialog"
      :title="pedido ? t.confirmarTitulo(pedido.dominio) : ''"
      :positive-text="t.activar"
      :negative-text="t.cancelar"
      @positive-click="confirmar"
      @negative-click="pedido = null"
      @close="pedido = null"
      @mask-click="pedido = null"
    >
      <template v-if="pedido">
        <NSpace vertical>
          <p>{{ esPhp(pedido) ? t.confirmarPhp : t.confirmarPython }}</p>
          <code class="uso">{{ esPhp(pedido) ? t.usoPhp : t.usoPython }}</code>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.depuracion {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}
.descripcion {
  margin: 0;
  opacity: 0.8;
}
.pestanas {
  flex: 1;
  min-height: 0;
}
.pestanas :deep(.pestana) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.receptor {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.interruptor {
  display: flex;
  align-items: center;
  gap: 8px;
}
.total {
  opacity: 0.7;
  font-size: 12px;
}
.sitios h3 {
  margin: 0 0 6px;
  font-size: 14px;
}
.sitios ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
}
.sitios li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nota {
  font-size: 12px;
  opacity: 0.7;
}
.filtros {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.sel {
  width: 180px;
}
.buscar {
  flex: 1;
  min-width: 180px;
}
.panel {
  display: grid;
  grid-template-columns: minmax(240px, 2fr) 3fr;
  gap: 12px;
  flex: 1;
  min-height: 320px;
}
.columna-lista,
.columna-vista {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 8px;
  padding: 8px;
}
.vacio {
  margin: auto;
}
.uso {
  display: block;
  white-space: pre-wrap;
}
</style>

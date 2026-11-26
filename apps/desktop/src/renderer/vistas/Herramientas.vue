<script setup lang="ts">
import {
  Archive,
  Book,
  Brush,
  Create,
  Camera,
  DocumentAttach,
  CodeSlash,
  Desktop,
  DocumentText,
  GitCompare,
  Image,
  InformationCircle,
  Key,
  LockClosed,
  QrCode,
  Search,
  ShieldCheckmark,
  SwapVertical,
  Time,
  Pulse,
  Text,
  TrashBin,
  Videocam,
} from '@vicons/ionicons5';
import { NDrawer, NDrawerContent, NEmpty, NIcon, NInput, NTab, NTabs, useDialog } from 'naive-ui';
import { computed, defineAsyncComponent, ref, watch, type Component } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import IlustracionVacia from '../componentes/IlustracionVacia.vue';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';
import {
  HERRAMIENTAS_ANCHAS,
  SECCIONES_HERRAMIENTAS,
  TARJETAS_POR_SECCION,
  pestanasDe,
  resolverHerramienta,
} from '../utilidades/herramientasSecciones';

const t = textos.herramientas;
type Clave = keyof typeof t.lista;

/** Componente de cada herramienta (las de una pestaña se muestran dentro de su tarjeta). */
const componentes: Record<Clave, Component> = {
  qr: defineAsyncComponent(() => import('../componentes/herramientas/Qr.vue')),
  json: defineAsyncComponent(() => import('../componentes/herramientas/Json.vue')),
  regex: defineAsyncComponent(() => import('../componentes/herramientas/Regex.vue')),
  diff: defineAsyncComponent(() => import('../componentes/herramientas/Diff.vue')),
  tiempo: defineAsyncComponent(() => import('../componentes/herramientas/Tiempo.vue')),
  puertos: defineAsyncComponent(() => import('../componentes/herramientas/Puertos.vue')),
  bom: defineAsyncComponent(() => import('../componentes/herramientas/Bom.vue')),
  certificados: defineAsyncComponent(() => import('../componentes/herramientas/Certificados.vue')),
  cripto: defineAsyncComponent(() => import('../componentes/herramientas/Cripto.vue')),
  markdown: defineAsyncComponent(() => import('../componentes/herramientas/Markdown.vue')),
  entorno: defineAsyncComponent(() => import('../componentes/herramientas/Entorno.vue')),
  infoArchivo: defineAsyncComponent(() => import('../componentes/herramientas/InfoArchivo.vue')),
  websocket: defineAsyncComponent(() => import('../componentes/herramientas/WebSocket.vue')),
  buscar: defineAsyncComponent(() => import('../componentes/herramientas/Buscar.vue')),
  contrasenas: defineAsyncComponent(() => import('../componentes/herramientas/Contrasenas.vue')),
  qrWifi: defineAsyncComponent(() => import('../componentes/herramientas/QrWifi.vue')),
  imagenes: defineAsyncComponent(() => import('../componentes/herramientas/Imagenes.vue')),
  comprimir: defineAsyncComponent(() => import('../componentes/herramientas/Comprimir.vue')),
  conversor: defineAsyncComponent(() => import('../componentes/herramientas/Conversor.vue')),
  captura: defineAsyncComponent(() => import('../componentes/herramientas/CapturaPantalla.vue')),
  grabarPantalla: defineAsyncComponent(
    () => import('../componentes/herramientas/GrabarPantalla.vue'),
  ),
  limpiezaDisco: defineAsyncComponent(
    () => import('../componentes/herramientas/LimpiezaDisco.vue'),
  ),
  guiaTuneles: defineAsyncComponent(() => import('../componentes/herramientas/GuiaTuneles.vue')),
  guiaHttp: defineAsyncComponent(() => import('../componentes/herramientas/GuiaHttp.vue')),
  editor: defineAsyncComponent(() => import('../componentes/herramientas/EditorCodigo.vue')),
  diffCarpetas: defineAsyncComponent(() => import('../componentes/herramientas/DiffCarpetas.vue')),
};

/** Icono de cada tarjeta (las unificadas, `comparar` y `guias`, tienen el suyo). */
const iconos: Record<string, Component> = {
  qr: QrCode,
  json: CodeSlash,
  regex: Text,
  comparar: GitCompare,
  tiempo: Time,
  puertos: SwapVertical,
  bom: Brush,
  certificados: ShieldCheckmark,
  cripto: Key,
  markdown: DocumentText,
  entorno: Desktop,
  infoArchivo: InformationCircle,
  websocket: Pulse,
  buscar: Search,
  contrasenas: LockClosed,
  imagenes: Image,
  comprimir: Archive,
  conversor: DocumentAttach,
  captura: Camera,
  grabarPantalla: Videocam,
  limpiezaDisco: TrashBin,
  guias: Book,
  editor: Create,
};

/** Nombre y descripción de una tarjeta: las unificadas tienen los suyos; el resto, los de su herramienta. */
function textoDe(tarjeta: string): { nombre: string; descripcion: string } {
  if (tarjeta in t.tarjetas) return t.tarjetas[tarjeta as keyof typeof t.tarjetas];
  return t.lista[tarjeta as Clave];
}

const busqueda = ref('');
/** Tarjeta abierta en el cajón y, si tiene pestañas, la herramienta que se ve. */
const abierta = ref<string | null>(null);
const herramienta = ref<string | null>(null);

const normalizar = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Lo que busca el buscador de una tarjeta: su texto y el de cada herramienta de sus pestañas. */
function pajar(tarjeta: string): string {
  const propios = textoDe(tarjeta);
  const pestanas = pestanasDe(tarjeta).map((p) => t.lista[p as Clave]);
  return normalizar([propios, ...pestanas].map((x) => `${x.nombre} ${x.descripcion}`).join(' '));
}

/** Secciones con las tarjetas que coinciden con la búsqueda (las vacías no se muestran). */
const secciones = computed(() => {
  const q = normalizar(busqueda.value.trim());
  return SECCIONES_HERRAMIENTAS.map((id) => ({
    id,
    tarjetas: TARJETAS_POR_SECCION[id].filter((c) => !q || pajar(c).includes(q)),
  })).filter((s) => s.tarjetas.length > 0);
});

function abrir(tarjeta: string, dentro?: string): void {
  abierta.value = tarjeta;
  herramienta.value = dentro ?? pestanasDe(tarjeta)[0] ?? tarjeta;
}

// Pedido de la paleta de comandos, de `abrirEnEditor` o de una alerta de Inicio (p. ej. 'puertos').
// Los ids viejos (`diff`, `diffCarpetas`, `qrWifi`, `guiaTuneles`, `guiaHttp`) abren la tarjeta
// unificada en su pestaña.
watch(
  () => solicitudes.herramienta,
  (c) => {
    if (!c) return;
    solicitudes.herramienta = null;
    const destino = resolverHerramienta(c);
    if (!destino) return;
    // Cambiar de herramienta desde Ctrl+K con cambios sin guardar en el editor: se pregunta antes.
    if (herramienta.value === 'editor' && destino.herramienta !== 'editor') {
      void confirmarSalida().then((ok) => {
        if (ok) abrir(destino.tarjeta, destino.herramienta);
      });
      return;
    }
    abrir(destino.tarjeta, destino.herramienta);
  },
  { immediate: true },
);

const dialogo = useDialog();

/** Con cambios sin guardar en el editor, cerrar o salir pide confirmación. */
function confirmarSalida(): Promise<boolean> {
  if (!solicitudes.editorSinGuardar) return Promise.resolve(true);
  const d = textos.editorCodigo.descartar;
  return new Promise((resolver) => {
    dialogo.warning({
      title: d.titulo,
      content: d.texto,
      positiveText: d.confirmar,
      negativeText: d.seguir,
      onPositiveClick: () => resolver(true),
      onNegativeClick: () => resolver(false),
      onClose: () => resolver(false),
      onMaskClick: () => resolver(false),
    });
  });
}

const visible = computed({
  get: () => abierta.value !== null,
  set: (v: boolean) => {
    if (v) return;
    void confirmarSalida().then((ok) => {
      if (ok) {
        abierta.value = null;
        herramienta.value = null;
      }
    });
  },
});

const pestanas = computed(() => (abierta.value ? pestanasDe(abierta.value) : []));
const ancha = computed(
  () => !!herramienta.value && HERRAMIENTAS_ANCHAS.includes(herramienta.value),
);
const esEditor = computed(() => herramienta.value === 'editor');

onBeforeRouteLeave(() => confirmarSalida());
</script>

<template>
  <div class="herramientas">
    <p class="descripcion">{{ t.descripcion }}</p>
    <NInput v-model:value="busqueda" clearable :placeholder="t.buscar" class="buscador">
      <template #prefix
        ><NIcon><Search /></NIcon
      ></template>
    </NInput>

    <template v-if="secciones.length">
      <section
        v-for="s in secciones"
        :key="s.id"
        class="seccion"
        :aria-labelledby="`herr-seccion-${s.id}`"
      >
        <h2 :id="`herr-seccion-${s.id}`">{{ t.secciones[s.id] }}</h2>
        <div class="rejilla">
          <button
            v-for="c in s.tarjetas"
            :key="c"
            type="button"
            class="tarjeta"
            :data-herramienta="c"
            :aria-label="`${t.abrir}: ${textoDe(c).nombre}`"
            @click="abrir(c)"
          >
            <span class="icono"
              ><NIcon :size="20"><component :is="iconos[c]" /></NIcon
            ></span>
            <span class="texto">
              <strong>{{ textoDe(c).nombre }}</strong>
              <span>{{ textoDe(c).descripcion }}</span>
            </span>
          </button>
        </div>
      </section>
    </template>
    <NEmpty v-else :description="t.sinResultados" class="vacio">
      <template #icon><IlustracionVacia :icono="Search" pequena /></template>
    </NEmpty>

    <NDrawer
      v-model:show="visible"
      :width="ancha ? 'min(1000px, 92vw)' : 'min(620px, 92vw)'"
      placement="right"
      :close-on-esc="!esEditor"
      :mask-closable="!esEditor"
    >
      <NDrawerContent v-if="abierta && herramienta" :title="textoDe(abierta).nombre" closable>
        <NTabs
          v-if="pestanas.length"
          v-model:value="herramienta"
          type="line"
          size="small"
          class="pestanas"
          :aria-label="textoDe(abierta).nombre"
        >
          <NTab v-for="p in pestanas" :key="p" :name="p">{{
            t.pestanas[p as keyof typeof t.pestanas]
          }}</NTab>
        </NTabs>
        <component :is="componentes[herramienta as Clave]" :key="herramienta" />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.descripcion {
  margin: 0 0 14px;
  opacity: 0.75;
}
.buscador {
  max-width: 420px;
  margin-bottom: 18px;
}
.seccion {
  margin-bottom: 22px;
}
.seccion h2 {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.75;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.pestanas {
  margin-bottom: 12px;
}
.tarjeta {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.045);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}
.tarjeta:hover,
.tarjeta:focus-visible {
  border-color: rgba(var(--acento-rgb), 0.55);
  background: rgba(var(--acento-rgb), 0.06);
}
.tarjeta:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}
.icono {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(var(--acento-rgb), 0.12);
  color: var(--texto-enlace);
  flex: none;
}
.texto {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.texto strong {
  font-size: 14px;
  font-weight: 600;
}
.texto span {
  font-size: 12.5px;
  opacity: 0.75;
}
.vacio {
  padding: 40px 0;
}
</style>

<style>
/* Piezas comunes de los paneles (el cajón se pinta fuera de la vista). */
.herr {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.herr-fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.herr-columnas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.herr-etiqueta {
  font-size: 12px;
  opacity: 0.75;
  margin-bottom: 4px;
}
.herr-mono,
.herr-mono textarea,
.herr-mono input {
  font-family: var(--fuente-mono) !important;
  font-size: 12.5px;
}
.herr-salida {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.06);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 360px;
  overflow: auto;
}
.herr-error {
  color: var(--texto-error);
  font-size: 12.5px;
  margin: 0;
}
.herr-ok {
  color: var(--texto-ok);
  font-size: 12.5px;
  margin: 0;
}
.herr-tenue {
  font-size: 12px;
  opacity: 0.75;
  margin: 0;
}
.herr-datos {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 14px;
  margin: 0;
  font-size: 13px;
}
.herr-datos dt {
  opacity: 0.72;
}
.herr-datos dd {
  margin: 0;
  font-family: var(--fuente-mono);
  word-break: break-all;
}
</style>

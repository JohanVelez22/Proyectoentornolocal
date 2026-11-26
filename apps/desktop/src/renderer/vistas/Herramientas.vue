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
  Wifi,
  Search,
  ShieldCheckmark,
  SwapVertical,
  Time,
  Pulse,
  Text,
  TrashBin,
} from '@vicons/ionicons5';
import { NDrawer, NDrawerContent, NEmpty, NIcon, NInput, useDialog } from 'naive-ui';
import { computed, defineAsyncComponent, ref, watch, type Component } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import IlustracionVacia from '../componentes/IlustracionVacia.vue';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';

const t = textos.herramientas;
type Clave = keyof typeof t.lista;

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
  limpiezaDisco: defineAsyncComponent(
    () => import('../componentes/herramientas/LimpiezaDisco.vue'),
  ),
  guiaTuneles: defineAsyncComponent(() => import('../componentes/herramientas/GuiaTuneles.vue')),
  guiaHttp: defineAsyncComponent(() => import('../componentes/herramientas/GuiaHttp.vue')),
  editor: defineAsyncComponent(() => import('../componentes/herramientas/EditorCodigo.vue')),
};

const iconos: Record<Clave, Component> = {
  qr: QrCode,
  json: CodeSlash,
  regex: Text,
  diff: GitCompare,
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
  qrWifi: Wifi,
  imagenes: Image,
  comprimir: Archive,
  conversor: DocumentAttach,
  captura: Camera,
  limpiezaDisco: TrashBin,
  guiaTuneles: Book,
  guiaHttp: Book,
  editor: Create,
};

/** Paneles que necesitan más ancho (dos columnas o tablas). */
const ANCHAS: Clave[] = [
  'diff',
  'puertos',
  'regex',
  'json',
  'markdown',
  'buscar',
  'contrasenas',
  'limpiezaDisco',
  'guiaTuneles',
  'guiaHttp',
  'editor',
];

const busqueda = ref('');
const abierta = ref<Clave | null>(null);

const normalizar = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const lista = computed(() => {
  const q = normalizar(busqueda.value.trim());
  return (Object.keys(t.lista) as Clave[]).filter((c) => {
    if (!q) return true;
    const h = t.lista[c];
    return normalizar(`${h.nombre} ${h.descripcion}`).includes(q);
  });
});

// Pedido de la paleta de comandos o de una alerta de Inicio (p. ej. 'puertos').
watch(
  () => solicitudes.herramienta,
  (c) => {
    if (!c) return;
    solicitudes.herramienta = null;
    if (c in componentes) abierta.value = c as Clave;
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
      if (ok) abierta.value = null;
    });
  },
});

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

    <div v-if="lista.length" class="rejilla">
      <button
        v-for="c in lista"
        :key="c"
        type="button"
        class="tarjeta"
        :data-herramienta="c"
        :aria-label="`${t.abrir}: ${t.lista[c].nombre}`"
        @click="abierta = c"
      >
        <span class="icono"
          ><NIcon :size="20"><component :is="iconos[c]" /></NIcon
        ></span>
        <span class="texto">
          <strong>{{ t.lista[c].nombre }}</strong>
          <span>{{ t.lista[c].descripcion }}</span>
        </span>
      </button>
    </div>
    <NEmpty v-else :description="t.sinResultados" class="vacio">
      <template #icon><IlustracionVacia :icono="Search" pequena /></template>
    </NEmpty>

    <NDrawer
      v-model:show="visible"
      :width="abierta && ANCHAS.includes(abierta) ? 'min(1000px, 92vw)' : 'min(620px, 92vw)'"
      placement="right"
      :close-on-esc="abierta !== 'editor'"
      :mask-closable="abierta !== 'editor'"
    >
      <NDrawerContent v-if="abierta" :title="t.lista[abierta].nombre" closable>
        <component :is="componentes[abierta]" />
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
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
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

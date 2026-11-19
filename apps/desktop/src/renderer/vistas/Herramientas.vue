<script setup lang="ts">
import {
  Brush,
  CodeSlash,
  Desktop,
  DocumentText,
  GitCompare,
  InformationCircle,
  Key,
  QrCode,
  Search,
  ShieldCheckmark,
  SwapVertical,
  Time,
  Pulse,
  Text,
} from '@vicons/ionicons5';
import { NDrawer, NDrawerContent, NEmpty, NIcon, NInput } from 'naive-ui';
import { computed, defineAsyncComponent, ref, watch, type Component } from 'vue';
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
};

/** Paneles que necesitan más ancho (dos columnas o tablas). */
const ANCHAS: Clave[] = ['diff', 'puertos', 'regex', 'json', 'markdown'];

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

const visible = computed({
  get: () => abierta.value !== null,
  set: (v: boolean) => {
    if (!v) abierta.value = null;
  },
});
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
  opacity: 0.65;
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
  outline: none;
}
.icono {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(var(--acento-rgb), 0.12);
  color: #6470e0;
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
  opacity: 0.65;
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
  opacity: 0.65;
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
  color: #dc2626;
  font-size: 12.5px;
  margin: 0;
}
.herr-ok {
  color: #16a34a;
  font-size: 12.5px;
  margin: 0;
}
.herr-tenue {
  font-size: 12px;
  opacity: 0.65;
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
  opacity: 0.6;
}
.herr-datos dd {
  margin: 0;
  font-family: var(--fuente-mono);
  word-break: break-all;
}
</style>

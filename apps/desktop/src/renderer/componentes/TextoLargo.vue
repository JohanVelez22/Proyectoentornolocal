<script setup lang="ts">
import { Copy } from '@vicons/ionicons5';
import { NButton, NIcon, NTooltip, useMessage } from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { api } from '../api';
import { textos } from '../i18n';
import { partirParaRecorte } from '../utilidades/recorte';

/**
 * Texto largo (ruta, nombre) recortado por el centro: se ve el final, que es lo que distingue. Si
 * se recorta, se puede leer entero con el ratón o con el teclado (foco → globo con el texto
 * completo, Esc lo cierra) y copiar con el botón. Un texto que cabe no añade paradas de Tab.
 */
const props = withDefaults(
  defineProps<{
    texto: string;
    /** Caracteres finales que siempre se ven. */
    cola?: number;
    /** Botón «Copiar el texto completo» (rutas sí; nombres no hace falta). */
    copiable?: boolean;
    mono?: boolean;
    /**
     * Recorta por el principio (se ve el final de la ruta, que es lo que distingue) con una sola
     * elipsis, en vez de por el centro (D54c).
     */
    porInicio?: boolean;
  }>(),
  { cola: 24, copiable: true, mono: false, porInicio: false },
);

const message = useMessage();
const partes = computed(() => partirParaRecorte(props.texto, props.cola));
const inicio = ref<HTMLElement | null>(null);
const recortado = ref(false);
const visible = ref(false);
let observador: ResizeObserver | null = null;

function medir(): void {
  const el = inicio.value;
  recortado.value = !!el && el.scrollWidth > el.clientWidth + 1;
  if (!recortado.value) visible.value = false;
}

onMounted(() => {
  medir();
  if (typeof ResizeObserver !== 'undefined' && inicio.value) {
    observador = new ResizeObserver(medir);
    observador.observe(inicio.value);
  }
});
// Otro texto puede caber o no: se vuelve a medir cuando el DOM ya lo muestra.
watch(
  () => props.texto,
  () => nextTick(medir),
);
onBeforeUnmount(() => observador?.disconnect());

function mostrar(): void {
  if (recortado.value) visible.value = true;
}

async function copiar(): Promise<void> {
  try {
    await api().sistema.copiar(props.texto);
    message.success(textos.acciones.copiado);
  } catch {
    message.error(textos.errores.desconocido);
  }
}
</script>

<template>
  <span class="texto-largo" :class="{ mono, 'por-inicio': porInicio }">
    <NTooltip :show="visible" trigger="manual" placement="top-start" :style="{ maxWidth: '520px' }">
      <template #trigger>
        <span
          class="cuerpo"
          :tabindex="recortado ? 0 : undefined"
          :role="recortado ? 'group' : undefined"
          :aria-label="recortado ? texto : undefined"
          @mouseenter="mostrar"
          @mouseleave="visible = false"
          @focus="mostrar"
          @blur="visible = false"
          @keydown.esc="visible = false"
        >
          <span
            v-if="porInicio"
            ref="inicio"
            class="inicio rtl"
            :aria-hidden="recortado ? 'true' : undefined"
            ><bdi>{{ texto }}</bdi></span
          ><span v-else ref="inicio" class="inicio" :aria-hidden="recortado ? 'true' : undefined">{{
            partes.inicio
          }}</span
          ><span
            v-if="partes.fin && !porInicio"
            class="fin"
            :aria-hidden="recortado ? 'true' : undefined"
            >{{ partes.fin }}</span
          >
        </span>
      </template>
      <span class="completo">{{ texto }}</span>
    </NTooltip>
    <NButton
      v-if="copiable"
      size="tiny"
      quaternary
      circle
      class="copiar"
      :aria-label="textos.acciones.copiarCompleto"
      :title="textos.acciones.copiarCompleto"
      @click="copiar"
    >
      <template #icon
        ><NIcon><Copy /></NIcon
      ></template>
    </NButton>
  </span>
</template>

<style scoped>
.texto-largo {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  max-width: 100%;
}
.mono {
  font-family: var(--fuente-mono);
}
.cuerpo {
  display: flex;
  min-width: 0;
  white-space: nowrap;
  border-radius: 4px;
}
.cuerpo:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}
.inicio {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Recorte por el principio: la elipsis va a la izquierda y el texto conserva su orden. */
.inicio.rtl {
  direction: rtl;
  text-align: left;
  flex: 1;
}
.por-inicio {
  gap: 8px;
}
.por-inicio .cuerpo {
  flex: 1;
}
.fin {
  flex-shrink: 0;
}
.copiar {
  flex-shrink: 0;
}
.completo {
  display: block;
  overflow-wrap: anywhere;
  user-select: text;
}
</style>

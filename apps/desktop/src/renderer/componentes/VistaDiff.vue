<script setup lang="ts">
import { computed } from 'vue';

/** Diff unificado del núcleo (`@@ …`, ` `, `-`, `+`) con colores por tipo de línea. */
const props = defineProps<{ diff: string }>();

/** Tope de líneas pintadas: un reemplazo completo de un archivo grande no traba la ventana. */
const MAX_LINEAS = 4000;

const lineas = computed(() =>
  props.diff
    .split('\n')
    .slice(0, MAX_LINEAS)
    .map((texto, i) => ({
      i,
      texto,
      tipo: texto.startsWith('@@')
        ? 'tramo'
        : texto.startsWith('+')
          ? 'mas'
          : texto.startsWith('-')
            ? 'menos'
            : 'igual',
    })),
);
const recortado = computed(() => props.diff.split('\n').length > MAX_LINEAS);
</script>

<template>
  <div class="vista-diff" role="region">
    <div v-for="l in lineas" :key="l.i" :class="['linea', l.tipo]">{{ l.texto || ' ' }}</div>
    <div v-if="recortado" class="linea tramo">…</div>
  </div>
</template>

<style scoped>
.vista-diff {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  max-height: 55vh;
  overflow: auto;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  padding: 6px 0;
}
.linea {
  white-space: pre;
  padding: 0 10px;
}
.mas {
  background: rgba(46, 160, 67, 0.16);
}
.menos {
  background: rgba(248, 81, 73, 0.16);
}
.tramo {
  opacity: 0.72;
}
</style>

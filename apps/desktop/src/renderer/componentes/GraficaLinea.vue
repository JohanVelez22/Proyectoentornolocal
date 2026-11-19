<script setup lang="ts">
import { computed } from 'vue';
import { MUESTRAS_VENTANA, trazoSerie } from '../utilidades/metricas';

/** Gráfica de líneas en SVG propio (sin librería): una o dos series sobre 5 minutos. */
const props = withDefaults(
  defineProps<{
    series: { valores: number[]; color: string }[];
    /** Máximo del eje; sin él, el mayor valor visible (con un mínimo de 1). */
    max?: number;
    etiqueta: string;
    alto?: number;
  }>(),
  { max: undefined, alto: 56 },
);

const ANCHO = 300;
const maximo = computed(() => {
  if (props.max !== undefined) return props.max;
  const mayor = Math.max(1, ...props.series.flatMap((s) => s.valores.filter(Number.isFinite)));
  return mayor * 1.15;
});
const trazos = computed(() =>
  props.series.map((s) => ({
    color: s.color,
    ...trazoSerie(s.valores, {
      ancho: ANCHO,
      alto: props.alto,
      max: maximo.value,
      ranuras: MUESTRAS_VENTANA,
    }),
  })),
);
</script>

<template>
  <svg
    class="grafica"
    :viewBox="`0 0 ${ANCHO} ${alto}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="etiqueta"
    :style="{ height: `${alto}px` }"
  >
    <line
      v-for="f in [0.25, 0.5, 0.75]"
      :key="f"
      class="guia"
      x1="0"
      :x2="ANCHO"
      :y1="alto * f"
      :y2="alto * f"
    />
    <template v-for="(t, i) in trazos" :key="i">
      <path v-if="t.area" :d="t.area" :fill="t.color" class="area" />
      <path v-if="t.linea" :d="t.linea" :stroke="t.color" class="linea" />
    </template>
  </svg>
</template>

<style scoped>
.grafica {
  display: block;
  width: 100%;
  overflow: visible;
}
.guia {
  stroke: currentColor;
  stroke-opacity: 0.08;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.area {
  fill-opacity: 0.14;
  stroke: none;
}
.linea {
  fill: none;
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
</style>

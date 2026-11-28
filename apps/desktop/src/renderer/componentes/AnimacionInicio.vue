<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  iniciarAnimacion,
  type ControlAnimacion,
  type FaseAnimacion,
  type ModoAnimacion,
} from '../utilidades/animacionInicio';

/**
 * Animación de inicio (D56): una capa encima de la app mientras carga. El logo (un lobo de
 * contorno, mitad piel y mitad circuito) se dibuja con un trazo de neón del color de acento, brilla
 * entero un instante y se desvanece. Todo es CSS (`stroke-dashoffset`, `transform` y `opacity`),
 * sin JS por fotograma; un solo filtro (`drop-shadow`) y la capa se quita del DOM al terminar.
 * No atrapa ni el foco ni el puntero (`pointer-events: none`, sin elementos enfocables) y se oculta
 * a los lectores de pantalla: es decoración. El padre la elimina al recibir `terminar`.
 */
const props = defineProps<{ modo: Exclude<ModoAnimacion, 'ninguna'> }>();
const emit = defineEmits<{ terminar: [] }>();

const fase = ref<FaseAnimacion>('animando');
let control: ControlAnimacion | null = null;

onMounted(() => {
  control = iniciarAnimacion({
    modo: props.modo,
    objetivo: window,
    alCambiar: (f) => {
      fase.value = f;
      if (f === 'terminada') emit('terminar');
    },
  });
});
onBeforeUnmount(() => control?.detener());

const saliendo = computed(() => fase.value === 'saliendo');

/** Trazos del logo, en el orden en que se dibujan. Todos con `pathLength="1"`. */
const TRAZOS: readonly { d?: string; c?: [number, number] }[] = [
  // Cabeza: orejas separadas e inclinadas hacia fuera, mandíbula ancha y hocico en V.
  {
    d: 'M100 214 L66 176 L54 150 L30 116 L34 14 L82 56 Q100 50 118 56 L166 14 L170 116 L146 150 L134 176 Z',
  },
  { d: 'M84 84 L100 74 L116 84' },
  { d: 'M100 74 V186' },
  { d: 'M64 106 L90 118' },
  { d: 'M136 106 L110 118' },
  { d: 'M86 186 L114 186 L100 204 Z' },
  { d: 'M60 120 L74 148' },
  { d: 'M72 114 L84 140' },
  { d: 'M108 132 H128 L142 144 V164' },
  { d: 'M112 100 H134 L146 88' },
  { d: 'M112 156 H134' },
  { c: [142, 168] },
  { c: [150, 84] },
  { c: [138, 156] },
];
</script>

<template>
  <div class="capa" :class="[props.modo, { saliendo }]" aria-hidden="true" data-animacion-inicio>
    <div class="halo" />
    <svg class="logo" viewBox="0 0 200 220" width="200" height="220" focusable="false">
      <g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round">
        <template v-for="(t, i) in TRAZOS" :key="i">
          <path v-if="t.d" class="trazo" :d="t.d" pathLength="1" :style="{ '--i': i }" />
          <circle
            v-else-if="t.c"
            class="trazo"
            :cx="t.c[0]"
            :cy="t.c[1]"
            r="3.5"
            pathLength="1"
            :style="{ '--i': i }"
          />
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.capa {
  --anim-fondo: #f4f5fa;
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: grid;
  place-items: center;
  background: var(--anim-fondo);
  color: var(--acento);
  pointer-events: none;
  /* Opaca hasta el 80 % (2 s) y luego se desvanece hacia la app: 2,5 s en total. */
  animation: fundido 2500ms linear forwards;
}
:root[data-tema='oscuro'] .capa {
  --anim-fondo: #0d0f16;
}
.halo {
  position: absolute;
  width: min(70vmin, 520px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(var(--acento-rgb), 0.45) 0%,
    rgba(var(--acento-rgb), 0) 68%
  );
  opacity: 0;
  animation: destello 2500ms ease-out forwards;
}
.logo {
  position: relative;
  width: min(24vmin, 200px);
  height: auto;
  overflow: visible;
  /* El único filtro: un resplandor suave del color de acento. */
  filter: drop-shadow(0 0 5px var(--acento));
  animation: respirar 2500ms ease-in-out forwards;
}
.trazo {
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  animation: dibujo 1100ms ease-out calc(150ms + var(--i) * 85ms) forwards;
}
.saliendo {
  animation: salir 150ms linear forwards;
}
.saliendo .halo,
.saliendo .logo {
  animation: none;
}
/* Movimiento reducido: el logo ya dibujado y un fundido corto, sin trazo ni destello. */
.reducida {
  animation: fundido-corto 250ms linear forwards;
}
.reducida .halo {
  animation: none;
}
.reducida .logo {
  animation: none;
}
.reducida .trazo {
  animation: none;
  stroke-dashoffset: 0;
}
@keyframes dibujo {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes destello {
  0% {
    opacity: 0;
  }
  62% {
    opacity: 0;
  }
  72% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
}
@keyframes respirar {
  0% {
    transform: scale(0.96);
  }
  66% {
    transform: scale(1);
  }
  72% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes fundido {
  0% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes fundido-corto {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes salir {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>

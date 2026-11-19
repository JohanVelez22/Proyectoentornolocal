<script setup lang="ts">
import { NIcon } from 'naive-ui';
import type { Component } from 'vue';

/**
 * Ilustración simple de los estados vacíos: dos tarjetas apiladas en el color de acento con el
 * icono de la pantalla encima. Decorativa (aria-hidden): el texto del estado vacío la explica.
 */
withDefaults(defineProps<{ icono: Component; pequena?: boolean }>(), { pequena: false });
</script>

<template>
  <span class="ilustracion" :class="{ pequena }" aria-hidden="true">
    <svg viewBox="0 0 120 96" class="fondo">
      <rect x="22" y="14" width="76" height="56" rx="12" class="atras" />
      <rect x="12" y="26" width="96" height="58" rx="14" class="frente" />
      <rect x="26" y="66" width="38" height="5" rx="2.5" class="linea" />
      <rect x="26" y="74" width="24" height="5" rx="2.5" class="linea suave" />
      <circle cx="98" cy="20" r="4" class="punto" />
      <circle cx="14" cy="16" r="2.5" class="punto suave" />
    </svg>
    <span class="icono">
      <NIcon :size="pequena ? 18 : 26"><component :is="icono" /></NIcon>
    </span>
  </span>
</template>

<style scoped>
.ilustracion {
  position: relative;
  display: inline-block;
  width: 120px;
  height: 96px;
  color: var(--acento);
}
.ilustracion.pequena {
  width: 80px;
  height: 64px;
}
.fondo {
  width: 100%;
  height: 100%;
}
.atras {
  fill: rgba(var(--acento-rgb), 0.08);
  stroke: rgba(var(--acento-rgb), 0.22);
  stroke-width: 1.5;
}
.frente {
  fill: rgba(var(--acento-rgb), 0.12);
  stroke: rgba(var(--acento-rgb), 0.35);
  stroke-width: 1.5;
}
.linea {
  fill: rgba(var(--acento-rgb), 0.35);
}
.suave {
  opacity: 0.55;
}
.punto {
  fill: rgba(var(--acento-rgb), 0.45);
}
.icono {
  position: absolute;
  left: 50%;
  top: 56%;
  transform: translate(-50%, -62%);
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--acento);
  color: #fff;
  box-shadow: 0 6px 16px rgba(var(--acento-rgb), 0.35);
}
.pequena .icono {
  width: 30px;
  height: 30px;
  border-radius: 9px;
}
</style>

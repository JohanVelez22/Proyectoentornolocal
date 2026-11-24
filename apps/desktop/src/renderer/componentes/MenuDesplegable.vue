<script setup lang="ts">
/**
 * Envoltorio de `NDropdown` que siempre abre el menú hacia abajo y sin volteo.
 * `alinearFin` lo alinea al borde derecho del disparador (`bottom-end`) para los botones
 * pegados al borde de una tarjeta; sigue abriendo hacia abajo.
 */
import { NDropdown } from 'naive-ui';

defineOptions({ inheritAttrs: false });

defineProps<{ alinearFin?: boolean }>();
</script>

<template>
  <NDropdown v-if="alinearFin" v-bind="$attrs" placement="bottom-end" :flip="false">
    <slot />
  </NDropdown>
  <NDropdown v-else v-bind="$attrs" placement="bottom-start" :flip="false">
    <slot />
  </NDropdown>
</template>

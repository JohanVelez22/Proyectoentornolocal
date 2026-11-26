<script setup lang="ts">
import { HardwareChip as IconoMemoria } from '@vicons/ionicons5';
import { NButton, NIcon } from 'naive-ui';
import { textos } from '../i18n';

/** Botón de la barra superior que abre el optimizador de memoria (D36). No hace nada solo. */
const emit = defineEmits<{ abrir: [] }>();
</script>

<template>
  <NButton
    size="small"
    secondary
    class="boton-memoria"
    :aria-label="textos.memoria.tituloBoton"
    :title="textos.memoria.tituloBoton"
    @click="emit('abrir')"
  >
    <template #icon
      ><NIcon><IconoMemoria /></NIcon
    ></template>
    {{ textos.memoria.boton }}
  </NButton>
</template>

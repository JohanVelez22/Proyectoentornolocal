<script setup lang="ts">
/**
 * Botón solo con ícono: la etiqueta es su nombre accesible (aria-label) y su tooltip, que se
 * muestra al pasar el mouse Y al llegar con el teclado (Tab), no solo con el mouse.
 */
import { NButton, NIcon, NTooltip } from 'naive-ui';
import { ref, type Component } from 'vue';

defineProps<{
  icono: Component;
  etiqueta: string;
  /** Texto del tooltip si debe decir más que la etiqueta (p. ej. la ruta o la base). */
  ayuda?: string;
  cargando?: boolean;
  deshabilitado?: boolean;
  /** Pegado a un botón a su derecha (control partido): sin las esquinas derechas. */
  pegado?: boolean;
}>();
const emit = defineEmits<{ click: [evento: MouseEvent] }>();

const encima = ref(false);
const foco = ref(false);
</script>

<template>
  <NTooltip trigger="manual" :show="encima || foco" placement="top">
    <template #trigger>
      <NButton
        size="small"
        secondary
        class="boton-icono"
        :class="{ pegado }"
        :aria-label="etiqueta"
        :loading="cargando"
        :disabled="deshabilitado"
        @mouseenter="encima = true"
        @mouseleave="encima = false"
        @focus="foco = true"
        @blur="foco = false"
        @click="(e: MouseEvent) => emit('click', e)"
      >
        <template #icon>
          <NIcon aria-hidden="true"><component :is="icono" /></NIcon>
        </template>
      </NButton>
    </template>
    <span class="ayuda">{{ ayuda ?? etiqueta }}</span>
  </NTooltip>
</template>

<style scoped>
.boton-icono {
  width: 30px;
  padding: 0;
}
.boton-icono.pegado {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.boton-icono:focus-visible {
  outline: 2px solid rgba(var(--acento-rgb), 0.6);
  outline-offset: 2px;
}
.ayuda {
  white-space: pre-line;
  max-width: 320px;
  display: inline-block;
  overflow-wrap: anywhere;
}
</style>

<script setup lang="ts">
import { ChevronDown } from '@vicons/ionicons5';
import { NAlert, NIcon } from 'naive-ui';
import { ref, useId } from 'vue';

/**
 * Aviso con título y cuerpo plegable (D54b C2): para los avisos largos que explican algo y no piden
 * una acción. Plegado muestra solo el título; el cuerpo se abre con clic o con teclado (el título es
 * un botón con `aria-expanded`). Por omisión está plegado.
 */
const props = withDefaults(
  defineProps<{
    titulo: string;
    tipo?: 'info' | 'warning' | 'error' | 'success';
    abierto?: boolean;
  }>(),
  { tipo: 'info', abierto: false },
);

const visible = ref(props.abierto);
const idCuerpo = `aviso-plegable-${useId()}`;
</script>

<template>
  <NAlert :type="tipo" :show-icon="false" :bordered="false" class="aviso-plegable">
    <button
      type="button"
      class="cabeza"
      :aria-expanded="visible"
      :aria-controls="idCuerpo"
      @click="visible = !visible"
    >
      <strong class="titulo">{{ titulo }}</strong>
      <NIcon class="chevron" :class="{ abierto: visible }" :size="16" aria-hidden="true"
        ><ChevronDown
      /></NIcon>
    </button>
    <div v-show="visible" :id="idCuerpo" class="cuerpo"><slot /></div>
  </NAlert>
</template>

<style scoped>
.cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 28px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.titulo {
  font-size: var(--wc-texto-md);
  font-weight: 600;
}
.chevron {
  flex: none;
  transition: transform var(--transicion) ease;
}
.chevron.abierto {
  transform: rotate(180deg);
}
.cuerpo {
  margin-top: 6px;
  font-size: var(--wc-texto-sm);
  line-height: 1.55;
}
@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>

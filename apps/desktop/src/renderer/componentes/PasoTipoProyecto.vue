<script setup lang="ts">
import { textos } from '../i18n';
import { TIPOS_PROYECTO } from '../utilidades/nuevoProyecto';
import type { TipoGenerador } from '../../shared/api';

/** Paso 1 del asistente: el tipo de proyecto, como una lista de opciones únicas. */
defineProps<{ tipo: TipoGenerador | null }>();
const emit = defineEmits<{ elegir: [tipo: TipoGenerador] }>();

const t = textos.nuevoProyecto;
</script>

<template>
  <div class="tipos" role="radiogroup" :aria-label="t.pasos.tipo">
    <button
      v-for="x in TIPOS_PROYECTO"
      :key="x.id"
      type="button"
      class="tipo"
      :class="{ activo: x.id === tipo }"
      role="radio"
      :aria-checked="x.id === tipo"
      @click="emit('elegir', x.id)"
    >
      <strong>{{ t.tipos[x.id].nombre }}</strong>
      <span>{{ t.tipos[x.id].descripcion }}</span>
    </button>
  </div>
</template>

<style scoped>
.tipos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
}
.tipo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  background: rgba(128, 128, 128, 0.045);
}
.tipo:hover {
  border-color: rgba(128, 128, 128, 0.5);
}
.tipo.activo {
  border-color: var(--texto-ok, #16a34a);
  box-shadow: 0 0 0 1px var(--texto-ok, #16a34a);
}
.tipo:focus-visible {
  outline: 2px solid var(--texto-ok, #16a34a);
  outline-offset: 2px;
}
.tipo strong {
  font-size: 13.5px;
}
.tipo span {
  font-size: 12px;
  opacity: 0.76;
}
</style>

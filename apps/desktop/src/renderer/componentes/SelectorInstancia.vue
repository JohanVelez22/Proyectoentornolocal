<script setup lang="ts">
import { NSelect } from 'naive-ui';
import { computed } from 'vue';
import type { EstadoInstancia, IdInstancia, MotorBd } from '../../shared/api';
import { textos } from '../i18n';
import { useBd } from '../stores/bd';

/**
 * Instancia del motor sobre la que actúan la lista y todos los diálogos de Bases de datos
 * (`MySQL 8.4 · 3306`, `MySQL 8.0 · 3308`). Se recuerda la última por motor.
 */
const props = defineProps<{ motor: MotorBd; nombre: string; instancias: EstadoInstancia[] }>();

const t = textos.versiones.selector;
const bd = useBd();

const opciones = computed(() =>
  props.instancias.map((i) => ({
    value: i.id,
    label: `${props.nombre} ${i.clave} · ${i.puerto}${i.predeterminada ? ` (${t.predeterminada})` : ''}${
      i.estado === 'encendido' ? '' : ` — ${t.apagada}`
    }`,
  })),
);

const valor = computed<IdInstancia | null>(() => {
  const o = bd.objetivo(props.motor);
  if (o !== props.motor) return o as IdInstancia;
  return props.instancias.find((i) => i.predeterminada)?.id ?? null;
});

function elegir(id: IdInstancia | null): void {
  const pred = props.instancias.find((i) => i.predeterminada)?.id ?? null;
  // Elegir la predeterminada es volver a "el motor" (sigue a la predeterminada si cambia).
  bd.elegirInstancia(props.motor, id === pred ? null : id);
}
</script>

<template>
  <div v-if="instancias.length > 1" class="selector">
    <span class="etiqueta">{{ t.etiqueta }}</span>
    <NSelect
      size="small"
      class="lista"
      :value="valor"
      :options="opciones"
      :aria-label="t.etiqueta"
      @update:value="elegir"
    />
  </div>
</template>

<style scoped>
.selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.etiqueta {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
}
.lista {
  max-width: 320px;
}
</style>

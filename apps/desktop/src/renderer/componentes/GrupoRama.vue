<script setup lang="ts">
import { NTag } from 'naive-ui';
import { computed } from 'vue';
import type { TablaVersiones } from '../../shared/api';
import { textos } from '../i18n';
import { conInterruptor, type FilaVersion as Fila } from '../stores/versiones';
import FilaVersion from './FilaVersion.vue';

/** Una rama en la pestaña "Versiones": cabecera con su soporte y fin de soporte, y sus filas. */
const props = defineProps<{
  tabla: TablaVersiones;
  rama: TablaVersiones['ramas'][number];
  resaltada: string | null;
  ocupada: boolean;
}>();
const emit = defineEmits<{
  instalar: [version: string];
  desinstalar: [version: string];
  encender: [version: string, valor: boolean];
  predeterminar: [version: string];
  actualizar: [fila: Fila];
  usar: [version: string];
  puerto: [fila: Fila, puerto: number];
  resolver: [fila: Fila];
}>();

const t = textos.versiones;

const tipoSoporte = computed(() => {
  switch (props.rama.soporte) {
    case 'lts':
      return 'success';
    case 'actual':
      return 'info';
    case 'preview':
      return 'warning';
    default:
      return 'default';
  }
});

const finTexto = computed(() => {
  const f = props.rama.finSoporte;
  if (!f) return null;
  return Date.parse(f) < Date.now() ? t.finSoportePasado(f) : t.finSoporte(f);
});

/** Instancia que ya usa otra versión de esta rama (servicios de datos). */
const instanciaDeRama = computed(
  () => props.rama.versiones.find((f) => f.instancia)?.instancia ?? null,
);
</script>

<template>
  <section class="rama" :aria-labelledby="`rama-${rama.rama}`">
    <header class="cabeza">
      <h3 :id="`rama-${rama.rama}`">{{ t.rama(rama.rama) }}</h3>
      <NTag v-if="rama.soporte" size="small" :bordered="false" :type="tipoSoporte">
        {{ t.soporte[rama.soporte] }}
      </NTag>
      <small v-if="finTexto">{{ finTexto }}</small>
    </header>
    <div role="table" :aria-label="t.rama(rama.rama)">
      <FilaVersion
        v-for="f in rama.versiones"
        :key="f.version"
        :fila="f"
        :interruptor="tabla.interruptor"
        :con-interruptor="conInterruptor(tabla, f)"
        :instancia-de-rama="tabla.interruptor === 'instancias' ? instanciaDeRama : null"
        :resaltada="resaltada === f.version"
        :ocupada="ocupada"
        @instalar="emit('instalar', f.version)"
        @desinstalar="emit('desinstalar', f.version)"
        @encender="(v) => emit('encender', f.version, v)"
        @predeterminar="emit('predeterminar', f.version)"
        @actualizar="emit('actualizar', f)"
        @usar="emit('usar', f.version)"
        @puerto="(p) => emit('puerto', f, p)"
        @resolver="emit('resolver', f)"
      />
    </div>
  </section>
</template>

<style scoped>
.rama {
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
}
.rama + .rama {
  margin-top: 12px;
}
.cabeza {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}
.cabeza h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.cabeza small {
  font-size: 12px;
  opacity: 0.6;
}
</style>

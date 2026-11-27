<script setup lang="ts">
import { NTag } from 'naive-ui';
import type { ResumenError } from '../../shared/api';
import { formatearFecha, textos } from '../i18n';

/** Errores agrupados: tipo, mensaje en una línea, archivo:línea, contador y última vez. */
defineProps<{
  lista: ResumenError[];
  elegida: string | null;
  nombreSitio: (id: string | null) => string;
}>();
const emit = defineEmits<{ elegir: [huella: string] }>();

const t = textos.depuracion;

/** Último tramo de la ruta (la completa va en el detalle). */
const nombreArchivo = (a: string): string => a.split(/[\\/]/).pop() ?? a;
</script>

<template>
  <ul class="lista-errores">
    <li
      v-for="e in lista"
      :key="e.huella"
      :class="{ elegido: e.huella === elegida }"
      tabindex="0"
      role="button"
      @click="emit('elegir', e.huella)"
      @keydown.enter="emit('elegir', e.huella)"
    >
      <div class="fila">
        <NTag size="small" :bordered="false" type="error">{{ e.tipo }}</NTag>
        <span class="veces">{{ t.veces(e.veces) }}</span>
        <span class="fecha">{{
          formatearFecha(e.ultima, { dateStyle: 'short', timeStyle: 'short' })
        }}</span>
      </div>
      <div class="mensaje">{{ e.mensaje }}</div>
      <div class="lugar">
        <span>{{ nombreSitio(e.sitioId) }}</span>
        <code v-if="e.archivo"
          >{{ nombreArchivo(e.archivo)
          }}<template v-if="e.linea !== null">:{{ e.linea }}</template></code
        >
      </div>
    </li>
  </ul>
</template>

<style scoped>
.lista-errores {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
li {
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
li:hover,
li:focus-visible {
  background: rgba(128, 128, 128, 0.1);
}
li.elegido {
  background: rgba(64, 128, 255, 0.14);
}
.fila {
  display: flex;
  align-items: center;
  gap: 8px;
}
.veces {
  font-size: 12px;
  font-weight: 600;
}
.fecha {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.76;
}
.mensaje {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lugar {
  display: flex;
  gap: 8px;
  font-size: 12px;
  opacity: 0.75;
  min-width: 0;
}
.lugar code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

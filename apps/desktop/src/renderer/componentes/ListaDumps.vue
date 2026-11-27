<script setup lang="ts">
import { NTag } from 'naive-ui';
import type { ResumenDump } from '../../shared/api';
import { formatearFecha, textos } from '../i18n';

/** Lista de volcados (lo más nuevo arriba). Todo se pinta como texto: nunca como HTML. */
defineProps<{
  lista: ResumenDump[];
  elegidoId: string | null;
  nombreSitio: (id: string | null) => string;
}>();
const emit = defineEmits<{ elegir: [id: string] }>();

const t = textos.depuracion;
const hora = (f: string): string =>
  formatearFecha(f, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const nombreArchivo = (a: string | null): string => (a ? (a.split(/[\\/]/).pop() ?? a) : '');
</script>

<template>
  <ul class="lista" role="listbox">
    <li
      v-for="d in lista"
      :key="d.id"
      role="option"
      tabindex="0"
      :aria-selected="d.id === elegidoId"
      :class="{ elegido: d.id === elegidoId }"
      @click="emit('elegir', d.id)"
      @keydown.enter="emit('elegir', d.id)"
    >
      <div class="fila">
        <span class="hora">{{ hora(d.fecha) }}</span>
        <NTag size="small" :bordered="false" :type="d.origen === 'php' ? 'info' : 'success'">
          {{ d.origen === 'php' ? t.php : t.python }}
        </NTag>
        <span class="sitio">{{ nombreSitio(d.sitioId) }}</span>
        <span v-if="d.archivo" class="lugar" :title="d.archivo">
          {{ nombreArchivo(d.archivo) }}<template v-if="d.linea !== null">:{{ d.linea }}</template>
        </span>
      </div>
      <code class="vista">{{ d.vista }}</code>
    </li>
  </ul>
</template>

<style scoped>
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}
li {
  padding: 8px 10px;
  border-bottom: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.2));
  cursor: pointer;
}
li:hover,
li:focus-visible {
  background: rgba(128, 128, 128, 0.08);
}
li:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: -2px;
}
li.elegido {
  background: rgba(128, 128, 128, 0.16);
}
.fila {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  min-width: 0;
}
.hora {
  opacity: 0.76;
  font-variant-numeric: tabular-nums;
}
.sitio {
  font-weight: 600;
}
.lugar {
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vista {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

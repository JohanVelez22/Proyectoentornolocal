<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { textos } from '../i18n';
import type { LineaRegistro } from '../stores/bd';

/** Registro en vivo de la salida de una herramienta (psql, pg_restore, mysql, winget, nmake…). */
const props = withDefaults(
  defineProps<{
    lineas: LineaRegistro[];
    /** Máximo que guarda el store: si se alcanza, se avisa que solo se ven las últimas. */
    limite: number;
    etiqueta?: string;
    alto?: number;
  }>(),
  { etiqueta: undefined, alto: 220 },
);

const t = textos.bd.progreso;
const caja = ref<HTMLElement | null>(null);
/** Si el usuario subió para leer, no se le mueve la vista. */
let pegadoAbajo = true;

function alDesplazar(): void {
  const el = caja.value;
  if (!el) return;
  pegadoAbajo = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
}

watch(
  () => props.lineas.at(-1)?.n,
  async () => {
    if (!pegadoAbajo) return;
    await nextTick();
    const el = caja.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
  { immediate: true },
);
</script>

<template>
  <div class="panel">
    <div
      ref="caja"
      class="registro"
      role="log"
      aria-live="polite"
      :aria-label="etiqueta ?? t.titulo"
      tabindex="0"
      :style="{ maxHeight: `${alto}px` }"
      @scroll="alDesplazar"
    >
      <div v-if="!lineas.length" class="vacio">{{ t.vacio }}</div>
      <div v-for="l in lineas" :key="l.n" class="linea">{{ l.texto }}</div>
    </div>
    <small v-if="lineas.length >= limite" class="nota">{{ t.limitado(limite) }}</small>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.registro {
  min-height: 72px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(15, 18, 30, 0.88);
  color: #d7dbe6;
  font-family: var(--fuente-mono);
  font-size: 12px;
  line-height: 1.55;
}
.registro:focus-visible {
  outline: 2px solid #5b67e6;
  outline-offset: 2px;
}
.linea {
  white-space: pre-wrap;
  word-break: break-word;
}
.vacio {
  opacity: 0.55;
}
.nota {
  font-size: 11.5px;
  opacity: 0.6;
}
</style>

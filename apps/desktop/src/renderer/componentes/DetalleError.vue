<script setup lang="ts">
import { CodeSlash } from '@vicons/ionicons5';
import { NButton, NIcon, NTag, NTooltip } from 'naive-ui';
import { computed } from 'vue';
import type { ErrorAgrupado } from '../../shared/api';
import { formatearFecha, textos } from '../i18n';

/**
 * Un error agrupado. Mensaje y traza van en elementos de texto con interpolación de Vue
 * (escapados): nada del registro se interpreta como HTML.
 */
const props = defineProps<{
  error: ErrorAgrupado;
  nombreSitio: (id: string | null) => string;
  abriendo: boolean;
}>();
const emit = defineEmits<{ abrir: [] }>();

const t = textos.depuracion;
const fecha = (f: string): string => formatearFecha(f, { dateStyle: 'short', timeStyle: 'medium' });

/** Solo se abre un archivo con línea de un sitio (el núcleo comprueba que esté dentro). */
const puedeAbrir = computed(
  () => props.error.sitioId !== null && props.error.archivo !== null && props.error.linea !== null,
);
</script>

<template>
  <article class="detalle-error">
    <header>
      <NTag size="small" :bordered="false" type="error">{{ error.tipo }}</NTag>
      <strong>{{ nombreSitio(error.sitioId) }}</strong>
      <span class="veces">{{ t.veces(error.veces) }}</span>
      <NTooltip :disabled="puedeAbrir">
        <template #trigger>
          <NButton
            size="small"
            secondary
            :disabled="!puedeAbrir"
            :loading="abriendo"
            @click="emit('abrir')"
          >
            <template #icon
              ><NIcon><CodeSlash /></NIcon
            ></template>
            {{ t.abrirEditor }}
          </NButton>
        </template>
        {{ t.abrirEditorSinSitio }}
      </NTooltip>
    </header>
    <p class="mensaje">{{ error.mensaje }}</p>
    <dl>
      <template v-if="error.archivo">
        <dt>{{ t.archivo }}</dt>
        <dd>
          <code
            >{{ error.archivo
            }}<template v-if="error.linea !== null">:{{ error.linea }}</template></code
          >
        </dd>
      </template>
      <dt>{{ t.primera }}</dt>
      <dd>{{ fecha(error.primera) }}</dd>
      <dt>{{ t.ultima }}</dt>
      <dd>{{ fecha(error.ultima) }}</dd>
      <dt>{{ t.fuente }}</dt>
      <dd>
        <code>{{ error.fuenteId }}</code>
      </dd>
    </dl>
    <h4>{{ t.traza }}</h4>
    <pre v-if="error.traza.length > 0" class="traza">{{ error.traza.join('\n') }}</pre>
    <p v-else class="sin-traza">{{ t.sinTraza }}</p>
  </article>
</template>

<style scoped>
.detalle-error {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
}
header {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.veces {
  font-size: 12px;
  margin-right: auto;
  opacity: 0.8;
}
.mensaje {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
}
dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 8px;
  margin: 0;
  font-size: 12px;
}
dt {
  opacity: 0.7;
}
dd {
  margin: 0;
  word-break: break-all;
}
h4 {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.8;
}
.traza {
  flex: 1;
  margin: 0;
  padding: 10px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.08);
  user-select: text;
}
.sin-traza {
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
}
</style>

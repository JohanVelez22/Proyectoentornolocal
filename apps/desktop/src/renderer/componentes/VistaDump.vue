<script setup lang="ts">
import { Copy } from '@vicons/ionicons5';
import { NButton, NIcon, NTag } from 'naive-ui';
import type { Dump } from '../../shared/api';
import { formatearFecha, textos } from '../i18n';

/**
 * Un volcado completo. El texto (VarDumper sin colores, print_r o pprint) va en un `<pre>` con
 * interpolación: Vue lo escapa y nada del contenido se interpreta ni se ejecuta.
 */
defineProps<{ dump: Dump; nombreSitio: (id: string | null) => string; copiando: boolean }>();
const emit = defineEmits<{ copiar: [] }>();

const t = textos.depuracion;
</script>

<template>
  <article class="vista-dump">
    <header>
      <NTag size="small" :bordered="false" :type="dump.origen === 'php' ? 'info' : 'success'">
        {{ dump.origen === 'php' ? t.php : t.python }}
      </NTag>
      <strong>{{ nombreSitio(dump.sitioId) }}</strong>
      <span class="fecha">{{
        formatearFecha(dump.fecha, { dateStyle: 'short', timeStyle: 'medium' })
      }}</span>
      <NButton size="small" secondary :loading="copiando" @click="emit('copiar')">
        <template #icon
          ><NIcon><Copy /></NIcon
        ></template>
        {{ t.copiar }}
      </NButton>
    </header>
    <dl>
      <template v-if="dump.archivo">
        <dt>{{ t.archivo }}</dt>
        <dd>
          <code
            >{{ dump.archivo
            }}<template v-if="dump.linea !== null">:{{ dump.linea }}</template></code
          >
        </dd>
      </template>
      <template v-if="dump.url">
        <dt>{{ t.url }}</dt>
        <dd>
          <code>{{ dump.url }}</code>
        </dd>
      </template>
    </dl>
    <pre class="texto">{{ dump.texto }}</pre>
  </article>
</template>

<style scoped>
.vista-dump {
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
.fecha {
  opacity: 0.76;
  font-size: 12px;
  margin-right: auto;
}
dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 8px;
  margin: 0;
  font-size: 12px;
}
dt {
  opacity: 0.76;
}
dd {
  margin: 0;
  word-break: break-all;
}
.texto {
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
</style>

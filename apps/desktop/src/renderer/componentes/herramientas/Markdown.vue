<script setup lang="ts">
import { NInput } from 'naive-ui';
import { computed, ref } from 'vue';
import { api } from '../../api';
import { textos } from '../../i18n';
import { renderizarMarkdown } from '../../utilidades/herramientas';

const t = textos.herramientas.markdown;
const texto = ref(t.ejemplo);

/** Sanitizado: markdown-it con html:false (el HTML crudo sale escapado) y enlaces filtrados. */
const html = computed(() => renderizarMarkdown(texto.value));

/** Los enlaces nunca navegan la ventana: http(s) se abre en el navegador del sistema. */
function alPulsar(e: MouseEvent): void {
  const a = (e.target as HTMLElement | null)?.closest('a');
  if (!a) return;
  e.preventDefault();
  const href = a.getAttribute('href') ?? '';
  if (/^https?:\/\//i.test(href))
    void api()
      .sistema.abrirUrl(href)
      .catch(() => undefined);
}
</script>

<template>
  <div class="herr">
    <p class="herr-tenue">{{ t.seguro }}</p>
    <div class="herr-columnas">
      <div>
        <div class="herr-etiqueta">{{ t.entrada }}</div>
        <NInput
          v-model:value="texto"
          type="textarea"
          class="herr-mono"
          :autosize="{ minRows: 18, maxRows: 30 }"
        />
      </div>
      <div>
        <div class="herr-etiqueta">{{ t.vista }}</div>
        <!-- eslint-disable-next-line vue/no-v-html -- salida de renderizarMarkdown (sanitizada) -->
        <article class="vista" @click="alPulsar" v-html="html"></article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vista {
  padding: 4px 14px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  min-height: 300px;
  max-height: 640px;
  overflow: auto;
  font-size: 14px;
  line-height: 1.55;
  word-break: break-word;
}
.vista :deep(pre),
.vista :deep(code) {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  background: rgba(128, 128, 128, 0.12);
  border-radius: 4px;
}
.vista :deep(pre) {
  padding: 8px 10px;
  overflow: auto;
}
.vista :deep(pre code) {
  background: none;
}
.vista :deep(code) {
  padding: 1px 4px;
}
.vista :deep(blockquote) {
  margin: 0;
  padding-left: 12px;
  border-left: 3px solid rgba(128, 128, 128, 0.35);
  opacity: 0.85;
}
.vista :deep(a) {
  color: #6470e0;
}
.vista :deep(table) {
  border-collapse: collapse;
}
.vista :deep(th),
.vista :deep(td) {
  border: 1px solid rgba(128, 128, 128, 0.3);
  padding: 4px 8px;
}
.vista :deep(img) {
  max-width: 100%;
}
</style>

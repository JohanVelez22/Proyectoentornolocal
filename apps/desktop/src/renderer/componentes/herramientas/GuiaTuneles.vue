<script setup lang="ts">
import { Copy } from '@vicons/ionicons5';
import { NButton, NIcon } from 'naive-ui';
import { computed } from 'vue';
import { api } from '../../api';
import { useCopiar } from '../../composables/useHerramienta';
import { idioma, textos } from '../../i18n';
import { guiaTuneles, partesGuia } from '../../utilidades/guias';
import { renderizarMarkdown } from '../../utilidades/herramientas';

/**
 * Guía de túneles (D42). El Markdown viene empaquetado con la app y se pinta con el mismo
 * renderizador sanitizado de la vista previa de Markdown (sin HTML crudo, sin imágenes, enlaces
 * filtrados). Los bloques de código son texto plano con botón de copiar.
 */
const t = textos.guias.tuneles;
const copiar = useCopiar();

const partes = computed(() =>
  partesGuia(guiaTuneles(idioma.value)).map((p) =>
    p.tipo === 'texto' ? { ...p, html: renderizarMarkdown(p.texto) } : { ...p, html: '' },
  ),
);

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
  <div class="guia" @click="alPulsar">
    <template v-for="(p, i) in partes" :key="`${idioma}-${i}`">
      <!-- eslint-disable-next-line vue/no-v-html -- salida de renderizarMarkdown (sanitizada) -->
      <div v-if="p.tipo === 'texto'" class="md" v-html="p.html"></div>
      <div v-else class="bloque">
        <pre><code>{{ p.texto }}</code></pre>
        <NButton
          size="tiny"
          quaternary
          class="copiar"
          :aria-label="t.copiar"
          :title="t.copiar"
          @click.stop="copiar(p.texto)"
        >
          <template #icon
            ><NIcon><Copy /></NIcon
          ></template>
        </NButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.guia {
  font-size: 14px;
  line-height: 1.55;
  word-break: break-word;
}
.md :deep(h1) {
  font-size: 20px;
}
.md :deep(h2) {
  font-size: 17px;
  margin-top: 1.4em;
}
.md :deep(h3) {
  font-size: 15px;
}
.md :deep(code) {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  background: rgba(128, 128, 128, 0.12);
  border-radius: 4px;
  padding: 1px 4px;
}
.md :deep(blockquote) {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 3px solid rgba(128, 128, 128, 0.35);
}
.md :deep(a) {
  color: var(--texto-enlace);
}
.md :deep(table) {
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
}
.md :deep(th),
.md :deep(td) {
  border: 1px solid rgba(128, 128, 128, 0.3);
  padding: 4px 8px;
  text-align: left;
}
.md :deep(hr) {
  border: 0;
  border-top: 1px solid rgba(128, 128, 128, 0.25);
}
.bloque {
  position: relative;
  margin: 8px 0;
}
.bloque pre {
  margin: 0;
  padding: 10px 44px 10px 12px;
  overflow: auto;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.bloque code {
  font-family: inherit;
  white-space: pre;
}
.copiar {
  position: absolute;
  top: 6px;
  right: 6px;
}
</style>

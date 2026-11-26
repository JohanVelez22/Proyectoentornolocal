<script setup lang="ts">
import { Add } from '@vicons/ionicons5';
import { NButton, NIcon } from 'naive-ui';
import type { SnippetNginx } from '../../shared/api';
import { textos } from '../i18n';

defineProps<{ snippets: SnippetNginx[]; deshabilitado?: boolean }>();
const emit = defineEmits<{ insertar: [texto: string] }>();

const t = textos.nginxEditor;

/** Título traducido del snippet (`nginxEditor.snippets.<id>`); el id si no hay texto. */
function titulo(s: SnippetNginx): string {
  const mapa = t.snippets as Record<string, string>;
  return mapa[s.id] ?? s.id;
}
</script>

<template>
  <div class="snippets" role="group" :aria-label="t.snippetsTitulo">
    <span class="titulo">{{ t.snippetsTitulo }}</span>
    <NButton
      v-for="s in snippets"
      :key="s.id"
      size="tiny"
      secondary
      :disabled="deshabilitado"
      :aria-label="t.insertar(titulo(s))"
      :title="s.texto"
      @click="emit('insertar', s.texto)"
    >
      <template #icon
        ><NIcon><Add /></NIcon
      ></template>
      {{ titulo(s) }}
    </NButton>
  </div>
</template>

<style scoped>
.snippets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.titulo {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.72;
  margin-right: 4px;
}
</style>

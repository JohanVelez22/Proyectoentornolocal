<script setup lang="ts">
import { Bulb } from '@vicons/ionicons5';
import { NButton, NIcon, NTag } from 'naive-ui';
import { textos } from '../i18n';
import { useProyectos } from '../stores/proyectos';
import { nombreDeCarpeta } from '../utilidades/sitios';

/** Banner con las carpetas nuevas de la carpeta vigilada que parecen un proyecto. */
const emit = defineEmits<{ preparar: [datos: { carpeta: string; remoto: string | null }] }>();

const t = textos.proyectos.sugerencias;
const proyectos = useProyectos();
</script>

<template>
  <section v-if="proyectos.sugerenciasPendientes.length" class="sugerencias" role="status">
    <div class="titulo">
      <NIcon :size="18" aria-hidden="true"><Bulb /></NIcon>
      <strong>{{ t.titulo(proyectos.sugerenciasPendientes.length) }}</strong>
    </div>
    <ul class="lista">
      <li v-for="s in proyectos.sugerenciasPendientes" :key="s.carpeta" class="item">
        <span class="nombre" :title="s.carpeta">{{ nombreDeCarpeta(s.carpeta) }}</span>
        <NTag size="tiny" :bordered="false">{{
          textos.sitios.tiposCortos[s.deteccion.tipo] ?? s.deteccion.tipo
        }}</NTag>
        <span class="ruta">{{ s.carpeta }}</span>
        <NButton
          size="tiny"
          type="primary"
          secondary
          @click="emit('preparar', { carpeta: s.carpeta, remoto: null })"
        >
          {{ t.montar }}
        </NButton>
        <NButton size="tiny" quaternary @click="proyectos.descartar(s.carpeta)">{{
          t.ignorar
        }}</NButton>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sugerencias {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(100, 112, 224, 0.35);
  background: rgba(100, 112, 224, 0.07);
}
.titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--texto-enlace);
}
.titulo strong {
  color: inherit;
}
.lista {
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  min-width: 0;
}
.nombre {
  font-weight: 600;
}
.ruta {
  flex: 1;
  min-width: 0;
  font-family: var(--fuente-mono);
  font-size: 11.5px;
  opacity: 0.55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

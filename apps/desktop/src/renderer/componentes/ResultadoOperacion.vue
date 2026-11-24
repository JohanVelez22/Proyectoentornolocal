<script setup lang="ts">
import { CheckmarkCircle, CloseCircle, FolderOpen, Warning } from '@vicons/ionicons5';
import { NButton, NCollapse, NCollapseItem, NIcon } from 'naive-ui';
import { computed } from 'vue';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import type { OperacionBd } from '../stores/bd';
import { carpetaDe } from '../utilidades/bd';

/** Resultado de restaurar, importar o respaldar: archivo, copia previa, advertencias o error. */
const props = defineProps<{ operacion: OperacionBd }>();

const t = textos.bd.resultado;
const { ejecutar } = useAccion();

const titulo = computed(() => {
  const o = props.operacion;
  if (o.estado === 'error') return o.trasReemplazo ? t.trasReemplazo : t.fallo[o.tipo];
  if (o.tipo === 'respaldar') return t.respaldada(o.base);
  return o.tipo === 'importar' ? t.importada(o.base) : t.restaurada(o.base);
});
const advertencias = computed(() => props.operacion.resultado?.advertencias ?? []);
/** Copia de seguridad hecha antes de reemplazar: tras un éxito o en el error tras reemplazo. */
const respaldoPrevio = computed(
  () => props.operacion.resultado?.respaldoPrevio ?? props.operacion.respaldoPrevio ?? null,
);

function abrirCarpeta(ruta: string): void {
  void ejecutar('carpeta', () => api().sistema.abrirCarpeta(carpetaDe(ruta)));
}
</script>

<template>
  <div
    class="resultado"
    :class="{ error: operacion.estado === 'error', grave: operacion.trasReemplazo }"
    :role="operacion.estado === 'error' ? 'alert' : 'status'"
  >
    <div class="cabeza">
      <NIcon :size="20">
        <CloseCircle v-if="operacion.estado === 'error'" />
        <CheckmarkCircle v-else />
      </NIcon>
      <strong>{{ titulo }}</strong>
    </div>

    <p v-if="operacion.error" class="mensaje">{{ operacion.error }}</p>
    <p v-if="operacion.trasReemplazo" class="ayuda">{{ t.trasReemplazoAyuda }}</p>

    <div v-if="operacion.archivo" class="ruta">
      <span class="etiqueta">{{ t.archivo }}</span>
      <code>{{ operacion.archivo }}</code>
      <NButton size="tiny" secondary @click="abrirCarpeta(operacion.archivo)">
        <template #icon
          ><NIcon><FolderOpen /></NIcon
        ></template>
        {{ textos.acciones.abrirCarpeta }}
      </NButton>
    </div>

    <div v-if="respaldoPrevio" class="ruta">
      <span class="etiqueta">{{ t.respaldoPrevio }}</span>
      <code>{{ respaldoPrevio }}</code>
      <NButton size="tiny" secondary @click="abrirCarpeta(respaldoPrevio)">
        <template #icon
          ><NIcon><FolderOpen /></NIcon
        ></template>
        {{ textos.acciones.abrirCarpeta }}
      </NButton>
    </div>

    <NCollapse v-if="advertencias.length" class="advertencias">
      <NCollapseItem name="avisos">
        <template #header>
          <span class="avisos-titulo">
            <NIcon :size="16"><Warning /></NIcon>
            {{ t.advertencias(advertencias.length) }}
          </span>
        </template>
        <p class="ayuda">{{ t.advertenciasAyuda }}</p>
        <ul>
          <li v-for="(a, i) in advertencias" :key="i">{{ a }}</li>
        </ul>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<style scoped>
.resultado {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(22, 163, 74, 0.4);
  background: rgba(22, 163, 74, 0.07);
  font-size: 13px;
}
.resultado.error {
  border-color: rgba(220, 38, 38, 0.45);
  background: rgba(220, 38, 38, 0.07);
}
.resultado.grave {
  border-width: 2px;
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--texto-ok);
}
.error .cabeza {
  color: var(--texto-error);
}
.cabeza strong {
  font-size: 14px;
}
.mensaje {
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.grave .mensaje {
  font-weight: 600;
}
.ayuda {
  margin: 0;
  font-size: 12.5px;
  opacity: 0.75;
}
.ruta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
}
.etiqueta {
  font-size: 12px;
  opacity: 0.7;
  width: 100%;
}
.ruta code {
  font-family: var(--fuente-mono);
  font-size: 12px;
  word-break: break-all;
  flex: 1;
  min-width: 0;
}
.avisos-titulo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--texto-aviso);
}
.advertencias ul {
  margin: 8px 0 0;
  padding-left: 18px;
  max-height: 180px;
  overflow: auto;
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.advertencias li + li {
  margin-top: 4px;
}
</style>

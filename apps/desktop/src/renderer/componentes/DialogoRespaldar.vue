<script setup lang="ts">
import { Folder } from '@vicons/ionicons5';
import { NButton, NIcon, NModal, NSpin } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { MotorSql } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { LIMITE_LINEAS, useBd } from '../stores/bd';
import PanelProgreso from './PanelProgreso.vue';
import ResultadoOperacion from './ResultadoOperacion.vue';

/** Respalda una base en la carpeta por defecto o en una elegida con el diálogo de Windows. */
const props = defineProps<{ motor: MotorSql; base: string }>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.bd.dialogoRespaldar;
const bd = useBd();
const { ejecutar, ocupado } = useAccion();

const carpeta = ref<string | null>(null);
const lanzado = ref(false);

const corriendo = computed(() => lanzado.value && bd.enCurso);
const operacion = computed(() => (lanzado.value ? bd.operacion : null));

watch(mostrar, (v) => {
  if (!v) return;
  void bd.cargarCarpetaRespaldos();
  carpeta.value = null;
  lanzado.value = false;
});

async function elegirCarpeta(): Promise<void> {
  const c = await ejecutar('elegir', () => api().sistema.elegirCarpeta());
  if (c) carpeta.value = c;
}

async function respaldar(): Promise<void> {
  if (bd.enCurso) return;
  lanzado.value = true;
  await bd.respaldar(props.motor, props.base, carpeta.value);
}

function alCambiar(v: boolean): void {
  if (!v) cerrar();
}

function cerrar(): void {
  if (corriendo.value) return;
  if (lanzado.value) bd.descartarOperacion();
  mostrar.value = false;
}
</script>

<template>
  <NModal
    :show="mostrar"
    preset="card"
    :title="t.titulo(base)"
    size="small"
    :bordered="false"
    :style="{ width: '520px', maxWidth: 'calc(100vw - 32px)' }"
    :closable="!corriendo"
    :mask-closable="!corriendo"
    :close-on-esc="!corriendo"
    @update:show="alCambiar"
  >
    <template v-if="!lanzado">
      <p class="formato">{{ t.formato[motor] }}</p>
      <div class="destino">
        <span class="etiqueta">{{ t.destino }}</span>
        <div class="ruta">
          <NIcon :size="18"><Folder /></NIcon>
          <code>{{
            carpeta ?? (bd.carpetaRespaldos ? t.porDefectoEn(bd.carpetaRespaldos) : t.porDefecto)
          }}</code>
        </div>
        <div class="botones">
          <NButton size="small" :loading="ocupado('elegir')" @click="elegirCarpeta">
            {{ t.cambiar }}
          </NButton>
          <NButton v-if="carpeta" size="small" quaternary @click="carpeta = null">
            {{ t.porDefectoVolver }}
          </NButton>
        </div>
      </div>
    </template>
    <div v-else class="operacion">
      <p v-if="corriendo" class="corriendo">
        <NSpin :size="16" />
        <span>{{ textos.bd.progreso.corriendo.respaldar?.(base) }}</span>
      </p>
      <PanelProgreso :lineas="bd.lineas" :limite="LIMITE_LINEAS" :alto="160" />
      <ResultadoOperacion
        v-if="operacion && operacion.estado !== 'corriendo'"
        :operacion="operacion"
      />
    </div>
    <template #action>
      <div class="acciones">
        <template v-if="!lanzado">
          <NButton size="small" @click="cerrar">{{ textos.acciones.cancelar }}</NButton>
          <NButton size="small" type="primary" :disabled="bd.enCurso" @click="respaldar">
            {{ t.boton }}
          </NButton>
        </template>
        <NButton v-else size="small" type="primary" :disabled="corriendo" @click="cerrar">
          {{ textos.acciones.cerrar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.formato {
  margin: 0 0 14px;
  font-size: 12.5px;
  opacity: 0.7;
}
.destino {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.etiqueta {
  font-size: 12px;
  opacity: 0.65;
}
.ruta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
}
.ruta .n-icon {
  opacity: 0.6;
  flex: none;
}
.ruta code {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  word-break: break-all;
}
.botones {
  display: flex;
  gap: 8px;
}
.operacion {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.corriendo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 600;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

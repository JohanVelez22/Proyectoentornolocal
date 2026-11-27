<script setup lang="ts">
import { Warning } from '@vicons/ionicons5';
import { NAlert, NButton, NCheckbox, NIcon, NModal } from 'naive-ui';
import { ref, watch } from 'vue';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useVersiones } from '../stores/versiones';

/**
 * Instalar una versión sin huella fuerte: explica el riesgo, ofrece la versión verificada de la
 * misma rama si la hay y solo continúa con la casilla marcada (el único camino que manda
 * `confirmarSinHuella: true`).
 */
const props = defineProps<{ nombre: string; version: string; alternativa: string | null }>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.versiones.dialogoSinHuella;
const versiones = useVersiones();
const { ejecutar, ocupado } = useAccion();
const entiendo = ref(false);

watch(mostrar, (v) => {
  if (v) entiendo.value = false;
});

async function instalar(version: string, sinHuella: boolean): Promise<void> {
  if (sinHuella && !entiendo.value) return;
  const ok = await ejecutar(
    'instalar',
    async () => {
      await versiones.instalar(version, sinHuella);
      return true;
    },
    { exito: textos.versiones.instalada(`${props.nombre} ${version}`) },
  );
  if (ok) mostrar.value = false;
}
</script>

<template>
  <NModal
    :show="mostrar"
    preset="card"
    :title="t.titulo(`${nombre} ${version}`)"
    size="small"
    :bordered="false"
    :style="{ width: '540px', maxWidth: 'calc(100vw - 32px)' }"
    @update:show="(v: boolean) => (mostrar = v)"
  >
    <NAlert type="warning" :bordered="false">
      <template #icon
        ><NIcon><Warning /></NIcon
      ></template>
      {{ t.riesgo }}
    </NAlert>
    <p class="texto">{{ t.explicacion }}</p>
    <p v-if="alternativa" class="texto">{{ t.alternativa(`${nombre} ${alternativa}`) }}</p>
    <NCheckbox v-model:checked="entiendo" class="casilla">{{ t.casilla }}</NCheckbox>
    <template #footer>
      <div class="pie">
        <NButton size="small" :disabled="ocupado('instalar')" @click="mostrar = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton
          v-if="alternativa"
          size="small"
          type="primary"
          :loading="ocupado('instalar')"
          @click="instalar(alternativa, false)"
        >
          {{ t.instalarVerificada(alternativa) }}
        </NButton>
        <NButton
          size="small"
          type="warning"
          :disabled="!entiendo"
          :loading="ocupado('instalar')"
          @click="instalar(version, true)"
        >
          {{ t.instalarIgual }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.texto {
  margin: 12px 0 0;
  line-height: 1.5;
}
.casilla {
  margin-top: 14px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

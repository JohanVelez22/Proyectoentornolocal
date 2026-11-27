<script setup lang="ts">
import { FolderOpen, Refresh } from '@vicons/ionicons5';
import { NButton, NEmpty, NIcon, NModal, NSpin, type SelectOption } from 'naive-ui';
import Desplegable from './Desplegable.vue';
import { computed, ref, watch } from 'vue';
import type { FuenteRegistroPublica, Sitio } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import PanelProgreso from './PanelProgreso.vue';

/**
 * Registros de un proyecto (Nginx del sitio, laravel.log, procesos y túnel), por id de fuente:
 * la interfaz nunca conoce las rutas. El visor unificado llega en la Task 13.
 */
const props = defineProps<{ sitio: Sitio | null }>();
const emit = defineEmits<{ cerrar: [] }>();

const t = textos.proyectos.registros;
const { ejecutar, ocupado } = useAccion();

const fuentes = ref<FuenteRegistroPublica[]>([]);
const fuente = ref<string | null>(null);
const lineas = ref<string[]>([]);
const cargando = ref(false);

const opciones = computed<SelectOption[]>(() =>
  fuentes.value.map((f) => ({ value: f.id, label: f.nombre })),
);
const lineasPanel = computed(() => lineas.value.map((texto, n) => ({ n, texto })));

watch(
  () => props.sitio,
  async (s) => {
    fuentes.value = [];
    fuente.value = null;
    lineas.value = [];
    if (!s) return;
    cargando.value = true;
    try {
      const todas = (await ejecutar('fuentes', () => api().registros.fuentes())) ?? [];
      fuentes.value = todas.filter((f) => f.sitioId === s.id || f.id.startsWith(`proy-${s.id}-`));
      fuente.value = fuentes.value[0]?.id ?? null;
    } finally {
      cargando.value = false;
    }
  },
  { immediate: true },
);

async function leer(): Promise<void> {
  const f = fuente.value;
  lineas.value = [];
  if (!f) return;
  lineas.value = (await ejecutar('leer', () => api().registros.leerFinal(f, 500))) ?? [];
}
watch(fuente, () => void leer());

function abrirCarpeta(): void {
  const f = fuente.value;
  if (f) void ejecutar('carpeta', () => api().registros.abrirCarpeta(f));
}
</script>

<template>
  <NModal
    :show="sitio !== null"
    preset="card"
    :title="t.titulo(sitio?.nombre || sitio?.dominio || '')"
    :style="{ width: '760px', maxWidth: 'calc(100vw - 32px)' }"
    :auto-focus="false"
    @update:show="(v: boolean) => !v && emit('cerrar')"
  >
    <NSpin :show="cargando">
      <NEmpty v-if="!cargando && !fuentes.length" :description="t.ninguna" class="vacio" />
      <div v-else class="visor">
        <div class="barra">
          <Desplegable
            v-model:value="fuente"
            size="small"
            :options="opciones"
            :aria-label="t.fuente"
            class="selector"
          />
          <NButton size="small" quaternary :loading="ocupado('leer')" @click="leer">
            <template #icon
              ><NIcon><Refresh /></NIcon
            ></template>
            {{ t.actualizar }}
          </NButton>
          <NButton size="small" quaternary :disabled="!fuente" @click="abrirCarpeta">
            <template #icon
              ><NIcon><FolderOpen /></NIcon
            ></template>
            {{ t.abrirCarpeta }}
          </NButton>
        </div>
        <PanelProgreso :lineas="lineasPanel" :limite="500" :alto="360" />
      </div>
    </NSpin>
  </NModal>
</template>

<style scoped>
.vacio {
  padding: 24px 0;
}
.visor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.barra {
  display: flex;
  align-items: center;
  gap: 8px;
}
.selector {
  flex: 1;
}
</style>

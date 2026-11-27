<script setup lang="ts">
import { NAlert, NButton, NPopconfirm } from 'naive-ui';
import { computed, ref } from 'vue';
import type { ResultadoBom } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';

const t = textos.herramientas.bom;
const { ejecutar, ocupado } = useAccion();

const rutas = ref<string[]>([]);
const analisis = ref<ResultadoBom[] | null>(null);
const limpieza = ref<ResultadoBom[] | null>(null);

const conBom = computed(() => analisis.value?.filter((r) => r.teniaBom && !r.error) ?? []);
const conError = computed(() => analisis.value?.filter((r) => r.error) ?? []);

function nuevaSeleccion(r: string[]): void {
  rutas.value = r;
  analisis.value = null;
  limpieza.value = null;
}

async function elegirArchivos(): Promise<void> {
  const r = await ejecutar('elegir', () => api().sistema.elegirArchivos());
  if (r?.length) nuevaSeleccion(r);
}

async function elegirCarpeta(): Promise<void> {
  const r = await ejecutar('elegir', () => api().sistema.elegirCarpeta());
  if (r) nuevaSeleccion([r]);
}

async function analizar(): Promise<void> {
  limpieza.value = null;
  const r = await ejecutar('analizar', () => api().herramientas.limpiarBom([...rutas.value], true));
  if (r) analisis.value = r;
}

/**
 * Las mismas rutas elegidas en el diálogo (el núcleo solo acepta esas); el núcleo hace la copia de
 * cada archivo con BOM.
 */
async function limpiar(): Promise<void> {
  if (!conBom.value.length) return;
  const r = await ejecutar('limpiar', () => api().herramientas.limpiarBom([...rutas.value], false));
  if (!r) return;
  limpieza.value = r;
  analisis.value = null;
}

const limpiezaVisible = (l: ResultadoBom[]): ResultadoBom[] =>
  l.filter((r) => r.teniaBom || r.error);
const limpiados = computed(() => limpieza.value?.filter((r) => r.teniaBom && !r.error) ?? []);
</script>

<template>
  <div class="herr">
    <NAlert type="info" :show-icon="false">{{ t.explicacion }}</NAlert>
    <div class="herr-fila">
      <NButton secondary :loading="ocupado('elegir')" @click="elegirArchivos">{{
        t.elegirArchivos
      }}</NButton>
      <NButton secondary :loading="ocupado('elegir')" @click="elegirCarpeta">{{
        t.elegirCarpeta
      }}</NButton>
      <span v-if="rutas.length" class="herr-tenue" :title="rutas.join('\n')">{{
        t.seleccion(rutas.length)
      }}</span>
    </div>
    <div class="herr-fila">
      <NButton
        type="primary"
        :disabled="!rutas.length"
        :loading="ocupado('analizar')"
        @click="analizar"
        >{{ t.analizar }}</NButton
      >
      <NPopconfirm v-if="conBom.length" @positive-click="limpiar">
        <template #trigger>
          <NButton type="warning" :loading="ocupado('limpiar')">{{ t.limpiar }}</NButton>
        </template>
        {{ t.confirmar(conBom.length) }}
      </NPopconfirm>
    </div>

    <template v-if="analisis">
      <p class="herr-tenue">{{ conBom.length ? t.conBom(conBom.length) : t.sinBom }}</p>
      <ul class="lista">
        <li v-for="r in conBom" :key="r.archivo">{{ r.archivo }}</li>
        <li v-for="r in conError" :key="`e-${r.archivo}`" class="herr-error">
          {{ r.archivo }} — {{ r.error }}
        </li>
      </ul>
    </template>

    <template v-if="limpieza">
      <p class="herr-ok">{{ t.limpiados(limpiados.length) }}</p>
      <ul class="lista">
        <li
          v-for="r in limpiezaVisible(limpieza)"
          :key="r.archivo"
          :class="{ 'herr-error': r.error }"
        >
          {{ r.archivo }}
          <template v-if="r.error"> — {{ r.error }}</template>
          <span v-else-if="r.copia" class="herr-tenue"> ({{ t.copia }}: {{ r.copia }})</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.lista {
  margin: 0;
  padding-left: 18px;
  font-family: var(--fuente-mono);
  font-size: 12px;
  max-height: 360px;
  overflow: auto;
  word-break: break-all;
}
</style>

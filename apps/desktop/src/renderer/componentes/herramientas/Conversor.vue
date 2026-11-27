<script setup lang="ts">
import { nombreDeRuta } from '@pel/core';
import { NAlert, NButton, NRadioButton, NRadioGroup } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { Conversion, Formato } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { formatoBytes } from '../../utilidades/metricas';

const t = textos.herramientas.conversor;
const { ejecutar, ocupado } = useAccion();

const conversiones = ref<Conversion[]>([]);
const libreOffice = ref(false);
// La ruta sale del diálogo "Abrir": el núcleo solo acepta esa.
const origen = ref<string | null>(null);
const de = ref<Formato | null>(null);
const a = ref<Formato | null>(null);
const resultado = ref<{ destino: string; bytes: number } | null>(null);
const tipoNoSoportado = ref(false);

const nombreDe = (ruta: string): string => nombreDeRuta(ruta) || ruta;

const destinos = computed(() => conversiones.value.filter((c) => c.de === de.value));
const motor = computed(() => destinos.value.find((c) => c.a === a.value)?.motor ?? null);

onMounted(async () => {
  const r = await ejecutar('listar', () => api().herramientas.conversionesDocumento());
  if (r) {
    conversiones.value = r.conversiones;
    libreOffice.value = r.libreOffice;
  }
});

async function elegir(): Promise<void> {
  const ruta = await ejecutar('elegir', () => api().sistema.elegirArchivo());
  if (!ruta) return;
  origen.value = ruta;
  resultado.value = null;
  const ext = ruta.split('.').pop()?.toLowerCase() ?? '';
  de.value = null;
  a.value = null;
  tipoNoSoportado.value = false;
  const posibles = conversiones.value.filter((c) => c.de === ext);
  if (posibles.length === 0) {
    tipoNoSoportado.value = true;
    return;
  }
  de.value = ext as Formato;
  a.value = posibles[0]!.a;
}

async function convertir(): Promise<void> {
  const o = origen.value;
  const destinoFormato = a.value;
  if (!o || !destinoFormato) return;
  resultado.value = null;
  const base = nombreDe(o).replace(/\.[^.]+$/, '');
  const destino = await ejecutar('convertir', () =>
    api().sistema.guardarArchivo(`${base}.${destinoFormato}`),
  );
  if (!destino) return;
  const r = await ejecutar('convertir', () =>
    api().herramientas.convertirDocumento(o, destinoFormato, destino),
  );
  if (r) resultado.value = r;
}
</script>

<template>
  <div class="herr">
    <p class="herr-tenue">{{ t.ayuda }}</p>
    <div class="herr-fila">
      <NButton secondary :loading="ocupado('elegir')" @click="elegir">{{ t.elegir }}</NButton>
      <span v-if="origen" class="herr-tenue" :title="origen">{{ nombreDe(origen) }}</span>
    </div>
    <NAlert v-if="tipoNoSoportado" type="warning" :show-icon="false">{{
      t.tipoNoSoportado
    }}</NAlert>
    <template v-if="de && destinos.length">
      <div class="herr-fila">
        <span>{{ t.convertirA }}</span>
        <NRadioGroup v-model:value="a" @update:value="resultado = null">
          <NRadioButton v-for="c in destinos" :key="c.a" :value="c.a">.{{ c.a }}</NRadioButton>
        </NRadioGroup>
      </div>
      <NAlert v-if="motor === 'libreoffice'" type="info" :show-icon="false">{{
        t.avisoLibreOffice
      }}</NAlert>
      <div class="herr-fila">
        <NButton type="primary" :disabled="!a" :loading="ocupado('convertir')" @click="convertir">
          {{ ocupado('convertir') ? t.convirtiendo : t.convertir }}
        </NButton>
      </div>
    </template>
    <template v-if="resultado">
      <p class="herr-ok">{{ t.guardado(resultado.destino) }}</p>
      <p class="herr-tenue">{{ formatoBytes(resultado.bytes) }}</p>
    </template>
    <p v-if="!libreOffice" class="herr-tenue">{{ t.sinLibreOffice }}</p>
    <p class="herr-tenue">{{ t.limites }}</p>
  </div>
</template>

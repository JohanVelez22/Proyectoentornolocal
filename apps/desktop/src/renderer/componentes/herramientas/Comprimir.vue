<script setup lang="ts">
import { NAlert, NButton } from 'naive-ui';
import { ref } from 'vue';
import type { ResultadoPdf, ResultadoZip } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { porcentajeAhorro } from '../../utilidades/imagenCanvas';
import { formatoBytes } from '../../utilidades/metricas';

const t = textos.herramientas.comprimir;
const { ejecutar, ocupado } = useAccion();

// Rutas que salen de los diálogos: el núcleo solo acepta esas.
const origenes = ref<string[]>([]);
const zip = ref<ResultadoZip | null>(null);
const pdfOrigen = ref<string | null>(null);
const pdf = ref<ResultadoPdf | null>(null);

const nombreDe = (ruta: string): string => ruta.split(/[\\/]/).filter(Boolean).pop() ?? ruta;

function agregar(rutas: string[]): void {
  zip.value = null;
  for (const r of rutas) if (!origenes.value.includes(r)) origenes.value.push(r);
}

async function agregarArchivos(): Promise<void> {
  const r = await ejecutar('elegir', () => api().sistema.elegirArchivos());
  if (r?.length) agregar(r);
}

async function agregarCarpeta(): Promise<void> {
  const r = await ejecutar('elegir', () => api().sistema.elegirCarpeta());
  if (r) agregar([r]);
}

function quitar(ruta: string): void {
  origenes.value = origenes.value.filter((x) => x !== ruta);
  zip.value = null;
}

async function crearZip(): Promise<void> {
  zip.value = null;
  const primero = origenes.value[0];
  if (!primero) return;
  const sugerido = origenes.value.length === 1 ? `${nombreDe(primero)}.zip` : 'archivos.zip';
  const destino = await ejecutar('zip', () => api().sistema.guardarArchivo(sugerido));
  if (!destino) return;
  const r = await ejecutar('zip', () =>
    api().herramientas.comprimirZip([...origenes.value], destino),
  );
  if (r) zip.value = r;
}

async function elegirPdf(): Promise<void> {
  const r = await ejecutar('elegirPdf', () => api().sistema.elegirArchivo());
  if (r) {
    pdfOrigen.value = r;
    pdf.value = null;
  }
}

async function optimizar(): Promise<void> {
  pdf.value = null;
  const origen = pdfOrigen.value;
  if (!origen) return;
  const base = nombreDe(origen).replace(/\.pdf$/i, '');
  const destino = await ejecutar('pdf', () =>
    api().sistema.guardarArchivo(`${base}${t.sufijoOptimizado}.pdf`),
  );
  if (!destino) return;
  const r = await ejecutar('pdf', () => api().herramientas.optimizarPdf(origen, destino));
  if (r) pdf.value = r;
}
</script>

<template>
  <div class="herr">
    <h3 class="titulo">{{ t.zip }}</h3>
    <p class="herr-tenue">{{ t.zipAyuda }}</p>
    <div class="herr-fila">
      <NButton secondary :loading="ocupado('elegir')" @click="agregarArchivos">{{
        t.agregarArchivos
      }}</NButton>
      <NButton secondary :loading="ocupado('elegir')" @click="agregarCarpeta">{{
        t.agregarCarpeta
      }}</NButton>
    </div>
    <ul v-if="origenes.length" class="lista">
      <li v-for="r in origenes" :key="r">
        <span :title="r">{{ nombreDe(r) }}</span>
        <NButton text size="tiny" @click="quitar(r)">{{ t.quitar }}</NButton>
      </li>
    </ul>
    <p v-else class="herr-tenue">{{ t.vacio }}</p>
    <div class="herr-fila">
      <NButton
        type="primary"
        :disabled="!origenes.length"
        :loading="ocupado('zip')"
        @click="crearZip"
      >
        {{ ocupado('zip') ? t.creando : t.crearZip }}
      </NButton>
    </div>
    <template v-if="zip">
      <dl class="herr-datos">
        <dt>{{ t.antes }}</dt>
        <dd>{{ formatoBytes(zip.antes) }} · {{ t.archivos(zip.archivos) }}</dd>
        <dt>{{ t.despues }}</dt>
        <dd>
          {{ formatoBytes(zip.despues) }} ({{ t.ahorro(porcentajeAhorro(zip.antes, zip.despues)) }})
        </dd>
      </dl>
      <p class="herr-ok">{{ t.guardado(zip.archivo) }}</p>
      <p v-if="zip.omitidos" class="herr-tenue">{{ t.omitidos(zip.omitidos) }}</p>
    </template>

    <h3 class="titulo">{{ t.pdf }}</h3>
    <p class="herr-tenue">{{ t.pdfAyuda }}</p>
    <div class="herr-fila">
      <NButton secondary :loading="ocupado('elegirPdf')" @click="elegirPdf">{{
        t.elegirPdf
      }}</NButton>
      <span v-if="pdfOrigen" class="herr-tenue" :title="pdfOrigen">{{ nombreDe(pdfOrigen) }}</span>
    </div>
    <div class="herr-fila">
      <NButton type="primary" :disabled="!pdfOrigen" :loading="ocupado('pdf')" @click="optimizar">
        {{ ocupado('pdf') ? t.optimizando : t.optimizar }}
      </NButton>
    </div>
    <template v-if="pdf">
      <dl class="herr-datos">
        <dt>{{ t.antes }}</dt>
        <dd>{{ formatoBytes(pdf.antes) }}</dd>
        <dt>{{ t.despues }}</dt>
        <dd>
          {{ formatoBytes(pdf.despues) }}
          <span v-if="pdf.mejoro">({{ t.ahorro(porcentajeAhorro(pdf.antes, pdf.despues)) }})</span>
        </dd>
      </dl>
      <p v-if="pdf.archivo" class="herr-ok">{{ t.guardado(pdf.archivo) }}</p>
      <NAlert v-else type="info" :show-icon="false">{{ t.sinMejora }}</NAlert>
    </template>
  </div>
</template>

<style scoped>
.titulo {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 600;
}
.lista {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow: auto;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.lista li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
</style>

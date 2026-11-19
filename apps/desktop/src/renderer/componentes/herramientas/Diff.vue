<script setup lang="ts">
import { NButton, NInput } from 'naive-ui';
import { ref } from 'vue';
import { mensajeDeError } from '../../composables/useAccion';
import { es } from '../../i18n/es';
import {
  compararTextos,
  MAX_TEXTO_DIFF,
  tamanoTexto,
  type ResultadoDiff,
} from '../../utilidades/herramientas';

const t = es.herramientas.diff;
const MAX_ARCHIVO = MAX_TEXTO_DIFF;
const MAX_FILAS = 5000;

const izquierda = ref('');
const derecha = ref('');
const resultado = ref<ResultadoDiff | null>(null);
const error = ref<string | null>(null);

/** El archivo se lee en la interfaz (input de archivo): no pasa por el núcleo. */
async function cargar(e: Event, lado: 'izq' | 'der'): Promise<void> {
  const input = e.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;
  if (archivo.size > MAX_ARCHIVO) {
    error.value = t.archivoGrande;
    return;
  }
  const texto = await archivo.text();
  if (lado === 'izq') izquierda.value = texto;
  else derecha.value = texto;
}

function comparar(): void {
  error.value = null;
  // Lo pegado tiene el mismo tope que un archivo: el diff es O(N·D) y la tabla, pesada.
  if (
    tamanoTexto(izquierda.value) > MAX_TEXTO_DIFF ||
    tamanoTexto(derecha.value) > MAX_TEXTO_DIFF
  ) {
    resultado.value = null;
    error.value = t.textoGrande;
    return;
  }
  try {
    resultado.value = compararTextos(izquierda.value, derecha.value);
  } catch (e) {
    resultado.value = null;
    error.value = mensajeDeError(e);
  }
}
</script>

<template>
  <div class="herr">
    <div class="herr-columnas">
      <div v-for="lado in ['izq', 'der'] as const" :key="lado">
        <div class="herr-fila cabeza">
          <span class="herr-etiqueta">{{ lado === 'izq' ? t.original : t.modificado }}</span>
          <label class="archivo">
            <input type="file" @change="cargar($event, lado)" />
            <span>{{ t.cargarArchivo }}</span>
          </label>
        </div>
        <NInput
          v-if="lado === 'izq'"
          v-model:value="izquierda"
          type="textarea"
          class="herr-mono"
          :autosize="{ minRows: 8, maxRows: 14 }"
        />
        <NInput
          v-else
          v-model:value="derecha"
          type="textarea"
          class="herr-mono"
          :autosize="{ minRows: 8, maxRows: 14 }"
        />
      </div>
    </div>
    <div class="herr-fila">
      <NButton type="primary" @click="comparar">{{ t.comparar }}</NButton>
      <span v-if="resultado" class="herr-tenue">
        {{
          resultado.agregadas + resultado.quitadas
            ? t.resumen(resultado.agregadas, resultado.quitadas)
            : t.iguales
        }}
      </span>
    </div>
    <p v-if="error" class="herr-error">{{ error }}</p>

    <p
      v-if="
        resultado && resultado.filas.length > MAX_FILAS && resultado.agregadas + resultado.quitadas
      "
      class="herr-tenue"
    >
      {{ t.truncado(MAX_FILAS, resultado.filas.length) }}
    </p>
    <div v-if="resultado && resultado.agregadas + resultado.quitadas" class="tabla">
      <table>
        <tbody>
          <tr v-for="(f, i) in resultado.filas.slice(0, MAX_FILAS)" :key="i" :class="f.tipo">
            <td class="num">{{ f.numIzq ?? '' }}</td>
            <td class="izq">{{ f.izq ?? '' }}</td>
            <td class="num">{{ f.numDer ?? '' }}</td>
            <td class="der">{{ f.der ?? '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.cabeza {
  justify-content: space-between;
  margin-bottom: 4px;
}
.archivo {
  font-size: 12px;
  color: #6470e0;
  cursor: pointer;
}
.archivo input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.archivo:focus-within span {
  text-decoration: underline;
}
.tabla {
  max-height: 480px;
  overflow: auto;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-family: var(--fuente-mono);
  font-size: 12px;
}
td {
  padding: 1px 6px;
  white-space: pre-wrap;
  word-break: break-all;
  vertical-align: top;
}
td.num {
  width: 44px;
  text-align: right;
  opacity: 0.45;
  user-select: none;
}
tr.quitado .izq,
tr.cambiado .izq {
  background: rgba(220, 38, 38, 0.16);
}
tr.agregado .der,
tr.cambiado .der {
  background: rgba(22, 163, 74, 0.16);
}
</style>

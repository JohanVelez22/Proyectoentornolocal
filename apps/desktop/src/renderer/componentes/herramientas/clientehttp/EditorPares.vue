<script setup lang="ts">
import { esNombreSecreto, type ParHttp } from '@pel/core';
import { Add, Close } from '@vicons/ionicons5';
import { NButton, NCheckbox, NIcon, NInput } from 'naive-ui';
import { textos } from '../../../i18n';
import CampoSecreto from './CampoSecreto.vue';

/** Tabla de nombre/valor (parámetros, cabeceras o campos). Los valores secretos van por CampoSecreto. */
const filas = defineModel<ParHttp[]>({ required: true });
const t = textos.herramientas.clienteHttp;

const esSecreto = (f: ParHttp): boolean =>
  f.ref !== undefined || f.faltante === true || esNombreSecreto(f.clave);

function agregar(): void {
  filas.value = [...filas.value, { clave: '', valor: '', activo: true }];
}
function quitar(i: number): void {
  filas.value = filas.value.filter((_, k) => k !== i);
}
</script>

<template>
  <div class="pares">
    <div v-for="(f, i) in filas" :key="i" class="fila">
      <NCheckbox v-model:checked="f.activo" :aria-label="t.par.activa" />
      <NInput
        v-model:value="f.clave"
        size="small"
        class="herr-mono clave"
        :placeholder="t.par.clave"
        :aria-label="t.par.clave"
      />
      <div class="valor">
        <CampoSecreto
          v-if="esSecreto(f)"
          v-model:valor="f.valor"
          v-model:referencia="f.ref"
          :etiqueta="t.par.valor"
        />
        <NInput
          v-else
          v-model:value="f.valor"
          size="small"
          class="herr-mono"
          :placeholder="t.par.valor"
          :aria-label="t.par.valor"
        />
        <p v-if="f.faltante && !f.valor" class="herr-error falta" role="alert">{{ t.par.falta }}</p>
      </div>
      <NButton size="small" quaternary circle :aria-label="t.par.quitar" @click="quitar(i)">
        <template #icon
          ><NIcon><Close /></NIcon
        ></template>
      </NButton>
    </div>
    <div>
      <NButton size="small" secondary @click="agregar">
        <template #icon
          ><NIcon><Add /></NIcon
        ></template>
        {{ t.par.agregar }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.pares {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fila {
  display: grid;
  grid-template-columns: auto minmax(90px, 0.8fr) minmax(120px, 1.4fr) auto;
  gap: 6px;
  align-items: start;
}
.fila :deep(.n-checkbox) {
  margin-top: 5px;
}
.falta {
  margin: 2px 0 0;
}
</style>

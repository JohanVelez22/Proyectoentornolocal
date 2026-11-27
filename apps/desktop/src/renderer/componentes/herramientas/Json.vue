<script setup lang="ts">
import { NButton, NInput, NTabPane, NTabs, NTree, type TreeOption } from 'naive-ui';
import { computed, ref } from 'vue';
import { textos } from '../../i18n';
import { useCopiar } from '../../composables/useHerramienta';
import {
  arbolJson,
  formatearJson,
  minificarJson,
  type ResultadoJson,
} from '../../utilidades/herramientas';

const t = textos.herramientas.json;
const copiar = useCopiar();

const entrada = ref('');
const resultado = ref<ResultadoJson | null>(null);
const soloValidar = ref(false);
const ejemploJson = '{"clave": "valor"}';

function aplicar(modo: 'formatear' | 'minificar' | 'validar'): void {
  soloValidar.value = modo === 'validar';
  resultado.value =
    modo === 'minificar' ? minificarJson(entrada.value) : formatearJson(entrada.value);
}

const arbol = computed<TreeOption[]>(() =>
  resultado.value?.ok ? (arbolJson(resultado.value.valor) as TreeOption[]) : [],
);
</script>

<template>
  <div class="herr">
    <div class="herr-columnas">
      <div>
        <div class="herr-etiqueta">{{ t.entrada }}</div>
        <NInput
          v-model:value="entrada"
          type="textarea"
          class="herr-mono"
          :autosize="{ minRows: 14, maxRows: 26 }"
          :placeholder="ejemploJson"
        />
        <div class="herr-fila acciones">
          <NButton type="primary" @click="aplicar('formatear')">{{ t.formatear }}</NButton>
          <NButton secondary @click="aplicar('minificar')">{{ t.minificar }}</NButton>
          <NButton secondary @click="aplicar('validar')">{{ t.validar }}</NButton>
        </div>
      </div>
      <div>
        <template v-if="resultado">
          <p v-if="!resultado.ok" class="herr-error">{{ resultado.error }}</p>
          <p v-else-if="soloValidar" class="herr-ok">{{ t.valido }}</p>
          <NTabs v-if="resultado.ok" type="line" size="small">
            <NTabPane name="texto" :tab="t.resultado">
              <pre class="herr-salida">{{ resultado.texto }}</pre>
              <NButton size="small" quaternary @click="copiar(resultado.texto)">{{
                textos.herramientas.copiar
              }}</NButton>
            </NTabPane>
            <NTabPane name="arbol" :tab="t.arbol">
              <NTree
                :data="arbol"
                block-line
                virtual-scroll
                style="max-height: 420px"
                class="herr-mono"
              />
            </NTabPane>
          </NTabs>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.acciones {
  margin-top: 8px;
}
</style>

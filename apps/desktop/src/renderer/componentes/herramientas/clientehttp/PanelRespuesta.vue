<script setup lang="ts">
import type { RespuestaHttp } from '@pel/core';
import { Globe } from '@vicons/ionicons5';
import { NAlert, NButton, NSpin, NTabPane, NTabs, NTag } from 'naive-ui';
import { computed, ref } from 'vue';
import { useCopiar } from '../../../composables/useHerramienta';
import { formatearNumero, textos } from '../../../i18n';
import EstadoVacio from '../../EstadoVacio.vue';
import TextoLargo from '../../TextoLargo.vue';

const props = defineProps<{
  respuesta: RespuestaHttp | null;
  error: string | null;
  enviando: boolean;
}>();

const t = textos.herramientas.clienteHttp.respuesta;
const copiar = useCopiar();
/** Lo que se pinta del cuerpo: el texto nunca se interpreta (siempre en un <pre>). */
const MAX_MOSTRADO = 1024 * 1024;
const crudo = ref(false);

const texto = computed(() => {
  const c = props.respuesta?.cuerpo;
  if (!c || c.tipo !== 'texto') return null;
  return !crudo.value && c.json !== null ? c.json : c.texto;
});
const mostrado = computed(() => (texto.value ?? '').slice(0, MAX_MOSTRADO));
const recortado = computed(() => (texto.value ?? '').length > MAX_MOSTRADO);

const familia = computed(() => {
  const e = props.respuesta?.estado ?? 0;
  return e >= 500 ? 'error' : e >= 400 ? 'warning' : e >= 300 ? 'info' : 'success';
});

function tamano(n: number): string {
  if (n < 1024) return `${formatearNumero(n)} B`;
  if (n < 1024 * 1024) return `${formatearNumero(n / 1024, { maximumFractionDigits: 1 })} KB`;
  return `${formatearNumero(n / 1024 / 1024, { maximumFractionDigits: 2 })} MB`;
}
</script>

<template>
  <div class="respuesta" aria-live="polite">
    <div v-if="enviando" class="centro">
      <NSpin size="small" />
      <span>{{ t.enviando }}</span>
    </div>
    <NAlert v-else-if="error" type="error" :show-icon="true" data-testid="http-error">{{
      error
    }}</NAlert>
    <EstadoVacio
      v-else-if="!respuesta"
      :icono="Globe"
      :titulo="t.vacioTitulo"
      :texto="t.vacioTexto"
      pequena
      marco
    />
    <template v-else>
      <div class="resumen" data-testid="http-resumen">
        <span class="dato"
          >{{ t.estado }}
          <NTag :type="familia" size="small" :bordered="false"
            >{{ respuesta.estado }} {{ respuesta.mensajeEstado }}</NTag
          ></span
        >
        <span class="dato"
          >{{ t.tiempo }} <strong>{{ formatearNumero(respuesta.tiempoMs) }} ms</strong></span
        >
        <span class="dato"
          >{{ t.tamano }} <strong>{{ tamano(respuesta.tamano) }}</strong></span
        >
      </div>
      <NAlert v-if="respuesta.truncada" type="warning" :show-icon="true">{{ t.truncada }}</NAlert>
      <NAlert v-if="respuesta.certificadoIgnorado" type="warning" :show-icon="true">{{
        t.certIgnorado
      }}</NAlert>
      <p v-if="respuesta.caWolf" class="herr-tenue">{{ t.caWolf }}</p>
      <div v-if="respuesta.saltos.length" class="herr-etiqueta">
        {{ t.urlFinal }}: <TextoLargo :texto="respuesta.urlFinal" mono />
      </div>
      <NTabs type="line" size="small" animated>
        <NTabPane name="cuerpo" :tab="t.cuerpo">
          <p
            v-if="respuesta.cuerpo.tipo === 'binario'"
            class="herr-tenue"
            data-testid="http-binario"
          >
            {{ t.binario(respuesta.tamano, respuesta.tipoContenido) }}
          </p>
          <p v-else-if="respuesta.tamano === 0" class="herr-tenue">{{ t.sinCuerpo }}</p>
          <template v-else>
            <div class="herr-fila">
              <NButton size="small" secondary @click="copiar(texto ?? '')">{{ t.copiar }}</NButton>
              <NButton
                v-if="respuesta.cuerpo.json !== null"
                size="small"
                quaternary
                @click="crudo = !crudo"
                >{{ crudo ? t.formato : t.crudo }}</NButton
              >
            </div>
            <pre class="herr-salida cuerpo" data-testid="http-cuerpo">{{ mostrado }}</pre>
            <p v-if="recortado" class="herr-tenue">{{ t.parcial(MAX_MOSTRADO) }}</p>
          </template>
        </NTabPane>
        <NTabPane name="cabeceras" :tab="`${t.cabeceras} (${respuesta.cabeceras.length})`">
          <table class="tabla">
            <tbody>
              <tr v-for="([k, v], i) in respuesta.cabeceras" :key="i">
                <th scope="row">{{ k }}</th>
                <td>{{ v }}</td>
              </tr>
            </tbody>
          </table>
        </NTabPane>
        <NTabPane name="saltos" :tab="`${t.redirecciones} (${respuesta.saltos.length})`">
          <p v-if="!respuesta.saltos.length" class="herr-tenue">{{ t.sinRedirecciones }}</p>
          <ol v-else class="saltos">
            <li v-for="(s, i) in respuesta.saltos" :key="i">
              <strong>{{ t.salto(i + 1) }}: {{ s.estado }}</strong>
              <TextoLargo :texto="s.url" mono />
              <TextoLargo :texto="s.ubicacion" mono />
            </li>
          </ol>
        </NTabPane>
      </NTabs>
    </template>
  </div>
</template>

<style scoped>
.respuesta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.centro {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  justify-content: center;
}
.resumen {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}
.dato {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}
.cuerpo {
  max-height: 380px;
  margin-top: 8px;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.tabla th,
.tabla td {
  text-align: left;
  vertical-align: top;
  padding: 3px 8px 3px 0;
  word-break: break-all;
}
.tabla th {
  white-space: nowrap;
  font-weight: 600;
  opacity: 0.85;
}
.saltos {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12.5px;
}
</style>

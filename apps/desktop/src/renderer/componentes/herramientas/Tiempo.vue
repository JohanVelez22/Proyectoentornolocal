<script setup lang="ts">
import { NButton, NInput } from 'naive-ui';
import Desplegable from '../Desplegable.vue';
import { computed, ref } from 'vue';
import { localeIntl, textos } from '../../i18n';
import {
  desplazamientoZona,
  fechaEnZonaAMs,
  formatearEnZona,
  interpretarTimestamp,
  textoDesplazamiento,
  zonaValida,
} from '../../utilidades/herramientas';

const t = textos.herramientas.tiempo;

const zonaLocal = Intl.DateTimeFormat().resolvedOptions().timeZone;
const zonas = (() => {
  try {
    const l = Intl.supportedValuesOf('timeZone');
    return l.includes('UTC') ? l : ['UTC', ...l];
  } catch {
    return ['UTC', zonaLocal];
  }
})().map((z) => ({ label: z, value: z }));

const zona = ref(zonaLocal);
const entradaTs = ref(String(Math.floor(Date.now() / 1000)));
const entradaFecha = ref(formatearEnZona(Date.now(), zonaLocal));
/** Último instante válido escrito en cualquiera de los dos campos. */
const instante = ref<number | null>(Date.now() - (Date.now() % 1000));
const errorTs = ref<string | null>(null);
const errorFecha = ref<string | null>(null);

const relativo = computed(() => new Intl.RelativeTimeFormat(localeIntl.value, { numeric: 'auto' }));

function desdeTs(v: string): void {
  entradaTs.value = v;
  const r = interpretarTimestamp(v);
  errorTs.value = r ? null : t.timestampInvalido;
  if (!r) return;
  instante.value = r.ms;
  entradaFecha.value = formatearEnZona(r.ms, zona.value);
  errorFecha.value = null;
}

function desdeFecha(v: string): void {
  entradaFecha.value = v;
  const ms = fechaEnZonaAMs(v, zona.value);
  errorFecha.value = ms === null ? t.fechaInvalida : null;
  if (ms === null) return;
  instante.value = ms;
  entradaTs.value = String(Math.floor(ms / 1000));
  errorTs.value = null;
}

function cambiarZona(z: string): void {
  if (!zonaValida(z)) return;
  zona.value = z;
  if (instante.value !== null) entradaFecha.value = formatearEnZona(instante.value, z);
}

function ahora(): void {
  desdeTs(String(Math.floor(Date.now() / 1000)));
}

const unidad = computed(() => interpretarTimestamp(entradaTs.value)?.unidad ?? null);

const datos = computed(() => {
  const ms = instante.value;
  if (ms === null) return [];
  const dif = (ms - Date.now()) / 1000;
  const [valor, u] =
    Math.abs(dif) < 60
      ? [dif, 'second' as const]
      : Math.abs(dif) < 3600
        ? [dif / 60, 'minute' as const]
        : Math.abs(dif) < 86400
          ? [dif / 3600, 'hour' as const]
          : Math.abs(dif) < 86400 * 365
            ? [dif / 86400, 'day' as const]
            : [dif / (86400 * 365), 'year' as const];
  return [
    [t.segundos, String(Math.floor(ms / 1000))],
    [t.milisegundos, String(ms)],
    [t.iso, new Date(ms).toISOString()],
    [t.enZona, `${formatearEnZona(ms, zona.value)} (${zona.value})`],
    [t.desplazamiento, textoDesplazamiento(desplazamientoZona(ms, zona.value))],
    [t.relativo, relativo.value.format(Math.round(valor), u)],
  ] as [string, string][];
});
</script>

<template>
  <div class="herr">
    <div>
      <div class="herr-etiqueta">{{ t.zona }}</div>
      <Desplegable :value="zona" :options="zonas" filterable @update:value="cambiarZona" />
    </div>
    <div class="herr-columnas">
      <div>
        <div class="herr-etiqueta">{{ t.timestamp }}</div>
        <div class="herr-fila">
          <NInput :value="entradaTs" class="herr-mono campo" @update:value="desdeTs" />
          <NButton secondary @click="ahora">{{ t.ahora }}</NButton>
        </div>
        <p v-if="errorTs" class="herr-error">{{ errorTs }}</p>
        <p v-else-if="unidad" class="herr-tenue">{{ t.detectado(unidad) }}</p>
      </div>
      <div>
        <div class="herr-etiqueta">{{ t.fecha }}</div>
        <NInput :value="entradaFecha" class="herr-mono" @update:value="desdeFecha" />
        <p v-if="errorFecha" class="herr-error">{{ errorFecha }}</p>
      </div>
    </div>
    <dl class="herr-datos">
      <template v-for="[k, v] in datos" :key="k">
        <dt>{{ k }}</dt>
        <dd>{{ v }}</dd>
      </template>
    </dl>
  </div>
</template>

<style scoped>
.campo {
  flex: 1;
}
</style>

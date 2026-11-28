<script setup lang="ts">
import { NCard, NTag } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { textos } from '../i18n';
import { useMetricas } from '../stores/metricas';
import { useProblemas } from '../stores/problemas';
import { formatoBps, formatoBytes, formatoPorcentaje } from '../utilidades/metricas';
import GraficaLinea from './GraficaLinea.vue';
import TarjetaDisco from './TarjetaDisco.vue';
import TarjetaServiciosProcesos from './TarjetaServiciosProcesos.vue';

/** Panel de rendimiento de Inicio: CPU, RAM, disco y red, alertas y procesos. */
const t = textos.panel;
const metricas = useMetricas();
const problemas = useProblemas();

const COLORES = { cpu: '#6470e0', ram: '#0ea5e9', bajada: '#16a34a', subida: '#d97706' };

onMounted(() => metricas.entrar());
onBeforeUnmount(() => metricas.salir());

const m = computed(() => metricas.ultima);
const serieCpu = computed(() => metricas.serie.map((x) => x.cpu));
const serieRam = computed(() =>
  metricas.serie.map((x) => (x.ramTotal > 0 ? (x.ramUsada / x.ramTotal) * 100 : 0)),
);
const serieBajada = computed(() => metricas.serie.map((x) => x.red.rxBps));
const serieSubida = computed(() => metricas.serie.map((x) => x.red.txBps));

const ramPct = computed(() =>
  m.value && m.value.ramTotal > 0 ? (m.value.ramUsada / m.value.ramTotal) * 100 : 0,
);

/**
 * La memoria del equipo no es un banner: es una insignia en su tarjeta. Los demás problemas
 * viven en «Problemas detectados» (BloqueProblemas), con la lista compartida (D54c).
 */
const memoriaAlta = computed(() => problemas.alertas.find((a) => a.tipo === 'ramAlta') ?? null);
</script>

<template>
  <section class="panel" :aria-label="t.titulo">
    <header class="panel-cabecera">
      <h2>{{ t.titulo }}</h2>
      <span class="nota">{{ metricas.muestreando ? t.ventana : t.pausado }}</span>
    </header>

    <div class="metricas">
      <NCard size="small" class="metrica">
        <div class="metrica-cabeza">
          <span class="etiqueta">{{ t.cpu }}</span>
          <strong class="valor">{{ m ? formatoPorcentaje(m.cpu) : '—' }}</strong>
        </div>
        <GraficaLinea
          :series="[{ valores: serieCpu, color: COLORES.cpu }]"
          :max="100"
          :etiqueta="t.graficaCpu(m ? formatoPorcentaje(m.cpu) : '—')"
        />
      </NCard>

      <NCard size="small" class="metrica">
        <div class="metrica-cabeza">
          <span class="etiqueta">{{ t.ram }}</span>
          <strong class="valor">{{ m ? formatoPorcentaje(ramPct) : '—' }}</strong>
        </div>
        <NTag
          v-if="memoriaAlta"
          size="small"
          type="warning"
          class="insignia"
          :title="memoriaAlta.texto"
        >
          {{ t.insignias.memoriaAlta }}
        </NTag>
        <GraficaLinea
          :series="[{ valores: serieRam, color: COLORES.ram }]"
          :max="100"
          :etiqueta="t.graficaRam(m ? formatoPorcentaje(ramPct) : '—')"
        />
        <small v-if="m" class="detalle">
          {{ t.deTotal(formatoBytes(m.ramUsada), formatoBytes(m.ramTotal)) }}
        </small>
      </NCard>

      <TarjetaDisco />

      <NCard size="small" class="metrica">
        <div class="metrica-cabeza">
          <span class="etiqueta">{{ t.red }}</span>
        </div>
        <GraficaLinea
          :series="[
            { valores: serieBajada, color: COLORES.bajada },
            { valores: serieSubida, color: COLORES.subida },
          ]"
          :etiqueta="
            t.graficaRed(m ? formatoBps(m.red.rxBps) : '—', m ? formatoBps(m.red.txBps) : '—')
          "
        />
        <small class="detalle leyenda">
          <span
            ><i :style="{ background: COLORES.bajada }" />{{ t.bajada }}
            {{ m ? formatoBps(m.red.rxBps) : '—' }}</span
          >
          <span
            ><i :style="{ background: COLORES.subida }" />{{ t.subida }}
            {{ m ? formatoBps(m.red.txBps) : '—' }}</span
          >
        </small>
      </NCard>
    </div>
    <p v-if="!m" class="nota esperando">{{ t.esperando }}</p>

    <TarjetaServiciosProcesos :procesos="m?.procesos ?? []" :puertos="metricas.puertos" />
  </section>
</template>

<style scoped>
.panel {
  margin-bottom: 18px;
}
.panel-cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.panel-cabecera h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.nota {
  font-size: 12px;
  opacity: 0.72;
}
.esperando {
  margin: 8px 0 0;
}
.insignia {
  margin-bottom: var(--wc-esp-2);
}
.metricas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.metrica {
  border-radius: 12px;
}
.metrica-cabeza {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.etiqueta {
  font-size: 12.5px;
  opacity: 0.76;
}
.valor {
  font-size: 20px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.detalle {
  display: block;
  margin-top: 6px;
  font-size: 11.5px;
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
}
.leyenda {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.leyenda i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 5px;
}
@media (max-width: 1080px) {
  .metricas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

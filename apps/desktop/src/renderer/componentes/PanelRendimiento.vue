<script setup lang="ts">
import { NAlert, NButton, NCard, NProgress, useDialog } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { api } from '../api';
import { useRouter } from 'vue-router';
import { useAccion } from '../composables/useAccion';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';
import { useMetricas } from '../stores/metricas';
import { useServicios } from '../stores/servicios';
import {
  calcularAlertas,
  formatoBps,
  formatoBytes,
  formatoPorcentaje,
  type AlertaPanel,
} from '../utilidades/metricas';
import GraficaLinea from './GraficaLinea.vue';
import TablaProcesos from './TablaProcesos.vue';

/** Panel de rendimiento de Inicio: CPU, RAM, disco y red, alertas y procesos. */
const t = textos.panel;
const metricas = useMetricas();
const servicios = useServicios();
const dialog = useDialog();
const { ejecutar } = useAccion();
const router = useRouter();

/** Abre Herramientas → Puertos en uso (para ver quién ocupa un puerto). */
function verPuertos(): void {
  solicitudes.herramienta = 'puertos';
  void router.push({ name: 'herramientas' });
}

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
const disco = computed(() => {
  if (!m.value) return null;
  const { usado, libre } = m.value.discoDatos;
  const total = usado + libre;
  return { usado, libre, total, pct: total > 0 ? (usado / total) * 100 : 0 };
});

const alertas = computed(() =>
  calcularAlertas({
    muestra: m.value,
    puertos: metricas.puertos,
    servicios: servicios.lista,
  }),
);

function finalizar(a: AlertaPanel): void {
  const p = a.proceso;
  if (!p) return;
  dialog.warning({
    title: t.alertas.finalizarTitulo,
    content: t.alertas.finalizarTexto(p.nombre, p.pid),
    positiveText: t.alertas.finalizar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: async () => {
      const r = await ejecutar(
        `finalizar-${p.pid}`,
        () => api().herramientas.finalizarProceso(p.pid, p.nombre, { creado: p.creado }),
        { exito: t.alertas.finalizado(p.nombre) },
      );
      if (r) await metricas.cargarPuertos();
    },
  });
}
</script>

<template>
  <section class="panel" :aria-label="t.titulo">
    <header class="panel-cabecera">
      <h2>{{ t.titulo }}</h2>
      <span class="nota">{{ metricas.muestreando ? t.ventana : t.pausado }}</span>
    </header>

    <div v-if="alertas.length || metricas.errorPuertos || metricas.errorMuestreo" class="alertas">
      <NAlert v-if="metricas.errorMuestreo" type="error" :show-icon="true" class="alerta">
        {{ t.errorMuestreo(metricas.errorMuestreo) }}
      </NAlert>
      <NAlert
        v-for="a in alertas"
        :key="a.clave"
        :type="a.tipo === 'ramAlta' ? 'warning' : 'error'"
        :show-icon="true"
        class="alerta"
      >
        <div class="alerta-fila">
          <span>{{ a.texto }}</span>
          <span class="alerta-botones">
            <NButton v-if="a.tipo !== 'ramAlta'" size="tiny" quaternary @click="verPuertos">
              {{ t.alertas.verPuertos }}
            </NButton>
            <NButton v-if="a.proceso" size="tiny" secondary type="error" @click="finalizar(a)">
              {{ t.alertas.finalizar }}
            </NButton>
          </span>
        </div>
      </NAlert>
      <NAlert v-if="metricas.errorPuertos" type="info" :show-icon="true" class="alerta">
        {{ t.alertas.errorPuertos }}
      </NAlert>
    </div>

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
        <GraficaLinea
          :series="[{ valores: serieRam, color: COLORES.ram }]"
          :max="100"
          :etiqueta="t.graficaRam(m ? formatoPorcentaje(ramPct) : '—')"
        />
        <small v-if="m" class="detalle">
          {{ t.deTotal(formatoBytes(m.ramUsada), formatoBytes(m.ramTotal)) }}
        </small>
      </NCard>

      <NCard size="small" class="metrica">
        <div class="metrica-cabeza">
          <span class="etiqueta">{{ t.disco }}</span>
          <strong class="valor">{{ disco ? formatoPorcentaje(disco.pct) : '—' }}</strong>
        </div>
        <div class="barra">
          <NProgress
            type="line"
            :percentage="disco ? Math.round(disco.pct) : 0"
            :show-indicator="false"
            :height="8"
            :status="disco && disco.pct >= 90 ? 'error' : 'default'"
          />
        </div>
        <small v-if="disco" class="detalle">
          {{ t.deTotal(formatoBytes(disco.usado), formatoBytes(disco.total)) }} ·
          {{ t.libre(formatoBytes(disco.libre)) }}
        </small>
      </NCard>

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

    <NCard :title="t.procesos.titulo" size="small" class="tarjeta-procesos">
      <TablaProcesos :procesos="m?.procesos ?? []" :puertos="metricas.puertos" />
    </NCard>
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
  opacity: 0.6;
}
.esperando {
  margin: 8px 0 0;
}
.alertas {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.alerta-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.alerta-botones {
  display: inline-flex;
  gap: 6px;
  flex: none;
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
  opacity: 0.7;
}
.valor {
  font-size: 20px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.barra {
  display: flex;
  align-items: center;
  height: 56px;
}
.detalle {
  display: block;
  margin-top: 6px;
  font-size: 11.5px;
  opacity: 0.65;
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
.tarjeta-procesos {
  margin-top: 14px;
  border-radius: 12px;
}
@media (max-width: 1080px) {
  .metricas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

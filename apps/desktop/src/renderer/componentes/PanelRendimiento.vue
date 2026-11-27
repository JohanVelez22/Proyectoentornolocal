<script setup lang="ts">
import { EllipsisHorizontal, Warning } from '@vicons/ionicons5';
import { NButton, NCard, NIcon, NTag, useDialog } from 'naive-ui';
import MenuDesplegable from './MenuDesplegable.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { api } from '../api';
import { useRouter } from 'vue-router';
import { useAccion } from '../composables/useAccion';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';
import { useMetricas } from '../stores/metricas';
import { useServicios } from '../stores/servicios';
import { agruparAvisos } from '../utilidades/avisosInicio';
import {
  calcularAlertas,
  formatoBps,
  formatoBytes,
  formatoPorcentaje,
  type AlertaPanel,
} from '../utilidades/metricas';
import GraficaLinea from './GraficaLinea.vue';
import TarjetaDisco from './TarjetaDisco.vue';
import TarjetaServiciosProcesos from './TarjetaServiciosProcesos.vue';

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

const alertas = computed(() =>
  calcularAlertas({
    muestra: m.value,
    puertos: metricas.puertos,
    // Servicios y procesos de proyecto (su puerto ocupado también es un problema), sin el Nginx
    // sin instalar: ese no es nada y daría un aviso falso.
    servicios: servicios.vigilados,
  }),
);

/** La memoria del equipo no es un banner: es una insignia en su tarjeta. */
const memoriaAlta = computed(() => alertas.value.find((a) => a.tipo === 'ramAlta') ?? null);

interface Problema {
  clave: string;
  texto: string;
  tipo: 'error' | 'info';
  alerta?: AlertaPanel;
}
/** Todo lo demás se junta en una sola tarjeta plegable (sin una pila de banners). */
const problemas = computed<Problema[]>(() => [
  ...(metricas.errorMuestreo
    ? [
        {
          clave: 'muestreo',
          texto: t.errorMuestreo(metricas.errorMuestreo),
          tipo: 'error' as const,
        },
      ]
    : []),
  ...alertas.value
    .filter((a) => a.tipo !== 'ramAlta')
    .map((a) => ({ clave: a.clave, texto: a.texto, tipo: 'error' as const, alerta: a })),
  ...(metricas.errorPuertos
    ? [{ clave: 'puertos', texto: t.alertas.errorPuertos, tipo: 'info' as const }]
    : []),
]);
const desplegado = ref(false);
const grupo = computed(() => agruparAvisos(problemas.value, desplegado.value));
const hayError = computed(() => problemas.value.some((p) => p.tipo === 'error'));
/** «Finalizar proceso» ya no es un botón rojo suelto: queda en un menú secundario. */
const opcionesFila = [{ label: t.alertas.finalizar, key: 'finalizar' }];

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

    <section
      v-if="problemas.length"
      class="problemas"
      :class="{ 'con-error': hayError }"
      :aria-label="t.alertas.grupo(grupo.total)"
    >
      <header class="problemas-cabeza">
        <NIcon :size="18" aria-hidden="true"><Warning /></NIcon>
        <h3>{{ t.alertas.grupo(grupo.total) }}</h3>
        <NButton
          v-if="grupo.plegable"
          size="small"
          text
          type="primary"
          :aria-expanded="desplegado"
          @click="desplegado = !desplegado"
        >
          {{ desplegado ? t.alertas.verMenos : t.alertas.verTodos(grupo.total) }}
        </NButton>
      </header>
      <ul class="problemas-lista">
        <li v-for="p in grupo.visibles" :key="p.clave" class="problema">
          <span class="problema-texto">{{ p.texto }}</span>
          <span class="alerta-botones">
            <NButton v-if="p.alerta" size="small" quaternary @click="verPuertos">
              {{ t.alertas.verPuertos }}
            </NButton>
            <MenuDesplegable
              v-if="p.alerta?.proceso"
              alinear-fin
              trigger="click"
              :options="opcionesFila"
              @select="() => p.alerta && finalizar(p.alerta)"
            >
              <NButton size="small" quaternary :aria-label="t.alertas.masAcciones">
                <template #icon
                  ><NIcon><EllipsisHorizontal /></NIcon
                ></template>
              </NButton>
            </MenuDesplegable>
          </span>
        </li>
      </ul>
    </section>

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
.problemas {
  margin-bottom: var(--wc-esp-4);
  padding: var(--wc-esp-2) var(--wc-esp-4);
  border-radius: var(--wc-radio-md);
  border-left: 3px solid var(--acento);
  background: rgba(var(--acento-rgb), 0.08);
}
.problemas.con-error {
  border-left-color: var(--texto-error);
  background: rgba(220, 38, 38, 0.08);
}
.problemas-cabeza {
  display: flex;
  align-items: center;
  gap: var(--wc-esp-2);
  min-height: 36px;
}
.problemas-cabeza h3 {
  flex: 1;
  margin: 0;
  font-size: var(--wc-texto-sm);
  font-weight: 600;
}
.problemas-lista {
  list-style: none;
  margin: 0;
  padding: 0;
}
.problema {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wc-esp-3);
  min-height: 40px;
  border-top: 1px solid rgba(128, 128, 128, 0.16);
  font-size: var(--wc-texto-sm);
}
.problema-texto {
  flex: 1;
  min-width: 0;
}
.insignia {
  margin-bottom: var(--wc-esp-2);
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

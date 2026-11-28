<script setup lang="ts">
import {
  ChevronDown as IconoAbrir,
  HardwareChip as IconoMemoria,
  ShieldCheckmark as IconoAdmin,
} from '@vicons/ionicons5';
import { NAlert, NButton, NIcon, NModal, NPopover } from 'naive-ui';
import { computed, nextTick, ref } from 'vue';
import type { EstimacionMemoria, NivelMemoria, ResultadoLiberacion } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { formatoBytes } from '../utilidades/metricas';

/**
 * Liberar memoria en tres niveles (D54b). Un botón en la cabecera abre un desplegable con
 * «Liviano», «Moderado» y «Profundo». Al pasar el ratón o enfocar un nivel se ve qué hace y
 * cuánto liberaría aproximadamente (calculado al abrir, con lo de ese momento). Profundo pide
 * confirmación y avisa del permiso de administrador. Nunca corre solo ni cierra programas.
 *
 * Cifras honestas: Liviano y Moderado dan «≈» (conjunto de trabajo privado) o «hasta ≈» (si solo se
 * pudo leer el total); Profundo da dos, lo de los procesos y la lista de espera que pasa a memoria
 * libre. El resultado es el aumento medido AHORA, no «lo liberado de verdad». Si Windows dice que
 * hay un juego o algo a pantalla completa, se avisa antes de Moderado y Profundo.
 */
const t = textos.memoria;
const { ejecutar, ocupado } = useAccion();

const NIVELES: NivelMemoria[] = ['liviano', 'moderado', 'profundo'];

const abierto = ref(false);
const estimacion = ref<EstimacionMemoria | null>(null);
const calculando = ref(false);
const previo = ref<NivelMemoria | null>(null);
const confirmando = ref(false);
/** Nivel pendiente de que se acepte el aviso de juego o pantalla completa. */
const avisandoPantalla = ref<NivelMemoria | null>(null);
const resultado = ref<ResultadoLiberacion | null>(null);
const items = ref<HTMLElement[]>([]);

const trabajando = computed(() => ocupado('memoria-liberar'));

/** Cada vez que se abre, se vuelve a calcular con los conjuntos de trabajo y la lista de espera de ahora. */
async function alAbrir(visible: boolean): Promise<void> {
  abierto.value = visible;
  if (!visible) return;
  previo.value = null;
  estimacion.value = null;
  calculando.value = true;
  try {
    estimacion.value = (await ejecutar('memoria-estimar', () => api().memoria.estimar())) ?? null;
  } finally {
    calculando.value = false;
  }
  await nextTick();
  items.value[0]?.focus();
}

/**
 * «Liberaría ≈ 1,2 GB» (conjunto de trabajo privado), «Liberaría hasta ≈ 1,2 GB» (solo el total) o
 * «No disponible»: una cifra que no se pudo medir nunca se inventa. En Profundo es «≈ X de
 * procesos»; la lista de espera va en otra línea (`listaEspera`).
 */
function aproximado(n: NivelMemoria): string {
  const nivel = estimacion.value?.niveles[n];
  if (!nivel || nivel.bytes === null) return t.noDisponible;
  const cantidad = formatoBytes(nivel.bytes);
  if (n === 'profundo')
    return nivel.tipo === 'hasta' ? t.procesosCifraHasta(cantidad) : t.procesosCifra(cantidad);
  return nivel.tipo === 'hasta' ? t.liberariaHasta(cantidad) : t.liberaria(cantidad);
}

/** «La lista de espera (X) pasa a memoria libre», con «No disponible» si no se pudo leer. */
const listaEspera = (): string => {
  const bytes = estimacion.value?.listaEspera;
  return t.listaEsperaCifra(
    bytes === null || bytes === undefined ? t.noDisponible : formatoBytes(bytes),
  );
};

/** ¿Windows dice que hay un juego, una presentación o algo a pantalla completa? */
const pantallaOcupada = computed(() => {
  const p = estimacion.value?.pantalla;
  return p !== undefined && p !== null && p !== 'libre';
});

function moverFoco(desde: number, paso: number): void {
  const i = (desde + paso + NIVELES.length) % NIVELES.length;
  items.value[i]?.focus();
}

function elegir(n: NivelMemoria): void {
  abierto.value = false;
  // Liviano solo toca lo propio; Moderado y Profundo avisan si hay un juego o pantalla completa.
  if (n !== 'liviano' && pantallaOcupada.value) avisandoPantalla.value = n;
  else seguir(n);
}

function seguir(n: NivelMemoria): void {
  avisandoPantalla.value = null;
  if (n === 'profundo') confirmando.value = true;
  else void liberar(n);
}

async function liberar(n: NivelMemoria): Promise<void> {
  confirmando.value = false;
  const r = await ejecutar('memoria-liberar', () => api().memoria.liberar(n, n === 'profundo'));
  if (r) resultado.value = r;
}

/** El permiso vencido a tiempo deja la ventana de Windows abierta: se avisa de que ya no hace nada. */
const textoPurga = (p: Exclude<ResultadoLiberacion['purga'], 'no-aplica'>): string =>
  p === 'tiempo' ? `${t.purga.tiempo} ${textos.errores.uacHuerfano}` : t.purga[p === 'sin-cache' ? 'sinCache' : p];

/** Memoria disponible o «No disponible» si no se pudo medir. */
const cifra = (m: { disponible: number } | null): string =>
  m ? formatoBytes(m.disponible) : t.noDisponible;

/** Un aumento medido, con «+», o «No disponible» si no se pudo medir. */
const aumento = (bytes: number | null): string =>
  bytes === null ? t.noDisponible : `+${formatoBytes(bytes)}`;
</script>

<template>
  <NPopover
    :show="abierto"
    trigger="click"
    placement="bottom-end"
    :show-arrow="false"
    :style="{ padding: 0, width: '340px', maxWidth: 'calc(100vw - 32px)' }"
    @update:show="alAbrir"
  >
    <template #trigger>
      <NButton
        size="small"
        secondary
        class="boton-memoria"
        :loading="trabajando"
        :aria-label="t.tituloEtiqueta"
        :title="t.tituloEtiqueta"
        aria-haspopup="menu"
        :aria-expanded="abierto"
      >
        <template #icon
          ><NIcon><IconoMemoria /></NIcon
        ></template>
        {{ trabajando ? t.liberando : t.etiqueta }}
        <NIcon class="flecha" :size="14" aria-hidden="true"><IconoAbrir /></NIcon>
      </NButton>
    </template>

    <div class="memoria-panel" @keydown.esc="abierto = false">
      <div role="menu" :aria-label="t.tituloEtiqueta" class="niveles">
        <button
          v-for="(n, i) in NIVELES"
          :key="n"
          :ref="(el) => (items[i] = el as HTMLElement)"
          type="button"
          role="menuitem"
          class="nivel"
          :class="{ activo: previo === n }"
          :data-nivel="n"
          @mouseenter="previo = n"
          @focus="previo = n"
          @click="elegir(n)"
          @keydown.down.prevent="moverFoco(i, 1)"
          @keydown.up.prevent="moverFoco(i, -1)"
        >
          <span class="nivel-nombre">{{ t.niveles[n] }}</span>
          <span v-if="n === 'profundo'" class="nivel-admin">
            <NIcon :size="14" aria-hidden="true"><IconoAdmin /></NIcon>
            {{ t.requiereAdmin }}
          </span>
        </button>
      </div>

      <div class="previa" aria-live="polite">
        <template v-if="previo">
          <p class="previa-que">{{ t.queHace[previo] }}</p>
          <p class="previa-cifra">
            <template v-if="calculando">{{ t.calculando }}</template>
            <strong v-else>{{ aproximado(previo) }}</strong>
          </p>
          <p v-if="previo === 'profundo' && !calculando" class="previa-cifra">
            <strong>{{ listaEspera() }}</strong>
          </p>
          <p v-if="previo === 'profundo'" class="previa-nota">{{ t.notaProfundo }}</p>
        </template>
        <p v-else class="previa-nota">{{ t.sugerencia }}</p>
        <p class="previa-nota">{{ t.notaEstimacion }}</p>
      </div>
    </div>
  </NPopover>

  <!-- Moderado y Profundo: aviso si hay un juego o una aplicación a pantalla completa. -->
  <NModal
    :show="avisandoPantalla !== null"
    preset="card"
    :title="t.avisoPantallaTitulo"
    :style="{ width: '460px', maxWidth: 'calc(100vw - 32px)' }"
    :auto-focus="false"
    @update:show="(v: boolean) => !v && (avisandoPantalla = null)"
  >
    <NAlert type="warning" :bordered="false" class="aviso" data-aviso="pantalla">{{
      t.avisoPantalla
    }}</NAlert>
    <div class="botones">
      <NButton size="small" secondary @click="avisandoPantalla = null">{{ t.cancelar }}</NButton>
      <NButton size="small" type="primary" @click="avisandoPantalla && seguir(avisandoPantalla)">{{
        t.continuar
      }}</NButton>
    </div>
  </NModal>

  <!-- Profundo: confirmación explícita y aviso del permiso de administrador. -->
  <NModal
    :show="confirmando"
    preset="card"
    :title="t.profundoTitulo"
    :style="{ width: '460px', maxWidth: 'calc(100vw - 32px)' }"
    :auto-focus="false"
    @update:show="(v: boolean) => (confirmando = v)"
  >
    <p class="texto">{{ t.profundoTexto }}</p>
    <NAlert type="info" :bordered="false" class="aviso">{{ t.confirmarUac }}</NAlert>
    <div class="botones">
      <NButton size="small" secondary @click="confirmando = false">{{ t.cancelar }}</NButton>
      <NButton size="small" type="primary" @click="liberar('profundo')">{{ t.continuar }}</NButton>
    </div>
  </NModal>

  <!-- Lo medido ahora: memoria disponible antes y después, y su aumento (y el de la libre). -->
  <NModal
    :show="resultado !== null"
    preset="card"
    :title="t.aumentoTitulo"
    :style="{ width: '460px', maxWidth: 'calc(100vw - 32px)' }"
    :auto-focus="false"
    @update:show="(v: boolean) => !v && (resultado = null)"
  >
    <template v-if="resultado">
      <p class="texto">{{ t.nivelAplicado(t.niveles[resultado.nivel]) }}</p>
      <dl class="medidas" aria-live="polite">
        <div>
          <dt>{{ t.antes }}</dt>
          <dd>{{ cifra(resultado.antes) }}</dd>
        </div>
        <div>
          <dt>{{ t.despues }}</dt>
          <dd>{{ cifra(resultado.despues) }}</dd>
        </div>
        <div class="total">
          <dt>{{ t.aumentoDisponible }}</dt>
          <dd data-medida="disponible">{{ aumento(resultado.aumentoDisponible) }}</dd>
        </div>
        <div>
          <dt>{{ t.aumentoLibre }}</dt>
          <dd data-medida="libre">{{ aumento(resultado.aumentoLibre) }}</dd>
        </div>
      </dl>
      <p class="texto">{{ t.procesos(resultado.procesosVaciados, resultado.procesosSaltados) }}</p>
      <NAlert
        v-if="resultado.purga !== 'no-aplica'"
        :type="resultado.purga === 'hecha' ? 'success' : 'warning'"
        :bordered="false"
        class="aviso"
      >
        {{ textoPurga(resultado.purga) }}
      </NAlert>
      <p class="previa-nota">{{ t.notaResultado }}</p>
      <div class="botones">
        <NButton size="small" type="primary" @click="resultado = null">{{ t.cerrar }}</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.memoria-panel {
  display: flex;
  flex-direction: column;
}
.niveles {
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 2px;
}
.nivel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 36px;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--wc-radio-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: start;
  cursor: pointer;
}
.nivel:hover,
.nivel.activo {
  background: rgba(var(--acento-rgb), 0.12);
}
.nivel:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: -2px;
}
.flecha {
  margin-inline-start: 4px;
}
.nivel-admin {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--wc-texto-xs);
  font-weight: 400;
  opacity: 0.85;
}
.previa {
  padding: 10px 14px 12px;
  border-top: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.25));
  min-height: 112px;
}
.previa p {
  margin: 0 0 6px;
}
.previa-que {
  font-size: var(--wc-texto-sm);
}
.previa-cifra {
  font-size: var(--wc-texto-md);
}
.previa-nota {
  font-size: var(--wc-texto-xs);
  opacity: 0.8;
}
.texto {
  margin: 0 0 10px;
  font-size: var(--wc-texto-sm);
}
.aviso {
  margin: 0 0 10px;
}
.botones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.medidas {
  margin: 0 0 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.medidas div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: var(--wc-texto-sm);
}
.medidas dt {
  opacity: 0.85;
}
.medidas dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.medidas .total {
  padding-top: 6px;
  border-top: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.25));
  font-weight: 700;
}
</style>

<script setup lang="ts">
import { ChevronDown } from '@vicons/ionicons5';
import { NButton, NCard, NDropdown, NIcon, NProgress, NTag } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { UnidadDisco } from '../../shared/api';
import { api } from '../api';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';
import { useMetricas } from '../stores/metricas';
import { entradasDisco, peorNivel, type EntradaDisco } from '../utilidades/disco';
import { formatoBytes } from '../utilidades/metricas';
import DialogoLimpiarVersiones from './DialogoLimpiarVersiones.vue';

/**
 * Espacio libre de C: y de la unidad de datos de WolfCore Dev (una sola entrada si es la misma),
 * en ámbar por debajo del 15 % libre y en rojo por debajo del 5 %. «Liberar espacio» solo abre lo
 * que ya existe (versiones sin uso, Limpieza de disco y Uso del disco, cada uno con su
 * confirmación): esta tarjeta no borra nada por sí misma.
 */
const t = textos.panel.discos;
const router = useRouter();
const metricas = useMetricas();

const unidades = ref<UnidadDisco[]>([]);
const carpetaDatos = ref<string | null>(null);
const leido = ref(false);
const limpiando = ref(false);
/** Las unidades se piden con una consulta al sistema: se releen pocas veces. */
const CADA_MS = 5 * 60_000;
let temporizador: ReturnType<typeof setInterval> | null = null;

async function leer(): Promise<void> {
  try {
    const [u, c] = await Promise.all([api().discoUso.unidades(), api().carpetaDatos()]);
    unidades.value = u;
    carpetaDatos.value = c;
  } catch {
    // Sin lista de unidades se usa la muestra de rendimiento (si la hay).
  } finally {
    leido.value = true;
  }
}

onMounted(() => {
  void leer();
  temporizador = setInterval(() => void leer(), CADA_MS);
});
onBeforeUnmount(() => {
  if (temporizador) clearInterval(temporizador);
});

const entradas = computed<EntradaDisco[]>(() =>
  entradasDisco({
    unidades: unidades.value,
    carpetaDatos: carpetaDatos.value,
    discoDatos: metricas.ultima?.discoDatos ?? null,
  }),
);
const nivel = computed(() => peorNivel(entradas.value));
const porcentajeLibre = (e: EntradaDisco): number => Math.round(e.fraccionLibre * 100);
const rol = (e: EntradaDisco): string =>
  e.rol === 'ambos' ? t.ambos : e.rol === 'sistema' ? t.sistema : t.datos;
const estadoBarra = (e: EntradaDisco): 'success' | 'warning' | 'error' =>
  e.nivel === 'critico' ? 'error' : e.nivel === 'aviso' ? 'warning' : 'success';

const opciones = computed(() => [
  { label: t.versiones, key: 'versiones' },
  { label: t.temporales, key: 'temporales' },
  { type: 'divider' as const, key: 'division' },
  { label: t.ocupaMas, key: 'ocupa' },
]);

function elegir(clave: string | number): void {
  if (clave === 'versiones') {
    limpiando.value = true;
    return;
  }
  // Las dos herramientas existentes: la de temporales pide su confirmación de siempre.
  solicitudes.herramienta = clave === 'temporales' ? 'limpiezaDisco' : 'usoDisco';
  void router.push({ name: 'herramientas' });
}
</script>

<template>
  <NCard size="small" class="tarjeta-disco" :class="`nivel-${nivel}`">
    <div class="cabeza">
      <span class="etiqueta">{{ t.titulo }}</span>
      <NTag v-if="nivel !== 'ok'" size="small" :type="nivel === 'critico' ? 'error' : 'warning'">
        {{ nivel === 'critico' ? t.casiLleno : t.poco }}
      </NTag>
    </div>
    <ul v-if="entradas.length" class="unidades">
      <li v-for="e in entradas" :key="e.rol" class="unidad" :class="`nivel-${e.nivel}`">
        <span class="unidad-rol">{{ rol(e) }}</span>
        <strong class="unidad-libre">{{
          t.libre(e.unidad, formatoBytes(e.libre), porcentajeLibre(e))
        }}</strong>
        <NProgress
          type="line"
          :percentage="100 - porcentajeLibre(e)"
          :show-indicator="false"
          :height="6"
          :status="estadoBarra(e)"
        />
      </li>
    </ul>
    <p v-else class="leyendo">{{ leido ? '—' : t.leyendo }}</p>
    <NDropdown trigger="click" :options="opciones" @select="elegir">
      <NButton size="small" secondary class="liberar">
        {{ t.liberar }}
        <template #icon
          ><NIcon><ChevronDown /></NIcon
        ></template>
      </NButton>
    </NDropdown>
    <DialogoLimpiarVersiones v-model:show="limpiando" @limpiado="leer" />
  </NCard>
</template>

<style scoped>
.tarjeta-disco {
  border-radius: var(--wc-radio-lg);
}
.cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wc-esp-2);
  margin-bottom: var(--wc-esp-2);
}
.etiqueta {
  font-size: var(--wc-texto-xs);
  opacity: 0.76;
}
.unidades {
  list-style: none;
  margin: 0 0 var(--wc-esp-3);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--wc-esp-3);
}
.unidad {
  display: grid;
  gap: var(--wc-esp-1);
}
.unidad-rol {
  font-size: var(--wc-texto-xs);
  opacity: 0.72;
}
.unidad-libre {
  font-size: var(--wc-texto-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.unidad.nivel-aviso .unidad-libre {
  color: var(--texto-aviso);
}
.unidad.nivel-critico .unidad-libre {
  color: var(--texto-error);
}
.leyendo {
  margin: 0 0 var(--wc-esp-3);
  font-size: var(--wc-texto-xs);
  opacity: 0.72;
}
.liberar {
  width: 100%;
}
</style>

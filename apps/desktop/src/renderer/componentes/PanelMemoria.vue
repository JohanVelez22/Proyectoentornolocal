<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCheckbox,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NRadioButton,
  NRadioGroup,
  NTag,
} from 'naive-ui';
import { computed, reactive, ref, watch } from 'vue';
import type { ModoMemoria, PlanMemoria, ResultadoMemoria } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { formatoBytes } from '../utilidades/metricas';

/**
 * Optimizador de memoria (D36). Siempre muestra la lista antes de actuar y solo aplica lo marcado
 * tras una confirmación explícita. Nunca corre solo ni en segundo plano; a los programas solo se
 * les pide que cierren su ventana.
 */
const visible = defineModel<boolean>('visible', { required: true });

const t = textos.memoria;
const { ejecutar, ocupado } = useAccion();

const modo = ref<ModoMemoria>('liviano');
const plan = ref<PlanMemoria | null>(null);
const resultado = ref<ResultadoMemoria | null>(null);
const confirmando = ref(false);
const marcas = reactive<Record<string, boolean>>({});

const MODOS: ModoMemoria[] = ['liviano', 'moderado', 'profundo'];

const acciones = computed(() => plan.value?.acciones ?? []);
const marcadas = computed(() => acciones.value.filter((a) => marcas[a.id]));
/** Lo que liberaría lo marcado, por separado: la RAM y el disco (la caché HTTP no es RAM). */
const estimado = computed(() =>
  marcadas.value.filter((a) => a.unidad === 'ram').reduce((suma, a) => suma + a.memoria, 0),
);
const estimadoDisco = computed(() =>
  marcadas.value.filter((a) => a.unidad === 'disco').reduce((suma, a) => suma + a.memoria, 0),
);
/** Lo que la confirmación nombra: los programas a los que se pedirá cerrar y los servicios a detener. */
const aCerrar = computed(() =>
  marcadas.value.filter((a) => a.tipo === 'cerrar-programa').map((a) => a.etiqueta),
);
const aDetener = computed(() =>
  marcadas.value.filter((a) => a.tipo === 'detener-inactivo').map((a) => a.etiqueta),
);
const hayProgramas = computed(() => acciones.value.some((a) => a.tipo === 'cerrar-programa'));
const hayServicios = computed(() => acciones.value.some((a) => a.tipo === 'detener-inactivo'));

/** Una lista distinta empieza de cero: lo que había en pantalla ya no vale. */
function reiniciar(): void {
  plan.value = null;
  resultado.value = null;
  confirmando.value = false;
  for (const k of Object.keys(marcas)) delete marcas[k];
}

watch(modo, reiniciar);
watch(visible, (v) => {
  if (!v) reiniciar();
});

async function ver(): Promise<void> {
  reiniciar();
  const p = await ejecutar('memoria-plan', () => api().memoria.plan(modo.value));
  if (!p) return;
  plan.value = p;
  // Lo que viene marcado es lo que dice el núcleo: los programas, nunca.
  for (const a of p.acciones) marcas[a.id] = a.marcada;
}

async function aplicar(): Promise<void> {
  const ids = marcadas.value.map((a) => a.id);
  const planId = plan.value?.id;
  confirmando.value = false;
  if (ids.length === 0 || !planId) return;
  const r = await ejecutar('memoria-aplicar', () => api().memoria.aplicar(planId, ids, true));
  if (r) {
    resultado.value = r;
    plan.value = null;
  } else {
    // El plan caducó o ya no es el actual: lo que se ve ya no vale; hay que mirar la lista otra vez.
    reiniciar();
  }
}

/** Texto de la acción en el idioma activo (las cachés conocidas llevan el suyo). */
function nombre(a: { id: string; tipo: string; etiqueta: string }): string {
  if (a.tipo === 'cache-app') {
    const clave = a.id.slice('cache-app:'.length) as keyof typeof t.caches;
    return t.caches[clave] ?? a.etiqueta;
  }
  return a.etiqueta;
}

const TONO = {
  hecho: 'success',
  pedido: 'info',
  saltado: 'warning',
  error: 'error',
} as const;

const hayPedidos = computed(() => resultado.value?.resultados.some((r) => r.estado === 'pedido'));
</script>

<template>
  <NDrawer v-model:show="visible" :width="440" placement="right">
    <NDrawerContent :title="t.titulo" closable :native-scrollbar="false">
      <p class="intro">{{ t.intro }}</p>

      <section v-if="resultado" class="resultado" aria-live="polite">
        <h3>{{ t.resultadoTitulo }}</h3>
        <p>{{ t.liberado(formatoBytes(resultado.liberado)) }}</p>
        <p v-if="resultado.liberadoDisco > 0">
          {{ t.liberadoDisco(formatoBytes(resultado.liberadoDisco)) }}
        </p>
        <p v-if="hayPedidos" class="motivo">{{ t.notaPedido }}</p>
        <ul class="lista">
          <li v-for="r in resultado.resultados" :key="r.id" class="fila">
            <NTag size="small" :type="TONO[r.estado]" :bordered="false">
              {{ t.estados[r.estado] }}
            </NTag>
            <span class="nombre">{{ nombre(r) || r.id }}</span>
            <span v-if="r.motivo" class="motivo">{{ t.motivos[r.motivo] }}</span>
          </li>
        </ul>
        <NButton size="small" secondary @click="reiniciar">{{ t.otraVez }}</NButton>
      </section>

      <template v-else>
        <div class="modos">
          <span class="etiqueta">{{ t.modo }}</span>
          <NRadioGroup v-model:value="modo" size="small">
            <NRadioButton v-for="m in MODOS" :key="m" :value="m">{{ t.modos[m] }}</NRadioButton>
          </NRadioGroup>
          <p class="descripcion">{{ t.descripciones[modo] }}</p>
        </div>

        <NButton type="primary" size="small" :loading="ocupado('memoria-plan')" @click="ver">
          {{ ocupado('memoria-plan') ? t.revisando : t.ver }}
        </NButton>

        <template v-if="plan">
          <NAlert v-if="plan.listadoFallido" type="warning" :bordered="false" class="nota">
            {{ t.listadoFallido }}
          </NAlert>
          <NAlert v-if="plan.sinDatosActividad" type="info" :bordered="false" class="nota">
            {{ t.sinDatos }}
          </NAlert>
          <NEmpty v-if="acciones.length === 0" :description="t.vacio" class="vacio" />
          <template v-else>
            <ul class="lista">
              <li v-for="a in acciones" :key="a.id" class="fila">
                <NCheckbox
                  :checked="marcas[a.id] === true"
                  @update:checked="(v: boolean) => (marcas[a.id] = v)"
                >
                  <span class="nombre">{{ nombre(a) }}</span>
                  <span class="tipo">{{ t.tipos[a.tipo] }}</span>
                </NCheckbox>
                <span class="peso">{{ formatoBytes(a.memoria) }}</span>
              </li>
            </ul>
            <NAlert v-if="hayProgramas" type="warning" :bordered="false" class="nota">
              {{ t.avisoCerrar }}
            </NAlert>
            <NAlert v-if="hayServicios" type="info" :bordered="false" class="nota">
              {{ t.avisoDetener }}
            </NAlert>
            <p class="resumen">
              {{ t.marcadas(marcadas.length, acciones.length) }} ·
              {{ t.estimado(formatoBytes(estimado)) }}
            </p>
            <p v-if="estimadoDisco > 0" class="resumen">
              {{ t.estimadoDisco(formatoBytes(estimadoDisco)) }}
            </p>
            <div v-if="!confirmando" class="acciones">
              <NButton
                type="warning"
                size="small"
                :disabled="marcadas.length === 0"
                @click="confirmando = true"
              >
                {{ t.aplicar }}
              </NButton>
            </div>
            <div v-else class="confirmar" role="alertdialog" :aria-label="t.confirmarTitulo">
              <strong>{{ t.confirmarTitulo }}</strong>
              <p>{{ t.confirmarTexto(marcadas.length) }}</p>
              <p v-if="aCerrar.length > 0">{{ t.confirmarCerrar(aCerrar.join(', ')) }}</p>
              <p v-if="aDetener.length > 0">{{ t.confirmarDetener(aDetener.join(', ')) }}</p>
              <div class="acciones">
                <NButton
                  type="warning"
                  size="small"
                  :loading="ocupado('memoria-aplicar')"
                  @click="aplicar"
                >
                  {{ t.confirmar }}
                </NButton>
                <NButton size="small" secondary @click="confirmando = false">
                  {{ t.cancelar }}
                </NButton>
              </div>
            </div>
          </template>
        </template>
        <p class="protegidos">{{ t.protegidos }}</p>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.intro,
.descripcion,
.protegidos {
  font-size: 13px;
  opacity: 0.8;
  margin: 0 0 12px;
}
.protegidos {
  margin-top: 16px;
  font-size: 12px;
}
.modos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.etiqueta {
  font-size: 12px;
  opacity: 0.7;
}
.lista {
  list-style: none;
  margin: 12px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.25));
  border-radius: 8px;
}
.nombre {
  font-weight: 600;
  margin-inline-end: 8px;
  overflow-wrap: anywhere;
}
.tipo,
.motivo,
.peso {
  font-size: 12px;
  opacity: 0.75;
}
.peso {
  white-space: nowrap;
}
.nota {
  margin: 8px 0;
}
.resumen {
  font-size: 13px;
  margin: 8px 0;
}
.acciones {
  display: flex;
  gap: 8px;
}
.confirmar {
  padding: 10px 12px;
  border: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.35));
  border-radius: 8px;
}
.confirmar p {
  margin: 4px 0 10px;
  font-size: 13px;
}
.vacio {
  margin-top: 24px;
}
</style>

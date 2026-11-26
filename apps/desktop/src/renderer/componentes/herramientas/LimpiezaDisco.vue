<script setup lang="ts">
import { NAlert, NButton, NCheckbox, NEmpty, NTag } from 'naive-ui';
import { computed, reactive, ref } from 'vue';
import type {
  CategoriaLimpieza,
  ResultadoLimpiezaDisco,
  ResumenCategoria,
} from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { formatoBytes } from '../../utilidades/metricas';

/**
 * Limpieza de disco (D37). Siempre muestra primero el análisis (categoría, archivos y bytes, y el
 * tamaño por carpeta) y solo limpia lo marcado tras una confirmación explícita. Nunca corre sola
 * ni en segundo plano. Solo vienen marcadas las cachés claramente regenerables.
 */
const t = textos.limpiezaDisco;
const { ejecutar, ocupado } = useAccion();

const resumen = ref<ResumenCategoria[] | null>(null);
const resultado = ref<ResultadoLimpiezaDisco | null>(null);
const confirmando = ref(false);
const marcas = reactive<Record<string, boolean>>({});

const categorias = computed(() => resumen.value ?? []);
const elegibles = computed(() => categorias.value.filter((c) => c.bloqueada === null));
const marcadas = computed(() => elegibles.value.filter((c) => marcas[c.categoria]));
const total = computed(() => marcadas.value.reduce((suma, c) => suma + c.bytes, 0));
const hayDefinitivo = computed(() => marcadas.value.some((c) => c.borrado === 'definitivo'));
const hayPapelera = computed(() => marcadas.value.some((c) => c.borrado === 'papelera'));
const hayPrefetch = computed(() => marcadas.value.some((c) => c.categoria === 'prefetch'));
const truncado = computed(() => categorias.value.some((c) => c.truncado));

function reiniciar(): void {
  resumen.value = null;
  resultado.value = null;
  confirmando.value = false;
  for (const k of Object.keys(marcas)) delete marcas[k];
}

async function analizar(): Promise<void> {
  reiniciar();
  const r = await ejecutar('disco-analizar', () => api().limpiezaDisco.analizar());
  if (!r) return;
  resumen.value = r;
  // Lo que viene marcado es lo que dice el núcleo (solo lo claramente regenerable).
  for (const c of r) marcas[c.categoria] = c.marcada && c.bloqueada === null;
}

async function limpiar(): Promise<void> {
  const ids: CategoriaLimpieza[] = marcadas.value.map((c) => c.categoria);
  confirmando.value = false;
  if (ids.length === 0) return;
  const r = await ejecutar('disco-limpiar', () => api().limpiezaDisco.limpiar(ids, true));
  if (r) {
    resultado.value = r;
    resumen.value = null;
  } else {
    // Un análisis caducado o una categoría protegida: lo que se ve ya no vale.
    reiniciar();
  }
}

const cancelar = (): Promise<unknown> =>
  ejecutar('disco-cancelar', () => api().limpiezaDisco.cancelar());
const abrirRegistros = (): Promise<unknown> =>
  ejecutar('disco-registros', () => api().limpiezaDisco.abrirRegistros());

const BLOQUEO = {
  'navegador-abierto': 'warning',
  'requiere-admin': 'info',
  'ruta-vetada': 'error',
} as const;

const motivos = computed(() =>
  Object.entries(
    resultado.value?.categorias
      .flatMap((c) => Object.entries(c.motivos))
      .reduce<Record<string, number>>(
        (acc, [m, n]) => ({ ...acc, [m]: (acc[m] ?? 0) + (n ?? 0) }),
        {},
      ) ?? {},
  ),
);
</script>

<template>
  <div class="herr">
    <p class="herr-tenue">{{ t.intro }}</p>

    <section v-if="resultado" class="resultado" aria-live="polite">
      <h3>{{ t.resultadoTitulo }}</h3>
      <p>{{ t.liberado(formatoBytes(resultado.liberados)) }}</p>
      <p v-if="resultado.enPapelera > 0">{{ t.enPapelera(formatoBytes(resultado.enPapelera)) }}</p>
      <p v-if="resultado.saltados > 0">{{ t.saltados(resultado.saltados) }}</p>
      <ul v-if="motivos.length > 0" class="lista">
        <li v-for="[m, n] in motivos" :key="m" class="fila">
          <span>{{ t.motivos[m as keyof typeof t.motivos] }}</span>
          <span class="peso">{{ n }}</span>
        </li>
      </ul>
      <ul class="lista">
        <li v-for="c in resultado.categorias" :key="c.categoria" class="fila">
          <span class="nombre">{{ t.categorias[c.categoria].nombre }}</span>
          <NTag v-if="c.bloqueada" size="small" :type="BLOQUEO[c.bloqueada]" :bordered="false">
            {{ t.bloqueos[c.bloqueada] }}
          </NTag>
          <span v-else class="peso">
            {{ t.archivos(c.archivos) }} · {{ formatoBytes(c.bytes) }}
          </span>
        </li>
      </ul>
      <NAlert v-if="resultado.cancelado" type="warning" :bordered="false" class="nota">
        {{ t.cancelado }}
      </NAlert>
      <NAlert v-if="resultado.truncado" type="info" :bordered="false" class="nota">
        {{ t.topeEjecucion }}
      </NAlert>
      <p class="herr-tenue registro">{{ t.registroEn(resultado.registro) }}</p>
      <div class="acciones">
        <NButton size="small" secondary @click="abrirRegistros">{{ t.verRegistros }}</NButton>
        <NButton size="small" secondary @click="reiniciar">{{ t.otraVez }}</NButton>
      </div>
    </section>

    <template v-else>
      <div class="acciones">
        <NButton type="primary" size="small" :loading="ocupado('disco-analizar')" @click="analizar">
          {{ ocupado('disco-analizar') ? t.analizando : t.analizar }}
        </NButton>
        <NButton v-if="ocupado('disco-analizar')" size="small" secondary @click="cancelar">
          {{ t.cancelarAnalisis }}
        </NButton>
      </div>

      <template v-if="resumen">
        <NEmpty v-if="categorias.length === 0" :description="t.vacio" class="vacio" />
        <ul v-else class="lista">
          <li v-for="c in categorias" :key="c.categoria" class="categoria">
            <div class="fila">
              <NCheckbox
                :checked="marcas[c.categoria] === true"
                :disabled="c.bloqueada !== null"
                @update:checked="(v: boolean) => (marcas[c.categoria] = v)"
              >
                <span class="nombre">{{ t.categorias[c.categoria].nombre }}</span>
              </NCheckbox>
              <span class="peso">{{ t.archivos(c.archivos) }} · {{ formatoBytes(c.bytes) }}</span>
            </div>
            <p class="ayuda">{{ t.categorias[c.categoria].ayuda }}</p>
            <p class="ayuda">
              {{ c.borrado === 'definitivo' ? t.borradoDefinitivo : t.borradoPapelera }}
            </p>
            <NTag v-if="c.bloqueada" size="small" :type="BLOQUEO[c.bloqueada]" :bordered="false">
              {{ t.bloqueos[c.bloqueada] }}
            </NTag>
            <details v-if="c.carpetas.length > 0" class="carpetas">
              <summary>{{ t.carpetas }} ({{ c.carpetas.length }})</summary>
              <ul class="lista">
                <li v-for="d in c.carpetas" :key="d.ruta" class="fila">
                  <span class="ruta">{{ d.ruta }}</span>
                  <span class="peso"
                    >{{ t.archivos(d.archivos) }} · {{ formatoBytes(d.bytes) }}</span
                  >
                </li>
              </ul>
            </details>
          </li>
        </ul>
        <NAlert v-if="truncado" type="info" :bordered="false" class="nota">{{ t.truncado }}</NAlert>

        <template v-if="categorias.length > 0">
          <p class="resumen">
            {{ t.marcadas(marcadas.length, elegibles.length) }} · {{ t.total(formatoBytes(total)) }}
          </p>
          <div v-if="!confirmando" class="acciones">
            <NButton
              type="warning"
              size="small"
              :disabled="marcadas.length === 0"
              @click="confirmando = true"
            >
              {{ t.limpiar }}
            </NButton>
          </div>
          <div v-else class="confirmar" role="alertdialog" :aria-label="t.confirmarTitulo">
            <strong>{{ t.confirmarTitulo }}</strong>
            <p>{{ t.confirmarTexto(marcadas.length) }}</p>
            <p v-if="hayDefinitivo">{{ t.confirmarDefinitivo }}</p>
            <p v-if="hayPapelera">{{ t.confirmarPapelera }}</p>
            <p v-if="hayPrefetch">{{ t.confirmarPrefetch }}</p>
            <div class="acciones">
              <NButton
                type="warning"
                size="small"
                :loading="ocupado('disco-limpiar')"
                @click="limpiar"
              >
                {{ t.confirmar }}
              </NButton>
              <NButton v-if="ocupado('disco-limpiar')" size="small" secondary @click="cancelar">
                {{ t.detener }}
              </NButton>
              <NButton v-else size="small" secondary @click="confirmando = false">
                {{ t.cancelar }}
              </NButton>
            </div>
          </div>
        </template>
      </template>
      <p class="herr-tenue protegidas">{{ t.protegidas }}</p>
    </template>
  </div>
</template>

<style scoped>
.lista {
  list-style: none;
  margin: 12px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.categoria,
.fila {
  display: flex;
  gap: 8px;
}
.categoria {
  flex-direction: column;
  padding: 10px 12px;
  border: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.25));
  border-radius: 8px;
}
.fila {
  align-items: center;
  justify-content: space-between;
}
.nombre {
  font-weight: 600;
}
.ayuda {
  margin: 0;
  font-size: 12px;
  opacity: 0.75;
}
.peso {
  font-size: 12px;
  opacity: 0.8;
  white-space: nowrap;
}
.ruta {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.carpetas summary {
  cursor: pointer;
  font-size: 12px;
  opacity: 0.8;
}
.nota,
.resumen {
  margin: 8px 0;
}
.resumen {
  font-size: 13px;
}
.acciones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
.protegidas {
  margin-top: 16px;
  font-size: 12px;
}
.registro {
  overflow-wrap: anywhere;
}
.vacio {
  margin-top: 24px;
}
</style>

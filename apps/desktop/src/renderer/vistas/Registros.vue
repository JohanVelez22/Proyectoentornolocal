<script setup lang="ts">
import { ArrowDown, Copy, FolderOpen, Pause, Play, Refresh, Trash } from '@vicons/ionicons5';
import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NEmpty,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NSpin,
  useThemeVars,
} from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { useRegistros } from '../stores/registros';
import { useSitios } from '../stores/sitios';
import { agruparFuentes, NIVELES_REGISTRO, type NivelRegistro } from '../utilidades/registros';

const t = es.registros;
const route = useRoute();
const registros = useRegistros();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

const opciones = computed(() => agruparFuentes(registros.fuentes, (id) => sitios.porId(id)));
const caja = ref<HTMLElement | null>(null);
/** Sigue el final mientras el usuario no suba a leer líneas anteriores. */
const pegadoAlFinal = ref(true);

/** Colores por nivel del tema de Naive (siguen el tema claro u oscuro que esté activo). */
const tema = useThemeVars();
const coloresNivel = computed(() => ({
  '--color-error': tema.value.errorColor,
  '--color-aviso': tema.value.warningColor,
}));

async function cargarFuentes(): Promise<void> {
  await ejecutar('fuentes', () => registros.cargarFuentes());
}

function elegir(id: string | null): void {
  void ejecutar('elegir', () => registros.elegir(id));
}

onMounted(async () => {
  registros.entrar();
  await cargarFuentes();
  const pedida = typeof route.query.fuente === 'string' ? route.query.fuente : null;
  if (pedida && registros.fuentes.some((f) => f.id === pedida)) elegir(pedida);
});
onBeforeUnmount(() => {
  void registros.salir();
});

watch(
  () => registros.mostradas,
  async () => {
    if (!pegadoAlFinal.value) return;
    await nextTick();
    if (caja.value) caja.value.scrollTop = caja.value.scrollHeight;
  },
);

function alDesplazar(): void {
  const c = caja.value;
  if (!c) return;
  pegadoAlFinal.value = c.scrollHeight - c.scrollTop - c.clientHeight < 24;
}
function irAlFinal(): void {
  pegadoAlFinal.value = true;
  if (caja.value) caja.value.scrollTop = caja.value.scrollHeight;
}

function copiar(): void {
  const lineas = registros.visibles.map((l) => l.texto);
  void ejecutar('copiar', () => api().sistema.copiar(lineas.join('\n')), {
    exito: t.copiadas(lineas.length),
  });
}
function abrirCarpeta(): void {
  const id = registros.actual;
  if (id) void ejecutar('carpeta', () => api().registros.abrirCarpeta(id));
}
function alternarPausa(): void {
  if (registros.pausado) registros.reanudar();
  else registros.pausar();
}
function cambiarNiveles(v: (string | number)[]): void {
  registros.niveles = v.filter((x): x is NivelRegistro =>
    (NIVELES_REGISTRO as readonly string[]).includes(String(x)),
  );
}
</script>

<template>
  <div class="registros">
    <p class="descripcion">{{ t.descripcion }}</p>

    <div class="barra">
      <NSelect
        class="selector"
        :value="registros.actual"
        :options="opciones"
        :placeholder="registros.fuentes.length ? t.elegirFuente : t.sinFuentes"
        :loading="ocupado('fuentes')"
        :aria-label="t.fuente"
        filterable
        clearable
        @update:value="elegir"
      />
      <NButton
        secondary
        :aria-label="es.acciones.actualizar"
        :title="es.acciones.actualizar"
        :loading="ocupado('fuentes')"
        @click="cargarFuentes"
      >
        <template #icon
          ><NIcon><Refresh /></NIcon
        ></template>
      </NButton>
      <NInput
        v-model:value="registros.texto"
        class="buscar"
        clearable
        :placeholder="t.buscar"
        :aria-label="t.buscar"
      />
      <NCheckboxGroup :value="registros.niveles" @update:value="cambiarNiveles">
        <NSpace :size="10" :wrap="false">
          <NCheckbox v-for="n in NIVELES_REGISTRO" :key="n" :value="n" :label="t.niveles[n]" />
        </NSpace>
      </NCheckboxGroup>
    </div>

    <div class="acciones">
      <NSpace :size="8">
        <NButton size="small" :disabled="!registros.actual" @click="alternarPausa">
          <template #icon
            ><NIcon><component :is="registros.pausado ? Play : Pause" /></NIcon
          ></template>
          {{ registros.pausado ? t.reanudar : t.pausar }}
        </NButton>
        <NButton
          size="small"
          :disabled="!registros.visibles.length"
          :loading="ocupado('copiar')"
          @click="copiar"
        >
          <template #icon
            ><NIcon><Copy /></NIcon
          ></template>
          {{ t.copiar }}
        </NButton>
        <NButton size="small" :disabled="!registros.lineas.length" @click="registros.limpiar()">
          <template #icon
            ><NIcon><Trash /></NIcon
          ></template>
          {{ t.limpiar }}
        </NButton>
        <NButton
          size="small"
          :disabled="!registros.actual"
          :loading="ocupado('carpeta')"
          @click="abrirCarpeta"
        >
          <template #icon
            ><NIcon><FolderOpen /></NIcon
          ></template>
          {{ t.abrirCarpeta }}
        </NButton>
      </NSpace>
      <span class="cuenta" role="status">
        <template v-if="registros.pausado && registros.nuevasEnPausa">
          {{ t.pausadoNuevas(registros.nuevasEnPausa) }} ·
        </template>
        {{ t.cuenta(registros.visibles.length, registros.lineas.length) }}
        <template v-if="registros.descartadas">
          {{ t.descartadas(registros.descartadas) }}</template
        >
      </span>
    </div>

    <div v-if="registros.ocultas" class="mas">
      <span>{{ t.ocultas(registros.ocultas) }}</span>
      <NButton size="tiny" secondary @click="registros.mostrarMas()">{{ t.mostrarMas }}</NButton>
    </div>

    <div class="visor-envoltura">
      <NSpin :show="registros.cargando" class="spin">
        <div v-if="!registros.actual" class="vacio">
          <NEmpty :description="registros.fuentes.length ? t.elegirFuente : t.sinFuentes" />
        </div>
        <pre
          v-else
          ref="caja"
          class="visor"
          :style="coloresNivel"
          tabindex="0"
          :aria-label="t.titulo"
          @scroll="alDesplazar"
        ><template v-if="registros.mostradas.length"><span
            v-for="f in registros.mostradas"
            :key="f.seq"
            class="linea"
            :class="f.nivel ? `nivel-${f.nivel}` : ''"
          >{{ f.texto }}
</span></template><span v-else class="sin-lineas">{{
            registros.lineas.length ? t.sinCoincidencias : t.vacio
          }}</span></pre>
      </NSpin>
      <NButton
        v-if="registros.actual && !pegadoAlFinal"
        class="al-final"
        size="small"
        type="primary"
        round
        @click="irAlFinal"
      >
        <template #icon
          ><NIcon><ArrowDown /></NIcon
        ></template>
        {{ t.alFinal }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.registros {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.descripcion {
  margin: 0 0 6px;
  opacity: 0.65;
}
.barra {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.selector {
  flex: 1 1 280px;
  max-width: 420px;
}
.buscar {
  flex: 1 1 200px;
  max-width: 280px;
}
.acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.cuenta {
  font-size: 12px;
  opacity: 0.65;
  font-variant-numeric: tabular-nums;
}
.visor-envoltura {
  position: relative;
}
.spin {
  display: block;
}
.visor {
  margin: 0;
  height: calc(100vh - 290px);
  min-height: 260px;
  overflow: auto;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  background: rgba(128, 128, 128, 0.06);
  font-family: var(--fuente-mono);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.visor:focus-visible {
  outline: 2px solid #6470e0;
  outline-offset: 2px;
}
.nivel-error {
  color: var(--color-error);
}
.nivel-warning {
  color: var(--color-aviso);
}
.mas {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  opacity: 0.8;
}
.sin-lineas {
  opacity: 0.6;
  font-family: var(--fuente);
}
.vacio {
  display: grid;
  place-items: center;
  height: calc(100vh - 290px);
  min-height: 260px;
  border-radius: 10px;
  border: 1px dashed rgba(128, 128, 128, 0.3);
}
.al-final {
  position: absolute;
  right: 16px;
  bottom: 14px;
}
</style>

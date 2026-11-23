<script setup lang="ts">
import { Close, Refresh } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NEmpty,
  NIcon,
  NModal,
  NRadioButton,
  NRadioGroup,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { AccionContenedor, Contenedor, MotorContenedores } from '../../shared/api';
import { api } from '../api';
import FilaContenedor from '../componentes/FilaContenedor.vue';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useContenedores } from '../stores/contenedores';

const t = textos.contenedores;
const tienda = useContenedores();
const { ejecutar, ocupado } = useAccion();

/** Páginas oficiales de instalación (WolfCore Dev no instala ningún motor). */
const URL_DOCKER = 'https://docs.docker.com/get-started/get-docker/';
const URL_PODMAN = 'https://podman.io/docs/installation';

const NOMBRES: Record<MotorContenedores, string> = { docker: 'Docker', podman: 'Podman' };

const cargando = ref(true);
onMounted(() => {
  void ejecutar('detectar', () => tienda.entrar()).finally(() => {
    cargando.value = false;
  });
});
onBeforeUnmount(() => void tienda.salir());

const estado = computed(() => tienda.estadoMotor);
const sinMotor = computed(() => tienda.motores !== null && tienda.instalados.length === 0);
const remoto = computed(() => tienda.motores?.some((m) => m.hostRemotoIgnorado) ?? false);

function refrescar(): void {
  void ejecutar('refrescar', async () => {
    await tienda.detectar();
    await tienda.refrescar();
  });
}

function abrir(url: string): void {
  void ejecutar('abrir', () => api().sistema.abrirUrl(url));
}

/* ───────────── Acciones (detener y reiniciar con diálogo) ───────────── */

const pedido = ref<{ c: Contenedor; a: 'detener' | 'reiniciar' } | null>(null);

function pedir(c: Contenedor, a: AccionContenedor): void {
  if (a === 'iniciar') {
    void hacer(c, a);
    return;
  }
  pedido.value = { c, a };
}

const nombreDe = (c: Contenedor): string => c.nombre || c.id.slice(0, 12);

function hacer(c: Contenedor, a: AccionContenedor, confirmacion?: true): Promise<unknown> {
  return ejecutar(`accion-${c.id}`, () => tienda.accion(c, a, confirmacion), {
    exito: t.hecho[a](nombreDe(c)),
  });
}

/** Única vía a detener/reiniciar: el botón Confirmar del diálogo pasa `true`. */
function confirmar(): void {
  const p = pedido.value;
  if (!p) return;
  pedido.value = null;
  void hacer(p.c, p.a, true);
}

const textoPedido = computed(() => {
  const p = pedido.value;
  if (!p) return { titulo: '', cuerpo: '' };
  return p.a === 'detener'
    ? { titulo: t.confirmarDetenerTitulo, cuerpo: t.confirmarDetener(nombreDe(p.c)) }
    : { titulo: t.confirmarReiniciarTitulo, cuerpo: t.confirmarReiniciar(nombreDe(p.c)) };
});

/* ───────────── Registros ───────────── */

function registros(c: Contenedor): void {
  if (tienda.registro?.id === c.id) {
    void ejecutar('registro', () => tienda.cerrarRegistro());
    return;
  }
  void ejecutar('registro', () => tienda.abrirRegistro(c));
}

const caja = ref<HTMLElement | null>(null);
const pegadoAlFinal = ref(true);
function alDesplazar(): void {
  const el = caja.value;
  if (el) pegadoAlFinal.value = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
}
watch(
  () => tienda.registro?.lineas.length,
  async () => {
    if (!pegadoAlFinal.value) return;
    await nextTick();
    if (caja.value) caja.value.scrollTop = caja.value.scrollHeight;
  },
);
</script>

<template>
  <div class="contenedores">
    <div class="cabecera">
      <p class="descripcion">{{ t.descripcion }}</p>
      <NSpace align="center">
        <NRadioGroup
          v-if="tienda.instalados.length > 1"
          :value="tienda.motor"
          size="small"
          @update:value="(m: MotorContenedores) => ejecutar('motor', () => tienda.elegirMotor(m))"
        >
          <NRadioButton v-for="m in tienda.instalados" :key="m.motor" :value="m.motor">
            {{ NOMBRES[m.motor] }}
          </NRadioButton>
        </NRadioGroup>
        <NTag v-if="estado?.version" size="small" :bordered="false">
          {{ NOMBRES[estado.motor] }} · {{ t.version(estado.version) }}
        </NTag>
        <NButton size="small" :loading="ocupado('refrescar')" @click="refrescar">
          <template #icon
            ><NIcon><Refresh /></NIcon
          ></template>
          {{ t.refrescar }}
        </NButton>
      </NSpace>
    </div>

    <NSpin
      v-if="cargando && tienda.motores === null"
      :description="t.detectando"
      class="cargando"
    />

    <NAlert v-if="sinMotor" type="info" :title="t.sinMotorTitulo">
      <p>{{ t.sinMotor }}</p>
      <NSpace>
        <NButton size="small" @click="abrir(URL_DOCKER)">{{ t.instalarDocker }}</NButton>
        <NButton size="small" @click="abrir(URL_PODMAN)">{{ t.instalarPodman }}</NButton>
      </NSpace>
    </NAlert>

    <NAlert
      v-else-if="estado && !estado.responde"
      type="warning"
      :title="t.apagadoTitulo(NOMBRES[estado.motor])"
    >
      {{ t.apagado(NOMBRES[estado.motor]) }}
    </NAlert>

    <NAlert v-if="remoto" type="warning" :show-icon="true" class="nota">{{ t.remoto }}</NAlert>
    <NAlert v-if="estado?.origen === 'path'" type="info" :show-icon="false" class="nota">
      {{ t.desdePath }}
    </NAlert>

    <template v-if="estado?.responde">
      <NEmpty v-if="tienda.lista.length === 0" :description="t.vacio" class="vacio" />
      <div v-else class="tabla">
        <table>
          <thead>
            <tr>
              <th>{{ t.columnas.nombre }}</th>
              <th>{{ t.columnas.imagen }}</th>
              <th>{{ t.columnas.estado }}</th>
              <th>{{ t.columnas.puertos }}</th>
              <th>{{ t.columnas.compose }}</th>
              <th>{{ t.columnas.acciones }}</th>
            </tr>
          </thead>
          <tbody>
            <FilaContenedor
              v-for="c in tienda.lista"
              :key="c.id"
              :contenedor="c"
              :ocupado="ocupado(`accion-${c.id}`)"
              :con-registro="tienda.registro?.id === c.id"
              @accion="(a) => pedir(c, a)"
              @registros="registros(c)"
            />
          </tbody>
        </table>
      </div>
    </template>

    <section v-if="tienda.registro" class="registro">
      <div class="registro-cabecera">
        <strong>{{ t.registroTitulo(tienda.registro.nombre) }}</strong>
        <NButton
          size="small"
          quaternary
          :aria-label="t.cerrar"
          @click="ejecutar('registro', () => tienda.cerrarRegistro())"
        >
          <template #icon
            ><NIcon><Close /></NIcon
          ></template>
        </NButton>
      </div>
      <div ref="caja" class="lineas" @scroll="alDesplazar">
        <div v-if="tienda.registro.lineas.length === 0 && !tienda.registro.fin" class="tenue">
          {{ t.registroEsperando }}
        </div>
        <div v-for="(l, i) in tienda.registro.lineas" :key="i" class="linea">{{ l }}</div>
        <div v-if="tienda.registro.fin" class="tenue">{{ t.registroFin }}</div>
      </div>
    </section>

    <NModal
      :show="pedido !== null"
      preset="dialog"
      type="warning"
      :title="textoPedido.titulo"
      :positive-text="t.confirmar"
      :negative-text="t.cancelar"
      @positive-click="confirmar"
      @negative-click="pedido = null"
      @close="pedido = null"
      @mask-click="pedido = null"
    >
      {{ textoPedido.cuerpo }}
    </NModal>
  </div>
</template>

<style scoped>
.contenedores {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.descripcion {
  margin: 0;
  max-width: 640px;
  opacity: 0.85;
}
.cargando,
.vacio {
  margin: 24px 0;
}
.tabla {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th {
  text-align: left;
  padding: 6px 8px;
  font-weight: 600;
  border-bottom: 1px solid rgba(128, 128, 128, 0.35);
}
.registro {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.registro-cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lineas {
  height: 280px;
  overflow: auto;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.1);
}
.linea {
  white-space: pre-wrap;
  word-break: break-all;
}
.tenue {
  opacity: 0.6;
}
</style>

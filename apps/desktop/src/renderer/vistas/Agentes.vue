<script setup lang="ts">
import { Refresh } from '@vicons/ionicons5';
import AvisoPlegable from '../componentes/AvisoPlegable.vue';
import { NAlert, NButton, NFormItem, NIcon, NModal, NSkeleton, type SelectOption } from 'naive-ui';
import Desplegable from '../componentes/Desplegable.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { EstadoAgente, IdAgente } from '../../shared/api';
import { api } from '../api';
import TarjetaAgente from '../componentes/TarjetaAgente.vue';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useAgentes } from '../stores/agentes';
import { useIa } from '../stores/ia';
import { usePreferencias } from '../stores/preferencias';
import { useSitios } from '../stores/sitios';

/**
 * Agentes de IA: detección, instalación, registro del MCP y "Abrir en un proyecto". Todo lo que
 * escribe pasa por un diálogo que muestra qué archivo se toca y su copia; abrir un agente es
 * siempre un clic y la primera vez muestra el aviso de costo.
 */
const t = textos.agentes;
const agentes = useAgentes();
const ia = useIa();
const sitios = useSitios();
const preferencias = usePreferencias();
const route = useRoute();
const router = useRouter();
const { ejecutar, ocupado } = useAccion();

/** Proyecto que pidió "Abrir agente" desde su tarjeta (`?sitio=<id>`). */
const sitioPedido = computed(() => {
  const id = route.query['sitio'];
  return typeof id === 'string' ? (sitios.porId(id) ?? null) : null;
});

onMounted(() => {
  void ejecutar('cargar', () => agentes.cargar());
  void ia.cargarProveedores();
});

/* ───────────── Confirmación de instalar ───────────── */

type Pedido = { tipo: 'instalar'; agente: EstadoAgente };
const pedido = ref<Pedido | null>(null);

/** Única vía a instalar: el botón del diálogo, con `true` explícito. */
function confirmarPedido(): void {
  const p = pedido.value;
  if (!p) return;
  pedido.value = null;
  const { id, nombre } = p.agente;
  void ejecutar(`instalar:${id}`, () => agentes.instalar(id, true), {
    exito: t.confirmarInstalar.hecho(nombre),
  });
}

/**
 * Registrar el MCP ya no se hace aquí: hay un solo camino de escritura, el de «Conectar
 * asistentes» (con vista previa y confirmación), que se abre con ese cliente enfocado.
 */
function irAConectar(a: EstadoAgente): void {
  void router.push({ name: 'ia', params: { pestana: 'conectar' }, query: { cliente: a.id } });
}

function abrirGuia(a: EstadoAgente): void {
  if (a.guia) void ejecutar('guia', () => api().sistema.abrirUrl(a.guia!));
}

/* ───────────── Abrir en un proyecto ───────────── */

const abrirDe = ref<EstadoAgente | null>(null);
const sitioId = ref<string | null>(null);
/** null = el proveedor que el agente ya tenga configurado (sin clave de WolfCore Dev). */
const proveedorId = ref<string | null>(null);
const avisoCosto = ref(false);

const opcionesSitio = computed<SelectOption[]>(() =>
  [...sitios.lista]
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((s) => ({ value: s.id, label: `${s.nombre} · ${s.dominio}` })),
);
/** Solo los proveedores con clave guardada: la clave es lo que se pasa al agente. */
const opcionesProveedor = computed<SelectOption[]>(() => [
  { value: '', label: t.dialogoAbrir.proveedorPropio },
  ...(ia.proveedores ?? [])
    .filter((p) => p.clave.configurada)
    .map((p) => ({ value: p.id, label: p.nombre })),
]);

function pedirAbrir(a: EstadoAgente): void {
  abrirDe.value = a;
  proveedorId.value = null;
  const elegido = sitioPedido.value?.id ?? sitioId.value;
  sitioId.value = sitios.lista.some((s) => s.id === elegido)
    ? elegido
    : (sitios.lista[0]?.id ?? null);
}

/** Primera vez: aviso de costo antes de abrir (y queda guardado que ya se vio). */
function aceptarAbrir(): void {
  if (!abrirDe.value || !sitioId.value) return;
  if (!preferencias.avisoCostoAgentes) {
    avisoCosto.value = true;
    return;
  }
  abrir();
}

function aceptarCosto(): void {
  avisoCosto.value = false;
  void preferencias.marcarAvisoCostoAgentes().catch(() => undefined);
  abrir();
}

function abrir(): void {
  const a = abrirDe.value;
  const sitio = sitioId.value;
  if (!a || !sitio) return;
  abrirDe.value = null;
  const proveedor = proveedorId.value || undefined;
  void ejecutar(`abrir:${a.id}`, () => agentes.abrir(a.id as IdAgente, sitio, proveedor), {
    exito: t.dialogoAbrir.hecho(a.nombre),
  });
}
</script>

<template>
  <div class="agentes">
    <div class="cabecera">
      <p class="descripcion">{{ t.descripcion }}</p>
      <NButton
        secondary
        :loading="agentes.cargando"
        @click="ejecutar('cargar', () => agentes.cargar())"
      >
        <template #icon
          ><NIcon><Refresh /></NIcon
        ></template>
        {{ t.recargar }}
      </NButton>
    </div>

    <AvisoPlegable :titulo="t.notaMcpTitulo" class="nota-mcp">{{ t.notaMcp }}</AvisoPlegable>
    <NAlert v-if="sitioPedido" type="success" :show-icon="false">
      {{ t.sitioElegido(sitioPedido.nombre || sitioPedido.dominio) }}
    </NAlert>

    <div v-if="!agentes.cargado" class="rejilla">
      <NSkeleton v-for="i in 3" :key="i" height="180px" :sharp="false" />
    </div>
    <div v-else class="rejilla">
      <TarjetaAgente
        v-for="a in agentes.estados"
        :key="a.id"
        :agente="a"
        :instalando="agentes.instalando(a.id)"
        :ocupado-version="ocupado(`version:${a.id}`)"
        @instalar="pedido = { tipo: 'instalar', agente: a }"
        @guia="abrirGuia(a)"
        @version="ejecutar(`version:${a.id}`, () => agentes.preguntarVersion(a.id))"
        @conectar="irAConectar(a)"
        @abrir="pedirAbrir(a)"
      />
    </div>

    <!-- Instalar: qué se instala y de dónde. -->
    <NModal
      :show="pedido !== null"
      preset="dialog"
      :title="pedido ? t.confirmarInstalar.titulo(pedido.agente.nombre) : ''"
      :positive-text="t.confirmarInstalar.aceptar"
      :negative-text="textos.acciones.cancelar"
      :positive-button-props="{ type: 'primary' }"
      :auto-focus="false"
      @positive-click="confirmarPedido"
      @negative-click="pedido = null"
      @update:show="(v: boolean) => !v && (pedido = null)"
    >
      <template v-if="pedido">
        <p>{{ t.confirmarInstalar.texto(pedido.agente.paquete ?? '') }}</p>
        <p class="tenue">{{ t.confirmarInstalar.aislado }}</p>
      </template>
    </NModal>

    <!-- Abrir en un proyecto: proyecto y, si se quiere, un proveedor con clave guardada. -->
    <NModal
      :show="abrirDe !== null"
      preset="dialog"
      :title="abrirDe ? t.dialogoAbrir.titulo(abrirDe.nombre) : ''"
      :positive-text="t.dialogoAbrir.aceptar"
      :negative-text="textos.acciones.cancelar"
      :positive-button-props="{ disabled: !sitioId }"
      :auto-focus="false"
      @positive-click="aceptarAbrir"
      @negative-click="abrirDe = null"
      @update:show="(v: boolean) => !v && (abrirDe = null)"
    >
      <NFormItem :label="t.dialogoAbrir.proyecto" :show-feedback="false">
        <Desplegable
          v-model:value="sitioId"
          :options="opcionesSitio"
          :placeholder="t.dialogoAbrir.sinProyectos"
          filterable
        />
      </NFormItem>
      <NFormItem :label="t.dialogoAbrir.proveedor" :show-feedback="false" class="campo">
        <Desplegable
          :value="proveedorId ?? ''"
          :options="opcionesProveedor"
          @update:value="(v: string) => (proveedorId = v || null)"
        />
      </NFormItem>
      <p class="tenue">{{ t.dialogoAbrir.proveedorAyuda }}</p>
    </NModal>

    <!-- Aviso de costo: solo la primera vez que se abre un agente. -->
    <NModal
      :show="avisoCosto"
      preset="dialog"
      type="warning"
      :title="t.costo.titulo"
      :positive-text="t.costo.aceptar"
      :negative-text="textos.acciones.cancelar"
      :auto-focus="false"
      @positive-click="aceptarCosto"
      @negative-click="avisoCosto = false"
      @update:show="(v: boolean) => !v && (avisoCosto = false)"
    >
      <p>{{ t.costo.texto }}</p>
      <p class="tenue">{{ t.costo.nunca }}</p>
    </NModal>
  </div>
</template>

<style scoped>
.agentes {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.descripcion {
  margin: 0;
  opacity: 0.75;
  max-width: 70ch;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
.archivo {
  display: block;
  margin: 4px 0 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12px;
  word-break: break-all;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.76;
}
.campo {
  margin-top: 10px;
}
</style>

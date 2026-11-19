<script setup lang="ts">
import {
  Add,
  CreateOutline,
  DocumentText,
  FolderOpen,
  TrashOutline,
  Warning,
} from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSwitch,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
} from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { EstadoProcesoPublico, ResultadoAplicar, Sitio } from '../../shared/api';
import { api, plano } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import {
  conProceso,
  errorProceso,
  fuenteProceso,
  idProceso,
  partirComando,
  procesoVacio,
  requiereReinicio,
  unirComando,
  type ProcesoProyectoPublico,
} from '../utilidades/proyectos';
import PanelProgreso from './PanelProgreso.vue';

/** Procesos supervisados del proyecto: interruptor, estado, log en vivo y edición. */
const props = defineProps<{ sitio: Sitio }>();
const emit = defineEmits<{ aplicado: [resultado: ResultadoAplicar] }>();

const t = es.proyectos.procesos;
const dialog = useDialog();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const estados = ref<EstadoProcesoPublico[]>([]);
const estadoDe = (id: string): EstadoProcesoPublico | undefined =>
  estados.value.find((e) => e.procesoId === id);
const encendido = (id: string): boolean => {
  const e = estadoDe(id)?.estado;
  return e === 'encendido' || e === 'iniciando';
};

async function cargar(): Promise<void> {
  try {
    estados.value = await api().procesos.estados(props.sitio.id);
  } catch {
    estados.value = [];
  }
}

let reloj: ReturnType<typeof setTimeout> | undefined;
function cargarPronto(): void {
  clearTimeout(reloj);
  reloj = setTimeout(() => void cargar(), 250);
}

/* ───── Log en vivo ───── */

const abierto = ref<string | null>(null);
const lineas = ref<string[]>([]);
const lineasPanel = computed(() => lineas.value.map((texto, n) => ({ n, texto })));
let siguiendo: string | null = null;

async function dejarDeSeguir(): Promise<void> {
  const f = siguiendo;
  siguiendo = null;
  if (f)
    await api()
      .registros.dejar(f)
      .catch(() => undefined);
}

async function alternarLog(procesoId: string): Promise<void> {
  await dejarDeSeguir();
  if (abierto.value === procesoId) {
    abierto.value = null;
    return;
  }
  abierto.value = procesoId;
  lineas.value = [];
  const fuente = fuenteProceso(props.sitio.id, procesoId);
  try {
    lineas.value = await api().registros.leerFinal(fuente, 200);
    await api().registros.seguir(fuente);
    siguiendo = fuente;
  } catch {
    // Sin log todavía (el proceso nunca arrancó): queda vacío.
  }
}

function abrirCarpetaLog(procesoId: string): void {
  void ejecutar('carpetaLog', () =>
    api().registros.abrirCarpeta(fuenteProceso(props.sitio.id, procesoId)),
  );
}

let bajas: (() => void)[] = [];
onMounted(() => {
  void cargar();
  const prefijo = `proy-${props.sitio.id}-`;
  bajas = [
    api().on('servicio:estado', (e) => {
      if (e.id.startsWith(prefijo)) cargarPronto();
    }),
    api().on('registro:lineas', (d) => {
      if (d.id === siguiendo) lineas.value = [...lineas.value, ...d.lineas].slice(-1000);
    }),
  ];
});
onBeforeUnmount(() => {
  clearTimeout(reloj);
  bajas.forEach((b) => b());
  void dejarDeSeguir();
});
watch(
  () => props.sitio.procesos,
  () => cargarPronto(),
  { deep: true },
);

/* ───── Encender / apagar ───── */

function alternar(procesoId: string, valor: boolean): void {
  void ejecutar(`p:${procesoId}`, async () => {
    if (valor) await api().procesos.iniciar(props.sitio.id, procesoId);
    else await api().procesos.detener(props.sitio.id, procesoId);
    await cargar();
  });
}

/* ───── Edición ───── */

const editando = ref<ProcesoProyectoPublico | null>(null);
const idOriginal = ref<string | null>(null);
const comandoTexto = ref('');
const intentado = ref(false);
const guardando = ref(false);

function nuevo(): void {
  editando.value = procesoVacio();
  idOriginal.value = null;
  comandoTexto.value = '';
  intentado.value = false;
}
function editar(p: ProcesoProyectoPublico): void {
  editando.value = plano(p);
  idOriginal.value = p.id;
  comandoTexto.value = unirComando(p.comando);
  intentado.value = false;
}

const borrador = computed<ProcesoProyectoPublico | null>(() => {
  const e = editando.value;
  if (!e) return null;
  const otros = props.sitio.procesos.filter((p) => p.id !== idOriginal.value);
  const id =
    idOriginal.value ??
    idProceso(
      e.nombre || comandoTexto.value,
      otros.map((p) => p.id),
    );
  return {
    ...e,
    id,
    nombre: e.nombre.trim(),
    comando: partirComando(comandoTexto.value),
    cwd: e.cwd.trim() || 'raiz',
  };
});
const errorForm = computed(() => {
  const b = borrador.value;
  if (!b) return null;
  return errorProceso(
    b,
    props.sitio.procesos.filter((p) => p.id !== idOriginal.value),
  );
});
const original = computed(() =>
  idOriginal.value ? props.sitio.procesos.find((p) => p.id === idOriginal.value) : undefined,
);
const avisoReinicio = computed(
  () =>
    !!original.value &&
    !!borrador.value &&
    encendido(original.value.id) &&
    requiereReinicio(original.value, borrador.value),
);

async function guardarProceso(): Promise<void> {
  intentado.value = true;
  const b = borrador.value;
  if (!b || errorForm.value || guardando.value) return;
  guardando.value = true;
  const reiniciar = avisoReinicio.value;
  try {
    await guardarProcesos(conProceso(props.sitio.procesos, b, idOriginal.value ?? undefined));
    editando.value = null;
    if (reiniciar) message.warning(t.reinicieAhora, { duration: 8000 });
    else message.success(t.guardado);
  } catch (e) {
    message.error(mensajeDeError(e));
  } finally {
    guardando.value = false;
  }
}

async function guardarProcesos(procesos: ProcesoProyectoPublico[]): Promise<void> {
  const { id, ...resto } = props.sitio;
  const r = await api().sitios.guardar(plano({ ...resto, procesos }), id);
  emit('aplicado', r.aplicar);
}

function quitar(p: ProcesoProyectoPublico): void {
  dialog.warning({
    title: t.quitarTitulo(p.nombre || p.id),
    content: t.quitarTexto,
    positiveText: es.acciones.quitar,
    negativeText: es.acciones.cancelar,
    positiveButtonProps: { type: 'error' },
    autoFocus: false,
    onPositiveClick: async () => {
      try {
        await guardarProcesos(props.sitio.procesos.filter((x) => x.id !== p.id));
      } catch (e) {
        message.error(mensajeDeError(e));
      }
    },
  });
}
</script>

<template>
  <div class="procesos">
    <div class="cabecera">
      <span class="titulo">{{ t.titulo }}</span>
      <NButton size="tiny" quaternary @click="nuevo">
        <template #icon
          ><NIcon><Add /></NIcon
        ></template>
        {{ t.agregar }}
      </NButton>
    </div>
    <p v-if="!sitio.procesos.length" class="vacio">{{ t.ninguno }}</p>
    <ul v-else class="lista">
      <li v-for="p in sitio.procesos" :key="p.id" class="proceso">
        <div class="fila">
          <NSwitch
            size="small"
            :value="encendido(p.id)"
            :loading="ocupado(`p:${p.id}`) || estadoDe(p.id)?.estado === 'iniciando'"
            :aria-label="t.interruptor(p.nombre || p.id)"
            @update:value="(v: boolean) => alternar(p.id, v)"
          />
          <span class="nombre">{{ p.nombre || p.id }}</span>
          <code class="comando" :title="unirComando(p.comando)">{{ unirComando(p.comando) }}</code>
          <NTag
            v-if="estadoDe(p.id)?.puerto ?? p.puerto"
            size="tiny"
            :bordered="false"
            class="mono"
          >
            {{ t.puerto((estadoDe(p.id)?.puerto ?? p.puerto)!) }}
          </NTag>
          <NTooltip v-if="estadoDe(p.id)?.proxy ?? p.proxy">
            <template #trigger>
              <NTag size="tiny" type="info" :bordered="false">{{ t.proxy }}</NTag>
            </template>
            {{ t.proxyAyuda }}
          </NTooltip>
          <span v-if="estadoDe(p.id)" class="estado" :class="`e-${estadoDe(p.id)!.estado}`">
            {{ t.estados[estadoDe(p.id)!.estado] ?? estadoDe(p.id)!.estado }}
            <template v-if="estadoDe(p.id)!.reinicios">
              · {{ t.reinicios(estadoDe(p.id)!.reinicios) }}
            </template>
          </span>
          <span class="espacio" />
          <NButton
            size="tiny"
            quaternary
            :aria-expanded="abierto === p.id"
            @click="alternarLog(p.id)"
          >
            <template #icon
              ><NIcon><DocumentText /></NIcon
            ></template>
            {{ abierto === p.id ? t.ocultarLog : t.verLog }}
          </NButton>
          <NButton
            size="tiny"
            quaternary
            :aria-label="t.editar"
            :title="t.editar"
            @click="editar(p)"
          >
            <template #icon
              ><NIcon><CreateOutline /></NIcon
            ></template>
          </NButton>
          <NButton
            size="tiny"
            quaternary
            :aria-label="t.quitar"
            :title="t.quitar"
            @click="quitar(p)"
          >
            <template #icon
              ><NIcon><TrashOutline /></NIcon
            ></template>
          </NButton>
        </div>
        <p
          v-if="estadoDe(p.id)?.mensaje"
          class="mensaje"
          :class="{ error: estadoDe(p.id)!.estado === 'error' }"
        >
          {{ estadoDe(p.id)!.mensaje }}
        </p>
        <ul v-if="estadoDe(p.id)?.avisos.length" class="avisos">
          <li v-for="(a, i) in estadoDe(p.id)!.avisos" :key="i">
            <NIcon aria-hidden="true"><Warning /></NIcon>{{ a }}
          </li>
        </ul>
        <div v-if="abierto === p.id" class="log">
          <PanelProgreso
            :lineas="lineasPanel"
            :limite="1000"
            :alto="200"
            :etiqueta="p.nombre || p.id"
          />
          <NButton size="tiny" quaternary @click="abrirCarpetaLog(p.id)">
            <template #icon
              ><NIcon><FolderOpen /></NIcon
            ></template>
            {{ t.abrirCarpetaLog }}
          </NButton>
        </div>
      </li>
    </ul>

    <NModal
      :show="editando !== null"
      preset="card"
      :title="idOriginal ? t.editar : t.nuevo"
      :style="{ width: '520px', maxWidth: 'calc(100vw - 32px)' }"
      :auto-focus="false"
      @update:show="(v: boolean) => !v && !guardando && (editando = null)"
    >
      <form v-if="editando" class="form" @submit.prevent="guardarProceso">
        <label class="campo">
          <span>{{ t.nombre }}</span>
          <NInput v-model:value="editando.nombre" size="small" :placeholder="t.nombrePlaceholder" />
        </label>
        <label class="campo">
          <span>{{ t.comando }}</span>
          <NInput
            v-model:value="comandoTexto"
            size="small"
            class="mono"
            :placeholder="t.comandoPlaceholder"
            :input-props="{ spellcheck: false }"
          />
          <small>{{ t.comandoAyuda }}</small>
        </label>
        <div class="dos">
          <label class="campo">
            <span>{{ t.cwd }}</span>
            <NInput v-model:value="editando.cwd" size="small" class="mono" />
            <small>{{ t.cwdAyuda }}</small>
          </label>
          <label class="campo">
            <span>{{ t.puertoCampo }}</span>
            <NInputNumber
              v-model:value="editando.puerto"
              size="small"
              :min="1"
              :max="65535"
              :show-button="false"
              clearable
            />
            <small>{{ t.puertoAyuda }}</small>
          </label>
        </div>
        <NCheckbox v-model:checked="editando.proxy">{{ t.esProxy }}</NCheckbox>
        <NCheckbox v-model:checked="editando.autoIniciar">{{ t.autoIniciar }}</NCheckbox>
        <NCheckbox v-model:checked="editando.reiniciar">{{ t.reiniciar }}</NCheckbox>
        <NAlert v-if="avisoReinicio" type="warning" :show-icon="true">{{
          t.requiereReinicio
        }}</NAlert>
        <p v-if="intentado && errorForm" class="error">{{ errorForm }}</p>
        <button type="submit" hidden />
      </form>
      <template #footer>
        <div class="pie">
          <NButton :disabled="guardando" @click="editando = null">{{
            es.acciones.cancelar
          }}</NButton>
          <NButton type="primary" :loading="guardando" @click="guardarProceso">
            {{ es.acciones.guardar }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.procesos {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.titulo {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
}
.vacio {
  margin: 0;
  font-size: 12px;
  opacity: 0.55;
}
.lista {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.proceso {
  list-style: none;
}
.fila {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  min-width: 0;
}
.nombre {
  font-weight: 600;
}
.comando,
.mono {
  font-family: var(--fuente-mono);
}
.comando {
  font-size: 11.5px;
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  max-width: 260px;
}
.estado {
  font-size: 11.5px;
  opacity: 0.7;
}
.estado.e-encendido {
  color: #16a34a;
  opacity: 1;
}
.estado.e-error {
  color: #dc2626;
  opacity: 1;
}
.espacio {
  flex: 1;
}
.mensaje {
  margin: 2px 0 0 44px;
  font-size: 12px;
  opacity: 0.75;
  white-space: pre-wrap;
  word-break: break-word;
}
.mensaje.error {
  color: #dc2626;
  opacity: 1;
}
.avisos {
  margin: 2px 0 0 44px;
  padding: 0;
  font-size: 12px;
  color: #b45309;
}
.avisos li {
  list-style: none;
  display: flex;
  gap: 4px;
  align-items: flex-start;
}
.avisos .n-icon {
  margin-top: 2px;
  flex: none;
}
.log {
  margin: 6px 0 4px 44px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.log > :first-child {
  align-self: stretch;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
.campo > span {
  opacity: 0.7;
}
.campo small {
  opacity: 0.55;
}
.dos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.error {
  margin: 0;
  color: #dc2626;
  font-size: 12.5px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

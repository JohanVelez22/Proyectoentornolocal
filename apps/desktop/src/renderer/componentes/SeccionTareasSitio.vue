<script setup lang="ts">
import { ChevronDown, Play, Add, Create, Trash, DocumentText } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NIcon,
  NModal,
  NSkeleton,
  NSwitch,
  NTag,
  NTooltip,
  useDialog,
} from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type {
  EjecucionTarea,
  EstadoPlanificador,
  PropuestaTarea,
  Sitio,
  VistaTarea,
} from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { localeIntl, textos } from '../i18n';
import {
  comandoATexto,
  duracionCorta,
  presetDeCron,
  textoHora,
  tipoEstadoEjecucion,
  type ModoTarea,
} from '../utilidades/tareas';
import DialogoTarea from './DialogoTarea.vue';

/**
 * Tareas programadas del proyecto (D29): un comando del proyecto con un horario cron. Solo corren
 * mientras la aplicación está abierta, en proyectos de confianza y con el comando confirmado.
 * Se carga al desplegar la sección (calcular el estado de cada tarea lee la receta del proyecto).
 */
const props = defineProps<{ sitio: Sitio }>();

const t = textos.tareas;
const dialog = useDialog();
const { ejecutar, ocupado } = useAccion();

const abierto = ref(false);
const vistas = ref<VistaTarea[]>([]);
const propuestas = ref<PropuestaTarea[]>([]);
const plan = ref<EstadoPlanificador | null>(null);
const cargado = ref(false);
const idPanel = computed(() => `tareas-${props.sitio.id}`);
const cuantas = computed(() =>
  cargado.value ? vistas.value.length : (props.sitio.tareas?.length ?? 0),
);

async function cargar(): Promise<void> {
  const sitioId = props.sitio.id;
  const [v, p, e] = await Promise.all([
    api().tareas.lista(sitioId),
    // Un wolfcore.yml roto no impide ver ni usar las tareas del sitio.
    api()
      .tareas.propuestas(sitioId)
      .catch(() => [] as PropuestaTarea[]),
    api().tareas.estado(),
  ]);
  if (props.sitio.id !== sitioId) return;
  vistas.value = v;
  propuestas.value = p;
  plan.value = e;
  cargado.value = true;
}

async function recargar(): Promise<void> {
  await ejecutar('cargar', cargar, { tituloError: t.errorCargar });
}

watch(abierto, (v) => {
  if (v) void recargar();
});

// Una ejecución terminó (programada o a mano): se vuelve a leer el estado y la próxima.
let baja: (() => void) | null = null;
onMounted(() => {
  baja = api().on('tarea:terminada', (e) => {
    if (abierto.value && e.sitioId === props.sitio.id) void cargar().catch(() => undefined);
  });
});
onBeforeUnmount(() => baja?.());

/* ───────────── Presentación ───────────── */

const fecha = (iso: string): string =>
  new Date(iso).toLocaleString(localeIntl.value, { dateStyle: 'medium', timeStyle: 'short' });

function describir(cron: string): string {
  const p = presetDeCron(cron);
  switch (p.tipo) {
    case 'cadaMinuto':
      return t.describir.cadaMinuto;
    case 'cadaN':
      return t.describir.cadaN(p.minutos);
    case 'cadaHora':
      return t.describir.cadaHora;
    case 'diaria':
      return t.describir.diaria(textoHora(p.hora, p.minuto));
    case 'laborables':
      return t.describir.laborables(textoHora(p.hora, p.minuto));
    case 'personalizada':
      return t.describir.personalizada(p.expr);
  }
}

const motivoTexto = (m: string): string =>
  (t.motivo as Record<string, string>)[m] ?? t.motivo.error;

const estadoTexto = (e: string): string => (t.estado as Record<string, string>)[e] ?? e;

/* ───────────── Acciones ───────────── */

async function activar(v: VistaTarea, valor: boolean): Promise<void> {
  if (ocupado(`activar-${v.tarea.id}`)) return;
  await ejecutar(`activar-${v.tarea.id}`, async () => {
    await api().tareas.activar(props.sitio.id, v.tarea.id, valor);
    await cargar();
  });
}

async function ejecutarAhora(v: VistaTarea): Promise<void> {
  if (ocupado(`correr-${v.tarea.id}`)) return;
  const r = await ejecutar(`correr-${v.tarea.id}`, () =>
    api().tareas.ejecutarAhora(props.sitio.id, v.tarea.id),
  );
  await cargar().catch(() => undefined);
  if (r) {
    dialog[r.estado === 'ok' ? 'success' : 'warning']({
      title: t.resultadoTitulo(v.tarea.nombre),
      content: `${estadoTexto(r.estado)}${r.codigo !== null ? ` (${t.codigo(r.codigo)})` : ''} · ${duracionCorta(r.duracionMs)}`,
      positiveText: t.acciones.verRegistro,
      negativeText: textos.acciones.cerrar,
      onPositiveClick: () => void abrirRegistro(v),
    });
  }
}

function confirmarBorrar(v: VistaTarea): void {
  dialog.warning({
    title: t.borrar.titulo(v.tarea.nombre),
    content: t.borrar.texto,
    positiveText: t.borrar.confirmar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      await ejecutar(
        `borrar-${v.tarea.id}`,
        async () => {
          await api().tareas.borrar(props.sitio.id, v.tarea.id);
          await cargar();
        },
        { exito: t.borrar.hecho(v.tarea.nombre) },
      );
    },
  });
}

function confirmarAYml(v: VistaTarea): void {
  dialog.info({
    title: t.yml.escribirTitulo,
    content: t.yml.escribirTexto,
    positiveText: t.yml.escribir,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: async () => {
      await ejecutar(
        `yml-${v.tarea.id}`,
        async () => {
          await api().tareas.aWolfcoreYml(props.sitio.id, v.tarea.id);
          await cargar();
        },
        { exito: t.yml.escrita },
      );
    },
  });
}

function permitirAislado(): void {
  dialog.warning({
    title: t.aislado.confirmarTitulo,
    content: t.aislado.confirmarTexto,
    positiveText: t.aislado.permitir,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: async () => {
      await ejecutar(
        'aislado',
        async () => {
          await api().tareas.permitirAislado();
          await cargar();
        },
        { exito: t.aislado.permitido },
      );
    },
  });
}

/* ───────────── Diálogo de alta y edición ───────────── */

const dialogoAbierto = ref(false);
const modo = ref<ModoTarea>('nueva');
const enEdicion = ref<VistaTarea | null>(null);
const enPropuesta = ref<PropuestaTarea | null>(null);

function abrirDialogo(
  m: ModoTarea,
  v: VistaTarea | null = null,
  p: PropuestaTarea | null = null,
): void {
  modo.value = m;
  enEdicion.value = v;
  enPropuesta.value = p;
  dialogoAbierto.value = true;
}

/* ───────────── Historial y registro ───────────── */

const registroAbierto = ref(false);
const registroDe = ref<VistaTarea | null>(null);
const historial = ref<EjecucionTarea[]>([]);
const lineas = ref<string[]>([]);

async function abrirRegistro(v: VistaTarea): Promise<void> {
  registroDe.value = v;
  historial.value = [];
  lineas.value = [];
  registroAbierto.value = true;
  const [h, l] = await Promise.all([
    ejecutar('historial', () => api().tareas.historial(props.sitio.id, v.tarea.id)),
    ejecutar('log', () => api().tareas.log(props.sitio.id, v.tarea.id)),
  ]);
  if (registroDe.value?.tarea.id !== v.tarea.id) return;
  historial.value = h ?? [];
  lineas.value = l ?? [];
}
</script>

<template>
  <div class="tareas">
    <div class="cabeza">
      <span class="etiqueta">{{ t.titulo }}</span>
      <span class="tenue">{{ t.resumen(cuantas) }}</span>
      <NButton
        text
        size="tiny"
        type="primary"
        class="desplegar"
        :aria-expanded="abierto"
        :aria-controls="idPanel"
        @click="abierto = !abierto"
      >
        {{ abierto ? t.ocultar : t.mostrar }}
        <NIcon class="chevron" :class="{ girado: abierto }" aria-hidden="true"
          ><ChevronDown
        /></NIcon>
      </NButton>
    </div>

    <div v-if="abierto" :id="idPanel" class="panel">
      <NAlert type="info" :show-icon="false" class="aviso">{{ t.soloAbierta }}</NAlert>
      <NAlert type="warning" :show-icon="false" class="aviso">{{ t.repoEjecuta }}</NAlert>

      <NAlert v-if="plan?.aislado && !plan.permitido" type="warning" class="aviso">
        <strong>{{ t.aislado.titulo }}</strong> {{ t.aislado.texto }}
        <NButton
          size="tiny"
          type="warning"
          secondary
          :loading="ocupado('aislado')"
          @click="permitirAislado"
        >
          {{ t.aislado.permitir }}
        </NButton>
      </NAlert>

      <div v-if="!cargado" :aria-label="t.cargando" aria-busy="true">
        <NSkeleton text :repeat="2" />
      </div>
      <template v-else>
        <p v-if="vistas.length === 0" class="tenue vacio">{{ t.vacio }}</p>
        <ul v-else class="lista">
          <li v-for="v in vistas" :key="v.tarea.id" class="tarea">
            <div class="fila-principal">
              <NSwitch
                size="small"
                :value="v.tarea.activa"
                :loading="ocupado(`activar-${v.tarea.id}`)"
                :aria-label="t.acciones.activar(v.tarea.nombre)"
                @update:value="(x: boolean) => activar(v, x)"
              />
              <div class="texto">
                <strong class="nombre">{{ v.tarea.nombre }}</strong>
                <span class="cuando">{{ describir(v.tarea.cron) }}</span>
                <code class="comando">{{ comandoATexto(v.tarea.comando) }}</code>
              </div>
              <div class="botones">
                <NTooltip>
                  <template #trigger>
                    <NButton
                      size="tiny"
                      quaternary
                      circle
                      :disabled="v.bloqueo !== null || v.enCurso"
                      :loading="ocupado(`correr-${v.tarea.id}`) || v.enCurso"
                      :aria-label="t.acciones.ejecutar"
                      @click="ejecutarAhora(v)"
                    >
                      <template #icon
                        ><NIcon><Play /></NIcon
                      ></template>
                    </NButton>
                  </template>
                  {{ t.acciones.ejecutar }}
                </NTooltip>
                <NTooltip>
                  <template #trigger>
                    <NButton
                      size="tiny"
                      quaternary
                      circle
                      :aria-label="t.acciones.verRegistro"
                      @click="abrirRegistro(v)"
                    >
                      <template #icon
                        ><NIcon><DocumentText /></NIcon
                      ></template>
                    </NButton>
                  </template>
                  {{ t.acciones.verRegistro }}
                </NTooltip>
                <NTooltip>
                  <template #trigger>
                    <NButton
                      size="tiny"
                      quaternary
                      circle
                      :aria-label="t.acciones.editar"
                      @click="abrirDialogo('editar', v)"
                    >
                      <template #icon
                        ><NIcon><Create /></NIcon
                      ></template>
                    </NButton>
                  </template>
                  {{ t.acciones.editar }}
                </NTooltip>
                <NTooltip>
                  <template #trigger>
                    <NButton
                      size="tiny"
                      quaternary
                      circle
                      :aria-label="t.acciones.borrar"
                      @click="confirmarBorrar(v)"
                    >
                      <template #icon
                        ><NIcon><Trash /></NIcon
                      ></template>
                    </NButton>
                  </template>
                  {{ t.acciones.borrar }}
                </NTooltip>
              </div>
            </div>
            <div class="fila-estado">
              <NTag v-if="v.enCurso" size="small" type="info" :bordered="false">{{
                t.enCurso
              }}</NTag>
              <NTag
                v-else-if="v.ultima"
                size="small"
                :type="tipoEstadoEjecucion(v.ultima.estado)"
                :bordered="false"
              >
                {{ estadoTexto(v.ultima.estado) }}
              </NTag>
              <span v-if="v.ultima" class="tenue">{{ t.ultima(fecha(v.ultima.inicio)) }}</span>
              <span v-else class="tenue">{{ t.nunca }}</span>
              <span v-if="v.proxima" class="tenue">· {{ t.proxima(fecha(v.proxima)) }}</span>
              <span v-else-if="!v.tarea.activa" class="tenue">· {{ t.pausada }}</span>
              <span class="tenue">· {{ t.origen[v.tarea.origen] }}</span>
              <NButton
                v-if="v.tarea.origen !== 'wolfcore.yml'"
                text
                size="tiny"
                type="primary"
                :loading="ocupado(`yml-${v.tarea.id}`)"
                @click="confirmarAYml(v)"
              >
                {{ t.yml.guardarEn }}
              </NButton>
            </div>
            <NAlert v-if="v.bloqueo" type="warning" :show-icon="false" class="bloqueo">
              {{ motivoTexto(v.bloqueo) }}
              <NButton
                v-if="v.bloqueo === 'sin_confirmar'"
                size="tiny"
                type="warning"
                secondary
                @click="abrirDialogo('confirmar', v)"
              >
                {{ t.acciones.revisarConfirmar }}
              </NButton>
            </NAlert>
          </li>
        </ul>

        <NButton size="small" secondary class="nueva" @click="abrirDialogo('nueva')">
          <template #icon
            ><NIcon><Add /></NIcon
          ></template>
          {{ t.nueva }}
        </NButton>

        <section v-if="propuestas.length" class="propuestas">
          <h4 class="subtitulo">{{ t.yml.titulo }}</h4>
          <p class="tenue">{{ t.yml.texto }}</p>
          <ul class="lista">
            <li v-for="p in propuestas" :key="p.id" class="tarea">
              <div class="fila-principal">
                <div class="texto">
                  <strong class="nombre">{{ p.nombre }}</strong>
                  <span class="cuando">{{ describir(p.cron) }}</span>
                  <code class="comando">{{ comandoATexto(p.comando) }}</code>
                </div>
                <NTag
                  size="small"
                  :type="
                    p.estado === 'adoptada'
                      ? 'success'
                      : p.estado === 'cambiada'
                        ? 'warning'
                        : 'default'
                  "
                  :bordered="false"
                >
                  {{ t.yml.estado[p.estado] }}
                </NTag>
                <NButton
                  size="tiny"
                  secondary
                  :disabled="!!p.error || p.estado === 'adoptada'"
                  @click="abrirDialogo('adoptar', null, p)"
                >
                  {{ t.yml.revisar }}
                </NButton>
              </div>
              <p v-if="p.error" class="tenue error">
                {{
                  textos.errores.codigos[p.error as keyof typeof textos.errores.codigos] ?? p.error
                }}
              </p>
              <p v-else-if="p.estado === 'cambiada'" class="tenue">{{ t.yml.cambiada }}</p>
            </li>
          </ul>
        </section>
      </template>
    </div>

    <DialogoTarea
      v-model:show="dialogoAbierto"
      :sitio-id="sitio.id"
      :modo="modo"
      :tarea="enEdicion"
      :propuesta="enPropuesta"
      @guardado="recargar"
    />

    <NModal
      v-model:show="registroAbierto"
      preset="card"
      :title="t.registro.titulo(registroDe?.tarea.nombre ?? '')"
      size="small"
      :bordered="false"
      :style="{ width: '720px', maxWidth: 'calc(100vw - 32px)' }"
    >
      <h4 class="subtitulo">{{ t.registro.historial }}</h4>
      <p v-if="historial.length === 0" class="tenue">{{ t.registro.sinHistorial }}</p>
      <ul v-else class="historial">
        <li v-for="(h, i) in historial" :key="i">
          <NTag size="small" :type="tipoEstadoEjecucion(h.estado)" :bordered="false">{{
            estadoTexto(h.estado)
          }}</NTag>
          <span>{{ fecha(h.inicio) }}</span>
          <span class="tenue">{{ duracionCorta(h.duracionMs) }}</span>
          <span class="tenue">{{ t.registro.origen[h.origen] }}</span>
          <span v-if="h.motivo" class="tenue">{{ motivoTexto(h.motivo) }}</span>
        </li>
      </ul>
      <h4 class="subtitulo">{{ t.registro.salida }}</h4>
      <p v-if="lineas.length === 0" class="tenue">{{ t.registro.sinSalida }}</p>
      <pre v-else class="salida" tabindex="0">{{ lineas.join('\n') }}</pre>
      <p class="tenue">{{ t.registro.enmascarado }}</p>
    </NModal>
  </div>
</template>

<style scoped>
.tareas {
  padding: 8px 0;
}
.cabeza {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.etiqueta {
  font-size: 13px;
  font-weight: 600;
}
.tenue {
  font-size: 12.5px;
  opacity: 0.7;
}
.chevron {
  transition: transform 0.15s ease;
}
.chevron.girado {
  transform: rotate(180deg);
}
.panel {
  margin-top: 8px;
}
.aviso {
  margin-bottom: 8px;
}
.lista {
  margin: 0 0 8px;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}
.tarea {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.2);
}
.fila-principal {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.texto {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nombre {
  font-size: 13.5px;
}
.cuando {
  font-size: 12.5px;
}
.comando {
  font-size: 12px;
  overflow-wrap: anywhere;
  opacity: 0.8;
}
.botones {
  display: flex;
  gap: 2px;
}
.fila-estado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.bloqueo {
  margin-top: 6px;
}
.nueva {
  margin-top: 4px;
}
.vacio {
  margin: 4px 0 8px;
}
.propuestas {
  margin-top: 14px;
}
.subtitulo {
  margin: 8px 0 4px;
  font-size: 13px;
}
.error {
  color: var(--texto-error, #d03050);
  opacity: 1;
}
.historial {
  margin: 0 0 8px;
  padding: 0;
  list-style: none;
  max-height: 180px;
  overflow: auto;
  display: grid;
  gap: 4px;
  font-size: 12.5px;
}
.historial li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.salida {
  margin: 0 0 8px;
  max-height: 260px;
  overflow: auto;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>

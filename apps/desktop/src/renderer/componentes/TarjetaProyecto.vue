<script setup lang="ts">
import {
  CopyOutline,
  Construct,
  CreateOutline,
  DocumentText,
  EllipsisHorizontal,
  FolderOpen,
  LockClosed,
  Open,
  ShieldCheckmark,
  CodeSlash,
  Terminal,
  TrashOutline,
  Warning,
} from '@vicons/ionicons5';
import {
  NButton,
  NDropdown,
  NIcon,
  NProgress,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
  useNotification,
  type DropdownOption,
} from 'naive-ui';
import { computed, h, onMounted, ref, type Component } from 'vue';
import type { ResultadoAplicar, Sitio } from '../../shared/api';
import { api } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { useHosts } from '../stores/hosts';
import { useHttps } from '../stores/https';
import { useProyectos } from '../stores/proyectos';
import { useServicios } from '../stores/servicios';
import {
  derivarEstadoSitio,
  estadoHttpsSitio,
  urlHttps,
  urlLocal,
  usaPhp,
  usaProxy,
} from '../utilidades/sitios';
import { avanceReceta, etiquetaPaso } from '../utilidades/proyectos';
import EstadoPunto from './EstadoPunto.vue';
import GitProyecto from './GitProyecto.vue';
import ProcesosProyecto from './ProcesosProyecto.vue';
import InterruptorTunel from './InterruptorTunel.vue';
import SeccionFtpSitio from './SeccionFtpSitio.vue';

const props = defineProps<{ sitio: Sitio }>();
const emit = defineEmits<{
  editar: [sitio: Sitio];
  duplicar: [sitio: Sitio];
  /** Resultado de aplicar tras borrar, para que la vista muestre el aviso de hosts. */
  aplicado: [resultado: ResultadoAplicar];
  /** Abrir el asistente con el progreso de la receta. */
  verPreparacion: [sitio: Sitio];
  /** Volver a revisar la receta (cambió desde que se confió en el proyecto). */
  revisarReceta: [sitio: Sitio];
  verRegistros: [sitio: Sitio];
}>();

const t = es.sitios;
const tp = es.proyectos;
const proyectos = useProyectos();
const th = es.sitioHttps;
const servicios = useServicios();
const hosts = useHosts();
const https = useHttps();
const dialog = useDialog();
const message = useMessage();
const notification = useNotification();
const { ejecutar, ocupado } = useAccion();

const nginx = computed(() => servicios.porId['nginx']);
const estado = computed(() =>
  derivarEstadoSitio(props.sitio, nginx.value?.estado, hosts.pendientes),
);
const nombre = computed(() => props.sitio.nombre || props.sitio.dominio);
const url = computed(() => urlLocal(props.sitio.dominio, nginx.value?.puertos[0]));
const urlSegura = computed(() => urlHttps(props.sitio.dominio, https.estado?.puerto ?? 443));
const estadoHttps = computed(() => estadoHttpsSitio(props.sitio, https.estado));

const icono = (c: Component) => () => h(NIcon, null, { default: () => h(c) });
const opciones: DropdownOption[] = [
  { key: 'editar', label: es.acciones.editar, icon: icono(CreateOutline) },
  { key: 'duplicar', label: es.acciones.duplicar, icon: icono(CopyOutline) },
  { key: 'registros', label: tp.tarjeta.verRegistros, icon: icono(DocumentText) },
  { type: 'divider', key: 'd1' },
  {
    key: 'borrar',
    label: es.acciones.borrar,
    icon: icono(TrashOutline),
    props: { style: { color: '#dc2626' } },
  },
];

function elegir(clave: string | number): void {
  if (clave === 'editar') emit('editar', props.sitio);
  else if (clave === 'duplicar') emit('duplicar', props.sitio);
  else if (clave === 'registros') emit('verRegistros', props.sitio);
  else if (clave === 'borrar') confirmarBorrar();
}

function confirmarBorrar(): void {
  const d = dialog.warning({
    title: t.borrar.titulo(nombre.value),
    content: t.borrar.texto,
    positiveText: es.acciones.borrar,
    negativeText: es.acciones.cancelar,
    autoFocus: false,
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      d.loading = true;
      try {
        const r = await api().sitios.borrar(props.sitio.id);
        message.success(t.borrar.hecho(nombre.value));
        if (!r.nginx.ok) {
          notification.error({
            title: t.borrar.nginxFallo,
            content: r.nginx.salida,
            duration: 15000,
            keepAliveOnHover: true,
          });
        }
        emit('aplicado', r);
        return true;
      } catch (e) {
        notification.error({
          title: es.errores.titulo,
          content: mensajeDeError(e),
          duration: 10000,
          keepAliveOnHover: true,
        });
        return true;
      }
    },
  });
}

/* ───── Receta y runtimes ───── */

const receta = computed(() => proyectos.receta(props.sitio.id));
const avance = computed(() => avanceReceta(receta.value));
const avisosRuntimes = ref<string[]>([]);

onMounted(() => {
  void proyectos.cargarReceta(props.sitio.id).catch(() => undefined);
  void api()
    .runtimes.proyecto(props.sitio.id)
    .then((r) => {
      avisosRuntimes.value = r.avisos;
    })
    .catch(() => undefined);
});

/**
 * "Reinstalar dependencias": repite la receta guardada de la última preparación (lo que el
 * usuario revisó en el asistente). Sin receta guardada, se abre el asistente para revisarla.
 */
function reinstalar(): void {
  const pasos = receta.value.pasos;
  if (!pasos.length) {
    emit('revisarReceta', props.sitio);
    return;
  }
  dialog.info({
    title: tp.tarjeta.reinstalarTitulo(nombre.value),
    content: () =>
      h('div', [
        h('p', { class: 'resumen-texto' }, tp.tarjeta.reinstalarTexto),
        h(
          'ol',
          { class: 'resumen-pasos' },
          pasos.map((p) =>
            h(
              'li',
              p.tipo === 'bd-restaurar'
                ? `${etiquetaPaso(p)} (${tp.tarjeta.noRestaura})`
                : etiquetaPaso(p),
            ),
          ),
        ),
      ]),
    positiveText: tp.tarjeta.ejecutar,
    negativeText: tp.tarjeta.revisarReceta,
    autoFocus: false,
    onPositiveClick: () => {
      proyectos.reinstalar(props.sitio.id).catch((e: unknown) => {
        notification.error({
          title: es.errores.titulo,
          content: mensajeDeError(e),
          duration: 10000,
          keepAliveOnHover: true,
        });
      });
      emit('verPreparacion', props.sitio);
    },
    onNegativeClick: () => {
      emit('revisarReceta', props.sitio);
    },
  });
}

function abrirEditor(): void {
  void ejecutar('editor', () => api().sistema.abrirEditor(props.sitio.id), {
    tituloError: tp.tarjeta.vscodeError,
  });
}

function abrirSitio(): void {
  void ejecutar('abrir', () => api().sistema.abrirUrl(url.value));
}
function abrirSitioHttps(): void {
  void ejecutar('abrirHttps', () => api().sistema.abrirUrl(urlSegura.value));
}
function abrirTerminal(): void {
  if (ocupado('terminal')) return;
  void ejecutar('terminal', () => api().terminal.abrir(props.sitio.id));
}
function abrirCarpeta(): void {
  void ejecutar('carpeta', () => api().sistema.abrirCarpeta(props.sitio.carpeta));
}
</script>

<template>
  <article class="fila" :class="{ reales: sitio.datosReales }">
    <div class="principal">
      <EstadoPunto :estado="estado.punto" :etiqueta="estado.etiqueta" solo-punto class="punto" />
      <div class="cuerpo">
        <div class="linea">
          <h3 class="nombre">{{ nombre }}</h3>
          <NTag size="small" :bordered="false" class="etiqueta">{{
            t.tiposCortos[sitio.tipo]
          }}</NTag>
          <NTag
            v-if="usaPhp(sitio.tipo) && sitio.php"
            size="small"
            :bordered="false"
            class="etiqueta mono"
          >
            {{ t.php(sitio.php) }}
          </NTag>
          <NTag
            v-if="usaProxy(sitio.tipo) && sitio.puertoProxy"
            size="small"
            :bordered="false"
            class="etiqueta mono"
          >
            {{ t.puerto(sitio.puertoProxy) }}
          </NTag>
          <NTooltip v-if="sitio.confiado">
            <template #trigger>
              <NTag size="small" type="success" :bordered="false" class="etiqueta" tabindex="0">
                <template #icon
                  ><NIcon><ShieldCheckmark /></NIcon
                ></template>
                {{ tp.tarjeta.confiado }}
              </NTag>
            </template>
            {{ tp.tarjeta.confiadoAyuda }}
          </NTooltip>
          <NTooltip v-if="sitio.datosReales">
            <template #trigger>
              <NTag size="small" type="error" :bordered="false" class="etiqueta">
                <template #icon
                  ><NIcon><Warning /></NIcon
                ></template>
                {{ t.datosReales }}
              </NTag>
            </template>
            {{ t.datosRealesAyuda }}
          </NTooltip>
          <NTooltip v-if="estado.faltanEnHosts.length">
            <template #trigger>
              <NTag size="small" type="warning" :bordered="false" class="etiqueta">
                <template #icon
                  ><NIcon><Warning /></NIcon
                ></template>
                {{ t.faltaHosts }}
              </NTag>
            </template>
            {{ t.faltaHostsAyuda(estado.faltanEnHosts.join(', ')) }}
          </NTooltip>
          <NTooltip v-if="sitio.https && !estadoHttps.pendiente">
            <template #trigger>
              <NTag size="small" type="success" :bordered="false" class="etiqueta" tabindex="0">
                <template #icon
                  ><NIcon><LockClosed /></NIcon
                ></template>
                {{ th.etiqueta }}
              </NTag>
            </template>
            {{ th.candadoAyuda
            }}<template v-if="sitio.redirigirHttps"> {{ th.redirige }}.</template>
          </NTooltip>
          <NTooltip v-if="estadoHttps.sinConfianza">
            <template #trigger>
              <NTag size="small" type="warning" :bordered="false" class="etiqueta" tabindex="0">
                <template #icon
                  ><NIcon><Warning /></NIcon
                ></template>
                {{ th.sinConfianza }}
              </NTag>
            </template>
            {{ th.sinConfianzaAyuda }}
          </NTooltip>
        </div>
        <div class="linea secundaria">
          <a
            class="dominio"
            :href="url"
            :title="sitio.https ? th.abrirHttp(sitio.dominio) : t.abrirSitio(sitio.dominio)"
            @click.prevent="abrirSitio"
          >
            {{ sitio.https ? url : sitio.dominio }}
          </a>
          <a
            v-if="sitio.https && !estadoHttps.pendiente"
            class="dominio seguro"
            :href="urlSegura"
            :title="th.abrirHttps(urlSegura)"
            @click.prevent="abrirSitioHttps"
          >
            <NIcon class="candado" aria-hidden="true"><LockClosed /></NIcon>
            {{ urlSegura }}
          </a>
          <NTooltip v-if="sitio.alias.length">
            <template #trigger>
              <span class="alias" tabindex="0">{{ t.alias(sitio.alias.length) }}</span>
            </template>
            {{ sitio.alias.join(', ') }}
          </NTooltip>
          <span v-if="estado.punto !== 'aviso'" class="estado-texto">· {{ estado.etiqueta }}</span>
        </div>
        <p v-if="estadoHttps.pendiente" class="https-pendiente" role="status">
          <NIcon aria-hidden="true"><Warning /></NIcon>
          <span>
            {{ estadoHttps.pendiente }}
            <span class="tenue">{{ th.pendienteAyuda }}</span>
          </span>
        </p>
        <p v-if="sitio.nota" class="nota">{{ sitio.nota }}</p>
        <ul v-if="avisosRuntimes.length" class="avisos" :aria-label="tp.tarjeta.runtimes">
          <li v-for="(a, i) in avisosRuntimes" :key="i">
            <NIcon aria-hidden="true"><Warning /></NIcon>{{ a }}
          </li>
        </ul>
      </div>

      <div class="acciones">
        <NButton size="small" secondary :loading="ocupado('abrir')" @click="abrirSitio">
          <template #icon
            ><NIcon><Open /></NIcon
          ></template>
          {{ es.acciones.abrir }}
        </NButton>
        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              secondary
              :loading="ocupado('carpeta')"
              :aria-label="t.abrirCarpeta"
              @click="abrirCarpeta"
            >
              <template #icon
                ><NIcon><FolderOpen /></NIcon
              ></template>
              {{ t.carpeta }}
            </NButton>
          </template>
          <span class="ruta">{{ sitio.carpeta }}</span>
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              secondary
              :loading="ocupado('terminal')"
              :aria-label="es.terminalSitio.ayuda"
              @click="abrirTerminal"
            >
              <template #icon
                ><NIcon><Terminal /></NIcon
              ></template>
              {{ es.terminalSitio.boton }}
            </NButton>
          </template>
          {{ es.terminalSitio.ayuda }}
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              secondary
              :loading="ocupado('editor')"
              :aria-label="tp.tarjeta.vscodeAyuda"
              @click="abrirEditor"
            >
              <template #icon
                ><NIcon><CodeSlash /></NIcon
              ></template>
              {{ tp.tarjeta.vscode }}
            </NButton>
          </template>
          {{ tp.tarjeta.vscodeAyuda }}
        </NTooltip>
        <NDropdown trigger="click" :options="opciones" placement="bottom-end" @select="elegir">
          <NButton
            size="small"
            quaternary
            :aria-label="es.acciones.masAcciones"
            :title="es.acciones.masAcciones"
          >
            <template #icon
              ><NIcon><EllipsisHorizontal /></NIcon
            ></template>
          </NButton>
        </NDropdown>
      </div>
    </div>

    <div class="pie">
      <GitProyecto :sitio="sitio" />
      <div class="receta">
        <span class="receta-titulo">{{ tp.tarjeta.receta }}</span>
        <NTag
          size="small"
          :bordered="false"
          :type="
            receta.estado === 'lista'
              ? 'success'
              : receta.estado === 'error'
                ? 'error'
                : receta.estado === 'corriendo'
                  ? 'info'
                  : 'default'
          "
        >
          {{ tp.estadoReceta[receta.estado] }}
        </NTag>
        <NProgress
          v-if="receta.estado === 'corriendo'"
          type="line"
          :percentage="avance"
          :show-indicator="false"
          class="receta-barra"
        />
        <span class="espacio" />
        <NButton
          v-if="receta.estado !== 'inactiva'"
          size="tiny"
          quaternary
          @click="emit('verPreparacion', sitio)"
        >
          {{ tp.tarjeta.verPreparacion }}
        </NButton>
        <NTooltip v-if="!sitio.confiado">
          <template #trigger>
            <NButton size="tiny" type="primary" secondary @click="emit('revisarReceta', sitio)">
              <template #icon
                ><NIcon><Construct /></NIcon
              ></template>
              {{ tp.tarjeta.preparar }}
            </NButton>
          </template>
          {{ tp.tarjeta.sinConfianza }}
        </NTooltip>
        <NButton
          v-else
          size="tiny"
          secondary
          :disabled="receta.estado === 'corriendo'"
          @click="reinstalar"
        >
          <template #icon
            ><NIcon><Construct /></NIcon
          ></template>
          {{ tp.tarjeta.reinstalar }}
        </NButton>
      </div>
      <ProcesosProyecto :sitio="sitio" @aplicado="(r) => emit('aplicado', r)" />
      <InterruptorTunel :sitio="sitio" />
      <SeccionFtpSitio :sitio="sitio" />
    </div>
  </article>
</template>

<style scoped>
.fila {
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.045);
  transition: border-color 0.15s ease;
}
.fila.reales {
  box-shadow: inset 3px 0 0 rgba(220, 38, 38, 0.55);
}
.fila:hover {
  border-color: rgba(128, 128, 128, 0.34);
}
.principal {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px 12px;
}
.punto {
  margin-top: 7px;
}
.cuerpo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.linea {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  min-width: 0;
}
.nombre {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.mono {
  font-family: var(--fuente-mono);
}
.secundaria {
  font-size: 12.5px;
}
.dominio {
  font-family: var(--fuente-mono);
  color: #6470e0;
  text-decoration: none;
}
.dominio.seguro {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #16a34a;
}
.candado {
  font-size: 12px;
}
.https-pendiente {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 2px 0 0;
  font-size: 12px;
  color: #b45309;
}
.https-pendiente .n-icon {
  margin-top: 2px;
  flex: none;
}
.https-pendiente .tenue {
  display: block;
  color: inherit;
  opacity: 0.8;
}
.dominio:hover {
  text-decoration: underline;
}
.dominio:focus-visible,
.alias:focus-visible {
  outline: 2px solid #6470e0;
  outline-offset: 2px;
  border-radius: 4px;
}
.alias {
  font-size: 12px;
  opacity: 0.65;
  cursor: default;
}
.estado-texto {
  opacity: 0.6;
}
.nota {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.65;
}
.acciones {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}
.ruta {
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.avisos {
  margin: 2px 0 0;
  padding: 0;
  font-size: 12px;
  color: #b45309;
}
.avisos li {
  list-style: none;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}
.avisos .n-icon {
  margin-top: 2px;
  flex: none;
}
.receta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
}
.receta-titulo {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
}
.receta-barra {
  max-width: 140px;
}
.espacio {
  flex: 1;
}
.pie {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 16px 10px 38px;
  border-top: 1px solid rgba(128, 128, 128, 0.14);
}
</style>

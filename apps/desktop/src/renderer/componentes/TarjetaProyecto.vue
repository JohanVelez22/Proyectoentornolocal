<script setup lang="ts">
import {
  CopyOutline,
  Albums,
  Construct,
  CreateOutline,
  DocumentText,
  EllipsisHorizontal,
  KeyOutline,
  FolderOpen,
  LockClosed,
  Open,
  ShieldCheckmark,
  CodeSlash,
  Chatbubbles,
  ChevronDown,
  Server,
  Terminal,
  TrashOutline,
  Warning,
} from '@vicons/ionicons5';
import {
  NButton,
  NIcon,
  NProgress,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
  useNotification,
  type DropdownOption,
} from 'naive-ui';
import MenuDesplegable from './MenuDesplegable.vue';
import { computed, h, onMounted, ref, type Component } from 'vue';
import { useRouter } from 'vue-router';
import type {
  EditorDisponible,
  HerramientaBd,
  IdEditor,
  IdTerminal,
  ResultadoAplicar,
  Sitio,
  TerminalDisponible,
} from '../../shared/api';
import { avisoEditorSustituido } from '../utilidades/editores';
import { textoPma } from '../utilidades/phpmyadmin';
import { api } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
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
import { avanceReceta, resumenReinstalar } from '../utilidades/proyectos';
import BotonIcono from './BotonIcono.vue';
import EstadoPunto from './EstadoPunto.vue';
import GitProyecto from './GitProyecto.vue';
import ProcesosProyecto from './ProcesosProyecto.vue';
import InterruptorLan from './InterruptorLan.vue';
import InterruptorTunel from './InterruptorTunel.vue';
import EditorVhost from './EditorVhost.vue';
import SeccionFtpSitio from './SeccionFtpSitio.vue';
import SeccionPhpSitio from './SeccionPhpSitio.vue';

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
  guardarPlantilla: [sitio: Sitio];
  /** Abrir el gestor de variables del .env. */
  verEnv: [sitio: Sitio];
}>();

const t = textos.sitios;
const tp = textos.proyectos;
const proyectos = useProyectos();
const th = textos.sitioHttps;
const servicios = useServicios();
const hosts = useHosts();
const https = useHttps();
const dialog = useDialog();
const message = useMessage();
const notification = useNotification();
const { ejecutar, ocupado } = useAccion();
const router = useRouter();

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
  { key: 'editar', label: textos.acciones.editar, icon: icono(CreateOutline) },
  { key: 'duplicar', label: textos.acciones.duplicar, icon: icono(CopyOutline) },
  { key: 'registros', label: tp.tarjeta.verRegistros, icon: icono(DocumentText) },
  // Receta, ajustes y esquema de la base sin datos (nunca .env ni claves).
  { key: 'env', label: textos.env.accion, icon: icono(KeyOutline) },
  { key: 'plantilla', label: textos.plantillas.guardarComo, icon: icono(Albums) },
  // Lleva a Agentes con el proyecto elegido: el agente se abre allí, con su diálogo.
  { key: 'agente', label: tp.tarjeta.abrirAgente, icon: icono(Chatbubbles) },
  { type: 'divider', key: 'd1' },
  {
    key: 'borrar',
    label: textos.acciones.borrar,
    icon: icono(TrashOutline),
    props: { style: { color: '#dc2626' } },
  },
];

function elegir(clave: string | number): void {
  if (clave === 'editar') emit('editar', props.sitio);
  else if (clave === 'duplicar') emit('duplicar', props.sitio);
  else if (clave === 'registros') emit('verRegistros', props.sitio);
  else if (clave === 'env') emit('verEnv', props.sitio);
  else if (clave === 'plantilla') emit('guardarPlantilla', props.sitio);
  else if (clave === 'agente')
    void router.push({ name: 'agentes', query: { sitio: props.sitio.id } });
  else if (clave === 'borrar') confirmarBorrar();
}

function confirmarBorrar(): void {
  const d = dialog.warning({
    title: t.borrar.titulo(nombre.value),
    content: t.borrar.texto,
    positiveText: textos.acciones.borrar,
    negativeText: textos.acciones.cancelar,
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
          title: textos.errores.titulo,
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
async function reinstalar(): Promise<void> {
  const pasos = receta.value.pasos;
  if (!pasos.length) {
    emit('revisarReceta', props.sitio);
    return;
  }
  // Si la receta del proyecto (wolfcore.yml) cambió desde "Confío…", se avisa: reinstalar repite
  // la guardada y "Revisar la receta" permite tomar la nueva.
  const cambio =
    (await ejecutar('resumen', () => api().proyectos.resumenReceta(props.sitio.id)))?.cambio ===
    true;
  const r = resumenReinstalar(pasos, cambio);
  dialog.info({
    title: tp.tarjeta.reinstalarTitulo(nombre.value),
    content: () =>
      h('div', [
        r.aviso ? h('p', { class: 'resumen-aviso', role: 'alert' }, r.aviso) : null,
        h('p', { class: 'resumen-texto' }, tp.tarjeta.reinstalarTexto),
        h(
          'ol',
          { class: 'resumen-pasos' },
          r.pasos.map((p) => h('li', p)),
        ),
      ]),
    positiveText: tp.tarjeta.ejecutar,
    negativeText: tp.tarjeta.revisarReceta,
    autoFocus: false,
    onPositiveClick: () => {
      proyectos.reinstalar(props.sitio.id).catch((e: unknown) => {
        notification.error({
          title: textos.errores.titulo,
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

function abrirEditor(editor: IdEditor | null = null): void {
  if (ocupado('editor')) return;
  void ejecutar(
    'editor',
    async () => {
      const r = await api().sistema.abrirEditor(props.sitio.id, editor);
      const aviso = avisoEditorSustituido(r);
      if (aviso) message.info(aviso);
    },
    { tituloError: tp.tarjeta.vscodeError },
  );
}

/* ───── Abrir con… (lista de los editores instalados, se lee al abrir el menú) ───── */
const editores = ref<EditorDisponible[] | null>(null);
const editorPorDefecto = ref<IdEditor | null>(null);
const opcionesEditor = computed<DropdownOption[]>(() =>
  (editores.value ?? []).map((x) => ({
    key: x.id,
    label:
      x.id === (editorPorDefecto.value ?? editores.value?.[0]?.id)
        ? `${x.nombre} (${textos.editorSitio.predeterminada})`
        : x.nombre,
  })),
);
const menuEditor = ref(false);
async function cambiarMenuEditor(mostrar: boolean): Promise<void> {
  if (mostrar) {
    const r = await ejecutar('editores', () => api().editor.disponibles());
    if (r) {
      editores.value = r.disponibles;
      editorPorDefecto.value = r.porDefecto;
    }
  }
  menuEditor.value = mostrar && (editores.value?.length ?? 0) > 0;
}
function elegirEditor(k: string | number): void {
  menuEditor.value = false;
  abrirEditor(k as IdEditor);
}

function abrirSitio(): void {
  void ejecutar('abrir', () => api().sistema.abrirUrl(url.value));
}
function abrirSitioHttps(): void {
  void ejecutar('abrirHttps', () => api().sistema.abrirUrl(urlSegura.value));
}
function abrirTerminal(terminal: IdTerminal | null = null): void {
  if (ocupado('terminal')) return;
  void ejecutar('terminal', () => api().terminal.abrir(props.sitio.id, terminal));
}

/* ───── Elegir terminal (lista de las instaladas, se lee al abrir el menú) ───── */
const terminales = ref<TerminalDisponible[] | null>(null);
const terminalPorDefecto = ref<IdTerminal | null>(null);
const opcionesTerminal = computed<DropdownOption[]>(() =>
  (terminales.value ?? []).map((x) => ({
    key: x.id,
    label:
      x.id === terminalPorDefecto.value
        ? `${x.nombre} (${textos.terminalSitio.predeterminada})`
        : x.nombre,
  })),
);
/** Menú de terminales: se abre cuando la lista ya está cargada (no vacío y luego lleno). */
const menuTerminal = ref(false);
async function cambiarMenuTerminal(mostrar: boolean): Promise<void> {
  if (mostrar && !terminales.value) {
    const r = await ejecutar('terminales', () => api().terminal.disponibles());
    if (r) {
      terminales.value = r.disponibles;
      terminalPorDefecto.value = r.porDefecto;
    }
  }
  menuTerminal.value = mostrar && (terminales.value?.length ?? 0) > 0;
}
function elegirTerminal(k: string | number): void {
  menuTerminal.value = false;
  abrirTerminal(k as IdTerminal);
}

/* ───── Base de datos del proyecto en Adminer o phpMyAdmin, ya autenticada ───── */
const baseDetectada = ref<string | null>(null);
const motorBase = ref<string | null>(null);
const ayudaAbrir = computed(() => `${tp.tarjeta.abrirSitio}\n${url.value}`);
const ayudaCarpeta = computed(() => `${t.abrirCarpeta}\n${props.sitio.carpeta}`);
const ayudaBd = computed(
  () =>
    `${baseDetectada.value ? tp.tarjeta.baseDatosAyuda(baseDetectada.value) : tp.tarjeta.baseDatosSinDetectar}\n${tp.tarjeta.entradaAutomatica}`,
);
async function abrirBaseDatos(herramienta: HerramientaBd = 'adminer'): Promise<void> {
  if (ocupado('bd')) return;
  await ejecutar('bd', async () => {
    const r = await api().adminer.proyecto(props.sitio.id);
    baseDetectada.value = r.base?.base ?? null;
    motorBase.value = r.base?.motor ?? null;
    if (!r.base) {
      message.warning(tp.tarjeta.sinBase);
      return;
    }
    // Adminer solo da un motivo; phpMyAdmin además dice si falta una extensión o PHP no encaja.
    let aviso: { titulo: string; contenido: string } | null = null;
    if (herramienta === 'adminer') {
      const d = await api().adminer.disponibilidad();
      if (!d.disponible) aviso = { titulo: tp.tarjeta.adminerNoListo, contenido: d.motivo };
    } else {
      const d = await api().phpmyadmin.disponibilidad();
      if (!d.disponible) {
        aviso = { titulo: tp.tarjeta.phpMyAdminNoListo, contenido: textoPma(d) ?? d.motivo };
      }
    }
    if (aviso) {
      notification.warning({ title: aviso.titulo, content: aviso.contenido, duration: 8000 });
      return;
    }
    // El proceso principal abre el navegador con un token de un solo uso: la clave no pasa por la
    // URL, el historial ni esta ventana. Si entró como administrador (el proyecto usa root), se avisa.
    const acceso = await api().accesoBd.abrir(props.sitio.id, herramienta);
    if (!acceso.propio) {
      const texto =
        acceso.motivo === 'sin_clave'
          ? tp.tarjeta.entroComoAdminSinClave
          : tp.tarjeta.entroComoAdmin;
      message.info(texto(acceso.usuario), { duration: 9000 });
    }
  });
}

/* Elegir la herramienta (el motor de la base se consulta al abrir el menú: PostgreSQL no va en phpMyAdmin). */
const menuBd = ref(false);
const opcionesBd = computed<DropdownOption[]>(() => [
  { key: 'adminer', label: tp.tarjeta.opcionAdminer },
  motorBase.value === 'postgresql'
    ? { key: 'phpmyadmin', label: tp.tarjeta.opcionPhpMyAdminSoloMysql, disabled: true }
    : { key: 'phpmyadmin', label: tp.tarjeta.opcionPhpMyAdmin },
]);
async function cambiarMenuBd(mostrar: boolean): Promise<void> {
  if (mostrar) {
    const r = await ejecutar('bdMenu', () => api().adminer.proyecto(props.sitio.id));
    motorBase.value = r?.base?.motor ?? null;
  }
  menuBd.value = mostrar;
}
function elegirBd(k: string | number): void {
  menuBd.value = false;
  void abrirBaseDatos(k as HerramientaBd);
}
function abrirCarpeta(): void {
  void ejecutar('carpeta', () => api().sistema.abrirCarpeta(props.sitio.carpeta));
}
</script>

<template>
  <article class="fila" :class="{ reales: sitio.datosReales }" :data-foco="`sitio:${sitio.id}`">
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
        <BotonIcono
          :icono="Open"
          :etiqueta="tp.tarjeta.abrirSitio"
          :ayuda="ayudaAbrir"
          :cargando="ocupado('abrir')"
          @click="abrirSitio"
        />
        <BotonIcono
          :icono="FolderOpen"
          :etiqueta="t.abrirCarpeta"
          :ayuda="ayudaCarpeta"
          :cargando="ocupado('carpeta')"
          @click="abrirCarpeta"
        />
        <div class="grupo">
          <BotonIcono
            :icono="Terminal"
            :etiqueta="textos.terminalSitio.boton"
            :ayuda="textos.terminalSitio.ayuda"
            :cargando="ocupado('terminal')"
            pegado
            @click="abrirTerminal()"
          />
          <MenuDesplegable
            trigger="click"
            :options="opcionesTerminal"
            alinear-fin
            :show="menuTerminal"
            @update:show="cambiarMenuTerminal"
            @select="elegirTerminal"
          >
            <NButton
              size="small"
              secondary
              class="grupo-der"
              :loading="ocupado('terminales')"
              :aria-label="textos.terminalSitio.elegir"
              :title="textos.terminalSitio.elegir"
            >
              <template #icon
                ><NIcon aria-hidden="true"><ChevronDown /></NIcon
              ></template>
            </NButton>
          </MenuDesplegable>
        </div>
        <div class="grupo">
          <BotonIcono
            :icono="Server"
            :etiqueta="tp.tarjeta.baseDatos"
            :ayuda="ayudaBd"
            :cargando="ocupado('bd')"
            pegado
            @click="abrirBaseDatos()"
          />
          <MenuDesplegable
            trigger="click"
            :options="opcionesBd"
            alinear-fin
            :show="menuBd"
            @update:show="cambiarMenuBd"
            @select="elegirBd"
          >
            <NButton
              size="small"
              secondary
              class="grupo-der"
              :loading="ocupado('bdMenu')"
              :aria-label="tp.tarjeta.elegirBd"
              :title="tp.tarjeta.elegirBd"
            >
              <template #icon
                ><NIcon aria-hidden="true"><ChevronDown /></NIcon
              ></template>
            </NButton>
          </MenuDesplegable>
        </div>
        <div class="grupo">
          <BotonIcono
            :icono="CodeSlash"
            :etiqueta="tp.tarjeta.vscode"
            :ayuda="tp.tarjeta.vscodeAyuda"
            :cargando="ocupado('editor')"
            pegado
            @click="abrirEditor()"
          />
          <MenuDesplegable
            trigger="click"
            :options="opcionesEditor"
            alinear-fin
            :show="menuEditor"
            @update:show="cambiarMenuEditor"
            @select="elegirEditor"
          >
            <NButton
              size="small"
              secondary
              class="grupo-der"
              :loading="ocupado('editores')"
              :aria-label="textos.editorSitio.elegir"
              :title="textos.editorSitio.elegir"
            >
              <template #icon
                ><NIcon aria-hidden="true"><ChevronDown /></NIcon
              ></template>
            </NButton>
          </MenuDesplegable>
        </div>
        <MenuDesplegable trigger="click" :options="opciones" alinear-fin @select="elegir">
          <NButton
            size="small"
            quaternary
            :aria-label="textos.acciones.masAcciones"
            :title="textos.acciones.masAcciones"
          >
            <template #icon
              ><NIcon><EllipsisHorizontal /></NIcon
            ></template>
          </NButton>
        </MenuDesplegable>
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
          :loading="ocupado('resumen')"
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
      <InterruptorLan :sitio="sitio" />
      <SeccionPhpSitio :sitio="sitio" @aplicado="(r) => emit('aplicado', r)" />
      <EditorVhost :sitio="sitio" />
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
  color: var(--texto-enlace);
  text-decoration: none;
}
.dominio.seguro {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--texto-ok);
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
  color: var(--texto-aviso);
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
/* Terminal + elegir terminal: un solo control partido. */
.grupo {
  display: inline-flex;
}
.grupo-der {
  width: 20px;
  padding: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: 1px;
}
.grupo-der:focus-visible {
  outline: 2px solid rgba(var(--acento-rgb), 0.6);
  outline-offset: 2px;
}
.ruta {
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.avisos {
  margin: 2px 0 0;
  padding: 0;
  font-size: 12px;
  color: var(--texto-aviso);
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

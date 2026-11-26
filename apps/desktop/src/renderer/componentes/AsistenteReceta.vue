<script setup lang="ts">
import { ArrowDown, ArrowUp, DocumentText, Open, TrashOutline } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NProgress,
  NSpin,
  NSwitch,
  NTag,
  NTooltip,
  useDialog,
  type SelectOption,
} from 'naive-ui';
import Desplegable from './Desplegable.vue';
import { computed, ref, watch } from 'vue';
import type { RecetaPropuesta, ResultadoAplicar, ResultadoReceta } from '../../shared/api';
import { api, plano } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useHttps } from '../stores/https';
import { useProyectos } from '../stores/proyectos';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import {
  SERVICIOS_PROYECTO,
  alternarPaso,
  aplicarDeteccion,
  avanceReceta,
  conRestaurar,
  datosSitioInicial,
  deteccionEditable,
  etiquetaPaso,
  LENGUAJES_RUNTIME,
  moverPaso,
  necesitaPuertoProxy,
  pasoConError,
  pasosAsistente,
  recetaElegida,
  sePuedeDesactivar,
  sePuedeMover,
  sinRestaurar,
  type DeteccionEditable,
  type ObjetivoAsistente,
  type PasoAsistente,
} from '../utilidades/proyectos';
import {
  TIPOS,
  armarDominio,
  baseDominio,
  elegirPhp,
  nombreDeCarpeta,
  urlHttps,
  urlLocal,
  usaPhp,
} from '../utilidades/sitios';
import PasoReceta from './PasoReceta.vue';

const props = defineProps<{ objetivo: ObjetivoAsistente | null }>();
const emit = defineEmits<{ cerrar: []; aplicado: [resultado: ResultadoAplicar] }>();

const t = textos.proyectos.asistente;
const tp = textos.proyectos;
const proyectos = useProyectos();
const sitios = useSitios();
const servicios = useServicios();
const https = useHttps();
const dialog = useDialog();
const { ejecutar, ocupado } = useAccion();

/** Objetivo vigente (puede pasar de `ver` a `revisar` sin cerrar el diálogo). */
const actual = ref<ObjetivoAsistente | null>(null);
/** Proyecto en preparación: el existente o el recién creado al montar. */
const sitioId = ref<string | null>(null);
const propuesta = ref<RecetaPropuesta | null>(null);
const det = ref<DeteccionEditable | null>(null);
const pasos = ref<PasoAsistente[]>([]);
const confio = ref(false);
const sobrescribir = ref(false);
const montando = ref(false);
const errorTexto = ref<string | null>(null);
const avisoPhp = ref<string | null>(null);
const nodes = ref<string[]>([]);
const pythons = ref<string[]>([]);
/** Versiones instaladas de Java, .NET, Go y Rust (D5). */
const lenguajes = ref<Record<(typeof LENGUAJES_RUNTIME)[number], string[]>>({
  java: [],
  dotnet: [],
  go: [],
  rust: [],
  bun: [],
  deno: [],
  zig: [],
  kotlin: [],
  dart: [],
});

const visible = computed(() => actual.value !== null);
const fase = computed<'configurar' | 'ejecutar'>(() =>
  sitioId.value !== null && actual.value?.modo !== 'revisar' ? 'ejecutar' : 'configurar',
);
const carpeta = computed(() => {
  const o = actual.value;
  if (!o) return '';
  if (o.modo === 'nuevo') return o.carpeta;
  return sitios.porId(o.sitioId)?.carpeta ?? '';
});
const sitio = computed(() => (sitioId.value ? sitios.porId(sitioId.value) : undefined));
const titulo = computed(() =>
  t.titulo(sitio.value?.nombre || nombreDeCarpeta(carpeta.value) || '…'),
);

watch(
  () => props.objetivo,
  (o) => {
    if (o) void abrir(o);
    else actual.value = null;
  },
  { immediate: true },
);

async function abrir(o: ObjetivoAsistente): Promise<void> {
  actual.value = o;
  errorTexto.value = null;
  confio.value = false;
  sobrescribir.value = false;
  montando.value = false;
  propuesta.value = null;
  det.value = null;
  pasos.value = [];
  avisoPhp.value = null;
  sitioId.value = o.modo === 'nuevo' ? null : o.sitioId;
  if (o.modo === 'ver') {
    await ejecutar('estado', () => proyectos.cargarReceta(o.sitioId));
    return;
  }
  await cargarPropuesta();
}

async function cargarPropuesta(): Promise<void> {
  const c = carpeta.value;
  if (!c) return;
  try {
    const [p, phps, n, py, ...otros] = await Promise.all([
      api().proyectos.recetaPorDefecto(c),
      servicios.cargarInstalados('php').catch(() => [] as string[]),
      api()
        .runtimes.instalados('node')
        .catch(() => [] as string[]),
      api()
        .runtimes.instalados('python')
        .catch(() => [] as string[]),
      ...LENGUAJES_RUNTIME.map((l) =>
        api()
          .runtimes.instalados(l)
          .catch(() => [] as string[]),
      ),
    ]);
    nodes.value = n;
    pythons.value = py;
    LENGUAJES_RUNTIME.forEach((l, i) => (lenguajes.value[l] = otros[i] ?? []));
    propuesta.value = p;
    const d = deteccionEditable(p.deteccion);
    const s = sitio.value;
    if (s) {
      // Revisar un proyecto existente: se parte de lo que ya tiene el sitio.
      d.tipo = s.tipo;
      d.php = s.php;
      d.dominio = s.dominio;
      d.node = s.runtimes.node ?? null;
      d.python = s.runtimes.python ?? null;
      for (const l of LENGUAJES_RUNTIME) d[l] = s.runtimes[l] ?? null;
      d.puertoProxy = s.puertoProxy;
    }
    if (usaPhp(d.tipo)) {
      const e = elegirPhp(d.php, phps);
      d.php = e.php;
      avisoPhp.value =
        e.noInstalada && e.php ? textos.formSitio.phpNoInstalada(e.noInstalada, e.php) : null;
    }
    det.value = d;
    pasos.value = pasosAsistente(p.receta);
  } catch (e) {
    errorTexto.value = `${t.errorReceta}: ${mensajeDeError(e)}`;
  }
}

/* ───── Configuración ───── */

const opcionesTipo: SelectOption[] = TIPOS.map((v) => ({
  value: v,
  label: textos.sitios.tipos[v],
}));
const opcionesPhp = computed<SelectOption[]>(() =>
  [...(servicios.instalados['php'] ?? [])]
    .sort((a, b) => b.localeCompare(a, 'es', { numeric: true }))
    .map((v) => ({ value: v, label: textos.sitios.php(v) })),
);
const opcionesRuntime = (lista: string[], detectado: string | null): SelectOption[] => [
  { value: '', label: detectado ? t.detectado(detectado) : t.versionAuto },
  ...lista.map((v) => ({ value: v, label: v })),
];
const opcionesNode = computed(() =>
  opcionesRuntime(nodes.value, propuesta.value?.deteccion.node ?? null),
);
const opcionesPython = computed(() =>
  opcionesRuntime(pythons.value, propuesta.value?.deteccion.python ?? null),
);
const opcionesLenguaje = (l: (typeof LENGUAJES_RUNTIME)[number]): SelectOption[] =>
  opcionesRuntime(lenguajes.value[l], propuesta.value?.deteccion.runtimesPedidos?.[l] ?? null);
/** Java, .NET, Go y Rust que usa el proyecto (lo dice un archivo suyo) o que ya fijó el sitio. */
const lenguajesUsados = computed(() =>
  LENGUAJES_RUNTIME.filter(
    (l) => propuesta.value?.deteccion.runtimesPedidos?.[l] !== undefined || !!det.value?.[l],
  ),
);
const opcionesServicios: SelectOption[] = SERVICIOS_PROYECTO.map((v) => ({
  value: v,
  label: t.nombresServicio[v] ?? v,
}));
const usaNode = computed(
  () =>
    !!propuesta.value?.deteccion.tienePackageJson ||
    det.value?.tipo === 'node' ||
    !!propuesta.value?.deteccion.node,
);
const usaPython = computed(
  () =>
    det.value?.tipo === 'fastapi' ||
    !!propuesta.value?.deteccion.tieneRequirements ||
    !!propuesta.value?.deteccion.tienePyproject,
);

const dominioBase = computed({
  get: () => baseDominio(det.value?.dominio ?? ''),
  set: (v: string) => {
    if (det.value) det.value.dominio = armarDominio(v.replace(/\s+/g, '-'));
  },
});

/** Los pasos con la detección aplicada (para las etiquetas y lo que se envía). */
const aplicados = computed(() => (det.value ? aplicarDeteccion(pasos.value, det.value) : []));
const quitadosPorMotor = computed(() => {
  const ids = new Set(aplicados.value.map((p) => p.paso.id));
  return new Set(pasos.value.filter((p) => !ids.has(p.paso.id)).map((p) => p.paso.id));
});
const etiquetaDe = (id: string): string => {
  const p =
    aplicados.value.find((x) => x.paso.id === id) ?? pasos.value.find((x) => x.paso.id === id);
  return p ? etiquetaPaso(p.paso) : id;
};
const restaurar = computed(() => pasos.value.find((p) => p.paso.tipo === 'bd-restaurar'));
const hayMotor = computed(() =>
  det.value?.servicios.some((s) => ['mysql', 'mariadb', 'postgresql', 'mongodb'].includes(s)),
);
/** El tipo y la receta piden el puerto a mano (Node/Vite o proxy sin proceso con puerto). */
const pidePuerto = computed(() => !!det.value && necesitaPuertoProxy(det.value.tipo, pasos.value));
const sinPuertoProxy = computed(
  () => pidePuerto.value && (det.value?.puertoProxy ?? null) === null,
);
/**
 * Al revisar un proyecto que ya existe, tipo, PHP, dominio, versiones y puerto son los del sitio
 * (se cambian en Editar): la receta no los pisa.
 */
const soloLectura = computed(() => actual.value?.modo === 'revisar');
const faltaPhp = computed(() => !!det.value && usaPhp(det.value.tipo) && !det.value.php);
const puedeMontar = computed(
  () =>
    confio.value &&
    !!det.value &&
    !!det.value.dominio &&
    !sinPuertoProxy.value &&
    !faltaPhp.value &&
    !montando.value,
);

function alternar(i: number, activo: boolean): void {
  pasos.value = alternarPaso(pasos.value, i, activo);
}
function mover(i: number, delta: -1 | 1): void {
  pasos.value = moverPaso(pasos.value, i, delta);
}
function cambiarSemilla(i: number, semilla: boolean): void {
  const p = pasos.value[i];
  if (!p) return;
  const args = { ...p.paso.args };
  if (semilla) args['semilla'] = true;
  else delete args['semilla'];
  pasos.value[i] = { ...p, paso: { ...p.paso, args } };
}

async function elegirRespaldo(): Promise<void> {
  const archivo = await ejecutar('respaldo', () => api().sistema.elegirArchivo());
  if (archivo) pasos.value = conRestaurar(pasos.value, archivo, sobrescribir.value);
}
function quitarRespaldo(): void {
  pasos.value = sinRestaurar(pasos.value);
}
watch(sobrescribir, (v) => {
  const archivo = restaurar.value?.paso.args?.['archivo'];
  if (typeof archivo === 'string') pasos.value = conRestaurar(pasos.value, archivo, v);
});

async function montar(): Promise<void> {
  const o = actual.value;
  const d = det.value;
  if (!o || !d || !puedeMontar.value) return;
  montando.value = true;
  errorTexto.value = null;
  const receta = recetaElegida(aplicarDeteccion(pasos.value, d));
  let id: string;
  try {
    if (o.modo === 'nuevo') {
      // El núcleo crea el sitio con los datos de sitio-crear (FastAPI/Node con proceso y puerto).
      const r = await api().proyectos.crearSitio(
        plano(datosSitioInicial(o.carpeta, d, o.remoto)),
        plano(receta),
      );
      id = r.sitio.id;
      emit('aplicado', r.aplicar);
    } else if (o.modo === 'revisar') {
      // Un solo guardado, con los datos frescos del sitio: marca "Confío…" y toma la huella.
      const r = await api().proyectos.confiar(o.sitioId);
      id = r.sitio.id;
      emit('aplicado', r.aplicar);
    } else return;
  } catch (e) {
    errorTexto.value = `${t.errorCrear}: ${mensajeDeError(e)}`;
    montando.value = false;
    return;
  }
  sitioId.value = id;
  actual.value = { modo: 'ver', sitioId: id };
  montando.value = false;
  proyectos.ejecutar(id, { receta }).catch((e: unknown) => {
    // El proyecto ya existe: se vuelve a la configuración (para revisarla) con el error.
    errorTexto.value = mensajeDeError(e);
    actual.value = { modo: 'revisar', sitioId: id };
  });
}

/* ───── Ejecución ───── */

const estado = computed(() => (sitioId.value ? proyectos.receta(sitioId.value) : null));
const corriendo = computed(() => estado.value?.estado === 'corriendo');
const fallido = computed(() => (estado.value ? pasoConError(estado.value) : undefined));
const avance = computed(() => (estado.value ? avanceReceta(estado.value) : 0));
const primeroSinHacer = computed(
  () => estado.value?.pasos.find((p) => p.estado !== 'listo' && p.estado !== 'omitido')?.id,
);

function correr(p: Promise<ResultadoReceta>): void {
  p.catch((e: unknown) => {
    errorTexto.value = mensajeDeError(e);
  });
}

/** Reintentar usa la receta guardada; si la del proyecto cambió, se avisa y se ofrece revisarla. */
async function reintentar(pasoId: string): Promise<void> {
  const id = sitioId.value;
  if (!id) return;
  errorTexto.value = null;
  const resumen = await ejecutar('resumen', () => api().proyectos.resumenReceta(id));
  const seguir = (): void => correr(proyectos.reintentar(id, pasoId));
  if (!resumen?.cambio || actual.value?.modo === 'nuevo') {
    seguir();
    return;
  }
  dialog.warning({
    title: t.recetaCambio,
    positiveText: t.seguirGuardada,
    negativeText: t.recargar,
    autoFocus: false,
    onPositiveClick: seguir,
    onNegativeClick: () => {
      actual.value = { modo: 'revisar', sitioId: id };
      void cargarPropuesta();
    },
  });
}
function omitir(pasoId: string): void {
  const id = sitioId.value;
  if (!id) return;
  errorTexto.value = null;
  correr(proyectos.omitir(id, pasoId));
}
function cancelar(): void {
  const id = sitioId.value;
  if (id) void ejecutar('cancelar', () => proyectos.cancelar(id));
}

const urlSitio = computed(() => {
  const s = sitio.value;
  if (!s) return null;
  return s.https
    ? urlHttps(s.dominio, https.estado?.puerto ?? 443)
    : urlLocal(s.dominio, servicios.porId['nginx']?.puertos[0]);
});
function abrirSitio(): void {
  const u = urlSitio.value;
  if (u) void ejecutar('abrir', () => api().sistema.abrirUrl(u));
}

function alCambiarVisible(v: boolean): void {
  if (!v && !montando.value) emit('cerrar');
}
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    :title="titulo"
    class="asistente"
    :style="{ width: '760px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false"
    :closable="!montando"
    :close-on-esc="!montando"
    :auto-focus="false"
    @update:show="alCambiarVisible"
  >
    <p class="carpeta mono" :title="carpeta">{{ carpeta }}</p>

    <NAlert v-if="errorTexto" type="error" class="alerta" closable @close="errorTexto = null">
      {{ errorTexto }}
    </NAlert>

    <!-- 1-4: detección, pasos, confianza y "Montar proyecto". -->
    <template v-if="fase === 'configurar'">
      <NSpin v-if="!det && !errorTexto" :description="t.cargando" class="cargando" />
      <div v-else-if="det" class="config">
        <p class="origen">
          <NIcon aria-hidden="true"><DocumentText /></NIcon>
          {{ propuesta?.origen === 'wolfcore.yml' ? t.origenYml : t.origenDefecto }}
        </p>

        <section class="bloque">
          <h4>{{ t.deteccion }}</h4>
          <p class="ayuda">{{ t.deteccionAyuda }}</p>
          <div class="rejilla">
            <label class="campo">
              <span>{{ t.tipo }}</span>
              <Desplegable
                v-model:value="det.tipo"
                size="small"
                :options="opcionesTipo"
                :disabled="soloLectura"
              />
            </label>
            <label v-if="usaPhp(det.tipo)" class="campo">
              <span>{{ t.php }}</span>
              <Desplegable
                v-model:value="det.php"
                size="small"
                :options="opcionesPhp"
                :placeholder="t.phpNinguno"
                :disabled="soloLectura"
                :status="faltaPhp ? 'error' : undefined"
              />
            </label>
            <label v-if="pidePuerto" class="campo">
              <span>{{ t.puertoProxy }}</span>
              <NInputNumber
                v-model:value="det.puertoProxy"
                size="small"
                :min="1"
                :max="65535"
                :show-button="false"
                :placeholder="t.puertoPlaceholder"
                :disabled="soloLectura"
                :status="sinPuertoProxy ? 'error' : undefined"
              />
            </label>
            <label v-if="usaNode" class="campo">
              <span>{{ t.node }}</span>
              <Desplegable
                :value="det.node ?? ''"
                size="small"
                :options="opcionesNode"
                :disabled="soloLectura"
                @update:value="(v: string) => det && (det.node = v || null)"
              />
            </label>
            <label v-if="usaPython" class="campo">
              <span>{{ t.python }}</span>
              <Desplegable
                :value="det.python ?? ''"
                size="small"
                :options="opcionesPython"
                :disabled="soloLectura"
                @update:value="(v: string) => det && (det.python = v || null)"
              />
            </label>
            <label v-for="l in lenguajesUsados" :key="l" class="campo">
              <span>{{ t[l] }}</span>
              <Desplegable
                :value="det[l] ?? ''"
                size="small"
                :options="opcionesLenguaje(l)"
                :disabled="soloLectura"
                @update:value="(v: string) => det && (det[l] = v || null)"
              />
            </label>
            <label class="campo ancho">
              <span>{{ t.servicios }}</span>
              <Desplegable
                v-model:value="det.servicios"
                size="small"
                multiple
                :options="opcionesServicios"
                :placeholder="t.serviciosNinguno"
              />
            </label>
            <label class="campo ancho">
              <span>{{ t.dominio }}</span>
              <NInput
                v-model:value="dominioBase"
                size="small"
                class="mono"
                :disabled="soloLectura"
                :placeholder="textos.formSitio.dominioPlaceholder"
              >
                <template #suffix><span class="sufijo">.test</span></template>
              </NInput>
            </label>
          </div>
          <p v-if="avisoPhp" class="aviso">{{ avisoPhp }}</p>
          <p v-if="usaNode && !nodes.length" class="aviso">{{ t.nodeInstalar }}</p>
          <p v-if="usaPython && !pythons.length" class="aviso">{{ t.pythonInstalar }}</p>
          <p
            v-for="l in lenguajesUsados.filter((x) => !lenguajes[x].length)"
            :key="l"
            class="aviso"
          >
            {{ t.lenguajeInstalar(t[l]) }}
          </p>
          <p v-if="soloLectura" class="ayuda">{{ t.soloLectura }}</p>
        </section>

        <section class="bloque">
          <h4>{{ t.receta }}</h4>
          <p class="ayuda">{{ t.recetaAyuda }}</p>
          <ol class="pasos">
            <li
              v-for="(p, i) in pasos"
              :key="p.paso.id"
              class="paso-config"
              :class="{ apagado: !p.activo || quitadosPorMotor.has(p.paso.id) }"
            >
              <NTooltip :disabled="sePuedeDesactivar(p.paso)">
                <template #trigger>
                  <NSwitch
                    size="small"
                    :value="p.activo"
                    :disabled="!sePuedeDesactivar(p.paso) || quitadosPorMotor.has(p.paso.id)"
                    :aria-label="etiquetaDe(p.paso.id)"
                    @update:value="(v: boolean) => alternar(i, v)"
                  />
                </template>
                {{ t.fijo }}
              </NTooltip>
              <span class="n">{{ i + 1 }}</span>
              <span class="etiqueta">{{ etiquetaDe(p.paso.id) }}</span>
              <NCheckbox
                v-if="p.paso.tipo === 'migrar' && det.tipo === 'laravel'"
                size="small"
                :checked="p.paso.args?.['semilla'] === true"
                :disabled="!p.activo"
                @update:checked="(v: boolean) => cambiarSemilla(i, v)"
              >
                {{ t.semilla }}
              </NCheckbox>
              <template v-if="sePuedeMover(p.paso)">
                <NButton
                  size="tiny"
                  quaternary
                  :disabled="i === 0"
                  :aria-label="t.subir"
                  :title="t.subir"
                  @click="mover(i, -1)"
                >
                  <template #icon
                    ><NIcon><ArrowUp /></NIcon
                  ></template>
                </NButton>
                <NButton
                  size="tiny"
                  quaternary
                  :disabled="i === pasos.length - 1"
                  :aria-label="t.bajar"
                  :title="t.bajar"
                  @click="mover(i, 1)"
                >
                  <template #icon
                    ><NIcon><ArrowDown /></NIcon
                  ></template>
                </NButton>
              </template>
              <NButton
                v-if="p.paso.tipo === 'bd-restaurar'"
                size="tiny"
                quaternary
                :aria-label="t.quitarRespaldo"
                :title="t.quitarRespaldo"
                @click="quitarRespaldo"
              >
                <template #icon
                  ><NIcon><TrashOutline /></NIcon
                ></template>
              </NButton>
            </li>
          </ol>
          <div class="respaldo">
            <NButton
              size="small"
              secondary
              :disabled="!hayMotor"
              :loading="ocupado('respaldo')"
              @click="elegirRespaldo"
            >
              {{ restaurar ? t.cambiarRespaldo : t.restaurar }}
            </NButton>
            <NCheckbox v-if="restaurar" v-model:checked="sobrescribir" size="small">
              {{ t.sobrescribir }}
            </NCheckbox>
            <span v-if="!hayMotor" class="ayuda">{{ t.sinMotor }}</span>
          </div>
        </section>

        <section class="confianza" :class="{ marcada: confio }">
          <NCheckbox v-model:checked="confio">
            <strong>{{ t.confio }}</strong>
          </NCheckbox>
          <p class="ayuda">{{ t.confioAyuda }}</p>
        </section>
      </div>
    </template>

    <!-- 5-6: progreso por paso, Reintentar/Omitir/Cancelar y "Abrir sitio". -->
    <template v-else-if="estado">
      <div class="cabecera-ejecucion">
        <NTag
          size="small"
          :bordered="false"
          :type="
            estado.estado === 'lista'
              ? 'success'
              : estado.estado === 'error'
                ? 'error'
                : estado.estado === 'corriendo'
                  ? 'info'
                  : 'default'
          "
        >
          {{ tp.estadoReceta[estado.estado] }}
        </NTag>
        <NProgress
          type="line"
          :percentage="avance"
          :show-indicator="false"
          :status="
            estado.estado === 'error' ? 'error' : estado.estado === 'lista' ? 'success' : 'default'
          "
          class="barra"
        />
      </div>
      <NSpin v-if="!estado.pasos.length && corriendo" class="cargando" />
      <ol class="lista-pasos">
        <PasoReceta
          v-for="p in estado.pasos"
          :key="p.id"
          :paso="p"
          :acciones="!corriendo"
          :ocupado="ocupado('resumen')"
          @reintentar="reintentar"
          @omitir="omitir"
        />
      </ol>
      <p v-if="estado.estado === 'lista'" class="final ok">{{ t.listo }}</p>
      <p v-else-if="estado.estado === 'error' && fallido" class="final mal">
        {{ t.fallo(etiquetaPaso(fallido)) }}
      </p>
      <p v-else-if="estado.estado === 'cancelada'" class="final">{{ t.cancelada }}</p>
      <p v-else-if="estado.estado === 'incompleta'" class="final">{{ t.incompleta }}</p>
    </template>

    <template #footer>
      <div class="pie">
        <template v-if="fase === 'configurar'">
          <NButton :disabled="montando" @click="emit('cerrar')">{{
            textos.acciones.cancelar
          }}</NButton>
          <NButton type="primary" :disabled="!puedeMontar" :loading="montando" @click="montar">
            {{ montando ? t.montando : t.montar }}
          </NButton>
        </template>
        <template v-else>
          <NButton v-if="corriendo" :loading="ocupado('cancelar')" @click="cancelar">
            {{ ocupado('cancelar') ? t.cancelando : t.cancelar }}
          </NButton>
          <NButton
            v-if="
              !corriendo &&
              primeroSinHacer &&
              estado?.estado !== 'error' &&
              estado?.estado !== 'inactiva'
            "
            secondary
            @click="reintentar(primeroSinHacer)"
          >
            {{ t.reintentar }}
          </NButton>
          <NButton @click="emit('cerrar')">{{ corriendo ? t.cerrarCorriendo : t.cerrar }}</NButton>
          <NButton
            v-if="estado?.estado === 'lista' && urlSitio"
            type="primary"
            :loading="ocupado('abrir')"
            @click="abrirSitio"
          >
            <template #icon
              ><NIcon><Open /></NIcon
            ></template>
            {{ t.abrirSitio }}
          </NButton>
        </template>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.carpeta {
  margin: -6px 0 12px;
  font-size: 12px;
  opacity: 0.72;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mono {
  font-family: var(--fuente-mono);
}
.alerta {
  margin-bottom: 12px;
}
.cargando {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
.config {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 260px);
  overflow: auto;
  padding-right: 4px;
}
.origen {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12.5px;
  opacity: 0.75;
}
.bloque h4 {
  margin: 0 0 2px;
  font-size: 13.5px;
}
.ayuda {
  margin: 0 0 8px;
  font-size: 12px;
  opacity: 0.72;
}
.aviso {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--texto-aviso);
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px 12px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
.campo > span {
  opacity: 0.76;
}
.campo.ancho {
  grid-column: 1 / -1;
}
.sufijo {
  font-family: var(--fuente-mono);
  opacity: 0.72;
}
.pasos {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.paso-config {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.05);
  font-size: 13px;
}
.paso-config.apagado .etiqueta {
  opacity: 0.45;
  text-decoration: line-through;
}
.n {
  font-size: 11px;
  opacity: 0.72;
  width: 14px;
  text-align: right;
}
.etiqueta {
  flex: 1;
  min-width: 0;
}
.respaldo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.respaldo .ayuda {
  margin: 0;
}
.confianza {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(217, 119, 6, 0.45);
  background: rgba(217, 119, 6, 0.07);
}
.confianza.marcada {
  border-color: rgba(22, 163, 74, 0.45);
  background: rgba(22, 163, 74, 0.06);
}
.confianza .ayuda {
  margin: 6px 0 0 26px;
}
.cabecera-ejecucion {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.barra {
  flex: 1;
}
.lista-pasos {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: calc(100vh - 300px);
  overflow: auto;
}
.final {
  margin: 12px 0 0;
  font-size: 13px;
}
.final.ok {
  color: var(--texto-ok);
}
.final.mal {
  color: var(--texto-error);
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

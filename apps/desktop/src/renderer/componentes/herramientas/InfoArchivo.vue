<script setup lang="ts">
import { NButton, NSpin, useDialog } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { AnalisisDisco, HashesArchivo, InfoRuta, ProgresoUsoDisco } from '../../../shared/api';
import { api } from '../../api';
import { mensajeDeError } from '../../composables/useAccion';
import { solicitudes } from '../../composables/solicitudes';
import { useCopiar } from '../../composables/useHerramienta';
import { formatearFecha, formatearNumero, textos } from '../../i18n';
import { rellenar } from '../../utilidades/equipo';
import { tamanoLegible } from '../../utilidades/herramientas';
import { esRaizDeUnidad } from '../../utilidades/infoArchivo';

/**
 * Info de archivo (D55): datos de un archivo o de una carpeta que se elige con el selector o se
 * suelta en cualquier parte de la ventana. SOLO LECTURA: no se modifica nada.
 *
 * La interfaz nunca escribe una ruta: el `File` pasa al preload, que saca la ruta con
 * `webUtils.getPathForFile`, y el proceso principal la valida y la registra. Los hashes se
 * calculan allí (por flujo, hasta 200 MB) y el tamaño de una carpeta sale del análisis de Uso del
 * disco (proceso aparte, cancelable, sin seguir enlaces).
 */
const t = textos.herramientas.infoArchivo;
const copiar = useCopiar();
const dialog = useDialog();

const info = ref<InfoRuta | null>(null);
const hashes = ref<[string, string][]>([]);
const calculando = ref(false);
const carpeta = ref<AnalisisDisco | null>(null);
const analizando = ref(false);
const progreso = ref<ProgresoUsoDisco | null>(null);
const cancelada = ref(false);
const error = ref<string | null>(null);
let turno = 0;
let escaneo: Promise<unknown> | null = null;
let baja: (() => void) | null = null;

const fecha = (ms: number): string =>
  ms > 0 ? formatearFecha(ms, { dateStyle: 'medium', timeStyle: 'medium' }) : '—';

const atributos = computed(() => {
  const i = info.value;
  if (!i || (i.soloLectura === null && i.oculto === null)) return '—';
  const lista = [i.soloLectura ? t.soloLectura : null, i.oculto ? t.oculto : null].filter(Boolean);
  return lista.length ? lista.join(', ') : t.ninguno;
});

const incompleto = computed(() => {
  const c = carpeta.value;
  if (!c) return false;
  const o = c.omitidos;
  return c.truncado || o.enlaces + o.denegados + o.especiales + o.enlacesDuros > 0;
});

/** Analizar la raíz de una unidad recorre el disco entero: se pide confirmación antes. */
function confirmarUnidad(ruta: string): Promise<boolean> {
  return new Promise((resolver) => {
    dialog.warning({
      title: t.raizUnidadTitulo,
      content: rellenar(t.raizUnidadTexto, { ruta }),
      positiveText: t.raizUnidadAnalizar,
      negativeText: textos.acciones.cancelar,
      autoFocus: false,
      closable: false,
      closeOnEsc: true,
      onPositiveClick: () => resolver(true),
      onNegativeClick: () => resolver(false),
      onClose: () => resolver(false),
      onEsc: () => resolver(false),
      onMaskClick: () => resolver(false),
    });
  });
}

/** Enter o Espacio sobre un dato copiable equivalen al clic (teclado). */
function copiarConTeclado(e: KeyboardEvent, texto: string): void {
  e.preventDefault();
  copiar(texto);
}

async function cancelarEscaneo(): Promise<void> {
  if (!analizando.value) return;
  await api()
    .discoUso.cancelar()
    .catch(() => undefined);
  await escaneo?.catch(() => undefined);
}

async function cargar(nueva: InfoRuta): Promise<void> {
  const mio = ++turno;
  // Un análisis de carpeta anterior se cancela antes de empezar otro (solo corre uno a la vez).
  await cancelarEscaneo();
  if (mio !== turno) return;
  info.value = nueva;
  hashes.value = [];
  carpeta.value = null;
  cancelada.value = false;
  error.value = null;
  progreso.value = null;
  calculando.value = false;
  analizando.value = false;

  if (nueva.tipo === 'archivo') {
    // Pasa del tope: se muestran los datos sin hashes (sensible o no, la regla es la misma).
    if (nueva.hash !== 'calcular') return;
    calculando.value = true;
    try {
      const h: HashesArchivo = await api().infoArchivo.hashes(nueva.ruta);
      if (mio !== turno) return;
      hashes.value = [
        ['MD5', h.md5],
        ['SHA-1', h.sha1],
        ['SHA-256', h.sha256],
      ];
    } catch (e) {
      if (mio === turno) error.value = mensajeDeError(e);
    } finally {
      if (mio === turno) calculando.value = false;
    }
    return;
  }

  // Sin confirmar, se muestran los datos de la unidad pero no se recorre.
  if (esRaizDeUnidad(nueva.ruta) && !(await confirmarUnidad(nueva.ruta))) return;
  if (mio !== turno) return;
  analizando.value = true;
  const trabajo = api().infoArchivo.carpeta(nueva.ruta);
  escaneo = trabajo;
  try {
    const r = await trabajo;
    if (mio === turno) carpeta.value = r;
  } catch (e) {
    if (mio !== turno) return;
    if ((e as { codigo?: unknown } | null)?.codigo === 'disco.cancelado') cancelada.value = true;
    else error.value = mensajeDeError(e);
  } finally {
    if (mio === turno) analizando.value = false;
    if (escaneo === trabajo) escaneo = null;
  }
}

/** El selector entrega un `File`: el preload saca su ruta; aquí no hay ninguna ruta. */
async function elegido(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;
  try {
    const i = await api().infoArchivo.elegir(archivo);
    await cargar(i);
  } catch (err) {
    info.value = null;
    error.value = mensajeDeError(err);
  }
}

const cancelar = (): Promise<unknown> => api().discoUso.cancelar();

async function abrirEnDisco(): Promise<void> {
  const i = info.value;
  if (!i || i.tipo !== 'carpeta') return;
  // Sin un análisis en curso: Uso del disco solo corre uno a la vez.
  await cancelarEscaneo();
  solicitudes.carpetaDisco = i.ruta;
  solicitudes.herramienta = 'usoDisco';
}

// Pedido de la ventana (algo soltado en cualquier parte, `abrirInfoArchivo`).
watch(
  () => solicitudes.archivoInfo,
  (i) => {
    if (!i) return;
    solicitudes.archivoInfo = null;
    void cargar(i);
  },
  { immediate: true },
);

onMounted(() => {
  baja = api().on('disco:progreso', (p) => {
    if (analizando.value) progreso.value = p;
  });
});
onBeforeUnmount(() => {
  baja?.();
  turno++;
  if (analizando.value)
    void api()
      .discoUso.cancelar()
      .catch(() => undefined);
});
</script>

<template>
  <div class="herr">
    <div class="herr-fila">
      <label class="boton">
        <input type="file" @change="elegido" />
        <span>{{ t.elegir }}</span>
      </label>
      <span class="herr-tenue">{{ t.ayuda }}</span>
    </div>
    <div class="zona" role="note">{{ t.zona }}</div>

    <dl v-if="info" class="herr-datos">
      <dt>{{ t.nombre }}</dt>
      <dd>{{ info.nombre }}</dd>
      <dt>{{ t.ruta }}</dt>
      <dd
        class="copiable"
        role="button"
        tabindex="0"
        :title="textos.acciones.copiar"
        @click="copiar(info.ruta)"
        @keydown.enter="copiarConTeclado($event, info.ruta)"
        @keydown.space="copiarConTeclado($event, info.ruta)"
      >
        {{ info.ruta }}
      </dd>
      <dt>{{ t.tipo }}</dt>
      <dd>{{ info.tipo === 'carpeta' ? t.esCarpeta : t.esArchivo }}</dd>
      <template v-if="info.tipo === 'archivo'">
        <dt>{{ t.mime }}</dt>
        <dd>{{ info.mime ?? t.sinTipo }}</dd>
        <dt>{{ t.tamano }}</dt>
        <dd>{{ tamanoLegible(info.tamano ?? 0) }} ({{ formatearNumero(info.tamano ?? 0) }} B)</dd>
        <template v-if="info.imagen">
          <dt>{{ t.dimensiones }}</dt>
          <dd>{{ info.imagen.ancho }} × {{ info.imagen.alto }} px</dd>
        </template>
      </template>
      <dt>{{ t.creado }}</dt>
      <dd>{{ fecha(info.creado) }}</dd>
      <dt>{{ t.modificado }}</dt>
      <dd>{{ fecha(info.modificado) }}</dd>
      <dt>{{ t.accedido }}</dt>
      <dd>{{ fecha(info.accedido) }}</dd>
      <dt>{{ t.atributos }}</dt>
      <dd>{{ atributos }}</dd>
      <template v-if="carpeta">
        <dt>{{ t.tamanoTotal }}</dt>
        <dd>{{ tamanoLegible(carpeta.total) }} ({{ formatearNumero(carpeta.total) }} B)</dd>
        <dt>{{ t.archivos }}</dt>
        <dd>{{ formatearNumero(carpeta.archivos) }}</dd>
        <dt>{{ t.carpetas }}</dt>
        <dd>{{ formatearNumero(carpeta.carpetas) }}</dd>
      </template>
      <template v-for="[a, h] in hashes" :key="a">
        <dt>{{ a }}</dt>
        <dd
          class="copiable"
          role="button"
          tabindex="0"
          :title="textos.acciones.copiar"
          @click="copiar(h)"
          @keydown.enter="copiarConTeclado($event, h)"
          @keydown.space="copiarConTeclado($event, h)"
        >
          {{ h }}
        </dd>
      </template>
    </dl>

    <p v-if="info?.sensible" class="herr-tenue">{{ t.sensible }}</p>
    <p v-if="info && info.tipo === 'archivo' && info.hash === 'grande'" class="herr-tenue">
      {{ t.grande }}
    </p>
    <p v-if="incompleto" class="herr-tenue">{{ t.incompleto }}</p>
    <p v-if="cancelada" class="herr-tenue">{{ t.cancelado }}</p>

    <div v-if="calculando" class="herr-fila">
      <NSpin :size="16" />
      <span class="herr-tenue">{{ t.calculando }}</span>
    </div>
    <div v-if="analizando" class="herr-fila">
      <NSpin :size="16" />
      <span class="herr-tenue">
        {{ t.analizando
        }}<template v-if="progreso">
          ({{ t.archivos }}: {{ formatearNumero(progreso.archivos) }})</template
        >
      </span>
      <NButton size="small" @click="cancelar">{{ t.cancelar }}</NButton>
    </div>
    <div v-if="info?.tipo === 'carpeta'" class="herr-fila">
      <NButton size="small" secondary :disabled="analizando" @click="abrirEnDisco">
        {{ t.abrirDisco }}
      </NButton>
    </div>
    <p v-if="error" class="herr-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.boton {
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  height: 34px;
  border-radius: 6px;
  background: var(--acento);
  color: var(--sobre-acento);
  font-size: 14px;
  cursor: pointer;
}
.boton:focus-within {
  outline: 2px solid rgba(var(--acento-rgb), 0.5);
  outline-offset: 2px;
}
.boton input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.zona {
  margin: 12px 0;
  padding: 18px 14px;
  text-align: center;
  border: 2px dashed rgba(var(--acento-rgb), 0.45);
  border-radius: 10px;
  background: rgba(var(--acento-rgb), 0.05);
  font-size: 13px;
}
.copiable {
  cursor: copy;
  /* Un hash o una ruta larga no tienen espacios: se parten donde haga falta para no desbordar. */
  word-break: break-all;
}
.copiable:focus-visible {
  outline: 2px solid rgba(var(--acento-rgb), 0.6);
  outline-offset: 2px;
  border-radius: 4px;
}
</style>

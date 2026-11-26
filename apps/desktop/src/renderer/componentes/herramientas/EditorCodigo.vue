<script setup lang="ts">
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { MAX_BYTES_EDITOR } from '@pel/core';
import { NAlert, NButton, NInput, NTag, useDialog, useNotification } from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { ArchivoEditor, RiesgoEditor } from '../../../shared/api';
import { api } from '../../api';
import { solicitudes } from '../../composables/solicitudes';
import { textos } from '../../i18n';
import { extensionesBase, lenguajeDe, temaEditor } from '../../utilidades/editorCm';
import { mensajeDeError } from '../../utilidades/errores';

/**
 * Editor de código (D43). El archivo siempre se elige en el diálogo nativo (o llega de Buscar por
 * `abrirEnEditor`). Guardar pide confirmación, deja una copia previa y avisa si el archivo cambió
 * fuera del editor; los archivos con forma de secreto o de un sitio con datos reales piden además
 * escribir su nombre. Los `.env` nunca se abren aquí: el núcleo los rechaza.
 */
const t = textos.editorCodigo;
const notificacion = useNotification();
const dialogo = useDialog();

const MAX_MB = MAX_BYTES_EDITOR / (1024 * 1024);

const host = ref<HTMLElement | null>(null);
const vista = shallowRef<EditorView | null>(null);
const compTema = new Compartment();

const archivo = ref<ArchivoEditor | null>(null);
/** La ruta tal como salió del diálogo: con esa se abre y se guarda (nunca la ruta real). */
const rutaElegida = ref('');
const modificado = ref(false);
const ocupado = ref<'abrir' | 'guardar' | null>(null);
const posicion = ref({ linea: 1, columna: 1 });
const aviso = ref<{ tipo: 'ok'; texto: string } | null>(null);

/** Riesgos de un archivo que aún no se abrió: se pide escribir su nombre. */
const pendiente = ref<{ ruta: string; nombre: string; riesgos: RiesgoEditor[] } | null>(null);
const escrito = ref('');
type PanelGuardar = 'normal' | 'refuerzo' | 'cambio-externo' | 'sobrescribir' | null;
const panel = ref<PanelGuardar>(null);

const oscuro = ref(false);
let observador: MutationObserver | null = null;
const leerTema = (): boolean => document.documentElement.dataset['tema'] === 'oscuro';

const sensible = computed(() => (archivo.value?.riesgos.length ?? 0) > 0);

function textoRiesgos(riesgos: RiesgoEditor[]): string[] {
  return riesgos.map((r) => (r === 'secreto' ? t.refuerzo.secreto : t.refuerzo.datosReales));
}

function notificarError(e: unknown): void {
  notificacion.error({
    title: textos.errores.titulo,
    content: mensajeDeError(e),
    duration: 10000,
    keepAliveOnHover: true,
  });
}

function crearVista(): void {
  if (!host.value || vista.value) return;
  vista.value = new EditorView({ parent: host.value, state: estadoVacio() });
}

function estadoVacio(doc = '', lenguaje: Extension[] = []): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      compTema.of(temaEditor(oscuro.value)),
      extensionesBase({
        etiqueta: t.areaTexto(archivo.value?.nombre ?? ''),
        frases: t.cm,
        alCambiar: () => {
          modificado.value = true;
          aviso.value = null;
        },
        alMoverCursor: (linea, columna) => {
          posicion.value = { linea, columna };
        },
        alGuardar: pedirGuardar,
      }),
      ...lenguaje,
    ],
  });
}

/** Pone el archivo en el editor (con su lenguaje) y deja el historial limpio. */
async function mostrar(a: ArchivoEditor): Promise<void> {
  const lenguaje = await lenguajeDe(a.nombre);
  archivo.value = a;
  modificado.value = false;
  panel.value = null;
  pendiente.value = null;
  escrito.value = '';
  await nextTick();
  crearVista();
  vista.value?.setState(estadoVacio(a.contenido, lenguaje ? [lenguaje] : []));
  posicion.value = { linea: 1, columna: 1 };
}

async function confirmarDescartar(): Promise<boolean> {
  if (!modificado.value) return true;
  return new Promise((resolver) => {
    dialogo.warning({
      title: t.descartar.titulo,
      content: t.descartar.texto,
      positiveText: t.descartar.confirmar,
      negativeText: t.descartar.seguir,
      onPositiveClick: () => resolver(true),
      onNegativeClick: () => resolver(false),
      onClose: () => resolver(false),
      onMaskClick: () => resolver(false),
    });
  });
}

async function abrirRuta(ruta: string, confirmadoRiesgo = false): Promise<void> {
  ocupado.value = 'abrir';
  try {
    const r = await api().editorCodigo.abrir(ruta, confirmadoRiesgo ? { confirmadoRiesgo } : {});
    if (r.estado === 'confirmar') {
      pendiente.value = { ruta, nombre: r.nombre, riesgos: r.riesgos };
      escrito.value = '';
      return;
    }
    rutaElegida.value = ruta;
    await mostrar(r.archivo);
  } catch (e) {
    notificarError(e);
  } finally {
    ocupado.value = null;
  }
}

async function elegir(): Promise<void> {
  if (!(await confirmarDescartar())) return;
  ocupado.value = 'abrir';
  let ruta: string | null = null;
  try {
    ruta = await api().sistema.elegirArchivo();
  } catch (e) {
    notificarError(e);
  } finally {
    ocupado.value = null;
  }
  if (ruta) await abrirRuta(ruta);
}

async function recargar(): Promise<void> {
  if (!rutaElegida.value || !(await confirmarDescartar())) return;
  await abrirRuta(rutaElegida.value, sensible.value);
}

function pedirGuardar(): void {
  if (!archivo.value || ocupado.value) return;
  escrito.value = '';
  panel.value = sensible.value ? 'refuerzo' : 'normal';
}

const nombreCoincide = computed(
  () => escrito.value.trim() === (pendiente.value?.nombre ?? archivo.value?.nombre ?? '\0'),
);

async function guardar(sobrescribir = false): Promise<void> {
  const a = archivo.value;
  const v = vista.value;
  if (!a || !v) return;
  ocupado.value = 'guardar';
  try {
    const r = await api().editorCodigo.guardar(rutaElegida.value, {
      contenido: v.state.doc.toString(),
      // Copia plana: un proxy reactivo de Vue no se puede clonar por el IPC.
      huella: { tamano: a.huella.tamano, mtimeMs: a.huella.mtimeMs, hash: a.huella.hash },
      eol: a.eol,
      bom: a.bom,
      confirmado: true,
      ...(sensible.value ? { confirmadoRiesgo: true } : {}),
      ...(sobrescribir ? { sobrescribir: true } : {}),
    });
    if (r.estado === 'cambiado') {
      panel.value = 'cambio-externo';
    } else if (r.estado === 'reforzar') {
      // El texto nuevo trae un secreto que el archivo no tenía: se pide el refuerzo.
      archivo.value = { ...a, riesgos: [...new Set<RiesgoEditor>([...a.riesgos, 'secreto'])] };
      escrito.value = '';
      panel.value = 'refuerzo';
    } else {
      archivo.value = { ...a, huella: r.huella };
      modificado.value = false;
      panel.value = null;
      aviso.value = { tipo: 'ok', texto: `${t.guardado} ${t.copiaPrevia(r.copia)}` };
    }
  } catch (e) {
    panel.value = null;
    notificarError(e);
  } finally {
    ocupado.value = null;
  }
}

async function recargarDescartando(): Promise<void> {
  modificado.value = false;
  panel.value = null;
  await abrirRuta(rutaElegida.value, sensible.value);
}

// Pedido de Buscar (D44) u otra pantalla: `abrirEnEditor(ruta)`.
watch(
  () => solicitudes.archivoEditor,
  async (ruta) => {
    if (!ruta) return;
    solicitudes.archivoEditor = null;
    if (await confirmarDescartar()) await abrirRuta(ruta);
  },
  { immediate: true },
);

watch(modificado, (v) => {
  solicitudes.editorSinGuardar = v;
});

watch(oscuro, (v) => {
  vista.value?.dispatch({ effects: compTema.reconfigure(temaEditor(v)) });
});

onMounted(() => {
  oscuro.value = leerTema();
  observador = new MutationObserver(() => {
    oscuro.value = leerTema();
  });
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-tema'],
  });
  crearVista();
});

onBeforeUnmount(() => {
  observador?.disconnect();
  vista.value?.destroy();
  vista.value = null;
  solicitudes.editorSinGuardar = false;
});
</script>

<template>
  <div class="herr editor">
    <p class="herr-tenue">{{ t.intro(MAX_MB) }}</p>

    <div class="herr-fila">
      <NButton
        type="primary"
        size="small"
        :loading="ocupado === 'abrir'"
        :disabled="ocupado === 'guardar'"
        @click="elegir"
      >
        {{ ocupado === 'abrir' ? t.abriendo : t.abrir }}
      </NButton>
      <NButton
        v-if="archivo"
        size="small"
        :loading="ocupado === 'guardar'"
        :disabled="!modificado || ocupado !== null"
        @click="pedirGuardar"
      >
        {{ ocupado === 'guardar' ? t.guardando : t.guardar }}
      </NButton>
      <NButton v-if="archivo" size="small" secondary :disabled="ocupado !== null" @click="recargar">
        {{ t.recargar }}
      </NButton>
    </div>

    <p v-if="archivo" class="info">
      <strong class="nombre" :title="archivo.ruta">{{ archivo.nombre }}</strong>
      <NTag size="small" :bordered="false" :type="modificado ? 'warning' : 'default'">
        {{ modificado ? t.conCambios : t.sinCambios }}
      </NTag>
      <span class="herr-tenue">{{ t.posicion(posicion.linea, posicion.columna) }}</span>
    </p>

    <!-- Archivo delicado: se pide escribir su nombre antes de abrirlo. -->
    <section v-if="pendiente" class="panel" role="alertdialog" :aria-label="t.refuerzo.abrirTitulo">
      <strong>{{ t.refuerzo.abrirTitulo }}: {{ pendiente.nombre }}</strong>
      <p v-for="r in textoRiesgos(pendiente.riesgos)" :key="r">{{ r }}</p>
      <p>{{ t.refuerzo.instruccion(pendiente.nombre) }}</p>
      <NInput
        v-model:value="escrito"
        size="small"
        :placeholder="t.refuerzo.etiqueta"
        :input-props="{ 'aria-label': t.refuerzo.etiqueta, spellcheck: false, autocomplete: 'off' }"
        @keydown.enter.prevent="nombreCoincide && abrirRuta(pendiente.ruta, true)"
      />
      <div class="herr-fila">
        <NButton
          type="warning"
          size="small"
          :disabled="!nombreCoincide"
          :loading="ocupado === 'abrir'"
          @click="abrirRuta(pendiente.ruta, true)"
        >
          {{ t.refuerzo.abrirBoton }}
        </NButton>
        <NButton size="small" secondary @click="pendiente = null">{{ t.cancelar }}</NButton>
      </div>
    </section>

    <!-- Guardar: confirmación normal. -->
    <section
      v-if="panel === 'normal' && archivo"
      class="panel"
      role="alertdialog"
      :aria-label="t.confirmarGuardar.titulo"
    >
      <strong>{{ t.confirmarGuardar.titulo }}</strong>
      <p>{{ t.confirmarGuardar.texto(archivo.nombre) }}</p>
      <div class="herr-fila">
        <NButton type="primary" size="small" :loading="ocupado === 'guardar'" @click="guardar()">
          {{ t.confirmarGuardar.boton }}
        </NButton>
        <NButton size="small" secondary @click="panel = null">{{ t.cancelar }}</NButton>
      </div>
    </section>

    <!-- Guardar un archivo delicado: confirmación reforzada. -->
    <section
      v-if="panel === 'refuerzo' && archivo"
      class="panel"
      role="alertdialog"
      :aria-label="t.refuerzo.guardarTitulo"
    >
      <strong>{{ t.refuerzo.guardarTitulo }}</strong>
      <p v-for="r in textoRiesgos(archivo.riesgos)" :key="r">{{ r }}</p>
      <p>{{ t.confirmarGuardar.texto(archivo.nombre) }}</p>
      <p>{{ t.refuerzo.instruccion(archivo.nombre) }}</p>
      <NInput
        v-model:value="escrito"
        size="small"
        :placeholder="t.refuerzo.etiqueta"
        :input-props="{ 'aria-label': t.refuerzo.etiqueta, spellcheck: false, autocomplete: 'off' }"
        @keydown.enter.prevent="nombreCoincide && guardar()"
      />
      <div class="herr-fila">
        <NButton
          type="warning"
          size="small"
          :disabled="!nombreCoincide"
          :loading="ocupado === 'guardar'"
          @click="guardar()"
        >
          {{ t.refuerzo.guardarBoton }}
        </NButton>
        <NButton size="small" secondary @click="panel = null">{{ t.cancelar }}</NButton>
      </div>
    </section>

    <!-- El archivo cambió fuera del editor: recargar o sobrescribir (confirmación aparte). -->
    <section
      v-if="panel === 'cambio-externo'"
      class="panel"
      role="alertdialog"
      :aria-label="t.cambioExterno.titulo"
    >
      <NAlert type="warning" :bordered="false" :show-icon="false">
        <strong>{{ t.cambioExterno.titulo }}</strong>
        <p>{{ t.cambioExterno.texto }}</p>
      </NAlert>
      <div class="herr-fila">
        <NButton size="small" type="primary" @click="recargarDescartando">
          {{ t.cambioExterno.recargar }}
        </NButton>
        <NButton size="small" type="warning" secondary @click="panel = 'sobrescribir'">
          {{ t.cambioExterno.sobrescribir }}
        </NButton>
        <NButton size="small" secondary @click="panel = null">{{ t.cancelar }}</NButton>
      </div>
    </section>

    <section
      v-if="panel === 'sobrescribir'"
      class="panel"
      role="alertdialog"
      :aria-label="t.cambioExterno.sobrescribirTitulo"
    >
      <strong>{{ t.cambioExterno.sobrescribirTitulo }}</strong>
      <p>{{ t.cambioExterno.sobrescribirTexto }}</p>
      <div class="herr-fila">
        <NButton
          type="warning"
          size="small"
          :loading="ocupado === 'guardar'"
          @click="guardar(true)"
        >
          {{ t.cambioExterno.sobrescribirBoton }}
        </NButton>
        <NButton size="small" secondary @click="panel = 'cambio-externo'">
          {{ t.cambioExterno.volver }}
        </NButton>
      </div>
    </section>

    <p v-if="aviso" class="herr-ok" role="status" aria-live="polite">{{ aviso.texto }}</p>
    <p v-if="!archivo && !pendiente" class="herr-tenue vacio">{{ t.vacio }}</p>

    <div v-show="archivo" ref="host" class="cm-host"></div>
    <p v-if="archivo" class="herr-tenue">{{ t.salirTeclado }}</p>
  </div>
</template>

<style scoped>
.info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.nombre {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
}
.panel p {
  margin: 0;
  font-size: 13px;
}
.vacio {
  padding: 24px 0;
}
.cm-host {
  height: min(62vh, 640px);
  min-height: 260px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  overflow: hidden;
}
.cm-host :deep(.cm-editor) {
  height: 100%;
}
</style>

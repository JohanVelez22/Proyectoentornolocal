<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCheckbox,
  NInput,
  NModal,
  NSpin,
  NStep,
  NSteps,
  NTag,
  useDialog,
  useMessage,
} from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type {
  PrefijoRuta,
  ProgresoPerfil,
  ResultadoImportarPerfil,
  VistaPreviaPerfil,
} from '../../shared/api';
import { api, plano } from '../api';
import { mensajeDeError } from '../composables/useAccion';
import { textos } from '../i18n';
import { traducirError } from '../utilidades/errores';
import {
  bloqueosImportar,
  estadoVersion,
  filaReemplaza,
  fraseNecesaria,
  huellaEnGrupos,
  lineasConfigQuitada,
  ofreceCa,
  opcionesImportar,
  prefijoDesdeElegida,
  puedeConfirmarRevision,
  puedeImportar,
  rellenar,
  resumenImportacion,
  type EstadoImportar,
} from '../utilidades/perfiles';
import PasoReasignarRutas from './PasoReasignarRutas.vue';

/**
 * Asistente "Importar un perfil": archivo (de un diálogo) → vista previa de todo lo que se
 * reemplaza, quita o queda pendiente → confirmación (CA, frase) → resultado con los pendientes.
 * La frase solo vive en este componente (nunca en un store) y se borra al terminar o al cerrar.
 */
const props = defineProps<{ show: boolean; carpetaPrueba: string | null }>();
const emit = defineEmits<{ cerrar: [] }>();

type Fase = 'archivo' | 'revisar' | 'confirmar' | 'importando' | 'fin';

const t = textos.perfiles.asistente;
const motivos = textos.perfiles.motivos as Record<string, string>;
const avisos = textos.perfiles.avisos as Record<string, string>;
const quitado = textos.perfiles.quitado;

const fase = ref<Fase>('archivo');
const archivo = ref<string | null>(null);
const cargando = ref(false);
const errorVista = ref<string | null>(null);
const vista = ref<VistaPreviaPerfil | null>(null);
const rutas = ref<Record<string, string>>({});
const prefijos = ref<PrefijoRuta[]>([]);
const sugerido = ref<PrefijoRuta | null>(null);
const comoPendiente = ref<Record<string, boolean>>({});
const frase = ref('');
const importarCa = ref(false);
const reemplazarCa = ref(false);
const aceptarSinRestricciones = ref(false);
const omitirBases = ref(false);
const envProyectos = ref<string[]>([]);
const resultado = ref<ResultadoImportarPerfil | null>(null);
const progreso = ref<ProgresoPerfil | null>(null);
const caQuitada = ref(false);
const dialog = useDialog();
const message = useMessage();

let bajaProgreso: (() => void) | null = null;
onMounted(() => {
  bajaProgreso = api().on('perfil:progreso', (p) => {
    progreso.value = p;
  });
});
onBeforeUnmount(() => bajaProgreso?.());
const errorImportar = ref<string | null>(null);

const estado = computed<EstadoImportar | null>(() =>
  vista.value
    ? {
        vista: vista.value,
        rutas: rutas.value,
        prefijos: prefijos.value,
        comoPendiente: comoPendiente.value,
        frase: frase.value,
        importarCa: importarCa.value,
        reemplazarCa: reemplazarCa.value,
        aceptarSinRestricciones: aceptarSinRestricciones.value,
        omitirBases: omitirBases.value,
        envProyectos: envProyectos.value,
      }
    : null,
);
const bloqueos = computed(() => (estado.value ? bloqueosImportar(estado.value) : []));
const necesitaFrase = computed(() => (estado.value ? fraseNecesaria(estado.value) : false));
const caOfrecida = computed(() => (vista.value ? ofreceCa(vista.value) : false));
const conBasesAImportar = computed(
  () => (vista.value?.bases.length ?? 0) > 0 && !omitirBases.value,
);
const resumen = computed(() => (resultado.value ? resumenImportacion(resultado.value) : null));
const pasoActual = computed(
  () => ({ archivo: 1, revisar: 2, confirmar: 3, importando: 3, fin: 4 })[fase.value],
);
const sitiosImportables = computed(() => vista.value?.sitios.filter((s) => !s.omitido) ?? []);
const nombreArchivo = computed(() => archivo.value?.split(/[\\/]/).pop() ?? '');

function limpiarFrase(): void {
  // Una cadena de JavaScript no se puede pisar: se suelta la referencia en cuanto deja de hacer falta.
  frase.value = '';
}

function reiniciar(): void {
  fase.value = 'archivo';
  archivo.value = null;
  vista.value = null;
  errorVista.value = null;
  rutas.value = {};
  prefijos.value = [];
  sugerido.value = null;
  comoPendiente.value = {};
  limpiarFrase();
  importarCa.value = false;
  reemplazarCa.value = false;
  aceptarSinRestricciones.value = false;
  omitirBases.value = false;
  envProyectos.value = [];
  resultado.value = null;
  errorImportar.value = null;
  progreso.value = null;
  caQuitada.value = false;
}

watch(
  () => props.show,
  () => reiniciar(),
  { immediate: true },
);

async function cargarVista(): Promise<void> {
  if (!archivo.value) return;
  cargando.value = true;
  errorVista.value = null;
  try {
    vista.value = await api().perfiles.vistaPrevia(
      archivo.value,
      plano({ rutas: rutas.value, prefijos: prefijos.value }),
    );
    fase.value = fase.value === 'archivo' ? 'revisar' : fase.value;
  } catch (e) {
    errorVista.value = `${t.archivo.error}: ${mensajeDeError(e)}`;
    if (fase.value === 'archivo') vista.value = null;
  } finally {
    cargando.value = false;
  }
}

async function elegirArchivo(): Promise<void> {
  let ruta: string | null;
  try {
    ruta = await api().sistema.elegirArchivo();
  } catch (e) {
    errorVista.value = mensajeDeError(e);
    return;
  }
  if (!ruta) return;
  reiniciar();
  archivo.value = ruta;
  await cargarVista();
}

async function elegirCarpeta(id: string): Promise<void> {
  const sitio = vista.value?.sitios.find((s) => s.id === id);
  let ruta: string | null;
  try {
    ruta = await api().sistema.elegirCarpeta();
  } catch (e) {
    errorVista.value = mensajeDeError(e);
    return;
  }
  if (!ruta || !sitio) return;
  rutas.value = { ...rutas.value, [id]: ruta };
  sugerido.value = prefijoDesdeElegida(sitio.carpeta, ruta);
  await cargarVista();
}

async function usarPrefijo(): Promise<void> {
  if (!sugerido.value) return;
  prefijos.value = [...prefijos.value, sugerido.value];
  sugerido.value = null;
  await cargarVista();
}

function marcarPendiente(id: string, valor: boolean): void {
  comoPendiente.value = { ...comoPendiente.value, [id]: valor };
}

function alternarEnv(id: string, valor: boolean): void {
  envProyectos.value = valor
    ? [...new Set([...envProyectos.value, id])]
    : envProyectos.value.filter((x) => x !== id);
}

async function importar(): Promise<void> {
  const e = estado.value;
  if (!e || !archivo.value || !puedeImportar(e)) return;
  fase.value = 'importando';
  errorImportar.value = null;
  progreso.value = null;
  try {
    resultado.value = await api().perfiles.importar(archivo.value, plano(opcionesImportar(e)));
  } catch (x) {
    errorImportar.value = mensajeDeError(x);
  } finally {
    // La frase se borra apenas termina, salga bien o mal.
    limpiarFrase();
    fase.value = 'fin';
  }
}

function cerrar(): void {
  if (fase.value === 'importando') return;
  limpiarFrase();
  emit('cerrar');
}

const fechaLegible = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};
function textoReemplaza(x: string): string {
  const f = filaReemplaza(x);
  if (!f) return x;
  const r = t.reemplaza;
  if (f.tipo === 'config') return r.config;
  if (f.tipo === 'ca') return r.ca;
  if (f.tipo === 'sitio') return r.sitio(f.id);
  if (f.tipo === 'plantilla') return r.plantilla(f.id);
  return r.base(f.base, f.instancia);
}
const textoMotivo = (m: string | null): string =>
  m === null ? '' : (motivos[m] ?? traducirError({ codigo: m }));
const textoQuitado = (tipo: keyof typeof quitado, id: string): string =>
  rellenar(quitado[tipo], { id });
function quitarCaAnterior(huella: string): void {
  dialog.warning({
    title: t.resultado.quitarCa.titulo,
    content: t.resultado.quitarCa.texto,
    positiveText: t.resultado.quitarCa.si,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: async () => {
      try {
        const r = await api().perfiles.quitarCaAnterior(huella);
        if (r.ok) {
          caQuitada.value = true;
          message.success(t.resultado.quitarCa.hecho);
        } else {
          message.error(r.mensaje);
        }
      } catch (e) {
        message.error(mensajeDeError(e));
      }
    },
  });
}
const textoAviso = (codigo: string, datos?: Record<string, string>): string =>
  rellenar(avisos[codigo] ?? codigo, datos);
const estadoTexto = (e: string): string => (t.resultado.estados as Record<string, string>)[e] ?? e;
const tipoDe = (e: string): 'success' | 'warning' | 'error' | 'default' =>
  e === 'importado' || e === 'instalada' || e === 'creada' || e === 'reescrito'
    ? 'success'
    : e === 'error'
      ? 'error'
      : e === 'pendiente' || e === 'omitido' || e === 'puerto_reasignado' || e === 'sin_marcar'
        ? 'warning'
        : 'default';
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t.titulo"
    :style="{ width: '780px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false"
    :closable="fase !== 'importando'"
    :close-on-esc="fase !== 'importando'"
    :auto-focus="false"
    @update:show="(v: boolean) => !v && cerrar()"
  >
    <NSteps :current="pasoActual" size="small" class="pasos">
      <NStep :title="t.pasos.archivo" />
      <NStep :title="t.pasos.revisar" />
      <NStep :title="t.pasos.confirmar" />
      <NStep :title="t.pasos.resultado" />
    </NSteps>

    <NAlert
      v-if="carpetaPrueba"
      type="info"
      :bordered="false"
      :title="textos.perfiles.pantalla.aislado.titulo"
      class="bloque"
    >
      {{ textos.perfiles.pantalla.aislado.texto(carpetaPrueba) }}
    </NAlert>

    <!-- 1 · Archivo -->
    <template v-if="fase === 'archivo'">
      <p class="intro">{{ t.archivo.texto }}</p>
      <div class="archivo">
        <span v-if="archivo" class="nombre" :title="archivo">{{ nombreArchivo }}</span>
        <span v-else class="vacio">{{ t.archivo.ninguno }}</span>
        <NButton :loading="cargando" @click="elegirArchivo">{{
          archivo ? t.archivo.cambiar : t.archivo.elegir
        }}</NButton>
      </div>
      <p v-if="cargando" class="estado"><NSpin :size="16" /> {{ t.archivo.leyendo }}</p>
      <NAlert v-if="errorVista" type="error" :bordered="false" class="bloque">{{
        errorVista
      }}</NAlert>
    </template>

    <!-- 2 · Revisar -->
    <template v-else-if="fase === 'revisar' && vista">
      <NAlert v-if="errorVista" type="error" :bordered="false" class="bloque">{{
        errorVista
      }}</NAlert>
      <p class="intro">
        {{ t.origen(fechaLegible(vista.creado), vista.origen.sistema) }}
        <template v-if="vista.ignoradas > 0"> {{ t.ignoradas(vista.ignoradas) }}</template>
      </p>

      <section class="bloque">
        <h3 class="subtitulo">{{ t.reemplaza.titulo }}</h3>
        <p v-if="vista.reemplaza.length === 0" class="ayuda">{{ t.reemplaza.ninguno }}</p>
        <template v-else>
          <ul class="items">
            <li v-for="x in vista.reemplaza" :key="x">{{ textoReemplaza(x) }}</li>
          </ul>
          <p class="ayuda">{{ t.reemplaza.copia }}</p>
        </template>
      </section>

      <PasoReasignarRutas
        v-if="vista.sitios.length > 0"
        class="bloque"
        :sitios="vista.sitios"
        :rutas="rutas"
        :como-pendiente="comoPendiente"
        :prefijo-sugerido="sugerido"
        :ocupado="cargando"
        @elegir="elegirCarpeta"
        @pendiente="marcarPendiente"
        @usar-prefijo="usarPrefijo"
      />

      <section class="bloque">
        <h3 class="subtitulo">{{ t.versiones.titulo }}</h3>
        <p v-if="vista.versiones.length === 0" class="ayuda">{{ t.versiones.ninguna }}</p>
        <ul v-else class="items">
          <li v-for="v in vista.versiones" :key="`${v.servicio}@${v.version}`" class="version">
            <strong>{{ v.servicio }} {{ v.version }}</strong>
            <NTag size="small" :bordered="false">{{ t.versiones.huellas[v.huella] }}</NTag>
            <span class="ayuda">{{ t.versiones[estadoVersion(v)] }}</span>
            <small v-if="v.sustituta" class="ayuda">{{
              t.versiones.sustituida(v.sustituta)
            }}</small>
          </li>
        </ul>
        <p v-if="vista.descargas > 0" class="ayuda">{{ t.versiones.descargas(vista.descargas) }}</p>
      </section>

      <section v-if="vista.instancias.length > 0" class="bloque">
        <h3 class="subtitulo">{{ t.instancias.titulo }}</h3>
        <ul class="items">
          <li v-for="i in vista.instancias" :key="i.id">
            <strong>{{ i.id }}</strong> —
            <template v-if="i.existente">{{ t.instancias.existente }}</template>
            <template v-else-if="i.puertoNuevo !== null && i.puertoNuevo !== i.puerto">{{
              t.instancias.reasignada(i.puerto, i.puertoNuevo)
            }}</template>
            <template v-else>{{ t.instancias.nueva(i.puerto) }}</template>
          </li>
        </ul>
      </section>

      <section class="bloque">
        <h3 class="subtitulo">{{ t.bases.titulo }}</h3>
        <p v-if="vista.bases.length === 0" class="ayuda">{{ t.bases.ninguna }}</p>
        <template v-else>
          <ul class="items">
            <li v-for="b in vista.bases" :key="`${b.instancia}/${b.base}`">
              <strong>{{ b.base }}</strong> ({{ b.instancia }})
            </li>
          </ul>
          <p class="ayuda">{{ t.bases.texto }}</p>
          <NCheckbox v-model:checked="omitirBases">{{ t.bases.omitir }}</NCheckbox>
        </template>
      </section>

      <section v-if="vista.plantillas.length > 0" class="bloque">
        <h3 class="subtitulo">{{ t.plantillas.titulo }}</h3>
        <ul class="items">
          <li v-for="p in vista.plantillas" :key="p.id">
            <strong>{{ p.id }}</strong> —
            {{ p.existe ? t.plantillas.existe : t.plantillas.nueva }}
          </li>
        </ul>
      </section>

      <section v-if="vista.workspaces.length > 0 || vista.workspacesInvalidos > 0" class="bloque">
        <h3 class="subtitulo">{{ t.workspaces.titulo }}</h3>
        <p class="ayuda">{{ t.workspaces.texto }}</p>
        <ul class="items">
          <li v-for="w in vista.workspaces" :key="w.id">
            <strong>{{ w.nombre }}</strong> ({{ t.workspaces.elementos(w.elementos) }}) —
            {{ w.existe ? t.workspaces.existe : t.workspaces.nuevo }}
          </li>
        </ul>
        <p v-if="vista.workspacesInvalidos > 0" class="ayuda">
          {{ t.workspaces.invalidos(vista.workspacesInvalidos) }}
        </p>
      </section>

      <section v-if="vista.configQuitada.length > 0" class="bloque">
        <h3 class="subtitulo">{{ t.quitado.titulo }}</h3>
        <p class="ayuda">{{ t.quitado.texto }}</p>
        <ul class="items">
          <li v-for="q in lineasConfigQuitada(vista.configQuitada)" :key="`${q.tipo}:${q.id}`">
            {{ textoQuitado(q.tipo, q.id) }}
          </li>
        </ul>
      </section>

      <NAlert
        v-if="vista.puertosOcupados.length > 0"
        type="warning"
        :bordered="false"
        class="bloque"
        :title="t.puertos.titulo"
      >
        {{ t.puertos.texto(vista.puertosOcupados.join(', ')) }}
      </NAlert>
    </template>

    <!-- 3 · Confirmar -->
    <template v-else-if="fase === 'confirmar' && vista">
      <h3 class="subtitulo">{{ t.confirmar.titulo }}</h3>
      <p class="intro">
        {{
          t.confirmar.resumen(
            sitiosImportables.length,
            vista.versiones.filter((v) => estadoVersion(v) === 'descargar').length,
            conBasesAImportar ? vista.bases.length : 0,
          )
        }}
      </p>

      <section v-if="vista.ca" class="bloque">
        <h3 class="subtitulo">{{ t.ca.titulo }}</h3>
        <p class="ayuda">{{ t.ca.texto }}</p>
        <p class="etiqueta-huella">{{ t.ca.huella }}</p>
        <p class="huella" data-huella-ca>{{ huellaEnGrupos(vista.ca.huella) }}</p>
        <p class="ayuda">{{ t.ca.comparar }}</p>
        <NAlert v-if="vista.ca.restriccionesAjenas" type="error" :bordered="false">{{
          t.ca.ajena
        }}</NAlert>
        <template v-else>
          <NAlert
            v-if="!vista.ca.restringida"
            type="error"
            :bordered="false"
            class="fuerte"
            data-aviso-ca
            >{{ t.ca.sinRestricciones }}</NAlert
          >
          <NCheckbox v-if="caOfrecida" v-model:checked="importarCa">{{ t.ca.importar }}</NCheckbox>
          <p v-if="!importarCa" class="ayuda">{{ t.ca.noImportar }}</p>
          <template v-if="importarCa">
            <NCheckbox
              v-if="!vista.ca.restringida"
              v-model:checked="aceptarSinRestricciones"
              data-aceptar-sin
              >{{ t.ca.aceptarSin }}</NCheckbox
            >
            <template v-if="vista.ca.reemplazaLocal">
              <p class="ayuda">{{ t.ca.reemplazaLocal }}</p>
              <NCheckbox v-model:checked="reemplazarCa">{{ t.ca.reemplazar }}</NCheckbox>
            </template>
            <p class="ayuda">{{ t.ca.noSeInstala }}</p>
          </template>
        </template>
      </section>

      <section v-if="necesitaFrase" class="bloque">
        <h3 class="subtitulo">{{ t.frase.titulo }}</h3>
        <p class="ayuda">{{ t.frase.texto }}</p>
        <NInput
          v-model:value="frase"
          type="password"
          show-password-on="click"
          :placeholder="t.frase.campo"
          :aria-label="t.frase.campo"
          :input-props="{ autocomplete: 'off', spellcheck: false }"
          maxlength="1024"
        />
        <NCheckbox v-if="vista.bases.length > 0" v-model:checked="omitirBases">{{
          t.frase.omitirBases
        }}</NCheckbox>
        <p class="ayuda">{{ t.frase.nota }}</p>
      </section>

      <section v-if="conBasesAImportar && sitiosImportables.length > 0" class="bloque">
        <h3 class="subtitulo">{{ t.env.titulo }}</h3>
        <p class="ayuda">{{ t.env.texto }}</p>
        <div class="casillas">
          <NCheckbox
            v-for="s in sitiosImportables"
            :key="s.id"
            :checked="envProyectos.includes(s.id)"
            @update:checked="(v: boolean) => alternarEnv(s.id, v)"
            >{{ s.nombre }}</NCheckbox
          >
        </div>
      </section>

      <ul v-if="bloqueos.length > 0" class="bloqueos" role="status">
        <li v-for="b in bloqueos" :key="b">{{ t.confirmar.bloqueos[b] }}</li>
      </ul>
    </template>

    <!-- Importando -->
    <div v-else-if="fase === 'importando'">
      <p class="estado"><NSpin :size="16" /> {{ t.progreso }}</p>
      <p v-if="progreso" class="ayuda" role="status" data-progreso>
        {{ t.fases[progreso.fase] }} — {{ t.avance(progreso.paso, progreso.de) }}
      </p>
    </div>

    <!-- 4 · Resultado -->
    <template v-else-if="fase === 'fin'">
      <h3 class="subtitulo">{{ t.resultado.titulo }}</h3>
      <NAlert v-if="errorImportar" type="error" :bordered="false" :title="t.resultado.error">{{
        errorImportar
      }}</NAlert>
      <template v-else-if="resultado && resumen">
        <p class="intro">
          {{
            t.resultado.resumen(
              resumen.importados,
              resumen.pendientes,
              resumen.omitidos,
              resumen.errores,
            )
          }}
        </p>
        <p v-if="resumen.pendientes + resumen.omitidos + resumen.errores > 0" class="ayuda">
          {{ t.resultado.pendientes }}
        </p>
        <p v-if="resultado.respaldo" class="ayuda">
          {{ t.resultado.respaldo(resultado.respaldo) }}
        </p>
        <NAlert
          v-for="(a, i) in resultado.avisos"
          :key="i"
          type="warning"
          :bordered="false"
          class="bloque"
          >{{ textoAviso(a.codigo, a.datos) }}
          <div
            v-if="a.codigo === 'ca_reemplazada' && a.datos?.huella && !caQuitada"
            class="acciones-aviso"
          >
            <NButton size="small" @click="quitarCaAnterior(a.datos.huella)">{{
              t.resultado.quitarCa.boton
            }}</NButton>
          </div></NAlert
        >

        <section v-if="resultado.sitios.length" class="bloque">
          <h4 class="subtitulo">{{ t.resultado.secciones.sitios }}</h4>
          <ul class="items resultado">
            <li v-for="s in resultado.sitios" :key="s.id">
              <strong>{{ s.id }}</strong>
              <NTag size="small" :type="tipoDe(s.estado)" :bordered="false">{{
                estadoTexto(s.estado)
              }}</NTag>
              <small v-for="m in s.motivos" :key="m">{{ textoMotivo(m) }}</small>
            </li>
          </ul>
        </section>
        <section v-if="resultado.versiones.length" class="bloque">
          <h4 class="subtitulo">{{ t.resultado.secciones.versiones }}</h4>
          <ul class="items resultado">
            <li v-for="v in resultado.versiones" :key="`${v.servicio}@${v.version}`">
              <strong>{{ v.servicio }} {{ v.version }}</strong>
              <NTag size="small" :type="tipoDe(v.estado)" :bordered="false">{{
                estadoTexto(v.estado)
              }}</NTag>
              <small v-if="v.instaladaComo">{{ t.resultado.sustituida(v.instaladaComo) }}</small>
              <small v-else-if="v.motivo">{{ textoMotivo(v.motivo) }}</small>
              <small v-if="v.detalle">{{ v.detalle }}</small>
            </li>
          </ul>
        </section>
        <section v-if="resultado.instancias.length" class="bloque">
          <h4 class="subtitulo">{{ t.resultado.secciones.instancias }}</h4>
          <ul class="items resultado">
            <li v-for="i in resultado.instancias" :key="i.id">
              <strong>{{ i.id }}</strong>
              <NTag size="small" :type="tipoDe(i.estado)" :bordered="false">{{
                estadoTexto(i.estado)
              }}</NTag>
              <small v-if="i.puerto !== i.puertoOriginal">{{
                t.resultado.puerto(i.puertoOriginal, i.puerto)
              }}</small>
            </li>
          </ul>
        </section>
        <section v-if="resultado.bases.length" class="bloque">
          <h4 class="subtitulo">{{ t.resultado.secciones.bases }}</h4>
          <ul class="items resultado">
            <li v-for="b in resultado.bases" :key="`${b.instancia}/${b.base}`">
              <strong>{{ b.base }}</strong> ({{ b.instancia }})
              <NTag size="small" :type="tipoDe(b.estado)" :bordered="false">{{
                estadoTexto(b.estado)
              }}</NTag>
              <small v-if="b.motivo">{{ textoMotivo(b.motivo) }}</small>
              <small v-if="b.detalle">{{ b.detalle }}</small>
            </li>
          </ul>
        </section>
        <section v-if="resultado.plantillas.length" class="bloque">
          <h4 class="subtitulo">{{ t.resultado.secciones.plantillas }}</h4>
          <ul class="items resultado">
            <li v-for="p in resultado.plantillas" :key="p.id">
              <strong>{{ p.id }}</strong>
              <NTag size="small" :type="tipoDe(p.estado)" :bordered="false">{{
                estadoTexto(p.estado)
              }}</NTag>
              <small v-if="p.motivo">{{ textoMotivo(p.motivo) }}</small>
              <small v-if="p.detalle">{{ p.detalle }}</small>
            </li>
          </ul>
        </section>
        <section v-if="resultado.workspaces.length || resultado.workspacesInvalidos" class="bloque">
          <h4 class="subtitulo">{{ t.resultado.secciones.workspaces }}</h4>
          <ul class="items resultado">
            <li v-for="w in resultado.workspaces" :key="w.id">
              <strong>{{ w.nombre }}</strong>
              <NTag size="small" :type="tipoDe(w.estado)" :bordered="false">{{
                estadoTexto(w.estado)
              }}</NTag>
              <small v-if="w.descartados.some((d) => d !== 'elemento_invalido')">{{
                t.resultado.descartadosWorkspace(
                  w.descartados.filter((d) => d !== 'elemento_invalido').join(', '),
                )
              }}</small>
            </li>
          </ul>
          <p v-if="resultado.workspacesInvalidos" class="ayuda">
            {{ t.resultado.workspacesInvalidos(resultado.workspacesInvalidos) }}
          </p>
        </section>
        <section v-if="resultado.env.length" class="bloque">
          <h4 class="subtitulo">{{ t.resultado.secciones.env }}</h4>
          <ul class="items resultado">
            <li v-for="e in resultado.env" :key="e.sitioId">
              <strong>{{ e.sitioId }}</strong>
              <NTag size="small" :type="tipoDe(e.estado)" :bordered="false">{{
                estadoTexto(e.estado)
              }}</NTag>
              <small v-if="e.motivo">{{ textoMotivo(e.motivo) }}</small>
              <small v-if="e.detalle">{{ e.detalle }}</small>
              <small v-if="e.copia">{{ t.resultado.copiaEnv(e.copia) }}</small>
            </li>
          </ul>
        </section>
        <section class="bloque">
          <h4 class="subtitulo">{{ t.resultado.secciones.ca }}</h4>
          <p class="ayuda">{{ t.resultado.ca[resultado.ca] }}</p>
        </section>
      </template>
    </template>

    <template #footer>
      <div class="pie">
        <template v-if="fase === 'archivo'">
          <NButton @click="cerrar">{{ textos.acciones.cancelar }}</NButton>
        </template>
        <template v-else-if="fase === 'revisar'">
          <NButton @click="cerrar">{{ textos.acciones.cancelar }}</NButton>
          <NButton :disabled="cargando" @click="reiniciar">{{ t.archivo.cambiar }}</NButton>
          <NButton
            type="primary"
            :disabled="!puedeConfirmarRevision({ cargando, hayVista: !!vista, errorVista })"
            @click="fase = 'confirmar'"
            >{{ t.confirmar.titulo }}</NButton
          >
        </template>
        <template v-else-if="fase === 'confirmar'">
          <NButton @click="fase = 'revisar'">{{ t.confirmar.volver }}</NButton>
          <NButton type="primary" :disabled="bloqueos.length > 0" @click="importar">{{
            t.confirmar.importar
          }}</NButton>
        </template>
        <NButton v-else-if="fase === 'fin'" type="primary" @click="cerrar">{{
          textos.acciones.cerrar
        }}</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.pasos {
  margin-bottom: 14px;
}
.intro {
  margin: 0 0 12px;
  font-size: 12.5px;
  opacity: 0.85;
}
.bloque {
  margin-top: 14px;
}
.subtitulo {
  margin: 0 0 6px;
  font-size: 14px;
}
.ayuda {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.76;
}
.items {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.items.resultado {
  list-style: none;
  padding-left: 0;
}
.items.resultado li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.items small {
  opacity: 0.75;
}
.version {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.archivo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nombre {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  word-break: break-all;
}
.vacio {
  opacity: 0.72;
}
.estado {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}
.etiqueta-huella {
  margin: 8px 0 2px;
  font-size: 12px;
  opacity: 0.76;
}
.huella {
  margin: 0 0 6px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 2px solid var(--texto-error, #d03050);
  font-family: var(--fuente-mono);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.04em;
  word-break: break-word;
}
.fuerte {
  margin: 8px 0;
}
.casillas {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 160px;
  overflow: auto;
}
.bloqueos {
  margin: 14px 0 0;
  padding-left: 18px;
  font-size: 12.5px;
  color: var(--texto-error);
}
.acciones-aviso {
  margin-top: 8px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

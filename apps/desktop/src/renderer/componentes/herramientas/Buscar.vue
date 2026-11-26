<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCheckbox,
  NInput,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
} from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type {
  FinBusqueda,
  LoteBusqueda,
  OpcionesBusquedaIpc,
  ResultadoBusqueda,
  ResumenBusqueda,
} from '../../../shared/api';
import { api } from '../../api';
import { abrirEnEditor } from '../../composables/abrirEnEditor';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { useSitios } from '../../stores/sitios';
import { traducirError } from '../../utilidades/errores';
import Desplegable from '../Desplegable.vue';
import EstadoVacio from '../EstadoVacio.vue';
import { Search } from '@vicons/ionicons5';

const t = textos.herramientas.busqueda;
const { ejecutar, ocupado } = useAccion();
const sitios = useSitios();

/** Tope de resultados que se guardan en la ventana; el núcleo ya limita a 2 000 coincidencias. */
const MAX_FILAS = 2000;
/** Resultados dibujados por grupo al principio y cada vez que se pide más (la lista grande pesa). */
const PASO_VISTA = 200;

const sitioId = ref<string | null>(null);
const rutaElegida = ref<string | null>(null);
const consulta = ref('');
const modo = ref<'nombre' | 'contenido' | 'ambos'>('ambos');
const regex = ref(false);
const mayusculas = ref(false);
const incluirPesadas = ref(false);
const contexto = ref(2);
const incluir = ref('');
// Las carpetas pesadas ya las salta el núcleo; aquí van solo las que el usuario quiera sumar.
const excluir = ref('');

const resultados = ref<ResultadoBusqueda[]>([]);
const resumen = ref<ResumenBusqueda | null>(null);
const errorBusqueda = ref<string | null>(null);
const buscando = ref(false);
const raizActual = ref('');
/** Búsqueda cuyos resultados se muestran (sigue valiendo para abrir en el editor tras terminar). */
const idMostrada = ref<string | null>(null);
const verNombres = ref(PASO_VISTA);
const verContenido = ref(PASO_VISTA);
/** Resultado elegido con el teclado (su `id`). */
const elegido = ref<number | null>(null);

let idActual: string | null = null;
/** Eventos que llegan antes de que el invoke devuelva el id de la búsqueda. */
let adelantados: { lote?: LoteBusqueda; fin?: FinBusqueda }[] = [];
const bajas: (() => void)[] = [];
const entrada = ref<InstanceType<typeof NInput> | null>(null);
const lista = ref<HTMLElement | null>(null);

const opcionesSitio = computed(() =>
  sitios.lista.map((s) => ({ label: s.nombre || s.dominio, value: s.id })),
);
const puedeBuscar = computed(
  () => (sitioId.value !== null || rutaElegida.value !== null) && consulta.value.trim() !== '',
);
const origenTexto = computed(() => rutaElegida.value ?? '');

const separar = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x !== '');

const normal = (s: string): string => s.replace(/\\/g, '/').toLowerCase();
function relativa(archivo: string): string {
  const raiz = normal(raizActual.value).replace(/\/+$/, '');
  const a = archivo.replace(/\\/g, '/');
  return raiz && normal(a).startsWith(`${raiz}/`) ? a.slice(raiz.length + 1) : a;
}

const nombres = computed(() => resultados.value.filter((r) => r.tipo === 'nombre'));
const contenidos = computed(() => resultados.value.filter((r) => r.tipo === 'contenido'));
const nombresVistos = computed(() => nombres.value.slice(0, verNombres.value));
const contenidosVistos = computed(() =>
  contenidos.value.slice(0, verContenido.value).map((r, i, todos) => ({
    r,
    // El nombre del archivo se pone una vez por cada racha de coincidencias del mismo archivo.
    cabecera: i === 0 || todos[i - 1]!.archivo !== r.archivo,
  })),
);
/** Orden de navegación con el teclado: primero los nombres, luego el contenido. */
const orden = computed(() => [...nombresVistos.value, ...contenidosVistos.value.map((x) => x.r)]);

function alLote(l: LoteBusqueda): void {
  const libres = MAX_FILAS - resultados.value.length;
  if (libres > 0) resultados.value.push(...l.resultados.slice(0, libres));
}

function alFin(f: FinBusqueda): void {
  buscando.value = false;
  idActual = null;
  resumen.value = f.resumen;
  errorBusqueda.value = f.error
    ? traducirError({ codigo: f.error.codigo, mensaje: f.error.mensaje })
    : null;
}

function aplicar(e: { lote?: LoteBusqueda; fin?: FinBusqueda }, id: string): void {
  if (e.lote && e.lote.id === id) alLote(e.lote);
  if (e.fin && e.fin.id === id) alFin(e.fin);
}

onMounted(() => {
  sitios.iniciar();
  void api()
    .sitios.listar()
    .then((l) => sitios.hidratar(l))
    .catch(() => undefined);
  bajas.push(
    api().on('busqueda:resultado', (lote) => {
      if (idActual === null && buscando.value) adelantados.push({ lote });
      else if (lote.id === idActual) alLote(lote);
    }),
    api().on('busqueda:fin', (fin) => {
      if (idActual === null && buscando.value) adelantados.push({ fin });
      else if (fin.id === idActual) alFin(fin);
    }),
  );
});

onBeforeUnmount(() => {
  bajas.forEach((b) => b());
  if (idActual)
    void api()
      .buscar.cancelar(idActual)
      .catch(() => undefined);
});

async function elegirCarpeta(): Promise<void> {
  const r = await ejecutar('elegir', () => api().sistema.elegirCarpeta());
  if (r) {
    rutaElegida.value = r;
    sitioId.value = null;
  }
}

async function elegirArchivo(): Promise<void> {
  const r = await ejecutar('elegir', () => api().sistema.elegirArchivo());
  if (r) {
    rutaElegida.value = r;
    sitioId.value = null;
  }
}

function alElegirSitio(id: string | null): void {
  sitioId.value = id;
  if (id) rutaElegida.value = null;
}

async function iniciar(): Promise<void> {
  if (!puedeBuscar.value || buscando.value) return;
  const comunes = {
    consulta: consulta.value,
    modo: modo.value,
    regex: regex.value,
    mayusculas: mayusculas.value,
    incluir: separar(incluir.value),
    excluir: separar(excluir.value),
    contexto: Math.min(5, Math.max(0, Math.round(contexto.value ?? 2))),
    incluirPesadas: incluirPesadas.value,
  };
  const opciones: OpcionesBusquedaIpc =
    sitioId.value !== null
      ? { ...comunes, sitioId: sitioId.value }
      : { ...comunes, rutaElegida: rutaElegida.value ?? '' };
  resultados.value = [];
  resumen.value = null;
  errorBusqueda.value = null;
  adelantados = [];
  idActual = null;
  idMostrada.value = null;
  elegido.value = null;
  verNombres.value = PASO_VISTA;
  verContenido.value = PASO_VISTA;
  buscando.value = true;
  raizActual.value =
    sitioId.value !== null
      ? (sitios.porId(sitioId.value)?.carpeta ?? '')
      : (rutaElegida.value ?? '');
  const id = await ejecutar('buscar', () => api().buscar.iniciar(opciones));
  if (!id) {
    buscando.value = false;
    return;
  }
  idActual = id;
  idMostrada.value = id;
  const guardados = adelantados;
  adelantados = [];
  for (const e of guardados) aplicar(e, id);
}

async function cancelar(): Promise<void> {
  if (idActual) await ejecutar('cancelar', () => api().buscar.cancelar(idActual as string));
}

/** Se puede abrir en el editor: un archivo (no una carpeta) de la búsqueda que se muestra. */
const sePuedeAbrir = (r: ResultadoBusqueda): boolean => !r.esCarpeta && idMostrada.value !== null;

/**
 * El proceso principal toma la ruta del resultado (por su número: la ventana no aporta ninguna),
 * la registra para el editor y la devuelve; después se abre como cualquier archivo del editor.
 */
async function abrirResultado(r: ResultadoBusqueda): Promise<void> {
  const id = idMostrada.value;
  if (!id || r.esCarpeta) return;
  const ruta = await ejecutar('abrir', () => api().buscar.prepararEditor(id, r.id));
  if (ruta) abrirEnEditor(ruta);
}

function elegirPorIndice(i: number): void {
  const n = orden.value.length;
  if (n === 0) return;
  const k = Math.min(n - 1, Math.max(0, i));
  elegido.value = orden.value[k]!.id;
  void nextTick(() =>
    lista.value
      ?.querySelector(`[data-resultado="${String(elegido.value)}"]`)
      ?.scrollIntoView({ block: 'nearest' }),
  );
}

const indiceElegido = computed(() => orden.value.findIndex((r) => r.id === elegido.value));

function alTeclaLista(e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      elegirPorIndice(indiceElegido.value + 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      elegirPorIndice(indiceElegido.value <= 0 ? 0 : indiceElegido.value - 1);
      break;
    case 'Home':
      e.preventDefault();
      elegirPorIndice(0);
      break;
    case 'End':
      e.preventDefault();
      elegirPorIndice(orden.value.length - 1);
      break;
    case 'Enter': {
      const r = orden.value[indiceElegido.value];
      if (r && sePuedeAbrir(r)) {
        e.preventDefault();
        void abrirResultado(r);
      }
      break;
    }
    case 'Escape':
      // Primero cancela una búsqueda en curso; si no, devuelve el foco al texto.
      e.stopPropagation();
      if (buscando.value) void cancelar();
      else (entrada.value as { focus?: () => void } | null)?.focus?.();
      break;
  }
}

/** Desde el texto: la flecha abajo salta a la lista; Esc cancela la búsqueda (sin cerrar el cajón). */
function alTeclaTexto(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault();
    void iniciar();
  } else if (e.key === 'ArrowDown' && orden.value.length > 0) {
    e.preventDefault();
    lista.value?.focus();
    elegirPorIndice(Math.max(0, indiceElegido.value));
  } else if (e.key === 'Escape' && buscando.value) {
    e.stopPropagation();
    void cancelar();
  }
}

const idActivo = computed(() =>
  elegido.value === null ? undefined : `res-${String(elegido.value)}`,
);

/** Parte antes, la coincidencia y la parte después de la línea encontrada. */
function partes(r: ResultadoBusqueda): { antes: string; mid: string; despues: string } {
  const i = Math.min(Math.max(0, r.inicio), r.extracto.length);
  const f = Math.min(r.extracto.length, i + Math.max(0, r.largo));
  return {
    antes: r.extracto.slice(0, i),
    mid: r.extracto.slice(i, f),
    despues: r.extracto.slice(f),
  };
}
</script>

<template>
  <div class="herr">
    <NAlert type="info" :show-icon="false">{{ t.explicacion }}</NAlert>

    <div>
      <div class="herr-etiqueta">{{ t.origen }}</div>
      <div class="herr-fila">
        <Desplegable
          :value="sitioId"
          :options="opcionesSitio"
          :placeholder="t.proyecto"
          clearable
          class="selector"
          @update:value="alElegirSitio"
        />
        <NButton secondary :loading="ocupado('elegir')" @click="elegirCarpeta">{{
          t.elegirCarpeta
        }}</NButton>
        <NButton secondary :loading="ocupado('elegir')" @click="elegirArchivo">{{
          t.elegirArchivo
        }}</NButton>
      </div>
      <p v-if="rutaElegida" class="herr-tenue ruta" :title="origenTexto">{{ origenTexto }}</p>
      <p v-else-if="sitioId === null" class="herr-tenue">{{ t.sinOrigen }}</p>
    </div>

    <NInput
      ref="entrada"
      v-model:value="consulta"
      class="herr-mono"
      :placeholder="t.consulta"
      :aria-label="t.consulta"
      maxlength="500"
      @keydown="alTeclaTexto"
    />

    <div class="herr-fila">
      <NRadioGroup v-model:value="modo" size="small">
        <NRadioButton value="ambos">{{ t.modoAmbos }}</NRadioButton>
        <NRadioButton value="nombre">{{ t.modoNombre }}</NRadioButton>
        <NRadioButton value="contenido">{{ t.modoContenido }}</NRadioButton>
      </NRadioGroup>
      <NCheckbox v-model:checked="regex">{{ t.regex }}</NCheckbox>
      <NCheckbox v-model:checked="mayusculas">{{ t.mayusculas }}</NCheckbox>
      <NCheckbox v-model:checked="incluirPesadas">{{ t.incluirPesadas }}</NCheckbox>
    </div>

    <div class="herr-columnas">
      <div>
        <div class="herr-etiqueta">{{ t.incluir }}</div>
        <NInput v-model:value="incluir" class="herr-mono" placeholder="*.php, src/**" />
      </div>
      <div>
        <div class="herr-etiqueta">{{ t.excluir }}</div>
        <NInput v-model:value="excluir" class="herr-mono" placeholder="dist, *.min.js" />
      </div>
      <div>
        <div class="herr-etiqueta">{{ t.contexto }}</div>
        <NInputNumber v-model:value="contexto" :min="0" :max="5" :precision="0" />
      </div>
    </div>

    <div class="herr-fila">
      <NButton
        type="primary"
        :disabled="!puedeBuscar || buscando"
        :loading="buscando"
        @click="iniciar"
        >{{ buscando ? t.buscando : t.buscar }}</NButton
      >
      <NButton v-if="buscando" secondary @click="cancelar">{{ t.cancelar }}</NButton>
      <span v-if="resultados.length" class="herr-tenue">{{
        t.coincidencias(resultados.length)
      }}</span>
    </div>
    <p v-if="resultados.length" class="herr-tenue">{{ t.atajos }}</p>

    <p v-if="errorBusqueda" class="herr-error">{{ errorBusqueda }}</p>
    <template v-if="resumen">
      <p v-if="resumen.cancelado" class="herr-tenue">{{ t.cancelada }}</p>
      <EstadoVacio
        v-else-if="resumen.coincidencias === 0"
        pequena
        :icono="Search"
        :titulo="textos.estadosVacios.buscar.titulo"
        :texto="textos.estadosVacios.buscar.texto"
      />
      <p v-else class="herr-ok">
        {{ t.coincidencias(resumen.coincidencias) }}
        {{ t.resumen(resumen.archivos, resumen.examinados) }}
      </p>
      <p v-if="resumen.truncado" class="herr-tenue">{{ t.truncado }}</p>
    </template>

    <div
      v-if="resultados.length"
      ref="lista"
      class="resultados"
      role="listbox"
      tabindex="0"
      :aria-label="t.listaAria"
      :aria-activedescendant="idActivo"
      @keydown="alTeclaLista"
    >
      <section v-if="modo !== 'contenido'" class="grupo-resultados">
        <h3 class="grupo-titulo">{{ t.grupoNombres(nombres.length) }}</h3>
        <p v-if="nombres.length === 0" class="herr-tenue">{{ t.sinGrupo }}</p>
        <ul class="filas" role="group">
          <li
            v-for="r in nombresVistos"
            :id="`res-${r.id}`"
            :key="r.id"
            role="option"
            :aria-selected="elegido === r.id"
            :data-resultado="r.id"
            :class="['fila', { elegida: elegido === r.id }]"
            @click="elegido = r.id"
            @dblclick="abrirResultado(r)"
          >
            <span class="nombre-res" :title="r.archivo">
              <span>{{ relativa(r.archivo) }}</span>
              <span v-if="r.esCarpeta" class="etiqueta-carpeta">{{ t.carpeta }}</span>
            </span>
            <NButton
              v-if="sePuedeAbrir(r)"
              quaternary
              size="tiny"
              :aria-label="`${t.abrir}: ${relativa(r.archivo)}`"
              @click.stop="abrirResultado(r)"
              >{{ t.abrir }}</NButton
            >
          </li>
        </ul>
        <NButton
          v-if="nombres.length > verNombres"
          quaternary
          size="small"
          @click="verNombres += PASO_VISTA"
          >{{ t.mostrarMas(Math.min(PASO_VISTA, nombres.length - verNombres)) }}</NButton
        >
      </section>

      <section v-if="modo !== 'nombre'" class="grupo-resultados">
        <h3 class="grupo-titulo">{{ t.grupoContenido(contenidos.length) }}</h3>
        <p v-if="contenidos.length === 0" class="herr-tenue">{{ t.sinGrupo }}</p>
        <ul class="filas" role="group">
          <template v-for="{ r, cabecera } in contenidosVistos" :key="r.id">
            <li v-if="cabecera" class="archivo" role="presentation" :title="r.archivo">
              {{ relativa(r.archivo) }}
            </li>
            <li
              :id="`res-${r.id}`"
              role="option"
              :aria-selected="elegido === r.id"
              :data-resultado="r.id"
              :class="['fila', 'contenido', { elegida: elegido === r.id }]"
              @click="elegido = r.id"
              @dblclick="abrirResultado(r)"
            >
              <div v-if="r.sensible" class="vista">
                <div class="linea encontrada">
                  <span class="pos">{{ r.linea }}</span>
                  <em>{{ t.sensible(r.linea ?? 0) }}</em>
                </div>
              </div>
              <div v-else class="vista">
                <div v-for="(l, k) in r.antes" :key="`a${k}`" class="linea contexto">
                  <span class="pos">{{ (r.linea ?? 0) - r.antes.length + k }}</span>
                  <code>{{ l }}</code>
                </div>
                <div class="linea encontrada">
                  <span class="pos" :aria-label="t.linea(r.linea ?? 0)">{{ r.linea }}</span>
                  <code
                    >{{ partes(r).antes }}<mark>{{ partes(r).mid }}</mark
                    >{{ partes(r).despues }}</code
                  >
                </div>
                <div v-for="(l, k) in r.despues" :key="`d${k}`" class="linea contexto">
                  <span class="pos">{{ (r.linea ?? 0) + 1 + k }}</span>
                  <code>{{ l }}</code>
                </div>
              </div>
              <NButton
                v-if="sePuedeAbrir(r)"
                quaternary
                size="tiny"
                :aria-label="`${t.abrir}: ${relativa(r.archivo)}, ${t.linea(r.linea ?? 0)}`"
                @click.stop="abrirResultado(r)"
                >{{ t.abrir }}</NButton
              >
            </li>
          </template>
        </ul>
        <NButton
          v-if="contenidos.length > verContenido"
          quaternary
          size="small"
          @click="verContenido += PASO_VISTA"
          >{{ t.mostrarMas(Math.min(PASO_VISTA, contenidos.length - verContenido)) }}</NButton
        >
      </section>
    </div>
  </div>
</template>

<style scoped>
.selector {
  min-width: 200px;
  max-width: 260px;
}
.ruta {
  word-break: break-all;
  margin-top: 6px;
}
.resultados {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: 8px;
  outline: none;
}
.resultados:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 3px;
}
.grupo-titulo {
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 700;
}
.filas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.archivo {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  font-weight: 600;
  word-break: break-all;
  margin-top: 8px;
}
.fila {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: default;
}
.fila.elegida {
  border-color: var(--acento);
  background: rgba(var(--acento-rgb), 0.1);
}
.nombre-res {
  display: flex;
  gap: 8px;
  align-items: baseline;
  min-width: 0;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  word-break: break-all;
}
.etiqueta-carpeta {
  flex: none;
  font-family: inherit;
  font-size: 11px;
  opacity: 0.8;
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 4px;
  padding: 0 4px;
}
.vista {
  flex: 1;
  min-width: 0;
}
.linea {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.pos {
  flex: none;
  min-width: 44px;
  text-align: right;
  font-family: var(--fuente-mono);
  font-size: 12px;
  opacity: 0.72;
}
.linea code {
  flex: 1;
  min-width: 0;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
}
.contexto code {
  opacity: 0.78;
}
.encontrada code {
  font-weight: 600;
}
mark {
  background: rgba(var(--acento-rgb), 0.3);
  color: inherit;
  border-radius: 3px;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>

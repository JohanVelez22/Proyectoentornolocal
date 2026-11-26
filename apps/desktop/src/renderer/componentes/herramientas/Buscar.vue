<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCheckbox,
  NInput,
  NRadioButton,
  NRadioGroup,
  useMessage,
} from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type {
  FinBusqueda,
  LoteBusqueda,
  OpcionesBusquedaIpc,
  ResultadoBusqueda,
  ResumenBusqueda,
} from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { useSitios } from '../../stores/sitios';
import { traducirError } from '../../utilidades/errores';
import { avisoEditorSustituido } from '../../utilidades/editores';
import Desplegable from '../Desplegable.vue';

const t = textos.herramientas.busqueda;
const message = useMessage();
const { ejecutar, ocupado } = useAccion();
const sitios = useSitios();

/** Defecto de "Saltar": lo que casi nunca interesa buscar (el usuario lo puede cambiar). */
const SALTAR_POR_DEFECTO = 'node_modules, vendor, .git, .venv, __pycache__, storage/framework';
/** Tope de filas dibujadas; el núcleo ya limita a 2 000 coincidencias. */
const MAX_FILAS = 2000;

const sitioId = ref<string | null>(null);
const rutaElegida = ref<string | null>(null);
const consulta = ref('');
const modo = ref<'nombre' | 'contenido' | 'ambos'>('ambos');
const regex = ref(false);
const mayusculas = ref(false);
const incluir = ref('');
const excluir = ref(SALTAR_POR_DEFECTO);

const resultados = ref<ResultadoBusqueda[]>([]);
const resumen = ref<ResumenBusqueda | null>(null);
const errorBusqueda = ref<string | null>(null);
const buscando = ref(false);
const raizActual = ref('');
const sitioDeBusqueda = ref<string | null>(null);

let idActual: string | null = null;
/** Eventos que llegan antes de que el invoke devuelva el id de la búsqueda. */
let adelantados: { lote?: LoteBusqueda; fin?: FinBusqueda }[] = [];
const bajas: (() => void)[] = [];

const opcionesSitio = computed(() =>
  sitios.lista.map((s) => ({ label: s.nombre || s.dominio, value: s.id })),
);
const puedeBuscar = computed(
  () => (sitioId.value !== null || rutaElegida.value !== null) && consulta.value.trim() !== '',
);
const origenTexto = computed(() => rutaElegida.value ?? '');

const lista = (s: string): string[] =>
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

const grupos = computed(() => {
  const m = new Map<string, ResultadoBusqueda[]>();
  for (const r of resultados.value) {
    const l = m.get(r.archivo);
    if (l) l.push(r);
    else m.set(r.archivo, [r]);
  }
  return [...m.entries()];
});

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
    incluir: lista(incluir.value),
    excluir: lista(excluir.value),
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
  buscando.value = true;
  raizActual.value =
    sitioId.value !== null
      ? (sitios.porId(sitioId.value)?.carpeta ?? '')
      : (rutaElegida.value ?? '');
  sitioDeBusqueda.value = sitioId.value;
  const id = await ejecutar('buscar', () => api().buscar.iniciar(opciones));
  if (!id) {
    buscando.value = false;
    return;
  }
  idActual = id;
  const guardados = adelantados;
  adelantados = [];
  for (const e of guardados) aplicar(e, id);
}

async function cancelar(): Promise<void> {
  if (idActual) await ejecutar('cancelar', () => api().buscar.cancelar(idActual as string));
}

function abrirEnEditor(r: ResultadoBusqueda): void {
  const id = sitioDeBusqueda.value;
  if (!id) return;
  void ejecutar('abrir', async () => {
    const res = await api().editor.abrirEn(id, r.archivo, r.linea ?? 1);
    const aviso = avisoEditorSustituido(res);
    if (aviso) message.info(aviso);
  });
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
      v-model:value="consulta"
      class="herr-mono"
      :placeholder="t.consulta"
      maxlength="500"
      @keyup.enter="iniciar"
    />

    <div class="herr-fila">
      <NRadioGroup v-model:value="modo" size="small">
        <NRadioButton value="ambos">{{ t.modoAmbos }}</NRadioButton>
        <NRadioButton value="nombre">{{ t.modoNombre }}</NRadioButton>
        <NRadioButton value="contenido">{{ t.modoContenido }}</NRadioButton>
      </NRadioGroup>
      <NCheckbox v-model:checked="regex">{{ t.regex }}</NCheckbox>
      <NCheckbox v-model:checked="mayusculas">{{ t.mayusculas }}</NCheckbox>
    </div>

    <div class="herr-columnas">
      <div>
        <div class="herr-etiqueta">{{ t.incluir }}</div>
        <NInput v-model:value="incluir" class="herr-mono" placeholder="*.php, src/**" />
      </div>
      <div>
        <div class="herr-etiqueta">{{ t.excluir }}</div>
        <NInput v-model:value="excluir" class="herr-mono" />
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

    <p v-if="errorBusqueda" class="herr-error">{{ errorBusqueda }}</p>
    <template v-if="resumen">
      <p v-if="resumen.cancelado" class="herr-tenue">{{ t.cancelada }}</p>
      <p v-else-if="resumen.coincidencias === 0" class="herr-tenue">{{ t.sinResultados }}</p>
      <p v-else class="herr-ok">
        {{ t.coincidencias(resumen.coincidencias) }}
        {{ t.resumen(resumen.archivos, resumen.examinados) }}
      </p>
      <p v-if="resumen.truncado" class="herr-tenue">{{ t.truncado }}</p>
    </template>

    <ul v-if="grupos.length" class="grupos">
      <li v-for="[archivo, items] in grupos" :key="archivo" class="grupo">
        <div class="archivo" :title="archivo">{{ relativa(archivo) }}</div>
        <ul class="coincidencias">
          <li v-for="(r, i) in items" :key="i" class="fila">
            <span class="pos">{{ r.linea === null ? '' : `${r.linea}:${r.columna}` }}</span>
            <code class="extracto">{{ r.extracto }}</code>
            <NButton
              v-if="sitioDeBusqueda"
              quaternary
              size="tiny"
              :aria-label="`${t.abrir}: ${relativa(archivo)}`"
              @click="abrirEnEditor(r)"
              >{{ t.abrir }}</NButton
            >
          </li>
        </ul>
      </li>
    </ul>
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
.grupos,
.coincidencias {
  list-style: none;
  margin: 0;
  padding: 0;
}
.grupos {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.archivo {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  font-weight: 600;
  word-break: break-all;
  margin-bottom: 2px;
}
.fila {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 2px 0;
}
.pos {
  flex: none;
  min-width: 52px;
  text-align: right;
  font-family: var(--fuente-mono);
  font-size: 12px;
  opacity: 0.72;
}
.extracto {
  flex: 1;
  min-width: 0;
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

<script setup lang="ts">
import { FolderOpen } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NIcon,
  NInput,
  NModal,
  NProgress,
  NSteps,
  NStep,
  useDialog,
  useMessage,
} from 'naive-ui';
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type {
  Plantilla,
  ResultadoCrearProyecto,
  ResultadoReceta,
  TipoGenerador,
} from '../../shared/api';
import { api, plano } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useProyectos } from '../stores/proyectos';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import type { ErrorIpc } from '../utilidades/errores';
import {
  accionDeError,
  aPedido,
  baseSugerida,
  descargaWordpress,
  formularioDePlantilla,
  formularioInicial,
  infoDe,
  nombreBaseDe,
  opcionesBase,
  ordenarRamas,
  ramasPython,
  sePuedeOmitirPaso,
  sitioNuevo,
  validarPedido,
  type AccionError,
  type FormProyecto,
} from '../utilidades/nuevoProyecto';
import { avanceReceta, etiquetaPaso, pasoConError } from '../utilidades/proyectos';
import { urlLocal } from '../utilidades/sitios';
import Desplegable from './Desplegable.vue';
import ListaPlantillas from './ListaPlantillas.vue';
import PasoReceta from './PasoReceta.vue';
import PasoTipoProyecto from './PasoTipoProyecto.vue';
import ResumenNuevoProyecto from './ResumenNuevoProyecto.vue';

/**
 * Asistente "Nuevo proyecto": tipo → datos → resumen, y después el avance de la receta. La carpeta
 * padre sale de un diálogo (el main solo la acepta así); WordPress solo se crea con la casilla de
 * la huella débil marcada. Si un paso falla no se borra nada: se ve qué quedó y se puede reintentar.
 */
const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ cerrar: [] }>();

const t = textos.nuevoProyecto;
const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const proyectos = useProyectos();
const servicios = useServicios();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

type Paso = 0 | 1 | 2;
type Fase = 'asistente' | 'creando' | 'fin';

const paso = ref<Paso>(0);
const fase = ref<Fase>('asistente');
const form = reactive<FormProyecto>(formularioInicial('laravel'));
const baseEditada = ref(false);

/* ───── Versiones y bases disponibles ───── */

const ramasPhp = computed(() => ordenarRamas(servicios.instalados['php'] ?? []));
const ramasPy = computed(() => ramasPython(servicios.instalados['python'] ?? []));
const opcionesPhp = computed(() => ramasPhp.value.map((v) => ({ value: v, label: `PHP ${v}` })));
const opcionesPy = computed(() => ramasPy.value.map((v) => ({ value: v, label: `Python ${v}` })));
const bases = computed(() =>
  opcionesBase(
    form.tipo,
    form.pgvector && form.tipo === 'fastapi',
    servicios.lista,
    form.plantilla,
  ),
);
const opcionesBd = computed(() =>
  bases.value.map((b) => ({
    value: b.value,
    label: b.apagada ? `${b.label} (${t.campos.apagada})` : b.label,
  })),
);
const baseElegida = computed(() => bases.value.find((b) => b.value === form.objetivoBd) ?? null);
const info = computed(() => infoDe(form));

/** Valores por defecto que dependen de lo instalado: solo se llenan si falta el dato. */
function completarPorDefecto(): void {
  if (info.value.usaPhp && (!form.php || !ramasPhp.value.includes(form.php))) {
    form.php = ramasPhp.value[0] ?? null;
  }
  if (info.value.usaPython && (!form.python || !ramasPy.value.includes(form.python))) {
    form.python = ramasPy.value[0] ?? null;
  }
  if (info.value.usaBase && !bases.value.some((b) => b.value === form.objetivoBd)) {
    form.objetivoBd = baseSugerida(bases.value, info.value.motor);
  }
  if (!baseEditada.value) form.nombreBase = nombreBaseDe(form.nombre.trim());
}
watch([ramasPhp, ramasPy, bases, () => form.nombre], completarPorDefecto);

watch(
  () => props.show,
  (v) => {
    if (!v) return;
    Object.assign(form, formularioInicial('laravel'));
    baseEditada.value = false;
    paso.value = 0;
    fase.value = 'asistente';
    errorCreacion.value = null;
    resultado.value = null;
    resultadoReceta.value = null;
    huella.value = null;
    confirmada.value = false;
    void ejecutar('versiones', () =>
      Promise.all([servicios.cargarInstalados('php'), servicios.cargarInstalados('python')]),
    ).then(completarPorDefecto);
    void cargarPlantillas();
  },
  { immediate: true },
);

function elegirTipo(tipo: TipoGenerador): void {
  const { nombre, carpetaPadre } = form;
  Object.assign(form, formularioInicial(tipo), { nombre, carpetaPadre });
  baseEditada.value = false;
  completarPorDefecto();
}

/* ───── Plantillas propias ───── */

const plantillas = ref<Plantilla[]>([]);

async function cargarPlantillas(): Promise<void> {
  plantillas.value =
    (await ejecutar('plantillas', () => api().plantillas.lista(), {
      tituloError: textos.plantillas.lista.errorLista,
    })) ?? [];
}

function elegirPlantilla(pl: Plantilla): void {
  const { nombre, carpetaPadre } = form;
  Object.assign(form, formularioDePlantilla(pl), { nombre, carpetaPadre });
  baseEditada.value = false;
  completarPorDefecto();
}

function borrarPlantilla(pl: Plantilla): void {
  const tl = textos.plantillas.lista;
  const d = dialog.warning({
    title: tl.borrarTitulo(pl.nombre),
    content: tl.borrarTexto,
    positiveText: textos.acciones.borrar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      d.loading = true;
      const ok = await ejecutar(
        'borrar-plantilla',
        () =>
          api()
            .plantillas.borrar(pl.id)
            .then(() => true),
        { tituloError: tl.errorBorrar },
      );
      d.loading = false;
      // Si falló ya se avisó; en los dos casos se vuelve a leer la lista.
      if (ok) {
        message.success(tl.borrada);
        if (form.plantilla?.id === pl.id) elegirTipo('laravel');
      }
      await cargarPlantillas();
    },
  });
}

async function elegirCarpeta(): Promise<void> {
  const c = await ejecutar('carpeta', () => api().sistema.elegirCarpeta());
  if (c) form.carpetaPadre = c;
}

/* ───── Validación ───── */

/** Los datos se validan sin la casilla de WordPress: esa se pide en el resumen. */
const errorDatos = computed(() =>
  validarPedido({ ...form, confirmarHuellaDebil: true }, t.errores),
);
const errorTotal = computed(() => validarPedido(form, t.errores));
const sinMotores = computed(() => info.value.usaBase && form.conBase && bases.value.length === 0);

/* ───── Huella débil de WordPress ───── */

const huella = ref<string | null>(null);
const leyendoHuella = ref(false);
const confirmada = ref(false);

async function leerHuella(): Promise<void> {
  if (!descargaWordpress(form) || huella.value || leyendoHuella.value) return;
  leyendoHuella.value = true;
  try {
    huella.value = await api().proyectos.huellaWordpress();
  } catch {
    // Sin conexión: se explica igual y el paso la vuelve a leer al crear.
    huella.value = null;
  } finally {
    leyendoHuella.value = false;
  }
}
watch(confirmada, (v) => {
  form.confirmarHuellaDebil = v;
});

function siguiente(): void {
  errorCreacion.value = null;
  if (paso.value === 0) paso.value = 1;
  else if (paso.value === 1 && !errorDatos.value) {
    paso.value = 2;
    void leerHuella();
  }
}
function atras(): void {
  errorCreacion.value = null;
  if (paso.value > 0) paso.value = (paso.value - 1) as Paso;
}

/* ───── Creación y avance ───── */

const resultado = ref<ResultadoCrearProyecto | null>(null);
const resultadoReceta = ref<ResultadoReceta | null>(null);
const sitioId = ref<string | null>(null);
let recetasAntes: string[] = [];

interface ErrorCreacion {
  mensaje: string;
  accion: AccionError | null;
  pasoId?: string;
}
const errorCreacion = ref<ErrorCreacion | null>(null);

/** El proyecto que se está creando: el exacto al terminar, el primero nuevo mientras corre. */
const sitioActivo = computed(
  () => sitioId.value ?? sitioNuevo(recetasAntes, Object.keys(proyectos.recetas)),
);
const estado = computed(() => (sitioActivo.value ? proyectos.receta(sitioActivo.value) : null));
const corriendo = computed(
  () => fase.value === 'creando' || (estado.value?.estado === 'corriendo' && fase.value === 'fin'),
);
const avance = computed(() => (estado.value ? avanceReceta(estado.value) : 0));
const pasoFallido = computed(() => (estado.value ? pasoConError(estado.value) : undefined));
const exito = computed(() => resultadoReceta.value?.estado === 'lista');

function errorDe(e: unknown): ErrorCreacion {
  return {
    mensaje: mensajeDeError(e),
    accion: accionDeError((e as ErrorIpc | null)?.codigo),
  };
}

async function crear(): Promise<void> {
  if (errorTotal.value || fase.value !== 'asistente') return;
  errorCreacion.value = null;
  recetasAntes = Object.keys(proyectos.recetas);
  sitioId.value = null;
  fase.value = 'creando';
  try {
    const r = await api().proyectos.crear(plano(aPedido(form)));
    resultado.value = r;
    resultadoReceta.value = r.receta;
    sitioId.value = r.sitio.id;
    await proyectos.cargarReceta(r.sitio.id).catch(() => undefined);
    fase.value = 'fin';
  } catch (e) {
    // Antes de crear nada (o si el sitio no se pudo crear): vuelve al resumen con el motivo.
    errorCreacion.value = errorDe(e);
    fase.value = 'asistente';
  }
}

/** Reintentar o omitir un paso desde el avance. Un paso omitido que el núcleo no admite se explica. */
async function paraPaso(pasoId: string, omitir: boolean): Promise<void> {
  const id = sitioId.value;
  if (!id) return;
  errorCreacion.value = null;
  try {
    const r = omitir ? await proyectos.omitir(id, pasoId) : await proyectos.reintentar(id, pasoId);
    resultadoReceta.value = r;
    if (r.estado === 'lista')
      await api()
        .proyectos.confiar(id)
        .catch(() => undefined);
  } catch (e) {
    errorCreacion.value = { ...errorDe(e), pasoId };
  }
}

const quedo = computed(() => {
  const c = resultado.value?.creado;
  if (!c) return '';
  const partes = [
    c.carpeta ? t.progreso.quedoCarpeta : '',
    c.base ? t.progreso.quedoBase(c.base) : '',
  ];
  partes.push(t.progreso.quedoSitio);
  return t.progreso.quedo(partes.filter(Boolean).join(', '));
});

/* ───── Acciones sobre un error ───── */

const nombreBaseInput = ref<InstanceType<typeof NInput> | null>(null);

async function hacerAccion(a: AccionError): Promise<void> {
  const pasoId = errorCreacion.value?.pasoId;
  switch (a) {
    case 'cambiarCarpeta':
      paso.value = 1;
      errorCreacion.value = null;
      await elegirCarpeta();
      return;
    case 'cambiarBase':
      paso.value = 1;
      errorCreacion.value = null;
      await nextTick();
      nombreBaseInput.value?.focus();
      return;
    case 'cambiarNombre':
      paso.value = 1;
      errorCreacion.value = null;
      return;
    case 'servicios':
      emit('cerrar');
      void router.push({ name: 'servicios' });
      return;
    case 'confirmarHuella':
      paso.value = 2;
      errorCreacion.value = null;
      return;
    case 'reintentarPaso':
      if (pasoId) await paraPaso(pasoId, false);
      return;
  }
}

/* ───── Al terminar ───── */

const nginx = computed(() => servicios.porId['nginx']);

function abrirEditor(): void {
  const id = sitioId.value;
  if (id) {
    void ejecutar('editor', () => api().sistema.abrirEditor(id), {
      tituloError: t.progreso.editorFallo,
    });
  }
}
function verSitio(): void {
  const s = resultado.value?.sitio;
  if (s) {
    void ejecutar('sitio', () =>
      api().sistema.abrirUrl(urlLocal(s.dominio, nginx.value?.puertos[0])),
    );
  }
}
/** Cierra y deja la tarjeta del proyecto nuevo resaltada en la lista. */
function verProyecto(): void {
  const id = sitioId.value;
  emit('cerrar');
  if (id && sitios.porId(id)) {
    void router.push({ name: 'proyectos', query: { foco: `sitio:${id}` } });
  }
  message.success(t.progreso.listo);
}

function alCambiarVisible(v: boolean): void {
  if (!v && !corriendo.value) emit('cerrar');
}

async function cancelar(): Promise<void> {
  if (sitioActivo.value) await proyectos.cancelar(sitioActivo.value).catch(() => undefined);
}

const titulosPaso = computed(() => [t.pasos.tipo, t.pasos.datos, t.pasos.resumen]);
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t.titulo"
    :style="{ width: '720px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false"
    :closable="!corriendo"
    :close-on-esc="!corriendo"
    :auto-focus="false"
    @update:show="alCambiarVisible"
  >
    <!-- Asistente: tipo → datos → resumen -->
    <template v-if="fase === 'asistente'">
      <NSteps :current="paso + 1" size="small" class="pasos-cabecera">
        <NStep v-for="(titulo, i) in titulosPaso" :key="i" :title="titulo" />
      </NSteps>

      <section v-if="paso === 0" class="seccion">
        <PasoTipoProyecto :tipo="form.plantilla ? null : form.tipo" @elegir="elegirTipo" />
        <ListaPlantillas
          :plantillas="plantillas"
          :elegida="form.plantilla?.id ?? null"
          @elegir="elegirPlantilla"
          @borrar="borrarPlantilla"
        />
      </section>

      <section v-else-if="paso === 1" class="seccion datos">
        <label class="campo">
          <span>{{ t.campos.nombre }}</span>
          <NInput
            v-model:value="form.nombre"
            size="small"
            class="mono"
            :placeholder="t.campos.nombrePlaceholder"
            :input-props="{ spellcheck: false, autocomplete: 'off' }"
          />
          <small class="nota">{{
            t.campos.nombreAyuda(`${form.nombre.trim() || t.campos.nombrePlaceholder}.test`)
          }}</small>
        </label>

        <div class="campo">
          <span>{{ t.campos.carpeta }}</span>
          <div class="fila-carpeta">
            <code class="ruta" :title="form.carpetaPadre ?? ''">{{
              form.carpetaPadre ?? '—'
            }}</code>
            <NButton size="small" secondary :loading="ocupado('carpeta')" @click="elegirCarpeta">
              <template #icon
                ><NIcon><FolderOpen /></NIcon
              ></template>
              {{ form.carpetaPadre ? t.campos.cambiarCarpeta : t.campos.elegirCarpeta }}
            </NButton>
          </div>
          <small class="nota">{{ t.campos.carpetaAyuda }}</small>
        </div>

        <div v-if="info.usaPhp" class="campo">
          <span>{{ t.campos.php }}</span>
          <Desplegable
            v-if="opcionesPhp.length"
            v-model:value="form.php"
            size="small"
            :options="opcionesPhp"
            :aria-label="t.campos.php"
          />
          <small v-else class="nota error">{{ t.campos.sinInstalada }}</small>
        </div>
        <div v-if="info.usaPython" class="campo">
          <span>{{ t.campos.python }}</span>
          <Desplegable
            v-if="opcionesPy.length"
            v-model:value="form.python"
            size="small"
            :options="opcionesPy"
            :aria-label="t.campos.python"
          />
          <small v-else class="nota error">{{ t.campos.sinInstalada }}</small>
        </div>

        <template v-if="form.tipo === 'laravel' && !form.plantilla">
          <div class="campo">
            <span>{{ t.campos.starterKit }}</span>
            <Desplegable
              v-model:value="form.starterKit"
              size="small"
              :options="
                (['ninguno', 'react', 'vue', 'livewire'] as const).map((k) => ({
                  value: k,
                  label: t.campos.starterKits[k],
                }))
              "
              :aria-label="t.campos.starterKit"
            />
          </div>
        </template>
        <NCheckbox
          v-if="form.tipo === 'symfony' && !form.plantilla"
          v-model:checked="form.symfonyWebapp"
          >{{ t.campos.symfonyWebapp }}</NCheckbox
        >

        <template v-if="info.usaBase">
          <NCheckbox v-model:checked="form.conBase">{{ t.campos.conBase }}</NCheckbox>
          <template v-if="form.conBase">
            <NAlert v-if="sinMotores" type="warning" :bordered="false">{{
              t.campos.sinMotores
            }}</NAlert>
            <template v-else>
              <div class="campo">
                <span>{{ t.campos.instancia }}</span>
                <Desplegable
                  v-model:value="form.objetivoBd"
                  size="small"
                  :options="opcionesBd"
                  :aria-label="t.campos.instancia"
                />
                <small v-if="baseElegida?.apagada" class="nota error">{{
                  t.campos.apagadaAyuda
                }}</small>
              </div>
              <label class="campo">
                <span>{{ t.campos.nombreBase }}</span>
                <NInput
                  ref="nombreBaseInput"
                  v-model:value="form.nombreBase"
                  size="small"
                  class="mono"
                  :input-props="{ spellcheck: false, autocomplete: 'off' }"
                  @input="baseEditada = true"
                />
              </label>
            </template>
            <NCheckbox v-if="form.tipo === 'fastapi'" v-model:checked="form.pgvector">{{
              t.campos.pgvector
            }}</NCheckbox>
          </template>
        </template>

        <p v-if="errorDatos && form.nombre" class="nota error" role="status">{{ errorDatos }}</p>
      </section>

      <section v-else class="seccion">
        <ResumenNuevoProyecto
          v-model:confirmada="confirmada"
          :form="form"
          :huella="huella"
          :leyendo-huella="leyendoHuella"
        />
      </section>

      <NAlert v-if="errorCreacion" type="error" :bordered="false" class="error-creacion">
        <p>{{ errorCreacion.mensaje }}</p>
        <NButton
          v-if="errorCreacion.accion"
          size="small"
          type="primary"
          @click="hacerAccion(errorCreacion.accion)"
        >
          {{ t.acciones[errorCreacion.accion] }}
        </NButton>
      </NAlert>
    </template>

    <!-- Avance de la receta -->
    <template v-else>
      <div class="avance">
        <strong>{{ exito ? t.progreso.listo : t.progreso.titulo }}</strong>
        <NProgress
          type="line"
          :percentage="exito ? 100 : avance"
          :show-indicator="false"
          :processing="corriendo"
          :status="exito ? 'success' : resultadoReceta?.estado === 'error' ? 'error' : 'default'"
        />
      </div>
      <ol v-if="estado" class="lista-pasos">
        <PasoReceta
          v-for="p in estado.pasos"
          :key="p.id"
          :paso="p"
          :acciones="fase === 'fin' && !corriendo"
          :omitible="sePuedeOmitirPaso(p)"
          :ocupado="corriendo"
          @reintentar="(id: string) => void paraPaso(id, false)"
          @omitir="(id: string) => void paraPaso(id, true)"
        />
      </ol>
      <template v-if="fase === 'fin'">
        <NAlert v-if="!exito && pasoFallido" type="error" :bordered="false" class="error-creacion">
          <p>{{ t.progreso.fallo(etiquetaPaso(pasoFallido)) }}</p>
          <p>{{ quedo }}</p>
        </NAlert>
        <NAlert v-if="errorCreacion" type="error" :bordered="false" class="error-creacion">
          <p>{{ errorCreacion.mensaje }}</p>
          <NButton
            v-if="errorCreacion.accion === 'reintentarPaso' || errorCreacion.accion === 'servicios'"
            size="small"
            type="primary"
            @click="hacerAccion(errorCreacion.accion)"
          >
            {{ t.acciones[errorCreacion.accion] }}
          </NButton>
        </NAlert>
        <NAlert v-if="resultado?.sinUsuarioPropio" type="warning" :bordered="false">
          {{ t.progreso.sinUsuarioPropio }}
        </NAlert>
        <NAlert v-if="resultado?.avisos.length" type="warning" :bordered="false">
          <strong>{{ t.progreso.avisos }}</strong>
          <p v-for="(a, i) in resultado.avisos" :key="i">{{ a }}</p>
        </NAlert>
      </template>
    </template>

    <template #footer>
      <div class="pie">
        <template v-if="fase === 'asistente'">
          <NButton @click="emit('cerrar')">{{ textos.acciones.cancelar }}</NButton>
          <NButton v-if="paso > 0" @click="atras">{{ t.botones.atras }}</NButton>
          <NButton
            v-if="paso < 2"
            type="primary"
            :disabled="paso === 1 && !!errorDatos"
            @click="siguiente"
          >
            {{ t.botones.siguiente }}
          </NButton>
          <NButton v-else type="primary" :disabled="!!errorTotal" @click="crear">
            {{ t.botones.crear }}
          </NButton>
        </template>
        <template v-else-if="fase === 'creando' || corriendo">
          <NButton :disabled="!sitioActivo" @click="cancelar">{{
            textos.acciones.cancelar
          }}</NButton>
          <NButton type="primary" loading disabled>{{ t.botones.creando }}</NButton>
        </template>
        <template v-else>
          <NButton @click="emit('cerrar')">{{ t.botones.cerrar }}</NButton>
          <template v-if="resultado">
            <NButton secondary :loading="ocupado('sitio')" @click="verSitio">{{
              t.botones.verSitio
            }}</NButton>
            <NButton secondary :loading="ocupado('editor')" @click="abrirEditor">{{
              t.botones.abrirEditor
            }}</NButton>
            <NButton type="primary" @click="verProyecto">{{ t.botones.verProyecto }}</NButton>
          </template>
        </template>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.pasos-cabecera {
  margin-bottom: 16px;
}
.seccion {
  min-height: 220px;
}
.datos {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
.mono,
.ruta {
  font-family: var(--fuente-mono);
}
.nota {
  font-size: 12px;
  opacity: 0.65;
}
.nota.error {
  color: var(--texto-error);
  opacity: 1;
}
.fila-carpeta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.ruta {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.08);
}
.error-creacion {
  margin-top: 12px;
}
.error-creacion p {
  margin: 0 0 8px;
}
.avance {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.lista-pasos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 340px;
  overflow: auto;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

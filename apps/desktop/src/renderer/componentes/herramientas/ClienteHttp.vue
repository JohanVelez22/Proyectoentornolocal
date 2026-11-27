<script setup lang="ts">
import {
  METODOS_HTTP,
  PLAZO_HTTP_DEFECTO_SEG,
  PLAZO_HTTP_MAX_SEG,
  type AvisoCurl,
  type EstadoClienteHttp,
  type PeticionHttp,
  type RespuestaHttp,
} from '@pel/core';
import { Archive, Time } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NTab,
  NTabPane,
  NTabs,
  NTag,
  useMessage,
} from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { api, plano } from '../../api';
import { solicitudes } from '../../composables/solicitudes';
import { formatearFecha, textos } from '../../i18n';
import { mensajeDeError } from '../../utilidades/errores';
import EstadoVacio from '../EstadoVacio.vue';
import TextoLargo from '../TextoLargo.vue';
import CampoSecreto from './clientehttp/CampoSecreto.vue';
import EditorPares from './clientehttp/EditorPares.vue';
import PanelEntornos from './clientehttp/PanelEntornos.vue';
import PanelRespuesta from './clientehttp/PanelRespuesta.vue';

const t = textos.herramientas.clienteHttp;
const message = useMessage();

const vacia = (): PeticionHttp => ({
  id: '',
  nombre: '',
  metodo: 'GET',
  url: '',
  params: [],
  cabeceras: [],
  cuerpo: { tipo: 'ninguno' },
  auth: { tipo: 'ninguna' },
  plazoSeg: PLAZO_HTTP_DEFECTO_SEG,
  ignorarCertificado: false,
});

type Seccion = 'peticion' | 'coleccion' | 'historial' | 'entornos';
const seccion = ref<Seccion>('peticion');
const interna = ref('params');
const estado = ref<EstadoClienteHttp>({
  coleccion: [],
  historial: [],
  entornos: [],
  entornoActivo: null,
});
const borrador = ref<PeticionHttp>(vacia());
const respuesta = ref<RespuestaHttp | null>(null);
const error = ref<string | null>(null);
const enviando = ref(false);
const incluirCredenciales = ref(false);
const avisos = ref<AvisoCurl[]>([]);
const importando = ref(false);
const textoCurl = ref('');
let idEnvio = '';

async function cargar(): Promise<void> {
  try {
    estado.value = await api().clienteHttp.estado();
  } catch (e) {
    message.error(mensajeDeError(e));
  }
}

/** Una petición precargada (`abrirConPeticion`): se muestra, nunca se envía sola. */
function tomarPrecargada(): void {
  const p = solicitudes.peticionHttp;
  if (!p) return;
  solicitudes.peticionHttp = null;
  borrador.value = { ...vacia(), ...plano(p), id: '' };
  respuesta.value = null;
  error.value = null;
  seccion.value = 'peticion';
}
watch(() => solicitudes.peticionHttp, tomarPrecargada);
onMounted(() => {
  tomarPrecargada();
  void cargar();
});

const entornoActivo = computed({
  get: () => estado.value.entornoActivo ?? '',
  set: (id: string) => {
    api()
      .clienteHttp.activarEntorno(id === '' ? null : id)
      .then(cargar)
      .catch((e: unknown) => message.error(mensajeDeError(e)));
  },
});
const opcionesEntorno = computed(() => [
  { label: t.sinEntorno, value: '' },
  ...estado.value.entornos.map((e) => ({ label: e.nombre, value: e.id })),
]);
const opcionesMetodo = METODOS_HTTP.map((m) => ({ label: m, value: m }));

async function enviar(): Promise<void> {
  if (enviando.value || !borrador.value.url.trim()) return;
  enviando.value = true;
  error.value = null;
  respuesta.value = null;
  idEnvio = Math.random().toString(36).slice(2);
  try {
    respuesta.value = await api().clienteHttp.enviar(plano(borrador.value), {
      entornoId: estado.value.entornoActivo,
      idEnvio,
    });
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
    void cargar();
  }
}

function cancelar(): void {
  void api().clienteHttp.cancelar(idEnvio);
}

async function guardar(): Promise<void> {
  try {
    borrador.value = await api().clienteHttp.guardarPeticion(plano(borrador.value));
    message.success(t.guardada);
    await cargar();
  } catch (e) {
    message.error(mensajeDeError(e));
  }
}

function nueva(): void {
  borrador.value = vacia();
  respuesta.value = null;
  error.value = null;
  avisos.value = [];
}

async function copiarCurl(): Promise<void> {
  try {
    const comando = await api().clienteHttp.copiarComoCurl(
      plano(borrador.value),
      estado.value.entornoActivo,
      incluirCredenciales.value,
    );
    await api().sistema.copiar(comando);
    message.success(t.curl.copiado);
  } catch (e) {
    message.error(mensajeDeError(e));
  }
}

async function importar(): Promise<void> {
  try {
    const r = await api().clienteHttp.importarCurl(textoCurl.value);
    borrador.value = r.peticion;
    avisos.value = r.avisos;
    importando.value = false;
    textoCurl.value = '';
    respuesta.value = null;
    error.value = null;
    message.success(t.curl.importada);
    await cargar();
  } catch (e) {
    message.error(mensajeDeError(e));
  }
}

function aviso(a: AvisoCurl): string {
  const f = t.curl.avisos[a.codigo] as string | ((d: string) => string);
  return typeof f === 'function' ? f(a.dato ?? '') : f;
}

function abrir(p: PeticionHttp): void {
  borrador.value = plano(p);
  respuesta.value = null;
  error.value = null;
  avisos.value = [];
  seccion.value = 'peticion';
}

async function borrarPeticion(id: string): Promise<void> {
  try {
    await api().clienteHttp.borrarPeticion(id);
    if (borrador.value.id === id) borrador.value = { ...borrador.value, id: '' };
    message.success(t.coleccion.borrada);
    await cargar();
  } catch (e) {
    message.error(mensajeDeError(e));
  }
}

async function limpiarHistorial(): Promise<void> {
  try {
    await api().clienteHttp.limpiarHistorial();
    await cargar();
  } catch (e) {
    message.error(mensajeDeError(e));
  }
}

// ---- Cuerpo y autenticación (uniones: se editan por accesores) ----
type TipoCuerpo = PeticionHttp['cuerpo']['tipo'];
const cuerpoTipo = computed<TipoCuerpo>({
  get: () => borrador.value.cuerpo.tipo,
  set: (tipo) => {
    const c = borrador.value.cuerpo;
    const texto = c.tipo === 'json' || c.tipo === 'raw' ? c.texto : '';
    const campos = c.tipo === 'form' || c.tipo === 'multipart' ? c.campos : [];
    borrador.value.cuerpo =
      tipo === 'json'
        ? { tipo, texto }
        : tipo === 'raw'
          ? { tipo, texto }
          : tipo === 'form' || tipo === 'multipart'
            ? { tipo, campos }
            : { tipo: 'ninguno' };
  },
});
const opcionesCuerpo = computed(() =>
  (['ninguno', 'json', 'form', 'multipart', 'raw'] as const).map((v) => ({
    label: t.cuerpo[v],
    value: v,
  })),
);
const cuerpoTexto = computed({
  get: () => {
    const c = borrador.value.cuerpo;
    return c.tipo === 'json' || c.tipo === 'raw' ? c.texto : '';
  },
  set: (v: string) => {
    const c = borrador.value.cuerpo;
    if (c.tipo === 'json' || c.tipo === 'raw') c.texto = v;
  },
});
const cuerpoTipoContenido = computed({
  get: () => {
    const c = borrador.value.cuerpo;
    return c.tipo === 'raw' ? (c.tipoContenido ?? '') : '';
  },
  set: (v: string) => {
    const c = borrador.value.cuerpo;
    if (c.tipo === 'raw') c.tipoContenido = v;
  },
});
const cuerpoCampos = computed({
  get: () => {
    const c = borrador.value.cuerpo;
    return c.tipo === 'form' || c.tipo === 'multipart' ? c.campos : [];
  },
  set: (v) => {
    const c = borrador.value.cuerpo;
    if (c.tipo === 'form' || c.tipo === 'multipart') c.campos = v;
  },
});

interface AuthAbierta {
  tipo: string;
  usuario?: string;
  nombre?: string;
  en?: string;
  valor?: string;
  ref?: string;
}
const auth = computed(() => borrador.value.auth as AuthAbierta);
const authTipo = computed<string>({
  get: () => auth.value.tipo,
  set: (tipo) => {
    borrador.value.auth = (
      tipo === 'bearer'
        ? { tipo }
        : tipo === 'basic'
          ? { tipo, usuario: '' }
          : tipo === 'apikey'
            ? { tipo, nombre: '', en: 'cabecera' }
            : { tipo: 'ninguna' }
    ) as PeticionHttp['auth'];
  },
});
const opcionesAuth = computed(() =>
  (['ninguna', 'bearer', 'basic', 'apikey'] as const).map((v) => ({ label: t.auth[v], value: v })),
);
const opcionesEn = computed(() => [
  { label: t.auth.cabecera, value: 'cabecera' },
  { label: t.auth.query, value: 'query' },
]);
const authValor = computed({
  get: () => auth.value.valor ?? '',
  set: (v: string) => (auth.value.valor = v),
});
const authRef = computed<string | undefined>({
  get: () => auth.value.ref,
  set: (v) => {
    if (v === undefined) delete auth.value.ref;
    else auth.value.ref = v;
  },
});
const authUsuario = computed({
  get: () => auth.value.usuario ?? '',
  set: (v: string) => (auth.value.usuario = v),
});
const authNombre = computed({
  get: () => auth.value.nombre ?? '',
  set: (v: string) => (auth.value.nombre = v),
});
const authEn = computed({
  get: () => auth.value.en ?? 'cabecera',
  set: (v: string) => (auth.value.en = v),
});
const etiquetaSecreto = computed(() =>
  authTipo.value === 'basic'
    ? t.auth.clave
    : authTipo.value === 'bearer'
      ? t.auth.token
      : t.par.valor,
);

const plazo = computed({
  get: () => borrador.value.plazoSeg,
  set: (v: number | null) => (borrador.value.plazoSeg = v ?? PLAZO_HTTP_DEFECTO_SEG),
});

const formatoHistorial: Intl.DateTimeFormatOptions = { timeStyle: 'medium', dateStyle: 'short' };
function etiquetaHistorial(e: EstadoClienteHttp['historial'][number]): string {
  return e.estado === null ? t.historial.sinRespuesta : String(e.estado);
}
</script>

<template>
  <div class="herr" @keydown.ctrl.enter.prevent="enviar" @keydown.meta.enter.prevent="enviar">
    <div class="herr-fila barra">
      <NTabs
        v-model:value="seccion"
        type="segment"
        size="small"
        class="secciones"
        :aria-label="t.pestanas.etiqueta"
      >
        <NTab name="peticion">{{ t.pestanas.peticion }}</NTab>
        <NTab name="coleccion">{{ t.pestanas.coleccion }} ({{ estado.coleccion.length }})</NTab>
        <NTab name="historial">{{ t.pestanas.historial }} ({{ estado.historial.length }})</NTab>
        <NTab name="entornos">{{ t.pestanas.entornos }} ({{ estado.entornos.length }})</NTab>
      </NTabs>
      <NSelect
        v-model:value="entornoActivo"
        :options="opcionesEntorno"
        size="small"
        class="entorno"
        :aria-label="t.entorno"
      />
    </div>

    <template v-if="seccion === 'peticion'">
      <NAlert v-if="avisos.length" type="info" closable @close="avisos = []">
        <ul class="avisos">
          <li v-for="(a, i) in avisos" :key="i">{{ aviso(a) }}</li>
        </ul>
      </NAlert>
      <div class="herr-fila linea-url">
        <NSelect
          v-model:value="borrador.metodo"
          :options="opcionesMetodo"
          class="metodo"
          :aria-label="t.metodo"
        />
        <NInput
          v-model:value="borrador.url"
          class="herr-mono url"
          :placeholder="t.urlPlaceholder"
          :aria-label="t.url"
          data-testid="http-url"
        />
        <NButton v-if="!enviando" type="primary" :disabled="!borrador.url.trim()" @click="enviar">{{
          t.enviarAtajo
        }}</NButton>
        <NButton v-else secondary @click="cancelar">{{ t.cancelar }}</NButton>
      </div>
      <div class="herr-fila">
        <NInput
          v-model:value="borrador.nombre"
          size="small"
          class="nombre"
          :placeholder="t.nombrePlaceholder"
          :aria-label="t.nombre"
          maxlength="120"
        />
        <NButton size="small" secondary @click="guardar">{{ t.guardar }}</NButton>
        <NButton size="small" quaternary @click="nueva">{{ t.nueva }}</NButton>
        <NButton size="small" secondary @click="copiarCurl">{{ t.curl.copiar }}</NButton>
        <NCheckbox v-model:checked="incluirCredenciales" size="small">{{
          t.curl.incluir
        }}</NCheckbox>
        <NButton size="small" quaternary @click="importando = true">{{ t.curl.importar }}</NButton>
      </div>
      <p class="herr-tenue">{{ t.ayudaVariables }}</p>

      <NTabs v-model:value="interna" type="line" size="small" animated>
        <NTabPane name="params" :tab="`${t.secciones.params} (${borrador.params.length})`">
          <EditorPares v-model="borrador.params" />
        </NTabPane>
        <NTabPane name="cabeceras" :tab="`${t.secciones.cabeceras} (${borrador.cabeceras.length})`">
          <EditorPares v-model="borrador.cabeceras" />
        </NTabPane>
        <NTabPane name="cuerpo" :tab="t.secciones.cuerpo">
          <div class="bloque">
            <NSelect
              v-model:value="cuerpoTipo"
              :options="opcionesCuerpo"
              size="small"
              class="corto"
              :aria-label="t.cuerpo.tipo"
            />
            <NInput
              v-if="cuerpoTipo === 'json' || cuerpoTipo === 'raw'"
              v-model:value="cuerpoTexto"
              type="textarea"
              class="herr-mono"
              :autosize="{ minRows: 6, maxRows: 16 }"
              :aria-label="t.cuerpo.texto"
              data-testid="http-cuerpo-texto"
            />
            <NInput
              v-if="cuerpoTipo === 'raw'"
              v-model:value="cuerpoTipoContenido"
              size="small"
              class="herr-mono"
              :placeholder="t.cuerpo.tipoContenido"
              :aria-label="t.cuerpo.tipoContenido"
            />
            <template v-if="cuerpoTipo === 'form' || cuerpoTipo === 'multipart'">
              <EditorPares v-model="cuerpoCampos" />
              <p v-if="cuerpoTipo === 'multipart'" class="herr-tenue">
                {{ t.cuerpo.multipartAyuda }}
              </p>
            </template>
          </div>
        </NTabPane>
        <NTabPane name="auth" :tab="t.secciones.auth">
          <div class="bloque">
            <NSelect
              v-model:value="authTipo"
              :options="opcionesAuth"
              size="small"
              class="corto"
              :aria-label="t.auth.tipo"
            />
            <template v-if="authTipo !== 'ninguna'">
              <NInput
                v-if="authTipo === 'basic'"
                v-model:value="authUsuario"
                size="small"
                :placeholder="t.auth.usuario"
                :aria-label="t.auth.usuario"
                autocomplete="off"
              />
              <template v-if="authTipo === 'apikey'">
                <NInput
                  v-model:value="authNombre"
                  size="small"
                  class="herr-mono"
                  :placeholder="t.auth.nombre"
                  :aria-label="t.auth.nombre"
                />
                <NSelect
                  v-model:value="authEn"
                  :options="opcionesEn"
                  size="small"
                  class="corto"
                  :aria-label="t.auth.en"
                />
              </template>
              <CampoSecreto
                v-model:valor="authValor"
                v-model:referencia="authRef"
                :etiqueta="etiquetaSecreto"
              />
              <p class="herr-tenue">{{ t.auth.ayuda }}</p>
            </template>
          </div>
        </NTabPane>
        <NTabPane name="opciones" :tab="t.secciones.opciones">
          <div class="bloque">
            <div>
              <div class="herr-etiqueta">{{ t.opciones.plazo }}</div>
              <NInputNumber
                v-model:value="plazo"
                :min="1"
                :max="PLAZO_HTTP_MAX_SEG"
                size="small"
                class="corto"
                :aria-label="t.opciones.plazo"
              />
              <span class="herr-tenue"> {{ t.opciones.plazoAyuda }}</span>
            </div>
            <NCheckbox v-model:checked="borrador.ignorarCertificado">{{
              t.opciones.ignorarCert
            }}</NCheckbox>
            <NAlert v-if="borrador.ignorarCertificado" type="warning" :show-icon="true">{{
              t.opciones.ignorarAviso
            }}</NAlert>
            <p class="herr-tenue">{{ t.opciones.limites }}</p>
          </div>
        </NTabPane>
      </NTabs>

      <PanelRespuesta :respuesta="respuesta" :error="error" :enviando="enviando" />
    </template>

    <template v-else-if="seccion === 'coleccion'">
      <EstadoVacio
        v-if="!estado.coleccion.length"
        :icono="Archive"
        :titulo="t.coleccion.vacioTitulo"
        :texto="t.coleccion.vacioTexto"
        pequena
        marco
      />
      <ul v-else class="lista" data-testid="http-coleccion">
        <li v-for="p in estado.coleccion" :key="p.id">
          <NTag size="small" :bordered="false">{{ p.metodo }}</NTag>
          <span class="nombre-item">
            <strong>{{ p.nombre }}</strong>
            <TextoLargo :texto="p.url" mono />
          </span>
          <NButton size="small" secondary @click="abrir(p)">{{ t.coleccion.abrir }}</NButton>
          <NButton size="small" quaternary type="error" @click="borrarPeticion(p.id)">{{
            t.coleccion.borrar
          }}</NButton>
        </li>
      </ul>
    </template>

    <template v-else-if="seccion === 'historial'">
      <EstadoVacio
        v-if="!estado.historial.length"
        :icono="Time"
        :titulo="t.historial.vacioTitulo"
        :texto="t.historial.vacioTexto"
        pequena
        marco
      />
      <template v-else>
        <div class="herr-fila">
          <NButton size="small" quaternary @click="limpiarHistorial">{{
            t.historial.limpiar
          }}</NButton>
        </div>
        <ul class="lista" data-testid="http-historial">
          <li v-for="h in estado.historial" :key="h.id">
            <NTag size="small" :bordered="false">{{ h.peticion.metodo }}</NTag>
            <span class="nombre-item">
              <strong>{{ etiquetaHistorial(h) }}</strong>
              <span class="herr-tenue">{{ formatearFecha(h.fecha, formatoHistorial) }}</span>
              <TextoLargo :texto="h.peticion.url" mono />
            </span>
            <NButton size="small" secondary @click="abrir(h.peticion)">{{
              t.historial.abrir
            }}</NButton>
          </li>
        </ul>
      </template>
    </template>

    <PanelEntornos
      v-else
      :entornos="estado.entornos"
      :activo="estado.entornoActivo"
      @cambio="cargar"
    />

    <NModal
      v-model:show="importando"
      preset="card"
      :title="t.curl.importarTitulo"
      class="modal-curl"
      :style="{ maxWidth: '640px' }"
    >
      <p class="herr-tenue">{{ t.curl.importarAyuda }}</p>
      <NInput
        v-model:value="textoCurl"
        type="textarea"
        class="herr-mono"
        :autosize="{ minRows: 5, maxRows: 14 }"
        :placeholder="t.curl.importarPlaceholder"
        :aria-label="t.curl.importarTitulo"
      />
      <template #footer>
        <NButton type="primary" :disabled="!textoCurl.trim()" @click="importar">{{
          t.curl.importarBoton
        }}</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.barra {
  justify-content: space-between;
  flex-wrap: nowrap;
}
.secciones {
  flex: 1;
  min-width: 0;
}
.entorno {
  width: 190px;
  flex: none;
}
.linea-url {
  flex-wrap: nowrap;
}
.metodo {
  width: 120px;
  flex: none;
}
.url {
  flex: 1;
  min-width: 0;
}
.nombre {
  width: 220px;
}
.corto {
  max-width: 260px;
}
.bloque {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 640px;
}
.avisos {
  margin: 0;
  padding-left: 18px;
}
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lista li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 8px;
}
.nombre-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12.5px;
}
</style>

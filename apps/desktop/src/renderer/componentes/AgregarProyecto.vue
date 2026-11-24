<script setup lang="ts">
import { CheckmarkCircle, FolderOpen, Key, LogoGithub, Warning } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NIcon,
  NInput,
  NInputGroup,
  NModal,
  NProgress,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { api } from '../api';
import { mensajeDeError, useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useProyectos } from '../stores/proyectos';
import { useSitios } from '../stores/sitios';
import {
  CARPETA_PROYECTOS,
  mismaRuta,
  nombreDeUrl,
  porcentajeGit,
  urlGitValida,
  remotoDe,
  urlParaClonar,
  type RepoConMarca,
} from '../utilidades/proyectos';
import ListaRepos from './ListaRepos.vue';
import PanelProgreso from './PanelProgreso.vue';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
  cerrar: [];
  /** Carpeta lista para el asistente de receta (clonada o elegida). */
  preparar: [datos: { carpeta: string; remoto: string | null }];
  /** Agregar una carpeta sin receta (el formulario de siempre). */
  manual: [];
}>();

const t = textos.proyectos;
const ta = t.agregarDialogo;
const tg = t.github;
const proyectos = useProyectos();
const sitios = useSitios();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

type Pestana = 'github' | 'url' | 'carpeta';
const pestana = ref<Pestana>('github');

/* ───── Conexión con GitHub ───── */

const conectando = ref(false);
const mostrarToken = ref(false);
/** Solo vive en este campo hasta enviarlo: nunca va al store ni se vuelve a mostrar. */
const token = ref('');
const sesionAbierta = ref(false);

async function cargarConexion(): Promise<void> {
  conectando.value = true;
  try {
    await ejecutar('conexion', () => proyectos.cargarConexion());
  } finally {
    conectando.value = false;
  }
}

watch(
  () => props.show,
  (v) => {
    if (!v) {
      token.value = '';
      mostrarToken.value = false;
      return;
    }
    errorClon.value = null;
    void cargarConexion();
    void ejecutar('carpeta', () => proyectos.cargarCarpeta());
  },
  { immediate: true },
);

const sinGit = computed(() => proyectos.disponibilidad !== null && !proyectos.disponibilidad.git);
const conectado = computed(() => proyectos.conexion !== 'ninguna');

async function instalarGh(): Promise<void> {
  const ok = await ejecutar('instalarGh', async () => {
    await api().github.instalarGh();
    return true;
  });
  if (ok) {
    message.success(tg.ghInstalado);
    await cargarConexion();
  }
}
async function iniciarSesion(): Promise<void> {
  const ok = await ejecutar('sesion', async () => {
    await api().github.iniciarSesionGh();
    return true;
  });
  if (ok) sesionAbierta.value = true;
}
async function guardarToken(): Promise<void> {
  const valor = token.value.trim();
  token.value = '';
  if (!valor) return;
  const ok = await ejecutar('token', async () => {
    await api().github.guardarToken(valor);
    return true;
  });
  if (ok) {
    mostrarToken.value = false;
    message.success(tg.tokenGuardado);
    await cargarConexion();
  }
}
async function quitarToken(): Promise<void> {
  const ok = await ejecutar('quitarToken', async () => {
    await api().github.borrarToken();
    return true;
  });
  if (ok) {
    message.success(tg.tokenQuitado);
    await cargarConexion();
  }
}

/* ───── Destino del clon ───── */

/** Carpeta padre elegida con el diálogo; null = la carpeta de proyectos. */
const padreElegido = ref<string | null>(null);
const nombreCarpeta = ref('');
const padre = computed(() => padreElegido.value ?? proyectos.carpetaProyectos ?? CARPETA_PROYECTOS);
const nombreValido = computed(
  () => !!nombreCarpeta.value.trim() && !/[\\/:*?"<>|]|^\.+$/.test(nombreCarpeta.value.trim()),
);
const destino = computed(() =>
  nombreValido.value ? `${padre.value.replace(/[\\/]+$/, '')}\\${nombreCarpeta.value.trim()}` : '',
);

async function elegirPadre(): Promise<void> {
  const c = await ejecutar('padre', () => api().sistema.elegirCarpeta());
  if (c) padreElegido.value = c;
}

/* ───── GitHub ───── */

const repo = ref<RepoConMarca | null>(null);
function elegirRepo(r: RepoConMarca): void {
  repo.value = r;
  nombreCarpeta.value = r.nombre;
}

/* ───── URL ───── */

const url = ref('');
let nombreAuto = '';
watch(url, (u) => {
  const n = nombreDeUrl(u);
  if (!nombreCarpeta.value || nombreCarpeta.value === nombreAuto) nombreCarpeta.value = n;
  nombreAuto = n;
});
const urlValida = computed(() => urlGitValida(url.value));

watch(pestana, (p) => {
  if (p === 'github') nombreCarpeta.value = repo.value?.nombre ?? '';
  else if (p === 'url') nombreCarpeta.value = nombreDeUrl(url.value);
});

/* ───── Clonar ───── */

const clonando = ref(false);
const errorClon = ref<string | null>(null);
const destinoClon = ref('');
const lineas = computed(() =>
  proyectos.lineasClon(destinoClon.value).map((texto, n) => ({ n, texto })),
);
const porcentaje = computed(() => {
  const l = lineas.value.at(-1)?.texto;
  return l ? porcentajeGit(l) : null;
});

const puedeClonar = computed(
  () =>
    !clonando.value &&
    !sinGit.value &&
    nombreValido.value &&
    (pestana.value === 'github' ? !!repo.value : urlValida.value),
);

async function clonar(): Promise<void> {
  if (!puedeClonar.value) return;
  const d = destino.value;
  let origen: string;
  let remoto: string | null;
  if (pestana.value === 'github' && repo.value) {
    origen = urlParaClonar(repo.value, proyectos.conexion === 'gh');
    remoto = repo.value.url;
  } else {
    origen = url.value.trim();
    remoto = remotoDe(origen);
  }
  clonando.value = true;
  errorClon.value = null;
  proyectos.olvidarClon(d);
  destinoClon.value = d;
  try {
    await api().git.clonar(origen, d);
    message.success(ta.clonado);
    emit('preparar', { carpeta: d, remoto });
  } catch (e) {
    errorClon.value = mensajeDeError(e);
  } finally {
    clonando.value = false;
  }
}

/* ───── Carpeta existente ───── */

async function elegirCarpeta(): Promise<void> {
  const c = await ejecutar('elegirCarpeta', () => api().sistema.elegirCarpeta());
  if (!c) return;
  const existente = sitios.lista.find((s) => mismaRuta(s.carpeta, c));
  if (existente) {
    message.warning(t.carpeta.yaEsProyecto(existente.nombre || existente.dominio));
    return;
  }
  emit('preparar', { carpeta: c, remoto: null });
}

async function vigilar(): Promise<void> {
  const c = await ejecutar('elegirVigilada', () => api().sistema.elegirCarpeta());
  if (c) await ejecutar('vigilar', () => proyectos.cambiarCarpetaVigilada(c));
}
function dejarDeVigilar(): void {
  void ejecutar('vigilar', () => proyectos.cambiarCarpetaVigilada(null));
}

function alCambiarVisible(v: boolean): void {
  if (!v && !clonando.value) emit('cerrar');
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="ta.titulo"
    :style="{ width: '680px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="!clonando"
    :closable="!clonando"
    :close-on-esc="!clonando"
    :auto-focus="false"
    @update:show="alCambiarVisible"
  >
    <NTabs v-model:value="pestana" type="line" animated>
      <!-- GitHub -->
      <NTabPane name="github" :tab="ta.pestanas.github" :disabled="clonando">
        <div class="conexion" :class="proyectos.conexion">
          <NIcon :size="20" aria-hidden="true">
            <CheckmarkCircle v-if="conectado" />
            <LogoGithub v-else />
          </NIcon>
          <div class="conexion-texto">
            <strong v-if="proyectos.conexion === 'gh'">
              {{ tg.estadoGh(proyectos.disponibilidad?.usuario) }}
            </strong>
            <strong v-else-if="proyectos.conexion === 'token'">{{ tg.estadoToken }}</strong>
            <template v-else>
              <strong>{{ tg.estadoNinguna }}</strong>
              <span>{{ tg.ayudaNinguna }}</span>
            </template>
          </div>
          <div class="conexion-botones">
            <template v-if="!conectado">
              <NButton
                v-if="proyectos.disponibilidad && !proyectos.disponibilidad.gh"
                size="small"
                type="primary"
                :loading="ocupado('instalarGh')"
                @click="instalarGh"
              >
                {{ ocupado('instalarGh') ? tg.instalandoGh : tg.instalarGh }}
              </NButton>
              <NButton
                v-else-if="proyectos.disponibilidad?.gh"
                size="small"
                type="primary"
                :loading="ocupado('sesion')"
                @click="iniciarSesion"
              >
                {{ tg.iniciarSesion }}
              </NButton>
              <NButton size="small" secondary @click="mostrarToken = !mostrarToken">
                <template #icon
                  ><NIcon><Key /></NIcon
                ></template>
                {{ tg.usarToken }}
              </NButton>
            </template>
            <NButton
              v-if="proyectos.conexion === 'token'"
              size="small"
              quaternary
              :loading="ocupado('quitarToken')"
              @click="quitarToken"
            >
              {{ tg.quitarToken }}
            </NButton>
            <NButton size="small" quaternary :loading="conectando" @click="cargarConexion">
              {{ tg.comprobar }}
            </NButton>
          </div>
        </div>
        <p v-if="sesionAbierta && !conectado" class="nota">{{ tg.sesionAbierta }}</p>
        <form v-if="mostrarToken && !conectado" class="token" @submit.prevent="guardarToken">
          <label class="campo">
            <span>{{ tg.token }}</span>
            <NInputGroup>
              <NInput
                v-model:value="token"
                type="password"
                size="small"
                :placeholder="tg.tokenPlaceholder"
                :input-props="{ autocomplete: 'off', spellcheck: false }"
              />
              <NButton
                size="small"
                type="primary"
                attr-type="submit"
                :disabled="!token.trim()"
                :loading="ocupado('token')"
              >
                {{ tg.guardarToken }}
              </NButton>
            </NInputGroup>
          </label>
          <p class="nota">{{ tg.tokenAyuda }}</p>
        </form>

        <ListaRepos
          v-if="conectado && !sinGit"
          :seleccionado="repo?.completo ?? null"
          class="lista"
          @elegir="elegirRepo"
        />
      </NTabPane>

      <!-- URL de Git -->
      <NTabPane name="url" :tab="ta.pestanas.url" :disabled="clonando">
        <label class="campo">
          <span>{{ t.url.etiqueta }}</span>
          <NInput
            v-model:value="url"
            size="small"
            class="mono"
            :placeholder="t.url.placeholder"
            :status="url && !urlValida ? 'error' : undefined"
            :input-props="{ spellcheck: false }"
          />
        </label>
        <p class="nota" :class="{ error: url && !urlValida }">
          {{ url && !urlValida ? t.url.invalida : t.url.ayuda }}
        </p>
      </NTabPane>

      <!-- Carpeta existente -->
      <NTabPane name="carpeta" :tab="ta.pestanas.carpeta" :disabled="clonando">
        <div class="carpeta">
          <NIcon :size="26" class="carpeta-icono" aria-hidden="true"><FolderOpen /></NIcon>
          <h4>{{ t.carpeta.titulo }}</h4>
          <p class="nota">{{ t.carpeta.texto }}</p>
          <NButton type="primary" :loading="ocupado('elegirCarpeta')" @click="elegirCarpeta">
            <template #icon
              ><NIcon><FolderOpen /></NIcon
            ></template>
            {{ t.carpeta.elegir }}
          </NButton>
          <NButton quaternary size="small" @click="emit('manual')">{{ t.carpeta.manual }}</NButton>
        </div>
        <section class="vigilada">
          <h4>{{ t.carpeta.vigilarTitulo }}</h4>
          <p class="nota">{{ t.carpeta.vigilarTexto }}</p>
          <div class="vigilada-fila">
            <span class="mono">
              {{
                proyectos.carpetaProyectos
                  ? t.carpeta.vigilando(proyectos.carpetaProyectos)
                  : t.carpeta.sinVigilar
              }}
            </span>
            <NButton size="small" secondary :loading="ocupado('vigilar')" @click="vigilar">
              {{ proyectos.carpetaProyectos ? t.carpeta.cambiarVigilada : t.carpeta.vigilar }}
            </NButton>
            <NButton
              v-if="proyectos.carpetaProyectos"
              size="small"
              quaternary
              :disabled="ocupado('vigilar')"
              @click="dejarDeVigilar"
            >
              {{ t.carpeta.dejarDeVigilar }}
            </NButton>
          </div>
        </section>
      </NTabPane>
    </NTabs>

    <!-- Destino y clon (GitHub y URL). -->
    <section v-if="pestana !== 'carpeta'" class="destino">
      <NAlert v-if="sinGit" type="warning" :show-icon="true">
        <template #icon
          ><NIcon><Warning /></NIcon
        ></template>
        {{ ta.sinGit }}
      </NAlert>
      <div class="rejilla">
        <label class="campo">
          <span>{{ ta.nombreCarpeta }}</span>
          <NInput
            v-model:value="nombreCarpeta"
            size="small"
            class="mono"
            :disabled="clonando"
            :placeholder="ta.nombrePlaceholder"
            :status="nombreCarpeta && !nombreValido ? 'error' : undefined"
          />
        </label>
        <div class="campo">
          <span>{{ ta.destino }}</span>
          <div class="destino-fila">
            <code class="ruta" :title="destino">{{ destino || padre }}</code>
            <NButton size="small" secondary :disabled="clonando" @click="elegirPadre">
              {{ ta.elegirDestino }}
            </NButton>
            <NButton
              v-if="padreElegido"
              size="small"
              quaternary
              :disabled="clonando"
              @click="padreElegido = null"
            >
              {{ ta.destinoPorDefecto }}
            </NButton>
          </div>
        </div>
      </div>
      <p class="nota">{{ ta.destinoAyuda(padre) }}</p>

      <div v-if="clonando || lineas.length" class="progreso">
        <NProgress
          v-if="clonando"
          type="line"
          :percentage="porcentaje ?? 0"
          :show-indicator="porcentaje !== null"
          :processing="porcentaje === null"
        />
        <PanelProgreso :lineas="lineas" :limite="200" :alto="120" :etiqueta="ta.clonando" />
        <p v-if="clonando" class="nota">{{ ta.sinCancelar }}</p>
      </div>
      <NAlert
        v-if="errorClon"
        type="error"
        :title="ta.errorClonar"
        closable
        @close="errorClon = null"
      >
        {{ errorClon }}
      </NAlert>
    </section>

    <template #footer>
      <div class="pie">
        <NButton :disabled="clonando" @click="emit('cerrar')">{{
          textos.acciones.cancelar
        }}</NButton>
        <NButton
          v-if="pestana !== 'carpeta'"
          type="primary"
          :disabled="!puedeClonar"
          :loading="clonando"
          @click="clonar"
        >
          {{ clonando ? ta.clonando : ta.clonar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.mono,
.ruta {
  font-family: var(--fuente-mono);
}
.conexion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.045);
}
.conexion.gh,
.conexion.token {
  border-color: rgba(22, 163, 74, 0.4);
}
.conexion.gh .n-icon,
.conexion.token .n-icon {
  color: var(--texto-ok);
}
.conexion-texto {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}
.conexion-texto span {
  font-size: 12px;
  opacity: 0.65;
}
.conexion-botones {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.nota {
  margin: 6px 0 0;
  font-size: 12px;
  opacity: 0.65;
}
.nota.error {
  color: var(--texto-error);
  opacity: 1;
}
.token {
  margin-top: 10px;
}
.lista {
  margin-top: 12px;
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
.carpeta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 0 14px;
  text-align: center;
}
.carpeta h4,
.vigilada h4 {
  margin: 0;
  font-size: 13.5px;
}
.carpeta-icono {
  opacity: 0.6;
}
.vigilada {
  padding-top: 12px;
  border-top: 1px solid rgba(128, 128, 128, 0.16);
}
.vigilada-fila {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  font-size: 12.5px;
}
.vigilada-fila .mono {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.destino {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(128, 128, 128, 0.16);
}
.rejilla {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) 2fr;
  gap: 12px;
}
.destino-fila {
  display: flex;
  align-items: center;
  gap: 6px;
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
.progreso {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

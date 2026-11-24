<script setup lang="ts">
import { Checkmark, FolderOpen, Key, LogoGithub, ShieldCheckmark } from '@vicons/ionicons5';
import {
  NButton,
  NIcon,
  NInput,
  NInputGroup,
  NModal,
  NProgress,
  NStep,
  NSteps,
  useMessage,
  useNotification,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { VersionDisponible } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { solicitudes } from '../composables/solicitudes';
import { textos } from '../i18n';
import { useHttps } from '../stores/https';
import { usePreferencias } from '../stores/preferencias';
import { useProyectos } from '../stores/proyectos';
import { useServicios } from '../stores/servicios';
import { BASICOS, versionBasica, yaInstalado, type Basico } from '../utilidades/asistenteInicio';

/**
 * Asistente de primer uso. Cada paso solo informa y ofrece un botón: nada se instala, se confía
 * ni se conecta sin un clic explícito del usuario en ese paso. Se puede omitir y volver a abrir
 * desde Ajustes.
 */
const t = textos.asistenteInicio;
const tp = t.pasos;
const tg = textos.proyectos.github;
const th = textos.formSitioHttps;
const preferencias = usePreferencias();
const proyectos = useProyectos();
const servicios = useServicios();
const https = useHttps();
const message = useMessage();
const notification = useNotification();
const { ejecutar, ocupado } = useAccion();

const PASOS = ['carpeta', 'basicos', 'ca', 'github', 'vigilar'] as const;
const actual = ref(0);
const elegida = ref<string | null>(null);
const versiones = ref<Partial<Record<Basico['servicio'], VersionDisponible[]>>>({});
const token = ref('');
const mostrarToken = ref(false);
const sesionAbierta = ref(false);

const visible = computed({
  get: () => solicitudes.asistente,
  set: (v: boolean) => {
    if (!v) cerrar();
  },
});

/** Cerrar (omitir o terminar) cuenta como visto: no vuelve a abrirse solo. */
function cerrar(): void {
  solicitudes.asistente = false;
  if (!preferencias.asistenteVisto) void preferencias.marcarAsistenteVisto().catch(() => undefined);
}

watch(
  () => solicitudes.asistente,
  (v) => {
    if (!v) return;
    actual.value = 0;
    // Solo lecturas: estado de la carpeta, de HTTPS y de GitHub.
    void ejecutar('carpeta', () => proyectos.cargarCarpeta());
  },
  { immediate: true },
);

watch(actual, (i) => {
  const paso = PASOS[i];
  if (paso === 'basicos') void cargarBasicos();
  if (paso === 'ca') void https.cargar();
  if (paso === 'github') void ejecutar('conexion', () => proyectos.cargarConexion());
});

/* ───── Paso 1: carpeta de proyectos ───── */

async function elegirCarpeta(): Promise<void> {
  const r = await ejecutar('elegir', () => api().sistema.elegirCarpeta());
  if (r) elegida.value = r;
}

/* ───── Paso 2: lo básico ───── */

async function cargarBasicos(): Promise<void> {
  for (const b of BASICOS) {
    void ejecutar(`instalados-${b.servicio}`, () => servicios.cargarInstalados(b.servicio));
    if (versiones.value[b.servicio]) continue;
    void ejecutar(`versiones-${b.servicio}`, () =>
      api().instalador.listarVersiones(b.servicio),
    ).then((v) => {
      if (v) versiones.value = { ...versiones.value, [b.servicio]: v.versiones };
    });
  }
}

const filas = computed(() =>
  BASICOS.map((b) => {
    const lista = versiones.value[b.servicio];
    const instalado = yaInstalado(b, servicios.instalados[b.servicio] ?? []);
    const progreso = servicios
      .progresoDe(b.servicio)
      .find((p) => p.fase !== 'listo' && p.fase !== 'error');
    return {
      ...b,
      nombre: tp.basicos.nombres[b.servicio],
      version: lista ? versionBasica(b, lista) : undefined,
      cargando: !lista,
      instalado,
      progreso,
    };
  }),
);

async function instalar(b: Basico): Promise<void> {
  const v = versiones.value[b.servicio] && versionBasica(b, versiones.value[b.servicio]!);
  if (!v) return;
  const ok = await ejecutar(
    `instalar-${b.servicio}`,
    async () => {
      await api().instalador.instalar({ servicio: v.servicio, version: v.version });
      return true;
    },
    { exito: textos.instalar.exito(tp.basicos.nombres[b.servicio], v.version) },
  );
  if (ok) await ejecutar('instalados', () => servicios.cargarInstalados(b.servicio));
}

/* ───── Paso 3: autoridad local ───── */

async function confiarCa(): Promise<void> {
  if (ocupado('ca')) return;
  const r = await ejecutar('ca', async () => {
    const res = await api().https.instalarCA();
    await https.cargar();
    return res;
  });
  if (!r) return;
  if (r.ok) message.success(th.instalada);
  else if (r.motivo === 'cancelado') message.info(th.cancelado);
  else notification.error({ title: th.fallo, content: r.mensaje, duration: 10000 });
}

/* ───── Paso 4: GitHub ───── */

const conectado = computed(() => proyectos.conexion !== 'ninguna');

async function instalarGh(): Promise<void> {
  const ok = await ejecutar('instalarGh', async () => {
    await api().github.instalarGh();
    return true;
  });
  if (ok) {
    message.success(tg.ghInstalado);
    await ejecutar('conexion', () => proyectos.cargarConexion());
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
    await ejecutar('conexion', () => proyectos.cargarConexion());
  }
}

/* ───── Paso 5: vigilar la carpeta ───── */

/** La carpeta a vigilar: la elegida en el paso 1 o, si no, la que ya estaba guardada. */
const carpetaVigilar = computed(() => elegida.value ?? proyectos.carpetaProyectos);
const vigilando = computed(() => !elegida.value && !!proyectos.carpetaProyectos);

async function vigilar(): Promise<void> {
  const c = elegida.value;
  if (!c) return;
  const ok = await ejecutar('vigilar', async () => {
    await proyectos.cambiarCarpetaVigilada(c);
    return true;
  });
  if (ok) elegida.value = null;
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="t.titulo"
    :mask-closable="false"
    :style="{ width: 'min(760px, 94vw)' }"
    class="asistente-inicio"
  >
    <p class="subtitulo">{{ t.subtitulo }}</p>
    <NSteps :current="actual + 1" size="small" class="pasos">
      <!-- Solo el paso actual lleva título: cinco títulos no entran en el ancho del diálogo. -->
      <NStep
        v-for="(p, i) in PASOS"
        :key="p"
        :title="i === actual ? tp[p].titulo : ''"
        :aria-label="tp[p].titulo"
      />
    </NSteps>

    <Transition name="paso" mode="out-in">
      <section :key="actual" class="cuerpo" :aria-label="t.paso(actual + 1, PASOS.length)">
        <p class="numero">{{ t.paso(actual + 1, PASOS.length) }}</p>
        <h3>{{ tp[PASOS[actual]!].titulo }}</h3>
        <p class="texto">{{ tp[PASOS[actual]!].texto }}</p>

        <!-- 1. Carpeta de proyectos -->
        <div v-if="PASOS[actual] === 'carpeta'" class="accion">
          <span class="ruta">
            {{
              elegida
                ? tp.carpeta.actual(elegida)
                : proyectos.carpetaProyectos
                  ? tp.carpeta.guardada(proyectos.carpetaProyectos)
                  : tp.carpeta.ninguna
            }}
          </span>
          <NButton secondary :loading="ocupado('elegir')" @click="elegirCarpeta">
            <template #icon
              ><NIcon><FolderOpen /></NIcon
            ></template>
            {{ tp.carpeta.elegir }}
          </NButton>
        </div>

        <!-- 2. Lo básico -->
        <ul v-else-if="PASOS[actual] === 'basicos'" class="basicos">
          <li v-for="f in filas" :key="f.servicio" class="basico">
            <div class="basico-texto">
              <strong>{{ f.nombre }}</strong>
              <small v-if="f.cargando">{{ tp.basicos.cargando }}</small>
              <small v-else-if="!f.version">{{ tp.basicos.sinVersion }}</small>
              <NProgress
                v-if="f.progreso"
                type="line"
                :percentage="Math.round(f.progreso.porcentaje)"
                :show-indicator="false"
                :height="4"
                class="barra"
              />
            </div>
            <span v-if="f.instalado" class="hecho">
              <NIcon><Checkmark /></NIcon>
              {{ tp.basicos.instalado }}
            </span>
            <NButton
              v-else-if="f.version"
              size="small"
              type="primary"
              secondary
              :loading="ocupado(`instalar-${f.servicio}`)"
              @click="instalar(f)"
            >
              {{ tp.basicos.instalar(f.version.version) }}
            </NButton>
          </li>
        </ul>

        <!-- 3. Autoridad local -->
        <div v-else-if="PASOS[actual] === 'ca'" class="accion">
          <span v-if="https.estado?.caInstalada" class="hecho">
            <NIcon><Checkmark /></NIcon>
            {{ tp.ca.confiada }}
          </span>
          <NButton v-else type="primary" secondary :loading="ocupado('ca')" @click="confiarCa">
            <template #icon
              ><NIcon><ShieldCheckmark /></NIcon
            ></template>
            {{ tp.ca.confiar }}
          </NButton>
        </div>

        <!-- 4. GitHub -->
        <div v-else-if="PASOS[actual] === 'github'" class="github">
          <div class="accion">
            <span class="estado-github">
              <NIcon :size="18"><LogoGithub /></NIcon>
              <template v-if="proyectos.conexion === 'gh'">
                {{ tg.estadoGh(proyectos.disponibilidad?.usuario) }}
              </template>
              <template v-else-if="proyectos.conexion === 'token'">{{ tg.estadoToken }}</template>
              <template v-else>{{ tg.estadoNinguna }}</template>
            </span>
            <span v-if="!conectado" class="botones">
              <NButton
                v-if="proyectos.disponibilidad && !proyectos.disponibilidad.gh"
                size="small"
                type="primary"
                secondary
                :loading="ocupado('instalarGh')"
                @click="instalarGh"
              >
                {{ ocupado('instalarGh') ? tg.instalandoGh : tg.instalarGh }}
              </NButton>
              <NButton
                v-else-if="proyectos.disponibilidad?.gh"
                size="small"
                type="primary"
                secondary
                :loading="ocupado('sesion')"
                @click="iniciarSesion"
              >
                {{ tg.iniciarSesion }}
              </NButton>
              <NButton size="small" quaternary @click="mostrarToken = !mostrarToken">
                <template #icon
                  ><NIcon><Key /></NIcon
                ></template>
                {{ tg.usarToken }}
              </NButton>
              <NButton
                size="small"
                quaternary
                :loading="ocupado('conexion')"
                @click="ejecutar('conexion', () => proyectos.cargarConexion())"
              >
                {{ tg.comprobar }}
              </NButton>
            </span>
          </div>
          <p v-if="sesionAbierta && !conectado" class="nota">{{ tg.sesionAbierta }}</p>
          <form v-if="mostrarToken && !conectado" class="token" @submit.prevent="guardarToken">
            <NInputGroup>
              <NInput
                v-model:value="token"
                type="password"
                size="small"
                :placeholder="tg.tokenPlaceholder"
                :input-props="{ autocomplete: 'off', spellcheck: false, 'aria-label': tg.token }"
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
            <p class="nota">{{ tg.tokenAyuda }}</p>
          </form>
        </div>

        <!-- 5. Vigilar la carpeta -->
        <div v-else class="accion">
          <span v-if="vigilando && carpetaVigilar" class="hecho">
            <NIcon><Checkmark /></NIcon>
            {{ tp.vigilar.activa(carpetaVigilar) }}
          </span>
          <template v-else-if="elegida">
            <span class="ruta">{{ tp.carpeta.actual(elegida) }}</span>
            <NButton type="primary" secondary :loading="ocupado('vigilar')" @click="vigilar">
              {{ tp.vigilar.activar }}
            </NButton>
          </template>
          <span v-else class="ruta">{{ tp.vigilar.sinCarpeta }}</span>
        </div>
      </section>
    </Transition>

    <template #footer>
      <div class="pie">
        <NButton quaternary size="small" @click="cerrar">{{ t.omitirTodo }}</NButton>
        <span class="espacio">{{ t.reabrir }}</span>
        <NButton v-if="actual > 0" size="small" @click="actual--">{{ t.anterior }}</NButton>
        <NButton v-if="actual < PASOS.length - 1" type="primary" size="small" @click="actual++">
          {{ t.siguiente }}
        </NButton>
        <NButton v-else type="primary" size="small" @click="cerrar">{{ t.terminar }}</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.subtitulo {
  margin: -6px 0 16px;
  font-size: 13px;
  opacity: 0.7;
}
.pasos {
  margin-bottom: 18px;
}

.cuerpo {
  min-height: 190px;
}
.numero {
  margin: 0;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
}
.cuerpo h3 {
  margin: 2px 0 6px;
  font-size: 16px;
  font-weight: 650;
}
.texto {
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.5;
  opacity: 0.8;
}
.accion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 10px;
}
.ruta {
  font-size: 13px;
  word-break: break-all;
  opacity: 0.85;
}
.hecho {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--texto-ok);
  font-size: 13px;
}
.basicos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.basico {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 10px;
}
.basico-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.basico-texto small {
  font-size: 12px;
  opacity: 0.6;
}
.barra {
  max-width: 220px;
}
.estado-github {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.botones {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}
.token {
  margin-top: 10px;
}
.nota {
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.65;
}
.pie {
  display: flex;
  align-items: center;
  gap: 8px;
}
.espacio {
  flex: 1;
  font-size: 11.5px;
  opacity: 0.5;
  text-align: right;
}
.paso-enter-active,
.paso-leave-active {
  transition:
    opacity var(--transicion) ease,
    transform var(--transicion) ease;
}
.paso-enter-from {
  opacity: 0;
  transform: translateX(6px);
}
.paso-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .paso-enter-active,
  .paso-leave-active {
    transition: none;
  }
}
</style>

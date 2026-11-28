<script setup lang="ts">
import { Wifi, Refresh, Search, Speedometer } from '@vicons/ionicons5';
import { PLAN_VELOCIDAD } from '@pel/core';
import { NAlert, NButton, NCheckbox, NIcon, NModal, NTag } from 'naive-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type {
  CarpetaCompartida,
  LecturaRed,
  ProgresoEscaneoRed,
  ResultadoCarpetasDeEquipo,
  ResultadoVelocidad,
} from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import EstadoVacio from '../EstadoVacio.vue';

/**
 * Mi red (D53): carpetas que este equipo comparte, equipos de la red local y una prueba de
 * velocidad. Solo lee y consulta: no hay control remoto, escritorio remoto ni ejecución en otros
 * equipos. La ventana nunca manda rangos, rutas ni comandos: el núcleo decide la red a explorar
 * (la activa, privada y no pública), exige la confirmación de cada acción que toca algo y vuelve a
 * validar equipos y recursos. Dejar de compartir abre un UAC solo tras la confirmación firme.
 */
const t = textos.herramientas.miRed;
const { ejecutar, ocupado } = useAccion();

type FilaCarpeta = CarpetaCompartida;
type FaseVel = 'latencia' | 'bajada' | 'subida';

const carpetas = ref<FilaCarpeta[] | null>(null);
const verAdministrativas = ref(false);
const lectura = ref<LecturaRed | null>(null);
const progreso = ref<ProgresoEscaneoRed | null>(null);
const escaneando = ref(false);
const avisoEscaneo = ref<string | null>(null);
const pings = ref<Record<string, string>>({});
const equipoAbierto = ref<{ ip: string; r: ResultadoCarpetasDeEquipo } | null>(null);
const velocidad = ref<(ResultadoVelocidad & { plan: { totalMb: number } }) | null>(null);
const faseVelocidad = ref<FaseVel | null>(null);
const midiendo = ref(false);

const quitando = ref<FilaCarpeta | null>(null);
const entiendeUac = ref(false);
const confirmandoEscaneo = ref(false);
const confirmandoVelocidad = ref(false);
const botonCancelarQuitar = ref<InstanceType<typeof NButton> | null>(null);
const botonCancelarEscaneo = ref<InstanceType<typeof NButton> | null>(null);
const botonCancelarVelocidad = ref<InstanceType<typeof NButton> | null>(null);
const mensajeCarpetas = ref<string | null>(null);
let bajas: Array<() => void> = [];

const visibles = computed(() =>
  (carpetas.value ?? []).filter((c) => verAdministrativas.value || !c.administrativa),
);
const hayAdministrativas = computed(() => (carpetas.value ?? []).some((c) => c.administrativa));
const equipos = computed(() => lectura.value?.equipos ?? []);
const adaptadorActivo = computed(() => lectura.value?.adaptadores.find((a) => a.predeterminado));
const escaneo = computed(() => lectura.value?.escaneo ?? null);

/** Por qué no se puede explorar, en palabras de la persona (o null si se puede). */
const motivoSinEscaneo = computed(() => {
  const e = escaneo.value;
  if (!e || e.permitido) return null;
  if (e.motivo === 'publica') return t.equipos.publica;
  if (e.motivo === 'perfil_desconocido') return t.equipos.perfilDesconocido;
  return t.equipos.sinRed;
});

onMounted(() => {
  bajas = [
    api().on('red:escaneo', (p) => (progreso.value = p)),
    api().on('red:velocidad', (p) => (faseVelocidad.value = p.fase)),
  ];
  void cargarCarpetas();
});

onBeforeUnmount(() => {
  for (const b of bajas) b();
  // Salir de la herramienta corta lo que sigue en marcha.
  if (escaneando.value)
    void api()
      .miRed.cancelarEscaneo()
      .catch(() => undefined);
  if (midiendo.value)
    void api()
      .miRed.cancelarVelocidad()
      .catch(() => undefined);
});

async function cargarCarpetas(): Promise<void> {
  const r = await ejecutar('carpetas', () => api().miRed.carpetas());
  if (r) carpetas.value = r;
}

async function leerRed(): Promise<void> {
  const r = await ejecutar('leer', () => api().miRed.lectura());
  if (r) lectura.value = r;
}

// ---- Dejar de compartir (confirmación firme, UAC) ----

async function pedirQuitar(c: FilaCarpeta): Promise<void> {
  mensajeCarpetas.value = null;
  entiendeUac.value = false;
  quitando.value = c;
  // El foco empieza en Cancelar: Intro nunca quita nada.
  await nextTick();
  (botonCancelarQuitar.value?.$el as HTMLElement | undefined)?.focus();
}

async function quitar(): Promise<void> {
  const c = quitando.value;
  if (!c || !entiendeUac.value) return;
  quitando.value = null;
  const r = await ejecutar('quitar', () => api().miRed.dejarDeCompartir(c.nombre, true));
  if (!r) {
    await cargarCarpetas();
    return;
  }
  carpetas.value = r.carpetas;
  mensajeCarpetas.value =
    r.estado === 'quitada'
      ? t.carpetas.resultado.quitada(c.nombre)
      : r.estado === 'cancelado'
        ? t.carpetas.resultado.cancelado
        : t.carpetas.resultado.tiempo;
}

// ---- Escaneo activo (solo con confirmación) ----

async function pedirEscaneo(): Promise<void> {
  confirmandoEscaneo.value = true;
  await nextTick();
  (botonCancelarEscaneo.value?.$el as HTMLElement | undefined)?.focus();
}

async function escanear(): Promise<void> {
  confirmandoEscaneo.value = false;
  escaneando.value = true;
  progreso.value = null;
  avisoEscaneo.value = null;
  try {
    const r = await ejecutar('escanear', () => api().miRed.escanear(true));
    if (r) {
      if (lectura.value) lectura.value = { ...lectura.value, equipos: r.equipos };
      else await leerRed();
      avisoEscaneo.value = r.cancelado
        ? t.equipos.escaneoCancelado(r.revisados, r.total)
        : t.equipos.escaneoListo(r.equipos.length, r.red);
    }
  } finally {
    escaneando.value = false;
    progreso.value = null;
  }
}

async function cancelarEscaneo(): Promise<void> {
  await ejecutar('cancelarEscaneo', () => api().miRed.cancelarEscaneo());
}

// ---- Acciones por equipo ----

async function hacerPing(ip: string): Promise<void> {
  const r = await ejecutar(`ping-${ip}`, () => api().miRed.ping(ip));
  if (!r) return;
  pings.value = {
    ...pings.value,
    [ip]: r.cancelado
      ? '—'
      : r.recibidos === 0
        ? t.ping.sinRespuesta(r.enviados)
        : t.ping.resultado(r.recibidos, r.enviados, r.mediaMs ?? 0),
  };
}

async function verCarpetas(ip: string): Promise<void> {
  const r = await ejecutar(`carpetas-${ip}`, () => api().miRed.carpetasDeEquipo(ip));
  if (r) equipoAbierto.value = { ip, r };
}

function abrir(ip: string, recurso: string): void {
  void ejecutar(`abrir-${recurso}`, () => api().miRed.abrirRecurso(ip, recurso));
}

// ---- Prueba de velocidad ----

async function pedirVelocidad(): Promise<void> {
  confirmandoVelocidad.value = true;
  await nextTick();
  (botonCancelarVelocidad.value?.$el as HTMLElement | undefined)?.focus();
}

async function medir(): Promise<void> {
  confirmandoVelocidad.value = false;
  midiendo.value = true;
  velocidad.value = null;
  faseVelocidad.value = 'latencia';
  try {
    const r = await ejecutar('velocidad', () => api().miRed.medirVelocidad(true));
    if (r) velocidad.value = r;
  } finally {
    midiendo.value = false;
    faseVelocidad.value = null;
  }
}

async function cancelarVelocidad(): Promise<void> {
  await ejecutar('cancelarVelocidad', () => api().miRed.cancelarVelocidad());
}

const numero = (n: number | null): string => (n === null ? '—' : String(n));
const perfilTexto = (p: string | null): string =>
  t.equipos.perfil[(p ?? 'desconocido') as keyof typeof t.equipos.perfil];
</script>

<template>
  <div class="herr mi-red" data-testid="mi-red">
    <NAlert type="info" :show-icon="false">{{ t.explicacion }}</NAlert>

    <!-- Carpetas compartidas de este equipo -->
    <section class="bloque" data-testid="mi-red-carpetas">
      <div class="cabecera">
        <strong>{{ t.carpetas.titulo }}</strong>
        <NButton size="small" secondary :loading="ocupado('carpetas')" @click="cargarCarpetas">
          <template #icon
            ><NIcon><Refresh /></NIcon
          ></template>
          {{ textos.acciones.actualizar }}
        </NButton>
      </div>
      <p class="herr-tenue">{{ t.carpetas.ayuda }}</p>
      <NCheckbox v-if="hayAdministrativas" v-model:checked="verAdministrativas">{{
        t.carpetas.mostrarAdministrativas
      }}</NCheckbox>
      <NAlert v-if="mensajeCarpetas" type="success" :show-icon="false" role="status">{{
        mensajeCarpetas
      }}</NAlert>
      <EstadoVacio
        v-if="carpetas !== null && visibles.length === 0"
        pequena
        :icono="Wifi"
        :titulo="t.carpetas.vacioTitulo"
        :texto="t.carpetas.vacioTexto"
      />
      <div v-else-if="visibles.length > 0" class="tabla-marco">
        <table class="tabla" data-testid="mi-red-tabla-carpetas">
          <thead>
            <tr>
              <th>{{ t.carpetas.col.nombre }}</th>
              <th>{{ t.carpetas.col.ruta }}</th>
              <th>{{ t.carpetas.col.descripcion }}</th>
              <th class="num">{{ t.carpetas.col.usuarios }}</th>
              <th class="acc">{{ t.carpetas.col.acciones }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in visibles" :key="c.nombre" :class="{ tenue: c.administrativa }">
              <td class="dato">
                {{ c.nombre }}
                <NTag v-if="c.administrativa" size="small" :bordered="false">{{
                  t.carpetas.administrativa
                }}</NTag>
              </td>
              <td class="mono ruta dato">{{ c.ruta }}</td>
              <td class="dato">{{ c.descripcion }}</td>
              <td class="num">{{ numero(c.usuarios) }}</td>
              <td class="acc">
                <NButton
                  v-if="!c.administrativa"
                  size="small"
                  type="error"
                  secondary
                  :loading="ocupado('quitar')"
                  :disabled="ocupado('quitar')"
                  data-testid="mi-red-dejar"
                  @click="pedirQuitar(c)"
                  >{{ t.carpetas.dejar }}</NButton
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Equipos de la red local -->
    <section class="bloque" data-testid="mi-red-equipos">
      <div class="cabecera">
        <strong>{{ t.equipos.titulo }}</strong>
        <div class="herr-fila">
          <NButton
            size="small"
            secondary
            :loading="ocupado('leer')"
            data-testid="mi-red-leer"
            @click="leerRed"
          >
            <template #icon
              ><NIcon><Refresh /></NIcon
            ></template>
            {{ t.equipos.leer }}
          </NButton>
          <NButton
            v-if="!escaneando"
            size="small"
            type="primary"
            secondary
            :disabled="!escaneo?.permitido"
            data-testid="mi-red-escanear"
            @click="pedirEscaneo"
          >
            <template #icon
              ><NIcon><Search /></NIcon
            ></template>
            {{ t.equipos.escanear }}
          </NButton>
          <NButton
            v-else
            size="small"
            secondary
            data-testid="mi-red-cancelar-escaneo"
            @click="cancelarEscaneo"
            >{{ textos.acciones.cancelar }}</NButton
          >
        </div>
      </div>
      <p class="herr-tenue">{{ t.equipos.ayuda }}</p>

      <p v-if="adaptadorActivo" class="herr-tenue" data-testid="mi-red-activa">
        {{ t.equipos.redActiva }}:
        <span class="mono"
          >{{ adaptadorActivo.nombre }} ·
          {{ escaneo?.red ?? `${adaptadorActivo.ip}/${adaptadorActivo.prefijo}` }}</span
        >
        · {{ perfilTexto(adaptadorActivo.perfil) }}
      </p>
      <NAlert
        v-if="motivoSinEscaneo"
        type="warning"
        :show-icon="false"
        data-testid="mi-red-sin-escaneo"
        >{{ motivoSinEscaneo }}</NAlert
      >
      <p v-if="progreso" class="herr-tenue" role="status" data-testid="mi-red-progreso">
        {{ t.equipos.progreso(progreso.hechos, progreso.total) }}
      </p>
      <NAlert v-if="avisoEscaneo" type="info" :show-icon="false" role="status">{{
        avisoEscaneo
      }}</NAlert>

      <EstadoVacio
        v-if="equipos.length === 0"
        pequena
        :icono="Wifi"
        :titulo="t.equipos.vacioTitulo"
        :texto="t.equipos.vacioTexto"
      />
      <div v-else class="tabla-marco">
        <table class="tabla" data-testid="mi-red-tabla-equipos">
          <thead>
            <tr>
              <th>{{ t.equipos.col.ip }}</th>
              <th>{{ t.equipos.col.nombre }}</th>
              <th>{{ t.equipos.col.mac }}</th>
              <th>{{ t.equipos.col.fabricante }}</th>
              <th>{{ t.equipos.col.ping }}</th>
              <th class="acc">{{ t.carpetas.col.acciones }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in equipos" :key="e.ip">
              <td class="mono">{{ e.ip }}</td>
              <td class="dato">{{ e.nombre ?? '—' }}</td>
              <td class="mono dato">{{ e.mac ?? '—' }}</td>
              <td class="dato">{{ e.fabricante ?? '—' }}</td>
              <td class="dato" data-testid="mi-red-ping-resultado">{{ pings[e.ip] ?? '—' }}</td>
              <td class="acc">
                <div class="herr-fila fin">
                  <NButton
                    size="small"
                    secondary
                    :loading="ocupado(`ping-${e.ip}`)"
                    data-testid="mi-red-ping"
                    @click="hacerPing(e.ip)"
                    >{{ t.equipos.ping }}</NButton
                  >
                  <NButton
                    size="small"
                    secondary
                    :loading="ocupado(`carpetas-${e.ip}`)"
                    data-testid="mi-red-ver-carpetas"
                    @click="verCarpetas(e.ip)"
                    >{{ t.equipos.verCarpetas }}</NButton
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section v-if="equipoAbierto" class="recursos" data-testid="mi-red-recursos">
        <div class="cabecera">
          <strong>{{ t.recursos.titulo(equipoAbierto.ip) }}</strong>
          <NButton size="tiny" quaternary @click="equipoAbierto = null">{{
            textos.acciones.cerrar
          }}</NButton>
        </div>
        <NAlert v-if="!equipoAbierto.r.ok" type="warning" :show-icon="false">{{
          t.recursos.fallo[equipoAbierto.r.motivo]
        }}</NAlert>
        <p v-else-if="equipoAbierto.r.recursos.length === 0" class="herr-tenue">
          {{ t.recursos.vacio }}
        </p>
        <template v-else>
          <p class="herr-tenue">{{ t.recursos.ayuda }}</p>
          <ul class="lista-recursos">
            <li v-for="r in equipoAbierto.r.recursos" :key="r.nombre">
              <span class="dato">{{ r.nombre }}</span>
              <span class="herr-tenue dato">{{ r.comentario }}</span>
              <NButton
                size="small"
                secondary
                :loading="ocupado(`abrir-${r.nombre}`)"
                data-testid="mi-red-abrir"
                @click="abrir(equipoAbierto.ip, r.nombre)"
                >{{ t.recursos.abrir }}</NButton
              >
            </li>
          </ul>
        </template>
      </section>
    </section>

    <!-- Prueba de velocidad -->
    <section class="bloque" data-testid="mi-red-velocidad">
      <div class="cabecera">
        <strong>{{ t.velocidad.titulo }}</strong>
        <div class="herr-fila">
          <NButton
            v-if="!midiendo"
            size="small"
            type="primary"
            secondary
            data-testid="mi-red-medir"
            @click="pedirVelocidad"
          >
            <template #icon
              ><NIcon><Speedometer /></NIcon
            ></template>
            {{ t.velocidad.medir }}
          </NButton>
          <NButton
            v-else
            size="small"
            secondary
            data-testid="mi-red-cancelar-velocidad"
            @click="cancelarVelocidad"
            >{{ textos.acciones.cancelar }}</NButton
          >
        </div>
      </div>
      <p class="herr-tenue">{{ t.velocidad.ayuda(PLAN_VELOCIDAD.totalMb) }}</p>
      <p v-if="midiendo && faseVelocidad" class="herr-tenue" role="status">
        {{ t.velocidad.fases[faseVelocidad] }}
      </p>
      <div v-if="velocidad" class="medidas" data-testid="mi-red-resultado-velocidad">
        <div class="medida">
          <span class="herr-tenue">{{ t.velocidad.latencia }}</span>
          <strong>{{ numero(velocidad.latenciaMs) }} <small>ms</small></strong>
        </div>
        <div class="medida">
          <span class="herr-tenue">{{ t.velocidad.bajada }}</span>
          <strong>{{ numero(velocidad.bajadaMbps) }} <small>Mbps</small></strong>
        </div>
        <div class="medida">
          <span class="herr-tenue">{{ t.velocidad.subida }}</span>
          <strong>{{ numero(velocidad.subidaMbps) }} <small>Mbps</small></strong>
        </div>
      </div>
      <p v-if="velocidad?.cancelada" class="herr-tenue" role="status">
        {{ t.velocidad.cancelada }}
      </p>
      <p v-else-if="velocidad?.incompleta" class="herr-tenue" role="status">
        {{ t.velocidad.incompleta }}
      </p>
    </section>

    <!-- Dejar de compartir: confirmación firme -->
    <NModal
      :show="quitando !== null"
      preset="card"
      :title="t.carpetas.confirmar.titulo"
      style="max-width: 560px"
      :auto-focus="false"
      :mask-closable="false"
      :close-on-esc="true"
      @update:show="(v: boolean) => !v && (quitando = null)"
    >
      <template v-if="quitando">
        <p class="pregunta">{{ t.carpetas.confirmar.pregunta(quitando.nombre) }}</p>
        <code class="ruta-exacta">{{ quitando.ruta }}</code>
        <p>{{ t.carpetas.confirmar.efecto }}</p>
        <NAlert type="warning" :show-icon="false" class="aviso">{{
          t.carpetas.confirmar.uac
        }}</NAlert>
        <NCheckbox v-model:checked="entiendeUac" data-testid="mi-red-entiendo">{{
          t.carpetas.confirmar.entiendo
        }}</NCheckbox>
      </template>
      <template #footer>
        <div class="botones">
          <NButton
            ref="botonCancelarQuitar"
            data-testid="mi-red-quitar-cancelar"
            @click="quitando = null"
            >{{ textos.acciones.cancelar }}</NButton
          >
          <NButton
            type="error"
            :disabled="!entiendeUac"
            data-testid="mi-red-quitar-confirmar"
            @click="quitar"
            >{{ t.carpetas.confirmar.boton }}</NButton
          >
        </div>
      </template>
    </NModal>

    <!-- Escaneo: confirmación -->
    <NModal
      v-model:show="confirmandoEscaneo"
      preset="card"
      :title="t.equipos.confirmar.titulo"
      style="max-width: 560px"
      :auto-focus="false"
      :mask-closable="false"
    >
      <p class="pregunta">
        {{ t.equipos.confirmar.texto(escaneo?.red ?? '', escaneo?.equipos ?? 0) }}
      </p>
      <NAlert type="info" :show-icon="false" class="aviso">{{
        t.equipos.confirmar.limites
      }}</NAlert>
      <template #footer>
        <div class="botones">
          <NButton
            ref="botonCancelarEscaneo"
            data-testid="mi-red-escaneo-cancelar"
            @click="confirmandoEscaneo = false"
            >{{ textos.acciones.cancelar }}</NButton
          >
          <NButton type="primary" data-testid="mi-red-escaneo-confirmar" @click="escanear">{{
            t.equipos.confirmar.boton
          }}</NButton>
        </div>
      </template>
    </NModal>

    <!-- Velocidad: aviso de consumo de datos -->
    <NModal
      v-model:show="confirmandoVelocidad"
      preset="card"
      :title="t.velocidad.confirmar.titulo"
      style="max-width: 560px"
      :auto-focus="false"
      :mask-closable="false"
    >
      <p class="pregunta">
        {{
          t.velocidad.confirmar.texto(
            PLAN_VELOCIDAD.bajadaMb,
            PLAN_VELOCIDAD.subidaMb,
            PLAN_VELOCIDAD.totalMb,
          )
        }}
      </p>
      <NAlert type="info" :show-icon="false" class="aviso">{{
        t.velocidad.confirmar.privacidad
      }}</NAlert>
      <template #footer>
        <div class="botones">
          <NButton
            ref="botonCancelarVelocidad"
            data-testid="mi-red-velocidad-cancelar"
            @click="confirmandoVelocidad = false"
            >{{ textos.acciones.cancelar }}</NButton
          >
          <NButton type="primary" data-testid="mi-red-velocidad-confirmar" @click="medir">{{
            t.velocidad.confirmar.boton
          }}</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.bloque {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 8px;
}
.cabecera {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.fin {
  justify-content: flex-end;
}
.tabla-marco {
  overflow-x: auto;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.tabla th,
.tabla td {
  text-align: left;
  padding: 5px 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
  vertical-align: middle;
}
.tabla .num {
  text-align: right;
}
.tabla .acc {
  text-align: right;
  white-space: nowrap;
}
.tabla .tenue {
  opacity: 0.7;
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
}
.ruta {
  word-break: break-all;
}
.recursos {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
}
.lista-recursos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lista-recursos li {
  display: flex;
  gap: 12px;
  align-items: center;
}
.lista-recursos li .dato:first-child {
  min-width: 160px;
  font-weight: 600;
}
.lista-recursos li .dato:nth-child(2) {
  flex: 1;
}
.medidas {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.medida {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.medida strong {
  font-size: 22px;
}
.medida small {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.75;
}
.pregunta {
  margin: 0 0 8px;
  font-weight: 600;
}
.ruta-exacta {
  display: block;
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  word-break: break-all;
  overflow-wrap: anywhere;
  font-size: 13px;
}
.aviso {
  margin: 8px 0;
}
.botones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<script setup lang="ts">
import { Copy, FolderOpenOutline, ShareSocial, Stop } from '@vicons/ionicons5';
import { NAlert, NButton, NIcon, NInput, NModal, NRadioButton, NRadioGroup } from 'naive-ui';
import QRCode from 'qrcode';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type {
  AccesoCompartido,
  DuracionCompartir,
  EstadoCompartir,
  ProveedorCompartir,
} from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { formatearFecha, textos } from '../../i18n';
import EstadoVacio from '../EstadoVacio.vue';
import TextoLargo from '../TextoLargo.vue';

/**
 * Compartir carpeta o archivo (D52): publica en internet, por un túnel, algo que el usuario eligió
 * en el diálogo nativo. Solo lectura, enlace con código secreto y vencimiento obligatorio. La
 * ventana nunca escribe una ruta: sale del diálogo, y el núcleo exige la confirmación y vuelve a
 * validar todo. Aquí solo se ve el estado, el enlace (con su QR) y el registro de accesos.
 */
const t = textos.herramientas.compartir;
const { ejecutar, ocupado } = useAccion();

const MAX_ACCESOS = 200;
const CLAVES_DURACION = { 15: 'm15', 60: 'h1', 240: 'h4' } as const;
const DURACIONES: DuracionCompartir[] = [15, 60, 240];

const estado = ref<EstadoCompartir | null>(null);
const accesos = ref<AccesoCompartido[]>([]);
const elegido = ref<{ ruta: string; tipo: 'carpeta' | 'archivo' } | null>(null);
const duracion = ref<DuracionCompartir>(60);
const proveedor = ref<ProveedorCompartir>('cloudflare-rapido');
const ngrokListo = ref(false);
const confirmando = ref(false);
/** Lo que el núcleo publicaría con lo elegido (su ruta real), antes de confirmar. */
const vista = ref<{ real: string; difiere: boolean } | null>(null);
const qr = ref<string | null>(null);
const ahora = ref(Date.now());
const botonCancelar = ref<InstanceType<typeof NButton> | null>(null);
let bajas: Array<() => void> = [];
let reloj: ReturnType<typeof setInterval> | null = null;

const fase = computed(() => estado.value?.fase ?? 'inactiva');
const activa = computed(() => fase.value === 'activa');
const iniciando = computed(() => fase.value === 'iniciando');

/** Cuánto quedaría público lo que se está confirmando (cuenta desde que el enlace esté listo). */
const duracionTexto = computed(() => t.duraciones[CLAVES_DURACION[duracion.value]]);
const hastaActiva = computed(() =>
  estado.value?.expira ? formatearFecha(estado.value.expira, { timeStyle: 'short' }) : '',
);
const restan = computed(() => {
  const e = estado.value?.expira;
  if (!e) return '';
  return t.restan(Math.max(0, Math.ceil((e - ahora.value) / 60_000)));
});

onMounted(() => {
  bajas = [
    api().on('compartir:estado', (e) => {
      estado.value = e;
      if (e.fase === 'inactiva' && e.fin === null) accesos.value = [];
    }),
    api().on('compartir:acceso', (a) => {
      accesos.value = [...accesos.value, a].slice(-MAX_ACCESOS);
    }),
  ];
  reloj = setInterval(() => (ahora.value = Date.now()), 1000);
  void api()
    .compartir.estado()
    .then((e) => (estado.value = e))
    .catch(() => undefined);
  void api()
    .compartir.accesos()
    .then((l) => (accesos.value = l))
    .catch(() => undefined);
  void api()
    .tuneles.estadoToken('ngrok')
    .then((s) => (ngrokListo.value = s.configurada))
    .catch(() => undefined);
});

onBeforeUnmount(() => {
  for (const b of bajas) b();
  if (reloj) clearInterval(reloj);
});

watch(
  () => estado.value?.url ?? null,
  async (url) => {
    if (!url) {
      qr.value = null;
      return;
    }
    try {
      const img = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, width: 200 });
      if (estado.value?.url === url) qr.value = img;
    } catch {
      qr.value = null;
    }
  },
  { immediate: true },
);

async function elegir(tipo: 'carpeta' | 'archivo'): Promise<void> {
  const ruta = await ejecutar('elegir', () => api().compartir.elegir(tipo));
  if (ruta) elegido.value = { ruta, tipo };
}

async function abrirConfirmacion(): Promise<void> {
  const e = elegido.value;
  if (!e) return;
  // El núcleo valida primero (los rechazos salen aquí, antes de confirmar) y da la ruta real.
  const v = await ejecutar('vista', () => api().compartir.vista(e.ruta));
  if (!v) return;
  vista.value = { real: v.real, difiere: v.difiere };
  ahora.value = Date.now();
  confirmando.value = true;
  // El foco empieza en Cancelar: Intro nunca publica nada.
  await nextTick();
  (botonCancelar.value?.$el as HTMLElement | undefined)?.focus();
}

async function compartir(): Promise<void> {
  const e = elegido.value;
  if (!e) return;
  confirmando.value = false;
  const r = await ejecutar('compartir', () =>
    api().compartir.iniciar(e.ruta, duracion.value, proveedor.value, true),
  );
  if (r) estado.value = r;
}

async function dejar(): Promise<void> {
  const r = await ejecutar('dejar', () => api().compartir.detener());
  if (r) estado.value = r;
}

async function copiar(): Promise<void> {
  const url = estado.value?.url;
  if (!url) return;
  await ejecutar('copiar', () => api().sistema.copiar(url), { exito: textos.acciones.copiado });
}

const hora = (ms: number): string => formatearFecha(ms, { timeStyle: 'medium' });
const recientes = computed(() => [...accesos.value].reverse());
</script>

<template>
  <div class="herr compartir">
    <NAlert type="info" :show-icon="false">{{ t.explicacion }}</NAlert>
    <p class="herr-tenue">{{ t.grandes }}</p>

    <template v-if="!activa && !iniciando">
      <NAlert v-if="estado?.fin === 'vencio'" type="warning" :show-icon="false">{{
        t.fin.vencio
      }}</NAlert>
      <NAlert v-else-if="estado?.fin === 'tunel'" type="warning" :show-icon="false">{{
        t.fin.tunel
      }}</NAlert>

      <div class="herr-etiqueta">{{ t.eleccion }}</div>
      <div class="herr-fila">
        <NButton secondary data-testid="compartir-elegir-carpeta" @click="elegir('carpeta')">
          <template #icon
            ><NIcon><FolderOpenOutline /></NIcon
          ></template>
          {{ t.elegirCarpeta }}
        </NButton>
        <NButton secondary data-testid="compartir-elegir-archivo" @click="elegir('archivo')">{{
          t.elegirArchivo
        }}</NButton>
      </div>

      <template v-if="elegido">
        <div class="herr-etiqueta">{{ t.elegido }}</div>
        <TextoLargo :texto="elegido.ruta" mono />

        <div class="herr-etiqueta">{{ t.duracion }}</div>
        <NRadioGroup v-model:value="duracion" name="compartir-duracion">
          <NRadioButton v-for="d in DURACIONES" :key="d" :value="d">{{
            t.duraciones[CLAVES_DURACION[d]]
          }}</NRadioButton>
        </NRadioGroup>

        <div class="herr-etiqueta">{{ t.tunel }}</div>
        <NRadioGroup v-model:value="proveedor" name="compartir-tunel">
          <NRadioButton value="cloudflare-rapido">{{
            t.tuneles['cloudflare-rapido']
          }}</NRadioButton>
          <NRadioButton value="ngrok" :disabled="!ngrokListo">{{ t.tuneles.ngrok }}</NRadioButton>
        </NRadioGroup>
        <p v-if="!ngrokListo" class="herr-tenue">{{ t.ngrokSinToken }}</p>

        <div class="herr-fila">
          <NButton
            type="primary"
            :loading="ocupado('compartir')"
            data-testid="compartir-iniciar"
            @click="abrirConfirmacion"
          >
            <template #icon
              ><NIcon><ShareSocial /></NIcon
            ></template>
            {{ t.compartir }}
          </NButton>
        </div>
      </template>

      <EstadoVacio
        v-else
        pequena
        :icono="ShareSocial"
        :titulo="t.vacio.titulo"
        :texto="t.vacio.texto"
      />
      <p class="herr-tenue">{{ t.sinFtp }}</p>
    </template>

    <template v-else>
      <div v-if="iniciando" class="herr-fila" role="status">
        <span class="herr-tenue">{{ t.abriendo }}</span>
        <NButton size="small" secondary data-testid="compartir-cancelar-inicio" @click="dejar">{{
          textos.acciones.cancelar
        }}</NButton>
      </div>
      <section v-else class="activa" data-testid="compartir-activa">
        <div class="cabecera">
          <strong>{{ t.activa }}</strong>
          <span class="herr-tenue">{{ t.vence(hastaActiva, restan) }}</span>
        </div>
        <TextoLargo v-if="estado?.ruta" :texto="estado.ruta" mono />
        <div v-if="estado?.rutaReal" class="real" data-testid="compartir-ruta-real">
          <span class="herr-tenue">{{ t.confirmar.rutaReal }}</span>
          <TextoLargo :texto="estado.rutaReal" mono />
        </div>
        <div class="cuerpo">
          <div class="enlace">
            <div class="herr-etiqueta">{{ t.enlace }}</div>
            <div class="herr-fila">
              <NInput
                :value="estado?.url ?? ''"
                readonly
                class="url"
                :aria-label="t.enlace"
                data-testid="compartir-url"
              />
              <NButton secondary data-testid="compartir-copiar" @click="copiar">
                <template #icon
                  ><NIcon><Copy /></NIcon
                ></template>
                {{ t.copiar }}
              </NButton>
            </div>
            <div class="herr-fila">
              <NButton
                type="error"
                secondary
                :loading="ocupado('dejar')"
                data-testid="compartir-dejar"
                @click="dejar"
              >
                <template #icon
                  ><NIcon><Stop /></NIcon
                ></template>
                {{ t.dejar }}
              </NButton>
            </div>
          </div>
          <img v-if="qr" class="qr" :src="qr" :alt="t.qr" width="160" height="160" />
        </div>
      </section>

      <div class="herr-etiqueta">{{ t.registro.titulo }}</div>
      <p class="herr-tenue">{{ t.registro.ayuda }}</p>
      <EstadoVacio
        v-if="recientes.length === 0"
        pequena
        :icono="ShareSocial"
        :titulo="t.registro.vacioTitulo"
        :texto="t.registro.vacioTexto"
      />
      <table v-else class="registro" data-testid="compartir-registro">
        <thead>
          <tr>
            <th>{{ t.registro.col.hora }}</th>
            <th>{{ t.registro.col.ip }}</th>
            <th>{{ t.registro.col.ruta }}</th>
            <th class="num">{{ t.registro.col.codigo }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(a, i) in recientes" :key="`${a.hora}-${i}`">
            <td>{{ hora(a.hora) }}</td>
            <td class="mono">{{ a.ip }}</td>
            <td class="mono ruta">
              <template v-if="a.ruta !== null"
                >{{ a.metodo !== 'GET' ? `${a.metodo} ` : '' }}{{ a.ruta }}</template
              >
              <em v-else class="herr-tenue">{{ t.registro.sinPermiso }}</em>
            </td>
            <td class="num" :class="{ mal: a.codigo >= 400 }">{{ a.codigo }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <NModal
      v-model:show="confirmando"
      preset="card"
      :title="t.confirmar.titulo"
      class="dialogo-compartir"
      style="max-width: 560px"
      :auto-focus="false"
      :mask-closable="false"
    >
      <p class="pregunta">{{ t.confirmar.pregunta }}</p>
      <div class="herr-etiqueta">{{ t.confirmar.ruta }}</div>
      <code class="ruta-exacta" data-testid="compartir-ruta-exacta">{{ elegido?.ruta }}</code>
      <template v-if="vista?.difiere">
        <div class="herr-etiqueta">{{ t.confirmar.rutaReal }}</div>
        <code class="ruta-exacta" data-testid="compartir-ruta-real-confirmar">{{
          vista.real
        }}</code>
      </template>
      <NAlert type="warning" :show-icon="false" class="aviso">{{
        t.confirmar.aviso(duracionTexto)
      }}</NAlert>
      <template #footer>
        <div class="botones">
          <NButton
            ref="botonCancelar"
            data-testid="compartir-cancelar"
            @click="confirmando = false"
            >{{ textos.acciones.cancelar }}</NButton
          >
          <NButton type="warning" data-testid="compartir-confirmar" @click="compartir">{{
            t.confirmar.boton
          }}</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.activa {
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
  align-items: baseline;
  flex-wrap: wrap;
}
.cuerpo {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.enlace {
  flex: 1 1 320px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.url {
  flex: 1;
  min-width: 0;
}
.qr {
  background: #fff;
  border-radius: 6px;
}
.pregunta {
  margin: 0 0 8px;
  font-weight: 600;
}
.ruta-exacta {
  display: block;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  word-break: break-all;
  overflow-wrap: anywhere;
  font-size: 13px;
}
.aviso {
  margin-top: 12px;
}
.real {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.botones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.registro {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.registro th,
.registro td {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}
.registro .num {
  text-align: right;
}
.registro .mal {
  color: var(--n-error-color, #d03050);
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
}
.ruta {
  word-break: break-all;
}
</style>

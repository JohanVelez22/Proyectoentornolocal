<script setup lang="ts">
import { ChevronDown, Play, Time } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NIcon,
  NInput,
  NModal,
  NSkeleton,
  NSwitch,
  useDialog,
  useMessage,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { CambioVhost, SnippetNginx, Sitio, VersionVhost, VistaVhost } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import ListaSnippets from './ListaSnippets.vue';

const props = defineProps<{ sitio: Sitio }>();

const t = textos.nginxEditor;
const servicios = useServicios();
const dialog = useDialog();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const idPanel = computed(() => `nginx-${props.sitio.id}`);
const nginxEncendido = computed(() => servicios.porId['nginx']?.estado === 'encendido');
const tieneReglas = computed(() => props.sitio.reglasExtra.trim() !== '');
const tieneManual = computed(() => !!props.sitio.vhostManual);

const abierto = ref(false);
const vista = ref<VistaVhost | null>(null);
const snippets = ref<SnippetNginx[]>([]);
/** Borradores (se aplican con su botón). */
const reglas = ref('');
const manual = ref('');
const avanzado = ref(false);
/** Salida de `nginx -t` (o de la recarga) del último intento fallido. */
const salida = ref<string | null>(null);

function desdeVista(v: VistaVhost): void {
  vista.value = v;
  reglas.value = v.reglas;
  manual.value = v.manual ?? v.generado;
  avanzado.value = v.manual !== null;
}

async function leer(): Promise<void> {
  const v = await ejecutar('leer', () => api().nginx.vista(props.sitio.id));
  if (v && abierto.value) desdeVista(v);
}

watch(abierto, async (v) => {
  salida.value = null;
  if (!v) {
    vista.value = null;
    return;
  }
  if (snippets.value.length === 0) {
    snippets.value = (await ejecutar('snippets', () => api().nginx.snippets())) ?? [];
  }
  await leer();
});
// El sitio cambió por fuera (dominio, HTTPS, otra pantalla): el generado puede ser otro.
watch(
  () => props.sitio,
  () => {
    if (abierto.value && !ocupado('aplicar')) void leer();
  },
  { deep: true },
);

const reglasCambiadas = computed(() => reglas.value !== (vista.value?.reglas ?? ''));
const manualCambiado = computed(
  () => avanzado.value && manual.value !== (vista.value?.manual ?? vista.value?.generado ?? ''),
);

function insertar(texto: string): void {
  const actual = reglas.value.replace(/\s+$/, '');
  reglas.value = actual ? `${actual}\n\n${texto}\n` : `${texto}\n`;
}

async function aplicar(cambio: CambioVhost, exito?: string): Promise<boolean> {
  salida.value = null;
  const r = await ejecutar('aplicar', () => api().nginx.aplicar(props.sitio.id, cambio));
  if (!r) return false;
  if (!r.ok) {
    salida.value = r.salida;
    message.error(t.fallo);
    return false;
  }
  for (const a of r.avisos) {
    message.warning(t.avisoDestino(a.destino, a.linea), {
      duration: 10000,
      keepAliveOnHover: true,
    });
  }
  message.success(exito ?? (nginxEncendido.value ? t.aplicado : t.aplicadoApagado));
  await leer();
  return true;
}

function aplicarReglas(): void {
  if (ocupado('aplicar')) return;
  void aplicar({ reglas: reglas.value });
}

function aplicarManual(): void {
  if (ocupado('aplicar')) return;
  void aplicar({ manual: manual.value });
}

function descartar(): void {
  salida.value = null;
  if (vista.value) desdeVista(vista.value);
}

function cambiarAvanzado(v: boolean): void {
  if (v) {
    dialog.warning({
      title: t.avanzadoActivarTitulo,
      content: t.avanzadoActivarTexto,
      positiveText: t.avanzadoActivar,
      negativeText: textos.acciones.cancelar,
      autoFocus: false,
      onPositiveClick: () => {
        manual.value = vista.value?.manual ?? vista.value?.generado ?? '';
        avanzado.value = true;
      },
    });
    return;
  }
  // Solo un borrador: se descarta sin preguntar.
  if (vista.value?.manual === null) {
    avanzado.value = false;
    return;
  }
  dialog.warning({
    title: t.volverGeneradoTitulo,
    content: t.volverGeneradoTexto,
    positiveText: t.volverGenerado,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: async () => {
      await aplicar({ manual: null });
    },
  });
}

// ---- Historial: las 10 últimas versiones, restaurar pasa por la misma prueba ----
const verHistorial = ref(false);
const versiones = ref<VersionVhost[] | null>(null);

async function abrirHistorial(): Promise<void> {
  versiones.value = null;
  verHistorial.value = true;
  versiones.value =
    (await ejecutar('historial', () => api().nginx.historial(props.sitio.id))) ?? [];
}

const fechaLegible = (iso: string): string => (iso ? new Date(iso).toLocaleString() : '');

function confirmarRestaurar(v: VersionVhost): void {
  dialog.warning({
    title: t.restaurarTitulo,
    content: t.restaurarTexto(fechaLegible(v.fecha)),
    positiveText: t.restaurar,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: async () => {
      salida.value = null;
      const r = await ejecutar('restaurar', () => api().nginx.restaurar(props.sitio.id, v.version));
      if (!r) return;
      verHistorial.value = false;
      if (!r.ok) {
        salida.value = r.salida;
        message.error(t.fallo);
        return;
      }
      message.success(t.restaurado);
      await leer();
    },
  });
}
</script>

<template>
  <div class="nginx">
    <div class="cabeza">
      <span class="etiqueta">{{ t.etiqueta }}</span>
      <div class="detalle">
        <span class="tenue">
          {{ tieneManual ? t.manualResumen : t.generadoResumen }}
          <template v-if="!tieneManual && tieneReglas"> · {{ t.conReglas }}</template>
        </span>
        <NButton
          text
          size="tiny"
          type="primary"
          class="desplegar"
          :aria-expanded="abierto"
          :aria-controls="idPanel"
          @click="abierto = !abierto"
        >
          {{ abierto ? t.ocultar : t.mostrar }}
          <NIcon class="chevron" :class="{ girado: abierto }" aria-hidden="true"
            ><ChevronDown
          /></NIcon>
        </NButton>
      </div>
    </div>

    <div v-if="abierto" :id="idPanel" class="panel">
      <div v-if="!vista" :aria-label="t.cargando" aria-busy="true">
        <NSkeleton text :repeat="3" />
      </div>
      <template v-else>
        <NAlert v-if="salida" type="error" :title="t.fallo" closable @close="salida = null">
          <span class="tenue">{{ t.salidaTitulo }}</span>
          <pre class="salida">{{ salida }}</pre>
        </NAlert>

        <section v-if="!avanzado" class="bloque" :aria-label="t.reglasTitulo">
          <h4>{{ t.reglasTitulo }}</h4>
          <small class="tenue">{{ t.reglasAyuda }}</small>
          <ListaSnippets
            :snippets="snippets"
            :deshabilitado="ocupado('aplicar')"
            @insertar="insertar"
          />
          <NInput
            v-model:value="reglas"
            type="textarea"
            class="mono"
            :placeholder="t.reglasPlaceholder"
            :aria-label="t.reglasEtiqueta"
            :autosize="{ minRows: 4, maxRows: 18 }"
            :maxlength="65536"
            spellcheck="false"
          />
          <div class="acciones">
            <NButton
              size="small"
              type="primary"
              :loading="ocupado('aplicar')"
              :disabled="!reglasCambiadas || ocupado('aplicar')"
              @click="aplicarReglas"
            >
              <template #icon
                ><NIcon><Play /></NIcon
              ></template>
              {{ t.aplicar }}
            </NButton>
            <NButton size="small" quaternary :disabled="!reglasCambiadas" @click="descartar">
              {{ t.descartar }}
            </NButton>
          </div>
          <details class="generado">
            <summary>{{ t.generadoTitulo }}</summary>
            <pre>{{ vista.generado }}</pre>
          </details>
        </section>

        <section class="bloque" :aria-label="t.avanzadoTitulo">
          <div class="titulo-avanzado">
            <NSwitch
              :value="avanzado"
              size="small"
              :disabled="ocupado('aplicar')"
              :aria-label="t.avanzadoInterruptor"
              @update:value="cambiarAvanzado"
            />
            <h4>{{ t.avanzadoTitulo }}</h4>
            <span class="tenue">{{ t.avanzadoInterruptor }}</span>
          </div>
          <template v-if="avanzado">
            <NAlert type="warning" :show-icon="true">{{ t.avanzadoAyuda }}</NAlert>
            <NInput
              v-model:value="manual"
              type="textarea"
              class="mono"
              :aria-label="t.manualEtiqueta"
              :autosize="{ minRows: 10, maxRows: 30 }"
              :maxlength="262144"
              spellcheck="false"
            />
            <div class="acciones">
              <NButton
                size="small"
                type="primary"
                :loading="ocupado('aplicar')"
                :disabled="(!manualCambiado && vista.manual !== null) || ocupado('aplicar')"
                @click="aplicarManual"
              >
                <template #icon
                  ><NIcon><Play /></NIcon
                ></template>
                {{ t.aplicarManual }}
              </NButton>
              <NButton size="small" quaternary :disabled="!manualCambiado" @click="descartar">
                {{ t.descartar }}
              </NButton>
            </div>
          </template>
        </section>

        <div class="acciones">
          <NButton size="small" secondary :loading="ocupado('historial')" @click="abrirHistorial">
            <template #icon
              ><NIcon><Time /></NIcon
            ></template>
            {{ t.historial }}
          </NButton>
        </div>
      </template>
    </div>

    <NModal
      v-model:show="verHistorial"
      preset="card"
      class="modal-historial"
      :title="t.historialTitulo"
      :bordered="false"
    >
      <p class="tenue">{{ t.historialAyuda }}</p>
      <NSkeleton v-if="versiones === null" text :repeat="3" />
      <p v-else-if="versiones.length === 0">{{ t.historialVacio }}</p>
      <ul v-else class="versiones">
        <li v-for="v in versiones" :key="v.version">
          <span>{{ fechaLegible(v.fecha) }}</span>
          <span class="tenue">{{ v.modo === 'manual' ? t.modoManual : t.modoReglas }}</span>
          <NButton
            size="tiny"
            secondary
            :loading="ocupado('restaurar')"
            @click="confirmarRestaurar(v)"
          >
            {{ t.restaurar }}
          </NButton>
        </li>
      </ul>
    </NModal>
  </div>
</template>

<style scoped>
.nginx {
  font-size: 12.5px;
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 28px;
}
.etiqueta {
  font-weight: 500;
  opacity: 0.75;
  flex: none;
  min-width: 34px;
}
.detalle {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  min-width: 0;
  flex: 1;
}
.tenue {
  opacity: 0.6;
}
.desplegar {
  font-size: 12px;
}
.chevron {
  margin-left: 2px;
  transition: transform 0.15s ease;
}
.chevron.girado {
  transform: rotate(180deg);
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 8px 0 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(128, 128, 128, 0.06);
}
.bloque {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bloque h4 {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
}
.titulo-avanzado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.mono :deep(textarea) {
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.generado summary {
  cursor: pointer;
  opacity: 0.75;
}
.generado pre,
.salida {
  font-family: var(--fuente-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 6px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
  max-height: 360px;
  overflow: auto;
}
.versiones {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.versiones li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
}
.modal-historial {
  width: min(560px, 92vw);
}
@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>

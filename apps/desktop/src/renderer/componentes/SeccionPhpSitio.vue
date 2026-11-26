<script setup lang="ts">
import { Add, Bug, ChevronDown, Code, Copy, Trash } from '@vicons/ionicons5';
import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NRadio,
  NRadioGroup,
  NSkeleton,
  NSwitch,
  useDialog,
  useMessage,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type {
  EstadoPhpSitio,
  ResultadoAplicar,
  ResultadoPhpSitio,
  Sitio,
  XdebugSitio,
} from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import VistaDiff from './VistaDiff.vue';

const props = defineProps<{ sitio: Sitio }>();
const emit = defineEmits<{ aplicado: [resultado: ResultadoAplicar] }>();

const t = textos.phpSitio;
const MODOS = ['debug', 'develop', 'coverage', 'profile', 'trace'] as const;
/** Lo que muestra el formulario mientras el sitio no tiene Xdebug configurado (apagado). */
const XDEBUG_POR_DEFECTO: XdebugSitio = {
  activo: false,
  modo: ['debug'],
  puerto: 9003,
  inicio: 'trigger',
};

const servicios = useServicios();
const dialog = useDialog();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const rama = computed(() => props.sitio.php ?? '');
const propio = computed(
  () => Object.keys(props.sitio.phpIni ?? {}).length > 0 || props.sitio.xdebug?.activo === true,
);
const ramaEncendida = computed(() => servicios.porId[`php-${rama.value}`]?.estado === 'encendido');
const idPanel = computed(() => `php-${props.sitio.id}`);

const abierto = ref(false);
const estado = ref<EstadoPhpSitio | null>(null);
/** Borradores de la interfaz (se guardan con su botón). */
const filas = ref<{ clave: string; valor: string }[]>([]);
const xdebug = ref<XdebugSitio>({ ...XDEBUG_POR_DEFECTO });

function desdeEstado(e: EstadoPhpSitio): void {
  estado.value = e;
  filas.value = Object.entries(e.phpIni).map(([clave, valor]) => ({ clave, valor: String(valor) }));
  xdebug.value = e.xdebug ? { ...e.xdebug, modo: [...e.xdebug.modo] } : { ...XDEBUG_POR_DEFECTO };
}

async function leer(): Promise<void> {
  const e = await ejecutar('leer', () => api().sitios.phpSitio(props.sitio.id));
  if (e && abierto.value) desdeEstado(e);
}

watch(abierto, (v) => {
  if (v) void leer();
  else estado.value = null;
});
// Si el sitio cambia por fuera (otra pantalla, recarga), se vuelve a leer.
watch(
  () => [props.sitio.phpIni, props.sitio.xdebug, props.sitio.php],
  () => {
    if (abierto.value) void leer();
  },
  { deep: true },
);

const ajustes = computed<Record<string, string>>(() =>
  Object.fromEntries(
    filas.value.map((f) => [f.clave.trim(), f.valor.trim()] as const).filter(([k]) => k !== ''),
  ),
);
const ajustesCambiados = computed(
  () => JSON.stringify(ajustes.value) !== JSON.stringify(estado.value?.phpIni ?? {}),
);
const xdebugCambiado = computed(() => {
  const guardado = estado.value?.xdebug ?? null;
  // Sin configuración guardada, solo cuenta encenderlo.
  if (guardado === null) return xdebug.value.activo;
  return JSON.stringify(xdebug.value) !== JSON.stringify(guardado);
});
const sinDll = computed(
  () => xdebug.value.activo && estado.value !== null && !estado.value.xdebugInstalado,
);

function avisarNginx(r: ResultadoPhpSitio | undefined): boolean {
  if (!r) return false;
  emit('aplicado', r.aplicar);
  if (r.avisoPuerto !== null) message.warning(t.xdebugPuertoEnUso(r.avisoPuerto));
  return r.aplicar.nginx.ok;
}

async function guardarAjustes(): Promise<void> {
  if (ocupado('ajustes')) return;
  const r = await ejecutar('ajustes', () =>
    api().sitios.guardarPhpIni(props.sitio.id, ajustes.value),
  );
  if (avisarNginx(r)) await leerConExito(t.ajustesGuardados);
  else if (r) await leer();
}

async function guardarXdebug(): Promise<void> {
  if (ocupado('xdebug')) return;
  const x = { ...xdebug.value, modo: [...xdebug.value.modo] };
  const r = await ejecutar('xdebug', () => api().sitios.xdebug(props.sitio.id, x));
  if (avisarNginx(r)) await leerConExito(t.xdebugGuardado);
  else if (r) await leer();
}

function confirmarQuitarXdebug(): void {
  dialog.warning({
    title: t.quitarXdebugTitulo,
    content: t.quitarXdebugTexto,
    positiveText: t.quitarXdebug,
    negativeText: textos.acciones.cancelar,
    autoFocus: false,
    onPositiveClick: async () => {
      const r = await ejecutar('quitar', () => api().sitios.xdebug(props.sitio.id, null));
      if (avisarNginx(r)) await leerConExito(t.xdebugQuitado);
    },
  });
}

async function leerConExito(mensaje: string): Promise<void> {
  await ejecutar('leer', () => api().sitios.phpSitio(props.sitio.id), { exito: mensaje }).then(
    (e) => {
      if (e && abierto.value) desdeEstado(e);
    },
  );
}

// ---- launch.json: vista previa y confirmación antes de escribir en el proyecto ----
const vista = ref<{ existe: boolean; contenido: string; diff: string } | null>(null);
const verLaunch = ref(false);

async function abrirLaunch(): Promise<void> {
  const v = await ejecutar('vista', () => api().sitios.launchJsonVista(props.sitio.id));
  if (!v) return;
  vista.value = v;
  verLaunch.value = true;
}

async function escribirLaunch(): Promise<void> {
  const r = await ejecutar('launch', () => api().sitios.launchJson(props.sitio.id));
  if (!r) return;
  verLaunch.value = false;
  message.success(r.respaldo ? t.launchActualizado(r.respaldo) : t.launchCreado);
}

function copiarPhpStorm(): void {
  const texto = estado.value?.phpStorm;
  if (!texto) return;
  void ejecutar('copiar', () => api().sistema.copiar(texto), { exito: textos.acciones.copiado });
}
</script>

<template>
  <div v-if="sitio.php" class="php">
    <div class="cabeza">
      <span class="etiqueta">{{ t.etiqueta }}</span>
      <div class="detalle">
        <span class="tenue">
          {{ propio ? t.propio(rama) : t.compartido(rama) }}
          <template v-if="sitio.xdebug?.activo"> · {{ t.conXdebug }}</template>
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
      <div v-if="!estado" :aria-label="t.cargando" aria-busy="true">
        <NSkeleton text :repeat="3" />
      </div>
      <template v-else>
        <p v-if="propio && !ramaEncendida" class="tenue" role="status">
          {{ t.apagadoRama(rama) }}
        </p>

        <section class="bloque" :aria-label="t.ajustesTitulo">
          <h4>{{ t.ajustesTitulo }}</h4>
          <small class="tenue">{{ t.ajustesAyuda(rama) }}</small>
          <p v-if="filas.length === 0" class="tenue">{{ t.sinAjustes }}</p>
          <div v-for="(f, i) in filas" :key="i" class="fila-ajuste">
            <NInput
              v-model:value="f.clave"
              size="small"
              class="mono"
              :placeholder="t.clavePlaceholder"
              :aria-label="t.clave"
              :maxlength="128"
            />
            <span aria-hidden="true">=</span>
            <NInput
              v-model:value="f.valor"
              size="small"
              class="mono"
              :placeholder="t.valorPlaceholder"
              :aria-label="t.valor"
              :maxlength="256"
            />
            <NButton
              size="small"
              quaternary
              circle
              :aria-label="t.quitarAjuste(f.clave)"
              @click="filas.splice(i, 1)"
            >
              <template #icon
                ><NIcon><Trash /></NIcon
              ></template>
            </NButton>
          </div>
          <div class="acciones">
            <NButton
              size="small"
              secondary
              :disabled="filas.length >= 40"
              @click="filas.push({ clave: '', valor: '' })"
            >
              <template #icon
                ><NIcon><Add /></NIcon
              ></template>
              {{ t.agregar }}
            </NButton>
            <NButton
              size="small"
              type="primary"
              :loading="ocupado('ajustes')"
              :disabled="!ajustesCambiados || ocupado('ajustes')"
              @click="guardarAjustes"
            >
              {{ t.guardarAjustes }}
            </NButton>
          </div>
        </section>

        <section class="bloque" :aria-label="t.xdebugTitulo">
          <div class="titulo-xdebug">
            <NSwitch
              v-model:value="xdebug.activo"
              size="small"
              :aria-label="t.xdebugInterruptor(sitio.dominio)"
            />
            <h4>{{ t.xdebugTitulo }}</h4>
          </div>
          <small class="tenue">{{ t.xdebugAyuda }}</small>
          <template v-if="xdebug.activo">
            <div class="campo">
              <span class="campo-etiqueta">{{ t.modo }}</span>
              <NCheckboxGroup v-model:value="xdebug.modo" :aria-label="t.modo">
                <span class="modos">
                  <NCheckbox
                    v-for="m in MODOS"
                    :key="m"
                    :value="m"
                    :label="t.modos[m]"
                    :disabled="xdebug.modo.length === 1 && xdebug.modo[0] === m"
                  />
                </span>
              </NCheckboxGroup>
            </div>
            <div class="campo">
              <span class="campo-etiqueta">{{ t.puerto }}</span>
              <NInputNumber
                :value="xdebug.puerto"
                size="small"
                class="puerto"
                :min="1024"
                :max="65535"
                :aria-label="t.puerto"
                @update:value="(v: number | null) => (xdebug.puerto = v ?? 9003)"
              />
            </div>
            <div class="campo">
              <span class="campo-etiqueta">{{ t.inicio }}</span>
              <NRadioGroup v-model:value="xdebug.inicio" size="small" :aria-label="t.inicio">
                <NRadio value="trigger">{{ t.inicioTrigger }}</NRadio>
                <NRadio value="yes">{{ t.inicioYes }}</NRadio>
              </NRadioGroup>
              <small class="tenue">{{ t.inicioAyuda }}</small>
            </div>
            <p v-if="sinDll" class="tenue" role="note">{{ t.xdebugDescarga }}</p>
          </template>
          <div class="acciones">
            <NButton
              size="small"
              type="primary"
              :loading="ocupado('xdebug')"
              :disabled="!xdebugCambiado || ocupado('xdebug')"
              @click="guardarXdebug"
            >
              <template #icon
                ><NIcon><Bug /></NIcon
              ></template>
              {{ t.guardarXdebug }}
            </NButton>
            <NButton
              v-if="estado.xdebug"
              size="small"
              secondary
              :loading="ocupado('quitar')"
              @click="confirmarQuitarXdebug"
            >
              {{ t.quitarXdebug }}
            </NButton>
          </div>
        </section>

        <section v-if="estado.xdebug" class="bloque" :aria-label="t.ide">
          <h4>{{ t.ide }}</h4>
          <div class="acciones">
            <NButton size="small" secondary :loading="ocupado('vista')" @click="abrirLaunch">
              <template #icon
                ><NIcon><Code /></NIcon
              ></template>
              {{ t.generarLaunch }}
            </NButton>
            <NButton
              v-if="estado.phpStorm"
              size="small"
              quaternary
              :aria-label="t.copiarPhpStorm"
              @click="copiarPhpStorm"
            >
              <template #icon
                ><NIcon><Copy /></NIcon
              ></template>
              {{ t.copiarPhpStorm }}
            </NButton>
          </div>
          <details v-if="estado.phpStorm" class="phpstorm">
            <summary>{{ t.phpStorm }}</summary>
            <pre>{{ estado.phpStorm }}</pre>
          </details>
        </section>
      </template>
    </div>

    <NModal
      v-model:show="verLaunch"
      preset="card"
      class="modal-launch"
      :title="t.launchTitulo"
      :bordered="false"
    >
      <template v-if="vista">
        <p>
          {{
            !vista.existe ? t.launchNuevo : vista.diff === '' ? t.launchSinCambios : t.launchFusion
          }}
        </p>
        <VistaDiff v-if="vista.existe && vista.diff" :diff="vista.diff" />
        <pre v-else class="contenido">{{ vista.contenido }}</pre>
      </template>
      <template #footer>
        <div class="pie">
          <NButton @click="verLaunch = false">{{ textos.acciones.cancelar }}</NButton>
          <NButton
            type="primary"
            :loading="ocupado('launch')"
            :disabled="!vista || (vista.existe && vista.diff === '')"
            @click="escribirLaunch"
          >
            {{ t.launchEscribir }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.php {
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
  opacity: 0.72;
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
.panel p {
  margin: 0;
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
.titulo-xdebug {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fila-ajuste {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  max-width: 560px;
}
.mono :deep(input) {
  font-family: var(--fuente-mono);
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.campo-etiqueta {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.72;
}
.modos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}
.puerto {
  width: 140px;
}
.acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.phpstorm summary {
  cursor: pointer;
  opacity: 0.75;
}
.phpstorm pre,
.contenido {
  font-family: var(--fuente-mono);
  font-size: 12px;
  white-space: pre-wrap;
  margin: 6px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.modal-launch {
  width: min(760px, 92vw);
}
@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>

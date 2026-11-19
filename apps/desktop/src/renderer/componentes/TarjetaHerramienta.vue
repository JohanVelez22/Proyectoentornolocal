<script setup lang="ts">
import { CloudDownload, Grid, Open, Refresh, Terminal } from '@vicons/ionicons5';
import { NButton, NIcon, NProgress, NSkeleton, NTooltip, useMessage } from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { PUERTO_ADMINER, type DisponibilidadAdminer } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos as tx } from '../i18n';
import { useServicios } from '../stores/servicios';
import EstadoPunto from './EstadoPunto.vue';

/** Composer y Adminer: no son procesos, pero se instalan y se usan desde aquí. */
const props = defineProps<{ herramienta: 'composer' | 'adminer' }>();

const t = tx.servicios;
const servicios = useServicios();
const { ejecutar, ocupado } = useAccion();
const message = useMessage();

const cargada = ref(false);
const versionComposer = ref<string | null>(null);
const versionesAdminer = ref<string[]>([]);
const disponibilidad = ref<DisponibilidadAdminer | null>(null);

const esComposer = computed(() => props.herramienta === 'composer');
const textos = computed(() => (esComposer.value ? t.composer : t.adminer));
const urlAdminer = `http://127.0.0.1:${PUERTO_ADMINER}/`;

const instalada = computed(() =>
  esComposer.value ? versionComposer.value !== null : versionesAdminer.value.length > 0,
);
const version = computed(() =>
  esComposer.value ? versionComposer.value : (versionesAdminer.value.at(-1) ?? null),
);

const estado = computed<{ punto: 'encendido' | 'apagado' | 'aviso'; etiqueta: string }>(() => {
  if (!instalada.value) return { punto: 'apagado', etiqueta: textos.value.noInstalado };
  if (esComposer.value) return { punto: 'encendido', etiqueta: t.composer.instalado };
  return disponibilidad.value?.disponible
    ? { punto: 'encendido', etiqueta: t.adminer.disponible }
    : { punto: 'aviso', etiqueta: t.adminer.sinPhp };
});

/** Composer necesita PHP para instalarse y para correr. */
const sinPhp = computed(() => esComposer.value && servicios.instalados['php']?.length === 0);

const ayuda = computed(() => {
  if (esComposer.value) {
    return instalada.value ? t.composer.ayuda : sinPhp.value ? t.composer.sinPhp : null;
  }
  const d = disponibilidad.value;
  return instalada.value && d && !d.disponible ? d.motivo : null;
});

/**
 * Progreso de la descarga en curso (si el núcleo lo informa). Un error no se queda pegado: la
 * notificación ya lo explicó y el progreso se olvida al terminar o al reintentar.
 */
const progreso = computed(() =>
  ocupado('instalar') || ocupado('actualizar')
    ? (servicios
        .progresoDe(props.herramienta)
        .find((p) => p.fase !== 'listo' && p.fase !== 'error') ?? null)
    : null,
);

function olvidarProgreso(): void {
  for (const p of servicios.progresoDe(props.herramienta)) servicios.olvidarProgreso(p);
}

async function cargar(): Promise<void> {
  if (esComposer.value) {
    const v = await ejecutar('cargar', () => api().composer.version());
    versionComposer.value = v ?? null;
  } else {
    const r = await ejecutar('cargar', () =>
      Promise.all([api().instalador.instalados('adminer'), api().adminer.disponibilidad()]),
    );
    if (r) [versionesAdminer.value, disponibilidad.value] = r;
  }
  cargada.value = true;
}

async function instalar(): Promise<void> {
  if (sinPhp.value) return;
  olvidarProgreso();
  const ok = await ejecutar(
    'instalar',
    async () => {
      await (esComposer.value ? api().composer.instalar() : api().adminer.instalar());
      return true;
    },
    { exito: textos.value.instaladoOk },
  );
  olvidarProgreso();
  if (ok) await cargar();
}

async function actualizar(): Promise<void> {
  const v = await ejecutar('actualizar', () => api().composer.actualizar());
  if (v === undefined) return;
  await cargar();
  message.success(t.composer.actualizado(versionComposer.value ?? v));
}

function abrirAdminer(): void {
  void ejecutar('abrir', () => api().sistema.abrirUrl(urlAdminer));
}

onMounted(() => {
  void cargar();
  if (esComposer.value && servicios.instalados['php'] === undefined) {
    void ejecutar('php', () => servicios.cargarInstalados('php'));
  }
});
// Adminer depende de que haya un PHP encendido: se vuelve a consultar cuando cambia.
watch(
  () => servicios.encendidos,
  () => {
    if (!esComposer.value && instalada.value) void cargar();
  },
);
</script>

<template>
  <article class="tarjeta" :class="{ 'estado-encendido': estado.punto === 'encendido' }">
    <header class="cabeza">
      <span class="icono"
        ><NIcon :size="18"><component :is="esComposer ? Terminal : Grid" /></NIcon
      ></span>
      <div class="titulo">
        <h3>{{ textos.nombre }}</h3>
        <span class="version">{{ version ?? t.composer.sinVersion }}</span>
      </div>
      <NSkeleton v-if="!cargada" text :width="70" />
      <EstadoPunto v-else :estado="estado.punto" :etiqueta="estado.etiqueta" />
    </header>

    <dl class="datos">
      <div>
        <dt>{{ esComposer ? t.composer.uso : t.adminer.direccion }}</dt>
        <dd>{{ esComposer ? t.composer.usoTexto : `127.0.0.1:${PUERTO_ADMINER}` }}</dd>
      </div>
      <div>
        <dt>&nbsp;</dt>
        <dd class="detalle">{{ textos.detalle }}</dd>
      </div>
    </dl>

    <p v-if="ayuda" class="mensaje">{{ ayuda }}</p>

    <div v-if="progreso" class="progreso">
      <span>{{ tx.instalar.fases[progreso.fase] }} · {{ progreso.version }}</span>
      <NProgress
        type="line"
        :percentage="Math.round(progreso.porcentaje)"
        :status="progreso.fase === 'error' ? 'error' : 'default'"
        :show-indicator="false"
        :height="6"
      />
    </div>

    <footer class="pie">
      <template v-if="cargada">
        <NTooltip v-if="!instalada" :disabled="!sinPhp">
          <template #trigger>
            <!-- El span recibe el puntero aunque el botón esté deshabilitado. -->
            <span tabindex="-1">
              <NButton
                size="small"
                type="primary"
                :disabled="sinPhp"
                :loading="ocupado('instalar')"
                @click="instalar"
              >
                <template #icon
                  ><NIcon><CloudDownload /></NIcon
                ></template>
                {{ tx.acciones.instalar }}
              </NButton>
            </span>
          </template>
          {{ t.composer.sinPhp }}
        </NTooltip>
        <NButton
          v-else-if="esComposer"
          size="small"
          secondary
          :loading="ocupado('actualizar')"
          @click="actualizar"
        >
          <template #icon
            ><NIcon><Refresh /></NIcon
          ></template>
          {{ tx.acciones.actualizar }}
        </NButton>
        <NButton
          v-else
          size="small"
          secondary
          :disabled="!disponibilidad?.disponible"
          :loading="ocupado('abrir')"
          @click="abrirAdminer"
        >
          <template #icon
            ><NIcon><Open /></NIcon
          ></template>
          {{ t.adminer.abrir }}
        </NButton>
      </template>
    </footer>
  </article>
</template>

<style scoped>
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.045);
  transition: border-color 0.2s ease;
}
.tarjeta.estado-encendido {
  border-color: rgba(22, 163, 74, 0.4);
}
.cabeza {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icono {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(79, 91, 213, 0.12);
  color: #6470e0;
  flex: none;
}
.titulo {
  flex: 1;
  min-width: 0;
}
.titulo h3 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
}
.version {
  font-family: var(--fuente-mono);
  font-size: 12px;
  opacity: 0.6;
}
.datos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0;
}
.datos dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.datos dd {
  margin: 2px 0 0;
  font-family: var(--fuente-mono);
  font-size: 13px;
}
.datos dd.detalle {
  font-family: var(--fuente);
  font-size: 12px;
  opacity: 0.7;
}
.mensaje {
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
}
.progreso {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}
.pie {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  min-height: 28px;
  align-items: center;
}
</style>

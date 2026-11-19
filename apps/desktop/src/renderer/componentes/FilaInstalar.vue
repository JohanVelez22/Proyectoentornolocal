<script setup lang="ts">
import { CloudDownload } from '@vicons/ionicons5';
import { NButton, NIcon, NProgress, NSelect, NTag, type SelectOption } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { ProgresoInstalacion, VersionDisponible } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos as tx } from '../i18n';
import { useServicios, type InstalableCatalogo } from '../stores/servicios';

const props = defineProps<{ servicio: InstalableCatalogo }>();

const t = tx.instalar;
const textos = computed(() => t.servicios[props.servicio]);
const servicios = useServicios();
const { ejecutar, ocupado } = useAccion();

const versiones = ref<VersionDisponible[] | null>(null);
const elegida = ref<string | null>(null);

const instalados = computed(() => servicios.instalados[props.servicio] ?? []);
const yaInstalada = (v: VersionDisponible): boolean =>
  instalados.value.includes(v.version) || (!!v.rama && instalados.value.includes(v.rama));

const opciones = computed<SelectOption[]>(() =>
  (versiones.value ?? []).map((v) => ({
    value: v.version,
    label: [v.version, v.rama ? t.rama(v.rama) : '', yaInstalada(v) ? t.yaInstalada : '']
      .filter(Boolean)
      .join(' · '),
  })),
);

const instalando = computed(() => ocupado(`instalar-${props.servicio}`));

/** Progreso visible: el de la instalación en curso o el último error. */
const progreso = computed<ProgresoInstalacion | null>(() => {
  const lista = servicios.progresoDe(props.servicio);
  return lista.find((p) => p.fase !== 'listo' && p.fase !== 'error') ?? lista.at(-1) ?? null;
});
const estadoBarra = computed(() =>
  progreso.value?.fase === 'error'
    ? 'error'
    : progreso.value?.fase === 'listo'
      ? 'success'
      : 'default',
);

async function cargarVersiones(mostrar: boolean): Promise<void> {
  if (!mostrar || versiones.value || ocupado('versiones')) return;
  const r = await ejecutar('versiones', () => api().instalador.listarVersiones(props.servicio));
  if (r) versiones.value = r;
}

async function instalar(): Promise<void> {
  const v = versiones.value?.find((x) => x.version === elegida.value);
  if (!v) return;
  for (const p of servicios.progresoDe(props.servicio)) servicios.olvidarProgreso(p);
  const ok = await ejecutar(
    `instalar-${props.servicio}`,
    async () => {
      await api().instalador.instalar({ servicio: v.servicio, version: v.version });
      return true;
    },
    { exito: t.exito(textos.value.nombre, v.version) },
  );
  if (ok) {
    servicios.olvidarProgreso(v);
    elegida.value = null;
    await ejecutar('instalados', () => servicios.cargarInstalados(props.servicio));
  } else if (servicios.progreso[`${v.servicio}@${v.version}`]?.fase !== 'error') {
    // Falló sin evento de error: la notificación ya lo explicó; no se deja una barra a medias.
    servicios.olvidarProgreso(v);
  }
}

onMounted(() => {
  void ejecutar('instalados', () => servicios.cargarInstalados(props.servicio));
});
</script>

<template>
  <div class="fila">
    <div class="info">
      <strong>{{ textos.nombre }}</strong>
      <span class="detalle">{{ textos.detalle }}</span>
      <div class="instalados">
        <template v-if="instalados.length">
          <NTag
            v-for="v in instalados"
            :key="v"
            size="small"
            :bordered="false"
            type="success"
            class="version"
          >
            {{ v }}
          </NTag>
        </template>
        <span v-else class="ninguno">{{ t.ninguno }}</span>
      </div>
    </div>
    <div class="acciones">
      <NSelect
        v-model:value="elegida"
        size="small"
        class="selector"
        filterable
        :options="opciones"
        :placeholder="t.elegir"
        :loading="ocupado('versiones')"
        :disabled="instalando"
        :consistent-menu-width="false"
        :fallback-option="false"
        @update:show="cargarVersiones"
      >
        <template #empty>
          {{ ocupado('versiones') ? t.buscando : t.sinVersiones }}
        </template>
      </NSelect>
      <NButton
        size="small"
        type="primary"
        :disabled="!elegida"
        :loading="instalando"
        @click="instalar"
      >
        <template #icon
          ><NIcon><CloudDownload /></NIcon
        ></template>
        {{ tx.acciones.instalar }}
      </NButton>
    </div>
    <div v-if="progreso" class="progreso">
      <div class="progreso-texto">
        <span>{{ t.fases[progreso.fase] }} · {{ progreso.version }}</span>
        <span v-if="progreso.fase !== 'error'" class="porcentaje">
          {{ Math.round(progreso.porcentaje) }}%
        </span>
      </div>
      <NProgress
        type="line"
        :percentage="Math.round(progreso.porcentaje)"
        :status="estadoBarra"
        :show-indicator="false"
        :height="6"
        :processing="instalando && progreso.fase !== 'error'"
      />
      <p v-if="progreso.fase === 'error' && progreso.mensaje" class="error">
        {{ progreso.mensaje }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 20px;
  padding: 14px 0;
  border-top: 1px solid rgba(128, 128, 128, 0.14);
}
.fila:first-child {
  border-top: 0;
  padding-top: 4px;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.detalle {
  font-size: 12px;
  opacity: 0.6;
}
.instalados {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.version {
  font-family: var(--fuente-mono);
}
.ninguno {
  font-size: 12px;
  opacity: 0.5;
}
.acciones {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.selector {
  width: 240px;
}
.progreso {
  grid-column: 1 / -1;
}
.progreso-texto {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 6px;
  opacity: 0.8;
}
.porcentaje {
  font-variant-numeric: tabular-nums;
}
.error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #dc2626;
}
</style>

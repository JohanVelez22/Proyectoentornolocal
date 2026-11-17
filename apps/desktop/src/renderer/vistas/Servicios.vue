<script setup lang="ts">
import { Play, Server, Stop } from '@vicons/ionicons5';
import { NButton, NCard, NEmpty, NIcon, NSpace } from 'naive-ui';
import { computed, ref } from 'vue';
import { api } from '../api';
import FilaInstalar from '../componentes/FilaInstalar.vue';
import TarjetaServicio from '../componentes/TarjetaServicio.vue';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import { useServicios, type ServicioInstalable } from '../stores/servicios';

const t = es.servicios;
const servicios = useServicios();
const { ejecutar, ocupado } = useAccion();

const instalables: ServicioInstalable[] = ['nginx', 'php', 'cloudflared'];
const seccionInstalar = ref<HTMLElement | null>(null);

/** Sin Nginx ni PHP instalados solo tiene sentido mostrar los servicios externos. */
const nadaInstalado = computed(
  () => servicios.instalados['nginx']?.length === 0 && servicios.instalados['php']?.length === 0,
);
const visibles = computed(() =>
  nadaInstalado.value ? servicios.lista.filter((s) => s.estado === 'externo') : servicios.lista,
);
const administrables = computed(() => visibles.value.filter((s) => s.estado !== 'externo'));
const algunoEncendido = computed(() =>
  administrables.value.some((s) => s.estado === 'encendido' || s.estado === 'iniciando'),
);

function iniciarTodo(): void {
  void ejecutar('iniciarTodo', () => api().servicios.iniciarTodo());
}
function detenerTodo(): void {
  void ejecutar('detenerTodo', () => api().servicios.detenerTodo());
}
function irAInstalar(): void {
  seccionInstalar.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <div class="servicios">
    <div class="barra">
      <p class="descripcion">{{ t.descripcion }}</p>
      <NSpace size="small">
        <NButton
          size="small"
          :disabled="!administrables.length || ocupado('detenerTodo')"
          :loading="ocupado('iniciarTodo')"
          type="primary"
          @click="iniciarTodo"
        >
          <template #icon
            ><NIcon><Play /></NIcon
          ></template>
          {{ es.acciones.iniciarTodo }}
        </NButton>
        <NButton
          size="small"
          secondary
          :disabled="!algunoEncendido || ocupado('iniciarTodo')"
          :loading="ocupado('detenerTodo')"
          @click="detenerTodo"
        >
          <template #icon
            ><NIcon><Stop /></NIcon
          ></template>
          {{ es.acciones.detenerTodo }}
        </NButton>
      </NSpace>
    </div>

    <div v-if="nadaInstalado || (servicios.cargado && !visibles.length)" class="vacio">
      <NEmpty :description="t.vacio" size="large">
        <template #icon>
          <NIcon><Server /></NIcon>
        </template>
        <template #extra>
          <NButton size="small" type="primary" @click="irAInstalar">{{ t.irAInstalar }}</NButton>
        </template>
      </NEmpty>
    </div>
    <section v-if="visibles.length" class="rejilla" aria-live="polite">
      <TarjetaServicio v-for="s in visibles" :key="s.id" :servicio="s" />
    </section>

    <section ref="seccionInstalar" class="instalar">
      <NCard size="small" class="tarjeta-instalar">
        <template #header>
          <div class="cabeza-instalar">
            <span>{{ es.instalar.titulo }}</span>
            <small>{{ es.instalar.descripcion }}</small>
          </div>
        </template>
        <FilaInstalar v-for="s in instalables" :key="s" :servicio="s" />
      </NCard>
    </section>
  </div>
</template>

<style scoped>
.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.descripcion {
  margin: 0;
  opacity: 0.65;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.vacio {
  margin-bottom: 14px;
  padding: 32px 0 24px;
  border: 1px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
}
.instalar {
  margin-top: 24px;
  scroll-margin-top: 12px;
}
.tarjeta-instalar {
  border-radius: 12px;
}
.cabeza-instalar {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cabeza-instalar small {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.6;
}
</style>

<script setup lang="ts">
import { Play, Server, Stop } from '@vicons/ionicons5';
import { NButton, NCard, NEmpty, NIcon, NSkeleton, NSpace, NTab, NTabs } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ServicioVersiones } from '../../shared/api';
import { api } from '../api';
import FilaInstalar from '../componentes/FilaInstalar.vue';
import TarjetaHerramienta from '../componentes/TarjetaHerramienta.vue';
import TarjetaServicio from '../componentes/TarjetaServicio.vue';
import VersionesServicio from '../componentes/VersionesServicio.vue';
import { useAccion } from '../composables/useAccion';
import { useFoco } from '../composables/useFoco';
import IlustracionVacia from '../componentes/IlustracionVacia.vue';
import { textos } from '../i18n';
import { useServicios, type GrupoServicios, type InstalableCatalogo } from '../stores/servicios';
import { useTuneles } from '../stores/tuneles';
import { esServicioConVersiones, useVersiones } from '../stores/versiones';

const t = textos.servicios;
const servicios = useServicios();
const tuneles = useTuneles();
const { ejecutar, ocupado } = useAccion();
useFoco();
const route = useRoute();
const router = useRouter();
const versiones = useVersiones();

/** Pestaña activa: "Servicios" o "Versiones" (ruta `servicios.versiones`). */
const pestana = computed(() => (route.name === 'servicios.versiones' ? 'versiones' : 'servicios'));
/** Servicio de la pestaña Versiones: el de la ruta o el último elegido. */
const servicioVersiones = computed<ServicioVersiones>(() => {
  const p = route.params['servicio'];
  return esServicioConVersiones(p) ? p : versiones.servicio;
});
function cambiarPestana(p: string): void {
  if (p === 'versiones') {
    void router.push({
      name: 'servicios.versiones',
      params: { servicio: servicioVersiones.value },
    });
  } else void router.push({ name: 'servicios' });
}
function elegirServicioVersiones(s: ServicioVersiones): void {
  void router.push({ name: 'servicios.versiones', params: { servicio: s } });
}

/** Filas de "Instalar", agrupadas para que la lista larga se lea de un vistazo. */
const gruposInstalar: { titulo: string; servicios: InstalableCatalogo[] }[] = [
  { titulo: textos.instalar.grupos.web, servicios: ['nginx', 'php'] },
  {
    titulo: textos.instalar.grupos.bd,
    servicios: ['mysql', 'mariadb', 'postgresql', 'redis', 'mongodb', 'mongosh'],
  },
  { titulo: textos.instalar.grupos.otros, servicios: ['mailpit', 'ollama', 'cloudflared'] },
];
const seccionInstalar = ref<HTMLElement | null>(null);

/** Grupos con algo que mostrar; Herramientas siempre está (Composer y Adminer). */
const grupos = computed<GrupoServicios[]>(() => {
  const res = [...servicios.grupos];
  if (!res.some((g) => g.categoria === 'herramientas')) {
    res.push({ categoria: 'herramientas', servicios: [] });
  }
  return res;
});
const administrables = computed(() => servicios.visibles.filter((s) => s.estado !== 'externo'));
// "Detener todo" también cierra los túneles: se habilita si hay alguno abierto.
const algunoEncendido = computed(
  () =>
    administrables.value.some((s) => s.estado === 'encendido' || s.estado === 'iniciando') ||
    Object.values(tuneles.porSitio).some((t) => t.estado === 'activo' || t.estado === 'iniciando'),
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

onMounted(() => {
  void ejecutar('preferencias', () => servicios.cargarPreferencias());
});
</script>

<template>
  <NTabs
    :value="pestana"
    type="line"
    size="small"
    class="pestanas"
    :aria-label="t.titulo"
    @update:value="cambiarPestana"
  >
    <NTab name="servicios">{{ textos.versiones.pestanaServicios }}</NTab>
    <NTab name="versiones">{{ textos.versiones.pestana }}</NTab>
  </NTabs>
  <VersionesServicio
    v-if="pestana === 'versiones'"
    :servicio="servicioVersiones"
    @elegir="elegirServicioVersiones"
  />
  <div v-else class="servicios">
    <div class="barra">
      <p class="descripcion">{{ t.descripcion }}</p>
      <NSpace size="small" :wrap="false">
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
          {{ textos.acciones.iniciarTodo }}
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
          {{ textos.acciones.detenerTodo }}
        </NButton>
      </NSpace>
    </div>

    <div v-if="servicios.cargado && servicios.nadaInstalado" class="vacio">
      <NEmpty :description="t.vacio" size="large">
        <template #icon><IlustracionVacia :icono="Server" /></template>
        <template #extra>
          <NButton size="small" type="primary" @click="irAInstalar">{{ t.irAInstalar }}</NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Mientras llega la primera foto se reserva el espacio de las tarjetas (sin saltos). -->
    <section v-if="!servicios.cargado" class="grupo" aria-busy="true">
      <NSkeleton text :width="120" class="esqueleto-titulo" />
      <div class="rejilla">
        <NSkeleton v-for="n in 3" :key="n" :height="148" :sharp="false" class="esqueleto" />
      </div>
    </section>

    <template v-else>
      <section
        v-for="g in grupos"
        :key="g.categoria"
        class="grupo"
        :aria-labelledby="`grupo-${g.categoria}`"
      >
        <header class="cabeza-grupo">
          <h2 :id="`grupo-${g.categoria}`">{{ t.grupos[g.categoria] }}</h2>
          <small>{{ t.gruposAyuda[g.categoria] }}</small>
        </header>
        <div class="rejilla" aria-live="polite">
          <TarjetaServicio v-for="s in g.servicios" :key="s.id" :servicio="s" />
          <template v-if="g.categoria === 'herramientas'">
            <TarjetaHerramienta herramienta="composer" />
            <TarjetaHerramienta herramienta="adminer" />
            <TarjetaHerramienta herramienta="phpmyadmin" />
          </template>
        </div>
      </section>
    </template>

    <section ref="seccionInstalar" class="instalar">
      <NCard size="small" class="tarjeta-instalar">
        <template #header>
          <div class="cabeza-instalar">
            <span>{{ textos.instalar.titulo }}</span>
            <small>{{ textos.instalar.descripcion }}</small>
          </div>
        </template>
        <div v-for="g in gruposInstalar" :key="g.titulo" class="bloque-instalar">
          <h3 class="subtitulo">{{ g.titulo }}</h3>
          <FilaInstalar v-for="s in g.servicios" :key="s" :servicio="s" />
        </div>
      </NCard>
    </section>
  </div>
</template>

<style scoped>
.pestanas {
  margin-bottom: 14px;
}
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
.grupo {
  margin-bottom: 22px;
}
.cabeza-grupo {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-bottom: 10px;
}
.cabeza-grupo h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.75;
}
.cabeza-grupo small {
  font-size: 12px;
  opacity: 0.5;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.esqueleto {
  border-radius: 12px;
}
.esqueleto-titulo {
  margin-bottom: 10px;
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
.bloque-instalar + .bloque-instalar {
  margin-top: 14px;
}
.subtitulo {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
}
</style>

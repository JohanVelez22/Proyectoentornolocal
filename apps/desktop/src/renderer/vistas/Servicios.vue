<script setup lang="ts">
import { Play, Server, Stop } from '@vicons/ionicons5';
import { NButton, NCard, NIcon, NSkeleton, NSpace, NTab, NTabs } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ServicioVersiones } from '../../shared/api';
import { api } from '../api';
import DialogoLimpiarVersiones from '../componentes/DialogoLimpiarVersiones.vue';
import FilaInstalar from '../componentes/FilaInstalar.vue';
import TarjetaHerramienta from '../componentes/TarjetaHerramienta.vue';
import TarjetaServicio from '../componentes/TarjetaServicio.vue';
import VersionesServicio from '../componentes/VersionesServicio.vue';
import Php from './Php.vue';
import { useAccion } from '../composables/useAccion';
import { useFoco } from '../composables/useFoco';
import EstadoVacio from '../componentes/EstadoVacio.vue';
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

/** Pestaña activa: Servicios, Versiones (ruta `servicios.versiones`) o PHP (ruta `servicios.php`). */
const pestana = computed(() =>
  route.name === 'servicios.versiones'
    ? 'versiones'
    : route.name === 'servicios.php'
      ? 'php'
      : 'servicios',
);
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
  } else if (p === 'php') void router.push({ name: 'servicios.php' });
  else void router.push({ name: 'servicios' });
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
  {
    titulo: textos.instalar.grupos.otros,
    servicios: [
      'mailpit',
      'smtp4dev',
      'inbucket',
      'papercut',
      'ollama',
      'meilisearch',
      'cloudflared',
    ],
  },
];
const seccionInstalar = ref<HTMLElement | null>(null);
const limpiando = ref(false);

/** Grupos con algo que mostrar; Herramientas siempre está (Composer y Adminer). */
const grupos = computed<GrupoServicios[]>(() => {
  const res = [...servicios.grupos];
  if (!res.some((g) => g.categoria === 'herramientas')) {
    res.push({ categoria: 'herramientas', servicios: [] });
  }
  return res;
});
/** Hasta que se sabe qué hay instalado se pintan esqueletos, nunca tarjetas que luego desaparecen. */
const listo = computed(() => servicios.cargado && servicios.instaladosListos);
/** Sin ningún servicio (ni propio ni externo): el único caso con estado vacío. */
const sinNingunServicio = computed(
  () => listo.value && servicios.nadaInstalado && servicios.externos.length === 0,
);
/** Solo hay motores externos: franja en vez de estado vacío. */
const soloExternos = computed(
  () => listo.value && servicios.nadaInstalado && servicios.externos.length > 0,
);
function irAInstalarWeb(): void {
  void router.push({ name: 'servicios.versiones', params: { servicio: 'nginx' } });
}
// "Detener todo" también cierra los túneles: se habilita si hay alguno abierto.
const algunoEncendido = computed(
  () =>
    servicios.visibles.some((s) => s.estado === 'encendido' || s.estado === 'iniciando') ||
    Object.values(tuneles.porSitio).some((t) => t.estado === 'activo' || t.estado === 'iniciando'),
);

function iniciarTodo(): void {
  void ejecutar('iniciarTodo', () => api().servicios.iniciarTodo());
}
function detenerTodo(): void {
  void ejecutar('detenerTodo', () => api().servicios.detenerTodo());
}
/** Tras limpiar o recuperar versiones, la tabla de Versiones se vuelve a leer. */
function recargarVersiones(): void {
  void ejecutar('recargarVersiones', () => versiones.cargar());
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
    <NTab name="php">{{ textos.nav.php }}</NTab>
  </NTabs>
  <Php v-if="pestana === 'php'" />
  <template v-else-if="pestana === 'versiones'">
    <VersionesServicio :servicio="servicioVersiones" @elegir="elegirServicioVersiones" />
    <div class="limpieza">
      <NButton size="small" secondary @click="limpiando = true">
        {{ textos.versiones.limpieza.boton }}
      </NButton>
    </div>
    <DialogoLimpiarVersiones v-model:show="limpiando" @limpiado="recargarVersiones" />
  </template>
  <div v-else class="servicios">
    <div class="barra">
      <p class="descripcion">{{ t.descripcion }}</p>
      <NSpace size="small" :wrap="false">
        <NButton
          size="small"
          :disabled="!servicios.resumen.porArrancar || ocupado('detenerTodo')"
          :title="servicios.resumen.porArrancar ? undefined : t.sinParaEncender"
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

    <EstadoVacio
      v-if="sinNingunServicio"
      marco
      :icono="Server"
      :titulo="textos.estadosVacios.serviciosVacio.titulo"
      :texto="textos.estadosVacios.serviciosVacio.texto"
    >
      <NButton size="small" type="primary" @click="irAInstalar">
        {{ textos.estadosVacios.serviciosVacio.accion }}
      </NButton>
    </EstadoVacio>

    <!-- Solo hay motores externos: una franja guía hacia lo que falta (no un estado vacío). -->
    <div v-if="soloExternos" class="franja" role="note">
      <NIcon :size="18" aria-hidden="true"><Server /></NIcon>
      <span class="franja-texto">{{ t.franjaExternos.texto }}</span>
      <NButton size="small" type="primary" @click="irAInstalarWeb">
        {{ t.franjaExternos.accion }}
      </NButton>
    </div>

    <!-- Mientras llega la primera foto se reserva el espacio de las tarjetas (sin saltos). -->
    <section v-if="!listo" class="grupo" aria-busy="true">
      <NSkeleton text :width="120" class="esqueleto-titulo" />
      <div class="rejilla">
        <NSkeleton v-for="n in 3" :key="n" :height="168" :sharp="false" class="esqueleto" />
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
      <!-- Motores que corren fuera de WolfCore Dev, en su propia franja. -->
      <section
        v-if="servicios.externos.length"
        class="grupo externos"
        aria-labelledby="grupo-externos"
      >
        <header class="cabeza-grupo">
          <h2 id="grupo-externos">{{ t.externos.titulo }}</h2>
          <small>{{ t.externos.ayuda }}</small>
        </header>
        <div class="rejilla" aria-live="polite">
          <TarjetaServicio v-for="s in servicios.externos" :key="s.id" :servicio="s" />
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
.limpieza {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
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
  opacity: 0.75;
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
  opacity: 0.72;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.esqueleto {
  border-radius: var(--wc-radio-lg);
}
.franja {
  display: flex;
  align-items: center;
  gap: var(--wc-esp-3);
  min-height: 56px;
  margin-bottom: var(--wc-esp-4);
  padding: 0 var(--wc-esp-4);
  border: 1px solid rgba(var(--acento-rgb), 0.35);
  border-radius: var(--wc-radio-md);
  background: rgba(var(--acento-rgb), 0.06);
}
.franja-texto {
  flex: 1;
  min-width: 0;
  font-size: var(--wc-texto-sm);
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
  opacity: 0.72;
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
  opacity: 0.72;
}
</style>

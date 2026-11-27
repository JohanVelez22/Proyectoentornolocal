<script setup lang="ts">
import { NButton, NCard } from 'naive-ui';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { MuestraSistema, PuertoEnUso } from '../../shared/api';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import { destinoServicio } from '../utilidades/foco';
import { servicioDeProceso } from '../utilidades/metricas';
import { nombreServicio } from '../utilidades/nombreServicio';
import EstadoPunto from './EstadoPunto.vue';
import TablaProcesos from './TablaProcesos.vue';

/**
 * Una sola tarjeta «Servicios y procesos» en Inicio: arriba lo que está en marcha, con su uso de
 * CPU y memoria; debajo el resto de los servicios (apagados, externos o sin proceso propio) con
 * su estado. La lista sale de `servicios.visibles`, la misma que ve Servicios.
 */
const props = defineProps<{ procesos: MuestraSistema['procesos']; puertos: PuertoEnUso[] }>();

const t = textos.panel;
const ti = textos.inicio.servicios;
const router = useRouter();
const servicios = useServicios();

const enTabla = computed(() => new Set(props.procesos.map((p) => servicioDeProceso(p.id))));
const resto = computed(() => servicios.visibles.filter((s) => !enTabla.value.has(s.id)));
</script>

<template>
  <NCard :title="t.procesos.titulo" size="small" class="tarjeta-procesos">
    <template #header-extra>
      <NButton text type="primary" @click="router.push({ name: 'servicios' })">
        {{ ti.ver }}
      </NButton>
    </template>
    <TablaProcesos :procesos="props.procesos" :puertos="props.puertos" />
    <div v-if="resto.length" class="resto">
      <h3 class="resto-titulo">{{ t.procesos.resto }}</h3>
      <ul class="lista">
        <li v-for="s in resto" :key="s.id" :data-foco="`servicio:${s.id}`">
          <button
            type="button"
            class="enlace"
            :title="ti.irA(s.nombre)"
            @click="router.push(destinoServicio(s.id))"
          >
            {{ nombreServicio(s.nombre) }}
          </button>
          <span class="meta">{{ s.puertos.join(' · ') }}</span>
          <EstadoPunto :estado="s.estado" />
        </li>
      </ul>
    </div>
  </NCard>
</template>

<style scoped>
.tarjeta-procesos {
  margin-top: var(--wc-esp-4);
  border-radius: var(--wc-radio-lg);
}
.resto {
  margin-top: var(--wc-esp-4);
  padding-top: var(--wc-esp-3);
  border-top: 1px solid rgba(128, 128, 128, 0.14);
}
.resto-titulo {
  margin: 0 0 var(--wc-esp-2);
  font-size: var(--wc-texto-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.75;
}
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  column-gap: var(--wc-esp-6);
}
.lista li {
  display: flex;
  align-items: center;
  gap: var(--wc-esp-3);
  min-height: 36px;
  border-top: 1px solid rgba(128, 128, 128, 0.1);
}
.enlace {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}
.enlace:hover,
.enlace:focus-visible {
  text-decoration: underline;
}
.meta {
  font-family: var(--fuente-mono);
  font-size: var(--wc-texto-xs);
  opacity: 0.72;
}
</style>

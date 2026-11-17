<script setup lang="ts">
import { CodeSlash, Layers, Power, Server } from '@vicons/ionicons5';
import { NButton, NCollapse, NCollapseItem, NIcon } from 'naive-ui';
import { computed } from 'vue';
import type { EstadoServicio } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';
import EstadoPunto from './EstadoPunto.vue';

const props = defineProps<{ servicio: EstadoServicio }>();

const t = es.servicios;
const { ejecutar, ocupado } = useAccion();

const icono = computed(() =>
  props.servicio.id === 'nginx'
    ? Server
    : props.servicio.id.startsWith('php-')
      ? CodeSlash
      : Layers,
);
const externo = computed(() => props.servicio.estado === 'externo');
const encendido = computed(() => props.servicio.estado === 'encendido');
const iniciando = computed(() => props.servicio.estado === 'iniciando');
const trabajando = computed(() => ocupado('cambiar'));

function cambiar(): void {
  const id = props.servicio.id;
  void ejecutar('cambiar', () =>
    encendido.value ? api().servicios.detener(id) : api().servicios.iniciar(id),
  );
}
</script>

<template>
  <article class="tarjeta" :class="`estado-${servicio.estado}`">
    <header class="cabeza">
      <span class="icono"
        ><NIcon :size="18"><component :is="icono" /></NIcon
      ></span>
      <div class="titulo">
        <h3>{{ servicio.nombre }}</h3>
        <span class="version">{{ servicio.version ?? t.sinVersion }}</span>
      </div>
      <EstadoPunto :estado="servicio.estado" />
    </header>

    <dl class="datos">
      <div>
        <dt>{{ t.puertos }}</dt>
        <dd>{{ servicio.puertos.length ? servicio.puertos.join(', ') : t.sinPuertos }}</dd>
      </div>
      <div>
        <dt>{{ t.pid }}</dt>
        <dd>{{ servicio.pid ?? t.sinPuertos }}</dd>
      </div>
    </dl>

    <NCollapse v-if="servicio.estado === 'error' && servicio.mensaje" class="detalle-error">
      <NCollapseItem :title="t.verDetalle" name="error">
        <pre>{{ servicio.mensaje }}</pre>
      </NCollapseItem>
    </NCollapse>
    <p v-else-if="servicio.mensaje" class="mensaje">{{ servicio.mensaje }}</p>

    <footer class="pie">
      <span v-if="externo" class="externo">{{ t.externo }}</span>
      <NButton
        v-else
        size="small"
        :type="encendido ? 'default' : 'primary'"
        :secondary="encendido"
        :disabled="iniciando"
        :loading="trabajando || iniciando"
        @click="cambiar"
      >
        <template #icon
          ><NIcon><Power /></NIcon
        ></template>
        {{ encendido ? es.acciones.apagar : es.acciones.encender }}
      </NButton>
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
.tarjeta.estado-error {
  border-color: rgba(220, 38, 38, 0.5);
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
.detalle-error pre {
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.08);
  font-family: var(--fuente-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
.mensaje {
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
}
.pie {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  min-height: 28px;
  align-items: center;
}
.externo {
  font-size: 12px;
  opacity: 0.7;
}
</style>

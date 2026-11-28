<script setup lang="ts">
import { CloudDownloadOutline, Open, Power } from '@vicons/ionicons5';
import { NAlert, NButton, NIcon, NTag } from 'naive-ui';
import { computed } from 'vue';
import type { EstadoCaptador } from '../../shared/api';
import { textos } from '../i18n';
import { ICONOS_CATEGORIA } from '../utilidades/iconosServicio';
import EstadoPunto from './EstadoPunto.vue';

const IconoCorreo = ICONOS_CATEGORIA.correo;

const props = defineProps<{
  captador: EstadoCaptador;
  /** Hay una acción en curso sobre este captador. */
  ocupado: boolean;
}>();
const emit = defineEmits<{
  usar: [];
  apagar: [];
  abrir: [];
  instalar: [];
}>();

const t = textos.correo;
const estado = computed(() => (props.captador.encendido ? 'encendido' : 'apagado'));
</script>

<template>
  <article class="tarjeta" :class="{ elegida: captador.elegido }">
    <!-- Misma cabecera que TarjetaServicio: icono, nombre con elipsis y estado a la derecha. -->
    <header class="cabeza">
      <span class="icono"
        ><NIcon :size="18"><component :is="IconoCorreo" /></NIcon
      ></span>
      <div class="titulo">
        <strong class="nombre" :title="captador.nombre">{{ captador.nombre }}</strong>
        <span class="etiquetas">
          <NTag v-if="captador.opcional" size="small" :bordered="false">{{
            t.captador.opcional
          }}</NTag>
          <NTag
            v-if="captador.elegido"
            size="small"
            type="success"
            :bordered="false"
            :title="t.captador.elegido"
          >
            {{ t.captador.elegido }}
          </NTag>
        </span>
      </div>
      <EstadoPunto
        class="estado"
        :estado="captador.instalado ? estado : 'apagado'"
        :etiqueta="captador.instalado ? undefined : t.captador.noInstalado"
      />
    </header>

    <NAlert v-if="captador.avisoMantenimiento" type="warning" :show-icon="false" class="aviso">
      {{ t.captador.avisoMantenimiento }}
    </NAlert>

    <dl class="datos">
      <div class="dato">
        <dt>{{ t.smtp }}</dt>
        <dd>
          <code>127.0.0.1:{{ captador.puertoSmtp }}</code>
        </dd>
      </div>
      <div class="dato">
        <dt>{{ t.buzon }}</dt>
        <dd>
          <code>127.0.0.1:{{ captador.puertoWeb }}</code>
        </dd>
      </div>
    </dl>

    <footer class="botones">
      <NButton v-if="!captador.instalado" size="small" secondary @click="emit('instalar')">
        <template #icon
          ><NIcon><CloudDownloadOutline /></NIcon
        ></template>
        {{ t.captador.instalar }}
      </NButton>
      <template v-else>
        <NButton
          v-if="!captador.encendido"
          size="small"
          type="primary"
          :loading="ocupado"
          @click="emit('usar')"
        >
          <template #icon
            ><NIcon><Power /></NIcon
          ></template>
          {{ t.captador.usar }}
        </NButton>
        <template v-else>
          <NButton size="small" type="primary" @click="emit('abrir')">
            <template #icon
              ><NIcon><Open /></NIcon
            ></template>
            {{ t.abrirBuzon }}
          </NButton>
          <NButton size="small" secondary :loading="ocupado" @click="emit('apagar')">
            {{ t.captador.apagar }}
          </NButton>
        </template>
      </template>
    </footer>
  </article>
</template>

<style scoped>
.tarjeta {
  box-sizing: border-box;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.04);
}
.tarjeta.elegida {
  border-color: rgba(var(--acento-rgb), 0.55);
}
.cabeza {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
}
.icono {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(var(--acento-rgb), 0.12);
  color: var(--texto-enlace);
  flex: none;
}
.titulo {
  flex: 1 1 0;
  min-width: 0;
}
.nombre {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14.5px;
}
/* La etiqueta (opcional, elegido) va bajo el nombre; la fila reserva su alto en todas las tarjetas. */
.etiquetas {
  overflow: hidden;
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  min-height: 22px;
  margin-top: 2px;
}
.etiquetas :deep(.n-tag) {
  min-width: 0;
  max-width: 100%;
}
.etiquetas :deep(.n-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.estado {
  flex: none;
  white-space: nowrap;
}
.tenue {
  font-size: 12px;
  opacity: 0.72;
}
.aviso {
  font-size: 12.5px;
}
.datos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 0;
}
.dato dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.72;
}
.dato dd {
  margin: 4px 0 0;
}
.dato code {
  font-family: var(--fuente-mono);
  font-size: 13px;
}
.botones {
  margin-top: auto;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>

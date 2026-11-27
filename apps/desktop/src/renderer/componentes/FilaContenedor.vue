<script setup lang="ts">
import { DocumentText, Play, Refresh, Stop } from '@vicons/ionicons5';
import { NButton, NIcon, NSpace, NTag, NTooltip } from 'naive-ui';
import { computed, type Component } from 'vue';
import type { AccionContenedor, Contenedor } from '../../shared/api';
import { textos } from '../i18n';

/** Una fila de la tabla de contenedores: todo se muestra como texto (nunca HTML). */
const props = defineProps<{
  contenedor: Contenedor;
  /** Acción en curso sobre este contenedor (deshabilita los botones). */
  ocupado: boolean;
  /** ¿Es el que tiene el registro abierto? */
  conRegistro: boolean;
}>();
const emit = defineEmits<{
  accion: [a: AccionContenedor];
  registros: [];
}>();

const t = textos.contenedores;

const TIPO_ESTADO = {
  corriendo: 'success',
  detenido: 'default',
  pausado: 'warning',
  otro: 'info',
} as const;

const enMarcha = computed(() => props.contenedor.estado === 'corriendo');
const salida = computed(() =>
  props.contenedor.codigoSalida !== null ? t.codigoSalida(props.contenedor.codigoSalida) : null,
);

interface Boton {
  clave: AccionContenedor;
  icono: Component;
  texto: string;
  visible: boolean;
}
const botones = computed<Boton[]>(() => [
  { clave: 'iniciar', icono: Play, texto: t.iniciar, visible: !enMarcha.value },
  { clave: 'detener', icono: Stop, texto: t.detener, visible: enMarcha.value },
  { clave: 'reiniciar', icono: Refresh, texto: t.reiniciar, visible: enMarcha.value },
]);
</script>

<template>
  <tr :class="{ elegido: conRegistro }">
    <td class="nombre">
      <strong>{{ contenedor.nombre || contenedor.id }}</strong>
      <code class="id">{{ contenedor.id.slice(0, 12) }}</code>
    </td>
    <td class="imagen">{{ contenedor.imagen }}</td>
    <td>
      <NTag size="small" :type="TIPO_ESTADO[contenedor.estado]" :bordered="false">
        {{ t.estados[contenedor.estado] }}
      </NTag>
      <div v-if="contenedor.detalle || salida" class="detalle">
        {{ contenedor.detalle || salida }}
      </div>
    </td>
    <td class="puertos">
      <div v-for="p in contenedor.puertos" :key="p">
        <code>{{ p }}</code>
      </div>
    </td>
    <td>{{ contenedor.proyectoCompose ?? '' }}</td>
    <td>
      <NSpace size="small" :wrap="false">
        <template v-for="b in botones" :key="b.clave">
          <NTooltip v-if="b.visible">
            <template #trigger>
              <NButton
                size="small"
                quaternary
                :aria-label="b.texto"
                :disabled="ocupado"
                @click="emit('accion', b.clave)"
              >
                <template #icon
                  ><NIcon><component :is="b.icono" /></NIcon
                ></template>
              </NButton>
            </template>
            {{ b.texto }}
          </NTooltip>
        </template>
        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              quaternary
              :type="conRegistro ? 'primary' : 'default'"
              :aria-label="t.registros"
              @click="emit('registros')"
            >
              <template #icon
                ><NIcon><DocumentText /></NIcon
              ></template>
            </NButton>
          </template>
          {{ t.registros }}
        </NTooltip>
      </NSpace>
    </td>
  </tr>
</template>

<style scoped>
td {
  padding: 6px 8px;
  vertical-align: top;
  border-bottom: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.2));
}
tr.elegido td {
  background: rgba(128, 128, 128, 0.08);
}
.nombre strong {
  display: block;
  word-break: break-all;
}
.id {
  font-size: 11px;
  opacity: 0.76;
}
.imagen {
  word-break: break-all;
}
.detalle {
  font-size: 12px;
  opacity: 0.75;
  margin-top: 2px;
}
.puertos code {
  font-size: 12px;
}
</style>

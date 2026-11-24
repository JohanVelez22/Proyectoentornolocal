<script setup lang="ts">
import { LockClosed, Star, StarOutline, Warning } from '@vicons/ionicons5';
import { NButton, NIcon, NInputNumber, NSwitch, NTag, NTooltip } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { TablaVersiones } from '../../shared/api';
import { textos } from '../i18n';
import type { FilaVersion } from '../stores/versiones';

/**
 * Una versión en la pestaña "Versiones": marcas (instalada, encendida, con actualización, sin
 * huella), Instalar/Desinstalar, interruptor (si el servicio lo tiene), puerto de la instancia
 * y estrella de predeterminada.
 */
const props = defineProps<{
  fila: FilaVersion;
  interruptor: TablaVersiones['interruptor'];
  /** Se puede encender (ver `conInterruptor`). */
  conInterruptor: boolean;
  /** Otra versión de la rama ya tiene la instancia: se ofrece "Usar esta versión". */
  instanciaDeRama: string | null;
  resaltada: boolean;
  ocupada: boolean;
}>();
const emit = defineEmits<{
  instalar: [];
  desinstalar: [];
  encender: [valor: boolean];
  predeterminar: [];
  actualizar: [];
  usar: [];
  puerto: [puerto: number];
  resolver: [];
}>();

const t = textos.versiones;
const f = computed(() => props.fila);

const puerto = ref<number | null>(props.fila.puerto);
watch(
  () => props.fila.puerto,
  (p) => (puerto.value = p),
);
const puertoCambiado = computed(
  () => puerto.value !== null && puerto.value !== props.fila.puerto && puerto.value >= 1024,
);

const huellaTexto = computed(() =>
  f.value.huella === 'ninguna'
    ? t.marcas.sinHuella
    : f.value.huella === 'debil'
      ? t.marcas.huellaDebil
      : null,
);
</script>

<template>
  <div class="fila" :class="{ resaltada, instalada: f.instalada }" role="row">
    <div class="version" role="cell">
      <span class="numero">{{ f.version }}</span>
      <NTag v-if="f.instalada" size="small" :bordered="false" type="success">{{
        t.marcas.instalada
      }}</NTag>
      <NTag v-if="f.encendida" size="small" :bordered="false" type="info">{{
        t.marcas.encendida
      }}</NTag>
      <NTag v-if="f.actualizacion" size="small" :bordered="false" type="warning">
        {{ t.marcas.actualizacion(f.actualizacion) }}
      </NTag>
      <NTag v-if="f.bloqueada" size="small" :bordered="false" type="error">
        <template #icon
          ><NIcon><LockClosed /></NIcon
        ></template>
        {{ t.marcas.bloqueada }}
      </NTag>
      <NTooltip v-if="huellaTexto && !f.instalada">
        <template #trigger>
          <NTag size="small" :bordered="false" type="warning" class="huella">
            <template #icon
              ><NIcon><Warning /></NIcon
            ></template>
            {{ huellaTexto }}
          </NTag>
        </template>
        {{ t.ayudaSinHuella }}
      </NTooltip>
    </div>

    <div class="acciones" role="cell">
      <template v-if="f.instancia && interruptor === 'instancias'">
        <span class="etiqueta-puerto">{{ t.puerto }}</span>
        <NInputNumber
          v-model:value="puerto"
          size="small"
          class="puerto"
          :min="1024"
          :max="65535"
          :show-button="false"
          :disabled="ocupada"
          :aria-label="t.puertoDe(f.instancia)"
        />
        <NButton
          v-if="puertoCambiado"
          size="tiny"
          secondary
          :disabled="ocupada"
          @click="emit('puerto', puerto!)"
        >
          {{ t.cambiarPuerto }}
        </NButton>
      </template>

      <NButton
        v-if="f.bloqueada"
        size="small"
        type="error"
        secondary
        :disabled="ocupada"
        @click="emit('resolver')"
      >
        {{ t.resolver }}
      </NButton>
      <NButton
        v-if="f.instalada && f.actualizacion"
        size="small"
        type="warning"
        secondary
        :disabled="ocupada || f.bloqueada"
        @click="emit('actualizar')"
      >
        {{ t.actualizar }}
      </NButton>
      <NTooltip v-if="f.instalada && !f.instancia && instanciaDeRama">
        <template #trigger>
          <NButton size="small" secondary :disabled="ocupada" @click="emit('usar')">{{
            t.usarEsta
          }}</NButton>
        </template>
        {{ t.usarEstaAyuda(instanciaDeRama) }}
      </NTooltip>

      <NSwitch
        v-if="conInterruptor"
        size="small"
        :value="f.encendida"
        :disabled="ocupada || f.bloqueada"
        :aria-label="f.encendida ? t.apagar : t.encender"
        @update:value="(v: boolean) => emit('encender', v)"
      />

      <NTooltip v-if="f.instalada && (interruptor !== 'instancias' || f.instancia)">
        <template #trigger>
          <NButton
            size="small"
            quaternary
            circle
            :type="f.predeterminada ? 'warning' : 'default'"
            :disabled="ocupada || f.predeterminada"
            :aria-label="f.predeterminada ? t.predeterminada : t.hacerPredeterminada"
            :aria-pressed="f.predeterminada"
            @click="emit('predeterminar')"
          >
            <template #icon>
              <NIcon><Star v-if="f.predeterminada" /><StarOutline v-else /></NIcon>
            </template>
          </NButton>
        </template>
        {{ f.predeterminada ? t.predeterminada : t.hacerPredeterminada }}
      </NTooltip>

      <NButton
        v-if="!f.instalada"
        size="small"
        type="primary"
        secondary
        :disabled="ocupada"
        @click="emit('instalar')"
      >
        {{ t.instalar }}
      </NButton>
      <NButton
        v-else
        size="small"
        quaternary
        :disabled="ocupada || f.encendida"
        @click="emit('desinstalar')"
      >
        {{ t.desinstalar }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 8px 10px;
  border-radius: 8px;
}
.fila + .fila {
  border-top: 1px solid rgba(128, 128, 128, 0.16);
}
.fila.resaltada {
  background: rgba(var(--acento-rgb), 0.12);
}
.version {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.numero {
  font-family: var(--fuente-mono);
  font-size: 13px;
  font-weight: 600;
  min-width: 72px;
}
.fila:not(.instalada) .numero {
  opacity: 0.75;
}
.acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: auto;
}
.etiqueta-puerto {
  font-size: 12px;
  opacity: 0.6;
}
.puerto {
  width: 84px;
}
</style>

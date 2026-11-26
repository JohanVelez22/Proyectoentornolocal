<script setup lang="ts">
import { LockClosed, ShieldCheckmark, Star, StarOutline, Warning } from '@vicons/ionicons5';
import { NButton, NIcon, NInputNumber, NSwitch, NTooltip } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { TablaVersiones } from '../../shared/api';
import { textos } from '../i18n';
import type { FilaVersion } from '../stores/versiones';

/**
 * Una versión en la pestaña "Versiones", como tarjeta compacta: versión y firma en una línea con
 * Instalar (pequeño, a la derecha) y, si está instalada, una segunda línea con sus marcas y
 * acciones (encender, puerto, predeterminada, desinstalar).
 */
const props = defineProps<{
  fila: FilaVersion;
  /** Servicio de la tarjeta: arma el destino de `?foco=`. */
  servicio: string;
  interruptor: TablaVersiones['interruptor'];
  /** Se puede encender (ver `conInterruptor`). */
  conInterruptor: boolean;
  /** Otra versión de la misma serie ya tiene la instancia: se ofrece "Usar esta versión". */
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
  <article
    class="tarjeta"
    :class="{ resaltada, instalada: f.instalada }"
    role="listitem"
    :data-foco="`version:${servicio}:${f.version}`"
  >
    <!-- Una sola línea: versión, firma y, a la derecha, Instalar (o la marca de instalada). -->
    <div class="linea">
      <span class="numero" :title="f.version">{{ f.version }}</span>
      <NTooltip v-if="f.huella === 'firmada'">
        <template #trigger>
          <span class="firma ok" role="img" :aria-label="t.marcas.firmada" tabindex="0">
            <NIcon :size="16"><ShieldCheckmark /></NIcon>
          </span>
        </template>
        {{ t.ayudaFirmada }}
      </NTooltip>
      <NTooltip v-else-if="huellaTexto && !f.instalada">
        <template #trigger>
          <span class="firma aviso" role="img" :aria-label="huellaTexto" tabindex="0">
            <NIcon :size="16"><Warning /></NIcon>
          </span>
        </template>
        {{ t.ayudaSinHuella }}
      </NTooltip>
      <span class="espacio" />
      <span v-if="f.instalada" class="marca ok">{{ t.marcas.instalada }}</span>
      <NButton
        v-else
        size="tiny"
        type="primary"
        :disabled="ocupada"
        :aria-label="`${t.instalar} ${f.version}`"
        @click="emit('instalar')"
      >
        {{ t.instalar }}
      </NButton>
    </div>

    <!-- Lo que se puede hacer con una versión instalada (no ocupa sitio en las demás). -->
    <div v-if="f.instalada" class="extras">
      <span v-if="f.encendida" class="marca info">{{ t.marcas.encendida }}</span>
      <span v-if="f.actualizacion" class="marca aviso">
        {{ t.marcas.actualizacion(f.actualizacion) }}
      </span>
      <span v-if="f.bloqueada" class="marca peligro">
        <NIcon :size="12"><LockClosed /></NIcon>
        {{ t.marcas.bloqueada }}
      </span>

      <template v-if="f.instancia && interruptor === 'instancias'">
        <span class="etiqueta-puerto">{{ t.puerto }}</span>
        <NInputNumber
          v-model:value="puerto"
          size="tiny"
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
        size="tiny"
        type="error"
        :disabled="ocupada"
        @click="emit('resolver')"
      >
        {{ t.resolver }}
      </NButton>
      <NButton
        v-if="f.actualizacion"
        size="tiny"
        type="warning"
        :disabled="ocupada || f.bloqueada"
        @click="emit('actualizar')"
      >
        {{ t.actualizar }}
      </NButton>
      <NTooltip v-if="!f.instancia && instanciaDeRama">
        <template #trigger>
          <NButton size="tiny" secondary :disabled="ocupada" @click="emit('usar')">{{
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

      <NTooltip v-if="interruptor !== 'instancias' || f.instancia">
        <template #trigger>
          <NButton
            size="tiny"
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
        size="tiny"
        quaternary
        class="desinstalar"
        :disabled="ocupada || f.encendida"
        :aria-label="`${t.desinstalar} ${f.version}`"
        @click="emit('desinstalar')"
      >
        {{ t.desinstalar }}
      </NButton>
    </div>
  </article>
</template>

<style scoped>
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 9px;
}
.tarjeta.resaltada {
  background: rgba(var(--acento-rgb), 0.12);
}
.linea {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.numero {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--fuente-mono);
  font-size: 14px;
  font-weight: 600;
}
.tarjeta:not(.instalada) .numero {
  opacity: 0.85;
}
.espacio {
  flex: 1;
}
.firma {
  display: inline-flex;
  flex: none;
  border-radius: 4px;
  cursor: help;
}
.firma:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 1px;
}
.extras {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  min-width: 0;
}
/* Marcas: texto con los colores de contraste AA de cada tema y un borde del mismo color. */
.marca {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 6px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 11.5px;
  line-height: 18px;
  white-space: nowrap;
}
.ok {
  color: var(--texto-ok);
}
.info {
  color: var(--texto-enlace);
}
.aviso {
  color: var(--texto-aviso);
}
.peligro {
  color: var(--texto-peligro);
}
.etiqueta-puerto {
  font-size: 12px;
  opacity: 0.75;
}
.puerto {
  width: 70px;
}
.desinstalar {
  margin-left: auto;
}
</style>

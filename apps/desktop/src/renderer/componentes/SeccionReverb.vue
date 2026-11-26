<script setup lang="ts">
import { NButton, NSwitch, NTag, useDialog } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { EstadoReverb, Sitio } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import {
  idProcesoReverb,
  reverbEncendido,
  reverbVisible,
  tipoEstadoReverb,
} from '../utilidades/reverb';

/**
 * Laravel Reverb del proyecto (D45a): estado, puerto, encendido y apagado con confirmación, y
 * las variables `REVERB_*` propuestas para el gestor de `.env` (que enseña la vista previa).
 * Solo aparece en sitios de confianza con `vendor/laravel/reverb`.
 */
const props = defineProps<{ sitio: Sitio }>();
const emit = defineEmits<{
  /** Abrir el gestor de .env con estas variables ya cargadas (vista previa, sin escribir). */
  proponer: [sitio: Sitio, variables: Record<string, string>];
}>();

const t = textos.reverb;
const dialog = useDialog();
const { ejecutar, ocupado } = useAccion();

const estado = ref<EstadoReverb | null>(null);
const visible = computed(() => reverbVisible(estado.value));
const encendido = computed(() => reverbEncendido(estado.value));
const trabajando = computed(
  () =>
    ocupado(`reverb-activar-${props.sitio.id}`) || ocupado(`reverb-desactivar-${props.sitio.id}`),
);

async function cargar(): Promise<void> {
  try {
    estado.value = await api().reverb.estado(props.sitio.id);
  } catch {
    estado.value = null;
  }
}

let reloj: ReturnType<typeof setTimeout> | undefined;
let baja: (() => void) | undefined;
onMounted(() => {
  void cargar();
  baja = api().on('servicio:estado', (e) => {
    if (e.id !== idProcesoReverb(props.sitio.id)) return;
    clearTimeout(reloj);
    reloj = setTimeout(() => void cargar(), 250);
  });
});
onBeforeUnmount(() => {
  clearTimeout(reloj);
  baja?.();
});
// Cambia lo que decide si se ve (confianza, carpeta, procesos): se vuelve a preguntar.
watch(
  () => [props.sitio.confiado, props.sitio.carpeta, props.sitio.procesos.length],
  () => void cargar(),
);

function cambiar(valor: boolean): void {
  if (trabajando.value) return;
  const id = props.sitio.id;
  dialog.warning({
    title: valor ? t.activarTitulo : t.desactivarTitulo,
    content: valor ? t.activarTexto(props.sitio.dominio) : t.desactivarTexto,
    positiveText: valor ? t.activar : t.desactivar,
    negativeText: textos.acciones.cancelar,
    onPositiveClick: async () => {
      await ejecutar(
        valor ? `reverb-activar-${id}` : `reverb-desactivar-${id}`,
        async () => {
          if (valor) await api().reverb.activar(id, true);
          else await api().reverb.desactivar(id);
        },
        { tituloError: t.tituloError },
      );
      await cargar();
    },
  });
}

async function proponer(): Promise<void> {
  const variables = await ejecutar(
    `reverb-variables-${props.sitio.id}`,
    () => api().reverb.variables(props.sitio.id),
    { tituloError: t.tituloError },
  );
  if (variables) emit('proponer', props.sitio, variables);
}
</script>

<template>
  <div v-if="visible && estado" class="reverb" role="group" :aria-label="t.titulo">
    <div class="fila">
      <span class="interruptor">
        <NSwitch
          size="small"
          :value="encendido"
          :loading="trabajando"
          :disabled="trabajando"
          :aria-label="t.interruptor(sitio.dominio)"
          @update:value="cambiar"
        />
        <span class="etiqueta">{{ t.titulo }}</span>
      </span>
      <NTag size="small" :type="tipoEstadoReverb(estado.estado)" :bordered="false">
        {{ t.estados[estado.estado] }}
      </NTag>
      <span v-if="estado.activo && estado.puerto !== null" class="puerto">
        {{ t.puerto(estado.puerto) }}
      </span>
      <span v-else class="ayuda">{{ t.ayuda }}</span>
      <NButton
        v-if="estado.activo"
        size="tiny"
        secondary
        :loading="ocupado(`reverb-variables-${sitio.id}`)"
        @click="proponer"
      >
        {{ t.proponer }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.reverb {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
}
.fila {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  min-height: 28px;
}
.interruptor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.etiqueta {
  font-weight: 600;
}
.puerto {
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.ayuda {
  min-width: 0;
  flex: 1;
}
</style>

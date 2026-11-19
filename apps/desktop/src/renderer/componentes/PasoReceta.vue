<script setup lang="ts">
import {
  CheckmarkCircle,
  ChevronDown,
  ChevronUp,
  CloseCircle,
  EllipseOutline,
  RemoveCircleOutline,
} from '@vicons/ionicons5';
import { NButton, NIcon, NSpin } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { es } from '../i18n/es';
import { etiquetaPaso, type PasoConEstado } from '../utilidades/proyectos';
import PanelProgreso from './PanelProgreso.vue';

/** Un paso de la receta con su estado, su mensaje de error y su registro desplegable. */
const props = defineProps<{
  paso: PasoConEstado;
  /** Muestra Reintentar y Omitir si el paso falló (y no hay otra corrida en curso). */
  acciones?: boolean;
  ocupado?: boolean;
}>();
const emit = defineEmits<{ reintentar: [pasoId: string]; omitir: [pasoId: string] }>();

const t = es.proyectos;
const abierto = ref(false);
const etiqueta = computed(() => etiquetaPaso(props.paso));
const lineas = computed(() => props.paso.log.map((texto, n) => ({ n, texto })));

// El registro se abre solo cuando el paso empieza a correr o falla.
watch(
  () => props.paso.estado,
  (e) => {
    if (e === 'error') abierto.value = true;
    else if (e === 'listo' || e === 'omitido') abierto.value = false;
  },
  { immediate: true },
);
</script>

<template>
  <li class="paso" :class="`e-${paso.estado}`">
    <div class="fila">
      <span class="icono" :title="t.estadoPaso[paso.estado]">
        <NSpin v-if="paso.estado === 'corriendo'" :size="14" />
        <NIcon v-else-if="paso.estado === 'listo'" class="ok"><CheckmarkCircle /></NIcon>
        <NIcon v-else-if="paso.estado === 'error'" class="mal"><CloseCircle /></NIcon>
        <NIcon v-else-if="paso.estado === 'omitido'" class="tenue"><RemoveCircleOutline /></NIcon>
        <NIcon v-else class="tenue"><EllipseOutline /></NIcon>
      </span>
      <div class="texto">
        <span class="titulo">{{ etiqueta }}</span>
        <span class="estado">{{ t.estadoPaso[paso.estado] }}</span>
      </div>
      <div class="botones">
        <template v-if="acciones && paso.estado === 'error'">
          <NButton
            size="tiny"
            type="primary"
            :disabled="ocupado"
            @click="emit('reintentar', paso.id)"
          >
            {{ t.asistente.reintentar }}
          </NButton>
          <NButton size="tiny" secondary :disabled="ocupado" @click="emit('omitir', paso.id)">
            {{ t.asistente.omitir }}
          </NButton>
        </template>
        <NButton
          v-if="paso.log.length"
          size="tiny"
          quaternary
          :aria-expanded="abierto"
          @click="abierto = !abierto"
        >
          <template #icon>
            <NIcon><ChevronUp v-if="abierto" /><ChevronDown v-else /></NIcon>
          </template>
          {{ abierto ? t.asistente.ocultarRegistro : t.asistente.verRegistro }}
        </NButton>
      </div>
    </div>
    <p v-if="paso.estado === 'error' && paso.mensaje" class="mensaje">{{ paso.mensaje }}</p>
    <PanelProgreso
      v-if="abierto && paso.log.length"
      class="registro"
      :lineas="lineas"
      :limite="500"
      :etiqueta="etiqueta"
      :alto="180"
    />
  </li>
</template>

<style scoped>
.paso {
  list-style: none;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.16);
  background: rgba(128, 128, 128, 0.035);
}
.paso.e-error {
  border-color: rgba(220, 38, 38, 0.4);
}
.paso.e-corriendo {
  border-color: rgba(100, 112, 224, 0.45);
}
.fila {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icono {
  display: inline-flex;
  width: 18px;
  justify-content: center;
  font-size: 17px;
  flex: none;
}
.ok {
  color: #16a34a;
}
.mal {
  color: #dc2626;
}
.tenue {
  opacity: 0.45;
}
.texto {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.titulo {
  font-size: 13px;
}
.e-omitido .titulo {
  opacity: 0.6;
  text-decoration: line-through;
}
.estado {
  font-size: 11.5px;
  opacity: 0.55;
}
.botones {
  display: flex;
  gap: 6px;
  flex: none;
}
.mensaje {
  margin: 6px 0 0 28px;
  font-size: 12px;
  color: #dc2626;
  white-space: pre-wrap;
  word-break: break-word;
}
.registro {
  margin: 8px 0 0 28px;
}
</style>

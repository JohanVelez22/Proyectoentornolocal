<script setup lang="ts">
import { TrashOutline } from '@vicons/ionicons5';
import type { Plantilla } from '../../shared/api';
import { textos } from '../i18n';
import BotonIcono from './BotonIcono.vue';

/**
 * Plantillas propias del usuario, como opciones únicas junto a los generadores del asistente.
 * Elegir una parte de ella (receta, ajustes y esquema sin datos); borrarla no toca ningún proyecto.
 */
defineProps<{ plantillas: Plantilla[]; elegida: string | null }>();
const emit = defineEmits<{ elegir: [plantilla: Plantilla]; borrar: [plantilla: Plantilla] }>();

const t = textos.plantillas.lista;
const fecha = (iso: string): string => iso.slice(0, 10);
</script>

<template>
  <section class="plantillas" :aria-label="t.titulo">
    <h4 class="titulo">{{ t.titulo }}</h4>
    <p class="ayuda">{{ t.ayuda }}</p>
    <p v-if="!plantillas.length" class="vacia">{{ t.vacia }}</p>
    <div v-else class="rejilla" role="radiogroup" :aria-label="t.titulo">
      <div v-for="p in plantillas" :key="p.id" class="fila">
        <button
          type="button"
          class="opcion"
          :class="{ activa: p.id === elegida }"
          role="radio"
          :aria-checked="p.id === elegida"
          @click="emit('elegir', p)"
        >
          <strong>{{ p.nombre }}</strong>
          <span>
            {{ p.tipo }} · {{ p.conArchivos ? t.conArchivosEtiqueta : t.soloEsquema }}
            <template v-if="p.motorBase"> · {{ t.conBase(p.motorBase) }}</template>
            · {{ fecha(p.creada) }}
          </span>
        </button>
        <BotonIcono
          :icono="TrashOutline"
          :etiqueta="t.borrarEtiqueta(p.nombre)"
          @click="emit('borrar', p)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.plantillas {
  margin-top: 18px;
}
.titulo {
  margin: 0 0 2px;
  font-size: 13.5px;
}
.ayuda,
.vacia {
  margin: 0 0 8px;
  font-size: 12px;
  opacity: 0.7;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}
.fila {
  display: flex;
  align-items: stretch;
  gap: 6px;
  min-width: 0;
}
.opcion {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  background: rgba(128, 128, 128, 0.045);
}
.opcion:hover {
  border-color: rgba(128, 128, 128, 0.5);
}
.opcion.activa {
  border-color: var(--texto-ok, #16a34a);
  box-shadow: 0 0 0 1px var(--texto-ok, #16a34a);
}
.opcion:focus-visible {
  outline: 2px solid var(--texto-ok, #16a34a);
  outline-offset: 2px;
}
.opcion strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.opcion span {
  font-size: 11.5px;
  opacity: 0.7;
}
</style>

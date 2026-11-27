<script setup lang="ts">
import { Expand, Images, Scan } from '@vicons/ionicons5';
import { NButton, NIcon, useMessage } from 'naive-ui';
import { onMounted, ref, type Component } from 'vue';
import type { EstadoCapturaUi, ModoCaptura } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';

/**
 * Abre la captura de pantalla (D35). Las ventanas de WolfCore Dev se ocultan un instante para no
 * salir en la imagen; lo capturado no sale del equipo ni se guarda hasta que el usuario lo guarda.
 */
const t = textos.captura.panel;
const { ejecutar, ocupado } = useAccion();
const message = useMessage();
const estado = ref<EstadoCapturaUi | null>(null);

onMounted(async () => {
  try {
    estado.value = await api().captura.leer();
  } catch {
    estado.value = null;
  }
});

const MODOS: { id: ModoCaptura; icono: Component; nombre: () => string; ayuda: () => string }[] = [
  { id: 'region', icono: Scan, nombre: () => t.region, ayuda: () => t.regionAyuda },
  { id: 'ventana', icono: Images, nombre: () => t.ventana, ayuda: () => t.ventanaAyuda },
  { id: 'pantalla', icono: Expand, nombre: () => t.pantalla, ayuda: () => t.pantallaAyuda },
];

async function capturar(modo: ModoCaptura): Promise<void> {
  const r = await ejecutar('captura-' + modo, () => api().captura.iniciar(modo));
  if (!r || r.ok) return;
  if (r.codigo === 'captura.permiso_denegado') message.warning(t.permisoDenegado);
  else if (r.codigo === 'captura.ocupada') message.info(t.ocupada);
  else message.error(t.noDisponible);
}
</script>

<template>
  <div class="herr">
    <p class="herr-tenue">{{ t.ayuda }}</p>
    <div class="modos">
      <NButton
        v-for="m in MODOS"
        :key="m.id"
        class="modo"
        secondary
        :loading="ocupado('captura-' + m.id)"
        :disabled="estado !== null && !estado.sistema.disponible"
        @click="capturar(m.id)"
      >
        <template #icon
          ><NIcon><component :is="m.icono" /></NIcon
        ></template>
        <span class="modo-texto">
          <strong>{{ m.nombre() }}</strong>
          <small>{{ m.ayuda() }}</small>
        </span>
      </NButton>
    </div>
    <p v-if="estado && !estado.sistema.disponible" class="herr-tenue">{{ t.noDisponible }}</p>
    <p v-else-if="estado" class="herr-tenue">
      {{
        estado.atajoActivo && estado.config.atajo
          ? t.atajoActivo(estado.config.atajo)
          : t.atajoInactivo
      }}
    </p>
  </div>
</template>

<style scoped>
.modos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}
.modo {
  height: auto;
  padding: 10px 14px;
  justify-content: flex-start;
  text-align: left;
}
.modo-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: normal;
}
.modo-texto small {
  opacity: 0.75;
}
</style>

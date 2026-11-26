<script setup lang="ts">
import { Videocam } from '@vicons/ionicons5';
import { NAlert, NButton, NIcon } from 'naive-ui';
import { computed, ref } from 'vue';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { sistemaDe } from '../../utilidades/grabadora';

/**
 * «Grabar pantalla»: no hay grabadora propia. En Windows el botón abre Recortes en modo grabación
 * (lo hace el proceso principal con un URI fijo); en macOS y Linux, y si Recortes no se abre, la
 * guía de atajos de cada sistema.
 */
const t = textos.herramientas.grabar;
const { ejecutar, ocupado } = useAccion();

const sistema = computed(() => sistemaDe(navigator.platform));
const guia = computed(() => t.guias[sistema.value]);
/** null = todavía no se pidió; false = Recortes no se abrió y se destaca la guía. */
const abierta = ref<boolean | null>(null);

async function abrir(): Promise<void> {
  const r = await ejecutar('grabar-pantalla', () => api().sistema.abrirGrabadora());
  abierta.value = r ? r.abierta : null;
}
</script>

<template>
  <div class="herr">
    <p class="herr-tenue">{{ t.ayuda }}</p>
    <div v-if="sistema === 'windows'" class="herr-fila">
      <NButton type="primary" :loading="ocupado('grabar-pantalla')" @click="abrir">
        <template #icon
          ><NIcon><Videocam /></NIcon
        ></template>
        {{ t.abrir }}
      </NButton>
    </div>
    <NAlert v-if="abierta === true" type="success" :show-icon="false">{{ t.abierta }}</NAlert>
    <NAlert v-else-if="abierta === false" type="warning" :show-icon="false">
      {{ t.noSePudo }}
    </NAlert>
    <section class="guia" :aria-labelledby="'guia-grabar'">
      <h3 id="guia-grabar">{{ t.guiaTitulo }} ({{ guia.titulo }})</h3>
      <ol>
        <li v-for="(paso, i) in guia.pasos" :key="i">{{ paso }}</li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.guia {
  padding: 10px 14px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 10px;
  background: rgba(128, 128, 128, 0.045);
}
.guia h3 {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
}
.guia ol {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
</style>

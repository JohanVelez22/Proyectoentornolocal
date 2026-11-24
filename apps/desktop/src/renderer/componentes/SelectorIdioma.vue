<script setup lang="ts">
import { LanguageOutline } from '@vicons/ionicons5';
import { NButton, NIcon, NRadioButton, NRadioGroup, useNotification } from 'naive-ui';
import MenuDesplegable from './MenuDesplegable.vue';
import { computed } from 'vue';
import { mensajeDeError } from '../composables/useAccion';
import { IDIOMAS, idioma, textos, type Idioma } from '../i18n';
import { usePreferencias } from '../stores/preferencias';

/** Idioma de la interfaz (registro IDIOMAS): botón con menú (barra superior) o botones (Ajustes). */
defineProps<{ compacto?: boolean }>();

const t = textos.preferencias;
const preferencias = usePreferencias();
const notification = useNotification();

const opciones = computed(() => IDIOMAS.map((i) => ({ key: i.id, label: i.nombreNativo })));

async function elegir(i: Idioma): Promise<void> {
  if (i === idioma.value) return;
  try {
    await preferencias.cambiarIdioma(i);
  } catch (e) {
    notification.error({ title: t.errorGuardar, content: mensajeDeError(e), duration: 6000 });
  }
}
</script>

<template>
  <MenuDesplegable
    v-if="compacto"
    trigger="click"
    :options="opciones"
    :value="idioma"
    @select="(k: Idioma) => elegir(k)"
  >
    <NButton quaternary size="small" :aria-label="textos.barra.idioma" :title="textos.barra.idioma">
      <template #icon>
        <NIcon><LanguageOutline /></NIcon>
      </template>
      <span class="codigo">{{ idioma.toUpperCase() }}</span>
    </NButton>
  </MenuDesplegable>
  <NRadioGroup
    v-else
    :value="idioma"
    size="small"
    :aria-label="t.idioma"
    @update:value="(k: Idioma) => elegir(k)"
  >
    <NRadioButton v-for="i in IDIOMAS" :key="i.id" :value="i.id">{{ i.nombreNativo }}</NRadioButton>
  </NRadioGroup>
</template>

<style scoped>
.codigo {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
</style>

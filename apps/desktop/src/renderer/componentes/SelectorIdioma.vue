<script setup lang="ts">
import { LanguageOutline } from '@vicons/ionicons5';
import { NButton, NDropdown, NIcon, NRadioButton, NRadioGroup, useNotification } from 'naive-ui';
import { computed } from 'vue';
import { mensajeDeError } from '../composables/useAccion';
import { IDIOMAS, idioma, textos, type Idioma } from '../i18n';
import { usePreferencias } from '../stores/preferencias';

/** Español / English: botón con menú (barra superior) o botones (Ajustes). */
defineProps<{ compacto?: boolean }>();

const t = textos.preferencias;
const preferencias = usePreferencias();
const notification = useNotification();

const opciones = computed(() => IDIOMAS.map((k) => ({ key: k, label: t.idiomas[k] })));

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
  <NDropdown
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
  </NDropdown>
  <NRadioGroup
    v-else
    :value="idioma"
    size="small"
    :aria-label="t.idioma"
    @update:value="(k: Idioma) => elegir(k)"
  >
    <NRadioButton v-for="k in IDIOMAS" :key="k" :value="k">{{ t.idiomas[k] }}</NRadioButton>
  </NRadioGroup>
</template>

<style scoped>
.codigo {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
</style>

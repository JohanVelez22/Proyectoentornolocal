<script setup lang="ts">
import { ContrastOutline, MoonOutline, SunnyOutline } from '@vicons/ionicons5';
import { NButton, NDropdown, NIcon, NRadioButton, NRadioGroup, useNotification } from 'naive-ui';
import { computed, h, type Component } from 'vue';
import { mensajeDeError } from '../composables/useAccion';
import { textos } from '../i18n';
import { usePreferencias, type TemaUi } from '../stores/preferencias';

/** Tema Sistema / Claro / Oscuro: botón con menú (barra superior) o botones (Ajustes). */
defineProps<{ compacto?: boolean }>();

const t = textos.preferencias;
const preferencias = usePreferencias();
const notification = useNotification();

const TEMAS: TemaUi[] = ['sistema', 'claro', 'oscuro'];
const ICONOS: Record<TemaUi, Component> = {
  sistema: ContrastOutline,
  claro: SunnyOutline,
  oscuro: MoonOutline,
};

const opciones = computed(() =>
  TEMAS.map((k) => ({
    key: k,
    label: t.temas[k],
    icon: () => h(NIcon, null, { default: () => h(ICONOS[k]) }),
  })),
);

async function elegir(tema: TemaUi): Promise<void> {
  try {
    await preferencias.cambiarTema(tema);
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
    :value="preferencias.tema"
    @select="(k: TemaUi) => elegir(k)"
  >
    <NButton
      quaternary
      circle
      size="small"
      :aria-label="textos.barra.tema"
      :title="textos.barra.tema"
    >
      <template #icon>
        <NIcon><component :is="ICONOS[preferencias.tema]" /></NIcon>
      </template>
    </NButton>
  </NDropdown>
  <NRadioGroup
    v-else
    :value="preferencias.tema"
    size="small"
    :aria-label="t.tema"
    @update:value="(k: TemaUi) => elegir(k)"
  >
    <NRadioButton v-for="k in TEMAS" :key="k" :value="k">
      <span class="opcion">
        <NIcon :size="14"><component :is="ICONOS[k]" /></NIcon>
        {{ t.temas[k] }}
      </span>
    </NRadioButton>
  </NRadioGroup>
</template>

<style scoped>
.opcion {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>

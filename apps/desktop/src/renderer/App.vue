<script setup lang="ts">
import {
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateEsAR,
  esAR,
  useOsTheme,
} from 'naive-ui';
import { computed } from 'vue';
import Marco from './componentes/Marco.vue';
import { temaClaro, temaOscuro } from './tema';

const osTheme = useOsTheme();
const oscuro = computed(() => osTheme.value === 'dark');
</script>

<template>
  <NConfigProvider
    :theme="oscuro ? darkTheme : null"
    :theme-overrides="oscuro ? temaOscuro : temaClaro"
    :locale="esAR"
    :date-locale="dateEsAR"
    abstract
  >
    <NGlobalStyle />
    <NMessageProvider placement="bottom">
      <NNotificationProvider placement="bottom-right">
        <NDialogProvider>
          <!-- Marco vive dentro de los proveedores para poder notificar errores al arrancar. -->
          <Marco />
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

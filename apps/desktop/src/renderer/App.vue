<script setup lang="ts">
import {
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateEnUS,
  dateEsAR,
  dateFrFR,
  datePtBR,
  enUS,
  esAR,
  frFR,
  ptBR,
  useOsTheme,
} from 'naive-ui';
import { computed, watchEffect } from 'vue';
import Marco from './componentes/Marco.vue';
import { idioma } from './i18n';
import { esOscuro, usePreferencias } from './stores/preferencias';
import { mezclar, primarioDe, temaDe } from './tema';

const preferencias = usePreferencias();
const osTheme = useOsTheme();
const oscuro = computed(() => esOscuro(preferencias.tema, osTheme.value === 'dark'));
const ajustesTema = computed(() => temaDe(oscuro.value, preferencias.acento));
const LOCALES_NAIVE = {
  es: [esAR, dateEsAR],
  en: [enUS, dateEnUS],
  pt: [ptBR, datePtBR],
  fr: [frFR, dateFrFR],
} as const;
const locale = computed(() => LOCALES_NAIVE[idioma.value][0]);
const dateLocale = computed(() => LOCALES_NAIVE[idioma.value][1]);

// El acento también llega a los estilos propios (bordes, fondos suaves, el logo).
watchEffect(() => {
  const p = primarioDe(preferencias.acento, oscuro.value);
  const n = Number.parseInt(p.slice(1), 16);
  const raiz = document.documentElement.style;
  raiz.setProperty('--acento', p);
  raiz.setProperty('--acento-rgb', `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`);
  raiz.setProperty('--acento-claro', mezclar(p, 0.15));
  raiz.setProperty('--acento-oscuro', mezclar(p, -0.2));
  document.documentElement.dataset['tema'] = oscuro.value ? 'oscuro' : 'claro';
});
</script>

<template>
  <NConfigProvider
    :theme="oscuro ? darkTheme : null"
    :theme-overrides="ajustesTema"
    :locale="locale"
    :date-locale="dateLocale"
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

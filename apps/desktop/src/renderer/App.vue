<script setup lang="ts">
import {
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateDeDE,
  dateEnUS,
  dateEsAR,
  dateFrFR,
  dateHiIN,
  dateIdID,
  dateItIT,
  dateJaJP,
  dateKoKR,
  dateNlNL,
  datePlPL,
  datePtBR,
  dateRuRU,
  dateTrTR,
  dateUkUA,
  dateZhCN,
  deDE,
  enUS,
  esAR,
  frFR,
  hiIN,
  idID,
  itIT,
  jaJP,
  koKR,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  trTR,
  ukUA,
  useOsTheme,
  zhCN,
} from 'naive-ui';
import { computed, watchEffect } from 'vue';
import Marco from './componentes/Marco.vue';
import { idioma } from './i18n';
import { esOscuro, usePreferencias } from './stores/preferencias';
import { mezclar, primarioDe, temaDe, textoSobre } from './tema';

const preferencias = usePreferencias();
const osTheme = useOsTheme();
const oscuro = computed(() => esOscuro(preferencias.tema, osTheme.value === 'dark'));
const ajustesTema = computed(() => temaDe(oscuro.value, preferencias.acento));
const LOCALES_NAIVE = {
  es: [esAR, dateEsAR],
  en: [enUS, dateEnUS],
  pt: [ptBR, datePtBR],
  fr: [frFR, dateFrFR],
  de: [deDE, dateDeDE],
  it: [itIT, dateItIT],
  ru: [ruRU, dateRuRU],
  zh: [zhCN, dateZhCN],
  ja: [jaJP, dateJaJP],
  ko: [koKR, dateKoKR],
  hi: [hiIN, dateHiIN],
  tr: [trTR, dateTrTR],
  id: [idID, dateIdID],
  pl: [plPL, datePlPL],
  nl: [nlNL, dateNlNL],
  uk: [ukUA, dateUkUA],
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
  raiz.setProperty('--sobre-acento', textoSobre(p));
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

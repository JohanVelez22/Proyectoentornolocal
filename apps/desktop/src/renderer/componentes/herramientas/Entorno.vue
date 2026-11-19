<script setup lang="ts">
import { NAlert } from 'naive-ui';
import { onMounted, ref } from 'vue';
import { api } from '../../api';
import { es } from '../../i18n/es';

const t = es.herramientas.entorno;
const version = ref<string | null>(null);

/** Motores (Chrome/Electron) leídos del agente de usuario: el renderer no ve `process`. */
const motores = (navigator.userAgent.match(/(Chrome|Electron)\/[\d.]+/g) ?? []).join(' · ');

const datos: [string, string][] = [
  [t.navegador, motores || navigator.userAgent],
  [t.plataforma, navigator.platform],
  [t.idioma, navigator.language],
  [t.zona, Intl.DateTimeFormat().resolvedOptions().timeZone],
  [t.nucleos, String(navigator.hardwareConcurrency || '—')],
];

onMounted(async () => {
  try {
    version.value = await api().sistema.version();
  } catch {
    version.value = null;
  }
});
</script>

<template>
  <div class="herr">
    <dl class="herr-datos">
      <dt>{{ t.aplicacion }}</dt>
      <dd>{{ version ?? '—' }}</dd>
      <template v-for="[k, v] in datos" :key="k">
        <dt>{{ k }}</dt>
        <dd>{{ v }}</dd>
      </template>
    </dl>
    <NAlert type="warning" :show-icon="false">{{ t.pendiente }}</NAlert>
  </div>
</template>

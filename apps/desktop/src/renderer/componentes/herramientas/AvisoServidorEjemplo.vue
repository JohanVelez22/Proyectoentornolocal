<script setup lang="ts">
import { NAlert } from 'naive-ui';
import { textos } from '../../i18n';
import { servidorEjemplo } from '../../composables/servidorEjemplo';

/** Aviso pequeño: el servidor de ejemplo está activo en 127.0.0.1:N (guía HTTP y cliente HTTP, D49). */
const t = textos.guias.http;
</script>

<template>
  <NAlert
    v-if="servidorEjemplo.puerto !== null"
    type="info"
    :show-icon="false"
    class="aviso-ejemplo"
  >
    {{ t.servidorActivo(servidorEjemplo.puerto) }}
  </NAlert>
</template>

<style scoped>
.aviso-ejemplo {
  font-size: 12.5px;
}
</style>

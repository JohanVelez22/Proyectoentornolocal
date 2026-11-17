<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { es } from './i18n/es';

const version = ref('');
onMounted(async () => {
  version.value = await window.entorno.sistema.version();
});
</script>

<template>
  <main class="inicio">
    <h1>{{ es.app.nombre }}</h1>
    <p>{{ es.app.version }} {{ version }}</p>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
}
.inicio {
  display: grid;
  place-content: center;
  height: 100vh;
  text-align: center;
}
</style>

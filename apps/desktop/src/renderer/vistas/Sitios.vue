<script setup lang="ts">
import { Globe } from '@vicons/ionicons5';
import { NEmpty, NIcon } from 'naive-ui';
import { es } from '../i18n/es';
</script>

<template>
  <div class="pronto">
    <NEmpty :description="es.sitios.pronto" size="large">
      <template #icon>
        <NIcon><Globe /></NIcon>
      </template>
    </NEmpty>
  </div>
</template>

<style scoped>
.pronto {
  padding: 72px 0;
}
</style>

<script setup lang="ts">
import { NotificationsOutline as IconoCampana } from '@vicons/ionicons5';
import { NBadge, NButton, NIcon } from 'naive-ui';
import { computed } from 'vue';
import { textos } from '../i18n';
import { useAvisos } from '../stores/avisos';

/** Campana de la barra superior con el número de avisos sin leer. */
const emit = defineEmits<{ abrir: [] }>();
const avisos = useAvisos();
const etiqueta = computed(() =>
  avisos.noLeidos > 0 ? textos.avisos.campanaConNuevos(avisos.noLeidos) : textos.avisos.campana,
);
</script>

<template>
  <NBadge :value="avisos.noLeidos" :max="99" :show="avisos.noLeidos > 0" :offset="[-4, 4]">
    <NButton
      quaternary
      circle
      size="small"
      :aria-label="etiqueta"
      :title="etiqueta"
      @click="emit('abrir')"
    >
      <template #icon>
        <NIcon><IconoCampana /></NIcon>
      </template>
    </NButton>
  </NBadge>
</template>

<script setup lang="ts">
import { NotificationsOutline as IconoCampana } from '@vicons/ionicons5';
import { NBadge, NButton, NIcon } from 'naive-ui';
import { computed } from 'vue';
import { textos } from '../i18n';
import { useAvisos } from '../stores/avisos';
import { useProblemas } from '../stores/problemas';
import { cuentaCampana } from '../utilidades/problemas';

/** Campana de la barra superior con el número de avisos sin leer. */
const emit = defineEmits<{ abrir: [] }>();
const avisos = useAvisos();
const problemas = useProblemas();
/** Una sola insignia: avisos sin leer más los problemas detectados (los mismos de Inicio). */
const cuenta = computed(() => cuentaCampana(avisos.noLeidos, problemas.total));
const etiqueta = computed(() =>
  cuenta.value > 0 ? textos.avisos.campanaConNuevos(cuenta.value) : textos.avisos.campana,
);
</script>

<template>
  <NBadge :value="cuenta" :max="99" :show="cuenta > 0" :offset="[-4, 4]">
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

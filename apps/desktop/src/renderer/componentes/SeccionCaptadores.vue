<script setup lang="ts">
import { NSkeleton } from 'naive-ui';
import type { EstadoCaptador, IdCaptador } from '../../shared/api';
import { textos } from '../i18n';
import AvisoPlegable from './AvisoPlegable.vue';
import TarjetaCaptador from './TarjetaCaptador.vue';

defineProps<{
  /** null mientras se lee la lista. */
  captadores: EstadoCaptador[] | null;
  /** Captador con una acción en curso, si hay. */
  ocupado: IdCaptador | null;
  error: string | null;
}>();
const emit = defineEmits<{
  usar: [id: IdCaptador];
  apagar: [id: IdCaptador];
  abrir: [captador: EstadoCaptador];
  instalar: [id: IdCaptador];
}>();

const t = textos.correo;
</script>

<template>
  <section class="captadores" :aria-label="t.seccionCaptadores">
    <h3 class="titulo">{{ t.seccionCaptadores }}</h3>
    <p v-if="error" class="error" role="alert">{{ t.errorLista }}: {{ error }}</p>
    <NSkeleton v-else-if="captadores === null" height="120px" class="esqueleto" />
    <div v-else class="rejilla">
      <TarjetaCaptador
        v-for="c in captadores"
        :key="c.id"
        :captador="c"
        :ocupado="ocupado === c.id"
        @usar="emit('usar', c.id)"
        @apagar="emit('apagar', c.id)"
        @abrir="emit('abrir', c)"
        @instalar="emit('instalar', c.id)"
      />
    </div>
    <!-- Notas largas de seguridad: plegadas, con el título como resumen. -->
    <AvisoPlegable :titulo="textos.avisoPlegable.seguridadBuzones" tipo="info">
      <p class="nota">{{ t.notaDescartados }}</p>
      <p class="nota">{{ t.notaHost }}</p>
    </AvisoPlegable>
  </section>
</template>

<style scoped>
.captadores {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.titulo {
  margin: 0;
  font-size: 15px;
}
.esqueleto {
  border-radius: 12px;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.error {
  margin: 0;
  color: var(--texto-error);
  font-size: 13px;
}
.nota {
  margin: 0 0 6px;
  font-size: var(--wc-texto-sm);
}
.nota:last-child {
  margin-bottom: 0;
}
</style>

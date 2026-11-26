<script setup lang="ts">
import { computed } from 'vue';
import type { EstadoServicio, EstadoTunel } from '../../shared/api';
import { textos } from '../i18n';

/** `aviso`: funciona a medias (p. ej. un sitio al que le falta el hosts); ámbar sin pulso. */
type Estado = EstadoServicio['estado'] | EstadoTunel['estado'] | 'aviso';

const props = withDefaults(
  defineProps<{
    estado: Estado;
    soloPunto?: boolean;
    /** Texto propio en lugar del genérico. */ etiqueta?: string;
  }>(),
  { soloPunto: false, etiqueta: undefined },
);

const tono = computed(() => {
  switch (props.estado) {
    case 'encendido':
    case 'activo':
      return 'ok';
    case 'iniciando':
      return 'espera';
    case 'error':
      return 'error';
    case 'externo':
      return 'externo';
    case 'aviso':
      return 'aviso';
    default:
      return 'apagado';
  }
});

const texto = computed(() => props.etiqueta ?? textos.estado[props.estado]);
</script>

<template>
  <span class="estado-punto" :class="`tono-${tono}`" role="status" :aria-label="texto">
    <span class="punto" aria-hidden="true" />
    <span v-if="!soloPunto" class="texto">{{ texto }}</span>
  </span>
</template>

<style scoped>
.estado-punto {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  /* El texto conserva el color normal (contraste AA); el color va en el punto. */
  color: inherit;
}
.punto {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tono);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tono) 18%, transparent);
  flex: none;
}
.tono-ok {
  --tono: #16a34a;
}
.tono-apagado {
  --tono: #8a8f98;
}
.tono-espera {
  --tono: #d97706;
}
.tono-error {
  --tono: #dc2626;
}
.tono-externo {
  --tono: #2563eb;
}
.tono-aviso {
  --tono: #d97706;
}
.tono-espera .punto::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--tono);
  animation: pulso 1.2s ease-out infinite;
}
@keyframes pulso {
  from {
    transform: scale(1);
    opacity: 0.76;
  }
  to {
    transform: scale(2.6);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tono-espera .punto::after {
    animation: none;
  }
}
</style>

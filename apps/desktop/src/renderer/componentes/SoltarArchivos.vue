<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { abrirInfoArchivo } from '../composables/abrirInfoArchivo';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { instalarSoltarGlobal } from '../utilidades/soltarGlobal';

/**
 * Soltar un archivo o una carpeta en cualquier parte de la ventana abre «Info de archivo» (D55).
 * Solo actúa donde ninguna otra zona de arrastre lo gestiona (ver `soltarGlobal.ts`) y, de paso,
 * evita que Electron navegue al archivo soltado. Muestra una indicación mientras se arrastra.
 */
const t = textos.herramientas.infoArchivo;
const { ejecutar } = useAccion();
const activo = ref(false);
let quitar: (() => void) | null = null;

onMounted(() => {
  quitar = instalarSoltarGlobal(
    {
      addEventListener: (t, fn) => document.addEventListener(t, fn as unknown as EventListener),
      removeEventListener: (t, fn) =>
        document.removeEventListener(t, fn as unknown as EventListener),
    },
    {
      alSoltar: (archivo) => void ejecutar('soltar-info', () => abrirInfoArchivo(archivo)),
      alCambiar: (v) => (activo.value = v),
    },
  );
});
onBeforeUnmount(() => quitar?.());
</script>

<template>
  <Transition name="velo">
    <div v-if="activo" class="velo" aria-hidden="true">
      <div class="caja">{{ t.soltarEnVentana }}</div>
    </div>
  </Transition>
</template>

<style scoped>
.velo {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--acento-rgb), 0.12);
  border: 3px dashed rgba(var(--acento-rgb), 0.7);
  border-radius: 12px;
  /* No intercepta el arrastre: el destino real sigue siendo el elemento de debajo. */
  pointer-events: none;
}
.caja {
  padding: 14px 22px;
  border-radius: 10px;
  background: var(--acento);
  color: var(--sobre-acento);
  font-size: 15px;
  font-weight: 600;
}
.velo-enter-active,
.velo-leave-active {
  transition: opacity 0.12s ease;
}
.velo-enter-from,
.velo-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .velo-enter-active,
  .velo-leave-active {
    transition: none;
  }
}
</style>

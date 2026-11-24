import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { aplicarFoco, type ElementoFoco } from '../utilidades/foco';

const documentoReal = {
  buscar(id: string): ElementoFoco | null {
    // El id se compara como atributo (no como selector): un id raro no rompe nada.
    for (const el of document.querySelectorAll<HTMLElement>('[data-foco]')) {
      if (el.dataset['foco'] === id) return el;
    }
    return null;
  },
};

/**
 * Navegación con foco visual: si la ruta trae `?foco=<id>`, la pantalla hace scroll al elemento con
 * `data-foco="<id>"` y lo resalta con un halo. Se llama una vez desde cada vista que tiene
 * elementos enfocables. Después de usarlo quita `foco` de la ruta, para que volver a pedir el
 * mismo elemento lo resalte otra vez.
 */
export function useFoco(): void {
  const route = useRoute();
  const router = useRouter();
  let cancelar: (() => void) | null = null;

  function activar(): void {
    const foco = route.query['foco'];
    const id = Array.isArray(foco) ? foco[0] : foco;
    // Al quitar `foco` de la ruta (abajo) el resaltado en curso no se corta.
    if (typeof id !== 'string' || id === '') return;
    cancelar?.();
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cancelar = aplicarFoco(documentoReal, id, { reducido });
    const { foco: _quitado, ...resto } = route.query;
    void _quitado;
    void router.replace({ query: resto }).catch(() => undefined);
  }

  onMounted(activar);
  watch(() => route.query['foco'], activar);
  onBeforeUnmount(() => cancelar?.());
}

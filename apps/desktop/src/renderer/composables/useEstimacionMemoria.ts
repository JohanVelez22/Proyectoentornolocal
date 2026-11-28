import { ref } from 'vue';
import type { EstimacionMemoria } from '../../shared/api';

/**
 * Estimación de «Liberar memoria» (D54b) que nunca bloquea la interfaz: se pide al abrir el
 * desplegable y se puede cerrar sin esperar. Cada apertura es una «ronda»; si se cierra (o se
 * vuelve a abrir) antes de que llegue la respuesta, esa ronda queda descartada: ni cambia el
 * estado ni muestra un error.
 */
export function useEstimacionMemoria(
  estimar: () => Promise<EstimacionMemoria>,
  alFallar: (e: unknown) => void,
) {
  const estimacion = ref<EstimacionMemoria | null>(null);
  const calculando = ref(false);
  let ronda = 0;

  /** Empieza una estimación; devuelve true si su resultado sigue vigente al terminar. */
  async function abrir(): Promise<boolean> {
    const mia = ++ronda;
    estimacion.value = null;
    calculando.value = true;
    try {
      const r = await estimar();
      if (mia !== ronda) return false;
      estimacion.value = r;
    } catch (e) {
      if (mia !== ronda) return false;
      alFallar(e);
    }
    calculando.value = false;
    return true;
  }

  /** Cierra o cancela: descarta la estimación en curso sin esperarla. */
  function cerrar(): void {
    ronda++;
    calculando.value = false;
    estimacion.value = null;
  }

  return { estimacion, calculando, abrir, cerrar };
}

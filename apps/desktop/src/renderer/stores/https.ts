import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { EstadoHttps } from '../../shared/api';
import { api } from '../api';

/**
 * Estado de HTTPS (autoridad, puerto y quién lo ocupa) para Sitios y su formulario. Se pide al
 * entrar en Sitios y después de cada guardado; no hay evento que lo empuje.
 */
export const useHttps = defineStore('https', () => {
  const estado = ref<EstadoHttps | null>(null);
  let enVuelo: Promise<void> | null = null;

  /** Una sola lectura a la vez; si falla se conserva lo último conocido (no es imprescindible). */
  function cargar(): Promise<void> {
    enVuelo ??= api()
      .https.estado()
      .then((e) => {
        estado.value = e;
      })
      .catch(() => undefined)
      .finally(() => {
        enVuelo = null;
      });
    return enVuelo;
  }

  return { estado, cargar };
});

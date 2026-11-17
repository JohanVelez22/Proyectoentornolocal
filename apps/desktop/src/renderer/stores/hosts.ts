import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { EstadoHosts, ResultadoSync } from '../../shared/api';
import { api } from '../api';

export const useHosts = defineStore('hosts', () => {
  const estado = ref<EstadoHosts>({ pendientes: [], duplicadosFuera: [] });
  let recibidoPorEvento = false;
  let baja: (() => void) | null = null;

  const pendientes = computed(() => estado.value.pendientes);
  const duplicadosFuera = computed(() => estado.value.duplicadosFuera);

  function aplicar(e: EstadoHosts): void {
    recibidoPorEvento = true;
    estado.value = e;
  }

  /** Carga inicial: si ya llegó un evento, es más nuevo y se conserva. */
  function hidratar(e: EstadoHosts): void {
    if (!recibidoPorEvento) estado.value = e;
  }

  /** El núcleo emite `hosts:estado` al terminar; el store se actualiza por ese evento. */
  function sincronizar(): Promise<ResultadoSync> {
    return api().hosts.sincronizar();
  }

  function iniciar(): void {
    if (baja) return;
    baja = api().on('hosts:estado', aplicar);
  }

  function detener(): void {
    baja?.();
    baja = null;
  }

  return { estado, pendientes, duplicadosFuera, aplicar, hidratar, sincronizar, iniciar, detener };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Sitio } from '../../shared/api';
import { api } from '../api';

export const useSitios = defineStore('sitios', () => {
  const lista = ref<Sitio[]>([]);
  let recibidoPorEvento = false;
  let baja: (() => void) | null = null;

  function aplicar(sitios: Sitio[]): void {
    recibidoPorEvento = true;
    lista.value = sitios;
  }

  /** Carga inicial: si ya llegó un evento, es más nuevo y se conserva. */
  function hidratar(sitios: Sitio[]): void {
    if (!recibidoPorEvento) lista.value = sitios;
  }

  function porId(id: string): Sitio | undefined {
    return lista.value.find((s) => s.id === id);
  }

  function iniciar(): void {
    if (baja) return;
    baja = api().on('sitio:cambio', aplicar);
  }

  function detener(): void {
    baja?.();
    baja = null;
  }

  return { lista, aplicar, hidratar, porId, iniciar, detener };
});

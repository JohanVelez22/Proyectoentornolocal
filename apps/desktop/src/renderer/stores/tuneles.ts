import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { EstadoTunel } from '../../shared/api';
import { api } from '../api';

export const useTuneles = defineStore('tuneles', () => {
  const porSitio = ref<Record<string, EstadoTunel>>({});
  let baja: (() => void) | null = null;

  const activos = computed(() =>
    Object.values(porSitio.value).filter((t) => t.estado === 'activo' && t.url),
  );

  function aplicar(t: EstadoTunel): void {
    porSitio.value[t.sitioId] = t;
  }

  /** Carga inicial: lo que ya llegó por evento es más nuevo y no se pisa. */
  function hidratar(tuneles: EstadoTunel[]): void {
    for (const t of tuneles) if (!porSitio.value[t.sitioId]) porSitio.value[t.sitioId] = t;
  }

  function iniciar(): void {
    if (baja) return;
    baja = api().on('tunel:estado', aplicar);
  }

  function detener(): void {
    baja?.();
    baja = null;
  }

  return { porSitio, activos, aplicar, hidratar, iniciar, detener };
});

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Aviso } from '../../shared/api';
import { api, plano } from '../api';

/** Historial que se conserva en la interfaz (igual que en el núcleo). */
const MAX_AVISOS = 200;

export const useAvisos = defineStore('avisos', () => {
  const lista = ref<Aviso[]>([]);
  const cargado = ref(false);
  let bajas: (() => void)[] = [];

  const noLeidos = computed(() => lista.value.filter((a) => !a.leido).length);

  async function cargar(): Promise<void> {
    const previa = lista.value;
    const recibida = await api().avisos.lista();
    // Lo que llegó por evento durante la carga es más nuevo: se conserva delante.
    const ids = new Set(recibida.map((a) => a.id));
    lista.value = [...previa.filter((a) => !ids.has(a.id)), ...recibida].slice(0, MAX_AVISOS);
    cargado.value = true;
  }

  function agregar(a: Aviso): void {
    if (lista.value.some((x) => x.id === a.id)) return;
    lista.value = [a, ...lista.value].slice(0, MAX_AVISOS);
  }

  function marcarLocal(ids?: string[]): void {
    const set = ids ? new Set(ids) : null;
    lista.value = lista.value.map((a) => (!set || set.has(a.id) ? { ...a, leido: true } : a));
  }

  async function marcarLeidos(ids?: string[]): Promise<void> {
    await api().avisos.marcarLeidos(ids ? plano(ids) : undefined);
    marcarLocal(ids);
  }

  async function limpiar(): Promise<void> {
    await api().avisos.limpiar();
    lista.value = [];
  }

  /**
   * Se suscribe a los eventos (una sola vez). `navegar` lleva a la acción del aviso cuando el
   * usuario hizo clic en su notificación nativa.
   */
  function iniciar(navegar: (a: Aviso) => void): void {
    if (bajas.length > 0) return;
    bajas = [
      api().on('aviso:nuevo', agregar),
      api().on('aviso:abrir', (a) => {
        marcarLocal([a.id]);
        navegar(a);
      }),
    ];
  }

  function detener(): void {
    bajas.forEach((b) => b());
    bajas = [];
  }

  return { lista, cargado, noLeidos, cargar, marcarLeidos, limpiar, iniciar, detener };
});

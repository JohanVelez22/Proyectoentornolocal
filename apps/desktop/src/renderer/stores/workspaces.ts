import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { EstadoWorkspace, ResultadoWorkspace, Workspace } from '../../shared/api';
import { api, plano } from '../api';

export interface UltimaOperacion {
  accion: 'iniciar' | 'detener';
  items: ResultadoWorkspace[];
}

/** Workspaces de arranque: la lista, su estado y lo que dejó la última operación de cada uno. */
export const useWorkspaces = defineStore('workspaces', () => {
  const lista = ref<Workspace[]>([]);
  const estados = ref<Record<string, EstadoWorkspace>>({});
  const ultimas = ref<Record<string, UltimaOperacion>>({});
  const cargado = ref(false);

  async function cargar(): Promise<void> {
    const [l, e] = await Promise.all([api().workspaces.lista(), api().workspaces.estados()]);
    lista.value = l;
    estados.value = e;
    cargado.value = true;
  }

  async function refrescarEstados(): Promise<void> {
    estados.value = await api().workspaces.estados();
  }

  function estadoDe(id: string): EstadoWorkspace {
    return estados.value[id] ?? 'apagado';
  }

  async function guardar(w: Workspace): Promise<void> {
    await api().workspaces.guardar(plano(w));
    await cargar();
  }

  async function borrar(id: string): Promise<void> {
    await api().workspaces.borrar(id);
    olvidarUltima(id);
    await cargar();
  }

  async function operar(id: string, accion: 'iniciar' | 'detener'): Promise<ResultadoWorkspace[]> {
    try {
      const items =
        accion === 'iniciar'
          ? await api().workspaces.iniciar(id)
          : await api().workspaces.detener(id);
      ultimas.value = { ...ultimas.value, [id]: { accion, items } };
      return items;
    } finally {
      await refrescarEstados().catch(() => undefined);
    }
  }

  function olvidarUltima(id: string): void {
    const copia = { ...ultimas.value };
    delete copia[id];
    ultimas.value = copia;
  }

  return {
    lista,
    estados,
    ultimas,
    cargado,
    cargar,
    refrescarEstados,
    estadoDe,
    guardar,
    borrar,
    iniciar: (id: string) => operar(id, 'iniciar'),
    detener: (id: string) => operar(id, 'detener'),
    olvidarUltima,
  };
});

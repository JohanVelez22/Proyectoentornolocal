import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  AccionAsistente,
  EstadoAsistente,
  IdAsistente,
  ResultadoAplicarAsistente,
  VistaPreviaAsistente,
} from '../../shared/api';
import { api } from '../api';

/**
 * «Conectar asistentes»: mirar el estado y la vista previa no escribe nada; `aplicar` lleva la
 * huella de la vista previa y `confirmado: true`, que solo pasa el diálogo de la pantalla.
 */
export const useAsistentes = defineStore('asistentes', () => {
  const estados = ref<EstadoAsistente[]>([]);
  const cargado = ref(false);
  const cargando = ref(false);

  async function cargar(): Promise<void> {
    cargando.value = true;
    try {
      estados.value = await api().asistentes.estado();
      cargado.value = true;
    } finally {
      cargando.value = false;
    }
  }

  const vistaPrevia = (id: IdAsistente, accion: AccionAsistente): Promise<VistaPreviaAsistente> =>
    api().asistentes.vistaPrevia(id, accion);

  async function aplicar(
    id: IdAsistente,
    accion: AccionAsistente,
    huella: string,
    confirmado: true,
  ): Promise<ResultadoAplicarAsistente> {
    try {
      return await api().asistentes.aplicar(id, accion, huella, confirmado);
    } finally {
      await cargar().catch(() => undefined);
    }
  }

  const copiarConfiguracion = (id: IdAsistente): Promise<void> =>
    api().asistentes.copiarConfiguracion(id);
  const abrirCarpeta = (id: IdAsistente): Promise<void> => api().asistentes.abrirCarpeta(id);

  return {
    estados,
    cargado,
    cargando,
    cargar,
    vistaPrevia,
    aplicar,
    copiarConfiguracion,
    abrirCarpeta,
  };
});

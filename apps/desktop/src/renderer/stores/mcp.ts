import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CierreConfirmacion, SolicitudConfirmacion } from '../../shared/api';
import { api } from '../api';

/** Solicitudes que se guardan a la vez (las demás vencen solas en el núcleo). */
export const MAX_COLA_MCP = 20;

/**
 * Cola de confirmaciones del servidor MCP: el diálogo muestra la primera. Una solicitud sale de
 * la cola al responderla o cuando el núcleo avisa que se cerró (vencida, cancelada, detenido).
 */
export const useConfirmacionesMcp = defineStore('confirmacionesMcp', () => {
  const cola = ref<SolicitudConfirmacion[]>([]);
  /** Ids respondidos desde aquí que esperan el aviso de cierre (para no volver a mostrarlos). */
  const respondiendo = ref<string[]>([]);
  const actual = computed(() => cola.value[0] ?? null);
  const total = computed(() => cola.value.length);

  let bajas: (() => void)[] = [];

  function recibir(s: SolicitudConfirmacion): void {
    if (!s || typeof s.id !== 'string' || !s.id) return;
    if (cola.value.some((c) => c.id === s.id) || respondiendo.value.includes(s.id)) return;
    if (cola.value.length >= MAX_COLA_MCP) return;
    cola.value = [...cola.value, s];
  }

  /** Cierre avisado por el núcleo; un id desconocido se ignora. */
  function cerrar(c: CierreConfirmacion): void {
    if (!c || typeof c.id !== 'string') return;
    if (cola.value.some((s) => s.id === c.id)) cola.value = cola.value.filter((s) => s.id !== c.id);
    respondiendo.value = respondiendo.value.filter((id) => id !== c.id);
  }

  /**
   * Responde la solicitud visible y la quita de la cola. Devuelve lo que contestó el núcleo
   * (false si ya no estaba pendiente).
   */
  async function responder(aprobado: boolean): Promise<boolean> {
    const s = actual.value;
    if (!s) return false;
    cola.value = cola.value.filter((x) => x.id !== s.id);
    respondiendo.value = [...respondiendo.value, s.id];
    try {
      return await api().mcp.responderConfirmacion(s.id, aprobado);
    } finally {
      respondiendo.value = respondiendo.value.filter((id) => id !== s.id);
    }
  }

  function iniciar(): void {
    if (bajas.length) return;
    bajas = [api().on('mcp:confirmar', recibir), api().on('mcp:confirmacion-cerrada', cerrar)];
  }

  function detener(): void {
    for (const b of bajas) b();
    bajas = [];
  }

  return { cola, actual, total, recibir, cerrar, responder, iniciar, detener };
});

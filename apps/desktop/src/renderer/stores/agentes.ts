import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { EstadoAgente, IdAgente } from '../../shared/api';
import { api } from '../api';

/**
 * Agentes de programación (Claude Code, Codex, Hermes, Opencode, Gemini CLI, Qwen Code, Copilot CLI, Antigravity). Mirar el estado nunca ejecuta
 * nada del usuario; instalar, registrar y quitar el MCP llevan `confirmado: true`, que solo pasa
 * el diálogo de la pantalla, y abrir un agente es siempre un clic (no hay arranque automático).
 */
export const useAgentes = defineStore('agentes', () => {
  const estados = ref<EstadoAgente[]>([]);
  const cargado = ref(false);
  const cargando = ref(false);
  const instalaciones = new Map<IdAgente, Promise<void>>();
  const enInstalacion = ref<IdAgente[]>([]);

  const porId = computed<Partial<Record<IdAgente, EstadoAgente>>>(() =>
    Object.fromEntries(estados.value.map((e) => [e.id, e])),
  );

  async function cargar(): Promise<void> {
    cargando.value = true;
    try {
      estados.value = await api().agentes.estado();
      cargado.value = true;
    } finally {
      cargando.value = false;
    }
  }

  /** `--version` de un ejecutable suelto: solo cuando el usuario lo pide. */
  async function preguntarVersion(id: IdAgente): Promise<void> {
    const v = await api().agentes.version(id);
    estados.value = estados.value.map((e) => (e.id === id ? { ...e, version: v } : e));
  }

  const instalando = (id: IdAgente): boolean => enInstalacion.value.includes(id);

  /** Una instalación pedida dos veces (doble clic) no corre dos veces. */
  function instalar(id: IdAgente, confirmado: true): Promise<void> {
    const previa = instalaciones.get(id);
    if (previa) return previa;
    enInstalacion.value = [...enInstalacion.value, id];
    const p = (async () => {
      try {
        await api().agentes.instalar(id, confirmado);
      } finally {
        instalaciones.delete(id);
        enInstalacion.value = enInstalacion.value.filter((x) => x !== id);
        await cargar().catch(() => undefined);
      }
    })();
    instalaciones.set(id, p);
    return p;
  }

  /** Abre el agente en el proyecto (la clave, si hay proveedor, la pone el proceso principal). */
  function abrir(id: IdAgente, sitioId: string, proveedorId?: string): Promise<void> {
    return api().agentes.abrir(id, sitioId, proveedorId);
  }

  return {
    estados,
    cargado,
    cargando,
    porId,
    cargar,
    preguntarVersion,
    instalando,
    instalar,
    abrir,
  };
});

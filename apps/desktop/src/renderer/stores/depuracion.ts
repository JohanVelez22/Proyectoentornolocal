import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { Dump, EstadoReceptor, FiltroDumps, ResumenDump } from '../../shared/api';
import { api } from '../api';

/** Espera tras un `dump:nuevo` antes de volver a pedir la lista (agrupa ráfagas). */
const ESPERA_REFRESCO_MS = 150;

/**
 * Pantalla Depuración: estado del receptor, lista en vivo (filtrada en el núcleo) y el volcado
 * elegido. El texto llega como texto plano y se muestra como tal (nunca como HTML).
 */
export const useDepuracion = defineStore('depuracion', () => {
  const estado = ref<EstadoReceptor | null>(null);
  const lista = ref<ResumenDump[]>([]);
  const elegido = ref<Dump | null>(null);
  const filtro = ref<FiltroDumps>({});
  let baja: (() => void) | null = null;
  let temporizador: ReturnType<typeof setTimeout> | null = null;
  let pedido = 0;

  const activo = computed(() => estado.value?.activo === true);

  async function cargarEstado(): Promise<void> {
    estado.value = await api().depuracion.estado();
  }

  /** Pide la lista con el filtro actual; una respuesta vieja no pisa a una nueva. */
  async function refrescar(): Promise<void> {
    const n = ++pedido;
    const f: FiltroDumps = {};
    if (filtro.value.sitioId) f.sitioId = filtro.value.sitioId;
    if (filtro.value.origen) f.origen = filtro.value.origen;
    if (filtro.value.texto?.trim()) f.texto = filtro.value.texto.trim();
    const r = await api().depuracion.lista(f);
    if (n !== pedido) return;
    lista.value = r;
  }

  function programarRefresco(): void {
    if (temporizador) return;
    temporizador = setTimeout(() => {
      temporizador = null;
      void refrescar().catch(() => undefined);
      void cargarEstado().catch(() => undefined);
    }, ESPERA_REFRESCO_MS);
  }

  watch(filtro, () => void refrescar().catch(() => undefined), { deep: true });

  async function elegir(id: string | null): Promise<void> {
    elegido.value = id ? await api().depuracion.leer(id) : null;
  }

  async function activar(v: boolean): Promise<void> {
    estado.value = await api().depuracion.activar(v);
  }

  async function limpiar(): Promise<void> {
    await api().depuracion.limpiar();
    elegido.value = null;
    await refrescar();
    await cargarEstado();
  }

  function iniciar(): void {
    if (baja) return;
    baja = api().on('dump:nuevo', programarRefresco);
  }

  function detener(): void {
    baja?.();
    baja = null;
    if (temporizador) clearTimeout(temporizador);
    temporizador = null;
  }

  return {
    estado,
    lista,
    elegido,
    filtro,
    activo,
    cargarEstado,
    refrescar,
    elegir,
    activar,
    limpiar,
    iniciar,
    detener,
  };
});

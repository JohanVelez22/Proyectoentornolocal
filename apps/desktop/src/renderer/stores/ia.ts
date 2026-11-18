import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ModeloOllama, ProgresoIa } from '../../shared/api';
import { api } from '../api';
import { es } from '../i18n/es';

/** Mensaje claro del núcleo (sin depender de naive-ui, para poder probar el store). */
function mensajeDeError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'string' && e) return e;
  return es.errores.desconocido;
}

const esCancelacion = (e: unknown): boolean =>
  (e as { codigo?: unknown } | null)?.codigo === 'cancelado';

export type FaseIa = 'preparando' | 'descargando' | 'verificando' | 'guardando' | 'listo';

/** Traduce el `status` en inglés que manda Ollama a una fase que la interfaz sabe nombrar. */
export function faseDe(estado: string): FaseIa {
  const e = estado.toLowerCase();
  if (e === 'success') return 'listo';
  if (e.startsWith('pulling manifest')) return 'preparando';
  if (e.startsWith('verifying')) return 'verificando';
  if (e.startsWith('writing') || e.startsWith('removing')) return 'guardando';
  return 'descargando';
}

/** 0–100, o null mientras Ollama no informa el total. */
export function porcentaje(p: { completado: number; total: number }): number | null {
  if (!(p.total > 0)) return null;
  return Math.min(100, Math.round((p.completado / p.total) * 100));
}

export type EstadoDescarga = 'descargando' | 'cancelando' | 'listo' | 'cancelado' | 'error';

export interface DescargaIa {
  /** Nombre tal como lo escribió el usuario. */
  modelo: string;
  estado: EstadoDescarga;
  fase: FaseIa;
  completado: number;
  total: number;
  error?: string;
}

const EN_CURSO: readonly EstadoDescarga[] = ['descargando', 'cancelando'];
const clave = (nombre: string): string => nombre.trim().toLowerCase();

export const useIa = defineStore('ia', () => {
  const modelos = ref<ModeloOllama[] | null>(null);
  const cargandoModelos = ref(false);
  const errorModelos = ref<string | null>(null);
  const espacio = ref<number | null>(null);
  const sugeridos = ref<string[]>([]);
  /** Descargas por nombre de modelo en minúsculas (las terminadas quedan hasta descartarlas). */
  const descargas = ref<Record<string, DescargaIa>>({});
  let baja: (() => void) | null = null;

  const activas = computed(() =>
    Object.values(descargas.value).filter((d) => EN_CURSO.includes(d.estado)),
  );

  function enCurso(nombre: string): boolean {
    const d = descargas.value[clave(nombre)];
    return !!d && EN_CURSO.includes(d.estado);
  }

  function poner(nombre: string, cambios: Partial<DescargaIa>): void {
    const k = clave(nombre);
    const previa = descargas.value[k];
    const base: DescargaIa = previa ?? {
      modelo: nombre.trim(),
      estado: 'descargando',
      fase: 'preparando',
      completado: 0,
      total: 0,
    };
    descargas.value = { ...descargas.value, [k]: { ...base, ...cambios } };
  }

  /** Avance de `ia:progreso`. Un evento tardío no revive una descarga ya terminada o cancelada. */
  function aplicarProgreso(p: ProgresoIa): void {
    const previa = descargas.value[clave(p.modelo)];
    if (previa && !EN_CURSO.includes(previa.estado)) return;
    poner(p.modelo, {
      fase: faseDe(p.estado),
      // Ollama manda una capa a la vez; con total 0 se conserva lo último conocido.
      ...(p.total > 0 ? { completado: p.completado, total: p.total } : {}),
    });
  }

  async function cargarModelos(): Promise<void> {
    cargandoModelos.value = true;
    try {
      modelos.value = await api().ia.modelos();
      errorModelos.value = null;
    } catch (e) {
      modelos.value = null;
      errorModelos.value = mensajeDeError(e);
    } finally {
      cargandoModelos.value = false;
    }
  }

  async function cargarEspacio(): Promise<void> {
    try {
      espacio.value = await api().ia.espacioUsado();
    } catch {
      espacio.value = null;
    }
  }

  async function cargarSugeridos(): Promise<void> {
    if (sugeridos.value.length) return;
    try {
      sugeridos.value = await api().ia.sugeridos();
    } catch {
      sugeridos.value = [];
    }
  }

  /**
   * Descarga un modelo. Nunca lanza: el resultado queda en `descargas` (listo, cancelado o error).
   * Una segunda llamada con el mismo modelo en curso no hace nada.
   */
  async function descargar(nombre: string): Promise<void> {
    const n = nombre.trim();
    if (!n || enCurso(n)) return;
    descargas.value = {
      ...descargas.value,
      [clave(n)]: { modelo: n, estado: 'descargando', fase: 'preparando', completado: 0, total: 0 },
    };
    try {
      await api().ia.descargar(n);
      poner(n, { estado: 'listo', fase: 'listo' });
      await Promise.all([cargarModelos(), cargarEspacio()]);
    } catch (e) {
      const cancelando = descargas.value[clave(n)]?.estado === 'cancelando';
      if (cancelando || esCancelacion(e)) {
        const { error: _sinError, ...resto } = descargas.value[clave(n)] ?? {
          modelo: n,
          fase: 'preparando' as const,
          completado: 0,
          total: 0,
        };
        void _sinError;
        descargas.value = { ...descargas.value, [clave(n)]: { ...resto, estado: 'cancelado' } };
      } else {
        poner(n, { estado: 'error', error: mensajeDeError(e) });
      }
      // Lo descargado a medias también ocupa disco.
      void cargarEspacio();
    }
  }

  /** Pide cancelar; la descarga termina como "cancelada" cuando el núcleo la corta. */
  async function cancelar(nombre: string): Promise<void> {
    const d = descargas.value[clave(nombre)];
    if (!d || d.estado !== 'descargando') return;
    poner(nombre, { estado: 'cancelando' });
    try {
      const habia = await api().ia.cancelar(d.modelo);
      // El núcleo ya no la tenía (terminó justo antes): se resuelve por su propia promesa.
      if (!habia && descargas.value[clave(nombre)]?.estado === 'cancelando') {
        poner(nombre, { estado: 'descargando' });
      }
    } catch (e) {
      if (descargas.value[clave(nombre)]?.estado === 'cancelando') {
        poner(nombre, { estado: 'descargando' });
      }
      throw e;
    }
  }

  /** Quita el aviso de una descarga terminada (lista, cancelada o con error). */
  function descartar(nombre: string): void {
    const k = clave(nombre);
    const d = descargas.value[k];
    if (!d || EN_CURSO.includes(d.estado)) return;
    const copia = { ...descargas.value };
    delete copia[k];
    descargas.value = copia;
  }

  async function borrar(nombre: string): Promise<void> {
    await api().ia.borrar(nombre);
    await Promise.all([cargarModelos(), cargarEspacio()]);
  }

  function probar(nombre: string, texto: string): Promise<string> {
    return api().ia.probar(nombre, texto);
  }

  /** Se suscribe una sola vez: el progreso sigue llegando aunque se cambie de pantalla. */
  function iniciar(): void {
    if (baja) return;
    baja = api().on('ia:progreso', aplicarProgreso);
  }

  function detener(): void {
    baja?.();
    baja = null;
  }

  return {
    modelos,
    cargandoModelos,
    errorModelos,
    espacio,
    sugeridos,
    descargas,
    activas,
    enCurso,
    aplicarProgreso,
    cargarModelos,
    cargarEspacio,
    cargarSugeridos,
    descargar,
    cancelar,
    descartar,
    borrar,
    probar,
    iniciar,
    detener,
  };
});

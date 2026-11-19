import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  EstadoConfianza,
  Hallazgo,
  ResultadoFirefox,
  ResultadoReparacion,
} from '../../shared/api';
import { api } from '../api';

export type GravedadDoctor = Hallazgo['gravedad'];

/** Estado de la reparación de un hallazgo en esta pantalla. */
export type EstadoReparacion =
  | { estado: 'aplicando' }
  | { estado: 'hecha'; codigo?: string; aviso?: string }
  | { estado: 'fallida'; codigo?: string };

const ORDEN: readonly GravedadDoctor[] = ['error', 'aviso', 'info'];

const codigoDe = (e: unknown): string | undefined => {
  const c = (e as { codigo?: unknown } | null)?.codigo;
  return typeof c === 'string' ? c : undefined;
};

/**
 * Hallazgos del Doctor, sus reparaciones y la confianza de la CA (Node, Python, Firefox).
 * Ninguna reparación corre sin `confirmacion: true`, que solo pasa el diálogo de la pantalla.
 */
export const useDoctor = defineStore('doctor', () => {
  const hallazgos = ref<Hallazgo[]>([]);
  const revisando = ref(false);
  const cargado = ref(false);
  const reparaciones = ref<Record<string, EstadoReparacion>>({});
  const confianza = ref<EstadoConfianza | null>(null);
  const enCurso = new Map<string, Promise<void>>();

  const porGravedad = computed(() =>
    ORDEN.map((gravedad) => ({
      gravedad,
      hallazgos: hallazgos.value.filter((h) => h.gravedad === gravedad),
    })).filter((g) => g.hallazgos.length > 0),
  );

  /** Último resultado conocido (también el de la revisión en segundo plano al iniciar). */
  async function cargar(): Promise<void> {
    hallazgos.value = await api().doctor.ultimo();
    cargado.value = true;
  }

  async function revisar(): Promise<void> {
    revisando.value = true;
    try {
      // Sin ids revisa todas las áreas: el resultado ya es el estado completo.
      hallazgos.value = await api().doctor.revisar();
      cargado.value = true;
      reparaciones.value = {};
    } finally {
      revisando.value = false;
    }
  }

  /**
   * Aplica la reparación ya confirmada en el diálogo. Un segundo pedido del mismo hallazgo
   * mientras corre el primero no vuelve a llamar.
   */
  function reparar(
    hallazgoId: string,
    confirmacion: true,
    reparacionId?: 'cambiar-puerto',
  ): Promise<void> {
    const previa = enCurso.get(hallazgoId);
    if (previa) return previa;
    reparaciones.value = { ...reparaciones.value, [hallazgoId]: { estado: 'aplicando' } };
    const p = (async () => {
      let fin: EstadoReparacion;
      try {
        const r: ResultadoReparacion = await api().doctor.reparar(
          hallazgoId,
          confirmacion,
          reparacionId,
        );
        fin = r.ok
          ? {
              estado: 'hecha',
              ...(r.codigo ? { codigo: r.codigo } : {}),
              ...(r.aviso ? { aviso: r.aviso } : {}),
            }
          : { estado: 'fallida', ...(r.codigo ? { codigo: r.codigo } : {}) };
      } catch (e) {
        const codigo = codigoDe(e);
        fin = { estado: 'fallida', ...(codigo ? { codigo } : {}) };
      }
      reparaciones.value = { ...reparaciones.value, [hallazgoId]: fin };
      if (fin.estado === 'hecha') {
        await cargar().catch(() => undefined);
        void cargarConfianza().catch(() => undefined);
      }
    })().finally(() => enCurso.delete(hallazgoId));
    enCurso.set(hallazgoId, p);
    return p;
  }

  async function cargarConfianza(): Promise<void> {
    confianza.value = await api().confianza.estado();
  }

  /** NODE_EXTRA_CA_CERTS del usuario (confirmado en el diálogo). */
  async function cambiarNode(activar: boolean, confirmacion: true): Promise<void> {
    confianza.value = await api().confianza.nodeGlobal(activar, confirmacion);
  }

  /**
   * user.js de los perfiles de Firefox (confirmado en el diálogo); resultado por perfil. Los
   * perfiles fuera de la carpeta de Firefox solo con `confirmacionFuera` (casilla aparte).
   */
  async function cambiarFirefox(
    activar: boolean,
    confirmacion: true,
    confirmacionFuera?: true,
  ): Promise<ResultadoFirefox[]> {
    const r = await api().confianza.firefox(activar, confirmacion, confirmacionFuera);
    await cargarConfianza().catch(() => undefined);
    return r;
  }

  return {
    hallazgos,
    revisando,
    cargado,
    reparaciones,
    confianza,
    porGravedad,
    cargar,
    revisar,
    reparar,
    cargarConfianza,
    cambiarNode,
    cambiarFirefox,
  };
});

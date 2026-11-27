import type { EstadoReverb } from '../../shared/api';

/** Estado del proceso de Reverb tal como lo informa el supervisor. */
export type EstadoProcesoReverb = EstadoReverb['estado'];

/**
 * La tarjeta de Reverb solo se muestra en sitios de confianza que tengan `laravel/reverb`
 * (el núcleo lo resume en `disponible`). Mientras no se sabe (null), tampoco.
 */
export function reverbVisible(e: EstadoReverb | null): boolean {
  return e !== null && e.disponible === true;
}

/** Tipo de etiqueta (Naive UI) para el estado del proceso. */
export function tipoEstadoReverb(
  estado: EstadoProcesoReverb,
): 'success' | 'warning' | 'error' | 'default' {
  switch (estado) {
    case 'encendido':
      return 'success';
    case 'iniciando':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
}

/** ¿El proceso está encendido o arrancando? (el interruptor se ve encendido). */
export function reverbEncendido(e: EstadoReverb | null): boolean {
  return e !== null && e.activo && (e.estado === 'encendido' || e.estado === 'iniciando');
}

/** Id de supervisor del proceso de Reverb de un sitio (`proy-<sitio>-reverb`). */
export function idProcesoReverb(sitioId: string): string {
  return `proy-${sitioId}-reverb`;
}

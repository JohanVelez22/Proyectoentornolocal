import type { FilaVersion } from '../stores/versiones';

/** Lo que se muestra de una versión menor (8.4.x): el último parche y los anteriores plegados. */
export interface PartesRama {
  /** El último parche más cualquier otro que el usuario tenga a mano (instalado, encendido…). */
  visibles: FilaVersion[];
  /** Parches anteriores sin nada que hacer: van dentro del desplegable de la versión menor. */
  anteriores: FilaVersion[];
}

/**
 * Una fila se queda a la vista aunque no sea el último parche si el usuario puede necesitarla:
 * instalada (para desinstalarla o encenderla), encendida, predeterminada, con actualización o
 * bloqueada. Los parches que solo se pueden instalar van al desplegable.
 */
export function quedaALaVista(f: FilaVersion): boolean {
  return f.instalada || f.encendida || f.predeterminada || f.bloqueada || !!f.actualizacion;
}

/**
 * Parte las versiones de una versión menor (de la más nueva a la más vieja, como las entrega el
 * núcleo): el último parche y lo que importa a la vista; el resto, plegado.
 */
export function partirRama(versiones: readonly FilaVersion[]): PartesRama {
  const visibles: FilaVersion[] = [];
  const anteriores: FilaVersion[] = [];
  versiones.forEach((f, i) => (i === 0 || quedaALaVista(f) ? visibles : anteriores).push(f));
  return { visibles, anteriores };
}

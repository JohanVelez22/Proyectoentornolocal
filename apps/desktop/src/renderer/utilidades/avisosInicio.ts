/** Cuántos avisos se ven plegados (dos filas); el resto se abre con «Ver los N». */
export const AVISOS_PLEGADOS = 2;

export interface GrupoAvisos<T> {
  /** Los que se pintan ahora. */
  visibles: T[];
  /** Cuántos quedan escondidos (0 si todo cabe o si está desplegado). */
  ocultos: number;
  total: number;
  /** Hay más avisos que los de la vista plegada (tiene sentido el botón de plegar). */
  plegable: boolean;
}

/**
 * Reparte los avisos de Inicio en una sola tarjeta: plegada enseña los dos primeros; desplegada,
 * todos. Con dos o menos no hay nada que plegar.
 */
export function agruparAvisos<T>(
  avisos: readonly T[],
  desplegado: boolean,
  plegados = AVISOS_PLEGADOS,
): GrupoAvisos<T> {
  const total = avisos.length;
  const plegable = total > plegados;
  const visibles = plegable && !desplegado ? avisos.slice(0, plegados) : [...avisos];
  return { visibles, ocultos: total - visibles.length, total, plegable };
}

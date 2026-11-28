import type { ResultadoBaseVector } from '../../shared/api';

/** Bases que el núcleo no tocó porque son de sitios con datos reales (piden un aviso adicional). */
export function basesConAviso(informe: readonly ResultadoBaseVector[]): string[] {
  return informe.filter((r) => r.estado === 'requiere-aviso').map((r) => r.base);
}

/** Cuántas bases quedaron con la extensión (recién activadas o que ya la tenían). */
export function contarListas(informe: readonly ResultadoBaseVector[]): number {
  return informe.filter((r) => r.estado === 'activada' || r.estado === 'ya-estaba').length;
}

/** Las que aún se pueden elegir: las que ya tienen pgvector no se ofrecen. */
export function elegibles(bases: readonly { base: string; activo: boolean }[]): string[] {
  return bases.filter((b) => !b.activo).map((b) => b.base);
}

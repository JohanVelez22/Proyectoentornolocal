import type { ResultadoBaseVector } from '../../shared/api';

/** Bases que el núcleo no tocó porque son de sitios con datos reales (piden un aviso adicional). */
export function basesConAviso(informe: readonly ResultadoBaseVector[]): string[] {
  return informe.filter((r) => r.estado === 'requiere-aviso').map((r) => r.base);
}

/** Cuántas bases quedaron con la extensión (recién activadas o que ya la tenían). */
export function contarListas(informe: readonly ResultadoBaseVector[]): number {
  return informe.filter((r) => r.estado === 'activada' || r.estado === 'ya-estaba').length;
}

/** Las que aún se pueden elegir: sin pgvector y con un nombre que WolfCore Dev maneja. */
export function elegibles(
  bases: readonly { base: string; activo: boolean; valida?: boolean }[],
): string[] {
  return bases.filter((b) => !b.activo && b.valida !== false).map((b) => b.base);
}

/** Clave de `textos.bd.pgvector.motivos` para cada motivo que informa el núcleo. */
export const CLAVE_MOTIVO = {
  'sin-pgvector': 'sinPgvector',
  'no-existe': 'noExiste',
  permiso: 'permiso',
  conexion: 'conexion',
  'en-uso': 'enUso',
  dependencias: 'dependencias',
  sistema: 'sistema',
  'nombre-no-valido': 'nombreNoValido',
  otro: 'otro',
} as const satisfies Record<NonNullable<ResultadoBaseVector['motivo']>, string>;

export function claveMotivo(
  m: ResultadoBaseVector['motivo'],
): (typeof CLAVE_MOTIVO)[keyof typeof CLAVE_MOTIVO] {
  return CLAVE_MOTIVO[m ?? 'otro'];
}

import type { VersionDisponible } from '../../shared/api';

/** Lo básico del asistente de primer uso: Nginx, PHP 8.4, Composer y Node LTS. */
export interface Basico {
  servicio: 'nginx' | 'php' | 'composer' | 'node';
  /** Solo PHP: la rama que se propone. */
  rama?: string;
}

export const BASICOS: readonly Basico[] = [
  { servicio: 'nginx' },
  { servicio: 'php', rama: '8.4' },
  { servicio: 'composer' },
  { servicio: 'node' },
];

const masNueva = (a: VersionDisponible, b: VersionDisponible): number =>
  b.version.localeCompare(a.version, 'en', { numeric: true });

/**
 * Versión que se propone instalar: la más nueva del catálogo (en PHP, la más nueva de la rama).
 * En Node, la más nueva de una rama LTS (el catálogo en vivo también trae la rama actual).
 */
export function versionBasica(
  b: Basico,
  versiones: readonly VersionDisponible[],
): VersionDisponible | undefined {
  return versiones
    .filter((v) => v.servicio === b.servicio && (!b.rama || v.rama === b.rama))
    .filter((v) => b.servicio !== 'node' || v.soporte === undefined || v.soporte === 'lts')
    .sort(masNueva)[0];
}

/** ¿Ya hay algo instalado que cumpla? En PHP, cualquier versión de la rama. */
export function yaInstalado(b: Basico, instalados: readonly string[]): boolean {
  if (!b.rama) return instalados.length > 0;
  return instalados.some((v) => v === b.rama || v.startsWith(`${b.rama}.`));
}

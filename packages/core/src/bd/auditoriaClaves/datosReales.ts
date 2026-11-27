import path from 'node:path';
import { motorDe, type ObjetivoBd } from '../basesDeDatos';
import { leerBaseDelProyecto, leerEnvAcotado } from '../baseProyecto';

/**
 * ¿La base es la de algún sitio marcado con `datosReales`? Se compara el nombre de la base que
 * declara el `.env` de cada sitio (sin distinguir mayúsculas) y la familia del motor (PostgreSQL
 * por un lado; MySQL y MariaDB por el otro). Ante cualquier duda de un sitio con datos reales, la
 * respuesta es que sí: la confirmación reforzada se pide de más, nunca de menos.
 */
export async function baseDeDatosReales(
  d: {
    sitios: () => Promise<readonly { carpeta: string; datosReales: boolean }[]>;
    baseDe: (carpeta: string) => Promise<{ base: string; motor: string } | null>;
  },
  instancia: ObjetivoBd,
  base: string,
): Promise<boolean> {
  const motor = motorDe(instancia);
  const familia = (m: string): string => (m === 'postgresql' ? 'pg' : 'mysql');
  for (const s of await d.sitios()) {
    if (!s.datosReales) continue;
    let b: { base: string; motor: string } | null;
    try {
      b = await d.baseDe(s.carpeta);
    } catch {
      return true;
    }
    // Un sitio con datos reales que no dice su base (.env ilegible, inexistente o sin usuario):
    // de más, nunca de menos.
    if (!b) return true;
    if (b.base.toLowerCase() === base.toLowerCase() && familia(b.motor) === familia(motor)) {
      return true;
    }
  }
  return false;
}

/**
 * Base que declara un sitio: la de su `.env` (Laravel, CodeIgniter, Symfony…) o, si no hay, el
 * `DB_NAME` de su `wp-config.php` (WordPress). null si no se puede saber.
 */
export async function baseDeSitio(
  carpeta: string,
): Promise<{ base: string; motor: string } | null> {
  const b = await leerBaseDelProyecto(carpeta).catch(() => null);
  if (b) return { base: b.base, motor: b.motor };
  const wp = await leerEnvAcotado(path.join(carpeta, 'wp-config.php'));
  const nombre =
    wp === null ? undefined : /define\(\s*['"]DB_NAME['"]\s*,\s*['"]([^'"]+)['"]/.exec(wp)?.[1];
  return nombre ? { base: nombre, motor: 'mysql' } : null;
}

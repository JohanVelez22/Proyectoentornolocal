import { motorDe, type ObjetivoBd } from '../basesDeDatos';

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
    if (!b) continue;
    if (b.base.toLowerCase() === base.toLowerCase() && familia(b.motor) === familia(motor)) {
      return true;
    }
  }
  return false;
}

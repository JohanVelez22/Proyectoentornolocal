import { realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname } from 'node:path';

/**
 * Gancho de la prueba de humo (D51): el diálogo nativo no se puede manejar desde `humo.mjs`, así
 * que «Elegir carpeta» puede devolver la carpeta que la prueba prepara. Solo vale si se cumplen
 * TRES condiciones a la vez, para que ningún entorno de un usuario normal lo active:
 *
 * 1. `WOLFCORE_DATOS` está definida (carpeta de datos aislada);
 * 2. `--wolfcore-humo` está en los argumentos (solo lo pasa `humo.mjs`);
 * 3. el `realpath` de `WOLFCORE_HUMO_CARPETA` es una carpeta directamente dentro del `realpath`
 *    de la carpeta temporal del sistema y su nombre empieza por `wolfcore-humo-disco-`.
 */
export const ARG_HUMO = '--wolfcore-humo';
export const PREFIJO_CARPETA_HUMO = 'wolfcore-humo-disco-';

const comparable = (r: string): string => (process.platform === 'win32' ? r.toLowerCase() : r);

export async function carpetaDeHumo(
  env: Record<string, string | undefined>,
  argv: readonly string[],
): Promise<string | null> {
  const carpeta = env['WOLFCORE_HUMO_CARPETA'];
  if (!env['WOLFCORE_DATOS'] || !argv.includes(ARG_HUMO) || !carpeta) return null;
  try {
    const real = await realpath(carpeta);
    const temporal = await realpath(tmpdir());
    if (
      comparable(dirname(real)) !== comparable(temporal) ||
      !basename(real).startsWith(PREFIJO_CARPETA_HUMO)
    ) {
      return null;
    }
    return carpeta;
  } catch {
    return null;
  }
}

import { rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { NOMBRE_CARPETA, NOMBRE_CARPETA_ANTERIOR, rutaBasePorDefecto } from './rutas';

const existe = (p: string): Promise<boolean> =>
  stat(p).then(
    () => true,
    () => false,
  );

/**
 * Pasa la carpeta de datos del nombre anterior (Proyectoentornolocal) a WolfCoreDev.
 * - 'migrada': la vieja existía y la nueva no; se renombró.
 * - 'omitida': existen las dos; no se toca ninguna (el usuario decide qué hacer).
 * - 'sin-cambios': no había nada que migrar.
 */
export async function migrarCarpetaDatos(
  env: NodeJS.ProcessEnv = process.env,
  plataforma: NodeJS.Platform = process.platform,
): Promise<'migrada' | 'sin-cambios' | 'omitida'> {
  const nueva = rutaBasePorDefecto(env, plataforma);
  const vieja = path.join(path.dirname(nueva), NOMBRE_CARPETA_ANTERIOR);
  if (path.basename(nueva) !== NOMBRE_CARPETA) return 'sin-cambios';
  const hayVieja = await existe(vieja);
  const hayNueva = await existe(nueva);
  if (!hayVieja) return 'sin-cambios';
  if (hayNueva) return 'omitida';
  await rename(vieja, nueva);
  return 'migrada';
}

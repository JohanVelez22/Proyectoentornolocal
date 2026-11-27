import os from 'node:os';
import path from 'node:path';

export const NOMBRE_CARPETA = 'WolfCoreDev';
export const NOMBRE_CARPETA_ANTERIOR = 'Proyectoentornolocal';

/** Carpeta de datos por defecto según el sistema (en Windows, %LOCALAPPDATA%\WolfCoreDev). */
export function rutaBasePorDefecto(
  env: NodeJS.ProcessEnv = process.env,
  plataforma: NodeJS.Platform = process.platform,
): string {
  const nombre = NOMBRE_CARPETA;
  if (plataforma === 'win32') {
    const local =
      env.LOCALAPPDATA ?? path.win32.join(env.USERPROFILE ?? os.homedir(), 'AppData', 'Local');
    return path.win32.join(local, nombre);
  }
  if (plataforma === 'darwin') {
    return path.posix.join(os.homedir(), 'Library', 'Application Support', nombre);
  }
  const datos = env.XDG_DATA_HOME ?? path.posix.join(os.homedir(), '.local', 'share');
  return path.posix.join(datos, nombre);
}

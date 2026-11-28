import { existsSync } from 'node:fs';
import path from 'node:path';
import { esRutaDeUnidad } from './raizSistema';
import { existeEntrada } from './terminalWin';

/** Existe el archivo, o la entrada (el alias de la Tienda `winget.exe` da EACCES con `stat`). */
export const existeConAlias = (ruta: string): boolean => existsSync(ruta) || existeEntrada(ruta);

/**
 * winget (Instalador de aplicaciones) por ruta absoluta: solo el alias de
 * `%LOCALAPPDATA%\Microsoft\WindowsApps`. Si falta, null (se avisa; nunca se lanza por nombre ni
 * se busca en el PATH, donde un `winget.exe` plantado se ejecutaría).
 */
export function rutaWinget(
  entorno: NodeJS.ProcessEnv,
  existe: (ruta: string) => boolean = existeConAlias,
): string | null {
  const local = entorno.LOCALAPPDATA;
  if (!local || !esRutaDeUnidad(local)) return null;
  const ruta = path.win32.join(local, 'Microsoft', 'WindowsApps', 'winget.exe');
  return existe(ruta) ? ruta : null;
}

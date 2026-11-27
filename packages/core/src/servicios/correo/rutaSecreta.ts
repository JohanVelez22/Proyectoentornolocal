import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Archivo, dentro de la carpeta de datos del captador, con su ruta base secreta. */
export const ARCHIVO_RUTA_WEB = 'ruta-web';

const FORMA = /^[0-9a-f]{32}$/;

export type Restringir = (ruta: string) => Promise<unknown>;

/** Lee la ruta secreta guardada, o null si no hay una válida. Nunca lanza. */
export async function leerRutaSecreta(datos: string): Promise<string | null> {
  try {
    const t = (await readFile(path.join(datos, ARCHIVO_RUTA_WEB), 'utf8')).trim();
    return FORMA.test(t) ? t : null;
  } catch {
    return null;
  }
}

/**
 * La ruta base secreta de la web del captador: 128 bits aleatorios por instalación, guardados en
 * su carpeta de datos y legibles solo por el usuario. Si el archivo falta o está dañado se crea
 * otra (la anterior deja de valer).
 */
export async function rutaSecretaDe(datos: string, restringir?: Restringir): Promise<string> {
  const actual = await leerRutaSecreta(datos);
  if (actual) return actual;
  await mkdir(datos, { recursive: true });
  const nueva = randomBytes(16).toString('hex');
  const archivo = path.join(datos, ARCHIVO_RUTA_WEB);
  await writeFile(archivo, `${nueva}\n`, { encoding: 'utf8', mode: 0o600 });
  // Si no se puede restringir, el archivo queda con los permisos de la carpeta del usuario.
  await restringir?.(archivo).catch(() => undefined);
  return nueva;
}

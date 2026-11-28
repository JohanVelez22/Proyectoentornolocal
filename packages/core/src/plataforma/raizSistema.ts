import { existsSync } from 'node:fs';
import path from 'node:path';

/** Respaldo cuando ninguna variable del entorno da una carpeta de Windows válida. */
export const RAIZ_RESPALDO = 'C:\\Windows';

/** Variables que dicen dónde está Windows, por orden de preferencia. */
const VARIABLES = ['SystemRoot', 'SYSTEMROOT', 'windir'] as const;

/** Con unidad (nada de UNC ni relativas), sin caracteres de ruta inválidos y sin tramos `..`. */
export const esRutaDeUnidad = (r: string): boolean =>
  /^[A-Za-z]:\\[^"<>|?*\0]*$/.test(r) && !/(^|[\\/])\.\.([\\/]|$)/.test(r);

const conocidas = new Map<string, boolean>();

/** ¿Hay un Windows de verdad ahí? (`System32\kernel32.dll`; se recuerda por proceso). */
function windowsReal(raiz: string): boolean {
  const clave = raiz.toLowerCase();
  let ok = conocidas.get(clave);
  if (ok === undefined) {
    ok = existsSync(path.win32.join(raiz, 'System32', 'kernel32.dll'));
    conocidas.set(clave, ok);
  }
  return ok;
}

/**
 * ÚNICO criterio de la carpeta de Windows del repositorio: SystemRoot, SYSTEMROOT o windir si es
 * una ruta con unidad, sin `..` ni UNC y, con el entorno del propio proceso (o si se pasa
 * `existe`, que recibe la carpeta), con `System32\kernel32.dll` dentro; si no, `C:\Windows`.
 * Nunca se deja que una variable manipulada (ni el PATH) decida qué ejecutable de Windows corre.
 * Con un entorno ajeno (pruebas) solo se exige la forma de la ruta.
 */
export function raizSistema(
  entorno: NodeJS.ProcessEnv,
  existe: ((raiz: string) => boolean) | undefined = entorno === process.env
    ? windowsReal
    : undefined,
): string {
  for (const v of VARIABLES) {
    const r = entorno[v];
    if (r && esRutaDeUnidad(r) && (!existe || existe(r))) return r;
  }
  return RAIZ_RESPALDO;
}

/** Ejecutable o carpeta de System32 por ruta absoluta (nunca del PATH ni de la carpeta actual). */
export const rutaSistema32 = (entorno: NodeJS.ProcessEnv, ...partes: string[]): string =>
  path.win32.join(raizSistema(entorno), 'System32', ...partes);

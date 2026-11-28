import { spawn } from 'node:child_process';
import { win32 } from 'node:path';
import { validarRutaRecursoRed } from '@pel/core';

/**
 * Abre una carpeta compartida de otro equipo (D53, «Mi red») con `explorer.exe` por su ruta
 * absoluta (`%SystemRoot%\explorer.exe`), sin shell y con la ruta UNC como único argumento. Solo
 * se llama desde el proceso principal y la ruta se revalida aquí (`\<IPv4 privada>\<recurso>`),
 * así que ni un nombre ni un argumento raros llegan al sistema. No usa `shell.openPath`.
 */

/** Lanza un programa sin shell; se inyecta para probarlo (ninguna prueba abre nada de verdad). */
export type LanzadorSinShell = (exe: string, args: string[]) => void;

export const lanzarSinShell: LanzadorSinShell = (exe, args) => {
  const hijo = spawn(exe, args, { shell: false, stdio: 'ignore', detached: true });
  // Un fallo al arrancar (explorer no está, sin permisos) no debe tumbar la aplicación.
  hijo.on('error', () => undefined);
  hijo.unref();
};

/** Ruta absoluta de `explorer.exe` en la carpeta del sistema. */
export function rutaExplorer(entorno: NodeJS.ProcessEnv = process.env): string {
  const raiz = entorno['SystemRoot'] ?? entorno['SYSTEMROOT'] ?? 'C:\\Windows';
  // Siempre con separadores de Windows: explorer.exe solo existe allí (y así las pruebas dan lo mismo en CI).
  return win32.join(raiz, 'explorer.exe');
}

export function abrirRecursoEnExplorador(
  ruta: unknown,
  lanzar: LanzadorSinShell = lanzarSinShell,
  entorno: NodeJS.ProcessEnv = process.env,
): void {
  lanzar(rutaExplorer(entorno), [validarRutaRecursoRed(ruta)]);
}

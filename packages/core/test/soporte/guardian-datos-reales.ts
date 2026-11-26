/**
 * Guardián: ninguna prueba puede usar la carpeta de datos real del usuario
 * (%LOCALAPPDATA%\WolfCoreDev en Windows, ~/Library/Application Support/WolfCoreDev en macOS,
 * $XDG_DATA_HOME/WolfCoreDev en Linux).
 *
 * 1. Si `WOLFCORE_DATOS` resuelve a la carpeta real, se aborta antes de correr nada.
 * 2. `LOCALAPPDATA` y `XDG_DATA_HOME` se apuntan a una carpeta temporal propia de este proceso de
 *    pruebas: así, un `Nucleo` o una plataforma creados sin `base` explícita caen en esa carpeta y
 *    nunca en la real. El valor original queda en `WOLFCORE_LOCALAPPDATA_ORIGINAL` por si una prueba
 *    lo necesita leer (no escribir).
 */
import { mkdtempSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NOMBRE = 'WolfCoreDev';

function comparable(ruta: string): string {
  let r = path.resolve(ruta);
  try {
    r = realpathSync.native(r);
  } catch {
    // Puede no existir: se compara la ruta resuelta.
  }
  return process.platform === 'win32' || process.platform === 'darwin' ? r.toLowerCase() : r;
}

function carpetasReales(): string[] {
  const env = process.env;
  const lista: string[] = [];
  const local = env.WOLFCORE_LOCALAPPDATA_ORIGINAL || env.LOCALAPPDATA;
  if (local) lista.push(path.join(local, NOMBRE));
  lista.push(path.join(os.homedir(), 'AppData', 'Local', NOMBRE));
  lista.push(path.join(os.homedir(), 'Library', 'Application Support', NOMBRE));
  lista.push(path.join(env.WOLFCORE_XDG_ORIGINAL || env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), NOMBRE));
  return [...new Set(lista.map(comparable))];
}

function dentroDe(hija: string, padre: string): boolean {
  const rel = path.relative(padre, hija);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

const reales = carpetasReales();
const datos = process.env.WOLFCORE_DATOS;
if (datos && datos.trim() !== '') {
  const d = comparable(datos);
  if (reales.some((r) => dentroDe(d, r) || dentroDe(r, d))) {
    throw new Error(
      `Guardián de datos reales: WOLFCORE_DATOS (${datos}) apunta a la carpeta de datos real o la contiene. Las pruebas abortan.`,
    );
  }
}

if (!process.env.WOLFCORE_GUARDIAN_SANDBOX) {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'wolfcore-pruebas-'));
  process.env.WOLFCORE_LOCALAPPDATA_ORIGINAL = process.env.LOCALAPPDATA ?? '';
  process.env.WOLFCORE_XDG_ORIGINAL = process.env.XDG_DATA_HOME ?? '';
  process.env.LOCALAPPDATA = path.join(sandbox, 'Local');
  process.env.XDG_DATA_HOME = path.join(sandbox, 'share');
  process.env.WOLFCORE_GUARDIAN_SANDBOX = sandbox;
}

export const CARPETAS_DATOS_REALES = reales;

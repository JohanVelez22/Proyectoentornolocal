import { existsSync } from 'node:fs';
import path from 'node:path';
import { lanzarSeparado, type LanzadorSeparado } from './terminal';

export const MENSAJE_SIN_VSCODE =
  'No se encontró Visual Studio Code. Instálelo (code.visualstudio.com) o agregue "code" al PATH.';

export interface DepsEditor {
  entorno?: NodeJS.ProcessEnv;
  existe?: (ruta: string) => boolean;
  lanzar?: LanzadorSeparado;
}

const W = path.win32;

/** Valor de una variable de entorno sin distinguir mayúsculas (Path, PATH…). */
function variable(env: NodeJS.ProcessEnv, nombre: string): string | undefined {
  const clave = Object.keys(env).find((k) => k.toLowerCase() === nombre.toLowerCase());
  return clave === undefined ? undefined : env[clave];
}

/**
 * Code.exe de VS Code: primero el del `code.cmd` que haya en el PATH (Code.exe está una carpeta
 * arriba de `bin`); si no, las rutas típicas (instalación de usuario y de sistema). null si no
 * está. Se lanza Code.exe y no code.cmd: un .cmd necesitaría shell.
 */
export function buscarVsCode(d: DepsEditor = {}): string | null {
  const env = d.entorno ?? process.env;
  const existe = d.existe ?? existsSync;
  const candidatos: string[] = [];
  for (const dir of (variable(env, 'PATH') ?? '').split(';')) {
    const limpio = dir.trim().replace(/^"|"$/g, '');
    if (!limpio || !W.isAbsolute(limpio)) continue;
    if (existe(W.join(limpio, 'code.cmd'))) candidatos.push(W.join(W.dirname(limpio), 'Code.exe'));
  }
  const local = variable(env, 'LOCALAPPDATA');
  if (local) candidatos.push(W.join(local, 'Programs', 'Microsoft VS Code', 'Code.exe'));
  for (const pf of [variable(env, 'ProgramFiles'), variable(env, 'ProgramFiles(x86)')]) {
    if (pf) candidatos.push(W.join(pf, 'Microsoft VS Code', 'Code.exe'));
  }
  if (!variable(env, 'ProgramFiles')) {
    candidatos.push(W.join('C:\\Program Files', 'Microsoft VS Code', 'Code.exe'));
  }
  return candidatos.find((c) => existe(c)) ?? null;
}

/**
 * Abre la carpeta en VS Code, con ventana propia (como "Terminal aquí") y la carpeta como un
 * argumento (sin shell). Quita ELECTRON_RUN_AS_NODE: con esa variable Code.exe correría como
 * Node en vez de abrir el editor.
 */
export async function abrirEnVsCode(carpeta: string, d: DepsEditor = {}): Promise<void> {
  const exe = buscarVsCode(d);
  if (!exe) throw new Error(MENSAJE_SIN_VSCODE);
  const env: NodeJS.ProcessEnv = { ...(d.entorno ?? process.env) };
  for (const k of Object.keys(env)) {
    if (k.toUpperCase() === 'ELECTRON_RUN_AS_NODE') delete env[k];
  }
  await (d.lanzar ?? lanzarSeparado)(exe, [carpeta], { cwd: carpeta, env });
}

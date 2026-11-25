import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { EditorDisponible, IdEditor } from './tipos';
import { buscarVsCode } from './vscodeWin';

const W = path.win32;

export interface DepsEditoresWindows {
  existe?: (ruta: string) => boolean;
  /** Nombres de una carpeta (para las versiones de PhpStorm); [] si no se puede leer. */
  listar?: (carpeta: string) => string[];
}

const NOMBRES: Record<IdEditor, string> = {
  vscode: 'Visual Studio Code',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  phpstorm: 'PhpStorm',
  sublime: 'Sublime Text',
  zed: 'Zed',
  notepadpp: 'Notepad++',
};

function variable(env: NodeJS.ProcessEnv, nombre: string): string | undefined {
  const clave = Object.keys(env).find((k) => k.toLowerCase() === nombre.toLowerCase());
  const v = clave === undefined ? undefined : env[clave];
  return v && W.isAbsolute(v) ? v : undefined;
}

function listarReal(carpeta: string): string[] {
  try {
    return readdirSync(carpeta);
  } catch {
    return [];
  }
}

/**
 * Editores de Windows instalados. Solo mira archivos en rutas conocidas (carpetas de instalación
 * del usuario y del sistema; para VS Code, además el `code.cmd` del PATH). Nunca ejecuta nada ni
 * toma programas de carpetas desconocidas. Orden fijo, el de `IDS_EDITOR`.
 */
export function editoresWindows(
  entorno: NodeJS.ProcessEnv,
  d: DepsEditoresWindows = {},
): EditorDisponible[] {
  const existe = d.existe ?? existsSync;
  const listar = d.listar ?? listarReal;
  const local = variable(entorno, 'LOCALAPPDATA');
  const pfs = [
    variable(entorno, 'ProgramFiles'),
    variable(entorno, 'ProgramW6432'),
    variable(entorno, 'ProgramFiles(x86)'),
  ].filter((x, i, a): x is string => x !== undefined && a.indexOf(x) === i);
  if (pfs.length === 0) pfs.push('C:\\Program Files');
  const deUsuario = (...partes: string[]): string[] => (local ? [W.join(local, ...partes)] : []);

  const phpstorm: string[] = [];
  for (const pf of pfs) {
    const jb = W.join(pf, 'JetBrains');
    for (const n of listar(jb)
      .filter((x) => /^PhpStorm[\w. -]*$/.test(x))
      .sort()
      .reverse()) {
      phpstorm.push(W.join(jb, n, 'bin', 'phpstorm64.exe'));
    }
  }

  const candidatos: Record<Exclude<IdEditor, 'vscode'>, string[]> = {
    cursor: deUsuario('Programs', 'cursor', 'Cursor.exe'),
    windsurf: deUsuario('Programs', 'Windsurf', 'Windsurf.exe'),
    phpstorm,
    sublime: pfs.flatMap((pf) => [
      W.join(pf, 'Sublime Text', 'sublime_text.exe'),
      W.join(pf, 'Sublime Text 3', 'sublime_text.exe'),
    ]),
    zed: deUsuario('Programs', 'Zed', 'zed.exe'),
    notepadpp: pfs.map((pf) => W.join(pf, 'Notepad++', 'notepad++.exe')),
  };

  const res: EditorDisponible[] = [];
  const code = buscarVsCode({ entorno, existe });
  if (code) res.push({ id: 'vscode', nombre: NOMBRES.vscode, ruta: code });
  for (const [id, rutas] of Object.entries(candidatos) as [IdEditor, string[]][]) {
    const ruta = rutas.find((r) => existe(r));
    if (ruta) res.push({ id, nombre: NOMBRES[id], ruta });
  }
  const orden = Object.keys(NOMBRES);
  return res.sort((a, b) => orden.indexOf(a.id) - orden.indexOf(b.id));
}

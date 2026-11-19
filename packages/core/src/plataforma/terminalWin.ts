import { spawn } from 'node:child_process';
import path from 'node:path';
import { literalPowerShell } from './lanzarOculto';
import type { OpcionesAbrirTerminal } from './tipos';

/** Lanza un proceso separado de nosotros y con ventana propia (sin shell). */
export type LanzadorSeparado = (
  cmd: string,
  args: string[],
  opts: { cwd: string; env: NodeJS.ProcessEnv },
) => Promise<void>;

export const lanzarSeparado: LanzadorSeparado = (cmd, args, opts) =>
  new Promise((resolve, reject) => {
    const hijo = spawn(cmd, args, {
      cwd: opts.cwd,
      env: opts.env,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    hijo.once('error', reject);
    hijo.once('spawn', () => {
      hijo.unref();
      resolve();
    });
  });

export interface DepsTerminalWindows {
  entorno: NodeJS.ProcessEnv;
  existe: (ruta: string) => boolean;
  lanzar: LanzadorSeparado;
}

/** Argumento para la línea de PowerShell: tal cual si es seguro, si no entre comillas simples. */
const argPowerShell = (a: string): string =>
  /^[A-Za-z0-9_.:=\\/-]+$/.test(a) ? a : literalPowerShell(a);

/**
 * Terminal visible en `cwd`: Windows Terminal (ventana nueva) si está; si no, PowerShell. El
 * entorno es el de `entorno` más `o.env`.
 */
export async function abrirTerminalWindows(
  cwd: string,
  o: OpcionesAbrirTerminal,
  d: DepsTerminalWindows,
): Promise<void> {
  const env: NodeJS.ProcessEnv = { ...d.entorno, ...o.env };
  const comando = o.comando ?? [];
  const local = d.entorno.LOCALAPPDATA;
  const wt = local ? path.win32.join(local, 'Microsoft', 'WindowsApps', 'wt.exe') : null;
  // wt parte su línea de órdenes en cada `;` (aun entre comillas): con un `;` se usa PowerShell.
  if (wt && d.existe(wt) && !comando.some((a) => a.includes(';'))) {
    // La carpeta no viaja como argumento: "-d ." es el directorio de trabajo, que ya es `cwd`.
    // Ventana nueva para que la pestaña reciba este entorno.
    await d.lanzar(wt, ['-w', 'new', '-d', '.', ...comando], { cwd, env });
    return;
  }
  // Comillas simples de PowerShell, también las tipográficas (’ cierra una cadena '…').
  const ir = `Set-Location -LiteralPath ${literalPowerShell(cwd)}`;
  const linea =
    comando.length > 0
      ? `${ir}; & ${literalPowerShell(comando[0]!)}${comando
          .slice(1)
          .map((a) => ` ${argPowerShell(a)}`)
          .join('')}`
      : ir;
  await d.lanzar('powershell.exe', ['-NoExit', '-Command', linea], { cwd, env });
}

/**
 * Programa interactivo en una consola PowerShell visible (p. ej. `gh auth login`). Los argumentos
 * seguros van tal cual; los demás, entre comillas simples.
 */
export function comandoConsolaVisible(
  ejecutable: string,
  args: string[],
): { cmd: string; args: string[] } {
  return {
    cmd: 'powershell.exe',
    args: [
      '-NoExit',
      '-Command',
      `& ${literalPowerShell(ejecutable)}${args.map((a) => ` ${argPowerShell(a)}`).join('')}`,
    ],
  };
}

import { execFile, spawn } from 'node:child_process';
import { lstatSync } from 'node:fs';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { literalPowerShell } from './lanzarOculto';
import type { IdTerminal, OpcionesAbrirTerminal, TerminalDisponible } from './tipos';

/** Lanza un proceso separado de nosotros y con ventana propia (sin shell). */
export type LanzadorSeparado = (
  cmd: string,
  args: string[],
  opts: { cwd: string; env: NodeJS.ProcessEnv },
) => Promise<void>;

/**
 * Lanza un programa con ventana GUI propia (VS Code, Windows Terminal). NO sirve para programas
 * de consola (PowerShell, cmd): `detached` en Windows es DETACHED_PROCESS (sin consola) y
 * `stdio: 'ignore'` les da NUL como entrada; PowerShell arranca, lee el fin de la entrada y se
 * cierra sin mostrar nada. Para esos, `lanzarEnConsolaNueva`.
 */
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

/**
 * Un argumento en la línea de órdenes de Windows (reglas de CommandLineToArgvW): tal cual si no
 * tiene espacios ni comillas; si no, entre comillas dobles con las barras previas a una comilla
 * (y las del final) duplicadas.
 */
export function citarArgWindows(a: string): string {
  if (a !== '' && !/[\s"]/.test(a)) return a;
  let r = '"';
  let barras = 0;
  for (const c of a) {
    if (c === '\\') {
      barras++;
      continue;
    }
    r += c === '"' ? `${'\\'.repeat(barras * 2 + 1)}"` : `${'\\'.repeat(barras)}${c}`;
    barras = 0;
  }
  return `${r}${'\\'.repeat(barras * 2)}"`;
}

/** Script de PowerShell en UTF-16LE y base64 para `-EncodedCommand`. */
const codificar = (script: string): string => Buffer.from(script, 'utf16le').toString('base64');

/** PowerShell 5 del sistema (ruta completa si se conoce SystemRoot; si no, por el PATH). */
export function powershellDelSistema(entorno: NodeJS.ProcessEnv): string {
  const raiz = entorno.SystemRoot ?? entorno.SYSTEMROOT ?? entorno.windir;
  return raiz
    ? path.win32.join(raiz, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    : 'powershell.exe';
}

/**
 * Invocación de un PowerShell OCULTO que abre `cmd` en una consola nueva con
 * `Process.Start` (UseShellExecute): la consola es del sistema (en Windows 11, la terminal
 * predeterminada, p. ej. Windows Terminal), el programa hereda el entorno del PowerShell oculto
 * (el nuestro, con las variables del proyecto) y arranca en `cwd`, asignada como texto literal.
 * No se usa `Start-Process`: su `-WorkingDirectory` trata `[ ]` como comodines y, sin él, la
 * consola arranca en la carpeta de PowerShell.
 */
export function invocacionConsolaNueva(
  cmd: string,
  args: string[],
  cwd: string,
  entorno: NodeJS.ProcessEnv,
): { cmd: string; args: string[] } {
  const linea = args.map(citarArgWindows).join(' ');
  const script = [
    "$ErrorActionPreference = 'Stop'",
    '$i = New-Object System.Diagnostics.ProcessStartInfo',
    `$i.FileName = ${literalPowerShell(cmd)}`,
    `$i.Arguments = ${literalPowerShell(linea)}`,
    `$i.WorkingDirectory = ${literalPowerShell(cwd)}`,
    '$i.UseShellExecute = $true',
    '[void][System.Diagnostics.Process]::Start($i)',
  ].join('\n');
  return {
    cmd: powershellDelSistema(entorno),
    args: [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-EncodedCommand',
      codificar(script),
    ],
  };
}

/** Plazo del PowerShell oculto que abre la consola. */
const PLAZO_CONSOLA_MS = 30_000;

/**
 * Abre un programa de consola en una ventana nueva y visible (ver `invocacionConsolaNueva`).
 * Espera al PowerShell oculto: si `Process.Start` falla, lanza `terminal.no_abrio` en vez de
 * no mostrar nada.
 */
export const lanzarEnConsolaNueva: LanzadorSeparado = (cmd, args, opts) =>
  new Promise((resolve, reject) => {
    const inv = invocacionConsolaNueva(cmd, args, opts.cwd, opts.env);
    execFile(
      inv.cmd,
      inv.args,
      {
        cwd: opts.cwd,
        env: opts.env,
        windowsHide: true,
        encoding: 'utf8',
        timeout: PLAZO_CONSOLA_MS,
      },
      (err, _stdout, stderr) => {
        if (!err) {
          resolve();
          return;
        }
        const detalle = String(stderr ?? '')
          .trim()
          .split(/\r?\n/)
          .slice(0, 3)
          .join(' ');
        reject(
          new ErrorWolf(
            'terminal.no_abrio',
            `No se pudo abrir la terminal: ${detalle || err.message}`,
          ),
        );
      },
    );
  });

/**
 * ¿Existe la entrada? A diferencia de `existsSync`, también ve los alias de ejecución de la
 * Tienda (`%LOCALAPPDATA%\Microsoft\WindowsApps\wt.exe`): son puntos de reanálisis cuyo `stat`
 * da EACCES, y `existsSync` responde false aunque el alias funcione.
 */
export function existeEntrada(ruta: string): boolean {
  try {
    lstatSync(ruta);
    return true;
  } catch {
    return false;
  }
}

export interface DepsTerminalWindows {
  entorno: NodeJS.ProcessEnv;
  existe: (ruta: string) => boolean;
  /** Programas de consola (PowerShell, pwsh, cmd, Git Bash): siempre en una consola nueva. */
  lanzar: LanzadorSeparado;
  /** Windows Terminal sin variables propias (programa con ventana propia). */
  lanzarGui?: LanzadorSeparado;
}

/** Rutas candidatas de cada terminal de Windows, en orden de preferencia. */
function candidatosWindows(
  e: NodeJS.ProcessEnv,
): Record<Exclude<IdTerminal, 'sistema' | 'gnome-terminal' | 'konsole' | 'iterm'>, string[]> {
  const j = path.win32.join;
  const raiz = e.SystemRoot ?? e.SYSTEMROOT ?? e.windir;
  const local = e.LOCALAPPDATA;
  const apps = local ? j(local, 'Microsoft', 'WindowsApps') : null;
  const programas = [e.ProgramFiles, e.ProgramW6432, e['ProgramFiles(x86)']].filter(
    (x): x is string => Boolean(x),
  );
  return {
    'windows-terminal': apps ? [j(apps, 'wt.exe')] : [],
    powershell: raiz ? [j(raiz, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')] : [],
    pwsh: [
      ...programas.map((p) => j(p, 'PowerShell', '7', 'pwsh.exe')),
      ...(apps ? [j(apps, 'pwsh.exe')] : []),
    ],
    cmd: raiz ? [j(raiz, 'System32', 'cmd.exe')] : [],
    'git-bash': [
      ...programas.map((p) => j(p, 'Git', 'git-bash.exe')),
      ...(local ? [j(local, 'Programs', 'Git', 'git-bash.exe')] : []),
    ],
  };
}

const NOMBRES_WINDOWS: Record<string, string> = {
  'windows-terminal': 'Windows Terminal',
  powershell: 'Windows PowerShell',
  pwsh: 'PowerShell 7',
  cmd: 'Símbolo del sistema (cmd)',
  'git-bash': 'Git Bash',
};

/** Terminales de Windows instaladas (solo mira archivos; no ejecuta nada). */
export function terminalesWindows(
  entorno: NodeJS.ProcessEnv,
  existe: (ruta: string) => boolean,
): TerminalDisponible[] {
  const res: TerminalDisponible[] = [];
  for (const [id, rutas] of Object.entries(candidatosWindows(entorno))) {
    const ruta = rutas.find((r) => existe(r));
    if (ruta) res.push({ id: id as IdTerminal, nombre: NOMBRES_WINDOWS[id]!, ruta });
  }
  return res;
}

/** Argumento para la línea de PowerShell: tal cual si es seguro, si no entre comillas simples. */
const argPowerShell = (a: string): string =>
  /^[A-Za-z0-9_.:=\\/-]+$/.test(a) ? a : literalPowerShell(a);

/** Línea de PowerShell: ir a `cwd` y, si hay, ejecutar el comando. */
function lineaPowerShell(cwd: string, comando: string[]): string {
  // Comillas simples de PowerShell, también las tipográficas (’ cierra una cadena '…').
  const ir = `Set-Location -LiteralPath ${literalPowerShell(cwd)}`;
  return comando.length > 0
    ? `${ir}; & ${literalPowerShell(comando[0]!)}${comando
        .slice(1)
        .map((a) => ` ${argPowerShell(a)}`)
        .join('')}`
    : ir;
}

/**
 * Terminal visible en `cwd` con el entorno `entorno` + `o.env`.
 *
 * - Sin `o.terminal`: Windows PowerShell (en Windows 11 la consola la muestra la terminal
 *   predeterminada del sistema, que puede ser Windows Terminal).
 * - `windows-terminal`: `wt -w new` solo si no hay variables propias. Con variables (la clave y
 *   el token de un agente, el PATH del proyecto) nunca se usa `wt`: la ventana la puede crear un
 *   proceso de Windows Terminal ya abierto, con SU entorno, y las variables no llegarían. Se abre
 *   PowerShell, hijo nuestro, que las recibe siempre.
 * - `cmd` y `git-bash` no ejecutan un `comando`: con comando se usa PowerShell.
 *
 * Una terminal elegida que no está instalada lanza `terminal.no_instalada`.
 */
export async function abrirTerminalWindows(
  cwd: string,
  o: OpcionesAbrirTerminal,
  d: DepsTerminalWindows,
): Promise<void> {
  const env: NodeJS.ProcessEnv = { ...d.entorno, ...o.env };
  const comando = o.comando ?? [];
  const disponibles = terminalesWindows(d.entorno, d.existe);
  const ruta = (id: IdTerminal): string | null =>
    disponibles.find((t) => t.id === id)?.ruta ?? null;
  const elegida = o.terminal ?? null;
  if (elegida && !ruta(elegida)) {
    throw new ErrorWolf(
      'terminal.no_instalada',
      `La terminal elegida no está instalada: ${NOMBRES_WINDOWS[elegida] ?? elegida}`,
      { nombre: NOMBRES_WINDOWS[elegida] ?? elegida },
    );
  }
  const conVariables = Object.values(o.env ?? {}).some((v) => v !== undefined);
  // wt parte su línea de órdenes en cada `;` (aun entre comillas): con un `;` se usa PowerShell.
  if (elegida === 'windows-terminal' && !conVariables && !comando.some((a) => a.includes(';'))) {
    await (d.lanzarGui ?? lanzarSeparado)(
      ruta('windows-terminal')!,
      ['-w', 'new', '-d', '.', ...comando],
      { cwd, env },
    );
    return;
  }
  if (elegida === 'cmd' && comando.length === 0) {
    await d.lanzar(ruta('cmd')!, ['/K'], { cwd, env });
    return;
  }
  if (elegida === 'git-bash' && comando.length === 0) {
    await d.lanzar(ruta('git-bash')!, [`--cd=${cwd}`], { cwd, env });
    return;
  }
  const shell = elegida === 'pwsh' ? ruta('pwsh')! : powershellDelSistema(d.entorno);
  // La línea va codificada: ninguna comilla de la carpeta o del comando pasa por otro analizador.
  await d.lanzar(shell, ['-NoExit', '-EncodedCommand', codificar(lineaPowerShell(cwd, comando))], {
    cwd,
    env,
  });
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
      '-EncodedCommand',
      codificar(
        `& ${literalPowerShell(ejecutable)}${args.map((a) => ` ${argPowerShell(a)}`).join('')}`,
      ),
    ],
  };
}

/** Script de un `-EncodedCommand` (pruebas y registros de diagnóstico). */
export const decodificarComando = (b64: string): string =>
  Buffer.from(b64, 'base64').toString('utf16le');

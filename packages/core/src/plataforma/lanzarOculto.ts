import * as childProcess from 'node:child_process';
import path from 'node:path';

/**
 * Lanza un servidor en segundo plano en Windows sin que aparezca ninguna ventana, ni la suya
 * ni la de los procesos que él cree, y sin que muera al cerrar WolfCore Dev.
 *
 * Por qué así:
 * - `spawn(..., { detached: true })` crea el proceso SIN consola (DETACHED_PROCESS). Los hijos
 *   que crea el servidor (cada conexión de PostgreSQL, el mysqld que vigila el monitor de
 *   MySQL, los forks de Redis…) no heredan consola y Windows les abre una nueva y visible: con
 *   Windows Terminal como terminal por defecto aparecía una ventana por cada uno.
 * - Sin `detached`, libuv mete al hijo en un "job" que muere con la aplicación.
 * - Aquí un PowerShell sin `detached` (consola propia oculta, `windowsHide`) arranca el servidor
 *   con `Process.Start`: el servidor comparte esa consola oculta (sus hijos también), hereda
 *   la salida al log y queda fuera del job (libuv permite "silent breakaway" a los nietos).
 *   PowerShell termina enseguida y devuelve el PID real del servidor como código de salida
 *   (los PID de Windows son múltiplos de 4: 0–3 indican un fallo).
 */
export type LanzadorOculto = (
  def: { comando: string; args: string[]; cwd?: string; env?: Record<string, string> },
  /** Descriptor del log: recibe la salida estándar y de errores del servidor. */
  fd: number,
) => Promise<number>;

/** Cita un argumento para la línea de comandos de Windows (reglas de CommandLineToArgvW). */
export function citarArgumento(a: string): string {
  if (a === '') return '""';
  if (!/[\s"]/.test(a)) return a;
  let r = '"';
  let barras = 0;
  for (const ch of a) {
    if (ch === '\\') {
      barras++;
      continue;
    }
    if (ch === '"') {
      r += '\\'.repeat(barras * 2 + 1) + '"';
    } else {
      r += '\\'.repeat(barras) + ch;
    }
    barras = 0;
  }
  return r + '\\'.repeat(barras * 2) + '"';
}

/** Literal de PowerShell entre comillas simples. */
const literal = (t: string): string => `'${t.replace(/'/g, "''")}'`;

/** Script de PowerShell que arranca el servidor y sale con su PID. */
export function scriptLanzamiento(def: { comando: string; args: string[]; cwd?: string }): string {
  const lineaArgs = def.args.map(citarArgumento).join(' ');
  return [
    'try {',
    `  $i = [System.Diagnostics.ProcessStartInfo]::new(${literal(def.comando)}, ${literal(lineaArgs)})`,
    ...(def.cwd ? [`  $i.WorkingDirectory = ${literal(def.cwd)}`] : []),
    '  $i.UseShellExecute = $false',
    '  $p = [System.Diagnostics.Process]::Start($i)',
    '  exit $p.Id',
    '} catch {',
    '  [Console]::Error.WriteLine($_.Exception.Message)',
    '  exit 1',
    '}',
  ].join('\n');
}

const powershell = (): string =>
  path.win32.join(
    process.env.SystemRoot ?? 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );

const LIMITE_MS = 30_000;

export function crearLanzadorOculto(
  spawnFn: typeof childProcess.spawn = childProcess.spawn,
): LanzadorOculto {
  return (def, fd) =>
    new Promise<number>((resolve, reject) => {
      const script = scriptLanzamiento(def);
      const hijo = spawnFn(
        powershell(),
        [
          '-NoLogo',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-EncodedCommand',
          Buffer.from(script, 'utf16le').toString('base64'),
        ],
        {
          // Sin `detached`: así tiene consola (oculta) y el servidor la hereda.
          windowsHide: true,
          ...(def.cwd ? { cwd: def.cwd } : {}),
          env: { ...process.env, ...def.env },
          stdio: ['ignore', fd, fd],
        },
      );
      const limite = setTimeout(() => {
        hijo.kill();
        reject(new Error('el lanzador no respondió a tiempo'));
      }, LIMITE_MS);
      hijo.once('error', (e) => {
        clearTimeout(limite);
        reject(e);
      });
      hijo.once('exit', (codigo) => {
        clearTimeout(limite);
        if (typeof codigo === 'number' && codigo >= 4 && codigo % 4 === 0) resolve(codigo);
        else reject(new Error('el ejecutable no se pudo lanzar (vea el log del servicio)'));
      });
    });
}

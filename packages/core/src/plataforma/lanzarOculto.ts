import * as childProcess from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm } from 'node:fs/promises';
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

/**
 * Literal de PowerShell entre comillas simples. PowerShell también trata como comilla simple las
 * tipográficas ‘ ’ ‚ ‛ (p. ej. un perfil "Johan’s"): se duplican todas, si no cortarían el
 * literal y el resto se ejecutaría como código.
 */
export const literalPowerShell = (t: string): string => `'${t.replace(/['‘’‚‛]/g, '$&$&')}'`;
const literal = literalPowerShell;

/** El lanzador no puede usarse en este equipo (PowerShell ausente o restringido): se usa el spawn clásico. */
export class LanzadorNoDisponible extends Error {}

/** Código de salida del script cuando PowerShell no está en modo de lenguaje completo. */
export const CODIGO_RESTRINGIDO = 2;

/**
 * Script de PowerShell que arranca el servidor, deja su PID en `archivoPid` (si se indica) y sale
 * con ese PID como código.
 */
export function scriptLanzamiento(
  def: { comando: string; args: string[]; cwd?: string },
  archivoPid?: string,
): string {
  const lineaArgs = def.args.map(citarArgumento).join(' ');
  return [
    // Constrained Language Mode (AppLocker/WDAC) no permite ::new ni Process.Start.
    `if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') { exit ${CODIGO_RESTRINGIDO} }`,
    'try {',
    `  $i = [System.Diagnostics.ProcessStartInfo]::new(${literal(def.comando)}, ${literal(lineaArgs)})`,
    ...(def.cwd ? [`  $i.WorkingDirectory = ${literal(def.cwd)}`] : []),
    '  $i.UseShellExecute = $false',
    '  $p = [System.Diagnostics.Process]::Start($i)',
    ...(archivoPid
      ? [`  [System.IO.File]::WriteAllText(${literal(archivoPid)}, [string]$p.Id)`]
      : []),
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

/** Un código de salida es un PID posible: positivo, de 32 bits con signo y múltiplo de 4. */
export const pareceUnPid = (codigo: unknown): codigo is number =>
  typeof codigo === 'number' &&
  Number.isInteger(codigo) &&
  codigo > 0 &&
  codigo < 2 ** 31 &&
  codigo % 4 === 0;

export interface OpcionesLanzadorOculto {
  spawn?: typeof childProcess.spawn;
  /** Confirma que el PID devuelto es el ejecutable lanzado. */
  procesoVivo: (pid: number) => Promise<{ vivo: boolean; ejecutable?: string }>;
  /** Para cerrar el servidor si el lanzador se colgó después de arrancarlo. */
  matarArbol: (pid: number) => Promise<void>;
  /** Carpeta del archivo temporal con el PID (p. ej. rutas.tmp()). */
  carpetaTmp: string;
  limiteMs?: number;
}

export function crearLanzadorOculto(o: OpcionesLanzadorOculto): LanzadorOculto {
  const spawnFn = o.spawn ?? childProcess.spawn;
  return async (def, fd) => {
    await mkdir(o.carpetaTmp, { recursive: true });
    const archivoPid = path.join(o.carpetaTmp, `lanzar-${randomUUID()}.pid`);
    try {
      const codigo = await new Promise<number | null>((resolve, reject) => {
        let hijo: childProcess.ChildProcess;
        try {
          hijo = spawnFn(
            powershell(),
            [
              '-NoLogo',
              '-NoProfile',
              '-NonInteractive',
              '-ExecutionPolicy',
              'Bypass',
              '-EncodedCommand',
              Buffer.from(scriptLanzamiento(def, archivoPid), 'utf16le').toString('base64'),
            ],
            {
              // Sin `detached`: así tiene consola (oculta) y el servidor la hereda.
              windowsHide: true,
              ...(def.cwd ? { cwd: def.cwd } : {}),
              env: { ...process.env, ...def.env },
              stdio: ['ignore', fd, fd],
            },
          );
        } catch (e) {
          reject(new LanzadorNoDisponible(e instanceof Error ? e.message : String(e)));
          return;
        }
        const limite = setTimeout(() => {
          hijo.kill();
          reject(new Error('el lanzador no respondió a tiempo'));
        }, o.limiteMs ?? LIMITE_MS);
        hijo.once('error', (e) => {
          clearTimeout(limite);
          // PowerShell no existe o no se puede ejecutar.
          reject(new LanzadorNoDisponible(e.message));
        });
        hijo.once('exit', (c) => {
          clearTimeout(limite);
          resolve(c);
        });
      }).catch(async (e: unknown) => {
        // Si el servidor llegó a arrancar antes del cuelgue, no se deja sin seguimiento.
        const pid = Number((await readFile(archivoPid, 'utf8').catch(() => '')).trim());
        if (pareceUnPid(pid)) await o.matarArbol(pid).catch(() => undefined);
        throw e;
      });
      if (codigo === CODIGO_RESTRINGIDO) {
        throw new LanzadorNoDisponible('PowerShell está restringido en este equipo');
      }
      if (!pareceUnPid(codigo)) {
        throw new Error('el ejecutable no se pudo lanzar (vea el log del servicio)');
      }
      const info = await o.procesoVivo(codigo);
      const esperado = path.win32.basename(def.comando).toLowerCase();
      if (!info.vivo) throw new Error('el servicio terminó nada más arrancar (vea su log)');
      if (info.ejecutable !== undefined && info.ejecutable.toLowerCase() !== esperado) {
        throw new Error('el lanzador devolvió un proceso que no es el servicio');
      }
      return codigo;
    } finally {
      await rm(archivoPid, { force: true }).catch(() => undefined);
    }
  };
}

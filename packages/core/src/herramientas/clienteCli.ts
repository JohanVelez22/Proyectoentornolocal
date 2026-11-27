import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import {
  NOMBRE_EXE,
  NOMBRE_VERSION_EXE,
  compilarLanzadorWin,
  type ResultadoLanzador,
} from '../plataforma/lanzadorWin';
import type { Ejecutor } from '../plataforma/tipos';
import type { Rutas } from '../rutas';

/** De dónde sale el cliente `wolf` que la app copia a `bin/cli/` (D32). */
export interface OrigenClienteCli {
  /** El ejecutable de la app: corre el cliente como Node (`ELECTRON_RUN_AS_NODE=1`). */
  exe: string;
  /** El cliente ya compilado (`out/cli/wolf.cjs`). */
  script: string;
  /** Solo sin empaquetar (dev): la carpeta de la app, para que `--abrir` lance Electron con ella. */
  carpetaApp?: string;
}

export const NOMBRE_CMD = 'wolf.cmd';
export const NOMBRE_SCRIPT = 'wolf.cjs';
/** Script sh para Git Bash (y shells de Unix): sin extensión, fin de línea LF. */
export const NOMBRE_SH = 'wolf';
/** Datos del lanzador (ruta de la app): se reescribe en cada instalación, el `.exe` no cambia. */
export const NOMBRE_RUNTIME = 'wolf.runtime';

/** Mensaje en los cuatro idiomas (solo ASCII: un `.cmd` no sabe de páginas de códigos). */
export const MENSAJES_SIN_APP: readonly string[] = [
  'wolf: no se encuentra WolfCore Dev. Abra la app de nuevo para repararlo.',
  'wolf: WolfCore Dev was not found. Open the app again to repair it.',
  'wolf: WolfCore Dev nao foi encontrado. Abra o app de novo para repara-lo.',
  'wolf: WolfCore Dev est introuvable. Rouvrez l application pour le reparer.',
];

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/;

function exigirRuta(r: string): void {
  if (CONTROL.test(r) || r.includes('"') || r.length === 0) {
    throw new ErrorWolf(
      'cli.ruta_invalida',
      'La ruta del programa no se puede escribir en wolf.cmd.',
    );
  }
}

/** Una ruta que va entre comillas en un `.cmd`: sin comillas ni saltos y con `%` duplicado. */
function rutaParaCmd(r: string): string {
  exigirRuta(r);
  return r.replace(/%/g, '%%');
}

const CHCP = '"%SystemRoot%\\System32\\chcp.com"';

/**
 * Contenido de `wolf.cmd`: corre `wolf.cjs` (de la misma carpeta) con el Electron de la app como
 * Node. Es el respaldo de `wolf.exe`: un `.cmd` recibe los argumentos ya troceados por cmd.exe
 * (un `&` o `|` sin comillas se ejecuta ANTES de llegar aquí; ningún `.cmd` puede evitarlo), por
 * eso PowerShell y cmd usan `wolf.exe` cuando existe. `setlocal` hace que `ELECTRON_RUN_AS_NODE`
 * viva solo en este proceso. Ninguna orden se llama sin ruta absoluta (un `chcp.bat` en la carpeta
 * actual se ejecutaría): solo órdenes internas de cmd y rutas completas. Con letras fuera de ASCII
 * en la ruta usa UTF-8 mientras corre y devuelve la página de códigos al terminar.
 */
export function contenidoWolfCmd(o: { exe: string; carpetaApp?: string }): string {
  const exe = rutaParaCmd(o.exe);
  const app = o.carpetaApp === undefined ? undefined : rutaParaCmd(o.carpetaApp);
  // eslint-disable-next-line no-control-regex
  const noAscii = [exe, app ?? ''].some((r) => /[^\u0000-\u007f]/.test(r));
  const l: string[] = [
    '@echo off',
    'rem Generado por WolfCore Dev: se reescribe al abrir la app. No lo edite.',
    'setlocal DisableDelayedExpansion',
    `if not exist "${exe}" (`,
    ...MENSAJES_SIN_APP.map((m) => `  echo ${m.replace(/[()&|<>^%]/g, ' ')} 1>&2`),
    '  exit /b 3',
    ')',
  ];
  if (noAscii) {
    l.push(
      'set "WOLF_CP="',
      `for /f "tokens=2 delims=:." %%a in ('${CHCP}') do set "WOLF_CP=%%a"`,
      `${CHCP} 65001 >nul`,
    );
  }
  l.push('set "ELECTRON_RUN_AS_NODE=1"');
  // Sin empaquetar la app recibe su carpeta; empaquetada, la variable se vacía (no se hereda).
  l.push(app !== undefined ? `set "WOLFCORE_APP_DIR=${app}"` : 'set "WOLFCORE_APP_DIR="');
  l.push(`"${exe}" "%~dp0${NOMBRE_SCRIPT}" %*`);
  if (noAscii) {
    l.push(
      'set "WOLF_RC=%ERRORLEVEL%"',
      `if defined WOLF_CP ${CHCP} %WOLF_CP% >nul`,
      'exit /b %WOLF_RC%',
    );
  } else {
    l.push('exit /b %ERRORLEVEL%');
  }
  return `${l.join('\r\n')}\r\n`;
}

/** Entre comillas simples de sh: una `'` interna se cierra, se escapa y se reabre. */
const comillasSh = (t: string): string => `'${t.replace(/'/g, `'\\''`)}'`;

/**
 * Script sh de `bin/cli/wolf` para Git Bash: fin de línea LF (con CRLF, sh no arranca). Los
 * argumentos pasan tal cual (`"$@"`): sh no los reinterpreta.
 */
export function contenidoWolfSh(o: { exe: string; carpetaApp?: string }): string {
  exigirRuta(o.exe);
  if (o.carpetaApp !== undefined) exigirRuta(o.carpetaApp);
  const l = [
    '#!/bin/sh',
    '# Generado por WolfCore Dev: se reescribe al abrir la app. No lo edite.',
    `if [ ! -f ${comillasSh(o.exe)} ]; then`,
    ...MENSAJES_SIN_APP.map((m) => `  echo ${comillasSh(m)} >&2`),
    '  exit 3',
    'fi',
    o.carpetaApp !== undefined
      ? `WOLFCORE_APP_DIR=${comillasSh(o.carpetaApp)}; export WOLFCORE_APP_DIR`
      : 'unset WOLFCORE_APP_DIR',
    `ELECTRON_RUN_AS_NODE=1 exec ${comillasSh(o.exe)} "$(dirname -- "$0")/${NOMBRE_SCRIPT}" "$@"`,
    '',
  ];
  return l.join('\n');
}

/** `wolf.runtime`: la ruta de la app y, en dev, su carpeta (dos líneas, UTF-8). */
export function contenidoRuntime(o: { exe: string; carpetaApp?: string }): string {
  exigirRuta(o.exe);
  if (o.carpetaApp !== undefined) exigirRuta(o.carpetaApp);
  return `${o.exe}\n${o.carpetaApp ?? ''}\n`;
}

/**
 * Lanzador mínimo en C# (compilado con el `csc.exe` de .NET Framework que trae Windows, sin
 * dependencias): arranca la app como Node con CreateProcess y los argumentos entre comillas como
 * manda CommandLineToArgvW. No pasa por cmd.exe: `&`, `|`, `<`, `>`, `^` y `%` llegan literales.
 */
export const FUENTE_LANZADOR = `using System;
using System.Diagnostics;
using System.IO;
using System.Text;

static class Wolf
{
    static string Quote(string a)
    {
        if (a.Length > 0 && a.IndexOfAny(new[] { ' ', '\\t', '\\n', '\\v', '"' }) < 0) return a;
        var sb = new StringBuilder("\\"");
        for (int i = 0; i < a.Length; i++)
        {
            int bs = 0;
            while (i < a.Length && a[i] == '\\\\') { bs++; i++; }
            if (i == a.Length) { sb.Append('\\\\', bs * 2); break; }
            if (a[i] == '"') { sb.Append('\\\\', bs * 2 + 1); sb.Append('"'); }
            else { sb.Append('\\\\', bs); sb.Append(a[i]); }
        }
        sb.Append('"');
        return sb.ToString();
    }

    static int Main(string[] args)
    {
        // Ctrl+C lo recibe también el cliente (que cierra bien); el lanzador espera su código de salida.
        Console.CancelKeyPress += (s, e) => e.Cancel = true;
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        string exe = null, app = null;
        try
        {
            string[] cfg = File.ReadAllLines(Path.Combine(dir, "${NOMBRE_RUNTIME}"), Encoding.UTF8);
            if (cfg.Length > 0) exe = cfg[0].Trim();
            if (cfg.Length > 1 && cfg[1].Trim().Length > 0) app = cfg[1].Trim();
        }
        catch { }
        if (string.IsNullOrEmpty(exe) || !Path.IsPathRooted(exe) || !File.Exists(exe))
        {
${MENSAJES_SIN_APP.map((m) => `            Console.Error.WriteLine("${m}");`).join('\n')}
            return 3;
        }
        var sb = new StringBuilder();
        sb.Append(Quote(Path.Combine(dir, "${NOMBRE_SCRIPT}")));
        foreach (string a in args) sb.Append(' ').Append(Quote(a));
        var psi = new ProcessStartInfo(exe, sb.ToString());
        psi.UseShellExecute = false;
        psi.EnvironmentVariables["ELECTRON_RUN_AS_NODE"] = "1";
        psi.EnvironmentVariables.Remove("WOLFCORE_APP_DIR");
        if (app != null) psi.EnvironmentVariables["WOLFCORE_APP_DIR"] = app;
        try
        {
            using (Process p = Process.Start(psi))
            {
                p.WaitForExit();
                return p.ExitCode;
            }
        }
        catch { return 3; }
    }
}
`;

/** La versión del lanzador es el hash de su fuente: cambiarla vuelve a compilar, sin marca manual. */
export const VERSION_LANZADOR = createHash('sha256')
  .update(FUENTE_LANZADOR)
  .digest('hex')
  .slice(0, 16);

/** Compila `wolf.exe` si hace falta (ver `plataforma/lanzadorWin.ts`). */
export function asegurarLanzadorExe(
  carpeta: string,
  d: { ejecutar: Ejecutor; csc: string | null },
): Promise<ResultadoLanzador> {
  return compilarLanzadorWin(carpeta, {
    ...d,
    fuente: FUENTE_LANZADOR,
    version: VERSION_LANZADOR,
  });
}

/** Escribe el archivo entero en un temporal y lo mueve: nunca queda a medias. */
async function escribirAtomico(destino: string, contenido: Buffer | string): Promise<void> {
  const tmp = `${destino}.${process.pid}.tmp`;
  await writeFile(tmp, contenido);
  await rename(tmp, destino).catch(async (e: unknown) => {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  });
}

export interface DepsInstalarCli {
  /** Para compilar `wolf.exe` (solo Windows). Sin esto no se intenta. */
  ejecutar?: Ejecutor;
  csc?: string | null;
}

/**
 * Copia el cliente a `bin/cli/` (carpeta propia de WolfCore Dev) y escribe `wolf.cmd`, `wolf` (sh),
 * `wolf.runtime` y, si se puede compilar, `wolf.exe`, con la ruta real de la app. Se repite al abrir
 * la app, para seguir a una actualización que cambió la ruta. Devuelve si hay `wolf.exe`.
 */
export async function instalarClienteCli(
  rutas: Rutas,
  o: OrigenClienteCli,
  d: DepsInstalarCli = {},
): Promise<{ exe: boolean; bloqueado: boolean }> {
  const carpeta = rutas.cliCliente();
  await mkdir(carpeta, { recursive: true });
  const base = { exe: o.exe, ...(o.carpetaApp ? { carpetaApp: o.carpetaApp } : {}) };
  // Antes de copiar nada: si algo no se puede armar, no queda un cliente a medias.
  const cmd = contenidoWolfCmd(base);
  const sh = contenidoWolfSh(base);
  const runtime = contenidoRuntime(base);
  await escribirAtomico(path.join(carpeta, NOMBRE_SCRIPT), await readFile(o.script));
  await escribirAtomico(path.join(carpeta, NOMBRE_RUNTIME), runtime);
  await escribirAtomico(path.join(carpeta, NOMBRE_SH), sh);
  await escribirAtomico(path.join(carpeta, NOMBRE_CMD), cmd);
  const r = d.ejecutar
    ? await asegurarLanzadorExe(carpeta, { ejecutar: d.ejecutar, csc: d.csc ?? null })
    : 'sin-csc';
  return { exe: r === 'ok', bloqueado: r === 'bloqueado' };
}

/** Quita lo que escribió `instalarClienteCli` (solo esos archivos; la carpeta, si queda vacía). */
export async function quitarClienteCli(rutas: Rutas): Promise<void> {
  const carpeta = rutas.cliCliente();
  for (const n of [
    NOMBRE_EXE,
    NOMBRE_VERSION_EXE,
    NOMBRE_RUNTIME,
    NOMBRE_CMD,
    NOMBRE_SH,
    NOMBRE_SCRIPT,
  ]) {
    await rm(path.join(carpeta, n), { force: true }).catch(() => undefined);
  }
  // `rmdir` (no `rm -r`): si el usuario dejó algo más ahí, no se toca.
  await rmdir(carpeta).catch(() => undefined);
}

/** ¿Está instalado el cliente (script, `.cmd` y `wolf` de sh)? */
export async function clienteCliInstalado(rutas: Rutas): Promise<boolean> {
  try {
    for (const n of [NOMBRE_CMD, NOMBRE_SCRIPT, NOMBRE_SH]) {
      await access(path.join(rutas.cliCliente(), n));
    }
    return true;
  } catch {
    return false;
  }
}

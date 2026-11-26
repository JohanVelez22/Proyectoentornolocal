import { access, mkdir, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
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

/** Una ruta que va entre comillas en un `.cmd`: sin comillas ni saltos y con `%` duplicado. */
function rutaParaCmd(r: string): string {
  // eslint-disable-next-line no-control-regex
  if (/["\u0000-\u001f]/.test(r)) {
    throw new ErrorWolf(
      'cli.ruta_invalida',
      'La ruta del programa no se puede escribir en wolf.cmd.',
    );
  }
  return r.replace(/%/g, '%%');
}

/**
 * Contenido de `wolf.cmd`: corre `wolf.cjs` (de la misma carpeta) con el Electron de la app como
 * Node. `setlocal` hace que `ELECTRON_RUN_AS_NODE` viva solo en este proceso: si se quedara en la
 * terminal, todo Electron que se lance después (VS Code, la propia app) arrancaría como Node.
 * Con rutas con letras fuera de ASCII (usuario con tilde) usa la página de códigos UTF-8 mientras
 * corre y la devuelve al terminar. Sin delayed expansion: un `!` en un argumento no se interpreta.
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
  ];
  if (noAscii) {
    l.push(
      'set "WOLF_CP="',
      `for /f "tokens=2 delims=:." %%a in ('chcp') do set "WOLF_CP=%%a"`,
      'chcp 65001 >nul',
    );
  }
  l.push('set "ELECTRON_RUN_AS_NODE=1"');
  if (app !== undefined) l.push(`set "WOLFCORE_APP_DIR=${app}"`);
  l.push(`"${exe}" "%~dp0${NOMBRE_SCRIPT}" %*`);
  if (noAscii) {
    l.push(
      'set "WOLF_RC=%ERRORLEVEL%"',
      'if defined WOLF_CP chcp %WOLF_CP% >nul',
      'exit /b %WOLF_RC%',
    );
  } else {
    l.push('exit /b %ERRORLEVEL%');
  }
  return `${l.join('\r\n')}\r\n`;
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

/**
 * Copia el cliente a `bin/cli/` (carpeta propia de WolfCore Dev) y escribe `wolf.cmd` con la ruta
 * real de la app. Se repite al abrir la app, para seguir a una actualización que cambió la ruta.
 */
export async function instalarClienteCli(rutas: Rutas, o: OrigenClienteCli): Promise<void> {
  const carpeta = rutas.cliCliente();
  await mkdir(carpeta, { recursive: true });
  // Antes de copiar nada: si el cmd no se puede armar, no queda un cliente a medias.
  const cmd = contenidoWolfCmd({
    exe: o.exe,
    ...(o.carpetaApp ? { carpetaApp: o.carpetaApp } : {}),
  });
  const tmpScript = path.join(carpeta, `${NOMBRE_SCRIPT}.${process.pid}.tmp`);
  try {
    // readFile y no copyFile: el origen puede estar dentro del .asar de la app.
    await writeFile(tmpScript, await readFile(o.script));
    await rename(tmpScript, path.join(carpeta, NOMBRE_SCRIPT));
  } catch (e) {
    await rm(tmpScript, { force: true }).catch(() => undefined);
    throw e;
  }
  await escribirAtomico(path.join(carpeta, NOMBRE_CMD), cmd);
}

/** Quita lo que escribió `instalarClienteCli` (solo esos dos archivos; la carpeta, si queda vacía). */
export async function quitarClienteCli(rutas: Rutas): Promise<void> {
  const carpeta = rutas.cliCliente();
  for (const n of [NOMBRE_CMD, NOMBRE_SCRIPT]) {
    await rm(path.join(carpeta, n), { force: true }).catch(() => undefined);
  }
  // `rmdir` (no `rm -r`): si el usuario dejó algo más ahí, no se toca.
  await rmdir(carpeta).catch(() => undefined);
}

/** ¿Está instalado el cliente (ambos archivos)? */
export async function clienteCliInstalado(rutas: Rutas): Promise<boolean> {
  try {
    await access(path.join(rutas.cliCliente(), NOMBRE_CMD));
    await access(path.join(rutas.cliCliente(), NOMBRE_SCRIPT));
    return true;
  } catch {
    return false;
  }
}

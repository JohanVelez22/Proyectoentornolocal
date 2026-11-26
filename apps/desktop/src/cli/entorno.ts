import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { depsLecturaReales, leerArchivoCliSeguro } from './archivoCli';
import type { DepsCli } from './cliente';
import { esIdioma, idiomaDeLocale, type Idioma } from './textos';

/** Mismo nombre y lugar que `rutaBasePorDefecto` del núcleo (aquí no se trae el núcleo entero). */
const NOMBRE_CARPETA = 'WolfCoreDev';

function carpetaPorDefecto(env: NodeJS.ProcessEnv, plataforma: NodeJS.Platform): string {
  if (plataforma === 'win32') {
    const local =
      env.LOCALAPPDATA ?? path.win32.join(env.USERPROFILE ?? os.homedir(), 'AppData', 'Local');
    return path.win32.join(local, NOMBRE_CARPETA);
  }
  if (plataforma === 'darwin') {
    return path.posix.join(os.homedir(), 'Library', 'Application Support', NOMBRE_CARPETA);
  }
  const datos = env.XDG_DATA_HOME ?? path.posix.join(os.homedir(), '.local', 'share');
  return path.posix.join(datos, NOMBRE_CARPETA);
}

/**
 * La carpeta de datos de la app con la que habla este cliente: `WOLFCORE_DATOS` si está (otra
 * instancia de prueba, con su propio puerto y token); si no, la que contiene este cliente
 * (`<datos>/bin/cli/wolf.cjs`); si no, la de siempre.
 */
export function carpetaDatosCli(
  env: NodeJS.ProcessEnv,
  carpetaScript: string,
  plataforma: NodeJS.Platform = process.platform,
): string {
  const propia = env.WOLFCORE_DATOS?.trim();
  if (propia && path.isAbsolute(propia)) return path.resolve(propia);
  const cli = path.resolve(carpetaScript);
  const bin = path.dirname(cli);
  if (path.basename(cli).toLowerCase() === 'cli' && path.basename(bin).toLowerCase() === 'bin') {
    return path.dirname(bin);
  }
  return carpetaPorDefecto(env, plataforma);
}

/** El idioma de la interfaz según su config.json (si no se lee, el del sistema). */
export function idiomaSinApp(datos: string, env: NodeJS.ProcessEnv): Idioma {
  try {
    const c = JSON.parse(readFileSync(path.join(datos, 'config.json'), 'utf8')) as {
      ui?: { idioma?: unknown };
    };
    if (esIdioma(c.ui?.idioma)) return c.ui.idioma;
  } catch {
    // sin config legible: el idioma del sistema
  }
  return idiomaDeLocale(
    env.LC_ALL || env.LC_MESSAGES || env.LANG || Intl.DateTimeFormat().resolvedOptions().locale,
  );
}

/** Lanza la app (sin `ELECTRON_RUN_AS_NODE`: este proceso sí lo tiene, la app no) con `--iniciar-todo`. */
export function lanzarApp(env: NodeJS.ProcessEnv): boolean {
  // Solo sobre el Electron de la app: con otro Node, `process.execPath` no es la app.
  if (!process.versions.electron) return false;
  const hijo: NodeJS.ProcessEnv = { ...env };
  delete hijo.ELECTRON_RUN_AS_NODE;
  const carpetaApp = hijo.WOLFCORE_APP_DIR;
  delete hijo.WOLFCORE_APP_DIR;
  const proceso = spawn(process.execPath, [...(carpetaApp ? [carpetaApp] : []), '--iniciar-todo'], {
    detached: true,
    stdio: 'ignore',
    env: hijo,
  });
  proceso.on('error', () => undefined);
  proceso.unref();
  return true;
}

/** Pregunta en la terminal; la pregunta va a stderr para no ensuciar la salida (`--json`). */
function preguntarEnTerminal(texto: string): Promise<string | null> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    let respondida = false;
    rl.question(texto, (r) => {
      respondida = true;
      rl.close();
      resolve(r);
    });
    rl.on('close', () => {
      if (!respondida) resolve(null);
    });
  });
}

/** Las dependencias reales del cliente (archivo, terminal, app). */
export function depsReales(carpetaScript: string, senal: AbortSignal): DepsCli {
  const env = process.env;
  const datos = carpetaDatosCli(env, carpetaScript);
  const lectura = depsLecturaReales();
  return {
    leerCliJson: () => leerArchivoCliSeguro(path.join(datos, 'run', 'cli.json'), lectura),
    salida: {
      out: (t) => process.stdout.write(`${t}\n`),
      err: (t) => process.stderr.write(`${t}\n`),
    },
    idioma: () => idiomaSinApp(datos, env),
    cwd: process.cwd(),
    tty: Boolean(process.stdin.isTTY && process.stderr.isTTY),
    preguntar: preguntarEnTerminal,
    abrirApp: async () => lanzarApp(env),
    senal,
  };
}

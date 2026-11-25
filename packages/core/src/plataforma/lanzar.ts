import { spawn } from 'node:child_process';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { StringDecoder } from 'node:string_decoder';
import { entornoDelHijo } from '../procesos/entorno';
import type { Lanzador } from './tipos';

/** Una línea más larga que esto se corta (un INSERT de varios MB no debe quedar en memoria). */
const MAX_LINEA = 4000;

function porLineas(flujo: Readable, alLinea: (l: string) => void, cortarEnRetorno = false): void {
  const dec = new StringDecoder('utf8');
  let resto = '';
  const soltar = (l: string): void => {
    const limpia = l.endsWith('\r') ? l.slice(0, -1) : l;
    // Al cortar en \r, el \n de un \r\n deja un tramo vacío: se omite.
    if (cortarEnRetorno && !limpia) return;
    alLinea(limpia.length > MAX_LINEA ? `${limpia.slice(0, MAX_LINEA)}…` : limpia);
  };
  const corte = (t: string): number => {
    const n = t.indexOf('\n');
    if (!cortarEnRetorno) return n;
    const r = t.indexOf('\r');
    return r < 0 ? n : n < 0 ? r : Math.min(n, r);
  };
  flujo.on('data', (b: Buffer) => {
    resto += dec.write(b);
    let i: number;
    while ((i = corte(resto)) >= 0) {
      soltar(resto.slice(0, i));
      resto = resto.slice(i + 1);
    }
    if (resto.length > MAX_LINEA * 4) {
      soltar(resto);
      resto = '';
    }
  });
  flujo.on('end', () => {
    resto += dec.end();
    if (resto) soltar(resto);
  });
}

/** El proceso terminó antes de leer toda la entrada: no es un error de la entrada. */
const esCierreDelHijo = (e: unknown): boolean => {
  const c = (e as { code?: unknown } | null)?.code;
  return c === 'EPIPE' || c === 'ERR_STREAM_PREMATURE_CLOSE' || c === 'ECONNRESET' || c === 'EOF';
};

/**
 * Lanza un proceso sin shell y en streaming: la entrada se copia con contrapresión y la salida
 * se entrega por líneas. Resuelve con el código de salida; rechaza si el ejecutable no existe o
 * si falla la lectura de la entrada (archivo dañado, .gz incompleto).
 */
/** taskkill.exe por ruta absoluta (no se busca en el PATH ni en la carpeta del proyecto). */
export function rutaTaskkill(env: NodeJS.ProcessEnv = process.env): string {
  return path.win32.join(
    env.SystemRoot ?? env.SYSTEMROOT ?? 'C:\\Windows',
    'System32',
    'taskkill.exe',
  );
}

export interface OpcionesMatar {
  /** El proceso ya salió: su PID podría ser de otro proceso y no se toca. */
  salio: boolean;
  plataforma?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  lanzar?: typeof spawn;
  /** Fuera de Windows: el proceso es líder de su grupo y se mata el grupo entero. */
  grupo?: boolean;
  /** Para pruebas: reemplaza `process.kill`. */
  matarProceso?: (pid: number, senal: NodeJS.Signals) => void;
}

/** Mata el proceso y sus hijos: en Windows `taskkill /T /F`; en otros sistemas, SIGKILL. */
export function matarArbol(
  hijo: { pid?: number | undefined; kill(senal?: NodeJS.Signals): boolean },
  o: OpcionesMatar,
): void {
  if (o.salio) return;
  if ((o.plataforma ?? process.platform) === 'win32' && hijo.pid !== undefined) {
    const k = (o.lanzar ?? spawn)(rutaTaskkill(o.env), ['/PID', String(hijo.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
    k.once('error', () => hijo.kill());
    return;
  }
  if (o.grupo && hijo.pid !== undefined) {
    try {
      (o.matarProceso ?? process.kill)(-hijo.pid, 'SIGKILL');
      return;
    } catch {
      // el grupo ya no existe: se prueba con el proceso solo
    }
  }
  hijo.kill('SIGKILL');
}

/** Error con el que se rechaza un lanzamiento cuya señal ya estaba abortada. */
export const MENSAJE_CANCELADO = 'Cancelado';

export const lanzadorPorDefecto: Lanzador = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    if (opts.senal?.aborted) {
      opts.entrada?.destroy();
      reject(new Error(MENSAJE_CANCELADO));
      return;
    }
    const grupo = opts.matarGrupo === true && process.platform !== 'win32';
    const hijo = spawn(cmd, args, {
      windowsHide: true,
      cwd: opts.cwd,
      env:
        opts.env || opts.quitarEntorno
          ? entornoDelHijo(process.env, { env: opts.env, quitarEntorno: opts.quitarEntorno })
          : process.env,
      stdio: [opts.entrada ? 'pipe' : 'ignore', 'pipe', 'pipe'],
      // Líder de su grupo (POSIX) para poder matar todo lo que lance; en Windows no hace falta.
      detached: grupo,
    });
    let errorEntrada: unknown = null;
    let terminado = false;
    const alLinea = opts.alLinea;
    porLineas(hijo.stdout!, (l) => alLinea?.(l, 'stdout'), opts.cortarEnRetorno);
    porLineas(hijo.stderr!, (l) => alLinea?.(l, 'stderr'), opts.cortarEnRetorno);
    if (opts.entrada && hijo.stdin) {
      hijo.stdin.on('error', () => undefined);
      pipeline(opts.entrada, hijo.stdin).catch((e: unknown) => {
        if (esCierreDelHijo(e) || terminado) return;
        errorEntrada = e;
        hijo.kill();
      });
    }
    const senal = opts.senal;
    let salio = false;
    let gracia: ReturnType<typeof setTimeout> | null = null;
    /** Pasado el plazo sin `close` (un nieto con la salida abierta): se corta y se resuelve igual. */
    const armarGracia = (codigo: number): void => {
      if (opts.graciaMs === undefined || gracia || terminado) return;
      gracia = setTimeout(() => {
        if (terminado) return;
        terminado = true;
        soltarSenal();
        hijo.stdout?.destroy();
        hijo.stderr?.destroy();
        opts.entrada?.destroy();
        if (errorEntrada) reject(errorEntrada);
        else resolve({ codigo });
      }, opts.graciaMs);
      gracia.unref?.();
    };
    hijo.once('exit', (codigo) => {
      salio = true;
      armarGracia(codigo ?? 1);
    });
    const alAbortar = (): void => {
      matarArbol(hijo, { salio, grupo });
      armarGracia(1);
    };
    senal?.addEventListener('abort', alAbortar, { once: true });
    const soltarSenal = (): void => senal?.removeEventListener('abort', alAbortar);
    hijo.on('error', (e) => {
      if (gracia) clearTimeout(gracia);
      terminado = true;
      soltarSenal();
      opts.entrada?.destroy();
      reject(e);
    });
    hijo.on('close', (codigo) => {
      if (gracia) clearTimeout(gracia);
      if (terminado) return;
      terminado = true;
      soltarSenal();
      opts.entrada?.destroy();
      if (errorEntrada) reject(errorEntrada);
      else resolve({ codigo: codigo ?? 1 });
    });
  });

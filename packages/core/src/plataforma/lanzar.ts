import { spawn } from 'node:child_process';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { StringDecoder } from 'node:string_decoder';
import type { Lanzador } from './tipos';

/** Una línea más larga que esto se corta (un INSERT de varios MB no debe quedar en memoria). */
const MAX_LINEA = 4000;

function porLineas(flujo: Readable, alLinea: (l: string) => void): void {
  const dec = new StringDecoder('utf8');
  let resto = '';
  const soltar = (l: string): void => {
    const limpia = l.endsWith('\r') ? l.slice(0, -1) : l;
    alLinea(limpia.length > MAX_LINEA ? `${limpia.slice(0, MAX_LINEA)}…` : limpia);
  };
  flujo.on('data', (b: Buffer) => {
    resto += dec.write(b);
    let i: number;
    while ((i = resto.indexOf('\n')) >= 0) {
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
export const lanzadorPorDefecto: Lanzador = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const hijo = spawn(cmd, args, {
      windowsHide: true,
      cwd: opts.cwd,
      env: opts.env ? { ...process.env, ...opts.env } : process.env,
      stdio: [opts.entrada ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    });
    let errorEntrada: unknown = null;
    let terminado = false;
    const alLinea = opts.alLinea;
    porLineas(hijo.stdout!, (l) => alLinea?.(l, 'stdout'));
    porLineas(hijo.stderr!, (l) => alLinea?.(l, 'stderr'));
    if (opts.entrada && hijo.stdin) {
      hijo.stdin.on('error', () => undefined);
      pipeline(opts.entrada, hijo.stdin).catch((e: unknown) => {
        if (esCierreDelHijo(e) || terminado) return;
        errorEntrada = e;
        hijo.kill();
      });
    }
    hijo.on('error', (e) => {
      terminado = true;
      opts.entrada?.destroy();
      reject(e);
    });
    hijo.on('close', (codigo) => {
      terminado = true;
      opts.entrada?.destroy();
      if (errorEntrada) reject(errorEntrada);
      else resolve({ codigo: codigo ?? 1 });
    });
  });

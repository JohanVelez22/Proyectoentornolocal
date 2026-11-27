import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { ErrorWolf } from '../errores';

/**
 * Servidor de ejemplo de la guía HTTP (D49). Solo para practicar con el cliente HTTP: escucha
 * ÚNICAMENTE en 127.0.0.1 (puerto efímero), no sirve archivos, no ejecuta nada, no hace de proxy
 * ni abre conexiones salientes, y sus respuestas son fijas. Arranca al pulsar «Probar» y se apaga
 * al cerrar la guía o tras un rato sin uso. No hay CORS: ningún origen web puede leerlo, y la
 * cabecera Host se comprueba (defensa contra DNS rebinding).
 */

/** Códigos de `docs/contenido/http.json` que `/estado/<código>` sabe devolver. */
export const CODIGOS_EJEMPLO: readonly number[] = [
  100, 101, 200, 201, 202, 204, 206, 301, 302, 303, 304, 307, 308, 400, 401, 403, 404, 405, 406,
  408, 409, 410, 413, 415, 418, 419, 422, 425, 429, 451, 500, 501, 502, 503, 504,
];
/** Redirecciones permitidas en `/redirigir/<código>`. */
export const REDIRECCIONES_EJEMPLO: readonly number[] = [301, 302, 303, 307, 308];

/** Cuerpo de entrada máximo (se corta la conexión) y parte que el eco devuelve. */
export const MAX_ENTRADA_EJEMPLO = 1024 * 1024;
export const MAX_ECO_EJEMPLO = 64 * 1024;
export const INACTIVIDAD_EJEMPLO_MS = 10 * 60 * 1000;
export const ESPERA_LENTO_MS = 5000;
const PLAZO_PETICION_MS = 15_000;
const PLAZO_CABECERAS_MS = 10_000;
const MAX_CONEXIONES = 32;
const CABECERAS_SECRETAS = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
]);

/** Códigos que no se pueden reproducir de verdad: se responde 200 con un JSON que lo explica. */
const SIMULADOS: Record<number, string> = {
  100: 'El 100 Continue es una respuesta provisional que llega antes de la definitiva; un servidor de ejemplo no la puede mostrar como respuesta final.',
  101: 'El 101 Switching Protocols cambia de protocolo (por ejemplo a WebSocket). Este servidor nunca cambia de protocolo.',
  502: 'El 502 Bad Gateway lo emite un proxy cuando el servidor de atrás falla. Este servidor no hace de proxy.',
};

export interface OpcionesServidorEjemplo {
  /** Tiempo sin uso antes de apagarse solo (por defecto, 10 min). */
  inactividadMs?: number;
  /** Espera de `/lento` (por defecto, 5 s). */
  esperaLentoMs?: number;
}

export interface EstadoServidorEjemplo {
  activo: boolean;
  puerto: number | null;
}

export class ServidorEjemplo {
  private servidor: http.Server | null = null;
  private arranque: Promise<number> | null = null;
  private puerto: number | null = null;
  private reloj: NodeJS.Timeout | null = null;
  private readonly espera = new Set<NodeJS.Timeout>();
  private readonly inactividadMs: number;
  private readonly esperaLentoMs: number;

  constructor(opciones: OpcionesServidorEjemplo = {}) {
    this.inactividadMs = opciones.inactividadMs ?? INACTIVIDAD_EJEMPLO_MS;
    this.esperaLentoMs = opciones.esperaLentoMs ?? ESPERA_LENTO_MS;
  }

  estado(): EstadoServidorEjemplo {
    return { activo: this.puerto !== null, puerto: this.puerto };
  }

  /** Arranca si hace falta y renueva el plazo de inactividad. Devuelve el puerto. */
  async iniciar(): Promise<number> {
    if (this.puerto !== null) {
      this.armarReloj();
      return this.puerto;
    }
    this.arranque ??= this.escuchar().finally(() => {
      this.arranque = null;
    });
    return this.arranque;
  }

  /** Cierra el servidor, sus conexiones y las esperas de `/lento`. Se puede repetir. */
  async detener(): Promise<void> {
    if (this.reloj) clearTimeout(this.reloj);
    this.reloj = null;
    for (const t of this.espera) clearTimeout(t);
    this.espera.clear();
    const pendiente = this.arranque;
    if (pendiente) await pendiente.catch(() => undefined);
    const s = this.servidor;
    this.servidor = null;
    this.puerto = null;
    if (!s) return;
    await new Promise<void>((ok) => {
      s.close(() => ok());
      s.closeAllConnections();
    });
  }

  private escuchar(): Promise<number> {
    return new Promise<number>((ok, fallo) => {
      const s = http.createServer((req, res) => this.atender(req, res));
      s.requestTimeout = PLAZO_PETICION_MS;
      s.headersTimeout = PLAZO_CABECERAS_MS;
      s.keepAliveTimeout = 2000;
      s.maxConnections = MAX_CONEXIONES;
      s.on('clientError', (_e, socket) => {
        if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
        else socket.destroy();
      });
      s.once('error', (e) => {
        fallo(
          new ErrorWolf('ejemplohttp.no_arranca', 'No se pudo iniciar el servidor de ejemplo.', {
            motivo: (e as NodeJS.ErrnoException).code ?? 'error',
          }),
        );
      });
      s.listen(0, '127.0.0.1', () => {
        s.unref();
        this.servidor = s;
        this.puerto = (s.address() as AddressInfo).port;
        this.armarReloj();
        ok(this.puerto);
      });
    });
  }

  private armarReloj(): void {
    if (this.reloj) clearTimeout(this.reloj);
    this.reloj = setTimeout(() => void this.detener(), this.inactividadMs);
    this.reloj.unref();
  }

  private atender(req: http.IncomingMessage, res: http.ServerResponse): void {
    if (this.puerto !== null) this.armarReloj();
    // Anti DNS rebinding: solo se atiende el nombre exacto 127.0.0.1:<puerto>.
    if (req.headers.host !== `127.0.0.1:${this.puerto}`) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8', connection: 'close' });
      res.end('Host no permitido');
      return;
    }
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const ruta = url.pathname;
    const metodo = (req.method ?? 'GET').toUpperCase();

    if (ruta === '/lento') return this.lento(req, res);

    const partes: Buffer[] = [];
    let total = 0;
    let truncado = false;
    let excedido = false;
    req.on('data', (b: Buffer) => {
      if (excedido) return;
      total += b.length;
      if (total > MAX_ENTRADA_EJEMPLO) {
        excedido = true;
        res.once('finish', () => req.socket.destroy());
        responder(
          res,
          413,
          { error: 'cuerpo_demasiado_grande', maximo: MAX_ENTRADA_EJEMPLO },
          { connection: 'close' },
        );
        return;
      }
      if (this.tamano(partes) < MAX_ECO_EJEMPLO) partes.push(b);
      else truncado = true;
    });
    req.on('error', () => undefined);
    req.on('end', () => {
      if (excedido) return;
      let cuerpo = Buffer.concat(partes);
      if (cuerpo.length > MAX_ECO_EJEMPLO) {
        cuerpo = cuerpo.subarray(0, MAX_ECO_EJEMPLO);
        truncado = true;
      }
      this.responderRuta(metodo, ruta, url, req, res, cuerpo, truncado, total);
    });
  }

  private tamano(partes: Buffer[]): number {
    return partes.reduce((n, p) => n + p.length, 0);
  }

  /** Espera hasta 5 s y devuelve 504; si el cliente se va, la espera se cancela. */
  private lento(req: http.IncomingMessage, res: http.ServerResponse): void {
    req.resume();
    const t = setTimeout(() => {
      this.espera.delete(t);
      if (!res.writableEnded && !res.destroyed) {
        responder(res, 504, { error: 'tiempo_agotado', mensaje: 'Respuesta lenta de ejemplo.' });
      }
    }, this.esperaLentoMs);
    t.unref();
    this.espera.add(t);
    const limpiar = (): void => {
      clearTimeout(t);
      this.espera.delete(t);
    };
    res.once('close', limpiar);
  }

  private responderRuta(
    metodo: string,
    ruta: string,
    url: URL,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    cuerpo: Buffer,
    truncado: boolean,
    recibidos: number,
  ): void {
    if (ruta === '/eco') {
      if (metodo === 'OPTIONS') {
        res.writeHead(204, { allow: 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS' });
        res.end();
        return;
      }
      responder(res, 200, eco(metodo, ruta, url, req, cuerpo, truncado, recibidos));
      return;
    }
    if (ruta === '/creado') {
      if (metodo !== 'POST') {
        responder(res, 405, { error: 'metodo_no_permitido' }, { allow: 'POST' });
        return;
      }
      responder(
        res,
        201,
        { id: 42, ...eco(metodo, ruta, url, req, cuerpo, truncado, recibidos) },
        { location: '/eco?id=42' },
      );
      return;
    }
    const redir = /^\/redirigir\/(\d{3})$/.exec(ruta);
    if (redir) {
      const c = Number(redir[1]);
      if (!REDIRECCIONES_EJEMPLO.includes(c)) {
        responder(res, 404, { error: 'redireccion_no_disponible' });
        return;
      }
      res.writeHead(c, { location: '/eco?desde=redirigir', 'content-length': '0' });
      res.end();
      return;
    }
    if (ruta === '/limite') {
      responder(res, 429, { message: 'Too Many Attempts.' }, { 'retry-after': '30' });
      return;
    }
    const estado = /^\/estado\/(\d{1,3})$/.exec(ruta);
    if (estado) {
      const c = Number(estado[1]);
      if (!CODIGOS_EJEMPLO.includes(c)) {
        responder(res, 404, { error: 'codigo_no_disponible', disponibles: CODIGOS_EJEMPLO });
        return;
      }
      respuestaDeEstado(c, res);
      return;
    }
    responder(res, 404, { error: 'ruta_no_encontrada' });
  }
}

/** Parte de la petición que el eco devuelve, con las credenciales enmascaradas. */
function eco(
  metodo: string,
  ruta: string,
  url: URL,
  req: http.IncomingMessage,
  cuerpo: Buffer,
  truncado: boolean,
  recibidos: number,
): Record<string, unknown> {
  const cabeceras: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    const valor = Array.isArray(v) ? v.join(', ') : (v ?? '');
    cabeceras[k] = CABECERAS_SECRETAS.has(k) ? '***' : valor;
  }
  const query: Record<string, string | string[]> = {};
  for (const [k, v] of url.searchParams) {
    const previo = query[k];
    query[k] = previo === undefined ? v : Array.isArray(previo) ? [...previo, v] : [previo, v];
  }
  return {
    metodo,
    ruta,
    query,
    cabeceras,
    cuerpo: cuerpo.toString('utf8'),
    bytesRecibidos: recibidos,
    truncado,
  };
}

function responder(
  res: http.ServerResponse,
  codigo: number,
  json: unknown,
  extra: Record<string, string> = {},
): void {
  if (res.headersSent || res.writableEnded) return;
  const texto = JSON.stringify(json);
  res.writeHead(codigo, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(Buffer.byteLength(texto)),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extra,
  });
  res.end(texto);
}

/** Respuesta fija de `/estado/<código>`. */
function respuestaDeEstado(c: number, res: http.ServerResponse): void {
  const simulado = SIMULADOS[c];
  if (simulado !== undefined) {
    responder(res, 200, { simulado: true, codigo: c, explicacion: simulado });
    return;
  }
  if (c === 204 || c === 304) {
    res.writeHead(c, c === 304 ? { etag: '"v123"' } : {});
    res.end();
    return;
  }
  if (REDIRECCIONES_EJEMPLO.includes(c)) {
    res.writeHead(c, { location: '/eco?desde=estado', 'content-length': '0' });
    res.end();
    return;
  }
  if (c === 206) {
    const texto = 'Fragmento de ejemplo del recurso.';
    const largo = Buffer.byteLength(texto);
    res.writeHead(206, {
      'content-type': 'text/plain; charset=utf-8',
      'content-length': String(largo),
      'content-range': `bytes 0-${largo - 1}/${largo * 4}`,
    });
    res.end(texto);
    return;
  }
  const extra: Record<string, string> = {};
  if (c === 201) extra['location'] = '/eco?id=42';
  if (c === 401) extra['www-authenticate'] = 'Basic realm="ejemplo"';
  if (c === 405) extra['allow'] = 'GET, HEAD';
  if (c === 429) extra['retry-after'] = '30';
  if (c === 503) extra['retry-after'] = '60';
  if (c === 504) extra['server'] = 'ejemplo';
  responder(res, c, { codigo: c, mensaje: 'Respuesta de ejemplo' }, extra);
}

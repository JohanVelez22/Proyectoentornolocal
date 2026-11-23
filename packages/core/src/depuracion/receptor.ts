import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, rename, rm, utimes, writeFile } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import path from 'node:path';
import { z } from 'zod';
import { ErrorWolf } from '../errores';
import { enmascararSecretos } from '../patronesSecretos';
import type { Rutas } from '../rutas';
import { rutasDepuracion } from './prepend';

/** Un volcado recibido. `html` queda en null: la interfaz muestra solo el texto. */
export interface Dump {
  id: string;
  fecha: string;
  origen: 'php' | 'python';
  sitioId: string | null;
  archivo: string | null;
  linea: number | null;
  url: string | null;
  html: string | null;
  texto: string;
}

/** Lo que va en la lista y en el evento `dump:nuevo`: sin el texto completo. */
export interface ResumenDump {
  id: string;
  fecha: string;
  origen: Dump['origen'];
  sitioId: string | null;
  archivo: string | null;
  linea: number | null;
  url: string | null;
  /** Primeros caracteres del texto (una línea). */
  vista: string;
  bytes: number;
}

export interface FiltroDumps {
  sitioId?: string;
  origen?: Dump['origen'];
  /** Busca en el texto, el archivo y la URL (sin distinguir mayúsculas). */
  texto?: string;
}

export interface EstadoReceptor {
  activo: boolean;
  direccion: typeof DIRECCION;
  puerto: number | null;
  total: number;
}

export const DIRECCION = '127.0.0.1';
export const RUTA_DUMP = '/dump';
/** Cuerpo máximo de una petición. */
export const MAX_CUERPO_DUMP = 1024 * 1024;
/** Volcados que se guardan (los más nuevos). */
export const MAX_DUMPS = 500;
/**
 * Tope de memoria del texto: el anillo descarta los más viejos hasta caber. Se cuenta como lo
 * guarda JS (UTF-16: 2 bytes por unidad), no los bytes UTF-8 que llegaron: 32 MiB de memoria son
 * como mucho unos 16 millones de caracteres.
 */
export const MAX_BYTES_DUMPS = 32 * 1024 * 1024;
/** Peticiones aceptadas por segundo; el resto recibe 429. */
export const DUMPS_POR_SEGUNDO = 50;
const LARGO_VISTA = 160;
const ID_SITIO = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

const CuerpoSchema = z.object({
  origen: z.enum(['php', 'python']),
  sitio: z.unknown().optional(),
  archivo: z.unknown().optional(),
  linea: z.unknown().optional(),
  url: z.unknown().optional(),
  texto: z.string().max(MAX_CUERPO_DUMP),
});

/** Texto de una línea acotado y sin controles (archivo, URL); otra cosa → null. */
function textoCorto(v: unknown, max: number): string | null {
  if (typeof v !== 'string' || v === '') return null;
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max) || null;
}

export interface DepsReceptor {
  rutas: Rutas;
  puerto(): Promise<number>;
  /** Avisa a la interfaz de un volcado nuevo (solo el resumen). */
  emitir(d: ResumenDump): void;
  maximo?: number;
  maxBytes?: number;
  porSegundo?: number;
  ahora?: () => number;
  /** Cada cuánto se renueva la fecha del archivo del receptor (latido; 15 s por defecto). */
  latidoMs?: number;
  /**
   * Deja el archivo del token legible solo por el usuario (`Plataforma.restringirAlUsuario`;
   * icacls en Windows). Se aplica al temporal vacío, antes de escribir el token.
   */
  restringir?: (ruta: string) => Promise<boolean>;
}

/**
 * Latido del archivo del receptor. El prepend y wolfdump no envían si su fecha tiene más de 60 s
 * (`VIGENCIA`): si la app se cortó sin borrarlo, a lo sumo en un minuto deja de usarse aunque
 * otro proceso ocupe el puerto. Además llevan el PID: donde se puede preguntar barato (PHP con
 * posix o /proc, Python en todos los sistemas) no se envía a un receptor muerto.
 */
export const LATIDO_RECEPTOR_MS = 15_000;

class ErrorHttp extends Error {
  constructor(
    readonly codigo: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

const huella = (t: string): Buffer => createHash('sha256').update(t, 'utf8').digest();

/**
 * Receptor de volcados de `dump()`/`dd()`/`wd()` (PHP) y `wolfdump.dump()` (Python).
 *
 * - HTTP en 127.0.0.1, solo `POST /dump` con `Authorization: Bearer <token>`; el token es
 *   aleatorio en cada `iniciar` y solo se escribe en `run/depuracion.json` (lo leen el prepend y
 *   wolfdump) mientras escucha. Rechaza Host ajenos y cualquier `Origin` (un navegador nunca
 *   llega).
 * - Cuerpo de 1 MB como mucho, límite por segundo y anillo en memoria (500 volcados y un tope de
 *   bytes). Nada se escribe a disco: los volcados pueden llevar secretos.
 * - El contenido es solo texto: nunca se interpreta ni se ejecuta.
 */
export class ReceptorDumps {
  private http: http.Server | null = null;
  private arrancando: Promise<void> | null = null;
  private puertoActual: number | null = null;
  private huellaToken: Buffer | null = null;
  private readonly sockets = new Set<Socket>();
  private dumps: Dump[] = [];
  private totalBytes = 0;
  private contador = 0;
  private ventana = { inicio: 0, cuenta: 0 };
  private latido: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly d: DepsReceptor) {}

  private get maximo(): number {
    return this.d.maximo ?? MAX_DUMPS;
  }
  private get maxBytes(): number {
    return this.d.maxBytes ?? MAX_BYTES_DUMPS;
  }
  private ahora(): number {
    return this.d.ahora?.() ?? Date.now();
  }

  estado(): EstadoReceptor {
    const p = this.http ? this.puertoActual : null;
    return { activo: p !== null, direccion: DIRECCION, puerto: p, total: this.dumps.length };
  }

  iniciar(): Promise<void> {
    if (this.http) return Promise.resolve();
    this.arrancando ??= this.arrancar().finally(() => {
      this.arrancando = null;
    });
    return this.arrancando;
  }

  private async arrancar(): Promise<void> {
    const archivo = rutasDepuracion(this.d.rutas).receptor;
    // Un archivo de una sesión anterior (cierre forzado) nunca debe quedar con otro token.
    await rm(archivo, { force: true });
    const puerto = await this.d.puerto();
    const token = randomBytes(32).toString('hex');
    const servidor = http.createServer((req, res) => this.atender(req, res));
    servidor.headersTimeout = 5000;
    servidor.requestTimeout = 10_000;
    servidor.maxHeadersCount = 30;
    servidor.maxConnections = 64;
    servidor.on('connection', (s: Socket) => {
      this.sockets.add(s);
      s.on('close', () => this.sockets.delete(s));
    });
    await new Promise<void>((resolve, reject) => {
      const alFallar = (e: NodeJS.ErrnoException): void => {
        reject(
          e.code === 'EADDRINUSE' || e.code === 'EACCES'
            ? new ErrorWolf(
                'depuracion.puerto_ocupado',
                `El puerto ${puerto} ya está en uso: la captura de dumps no puede escuchar.`,
                { puerto },
              )
            : new Error(`No se pudo iniciar el receptor de dumps: ${e.message}`),
        );
      };
      servidor.once('error', alFallar);
      servidor.listen(puerto, DIRECCION, () => {
        servidor.off('error', alFallar);
        resolve();
      });
    });
    servidor.on('error', (e) => console.error('Error en el receptor de dumps:', e.message));
    const real = (servidor.address() as AddressInfo).port;
    try {
      await mkdir(path.dirname(archivo), { recursive: true });
      const tmp = `${archivo}.${process.pid}.tmp`;
      // Vacío y restringido primero; el token se escribe después (el rename conserva la ACL).
      await writeFile(tmp, '', { mode: 0o600 });
      if (this.d.restringir && !(await this.d.restringir(tmp).catch(() => false))) {
        console.warn('No se pudo restringir el archivo del token de dumps al usuario actual.');
      }
      await writeFile(tmp, JSON.stringify({ puerto: real, token, pid: process.pid }), {
        mode: 0o600,
      });
      await rename(tmp, archivo);
    } catch (e) {
      servidor.close();
      throw e;
    }
    this.huellaToken = huella(token);
    this.puertoActual = real;
    this.http = servidor;
    this.latido = setInterval(() => {
      const t = new Date();
      utimes(archivo, t, t).catch(() => undefined);
    }, this.d.latidoMs ?? LATIDO_RECEPTOR_MS);
    this.latido.unref?.();
  }

  /** Deja de escuchar y borra el archivo del token. Los volcados quedan en memoria. */
  async detener(): Promise<void> {
    await this.arrancando?.catch(() => undefined);
    const servidor = this.http;
    this.http = null;
    this.puertoActual = null;
    this.huellaToken = null;
    if (this.latido) clearInterval(this.latido);
    this.latido = null;
    await rm(rutasDepuracion(this.d.rutas).receptor, { force: true }).catch(() => undefined);
    if (!servidor) return;
    const cerrado = new Promise<void>((r) => servidor.close(() => r()));
    servidor.closeAllConnections();
    for (const s of this.sockets) s.destroy();
    this.sockets.clear();
    await cerrado;
  }

  /** Resúmenes, del más nuevo al más viejo. */
  lista(filtro: FiltroDumps = {}): ResumenDump[] {
    const aguja = filtro.texto?.trim().toLowerCase() ?? '';
    const res: ResumenDump[] = [];
    for (let i = this.dumps.length - 1; i >= 0; i--) {
      const d = this.dumps[i]!;
      if (filtro.sitioId !== undefined && d.sitioId !== filtro.sitioId) continue;
      if (filtro.origen !== undefined && d.origen !== filtro.origen) continue;
      if (
        aguja !== '' &&
        !d.texto.toLowerCase().includes(aguja) &&
        !(d.archivo ?? '').toLowerCase().includes(aguja) &&
        !(d.url ?? '').toLowerCase().includes(aguja)
      ) {
        continue;
      }
      res.push(resumen(d));
    }
    return res;
  }

  leer(id: string): Dump | null {
    return this.dumps.find((d) => d.id === id) ?? null;
  }

  limpiar(): void {
    this.dumps = [];
    this.totalBytes = 0;
  }

  /** Memoria del texto guardado (UTF-16, 2 bytes por unidad). */
  bytes(): number {
    return this.totalBytes;
  }

  private guardar(d: Dump): boolean {
    const tam = memoriaTexto(d.texto);
    if (tam > this.maxBytes) return false;
    this.dumps.push(d);
    this.totalBytes += tam;
    while (
      this.dumps.length > this.maximo ||
      (this.totalBytes > this.maxBytes && this.dumps.length > 1)
    ) {
      const viejo = this.dumps.shift()!;
      this.totalBytes -= memoriaTexto(viejo.texto);
    }
    return true;
  }

  /** ¿Entra otra petición en este segundo? */
  private dentroDelLimite(): boolean {
    const t = this.ahora();
    if (t - this.ventana.inicio >= 1000) this.ventana = { inicio: t, cuenta: 0 };
    this.ventana.cuenta++;
    return this.ventana.cuenta <= (this.d.porSegundo ?? DUMPS_POR_SEGUNDO);
  }

  /* ───────────── HTTP ───────────── */

  private hostValido(host: string | undefined): boolean {
    const p = this.puertoActual;
    return p !== null && (host === `${DIRECCION}:${p}` || host === `localhost:${p}`);
  }

  private tokenValido(cabecera: string | undefined): boolean {
    const esperado = this.huellaToken;
    if (!esperado || typeof cabecera !== 'string') return false;
    const m = /^Bearer ([0-9a-f]{64})$/.exec(cabecera);
    if (!m) return false;
    return timingSafeEqual(huella(m[1]!), esperado);
  }

  private atender(req: http.IncomingMessage, res: http.ServerResponse): void {
    const responder = (codigo: number, cerrar = false): void => {
      if (res.headersSent) return void res.end();
      res.writeHead(codigo, {
        'Content-Length': '0',
        ...(cerrar ? { Connection: 'close' } : {}),
      });
      res.end();
    };
    res.on('error', () => undefined);
    req.on('error', () => undefined);
    if (!this.hostValido(req.headers.host) || req.headers.origin !== undefined) {
      return responder(403, true);
    }
    if ((req.url ?? '') !== RUTA_DUMP) return responder(404, true);
    if (req.method !== 'POST') return responder(405, true);
    if (!this.tokenValido(req.headers.authorization)) return responder(401, true);
    const largo = Number(req.headers['content-length'] ?? NaN);
    if (Number.isFinite(largo) && largo > MAX_CUERPO_DUMP) {
      responder(413, true);
      req.destroy();
      return;
    }
    if (!this.dentroDelLimite()) {
      req.resume();
      return responder(429, true);
    }
    void this.leerCuerpo(req)
      .then((texto) => {
        const d = this.interpretar(texto);
        if (this.guardar(d)) this.d.emitir(resumen(d));
        responder(204);
      })
      .catch((e: unknown) => responder(e instanceof ErrorHttp ? e.codigo : 400, true));
  }

  private leerCuerpo(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const partes: Buffer[] = [];
      let total = 0;
      req.on('data', (b: Buffer) => {
        total += b.length;
        if (total > MAX_CUERPO_DUMP) {
          reject(new ErrorHttp(413, 'Cuerpo demasiado grande.'));
          req.destroy();
          return;
        }
        partes.push(b);
      });
      req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
      req.on('error', reject);
    });
  }

  /** JSON → Dump validado. El texto queda tal cual (solo se muestra como texto). */
  private interpretar(cuerpo: string): Dump {
    let json: unknown;
    try {
      json = JSON.parse(cuerpo);
    } catch {
      throw new ErrorHttp(400, 'JSON no válido.');
    }
    const r = CuerpoSchema.safeParse(json);
    if (!r.success) throw new ErrorHttp(400, 'Volcado no válido.');
    const v = r.data;
    const sitio = typeof v.sitio === 'string' && ID_SITIO.test(v.sitio) ? v.sitio : null;
    const linea =
      typeof v.linea === 'number' && Number.isInteger(v.linea) && v.linea > 0 && v.linea < 1e8
        ? v.linea
        : null;
    this.contador++;
    return {
      id: `d${this.ahora().toString(36)}-${this.contador}`,
      fecha: new Date(this.ahora()).toISOString(),
      origen: v.origen,
      sitioId: sitio,
      archivo: textoCorto(v.archivo, 1024),
      linea,
      url: textoCorto(v.url, 2048),
      html: null,
      texto: v.texto,
    };
  }
}

/** Memoria que ocupa un texto en JS: 2 bytes por unidad UTF-16 (cota superior). */
const memoriaTexto = (t: string): number => t.length * 2;

function resumen(d: Dump): ResumenDump {
  const primera = d.texto.split('\n', 1)[0] ?? '';
  return {
    id: d.id,
    fecha: d.fecha,
    origen: d.origen,
    sitioId: d.sitioId,
    archivo: d.archivo,
    linea: d.linea,
    url: d.url,
    vista: primera.slice(0, LARGO_VISTA),
    bytes: Buffer.byteLength(d.texto, 'utf8'),
  };
}

/**
 * Texto para copiar o exportar un volcado: origen, archivo:línea, URL y el contenido, con los
 * secretos enmascarados por `PATRONES_SECRETOS` (claves, tokens, contraseñas en URLs y .env).
 */
export function textoParaCopiar(d: Dump): string {
  const lugar = d.archivo ? `${d.archivo}${d.linea !== null ? `:${d.linea}` : ''}` : '';
  const cabecera = [d.fecha, d.origen, d.sitioId ?? '', lugar, d.url ?? '']
    .filter((x) => x !== '')
    .join(' · ');
  return enmascararSecretos(`${cabecera}\n${d.texto}`);
}

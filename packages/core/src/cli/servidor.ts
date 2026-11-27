import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { Rutas } from '../rutas';
import {
  CuerpoOrdenSchema,
  ConsultaRegistrosSchema,
  ORDENES_QUE_CAMBIAN,
  PLAZOS_ORDEN_MS,
  esOrdenCli,
  type OrdenCli,
  type RespuestaCli,
} from './esquemas';
import {
  LINEAS_REGISTRO_CLI,
  ejecutarOrden,
  errorParaCli,
  fuenteDeSitio,
  limpiarSalida,
  type OperacionesCli,
} from './ordenes';

const DIRECCION = '127.0.0.1';
/** Cabecera propia obligatoria: un navegador no puede ponerla sin permiso previo (que nunca damos). */
export const CABECERA_CLI = 'x-wolf-cli';
export const VALOR_CABECERA_CLI = '1';

/** Cuerpo de `POST /orden` como mucho (las órdenes son cortas). */
export const LIMITE_CUERPO_CLI = 64 * 1024;
/** Órdenes que cambian algo esperando su turno como mucho. */
const MAX_EN_COLA = 8;
/** Registros seguidos a la vez como mucho. */
const MAX_SEGUIMIENTOS = 4;
/** Órdenes de solo lectura a la vez como mucho (semáforo). */
const MAX_LECTURAS = 4;
/** `abrir` lanza el navegador del usuario: a lo sumo 5 veces cada 10 s. */
const MAX_ABRIR = 5;
const VENTANA_ABRIR_MS = 10_000;
/** Un seguimiento de registros dura una hora como mucho (el cliente vuelve a pedirlo). */
export const DURACION_MAX_SEGUIMIENTO_MS = 60 * 60 * 1000;
/** Si el cliente no lee y se acumulan más de esto en el socket, se corta el seguimiento. */
const MAX_PENDIENTE_BYTES = 1024 * 1024;

const huella = (t: string): Buffer => createHash('sha256').update(t, 'utf8').digest();

class ErrorCuerpo extends Error {
  constructor(readonly codigo: 'cli.solicitud_grande' | 'cli.argumentos_invalidos') {
    super(codigo);
  }
}

/** Lo que `run/cli.json` lleva. El cliente lo lee para saber a dónde llamar y con qué token. */
export interface ArchivoCli {
  puerto: number;
  token: string;
  pid: number;
  version: { app: string; idioma: string | null };
}

export interface EstadoServidorCli {
  activo: boolean;
  direccion: string;
  puerto: number | null;
}

export interface DepsServidorCli {
  rutas: Rutas;
  operaciones: OperacionesCli;
  /** `Plataforma.restringirAlUsuario`: el archivo del token solo lo lee el usuario actual. */
  restringir: (ruta: string, o?: { carpeta?: boolean }) => Promise<boolean>;
  /**
   * Solo con una carpeta de datos de prueba (`WOLFCORE_DATOS`, que puede ser cualquiera): ¿el dueño
   * de `run/` es el usuario actual? Una carpeta de otro usuario se rechaza: su dueño podría
   * cambiarle los permisos y leer el token. Sin esta función no se comprueba (la carpeta de datos
   * normal vive en el perfil del usuario).
   */
  duenoEsUsuario?: (ruta: string) => Promise<boolean>;
  /** Versión de la app y el idioma (de `Config.ui.idioma`). */
  version: () => Promise<{ app: string; idioma: string | null }>;
  /** Para pruebas: plazos distintos de los de `PLAZOS_ORDEN_MS`. */
  plazos?: Partial<Record<OrdenCli, number>>;
  /** Para pruebas: duración máxima de un seguimiento de registros. */
  duracionSeguimientoMs?: number;
}

const respuestaError = (codigo: string, datos?: Record<string, string | number>): RespuestaCli => ({
  ok: false,
  error: { codigo, ...(datos ? { datos } : {}) },
});

function responder(
  res: http.ServerResponse,
  estado: number,
  cuerpo: RespuestaCli,
  extra: http.OutgoingHttpHeaders = {},
): void {
  if (res.headersSent) {
    res.end();
    return;
  }
  const texto = JSON.stringify(cuerpo);
  // Sin cabeceras CORS a propósito: ningún origen web puede leer una respuesta.
  res.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  });
  res.end(texto);
}

/**
 * Lee el cuerpo hasta `limite` bytes. Si lo supera, descarta el resto (para responder 413 sin
 * cortar la conexión a mitad del envío) y, pasado `limite * 8`, corta la conexión.
 */
function leerCuerpo(req: http.IncomingMessage, limite: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const partes: Buffer[] = [];
    let total = 0;
    req.on('data', (d: Buffer) => {
      total += d.length;
      if (total <= limite) partes.push(d);
      else if (total > limite * 8) {
        req.destroy();
        reject(new ErrorCuerpo('cli.solicitud_grande'));
      }
    });
    req.on('end', () => {
      if (total > limite) reject(new ErrorCuerpo('cli.solicitud_grande'));
      else resolve(Buffer.concat(partes).toString('utf8'));
    });
    req.on('error', reject);
  });
}

/**
 * Servidor de órdenes de la CLI `wolf` (D31): HTTP en 127.0.0.1 y puerto aleatorio.
 *
 * Seguridad:
 * - Solo escucha en el bucle local (no en toda la red) y nunca acepta un `Host` que no sea
 *   `127.0.0.1:<puerto>` (frena el DNS rebinding) ni una petición con `Origin` o `Sec-Fetch-Site`
 *   (un navegador siempre los manda; la CLI nunca). No contesta CORS ni `OPTIONS`.
 * - Token aleatorio de 32 bytes, nuevo en cada arranque, solo en `run/cli.json` (restringido al
 *   usuario; si no se puede restringir, el servidor no arranca), comparado en tiempo constante.
 * - Cabecera propia obligatoria y cuerpo `application/json` de 64 KB como mucho.
 * - Lista blanca de órdenes con argumentos validados con `zod`; cada una reutiliza las puertas del
 *   núcleo y nada de lo que sale lleva secretos.
 * - Límites de tiempo (cabeceras, cuerpo y cada orden), de conexiones y de cola.
 */
export class ServidorCli {
  private http: http.Server | null = null;
  private arrancando: Promise<void> | null = null;
  private puertoActual: number | null = null;
  private huellaToken: Buffer | null = null;
  private readonly sockets = new Set<Socket>();
  private readonly seguimientos = new Set<() => void>();
  private cola: Promise<unknown> = Promise.resolve();
  /** Turnos de órdenes que cambian algo ocupados: esperando, en curso o vencidas que siguen vivas. */
  private enCola = 0;
  private lecturas = 0;
  private reservados = 0;
  private abiertas: number[] = [];

  constructor(private readonly d: DepsServidorCli) {}

  estado(): EstadoServidorCli {
    return {
      activo: this.http !== null,
      direccion: DIRECCION,
      puerto: this.http ? this.puertoActual : null,
    };
  }

  iniciar(): Promise<void> {
    if (this.http) return Promise.resolve();
    this.arrancando ??= this.arrancar().finally(() => {
      this.arrancando = null;
    });
    return this.arrancando;
  }

  private async arrancar(): Promise<void> {
    const archivo = this.d.rutas.cliJson();
    // Un archivo de una sesión que se cortó nunca debe quedar con otro token.
    await rm(archivo, { force: true });
    const token = randomBytes(32).toString('base64url');
    const servidor = http.createServer((req, res) => void this.atender(req, res));
    servidor.headersTimeout = 2000;
    servidor.requestTimeout = 10_000;
    servidor.keepAliveTimeout = 2000;
    servidor.maxHeadersCount = 30;
    servidor.maxConnections = 32;
    servidor.on('connection', (s: Socket) => {
      this.sockets.add(s);
      s.on('close', () => this.sockets.delete(s));
    });
    await new Promise<void>((resolve, reject) => {
      const alFallar = (e: NodeJS.ErrnoException): void =>
        reject(new Error(`No se pudo iniciar el servidor de órdenes: ${e.message}`));
      servidor.once('error', alFallar);
      // Puerto aleatorio (0): otra carpeta de datos u otra instancia nunca choca con este.
      servidor.listen({ port: 0, host: DIRECCION, exclusive: true }, () => {
        servidor.off('error', alFallar);
        resolve();
      });
    });
    servidor.on('error', (e) => console.error('Error en el servidor de órdenes:', e.message));
    const puerto = (servidor.address() as AddressInfo).port;
    // Nombre aleatorio y `wx`: nunca se escribe sobre un archivo o enlace que ya estuviera ahí.
    const tmp = `${archivo}.${randomBytes(8).toString('hex')}.tmp`;
    const sinProteger = (): ErrorWolf =>
      new ErrorWolf(
        'cli.token_no_protegido',
        'No se pudo restringir el archivo del token al usuario actual: la CLI no se activa.',
      );
    try {
      const version = await this.d.version();
      const carpeta = path.dirname(archivo);
      await mkdir(carpeta, { recursive: true });
      // La carpeta `run/` primero (con herencia a lo que se cree dentro) y sin ser un enlace o
      // unión: otro usuario no puede cambiarla por un enlace ni leer lo que se escriba en ella.
      const esReal = async (): Promise<boolean> => {
        const st = await lstat(carpeta);
        return st.isDirectory() && !st.isSymbolicLink();
      };
      if (!(await esReal())) throw sinProteger();
      if (this.d.duenoEsUsuario && !(await this.d.duenoEsUsuario(carpeta).catch(() => false))) {
        throw new ErrorWolf(
          'cli.carpeta_ajena',
          'La carpeta run/ es de otro usuario: la CLI no se activa.',
        );
      }
      if (!(await this.d.restringir(carpeta, { carpeta: true }).catch(() => false))) {
        throw sinProteger();
      }
      if (!(await esReal())) throw sinProteger();
      // Vacío y restringido primero; el token se escribe después (el rename conserva la ACL).
      await writeFile(tmp, '', { mode: 0o600, flag: 'wx' });
      const protegido = await this.d.restringir(tmp).catch(() => false);
      if (!protegido) {
        // Sin poder limitarlo al usuario, un token en disco abriría la app a otros usuarios.
        throw sinProteger();
      }
      const contenido: ArchivoCli = { puerto, token, pid: process.pid, version };
      await writeFile(tmp, JSON.stringify(contenido), { mode: 0o600 });
      await rename(tmp, archivo);
    } catch (e) {
      await rm(tmp, { force: true }).catch(() => undefined);
      servidor.close();
      for (const s of this.sockets) s.destroy();
      throw e;
    }
    this.huellaToken = huella(token);
    this.puertoActual = puerto;
    this.http = servidor;
  }

  /** Deja de escuchar, corta los seguimientos y borra el archivo del token. */
  async detener(): Promise<void> {
    await this.arrancando?.catch(() => undefined);
    const servidor = this.http;
    this.http = null;
    this.puertoActual = null;
    this.huellaToken = null;
    for (const parar of [...this.seguimientos]) parar();
    await this.borrarArchivo();
    if (!servidor) return;
    const cerrado = new Promise<void>((r) => servidor.close(() => r()));
    servidor.closeAllConnections();
    for (const s of this.sockets) s.destroy();
    this.sockets.clear();
    await cerrado;
  }

  /** Borra `run/cli.json` solo si es de este proceso (otra instancia no pierde el suyo). */
  private async borrarArchivo(): Promise<void> {
    const archivo = this.d.rutas.cliJson();
    try {
      const a = JSON.parse(await readFile(archivo, 'utf8')) as Partial<ArchivoCli>;
      if (a.pid !== process.pid) return;
    } catch {
      // ilegible o inexistente: se quita igual
    }
    await rm(archivo, { force: true }).catch(() => undefined);
  }

  /* ───────────── HTTP ───────────── */

  private hostValido(host: string | undefined): boolean {
    const p = this.puertoActual;
    return p !== null && host === `${DIRECCION}:${p}`;
  }

  private tokenValido(cabecera: string | undefined): boolean {
    const esperado = this.huellaToken;
    if (!esperado || typeof cabecera !== 'string') return false;
    const m = /^Bearer (.{1,256})$/.exec(cabecera);
    if (!m) return false;
    return timingSafeEqual(huella(m[1]!), esperado);
  }

  private async atender(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // 1. Quién llama: solo la CLI local. Nada de esto da pistas (mismo cuerpo, sin detalle).
      if (
        !this.hostValido(req.headers.host) ||
        req.headers.origin !== undefined ||
        req.headers['sec-fetch-site'] !== undefined
      ) {
        responder(res, 403, respuestaError('cli.no_autorizado'));
        return;
      }
      const url = new URL(req.url ?? '/', `http://${DIRECCION}`);
      const ruta = url.pathname;
      const esOrden = ruta === '/orden';
      const esRegistros = ruta === '/registros';
      if (!esOrden && !esRegistros) {
        responder(res, 404, respuestaError('cli.orden_desconocida'));
        return;
      }
      const metodo = esOrden ? 'POST' : 'GET';
      if (req.method !== metodo) {
        responder(res, 405, respuestaError('cli.formato_no_admitido'), { Allow: metodo });
        return;
      }
      if (!this.tokenValido(req.headers.authorization)) {
        responder(res, 401, respuestaError('cli.no_autorizado'), {
          'WWW-Authenticate': 'Bearer realm="wolf"',
        });
        return;
      }
      // 2. Con token: la cabecera propia (frena un CSRF aunque el token se filtrara a una página).
      if (req.headers[CABECERA_CLI] !== VALOR_CABECERA_CLI) {
        responder(res, 403, respuestaError('cli.no_autorizado'));
        return;
      }
      if (esRegistros) {
        await this.atenderRegistros(req, res, url);
        return;
      }
      await this.atenderOrden(req, res);
    } catch (e) {
      console.error('Error al atender una orden de la CLI:', e instanceof Error ? e.message : e);
      responder(res, 500, respuestaError('cli.interno'));
    }
  }

  private async atenderOrden(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const tipo = (req.headers['content-type'] ?? '').split(';')[0]!.trim().toLowerCase();
    if (tipo !== 'application/json') {
      req.resume();
      responder(res, 415, respuestaError('cli.formato_no_admitido'), { Connection: 'close' });
      return;
    }
    let cuerpo: unknown;
    try {
      cuerpo = JSON.parse(await leerCuerpo(req, LIMITE_CUERPO_CLI));
    } catch (e) {
      if (e instanceof ErrorCuerpo) {
        responder(res, 413, respuestaError(e.codigo, { maximo: LIMITE_CUERPO_CLI }), {
          Connection: 'close',
        });
      } else responder(res, 400, respuestaError('cli.argumentos_invalidos'));
      return;
    }
    const c = CuerpoOrdenSchema.safeParse(cuerpo);
    if (!c.success) {
      responder(res, 400, respuestaError('cli.argumentos_invalidos'));
      return;
    }
    const { orden, args } = c.data;
    if (!esOrdenCli(orden)) {
      responder(res, 400, respuestaError('cli.orden_desconocida'));
      return;
    }
    let r: RespuestaCli;
    try {
      r = await this.correr(orden, () => ejecutarOrden(this.d.operaciones, orden, args));
    } catch (e) {
      r = { ok: false, error: errorParaCli(e) };
    }
    const estado = r.ok
      ? 200
      : r.error.codigo === 'cli.orden_desconocida' || r.error.codigo === 'cli.argumentos_invalidos'
        ? 400
        : r.error.codigo === 'cli.plazo'
          ? 504
          : r.error.codigo === 'cli.ocupado'
            ? 429
            : 422;
    responder(res, estado, r);
  }

  /**
   * Corre la orden con su plazo (que cuenta desde que llega, esperando turno incluido). Las que
   * cambian algo van de una en una: el turno se libera solo cuando la orden termina de verdad, y
   * una vencida que sigue viva sigue contando en `MAX_EN_COLA` (no se abre un hueco para otra que
   * pisaría lo mismo). Una que vence esperando su turno se salta al llegarle. Las de solo lectura
   * entran de a 4, y `abrir` tiene su límite de frecuencia.
   */
  private correr(orden: OrdenCli, fn: () => Promise<RespuestaCli>): Promise<RespuestaCli> {
    const plazo = this.d.plazos?.[orden] ?? PLAZOS_ORDEN_MS[orden];
    const tarea = { vencida: false };
    const conPlazo = (p: Promise<RespuestaCli | undefined>): Promise<RespuestaCli> =>
      new Promise<RespuestaCli>((resolve, reject) => {
        const t = setTimeout(() => {
          tarea.vencida = true;
          reject(new ErrorWolf('cli.plazo', 'La orden tardó demasiado.'));
        }, plazo);
        p.then(
          (v) => {
            clearTimeout(t);
            if (v) resolve(v);
            else reject(new ErrorWolf('cli.plazo', 'La orden tardó demasiado.'));
          },
          (e: unknown) => {
            clearTimeout(t);
            reject(e instanceof Error ? e : new Error(String(e)));
          },
        );
      });
    if (!ORDENES_QUE_CAMBIAN.includes(orden)) {
      if (orden === 'abrir') {
        const ahora = Date.now();
        this.abiertas = this.abiertas.filter((t) => ahora - t < VENTANA_ABRIR_MS);
        if (this.abiertas.length >= MAX_ABRIR) {
          return Promise.reject(new ErrorWolf('cli.ocupado', 'Demasiadas aperturas seguidas.'));
        }
        this.abiertas.push(ahora);
      }
      if (this.lecturas >= MAX_LECTURAS) {
        return Promise.reject(new ErrorWolf('cli.ocupado', 'Hay demasiadas órdenes a la vez.'));
      }
      this.lecturas++;
      const p = fn();
      p.catch(() => undefined);
      return conPlazo(p).finally(() => {
        // La lectura vencida sigue ocupando su lugar hasta que termina de verdad.
        void p.then(
          () => this.lecturas--,
          () => this.lecturas--,
        );
      });
    }
    if (this.enCola >= MAX_EN_COLA) {
      return Promise.reject(new ErrorWolf('cli.ocupado', 'Hay demasiadas órdenes esperando.'));
    }
    this.enCola++;
    const real: Promise<RespuestaCli | undefined> = this.cola.then(() =>
      tarea.vencida ? undefined : fn(),
    );
    this.cola = real
      .catch(() => undefined)
      .finally(() => {
        this.enCola--;
      });
    return conPlazo(real);
  }

  /** `GET /registros?sitio=&fuente=&lineas=&seguir=1`: las últimas líneas y, con `seguir`, las nuevas. */
  private async atenderRegistros(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    url: URL,
  ): Promise<void> {
    const q = url.searchParams;
    const crudo: Record<string, unknown> = { sitio: q.get('sitio') ?? '' };
    if (q.has('fuente')) crudo['fuente'] = q.get('fuente');
    if (q.has('lineas'))
      crudo['lineas'] = /^\d{1,5}$/.test(q.get('lineas')!) ? Number(q.get('lineas')) : -1;
    const args = ConsultaRegistrosSchema.safeParse(crudo);
    if (!args.success) {
      responder(res, 400, respuestaError('cli.argumentos_invalidos'));
      return;
    }
    const seguir = q.get('seguir') === '1';
    // El cupo se reserva antes de cualquier `await`: varias peticiones a la vez no lo rebasan.
    let reservado = false;
    const soltarReserva = (): void => {
      if (reservado) {
        reservado = false;
        this.reservados--;
      }
    };
    if (seguir) {
      if (this.seguimientos.size + this.reservados >= MAX_SEGUIMIENTOS) {
        responder(res, 429, respuestaError('cli.ocupado'));
        return;
      }
      reservado = true;
      this.reservados++;
    }
    const ops = this.d.operaciones;
    let id: string;
    let inicial: string[];
    try {
      id = await fuenteDeSitio(ops, args.data);
      inicial = await ops.leerRegistro(id, args.data.lineas ?? LINEAS_REGISTRO_CLI);
    } catch (e) {
      soltarReserva();
      responder(res, 422, { ok: false, error: errorParaCli(e) });
      return;
    }
    const lineasLimpias = (l: string[]): string[] => limpiarSalida(l) as string[];
    if (!seguir) {
      responder(res, 200, {
        ok: true,
        datos: {
          sitio: args.data.sitio,
          fuente: args.data.fuente ?? 'error',
          lineas: lineasLimpias(inicial),
        },
      });
      return;
    }
    // Flujo: una línea JSON por lote (`{"lineas": [...]}`); acaba si el cliente corta, se vence o se detiene la app.
    res.writeHead(200, {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    const escribir = (l: string[]): void => {
      if (res.writableEnded || res.destroyed) return;
      if (res.writableLength > MAX_PENDIENTE_BYTES) {
        terminar();
        return;
      }
      res.write(`${JSON.stringify({ lineas: lineasLimpias(l) })}\n`);
    };
    let dejar: (() => void) | null = null;
    let hecho = false;
    const terminar = (): void => {
      if (hecho) return;
      hecho = true;
      clearTimeout(plazo);
      this.seguimientos.delete(terminar);
      dejar?.();
      if (!res.writableEnded) res.end();
    };
    const plazo = setTimeout(terminar, this.d.duracionSeguimientoMs ?? DURACION_MAX_SEGUIMIENTO_MS);
    this.seguimientos.add(terminar);
    soltarReserva();
    res.on('close', terminar);
    req.on('error', terminar);
    escribir(inicial);
    try {
      dejar = await ops.seguirRegistro(id, escribir);
      // Se cortó mientras se preparaba el seguimiento.
      if (hecho) dejar();
    } catch {
      terminar();
    }
  }
}

import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { ErrorWolf } from '../errores';
import { realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { NOMBRE_BD_MONGO } from '../bd/basesDeDatos';
import { NOMBRE_BD_MYSQL } from '../bd/clienteMysql';
import { NOMBRE_BD_PG } from '../bd/clientePostgres';
import type { MotorBd } from '../bd/env';
import { rutaComparable } from '../plataforma/sistema';

/**
 * Lo que el servidor MCP publica del núcleo. `Nucleo` arma este objeto con sus propios métodos;
 * las operaciones opcionales aún no están integradas en el núcleo (Task 11): mientras falten, su
 * herramienta responde con un error claro.
 */
export interface OperacionesMcp {
  estadoGeneral(): Promise<unknown>;
  listarProyectos(): Promise<unknown>;
  estadoServicios(): Promise<unknown>;
  iniciarServicio(id: string): Promise<unknown>;
  detenerServicio(id: string): Promise<unknown>;
  listarBases(motor: MotorBd): Promise<unknown>;
  crearBase(motor: MotorBd, nombre: string): Promise<unknown>;
  respaldarBase(motor: MotorBd, base: string): Promise<unknown>;
  restaurarBase(
    motor: MotorBd,
    archivo: string,
    base: string,
    opts: { confirmarSobrescribir: boolean },
  ): Promise<unknown>;
  /** `confirmacion` es el nombre exacto de la base (como en la interfaz). */
  borrarBase(motor: MotorBd, nombre: string, confirmacion: string): Promise<unknown>;
  /** Carpeta de respaldos: lo único que `restaurar_base` puede leer. */
  carpetaRespaldos(): Promise<string>;
  abrirTunel(sitioId: string): Promise<unknown>;
  cerrarTunel(sitioId: string): Promise<unknown>;
  /**
   * Prepara la receta de un proyecto para una solicitud: lo que se muestra al confirmar y
   * `ejecutar()`, que corre exactamente esa receta (aunque mientras tanto se prepare otra). El
   * motor de recetas exige `sitio.confiado`.
   */
  prepararReceta?(sitioId: string): Promise<RecetaPreparada>;
  traerCambios?(sitioId: string): Promise<unknown>;
  /** Últimas `lineas` líneas (ya saneadas) de una fuente de registro. */
  leerRegistro?(id: string, lineas: number): Promise<string[]>;
  /** `confirmacion` es el nombre del proceso. */
  finalizarProceso?(pid: number, confirmacion: string): Promise<unknown>;
}

/** Receta lista para confirmar y ejecutar, atada a una sola solicitud. */
export interface RecetaPreparada {
  proyecto: string;
  /** Comando real de cada paso (acotado). */
  pasos: string[];
  /** Aviso que va primero (p. ej. la receta cambió desde que se marcó "Confío…"). */
  aviso?: string;
  ejecutar(): Promise<unknown>;
}

/** Datos estructurados de una confirmación (ya validados y sin saltos de línea ni bidi). */
export interface DatosConfirmacion {
  motor?: MotorBd;
  base?: string;
  /** Nombre del archivo de respaldo (sin carpeta). */
  archivo?: string;
  sobrescribir?: boolean;
  pid?: number;
  nombre?: string;
  proyecto?: string;
  pasos?: string[];
}

/** Lo que el núcleo emite como `'mcp:confirmar'` para que la ventana pregunte. */
export interface SolicitudConfirmacion {
  id: string;
  herramienta: string;
  resumen: string;
  datos: DatosConfirmacion;
}

export type MotivoCierre = 'vencida' | 'rechazada' | 'aprobada' | 'cancelada' | 'detenido';

/** Se emite como `'mcp:confirmacion-cerrada'` siempre que una confirmación deja de estar pendiente. */
export interface CierreConfirmacion {
  id: string;
  motivo: MotivoCierre;
}

export interface EstadoMcp {
  activo: boolean;
  direccion: '127.0.0.1';
  puerto: number | null;
  url: string | null;
}

export interface DepsMcp {
  operaciones: OperacionesMcp;
  /** Token Bearer (se genera y guarda la primera vez). Nunca se registra ni se emite. */
  token: () => Promise<string>;
  /** Puerto configurado (0 = cualquiera libre; solo para pruebas). */
  puerto: () => Promise<number>;
  emitirConfirmacion: (s: SolicitudConfirmacion) => void;
  /** La ventana cierra el diálogo de esa confirmación (respondida, vencida o cancelada). */
  emitirCierre?: (c: CierreConfirmacion) => void;
  /** Plazo para que la ventana responda (45 s por defecto). */
  plazoConfirmacionMs?: number;
  version?: string;
}

export const HERRAMIENTAS_MCP = [
  'estado_general',
  'listar_proyectos',
  'estado_servicios',
  'iniciar_servicio',
  'detener_servicio',
  'listar_bases',
  'crear_base',
  'respaldar_base',
  'restaurar_base',
  'borrar_base',
  'abrir_tunel',
  'cerrar_tunel',
  'ejecutar_receta',
  'traer_cambios',
  'leer_registro',
  'finalizar_proceso',
] as const;

const DIRECCION = '127.0.0.1';
const RUTA = '/mcp';
const LIMITE_CUERPO_BYTES = 1024 * 1024;
const PLAZO_CONFIRMACION_MS = 45_000;
const MAX_CONFIRMACIONES_PENDIENTES = 10;
export const LINEAS_REGISTRO_POR_DEFECTO = 200;
export const MAX_LINEAS_REGISTRO = 2000;

const MOTORES = ['mysql', 'mariadb', 'postgresql', 'mongodb'] as const;
const motor = z.enum(MOTORES, {
  error: 'Motor no válido: use mysql, mariadb, postgresql o mongodb.',
});
const nombreBase = z
  .string()
  .min(1, 'Falta el nombre de la base.')
  .max(64, 'El nombre de la base es demasiado largo.');
const sitioId = z.string().min(1, 'Falta el id del proyecto.').max(200);
const idServicio = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9.-]{0,40}$/,
    'El id del servicio no es válido (p. ej. nginx, mysql, php-8.4).',
  );

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Controles, saltos de línea (también U+2028/U+2029), marcas de dirección (bidi) y caracteres
 * invisibles (U+200B–U+200D, U+2060, U+FEFF): nunca en lo que muestra la ventana.
 */
const PROHIBIDOS =
  // eslint-disable-next-line no-control-regex -- se buscan justamente los caracteres de control.
  /[\u0000-\u001f\u007f-\u009f\u061c\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060\u2066-\u2069\ufeff]/;
const PROHIBIDOS_G = new RegExp(PROHIBIDOS.source, 'g');
const NOMBRE_PROCESO = /^[\w .-]{1,260}$/;
const MAX_PASOS_RESUMEN = 50;

/** Texto de terceros (p. ej. de wolfcore.yml) apto para el diálogo: una línea, acotada. */
const limpiar = (t: string, max = 120): string =>
  t.replace(PROHIBIDOS_G, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** Nombre de base válido para el motor (los mismos patrones que el resto del núcleo). */
function validarNombreBase(m: MotorBd, nombre: string): void {
  const patron =
    m === 'postgresql' ? NOMBRE_BD_PG : m === 'mongodb' ? NOMBRE_BD_MONGO : NOMBRE_BD_MYSQL;
  if (!patron.test(nombre))
    throw new Error(`El nombre de base "${limpiar(nombre)}" no es válido para ${m}.`);
}

class ErrorCuerpo extends Error {
  constructor(
    readonly codigo: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** Huella fija del token: compara en tiempo constante aunque los largos difieran. */
const huella = (t: string): Buffer => createHash('sha256').update(t, 'utf8').digest();

function responder(res: http.ServerResponse, codigo: number, mensaje: string, extra = {}): void {
  if (res.headersSent) {
    res.end();
    return;
  }
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: mensaje }, id: null }));
}

/**
 * Lee el cuerpo hasta `limite` bytes. Si lo supera, descarta el resto (para poder responder 413
 * sin cortar la conexión a mitad del envío) y, pasado `limite * 8`, corta la conexión.
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
        reject(new ErrorCuerpo(413, 'La solicitud es demasiado grande.'));
      }
    });
    req.on('end', () => {
      if (total > limite) reject(new ErrorCuerpo(413, 'La solicitud es demasiado grande.'));
      else resolve(Buffer.concat(partes).toString('utf8'));
    });
    req.on('error', reject);
  });
}

/** true si `hijo` está dentro de `carpeta` (sin salir con `..`); Windows sin mayúsculas. */
function estaDentro(carpeta: string, hijo: string): boolean {
  const norm = rutaComparable;
  const rel = path.relative(norm(carpeta), norm(hijo));
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

interface Pendiente {
  /** Cierra la confirmación una sola vez: limpia el plazo, avisa a la ventana y resuelve. */
  terminar: (motivo: MotivoCierre) => void;
}

/**
 * Servidor MCP local (transporte HTTP streamable del SDK oficial, sin sesiones) en
 * 127.0.0.1:<puerto>. Exige `Authorization: Bearer <token>`, rechaza Host ajenos (DNS rebinding)
 * y cualquier `Origin` (un navegador nunca debe llegar). Las herramientas destructivas
 * (`restaurar_base`, `borrar_base`, `finalizar_proceso`) y `ejecutar_receta` piden confirmación
 * en la ventana; la espera depende de la solicitud: si el cliente la corta, se cancela y la
 * acción no se ejecuta aunque luego llegue la aprobación.
 */
export class ServidorMcp {
  private http: http.Server | null = null;
  private arrancando: Promise<void> | null = null;
  private puertoActual: number | null = null;
  private huellaToken: Buffer | null = null;
  private readonly sockets = new Set<Socket>();
  private readonly pendientes = new Map<string, Pendiente>();

  constructor(private readonly d: DepsMcp) {}

  estado(): EstadoMcp {
    const p = this.http ? this.puertoActual : null;
    return {
      activo: p !== null,
      direccion: DIRECCION,
      puerto: p,
      url: p !== null ? `http://${DIRECCION}:${p}${RUTA}` : null,
    };
  }

  /** Arranca el servidor; si ya está en marcha no hace nada. Puerto ocupado: error en español. */
  iniciar(): Promise<void> {
    if (this.http) return Promise.resolve();
    this.arrancando ??= this.arrancar().finally(() => {
      this.arrancando = null;
    });
    return this.arrancando;
  }

  private async arrancar(): Promise<void> {
    const token = await this.d.token();
    if (token.length < 32)
      throw new ErrorWolf('mcp.token_invalido', 'El token del servidor MCP no es válido.');
    const puerto = await this.d.puerto();
    const servidor = http.createServer((req, res) => void this.atender(req, res));
    servidor.on('connection', (s: Socket) => {
      this.sockets.add(s);
      s.on('close', () => this.sockets.delete(s));
    });
    await new Promise<void>((resolve, reject) => {
      const alFallar = (e: NodeJS.ErrnoException): void => {
        reject(
          e.code === 'EADDRINUSE'
            ? new Error(
                `El puerto ${puerto} ya está en uso: elija otro puerto para el servidor MCP en Ajustes.`,
              )
            : e.code === 'EACCES'
              ? new Error(`No se puede usar el puerto ${puerto} para el servidor MCP.`)
              : new Error(`No se pudo iniciar el servidor MCP: ${e.message}`),
        );
      };
      servidor.once('error', alFallar);
      servidor.listen(puerto, DIRECCION, () => {
        servidor.off('error', alFallar);
        resolve();
      });
    });
    servidor.on('error', (e) => console.error('Error en el servidor MCP:', e.message));
    this.huellaToken = huella(token);
    this.puertoActual = (servidor.address() as AddressInfo).port;
    this.http = servidor;
  }

  /**
   * Vuelve a leer el token (p. ej. tras regenerarlo): el servidor en marcha acepta solo el nuevo
   * desde ya.
   */
  async recargarToken(): Promise<void> {
    // Un arranque en curso leyó el token anterior: se espera a que termine para pisarlo.
    await this.arrancando?.catch(() => undefined);
    const token = await this.d.token();
    if (token.length < 32)
      throw new ErrorWolf('mcp.token_invalido', 'El token del servidor MCP no es válido.');
    if (this.http) this.huellaToken = huella(token);
  }

  /** Detiene el servidor, cierra las conexiones y rechaza las confirmaciones pendientes. */
  async detener(): Promise<void> {
    await this.arrancando?.catch(() => undefined);
    for (const p of [...this.pendientes.values()]) p.terminar('detenido');
    const servidor = this.http;
    this.http = null;
    this.puertoActual = null;
    this.huellaToken = null;
    if (!servidor) return;
    const cerrado = new Promise<void>((r) => servidor.close(() => r()));
    servidor.closeAllConnections();
    for (const s of this.sockets) s.destroy();
    this.sockets.clear();
    await cerrado;
  }

  /**
   * Configuración para Claude Code (JSON): el comando `claude mcp add` y el bloque para
   * `.mcp.json`. Lleva el token: solo para copiar al portapapeles, nunca para registros.
   */
  async configuracionClaude(): Promise<string> {
    const token = await this.d.token();
    const puerto = this.puertoActual ?? (await this.d.puerto());
    const url = `http://${DIRECCION}:${puerto}${RUTA}`;
    const cabecera = `Authorization: Bearer ${token}`;
    return JSON.stringify(
      {
        comando: `claude mcp add --transport http wolfcore ${url} --header "${cabecera}"`,
        mcpJson: {
          mcpServers: {
            wolfcore: { type: 'http', url, headers: { Authorization: `Bearer ${token}` } },
          },
        },
      },
      null,
      2,
    );
  }

  /** URL del servidor (`http://127.0.0.1:<puerto>/mcp`), en marcha o según la configuración. */
  async url(): Promise<string> {
    const puerto = this.puertoActual ?? (await this.d.puerto());
    return `http://${DIRECCION}:${puerto}${RUTA}`;
  }

  /**
   * Configuración para copiar a mano en un agente, con el token por la variable
   * `WOLFCORE_MCP_TOKEN` (nunca el token): la línea de su CLI o el bloque de su archivo.
   */
  async configuracionPara(agente: 'claude-code' | 'codex' | 'hermes'): Promise<string> {
    const url = await this.url();
    const v = 'WOLFCORE_MCP_TOKEN';
    if (agente === 'claude-code') {
      return `claude mcp add --transport http --scope user wolfcore ${url} --header "Authorization: Bearer \${${v}}"`;
    }
    if (agente === 'codex') {
      return `[mcp_servers.wolfcore]\nurl = "${url}"\nbearer_token_env_var = "${v}"\n`;
    }
    return `mcp_servers:\n  wolfcore:\n    url: "${url}"\n    headers:\n      Authorization: "Bearer \${${v}}"\n`;
  }

  /**
   * Respuesta de la ventana a una solicitud `'mcp:confirmar'`. Devuelve false (y no hace nada)
   * si el id no existe o ya venció.
   */
  responderConfirmacion(id: string, aprobado: boolean): boolean {
    const p = this.pendientes.get(id);
    if (!p) return false;
    p.terminar(aprobado === true ? 'aprobada' : 'rechazada');
    return true;
  }

  /* ───────────── HTTP ───────────── */

  private hostValido(host: string | undefined): boolean {
    const p = this.puertoActual;
    return p !== null && (host === `${DIRECCION}:${p}` || host === `localhost:${p}`);
  }

  private tokenValido(cabecera: string | undefined): boolean {
    const esperado = this.huellaToken;
    if (!esperado || typeof cabecera !== 'string') return false;
    const m = /^Bearer (.+)$/.exec(cabecera);
    if (!m) return false;
    return timingSafeEqual(huella(m[1]!), esperado);
  }

  private async atender(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      if (!this.hostValido(req.headers.host)) {
        responder(res, 403, 'Host no permitido.');
        return;
      }
      if (req.headers.origin !== undefined) {
        responder(res, 403, 'Origen no permitido.');
        return;
      }
      if ((req.url ?? '').split('?')[0] !== RUTA) {
        responder(res, 404, 'Ruta no encontrada.');
        return;
      }
      if (!this.tokenValido(req.headers.authorization)) {
        responder(res, 401, 'Falta el token o no es válido.', {
          'WWW-Authenticate': 'Bearer realm="wolfcore"',
        });
        return;
      }
      // Sin sesiones: no hay flujo SSE por GET ni cierre de sesión por DELETE.
      if (req.method !== 'POST') {
        responder(res, 405, 'Método no permitido.', { Allow: 'POST' });
        return;
      }
      let cuerpo: unknown;
      try {
        cuerpo = JSON.parse(await leerCuerpo(req, LIMITE_CUERPO_BYTES));
      } catch (e) {
        if (e instanceof ErrorCuerpo) {
          responder(res, e.codigo, e.message, { Connection: 'close' });
        } else responder(res, 400, 'El cuerpo no es JSON válido.');
        return;
      }
      // Si la conexión se cierra (respuesta enviada o cliente que corta), lo pendiente se cancela.
      const solicitud = new AbortController();
      const mcp = this.crearServidorMcp(solicitud.signal);
      const transporte = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on('close', () => {
        solicitud.abort();
        void transporte.close();
        void mcp.close();
      });
      await mcp.connect(transporte);
      await transporte.handleRequest(req, res, cuerpo);
    } catch (e) {
      console.error('Error al atender una solicitud MCP:', mensajeDe(e));
      responder(res, 500, 'Error interno del servidor MCP.');
    }
  }

  /* ───────────── Confirmaciones ───────────── */

  /**
   * Pide confirmación a la ventana y, solo si se aprueba y la solicitud sigue viva, ejecuta
   * `accion`. Toda salida de la espera emite `emitirCierre` con su motivo.
   */
  private async confirmarYEjecutar(
    herramienta: string,
    resumen: string,
    datos: DatosConfirmacion,
    signal: AbortSignal,
    accion: () => Promise<unknown>,
  ): Promise<unknown> {
    await this.pedirConfirmacion(herramienta, limpiar(resumen, 2000), datos, signal);
    if (signal.aborted) {
      throw new ErrorWolf(
        'mcp.solicitud_cancelada',
        'El cliente MCP canceló la solicitud: no se ejecutó la acción.',
      );
    }
    return accion();
  }

  private pedirConfirmacion(
    herramienta: string,
    resumen: string,
    datos: DatosConfirmacion,
    signal: AbortSignal,
  ): Promise<void> {
    if (!this.http) return Promise.reject(new Error('El servidor MCP está detenido.'));
    if (signal.aborted) {
      return Promise.reject(new Error('El cliente MCP canceló la solicitud.'));
    }
    if (this.pendientes.size >= MAX_CONFIRMACIONES_PENDIENTES) {
      return Promise.reject(
        new Error(
          'Hay demasiadas confirmaciones pendientes en WolfCore Dev; espere a que se respondan.',
        ),
      );
    }
    const id = randomUUID();
    const plazo = this.d.plazoConfirmacionMs ?? PLAZO_CONFIRMACION_MS;
    const errores: Record<Exclude<MotivoCierre, 'aprobada'>, string> = {
      vencida: `Se agotó el tiempo de espera: nadie confirmó "${herramienta}" en WolfCore Dev en ${Math.round(plazo / 1000)} s.`,
      rechazada: `El usuario rechazó "${herramienta}" en WolfCore Dev.`,
      cancelada: `El cliente MCP canceló la solicitud: no se ejecutó "${herramienta}".`,
      detenido: 'El servidor MCP se detuvo antes de la confirmación.',
    };
    const espera = new Promise<void>((resolve, reject) => {
      const terminar = (motivo: MotivoCierre): void => {
        if (!this.pendientes.delete(id)) return;
        clearTimeout(temporizador);
        signal.removeEventListener('abort', alAbortar);
        try {
          this.d.emitirCierre?.({ id, motivo });
        } catch (e) {
          console.error('No se pudo avisar el cierre de la confirmación MCP:', mensajeDe(e));
        }
        if (motivo === 'aprobada') resolve();
        else reject(new Error(errores[motivo]));
      };
      const alAbortar = (): void => terminar('cancelada');
      const temporizador = setTimeout(() => terminar('vencida'), plazo);
      signal.addEventListener('abort', alAbortar, { once: true });
      this.pendientes.set(id, { terminar });
    });
    try {
      this.d.emitirConfirmacion({ id, herramienta, resumen, datos });
    } catch (e) {
      console.error('No se pudo pedir la confirmación MCP:', mensajeDe(e));
      this.pendientes.get(id)?.terminar('cancelada');
    }
    return espera;
  }

  /** Ruta real del respaldo, solo si es un archivo dentro de la carpeta de respaldos. */
  private async rutaRespaldo(archivo: string): Promise<string> {
    const carpeta = await realpath(await this.d.operaciones.carpetaRespaldos()).catch(() => {
      throw new Error('La carpeta de respaldos no existe todavía.');
    });
    const fuera = new Error(
      `Solo se pueden restaurar archivos de la carpeta de respaldos (${carpeta}).`,
    );
    const pedido = path.resolve(carpeta, archivo);
    if (!estaDentro(carpeta, pedido)) throw fuera;
    let real: string;
    try {
      real = await realpath(pedido);
    } catch {
      throw new Error(`No se encontró el respaldo ${path.basename(pedido)}.`);
    }
    // Un enlace o unión dentro de la carpeta podría apuntar afuera.
    if (!estaDentro(carpeta, real)) throw fuera;
    if (PROHIBIDOS.test(path.basename(real))) {
      throw new Error('El nombre del respaldo tiene caracteres no permitidos.');
    }
    if (!(await stat(real)).isFile())
      throw new Error('Elija un archivo de respaldo, no una carpeta.');
    return real;
  }

  /* ───────────── Herramientas ───────────── */

  private crearServidorMcp(solicitud: AbortSignal): McpServer {
    const ops = this.d.operaciones;
    const mcp = new McpServer({ name: 'wolfcore', version: this.d.version ?? '0.1.0' });
    const ejecutar = async (fn: () => Promise<unknown>): Promise<CallToolResult> => {
      try {
        const r = await fn();
        return { content: [{ type: 'text', text: JSON.stringify(r ?? { ok: true }, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: mensajeDe(e) }] };
      }
    };
    /** Se aborta si el cliente corta la conexión o cancela la llamada (notifications/cancelled). */
    const senal = (extra: { signal: AbortSignal }): AbortSignal =>
      AbortSignal.any([solicitud, extra.signal]);
    const disponible = <T>(op: T | undefined, nombre: string): T => {
      if (!op) throw new Error(`La herramienta "${nombre}" no está disponible en esta versión.`);
      return op;
    };
    const lectura = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
    const cambio = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
    const destructiva = { readOnlyHint: false, destructiveHint: true, openWorldHint: false };

    mcp.registerTool(
      'estado_general',
      {
        description: 'Servicios, proyectos, túneles y estado del archivo hosts de WolfCore Dev.',
        annotations: lectura,
      },
      () => ejecutar(() => ops.estadoGeneral()),
    );
    mcp.registerTool(
      'listar_proyectos',
      { description: 'Proyectos (sitios) configurados en WolfCore Dev.', annotations: lectura },
      () => ejecutar(() => ops.listarProyectos()),
    );
    mcp.registerTool(
      'estado_servicios',
      {
        description: 'Estado de cada servicio (Nginx, PHP, bases de datos…).',
        annotations: lectura,
      },
      () => ejecutar(() => ops.estadoServicios()),
    );
    mcp.registerTool(
      'iniciar_servicio',
      {
        description: 'Enciende un servicio (p. ej. nginx, mysql, php-8.4).',
        inputSchema: { id: idServicio },
        annotations: cambio,
      },
      ({ id }) => ejecutar(() => ops.iniciarServicio(id)),
    );
    mcp.registerTool(
      'detener_servicio',
      {
        description: 'Apaga un servicio (p. ej. nginx, mysql, php-8.4).',
        inputSchema: { id: idServicio },
        annotations: cambio,
      },
      ({ id }) => ejecutar(() => ops.detenerServicio(id)),
    );
    mcp.registerTool(
      'listar_bases',
      {
        description: 'Bases de datos de un motor local.',
        inputSchema: { motor },
        annotations: lectura,
      },
      ({ motor: m }) => ejecutar(() => ops.listarBases(m)),
    );
    mcp.registerTool(
      'crear_base',
      {
        description: 'Crea una base de datos vacía (con su usuario, si el motor lo usa).',
        inputSchema: { motor, nombre: nombreBase },
        annotations: cambio,
      },
      ({ motor: m, nombre }) => ejecutar(() => ops.crearBase(m, nombre)),
    );
    mcp.registerTool(
      'respaldar_base',
      {
        description: 'Respalda una base en la carpeta de respaldos de WolfCore Dev.',
        inputSchema: { motor, base: nombreBase },
        annotations: cambio,
      },
      ({ motor: m, base }) => ejecutar(() => ops.respaldarBase(m, base)),
    );
    mcp.registerTool(
      'restaurar_base',
      {
        description:
          'Restaura un respaldo de la carpeta de respaldos en una base. Pide confirmación en la ventana de WolfCore Dev. Con "sobrescribir" reemplaza una base con tablas (antes se respalda).',
        inputSchema: {
          motor,
          archivo: z
            .string()
            .min(1, 'Falta el archivo.')
            .max(1024)
            .describe(
              'Nombre del respaldo dentro de la carpeta de respaldos (o su ruta completa).',
            ),
          base: nombreBase,
          sobrescribir: z.boolean().default(false),
        },
        annotations: destructiva,
      },
      ({ motor: m, archivo, base, sobrescribir }, extra) =>
        ejecutar(async () => {
          validarNombreBase(m, base);
          const ruta = await this.rutaRespaldo(archivo);
          const nombre = path.basename(ruta);
          return this.confirmarYEjecutar(
            'restaurar_base',
            `Restaurar ${nombre} en la base "${base}" (${m})${sobrescribir ? ', reemplazando sus tablas' : ''}.`,
            { motor: m, base, archivo: nombre, sobrescribir },
            senal(extra),
            () => ops.restaurarBase(m, ruta, base, { confirmarSobrescribir: sobrescribir }),
          );
        }),
    );
    mcp.registerTool(
      'borrar_base',
      {
        description:
          'Borra una base de datos. Pide confirmación en la ventana de WolfCore Dev; no se puede deshacer.',
        inputSchema: { motor, nombre: nombreBase },
        annotations: destructiva,
      },
      ({ motor: m, nombre }, extra) =>
        ejecutar(async () => {
          validarNombreBase(m, nombre);
          return this.confirmarYEjecutar(
            'borrar_base',
            `Borrar la base "${nombre}" (${m}). No se puede deshacer.`,
            { motor: m, base: nombre },
            senal(extra),
            () => ops.borrarBase(m, nombre, nombre),
          );
        }),
    );
    mcp.registerTool(
      'abrir_tunel',
      {
        description: 'Abre un túnel público (Cloudflare) hacia un proyecto.',
        inputSchema: { sitioId },
        annotations: { ...cambio, openWorldHint: true },
      },
      ({ sitioId: id }) => ejecutar(() => ops.abrirTunel(id)),
    );
    mcp.registerTool(
      'cerrar_tunel',
      {
        description: 'Cierra el túnel de un proyecto.',
        inputSchema: { sitioId },
        annotations: cambio,
      },
      ({ sitioId: id }) => ejecutar(() => ops.cerrarTunel(id)),
    );
    mcp.registerTool(
      'ejecutar_receta',
      {
        description:
          'Ejecuta la receta de puesta en marcha de un proyecto (solo si está marcado como "Confío en este repositorio"). Pide confirmación en la ventana de WolfCore Dev.',
        inputSchema: { sitioId },
        annotations: cambio,
      },
      ({ sitioId: id }, extra) =>
        ejecutar(async () => {
          const preparar = disponible(ops.prepararReceta, 'ejecutar_receta');
          // La receta queda atada a esta solicitud: aprobarla corre la que se describió aquí.
          const r = await preparar.call(ops, id);
          const proyecto = limpiar(r.proyecto) || limpiar(id);
          const aviso = r.aviso ? limpiar(r.aviso) : '';
          const visibles = r.pasos.slice(0, MAX_PASOS_RESUMEN).map((p) => limpiar(p));
          const omitidos = r.pasos.length - visibles.length;
          const pasos = [
            ...(aviso ? [aviso] : []),
            ...visibles,
            ...(omitidos > 0 ? [`+${omitidos} pasos más`] : []),
          ];
          return this.confirmarYEjecutar(
            'ejecutar_receta',
            `Ejecutar la receta de "${proyecto}": ${pasos.length ? pasos.join(', ') : 'sin pasos'}.`,
            { proyecto, pasos },
            senal(extra),
            () => r.ejecutar(),
          );
        }),
    );
    mcp.registerTool(
      'traer_cambios',
      {
        description:
          'git fetch y avance rápido del repositorio del proyecto; con cambios locales o ramas divergidas no toca nada.',
        inputSchema: { sitioId },
        annotations: { ...cambio, openWorldHint: true },
      },
      ({ sitioId: id }) =>
        ejecutar(() => disponible(ops.traerCambios, 'traer_cambios').call(ops, id)),
    );
    mcp.registerTool(
      'leer_registro',
      {
        description: `Últimas líneas (saneadas) de una fuente de registro (p. ej. nginx, php:8.4). Hasta ${MAX_LINEAS_REGISTRO}.`,
        inputSchema: {
          id: z.string().min(1, 'Falta la fuente.').max(300),
          lineas: z
            .number()
            .int()
            .min(1)
            .max(MAX_LINEAS_REGISTRO, `Como mucho ${MAX_LINEAS_REGISTRO} líneas.`)
            .default(LINEAS_REGISTRO_POR_DEFECTO),
        },
        annotations: lectura,
      },
      ({ id, lineas }) =>
        ejecutar(() => disponible(ops.leerRegistro, 'leer_registro').call(ops, id, lineas)),
    );
    mcp.registerTool(
      'finalizar_proceso',
      {
        description:
          'Finaliza un proceso ajeno que ocupa un puerto. Pide confirmación en la ventana de WolfCore Dev.',
        inputSchema: {
          pid: z.number().int().positive(),
          nombre: z.string().min(1, 'Falta el nombre del proceso.').max(260),
        },
        annotations: destructiva,
      },
      ({ pid, nombre }, extra) =>
        ejecutar(async () => {
          const finalizar = disponible(ops.finalizarProceso, 'finalizar_proceso');
          if (!NOMBRE_PROCESO.test(nombre)) {
            throw new Error('El nombre del proceso no es válido (p. ej. node.exe).');
          }
          return this.confirmarYEjecutar(
            'finalizar_proceso',
            `Finalizar el proceso ${nombre} (PID ${pid}).`,
            { pid, nombre },
            senal(extra),
            () => finalizar.call(ops, pid, nombre),
          );
        }),
    );
    return mcp;
  }
}

import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { MotorBd } from '../bd/env';

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
  /** El motor de recetas exige `sitio.confiado`. */
  ejecutarReceta?(sitioId: string): Promise<unknown>;
  traerCambios?(sitioId: string): Promise<unknown>;
  /** Últimas `lineas` líneas (ya saneadas) de una fuente de registro. */
  leerRegistro?(id: string, lineas: number): Promise<string[]>;
  /** `confirmacion` es el nombre del proceso. */
  finalizarProceso?(pid: number, confirmacion: string): Promise<unknown>;
}

/** Lo que el núcleo emite como `'mcp:confirmar'` para que la ventana pregunte. */
export interface SolicitudConfirmacion {
  id: string;
  herramienta: string;
  resumen: string;
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
  /** Plazo para que la ventana responda (60 s por defecto). */
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
const PLAZO_CONFIRMACION_MS = 60_000;
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
  const norm = (p: string): string => (process.platform === 'win32' ? p.toLowerCase() : p);
  const rel = path.relative(norm(carpeta), norm(hijo));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

interface Pendiente {
  resolver: (aprobado: boolean) => void;
  rechazar: (e: Error) => void;
  temporizador: ReturnType<typeof setTimeout>;
}

/**
 * Servidor MCP local (transporte HTTP streamable del SDK oficial, sin sesiones) en
 * 127.0.0.1:<puerto>. Exige `Authorization: Bearer <token>`, rechaza Host ajenos (DNS rebinding)
 * y cualquier `Origin` (un navegador nunca debe llegar). Las herramientas destructivas
 * (`restaurar_base`, `borrar_base`, `finalizar_proceso`) piden confirmación en la ventana.
 *
 * `ejecutar_receta` no pide confirmación: el motor de recetas ya exige que el proyecto esté
 * marcado como "Confío en este repositorio", y sus pasos no borran datos sin confirmar.
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
    if (token.length < 32) throw new Error('El token del servidor MCP no es válido.');
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

  /** Detiene el servidor, cierra las conexiones y rechaza las confirmaciones pendientes. */
  async detener(): Promise<void> {
    await this.arrancando?.catch(() => undefined);
    for (const [id, p] of this.pendientes) {
      clearTimeout(p.temporizador);
      this.pendientes.delete(id);
      p.rechazar(new Error('El servidor MCP se detuvo antes de la confirmación.'));
    }
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

  /**
   * Respuesta de la ventana a una solicitud `'mcp:confirmar'`. Devuelve false (y no hace nada)
   * si el id no existe o ya venció.
   */
  responderConfirmacion(id: string, aprobado: boolean): boolean {
    const p = this.pendientes.get(id);
    if (!p) return false;
    clearTimeout(p.temporizador);
    this.pendientes.delete(id);
    p.resolver(aprobado === true);
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
      const mcp = this.crearServidorMcp();
      const transporte = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on('close', () => {
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

  private pedirConfirmacion(herramienta: string, resumen: string): Promise<void> {
    if (!this.http) return Promise.reject(new Error('El servidor MCP está detenido.'));
    if (this.pendientes.size >= MAX_CONFIRMACIONES_PENDIENTES) {
      return Promise.reject(
        new Error(
          'Hay demasiadas confirmaciones pendientes en WolfCore Dev; espere a que se respondan.',
        ),
      );
    }
    const id = randomUUID();
    const plazo = this.d.plazoConfirmacionMs ?? PLAZO_CONFIRMACION_MS;
    const espera = new Promise<boolean>((resolver, rechazar) => {
      const temporizador = setTimeout(() => {
        this.pendientes.delete(id);
        rechazar(
          new Error(
            `Se agotó el tiempo de espera: nadie confirmó "${herramienta}" en WolfCore Dev en ${Math.round(plazo / 1000)} s.`,
          ),
        );
      }, plazo);
      this.pendientes.set(id, { resolver, rechazar, temporizador });
    });
    try {
      this.d.emitirConfirmacion({ id, herramienta, resumen });
    } catch (e) {
      this.responderConfirmacion(id, false);
      console.error('No se pudo pedir la confirmación MCP:', mensajeDe(e));
    }
    return espera.then((aprobado) => {
      if (!aprobado) throw new Error(`El usuario rechazó "${herramienta}" en WolfCore Dev.`);
    });
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
    if (!(await stat(real)).isFile())
      throw new Error('Elija un archivo de respaldo, no una carpeta.');
    return real;
  }

  /* ───────────── Herramientas ───────────── */

  private crearServidorMcp(): McpServer {
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
      ({ motor: m, archivo, base, sobrescribir }) =>
        ejecutar(async () => {
          const ruta = await this.rutaRespaldo(archivo);
          await this.pedirConfirmacion(
            'restaurar_base',
            `Restaurar ${path.basename(ruta)} en la base "${base}" (${m})${sobrescribir ? ', reemplazando sus tablas' : ''}.`,
          );
          return ops.restaurarBase(m, ruta, base, { confirmarSobrescribir: sobrescribir });
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
      ({ motor: m, nombre }) =>
        ejecutar(async () => {
          await this.pedirConfirmacion(
            'borrar_base',
            `Borrar la base "${nombre}" (${m}). No se puede deshacer.`,
          );
          return ops.borrarBase(m, nombre, nombre);
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
          'Ejecuta la receta de puesta en marcha de un proyecto (solo si está marcado como "Confío en este repositorio").',
        inputSchema: { sitioId },
        annotations: cambio,
      },
      ({ sitioId: id }) =>
        ejecutar(() => disponible(ops.ejecutarReceta, 'ejecutar_receta').call(ops, id)),
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
      ({ pid, nombre }) =>
        ejecutar(async () => {
          const finalizar = disponible(ops.finalizarProceso, 'finalizar_proceso');
          await this.pedirConfirmacion(
            'finalizar_proceso',
            `Finalizar el proceso ${nombre} (PID ${pid}).`,
          );
          return finalizar.call(ops, pid, nombre);
        }),
    );
    return mcp;
  }
}

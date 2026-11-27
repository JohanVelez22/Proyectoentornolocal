import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type os from 'node:os';
import { ErrorWolf } from '../errores';
import { ipsLocales } from './lan';

/** Tiempo máximo que el servidor temporal sigue abierto. */
export const DURACION_SERVIDOR_CA_MS = 10 * 60_000;
const MAX_CA_BYTES = 64 * 1024;

export interface DepsServidorCa {
  /** Ruta de `ca.crt`: la única cosa que este servidor lee (nunca se arma desde la petición). */
  rutaCa: () => string;
  /** Crea la CA si falta (sin instalarla en ningún almacén). */
  asegurarCa: () => Promise<void>;
  interfaces?: () => NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  /** Solo para pruebas: qué IP se acepta (por defecto, las de `ipsLocales`). */
  permitirIp?: (ip: string) => boolean;
  duracionMs?: number;
  /** Puerto en el que escuchar en esa IP (el rango 8100-8199 de la red local); sin él, el sistema elige. */
  elegirPuerto?: (ip: string) => Promise<number>;
}

interface Abierto {
  servidor: http.Server;
  url: string;
  ip: string;
  expira: number;
  puerto: number;
  huellas: { sha256: string; sha1: string };
  temporizador: NodeJS.Timeout;
}

export interface CaMovilAbierta {
  url: string;
  ip: string;
  /** Marca de tiempo (ms) en que se cierra solo. */
  expira: number;
  /** Puerto en el que escucha (el que hay que permitir en el cortafuegos). */
  puerto: number;
  /** Huellas del `ca.crt` que se entrega, para compararlas en el móvil antes de confiar. */
  huellas: { sha256: string; sha1: string };
}

const conDosPuntos = (hex: string): string => (hex.toUpperCase().match(/../g) ?? []).join(':');

/** SHA-256 y SHA-1 del DER del certificado (lo que muestran Android e iOS), o null si no es un PEM. */
export function huellasDePem(pem: string): { sha256: string; sha1: string } | null {
  const m = /-----BEGIN CERTIFICATE-----([\s\S]+?)-----END CERTIFICATE-----/.exec(pem);
  if (!m) return null;
  const der = Buffer.from(m[1]!.replace(/\s+/g, ''), 'base64');
  if (der.length === 0) return null;
  return {
    sha256: conDosPuntos(createHash('sha256').update(der).digest('hex')),
    sha1: conDosPuntos(createHash('sha1').update(der).digest('hex')),
  };
}

/**
 * Servidor temporal que entrega `ca.crt` al móvil por la red local.
 *
 * - Solo sirve `GET /<token>/ca.crt` (token aleatorio de 128 bits que lleva el QR); cualquier
 *   otra ruta, método o token es un 404 idéntico. El archivo se lee de la ruta fija de la CA:
 *   nada de la petición llega a una ruta de disco, y si el archivo trajera una clave privada no
 *   se entrega.
 * - Escucha solo en la IP de la red local elegida (nunca 0.0.0.0), solo mientras el diálogo está
 *   abierto y un máximo de 10 minutos.
 */
export class ServidorCa {
  private abierto_: Abierto | null = null;
  private abriendo: Promise<CaMovilAbierta> | null = null;

  constructor(private readonly d: DepsServidorCa) {}

  abierto(): boolean {
    return this.abierto_ !== null;
  }

  abrir(o: { ip?: string } = {}): Promise<CaMovilAbierta> {
    this.abriendo ??= this.abrirInterno(o).finally(() => {
      this.abriendo = null;
    });
    return this.abriendo;
  }

  private async abrirInterno(o: { ip?: string }): Promise<CaMovilAbierta> {
    if (this.abierto_) {
      // Otra IP: el servidor anterior se cierra antes de abrir el nuevo (nunca dos a la vez).
      if (o.ip === undefined || o.ip === this.abierto_.ip) {
        const { url, ip, expira, puerto, huellas } = this.abierto_;
        return { url, ip, expira, puerto, huellas };
      }
      await this.cerrarYa();
    }
    const ips = ipsLocales(this.d.interfaces?.());
    if (ips.length === 0 && !o.ip) {
      throw new ErrorWolf('lan.sin_red', 'No hay una red local conectada.');
    }
    const permitida = this.d.permitirIp ?? ((ip: string) => ips.includes(ip));
    const ip = o.ip ?? ips[0]!;
    if (!permitida(ip)) {
      throw new ErrorWolf('lan.ip_no_valida', 'La IP no es de la red local.', {
        ip: ip.slice(0, 45),
      });
    }
    await this.d.asegurarCa();
    const huellas = huellasDePem(await readFile(this.d.rutaCa(), 'utf8'));
    if (!huellas) throw new ErrorWolf('lan.sin_red', 'La CA no es un certificado válido.');
    const puertoElegido = (await this.d.elegirPuerto?.(ip)) ?? 0;
    const token = randomBytes(16).toString('hex');
    const esperado = Buffer.from(`/${token}/ca.crt`);

    const servidor = http.createServer((req, res) => {
      void this.responder(req, res, esperado);
    });
    servidor.maxConnections = 8;
    servidor.requestTimeout = 10_000;
    servidor.headersTimeout = 5_000;
    servidor.keepAliveTimeout = 1_000;
    servidor.maxHeadersCount = 40;
    await new Promise<void>((resolve, reject) => {
      servidor.once('error', reject);
      servidor.listen({ host: ip, port: puertoElegido, exclusive: true }, () => {
        servidor.off('error', reject);
        resolve();
      });
    });
    servidor.on('error', () => undefined);
    const puerto = (servidor.address() as AddressInfo).port;
    const duracion = this.d.duracionMs ?? DURACION_SERVIDOR_CA_MS;
    const expira = Date.now() + duracion;
    const temporizador = setTimeout(() => void this.cerrarYa(), duracion);
    temporizador.unref();
    const url = `http://${ip}:${puerto}/${token}/ca.crt`;
    this.abierto_ = { servidor, url, ip, expira, puerto, huellas, temporizador };
    return { url, ip, expira, puerto, huellas };
  }

  private async responder(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    esperado: Buffer,
  ): Promise<void> {
    const noEncontrado = (): void => {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        Connection: 'close',
      });
      res.end('No encontrado');
    };
    try {
      const pedido = Buffer.from(req.url ?? '');
      const metodoOk = req.method === 'GET' || req.method === 'HEAD';
      if (!metodoOk || pedido.length !== esperado.length || !timingSafeEqual(pedido, esperado)) {
        noEncontrado();
        return;
      }
      const cuerpo = await readFile(this.d.rutaCa());
      const texto = cuerpo.toString('utf8');
      // Defensa en profundidad: solo un certificado, nunca una clave privada.
      if (
        cuerpo.length > MAX_CA_BYTES ||
        !texto.startsWith('-----BEGIN CERTIFICATE-----') ||
        /PRIVATE KEY/.test(texto)
      ) {
        noEncontrado();
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'application/x-x509-ca-cert',
        'Content-Length': cuerpo.length,
        'Content-Disposition': 'attachment; filename="wolfcore-dev-ca.crt"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        Connection: 'close',
      });
      res.end(req.method === 'HEAD' ? undefined : cuerpo);
    } catch {
      if (!res.headersSent) noEncontrado();
      else res.end();
    }
  }

  /** Cierra el servidor y corta las conexiones abiertas (idempotente). */
  async cerrar(): Promise<void> {
    // Un `abrir` en curso termina primero: si no, su servidor quedaría abierto tras cerrar.
    if (this.abriendo) await this.abriendo.catch(() => undefined);
    await this.cerrarYa();
  }

  private async cerrarYa(): Promise<void> {
    const a = this.abierto_;
    this.abierto_ = null;
    if (!a) return;
    clearTimeout(a.temporizador);
    await new Promise<void>((resolve) => {
      a.servidor.close(() => resolve());
      a.servidor.closeAllConnections();
    });
  }
}

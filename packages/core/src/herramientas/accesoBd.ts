import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { Rutas } from '../rutas';
import type { IdInstancia } from '../tipos';

/**
 * Entrada con un clic a la base de un proyecto, sin que la clave pase por la URL, el historial ni
 * los registros (D18).
 *
 * El núcleo emite un token de un solo uso (32 bytes aleatorios, 60 s, ligado al sitio y a la base)
 * y abre `http://127.0.0.1:<puerto>/…?wolfcore_token=<token>`. El script de entrada que sirve
 * Adminer o phpMyAdmin lo canjea contra un servidor HTTP del núcleo que solo escucha en 127.0.0.1,
 * con un secreto de proceso que solo conoce el PHP servido (`etc/acceso-bd/secreto`), y recibe las
 * credenciales en la respuesta. La clave solo vive en la memoria del núcleo hasta el canje.
 */

export type HerramientaBd = 'adminer' | 'phpmyadmin';
export const HERRAMIENTAS_BD: readonly HerramientaBd[] = ['adminer', 'phpmyadmin'];

/** Cuánto vive un token sin usar. */
export const TTL_TOKEN_MS = 60_000;
/** Tokens pendientes a la vez: el sexto invalida al más viejo. */
export const MAX_PENDIENTES = 5;
/** Parámetro de la URL que lleva el token. */
export const PARAMETRO_TOKEN = 'wolfcore_token';
/** Forma de un token: 32 bytes en base64url. */
export const TOKEN_VALIDO = /^[A-Za-z0-9_-]{43}$/;
/** Encabezado con el secreto de proceso en el canje. */
export const CABECERA_SECRETO = 'x-wolfcore-secreto';
/** Tope del cuerpo de un canje (un token y el nombre de la herramienta). */
const MAX_CUERPO_BYTES = 2048;
/** Página de entrada de cada herramienta (relativa a su raíz). */
export const PAGINA_ENTRADA: Record<HerramientaBd, string> = {
  adminer: '',
  phpmyadmin: 'wolfcore-signon.php',
};

export interface CredencialesAcceso {
  motor: 'mysql' | 'mariadb' | 'postgresql';
  host: '127.0.0.1';
  puerto: number;
  usuario: string;
  clave: string;
}

/** Lo que recibe el script de entrada al canjear (credenciales y a qué base entra). */
export interface DatosCanje extends CredencialesAcceso {
  sitioId: string;
  base: string;
  instancia: string;
}

export interface DepsAccesoBd {
  rutas: Rutas;
  /** Puerto fijo donde sirve cada herramienta (solo 127.0.0.1). */
  puertoHerramienta: (h: HerramientaBd) => number;
  /** Reloj en ms (solo pruebas). */
  ahora?: () => number;
}

interface Pendiente {
  herramienta: HerramientaBd;
  creado: number;
  datos: DatosCanje;
}

const huella = (token: string): string => createHash('sha256').update(token).digest('hex');

export class AccesoBd {
  private readonly pendiente = new Map<string, Pendiente>();
  private readonly secreto = randomBytes(32).toString('hex');
  private servidor: http.Server | null = null;
  private inicio: Promise<void> | null = null;

  constructor(private readonly d: DepsAccesoBd) {}

  private ahora(): number {
    return (this.d.ahora ?? Date.now)();
  }

  /** Secreto de este proceso (solo se escribe en `etc/acceso-bd/secreto`; nunca viaja a la interfaz). */
  secretoDeProceso(): string {
    return this.secreto;
  }

  /** Tokens vivos (pruebas). */
  pendientes(): number {
    this.purgar();
    return this.pendiente.size;
  }

  private purgar(): void {
    const t = this.ahora();
    for (const [k, p] of this.pendiente) if (t - p.creado >= TTL_TOKEN_MS) this.pendiente.delete(k);
  }

  /**
   * Token nuevo para entrar a `base` de `sitioId` con `credenciales`; devuelve la URL (solo token).
   * Arranca el servidor de canje la primera vez.
   */
  async emitir(o: {
    herramienta: HerramientaBd;
    sitioId: string;
    instancia: IdInstancia | string;
    base: string;
    credenciales: CredencialesAcceso;
  }): Promise<{ url: string }> {
    const c = o.credenciales;
    if (
      !HERRAMIENTAS_BD.includes(o.herramienta) ||
      !Number.isInteger(c.puerto) ||
      c.puerto < 1 ||
      c.puerto > 65_535 ||
      o.base === '' ||
      o.base.length > 128 ||
      c.usuario === '' ||
      o.sitioId === ''
    ) {
      throw new ErrorWolf(
        'acceso_bd.datos_invalidos',
        'Los datos de acceso a la base no son válidos.',
      );
    }
    await this.iniciar();
    this.purgar();
    while (this.pendiente.size >= MAX_PENDIENTES) {
      const masViejo = this.pendiente.keys().next().value;
      if (masViejo === undefined) break;
      this.pendiente.delete(masViejo);
    }
    const token = randomBytes(32).toString('base64url');
    this.pendiente.set(huella(token), {
      herramienta: o.herramienta,
      creado: this.ahora(),
      datos: {
        motor: c.motor,
        host: '127.0.0.1',
        puerto: c.puerto,
        usuario: c.usuario,
        clave: c.clave,
        sitioId: o.sitioId,
        base: o.base,
        instancia: String(o.instancia),
      },
    });
    const pagina = PAGINA_ENTRADA[o.herramienta];
    const puerto = this.d.puertoHerramienta(o.herramienta);
    return { url: `http://127.0.0.1:${puerto}/${pagina}?${PARAMETRO_TOKEN}=${token}` };
  }

  /**
   * Canjea un token: una sola vez, solo con el secreto de proceso y solo en la herramienta para la
   * que se emitió. Un token vencido o de otra herramienta se invalida. null si algo no cuadra.
   */
  canjear(token: string, secreto: string, herramienta: HerramientaBd): DatosCanje | null {
    // Sin el secreto no se toca nada: quien no lo tiene no puede quemar tokens ajenos.
    const a = Buffer.from(String(secreto));
    const b = Buffer.from(this.secreto);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    if (typeof token !== 'string' || !TOKEN_VALIDO.test(token)) return null;
    const clave = huella(token);
    const p = this.pendiente.get(clave);
    if (!p) return null;
    this.pendiente.delete(clave);
    if (this.ahora() - p.creado >= TTL_TOKEN_MS || p.herramienta !== herramienta) return null;
    return p.datos;
  }

  /** Enciende el servidor de canje (en 127.0.0.1, puerto libre) y deja el secreto y el puerto. */
  iniciar(): Promise<void> {
    this.inicio ??= this.arrancar().catch((e: unknown) => {
      this.inicio = null;
      throw e;
    });
    return this.inicio;
  }

  private async arrancar(): Promise<void> {
    const servidor = http.createServer((req, res) => this.atender(req, res));
    servidor.requestTimeout = 5_000;
    servidor.headersTimeout = 5_000;
    servidor.keepAliveTimeout = 1_000;
    await new Promise<void>((resolver, rechazar) => {
      servidor.once('error', rechazar);
      servidor.listen(0, '127.0.0.1', () => resolver());
    });
    this.servidor = servidor;
    const puerto = (servidor.address() as AddressInfo).port;
    const dir = this.d.rutas.accesoBd();
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await chmod(dir, 0o700).catch(() => undefined);
    // Primero el secreto y al final el puerto: quien ve el puerto ya tiene el secreto.
    await writeFile(path.join(dir, 'secreto'), `${this.secreto}\n`, { mode: 0o600 });
    await writeFile(path.join(dir, 'puerto'), `${puerto}\n`, { mode: 0o600 });
  }

  async detener(): Promise<void> {
    this.pendiente.clear();
    const s = this.servidor;
    this.servidor = null;
    this.inicio = null;
    const dir = this.d.rutas.accesoBd();
    await rm(path.join(dir, 'secreto'), { force: true }).catch(() => undefined);
    await rm(path.join(dir, 'puerto'), { force: true }).catch(() => undefined);
    if (!s) return;
    await new Promise<void>((r) => {
      s.close(() => r());
      s.closeAllConnections();
    });
  }

  private responder(res: http.ServerResponse, codigo: number, cuerpo: unknown = {}): void {
    res.writeHead(codigo, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      connection: 'close',
    });
    res.end(JSON.stringify(cuerpo));
  }

  private atender(req: http.IncomingMessage, res: http.ServerResponse): void {
    const puerto = (this.servidor?.address() as AddressInfo | null)?.port;
    // El Host debe ser el literal de loopback: una página web que apunte un nombre a 127.0.0.1
    // (DNS rebinding) no llega aquí.
    if (req.headers.host !== `127.0.0.1:${puerto}`) return this.responder(res, 403);
    if (req.url !== '/canjear') return this.responder(res, 404);
    if (req.method !== 'POST') return this.responder(res, 405);
    const secreto = req.headers[CABECERA_SECRETO];
    let largo = 0;
    const trozos: Buffer[] = [];
    let cortado = false;
    req.on('data', (t: Buffer) => {
      largo += t.length;
      if (largo > MAX_CUERPO_BYTES) {
        if (!cortado) {
          cortado = true;
          this.responder(res, 413);
          req.destroy();
        }
        return;
      }
      trozos.push(t);
    });
    req.on('end', () => {
      if (cortado) return;
      let datos: unknown;
      try {
        datos = JSON.parse(Buffer.concat(trozos).toString('utf8'));
      } catch {
        return this.responder(res, 400);
      }
      const d = datos as { token?: unknown; herramienta?: unknown } | null;
      if (
        !d ||
        typeof d.token !== 'string' ||
        typeof d.herramienta !== 'string' ||
        !HERRAMIENTAS_BD.includes(d.herramienta as HerramientaBd)
      ) {
        return this.responder(res, 400);
      }
      const r =
        typeof secreto === 'string'
          ? this.canjear(d.token, secreto, d.herramienta as HerramientaBd)
          : null;
      if (!r) return this.responder(res, 403);
      this.responder(res, 200, r);
    });
    req.on('error', () => undefined);
  }
}

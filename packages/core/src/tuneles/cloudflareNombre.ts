import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { enmascararSecretos } from '../patronesSecretos';
import type { Ejecutor, PlataformaCompleta } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { Sitio } from '../tipos';
import {
  dominioPublicoValido,
  nombreTunelValido,
  type ContextoTunel,
  type LanzamientoTunel,
  type ProveedorTunel,
  type SecretosTunel,
} from './proveedor';

export interface DepsCloudflareNombre {
  rutas: Rutas;
  plataforma: Pick<PlataformaCompleta, 'restringirAlUsuario'>;
  ejecutor: Ejecutor;
  /** Ruta del cloudflared instalado (lanza `tuneles.cloudflared_no_instalado` si no hay). */
  ejecutable: () => Promise<string>;
  secretos: () => SecretosTunel | null;
}

/** Lo que cloudflared guarda al crear un túnel (su `<UUID>.json`). */
interface Credencial {
  AccountTag: string;
  TunnelSecret: string;
  TunnelID: string;
  Endpoint?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BASE64 = /^[A-Za-z0-9+/_=-]{8,200}$/;
const CUENTA = /^[A-Za-z0-9]{8,64}$/;
const LISTO = /Registered tunnel connection/i;

export const idSecretoTunelNombre = (nombre: string): string => `tunel:cloudflare-nombre:${nombre}`;

/** Lo que muestra un error de cloudflared: sin secretos, en una línea y acotado. */
export function detalleSeguro(texto: string, secretos: string[] = []): string {
  let t = texto;
  for (const s of secretos) if (s.length >= 4) t = t.split(s).join('***');
  t = enmascararSecretos(t).replace(/\s+/g, ' ').trim();
  return t.length > 300 ? `${t.slice(0, 300)}…` : t;
}

function credencialInvalida(): ErrorWolf {
  return new ErrorWolf(
    'tuneles.cloudflare_sin_credencial',
    'La credencial del túnel no es válida.',
  );
}

function leerCredencial(texto: string): Credencial {
  let o: unknown;
  try {
    o = JSON.parse(texto);
  } catch {
    throw credencialInvalida();
  }
  const r = (o ?? {}) as Record<string, unknown>;
  const tag = r['AccountTag'];
  const secreto = r['TunnelSecret'];
  const id = r['TunnelID'];
  if (
    typeof tag !== 'string' ||
    !CUENTA.test(tag) ||
    typeof secreto !== 'string' ||
    !BASE64.test(secreto) ||
    typeof id !== 'string' ||
    !UUID.test(id)
  ) {
    throw credencialInvalida();
  }
  const c: Credencial = { AccountTag: tag, TunnelSecret: secreto, TunnelID: id };
  if (typeof r['Endpoint'] === 'string' && r['Endpoint'] !== '') {
    c.Endpoint = r['Endpoint'].slice(0, 100);
  }
  return c;
}

/**
 * Cloudflare con nombre (dominio propio). El certificado de la cuenta (`cert.pem`) vive en
 * `etc/cloudflared/` (nunca en `~/.cloudflared`). La credencial del túnel (los datos del
 * `<UUID>.json`) vive solo en `AlmacenSecretos` (`tunel:cloudflare-nombre:<túnel>`): `cloudflared`
 * solo la lee de un archivo (los túneles creados por consola no admiten `--token`, que es de los
 * gestionados en el panel), así que al abrir se escribe un archivo restringido al usuario en
 * `run/cloudflared/` que se borra en cuanto el túnel conecta, al cerrarlo, si el proceso muere y
 * al arrancar la app tras una caída.
 */
export class CloudflareNombre implements ProveedorTunel {
  readonly id = 'cloudflare-nombre' as const;

  constructor(private readonly d: DepsCloudflareNombre) {}

  private cert(): string {
    return path.join(this.d.rutas.cloudflaredEtc(), 'cert.pem');
  }
  private archivoCredencial(sitioId: string): string {
    return path.join(this.d.rutas.cloudflaredRun(), `${sitioId}.json`);
  }
  private archivoConfig(sitioId: string): string {
    return path.join(this.d.rutas.cloudflaredEtc(), `${sitioId}.yml`);
  }

  /** ¿Hay una cuenta de Cloudflare conectada (cert.pem)? */
  tieneCuenta(): boolean {
    return existsSync(this.cert());
  }

  async disponible(sitio: Sitio): Promise<{ ok: boolean; codigo?: string }> {
    if (!this.tieneCuenta()) return { ok: false, codigo: 'tuneles.cloudflare_sin_cuenta' };
    if (!nombreTunelValido(sitio.tunel?.nombre) || !dominioPublicoValido(sitio.tunel?.dominio)) {
      return { ok: false, codigo: 'tuneles.cloudflare_datos_invalidos' };
    }
    const s = this.d.secretos();
    if (!s || !s.disponible()) return { ok: false, codigo: 'tuneles.sin_cifrado' };
    return { ok: true };
  }

  private async cloudflared(args: string[], timeoutMs: number): Promise<void> {
    const exe = await this.d.ejecutable();
    const r = await this.d.ejecutor(exe, ['tunnel', '--origincert', this.cert(), ...args], {
      timeoutMs,
      env: { TUNNEL_ORIGIN_CERT: this.cert() },
    });
    if (r.codigo !== 0) {
      const detalle = detalleSeguro(`${r.stderr}\n${r.stdout}`);
      throw new ErrorWolf('tuneles.cloudflare_fallo', `cloudflared falló: ${detalle}`, { detalle });
    }
  }

  /** `cloudflared tunnel login`: abre el navegador del usuario; el certificado queda en `etc/`. */
  async conectar(): Promise<void> {
    const exe = await this.d.ejecutable();
    await mkdir(this.d.rutas.cloudflaredEtc(), { recursive: true });
    const r = await this.d.ejecutor(exe, ['tunnel', '--origincert', this.cert(), 'login'], {
      timeoutMs: 300_000,
      env: { TUNNEL_ORIGIN_CERT: this.cert() },
    });
    if (r.codigo !== 0 || !this.tieneCuenta()) {
      const detalle = detalleSeguro(`${r.stderr}\n${r.stdout}`);
      throw new ErrorWolf('tuneles.cloudflare_fallo', `cloudflared login falló: ${detalle}`, {
        detalle,
      });
    }
    // El certificado da acceso a la cuenta: solo el usuario. Si no se puede, no se conserva.
    if (!(await this.d.plataforma.restringirAlUsuario(this.cert()).catch(() => false))) {
      await rm(this.cert(), { force: true });
      throw new ErrorWolf(
        'tuneles.credencial_no_protegida',
        'No se pudo restringir el certificado de Cloudflare al usuario; no se guardó.',
      );
    }
  }

  /** Olvida la cuenta: borra el certificado. Las credenciales de túneles siguen en el almacén. */
  async desconectar(): Promise<void> {
    await rm(this.cert(), { force: true });
  }

  /**
   * Crea el túnel (si no existe ya su credencial) y guarda su credencial en el almacén de
   * secretos. El `<UUID>.json` que escribe cloudflared va a un archivo temporal que se borra.
   */
  async crearTunel(nombre: string): Promise<void> {
    if (!nombreTunelValido(nombre)) throw this.datosInvalidos();
    if (!this.tieneCuenta()) throw this.sinCuenta();
    const s = this.d.secretos();
    if (!s || !s.disponible()) throw this.sinCifrado();
    if ((await s.leer(idSecretoTunelNombre(nombre))) !== null) return;
    const carpeta = this.d.rutas.cloudflaredRun();
    await mkdir(carpeta, { recursive: true });
    const tmp = path.join(carpeta, `crear-${randomBytes(6).toString('hex')}.json`);
    try {
      await this.cloudflared(['create', '--credentials-file', tmp, nombre], 60_000);
      // Lo que cloudflared dejó en el archivo se limita al usuario mientras se lee.
      await this.d.plataforma.restringirAlUsuario(tmp).catch(() => false);
      const texto = await readFile(tmp, 'utf8').catch(() => '');
      const c = leerCredencial(texto);
      await s.guardar(idSecretoTunelNombre(nombre), JSON.stringify(c));
    } finally {
      await rm(tmp, { force: true });
    }
  }

  /** `tunnel route dns`: apunta el dominio público al túnel. */
  async enrutar(nombre: string, dominio: string): Promise<void> {
    if (!nombreTunelValido(nombre) || !dominioPublicoValido(dominio)) throw this.datosInvalidos();
    if (!this.tieneCuenta()) throw this.sinCuenta();
    await this.cloudflared(['route', 'dns', nombre, dominio], 60_000);
  }

  /** Borra la credencial guardada de un túnel (al dejar de usarlo). */
  async olvidar(nombre: string): Promise<void> {
    if (!nombreTunelValido(nombre)) throw this.datosInvalidos();
    await this.d.secretos()?.borrar(idSecretoTunelNombre(nombre));
  }

  private datosInvalidos(): ErrorWolf {
    return new ErrorWolf(
      'tuneles.cloudflare_datos_invalidos',
      'El nombre del túnel o el dominio no son válidos.',
    );
  }
  private sinCuenta(): ErrorWolf {
    return new ErrorWolf('tuneles.cloudflare_sin_cuenta', 'Conecte primero con Cloudflare.');
  }
  private sinCifrado(): ErrorWolf {
    return new ErrorWolf('tuneles.sin_cifrado', 'El cifrado del sistema no está disponible.');
  }

  async abrir(sitio: Sitio, c: ContextoTunel): Promise<LanzamientoTunel> {
    const nombre = sitio.tunel?.nombre;
    const dominio = sitio.tunel?.dominio;
    // Antes de tocar el almacén o el disco: datos inválidos no llegan a cloudflared.
    if (!nombreTunelValido(nombre) || !dominioPublicoValido(dominio)) throw this.datosInvalidos();
    const s = this.d.secretos();
    if (!s || !s.disponible()) throw this.sinCifrado();
    const guardado = await s.leer(idSecretoTunelNombre(nombre));
    if (guardado === null) {
      throw new ErrorWolf(
        'tuneles.cloudflare_sin_credencial',
        'Este túnel no tiene credencial guardada: créelo de nuevo.',
      );
    }
    const cred = leerCredencial(guardado);
    const archivo = this.archivoCredencial(sitio.id);
    const config = this.archivoConfig(sitio.id);
    await mkdir(this.d.rutas.cloudflaredRun(), { recursive: true });
    await mkdir(this.d.rutas.cloudflaredEtc(), { recursive: true });
    await rm(archivo, { force: true });
    try {
      await writeFile(archivo, JSON.stringify(cred), { flag: 'wx', mode: 0o600 });
      if (!(await this.d.plataforma.restringirAlUsuario(archivo).catch(() => false))) {
        throw new ErrorWolf(
          'tuneles.credencial_no_protegida',
          'No se pudo restringir la credencial del túnel al usuario; no se abrió el túnel.',
        );
      }
      // El YAML lleva rutas y nombres, nunca la credencial (solo la ruta de su archivo).
      const q = (v: string): string => JSON.stringify(v);
      const yml = [
        `tunnel: ${q(cred.TunnelID)}`,
        `credentials-file: ${q(archivo)}`,
        'ingress:',
        `  - hostname: ${q(dominio)}`,
        `    service: ${q(`http://127.0.0.1:${c.puertoNginx}`)}`,
        '    originRequest:',
        `      httpHostHeader: ${q(sitio.dominio)}`,
        '  - service: http_status:404',
        '',
      ].join('\n');
      await writeFile(config, yml, 'utf8');
    } catch (e) {
      await rm(archivo, { force: true });
      throw e;
    }
    return {
      comando: c.cloudflared,
      args: ['tunnel', '--no-autoupdate', '--config', config, '--logfile', c.logCloudflared, 'run'],
      secretos: [cred.TunnelSecret, JSON.stringify(cred)],
    };
  }

  url(sitio: Sitio, texto: string): string | null {
    const dominio = sitio.tunel?.dominio;
    if (!dominioPublicoValido(dominio)) return null;
    return LISTO.test(texto) ? `https://${dominio}` : null;
  }

  /** Ya conectó: cloudflared tiene la credencial en memoria, el archivo sobra. */
  async alEstarListo(sitioId: string): Promise<void> {
    await rm(this.archivoCredencial(sitioId), { force: true });
  }

  async cerrar(sitioId: string): Promise<void> {
    await rm(this.archivoCredencial(sitioId), { force: true });
  }

  async barrer(vivos: ReadonlySet<string>): Promise<void> {
    let nombres: string[] = [];
    try {
      nombres = await readdir(this.d.rutas.cloudflaredRun());
    } catch {
      return;
    }
    for (const n of nombres) {
      const m = /^(.+)\.json$/.exec(n);
      if (!m || vivos.has(m[1]!)) continue;
      await rm(path.join(this.d.rutas.cloudflaredRun(), n), { force: true });
    }
  }
}

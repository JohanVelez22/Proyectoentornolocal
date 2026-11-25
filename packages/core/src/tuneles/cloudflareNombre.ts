import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { enmascararSecretos } from '../patronesSecretos';
import type { Ejecutor, Lanzador, PlataformaCompleta } from '../plataforma/tipos';
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
  /** Para `tunnel login` (espera al navegador y muestra su URL en vivo). */
  lanzar?: Lanzador;
  /** La URL de autorización apareció (o, con null, ya no hace falta). */
  alAutorizacion?: (url: string | null) => void;
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

/**
 * La URL de autorización del `login` si la línea trae una de Cloudflare (https, host
 * `cloudflare.com` o un subdominio): la que se muestra al usuario para abrirla en su navegador.
 */
export function urlAutorizacion(linea: string): string | null {
  const m = /https:\/\/[^\s"'<>]{1,2000}/.exec(linea);
  if (!m) return null;
  try {
    const u = new URL(m[0]);
    const h = u.hostname.toLowerCase();
    return u.protocol === 'https:' && (h === 'cloudflare.com' || h.endsWith('.cloudflare.com'))
      ? u.toString()
      : null;
  } catch {
    return null;
  }
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
 * `<UUID>.json`) vive solo en `AlmacenSecretos` (`tunel:cloudflare-nombre:<túnel>`) y llega a
 * `cloudflared` por `TUNNEL_CRED_CONTENTS` en el entorno del proceso (`envSecreto`: no se escribe
 * en archivos ni en `estado.json`). Los túneles creados por consola no admiten `--token`, que es
 * de los gestionados en el panel.
 */
export class CloudflareNombre implements ProveedorTunel {
  readonly id = 'cloudflare-nombre' as const;

  constructor(private readonly d: DepsCloudflareNombre) {}

  private cert(): string {
    return path.join(this.d.rutas.cloudflaredEtc(), 'cert.pem');
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

  private async cloudflared(args: string[], timeoutMs: number): Promise<string> {
    const exe = await this.d.ejecutable();
    const r = await this.d.ejecutor(exe, ['tunnel', '--origincert', this.cert(), ...args], {
      timeoutMs,
      quitarEntorno: ['TUNNEL_'],
      env: { TUNNEL_ORIGIN_CERT: this.cert() },
    });
    if (r.codigo !== 0) {
      const detalle = detalleSeguro(`${r.stderr}\n${r.stdout}`);
      throw new ErrorWolf('tuneles.cloudflare_fallo', `cloudflared falló: ${detalle}`, { detalle });
    }
    return `${r.stdout}
${r.stderr}`;
  }

  private conexion: AbortController | null = null;

  /** Cancela el `login` en curso (si lo hay): `conectar()` resuelve con `{cancelado: true}`. */
  cancelarConexion(): void {
    this.conexion?.abort();
  }

  /**
   * `cloudflared tunnel login`. El `login` real ignora `--origincert` y siempre escribe en
   * `<inicio>/.cloudflared/cert.pem`, así que se lanza con un inicio temporal propio (`HOME` y
   * `USERPROFILE` en `run/cloudflared-login`); el certificado se mueve a `etc/cloudflared/`, se
   * restringe al usuario y la carpeta temporal se borra. Nunca se lee ni se toca el `~/.cloudflared`
   * real. La URL de autorización se muestra en cuanto aparece y el usuario puede cancelar.
   */
  async conectar(): Promise<{ cancelado: boolean }> {
    const lanzar = this.d.lanzar;
    if (!lanzar) {
      throw new ErrorWolf(
        'tuneles.proveedor_no_disponible',
        'Cloudflare con nombre no está disponible.',
        { proveedor: 'cloudflare-nombre' },
      );
    }
    if (this.conexion) {
      throw new ErrorWolf('tuneles.cloudflare_conexion_en_curso', 'Ya hay una conexión en curso.');
    }
    const exe = await this.d.ejecutable();
    const inicio = this.d.rutas.cloudflaredLogin();
    const control = new AbortController();
    this.conexion = control;
    const lineas: string[] = [];
    let urlVista = false;
    try {
      await rm(inicio, { recursive: true, force: true });
      await mkdir(inicio, { recursive: true });
      await this.d.plataforma.restringirAlUsuario(inicio).catch(() => false);
      let codigo: number;
      try {
        ({ codigo } = await lanzar(exe, ['tunnel', 'login'], {
          env: { HOME: inicio, USERPROFILE: inicio },
          quitarEntorno: ['TUNNEL_'],
          senal: control.signal,
          alLinea: (l) => {
            if (lineas.length < 20) lineas.push(l);
            if (urlVista) return;
            const url = urlAutorizacion(l);
            if (url) {
              urlVista = true;
              this.d.alAutorizacion?.(url);
            }
          },
        }));
      } catch (e) {
        if (control.signal.aborted) return { cancelado: true };
        throw e;
      }
      if (control.signal.aborted) return { cancelado: true };
      const origen = path.join(inicio, '.cloudflared', 'cert.pem');
      if (codigo !== 0 || !existsSync(origen)) {
        const detalle = detalleSeguro(lineas.join(' '));
        throw new ErrorWolf('tuneles.cloudflare_fallo', `cloudflared login falló: ${detalle}`, {
          detalle,
        });
      }
      await mkdir(this.d.rutas.cloudflaredEtc(), { recursive: true });
      await copyFile(origen, this.cert());
      // El certificado da acceso a la cuenta: solo el usuario. Si no se puede, no se conserva.
      if (!(await this.d.plataforma.restringirAlUsuario(this.cert()).catch(() => false))) {
        await rm(this.cert(), { force: true });
        throw new ErrorWolf(
          'tuneles.credencial_no_protegida',
          'No se pudo restringir el certificado de Cloudflare al usuario; no se guardó.',
        );
      }
      return { cancelado: false };
    } finally {
      await rm(inicio, { recursive: true, force: true }).catch(() => undefined);
      this.conexion = null;
      this.d.alAutorizacion?.(null);
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
    const carpeta = await this.carpetaTemporal();
    const tmp = path.join(carpeta, `crear-${randomBytes(6).toString('hex')}.json`);
    let creado = false;
    try {
      await this.cloudflared(['create', '--credentials-file', tmp, nombre], 60_000);
      creado = true;
      // Lo que cloudflared dejó en el archivo se limita al usuario mientras se lee.
      await this.d.plataforma.restringirAlUsuario(tmp).catch(() => false);
      const texto = await readFile(tmp, 'utf8').catch(() => '');
      const c = leerCredencial(texto);
      await s.guardar(idSecretoTunelNombre(nombre), JSON.stringify(c));
    } catch (e) {
      // El túnel existe en Cloudflare pero no hay dónde guardar su credencial: no se deja huérfano.
      if (creado) await this.cloudflared(['delete', nombre], 60_000).catch(() => undefined);
      throw e;
    } finally {
      await rm(tmp, { force: true });
    }
  }

  /**
   * Olvida un túnel: borra su credencial guardada y, si se pide, también el túnel en Cloudflare
   * (`tunnel delete`). Lo confirma quien llama.
   */
  async olvidarTunel(nombre: string, borrarEnCloudflare: boolean): Promise<void> {
    if (!nombreTunelValido(nombre)) throw this.datosInvalidos();
    if (borrarEnCloudflare) {
      if (!this.tieneCuenta()) throw this.sinCuenta();
      await this.cloudflared(['delete', nombre], 60_000);
    }
    await this.d.secretos()?.borrar(idSecretoTunelNombre(nombre));
  }

  /** Recrear: borra el túnel en Cloudflare y su credencial, y crea uno nuevo con el mismo nombre. */
  async recrearTunel(nombre: string): Promise<void> {
    await this.olvidarTunel(nombre, true);
    await this.crearTunel(nombre);
  }

  /** `run/cloudflared/`: temporal y restringida al usuario antes de escribir nada dentro. */
  private async carpetaTemporal(): Promise<string> {
    const carpeta = this.d.rutas.cloudflaredRun();
    await mkdir(carpeta, { recursive: true });
    await this.d.plataforma.restringirAlUsuario(carpeta).catch(() => false);
    return carpeta;
  }

  /**
   * `tunnel route dns`: apunta el dominio público al túnel. Si Cloudflare registra otro nombre
   * (el dominio no pertenece a la zona autorizada, p. ej. `demo.midominio.com.otra.com`), falla
   * con el nombre registrado: el sitio no se deja apuntando a un dominio que no resuelve.
   */
  async enrutar(nombre: string, dominio: string): Promise<void> {
    if (!nombreTunelValido(nombre) || !dominioPublicoValido(dominio)) throw this.datosInvalidos();
    if (!this.tieneCuenta()) throw this.sinCuenta();
    const salida = await this.cloudflared(['route', 'dns', nombre, dominio], 60_000);
    const registrado = /Added CNAME\s+(\S+)\s+which will route/i
      .exec(salida)?.[1]
      ?.replace(/\.$/, '');
    if (registrado && registrado.toLowerCase() !== dominio.toLowerCase()) {
      const r = detalleSeguro(registrado).slice(0, 253);
      throw new ErrorWolf(
        'tuneles.cloudflare_dominio_distinto',
        `Cloudflare registró ${r} en lugar de ${dominio}.`,
        { registrado: r, dominio },
      );
    }
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
    const config = this.archivoConfig(sitio.id);
    await mkdir(this.d.rutas.cloudflaredEtc(), { recursive: true });
    // El YAML lleva rutas y nombres, nunca la credencial: esa va solo en el entorno del proceso.
    const q = (v: string): string => JSON.stringify(v);
    const yml = [
      `tunnel: ${q(cred.TunnelID)}`,
      'ingress:',
      `  - hostname: ${q(dominio)}`,
      `    service: ${q(`http://127.0.0.1:${c.puertoNginx}`)}`,
      '    originRequest:',
      `      httpHostHeader: ${q(sitio.dominio)}`,
      '  - service: http_status:404',
      '',
    ].join('\n');
    await writeFile(config, yml, 'utf8');
    const contenido = JSON.stringify(cred);
    return {
      comando: c.cloudflared,
      args: ['tunnel', '--no-autoupdate', '--config', config, '--logfile', c.logCloudflared, 'run'],
      // La credencial viaja solo en el entorno del proceso (nunca en un archivo ni en estado.json).
      envSecreto: { TUNNEL_CRED_CONTENTS: contenido },
      secretos: [cred.TunnelSecret, contenido],
    };
  }

  url(sitio: Sitio, texto: string): string | null {
    const dominio = sitio.tunel?.dominio;
    if (!dominioPublicoValido(dominio)) return null;
    return LISTO.test(texto) ? `https://${dominio}` : null;
  }

  /** Sin archivos temporales por sitio: la credencial va en el entorno del proceso. */
  async cerrar(): Promise<void> {
    // Nada que borrar.
  }
}

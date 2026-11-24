import { createHash, timingSafeEqual } from 'node:crypto';
import os from 'node:os';
import ftpSrv from 'ftp-srv';
import type { AlmacenCredenciales } from '../almacen';
import { generarClave } from '../servicios/definicion';
import type { Config, Credenciales, EstadoServicio } from '../tipos';
import { SistemaArchivosEncerrado } from './sistemaArchivos';

export interface DepsFtp {
  leerConfig: () => Promise<Config>;
  /** Lee, modifica y guarda la configuración en la cola común de escrituras. */
  modificarConfig: (fn: (c: Config) => void) => Promise<void>;
  /** Las claves viven aquí (`ftp:<sitio>`), nunca en config.json. */
  credenciales: Pick<AlmacenCredenciales, 'leer' | 'guardar' | 'borrar'>;
  /** IP de la red local (se inyecta en las pruebas). */
  ipLocal?: () => string | null;
}

/**
 * URL de conexión de un sitio: `ftp://<usuario codificado>@<host>:<puerto>/`. Nunca lleva
 * contraseña: la clave se copia aparte desde las credenciales.
 */
export function urlFtp(o: { usuario: string; host: string; puerto: number }): string {
  return `ftp://${encodeURIComponent(o.usuario)}@${o.host}:${o.puerto}/`;
}

/** Mensaje único para usuario desconocido, clave mala o sitio sin FTP: no revela cuál falló. */
const MENSAJE_LOGIN = 'Usuario o clave incorrectos';

const LARGO_CLAVE = 16;

/** Registro silencioso: ftp-srv escribiría por defecto en la salida estándar. */
const registroSilencioso = (): Record<string, unknown> => {
  const r: Record<string, unknown> = {};
  for (const nivel of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) r[nivel] = () => {};
  r['child'] = () => r;
  return r;
};

/** Comparación en tiempo constante (se comparan las huellas, que siempre miden lo mismo). */
function clavesIguales(a: string, b: string): boolean {
  const h = (s: string): Buffer => createHash('sha256').update(s, 'utf8').digest();
  return timingSafeEqual(h(a), h(b));
}

/** Primera IPv4 no interna (la de la red local), para anunciarla en modo pasivo. */
function ipLocal(): string | null {
  for (const lista of Object.values(os.networkInterfaces())) {
    for (const i of lista ?? []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return null;
}

const claveDe = (sitioId: string): `ftp:${string}` => `ftp:${sitioId}`;

type ServidorBase = {
  listen(): Promise<unknown>;
  close(): Promise<unknown>;
  on(evento: string, fn: (...a: never[]) => void): unknown;
  connections: Record<string, unknown>;
  disconnectClient(id: string): Promise<unknown>;
};

/**
 * Servidor FTP del proceso (`ftp-srv`): un usuario por sitio, encerrado en la carpeta del
 * sitio. Escucha solo en 127.0.0.1, salvo que la configuración active "red local".
 */
export class ServidorFtp {
  private servidor: ServidorBase | null = null;
  private direccionActual = '127.0.0.1';
  private estadoActual: EstadoServicio['estado'] = 'apagado';
  private mensaje: string | undefined;
  /** Sesiones abiertas: id de conexión → id de sitio. */
  private readonly sesiones = new Map<string, string>();
  /** Solo lectura vigente por sitio (se actualiza al cambiarla, sin reiniciar). */
  private readonly soloLecturaDe = new Map<string, boolean>();

  constructor(private readonly d: DepsFtp) {}

  /** Dirección en la que escucha el servidor en marcha ('127.0.0.1' o '0.0.0.0'). */
  direccion(): string {
    return this.direccionActual;
  }

  async estado(): Promise<EstadoServicio> {
    const cfg = await this.d.leerConfig();
    return {
      id: 'ftp',
      nombre: 'FTP',
      categoria: 'herramienta',
      version: null,
      estado: this.estadoActual,
      puertos: [cfg.ftp.puerto],
      pid: null,
      ...(this.mensaje ? { mensaje: this.mensaje } : {}),
    };
  }

  async iniciar(): Promise<void> {
    if (this.servidor) return;
    const cfg = await this.d.leerConfig();
    const { puerto, redLocal, pasivos } = cfg.ftp;
    const host = redLocal ? '0.0.0.0' : '127.0.0.1';
    const anunciada = redLocal ? ((this.d.ipLocal ?? ipLocal)() ?? '127.0.0.1') : '127.0.0.1';
    this.estadoActual = 'iniciando';
    this.mensaje = undefined;

    const antes = new Map(
      (['SIGTERM', 'SIGINT', 'SIGQUIT'] as const).map((s) => [s, new Set(process.listeners(s))]),
    );
    const FtpSrv = ftpSrv as unknown as new (o: Record<string, unknown>) => ServidorBase;
    const servidor = new FtpSrv({
      url: `ftp://${host}:${puerto}`,
      pasv_url: anunciada,
      pasv_min: Math.min(...pasivos),
      pasv_max: Math.max(...pasivos),
      anonymous: false,
      // Solo modo pasivo: sin PORT/EPRT el servidor nunca abre conexiones hacia el cliente.
      blacklist: ['PORT', 'EPRT'],
      log: registroSilencioso(),
    });
    // ftp-srv se cierra con process.exit() ante estas señales: aquí no debe tocarlas.
    for (const [s, previos] of antes) {
      for (const f of process.listeners(s)) if (!previos.has(f)) process.removeListener(s, f);
    }

    servidor.on('login', ((
      datos: { connection: { id: string }; username: string; password: string },
      resolver: (r: unknown) => void,
      rechazar: (e: Error) => void,
    ) => {
      void this.autenticar(datos.connection, datos.username, datos.password).then(resolver, () =>
        rechazar(new Error(MENSAJE_LOGIN)),
      );
    }) as never);
    servidor.on('disconnect', ((datos: { id: string }) => {
      this.sesiones.delete(datos.id);
    }) as never);

    try {
      await servidor.listen();
    } catch (e) {
      await servidor.close().catch(() => undefined);
      this.estadoActual = 'error';
      const ocupado = (e as NodeJS.ErrnoException).code === 'EADDRINUSE';
      this.mensaje = ocupado
        ? `El puerto ${puerto} ya lo usa otro programa. Cierre ese programa o cambie el puerto del FTP.`
        : `No se pudo abrir el puerto ${puerto} del FTP: ${(e as Error).message}`;
      throw new Error(this.mensaje);
    }
    this.servidor = servidor;
    this.direccionActual = host;
    this.estadoActual = 'encendido';
  }

  async detener(): Promise<void> {
    const s = this.servidor;
    this.servidor = null;
    this.sesiones.clear();
    if (s) await s.close();
    this.estadoActual = 'apagado';
    this.mensaje = undefined;
  }

  /** Valida usuario y clave y devuelve el sistema de archivos encerrado del sitio. */
  private async autenticar(
    conexion: { id: string },
    usuario: string,
    clave: string,
  ): Promise<{ fs: SistemaArchivosEncerrado; root: string }> {
    const cfg = await this.d.leerConfig();
    const sitio = cfg.sitios.find((s) => s.ftp?.usuario === usuario);
    const guardada = sitio ? await this.d.credenciales.leer(claveDe(sitio.id)) : null;
    // Siempre se compara (contra un valor inalcanzable si falta algo) para no variar el tiempo.
    const iguales = clavesIguales(clave, guardada?.clave ?? `-${generarClave(LARGO_CLAVE)}`);
    if (!sitio || !sitio.ftp?.activo || !guardada || !iguales) throw new Error(MENSAJE_LOGIN);
    this.soloLecturaDe.set(sitio.id, sitio.ftp.soloLectura);
    this.sesiones.set(conexion.id, sitio.id);
    return {
      root: sitio.carpeta,
      fs: new SistemaArchivosEncerrado(conexion, {
        root: sitio.carpeta,
        soloLectura: () => this.soloLecturaDe.get(sitio.id) ?? true,
      }),
    };
  }

  /** Corta las sesiones abiertas del sitio (al desactivarlo o cambiar la clave). */
  async cortarSesiones(sitioId: string): Promise<void> {
    const s = this.servidor;
    if (!s) return;
    const ids = [...this.sesiones].filter(([, sitio]) => sitio === sitioId).map(([id]) => id);
    await Promise.all(ids.map((id) => s.disconnectClient(id).catch(() => undefined)));
  }

  /** Crea (o reactiva) el acceso del sitio: usuario = id del sitio y clave aleatoria de 16. */
  async activarSitio(id: string): Promise<Credenciales> {
    const cfg = await this.d.leerConfig();
    if (!cfg.sitios.some((s) => s.id === id)) throw new Error(`No existe el sitio ${id}`);
    let cred = await this.d.credenciales.leer(claveDe(id));
    if (!cred) {
      cred = { usuario: id, clave: generarClave(LARGO_CLAVE) };
      await this.d.credenciales.guardar(claveDe(id), cred);
    }
    await this.modificarSitio(id, (s) => {
      s.ftp = { activo: true, usuario: id, soloLectura: s.ftp?.soloLectura ?? false };
    });
    return cred;
  }

  /** Quita el acceso: corta las sesiones, borra la clave y deja el sitio sin FTP activo. */
  async desactivarSitio(id: string): Promise<void> {
    await this.modificarSitio(id, (s) => {
      if (s.ftp) s.ftp.activo = false;
    });
    await this.d.credenciales.borrar(claveDe(id));
    this.soloLecturaDe.delete(id);
    await this.cortarSesiones(id);
  }

  /** Cambia la clave por otra aleatoria; las sesiones abiertas se cierran. */
  async regenerarClave(id: string): Promise<string> {
    const sitio = (await this.d.leerConfig()).sitios.find((s) => s.id === id);
    if (!sitio?.ftp?.activo) throw new Error('El FTP de este sitio no está activo.');
    const clave = generarClave(LARGO_CLAVE);
    await this.d.credenciales.guardar(claveDe(id), { usuario: sitio.ftp.usuario, clave });
    await this.cortarSesiones(id);
    return clave;
  }

  /** Cambia el modo solo lectura; vale también para las sesiones ya abiertas. */
  async soloLectura(id: string, valor: boolean): Promise<void> {
    await this.modificarSitio(id, (s) => {
      if (!s.ftp) throw new Error('El FTP de este sitio no está activo.');
      s.ftp.soloLectura = valor;
    });
    this.soloLecturaDe.set(id, valor);
  }

  /** Usuario y clave del sitio para mostrarlos en la interfaz (null si no tiene FTP activo). */
  async credencialesFtp(id: string): Promise<Credenciales | null> {
    const sitio = (await this.d.leerConfig()).sitios.find((s) => s.id === id);
    if (!sitio?.ftp?.activo) return null;
    return this.d.credenciales.leer(claveDe(id));
  }

  /** URL del sitio (sin clave): 127.0.0.1, o la IP local si "red local" está activa. */
  async urlSitio(id: string): Promise<string> {
    const cfg = await this.d.leerConfig();
    const sitio = cfg.sitios.find((s) => s.id === id);
    if (!sitio?.ftp?.activo) throw new Error('El FTP de este sitio no está activo.');
    const host = cfg.ftp.redLocal ? ((this.d.ipLocal ?? ipLocal)() ?? '127.0.0.1') : '127.0.0.1';
    return urlFtp({ usuario: sitio.ftp.usuario, host, puerto: cfg.ftp.puerto });
  }

  private modificarSitio(id: string, fn: (s: Config['sitios'][number]) => void): Promise<void> {
    return this.d.modificarConfig((c) => {
      const s = c.sitios.find((x) => x.id === id);
      if (!s) throw new Error(`No existe el sitio ${id}`);
      fn(s);
    });
  }
}

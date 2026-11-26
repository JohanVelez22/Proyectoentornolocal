import { randomBytes } from 'node:crypto';
import { ErrorWolf } from '../errores';
import { CerrojosServicio } from '../catalogo/cerrojo';
import { claveValida } from '../catalogo/comun';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AlmacenCredenciales } from '../almacen';
import type { Ejecutor, Plataforma } from '../plataforma/tipos';
import { pidExiste } from '../plataforma/win';
import { ErrorDetenidoAlIniciar, type DefProceso } from '../procesos/supervisor';
import type { Rutas } from '../rutas';
import {
  claveInstanciaValida,
  IDS_SERVICIO_DATOS,
  PASIVOS_FTP_POR_DEFECTO,
  type ClaveCredencial,
  type Config,
  type Credenciales,
  type BloqueoInstancia,
  type EstadoInstancia,
  type EstadoServicio,
  type IdInstancia,
  type IdServicioDatos,
  type InstanciaConfig,
} from '../tipos';
import {
  CON_VOLCADO,
  copiaEnFrio,
  devolverCopia,
  conDefiner,
  ErrorDevolucion,
  listarRespaldosDatos,
  MARGEN_LIBRE_BYTES,
  medirCarpeta,
  fsCopiaReal,
  type RespaldoDatos,
  type TipoRespaldoDatos,
  selloFecha,
  type FsCopia,
  type OperacionesRespaldo,
} from './actualizar';
import {
  claveDe,
  conInstancias,
  esIdInstancia,
  idInstancia,
  multiInstancia,
  parsearInstancia,
  puertosConfigurados,
  reflejarPredeterminada,
  puertoImplicito,
  type Instancias,
} from './instancias';
import {
  compararVersiones,
  ErrorPuertoOcupado,
  type InstaladorServicios,
  type SupervisorServicios,
} from './nginx';
import { GRUPO_CORREO } from './correo/tipos';
import { usoCompatible, type UsoBase } from './usoBases';

export interface CtxServicio {
  rutas: Rutas;
  /** Carpeta de instalación: bin/<servicio>/<version>. */
  bin: string;
  /**
   * Carpeta de datos: data/<servicio>/<claveDatos(version)>. En `inicializar` no existe aún
   * (initdb y mysqld --initialize la exigen vacía o inexistente).
   */
  datos: string;
  /** Puerto configurado; `proceso` debe aplicarlo en cada arranque (puede cambiar). */
  puerto: number;
  /** Clave de la versión instalada (p. ej. "8.4.13"). */
  version: string;
  /**
   * Nunca se escriben en logs, mensajes de error ni URL, ni en `args`/`env` del DefProceso
   * (el supervisor los guarda en run/estado.json). Para un cliente puntual use `exec` con
   * `env` (PGPASSWORD, MYSQL_PWD) o `entrada`.
   */
  credenciales: Credenciales;
  exec: Ejecutor;
}

export interface DefServicio {
  id: IdServicioDatos;
  nombre: string;
  categoria: 'bd' | 'herramienta' | 'ia';
  puertoPorDefecto: number;
  puertoAlternativo?: number;
  puertosExtra?: number[];
  /**
   * Subcarpeta de datos para una versión instalada. Por defecto "mayor.menor"
   * (MySQL/MariaDB/MongoDB); PostgreSQL y Redis usan `claveMayor`, Mailpit y Ollama 'actual'.
   */
  claveDatos?(version: string): string;
  /** false: una sola instancia (Mailpit, Ollama). Por defecto, una por rama. */
  multiInstancia?: boolean;
  /**
   * Servicios del mismo grupo (los captadores de correo): solo uno encendido a la vez; encender
   * uno detiene al que estuviera encendido.
   */
  grupoExclusivo?: string;
  // Prepara datos y configuración la primera vez; debe ser idempotente.
  inicializar(ctx: CtxServicio): Promise<void>;
  // El supervisor lo lanza con este DefProceso.
  proceso(ctx: CtxServicio): Promise<DefProceso>;
  // Opcional: apagado limpio (mysqladmin shutdown, pg_ctl stop -m fast).
  detenerLimpio?(ctx: CtxServicio): Promise<void>;
}

/** Marca que se escribe en la carpeta de datos tras un `inicializar` correcto. */
export const MARCA_INICIALIZADO = '.pel-inicializado';
/**
 * Sufijo del archivo hermano (`data/<id>/<clave>.pel-creando`) que indica que la carpeta de
 * datos la está creando WolfCore Dev. Va fuera de la carpeta porque `inicializar` la necesita
 * vacía. Si sigue ahí sin `.pel-inicializado`, un intento anterior quedó a medias.
 */
export const SUFIJO_CREANDO = '.pel-creando';

/**
 * Marca junto a la carpeta de datos de una instancia bloqueada (`data/<servicio>/<clave>.bloqueada`):
 * una actualización no pudo devolver sus datos y no se debe arrancar hasta que el usuario lo
 * resuelva (`desbloquear`).
 */
export const SUFIJO_BLOQUEO = '.bloqueada';

/**
 * Permiso de empezar de cero (`data/<servicio>/<clave>.pel-reinicio`): lo deja un borrado de datos
 * confirmado, para que la guarda de datos apartados no impida inicializar la carpeta nueva. Lo
 * consume la primera inicialización correcta.
 */
export const SUFIJO_REINICIO = '.pel-reinicio';

export const NOMBRE_SERVICIO: Record<IdServicioDatos, string> = {
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
  mailpit: 'Mailpit',
  smtp4dev: 'smtp4dev',
  inbucket: 'Inbucket',
  papercut: 'Papercut SMTP',
  ollama: 'Ollama',
  meilisearch: 'Meilisearch',
};

export const USUARIO_POR_DEFECTO: Record<IdServicioDatos, string> = {
  mysql: 'root',
  mariadb: 'root',
  postgresql: 'postgres',
  redis: 'default',
  mongodb: 'admin',
  mailpit: 'mailpit',
  smtp4dev: 'smtp4dev',
  inbucket: 'inbucket',
  papercut: 'papercut',
  ollama: 'ollama',
  meilisearch: 'meilisearch',
};

/** Puertos de la aplicación (HTTPS, Adminer, FTP, PHP) que ningún servicio de datos puede tomar. */
export function puertosFijos(cfg: Config): { desde: number; hasta: number; nombre: string }[] {
  const https = cfg.https?.puerto ?? 443;
  const ftp = cfg.ftp?.puerto ?? 2121;
  const [pasivoMin, pasivoMax] = cfg.ftp?.pasivos ?? PASIVOS_FTP_POR_DEFECTO;
  return [
    { desde: https, hasta: https, nombre: 'HTTPS' },
    { desde: 8090, hasta: 8090, nombre: 'Adminer' },
    { desde: 8091, hasta: 8091, nombre: 'phpMyAdmin' },
    { desde: ftp, hasta: ftp, nombre: 'FTP' },
    {
      desde: Math.min(pasivoMin, pasivoMax),
      hasta: Math.max(pasivoMin, pasivoMax),
      nombre: 'FTP (puertos pasivos)',
    },
    { desde: 9000, hasta: 9999, nombre: 'PHP' },
  ];
}

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Clave de `largo` caracteres de [A-Za-z0-9] con crypto.randomBytes (sin sesgo de módulo). */
export function generarClave(largo = 20): string {
  let salida = '';
  while (salida.length < largo) {
    for (const b of randomBytes(largo * 2)) {
      // 248 = 62 * 4: se descartan los bytes que sesgarían el reparto.
      if (b < 248) salida += ALFABETO[b % ALFABETO.length];
      if (salida.length === largo) break;
    }
  }
  return salida;
}

export function esIdServicioDatos(id: string): id is IdServicioDatos {
  return (IDS_SERVICIO_DATOS as readonly string[]).includes(id);
}

export function mensajeConflicto(
  puerto: number,
  uso: { pid: number; nombre: string },
  alternativo?: number,
): string {
  const base = `El puerto ${puerto} lo usa ${uso.nombre} (PID ${uso.pid}).`;
  return alternativo === undefined ? base : `${base} Use el puerto ${alternativo}.`;
}

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));
const pausa = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const ESPERA_APAGADO_MS = 10_000;
/** Los dueños de puertos en conflicto se reutilizan durante este tiempo. */
export const CACHE_CONFLICTOS_MS = 15_000;
/** Reintentos de borrado: en Windows un antivirus o un explorador puede retener archivos. */
const OPCIONES_BORRADO = { recursive: true, force: true, maxRetries: 10, retryDelay: 200 };

type Duenos = Map<number, { pid: number; nombre: string }>;

/** Plan de una actualización (para el diálogo de confirmación). */
export interface PlanActualizar {
  id: IdInstancia;
  /** Versión actual de la instancia. */
  version: string;
  carpeta: string;
  /** Dónde quedará la copia en frío. */
  respaldo: string;
  hayDatos: boolean;
  bytes: number;
  archivos: number;
  /** Bytes libres en el disco de la carpeta de datos. */
  libres: number;
  /** Bytes que hacen falta (la copia más el margen). */
  necesarios: number;
  /** Además se vuelca cada base (MySQL, MariaDB, PostgreSQL). */
  volcados: boolean;
}

/** Resultado de `nuevaRama`: qué bases se copiaron y cuáles no. */
export interface ResultadoNuevaRama {
  id: IdInstancia;
  restauradas: string[];
  fallidas: { base: string; motivo: string }[];
  advertencias: string[];
}

/** Una instancia que "Iniciar todo" enciende. */
export interface ObjetivoInicio {
  /** Lo que se pasa a `iniciar` (el servicio si su instancia es implícita). */
  ref: IdServicioDatos | IdInstancia;
  nombre: string;
  servicio: IdServicioDatos;
  puerto: number;
}

/** Resultado de encender un objetivo: sin `error`, quedó encendido y responde. */
export interface ResultadoInicio extends ObjetivoInicio {
  error?: unknown;
}

/** Una instancia resuelta (configurada o, sin instancias en la configuración, la implícita). */
export interface InstanciaResuelta {
  id: IdInstancia;
  servicio: IdServicioDatos;
  clave: string;
  /** Versión configurada (la de sus binarios). */
  version: string;
  puerto: number;
  autoIniciar: boolean;
  predeterminada: boolean;
  /**
   * Sin instancias en la configuración (forma de una sola instancia): la única, con el id de
   * proceso, la credencial y el puerto de siempre (`mysql`).
   */
  implicita: boolean;
  /** Id en el supervisor: el del servicio si es implícita; si no, el de la instancia. */
  proceso: string;
  /** Clave en etc/credenciales.json. */
  credencial: ClaveCredencial;
}

export interface DepsServiciosDatos {
  rutas: Rutas;
  /** Cerrojo por servicio compartido con el instalador y la limpieza de versiones. */
  cerrojos?: CerrojosServicio;
  plataforma: Plataforma;
  supervisor: SupervisorServicios;
  instalador: InstaladorServicios;
  leerConfig: () => Promise<Config>;
  /** Lee, modifica y guarda la configuración en la cola común (para no pisar otras escrituras). */
  modificarConfig: (fn: (c: Config) => void) => Promise<void>;
  credenciales: Pick<AlmacenCredenciales, 'leer' | 'obtenerOCrear'> &
    Partial<Pick<AlmacenCredenciales, 'guardar'>>;
  sonda: (puerto: number) => Promise<boolean>;
  exec: Ejecutor;
  /** Se consulta en cada llamada: las definiciones pueden registrarse después. */
  definiciones: () => readonly DefServicio[];
  /** Para pruebas: borrado recursivo (por defecto `fs.rm`). */
  borrar?: (ruta: string, opciones: typeof OPCIONES_BORRADO) => Promise<void>;
  /** ¿Sigue vivo el PID? (por defecto `pidExiste`, sin lanzar procesos). */
  existePid?: (pid: number) => boolean;
  /** Instala una versión del catálogo junto a las otras (actualizar y rama nueva). */
  instalarVersion?: (
    servicio: IdServicioDatos,
    version: string,
    o: { confirmarSinHuella?: true },
  ) => Promise<void>;
  /** Volcados lógicos para actualizar y para copiar a una rama nueva. */
  respaldo?: OperacionesRespaldo;
  /** Copia en frío (para pruebas). */
  fsCopia?: FsCopia;
  reloj?: () => Date;
  /** Cuánto se espera a que la instancia quede encendida tras arrancarla (por defecto 60 s). */
  plazoSaludMs?: number;
}

/** Ciclo de vida de los servicios declarados con `DefServicio`, por instancia. */
export class ServiciosDatos {
  private readonly cerrojos: CerrojosServicio;
  private cacheDuenos: { clave: string; hasta: number; duenos: Duenos } | null = null;
  /** Instancias de los servicios de datos (fachada sobre esta clase). */
  readonly instancias: Instancias;

  constructor(private readonly d: DepsServiciosDatos) {
    // El cerrojo es el de todo lo que toca bin/<servicio> (instalador y limpieza de versiones);
    // los captadores de correo (grupo exclusivo) comparten uno solo.
    this.cerrojos = d.cerrojos ?? new CerrojosServicio();
    this.cerrojos.fijarNormalizador((id) => {
      const grupo = this.def(id)?.grupoExclusivo;
      return grupo === undefined ? id : `grupo:${grupo}`;
    });
    this.instancias = {
      lista: (s) => this.listaInstancias(s),
      crear: (s, v) => this.crearInstancia(s, v),
      iniciar: (id) => this.iniciar(id),
      detener: (id) => this.detener(id),
      cambiarPuerto: (id, p) => this.cambiarPuerto(id, p),
      predeterminar: (id) => this.predeterminar(id),
      autoIniciar: (id, v) => this.autoIniciar(id, v),
      desbloquear: (id, o) => this.desbloquear(id, o),
      quitar: (id) => this.quitar(id),
      borrarDatos: (id, c) => this.borrarDatos(id, c),
    };
  }

  /** Definiciones registradas (se consultan en cada llamada). */
  definiciones(): readonly DefServicio[] {
    return this.d.definiciones();
  }

  /** Clave en etc/credenciales.json de un servicio (su predeterminada) o de una instancia. */
  async claveCredencial(ref: IdServicioDatos | IdInstancia): Promise<ClaveCredencial> {
    if (!esIdServicioDatos(ref)) return ref;
    const def = this.def(ref);
    if (!def) return ref;
    const pred = (await this.resolver(def, await this.d.leerConfig())).find(
      (i) => i.predeterminada,
    );
    return pred?.credencial ?? ref;
  }

  def(id: string): DefServicio | undefined {
    return this.d.definiciones().find((x) => x.id === id);
  }

  private requerir(id: string): DefServicio {
    const def = this.def(id);
    if (!def) throw new ErrorWolf('servicios.desconocido', `Servicio desconocido: ${id}`, { id });
    return def;
  }

  private get ahora(): Date {
    return this.d.reloj?.() ?? new Date();
  }

  /** Operaciones de un mismo servicio (todas sus instancias), una a la vez. */
  private enCola<T>(id: string, fn: () => Promise<T>): Promise<T> {
    return this.cerrojos.con(id, fn);
  }

  /** Versión configurada si está instalada; si no, la más reciente instalada. */
  async versionActiva(def: DefServicio, cfg?: Config): Promise<string> {
    const c = cfg ?? (await this.d.leerConfig());
    const instaladas = await this.d.instalador.instalados(def.id);
    const pred = this.predeterminadaConfigurada(def, c);
    if (pred) {
      const v = this.versionDeInstancia(def, pred.clave, pred.version, instaladas);
      if (v) return v;
    }
    const elegida = c.servicios.datos[def.id].version;
    if (elegida && instaladas.includes(elegida)) return elegida;
    const ordenadas = [...instaladas].sort(compararVersiones);
    // Sin versión elegida, la más nueva que ya tiene datos (la que se venía usando): instalar otra
    // rama al lado no debe cambiar a cuál responde el puerto.
    const conDatos = elegida
      ? []
      : ordenadas.filter((v) =>
          existsSync(path.join(this.carpetaDatos(def, v), MARCA_INICIALIZADO)),
        );
    const nueva = conDatos.at(-1) ?? ordenadas.at(-1);
    if (!nueva) throw this.noInstalado(def);
    return nueva;
  }

  private noInstalado(def: DefServicio): ErrorWolf {
    return new ErrorWolf(
      'servicios.no_instalado',
      `${def.nombre} no está instalado. Instálelo desde Servicios.`,
      { nombre: def.nombre },
    );
  }

  /** Instancias configuradas (solo si el servicio admite varias y ya las tiene). */
  private configuradas(def: DefServicio, cfg: Config): Record<string, InstanciaConfig> | null {
    if (!multiInstancia(def) || !conInstancias(cfg, def.id)) return null;
    return cfg.servicios.datos[def.id].instancias!;
  }

  private claveDePredeterminada(def: DefServicio, cfg: Config): string | null {
    const inst = this.configuradas(def, cfg);
    if (!inst) return null;
    const p = cfg.servicios.datos[def.id].predeterminada;
    if (p && Object.hasOwn(inst, p)) return p;
    return Object.keys(inst).sort(compararVersiones)[0] ?? null;
  }

  private predeterminadaConfigurada(
    def: DefServicio,
    cfg: Config,
  ): { clave: string; version: string } | null {
    const clave = this.claveDePredeterminada(def, cfg);
    if (clave === null) return null;
    return { clave, version: this.configuradas(def, cfg)![clave]!.version };
  }

  /** Binarios de una instancia: su versión si está instalada; si no, la más nueva de su rama. */
  private versionDeInstancia(
    def: DefServicio,
    clave: string,
    version: string,
    instaladas: string[],
  ): string | null {
    if (instaladas.includes(version)) return version;
    return (
      instaladas
        .filter((v) => claveDe(def, v) === clave)
        .sort(compararVersiones)
        .at(-1) ?? null
    );
  }

  private async binariosDe(def: DefServicio, inst: InstanciaResuelta): Promise<string> {
    if (inst.implicita) return inst.version;
    const v = this.versionDeInstancia(
      def,
      inst.clave,
      inst.version,
      await this.d.instalador.instalados(def.id),
    );
    if (!v) throw this.noInstalado(def);
    return v;
  }

  /**
   * Instancias de un servicio: las de la configuración o, si aún no tiene (forma de una sola
   * instancia), la implícita con la versión activa. Vacío si no hay nada instalado.
   */
  async resolver(def: DefServicio, cfg: Config): Promise<InstanciaResuelta[]> {
    const conf = this.configuradas(def, cfg);
    if (conf) {
      const pred = this.claveDePredeterminada(def, cfg);
      return Object.entries(conf)
        .sort(([a], [b]) => compararVersiones(a, b))
        .map(([clave, i]) => {
          const id = idInstancia(def.id, clave);
          return {
            id,
            servicio: def.id,
            clave,
            version: i.version,
            puerto: i.puerto,
            autoIniciar: i.autoIniciar,
            predeterminada: clave === pred,
            implicita: false,
            proceso: id,
            credencial: id,
          };
        });
    }
    let version: string;
    try {
      version = await this.versionActiva(def, cfg);
    } catch {
      return [];
    }
    const c = cfg.servicios.datos[def.id];
    return [
      {
        id: idInstancia(def.id, claveDe(def, version)),
        servicio: def.id,
        clave: claveDe(def, version),
        version,
        puerto: puertoImplicito(cfg, def.id),
        autoIniciar: c.autoIniciar,
        predeterminada: true,
        implicita: true,
        proceso: def.id,
        credencial: def.id,
      },
    ];
  }

  /** Instancia de `ref` (un servicio = su predeterminada). */
  private async objetivo(
    ref: string,
    cfg: Config,
  ): Promise<{ def: DefServicio; inst: InstanciaResuelta }> {
    if (esIdServicioDatos(ref)) {
      const def = this.requerir(ref);
      const pred = (await this.resolver(def, cfg)).find((i) => i.predeterminada);
      if (!pred) throw this.noInstalado(def);
      return { def, inst: pred };
    }
    const { servicio } = parsearInstancia(ref);
    const def = this.requerir(servicio);
    const inst = (await this.resolver(def, cfg)).find((i) => i.id === ref);
    if (!inst) {
      throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${ref}.`, { id: ref });
    }
    return { def, inst };
  }

  private servicioDe(ref: string): IdServicioDatos {
    if (esIdServicioDatos(ref)) return ref;
    return parsearInstancia(ref).servicio;
  }

  /** Carpeta de datos de `def` para `version` (usa su `claveDatos`). */
  carpetaDatos(def: DefServicio, version: string): string {
    const clave = def.claveDatos;
    return this.d.rutas.datos(def.id, version, clave ? (v) => clave.call(def, v) : undefined);
  }

  /**
   * Dónde viven los datos y el registro de una instancia gestionada por WolfCore (su carpeta de
   * datos y el archivo donde el supervisor escribe su salida). Solo para el núcleo: la interfaz
   * nunca recibe estas rutas.
   */
  async ubicacionInstancia(
    ref: IdServicioDatos | IdInstancia,
  ): Promise<{ servicio: IdServicioDatos; claveDatos: string; log: string }> {
    const { def, inst } = await this.objetivo(ref, await this.d.leerConfig());
    return {
      servicio: def.id,
      claveDatos: path.basename(this.carpetaInstancia(def.id, inst.clave)),
      log: this.d.rutas.logs(inst.implicita ? `${def.id}.log` : `${def.id}-${inst.clave}.log`),
    };
  }

  /** data/<servicio>/<clave> de una instancia. */
  carpetaInstancia(servicio: IdServicioDatos, clave: string): string {
    return this.d.rutas.datos(servicio, clave, () => clave);
  }

  /** Marca de instancia bloqueada: data/<servicio>/<clave>.bloqueada (fuera de la carpeta). */
  private rutaBloqueo(servicio: IdServicioDatos, clave: string): string {
    return `${this.carpetaInstancia(servicio, clave)}${SUFIJO_BLOQUEO}`;
  }

  /**
   * Bloqueo de una instancia (tras `servicios.restauracion_fallo`), o null. Una marca ilegible
   * sigue bloqueando (con las rutas vacías): ante la duda no se arranca nada.
   */
  async bloqueo(servicio: IdServicioDatos, clave: string): Promise<BloqueoInstancia | null> {
    const ruta = this.rutaBloqueo(servicio, clave);
    if (!existsSync(ruta)) return null;
    try {
      const x = JSON.parse(await readFile(ruta, 'utf8')) as Partial<BloqueoInstancia>;
      return {
        fecha: typeof x.fecha === 'string' ? x.fecha : '',
        fallida: typeof x.fallida === 'string' ? x.fallida : '',
        respaldo: typeof x.respaldo === 'string' ? x.respaldo : '',
        ...(typeof x.version === 'string' && claveValida(x.version) ? { version: x.version } : {}),
      };
    } catch {
      return { fecha: '', fallida: '', respaldo: '', ilegible: true };
    }
  }

  private async exigirNoBloqueada(inst: InstanciaResuelta): Promise<void> {
    const b = await this.bloqueo(inst.servicio, inst.clave);
    if (!b) return;
    throw new ErrorWolf(
      'servicios.instancia_bloqueada',
      `${inst.id} está bloqueada: una actualización no pudo devolver sus datos. Los datos tocados están en ${b.fallida || '?'} y el respaldo en ${b.respaldo || '?'}. Resuélvalo en Servicios → Versiones antes de encenderla.`,
      { nombre: inst.id, fallida: b.fallida, respaldo: b.respaldo },
    );
  }

  /**
   * Credenciales guardadas o, la primera vez, generadas y guardadas. Un servicio = las de su
   * instancia predeterminada.
   */
  async credenciales(ref: IdServicioDatos | IdInstancia): Promise<Credenciales> {
    let clave: ClaveCredencial = ref;
    const servicio = this.servicioDe(ref);
    if (esIdServicioDatos(ref) && this.def(ref)) {
      const cfg = await this.d.leerConfig();
      const pred = (await this.resolver(this.requerir(ref), cfg)).find((i) => i.predeterminada);
      if (pred) clave = pred.credencial;
    }
    return this.credencialesDe(clave, servicio);
  }

  private credencialesDe(clave: ClaveCredencial, servicio: IdServicioDatos): Promise<Credenciales> {
    return this.d.credenciales.obtenerOCrear(clave, () => ({
      usuario: USUARIO_POR_DEFECTO[servicio],
      clave: generarClave(),
    }));
  }

  private async contexto(
    def: DefServicio,
    inst: InstanciaResuelta,
    version: string,
  ): Promise<CtxServicio> {
    return {
      rutas: this.d.rutas,
      bin: this.d.rutas.bin(def.id, version),
      datos: this.carpetaInstancia(def.id, inst.clave),
      puerto: inst.puerto,
      version,
      credenciales: await this.credencialesDe(inst.credencial, def.id),
      exec: this.d.exec,
    };
  }

  /**
   * Quién tiene ya asignado `puerto`: Nginx, un puerto fijo de la app u otra instancia propia
   * (`excepto` = la instancia que lo pide; sin ella, cuenta también la propia).
   */
  private asignadoA(puerto: number, cfg: Config, excepto: InstanciaResuelta | null): string | null {
    if (cfg.servicios.nginx.puerto === puerto) return 'Nginx';
    const fijo = puertosFijos(cfg).find((f) => puerto >= f.desde && puerto <= f.hasta);
    if (fijo) return fijo.nombre;
    for (const p of puertosConfigurados(cfg)) {
      if (p.puerto !== puerto) continue;
      // Los captadores de correo comparten el puerto SMTP: no se estorban entre sí.
      if (excepto !== null && this.mismoGrupo(p.servicio, excepto.servicio)) continue;
      const propia =
        excepto !== null &&
        p.servicio === excepto.servicio &&
        (p.clave === null ? excepto.implicita : p.clave === excepto.clave);
      if (propia) continue;
      const def = this.def(p.servicio);
      const nombre = def?.nombre ?? NOMBRE_SERVICIO[p.servicio];
      return p.clave === null || !conInstancias(cfg, p.servicio) ? nombre : `${nombre} ${p.clave}`;
    }
    for (const otro of IDS_SERVICIO_DATOS) {
      const def = this.def(otro);
      if ((def?.puertosExtra ?? []).includes(puerto)) return def?.nombre ?? NOMBRE_SERVICIO[otro];
    }
    return null;
  }

  /** ¿Los dos servicios son del mismo grupo exclusivo (captadores de correo)? */
  private mismoGrupo(a: string, b: string): boolean {
    const ga = this.def(a)?.grupoExclusivo;
    return ga !== undefined && ga === this.def(b)?.grupoExclusivo;
  }

  /** Candidato a sugerir en lugar de `puerto` (falta comprobar que esté libre). */
  private candidatoAlternativo(
    def: DefServicio,
    inst: InstanciaResuelta,
    puerto: number,
    cfg: Config,
  ): number | undefined {
    const c = puerto === def.puertoAlternativo ? def.puertoPorDefecto : def.puertoAlternativo;
    if (c === undefined || c === puerto) return undefined;
    return this.asignadoA(c, cfg, inst) === null ? c : undefined;
  }

  private puertos(def: DefServicio, inst: InstanciaResuelta): number[] {
    return [inst.puerto, ...(def.puertosExtra ?? [])];
  }

  private vivo(proceso: string): boolean {
    const e = this.d.supervisor.estado(proceso);
    return e === 'encendido' || e === 'iniciando';
  }

  /** ¿Está encendida (o arrancando) la instancia predeterminada de `servicio`? */
  async encendido(ref: IdServicioDatos | IdInstancia): Promise<boolean> {
    try {
      const { inst } = await this.objetivo(ref, await this.d.leerConfig());
      return this.vivo(inst.proceso);
    } catch {
      return false;
    }
  }

  /** Una sola consulta (netstat + tasklist) para todos los puertos. */
  private async duenos(puertos: number[], usarCache: boolean): Promise<Duenos> {
    const unicos = [...new Set(puertos)].sort((a, b) => a - b);
    const clave = unicos.join(',');
    const ahora = Date.now();
    const c = this.cacheDuenos;
    if (usarCache && c && c.clave === clave && ahora < c.hasta) return c.duenos;
    const duenos = await this.d.plataforma.duenosDePuertos(unicos);
    this.cacheDuenos = { clave, hasta: ahora + CACHE_CONFLICTOS_MS, duenos };
    return duenos;
  }

  private async verificarPuertos(
    def: DefServicio,
    inst: InstanciaResuelta,
    cfg: Config,
  ): Promise<void> {
    const puertos = this.puertos(def, inst);
    const alt = this.candidatoAlternativo(def, inst, puertos[0]!, cfg);
    const duenos = await this.duenos(alt === undefined ? puertos : [...puertos, alt], false);
    for (const [i, puerto] of puertos.entries()) {
      const uso = duenos.get(puerto);
      if (!uso || this.d.supervisor.pid(inst.proceso) === uso.pid) continue;
      const libre = i === 0 && alt !== undefined && !duenos.has(alt) ? alt : undefined;
      throw new ErrorPuertoOcupado(puerto, uso.pid, uso.nombre, libre);
    }
  }

  /** Ejecuta `inicializar` si la carpeta de datos no tiene la marca; si falla, deshace lo creado. */
  private async prepararDatos(def: DefServicio, ctx: CtxServicio): Promise<void> {
    const marca = path.join(ctx.datos, MARCA_INICIALIZADO);
    if (existsSync(marca)) {
      // Ya hay datos: un permiso de reinicio que quedó no debe valer para más adelante.
      await rm(`${ctx.datos}${SUFIJO_REINICIO}`, { force: true });
      return;
    }
    // Datos apartados por una actualización (`<clave>.fallida-…`, `.restaurando-…`): una
    // carpeta vacía o ausente aquí no es "nueva", así que no se inicializa encima.
    const clave = path.basename(ctx.datos);
    const hermanas = await readdir(path.dirname(ctx.datos)).catch(() => [] as string[]);
    const permiso = `${ctx.datos}${SUFIJO_REINICIO}`;
    if (
      !existsSync(permiso) &&
      hermanas.some(
        (n) => n.startsWith(`${clave}.fallida-`) || n.startsWith(`${clave}.restaurando-`),
      )
    ) {
      throw new ErrorWolf(
        'servicios.datos_apartados',
        `${def.nombre} ${clave} no tiene datos en su carpeta pero hay datos apartados de una actualización al lado: no se crea una carpeta vacía. Revise Servicios → Versiones (Respaldos de las actualizaciones).`,
        { nombre: `${def.nombre} ${clave}` },
      );
    }
    const creando = `${ctx.datos}${SUFIJO_CREANDO}`;
    // Un intento anterior nuestro quedó a medias (p. ej. se cerró la app): se empieza de cero.
    if (existsSync(creando)) await rm(ctx.datos, OPCIONES_BORRADO);
    const existia = existsSync(ctx.datos);
    try {
      await mkdir(path.dirname(ctx.datos), { recursive: true });
      if (!existia) await writeFile(creando, new Date().toISOString(), 'utf8');
      await def.inicializar(ctx);
      await mkdir(ctx.datos, { recursive: true });
      await writeFile(marca, new Date().toISOString(), 'utf8');
      await rm(creando, { force: true });
      await rm(permiso, { force: true });
    } catch (e) {
      if (!existia) {
        await rm(ctx.datos, OPCIONES_BORRADO).catch(() => undefined);
        await rm(creando, { force: true }).catch(() => undefined);
      }
      throw new Error(`No se pudo preparar ${def.nombre}: ${mensajeDe(e)}`, { cause: e });
    }
  }

  private nombreDe(def: DefServicio, inst: InstanciaResuelta): string {
    return inst.implicita ? def.nombre : `${def.nombre} ${inst.clave}`;
  }

  /** Enciende un servicio (su predeterminada) o una instancia. */
  iniciar(
    ref: IdServicioDatos | IdInstancia,
    opciones: { automatico?: boolean } = {},
  ): Promise<void> {
    return this.enCola(this.servicioDe(ref), async () => {
      const cfg = await this.d.leerConfig();
      const { def, inst } = await this.objetivo(ref, cfg);
      // Un captador de correo a la vez: antes de encender uno se apaga el otro que corra.
      if (def.grupoExclusivo !== undefined && !this.vivo(inst.proceso)) {
        await this.detenerExclusivos(def, cfg);
      }
      await this.iniciarSinCola(def, inst, cfg);
      // El captador que el usuario enciende pasa a ser el de los proyectos (bloque MAIL_* del
      // .env). Un arranque automático nunca cambia esa elección.
      if (
        !opciones.automatico &&
        def.grupoExclusivo === GRUPO_CORREO &&
        cfg.correo.captador !== def.id
      ) {
        await this.d.modificarConfig((c) => {
          c.correo.captador = def.id as Config['correo']['captador'];
        });
      }
    });
  }

  /**
   * Apaga los servicios encendidos del mismo grupo exclusivo que `def` (sin contarlo a él). Va sin
   * cola propia: el que llama ya tiene la del grupo.
   */
  private async detenerExclusivos(def: DefServicio, cfg: Config): Promise<void> {
    for (const otro of this.d.definiciones()) {
      if (otro.id === def.id || otro.grupoExclusivo !== def.grupoExclusivo) continue;
      if (!this.vivo(otro.id)) continue;
      const { inst } = await this.objetivo(otro.id, cfg);
      await this.detenerSinCola(otro, inst);
    }
  }

  private async iniciarSinCola(
    def: DefServicio,
    inst: InstanciaResuelta,
    cfg: Config,
  ): Promise<void> {
    if (this.vivo(inst.proceso)) return;
    // Nunca se arranca (ni se inicializa una carpeta vacía) una instancia bloqueada.
    await this.exigirNoBloqueada(inst);
    const version = await this.binariosDe(def, inst);
    this.cacheDuenos = null;
    await this.verificarPuertos(def, inst, cfg);
    const ctx = await this.contexto(def, inst, version);
    await this.prepararDatos(def, ctx);
    const proceso = await def.proceso(ctx);
    await this.d.supervisor.iniciar({
      ...proceso,
      id: inst.proceso,
      nombre: this.nombreDe(def, inst),
      // Con varias instancias cada una escribe su propio registro.
      ...(inst.implicita ? {} : { log: this.d.rutas.logs(`${def.id}-${inst.clave}.log`) }),
    });
  }

  /** Apaga un servicio (su predeterminada) o una instancia. */
  detener(ref: IdServicioDatos | IdInstancia): Promise<void> {
    return this.enCola(this.servicioDe(ref), async () => {
      if (esIdServicioDatos(ref)) this.requerir(ref);
      const cfg = await this.d.leerConfig();
      let objetivo: { def: DefServicio; inst: InstanciaResuelta };
      try {
        objetivo = await this.objetivo(ref, cfg);
      } catch (e) {
        // Sin instalar (o sin la instancia) puede quedar un proceso con ese id en el supervisor.
        if (!(e instanceof ErrorWolf && e.codigo === 'servicios.desconocido')) {
          await this.d.supervisor.detener(ref);
          return;
        }
        throw e;
      }
      await this.detenerSinCola(objetivo.def, objetivo.inst);
    });
  }

  private async detenerSinCola(def: DefServicio, inst: InstanciaResuelta): Promise<void> {
    const pid = this.d.supervisor.pid(inst.proceso);
    this.cacheDuenos = null;
    if (pid !== null && def.detenerLimpio) {
      // Sin esto, la salida limpia contaría como caída y el supervisor lo relanzaría.
      this.d.supervisor.marcarDeteniendo?.(inst.proceso);
      try {
        const version = await this.binariosDe(def, inst);
        await def.detenerLimpio(await this.contexto(def, inst, version));
        // Consulta directa al sistema (sin lanzar tasklist cada 200 ms).
        const existe = this.d.existePid ?? pidExiste;
        const limite = Date.now() + ESPERA_APAGADO_MS;
        while (Date.now() < limite && existe(pid)) await pausa(200);
      } catch {
        // si el apagado limpio falla, el supervisor lo detiene a la fuerza
      }
    }
    await this.d.supervisor.detener(inst.proceso);
  }

  /** Valida (1024–65535, libre y no asignado a otro servicio propio), guarda y reinicia si corría. */
  cambiarPuerto(ref: IdServicioDatos | IdInstancia, puerto: number): Promise<void> {
    return this.enCola(this.servicioDe(ref), async () => {
      if (esIdServicioDatos(ref)) this.requerir(ref);
      if (!Number.isInteger(puerto) || puerto < 1024 || puerto > 65535) {
        throw new ErrorWolf(
          'servicios.puerto_invalido',
          'El puerto debe ser un número entre 1024 y 65535.',
        );
      }
      const cfg = await this.d.leerConfig();
      const objetivo = await this.objetivoOImplicito(ref, cfg);
      const { inst } = objetivo;
      if (inst.puerto === puerto) return;
      const otro = this.asignadoA(puerto, cfg, inst);
      if (otro !== null) {
        throw new ErrorWolf(
          'servicios.puerto_asignado',
          `El puerto ${puerto} ya está asignado a ${otro}.`,
          { puerto, otro },
        );
      }
      const rango = (await this.reservados()).find((r) => puerto >= r.desde && puerto <= r.hasta);
      if (rango) {
        throw new ErrorWolf(
          'servicios.puerto_reservado',
          `El puerto ${puerto} está reservado por el sistema (${rango.desde}–${rango.hasta}): elija otro.`,
          { puerto, desde: rango.desde, hasta: rango.hasta },
        );
      }
      const uso = await this.d.plataforma.quienUsaPuerto(puerto);
      if (uso && uso.pid !== this.d.supervisor.pid(inst.proceso)) {
        throw new ErrorPuertoOcupado(puerto, uso.pid, uso.nombre);
      }
      const estaba = this.vivo(inst.proceso);
      const fijarPuerto = (p: number): Promise<void> =>
        this.d.modificarConfig((c) => {
          if (inst.implicita) {
            c.servicios.datos[inst.servicio].puerto = p;
            // Los captadores de correo comparten un solo puerto SMTP.
            if (objetivo.def?.grupoExclusivo === GRUPO_CORREO) c.correo.puertoSmtp = p;
          } else {
            const i = c.servicios.datos[inst.servicio].instancias?.[inst.clave];
            if (i) i.puerto = p;
            reflejarPredeterminada(c, inst.servicio);
          }
        });
      await fijarPuerto(puerto);
      this.cacheDuenos = null;
      if (estaba && objetivo.def) {
        const def = objetivo.def;
        const nueva = { ...inst, puerto };
        await this.detenerSinCola(def, nueva);
        try {
          await this.iniciarSinCola(def, nueva, await this.d.leerConfig());
        } catch (e) {
          // No arrancó en el puerto nuevo: vuelve al anterior (y se enciende como estaba).
          const motivo = mensajeDe(e).slice(0, 200);
          await this.detenerSinCola(def, nueva).catch(() => undefined);
          try {
            await fijarPuerto(inst.puerto);
          } catch (x) {
            throw new ErrorWolf(
              'servicios.puerto_no_revertido',
              `${inst.id} no arrancó en el puerto ${puerto} (${motivo}) y no se pudo volver al ${inst.puerto} en la configuración (${mensajeDe(x).slice(0, 120)}): quedó apagada.`,
              { nombre: inst.id, nuevo: puerto, anterior: inst.puerto },
            );
          }
          this.cacheDuenos = null;
          try {
            await this.iniciarSinCola(def, inst, await this.d.leerConfig());
          } catch {
            throw new ErrorWolf(
              'servicios.puerto_revertido_apagada',
              `${inst.id} no arrancó en el puerto ${puerto} (${motivo}); se volvió al puerto ${inst.puerto}, pero tampoco arrancó ahí: quedó apagada en el puerto ${inst.puerto}.`,
              { nombre: inst.id, anterior: inst.puerto },
            );
          }
          throw e;
        }
      }
    });
  }

  /**
   * Como `objetivo`, pero un servicio sin instalar también vale (su puerto se puede elegir antes
   * de instalarlo, como hasta ahora).
   */
  private async objetivoOImplicito(
    ref: string,
    cfg: Config,
  ): Promise<{ def: DefServicio | undefined; inst: InstanciaResuelta }> {
    if (esIdServicioDatos(ref)) {
      const def = this.requerir(ref);
      const pred = (await this.resolver(def, cfg)).find((i) => i.predeterminada);
      if (pred) return { def, inst: pred };
      const c = cfg.servicios.datos[ref];
      return {
        def,
        inst: {
          id: idInstancia(ref, 'actual'),
          servicio: ref,
          clave: 'actual',
          version: '',
          puerto: c.puerto,
          autoIniciar: c.autoIniciar,
          predeterminada: true,
          implicita: true,
          proceso: ref,
          credencial: ref,
        },
      };
    }
    return this.objetivo(ref, cfg);
  }

  /**
   * Borra datos con confirmación escrita:
   * - un servicio (`confirmacion === id`): data/<id> entero, todas sus ramas (como hasta ahora);
   * - una instancia (`confirmacion === id` de la instancia): solo data/<servicio>/<clave>.
   * Antes detiene lo que use esos datos.
   */
  borrarDatos(id: IdServicioDatos | IdInstancia, confirmacion: string): Promise<void> {
    if (!esIdServicioDatos(id) && !esIdInstancia(id)) {
      return Promise.reject(new Error(`Servicio desconocido: ${String(id)}`));
    }
    const servicio = this.servicioDe(id);
    return this.enCola(servicio, async () => {
      const nombre = this.def(servicio)?.nombre ?? NOMBRE_SERVICIO[servicio];
      const nombreObjetivo = esIdServicioDatos(id) ? nombre : id;
      if (confirmacion !== id) {
        throw new ErrorWolf(
          'servicios.confirmacion_borrado',
          `Para borrar los datos de ${nombreObjetivo} escriba "${id}".`,
          { nombre: nombreObjetivo, id },
        );
      }
      const def = this.def(servicio);
      const cfg = await this.d.leerConfig();
      const insts = def ? await this.resolver(def, cfg) : [];
      let carpeta: string;
      if (esIdServicioDatos(id)) {
        const marcas = await readdir(path.join(this.d.rutas.base, 'data', id)).catch(
          () => [] as string[],
        );
        if (marcas.some((n) => n.endsWith(SUFIJO_BLOQUEO))) {
          throw new ErrorWolf(
            'servicios.borrado_con_bloqueo',
            `${nombre} tiene una instancia bloqueada tras una actualización: resuélvala antes de borrar sus datos (sus copias se perderían).`,
            { nombre },
          );
        }
        for (const inst of insts) {
          if (this.d.supervisor.estado(inst.proceso) !== 'apagado' && def) {
            await this.detenerSinCola(def, inst);
          }
        }
        if (this.d.supervisor.estado(id) !== 'apagado') await this.d.supervisor.detener(id);
        carpeta = path.join(this.d.rutas.base, 'data', id);
      } else {
        const { clave } = parsearInstancia(id);
        const inst = insts.find((i) => i.id === id);
        if (inst && def && this.d.supervisor.estado(inst.proceso) !== 'apagado') {
          await this.detenerSinCola(def, inst);
        }
        if (this.d.supervisor.estado(id) !== 'apagado') await this.d.supervisor.detener(id);
        carpeta = this.carpetaInstancia(servicio, clave);
      }
      const borrar = this.d.borrar ?? rm;
      try {
        await borrar(carpeta, OPCIONES_BORRADO);
      } catch (e) {
        throw new Error(
          `No se pudieron borrar los datos de ${nombreObjetivo}: cierre los programas que usen la carpeta e intente de nuevo.`,
          { cause: e },
        );
      }
      // Borrar los datos (confirmado) también resuelve el bloqueo: la instancia empieza de cero
      // (aunque haya copias apartadas de una actualización al lado).
      if (esIdInstancia(id)) {
        await writeFile(`${carpeta}${SUFIJO_REINICIO}`, new Date().toISOString(), 'utf8');
        await rm(this.rutaBloqueo(servicio, parsearInstancia(id).clave), { force: true });
      }
    });
  }

  private async estadoInstancia(inst: InstanciaResuelta): Promise<EstadoInstancia> {
    return {
      id: inst.id,
      servicio: inst.servicio,
      clave: inst.clave,
      version: inst.version,
      puerto: inst.puerto,
      estado: this.d.supervisor.estado(inst.proceso),
      pid: this.d.supervisor.pid(inst.proceso),
      predeterminada: inst.predeterminada,
      autoIniciar: inst.autoIniciar,
      tieneDatos: existsSync(
        path.join(this.carpetaInstancia(inst.servicio, inst.clave), MARCA_INICIALIZADO),
      ),
      bloqueo: await this.bloqueo(inst.servicio, inst.clave),
    };
  }

  /** Instancias de un servicio (o de todos), con su estado. */
  async listaInstancias(servicio?: IdServicioDatos): Promise<EstadoInstancia[]> {
    const cfg = await this.d.leerConfig();
    const res: EstadoInstancia[] = [];
    for (const def of this.d.definiciones()) {
      if (servicio !== undefined && def.id !== servicio) continue;
      for (const inst of await this.resolver(def, cfg)) res.push(await this.estadoInstancia(inst));
    }
    return res;
  }

  /**
   * Estados de los servicios definidos e instalados (el de su instancia predeterminada; con
   * instancias configuradas, además la lista en `instancias`). Si un puerto propio lo ocupa otro
   * proceso, el conflicto va en `mensaje`; si el proceso quedó en error, la cola de su log.
   */
  async estados(cfg?: Config): Promise<EstadoServicio[]> {
    const c = cfg ?? (await this.d.leerConfig());
    const sup = this.d.supervisor;
    const res: {
      estado: EstadoServicio;
      def: DefServicio;
      inst: InstanciaResuelta;
      ocupados: number[];
    }[] = [];
    for (const def of this.d.definiciones()) {
      const insts = await this.resolver(def, c);
      const inst = insts.find((i) => i.predeterminada);
      if (!inst) continue; // no instalado: no se muestra
      const pid = sup.pid(inst.proceso);
      const estado: EstadoServicio = {
        id: def.id,
        nombre: def.nombre,
        categoria: def.categoria,
        version: inst.implicita
          ? inst.version
          : await this.binariosDe(def, inst).catch(() => inst.version),
        estado: sup.estado(inst.proceso),
        puertos: this.puertos(def, inst),
        pid,
      };
      const error = estado.estado === 'error' ? sup.mensaje?.(inst.proceso) : undefined;
      if (error) estado.mensaje = error;
      if (!inst.implicita) {
        estado.instancias = await Promise.all(insts.map((i) => this.estadoInstancia(i)));
      }
      // Solo se buscan conflictos en puertos que responden y que no son de nuestro proceso.
      const ocupados: number[] = [];
      if (pid === null && !error) {
        for (const p of estado.puertos) if (await this.d.sonda(p)) ocupados.push(p);
      }
      res.push({ estado, def, inst, ocupados });
    }

    const consulta: number[] = [];
    for (const r of res) {
      if (r.ocupados.length === 0) continue;
      consulta.push(...r.ocupados);
      const alt = this.candidatoAlternativo(r.def, r.inst, r.estado.puertos[0]!, c);
      if (alt !== undefined) consulta.push(alt);
    }
    if (consulta.length > 0) {
      const duenos = await this.duenos(consulta, true);
      for (const r of res) {
        for (const puerto of r.ocupados) {
          const uso = duenos.get(puerto);
          if (!uso) continue;
          const alt =
            puerto === r.estado.puertos[0]
              ? this.candidatoAlternativo(r.def, r.inst, puerto, c)
              : undefined;
          r.estado.mensaje = mensajeConflicto(
            puerto,
            uso,
            alt !== undefined && !duenos.has(alt) ? alt : undefined,
          );
          break;
        }
      }
    }
    return res.map((r) => r.estado);
  }

  /** Inicia las instancias con `autoIniciar`; devuelve los errores sin cortar en el primero. */
  async iniciarAutomaticos(): Promise<unknown[]> {
    const cfg = await this.d.leerConfig();
    const errores: unknown[] = [];
    for (const def of this.d.definiciones()) {
      for (const inst of await this.resolver(def, cfg)) {
        if (!inst.autoIniciar) continue;
        try {
          await this.iniciar(inst.implicita ? def.id : inst.id);
        } catch (e) {
          if (!(e instanceof ErrorDetenidoAlIniciar)) errores.push(e);
        }
      }
    }
    return errores;
  }

  /**
   * Instancias que enciende "Iniciar todo": las de `autoIniciar`, la predeterminada de cada base
   * de datos instalada (categoría `bd`) y las que usan los proyectos (por motor y puerto de su
   * `.env`). Sin repetir y en el orden de las definiciones.
   */
  async objetivosIniciarTodo(usos: readonly UsoBase[]): Promise<ObjetivoInicio[]> {
    const cfg = await this.d.leerConfig();
    const res: ObjetivoInicio[] = [];
    for (const def of this.d.definiciones()) {
      // En un grupo exclusivo solo arranca el elegido: dos captadores no pueden correr a la vez.
      if (def.grupoExclusivo === GRUPO_CORREO && def.id !== cfg.correo.captador) continue;
      for (const inst of await this.resolver(def, cfg)) {
        const usada = usos.some((u) => usoCompatible(u, def.id) && u.puerto === inst.puerto);
        const base = def.categoria === 'bd' && inst.predeterminada;
        if (!inst.autoIniciar && !base && !usada) continue;
        res.push({
          ref: inst.implicita ? def.id : inst.id,
          nombre: this.nombreDe(def, inst),
          servicio: def.id,
          puerto: inst.puerto,
        });
      }
    }
    return res;
  }

  /**
   * Enciende cada objetivo y espera a que quede encendido y responda en su puerto (en paralelo,
   * con el plazo de salud). Nunca lanza: devuelve el resultado de cada uno.
   */
  async iniciarYEsperar(objetivos: readonly ObjetivoInicio[]): Promise<ResultadoInicio[]> {
    const arrancados: { o: ObjetivoInicio; error?: unknown }[] = [];
    for (const o of objetivos) {
      try {
        await this.iniciar(o.ref, { automatico: true });
        arrancados.push({ o });
      } catch (e) {
        arrancados.push({ o, error: e });
      }
    }
    return Promise.all(
      arrancados.map(async ({ o, error }): Promise<ResultadoInicio> => {
        if (error !== undefined) return { ...o, error };
        try {
          const cfg = await this.d.leerConfig();
          const { inst } = await this.objetivo(o.ref, cfg);
          await this.esperarSalud(inst);
          return { ...o };
        } catch (e) {
          return { ...o, error: e };
        }
      }),
    );
  }

  /**
   * Antes de instalar otra versión de un servicio de datos: si su instancia aún es implícita (sin
   * `instancias` en config.json, instalación nueva), la fija con la versión que usa ahora. Si no,
   * la versión nueva pasaría a ser "la activa" y la rama nueva chocaría con ella ("Ya existe la
   * instancia…"). Va en la cola del servicio, salvo cuando no hay nada que fijar: así, desde
   * dentro de `nuevaRama` y `actualizar` (que ya fijaron la implícita en su cola) no se bloquea.
   */
  async prepararInstalacion(servicio: string): Promise<void> {
    if (!esIdServicioDatos(servicio)) return;
    const def = this.def(servicio);
    if (!def || !(await this.porMaterializar(def))) return;
    await this.enCola(servicio, async () => {
      await this.materializar(def, await this.d.leerConfig());
    });
  }

  /** ¿Tiene una instancia implícita que fijar en config.json? */
  private async porMaterializar(def: DefServicio): Promise<boolean> {
    const cfg = await this.d.leerConfig();
    if (!multiInstancia(def) || conInstancias(cfg, def.id)) return false;
    return (await this.resolver(def, cfg)).length > 0;
  }

  /**
   * Detiene en paralelo las instancias que el supervisor conoce (cada apagado limpio puede tardar
   * segundos: en serie no cabían en el margen de cierre); devuelve los errores sin cortar.
   */
  async detenerTodos(): Promise<unknown[]> {
    const cfg = await this.d.leerConfig();
    const activas: { def: DefServicio; inst: InstanciaResuelta }[] = [];
    for (const def of this.d.definiciones()) {
      for (const inst of await this.resolver(def, cfg)) {
        if (this.d.supervisor.estado(inst.proceso) !== 'apagado') activas.push({ def, inst });
      }
    }
    const r = await Promise.allSettled(
      activas.map(({ def, inst }) => this.enCola(def.id, () => this.detenerSinCola(def, inst))),
    );
    return r.flatMap((x) => (x.status === 'rejected' ? [x.reason as unknown] : []));
  }

  // ---- Instancias ----

  /**
   * Pasa un servicio de la forma de una sola instancia a instancias (lo mismo que la migración
   * del arranque): la implícita queda como `<servicio>@<clave>` con el mismo puerto, la misma
   * carpeta y las mismas credenciales, y el proceso vivo se renombra en el supervisor.
   */
  private async materializar(def: DefServicio, cfg: Config): Promise<Config> {
    if (!multiInstancia(def) || conInstancias(cfg, def.id)) return cfg;
    const implicita = (await this.resolver(def, cfg))[0];
    if (!implicita) return cfg;
    const vieja = await this.d.credenciales.leer(def.id);
    if (vieja && !(await this.d.credenciales.leer(implicita.id))) {
      await this.d.credenciales.guardar?.(implicita.id, vieja);
    }
    await this.d.modificarConfig((c) => {
      const s = c.servicios.datos[def.id];
      if (s.instancias && Object.keys(s.instancias).length > 0) return;
      s.instancias = {
        [implicita.clave]: {
          version: implicita.version,
          puerto: implicita.puerto,
          autoIniciar: implicita.autoIniciar,
        },
      };
      s.predeterminada = implicita.clave;
      reflejarPredeterminada(c, def.id);
    });
    this.d.supervisor.renombrarRegistro?.(def.id, implicita.id);
    return this.d.leerConfig();
  }

  /** Puertos reservados por el sistema (Hyper-V, WinNAT); sin poder leerlos, ninguno. */
  private async reservados(): Promise<{ desde: number; hasta: number }[]> {
    try {
      const leer = (this.d.plataforma as Partial<Plataforma>).rangosReservados;
      return leer ? await leer.call(this.d.plataforma, 'tcp') : [];
    } catch {
      return [];
    }
  }

  /**
   * Primer puerto desde el por defecto del servicio que no esté asignado (instancias propias,
   * Nginx, puertos fijos de la app), ni en un rango reservado, ni en uso por otro proceso.
   */
  private async puertoLibre(def: DefServicio, cfg: Config): Promise<number> {
    const reservados = await this.reservados();
    for (let p = def.puertoPorDefecto, n = 0; p <= 65535 && n < 500; p++, n++) {
      if (this.asignadoA(p, cfg, null) !== null) continue;
      if (reservados.some((r) => p >= r.desde && p <= r.hasta)) continue;
      if (await this.d.plataforma.quienUsaPuerto(p)) continue;
      return p;
    }
    throw new ErrorWolf('instancias.sin_puerto_libre', 'No se encontró un puerto libre.');
  }

  /**
   * Instancia nueva de `servicio` con `version` (ya instalada): su rama es la clave de datos de
   * la versión. Puerto libre y credenciales propias (generadas al iniciarla). Si la rama ya tiene
   * instancia, `instancias.existe`.
   */
  crearInstancia(servicio: IdServicioDatos, version: string): Promise<IdInstancia> {
    return this.enCola(servicio, () => this.crearSinCola(servicio, version));
  }

  private async crearSinCola(servicio: IdServicioDatos, version: string): Promise<IdInstancia> {
    const def = this.requerir(servicio);
    if (!multiInstancia(def)) {
      throw new ErrorWolf('instancias.una_sola', `${def.nombre} admite una sola instancia.`, {
        nombre: def.nombre,
      });
    }
    if (!(await this.d.instalador.instalados(servicio)).includes(version)) {
      throw this.noInstalado(def);
    }
    const clave = claveDe(def, version);
    if (!claveInstanciaValida(clave)) {
      throw new ErrorWolf(
        'instancias.id_invalido',
        'El identificador de la instancia no es válido.',
      );
    }
    const id = idInstancia(servicio, clave);
    let cfg = await this.materializar(def, await this.d.leerConfig());
    if ((await this.resolver(def, cfg)).some((i) => i.clave === clave)) {
      throw new ErrorWolf('instancias.existe', `Ya existe la instancia ${id}.`, { id });
    }
    const puerto = await this.puertoLibre(def, cfg);
    // Una carpeta de esa rama ya inicializada (de antes de las instancias) usa las credenciales
    // de siempre del servicio: se copian para que siga abriendo.
    const carpeta = this.carpetaInstancia(servicio, clave);
    if (
      existsSync(path.join(carpeta, MARCA_INICIALIZADO)) &&
      !(await this.d.credenciales.leer(id))
    ) {
      const vieja = await this.d.credenciales.leer(servicio);
      if (vieja) await this.d.credenciales.guardar?.(id, vieja);
    }
    await this.d.modificarConfig((c) => {
      const s = c.servicios.datos[servicio];
      s.instancias = { ...(s.instancias ?? {}), [clave]: { version, puerto, autoIniciar: false } };
      if (!s.predeterminada || !Object.hasOwn(s.instancias, s.predeterminada)) {
        s.predeterminada = clave;
      }
      reflejarPredeterminada(c, servicio);
    });
    cfg = await this.d.leerConfig();
    this.cacheDuenos = null;
    return id;
  }

  /** Marca la instancia como predeterminada del servicio. */
  predeterminar(id: IdInstancia): Promise<void> {
    const { servicio } = parsearInstancia(id);
    return this.enCola(servicio, async () => {
      const def = this.requerir(servicio);
      const cfg = await this.materializar(def, await this.d.leerConfig());
      const inst = (await this.resolver(def, cfg)).find((i) => i.id === id);
      if (!inst)
        throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${id}.`, { id });
      if (inst.implicita) return;
      await this.d.modificarConfig((c) => {
        c.servicios.datos[servicio].predeterminada = inst.clave;
        reflejarPredeterminada(c, servicio);
      });
    });
  }

  /** Marca si la instancia (o la predeterminada del servicio) arranca con WolfCore Dev. */
  autoIniciar(ref: IdServicioDatos | IdInstancia, valor: boolean): Promise<void> {
    return this.enCola(this.servicioDe(ref), async () => {
      const cfg = await this.d.leerConfig();
      const { inst } = await this.objetivoOImplicito(ref, cfg);
      if (valor) await this.exigirNoBloqueada(inst);
      await this.d.modificarConfig((c) => {
        const s = c.servicios.datos[inst.servicio];
        if (inst.implicita) s.autoIniciar = valor;
        else {
          const i = s.instancias?.[inst.clave];
          if (i) i.autoIniciar = valor;
          reflejarPredeterminada(c, inst.servicio);
        }
      });
    });
  }

  /**
   * Saca la instancia de la configuración (antes la detiene). Sus datos y sus credenciales
   * quedan: se puede volver a crear y abre lo mismo. La última instancia no se quita.
   */
  quitar(id: IdInstancia): Promise<void> {
    const { servicio } = parsearInstancia(id);
    return this.enCola(servicio, async () => {
      const def = this.requerir(servicio);
      const cfg = await this.materializar(def, await this.d.leerConfig());
      const insts = await this.resolver(def, cfg);
      const inst = insts.find((i) => i.id === id);
      if (!inst)
        throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${id}.`, { id });
      if (insts.length <= 1 || inst.implicita) {
        throw new ErrorWolf('instancias.ultima', `${id} es la única instancia de ${def.nombre}.`, {
          id,
        });
      }
      if (this.d.supervisor.estado(inst.proceso) !== 'apagado')
        await this.detenerSinCola(def, inst);
      await this.d.modificarConfig((c) => {
        const s = c.servicios.datos[servicio];
        if (!s.instancias) return;
        delete s.instancias[inst.clave];
        if (s.predeterminada === inst.clave) {
          s.predeterminada = Object.keys(s.instancias).sort(compararVersiones)[0] ?? null;
        }
        reflejarPredeterminada(c, servicio);
      });
      this.cacheDuenos = null;
    });
  }

  /**
   * Instancia que usa `version` (los binarios de bin/<servicio>/<version>), o null. Con la forma
   * de una sola instancia, la versión activa.
   */
  async versionEnUso(servicio: string, version: string): Promise<IdInstancia | null> {
    const def = this.def(servicio);
    if (!def) return null;
    const cfg = await this.d.leerConfig();
    const instaladas = await this.d.instalador.instalados(def.id);
    for (const inst of await this.resolver(def, cfg)) {
      const usa = inst.implicita
        ? inst.version
        : this.versionDeInstancia(def, inst.clave, inst.version, instaladas);
      if (usa === version || inst.version === version) return inst.id;
      // La versión a la que debe volver una instancia bloqueada tampoco se puede quitar.
      if ((await this.bloqueo(inst.servicio, inst.clave))?.version === version) return inst.id;
    }
    return null;
  }

  // ---- Actualización y ramas nuevas ----

  /**
   * Espera a que la instancia quede encendida y responda al puerto; con `consulta`, además a
   * que conteste una consulta mínima (listar sus bases) en MySQL, MariaDB y PostgreSQL.
   */
  private async esperarSalud(inst: InstanciaResuelta, consulta = false): Promise<void> {
    const limite = Date.now() + (this.d.plazoSaludMs ?? 60_000);
    let ultimo = 'El servicio no respondió a tiempo.';
    for (;;) {
      const e = this.d.supervisor.estado(inst.proceso);
      if (e === 'error' || e === 'apagado') {
        throw new Error(this.d.supervisor.mensaje?.(inst.proceso) ?? 'El servicio no arrancó.');
      }
      if (e === 'encendido' && (await this.d.sonda(inst.puerto))) {
        const r = this.d.respaldo;
        if (!consulta || !r || !(CON_VOLCADO as readonly string[]).includes(inst.servicio)) return;
        try {
          await r.listarBases(inst.id);
          return;
        } catch (x) {
          ultimo = `No responde a las consultas: ${mensajeDe(x).slice(0, 200)}`;
        }
      }
      if (Date.now() >= limite) throw new Error(ultimo);
      await pausa(250);
    }
  }

  /** Espera a que la instancia de `ref` (un servicio = su predeterminada) responda en su puerto. */
  async esperarSaludDe(ref: IdServicioDatos | IdInstancia): Promise<void> {
    const { inst } = await this.objetivo(ref, await this.d.leerConfig());
    await this.esperarSalud(inst);
  }

  private async arrancarYEsperar(
    def: DefServicio,
    inst: InstanciaResuelta,
    consulta = false,
  ): Promise<void> {
    await this.iniciarSinCola(def, inst, await this.d.leerConfig());
    await this.esperarSalud(inst, consulta);
  }

  /**
   * Bloquea la instancia: escribe la marca y le quita el arranque automático. Si la marca no se
   * puede escribir se registra (el error de la actualización sale igual).
   */
  private async bloquear(inst: InstanciaResuelta, b: BloqueoInstancia): Promise<void> {
    let error: unknown = null;
    try {
      await this.escribirBloqueo(inst.servicio, inst.clave, b);
    } catch (e) {
      error = e;
    }
    await this.d
      .modificarConfig((c) => {
        const s = c.servicios.datos[inst.servicio];
        if (inst.implicita) s.autoIniciar = false;
        else {
          const i = s.instancias?.[inst.clave];
          if (i) i.autoIniciar = false;
          reflejarPredeterminada(c, inst.servicio);
        }
      })
      .catch((e: unknown) => console.error(`No se pudo quitar el arranque de ${inst.id}:`, e));
    if (error) throw error;
  }

  /** Escribe la marca de bloqueo (con reintentos cortos); si no se puede, lanza. */
  private async escribirBloqueo(
    servicio: IdServicioDatos,
    clave: string,
    b: BloqueoInstancia,
  ): Promise<void> {
    let ultimo: unknown = null;
    for (let i = 0; i < 5; i++) {
      try {
        await writeFile(this.rutaBloqueo(servicio, clave), JSON.stringify(b), 'utf8');
        return;
      } catch (e) {
        ultimo = e;
        await pausa(50 * (i + 1));
      }
    }
    throw ultimo instanceof Error ? ultimo : new Error(String(ultimo));
  }

  /**
   * Bloquea tras una devolución fallida y arma el error `servicios.restauracion_fallo`. Si la
   * marca no se pudo escribir, el mensaje lo dice (no hay que encender la instancia a mano).
   */
  private async falloDevolucion(
    inst: InstanciaResuelta,
    mensaje: string,
    fallida: string,
    respaldo: string,
    /** Versión a la que debe volver la configuración al resolver (si no se pudo escribir). */
    version?: string,
  ): Promise<ErrorWolf> {
    let extra = '';
    try {
      await this.bloquear(inst, {
        fecha: this.ahora.toISOString(),
        fallida,
        respaldo,
        ...(version ? { version } : {}),
      });
    } catch (e) {
      extra = ` No se pudo marcar ${inst.id} como bloqueada (${mensajeDe(e).slice(0, 120)}): no la encienda hasta revisar los datos.`;
    }
    return new ErrorWolf('servicios.restauracion_fallo', `${mensaje}${extra}`, {
      nombre: inst.id,
      fallida,
      respaldo,
    });
  }

  /**
   * Resuelve el bloqueo de una instancia, con confirmación escrita (`confirmacion === id`):
   * - con `respaldo` (sello de `<clave>.respaldo-<sello>`): copia ese respaldo a su sitio,
   *   verificado, y aparta la carpeta actual a `<clave>.fallida-<fecha>` (nunca la borra);
   * - sin `respaldo`: acepta la carpeta actual tal como está, que debe existir e inicializada
   *   (nunca se desbloquea para inicializar una carpeta vacía).
   * No enciende nada.
   */
  desbloquear(
    id: IdInstancia,
    o: { confirmacion: string; respaldo?: string; version?: string },
  ): Promise<void> {
    const { servicio, clave } = parsearInstancia(id);
    return this.enCola(servicio, async () => {
      if (o.confirmacion !== id) {
        throw new ErrorWolf('instancias.confirmacion', `Para continuar escriba "${id}".`, { id });
      }
      const carpeta = this.carpetaInstancia(servicio, clave);
      let copia: string | null = null;
      if (o.respaldo !== undefined) {
        copia = `${carpeta}.respaldo-${o.respaldo}`;
        const valido =
          typeof o.respaldo === 'string' &&
          /^\d{8}-\d{6}$/.test(o.respaldo) &&
          (await stat(copia)
            .then((x) => x.isDirectory())
            .catch(() => false));
        if (!valido) {
          throw new ErrorWolf('instancias.respaldo_no_existe', `No existe ese respaldo de ${id}.`, {
            id,
          });
        }
      }
      const def = this.requerir(servicio);
      const inst = (await this.resolver(def, await this.d.leerConfig())).find((i) => i.id === id);
      if (!inst)
        throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${id}.`, { id });
      // La marca se lee antes de tocar nada: una devolución fallida no debe perder la versión a
      // la que volver. Con la marca ilegible esa versión no se sabe: hay que elegirla.
      const b = await this.bloqueo(servicio, clave);
      let version = b?.version;
      if (o.version !== undefined || b?.ilegible) {
        const instaladas = await this.d.instalador.instalados(servicio);
        const ok =
          typeof o.version === 'string' &&
          instaladas.includes(o.version) &&
          claveDe(def, o.version) === clave;
        if (!ok) {
          throw new ErrorWolf(
            'instancias.version_requerida',
            `No se sabe a qué versión volver ${id}: elija una versión instalada de su serie.`,
            { id },
          );
        }
        version = o.version;
      }
      if (this.vivo(inst.proceso)) await this.detenerSinCola(def, inst);
      if (copia) {
        try {
          await devolverCopia(carpeta, copia, selloFecha(this.ahora), this.d.fsCopia);
        } catch (x) {
          const fallida = x instanceof ErrorDevolucion ? x.fallida : carpeta;
          // Sigue bloqueada, y la marca dice dónde quedaron ahora los datos tocados (y conserva
          // la versión a la que volver).
          throw await this.falloDevolucion(
            inst,
            `No se pudo devolver el respaldo de ${id} (${mensajeDe(x).slice(0, 200)}). Sigue bloqueada.`,
            fallida,
            copia,
            version,
          );
        }
      } else if (!existsSync(path.join(carpeta, MARCA_INICIALIZADO))) {
        throw new ErrorWolf(
          'instancias.sin_datos',
          `${id} no tiene datos en su carpeta: elija un respaldo para devolver.`,
          { id },
        );
      }
      // Si la configuración quedó con la versión que no arrancó, vuelve antes a la de la marca
      // (si no se puede, sigue bloqueada).
      if (version && inst.version !== version) {
        const v = version;
        await this.d.modificarConfig((c) => {
          const i = c.servicios.datos[servicio].instancias?.[clave];
          if (i) i.version = v;
          reflejarPredeterminada(c, servicio);
        });
      }
      await rm(this.rutaBloqueo(servicio, clave), { force: true });
    });
  }

  /**
   * Respaldos, volcados y carpetas apartadas que dejaron las actualizaciones y las ramas nuevas
   * (`data/<servicio>/<clave>.respaldo-…`, `.fallida-…`, …), con su tamaño. Solo se listan:
   * borrarlos es otra operación, con su propia confirmación.
   */
  respaldosDeDatos(servicio?: IdServicioDatos): Promise<RespaldoDatos[]> {
    const servicios = servicio === undefined ? IDS_SERVICIO_DATOS : [servicio];
    return listarRespaldosDatos(this.d.rutas.base, servicios);
  }

  /**
   * Lo que hará `actualizar` con la instancia, para el diálogo de confirmación: carpeta de datos,
   * su tamaño, el espacio libre y si además se vuelcan las bases. No cambia nada.
   */
  async planActualizar(id: IdInstancia): Promise<PlanActualizar> {
    const { servicio, clave } = parsearInstancia(id);
    const def = this.requerir(servicio);
    const inst = (await this.resolver(def, await this.d.leerConfig())).find(
      (i) => i.id === id || (i.implicita && i.clave === clave),
    );
    if (!inst) throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${id}.`, { id });
    const carpeta = this.carpetaInstancia(servicio, clave);
    const hayDatos = existsSync(path.join(carpeta, MARCA_INICIALIZADO));
    const medida = hayDatos ? await medirCarpeta(carpeta) : { bytes: 0, archivos: 0 };
    const donde = existsSync(path.dirname(carpeta)) ? path.dirname(carpeta) : this.d.rutas.base;
    const libres = await (this.d.fsCopia ?? fsCopiaReal).espacioLibre(donde);
    return {
      id,
      version: inst.version,
      carpeta,
      respaldo: `${carpeta}.respaldo-${selloFecha(this.ahora)}`,
      hayDatos,
      ...medida,
      libres,
      necesarios: medida.bytes + MARGEN_LIBRE_BYTES,
      volcados: hayDatos && (CON_VOLCADO as readonly string[]).includes(servicio),
    };
  }

  /**
   * Borra una copia de `data/<servicio>/` que dejaron las actualizaciones (respaldo, volcados,
   * carpeta fallida…), con `confirmar === true`. Solo se borra lo que lista `respaldosDeDatos`
   * (nunca la carpeta de datos actual) y nunca lo que apunta el bloqueo de una instancia.
   */
  borrarRespaldoDatos(
    r: { servicio: IdServicioDatos; clave: string; tipo: TipoRespaldoDatos; sello: string },
    confirmar: true,
  ): Promise<void> {
    if (confirmar !== true) {
      return Promise.reject(new Error('Falta la confirmación para borrar la copia.'));
    }
    const noExiste = (): ErrorWolf =>
      new ErrorWolf('instancias.respaldo_no_existe', 'No existe esa copia de los datos.', {
        id: `${String(r.servicio)}@${String(r.clave)}`.slice(0, 40),
      });
    if (!esIdServicioDatos(r.servicio)) return Promise.reject(noExiste());
    return this.enCola(r.servicio, async () => {
      const lista = await listarRespaldosDatos(this.d.rutas.base, [r.servicio]);
      const x = lista.find((l) => l.clave === r.clave && l.tipo === r.tipo && l.sello === r.sello);
      if (!x) throw noExiste();
      // Con la marca de bloqueo (legible o no) ninguna copia de esa clave se borra: cualquiera
      // puede ser la que hace falta para devolver los datos.
      if (existsSync(this.rutaBloqueo(r.servicio, r.clave))) {
        throw new ErrorWolf(
          'instancias.respaldo_en_uso',
          `Esa copia la necesita ${r.servicio}@${r.clave}, que está bloqueada: resuélvalo antes.`,
          { id: `${r.servicio}@${r.clave}` },
        );
      }
      const borrar = this.d.borrar ?? rm;
      await borrar(x.carpeta, OPCIONES_BORRADO);
    });
  }

  private async volcados(
    inst: InstanciaResuelta,
    carpeta: string,
  ): Promise<{ base: string; archivo: string }[]> {
    if (!(CON_VOLCADO as readonly string[]).includes(inst.servicio) || !this.d.respaldo) return [];
    const r = this.d.respaldo;
    const res: { base: string; archivo: string }[] = [];
    await mkdir(carpeta, { recursive: true });
    for (const base of await r.listarBases(inst.id)) {
      res.push({ base, archivo: await r.respaldar(inst.id, base, carpeta) });
    }
    return res;
  }

  private async instalarVersion(
    def: DefServicio,
    version: string,
    o: { confirmarSinHuella?: true },
  ): Promise<void> {
    if ((await this.d.instalador.instalados(def.id)).includes(version)) return;
    if (!this.d.instalarVersion) throw this.noInstalado(def);
    // La implícita queda fija antes de que la versión nueva cambie cuál es la activa.
    await this.materializar(def, await this.d.leerConfig());
    await this.d.instalarVersion(def.id, version, o);
  }

  /**
   * Actualiza una instancia a otra versión de su misma rama (un parche), con respaldo previo:
   * 1. instala la versión nueva junto a la anterior (la anterior no se toca);
   * 2. con la instancia encendida (con los binarios actuales), vuelca cada base (MySQL, MariaDB,
   *    PostgreSQL) en `data/<servicio>/<clave>.respaldo-<fecha>.volcados`;
   * 3. la detiene y copia en frío `data/<servicio>/<clave>` en `<clave>.respaldo-<fecha>`
   *    (antes mide y comprueba el espacio libre; después compara tamaño y archivos);
   * 4. cambia la versión, la inicia y espera a que responda.
   * Si el respaldo falla, no cambia nada (`servicios.respaldo_fallo`). Si la versión nueva no
   * arranca, aparta la carpeta tocada, devuelve la copia, vuelve a la versión anterior, la
   * inicia y lanza `servicios.actualizacion_revertida`. El respaldo siempre queda.
   */
  actualizar(
    id: IdInstancia,
    version: string,
    o: { confirmarSinHuella?: true } = {},
  ): Promise<{ anterior: string; respaldo: { carpeta: string; volcados: string[] } }> {
    const { servicio } = parsearInstancia(id);
    return this.enCola(servicio, async () => {
      const def = this.requerir(servicio);
      let cfg = await this.materializar(def, await this.d.leerConfig());
      const inst = (await this.resolver(def, cfg)).find((i) => i.id === id);
      if (!inst)
        throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${id}.`, { id });
      await this.exigirNoBloqueada(inst);
      if (typeof version !== 'string' || claveDe(def, version) !== inst.clave) {
        throw new ErrorWolf(
          'servicios.otra_rama',
          `${def.nombre} ${version} es de otra serie: créela como instancia nueva.`,
          { nombre: def.nombre, version },
        );
      }
      const anterior = await this.binariosDe(def, inst);
      if (anterior === version) {
        throw new ErrorWolf('servicios.misma_version', `${id} ya usa ${def.nombre} ${version}.`, {
          id,
          version,
        });
      }
      await this.instalarVersion(def, version, o);

      const carpeta = this.carpetaInstancia(servicio, inst.clave);
      const sello = selloFecha(this.ahora);
      const copia = `${carpeta}.respaldo-${sello}`;
      const carpetaVolcados = `${copia}.volcados`;
      const estaba = this.vivo(inst.proceso);
      const fallaRespaldo = (e: unknown): ErrorWolf =>
        e instanceof ErrorWolf && e.codigo === 'servicios.espacio_insuficiente'
          ? e
          : new ErrorWolf(
              'servicios.respaldo_fallo',
              `No se actualizó ${id}: falló el respaldo previo y no se cambió nada (${mensajeDe(e).slice(0, 300)}).`,
              { nombre: id },
            );

      // 2. Volcados con los binarios actuales (hay que tenerla encendida).
      let volcados: { base: string; archivo: string }[] = [];
      const hayDatos = existsSync(path.join(carpeta, MARCA_INICIALIZADO));
      try {
        if (hayDatos && (CON_VOLCADO as readonly string[]).includes(servicio) && this.d.respaldo) {
          if (!this.vivo(inst.proceso)) await this.arrancarYEsperar(def, inst);
          volcados = await this.volcados(inst, carpetaVolcados);
        }
      } catch (e) {
        if (!estaba && this.vivo(inst.proceso)) await this.detenerSinCola(def, inst);
        throw fallaRespaldo(e);
      }
      // 3. Detenida, copia en frío.
      await this.detenerSinCola(def, inst);
      if (hayDatos) {
        try {
          await copiaEnFrio(carpeta, copia, this.d.fsCopia);
        } catch (e) {
          if (estaba) await this.arrancarYEsperar(def, inst).catch(() => undefined);
          throw fallaRespaldo(e);
        }
      }
      const respaldo = {
        carpeta: hayDatos ? copia : '',
        volcados: volcados.map((v) => v.archivo),
      };

      // 4. Versión nueva.
      const fijar = (v: string): Promise<void> =>
        this.d.modificarConfig((c) => {
          const i = c.servicios.datos[servicio].instancias?.[inst.clave];
          if (i) i.version = v;
          reflejarPredeterminada(c, servicio);
        });
      await fijar(version);
      cfg = await this.d.leerConfig();
      const nueva = { ...inst, version };
      try {
        await this.arrancarYEsperar(def, nueva, true);
      } catch (e) {
        const motivo = mensajeDe(e).slice(0, 300);
        await this.detenerSinCola(def, nueva).catch(() => undefined);
        let sinConfig: unknown = null;
        try {
          await fijar(anterior);
        } catch (x) {
          sinConfig = x;
        }
        let apartada: string | null = null;
        if (hayDatos) {
          try {
            apartada = await devolverCopia(carpeta, copia, sello, this.d.fsCopia);
          } catch (x) {
            // Sin la copia devuelta y verificada no se arranca nada encima de datos dudosos.
            const fallida = x instanceof ErrorDevolucion ? x.fallida : carpeta;
            throw await this.falloDevolucion(
              inst,
              `${def.nombre} ${version} no arrancó y no se pudieron devolver los datos de ${id} (${mensajeDe(x).slice(0, 200)}). No se encendió nada: los datos que tocó la versión nueva están en ${fallida} y el respaldo en ${copia}.`,
              fallida,
              copia,
            );
          }
        }
        if (sinConfig && hayDatos) {
          // La configuración sigue con la versión nueva (que no arranca): bloqueada hasta que se
          // resuelva; al resolver se vuelve a `anterior`. Los datos ya están devueltos.
          throw await this.falloDevolucion(
            inst,
            `${def.nombre} ${version} no arrancó y no se pudo volver a ${anterior} en la configuración (${mensajeDe(sinConfig).slice(0, 200)}). Los datos se devolvieron; no se encendió nada.`,
            apartada ?? carpeta,
            copia,
            anterior,
          );
        }
        if (sinConfig) {
          // Sin datos que proteger no se bloquea: solo se informa.
          throw new ErrorWolf(
            'servicios.config_no_revertida',
            `${def.nombre} ${version} no arrancó y no se pudo volver a ${anterior} en la configuración (${mensajeDe(sinConfig).slice(0, 200)}). Vuelva a elegir ${anterior} en Servicios → Versiones.`,
            { nombre: id, version, anterior },
          );
        }
        const vieja = { ...inst, version: anterior };
        if (estaba) await this.arrancarYEsperar(def, vieja).catch(() => undefined);
        throw new ErrorWolf(
          'servicios.actualizacion_revertida',
          `${def.nombre} ${version} no arrancó (${motivo}); ${id} volvió a ${anterior}. El respaldo quedó en ${respaldo.carpeta || 'los volcados'}.`,
          { nombre: id, version, anterior },
        );
      }
      if (!estaba) await this.detenerSinCola(def, nueva);
      return { anterior, respaldo };
    });
  }

  /**
   * Rama nueva = instancia nueva (`<servicio>@<clave de la rama>`), con su carpeta, su puerto y
   * sus credenciales. Con `copiarDesde`, vuelca las bases de esa instancia y las restaura en la
   * nueva; la de origen no se borra ni se detiene más de lo necesario (si estaba apagada, se
   * enciende para el volcado y se vuelve a apagar).
   * Cada base se restaura aparte: una que falla no corta las demás y queda en `fallidas`. Los
   * usuarios no se copian: PostgreSQL se restaura sin dueños ni privilegios (`pg_restore
   * --no-owner --no-privileges`) y en MySQL/MariaDB se avisa si hay objetos con DEFINER.
   */
  nuevaRama(
    servicio: IdServicioDatos,
    version: string,
    o: { copiarDesde?: IdInstancia; confirmarSinHuella?: true } = {},
  ): Promise<ResultadoNuevaRama> {
    return this.enCola(servicio, async () => {
      const def = this.requerir(servicio);
      if (o.copiarDesde !== undefined && parsearInstancia(o.copiarDesde).servicio !== servicio) {
        throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${o.copiarDesde}.`, {
          id: o.copiarDesde,
        });
      }
      await this.instalarVersion(
        def,
        version,
        o.confirmarSinHuella ? { confirmarSinHuella: true } : {},
      );
      const id = await this.crearSinCola(servicio, version);
      const res: ResultadoNuevaRama = { id, restauradas: [], fallidas: [], advertencias: [] };
      if (o.copiarDesde === undefined) return res;
      const cfg = await this.d.leerConfig();
      const insts = await this.resolver(def, cfg);
      const origen = insts.find((i) => i.id === o.copiarDesde);
      const nueva = insts.find((i) => i.id === id)!;
      if (!origen) {
        throw new ErrorWolf('instancias.no_existe', `No existe la instancia ${o.copiarDesde}.`, {
          id: o.copiarDesde,
        });
      }
      const r = this.d.respaldo;
      if (!(CON_VOLCADO as readonly string[]).includes(servicio) || !r) return res;
      const estaba = this.vivo(origen.proceso);
      const carpeta = path.join(
        this.carpetaInstancia(servicio, nueva.clave) + `.copia-${selloFecha(this.ahora)}`,
      );
      let volcados: { base: string; archivo: string }[];
      try {
        if (!estaba) await this.arrancarYEsperar(def, origen);
        volcados = await this.volcados(origen, carpeta);
      } finally {
        if (!estaba && this.vivo(origen.proceso)) await this.detenerSinCola(def, origen);
      }
      await this.arrancarYEsperar(def, nueva);
      for (const v of volcados) {
        try {
          const avisos = await r.restaurar(id, v.archivo, v.base);
          res.restauradas.push(v.base);
          for (const a of avisos ?? []) res.advertencias.push(`${v.base}: ${a}`);
        } catch (e) {
          res.fallidas.push({ base: v.base, motivo: mensajeDe(e).slice(0, 300) });
          continue;
        }
        if (servicio !== 'postgresql' && (await conDefiner(v.archivo).catch(() => false))) {
          res.advertencias.push(
            `${v.base}: tiene vistas, rutinas o triggers con DEFINER; los usuarios no se copian a ${id}: créelos o cambie el DEFINER.`,
          );
        }
      }
      return res;
    });
  }
}

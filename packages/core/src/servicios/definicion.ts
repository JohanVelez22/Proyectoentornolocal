import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AlmacenCredenciales } from '../almacen';
import type { Ejecutor, Plataforma } from '../plataforma/tipos';
import { pidExiste } from '../plataforma/win';
import type { DefProceso } from '../procesos/supervisor';
import type { Rutas } from '../rutas';
import {
  IDS_SERVICIO_DATOS,
  type Config,
  type Credenciales,
  type EstadoServicio,
  type IdServicioDatos,
} from '../tipos';
import {
  compararVersiones,
  ErrorPuertoOcupado,
  type InstaladorServicios,
  type SupervisorServicios,
} from './nginx';

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
  id: 'mysql' | 'mariadb' | 'postgresql' | 'redis' | 'mongodb' | 'mailpit' | 'ollama';
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

export const NOMBRE_SERVICIO: Record<IdServicioDatos, string> = {
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
  mailpit: 'Mailpit',
  ollama: 'Ollama',
};

export const USUARIO_POR_DEFECTO: Record<IdServicioDatos, string> = {
  mysql: 'root',
  mariadb: 'root',
  postgresql: 'postgres',
  redis: 'default',
  mongodb: 'admin',
  mailpit: 'mailpit',
  ollama: 'ollama',
};

/** Puertos de la aplicación (HTTPS, Adminer, FTP, PHP) que ningún servicio de datos puede tomar. */
function puertosFijos(cfg: Config): { desde: number; hasta: number; nombre: string }[] {
  const https = cfg.https?.puerto ?? 443;
  const ftp = cfg.ftp?.puerto ?? 2121;
  const [pasivoMin, pasivoMax] = cfg.ftp?.pasivos ?? [50000, 50100];
  return [
    { desde: https, hasta: https, nombre: 'HTTPS' },
    { desde: 8090, hasta: 8090, nombre: 'Adminer' },
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

export interface DepsServiciosDatos {
  rutas: Rutas;
  plataforma: Plataforma;
  supervisor: SupervisorServicios;
  instalador: InstaladorServicios;
  leerConfig: () => Promise<Config>;
  /** Lee, modifica y guarda la configuración en la cola común (para no pisar otras escrituras). */
  modificarConfig: (fn: (c: Config) => void) => Promise<void>;
  credenciales: Pick<AlmacenCredenciales, 'leer' | 'obtenerOCrear'>;
  sonda: (puerto: number) => Promise<boolean>;
  exec: Ejecutor;
  /** Se consulta en cada llamada: las definiciones pueden registrarse después. */
  definiciones: () => readonly DefServicio[];
  /** Para pruebas: borrado recursivo (por defecto `fs.rm`). */
  borrar?: (ruta: string, opciones: typeof OPCIONES_BORRADO) => Promise<void>;
  /** ¿Sigue vivo el PID? (por defecto `pidExiste`, sin lanzar procesos). */
  existePid?: (pid: number) => boolean;
}

/** Ciclo de vida de los servicios declarados con `DefServicio`. */
export class ServiciosDatos {
  private readonly colas = new Map<string, Promise<unknown>>();
  private cacheDuenos: { clave: string; hasta: number; duenos: Duenos } | null = null;

  constructor(private readonly d: DepsServiciosDatos) {}

  def(id: string): DefServicio | undefined {
    return this.d.definiciones().find((x) => x.id === id);
  }

  private requerir(id: string): DefServicio {
    const def = this.def(id);
    if (!def) throw new Error(`Servicio desconocido: ${id}`);
    return def;
  }

  /** Operaciones de un mismo servicio, una a la vez. */
  private enCola<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const r = (this.colas.get(id) ?? Promise.resolve()).then(fn, fn);
    this.colas.set(
      id,
      r.catch(() => undefined),
    );
    return r;
  }

  /** Versión configurada si está instalada; si no, la más reciente instalada. */
  async versionActiva(def: DefServicio, cfg?: Config): Promise<string> {
    const c = cfg ?? (await this.d.leerConfig());
    const instaladas = await this.d.instalador.instalados(def.id);
    const elegida = c.servicios.datos[def.id].version;
    if (elegida && instaladas.includes(elegida)) return elegida;
    const nueva = [...instaladas].sort(compararVersiones).at(-1);
    if (!nueva) throw new Error(`${def.nombre} no está instalado. Instálelo desde Servicios.`);
    return nueva;
  }

  /** Carpeta de datos de `def` para `version` (usa su `claveDatos`). */
  carpetaDatos(def: DefServicio, version: string): string {
    const clave = def.claveDatos;
    return this.d.rutas.datos(def.id, version, clave ? (v) => clave.call(def, v) : undefined);
  }

  /** Credenciales guardadas o, la primera vez, generadas y guardadas. */
  credenciales(id: IdServicioDatos): Promise<Credenciales> {
    return this.d.credenciales.obtenerOCrear(id, () => ({
      usuario: USUARIO_POR_DEFECTO[id],
      clave: generarClave(),
    }));
  }

  private async contexto(def: DefServicio, version: string, cfg: Config): Promise<CtxServicio> {
    return {
      rutas: this.d.rutas,
      bin: this.d.rutas.bin(def.id, version),
      datos: this.carpetaDatos(def, version),
      puerto: cfg.servicios.datos[def.id].puerto,
      version,
      credenciales: await this.credenciales(def.id),
      exec: this.d.exec,
    };
  }

  /** Quién tiene ya asignado `puerto`: Nginx, un puerto fijo de la app u otro servicio propio. */
  private asignadoA(id: IdServicioDatos, puerto: number, cfg: Config): string | null {
    if (cfg.servicios.nginx.puerto === puerto) return 'Nginx';
    const fijo = puertosFijos(cfg).find((f) => puerto >= f.desde && puerto <= f.hasta);
    if (fijo) return fijo.nombre;
    for (const otro of IDS_SERVICIO_DATOS) {
      const def = this.def(otro);
      const extras = def?.puertosExtra ?? [];
      const puertos = otro === id ? extras : [cfg.servicios.datos[otro].puerto, ...extras];
      if (puertos.includes(puerto)) return def?.nombre ?? NOMBRE_SERVICIO[otro];
    }
    return null;
  }

  /** Candidato a sugerir en lugar de `puerto` (falta comprobar que esté libre). */
  private candidatoAlternativo(def: DefServicio, puerto: number, cfg: Config): number | undefined {
    const c = puerto === def.puertoAlternativo ? def.puertoPorDefecto : def.puertoAlternativo;
    if (c === undefined || c === puerto) return undefined;
    return this.asignadoA(def.id, c, cfg) === null ? c : undefined;
  }

  private puertos(def: DefServicio, cfg: Config): number[] {
    return [cfg.servicios.datos[def.id].puerto, ...(def.puertosExtra ?? [])];
  }

  private vivo(id: string): boolean {
    const e = this.d.supervisor.estado(id);
    return e === 'encendido' || e === 'iniciando';
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

  private async verificarPuertos(def: DefServicio, cfg: Config): Promise<void> {
    const puertos = this.puertos(def, cfg);
    const alt = this.candidatoAlternativo(def, puertos[0]!, cfg);
    const duenos = await this.duenos(alt === undefined ? puertos : [...puertos, alt], false);
    for (const [i, puerto] of puertos.entries()) {
      const uso = duenos.get(puerto);
      if (!uso || this.d.supervisor.pid(def.id) === uso.pid) continue;
      const libre = i === 0 && alt !== undefined && !duenos.has(alt) ? alt : undefined;
      throw new ErrorPuertoOcupado(puerto, uso.pid, uso.nombre, libre);
    }
  }

  /** Ejecuta `inicializar` si la carpeta de datos no tiene la marca; si falla, deshace lo creado. */
  private async prepararDatos(def: DefServicio, ctx: CtxServicio): Promise<void> {
    const marca = path.join(ctx.datos, MARCA_INICIALIZADO);
    if (existsSync(marca)) return;
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
    } catch (e) {
      if (!existia) {
        await rm(ctx.datos, OPCIONES_BORRADO).catch(() => undefined);
        await rm(creando, { force: true }).catch(() => undefined);
      }
      throw new Error(`No se pudo preparar ${def.nombre}: ${mensajeDe(e)}`, { cause: e });
    }
  }

  iniciar(id: IdServicioDatos): Promise<void> {
    return this.enCola(id, () => this.iniciarSinCola(id));
  }

  private async iniciarSinCola(id: IdServicioDatos): Promise<void> {
    const def = this.requerir(id);
    if (this.vivo(id)) return;
    const cfg = await this.d.leerConfig();
    const version = await this.versionActiva(def, cfg);
    this.cacheDuenos = null;
    await this.verificarPuertos(def, cfg);
    const ctx = await this.contexto(def, version, cfg);
    await this.prepararDatos(def, ctx);
    const proceso = await def.proceso(ctx);
    await this.d.supervisor.iniciar({ ...proceso, id: def.id });
  }

  detener(id: IdServicioDatos): Promise<void> {
    return this.enCola(id, () => this.detenerSinCola(id));
  }

  private async detenerSinCola(id: IdServicioDatos): Promise<void> {
    const def = this.requerir(id);
    const pid = this.d.supervisor.pid(id);
    this.cacheDuenos = null;
    if (pid !== null && def.detenerLimpio) {
      // Sin esto, la salida limpia contaría como caída y el supervisor lo relanzaría.
      this.d.supervisor.marcarDeteniendo?.(id);
      try {
        const cfg = await this.d.leerConfig();
        const version = await this.versionActiva(def, cfg);
        await def.detenerLimpio(await this.contexto(def, version, cfg));
        // Consulta directa al sistema (sin lanzar tasklist cada 200 ms).
        const existe = this.d.existePid ?? pidExiste;
        const limite = Date.now() + ESPERA_APAGADO_MS;
        while (Date.now() < limite && existe(pid)) await pausa(200);
      } catch {
        // si el apagado limpio falla, el supervisor lo detiene a la fuerza
      }
    }
    await this.d.supervisor.detener(id);
  }

  /** Valida (1024–65535, libre y no asignado a otro servicio propio), guarda y reinicia si corría. */
  cambiarPuerto(id: IdServicioDatos, puerto: number): Promise<void> {
    return this.enCola(id, async () => {
      this.requerir(id);
      if (!Number.isInteger(puerto) || puerto < 1024 || puerto > 65535) {
        throw new Error('El puerto debe ser un número entre 1024 y 65535.');
      }
      const cfg = await this.d.leerConfig();
      if (cfg.servicios.datos[id].puerto === puerto) return;
      const otro = this.asignadoA(id, puerto, cfg);
      if (otro !== null) throw new Error(`El puerto ${puerto} ya está asignado a ${otro}.`);
      const uso = await this.d.plataforma.quienUsaPuerto(puerto);
      if (uso && uso.pid !== this.d.supervisor.pid(id)) {
        throw new ErrorPuertoOcupado(puerto, uso.pid, uso.nombre);
      }
      const estaba = this.vivo(id);
      await this.d.modificarConfig((c) => {
        c.servicios.datos[id].puerto = puerto;
      });
      this.cacheDuenos = null;
      if (estaba) {
        await this.detenerSinCola(id);
        await this.iniciarSinCola(id);
      }
    });
  }

  /** Borra data/<id> (todas sus versiones) si `confirmacion === id`; antes detiene el servicio. */
  borrarDatos(id: IdServicioDatos, confirmacion: string): Promise<void> {
    if (!esIdServicioDatos(id)) return Promise.reject(new Error(`Servicio desconocido: ${id}`));
    return this.enCola(id, async () => {
      const nombre = this.def(id)?.nombre ?? NOMBRE_SERVICIO[id];
      if (confirmacion !== id) {
        throw new Error(`Para borrar los datos de ${nombre} escriba "${id}".`);
      }
      if (this.d.supervisor.estado(id) !== 'apagado') {
        if (this.def(id)) await this.detenerSinCola(id);
        else await this.d.supervisor.detener(id);
      }
      const borrar = this.d.borrar ?? rm;
      try {
        await borrar(path.join(this.d.rutas.base, 'data', id), OPCIONES_BORRADO);
      } catch (e) {
        throw new Error(
          `No se pudieron borrar los datos de ${nombre}: cierre los programas que usen la carpeta e intente de nuevo.`,
          { cause: e },
        );
      }
    });
  }

  /**
   * Estados de los servicios definidos e instalados. Si un puerto propio lo ocupa otro proceso,
   * el conflicto va en `mensaje`; si el proceso quedó en error, la cola de su log.
   */
  async estados(cfg?: Config): Promise<EstadoServicio[]> {
    const c = cfg ?? (await this.d.leerConfig());
    const sup = this.d.supervisor;
    const res: { estado: EstadoServicio; def: DefServicio; ocupados: number[] }[] = [];
    for (const def of this.d.definiciones()) {
      let version: string;
      try {
        version = await this.versionActiva(def, c);
      } catch {
        continue; // no instalado: no se muestra
      }
      const pid = sup.pid(def.id);
      const estado: EstadoServicio = {
        id: def.id,
        nombre: def.nombre,
        categoria: def.categoria,
        version,
        estado: sup.estado(def.id),
        puertos: this.puertos(def, c),
        pid,
      };
      const error = estado.estado === 'error' ? sup.mensaje?.(def.id) : undefined;
      if (error) estado.mensaje = error;
      // Solo se buscan conflictos en puertos que responden y que no son de nuestro proceso.
      const ocupados: number[] = [];
      if (pid === null && !error) {
        for (const p of estado.puertos) if (await this.d.sonda(p)) ocupados.push(p);
      }
      res.push({ estado, def, ocupados });
    }

    const consulta: number[] = [];
    for (const r of res) {
      if (r.ocupados.length === 0) continue;
      consulta.push(...r.ocupados);
      const alt = this.candidatoAlternativo(r.def, r.estado.puertos[0]!, c);
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
              ? this.candidatoAlternativo(r.def, puerto, c)
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

  /** Inicia los instalados con `autoIniciar`; devuelve los errores sin cortar en el primero. */
  async iniciarAutomaticos(): Promise<unknown[]> {
    const cfg = await this.d.leerConfig();
    const errores: unknown[] = [];
    for (const def of this.d.definiciones()) {
      if (!cfg.servicios.datos[def.id].autoIniciar) continue;
      if ((await this.d.instalador.instalados(def.id)).length === 0) continue;
      try {
        await this.iniciar(def.id);
      } catch (e) {
        errores.push(e);
      }
    }
    return errores;
  }

  /**
   * Detiene en paralelo los que el supervisor conoce (cada apagado limpio puede tardar segundos:
   * en serie no cabían en el margen de cierre); devuelve los errores sin cortar en el primero.
   */
  async detenerTodos(): Promise<unknown[]> {
    const activos = this.d
      .definiciones()
      .filter((def) => this.d.supervisor.estado(def.id) !== 'apagado');
    const r = await Promise.allSettled(activos.map((def) => this.detener(def.id)));
    return r.flatMap((x) => (x.status === 'rejected' ? [x.reason as unknown] : []));
  }
}

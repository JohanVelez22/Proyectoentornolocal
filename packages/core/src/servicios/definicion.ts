import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Ejecutor, Plataforma } from '../plataforma/tipos';
import type { DefProceso } from '../procesos/supervisor';
import type { Rutas } from '../rutas';
import {
  IDS_SERVICIO_DATOS,
  type Config,
  type EstadoServicio,
  type IdServicioDatos,
} from '../tipos';
import {
  compararVersiones,
  ErrorPuertoOcupado,
  type InstaladorServicios,
  type SupervisorServicios,
} from './nginx';

export interface Credenciales {
  usuario: string;
  clave: string;
}

export interface CtxServicio {
  rutas: Rutas;
  /** Carpeta de instalación: bin/<servicio>/<version>. */
  bin: string;
  /** Carpeta de datos: data/<servicio>/<mayor.menor>. En `inicializar` puede no existir aún. */
  datos: string;
  /** Puerto configurado; `proceso` debe aplicarlo en cada arranque (puede cambiar). */
  puerto: number;
  /** Clave de la versión instalada (p. ej. "8.4.13"). */
  version: string;
  /**
   * Nunca se escriben en logs, mensajes de error ni URL, ni en `args`/`env` del DefProceso
   * (el supervisor los guarda en run/estado.json).
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
  // Prepara datos y configuración la primera vez; debe ser idempotente.
  inicializar(ctx: CtxServicio): Promise<void>;
  // El supervisor lo lanza con este DefProceso.
  proceso(ctx: CtxServicio): Promise<DefProceso>;
  // Opcional: apagado limpio (mysqladmin shutdown, pg_ctl stop -m fast).
  detenerLimpio?(ctx: CtxServicio): Promise<void>;
}

/** Marca que se escribe en la carpeta de datos tras un `inicializar` correcto. */
export const MARCA_INICIALIZADO = '.pel-inicializado';

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

export interface DepsServiciosDatos {
  rutas: Rutas;
  plataforma: Plataforma;
  supervisor: SupervisorServicios;
  instalador: InstaladorServicios;
  leerConfig: () => Promise<Config>;
  /** Lee, modifica y guarda la configuración en la cola común (para no pisar otras escrituras). */
  modificarConfig: (fn: (c: Config) => void) => Promise<void>;
  sonda: (puerto: number) => Promise<boolean>;
  exec: Ejecutor;
  /** Se consulta en cada llamada: las definiciones pueden registrarse después. */
  definiciones: () => readonly DefServicio[];
}

/** Ciclo de vida de los servicios declarados con `DefServicio`. */
export class ServiciosDatos {
  private readonly colas = new Map<string, Promise<unknown>>();

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
  async versionActiva(def: DefServicio): Promise<string> {
    const cfg = await this.d.leerConfig();
    const instaladas = await this.d.instalador.instalados(def.id);
    const elegida = cfg.servicios.datos[def.id].version;
    if (elegida && instaladas.includes(elegida)) return elegida;
    const nueva = [...instaladas].sort(compararVersiones).at(-1);
    if (!nueva) throw new Error(`${def.nombre} no está instalado. Instálelo desde Servicios.`);
    return nueva;
  }

  /** Credenciales guardadas o, la primera vez, generadas y guardadas. */
  async credenciales(id: IdServicioDatos): Promise<Credenciales> {
    const guardada = (await this.d.leerConfig()).credenciales[id];
    if (guardada) return guardada;
    const nueva = { usuario: USUARIO_POR_DEFECTO[id], clave: generarClave() };
    let final: Credenciales = nueva;
    await this.d.modificarConfig((c) => {
      const actual = c.credenciales[id] ?? nueva;
      c.credenciales[id] = actual;
      final = actual;
    });
    return final;
  }

  private async contexto(def: DefServicio, version: string): Promise<CtxServicio> {
    const cfg = await this.d.leerConfig();
    return {
      rutas: this.d.rutas,
      bin: this.d.rutas.bin(def.id, version),
      datos: this.d.rutas.datos(def.id, version),
      puerto: cfg.servicios.datos[def.id].puerto,
      version,
      credenciales: await this.credenciales(def.id),
      exec: this.d.exec,
    };
  }

  /** Nombre del servicio propio (otro, o un puerto extra de este) que ya tiene asignado `puerto`. */
  private async asignadoA(id: IdServicioDatos, puerto: number): Promise<string | null> {
    const cfg = await this.d.leerConfig();
    if (cfg.servicios.nginx.puerto === puerto) return 'Nginx';
    for (const otro of IDS_SERVICIO_DATOS) {
      const def = this.def(otro);
      const extras = def?.puertosExtra ?? [];
      const puertos = otro === id ? extras : [cfg.servicios.datos[otro].puerto, ...extras];
      if (puertos.includes(puerto)) return def?.nombre ?? NOMBRE_SERVICIO[otro];
    }
    return null;
  }

  /** Puerto libre que se puede sugerir en lugar de `puerto`, si lo hay. */
  private async alternativo(def: DefServicio, puerto: number): Promise<number | undefined> {
    const c = puerto === def.puertoAlternativo ? def.puertoPorDefecto : def.puertoAlternativo;
    if (c === undefined || c === puerto) return undefined;
    if ((await this.asignadoA(def.id, c)) !== null) return undefined;
    return (await this.d.plataforma.quienUsaPuerto(c)) ? undefined : c;
  }

  private puertos(def: DefServicio, cfg: Config): number[] {
    return [cfg.servicios.datos[def.id].puerto, ...(def.puertosExtra ?? [])];
  }

  private vivo(id: string): boolean {
    const e = this.d.supervisor.estado(id);
    return e === 'encendido' || e === 'iniciando';
  }

  private async verificarPuertos(def: DefServicio, cfg: Config): Promise<void> {
    for (const [i, puerto] of this.puertos(def, cfg).entries()) {
      const uso = await this.d.plataforma.quienUsaPuerto(puerto);
      if (!uso || this.d.supervisor.pid(def.id) === uso.pid) continue;
      const alt = i === 0 ? await this.alternativo(def, puerto) : undefined;
      throw new ErrorPuertoOcupado(puerto, uso.pid, uso.nombre, alt);
    }
  }

  /** Ejecuta `inicializar` si la carpeta de datos no tiene la marca; si falla, deshace lo creado. */
  private async prepararDatos(def: DefServicio, ctx: CtxServicio): Promise<void> {
    const marca = path.join(ctx.datos, MARCA_INICIALIZADO);
    if (existsSync(marca)) return;
    const existia = existsSync(ctx.datos);
    try {
      await mkdir(path.dirname(ctx.datos), { recursive: true });
      await def.inicializar(ctx);
      await mkdir(ctx.datos, { recursive: true });
      await writeFile(marca, new Date().toISOString(), 'utf8');
    } catch (e) {
      if (!existia) await rm(ctx.datos, { recursive: true, force: true }).catch(() => undefined);
      throw new Error(`No se pudo preparar ${def.nombre}: ${mensajeDe(e)}`, { cause: e });
    }
  }

  iniciar(id: IdServicioDatos): Promise<void> {
    return this.enCola(id, () => this.iniciarSinCola(id));
  }

  private async iniciarSinCola(id: IdServicioDatos): Promise<void> {
    const def = this.requerir(id);
    if (this.vivo(id)) return;
    const version = await this.versionActiva(def);
    await this.verificarPuertos(def, await this.d.leerConfig());
    const ctx = await this.contexto(def, version);
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
    if (pid !== null && def.detenerLimpio) {
      try {
        await def.detenerLimpio(await this.contexto(def, await this.versionActiva(def)));
        const limite = Date.now() + ESPERA_APAGADO_MS;
        while (Date.now() < limite && (await this.d.plataforma.procesoVivo(pid)).vivo) {
          await pausa(200);
        }
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
      const otro = await this.asignadoA(id, puerto);
      if (otro !== null) throw new Error(`El puerto ${puerto} ya está asignado a ${otro}.`);
      const uso = await this.d.plataforma.quienUsaPuerto(puerto);
      if (uso && uso.pid !== this.d.supervisor.pid(id)) {
        throw new ErrorPuertoOcupado(puerto, uso.pid, uso.nombre);
      }
      const estaba = this.vivo(id);
      await this.d.modificarConfig((c) => {
        c.servicios.datos[id].puerto = puerto;
      });
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
      await rm(path.dirname(this.d.rutas.datos(id, '0.0')), { recursive: true, force: true });
    });
  }

  /** Estados de los servicios definidos e instalados, con conflicto de puerto en `mensaje`. */
  async estados(): Promise<EstadoServicio[]> {
    const cfg = await this.d.leerConfig();
    const sup = this.d.supervisor;
    const res: EstadoServicio[] = [];
    for (const def of this.d.definiciones()) {
      let version: string;
      try {
        version = await this.versionActiva(def);
      } catch {
        continue; // no instalado: no se muestra
      }
      const puertos = this.puertos(def, cfg);
      const pid = sup.pid(def.id);
      const estado: EstadoServicio = {
        id: def.id,
        nombre: def.nombre,
        categoria: def.categoria,
        version,
        estado: sup.estado(def.id),
        puertos,
        pid,
      };
      if (pid === null) {
        for (const [i, puerto] of puertos.entries()) {
          if (!(await this.d.sonda(puerto))) continue;
          const uso = await this.d.plataforma.quienUsaPuerto(puerto);
          if (!uso) continue;
          const alt = i === 0 ? await this.alternativo(def, puerto) : undefined;
          estado.mensaje = mensajeConflicto(puerto, uso, alt);
          break;
        }
      }
      res.push(estado);
    }
    return res;
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

  /** Detiene los que el supervisor conoce; devuelve los errores sin cortar en el primero. */
  async detenerTodos(): Promise<unknown[]> {
    const errores: unknown[] = [];
    for (const def of this.d.definiciones()) {
      if (this.d.supervisor.estado(def.id) === 'apagado') continue;
      try {
        await this.detener(def.id);
      } catch (e) {
        errores.push(e);
      }
    }
    return errores;
  }
}

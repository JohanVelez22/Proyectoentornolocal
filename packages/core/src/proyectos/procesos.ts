import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  ErrorDetenidoAlIniciar,
  type DefProceso,
  type EstadoProceso,
  type Supervisor,
} from '../procesos/supervisor';
import {
  puertoDelProxy,
  TIPOS_PROXY,
  type EstadoServicio,
  type ProcesoProyecto,
  type Sitio,
} from '../tipos';
import { existe } from './archivos';
import { entornoProyecto, resolverPrograma, usaPhp, type DepsEntorno } from './pasos/comun';
import { sanear } from './recetas';

/** Prefijo de los ids de supervisor de los procesos de proyecto: `proy-<sitio>-<proceso>`. */
export const PREFIJO_PROCESO = 'proy-';
/** El id de un sitio sale de su dominio (letras, números y guiones). */
const ID_SITIO = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
/** El id de un proceso no lleva guiones: así el último guion separa sitio y proceso. */
const ID_PROCESO = /^[A-Za-z0-9][A-Za-z0-9_]*$/;
/** Prefijo de las líneas que WolfCore Dev escribe en el log del proceso. */
const MARCA_LOG = '[WolfCore Dev]';

/** Id de supervisor del proceso. Lanza si algún id trae caracteres no permitidos. */
export function idSupervisor(sitioId: string, procesoId: string): string {
  if (!ID_SITIO.test(sitioId)) throw new Error(`Id de proyecto no válido: ${sitioId}`);
  if (!ID_PROCESO.test(procesoId)) {
    throw new Error(
      `Id de proceso no válido: ${procesoId}. Use solo letras, números y guiones bajos.`,
    );
  }
  return `${PREFIJO_PROCESO}${sitioId}-${procesoId}`;
}

/** Sitio y proceso de un id de supervisor `proy-…`, o null si el id no es de un proceso. */
export function separarIdSupervisor(id: string): { sitioId: string; procesoId: string } | null {
  if (!id.startsWith(PREFIJO_PROCESO)) return null;
  const resto = id.slice(PREFIJO_PROCESO.length);
  const i = resto.lastIndexOf('-');
  if (i <= 0) return null;
  const sitioId = resto.slice(0, i);
  const procesoId = resto.slice(i + 1);
  return ID_SITIO.test(sitioId) && ID_PROCESO.test(procesoId) ? { sitioId, procesoId } : null;
}

/** Lo que se usa del supervisor (en las pruebas, uno falso). */
export type SupervisorProcesos = Pick<
  Supervisor,
  'iniciar' | 'detener' | 'estado' | 'pid' | 'mensaje' | 'ids' | 'reinicios'
>;

export interface DepsProcesosProyecto extends DepsEntorno {
  supervisor: SupervisorProcesos;
  /** Sitios tal como están guardados. */
  leerSitios: () => Promise<Sitio[]>;
}

export interface EstadoProcesoProyecto {
  sitioId: string;
  procesoId: string;
  /** Id de supervisor (`proy-<sitio>-<proceso>`): el que llega en `servicio:estado`. */
  id: string;
  nombre: string;
  comando: string[];
  estado: EstadoProceso;
  pid: number | null;
  puerto: number | null;
  /** Final del log si quedó en error, "Reiniciando en N s"… */
  mensaje?: string;
  /** Avisos del último arranque (runtimes que faltan, rangos de versión…). */
  avisos: string[];
  /** Reinicios seguidos tras caídas (vuelve a 0 tras 60 s encendido). */
  reinicios: number;
  autoIniciar: boolean;
  reiniciar: boolean;
  /** Nginx envía el sitio a este proceso (`puertoDelProxy`). */
  proxy: boolean;
  /** Archivo de log (logs/proyectos/<sitio>-<proceso>.log). */
  log: string;
}

const mensajeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));
const nombreProceso = (p: ProcesoProyecto): string => p.nombre || p.id;

/**
 * Procesos de larga duración de los proyectos (npm run dev, queue:work, uvicorn…), supervisados:
 * sin shell, en la carpeta del proyecto, con el PATH de sus runtimes, ventana oculta y log en
 * logs/proyectos. Un proceso que sigue cayendo termina en error con el final del log (el
 * supervisor reintenta con espera creciente un número fijo de veces).
 */
export class ProcesosProyecto {
  /** Avisos del último arranque, por id de supervisor. */
  private readonly avisos = new Map<string, string[]>();
  /** Fallos antes de llegar al supervisor (sin Node, carpeta inexistente…). */
  private readonly fallos = new Map<string, string>();
  /** Cada `detener` cambia la generación: un `iniciar` en preparación ya no arranca. */
  private readonly generacion = new Map<string, number>();
  /** Ids con un `iniciar` en preparación (aún no llegaron al supervisor). */
  private readonly preparando = new Set<string>();

  constructor(private readonly d: DepsProcesosProyecto) {}

  /** Log del proceso. */
  rutaLog(sitioId: string, procesoId: string): string {
    idSupervisor(sitioId, procesoId);
    return this.d.rutas.logs('proyectos', `${sitioId}-${procesoId}.log`);
  }

  async iniciar(sitioId: string, procesoId: string): Promise<void> {
    const id = idSupervisor(sitioId, procesoId);
    // Antes de cualquier espera: un detener posterior debe notarse.
    const gen = this.generacion.get(id) ?? 0;
    this.preparando.add(id);
    try {
      await this.iniciarPreparado(id, gen, sitioId, procesoId);
    } finally {
      this.preparando.delete(id);
    }
  }

  private async iniciarPreparado(
    id: string,
    gen: number,
    sitioId: string,
    procesoId: string,
  ): Promise<void> {
    const { sitio, proceso } = await this.buscar(sitioId, procesoId);
    // Ya en marcha: no se toca (ni se escribe en su log).
    const actual = this.d.supervisor.estado(id);
    if (actual === 'encendido' || actual === 'iniciando') return;
    const log = this.rutaLog(sitioId, procesoId);
    let def: DefProceso;
    try {
      def = await this.definicion(sitio, proceso, id, log);
    } catch (e) {
      const mensaje = sanear(mensajeDe(e));
      if ((this.generacion.get(id) ?? 0) === gen) {
        this.fallos.set(id, mensaje);
        await this.escribirLog(log, [`No se pudo iniciar: ${mensaje}`]);
      }
      throw new Error(`No se pudo iniciar ${nombreProceso(proceso)}: ${mensaje}`);
    }
    // Se detuvo mientras se preparaba: no se arranca.
    if ((this.generacion.get(id) ?? 0) !== gen) return;
    this.fallos.delete(id);
    try {
      await this.d.supervisor.iniciar(def);
    } catch (e) {
      // Detenido mientras arrancaba: es una parada normal, no un error.
      if (!(e instanceof ErrorDetenidoAlIniciar)) throw e;
    }
  }

  async detener(sitioId: string, procesoId: string): Promise<void> {
    await this.detenerId(idSupervisor(sitioId, procesoId));
  }

  async estados(sitioId: string): Promise<EstadoProcesoProyecto[]> {
    const sitio = (await this.d.leerSitios()).find((s) => s.id === sitioId);
    if (!sitio) throw new Error(`No existe el proyecto ${sitioId}`);
    return sitio.procesos.map((p) => this.estadoDe(sitio, p));
  }

  /** Los procesos de todos los proyectos como estados de servicio (categoría `proyecto`). */
  async estadosServicio(): Promise<EstadoServicio[]> {
    const res: EstadoServicio[] = [];
    for (const sitio of await this.d.leerSitios()) {
      for (const p of sitio.procesos) {
        if (!ID_SITIO.test(sitio.id)) continue;
        const e = this.estadoDe(sitio, p);
        res.push({
          id: e.id,
          nombre: `${e.nombre} (${sitio.dominio})`,
          categoria: 'proyecto',
          version: null,
          estado: e.estado,
          puertos: e.puerto === null ? [] : [e.puerto],
          pid: e.pid,
          ...(e.mensaje === undefined ? {} : { mensaje: e.mensaje }),
        });
      }
    }
    return res;
  }

  /**
   * Arranca, al iniciar el programa, los procesos marcados con `autoIniciar` que no estén ya en
   * marcha (readoptados). Antes detiene los que quedaron sin proyecto. Devuelve los errores.
   */
  async autoIniciar(seguir: () => boolean = () => true): Promise<string[]> {
    const errores = await this.detenerHuerfanos();
    const mensajes = errores.map((e) => mensajeDe(e));
    for (const sitio of await this.d.leerSitios()) {
      for (const p of sitio.procesos) {
        if (!seguir()) return mensajes;
        if (!p.autoIniciar) continue;
        try {
          const estado = this.d.supervisor.estado(idSupervisor(sitio.id, p.id));
          if (estado === 'encendido' || estado === 'iniciando') continue;
          await this.iniciar(sitio.id, p.id);
        } catch (e) {
          mensajes.push(`${sitio.dominio}: ${mensajeDe(e)}`);
        }
      }
    }
    return mensajes;
  }

  /** Detiene todos los procesos del proyecto (antes de borrarlo). Lanza el primer error. */
  async detenerSitio(sitioId: string): Promise<void> {
    const errores = await this.detenerDonde((s) => s.sitioId === sitioId);
    if (errores.length > 0) throw errores[0];
  }

  /** Detiene todos los procesos de proyecto (al cerrar o en "Detener todo"). */
  detenerTodos(): Promise<unknown[]> {
    return this.detenerDonde(() => true);
  }

  /** Detiene los procesos supervisados cuyo proyecto o proceso ya no está en la configuración. */
  async detenerHuerfanos(): Promise<unknown[]> {
    const vigentes = new Set<string>();
    for (const s of await this.d.leerSitios()) {
      for (const p of s.procesos) vigentes.add(`${PREFIJO_PROCESO}${s.id}-${p.id}`);
    }
    return this.detenerDonde((_, id) => !vigentes.has(id));
  }

  /* ───────────── Internos ───────────── */

  private async detenerDonde(
    filtro: (s: { sitioId: string; procesoId: string }, id: string) => boolean,
  ): Promise<unknown[]> {
    const errores: unknown[] = [];
    // También los que se están preparando: su generación sube y ya no arrancan.
    for (const id of new Set([...this.d.supervisor.ids(), ...this.preparando])) {
      const s = separarIdSupervisor(id);
      if (!s || !filtro(s, id)) continue;
      try {
        await this.detenerId(id);
      } catch (e) {
        errores.push(e);
      }
    }
    return errores;
  }

  private async detenerId(id: string): Promise<void> {
    this.generacion.set(id, (this.generacion.get(id) ?? 0) + 1);
    this.fallos.delete(id);
    this.avisos.delete(id);
    await this.d.supervisor.detener(id);
  }

  private async buscar(
    sitioId: string,
    procesoId: string,
  ): Promise<{ sitio: Sitio; proceso: ProcesoProyecto }> {
    const sitio = (await this.d.leerSitios()).find((s) => s.id === sitioId);
    if (!sitio) throw new Error(`No existe el proyecto ${sitioId}`);
    const proceso = sitio.procesos.find((p) => p.id === procesoId);
    if (!proceso) throw new Error(`El proyecto ${sitio.dominio} no tiene el proceso ${procesoId}`);
    return { sitio, proceso };
  }

  private estadoDe(sitio: Sitio, p: ProcesoProyecto): EstadoProcesoProyecto {
    const id = `${PREFIJO_PROCESO}${sitio.id}-${p.id}`;
    const sup = this.d.supervisor;
    let estado = sup.estado(id);
    let mensaje = sup.mensaje(id);
    const fallo = this.fallos.get(id);
    if (estado === 'apagado' && fallo !== undefined) {
      estado = 'error';
      mensaje = fallo;
    }
    const proxy =
      TIPOS_PROXY.includes(sitio.tipo) && p.puerto !== null && p.puerto === puertoDelProxy(sitio);
    return {
      sitioId: sitio.id,
      procesoId: p.id,
      id,
      nombre: nombreProceso(p),
      comando: [...p.comando],
      estado,
      pid: sup.pid(id),
      puerto: p.puerto,
      ...(mensaje === undefined ? {} : { mensaje }),
      avisos: [...(this.avisos.get(id) ?? [])],
      reinicios: sup.reinicios(id),
      autoIniciar: p.autoIniciar,
      reiniciar: p.reiniciar,
      proxy,
      log: this.d.rutas.logs('proyectos', `${sitio.id}-${p.id}.log`),
    };
  }

  /** Carpeta de trabajo: la del proyecto o una subcarpeta suya (nunca fuera). */
  private async carpetaDeTrabajo(sitio: Sitio, p: ProcesoProyecto): Promise<string> {
    const carpeta = path.resolve(sitio.carpeta);
    if (!(await existe(carpeta))) throw new Error(`La carpeta del proyecto no existe: ${carpeta}`);
    if (p.cwd === 'raiz') return carpeta;
    const cwd = path.resolve(carpeta, p.cwd);
    const rel = path.relative(carpeta, cwd);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`La carpeta del proceso debe estar dentro del proyecto: ${p.cwd}`);
    }
    if (!(await existe(cwd))) throw new Error(`La carpeta del proceso no existe: ${cwd}`);
    return cwd;
  }

  /**
   * DefProceso del supervisor: programa resuelto (php, node, npm, npx y python del proyecto), sin
   * shell, con solo las variables que cambian (PATH de runtimes, VIRTUAL_ENV, PHPRC). Escribe al
   * principio del log los avisos de los runtimes y el comando, saneados.
   */
  private async definicion(
    sitio: Sitio,
    p: ProcesoProyecto,
    id: string,
    log: string,
  ): Promise<DefProceso> {
    const cwd = await this.carpetaDeTrabajo(sitio, p);
    const carpeta = path.resolve(sitio.carpeta);
    const entorno = await entornoProyecto(sitio, carpeta, this.d, { php: usaPhp(p.comando[0]!) });
    const avisos = entorno.avisos.map((a) => sanear(a));
    this.avisos.set(id, avisos);
    const { cmd, args } = await resolverPrograma(p.comando, carpeta, this.d, entorno);
    // Una ruta relativa con carpetas (bin\server.exe) es relativa a la carpeta del proceso.
    const comando = /[\\/]/.test(cmd) && !path.isAbsolute(cmd) ? path.resolve(cwd, cmd) : cmd;
    await this.escribirLog(log, [...avisos.map((a) => `Aviso: ${a}`), `> ${p.comando.join(' ')}`]);
    return {
      id,
      nombre: `${nombreProceso(p)} (${sitio.dominio})`,
      comando,
      args,
      cwd,
      env: entorno.cambios,
      // Sin `puerto`: es informativo (proxy) y no sirve de sonda de salud; vite o un servidor
      // que escucha en otra interfaz o tarda en abrirlo no deben morir por eso.
      exigirInicio: true,
      log,
      reiniciar: p.reiniciar,
    };
  }

  /** Agrega líneas propias (saneadas) al log del proceso; un fallo de escritura no impide nada. */
  private async escribirLog(log: string, lineas: string[]): Promise<void> {
    try {
      await mkdir(path.dirname(log), { recursive: true });
      const fecha = new Date().toISOString();
      await appendFile(
        log,
        lineas.map((l) => `${MARCA_LOG} ${fecha} ${sanear(l)}\n`).join(''),
        'utf8',
      );
    } catch (e) {
      console.error('No se pudo escribir en el log del proceso:', mensajeDe(e));
    }
  }
}

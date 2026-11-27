import type { ConfianzaCa } from '../https/confianza';
import { appendFile, mkdir } from 'node:fs/promises';
import { ErrorWolf } from '../errores';
import type { Eventos, EventosNucleo } from '../eventos';
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
import type { FilaNetstat } from '../plataforma/netstat';
import type { Lanzador } from '../plataforma/tipos';
import { validarComandoTarea } from '../tareas/comando';
import { existe } from './archivos';
import {
  entornoProyecto,
  nombrePrograma,
  resolverPrograma,
  usaPhp,
  type DepsEntorno,
} from './pasos/comun';
import { nodeOptionsConEscuchaLocal } from './escuchaLocal';
import { MENSAJE_NO_CONFIADO, sanear } from './recetas';

/**
 * Ruta relativa de wolfcore.json con los separadores de esta plataforma: el archivo se escribe a
 * menudo en Windows (`bin\srv.exe`) y en POSIX la `\` sería parte del nombre.
 */
const conSeparadores = (ruta: string): string =>
  path.sep === '/' ? ruta.replace(/\\/g, '/') : ruta;

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
  'iniciar' | 'detener' | 'estado' | 'pid' | 'mensaje' | 'ids' | 'reinicios' | 'alTerminar'
>;

export interface DepsProcesosProyecto extends DepsEntorno {
  supervisor: SupervisorProcesos;
  /** Para emitir `proceso:terminado` (sin él no se avisa de las salidas). */
  eventos?: Eventos<EventosNucleo>;
  /** Sitios tal como están guardados. */
  leerSitios: () => Promise<Sitio[]>;
  /** Lanzador de comandos con streaming (tareas programadas); sin él no hay ejecución única. */
  lanzar?: Lanzador;
  /** Confianza en la CA local (NODE_EXTRA_CA_CERTS, bundle de Python). */
  confianza?: Pick<ConfianzaCa, 'envProyecto'>;
  /**
   * Captura de dumps: carpeta de `wolfdump.py` (la deja al día). Solo los procesos de los sitios
   * con `capturaDumps` la reciben en su PYTHONPATH.
   */
  depuracion?: { carpetaPython(): Promise<string> };
  /**
   * Ruta de la precarga de Node que fuerza `127.0.0.1` (`escucha-local.cjs`, ya escrita). Con
   * ella, los procesos de `node`, `npm` y `npx` que tienen puerto la reciben en `NODE_OPTIONS`.
   */
  escuchaLocal?: () => Promise<string>;
  /**
   * Escuchas TCP de cada proceso de `pids` y de su árbol, en una sola toma de netstat y de la
   * tabla de procesos (`HerramientasPuertos.escuchasTcpDeArboles`). Con ella, los procesos de
   * Rails, Spring Boot, ASP.NET Core y Node que son destino del proxy se vigilan mientras estén
   * encendidos: cualquier escucha fuera de 127.0.0.1 y ::1 detiene el proceso.
   */
  escuchas?: (pids: number[]) => Promise<Map<number, FilaNetstat[]>>;
  /**
   * Cada cuánto se mira: `intervaloMs` (por omisión 1 s) mientras algún proceso lleve menos de
   * `rapidoMs` (60 s) encendido y `intervaloLentoMs` (12 s) después. Pruebas.
   */
  vigilancia?: { intervaloMs?: number; intervaloLentoMs?: number; rapidoMs?: number };
}

/** Un proceso en vigilancia: su generación de arranque y desde cuándo se vigila. */
interface Vigilado {
  sitio: Sitio;
  proceso: ProcesoProyecto;
  gen: number;
  desde: number;
}

/** Tipos de sitio cuyo proceso destino del proxy debe escuchar solo en local. */
const TIPOS_VIGILADOS: readonly string[] = ['rails', 'springboot', 'aspnet', 'node'];
/** Direcciones donde se permite escuchar (netstat las da sin corchetes). */
const DIRECCIONES_LOCALES = new Set(['127.0.0.1', '::1']);

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
  /** Procesos cuya escucha se vigila (ver `vigilar`) y el temporizador único de la vigilancia. */
  private readonly vigilados = new Map<string, Vigilado>();
  private temporizadorVigilancia: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly d: DepsProcesosProyecto) {
    // Salida definitiva (sin reinicio pendiente): el aviso sale con el código, sea 0 o no.
    d.supervisor.alTerminar((id, codigo) => {
      const s = separarIdSupervisor(id);
      if (s) d.eventos?.emit('proceso:terminado', { id, sitioId: s.sitioId, codigo });
    });
  }

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
    // Un sitio importado de un perfil (D26) no corre comandos hasta que el usuario confíe en él.
    if (sitio.origen === 'perfil' && (sitio.confiado !== true || sitio.pendiente)) {
      throw new ErrorWolf('proyectos.no_confiado', MENSAJE_NO_CONFIADO);
    }
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
      return;
    }
    if (
      this.d.escuchas &&
      TIPOS_VIGILADOS.includes(sitio.tipo) &&
      proceso.proxy &&
      proceso.puerto !== null
    ) {
      this.vigilar(id, gen, sitio, proceso);
    }
  }

  /**
   * Vigila el proceso mientras siga encendido (también tras reinicios automáticos del
   * supervisor: se mira el PID de cada momento). Un solo temporizador y una sola toma de netstat
   * y de la tabla de procesos por pasada, sea cual sea el número de procesos vigilados.
   */
  private vigilar(id: string, gen: number, sitio: Sitio, proceso: ProcesoProyecto): void {
    this.vigilados.set(id, { sitio, proceso, gen, desde: Date.now() });
    this.programarVigilancia();
  }

  private programarVigilancia(): void {
    if (this.temporizadorVigilancia !== null || this.vigilados.size === 0) return;
    const {
      intervaloMs = 1000,
      intervaloLentoMs = 12_000,
      rapidoMs = 60_000,
    } = this.d.vigilancia ?? {};
    const ahora = Date.now();
    const joven = [...this.vigilados.values()].some((v) => ahora - v.desde < rapidoMs);
    const t = setTimeout(
      () => {
        this.temporizadorVigilancia = null;
        void this.pasadaVigilancia().finally(() => this.programarVigilancia());
      },
      joven ? intervaloMs : intervaloLentoMs,
    );
    t.unref?.();
    this.temporizadorVigilancia = t;
  }

  /**
   * Una pasada: olvida los procesos detenidos o terminados, toma las escuchas TCP de los que
   * siguen con PID y detiene los que tengan alguna que no sea 127.0.0.1 ni ::1 (no solo la del
   * puerto asignado: Kestrel con `Kestrel:Endpoints` o Spring sin `--server.port` escuchan en otro).
   * Nunca lanza.
   */
  private async pasadaVigilancia(): Promise<void> {
    try {
      const sup = this.d.supervisor;
      const activos: { id: string; v: Vigilado; pid: number }[] = [];
      for (const [id, v] of this.vigilados) {
        const estado = sup.estado(id);
        if (
          (this.generacion.get(id) ?? 0) !== v.gen ||
          estado === 'apagado' ||
          estado === 'error'
        ) {
          this.vigilados.delete(id);
          continue;
        }
        const pid = sup.pid(id);
        if (pid !== null) activos.push({ id, v, pid });
      }
      if (activos.length === 0 || !this.d.escuchas) return;
      let mapa: Map<number, FilaNetstat[]>;
      try {
        mapa = await this.d.escuchas([...new Set(activos.map((a) => a.pid))]);
      } catch {
        return;
      }
      for (const { id, v, pid } of activos) {
        if ((this.generacion.get(id) ?? 0) !== v.gen) continue;
        const publica = (mapa.get(pid) ?? []).find((f) => !DIRECCIONES_LOCALES.has(f.direccion));
        if (!publica) continue;
        this.vigilados.delete(id);
        await this.cortarPorEscucha(id, v.sitio, v.proceso, publica);
      }
    } catch (e) {
      console.error('No se pudo vigilar la escucha de los procesos:', mensajeDe(e));
    }
  }

  private async cortarPorEscucha(
    id: string,
    sitio: Sitio,
    proceso: ProcesoProyecto,
    f: FilaNetstat,
  ): Promise<void> {
    const err = new ErrorWolf(
      'procesos.escucha_publica',
      `${nombreProceso(proceso)} escuchaba en ${f.direccion}:${f.puerto}, abierto a la red; se detuvo. Solo puede escuchar en 127.0.0.1.`,
      { direccion: f.direccion, puerto: f.puerto },
    );
    await this.detenerId(id);
    this.fallos.set(id, err.message);
    await this.escribirLog(this.rutaLog(sitio.id, proceso.id), [err.message]);
    this.d.eventos?.emit('proceso:terminado', { id, sitioId: sitio.id, codigo: null });
  }

  async detener(sitioId: string, procesoId: string): Promise<void> {
    await this.detenerId(idSupervisor(sitioId, procesoId));
  }

  async estados(sitioId: string): Promise<EstadoProcesoProyecto[]> {
    const sitio = (await this.d.leerSitios()).find((s) => s.id === sitioId);
    if (!sitio) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${sitioId}`);
    return sitio.procesos.map((p) => this.estadoDe(sitio, p));
  }

  /**
   * Ejecución única de un comando del proyecto (tareas programadas, D29): sin shell, en la
   * carpeta del sitio, con el PATH de sus runtimes y la ventana oculta. El programa sale de la
   * lista cerrada de las tareas (`validarComandoTarea`) y se resuelve como en los procesos
   * (`resolverPrograma`). `senal` mata el árbol del proceso lanzado, y solo ese. Quien llama ya
   * comprobó la confianza del sitio y la confirmación del comando.
   */
  async ejecutarUnaVez(
    sitio: Sitio,
    comando: string[],
    o: { senal: AbortSignal; alLinea: (linea: string) => void },
  ): Promise<{ codigo: number }> {
    validarComandoTarea(comando);
    const lanzar = this.d.lanzar;
    if (!lanzar) throw new Error('No se pueden lanzar comandos en este momento.');
    const carpeta = path.resolve(sitio.carpeta);
    if (!(await existe(carpeta))) throw new Error(`La carpeta del proyecto no existe: ${carpeta}`);
    const entorno = await entornoProyecto(sitio, carpeta, this.d, {
      php: usaPhp(comando[0]!),
      carpetaVenv: carpeta,
    });
    const ca: Record<string, string> = this.d.confianza
      ? await this.d.confianza.envProyecto(sitio, { carpetaVenv: carpeta }).catch(() => ({}))
      : {};
    const { cmd, args } = await resolverPrograma(comando, carpeta, this.d, entorno);
    return lanzar(cmd, args, {
      cwd: carpeta,
      env: { ...entorno.cambios, ...ca },
      senal: o.senal,
      alLinea: (l) => o.alLinea(l),
      // Una tarea que se pasa de tiempo debe terminar de verdad: grupo entero (POSIX) y 5 s de
      // gracia si un nieto sigue con la salida heredada abierta.
      matarGrupo: true,
      graciaMs: 5000,
    });
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
  async autoIniciar(
    seguir: () => boolean = () => true,
    bloqueo?: (sitioId: string) => Promise<string | null>,
  ): Promise<string[]> {
    const errores = await this.detenerHuerfanos();
    const mensajes = errores.map((e) => mensajeDe(e));
    for (const sitio of await this.d.leerSitios()) {
      for (const p of sitio.procesos) {
        if (!seguir()) return mensajes;
        if (!p.autoIniciar) continue;
        try {
          const estado = this.d.supervisor.estado(idSupervisor(sitio.id, p.id));
          if (estado === 'encendido' || estado === 'iniciando') continue;
          // Con su base caída el proceso se caería al instante: se informa y no se arranca.
          const motivo = (await bloqueo?.(sitio.id)) ?? null;
          if (motivo !== null) {
            mensajes.push(`${sitio.dominio}: ${nombreProceso(p)} ${motivo}`);
            continue;
          }
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
    if (!sitio) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${sitioId}`);
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
    const cwd = path.resolve(carpeta, conSeparadores(p.cwd));
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
    const entorno = await entornoProyecto(sitio, carpeta, this.d, {
      php: usaPhp(p.comando[0]!),
      carpetaVenv: cwd,
    });
    // Variables de la CA: si fallan, el proceso arranca igual con la confianza de siempre.
    const ca: Record<string, string> = this.d.confianza
      ? await this.d.confianza.envProyecto(sitio, { carpetaVenv: cwd }).catch(() => ({}))
      : {};
    const cambios: Record<string, string> = { ...entorno.cambios, ...ca };
    if (sitio.capturaDumps === true && this.d.depuracion) {
      // Primero wolfdump; el PYTHONPATH del usuario sigue después. Si falla, arranca sin él.
      const carpetaDumps = await this.d.depuracion.carpetaPython().catch(() => null);
      if (carpetaDumps) {
        const previo = cambios['PYTHONPATH'] ?? (this.d.entorno ?? process.env)['PYTHONPATH'];
        cambios['PYTHONPATH'] = [carpetaDumps, previo]
          .filter((x): x is string => !!x)
          .join(path.delimiter);
        cambios['WOLFCORE_SITIO'] = sitio.id;
      }
    }
    // Los servidores de Node (Express, Nest) ignoran HOST: una precarga propia fuerza 127.0.0.1.
    if (
      p.puerto !== null &&
      this.d.escuchaLocal &&
      ['node', 'npm', 'npx'].includes(nombrePrograma(p.comando[0]!))
    ) {
      try {
        const ruta = await this.d.escuchaLocal();
        const previo = cambios.NODE_OPTIONS ?? (this.d.entorno ?? process.env).NODE_OPTIONS;
        cambios.NODE_OPTIONS = nodeOptionsConEscuchaLocal(previo, ruta);
      } catch (e) {
        // Sin la precarga, la vigilancia de escuchas sigue protegiendo.
        console.error('No se pudo preparar la precarga de escucha local:', mensajeDe(e));
      }
    }
    const avisos = entorno.avisos.map((a) => sanear(a));
    this.avisos.set(id, avisos);
    const { cmd, args } = await resolverPrograma(p.comando, carpeta, this.d, entorno);
    // Una ruta relativa con carpetas (bin\server.exe) es relativa a la carpeta del proceso.
    const comando =
      /[\\/]/.test(cmd) && !path.isAbsolute(cmd) ? path.resolve(cwd, conSeparadores(cmd)) : cmd;
    await this.escribirLog(log, [...avisos.map((a) => `Aviso: ${a}`), `> ${p.comando.join(' ')}`]);
    return {
      id,
      nombre: `${nombreProceso(p)} (${sitio.dominio})`,
      comando,
      args,
      cwd,
      // PORT y HOST: Express, Nest y otros servidores toman de ahí el puerto asignado y escuchan
      // solo en 127.0.0.1.
      env: p.puerto === null ? cambios : { ...cambios, PORT: String(p.puerto), HOST: '127.0.0.1' },
      // Sin `puerto`: es informativo (proxy) y no sirve de sonda de salud; vite o un servidor
      // que escucha en otra interfaz o tarda en abrirlo no deben morir por eso.
      exigirInicio: true,
      ...(p.puerto === null ? {} : { puertoInformativo: p.puerto }),
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

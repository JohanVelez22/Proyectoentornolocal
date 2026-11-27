import {
  interpretarNetstatTodos,
  type FilaNetstat,
  type ProtocoloPuerto,
} from '../plataforma/netstat';
import { ErrorWolf } from '../errores';
export { interpretarTablaProcesos, type ProcesoTabla } from '../plataforma/procesosWin';
import { hijosPorPadre, ProcesosWindows, type ProcesoTabla } from '../plataforma/procesosWin';
import type { Ejecutor } from '../plataforma/tipos';
import { ejecutorPorDefecto, PlataformaWindows } from '../plataforma/win';

export {
  interpretarNetstatTodos,
  type FilaNetstat,
  type ProtocoloPuerto,
} from '../plataforma/netstat';

export interface PuertoEnUso {
  puerto: number;
  protocolo: ProtocoloPuerto;
  pid: number;
  nombre: string;
  /** Es de WolfCore Dev: la propia aplicación, un proceso del supervisor o de un proyecto, o un hijo suyo. */
  propio: boolean;
  /** Direcciones locales donde escucha (IPv4 e IPv6 se agrupan en una fila). */
  direcciones: string[];
  /**
   * Hora de creación (FILETIME UTC en texto, la misma que `inicioProceso`), o null si no se
   * pudo leer. Se devuelve a `finalizarProceso` para no matar un PID reutilizado.
   */
  creado: string | null;
}

export interface OpcionesFinalizar {
  /** Permite finalizar procesos propios de WolfCore Dev. NO salta la lista del sistema. */
  forzar?: boolean;
  /** Hora de creación que vio la lista (`PuertoEnUso.creado`); si no coincide, no se mata. */
  creado?: string | null;
}

export interface DepsPuertos {
  ejecutar?: Ejecutor;
  /** PIDs de los procesos del supervisor y de los proyectos (sus hijos también cuentan como propios). */
  pidsPropios?: () => Iterable<number>;
  /** PID del proceso principal (Electron main); por defecto `process.pid`. */
  pidApp?: number;
  /** PID del padre del proceso principal; por defecto `process.ppid`. */
  pidPadre?: number;
  env?: NodeJS.ProcessEnv;
  /** Hora de creación actual de un PID; por defecto la consulta de `PlataformaWindows`. */
  inicioProceso?: (pid: number) => Promise<string | null>;
}

/** Procesos del sistema que nunca se finalizan, ni con `forzar`. Comparación sin `.exe` y en minúsculas. */
const LISTA_NEGRA = new Set([
  'system',
  'system idle process',
  'secure system',
  'registry',
  'memory compression',
  'smss',
  'csrss',
  'wininit',
  'services',
  'lsass',
  'lsaiso',
  'winlogon',
  'svchost',
  'explorer',
  'dwm',
]);

/** Nombre comparable: sin espacios a los lados, en minúsculas y sin `.exe`. */
const normalizar = (n: string): string =>
  n
    .trim()
    .toLowerCase()
    .replace(/\.exe$/, '');

const PID_MINIMO = 5;

/** Puertos en uso y finalización controlada del proceso que ocupa uno. */
export class HerramientasPuertos {
  private readonly ejecutar: Ejecutor;
  private readonly inicioProceso: (pid: number) => Promise<string | null>;
  private readonly sistema: ProcesosWindows;

  constructor(private readonly d: DepsPuertos = {}) {
    this.ejecutar = d.ejecutar ?? ejecutorPorDefecto;
    this.sistema = new ProcesosWindows(this.ejecutar, d.env ?? process.env);
    const plataforma = new PlataformaWindows(this.ejecutar);
    this.inicioProceso = d.inicioProceso ?? ((pid) => plataforma.inicioProceso(pid));
  }

  private get pidApp(): number {
    return this.d.pidApp ?? process.pid;
  }

  private get pidPadre(): number {
    return this.d.pidPadre ?? process.ppid;
  }

  /** PID → padre, hora de creación y nombre en una sola consulta; null si no se pudo leer. */
  private tablaProcesos(): Promise<Map<number, ProcesoTabla> | null> {
    return this.sistema.tabla();
  }

  /**
   * PIDs propios: la app, los del supervisor y proyectos, y todos sus descendientes (según la
   * tabla, si la hay). Un padre ya muerto cuyo PID se reutilizó podría colar un proceso ajeno;
   * eso solo lo vuelve más difícil de finalizar, nunca más fácil.
   */
  private propios(tabla: Map<number, ProcesoTabla> | null): Set<number> {
    return this.conDescendientes([this.pidApp, ...(this.d.pidsPropios?.() ?? [])], tabla);
  }

  /** Los PIDs dados y todos sus descendientes según la tabla (solo ellos si no hay tabla). */
  private conDescendientes(raices: number[], tabla: Map<number, ProcesoTabla> | null): Set<number> {
    const res = new Set<number>(raices);
    if (!tabla) return res;
    const hijos = hijosPorPadre(tabla);
    const pendientes = [...res];
    while (pendientes.length > 0) {
      for (const h of hijos.get(pendientes.pop()!) ?? []) {
        if (!res.has(h)) {
          res.add(h);
          pendientes.push(h);
        }
      }
    }
    return res;
  }

  /**
   * Escuchas TCP de cada proceso `pids` y de todo su árbol (los hijos que lanzó: `npm` → `node`,
   * `mvn` → `java`), con **una sola** lectura de netstat y de la tabla de procesos para todos.
   * Sin la tabla no se pueden saber los hijos y solo cuenta cada PID.
   */
  async escuchasTcpDeArboles(pids: number[]): Promise<Map<number, FilaNetstat[]>> {
    const res = new Map<number, FilaNetstat[]>(pids.map((p) => [p, []]));
    if (pids.length === 0) return res;
    const filas = interpretarNetstatTodos(await this.sistema.netstat()).filter(
      (f) => f.protocolo === 'TCP',
    );
    const tabla = await this.tablaProcesos();
    for (const pid of pids) {
      const arbol = this.conDescendientes([pid], tabla);
      res.set(
        pid,
        filas.filter((f) => arbol.has(f.pid)),
      );
    }
    return res;
  }

  /** Escuchas TCP del proceso `pid` y de su árbol. */
  async escuchasTcpDelArbol(pid: number): Promise<FilaNetstat[]> {
    return (await this.escuchasTcpDeArboles([pid])).get(pid) ?? [];
  }

  async puertosEnUso(): Promise<PuertoEnUso[]> {
    const filas = interpretarNetstatTodos(await this.sistema.netstat());
    const tabla = await this.tablaProcesos();
    let nombres: Map<number, string>;
    if (tabla) {
      nombres = new Map([...tabla].map(([pid, p]) => [pid, p.nombre]));
    } else {
      nombres = await this.sistema.nombres();
    }
    const propios = this.propios(tabla);
    const agrupado = new Map<string, PuertoEnUso>();
    for (const f of filas) {
      const clave = `${f.protocolo}|${f.puerto}|${f.pid}`;
      const actual = agrupado.get(clave);
      if (actual) {
        if (!actual.direcciones.includes(f.direccion)) actual.direcciones.push(f.direccion);
        continue;
      }
      agrupado.set(clave, {
        puerto: f.puerto,
        protocolo: f.protocolo,
        pid: f.pid,
        nombre: nombres.get(f.pid) ?? (f.pid === 0 ? 'System Idle Process' : 'desconocido'),
        propio: propios.has(f.pid),
        direcciones: [f.direccion],
        creado: tabla?.get(f.pid)?.creado ?? null,
      });
    }
    return [...agrupado.values()].sort(
      (a, b) => a.puerto - b.puerto || a.protocolo.localeCompare(b.protocolo) || a.pid - b.pid,
    );
  }

  /** Nombre actual del proceso (tasklist), o null si no existe. */
  private nombreDe(pid: number): Promise<string | null> {
    return this.sistema.nombreDe(pid);
  }

  /**
   * Finaliza un proceso ajeno que ocupa un puerto. `confirmacion` debe ser su nombre (sin
   * distinguir mayúsculas, con o sin `.exe`). Nunca toca los PIDs bajos, la lista del sistema,
   * la propia aplicación ni su padre; los procesos propios (o si no se puede saber si lo son)
   * solo con `forzar`. Con `creado`, la hora de creación debe seguir siendo la de la lista.
   */
  async finalizarProceso(
    pid: number,
    confirmacion: string,
    o: OpcionesFinalizar = {},
  ): Promise<{ pid: number; nombre: string }> {
    if (!Number.isSafeInteger(pid) || pid < 0)
      throw new ErrorWolf('herramientas.pid_invalido', 'El PID no es válido.');
    if (pid < PID_MINIMO)
      throw new ErrorWolf(
        'herramientas.pid_sistema',
        `El PID ${pid} es del sistema y no se puede finalizar.`,
        { pid },
      );
    if (pid === this.pidApp || pid === this.pidPadre) {
      throw new ErrorWolf(
        'herramientas.proceso_propio',
        'No se puede finalizar WolfCore Dev ni el proceso que lo inició.',
      );
    }
    const nombre = await this.nombreDe(pid);
    if (nombre === null) {
      throw new ErrorWolf('herramientas.proceso_inexistente', `El proceso ${pid} ya no existe.`, {
        pid,
      });
    }
    if (LISTA_NEGRA.has(normalizar(nombre))) {
      throw new Error(`${nombre} es un proceso del sistema y no se puede finalizar.`);
    }
    if (typeof confirmacion !== 'string' || normalizar(confirmacion) !== normalizar(nombre)) {
      throw new Error(
        `La confirmación no coincide: escriba el nombre del proceso (${nombre}) para finalizarlo.`,
      );
    }
    if (!o.forzar) {
      const tabla = await this.tablaProcesos();
      // Sin la tabla no se ve si desciende de un proceso propio: no se arriesga.
      if (!tabla) {
        throw new Error(
          `No se pudo comprobar si ${nombre} (PID ${pid}) es un proceso de WolfCore Dev; use "forzar" para finalizarlo igualmente.`,
        );
      }
      if (this.propios(tabla).has(pid)) {
        throw new Error(
          `${nombre} (PID ${pid}) es un proceso de WolfCore Dev. Deténgalo desde su servicio o proyecto, o use "forzar".`,
        );
      }
    }
    // Justo antes de matar: el PID pudo quedar libre y reutilizarse por otro proceso.
    const ahora = await this.nombreDe(pid);
    if (ahora === null) {
      throw new ErrorWolf('herramientas.proceso_inexistente', `El proceso ${pid} ya no existe.`, {
        pid,
      });
    }
    if (normalizar(ahora) !== normalizar(nombre)) {
      throw new Error(`El PID ${pid} ahora pertenece a otro proceso (${ahora}); no se finalizó.`);
    }
    // Mismo nombre no basta: otro node.exe pudo heredar el PID desde que se listó.
    if (o.creado !== undefined && (await this.inicioProceso(pid)) !== o.creado) {
      throw new Error('El proceso cambió; actualice la lista.');
    }
    const r = await this.sistema.finalizar(pid);
    if (r.codigo !== 0) {
      const detalle = `${r.stderr}${r.stdout}`.trim();
      throw new Error(
        `No se pudo finalizar ${nombre} (PID ${pid})${detalle ? `: ${detalle}` : '.'}`,
      );
    }
    return { pid, nombre };
  }
}

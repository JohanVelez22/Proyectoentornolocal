import { ErrorWolf } from '../errores';
import type {
  MemoriaSistema,
  ObjetivoVaciado,
  PlataformaCompleta,
  ProcesoUsuario,
} from '../plataforma/tipos';
import { conReales, esFlyEnv, motivoProtegido, type ContextoProteccion } from './memoria';

/**
 * Liberar memoria en tres niveles (D54b). Reglas que no se negocian:
 *
 * - Nada destructivo y no se cierra ni se termina ningún proceso: lo único que se hace con un
 *   proceso es vaciar su conjunto de trabajo (`EmptyWorkingSet`), que Windows reabre solo cuando
 *   el programa lo vuelve a usar.
 * - Liviano: procesos de WolfCore Dev y de lo que supervisa (su árbol). Moderado: además los
 *   procesos del usuario que no son críticos. Profundo: además la lista de espera y la caché de
 *   archivos del sistema, que necesita permiso de administrador (UAC) y por eso exige
 *   `confirmado === true`: sin confirmar no se lanza nunca.
 * - Se elige por PID y propietario (usuario y sesión actuales), no por nombre; los nombres
 *   protegidos de `memoria.ts` son una barrera adicional. La plataforma vuelve a comprobar el dueño,
 *   la sesión, la hora de inicio y que no sea un servicio de cada PID justo antes de actuar.
 * - Las cifras son honestas: la estimación sale de los conjuntos de trabajo y la lista de espera
 *   de AHORA; lo liberado es la diferencia medida de memoria disponible antes y después. Lo que no
 *   se pueda medir es `null` (la interfaz dice «No disponible»), nunca una cifra inventada.
 * - No se detecta el modo de juego ni una aplicación a pantalla completa: no hay una forma barata
 *   y fiable de saberlo sin administrador, así que no se avisa de ello.
 */

export const NIVELES_MEMORIA = ['liviano', 'moderado', 'profundo'] as const;
export type NivelMemoria = (typeof NIVELES_MEMORIA)[number];

const MB = 1024 * 1024;
/** Un proceso del usuario con menos memoria de trabajo que esto no vale la pena. */
export const MINIMO_PROCESO_USUARIO_BYTES = 30 * MB;
/** Para lo propio, el mínimo es menor (los servicios pequeños también cuentan). */
export const MINIMO_PROCESO_PROPIO_BYTES = 5 * MB;

export interface EstimacionNivel {
  /** Bytes que aproximadamente liberaría; null si no se pudo calcular. */
  bytes: number | null;
  /** Procesos cuyo conjunto de trabajo se vaciaría. */
  procesos: number;
  /** Profundo: necesita permiso de administrador (UAC). */
  requiereAdmin: boolean;
}

export interface EstimacionMemoria {
  niveles: Record<NivelMemoria, EstimacionNivel>;
  /** Memoria del equipo al calcular; null si no se pudo leer. */
  sistema: MemoriaSistema | null;
  /** Tamaño de la lista de espera al calcular; null si no se pudo leer. */
  listaEspera: number | null;
}

export type EstadoPurga = 'no-aplica' | 'hecha' | 'cancelada' | 'tiempo' | 'error';

export interface ResultadoLiberacion {
  nivel: NivelMemoria;
  /** Memoria del equipo antes y después (null = no se pudo medir). */
  antes: MemoriaSistema | null;
  despues: MemoriaSistema | null;
  /** Aumento medido de la memoria disponible (nunca negativo); null si no se pudo medir. */
  liberado: number | null;
  /** Suma de lo que bajaron los conjuntos de trabajo vaciados (lo que dicen los procesos). */
  recortado: number;
  procesosVaciados: number;
  procesosSaltados: number;
  purga: EstadoPurga;
  /** Texto técnico si la purga falló (no se traduce: lo explica el motivo). */
  detallePurga: string | null;
}

export interface DepsLiberarMemoria {
  plataforma: Pick<
    PlataformaCompleta,
    | 'procesosDelUsuario'
    | 'identidadActual'
    | 'rutasProtegidas'
    | 'descendientes'
    | 'memoriaDelSistema'
    | 'vaciarWorkingSets'
    | 'purgarListaEspera'
  >;
  /** Carpetas de WolfCore Dev (datos y programa): todo lo que viva ahí es propio. */
  rutasPropias: () => string[];
  /** PID de la app principal. */
  pidApp: number;
  /** PIDs de todo lo que supervisa WolfCore Dev (servicios, instancias, procesos de proyecto). */
  pidsSupervisados: () => number[];
  /** Pausa antes de medir de nuevo; en las pruebas, una que no espera. */
  esperar?: (ms: number) => Promise<void>;
  /** Cuánto esperar a que Windows reparta las páginas antes de medir (por defecto, 1500 ms). */
  esperaMedirMs?: number;
}

/** Procesos elegidos para un nivel: lo propio y lo del usuario no crítico. */
interface Seleccion {
  propios: ProcesoUsuario[];
  usuario: ProcesoUsuario[];
}

const confirmar = (confirmado: unknown): void => {
  if (confirmado !== true) {
    throw new ErrorWolf('memoria.sin_confirmar', 'Confirme la liberación de memoria.');
  }
};

export class LiberadorMemoria {
  /** Una liberación a la vez. */
  private enCurso: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsLiberarMemoria) {}

  /**
   * Contexto de protección: usuario y sesión actuales, carpetas del sistema y propias, y el árbol
   * de procesos de WolfCore Dev (sin el árbol se protegería de menos: si falla, el error sube).
   */
  private async contexto(procesos: ProcesoUsuario[]): Promise<ContextoProteccion> {
    const yo = await this.d.plataforma.identidadActual();
    const raices = [this.d.pidApp, ...this.d.pidsSupervisados()];
    const propios = new Set<number>(raices);
    const desc = await this.d.plataforma.descendientes(raices);
    for (const r of raices) for (const h of desc.get(r) ?? []) propios.add(h);
    // FlyEnv y PhpWebStudy (y lo que lanzan) quedan protegidos por `motivoProtegido`.
    const fly = new Set<number>();
    const raicesFly = procesos.filter(esFlyEnv).map((p) => p.pid);
    const descFly = raicesFly.length > 0 ? await this.d.plataforma.descendientes(raicesFly) : null;
    for (const r of raicesFly) {
      fly.add(r);
      for (const h of descFly?.get(r) ?? []) fly.add(h);
    }
    return {
      usuario: yo.usuario,
      sesion: yo.sesion,
      rutasSistema: conReales(this.d.plataforma.rutasProtegidas()),
      rutasPropias: conReales(this.d.rutasPropias()),
      pidsPropios: propios,
      pidsFlyEnv: fly,
    };
  }

  /** Lee los procesos y separa lo propio de lo del usuario no crítico (por PID y propietario). */
  private async seleccionar(): Promise<Seleccion> {
    const procesos = await this.d.plataforma.procesosDelUsuario();
    const ctx = await this.contexto(procesos);
    const delUsuario = (p: ProcesoUsuario): boolean =>
      p.usuario === ctx.usuario &&
      p.sesion === ctx.sesion &&
      Number.isInteger(p.pid) &&
      p.pid > 4 &&
      p.inicio !== null &&
      p.servicio !== true &&
      p.elevado !== true;
    const propios = procesos.filter(
      (p) =>
        delUsuario(p) && ctx.pidsPropios.has(p.pid) && p.memoria >= MINIMO_PROCESO_PROPIO_BYTES,
    );
    const usuario = procesos.filter(
      (p) =>
        delUsuario(p) &&
        !ctx.pidsPropios.has(p.pid) &&
        p.memoria >= MINIMO_PROCESO_USUARIO_BYTES &&
        motivoProtegido(p, ctx) === null,
    );
    return { propios, usuario };
  }

  private async medir(): Promise<MemoriaSistema | null> {
    return this.d.plataforma.memoriaDelSistema().catch(() => null);
  }

  /**
   * Calcula cuánto liberaría cada nivel con los conjuntos de trabajo y la lista de espera de
   * ahora. Solo lee. Lo que no se puede calcular queda `null`.
   */
  async estimar(): Promise<EstimacionMemoria> {
    const [sistema, sel] = await Promise.all([this.medir(), this.seleccionar().catch(() => null)]);
    const suma = (l: ProcesoUsuario[]): number => l.reduce((t, p) => t + p.memoria, 0);
    const listaEspera = sistema?.listaEspera ?? null;
    const liviano = sel ? suma(sel.propios) : null;
    const moderado = sel && liviano !== null ? liviano + suma(sel.usuario) : null;
    return {
      sistema,
      listaEspera,
      niveles: {
        liviano: { bytes: liviano, procesos: sel?.propios.length ?? 0, requiereAdmin: false },
        moderado: {
          bytes: moderado,
          procesos: sel ? sel.propios.length + sel.usuario.length : 0,
          requiereAdmin: false,
        },
        profundo: {
          bytes: moderado !== null && listaEspera !== null ? moderado + listaEspera : null,
          procesos: sel ? sel.propios.length + sel.usuario.length : 0,
          requiereAdmin: true,
        },
      },
    };
  }

  /**
   * Libera la memoria del `nivel`. Profundo exige `confirmado === true`: sin él lanza
   * `memoria.sin_confirmar` ANTES de tocar nada (ni siquiera se pide el UAC). Mide la memoria antes
   * y después y devuelve lo medido.
   */
  async liberar(nivel: NivelMemoria, confirmado: unknown): Promise<ResultadoLiberacion> {
    if (!(NIVELES_MEMORIA as readonly string[]).includes(nivel)) {
      throw new ErrorWolf('memoria.modo_invalido', 'Nivel de liberación no válido.');
    }
    if (nivel === 'profundo') confirmar(confirmado);
    const r = this.enCurso.then(() => this.ejecutar(nivel));
    this.enCurso = r.catch(() => undefined);
    return r;
  }

  private async ejecutar(nivel: NivelMemoria): Promise<ResultadoLiberacion> {
    const antes = await this.medir();
    // La selección es de AHORA (no de la estimación que vio la persona): procesos nuevos o que
    // cambiaron de dueño no entran, y la plataforma lo vuelve a comprobar por PID al actuar.
    const sel = await this.seleccionar();
    const elegidos = nivel === 'liviano' ? sel.propios : [...sel.propios, ...sel.usuario];
    const objetivos: ObjetivoVaciado[] = elegidos.map((p) => ({ pid: p.pid, inicio: p.inicio! }));
    const vaciados =
      objetivos.length > 0 ? await this.d.plataforma.vaciarWorkingSets(objetivos) : [];
    let purga: EstadoPurga = 'no-aplica';
    let detallePurga: string | null = null;
    if (nivel === 'profundo') {
      // Tras vaciar los conjuntos de trabajo, para que sus páginas también salgan de la lista.
      const p = await this.d.plataforma.purgarListaEspera();
      if (p.ok) purga = 'hecha';
      else {
        purga = p.motivo === 'cancelado' ? 'cancelada' : p.motivo === 'tiempo' ? 'tiempo' : 'error';
        detallePurga = p.detalle ?? null;
      }
    }
    await (this.d.esperar ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms))))(
      this.d.esperaMedirMs ?? 1500,
    );
    const despues = await this.medir();
    const hechos = vaciados.filter((v) => v.estado === 'vaciado');
    return {
      nivel,
      antes,
      despues,
      liberado: antes && despues ? Math.max(0, despues.disponible - antes.disponible) : null,
      recortado: hechos.reduce((t, v) => t + Math.max(0, v.antes - v.despues), 0),
      procesosVaciados: hechos.length,
      procesosSaltados: objetivos.length - hechos.length,
      purga,
      detallePurga,
    };
  }
}

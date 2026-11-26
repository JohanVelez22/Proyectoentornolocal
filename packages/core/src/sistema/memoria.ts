import { ErrorWolf } from '../errores';
import type { PlataformaCompleta, ProcesoUsuario } from '../plataforma/tipos';

/**
 * Optimizador de RAM (D36). Reglas que no se negocian:
 *
 * - Nunca mata nada. No hay forma de terminar un proceso desde aquí: lo más fuerte es pedirle a
 *   un programa del usuario que cierre su ventana principal (`Plataforma.cerrarVentanaPrincipal`,
 *   como la X), por PID. Lo propio de WolfCore Dev se trata solo con sus acciones
 *   (`reducir-pool`, `detener-inactivo`), por los métodos de siempre de sus servicios.
 * - Nada ocurre solo: `planMemoria` solo lee y `aplicarMemoria` exige `confirmado === true`.
 * - Lo protegido nunca entra en un plan (ver `motivoProtegido`).
 * - Justo antes de tocar un programa se vuelve a leer: mismo pid, misma ruta, misma hora de
 *   inicio y sigue sin ser protegido. Si algo cambió, se salta y se informa.
 */

export const MODOS_MEMORIA = ['liviano', 'moderado', 'profundo'] as const;
export type ModoMemoria = (typeof MODOS_MEMORIA)[number];

export type TipoAccionMemoria =
  'cache-app' | 'reducir-pool' | 'detener-inactivo' | 'cerrar-programa';

export interface AccionMemoria {
  /** `<tipo>:<clave>`; es lo que vuelve a `aplicarMemoria`. */
  id: string;
  tipo: TipoAccionMemoria;
  /** Nombre a mostrar (programa, servicio o caché). La interfaz lo acompaña con su texto. */
  etiqueta: string;
  /** Bytes que se calcula liberar. */
  memoria: number;
  marcada: boolean;
}

export interface PlanMemoria {
  modo: ModoMemoria;
  acciones: AccionMemoria[];
  /** Suma de lo que liberarían las acciones marcadas. */
  estimado: number;
  /**
   * true si, para lo propio, aún no se ha observado actividad el tiempo necesario: entonces no se
   * propone detener nada por inactivo (la interfaz lo explica). No cuenta las demás acciones.
   */
  sinDatosActividad: boolean;
}

export type MotivoSalto =
  'no_en_plan' | 'protegido' | 'cambio' | 'sin_ventana' | 'ya_apagado' | 'ocupado';

export interface ResultadoAccionMemoria {
  id: string;
  tipo: TipoAccionMemoria;
  etiqueta: string;
  estado: 'hecho' | 'saltado' | 'error';
  motivo: MotivoSalto | null;
  liberado: number;
}

export interface ResultadoMemoria {
  liberado: number;
  resultados: ResultadoAccionMemoria[];
}

/** Caché que la app sabe vaciar sin perder nada (la de la sesión de Electron, la del núcleo). */
export interface CacheApp {
  id: string;
  etiqueta: string;
  /** Bytes aproximados que ocupa hoy. */
  estimar(): Promise<number>;
  /** La vacía; devuelve los bytes que calcula haber liberado. */
  vaciar(): Promise<number>;
}

/** Un pool de PHP propio con más de un trabajador encendido. */
export interface PoolReducible {
  version: string;
  /** Trabajadores encendidos (>= 2 para que haya algo que reducir). */
  trabajadores: number;
  /** RAM de los trabajadores que sobrarían. */
  memoria: number;
  /** ms sin actividad observada; null si aún no se le observa. */
  inactivoMs: number | null;
  /** ms que se lleva observando; null si no se le observa. */
  observadoMs: number | null;
}

/** Un servicio, instancia o proceso de proyecto de WolfCore Dev que está encendido. */
export interface ServicioPropio {
  /** Id de servicio (`mysql`, `mysql@8.0`) o de proceso de proyecto (`proy-<sitio>-<proceso>`). */
  id: string;
  nombre: string;
  memoria: number;
  inactivoMs: number | null;
  observadoMs: number | null;
}

export interface DepsMemoria {
  plataforma: Pick<
    PlataformaCompleta,
    | 'procesosDelUsuario'
    | 'cerrarVentanaPrincipal'
    | 'identidadActual'
    | 'rutasProtegidas'
    | 'descendientes'
  >;
  /** Carpetas de WolfCore Dev (datos y programa): todo lo que viva ahí es propio. */
  rutasPropias: () => string[];
  /** PID de la app principal. */
  pidApp: number;
  /** PIDs de todo lo que supervisa WolfCore Dev (servicios, instancias, procesos de proyecto). */
  pidsSupervisados: () => number[];
  caches: () => CacheApp[];
  pools: () => Promise<PoolReducible[]>;
  reducirPool: (version: string) => Promise<number>;
  servicios: () => Promise<ServicioPropio[]>;
  detenerServicio: (id: string) => Promise<void>;
  /** Minutos sin actividad para reducir un pool (por defecto, 10). */
  minutosPool?: number;
  /** Minutos sin actividad para proponer detener un servicio (por defecto, 15). */
  minutosServicio?: number;
  /** Mínimo de memoria (bytes) para listar un programa del usuario (por defecto, 100 MB). */
  minimoProgramaBytes?: number;
  /** Cuántos programas como máximo en el modo profundo (por defecto, 15). */
  maxProgramas?: number;
}

/** Nombres (sin extensión, en minúsculas) que nunca se proponen: sistema, shell y seguridad. */
export const NOMBRES_PROTEGIDOS: readonly string[] = [
  'explorer',
  'dwm',
  'csrss',
  'winlogon',
  'svchost',
  'system',
  'idle',
  'registry',
  'smss',
  'wininit',
  'services',
  'lsass',
  'lsaiso',
  'fontdrvhost',
  'sihost',
  'taskhostw',
  'ctfmon',
  'runtimebroker',
  'searchhost',
  'searchindexer',
  'startmenuexperiencehost',
  'shellexperiencehost',
  'textinputhost',
  'applicationframehost',
  'securityhealthsystray',
  'securityhealthservice',
  'msmpeng',
  'nissrv',
  'memcompression',
  'audiodg',
  'spoolsv',
  'conhost',
  'wolfcore dev',
  'wolfcore-dev',
  'wolfcoredev',
];

/** Fragmentos que, en cualquier parte de la ruta o del nombre, dejan el proceso protegido. */
const FRAGMENTOS_PROTEGIDOS: readonly string[] = ['flyenv', 'phpwebstudy', 'windows defender'];

const MB = 1024 * 1024;

/** Ruta en minúsculas y con `/`, sin barra final: para comparar rutas de cualquier sistema. */
function normalizar(ruta: string): string {
  return ruta.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function dentroDe(ruta: string, carpeta: string): boolean {
  const r = normalizar(ruta);
  const c = normalizar(carpeta);
  return c !== '' && (r === c || r.startsWith(`${c}/`));
}

function nombreBase(nombre: string): string {
  return nombre.toLowerCase().replace(/\.[a-z0-9]{1,4}$/, '');
}

/** Lo que hace falta saber para decidir si un proceso está protegido. */
export interface ContextoProteccion {
  usuario: string;
  sesion: number;
  rutasSistema: string[];
  rutasPropias: string[];
  /** PIDs de WolfCore Dev y de todos sus descendientes. */
  pidsPropios: ReadonlySet<number>;
}

/**
 * Motivo por el que un proceso está protegido, o null si se puede proponer. Ante cualquier duda
 * (ruta ilegible, otro usuario, otra sesión, servicio) se protege.
 */
export function motivoProtegido(p: ProcesoUsuario, c: ContextoProteccion): string | null {
  if (!Number.isInteger(p.pid) || p.pid <= 4) return 'sistema';
  if (c.pidsPropios.has(p.pid)) return 'wolfcore';
  if (p.usuario !== c.usuario) return 'otro-usuario';
  if (p.sesion !== c.sesion) return 'otra-sesion';
  if (p.servicio === true) return 'servicio';
  if (p.ruta === null || p.ruta === '') return 'sin-ruta';
  if (NOMBRES_PROTEGIDOS.includes(nombreBase(p.nombre))) return 'sistema';
  const rutaMin = p.ruta.toLowerCase();
  const nombreMin = p.nombre.toLowerCase();
  for (const f of FRAGMENTOS_PROTEGIDOS) {
    if (rutaMin.includes(f) || nombreMin.includes(f)) return 'protegido';
  }
  if (NOMBRES_PROTEGIDOS.includes(nombreBase(p.ruta.replace(/\\/g, '/').split('/').pop() ?? ''))) {
    return 'sistema';
  }
  for (const s of c.rutasSistema) if (dentroDe(p.ruta, s)) return 'sistema';
  for (const s of c.rutasPropias) if (dentroDe(p.ruta, s)) return 'wolfcore';
  return null;
}

const confirmar = (confirmado: unknown): void => {
  if (confirmado !== true) {
    throw new ErrorWolf('memoria.sin_confirmar', 'Confirme la liberación de memoria.');
  }
};

/** Lo que `aplicarMemoria` necesita de un programa del plan para reconocerlo después. */
interface InstantaneaPrograma {
  pid: number;
  ruta: string;
  inicio: string | null;
  nombre: string;
}

interface AccionInterna {
  publica: AccionMemoria;
  programa?: InstantaneaPrograma;
  cache?: CacheApp;
  version?: string;
  servicioId?: string;
}

export class OptimizadorMemoria {
  /** El último plan mostrado: solo sus acciones se pueden aplicar. */
  private ultimo = new Map<string, AccionInterna>();
  /** Una aplicación a la vez. */
  private enCurso: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsMemoria) {}

  private async contexto(): Promise<ContextoProteccion> {
    const yo = await this.d.plataforma.identidadActual();
    const raices = [this.d.pidApp, ...this.d.pidsSupervisados()];
    const propios = new Set<number>(raices);
    try {
      const desc = await this.d.plataforma.descendientes(raices);
      for (const l of desc.values()) for (const h of l) propios.add(h);
    } catch {
      // Sin el árbol, igualmente se protegen la app, lo supervisado y todo lo que viva en sus carpetas.
    }
    return {
      usuario: yo.usuario,
      sesion: yo.sesion,
      rutasSistema: this.d.plataforma.rutasProtegidas(),
      rutasPropias: this.d.rutasPropias(),
      pidsPropios: propios,
    };
  }

  /**
   * Construye la lista de lo que se podría hacer (solo lee). Liviano: cachés. Moderado: además
   * reducir pools de PHP y detener lo propio que lleva tiempo inactivo. Profundo: además programas
   * del usuario con ventana, desmarcados.
   */
  async planMemoria(modo: ModoMemoria): Promise<PlanMemoria> {
    if (!(MODOS_MEMORIA as readonly string[]).includes(modo)) {
      throw new ErrorWolf('memoria.modo_invalido', 'Modo de optimización no válido.');
    }
    const internas: AccionInterna[] = [];
    let sinDatos = false;

    for (const c of this.d.caches()) {
      const memoria = await c.estimar().catch(() => 0);
      internas.push({
        cache: c,
        publica: {
          id: `cache-app:${c.id}`,
          tipo: 'cache-app',
          etiqueta: c.etiqueta,
          memoria: Math.max(0, memoria),
          marcada: true,
        },
      });
    }

    if (modo !== 'liviano') {
      const minPool = (this.d.minutosPool ?? 10) * 60_000;
      const minServ = (this.d.minutosServicio ?? 15) * 60_000;
      for (const p of await this.d.pools()) {
        if (p.trabajadores < 2) continue;
        if (p.inactivoMs === null || (p.observadoMs ?? 0) < minPool) {
          sinDatos = true;
          continue;
        }
        if (p.inactivoMs < minPool) continue;
        internas.push({
          version: p.version,
          publica: {
            id: `reducir-pool:${p.version}`,
            tipo: 'reducir-pool',
            etiqueta: `PHP ${p.version}`,
            memoria: Math.max(0, p.memoria),
            marcada: true,
          },
        });
      }
      for (const s of await this.d.servicios()) {
        if (s.inactivoMs === null || (s.observadoMs ?? 0) < minServ) {
          sinDatos = true;
          continue;
        }
        if (s.inactivoMs < minServ) continue;
        internas.push({
          servicioId: s.id,
          publica: {
            id: `detener-inactivo:${s.id}`,
            tipo: 'detener-inactivo',
            etiqueta: s.nombre,
            memoria: Math.max(0, s.memoria),
            marcada: true,
          },
        });
      }
    }

    if (modo === 'profundo') {
      const ctx = await this.contexto();
      const minimo = this.d.minimoProgramaBytes ?? 100 * MB;
      const candidatos = (await this.d.plataforma.procesosDelUsuario())
        .filter((p) => p.ventana && p.memoria >= minimo && motivoProtegido(p, ctx) === null)
        .sort((a, b) => b.memoria - a.memoria)
        .slice(0, this.d.maxProgramas ?? 15);
      for (const p of candidatos) {
        internas.push({
          programa: { pid: p.pid, ruta: p.ruta!, inicio: p.inicio, nombre: p.nombre },
          publica: {
            id: `cerrar-programa:${p.pid}`,
            tipo: 'cerrar-programa',
            etiqueta: p.nombre,
            memoria: p.memoria,
            // Cerrar un programa del usuario nunca viene marcado.
            marcada: false,
          },
        });
      }
    }

    this.ultimo = new Map(internas.map((a) => [a.publica.id, a]));
    const acciones = internas.map((a) => ({ ...a.publica }));
    return {
      modo,
      acciones,
      estimado: acciones.filter((a) => a.marcada).reduce((t, a) => t + a.memoria, 0),
      sinDatosActividad: sinDatos,
    };
  }

  /**
   * Aplica las acciones elegidas del último plan. Sin `confirmado === true` no hace nada. Un id
   * que no está en el último plan se salta (la interfaz no puede pedir otra cosa).
   */
  async aplicarMemoria(ids: string[], confirmado: true): Promise<ResultadoMemoria> {
    confirmar(confirmado);
    const r = this.enCurso.then(() => this.aplicar(ids));
    this.enCurso = r.catch(() => undefined);
    return r;
  }

  private async aplicar(ids: string[]): Promise<ResultadoMemoria> {
    const resultados: ResultadoAccionMemoria[] = [];
    const vistos = new Set<string>();
    const plan = this.ultimo;
    for (const id of ids) {
      if (vistos.has(id)) continue;
      vistos.add(id);
      const a = plan.get(id);
      if (!a) {
        resultados.push({
          id,
          tipo: tipoDeId(id),
          etiqueta: '',
          estado: 'saltado',
          motivo: 'no_en_plan',
          liberado: 0,
        });
        continue;
      }
      resultados.push(await this.una(a));
    }
    // Lo aplicado ya no está en el plan: otra pasada necesita un plan nuevo con la lista a la vista.
    for (const id of vistos) this.ultimo.delete(id);
    return { liberado: resultados.reduce((t, r) => t + r.liberado, 0), resultados };
  }

  private async una(a: AccionInterna): Promise<ResultadoAccionMemoria> {
    const { id, tipo, etiqueta } = a.publica;
    const base = { id, tipo, etiqueta };
    const hecho = (liberado: number): ResultadoAccionMemoria => ({
      ...base,
      estado: 'hecho',
      motivo: null,
      liberado,
    });
    const salto = (motivo: MotivoSalto): ResultadoAccionMemoria => ({
      ...base,
      estado: 'saltado',
      motivo,
      liberado: 0,
    });
    try {
      switch (tipo) {
        case 'cache-app':
          return hecho(Math.max(0, await a.cache!.vaciar()));
        case 'reducir-pool': {
          const n = await this.d.reducirPool(a.version!);
          return n > 0 ? hecho(a.publica.memoria) : salto('ya_apagado');
        }
        case 'detener-inactivo': {
          // Se vuelve a mirar: si ya no está encendido o ya no está inactivo, no se toca.
          const ahora = (await this.d.servicios()).find((s) => s.id === a.servicioId);
          const minServ = (this.d.minutosServicio ?? 15) * 60_000;
          if (!ahora) return salto('ya_apagado');
          if (ahora.inactivoMs === null || ahora.inactivoMs < minServ) return salto('cambio');
          await this.d.detenerServicio(a.servicioId!);
          return hecho(a.publica.memoria);
        }
        case 'cerrar-programa':
          return await this.cerrarPrograma(a, base);
      }
    } catch {
      return { ...base, estado: 'error', motivo: null, liberado: 0 };
    }
  }

  private async cerrarPrograma(
    a: AccionInterna,
    base: { id: string; tipo: TipoAccionMemoria; etiqueta: string },
  ): Promise<ResultadoAccionMemoria> {
    const snap = a.programa!;
    const salto = (motivo: MotivoSalto): ResultadoAccionMemoria => ({
      ...base,
      estado: 'saltado',
      motivo,
      liberado: 0,
    });
    const ctx = await this.contexto();
    const ahora = (await this.d.plataforma.procesosDelUsuario()).find((p) => p.pid === snap.pid);
    if (!ahora) return salto('cambio');
    // Mismo pid, misma ruta y misma hora de inicio; sin hora legible no se puede asegurar.
    if (
      ahora.ruta === null ||
      normalizar(ahora.ruta) !== normalizar(snap.ruta) ||
      snap.inicio === null ||
      ahora.inicio !== snap.inicio
    ) {
      return salto('cambio');
    }
    if (motivoProtegido(ahora, ctx) !== null) return salto('protegido');
    if (!ahora.ventana) return salto('sin_ventana');
    const pedido = await this.d.plataforma.cerrarVentanaPrincipal(snap.pid);
    return pedido
      ? { ...base, estado: 'hecho', motivo: null, liberado: a.publica.memoria }
      : salto('sin_ventana');
  }
}

function tipoDeId(id: string): TipoAccionMemoria {
  const t = id.split(':')[0];
  return t === 'cache-app' || t === 'reducir-pool' || t === 'detener-inactivo'
    ? t
    : 'cerrar-programa';
}

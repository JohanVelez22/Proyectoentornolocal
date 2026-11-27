import { randomUUID } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { nombreDeRuta } from '../rutas/nombreDeRuta';
import { ErrorWolf } from '../errores';
import type { ConexionActiva, PlataformaCompleta, ProcesoUsuario } from '../plataforma/tipos';

/**
 * Optimizador de RAM (D36). Reglas que no se negocian:
 *
 * - Nunca mata nada. No hay forma de terminar un proceso desde aquí: lo más fuerte es pedirle a
 *   un programa del usuario que cierre su ventana principal (`Plataforma.cerrarVentanaPrincipal`,
 *   como la X), por PID. Lo propio de WolfCore Dev se trata solo con sus acciones
 *   (`reducir-pool`, `detener-inactivo`), por los métodos de siempre de sus servicios.
 * - Nada ocurre solo: `planMemoria` solo lee y `aplicarMemoria` exige `confirmado === true`.
 * - Lo protegido nunca entra en un plan (ver `motivoProtegido`).
 * - Justo antes de tocar un programa se comprueba, DENTRO de la misma operación de la plataforma
 *   que pide el cierre (sin ir y volver a Node), que sigue siendo el mismo: pid, dueño, sesión,
 *   hora de inicio y ruta. Si algo cambió, se salta y se informa.
 * - Lo que lo propio tiene en uso (conexiones establecidas a su puerto) no se detiene.
 * - Se informa con honestidad: pedir cerrar un programa no es haberlo cerrado. Solo cuenta lo
 *   liberado cuando, tras unos segundos, el programa ya no está.
 */

export const MODOS_MEMORIA = ['liviano', 'moderado', 'profundo'] as const;
export type ModoMemoria = (typeof MODOS_MEMORIA)[number];

export type TipoAccionMemoria =
  'cache-app' | 'reducir-pool' | 'detener-inactivo' | 'cerrar-programa';

/** Un plan aplicable como mucho esto (el IPC valida el mismo tope en la frontera). */
export const MAX_ACCIONES_MEMORIA = 60;
/** Largo máximo de un id de acción (también lo valida el IPC). */
export const MAX_LARGO_ID_MEMORIA = 100;
/** Un plan caduca a los 5 minutos: lo que vio el usuario deja de ser fiable. */
export const VIGENCIA_PLAN_MEMORIA_MS = 5 * 60_000;

export interface AccionMemoria {
  /** `<tipo>:<clave>`; es lo que vuelve a `aplicarMemoria`. */
  id: string;
  tipo: TipoAccionMemoria;
  /** Nombre a mostrar (programa, servicio o caché). La interfaz lo acompaña con su texto. */
  etiqueta: string;
  /** Bytes que se calcula liberar (de RAM o de disco, según `unidad`). */
  memoria: number;
  /** `disco`: lo que se libera es espacio de disco, no RAM (p. ej., la caché HTTP de Electron). */
  unidad: 'ram' | 'disco';
  marcada: boolean;
}

export interface PlanMemoria {
  /** Identificador de este plan: `aplicarMemoria` lo exige y vale solo 5 minutos. */
  id: string;
  modo: ModoMemoria;
  acciones: AccionMemoria[];
  /** Suma de la RAM que liberarían las acciones marcadas (lo de `disco` no cuenta aquí). */
  estimado: number;
  /** Suma del disco que liberarían las acciones marcadas. */
  estimadoDisco: number;
  /**
   * true si, para lo propio, aún no se ha observado actividad el tiempo necesario (o no se pudo
   * comprobar si algo está en uso): entonces no se propone detener nada por inactivo (la interfaz
   * lo explica). No cuenta las demás acciones.
   */
  sinDatosActividad: boolean;
  /** true si en modo profundo no se pudo leer la lista de programas: la lista no es completa. */
  listadoFallido: boolean;
}

export type MotivoSalto =
  'no_en_plan' | 'protegido' | 'cambio' | 'sin_ventana' | 'ya_apagado' | 'ocupado' | 'no_se_pudo';

export interface ResultadoAccionMemoria {
  id: string;
  tipo: TipoAccionMemoria | 'desconocido';
  etiqueta: string;
  /**
   * `pedido`: se pidió cerrar la ventana de un programa y, a los pocos segundos, sigue abierto
   * (esperando al usuario, que puede estar viendo "¿guardar cambios?"). No suma lo liberado.
   */
  estado: 'hecho' | 'pedido' | 'saltado' | 'error';
  motivo: MotivoSalto | null;
  /** RAM liberada (bytes). */
  liberado: number;
  /** Disco liberado (bytes). */
  liberadoDisco: number;
}

export interface ResultadoMemoria {
  liberado: number;
  liberadoDisco: number;
  resultados: ResultadoAccionMemoria[];
}

/** Caché que la app sabe vaciar sin perder nada (la de la sesión de Electron, la del núcleo). */
export interface CacheApp {
  id: string;
  etiqueta: string;
  /** Qué libera: RAM (por defecto) o espacio de disco (la caché HTTP no es memoria). */
  unidad?: 'ram' | 'disco';
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
  /** Puertos en los que escucha (para saber si alguien está conectado). */
  puertos: number[];
  /** PID, si se conoce (sin puertos conocidos, es lo que se usa para buscar sus conexiones). */
  pid: number | null;
}

export interface DepsMemoria {
  plataforma: Pick<
    PlataformaCompleta,
    | 'procesosDelUsuario'
    | 'cerrarVentanaPrincipal'
    | 'inicioDeProceso'
    | 'identidadActual'
    | 'rutasProtegidas'
    | 'descendientes'
    | 'conexionesActivas'
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
  /** Espera (ms) antes de volver a mirar si un programa al que se pidió cerrar cerró (3000). */
  esperaCierreMs?: number;
  /** Pausa; en las pruebas, una que no espera. */
  esperar?: (ms: number) => Promise<void>;
  /** Reloj (ms); en las pruebas, uno controlado. */
  ahora?: () => number;
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

/** Ruta en minúsculas y con `/`, sin prefijos de ruta larga ni barra final: para comparar rutas. */
function normalizar(ruta: string): string {
  return ruta
    .replace(/^\\\\\?\\UNC\\/i, '\\\\')
    .replace(/^\\\\\?\\/, '')
    .replace(/^\\\?\?\\/, '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function dentroDe(ruta: string, carpeta: string): boolean {
  const r = normalizar(ruta);
  const c = normalizar(carpeta);
  return c !== '' && (r === c || r.startsWith(`${c}/`));
}

/** Cada carpeta y, si existe, su ruta real (enlaces y uniones resueltos): se protegen ambas. */
function conReales(rutas: string[]): string[] {
  const res = new Set<string>();
  for (const r of rutas) {
    if (r === '') continue;
    res.add(r);
    try {
      res.add(realpathSync.native(r));
    } catch {
      // No existe (o no se puede resolver): queda la ruta tal cual.
    }
  }
  return [...res];
}

function nombreBase(nombre: string): string {
  return nombre.toLowerCase().replace(/\.[a-z0-9]{1,4}$/, '');
}

/** FlyEnv y PhpWebStudy: por su nombre o su ruta. Son raíces cuyo árbol también se protege. */
function esFlyEnv(p: ProcesoUsuario): boolean {
  const ruta = (p.ruta ?? '').toLowerCase();
  const nombre = p.nombre.toLowerCase();
  return ['flyenv', 'phpwebstudy'].some((f) => ruta.includes(f) || nombre.includes(f));
}

/** Lo que hace falta saber para decidir si un proceso está protegido. */
export interface ContextoProteccion {
  usuario: string;
  sesion: number;
  rutasSistema: string[];
  rutasPropias: string[];
  /** PIDs de WolfCore Dev y de todos sus descendientes. */
  pidsPropios: ReadonlySet<number>;
  /** PIDs de FlyEnv / PhpWebStudy y de todos sus descendientes. */
  pidsFlyEnv?: ReadonlySet<number>;
}

/**
 * Motivo por el que un proceso está protegido, o null si se puede proponer. Ante cualquier duda
 * (ruta ilegible, otro usuario, otra sesión, servicio, elevado) se protege.
 */
export function motivoProtegido(p: ProcesoUsuario, c: ContextoProteccion): string | null {
  if (!Number.isInteger(p.pid) || p.pid <= 4) return 'sistema';
  if (c.pidsPropios.has(p.pid)) return 'wolfcore';
  if (c.pidsFlyEnv?.has(p.pid)) return 'protegido';
  if (p.usuario !== c.usuario) return 'otro-usuario';
  if (p.sesion !== c.sesion) return 'otra-sesion';
  if (p.servicio === true) return 'servicio';
  if (p.elevado === true) return 'elevado';
  if (p.ruta === null || p.ruta === '') return 'sin-ruta';
  if (NOMBRES_PROTEGIDOS.includes(nombreBase(p.nombre))) return 'sistema';
  const rutaMin = p.ruta.toLowerCase();
  const nombreMin = p.nombre.toLowerCase();
  for (const f of FRAGMENTOS_PROTEGIDOS) {
    if (rutaMin.includes(f) || nombreMin.includes(f)) return 'protegido';
  }
  if (NOMBRES_PROTEGIDOS.includes(nombreBase(nombreDeRuta(p.ruta)))) {
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

const planCaducado = (): ErrorWolf =>
  new ErrorWolf('memoria.plan_caducado', 'La lista caducó o ya no es la actual: vuelva a pedirla.');

/** ¿Hay conexiones en curso con el servicio? null si no se puede saber (sin puertos ni PID). */
function enUso(s: ServicioPropio, conexiones: ConexionActiva[]): boolean | null {
  if (s.puertos.length === 0) {
    return s.pid === null ? null : conexiones.some((c) => c.pid === s.pid);
  }
  return conexiones.some(
    (c) =>
      s.puertos.includes(c.puertoLocal) ||
      s.puertos.includes(c.puertoRemoto) ||
      (s.pid !== null && c.pid === s.pid),
  );
}

interface AccionInterna {
  publica: AccionMemoria;
  /** El programa tal como se listó: es lo que se comprueba y se compara al aplicar. */
  programa?: ProcesoUsuario;
  cache?: CacheApp;
  version?: string;
  servicioId?: string;
}

/** Un plan mostrado: solo sus acciones se pueden aplicar, y solo mientras no caduque. */
interface PlanInterno {
  id: string;
  creado: number;
  acciones: Map<string, AccionInterna>;
}

const PRIORIDAD: Record<TipoAccionMemoria, number> = {
  'reducir-pool': 0,
  'detener-inactivo': 1,
  'cerrar-programa': 2,
  // Las cachés van al final: vaciarlas no debe alterar lo que se mira para decidir lo demás.
  'cache-app': 3,
};

export class OptimizadorMemoria {
  /** El último plan mostrado. */
  private ultimo: PlanInterno | null = null;
  /** Una aplicación a la vez. */
  private enCurso: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsMemoria) {}

  private ahora(): number {
    return (this.d.ahora ?? Date.now)();
  }

  /**
   * Lo que hace falta para proteger: usuario, sesión, carpetas (con su ruta real) y árboles de
   * procesos (WolfCore Dev, lo que supervisa y FlyEnv/PhpWebStudy con sus descendientes).
   */
  private async contexto(procesos: ProcesoUsuario[]): Promise<ContextoProteccion> {
    const yo = await this.d.plataforma.identidadActual();
    const raicesPropias = [this.d.pidApp, ...this.d.pidsSupervisados()];
    const raicesFly = procesos.filter(esFlyEnv).map((p) => p.pid);
    const propios = new Set<number>(raicesPropias);
    const fly = new Set<number>(raicesFly);
    // Sin el árbol se protegería de menos: si falla, el error sube (en el plan, `listadoFallido`;
    // al aplicar, el programa se salta como protegido).
    const desc = await this.d.plataforma.descendientes([...raicesPropias, ...raicesFly]);
    for (const r of raicesPropias) for (const h of desc.get(r) ?? []) propios.add(h);
    for (const r of raicesFly) for (const h of desc.get(r) ?? []) fly.add(h);
    return {
      usuario: yo.usuario,
      sesion: yo.sesion,
      rutasSistema: conReales(this.d.plataforma.rutasProtegidas()),
      rutasPropias: conReales(this.d.rutasPropias()),
      pidsPropios: propios,
      pidsFlyEnv: fly,
    };
  }

  /**
   * Construye la lista de lo que se podría hacer (solo lee). Liviano: cachés. Moderado: además
   * reducir pools de PHP y detener lo propio que lleva tiempo inactivo y sin conexiones (esto
   * sale desmarcado). Profundo: además programas del usuario con ventana, desmarcados.
   */
  async planMemoria(modo: ModoMemoria): Promise<PlanMemoria> {
    if (!(MODOS_MEMORIA as readonly string[]).includes(modo)) {
      throw new ErrorWolf('memoria.modo_invalido', 'Modo de optimización no válido.');
    }
    const internas: AccionInterna[] = [];
    let sinDatos = false;
    let listadoFallido = false;

    for (const c of this.d.caches()) {
      const memoria = await c.estimar().catch(() => 0);
      internas.push({
        cache: c,
        publica: {
          id: `cache-app:${c.id}`,
          tipo: 'cache-app',
          etiqueta: c.etiqueta,
          memoria: Math.max(0, memoria),
          unidad: c.unidad ?? 'ram',
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
            unidad: 'ram',
            marcada: true,
          },
        });
      }
      const candidatos = (await this.d.servicios()).filter((s) => {
        if (s.inactivoMs === null || (s.observadoMs ?? 0) < minServ) {
          sinDatos = true;
          return false;
        }
        return s.inactivoMs >= minServ;
      });
      if (candidatos.length > 0) {
        // Antes de proponer detener algo: ¿alguien está conectado? Sin poder saberlo, no se propone.
        const conexiones = await this.d.plataforma.conexionesActivas().catch(() => null);
        for (const s of candidatos) {
          const uso = conexiones === null ? null : enUso(s, conexiones);
          if (uso === null) {
            sinDatos = true;
            continue;
          }
          if (uso) continue;
          internas.push({
            servicioId: s.id,
            publica: {
              id: `detener-inactivo:${s.id}`,
              tipo: 'detener-inactivo',
              etiqueta: s.nombre,
              memoria: Math.max(0, s.memoria),
              unidad: 'ram',
              // Detener un servicio puede cortar algo que el usuario no sabe que corre: opt-in.
              marcada: false,
            },
          });
        }
      }
    }

    if (modo === 'profundo') {
      const minimo = this.d.minimoProgramaBytes ?? 100 * MB;
      try {
        const procesos = await this.d.plataforma.procesosDelUsuario();
        const ctx = await this.contexto(procesos);
        const candidatos = procesos
          .filter(
            (p) =>
              p.ventana &&
              p.memoria >= minimo &&
              p.ruta !== null &&
              p.inicio !== null &&
              motivoProtegido(p, ctx) === null,
          )
          .sort((a, b) => b.memoria - a.memoria)
          .slice(0, this.d.maxProgramas ?? 15);
        for (const p of candidatos) {
          internas.push({
            programa: p,
            publica: {
              id: `cerrar-programa:${p.pid}`,
              tipo: 'cerrar-programa',
              etiqueta: p.nombre,
              memoria: p.memoria,
              unidad: 'ram',
              // Cerrar un programa del usuario nunca viene marcado.
              marcada: false,
            },
          });
        }
      } catch {
        listadoFallido = true;
      }
    }

    // Lo que valida el IPC al aplicar: como mucho 60 ids de, como mucho, 100 caracteres.
    const validas = internas
      .filter((a) => a.publica.id.length <= MAX_LARGO_ID_MEMORIA)
      .slice(0, MAX_ACCIONES_MEMORIA);
    const plan: PlanInterno = {
      id: randomUUID(),
      creado: this.ahora(),
      acciones: new Map(validas.map((a) => [a.publica.id, a])),
    };
    this.ultimo = plan;
    const acciones = validas.map((a) => ({ ...a.publica }));
    const suma = (u: 'ram' | 'disco'): number =>
      acciones.filter((a) => a.marcada && a.unidad === u).reduce((t, a) => t + a.memoria, 0);
    return {
      id: plan.id,
      modo,
      acciones,
      estimado: suma('ram'),
      estimadoDisco: suma('disco'),
      sinDatosActividad: sinDatos,
      listadoFallido,
    };
  }

  /**
   * Aplica las acciones elegidas del plan `planId`. Sin `confirmado === true` no hace nada; con un
   * plan que no es el último o que lleva más de 5 minutos, falla con `memoria.plan_caducado`. Un
   * id que no está en el plan se salta (la interfaz no puede pedir otra cosa).
   */
  async aplicarMemoria(planId: string, ids: string[], confirmado: true): Promise<ResultadoMemoria> {
    confirmar(confirmado);
    const plan = this.ultimo;
    if (!plan || plan.id !== planId || this.caducado(plan)) throw planCaducado();
    const r = this.enCurso.then(() => {
      // Al llegar su turno, otro plan pudo haber reemplazado a este.
      if (this.ultimo !== plan) throw planCaducado();
      return this.aplicar(plan, ids);
    });
    this.enCurso = r.catch(() => undefined);
    return r;
  }

  private caducado(plan: PlanInterno): boolean {
    return this.ahora() - plan.creado > VIGENCIA_PLAN_MEMORIA_MS;
  }

  private async aplicar(plan: PlanInterno, ids: string[]): Promise<ResultadoMemoria> {
    // Puede haber esperado turno detrás de otra aplicación: se vuelve a mirar.
    if (this.caducado(plan)) throw planCaducado();
    const unicos = [...new Set(ids)];
    const resultados: ResultadoAccionMemoria[] = new Array<ResultadoAccionMemoria>(unicos.length);
    const lectura = new LecturaUnica(this.d, (procesos) => this.contexto(procesos));
    // Pools, servicios y programas primero; las cachés, al final.
    const prioridad = (a: AccionInterna | undefined): number =>
      a ? PRIORIDAD[a.publica.tipo] : -1;
    const orden = unicos
      .map((id, i) => ({ id, i, a: plan.acciones.get(id) }))
      .sort((x, y) => prioridad(x.a) - prioridad(y.a));
    for (const { id, i, a } of orden) {
      resultados[i] = a
        ? await this.una(a, lectura)
        : {
            id,
            tipo: tipoDeId(id),
            etiqueta: '',
            estado: 'saltado',
            motivo: 'no_en_plan',
            liberado: 0,
            liberadoDisco: 0,
          };
    }
    await this.confirmarCierres(plan, resultados);
    // Lo aplicado ya no está en el plan: otra pasada necesita un plan nuevo con la lista a la vista.
    for (const id of unicos) plan.acciones.delete(id);
    return {
      liberado: resultados.reduce((t, r) => t + r.liberado, 0),
      liberadoDisco: resultados.reduce((t, r) => t + r.liberadoDisco, 0),
      resultados,
    };
  }

  private async una(a: AccionInterna, lectura: LecturaUnica): Promise<ResultadoAccionMemoria> {
    const { id, tipo, etiqueta, unidad } = a.publica;
    const base = { id, tipo, etiqueta };
    const hecho = (bytes: number): ResultadoAccionMemoria => ({
      ...base,
      estado: 'hecho',
      motivo: null,
      liberado: unidad === 'ram' ? bytes : 0,
      liberadoDisco: unidad === 'disco' ? bytes : 0,
    });
    const salto = (motivo: MotivoSalto): ResultadoAccionMemoria => ({
      ...base,
      estado: 'saltado',
      motivo,
      liberado: 0,
      liberadoDisco: 0,
    });
    try {
      switch (tipo) {
        case 'cache-app':
          return hecho(Math.max(0, await a.cache!.vaciar()));
        case 'reducir-pool': {
          // Se vuelve a mirar: si ya no hay varios trabajadores o hubo actividad, no se toca.
          const minPool = (this.d.minutosPool ?? 10) * 60_000;
          const ahora = (await lectura.pools()).find((p) => p.version === a.version);
          if (!ahora || ahora.trabajadores < 2) return salto('ya_apagado');
          if (ahora.inactivoMs === null || ahora.inactivoMs < minPool) return salto('cambio');
          const n = await this.d.reducirPool(a.version!);
          return n > 0 ? hecho(a.publica.memoria) : salto('ya_apagado');
        }
        case 'detener-inactivo': {
          // Se vuelve a mirar (lo observado de ese proceso, no un búfer): sigue encendido, sigue
          // inactivo y nadie está conectado.
          const ahora = (await lectura.servicios()).find((s) => s.id === a.servicioId);
          const minServ = (this.d.minutosServicio ?? 15) * 60_000;
          if (!ahora) return salto('ya_apagado');
          if (ahora.inactivoMs === null || ahora.inactivoMs < minServ) return salto('cambio');
          const conexiones = await lectura.conexiones();
          if (conexiones === null || enUso(ahora, conexiones) !== false) return salto('ocupado');
          await this.d.detenerServicio(a.servicioId!);
          return hecho(a.publica.memoria);
        }
        case 'cerrar-programa': {
          const p = a.programa!;
          if (p.inicio === null || p.ruta === null) return salto('cambio');
          // Sin poder leer el contexto (p. ej. el árbol de procesos) no se sabe qué protege: se salta.
          const ctx = await lectura.contexto().catch(() => null);
          if (ctx === null || motivoProtegido(p, ctx) !== null) return salto('protegido');
          // Todo lo demás (mismo pid, dueño, sesión, inicio, ruta, ventana) lo comprueba la
          // plataforma dentro de la misma operación que pide el cierre.
          const e = await this.d.plataforma.cerrarVentanaPrincipal(p.pid, p.inicio, p.ruta);
          if (e === 'cerrado-pedido') {
            return { ...base, estado: 'pedido', motivo: null, liberado: 0, liberadoDisco: 0 };
          }
          if (e === 'cambio') return salto('cambio');
          return salto(e === 'sin-ventana' ? 'sin_ventana' : 'no_se_pudo');
        }
      }
    } catch {
      return { ...base, estado: 'error', motivo: null, liberado: 0, liberadoDisco: 0 };
    }
  }

  /**
   * Pedir cerrar no es cerrar. Tras unos segundos se vuelve a leer la lista (una sola vez para
   * todos): el que ya no está se cuenta como hecho, con su memoria; el que sigue vivo queda como
   * `pedido` (esperando al usuario) y no suma nada.
   */
  private async confirmarCierres(
    plan: PlanInterno,
    resultados: ResultadoAccionMemoria[],
  ): Promise<void> {
    const pedidos = resultados.filter((r) => r.estado === 'pedido');
    if (pedidos.length === 0) return;
    await (this.d.esperar ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms))))(
      this.d.esperaCierreMs ?? 3000,
    );
    let lista: ProcesoUsuario[] | null = null;
    try {
      lista = await this.d.plataforma.procesosDelUsuario();
    } catch {
      lista = null;
    }
    // Sin poder leer (o con una lista vacía, que no es creíble) no se afirma que se cerró.
    if (lista === null || lista.length === 0) return;
    for (const r of pedidos) {
      const a = plan.acciones.get(r.id);
      const p = a?.programa;
      if (!a || !p) continue;
      if (lista.some((x) => x.pid === p.pid && x.inicio === p.inicio)) continue;
      // Que no salga en la lista no prueba que cerró (la lectura puede ser parcial): se confirma
      // con una consulta puntual. Existe con la misma hora: sigue vivo. No existe: cerró. Otra
      // hora: el PID lo heredó otro programa, el nuestro cerró. Si la consulta falla, nada se afirma.
      try {
        const inicio = await this.d.plataforma.inicioDeProceso(p.pid);
        if (inicio !== null && inicio === p.inicio) continue;
      } catch {
        continue;
      }
      r.estado = 'hecho';
      r.liberado = a.publica.memoria;
    }
  }
}

/**
 * Lo que una aplicación necesita leer del equipo se lee UNA vez (el contexto de protección, los
 * pools, los servicios, las conexiones), por muchas acciones que haya.
 */
class LecturaUnica {
  private c: Promise<ContextoProteccion> | null = null;
  private p: Promise<PoolReducible[]> | null = null;
  private s: Promise<ServicioPropio[]> | null = null;
  private k: Promise<ConexionActiva[] | null> | null = null;

  constructor(
    private readonly d: DepsMemoria,
    private readonly armarContexto: (procesos: ProcesoUsuario[]) => Promise<ContextoProteccion>,
  ) {}

  contexto(): Promise<ContextoProteccion> {
    this.c ??= this.d.plataforma.procesosDelUsuario().then((l) => this.armarContexto(l));
    return this.c;
  }
  pools(): Promise<PoolReducible[]> {
    this.p ??= this.d.pools();
    return this.p;
  }
  servicios(): Promise<ServicioPropio[]> {
    this.s ??= this.d.servicios();
    return this.s;
  }
  conexiones(): Promise<ConexionActiva[] | null> {
    this.k ??= this.d.plataforma.conexionesActivas().catch(() => null);
    return this.k;
  }
}

function tipoDeId(id: string): TipoAccionMemoria | 'desconocido' {
  const t = id.split(':')[0];
  return t === 'cache-app' ||
    t === 'reducir-pool' ||
    t === 'detener-inactivo' ||
    t === 'cerrar-programa'
    ? t
    : 'desconocido';
}

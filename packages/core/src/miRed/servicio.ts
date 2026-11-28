import { lookupService } from 'node:dns/promises';
import { ErrorWolf } from '../errores';
import type { PerfilRed } from '../plataforma/firewallWin';
import type { AdaptadorRed, CarpetaCompartida, RecursoRed, VecinoRed } from '../plataforma/redWin';
import type { PlataformaCompleta } from '../plataforma/tipos';
import { escanearRango, PLAZO_PING_ESCANEO_MS } from './escaneo';
import { fabricantePorMac } from './fabricante';
import { esPrivadaRfc1918, rangoDeEscaneo } from './rfc1918';
import { nombreDeRecursoValido, rutaUncRecurso, validarIpPrivada } from './validacion';
import {
  medirVelocidad,
  PLAN_VELOCIDAD,
  type FaseVelocidad,
  type OpcionesVelocidad,
  type ResultadoVelocidad,
} from './velocidad';

/**
 * «Mi red» (D53): lo que esta herramienta hace por la persona, sin control remoto. Todo lo que
 * toca a otros equipos o al sistema pasa por aquí con las mismas reglas:
 *  - solo IPv4 privadas (RFC 1918), y el escaneo solo de la red del adaptador ACTIVO, con un
 *    máximo de /24, solo bajo petición confirmada y nunca en una red pública de Windows;
 *  - solo se actúa sobre equipos que salieron de la tabla ARP o del escaneo propios;
 *  - dejar de compartir una carpeta exige la confirmación y la elevación (UAC) y nunca corre sola.
 * Nada de puertos, RDP, VNC ni ejecución remota.
 */

export type MotivoEscaneoNoPermitido =
  'sin_adaptador' | 'no_privada' | 'publica' | 'perfil_desconocido';

/** Cuántos paquetes lleva el ping a un equipo, y el tope. */
export const INTENTOS_PING = 4;
export const MAX_INTENTOS_PING_RED = 10;
const PLAZO_PING_EQUIPO_MS = 1000;
const PLAZO_NOMBRE_MS = 1500;
const CONCURRENCIA_NOMBRES = 8;
const MAX_LARGO_NOMBRE = 80;

export interface AdaptadorVista extends AdaptadorRed {
  /** Es la red que se exploraría: la de la ruta por defecto, privada y de perfil no público. */
  escaneable: boolean;
  motivo: MotivoEscaneoNoPermitido | null;
}

export interface EquipoRed {
  ip: string;
  /** null si la tabla ARP aún no lo tiene. */
  mac: string | null;
  /** DNS inverso, solo tras un escaneo. */
  nombre: string | null;
  fabricante: string | null;
  /** Milisegundos del ping del escaneo (null: solo se ve en la tabla ARP). */
  ms: number | null;
}

export interface EstadoEscaneo {
  permitido: boolean;
  motivo: MotivoEscaneoNoPermitido | null;
  /** Red que se exploraría, como `192.168.1.0/24`. */
  red: string | null;
  /** Equipos que se harían ping (sin el propio). */
  equipos: number;
}

export interface LecturaRed {
  adaptadores: AdaptadorVista[];
  equipos: EquipoRed[];
  escaneo: EstadoEscaneo;
}

export interface ResultadoEscaneoRed {
  cancelado: boolean;
  revisados: number;
  total: number;
  red: string;
  equipos: EquipoRed[];
}

export interface ResultadoPingEquipo {
  ip: string;
  enviados: number;
  recibidos: number;
  perdidos: number;
  minMs: number | null;
  maxMs: number | null;
  mediaMs: number | null;
  cancelado: boolean;
}

export type EstadoDejarDeCompartir = 'quitada' | 'cancelado' | 'tiempo';
export interface ResultadoDejarDeCompartir {
  estado: EstadoDejarDeCompartir;
  carpetas: CarpetaCompartida[];
}

export type ResultadoCarpetasDeEquipo =
  | { ok: true; recursos: RecursoRed[] }
  | { ok: false; motivo: 'denegado' | 'inaccesible' | 'error' };

export interface ProgresoEscaneoRed {
  hechos: number;
  total: number;
}
export interface ProgresoVelocidad {
  fase: FaseVelocidad;
}

export type MedidorVelocidad = (o: OpcionesVelocidad) => Promise<ResultadoVelocidad>;
export type NombreInverso = (ip: string) => Promise<string | null>;

type PlataformaRed = Pick<
  PlataformaCompleta,
  | 'carpetasCompartidas'
  | 'dejarDeCompartir'
  | 'adaptadoresRed'
  | 'vecinosRed'
  | 'pingEquipo'
  | 'recursosDeEquipo'
>;

export interface DepsMiRed {
  plataforma: PlataformaRed;
  alEscaneo?: (p: ProgresoEscaneoRed) => void;
  alVelocidad?: (p: ProgresoVelocidad) => void;
  /** Por defecto, `medirVelocidad` contra speed.cloudflare.com; las pruebas ponen uno falso. */
  medidor?: MedidorVelocidad;
  /** Por defecto, la resolución inversa del sistema con plazo corto. */
  nombreInverso?: NombreInverso;
}

const sinConfirmar = (): ErrorWolf =>
  new ErrorWolf('red.sin_confirmar', 'Confirme la acción en el diálogo antes de continuar.');
const ocupado = (): ErrorWolf =>
  new ErrorWolf('red.ocupado', 'Ya hay otra operación de Mi red en curso: espere a que termine.');

/** Resolución inversa del sistema con plazo corto; null si no hay nombre. */
async function nombreInversoDelSistema(ip: string): Promise<string | null> {
  try {
    const r = await Promise.race([
      lookupService(ip, 0),
      new Promise<null>((resolver) => setTimeout(() => resolver(null), PLAZO_NOMBRE_MS).unref()),
    ]);
    return r?.hostname ?? null;
  } catch {
    return null;
  }
}

/** Un nombre de equipo mostrable: sin controles, corto y distinto de la propia IP. */
function limpiarNombre(n: string | null, ip: string): string | null {
  if (n === null) return null;
  const t = [...n]
    .filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127)
    .join('')
    .trim()
    .slice(0, MAX_LARGO_NOMBRE);
  return t === '' || t === ip ? null : t;
}

/** ¿Se puede explorar este adaptador? (la regla, en un solo sitio). */
function evaluarAdaptador(a: AdaptadorRed): MotivoEscaneoNoPermitido | null {
  if (!esPrivadaRfc1918(a.ip)) return 'no_privada';
  const perfil: PerfilRed | null = a.perfil;
  // En una red pública de Windows no se exploran otros equipos; sin perfil legible, tampoco.
  if (perfil === 'publico') return 'publica';
  if (perfil === null) return 'perfil_desconocido';
  return null;
}

export class MiRed {
  /** Equipos de la tabla ARP o del escaneo: los únicos sobre los que se puede actuar. */
  private readonly conocidos = new Set<string>();
  private readonly recursosPorEquipo = new Map<string, Set<string>>();
  private ultimosEquipos = new Map<string, EquipoRed>();
  private escaneo: AbortController | null = null;
  private velocidad: AbortController | null = null;
  private quitando = false;
  private readonly pings = new Set<AbortController>();

  constructor(private readonly deps: DepsMiRed) {}

  // ---- Carpetas compartidas de este equipo ----

  async carpetas(): Promise<CarpetaCompartida[]> {
    const l = await this.deps.plataforma.carpetasCompartidas();
    if (l === null) {
      throw new ErrorWolf('red.lectura_fallo', 'No se pudieron leer las carpetas compartidas.');
    }
    return l;
  }

  /**
   * Deja de compartir una carpeta de este equipo. Exige `confirmado === true` (el diálogo firme
   * de la ventana), que la carpeta exista en la lista actual con la MISMA ruta que vio la persona y
   * que no sea administrativa; la
   * plataforma abre UN UAC y vuelve a comprobarlo. Si el UAC se cancela o vence, se informa sin
   * error. Nunca se llama en segundo plano: solo desde el clic de la persona.
   */
  async dejarDeCompartir(
    nombre: unknown,
    ruta: unknown,
    confirmado: unknown,
  ): Promise<ResultadoDejarDeCompartir> {
    if (confirmado !== true) throw sinConfirmar();
    if (!nombreDeRecursoValido(nombre) || typeof ruta !== 'string' || ruta === '') {
      throw new ErrorWolf(
        'red.carpeta_no_valida',
        'Esa carpeta compartida no se puede quitar desde aquí.',
      );
    }
    if (this.quitando) throw ocupado();
    this.quitando = true;
    try {
      const actual = (await this.carpetas()).find((c) => c.nombre === nombre);
      // Solo la carpeta que vio la persona: misma ruta que en la lista de ahora.
      if (!actual || actual.administrativa || actual.ruta !== ruta) {
        throw new ErrorWolf(
          'red.carpeta_no_valida',
          'Esa carpeta compartida no se puede quitar desde aquí.',
        );
      }
      const r = await this.deps.plataforma.dejarDeCompartir(nombre, actual.ruta);
      if (!r.ok && r.motivo === 'cancelado') {
        return { estado: 'cancelado', carpetas: await this.carpetas() };
      }
      if (!r.ok && r.motivo === 'tiempo')
        return { estado: 'tiempo', carpetas: await this.carpetas() };
      if (!r.ok) {
        throw new ErrorWolf('red.quitar_fallo', 'No se pudo dejar de compartir la carpeta.');
      }
      // Windows dijo que sí: se comprueba leyendo la lista, no se da por hecho.
      const despues = await this.carpetas();
      if (despues.some((c) => c.nombre === nombre)) {
        throw new ErrorWolf('red.quitar_fallo', 'No se pudo dejar de compartir la carpeta.');
      }
      return { estado: 'quitada', carpetas: despues };
    } finally {
      this.quitando = false;
    }
  }

  // ---- Equipos de la red local ----

  private armarEquipos(vecinos: VecinoRed[], extra: Map<string, number | null>): EquipoRed[] {
    const porIp = new Map<string, EquipoRed>();
    for (const v of vecinos) {
      porIp.set(v.ip, {
        ip: v.ip,
        mac: v.mac,
        nombre: this.ultimosEquipos.get(v.ip)?.nombre ?? null,
        fabricante: fabricantePorMac(v.mac),
        ms: extra.get(v.ip) ?? null,
      });
    }
    for (const [ip, ms] of extra) {
      if (!porIp.has(ip)) {
        porIp.set(ip, { ip, mac: null, nombre: null, fabricante: null, ms });
      }
    }
    return [...porIp.values()].sort((a, b) => ordenIp(a.ip) - ordenIp(b.ip));
  }

  private recordar(equipos: EquipoRed[]): void {
    this.ultimosEquipos = new Map(equipos.map((e) => [e.ip, e]));
    for (const e of equipos) this.conocidos.add(e.ip);
  }

  /** El adaptador de la red por la que sale este equipo (el primero con IP privada), o null. */
  private activo(adaptadores: AdaptadorRed[]): AdaptadorRed | null {
    return (
      adaptadores.find((a) => a.predeterminado && esPrivadaRfc1918(a.ip)) ??
      adaptadores.find((a) => a.predeterminado) ??
      null
    );
  }

  private estadoEscaneo(adaptadores: AdaptadorRed[]): EstadoEscaneo {
    const a = this.activo(adaptadores);
    if (!a) return { permitido: false, motivo: 'sin_adaptador', red: null, equipos: 0 };
    const motivo = evaluarAdaptador(a);
    if (motivo) return { permitido: false, motivo, red: null, equipos: 0 };
    try {
      const r = rangoDeEscaneo(a.ip, a.prefijo);
      return {
        permitido: true,
        motivo: null,
        red: `${r.red}/${r.prefijo}`,
        equipos: r.ultimo - r.primero,
      };
    } catch {
      return { permitido: false, motivo: 'no_privada', red: null, equipos: 0 };
    }
  }

  /**
   * Lectura PASIVA e inmediata: los adaptadores con su subred y la tabla ARP (equipos privados que
   * este equipo ya conoce). No envía ningún paquete.
   */
  async lectura(): Promise<LecturaRed> {
    const [adaptadores, vecinos] = await Promise.all([
      this.deps.plataforma.adaptadoresRed(),
      this.deps.plataforma.vecinosRed(),
    ]);
    if (adaptadores === null && vecinos === null) {
      throw new ErrorWolf('red.lectura_fallo', 'No se pudo leer la red de este equipo.');
    }
    const lista = adaptadores ?? [];
    const activo = this.activo(lista);
    const escaneo = this.estadoEscaneo(lista);
    const vistas: AdaptadorVista[] = lista.map((a) => ({
      ...a,
      escaneable: activo === a && escaneo.permitido,
      motivo: activo === a ? escaneo.motivo : null,
    }));
    const equipos = this.armarEquipos(vecinos ?? [], new Map());
    this.recordar(equipos);
    return { adaptadores: vistas, equipos, escaneo };
  }

  /**
   * Escaneo ACTIVO por ping de la red del adaptador activo. Solo con `confirmado === true`; los
   * rangos se calculan aquí a partir del adaptador (la ventana no manda ningún rango), nunca son
   * públicos ni mayores que un /24 y se cancela si la red de Windows es pública.
   */
  async escanear(confirmado: unknown): Promise<ResultadoEscaneoRed> {
    if (confirmado !== true) throw sinConfirmar();
    if (this.escaneo) throw ocupado();
    const adaptadores = await this.deps.plataforma.adaptadoresRed();
    if (adaptadores === null) {
      throw new ErrorWolf('red.lectura_fallo', 'No se pudo leer la red de este equipo.');
    }
    const a = this.activo(adaptadores);
    if (!a) throw new ErrorWolf('red.sin_adaptador', 'No hay una red activa que explorar.');
    const motivo = evaluarAdaptador(a);
    if (motivo === 'publica') {
      throw new ErrorWolf('red.red_publica', 'En redes públicas no se exploran otros equipos.');
    }
    if (motivo === 'perfil_desconocido') {
      throw new ErrorWolf(
        'red.perfil_desconocido',
        'No se pudo saber si la red es privada o pública.',
      );
    }
    // Lanza `red.rango_no_permitido` con una IP pública o un prefijo imposible.
    const rango = rangoDeEscaneo(a.ip, a.prefijo);
    if (this.escaneo) throw ocupado();
    const ctl = new AbortController();
    this.escaneo = ctl;
    try {
      const r = await escanearRango({
        rango,
        senal: ctl.signal,
        ping: async (ip, senal) => {
          const p = await this.deps.plataforma.pingEquipo(ip, {
            intentos: 1,
            plazoMs: PLAZO_PING_ESCANEO_MS,
            senal,
          });
          return p.recibidos > 0 ? (p.tiemposMs[0] ?? 0) : null;
        },
        alAvanzar: (hechos, total) => this.deps.alEscaneo?.({ hechos, total }),
      });
      const vecinos = (await this.deps.plataforma.vecinosRed()) ?? [];
      const ms = new Map(r.vivos.map((v) => [v.ip, v.ms as number | null]));
      let equipos = this.armarEquipos(vecinos, ms);
      if (!r.cancelado) equipos = await this.conNombres(equipos, ctl.signal);
      this.recordar(equipos);
      return {
        cancelado: r.cancelado,
        revisados: r.revisados,
        total: r.total,
        red: `${rango.red}/${rango.prefijo}`,
        equipos,
      };
    } finally {
      this.escaneo = null;
    }
  }

  private async conNombres(equipos: EquipoRed[], senal: AbortSignal): Promise<EquipoRed[]> {
    const resolver = this.deps.nombreInverso ?? nombreInversoDelSistema;
    const res = equipos.map((e) => ({ ...e }));
    let siguiente = 0;
    const trabajar = async (): Promise<void> => {
      while (!senal.aborted && siguiente < res.length) {
        const e = res[siguiente++]!;
        try {
          e.nombre = limpiarNombre(await resolver(e.ip), e.ip);
        } catch {
          e.nombre = null;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCIA_NOMBRES, res.length) }, trabajar));
    return res;
  }

  cancelarEscaneo(): boolean {
    if (!this.escaneo) return false;
    this.escaneo.abort();
    return true;
  }

  // ---- Acciones por equipo (a petición, sobre equipos de la lista) ----

  private conocido(ip: unknown): string {
    const v = validarIpPrivada(ip);
    if (!this.conocidos.has(v)) {
      throw new ErrorWolf(
        'red.equipo_desconocido',
        'Ese equipo no está en la lista: actualice la lectura.',
      );
    }
    return v;
  }

  /** Ping a un equipo de la lista: 4 paquetes por defecto, nunca más de 10. */
  async ping(ip: unknown, intentos: unknown = INTENTOS_PING): Promise<ResultadoPingEquipo> {
    const v = this.conocido(ip);
    const n = intentos === undefined ? INTENTOS_PING : intentos;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > MAX_INTENTOS_PING_RED) {
      throw new ErrorWolf('red.equipo_no_valido', 'Número de paquetes no válido.');
    }
    const ctl = new AbortController();
    this.pings.add(ctl);
    try {
      const r = await this.deps.plataforma.pingEquipo(v, {
        intentos: n,
        plazoMs: PLAZO_PING_EQUIPO_MS,
        senal: ctl.signal,
      });
      const t = r.tiemposMs;
      return {
        ip: v,
        enviados: r.enviados,
        recibidos: r.recibidos,
        perdidos: r.enviados - r.recibidos,
        minMs: t.length ? Math.min(...t) : null,
        maxMs: t.length ? Math.max(...t) : null,
        mediaMs: t.length ? Math.round((t.reduce((a, b) => a + b, 0) / t.length) * 10) / 10 : null,
        cancelado: r.cancelado,
      };
    } finally {
      this.pings.delete(ctl);
    }
  }

  /** Carpetas compartidas de un equipo de la lista (`net view`: consulta SMB, no un escaneo). */
  async carpetasDeEquipo(ip: unknown): Promise<ResultadoCarpetasDeEquipo> {
    const v = this.conocido(ip);
    const ctl = new AbortController();
    this.pings.add(ctl);
    try {
      const r = await this.deps.plataforma.recursosDeEquipo(v, ctl.signal);
      if (!r.ok) return r;
      // Solo se pueden abrir los recursos que el propio equipo listó y con nombre válido.
      const recursos = r.recursos.filter((x) => nombreDeRecursoValido(x.nombre));
      this.recursosPorEquipo.set(v, new Set(recursos.map((x) => x.nombre)));
      return { ok: true, recursos };
    } finally {
      this.pings.delete(ctl);
    }
  }

  /**
   * Ruta `\\IP\recurso` para que el proceso principal la abra por un clic: el equipo debe estar
   * en la lista, el recurso salir del último `net view` de ese equipo y ambos pasar la validación.
   */
  rutaRecurso(ip: unknown, recurso: unknown): string {
    const v = this.conocido(ip);
    if (typeof recurso !== 'string' || !this.recursosPorEquipo.get(v)?.has(recurso)) {
      throw new ErrorWolf('red.recurso_no_valido', 'Ese recurso no está en la lista del equipo.');
    }
    return rutaUncRecurso(v, recurso);
  }

  // ---- Prueba de velocidad ----

  /**
   * Mide latencia, bajada y subida contra speed.cloudflare.com. Solo con `confirmado === true` (la
   * ventana avisa de los MB antes). Cancelable; no envía ningún dato de la persona.
   */
  async medirVelocidad(
    confirmado: unknown,
  ): Promise<ResultadoVelocidad & { plan: typeof PLAN_VELOCIDAD }> {
    if (confirmado !== true) throw sinConfirmar();
    if (this.velocidad) throw ocupado();
    const ctl = new AbortController();
    this.velocidad = ctl;
    try {
      const medir = this.deps.medidor ?? medirVelocidad;
      const r = await medir({
        senal: ctl.signal,
        alFase: (fase) => this.deps.alVelocidad?.({ fase }),
      });
      return { ...r, plan: PLAN_VELOCIDAD };
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      throw new ErrorWolf(
        'red.velocidad_fallo',
        'No se pudo medir la velocidad: compruebe la conexión.',
        undefined,
        {
          cause: e,
        },
      );
    } finally {
      this.velocidad = null;
    }
  }

  cancelarVelocidad(): boolean {
    if (!this.velocidad) return false;
    this.velocidad.abort();
    return true;
  }

  /** Al cerrar la app: corta el escaneo, los pings, las consultas y la prueba de velocidad. */
  cancelarTodo(): void {
    this.escaneo?.abort();
    this.velocidad?.abort();
    for (const c of this.pings) c.abort();
  }
}

const ordenIp = (ip: string): number => ip.split('.').reduce((n, p) => n * 256 + Number(p), 0);

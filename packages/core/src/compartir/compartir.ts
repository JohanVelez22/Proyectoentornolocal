import { randomBytes } from 'node:crypto';
import { open, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import {
  crearDetectorSensible,
  sitiosConRutasReales,
  type DetectorSensible,
} from '../herramientas/archivoSensible';
import { rutaComparable, rutaDentroDe } from '../plataforma/sistema';
import { CARPETAS_PROHIBIDAS, esCarpetaProhibida } from './contenido';
import { MAX_ANALISIS_BYTES, ServidorCompartir, type AccesoCompartido } from './servidor';

/**
 * «Compartir carpeta o archivo» (D52): publica en internet, por un túnel, una carpeta o un archivo
 * que el usuario eligió en el diálogo nativo. Solo hay una compartición a la vez y siempre vence
 * (15 min, 1 h o 4 h): al vencer, al dejar de compartir, si el túnel cae o al cerrar la app, se
 * cierran el servidor y el túnel.
 *
 * Toda compartición exige `confirmado === true` (el diálogo de la ventana, con la ruta exacta y la
 * hora de vencimiento). El núcleo rechaza por sí mismo —con `realpath`— lo que nunca se publica:
 * la raíz de una unidad, la carpeta del usuario entera (o una que la contenga), la carpeta de datos
 * de WolfCore Dev, los sitios con datos reales, las carpetas de claves (`.ssh`, `.aws`…) y las del
 * sistema. Dentro de lo compartido, el servidor tampoco sirve nada sensible (ver `servidor.ts`).
 */

export const DURACIONES_MIN = [15, 60, 240] as const;
export type DuracionCompartir = (typeof DURACIONES_MIN)[number];
export const PROVEEDORES_COMPARTIR = ['cloudflare-rapido', 'ngrok'] as const;
export type ProveedorCompartir = (typeof PROVEEDORES_COMPARTIR)[number];
export const MAX_ACCESOS = 200;
/** Cada cuánto se revisa el vencimiento por la hora del reloj (un temporizador no cuenta lo suspendido). */
export const REVISION_MS = 15_000;
/** Tope de accesos anotados por segundo: una avalancha de peticiones no inunda el registro ni la ventana. */
export const MAX_ACCESOS_POR_SEGUNDO = 50;

export type FinCompartir = 'usuario' | 'vencio' | 'tunel' | 'cierre';

export interface EstadoCompartir {
  fase: 'inactiva' | 'iniciando' | 'activa';
  /** Ruta exacta compartida (la que se confirmó). */
  ruta: string | null;
  tipo: 'carpeta' | 'archivo' | null;
  proveedor: ProveedorCompartir | null;
  duracionMin: DuracionCompartir | null;
  /** Dirección pública completa (lleva el token: es lo que se comparte). */
  url: string | null;
  /** Momento de vencimiento (ms desde 1970). */
  expira: number | null;
  /** Por qué terminó la última compartición (solo en `inactiva`). */
  fin: FinCompartir | null;
}

export interface TunelAbierto {
  url: string;
  cerrar(): Promise<void>;
}

export interface DepsCompartir {
  /** Abre un túnel hacia `127.0.0.1:puerto`; `alCaer` se llama si el túnel muere por su cuenta. */
  tunel(puerto: number, proveedor: ProveedorCompartir, alCaer: () => void): Promise<TunelAbierto>;
  /** Carpetas de datos de WolfCore Dev (la de siempre y la de `WOLFCORE_DATOS`). */
  carpetasPropias: () => readonly string[];
  carpetaInicio: () => string;
  carpetasSistema: () => readonly string[];
  sitios: () => Promise<readonly { carpeta: string; datosReales: boolean }[]>;
  alEstado: (e: EstadoCompartir) => void;
  alAcceso: (a: AccesoCompartido) => void;
  ahora?: () => number;
  /** Programa `fn` dentro de `ms` y devuelve cómo cancelarlo (por defecto, `setTimeout`). */
  programar?: (fn: () => void, ms: number) => () => void;
}

export interface OpcionesCompartir {
  ruta: string;
  duracionMin: number;
  proveedor: string;
  confirmado?: boolean;
}

const INACTIVA: EstadoCompartir = {
  fase: 'inactiva',
  ruta: null,
  tipo: null,
  proveedor: null,
  duracionMin: null,
  url: null,
  expira: null,
  fin: null,
};

const esUnc = (r: string): boolean => /^[\\/]{2}/.test(r);
const mismaRuta = (a: string, b: string): boolean =>
  rutaComparable(path.resolve(a)) === rutaComparable(path.resolve(b));

async function conReal(ruta: string): Promise<string[]> {
  const r = await realpath(ruta).catch(() => null);
  return r && !mismaRuta(r, ruta) ? [path.resolve(ruta), r] : [path.resolve(ruta)];
}

export class Compartir {
  private estadoActual: EstadoCompartir = { ...INACTIVA };
  private accesosRecientes: AccesoCompartido[] = [];
  private servidor: ServidorCompartir | null = null;
  private tunel: TunelAbierto | null = null;
  private cancelarPlazo: (() => void) | null = null;
  /** Se incrementa en cada inicio y cada parada: invalida un inicio que sigue en curso. */
  private generacion = 0;
  private ventanaAccesos = { desde: 0, n: 0 };

  constructor(private readonly d: DepsCompartir) {}

  estado(): EstadoCompartir {
    return { ...this.estadoActual };
  }

  /** Últimos accesos de la compartición actual o de la última (nunca llevan el token). */
  accesos(): AccesoCompartido[] {
    return this.accesosRecientes.map((a) => ({ ...a }));
  }

  private fijar(e: EstadoCompartir): void {
    this.estadoActual = e;
    this.d.alEstado({ ...e });
  }

  async iniciar(o: OpcionesCompartir): Promise<EstadoCompartir> {
    if (o.confirmado !== true) {
      throw new ErrorWolf(
        'compartir.confirmacion_requerida',
        'Compartir en internet exige confirmarlo en la ventana de WolfCore Dev.',
      );
    }
    const duracionMin = DURACIONES_MIN.find((x) => x === o.duracionMin);
    if (duracionMin === undefined) {
      throw new ErrorWolf('compartir.duracion_invalida', 'Elija 15 minutos, 1 hora o 4 horas.');
    }
    const proveedor = PROVEEDORES_COMPARTIR.find((x) => x === o.proveedor);
    if (proveedor === undefined) {
      throw new ErrorWolf('compartir.proveedor_invalido', 'Ese proveedor de túnel no se admite.');
    }
    if (this.estadoActual.fase !== 'inactiva') {
      throw new ErrorWolf(
        'compartir.ocupado',
        'Ya hay algo compartido: deje de compartir primero.',
      );
    }
    const gen = ++this.generacion;
    this.accesosRecientes = [];
    this.ventanaAccesos = { desde: 0, n: 0 };
    this.fijar({ ...INACTIVA, fase: 'iniciando', ruta: o.ruta, proveedor, duracionMin });
    let servidor: ServidorCompartir | null = null;
    let tunel: TunelAbierto | null = null;
    try {
      const { real, tipo, detector } = await this.validar(o.ruta);
      if (gen !== this.generacion) return this.estado();
      const token = randomBytes(16).toString('base64url');
      servidor = await ServidorCompartir.iniciar({
        raiz: real,
        tipo,
        token,
        detector,
        alAcceso: (a) => this.anotar(gen, a),
        ahora: () => this.ahora(),
      });
      if (gen !== this.generacion) {
        await servidor.cerrar();
        return this.estado();
      }
      tunel = await this.d.tunel(servidor.puerto, proveedor, () => {
        if (gen === this.generacion) void this.parar('tunel');
      });
      if (gen !== this.generacion) {
        await tunel.cerrar().catch(() => undefined);
        await servidor.cerrar();
        return this.estado();
      }
      const ahora = this.ahora();
      const ms = duracionMin * 60_000;
      const expira = ahora + ms;
      const base = tunel.url.replace(/\/+$/, '');
      const sufijo = tipo === 'archivo' ? encodeURIComponent(path.basename(real)) : '';
      this.servidor = servidor;
      this.tunel = tunel;
      servidor.fijarExpira(expira);
      this.vigilar(gen, expira);
      this.fijar({
        fase: 'activa',
        ruta: o.ruta,
        tipo,
        proveedor,
        duracionMin,
        url: `${base}/${token}/${sufijo}`,
        expira,
        fin: null,
      });
      return this.estado();
    } catch (e) {
      if (tunel) await tunel.cerrar().catch(() => undefined);
      if (servidor) await servidor.cerrar().catch(() => undefined);
      if (gen === this.generacion) this.fijar({ ...INACTIVA });
      throw e;
    }
  }

  private ahora(): number {
    return (this.d.ahora ?? Date.now)();
  }

  /**
   * Vigila el vencimiento por la hora del reloj, cada pocos segundos: un temporizador largo no cuenta
   * el tiempo con el equipo suspendido y la compartición viviría de más.
   */
  private vigilar(gen: number, expira: number): void {
    const espera = Math.max(1, Math.min(REVISION_MS, expira - this.ahora()));
    this.cancelarPlazo = (this.d.programar ?? programarPorDefecto)(() => {
      if (gen !== this.generacion) return;
      if (this.ahora() >= expira) void this.parar('vencio');
      else this.vigilar(gen, expira);
    }, espera);
  }

  /** «Dejar de compartir»: cierra el túnel y el servidor. Sin nada compartido, no hace nada. */
  detener(): Promise<EstadoCompartir> {
    return this.parar('usuario');
  }

  /** Al cerrar la app: todo se cierra. */
  cerrar(): Promise<EstadoCompartir> {
    return this.parar('cierre');
  }

  private async parar(fin: FinCompartir): Promise<EstadoCompartir> {
    if (this.estadoActual.fase === 'inactiva') return this.estado();
    this.generacion++;
    this.cancelarPlazo?.();
    this.cancelarPlazo = null;
    const tunel = this.tunel;
    const servidor = this.servidor;
    this.tunel = null;
    this.servidor = null;
    this.fijar({ ...INACTIVA, fin });
    // El servidor se cierra siempre, aunque el túnel no responda al cerrarse.
    await Promise.allSettled([tunel?.cerrar(), servidor?.cerrar()]);
    return this.estado();
  }

  private anotar(gen: number, a: AccesoCompartido): void {
    if (gen !== this.generacion) return;
    // Tope por segundo: una avalancha de peticiones (con o sin el token) no inunda el registro.
    const v = this.ventanaAccesos;
    if (a.hora - v.desde >= 1000 || a.hora < v.desde) this.ventanaAccesos = { desde: a.hora, n: 0 };
    if (++this.ventanaAccesos.n > MAX_ACCESOS_POR_SEGUNDO) return;
    this.accesosRecientes.push(a);
    if (this.accesosRecientes.length > MAX_ACCESOS) {
      this.accesosRecientes.splice(0, this.accesosRecientes.length - MAX_ACCESOS);
    }
    this.d.alAcceso({ ...a });
  }

  /**
   * Valida lo elegido (con `realpath`) y devuelve su ruta real. Lanza el error del motivo
   * exacto cuando es algo que nunca se publica.
   */
  private async validar(
    ruta: string,
  ): Promise<{ real: string; tipo: 'carpeta' | 'archivo'; detector: DetectorSensible }> {
    const invalida = (): ErrorWolf =>
      new ErrorWolf('compartir.ruta_invalida', 'Elija una carpeta o un archivo que exista.');
    if (
      typeof ruta !== 'string' ||
      ruta === '' ||
      ruta.length > 1024 ||
      !path.isAbsolute(ruta) ||
      esUnc(ruta) ||
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1f\x7f]/.test(ruta)
    ) {
      throw invalida();
    }
    let real: string;
    let info;
    try {
      real = await realpath(ruta);
      info = await stat(real);
    } catch {
      throw invalida();
    }
    if (esUnc(real) || (!info.isDirectory() && !info.isFile())) throw invalida();
    const rutas = [...new Set([path.resolve(ruta), real])];

    for (const r of rutas) {
      if (mismaRuta(r, path.parse(r).root)) {
        throw new ErrorWolf('compartir.raiz_unidad', 'La raíz de una unidad no se comparte.');
      }
    }
    for (const inicio of await conReal(this.d.carpetaInicio())) {
      if (rutas.some((r) => mismaRuta(r, inicio) || rutaDentroDe(r, inicio))) {
        throw new ErrorWolf(
          'compartir.carpeta_usuario',
          'La carpeta del usuario entera (o una que la contenga) no se comparte.',
        );
      }
    }
    for (const propia of this.d.carpetasPropias()) {
      for (const p of await conReal(propia)) {
        if (rutas.some((r) => rutaDentroDe(p, r) || rutaDentroDe(r, p))) {
          throw new ErrorWolf(
            'compartir.carpeta_datos',
            'La carpeta de datos de WolfCore Dev no se comparte.',
          );
        }
      }
    }
    for (const sis of this.d.carpetasSistema()) {
      for (const s of await conReal(sis)) {
        if (rutas.some((r) => rutaDentroDe(s, r))) {
          throw new ErrorWolf(
            'compartir.carpeta_sistema',
            'Las carpetas del sistema no se comparten.',
          );
        }
      }
    }
    const sitios = await this.d.sitios();
    const rutasSitios = await sitiosConRutasReales(sitios);
    for (const s of rutasSitios) {
      if (s.datosReales && rutas.some((r) => rutaDentroDe(s.carpeta, r))) {
        throw new ErrorWolf(
          'compartir.sitio_datos_reales',
          'Un sitio con datos reales (ni nada dentro de él) no se comparte.',
        );
      }
    }
    const secretos = (): ErrorWolf =>
      new ErrorWolf(
        'compartir.carpeta_secretos',
        'Esa carpeta guarda claves (.ssh, .aws, .git…): no se comparte.',
      );
    for (const r of rutas) {
      if (r.split(/[\\/]/).some((t) => esCarpetaProhibida(t))) throw secretos();
    }
    const detector = crearDetectorSensible(rutasSitios);
    if (info.isDirectory()) {
      const nombres = await readdir(real).catch(() => [] as string[]);
      if (
        nombres.some((n) => (CARPETAS_PROHIBIDAS as readonly string[]).includes(n.toLowerCase()))
      ) {
        throw secretos();
      }
      return { real, tipo: 'carpeta', detector };
    }
    const sensible = (): ErrorWolf =>
      new ErrorWolf(
        'compartir.archivo_sensible',
        'Ese archivo parece guardar un secreto o datos reales: no se comparte.',
      );
    if (rutas.some((r) => detector.porRuta(r, info.nlink))) throw sensible();
    const fh = await open(real, 'r').catch(() => null);
    if (!fh) throw invalida();
    try {
      const n = Math.min(info.size, MAX_ANALISIS_BYTES);
      const b = Buffer.alloc(n);
      const { bytesRead } = n > 0 ? await fh.read(b, 0, n, 0) : { bytesRead: 0 };
      if (detector.porContenido(b.subarray(0, bytesRead))) throw sensible();
    } finally {
      await fh.close().catch(() => undefined);
    }
    return { real, tipo: 'archivo', detector };
  }
}

const programarPorDefecto = (fn: () => void, ms: number): (() => void) => {
  const h = setTimeout(fn, ms);
  return () => clearTimeout(h);
};

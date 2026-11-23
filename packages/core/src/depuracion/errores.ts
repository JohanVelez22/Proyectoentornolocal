import { createHash } from 'node:crypto';
import type { Eventos, EventosNucleo } from '../eventos';
import type { FuenteRegistro, Registros } from '../monitor/registros';
import { enmascararSecretos } from '../patronesSecretos';
import type { Sitio } from '../tipos';

/**
 * Visor de errores: interpreta los registros que ya sigue `Registros` (log de PHP, log de
 * errores de Nginx con los mensajes de FastCGI, laravel.log, logs de CodeIgniter 3 y tracebacks
 * de Python de los procesos de proyecto) y agrupa las entradas por huella.
 *
 * Todo es texto: nada se interpreta como HTML ni se ejecuta. Mensajes y trazas pasan por
 * `enmascararSecretos` y quedan acotados.
 */

export type FormatoErrores = 'php' | 'laravel' | 'ci3' | 'python' | 'nginx';

/** Una aparición de un error en un registro. */
export interface EntradaError {
  /** Clase de la excepción (`RuntimeException`) o nivel (`PHP Warning`, `CI3 ERROR`). */
  tipo: string;
  mensaje: string;
  archivo: string | null;
  linea: number | null;
  /** Fecha del registro (ISO) o null si la línea no la trae. */
  fecha: string | null;
  traza: string[];
}

/** Un error agrupado por huella (tipo + mensaje normalizado + archivo:línea). */
export interface ErrorAgrupado {
  huella: string;
  tipo: string;
  mensaje: string;
  archivo: string | null;
  linea: number | null;
  sitioId: string | null;
  veces: number;
  primera: string;
  ultima: string;
  /** Traza de la última vez. */
  traza: string[];
  fuenteId: string;
}

/** Lo que va en la lista: todo menos la traza. */
export type ResumenError = Omit<ErrorAgrupado, 'traza'>;

export interface FiltroErrores {
  sitioId?: string;
  /** Solo los que aparecieron desde esta fecha (ISO). */
  desde?: string;
}

/** Forma de una huella: 16 caracteres hexadecimales. */
export const HUELLA_ERROR = /^[0-9a-f]{16}$/;
/** Líneas de traza que se guardan por error (la última vez). */
export const MAX_LINEAS_TRAZA = 60;
/** Largo máximo de un mensaje y de cada línea de traza. */
export const MAX_MENSAJE_ERROR = 2000;
const MAX_LINEA_TRAZA = 500;
const MAX_TIPO = 200;
/** Grupos que se guardan (se descartan los que no aparecen hace más tiempo). */
export const MAX_GRUPOS_ERRORES = 500;
/** Líneas del final de cada registro que se leen al empezar. */
export const LINEAS_INICIALES_ERRORES = 1000;

const recortar = (t: string, max: number): string => (t.length > max ? `${t.slice(0, max)}…` : t);

const limpio = (t: string, max: number): string => recortar(enmascararSecretos(t), max);

/* ───────────── Fechas ───────────── */

const MESES: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const iso = (d: Date): string | null => (Number.isNaN(d.getTime()) ? null : d.toISOString());

/** `2026-11-23 10:00:00` o `2026/11/23 10:00:00` (hora local), con ISO completo también. */
function fechaNumerica(t: string): string | null {
  const m =
    /^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.exec(
      t.trim(),
    );
  if (!m) return null;
  if (m[8]) {
    const zona = m[8] === 'Z' ? 'Z' : m[8].replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
    return iso(new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${zona}`));
  }
  return iso(new Date(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!));
}

/** Fecha del log de PHP: `23-Nov-2026 15:04:05 UTC` (otra zona: hora local). */
function fechaPhp(t: string): string | null {
  const m = /^(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}):(\d{2}):(\d{2})(?: (\S+))?$/.exec(t.trim());
  if (!m) return null;
  const mes = MESES[m[2]!.toLowerCase()];
  if (mes === undefined) return null;
  const p = [+m[3]!, mes, +m[1]!, +m[4]!, +m[5]!, +m[6]!] as const;
  return iso(m[7] === 'UTC' ? new Date(Date.UTC(...p)) : new Date(...p));
}

/* ───────────── PHP ───────────── */

const CABECERA_PHP = /^(?:\[([^\]]+)\]\s+)?PHP ([A-Z][A-Za-z ]*?):\s+(.*)$/;
/** Líneas que siguen a un error de PHP (traza de la excepción o de Xdebug). */
const CONTINUA_PHP = /^(?:PHP )?(?:Stack trace:|#\d+ |\s+thrown in |\s+\d+\. )/;

/** Mensaje de PHP → tipo, mensaje, archivo y línea. */
function partesPhp(
  nivel: string,
  resto: string,
): Pick<EntradaError, 'tipo' | 'mensaje' | 'archivo' | 'linea'> {
  let tipo = `PHP ${nivel}`;
  let mensaje = resto.trim();
  let archivo: string | null = null;
  let linea: number | null = null;
  const enLinea = / in (.+?) on line (\d+)\s*$/.exec(mensaje);
  const enDos = enLinea ? null : / in (.+?):(\d+)\s*$/.exec(mensaje);
  const lugar = enLinea ?? enDos;
  if (lugar) {
    archivo = lugar[1]!;
    linea = Number(lugar[2]);
    mensaje = mensaje.slice(0, lugar.index);
  }
  const sinCapturar = /^Uncaught ([A-Za-z_\\][\w\\]*)(?:: (.*))?$/s.exec(mensaje);
  if (sinCapturar) {
    tipo = sinCapturar[1]!;
    mensaje = sinCapturar[2] ?? '';
  }
  return { tipo, mensaje, archivo, linea };
}

/* ───────────── Intérprete por formato ───────────── */

interface Abierta {
  e: EntradaError;
  /** Python: ¿ya se vio un marco (`File "…"`)? */
  marcos?: boolean;
}

/**
 * Intérprete en vivo de un registro: recibe lotes de líneas y devuelve las entradas cerradas.
 * La última puede quedar abierta (su traza puede llegar en el próximo lote); `cerrar()` la
 * entrega.
 */
export class InterpreteErrores {
  private abierta: Abierta | null = null;

  constructor(readonly formato: FormatoErrores) {}

  agregar(lineas: readonly string[]): EntradaError[] {
    const salida: EntradaError[] = [];
    for (const l of lineas) this.linea(l, salida);
    return salida;
  }

  /** Entrega la entrada abierta, si hay. */
  cerrar(): EntradaError[] {
    const a = this.abierta;
    this.abierta = null;
    // Un traceback de Python sin la línea de la excepción no es un error completo.
    if (!a || (this.formato === 'python' && a.e.tipo === '')) return [];
    return [a.e];
  }

  /** ¿Hay una entrada esperando más traza? */
  get pendiente(): boolean {
    return this.abierta !== null;
  }

  private abrir(e: Omit<EntradaError, 'traza'>, salida: EntradaError[], marcos?: boolean): void {
    salida.push(...this.cerrar());
    this.abierta = {
      e: {
        ...e,
        tipo: limpio(e.tipo, MAX_TIPO),
        mensaje: limpio(e.mensaje, MAX_MENSAJE_ERROR),
        archivo: e.archivo === null ? null : recortar(e.archivo, 1024),
        traza: [],
      },
      ...(marcos !== undefined ? { marcos } : {}),
    };
  }

  private trazar(l: string): void {
    const t = this.abierta?.e.traza;
    if (t && t.length < MAX_LINEAS_TRAZA) t.push(limpio(l, MAX_LINEA_TRAZA));
  }

  private linea(l: string, salida: EntradaError[]): void {
    switch (this.formato) {
      case 'php':
        return this.lineaPhp(l, salida, null);
      case 'laravel':
        return this.lineaLaravel(l, salida);
      case 'ci3':
        return this.lineaCi3(l, salida);
      case 'python':
        return this.lineaPython(l, salida);
      case 'nginx':
        return this.lineaNginx(l, salida);
    }
  }

  private lineaPhp(l: string, salida: EntradaError[], fechaPorDefecto: string | null): void {
    const m = CABECERA_PHP.exec(l);
    if (m) {
      this.abrir(
        { ...partesPhp(m[2]!, m[3]!), fecha: m[1] ? fechaPhp(m[1]) : fechaPorDefecto },
        salida,
      );
      return;
    }
    if (this.abierta && CONTINUA_PHP.test(l)) {
      this.trazar(l);
      return;
    }
    salida.push(...this.cerrar());
  }

  private lineaLaravel(l: string, salida: EntradaError[]): void {
    const m =
      /^\[(\d{4}-\d{2}-\d{2}[ T][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)\] [\w.-]+\.([A-Z]+): (.*)$/.exec(l);
    if (!m) {
      if (this.abierta) this.trazar(l);
      return;
    }
    const nivel = m[2]!;
    if (!['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'].includes(nivel)) {
      salida.push(...this.cerrar());
      return;
    }
    const msg = m[3]!;
    const ex = /\[object\] \(([A-Za-z_\\][\w\\]*)\(code: [^)]*\): (.*) at (.+?):(\d+)\)\s*$/.exec(
      msg,
    );
    this.abrir(
      ex
        ? {
            tipo: ex[1]!,
            mensaje: ex[2]!,
            archivo: ex[3]!,
            linea: Number(ex[4]),
            fecha: fechaNumerica(m[1]!),
          }
        : {
            tipo: `Laravel ${nivel}`,
            mensaje: msg,
            archivo: null,
            linea: null,
            fecha: fechaNumerica(m[1]!),
          },
      salida,
    );
  }

  private lineaCi3(l: string, salida: EntradaError[]): void {
    const m =
      /^(ERROR|CRITICAL|WARNING|DEBUG|INFO|ALL) - (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) --> (.*)$/.exec(
        l,
      );
    // Cada entrada de CodeIgniter 3 es de una línea.
    salida.push(...this.cerrar());
    if (!m || (m[1] !== 'ERROR' && m[1] !== 'CRITICAL')) return;
    const fecha = fechaNumerica(m[2]!);
    const msg = m[3]!;
    const sev = /^Severity: ([\w ]+?) --> (.*?) ((?:[A-Za-z]:[\\/]|\/).*?) (\d+)$/.exec(msg);
    if (sev) {
      const ex = /^((?:[A-Za-z_\\][\w\\]*)?(?:Exception|Error)): (.*)$/.exec(sev[2]!);
      this.abrir(
        {
          tipo: ex ? ex[1]! : `CI3 ${sev[1]}`,
          mensaje: ex ? ex[2]! : sev[2]!,
          archivo: sev[3]!,
          linea: Number(sev[4]),
          fecha,
        },
        salida,
      );
    } else {
      this.abrir({ tipo: `CI3 ${m[1]}`, mensaje: msg, archivo: null, linea: null, fecha }, salida);
    }
    salida.push(...this.cerrar());
  }

  private lineaPython(l: string, salida: EntradaError[]): void {
    if (/^Traceback \(most recent call last\):\s*$/.test(l)) {
      this.abrir({ tipo: '', mensaje: '', archivo: null, linea: null, fecha: null }, salida, false);
      this.trazar(l);
      return;
    }
    const a = this.abierta;
    if (!a) return;
    const marco = /^\s+File "(.+)", line (\d+)/.exec(l);
    if (marco) {
      a.e.archivo = recortar(marco[1]!, 1024);
      a.e.linea = Number(marco[2]);
      a.marcos = true;
      this.trazar(l);
      return;
    }
    if (/^\s/.test(l)) {
      this.trazar(l);
      return;
    }
    const ex = /^([A-Za-z_][\w.]*)(?:: (.*))?$/.exec(l);
    if (ex && a.marcos) {
      a.e.tipo = limpio(ex[1]!, MAX_TIPO);
      a.e.mensaje = limpio(ex[2] ?? '', MAX_MENSAJE_ERROR);
      salida.push(...this.cerrar());
      return;
    }
    // Otra cosa en medio de un traceback: se descarta lo abierto.
    this.abierta = null;
  }

  private lineaNginx(l: string, salida: EntradaError[]): void {
    const m = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\] \d+#\d+: (?:\*\d+ )?(.*)$/.exec(
      l,
    );
    if (!m) {
      // Continuación de un mensaje de PHP que FastCGI mandó en varias líneas.
      if (this.abierta) {
        const sinCola = l.replace(/"\s+while .*$/, '');
        if (CONTINUA_PHP.test(sinCola)) this.trazar(sinCola);
        else salida.push(...this.cerrar());
      }
      return;
    }
    const [, f, nivel, msg] = m as unknown as [string, string, string, string];
    salida.push(...this.cerrar());
    if (!['error', 'crit', 'alert', 'emerg'].includes(nivel)) return;
    const fecha = fechaNumerica(f);
    const i = msg.indexOf('FastCGI sent in stderr: "');
    if (i >= 0) {
      const cuerpo = msg.slice(i + 'FastCGI sent in stderr: "'.length).replace(/"\s+while .*$/, '');
      const piezas = cuerpo.split('PHP message: ').filter((p) => p.trim() !== '');
      for (const p of piezas) {
        const cab = /^PHP ([A-Z][A-Za-z ]*?):\s+(.*)$/s.exec(p);
        if (cab) this.abrir({ ...partesPhp(cab[1]!, cab[2]!), fecha }, salida);
        else this.abrir({ tipo: 'PHP', mensaje: p, archivo: null, linea: null, fecha }, salida);
      }
      return;
    }
    const corte = msg.search(/, client: /);
    this.abrir(
      {
        tipo: `nginx ${nivel}`,
        mensaje: corte >= 0 ? msg.slice(0, corte) : msg,
        archivo: null,
        linea: null,
        fecha,
      },
      salida,
    );
    if (corte >= 0) this.trazar(msg.slice(corte + 2));
  }
}

/** Interpreta un conjunto de líneas completo (la última entrada también se entrega). */
export function interpretarLinea(
  formato: FormatoErrores,
  lineas: readonly string[],
): EntradaError[] {
  const i = new InterpreteErrores(formato);
  return [...i.agregar(lineas), ...i.cerrar()];
}

/* ───────────── Huella ───────────── */

/** Mensaje sin lo que cambia entre apariciones: rutas temporales, uuid, ids y números. */
export function normalizarMensaje(m: string): string {
  return m
    .replace(/[A-Za-z]:[\\/][^\s"']*?[\\/](?:Temp|tmp)[\\/][^\s"']+/gi, '<tmp>')
    .replace(/\/(?:var\/)?tmp\/[^\s"']+/g, '<tmp>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{8,}\b/gi, '<id>')
    .replace(/\d+/g, '<n>')
    .trim();
}

const archivoComparable = (a: string | null): string =>
  a === null ? '' : a.replace(/\\/g, '/').toLowerCase();

/** Huella de un error: tipo + mensaje normalizado + archivo:línea (16 hex). */
export function huellaError(
  e: Pick<EntradaError, 'tipo' | 'mensaje' | 'archivo' | 'linea'>,
): string {
  return createHash('sha256')
    .update(
      [e.tipo, normalizarMensaje(e.mensaje), archivoComparable(e.archivo), e.linea ?? ''].join(
        '\u0000',
      ),
    )
    .digest('hex')
    .slice(0, 16);
}

/** Qué intérprete corresponde a una fuente de registro (null: no se interpreta). */
export function formatoDeFuente(f: FuenteRegistro): FormatoErrores | null {
  if (f.grupo === 'php') return 'php';
  if (f.id === 'nginx:error') return 'nginx';
  if (f.grupo === 'sitio' && f.id.endsWith(':error')) return 'nginx';
  if (f.grupo === 'laravel') return 'laravel';
  if (f.grupo === 'ci3') return 'ci3';
  if (f.grupo === 'proyecto') return 'python';
  return null;
}

/* ───────────── Visor ───────────── */

export interface DepsVisorErrores {
  registros: Pick<Registros, 'fuentes' | 'seguir' | 'leerFinal'>;
  eventos: Eventos<EventosNucleo>;
  leerSitios(): Promise<Sitio[]>;
  ahora?: () => number;
  /** Espera sin líneas nuevas tras la que se cierra una entrada abierta (ms). */
  esperaCierreMs?: number;
  lineasIniciales?: number;
}

interface Seguida {
  fuente: FuenteRegistro;
  interprete: InterpreteErrores;
  dejar: (() => void) | null;
  temporizador: ReturnType<typeof setTimeout> | null;
}

/**
 * Errores agrupados de todas las fuentes con intérprete. Empieza a seguirlas la primera vez que
 * se pide la lista (lee el final de cada una y después solo lo nuevo, con `Registros.seguir`) y
 * vuelve a mirar las fuentes cuando cambian los sitios.
 */
export class VisorErrores {
  private readonly grupos = new Map<string, ErrorAgrupado>();
  private readonly seguidas = new Map<string, Seguida>();
  private sitios: Sitio[] = [];
  private iniciando: Promise<void> | null = null;
  private bajas: (() => void)[] = [];
  private cerrado = false;

  constructor(private readonly d: DepsVisorErrores) {}

  private ahora(): number {
    return this.d.ahora?.() ?? Date.now();
  }

  /** Empieza a seguir las fuentes (una sola vez). */
  iniciar(): Promise<void> {
    this.iniciando ??= this.arrancar();
    return this.iniciando;
  }

  private async arrancar(): Promise<void> {
    this.bajas.push(
      this.d.eventos.on('registro:lineas', ({ id, lineas }) => {
        const s = this.seguidas.get(id);
        if (s) this.recibir(s, lineas);
      }),
      this.d.eventos.on('sitio:cambio', () => {
        void this.actualizarFuentes().catch((e: unknown) =>
          console.error('No se pudieron actualizar las fuentes de errores:', e),
        );
      }),
    );
    await this.actualizarFuentes();
  }

  /** Sigue las fuentes nuevas y suelta las que ya no están. */
  async actualizarFuentes(): Promise<void> {
    if (this.cerrado) return;
    this.sitios = await this.d.leerSitios();
    const fuentes = (await this.d.registros.fuentes()).filter((f) => formatoDeFuente(f) !== null);
    const ids = new Set(fuentes.map((f) => f.id));
    for (const [id, s] of this.seguidas) {
      if (!ids.has(id)) this.soltar(s);
    }
    for (const f of fuentes) {
      if (this.seguidas.has(f.id) || this.cerrado) continue;
      const s: Seguida = {
        fuente: f,
        interprete: new InterpreteErrores(formatoDeFuente(f)!),
        dejar: null,
        temporizador: null,
      };
      this.seguidas.set(f.id, s);
      try {
        const final = await this.d.registros.leerFinal(
          f.id,
          this.d.lineasIniciales ?? LINEAS_INICIALES_ERRORES,
        );
        this.registrar(s, s.interprete.agregar(final));
        this.registrar(s, s.interprete.cerrar());
        const dejar = await this.d.registros.seguir(f.id);
        if (this.seguidas.get(f.id) === s && !this.cerrado) s.dejar = dejar;
        else dejar();
      } catch (e) {
        console.error(`No se pudo seguir ${f.id} para el visor de errores:`, e);
      }
    }
  }

  private soltar(s: Seguida): void {
    s.dejar?.();
    s.dejar = null;
    if (s.temporizador) clearTimeout(s.temporizador);
    s.temporizador = null;
    this.seguidas.delete(s.fuente.id);
  }

  private recibir(s: Seguida, lineas: string[]): void {
    this.registrar(s, s.interprete.agregar(lineas));
    if (s.temporizador) clearTimeout(s.temporizador);
    s.temporizador = null;
    // Una entrada abierta se cierra si no llega más traza en un rato.
    if (s.interprete.pendiente) {
      s.temporizador = setTimeout(() => {
        s.temporizador = null;
        this.registrar(s, s.interprete.cerrar());
      }, this.d.esperaCierreMs ?? 1500);
      s.temporizador.unref?.();
    }
  }

  private sitioDe(s: Seguida, archivo: string | null): string | null {
    if (s.fuente.sitioId) return s.fuente.sitioId;
    if (!archivo) return null;
    const a = archivoComparable(archivo);
    for (const x of this.sitios) {
      const c = archivoComparable(x.carpeta).replace(/\/+$/, '');
      if (c && a.startsWith(`${c}/`)) return x.id;
    }
    return null;
  }

  private registrar(s: Seguida, entradas: EntradaError[]): void {
    for (const e of entradas) {
      const huella = huellaError(e);
      const fecha = e.fecha ?? new Date(this.ahora()).toISOString();
      const g = this.grupos.get(huella);
      if (g) {
        g.veces++;
        if (fecha < g.primera) g.primera = fecha;
        if (fecha >= g.ultima) {
          g.ultima = fecha;
          g.mensaje = e.mensaje;
          g.traza = e.traza;
          g.fuenteId = s.fuente.id;
        }
        continue;
      }
      this.grupos.set(huella, {
        huella,
        tipo: e.tipo,
        mensaje: e.mensaje,
        archivo: e.archivo,
        linea: e.linea,
        sitioId: this.sitioDe(s, e.archivo),
        veces: 1,
        primera: fecha,
        ultima: fecha,
        traza: e.traza,
        fuenteId: s.fuente.id,
      });
      if (this.grupos.size > MAX_GRUPOS_ERRORES) this.descartarViejo();
    }
  }

  private descartarViejo(): void {
    let viejo: ErrorAgrupado | null = null;
    for (const g of this.grupos.values()) if (!viejo || g.ultima < viejo.ultima) viejo = g;
    if (viejo) this.grupos.delete(viejo.huella);
  }

  /** Grupos (sin traza), del más reciente al más viejo. */
  async lista(filtro: FiltroErrores = {}): Promise<ResumenError[]> {
    await this.iniciar();
    const res: ResumenError[] = [];
    for (const g of this.grupos.values()) {
      if (filtro.sitioId !== undefined && g.sitioId !== filtro.sitioId) continue;
      if (filtro.desde !== undefined && g.ultima < filtro.desde) continue;
      const resumen: ResumenError & { traza?: string[] } = { ...g };
      delete resumen.traza;
      res.push(resumen);
    }
    return res.sort((a, b) => (a.ultima < b.ultima ? 1 : a.ultima > b.ultima ? -1 : 0));
  }

  /** Un grupo con la traza de la última vez, o null. */
  async leer(huella: string): Promise<ErrorAgrupado | null> {
    await this.iniciar();
    const g = this.grupos.get(huella);
    return g ? { ...g, traza: [...g.traza] } : null;
  }

  limpiar(): void {
    this.grupos.clear();
  }

  cerrar(): void {
    this.cerrado = true;
    for (const b of this.bajas.splice(0)) b();
    for (const s of [...this.seguidas.values()]) this.soltar(s);
  }
}

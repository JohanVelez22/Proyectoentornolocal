import { createReadStream } from 'node:fs';
import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import vm from 'node:vm';
import { ErrorWolf } from '../errores';

/**
 * Búsqueda por palabra clave en un archivo o una carpeta (por nombre y por contenido).
 *
 * Entradas no confiables: la carpeta puede tener millones de archivos, enlaces en bucle,
 * binarios enormes o líneas de megabytes, y la expresión regular la escribe el usuario. Por eso
 * todo está acotado (archivos, profundidad, tamaño, resultados y tiempo), no se siguen enlaces ni
 * uniones, la lectura es por flujo y entre archivo y archivo se cede el turno al proceso. Las
 * expresiones regulares del usuario nunca corren sueltas: se ejecutan dentro de un contexto `vm`
 * con plazo, que corta el retroceso catastrófico (`(a+)+$`) en vez de colgar la aplicación.
 */

export interface OpcionesBusqueda {
  /** Archivo o carpeta donde buscar (el llamador ya validó de dónde sale). */
  raiz: string;
  consulta: string;
  modo: 'nombre' | 'contenido' | 'ambos';
  regex: boolean;
  mayusculas: boolean;
  /** Patrones de archivos que SÍ se miran (vacío = todos). `*`, `**` y `?`. */
  incluir: string[];
  /** Patrones de archivos y carpetas que se saltan. */
  excluir: string[];
}

export interface ResultadoBusqueda {
  archivo: string;
  /** Base 1; null en las coincidencias de nombre. */
  linea: number | null;
  columna: number | null;
  extracto: string;
}

export interface ResumenBusqueda {
  /** Archivos con al menos un resultado. */
  archivos: number;
  coincidencias: number;
  /** Se cortó por un tope (resultados, archivos o tiempo): hay más de lo que se muestra. */
  truncado: boolean;
  cancelado: boolean;
  /** Archivos leídos o comparados por nombre. */
  examinados: number;
  /** Binarios y archivos por encima del tamaño máximo que se saltaron. */
  omitidos: number;
}

export const EXCLUIR_POR_DEFECTO = [
  'node_modules',
  'vendor',
  '.git',
  '.venv',
  '__pycache__',
  'storage/framework',
] as const;

export const LIMITES_BUSQUEDA = {
  archivosConResultado: 10_000,
  coincidencias: 2_000,
  bytesPorArchivo: 5 * 1024 * 1024,
  profundidad: 40,
  /** Archivos revisados en total (con o sin resultado). */
  archivosExaminados: 200_000,
  /** Tiempo total de una búsqueda. */
  plazoMs: 60_000,
} as const;

export type LimitesBusqueda = { -readonly [K in keyof typeof LIMITES_BUSQUEDA]: number };

/** Plazo de cada llamada a una expresión regular del usuario (un trozo de archivo). */
export const PLAZO_REGEX_MS = 400;
export const MAX_CONSULTA = 500;
export const MAX_PATRONES = 50;
export const MAX_LARGO_PATRON = 200;
const BYTES_SONDEO = 8 * 1024;
const MAX_EXTRACTO = 240;
/** Cuántos trozos de línea se entregan juntos al motor de expresiones (acota el tiempo por llamada). */
const MAX_COINCIDENCIAS_POR_LINEA = 50;

export interface DepsBusqueda {
  ahora?: () => number;
  plazoRegexMs?: number;
  limites?: Partial<LimitesBusqueda>;
}

interface Hallazgo {
  /** Índice de la línea dentro del lote. */
  i: number;
  /** Índice base 0 dentro de la línea. */
  col: number;
}

/** Busca la consulta en un lote de líneas; devuelve cada coincidencia (línea y columna). */
type Comparador = (lineas: string[]) => Hallazgo[];

const escapar = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Comparador del texto literal: la consulta se escapa, así que la expresión resultante no puede
 * retroceder de forma catastrófica y corre directo.
 */
function comparadorLiteral(consulta: string, mayusculas: boolean): Comparador {
  const re = new RegExp(escapar(consulta), mayusculas ? 'g' : 'gi');
  return (lineas) => {
    const salida: Hallazgo[] = [];
    for (let i = 0; i < lineas.length; i++) {
      re.lastIndex = 0;
      let n = 0;
      for (let m = re.exec(lineas[i]!); m !== null && n < MAX_COINCIDENCIAS_POR_LINEA; n++) {
        salida.push({ i, col: m.index });
        m = re.exec(lineas[i]!);
      }
    }
    return salida;
  };
}

const PROGRAMA_REGEX = `
globalThis.__buscar = function (lineas, tope) {
  const salida = [];
  for (let i = 0; i < lineas.length; i++) {
    __re.lastIndex = 0;
    let n = 0;
    let m;
    while ((m = __re.exec(lineas[i])) !== null && n < tope) {
      salida.push(i, m.index);
      n++;
      if (m[0].length === 0) __re.lastIndex++;
    }
  }
  return salida;
};
`;

/**
 * Comparador de la expresión del usuario. La expresión se compila y se ejecuta en un contexto
 * aparte con `timeout`: V8 interrumpe el retroceso y la llamada falla con `ERR_SCRIPT_EXECUTION_TIMEOUT`.
 */
function comparadorRegex(consulta: string, mayusculas: boolean, plazoMs: number): Comparador {
  const flags = mayusculas ? 'gu' : 'giu';
  try {
    // Valida la sintaxis fuera del contexto (cuesta lo mismo y da un error claro).
    new RegExp(consulta, flags);
  } catch {
    try {
      new RegExp(consulta, flags.replace('u', ''));
    } catch {
      throw new ErrorWolf('buscar.regex_invalida', 'La expresión regular no es válida.');
    }
    // Válida sin la bandera u (p. ej. `\-`): se usa así.
    return comparadorRegexEn(consulta, flags.replace('u', ''), plazoMs);
  }
  return comparadorRegexEn(consulta, flags, plazoMs);
}

function comparadorRegexEn(consulta: string, flags: string, plazoMs: number): Comparador {
  const contexto = vm.createContext(Object.create(null) as object, {
    codeGeneration: { strings: false, wasm: false },
  });
  const arranque = new vm.Script(
    `globalThis.__re = new RegExp(${JSON.stringify(consulta)}, ${JSON.stringify(flags)});${PROGRAMA_REGEX}`,
  );
  arranque.runInContext(contexto);
  const llamada = new vm.Script('__buscar(__lineas, __tope)');
  return (lineas) => {
    (contexto as Record<string, unknown>)['__lineas'] = lineas;
    (contexto as Record<string, unknown>)['__tope'] = MAX_COINCIDENCIAS_POR_LINEA;
    let plano: unknown;
    try {
      plano = llamada.runInContext(contexto, { timeout: plazoMs });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        throw new ErrorWolf(
          'buscar.regex_lenta',
          'La expresión regular tarda demasiado: simplifíquela o use texto literal.',
        );
      }
      throw new ErrorWolf('buscar.regex_invalida', 'La expresión regular no es válida.');
    } finally {
      (contexto as Record<string, unknown>)['__lineas'] = undefined;
    }
    const arr = Array.from(plano as ArrayLike<number>);
    const salida: Hallazgo[] = [];
    for (let k = 0; k + 1 < arr.length; k += 2) salida.push({ i: arr[k]!, col: arr[k + 1]! });
    return salida;
  };
}

/** Glob muy simple (`*`, `**`, `?`) a expresión; el resto se escapa, así que no puede ser catastrófica. */
function globARegex(patron: string): RegExp {
  let r = '';
  for (let i = 0; i < patron.length; i++) {
    const c = patron[i]!;
    if (c === '*') {
      if (patron[i + 1] === '*') {
        while (patron[i + 1] === '*') i++;
        r += '.*';
      } else {
        r += '[^/]*';
      }
    } else if (c === '?') r += '[^/]';
    else r += escapar(c);
  }
  return new RegExp(`^${r}$`, 'i');
}

interface Patron {
  re: RegExp;
  /** Con "/" se compara contra la ruta relativa (o su final); si no, contra el nombre. */
  conRuta: boolean;
}

function compilarPatrones(lista: string[]): Patron[] {
  if (lista.length > MAX_PATRONES) {
    throw new ErrorWolf('buscar.consulta_invalida', 'Hay demasiados patrones.');
  }
  return lista
    .map((p) =>
      p
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\.?\//, '')
        .replace(/\/+$/, ''),
    )
    .filter((p) => p !== '')
    .map((p) => {
      if (p.length > MAX_LARGO_PATRON) {
        throw new ErrorWolf('buscar.consulta_invalida', 'Un patrón es demasiado largo.');
      }
      return { re: globARegex(p), conRuta: p.includes('/') };
    });
}

function coincidePatron(patrones: Patron[], nombre: string, relativa: string): boolean {
  return patrones.some((p) => {
    if (!p.conRuta) return p.re.test(nombre);
    if (p.re.test(relativa)) return true;
    // `storage/framework` también vale dentro de una subcarpeta: se prueba cada final de la ruta.
    const partes = relativa.split('/');
    for (let k = 1; k < partes.length; k++) {
      if (p.re.test(partes.slice(k).join('/'))) return true;
    }
    return false;
  });
}

function extractoDe(linea: string, col: number): string {
  const limpia = linea.replace(/\r$/, '');
  if (limpia.length <= MAX_EXTRACTO) return limpia;
  const ini = Math.max(0, Math.min(col - 60, limpia.length - MAX_EXTRACTO));
  return limpia.slice(ini, ini + MAX_EXTRACTO);
}

/** Cede el turno al bucle de eventos (la búsqueda nunca acapara el proceso principal). */
const ceder = (): Promise<void> => new Promise((r) => setImmediate(r));

class Corte extends Error {
  constructor(readonly motivo: 'resultados' | 'tiempo' | 'archivos' | 'cancelado') {
    super(motivo);
  }
}

export async function buscar(
  o: OpcionesBusqueda,
  alResultado: (r: ResultadoBusqueda) => void,
  senal: AbortSignal,
  deps: DepsBusqueda = {},
): Promise<ResumenBusqueda> {
  const limites: LimitesBusqueda = { ...LIMITES_BUSQUEDA, ...deps.limites };
  const ahora = deps.ahora ?? Date.now;
  const plazoRegex = deps.plazoRegexMs ?? PLAZO_REGEX_MS;

  if (
    typeof o.consulta !== 'string' ||
    o.consulta === '' ||
    o.consulta.length > MAX_CONSULTA ||
    !['nombre', 'contenido', 'ambos'].includes(o.modo)
  ) {
    throw new ErrorWolf('buscar.consulta_invalida', 'Escriba qué buscar (hasta 500 caracteres).');
  }
  const incluir = compilarPatrones(o.incluir);
  const excluir = compilarPatrones(o.excluir);
  const comparar = o.regex
    ? comparadorRegex(o.consulta, o.mayusculas, plazoRegex)
    : comparadorLiteral(o.consulta, o.mayusculas);

  let infoRaiz;
  try {
    infoRaiz = await lstat(o.raiz);
  } catch {
    throw new ErrorWolf('buscar.raiz_invalida', 'La carpeta o el archivo no existe.');
  }
  // La raíz misma no puede ser un enlace ni una unión: saldría de lo que el usuario eligió.
  if (infoRaiz.isSymbolicLink() || (!infoRaiz.isDirectory() && !infoRaiz.isFile())) {
    throw new ErrorWolf('buscar.raiz_invalida', 'La carpeta o el archivo no es válido.');
  }

  const inicio = ahora();
  const resumen: ResumenBusqueda = {
    archivos: 0,
    coincidencias: 0,
    truncado: false,
    cancelado: false,
    examinados: 0,
    omitidos: 0,
  };
  const porNombre = o.modo !== 'contenido';
  const porContenido = o.modo !== 'nombre';

  const revisar = (): void => {
    if (senal.aborted) throw new Corte('cancelado');
    if (ahora() - inicio > limites.plazoMs) throw new Corte('tiempo');
  };

  const emitir = (r: ResultadoBusqueda, nuevoArchivo: boolean): void => {
    if (nuevoArchivo) {
      if (resumen.archivos >= limites.archivosConResultado) throw new Corte('resultados');
      resumen.archivos++;
    }
    if (resumen.coincidencias >= limites.coincidencias) throw new Corte('resultados');
    resumen.coincidencias++;
    alResultado(r);
    // Llegar al tope ya corta: es posible que haya más, así que se marca como truncado.
    if (resumen.coincidencias >= limites.coincidencias) throw new Corte('resultados');
  };

  const leerContenido = async (
    archivo: string,
    tamano: number,
    estado: { tuvo: boolean },
  ): Promise<void> => {
    if (tamano > limites.bytesPorArchivo) {
      resumen.omitidos++;
      return;
    }
    const flujo = createReadStream(archivo, { highWaterMark: 64 * 1024 });
    const decodificador = new StringDecoder('utf8');
    let resto = '';
    let lineaBase = 1;
    let primero = true;
    let sondeado = false;
    let leidos = 0;

    const procesar = (texto: string, ultimo: boolean): void => {
      let t = resto + texto;
      if (primero && t.charCodeAt(0) === 0xfeff) t = t.slice(1);
      if (t !== '') primero = false;
      const partes = t.split('\n');
      resto = ultimo ? '' : (partes.pop() ?? '');
      if (ultimo && partes.length && partes[partes.length - 1] === '') partes.pop();
      if (partes.length === 0) return;
      for (const h of comparar(partes)) {
        const linea = partes[h.i]!;
        emitir(
          {
            archivo,
            linea: lineaBase + h.i,
            columna: h.col + 1,
            extracto: extractoDe(linea, h.col),
          },
          !estado.tuvo,
        );
        estado.tuvo = true;
      }
      lineaBase += partes.length;
    };

    try {
      for await (const trozo of flujo) {
        const buf = trozo as Buffer;
        if (!sondeado) {
          sondeado = true;
          if (buf.subarray(0, BYTES_SONDEO).includes(0)) {
            resumen.omitidos++;
            return;
          }
        }
        leidos += buf.length;
        if (leidos > limites.bytesPorArchivo) {
          // Creció mientras se leía: se deja lo ya revisado.
          resumen.omitidos++;
          return;
        }
        revisar();
        procesar(decodificador.write(buf), false);
      }
      procesar(decodificador.end(), true);
    } catch (e) {
      if (e instanceof Corte || e instanceof ErrorWolf) throw e;
      // Archivo bloqueado o que desapareció: se sigue con el siguiente.
      resumen.omitidos++;
    } finally {
      flujo.destroy();
    }
  };

  const mirarArchivo = async (archivo: string, relativa: string, tamano: number): Promise<void> => {
    revisar();
    if (resumen.examinados >= limites.archivosExaminados) throw new Corte('archivos');
    resumen.examinados++;
    const nombre = path.basename(archivo);
    if (incluir.length && !coincidePatron(incluir, nombre, relativa)) return;
    // Un archivo cuenta una sola vez aunque coincida por nombre y por contenido.
    const estado = { tuvo: false };
    if (porNombre && comparar([nombre]).length) {
      emitir({ archivo, linea: null, columna: null, extracto: nombre }, true);
      estado.tuvo = true;
    }
    if (porContenido) await leerContenido(archivo, tamano, estado);
  };

  const recorrer = async (dir: string, relDir: string, profundidad: number): Promise<void> => {
    revisar();
    let entradas;
    try {
      entradas = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entradas.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const subcarpetas: { ruta: string; rel: string }[] = [];
    for (const e of entradas) {
      revisar();
      // Los enlaces simbólicos y las uniones de Windows aparecen como enlace: no se siguen.
      if (e.isSymbolicLink()) continue;
      const ruta = path.join(dir, e.name);
      const rel = relDir === '' ? e.name : `${relDir}/${e.name}`;
      if (coincidePatron(excluir, e.name, rel)) continue;
      if (e.isDirectory()) {
        if (porNombre && incluir.length === 0 && comparar([e.name]).length) {
          emitir({ archivo: ruta, linea: null, columna: null, extracto: e.name }, true);
        }
        if (profundidad < limites.profundidad) subcarpetas.push({ ruta, rel });
      } else if (e.isFile()) {
        let tamano = 0;
        try {
          const info = await lstat(ruta);
          if (info.isSymbolicLink()) continue;
          tamano = info.size;
        } catch {
          continue;
        }
        await mirarArchivo(ruta, rel, tamano);
      }
    }
    for (const s of subcarpetas) {
      // Una unión que la lista no marcó como enlace se descarta aquí, antes de entrar.
      try {
        if ((await lstat(s.ruta)).isSymbolicLink()) continue;
      } catch {
        continue;
      }
      await ceder();
      await recorrer(s.ruta, s.rel, profundidad + 1);
    }
  };

  try {
    if (infoRaiz.isFile()) {
      await mirarArchivo(o.raiz, path.basename(o.raiz), infoRaiz.size);
    } else {
      await recorrer(o.raiz, '', 0);
    }
  } catch (e) {
    if (!(e instanceof Corte)) throw e;
    if (e.motivo === 'cancelado') resumen.cancelado = true;
    else resumen.truncado = true;
  }
  return resumen;
}

/* ───────────── Búsquedas en segundo plano ───────────── */

export const MAX_BUSQUEDAS_SIMULTANEAS = 3;
const LOTE_RESULTADOS = 50;
const ESPERA_LOTE_MS = 100;

export interface LoteBusqueda {
  id: string;
  resultados: ResultadoBusqueda[];
}

export interface FinBusqueda {
  id: string;
  resumen: ResumenBusqueda | null;
  error: { codigo: string; mensaje: string } | null;
}

export interface SalidaBusquedas {
  resultado(lote: LoteBusqueda): void;
  fin(fin: FinBusqueda): void;
}

/**
 * Las búsquedas en curso. `iniciar` vuelve enseguida con el id; los resultados salen en lotes
 * por `salida` y al final siempre sale un `fin` (con el resumen o con el error). Hay un máximo de
 * búsquedas a la vez y cada una se puede cancelar por su id.
 */
export class Busquedas {
  private readonly enCurso = new Map<string, AbortController>();
  private contador = 0;

  constructor(
    private readonly salida: SalidaBusquedas,
    private readonly deps: DepsBusqueda = {},
  ) {}

  iniciar(o: OpcionesBusqueda): string {
    if (this.enCurso.size >= MAX_BUSQUEDAS_SIMULTANEAS) {
      throw new ErrorWolf(
        'buscar.demasiadas',
        `Ya hay ${MAX_BUSQUEDAS_SIMULTANEAS} búsquedas en curso: cancele una o espere.`,
        { maximo: MAX_BUSQUEDAS_SIMULTANEAS },
      );
    }
    const id = `b${Date.now().toString(36)}${(++this.contador).toString(36)}`;
    const control = new AbortController();
    this.enCurso.set(id, control);
    void this.correr(id, o, control);
    return id;
  }

  cancelar(id: string): boolean {
    const c = this.enCurso.get(id);
    if (!c) return false;
    c.abort();
    return true;
  }

  cancelarTodas(): void {
    for (const c of this.enCurso.values()) c.abort();
  }

  private async correr(id: string, o: OpcionesBusqueda, control: AbortController): Promise<void> {
    let lote: ResultadoBusqueda[] = [];
    let temporizador: NodeJS.Timeout | null = null;
    const vaciar = (): void => {
      if (temporizador) clearTimeout(temporizador);
      temporizador = null;
      if (lote.length === 0) return;
      const resultados = lote;
      lote = [];
      this.salida.resultado({ id, resultados });
    };
    try {
      // Cede el turno antes de empezar: `iniciar` ya devolvió el id a quien lo pidió.
      await ceder();
      const resumen = await buscar(
        o,
        (r) => {
          lote.push(r);
          if (lote.length >= LOTE_RESULTADOS) vaciar();
          else temporizador ??= setTimeout(vaciar, ESPERA_LOTE_MS);
        },
        control.signal,
        this.deps,
      );
      vaciar();
      this.salida.fin({ id, resumen, error: null });
    } catch (e) {
      vaciar();
      const wolf = e instanceof ErrorWolf;
      this.salida.fin({
        id,
        resumen: null,
        error: {
          codigo: wolf ? e.codigo : 'buscar.fallo',
          mensaje: wolf ? e.message : 'La búsqueda falló.',
        },
      });
    } finally {
      this.enCurso.delete(id);
    }
  }
}

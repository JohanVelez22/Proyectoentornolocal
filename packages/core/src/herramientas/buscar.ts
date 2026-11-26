import { createReadStream } from 'node:fs';
import { lstat, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import vm from 'node:vm';
import { ErrorWolf } from '../errores';
import { rutaDentroDe } from '../plataforma/sistema';
import { crearDetectorSensible, sitiosConRutasReales } from './archivoSensible';

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
  /** Líneas de contexto antes y después de cada coincidencia de contenido (0 a 5; por omisión 2). */
  contexto?: number;
  /** `true`: también se miran las carpetas pesadas (node_modules, vendor, .git…). */
  incluirPesadas?: boolean;
  /** Carpetas que nunca se buscan (la carpeta de datos de WolfCore). Las pone el núcleo. */
  vetadas?: string[];
  /**
   * Sitios registrados (carpeta y si tienen datos reales). Los pone el núcleo: de los archivos
   * sensibles (`.env`, claves, datos reales, enlaces duros) solo se dice que coinciden en la línea N.
   */
  sitios?: () => Promise<readonly { carpeta: string; datosReales: boolean }[]>;
}

export interface ResultadoBusqueda {
  /** Número de resultado dentro de su búsqueda (1, 2, 3…): con él se pide abrirlo en el editor. */
  id: number;
  /** Por qué salió: el nombre del archivo o su contenido. */
  tipo: 'nombre' | 'contenido';
  archivo: string;
  /** Solo en las coincidencias de nombre: es una carpeta (no se abre en el editor). */
  esCarpeta: boolean;
  /** Base 1; null en las coincidencias de nombre. */
  linea: number | null;
  columna: number | null;
  /** La línea encontrada (recortada alrededor de la coincidencia) o el nombre. */
  extracto: string;
  /** Dónde empieza y cuánto mide la coincidencia dentro de `extracto`. */
  inicio: number;
  largo: number;
  /** Líneas de contexto (recortadas), de la más lejana a la más cercana. */
  antes: string[];
  despues: string[];
  /**
   * Archivo sensible (como en el editor de código): coincide en `linea`, pero no se entrega ni la
   * línea ni su contexto (`extracto` vacío).
   */
  sensible: boolean;
}

export interface ResumenBusqueda {
  /** Archivos con al menos un resultado. */
  archivos: number;
  coincidencias: number;
  /** Resultados por nombre y por contenido (suman `coincidencias`). */
  nombres: number;
  contenidos: number;
  /** Se cortó por un tope (resultados, archivos, bytes o tiempo): hay más de lo que se muestra. */
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
  /** Bytes leídos en total (de todos los archivos). */
  bytesTotales: 2 * 1024 * 1024 * 1024,
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
/** Largo máximo de cada línea de contexto. */
const MAX_LINEA_CONTEXTO = 200;
export const MAX_CONTEXTO = 5;
export const CONTEXTO_POR_OMISION = 2;
/** Extensiones que casi siempre son binarias: se compara el nombre pero no se abre el archivo. */
const EXTENSION_BINARIA =
  /\.(?:png|jpe?g|gif|webp|ico|bmp|tiff?|psd|zip|gz|tgz|bz2|xz|7z|rar|jar|war|exe|dll|so|dylib|bin|obj|class|pyc|pdf|woff2?|ttf|otf|eot|mp3|mp4|mkv|avi|mov|wav|flac|ogg|webm|sqlite3?|db|iso|dmg|msi)$/i;
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
  largo: number;
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
        salida.push({ i, col: m.index, largo: m[0].length });
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
      salida.push(i, m.index, m[0].length);
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
      // Sin pila para seguir retrocediendo (RangeError del motor): es una expresión demasiado costosa.
      if ((e as Error | null)?.name === 'RangeError') {
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
    for (let k = 0; k + 2 < arr.length; k += 3) {
      salida.push({ i: arr[k]!, col: arr[k + 1]!, largo: arr[k + 2]! });
    }
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

function extractoDe(linea: string, col: number): { texto: string; inicio: number } {
  const limpia = linea.replace(/\r$/, '');
  if (limpia.length <= MAX_EXTRACTO) return { texto: limpia, inicio: col };
  const ini = Math.max(0, Math.min(col - 60, limpia.length - MAX_EXTRACTO));
  return { texto: limpia.slice(ini, ini + MAX_EXTRACTO), inicio: col - ini };
}

const contextoDe = (linea: string): string => linea.replace(/\r$/, '').slice(0, MAX_LINEA_CONTEXTO);

/** Cede el turno al bucle de eventos (la búsqueda nunca acapara el proceso principal). */
const ceder = (): Promise<void> => new Promise((r) => setImmediate(r));

class Corte extends Error {
  constructor(readonly motivo: 'resultados' | 'tiempo' | 'archivos' | 'bytes' | 'cancelado') {
    super(motivo);
  }
}

/** `\\servidor\recurso`, `//x/y`, `\\?\` y `\\.\`: se saltarían el veto de la carpeta de datos. */
const esUnc = (r: string): boolean => /^[\\/]{2}/.test(r);

function resultadoDeNombre(
  archivo: string,
  nombre: string,
  esCarpeta: boolean,
  h: Hallazgo,
): Omit<ResultadoBusqueda, 'id'> {
  const { texto, inicio } = extractoDe(nombre, h.col);
  return {
    tipo: 'nombre',
    archivo,
    esCarpeta,
    linea: null,
    columna: null,
    extracto: texto,
    inicio,
    largo: Math.min(h.largo, texto.length - inicio),
    antes: [],
    despues: [],
    sensible: false,
  };
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
  const contexto = o.contexto ?? CONTEXTO_POR_OMISION;
  if (!Number.isInteger(contexto) || contexto < 0 || contexto > MAX_CONTEXTO) {
    throw new ErrorWolf('buscar.consulta_invalida', 'El contexto va de 0 a 5 líneas.');
  }
  const incluir = compilarPatrones(o.incluir);
  // Las carpetas pesadas se saltan salvo que se pida lo contrario (no depende de lo que mande la ventana).
  const excluir = compilarPatrones([
    ...(o.incluirPesadas === true ? [] : EXCLUIR_POR_DEFECTO),
    ...o.excluir,
  ]);
  const comparar = o.regex
    ? comparadorRegex(o.consulta, o.mayusculas, plazoRegex)
    : comparadorLiteral(o.consulta, o.mayusculas);

  // Rutas UNC fuera; y nada de lo que hay dentro de la carpeta de datos de WolfCore.
  if (esUnc(o.raiz)) {
    throw new ErrorWolf('buscar.raiz_invalida', 'La carpeta o el archivo no es válido.');
  }
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
  const raizReal = await realpath(o.raiz).catch(() => path.resolve(o.raiz));
  if (esUnc(raizReal)) {
    throw new ErrorWolf('buscar.raiz_invalida', 'La carpeta o el archivo no es válido.');
  }
  const vetadas: string[] = [];
  for (const v of o.vetadas ?? []) {
    vetadas.push(path.resolve(v));
    const real = await realpath(v).catch(() => null);
    if (real) vetadas.push(real);
  }
  // Si no se puede saber qué sitios hay, la búsqueda falla (no se arriesga a mostrar datos reales).
  const detector = crearDetectorSensible(await sitiosConRutasReales((await o.sitios?.()) ?? []));
  if (vetadas.some((v) => rutaDentroDe(v, raizReal) || rutaDentroDe(v, path.resolve(o.raiz)))) {
    throw new ErrorWolf(
      'buscar.ruta_vetada',
      'Esa carpeta es de datos de WolfCore Dev: no se busca dentro de ella.',
    );
  }

  const inicio = ahora();
  const resumen: ResumenBusqueda = {
    archivos: 0,
    coincidencias: 0,
    truncado: false,
    cancelado: false,
    examinados: 0,
    omitidos: 0,
    nombres: 0,
    contenidos: 0,
  };
  let bytesLeidos = 0;
  const porNombre = o.modo !== 'contenido';
  const porContenido = o.modo !== 'nombre';

  const revisar = (): void => {
    if (senal.aborted) throw new Corte('cancelado');
    if (ahora() - inicio > limites.plazoMs) throw new Corte('tiempo');
  };

  const emitir = (r: Omit<ResultadoBusqueda, 'id'>, nuevoArchivo: boolean): void => {
    if (nuevoArchivo) {
      if (resumen.archivos >= limites.archivosConResultado) throw new Corte('resultados');
      resumen.archivos++;
    }
    if (resumen.coincidencias >= limites.coincidencias) throw new Corte('resultados');
    resumen.coincidencias++;
    if (r.tipo === 'nombre') resumen.nombres++;
    else resumen.contenidos++;
    alResultado({ ...r, id: resumen.coincidencias });
    // Llegar al tope ya corta: es posible que haya más, así que se marca como truncado.
    if (resumen.coincidencias >= limites.coincidencias) throw new Corte('resultados');
  };

  const leerContenido = async (
    archivo: string,
    tamano: number,
    estado: { tuvo: boolean; sensible: boolean },
  ): Promise<void> => {
    if (tamano > limites.bytesPorArchivo || EXTENSION_BINARIA.test(archivo)) {
      resumen.omitidos++;
      return;
    }
    const flujo = createReadStream(archivo, { highWaterMark: 64 * 1024 });
    const decodificador = new StringDecoder('utf8');
    let resto = '';
    let primero = true;
    let sondeado = false;
    let leidos = 0;
    /** Líneas por revisar y, delante, hasta `contexto` ya revisadas (su contexto previo). */
    let lineas: string[] = [];
    let revisadas = 0;
    let primeraLinea = 1;
    /** Resultados del archivo: salen al terminar, porque un secreto puede aparecer en un trozo tardío. */
    const pendientes: Omit<ResultadoBusqueda, 'id'>[] = [];
    let colaPrevia = '';
    /** Cuántas coincidencias caben aún en el tope de la búsqueda: `pendientes` nunca lo pasa. */
    const restante = (): number => limites.coincidencias - resumen.coincidencias;
    /** Se llenó el cupo con este archivo: se deja de leer y la búsqueda queda truncada. */
    let lleno = false;

    const vaciar = (): void => {
      if (senal.aborted) return;
      for (const r of pendientes.splice(0)) {
        emitir(
          estado.sensible
            ? { ...r, extracto: '', inicio: 0, largo: 0, antes: [], despues: [], sensible: true }
            : r,
          !estado.tuvo,
        );
        estado.tuvo = true;
      }
    };

    const procesar = (texto: string, ultimo: boolean): void => {
      let t = resto + texto;
      if (primero && t.charCodeAt(0) === 0xfeff) t = t.slice(1);
      if (t !== '') primero = false;
      const partes = t.split('\n');
      resto = ultimo ? '' : (partes.pop() ?? '');
      if (ultimo && partes.length && partes[partes.length - 1] === '') partes.pop();
      lineas = lineas.concat(partes);
      // Se retienen las últimas `contexto` líneas hasta tener su contexto posterior.
      const hasta = ultimo ? lineas.length : Math.max(revisadas, lineas.length - contexto);
      if (hasta > revisadas) {
        const lote = lineas.slice(revisadas, hasta);
        for (const h of comparar(lote)) {
          // Un archivo con millones de coincidencias no acumula más de lo que cabe en el tope.
          if (pendientes.length >= restante()) {
            lleno = true;
            break;
          }
          const idx = revisadas + h.i;
          const { texto: extracto, inicio } = extractoDe(lineas[idx]!, h.col);
          pendientes.push({
            tipo: 'contenido',
            archivo,
            esCarpeta: false,
            linea: primeraLinea + idx,
            columna: h.col + 1,
            extracto,
            inicio,
            largo: Math.min(h.largo, extracto.length - inicio),
            antes: lineas.slice(Math.max(0, idx - contexto), idx).map(contextoDe),
            despues: lineas.slice(idx + 1, idx + 1 + contexto).map(contextoDe),
            sensible: false,
          });
        }
        revisadas = hasta;
      }
      const sobra = revisadas - contexto;
      if (sobra > 0) {
        lineas = lineas.slice(sobra);
        revisadas -= sobra;
        primeraLinea += sobra;
      }
    };

    let fallo: unknown = null;
    let terminado = false;
    try {
      for await (const trozo of flujo) {
        const buf = trozo as Buffer;
        if (!sondeado) {
          sondeado = true;
          if (buf.subarray(0, BYTES_SONDEO).includes(0)) {
            resumen.omitidos++;
            terminado = true;
            break;
          }
        }
        leidos += buf.length;
        bytesLeidos += buf.length;
        if (bytesLeidos > limites.bytesTotales) throw new Corte('bytes');
        if (leidos > limites.bytesPorArchivo) {
          // Creció mientras se leía: se deja lo ya revisado.
          resumen.omitidos++;
          terminado = true;
          break;
        }
        revisar();
        const texto = decodificador.write(buf);
        // Un secreto en el contenido (también partido entre dos trozos) vuelve sensible el archivo.
        if (!estado.sensible && detector.porContenido(colaPrevia + texto)) estado.sensible = true;
        colaPrevia = texto.slice(-400);
        // Con el cupo lleno ya no se busca, pero se sigue leyendo (solo para ver si el archivo resulta
        // sensible más adelante: entonces lo que ya está pendiente sale oculto).
        if (!lleno) procesar(texto, false);
        else if (estado.sensible) break;
      }
      if (!terminado && !lleno) procesar(decodificador.end(), true);
    } catch (e) {
      fallo = e;
    } finally {
      flujo.destroy();
    }
    // Un error del propio archivo (expresión lenta o inválida) o una cancelación salen tal cual: no se
    // vuelcan los pendientes ni se deja que otro corte tape el error original.
    if (fallo instanceof ErrorWolf) throw fallo;
    if (fallo instanceof Corte && fallo.motivo === 'cancelado') throw fallo;
    // Archivo bloqueado o que desapareció: se sigue con el siguiente.
    if (fallo !== null && !(fallo instanceof Corte)) resumen.omitidos++;
    vaciar();
    if (fallo instanceof Corte) throw fallo;
  };

  /** Ruta REAL de algo que se recorre desde la raíz (no hay enlaces dentro: se parte de `raizReal`). */
  const realDe = (rel: string): string =>
    rel === '' ? raizReal : path.join(raizReal, ...rel.split('/'));

  const mirarArchivo = async (
    archivo: string,
    relativa: string,
    tamano: number,
    enlaces: number,
  ): Promise<void> => {
    revisar();
    if (resumen.examinados >= limites.archivosExaminados) throw new Corte('archivos');
    resumen.examinados++;
    const nombre = path.basename(archivo);
    if (incluir.length && !coincidePatron(incluir, nombre, relativa)) return;
    // Un archivo cuenta una sola vez aunque coincida por nombre y por contenido.
    const estado = {
      tuvo: false,
      sensible: detector.porRuta(infoRaiz.isFile() ? raizReal : realDe(relativa), enlaces),
    };
    const porEnNombre = porNombre ? comparar([nombre])[0] : undefined;
    if (porEnNombre) {
      emitir(resultadoDeNombre(archivo, nombre, false, porEnNombre), true);
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
        // Nunca se entra en la carpeta de datos de WolfCore (si la raíz la contiene).
        // Se compara también la ruta real: una unión o un nombre 8.3 en la raíz no la esquivan.
        const real = realDe(rel);
        if (vetadas.some((v) => rutaDentroDe(v, ruta) || rutaDentroDe(v, real))) continue;
        const enNombre = porNombre && incluir.length === 0 ? comparar([e.name])[0] : undefined;
        if (enNombre) emitir(resultadoDeNombre(ruta, e.name, true, enNombre), true);
        if (profundidad < limites.profundidad) subcarpetas.push({ ruta, rel });
      } else if (e.isFile()) {
        let tamano = 0;
        let enlaces = 1;
        try {
          const info = await lstat(ruta);
          if (info.isSymbolicLink()) continue;
          tamano = info.size;
          enlaces = info.nlink;
        } catch {
          continue;
        }
        await mirarArchivo(ruta, rel, tamano, enlaces);
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
      await mirarArchivo(o.raiz, path.basename(o.raiz), infoRaiz.size, infoRaiz.nlink);
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
/** Cuánto vive el registro de resultados de una búsqueda terminada (para abrirlos en el editor). */
export const CADUCIDAD_RESULTADOS_MS = 15 * 60 * 1000;
/** Búsquedas con resultados guardados a la vez (las más viejas se olvidan). */
const MAX_BUSQUEDAS_GUARDADAS = 6;
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
  /**
   * Resultados que produjo el propio núcleo, por búsqueda y por número. La ventana nunca aporta una
   * ruta: pide abrir «el resultado 7 de la búsqueda b3» y la ruta sale de aquí.
   */
  private readonly guardadas = new Map<
    string,
    { resultados: Map<number, { archivo: string; esCarpeta: boolean }>; expira: number }
  >();

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
    this.guardadas.set(id, { resultados: new Map(), expira: Number.POSITIVE_INFINITY });
    while (this.guardadas.size > MAX_BUSQUEDAS_GUARDADAS) {
      const vieja = [...this.guardadas.keys()].find((k) => !this.enCurso.has(k));
      if (vieja === undefined) break;
      this.guardadas.delete(vieja);
    }
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

  /**
   * Ruta absoluta del resultado `idResultado` de la búsqueda `idBusqueda`, solo si lo produjo el
   * núcleo, no caducó, es un archivo normal (no una carpeta ni un enlace) y sigue existiendo.
   */
  async rutaDeResultado(idBusqueda: string, idResultado: number): Promise<string> {
    const ahora = this.deps.ahora ?? Date.now;
    const g = this.guardadas.get(idBusqueda);
    if (!g || g.expira < ahora()) {
      this.guardadas.delete(idBusqueda);
      throw new ErrorWolf(
        'buscar.resultado_caducado',
        'Ese resultado ya no está disponible: vuelva a buscar.',
      );
    }
    const r = g.resultados.get(idResultado);
    if (!r || r.esCarpeta) {
      throw new ErrorWolf('buscar.resultado_invalido', 'Ese resultado no se puede abrir.');
    }
    try {
      const info = await lstat(r.archivo);
      if (!info.isFile() || info.isSymbolicLink()) throw new Error('no es un archivo normal');
    } catch {
      throw new ErrorWolf(
        'buscar.resultado_caducado',
        'Ese resultado ya no está disponible: vuelva a buscar.',
      );
    }
    return r.archivo;
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
          const g = this.guardadas.get(id);
          if (g && g.resultados.size < LIMITES_BUSQUEDA.coincidencias) {
            g.resultados.set(r.id, { archivo: r.archivo, esCarpeta: r.esCarpeta });
          }
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
      const g = this.guardadas.get(id);
      if (g) g.expira = (this.deps.ahora ?? Date.now)() + CADUCIDAD_RESULTADOS_MS;
    }
  }
}

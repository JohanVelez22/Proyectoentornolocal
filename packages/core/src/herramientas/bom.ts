import { randomBytes } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, lstat, open, readdir, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';

export interface ResultadoBom {
  archivo: string;
  teniaBom: boolean;
  /** Copia del original (solo en modo real y si tenía BOM). */
  copia?: string;
  /** Motivo por el que no se pudo limpiar (el resto de archivos sigue). */
  error?: string;
}

export interface OpcionesBom {
  simular: boolean;
  /** Bytes; los archivos más grandes se omiten. 20 MB por defecto. */
  tamanoMaximo?: number;
}

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
/** Tamaño máximo por archivo (20 MB): los más grandes se omiten. */
export const TAMANO_MAXIMO_BOM = 20 * 1024 * 1024;
const MAX_ARCHIVOS = 100_000;
const BYTES_SONDEO = 8000;
const SUFIJO_COPIA = '.bak-bom';

const CARPETAS_OMITIDAS = new Set(['node_modules', 'vendor', '.git']);

const EXTENSIONES_BINARIAS = new Set(
  (
    'png jpg jpeg gif bmp ico webp avif tif tiff psd ' +
    'zip gz tgz bz2 xz 7z rar tar jar war phar ' +
    'exe dll so dylib bin obj o a lib pdb class pyc pyo wasm node ' +
    'pdf doc docx xls xlsx ppt pptx odt ods ' +
    'mp3 mp4 m4a wav ogg flac avi mov mkv webm ' +
    'woff woff2 ttf otf eot ' +
    'sqlite sqlite3 db mdb iso dmg msi cab'
  ).split(' '),
);

const esCopia = (nombre: string): boolean => /\.bak-bom(\.\d+)?$/i.test(nombre);

const esBinarioPorExtension = (archivo: string): boolean =>
  EXTENSIONES_BINARIAS.has(path.extname(archivo).slice(1).toLowerCase());

/** Archivos candidatos: recorre carpetas sin seguir enlaces ni uniones y sin las omitidas. */
async function reunir(rutas: string[], tope: number): Promise<string[]> {
  const res: string[] = [];
  const vistos = new Set<string>();
  const agregar = (f: string): void => {
    const clave = f.toLowerCase();
    if (vistos.has(clave)) return;
    vistos.add(clave);
    if (res.length >= MAX_ARCHIVOS) {
      throw new Error(
        `Hay demasiados archivos (más de ${MAX_ARCHIVOS}); elija una carpeta más concreta.`,
      );
    }
    res.push(f);
  };
  const recorrer = async (dir: string): Promise<void> => {
    let entradas;
    try {
      entradas = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entradas.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entradas) {
      // Los enlaces simbólicos y las uniones de Windows aparecen como enlace: no se siguen.
      if (e.isSymbolicLink()) continue;
      const ruta = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!CARPETAS_OMITIDAS.has(e.name.toLowerCase())) await recorrer(ruta);
      } else if (e.isFile() && !esCopia(e.name) && !esBinarioPorExtension(e.name)) {
        try {
          if ((await lstat(ruta)).size <= tope) agregar(ruta);
        } catch {
          // Desapareció mientras se recorría.
        }
      }
    }
  };
  for (const r of rutas) {
    const info = await lstat(r);
    if (info.isSymbolicLink()) continue;
    if (info.isDirectory()) await recorrer(r);
    else if (info.isFile() && !esCopia(r) && !esBinarioPorExtension(r) && info.size <= tope)
      agregar(r);
  }
  return res;
}

/** Primera ruta libre `<archivo>.bak-bom`, `.bak-bom.1`, `.bak-bom.2`… (nunca sobrescribe). */
async function crearCopia(archivo: string): Promise<string> {
  for (let i = 0; i < 1000; i++) {
    const destino = `${archivo}${SUFIJO_COPIA}${i === 0 ? '' : `.${i}`}`;
    try {
      await copyFile(archivo, destino, constants.COPYFILE_EXCL);
      return destino;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    }
  }
  throw new Error('Hay demasiadas copias .bak-bom de este archivo.');
}

/** Escribe en un temporal de la misma carpeta y lo renombra encima: nunca queda a medias. */
async function escribirAtomico(archivo: string, datos: Buffer): Promise<void> {
  const tmp = path.join(
    path.dirname(archivo),
    `.${path.basename(archivo)}.${randomBytes(4).toString('hex')}.tmp-bom`,
  );
  try {
    const f = await open(tmp, 'wx');
    try {
      await f.writeFile(datos);
      await f.sync();
    } finally {
      await f.close();
    }
    await rename(tmp, archivo);
  } catch (e) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
}

const mensaje = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Detecta (y en modo real quita) el BOM UTF-8 de los archivos de texto de `rutas` (archivos o
 * carpetas absolutos, elegidos en un diálogo). Antes de escribir guarda una copia `.bak-bom`;
 * solo se quitan los 3 bytes del BOM, el resto queda idéntico byte a byte.
 */
export async function limpiarBom(rutas: string[], o: OpcionesBom): Promise<ResultadoBom[]> {
  if (!Array.isArray(rutas) || rutas.length === 0)
    throw new Error('Elija al menos un archivo o carpeta.');
  for (const r of rutas) {
    if (typeof r !== 'string' || !path.isAbsolute(r)) {
      throw new Error(`La ruta debe ser absoluta: ${String(r)}`);
    }
    try {
      await lstat(r);
    } catch {
      throw new Error(`La ruta no existe: ${r}`);
    }
  }
  const tope = o.tamanoMaximo ?? TAMANO_MAXIMO_BOM;
  const res: ResultadoBom[] = [];
  for (const archivo of await reunir(
    rutas.map((r) => path.resolve(r)),
    tope,
  )) {
    let datos: Buffer;
    try {
      datos = await readFile(archivo);
    } catch {
      continue;
    }
    if (datos.length > tope || datos.subarray(0, BYTES_SONDEO).includes(0)) continue;
    const teniaBom = datos.length >= 3 && datos.subarray(0, 3).equals(BOM);
    if (!teniaBom || o.simular) {
      res.push({ archivo, teniaBom });
      continue;
    }
    let copia: string | undefined;
    try {
      copia = await crearCopia(archivo);
      await escribirAtomico(archivo, datos.subarray(3));
      res.push({ archivo, teniaBom, copia });
    } catch (e) {
      res.push({
        archivo,
        teniaBom,
        ...(copia ? { copia } : {}),
        error: `No se pudo quitar el BOM: ${mensaje(e)}`,
      });
    }
  }
  return res;
}

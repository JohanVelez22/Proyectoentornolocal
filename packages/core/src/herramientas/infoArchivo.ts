import { createHash } from 'node:crypto';
import { lstat, open } from 'node:fs/promises';
import path from 'node:path';
import { nombreSensibleCompartir, tipoDe } from '../compartir/contenido';
import { ErrorWolf } from '../errores';
import type { AtributosArchivo, PlataformaCompleta } from '../plataforma/tipos';
import { esNombreArchivoEnv } from '../proyectos/env/leer';
import { NOMBRE_SECRETO } from './editorCodigo';
import { dimensionesImagen, type DimensionesImagen } from './imagenes';

/**
 * «Info de archivo» (D55): datos de un archivo o carpeta que el usuario eligió o soltó en la
 * ventana. SOLO LECTURA: nada se modifica ni se abre más de lo necesario.
 *
 * - La ruta es una entrada no confiable: se valida (absoluta, sin `\\?\`, sin UNC, sin `..`, sin
 *   flujos alternativos de NTFS) antes de tocar el disco, y no se sigue ningún enlace ni unión.
 * - Un archivo sensible (`.env`, claves, credenciales) muestra solo sus metadatos: ni se lee su
 *   cabecera para saber el tipo. Su hash se calcula igual que el de cualquiera (si no pasa del
 *   tope); un hash no deja ver el contenido.
 * - Los hashes se calculan por flujo, sin cargar el archivo entero en memoria.
 */

/** Tope de peso para calcular hashes (el mismo que ya usaba la herramienta). */
export const TOPE_HASH_BYTES = 200 * 1024 * 1024;
/** Lo que se lee del principio del archivo para reconocer su tipo y las dimensiones de una imagen. */
const BYTES_CABECERA = 256 * 1024;
const MAX_RUTA = 1024;

const invalida = (): ErrorWolf =>
  new ErrorWolf('info.ruta_invalida', 'La ruta no es válida: debe ser absoluta y local.');

const sinRuta = (): ErrorWolf =>
  new ErrorWolf(
    'info.sin_ruta',
    'Este elemento no es un archivo del disco: guárdelo primero en una carpeta.',
  );

/**
 * Comprueba la forma de la ruta y la devuelve normalizada. Acepta `C:\carpeta\archivo` (con `\` o
 * `/`) y rutas absolutas de POSIX; rechaza lo demás: relativas, UNC y de dispositivo (`\\?\`,
 * `\\.\`), con `..`, con caracteres de control o reservados de Windows y con `:` después de la
 * unidad (flujos alternativos de NTFS).
 */
export function validarRutaInfo(ruta: unknown): string {
  // Un elemento virtual (adjunto, algo dentro de un zip) no tiene ruta en el disco.
  if (ruta === '') throw sinRuta();
  if (typeof ruta !== 'string' || ruta.length < 2 || ruta.length > MAX_RUTA) throw invalida();
  if ([...ruta].some((c) => c.charCodeAt(0) < 0x20)) throw invalida();
  const unidad = /^[A-Za-z]:[\\/]/.test(ruta);
  // En POSIX una sola barra inicial; dos (UNC o `\\?\`) nunca.
  const posix = /^\/(?![\\/])/.test(ruta);
  if (!unidad && !posix) throw invalida();
  const resto = unidad ? ruta.slice(2) : ruta;
  if (/[<>"|?*:]/.test(resto)) throw invalida();
  if (resto.split(/[\\/]/).some((p) => p === '..')) throw invalida();
  return path.resolve(ruta);
}

/** Archivos con credenciales o claves: de ellos solo se muestran los metadatos. */
export function esArchivoSensible(ruta: string): boolean {
  const nombre = path.basename(ruta);
  return (
    esNombreArchivoEnv(nombre) || NOMBRE_SECRETO.test(nombre) || nombreSensibleCompartir(nombre)
  );
}

export type DecisionHash = 'calcular' | 'grande';

/** ¿Se calculan los hashes? Solo si el archivo no pasa del tope (también los sensibles). */
export function decidirHash(tamano: number, tope: number = TOPE_HASH_BYTES): DecisionHash {
  return tamano <= tope ? 'calcular' : 'grande';
}

const MIME_EXTENSION: Record<string, string> = {
  php: 'application/x-httpd-php',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  jsx: 'text/javascript',
  vue: 'text/x-vue',
  yml: 'application/yaml',
  yaml: 'application/yaml',
  toml: 'application/toml',
  ini: 'text/plain',
  env: 'text/plain',
  gitignore: 'text/plain',
  gitattributes: 'text/plain',
  editorconfig: 'text/plain',
  npmrc: 'text/plain',
  dockerignore: 'text/plain',
  sql: 'application/sql',
  sh: 'application/x-sh',
  ps1: 'text/plain',
  bat: 'text/plain',
  exe: 'application/vnd.microsoft.portable-executable',
  dll: 'application/vnd.microsoft.portable-executable',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rar: 'application/vnd.rar',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  avif: 'image/avif',
};

const ascii = (b: Uint8Array, desde: number, texto: string): boolean =>
  b.length >= desde + texto.length && [...texto].every((c, i) => b[desde + i] === c.charCodeAt(0));

/** Tipo por la firma (los primeros bytes), o null si no se reconoce. */
export function mimePorFirma(b: Uint8Array): string | null {
  if (b.length >= 8 && b[0] === 0x89 && ascii(b, 1, 'PNG')) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (ascii(b, 0, 'GIF87a') || ascii(b, 0, 'GIF89a')) return 'image/gif';
  if (ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP')) return 'image/webp';
  if (ascii(b, 0, '%PDF-')) return 'application/pdf';
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4) {
    return 'application/zip';
  }
  if (b.length >= 3 && b[0] === 0x1f && b[1] === 0x8b) return 'application/gzip';
  if (b.length >= 6 && b[0] === 0x37 && b[1] === 0x7a && b[2] === 0xbc && b[3] === 0xaf) {
    return 'application/x-7z-compressed';
  }
  if (ascii(b, 0, 'Rar!')) return 'application/vnd.rar';
  if (ascii(b, 0, 'MZ')) return 'application/vnd.microsoft.portable-executable';
  if (b.length >= 4 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) return 'image/x-icon';
  if (ascii(b, 0, 'BM') && b.length >= 26) return 'image/bmp';
  return null;
}

/** Tipo por la extensión del nombre, o null si no se conoce. */
export function mimePorExtension(nombre: string): string | null {
  let ext = path.extname(nombre).slice(1).toLowerCase();
  // «.env», «.gitignore»: un nombre que empieza por punto y no tiene extensión toma el tipo de su nombre.
  if (ext === '' && /^\.[^.]+$/.test(nombre)) ext = nombre.slice(1).toLowerCase();
  if (ext === '') return null;
  const propio = Object.hasOwn(MIME_EXTENSION, ext) ? MIME_EXTENSION[ext] : undefined;
  if (propio) return propio;
  const t = tipoDe(`x.${ext}`);
  return t.tipo === 'application/octet-stream' ? null : (t.tipo.split(';')[0] ?? null);
}

export interface InfoRuta {
  /** Ruta normalizada que se consultó. */
  ruta: string;
  nombre: string;
  tipo: 'archivo' | 'carpeta';
  /** Bytes del archivo; null en una carpeta (su tamaño sale del análisis de Uso del disco). */
  tamano: number | null;
  extension: string;
  /** Tipo por la firma y, si no hay, por la extensión; null si no se sabe. */
  mime: string | null;
  /** Fechas en milisegundos desde 1970. */
  creado: number;
  modificado: number;
  accedido: number;
  /** null si el sistema no lo pudo decir. */
  soloLectura: boolean | null;
  oculto: boolean | null;
  imagen: DimensionesImagen | null;
  sensible: boolean;
  /** Si se pueden calcular los hashes; en una carpeta no aplica. */
  hash: DecisionHash | 'no_aplica';
}

export interface DepsInfoRuta {
  plataforma: Pick<PlataformaCompleta, 'atributosArchivo'>;
}

async function estadoDe(ruta: string) {
  try {
    const e = await lstat(ruta);
    if (e.isSymbolicLink()) {
      throw new ErrorWolf('info.enlace', 'Es un enlace: elija el archivo o la carpeta de destino.');
    }
    if (!e.isFile() && !e.isDirectory()) throw invalida();
    return e;
  } catch (e) {
    if (e instanceof ErrorWolf) throw e;
    const codigo = (e as NodeJS.ErrnoException).code;
    if (codigo === 'ENOENT' || codigo === 'ENOTDIR') {
      throw new ErrorWolf('info.no_existe', 'El archivo o la carpeta no existe.');
    }
    throw invalida();
  }
}

async function cabecera(ruta: string, tamano: number): Promise<Uint8Array> {
  const f = await open(ruta, 'r');
  try {
    const buf = Buffer.alloc(Math.min(tamano, BYTES_CABECERA));
    const { bytesRead } = await f.read(buf, 0, buf.length, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await f.close();
  }
}

/** Metadatos de un archivo o carpeta. No calcula hashes ni recorre carpetas. */
export async function leerInfoRuta(ruta: unknown, deps: DepsInfoRuta): Promise<InfoRuta> {
  const real = validarRutaInfo(ruta);
  const e = await estadoDe(real);
  const esArchivo = e.isFile();
  const nombre = path.basename(real) || real;
  const sensible = esArchivo && esArchivoSensible(real);
  let mime: string | null = esArchivo ? mimePorExtension(nombre) : null;
  let imagen: DimensionesImagen | null = null;
  // De un archivo sensible no se lee ni la cabecera: el tipo sale solo del nombre.
  if (esArchivo && !sensible) {
    try {
      const c = await cabecera(real, e.size);
      mime = mimePorFirma(c) ?? mime;
      imagen = dimensionesImagen(c);
    } catch {
      // Sin permiso de lectura: se muestran los demás datos.
    }
  }
  const atributos: AtributosArchivo | null = await deps.plataforma
    .atributosArchivo(real)
    .catch(() => null);
  return {
    ruta: real,
    nombre,
    tipo: esArchivo ? 'archivo' : 'carpeta',
    tamano: esArchivo ? e.size : null,
    extension: esArchivo ? path.extname(nombre).slice(1).toLowerCase() : '',
    mime,
    creado: e.birthtimeMs,
    modificado: e.mtimeMs,
    accedido: e.atimeMs,
    soloLectura: atributos?.soloLectura ?? null,
    oculto: atributos?.oculto ?? null,
    imagen,
    sensible,
    hash: esArchivo ? decidirHash(e.size) : 'no_aplica',
  };
}

export interface HashesArchivo {
  md5: string;
  sha1: string;
  sha256: string;
}

/**
 * MD5, SHA-1 y SHA-256 de un archivo, por flujo. Se rechaza lo que pase del tope (también si
 * creció después de consultarlo).
 */
export async function calcularHashesRuta(
  ruta: unknown,
  tope: number = TOPE_HASH_BYTES,
): Promise<HashesArchivo> {
  const real = validarRutaInfo(ruta);
  const e = await estadoDe(real);
  if (!e.isFile()) throw invalida();
  if (decidirHash(e.size, tope) === 'grande') {
    throw new ErrorWolf(
      'info.hash_grande',
      'El archivo es demasiado grande para calcular hashes.',
      { maximo: Math.round(tope / (1024 * 1024)) },
    );
  }
  const md5 = createHash('md5');
  const sha1 = createHash('sha1');
  const sha256 = createHash('sha256');
  const f = await open(real, 'r');
  try {
    // Mismo archivo que vio `lstat` (no un enlace puesto en medio) y sin pasar del tope.
    const actual = await f.stat();
    if (!actual.isFile() || actual.size > tope) throw invalida();
    if (actual.dev !== e.dev || actual.ino !== e.ino) throw invalida();
    const buf = Buffer.alloc(1024 * 1024);
    let leidos = 0;
    for (;;) {
      const { bytesRead } = await f.read(buf, 0, buf.length, null);
      if (bytesRead === 0) break;
      leidos += bytesRead;
      if (leidos > tope) throw invalida();
      const trozo = buf.subarray(0, bytesRead);
      md5.update(trozo);
      sha1.update(trozo);
      sha256.update(trozo);
    }
  } finally {
    await f.close();
  }
  return { md5: md5.digest('hex'), sha1: sha1.digest('hex'), sha256: sha256.digest('hex') };
}

import path from 'node:path';
import type { DetectorSensible } from '../herramientas/archivoSensible';

/**
 * Piezas puras de «Compartir carpeta o archivo» (D52): qué se sirve, con qué tipo, cómo se escribe
 * el listado y cómo se lee una ruta pedida por la red. Nada de aquí toca el disco.
 */

/** Carpetas que nunca se sirven (ni se listan) dentro de lo compartido, en cualquier nivel. */
export const CARPETAS_PROHIBIDAS = [
  '.git',
  '.svn',
  '.hg',
  '.ssh',
  '.gnupg',
  '.aws',
  '.azure',
  '.kube',
  '.docker',
  '.gcloud',
  '.oci',
] as const;
const PROHIBIDAS = new Set<string>(CARPETAS_PROHIBIDAS);

/**
 * Carpetas que además no se sirven ni se listan DENTRO de lo compartido (datos y claves de
 * programas), pero que no impiden compartir una carpeta que las tenga en su raíz (un proyecto con
 * `.vscode` o `.idea` se puede compartir; esas carpetas simplemente no salen).
 */
export const CARPETAS_OCULTAS = [
  'appdata',
  '.claude',
  '.codex',
  '.gemini',
  '.config',
  '.local',
  '.npm',
  '.m2',
  '.gradle',
  '.cargo',
  '.nuget',
  '.vscode',
  '.idea',
  '.mozilla',
  '.pki',
  '.terraform.d',
] as const;
const OCULTAS = new Set<string>([...CARPETAS_PROHIBIDAS, ...CARPETAS_OCULTAS]);

/** ¿Es una carpeta que nunca se sirve dentro de lo compartido ni se elige para compartir? */
export const esCarpetaProhibida = (nombre: string): boolean => OCULTAS.has(nombre.toLowerCase());

/** ¿Es una carpeta de claves (la lista corta): compartir una carpeta que la tiene en su raíz se rechaza? */
export const esCarpetaDeClaves = (nombre: string): boolean => PROHIBIDAS.has(nombre.toLowerCase());

/**
 * Archivos con credenciales o datos de sesión de programas comunes (navegadores, FTP, editores,
 * gestores de paquetes, claves). Es la regla propia de compartir: se suma a la de `archivoSensible`
 * sin cambiar lo que esa regla decide en el editor, Buscar o el Diff.
 */
const NOMBRE_SENSIBLE =
  /^(?:cookies(?:.sqlite.*)?|key[34].db|logins.json|login data(?: for account)?(?:-journal)?|web data(?:-journal)?|sitemanager.xml|recentservers.xml|filezilla.xml|state.vscdb(?:.backup)?|.pypirc|.npmrc|.netrc|_netrc|.pgpass|.git-credentials|.htpasswd|id_[^.]*|.*.(?:kdbx|pfx|p12|ppk|jks|keystore|pem|key))$/i;

export const nombreSensibleCompartir = (nombre: string): boolean => NOMBRE_SENSIBLE.test(nombre);

/** La regla de archivo sensible de D43/D44 más los nombres de credenciales de `NOMBRE_SENSIBLE`. */
export function detectorCompartir(base: DetectorSensible): DetectorSensible {
  return {
    porRuta: (ruta, enlaces) =>
      nombreSensibleCompartir(path.basename(ruta)) || base.porRuta(ruta, enlaces),
    porContenido: (c) => base.porContenido(c),
  };
}

/** Binarios que se sirven aunque pasen del tamaño que se puede revisar: medios y paquetes. */
const BINARIOS_GRANDES = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'bmp',
  'ico',
  'mp3',
  'wav',
  'ogg',
  'flac',
  'mp4',
  'webm',
  'mkv',
  'mov',
  'zip',
  '7z',
  'iso',
  'pdf',
  'gz',
  'tar',
]);
export const esBinarioGrande = (nombre: string): boolean =>
  BINARIOS_GRANDES.has(path.extname(nombre).slice(1).toLowerCase());

/** Nombres reservados de Windows (con o sin extensión): `CON`, `nul.txt`, `COM1`… */
const RESERVADO = /^(?:con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])(?:\..*)?$/i;

/**
 * ¿Es un nombre de archivo o carpeta que se puede pedir? Rechaza lo que en Windows significa otra
 * cosa: `..`, flujos alternativos (`:`), nombres reservados, terminaciones en punto o espacio,
 * caracteres no válidos y controles. Se aplica a cada tramo de la ruta pedida.
 */
export function nombreSeguro(nombre: string): boolean {
  if (nombre === '' || nombre === '.' || nombre === '..') return false;
  if (nombre.length > 255) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f<>:"|?*\\/]/.test(nombre)) return false;
  if (/[. ]$/.test(nombre)) return false;
  if (RESERVADO.test(nombre)) return false;
  return true;
}

export type ResultadoRuta = { ok: true; tramos: string[]; terminaEnBarra: boolean } | { ok: false };

/**
 * Lee la parte de la URL que sigue al token. Se decodifica UNA sola vez (un `%252e` queda como el
 * texto `%2e`, que no es un `..`), y cada tramo debe ser un nombre seguro. No hay tramos vacíos
 * salvo la barra final.
 */
export function leerRutaPedida(restoCodificado: string): ResultadoRuta {
  if (restoCodificado.length > 2048) return { ok: false };
  let texto: string;
  try {
    texto = decodeURIComponent(restoCodificado);
  } catch {
    return { ok: false };
  }
  if (!texto.startsWith('/')) return { ok: false };
  const terminaEnBarra = texto.endsWith('/');
  const partes = texto.slice(1).split('/');
  if (terminaEnBarra) partes.pop();
  if (partes.length > 64) return { ok: false };
  for (const p of partes) if (!nombreSeguro(p)) return { ok: false };
  return { ok: true, tramos: partes, terminaEnBarra };
}

/** Tipos que el navegador puede mostrar sin riesgo. El resto se descarga (`attachment`). */
const EN_LINEA: Record<string, string> = {
  txt: 'text/plain; charset=utf-8',
  md: 'text/plain; charset=utf-8',
  log: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

/** Tipos conocidos que siempre se descargan: activos (HTML, SVG, XML, JS, CSS) y paquetes. */
const DESCARGA: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  xhtml: 'application/xhtml+xml',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  xml: 'application/xml',
  xsl: 'application/xml',
  js: 'text/javascript',
  mjs: 'text/javascript',
  css: 'text/css',
  pdf: 'application/pdf',
  zip: 'application/zip',
  gz: 'application/gzip',
  tar: 'application/x-tar',
  '7z': 'application/x-7z-compressed',
};

export interface TipoServido {
  tipo: string;
  /** Se manda con `Content-Disposition: attachment`: el navegador lo descarga y no lo ejecuta. */
  descarga: boolean;
}

/** Tipo por la extensión (lista blanca); lo desconocido es `application/octet-stream` y se descarga. */
export function tipoDe(nombre: string): TipoServido {
  const ext = path.extname(nombre).slice(1).toLowerCase();
  const enLinea = Object.hasOwn(EN_LINEA, ext) ? EN_LINEA[ext] : undefined;
  if (enLinea) return { tipo: enLinea, descarga: false };
  const descarga = Object.hasOwn(DESCARGA, ext) ? DESCARGA[ext] : undefined;
  if (descarga) return { tipo: descarga, descarga: true };
  return { tipo: 'application/octet-stream', descarga: true };
}

/** Texto seguro dentro de HTML (contenido y atributos entre comillas). */
export function escaparHtml(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Quita lo que no se debe mostrar ni guardar de un texto que llegó por la red. */
export function sinControles(t: string, max: number): string {
  // eslint-disable-next-line no-control-regex
  const limpio = t.replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, '�');
  return limpio.length > max ? `${limpio.slice(0, max)}…` : limpio;
}

/** `filename` para `Content-Disposition`: una versión ASCII y otra UTF-8 (RFC 5987). */
export function nombreDescarga(nombre: string): string {
  const ascii = nombre.replace(/[^\x20-\x7e]|["\\%]/g, '_');
  const utf8 = encodeURIComponent(nombre).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

export interface EntradaListado {
  nombre: string;
  carpeta: boolean;
  bytes: number | null;
  /** Pasa del tamaño que se puede revisar y no es un medio o paquete: no se sirve. */
  grande?: boolean;
}

const tamano = (b: number): string => {
  if (b < 1024) return `${b} B`;
  const u = ['KB', 'MB', 'GB', 'TB'];
  let v = b / 1024;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${u[i]}`;
};

/**
 * Página del listado de una carpeta. Todo el texto va escapado; los enlaces son relativos (cada
 * nombre se codifica) y no hay nada de JavaScript. Su estilo es el único permitido por la CSP.
 */
export function listadoHtml(
  titulo: string,
  entradas: readonly EntradaListado[],
  hayMas: boolean,
): string {
  const filas = entradas
    .map((e) => {
      const href = `${encodeURIComponent(e.nombre)}${e.carpeta ? '/' : ''}`;
      const visible = `${e.nombre}${e.carpeta ? '/' : ''}`;
      if (e.grande) {
        return `<tr><td>${escaparHtml(visible)} <em>(too large to review)</em></td><td class="n">${
          e.bytes === null ? '' : escaparHtml(tamano(e.bytes))
        }</td></tr>`;
      }
      return `<tr><td><a href="${escaparHtml(href)}">${escaparHtml(visible)}</a></td><td class="n">${
        e.bytes === null ? '' : escaparHtml(tamano(e.bytes))
      }</td></tr>`;
    })
    .join('\n');
  const arriba = titulo === '' ? '' : `<p><a href="../">../</a></p>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escaparHtml(titulo || '/')}</title>
<style>body{font:16px system-ui,sans-serif;margin:24px;color:#222}h1{font-size:18px;word-break:break-all}table{border-collapse:collapse;width:100%;max-width:720px}td{padding:6px 8px;border-bottom:1px solid #ddd;word-break:break-all}td.n{text-align:right;white-space:nowrap;color:#666}a{color:#0b5fff}</style></head>
<body><h1>/${escaparHtml(titulo)}</h1>${arriba}
<table>${filas}</table>${hayMas ? '<p>…</p>' : ''}</body></html>`;
}

import { createHash } from 'node:crypto';
import { lstat, open, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import { validarNombreBd } from '../bd/clienteMysql';
import { ErrorWolf, type CodigoError } from '../errores';
import { DOMINIO_VALIDO } from '../hosts/bloque';
import { existe } from '../proyectos/archivos';
import { leerVariablesEnv } from '../proyectos/detectar';

/**
 * Lectura de lo que dejaron otros programas (Laragon, XAMPP, Herd). Todo es entrada no confiable:
 * archivos de configuración rarísimos (UTF-16, binarios, enormes, enlaces que salen de la
 * instalación) y rutas que apuntan a cualquier lado. Aquí viven los límites; los lectores de cada
 * programa solo los usan. Nada se modifica y nada se cuelga: ante algo raro hay un error con
 * código, y el resto de la detección sigue.
 */

export type ProgramaAjeno = 'laragon' | 'xampp' | 'herd';
export const PROGRAMAS_AJENOS: readonly ProgramaAjeno[] = ['laragon', 'xampp', 'herd'];

/** Tope de cada archivo de configuración que se lee (se mira el tamaño antes de abrirlo). */
export const MAX_BYTES_CONFIG = 1024 * 1024;
/** Tope de sitios por instalación y de archivos de vhosts que se leen por carpeta. */
export const MAX_CANDIDATOS = 500;
export const MAX_ARCHIVOS_VHOSTS = 300;

/** Avisos de un candidato: claves estables que la interfaz traduce. */
export type AvisoImportar =
  | 'sin_dominio'
  | 'dominio_invalido'
  | 'sin_vhost'
  | 'php_desconocido'
  | 'base_no_local'
  | 'base_nombre_invalido'
  | 'motor_no_soportado';

export interface CandidatoImportar {
  /** `<programa>-<12 hex>` derivado de la carpeta: estable entre detecciones, sin rutas. */
  id: string;
  programa: ProgramaAjeno;
  nombre: string;
  /** Carpeta del proyecto, ya resuelta (sin enlaces) y validada: solo se muestra, nunca se mueve. */
  carpeta: string;
  dominio: string | null;
  /** Versión de PHP del programa de origen (`8.2.12`, `8.3`); null si no se sabe. */
  php: string | null;
  base: { motor: 'mysql' | 'mariadb'; nombre: string } | null;
  avisos: AvisoImportar[];
}

/** Algo que se descartó o no se pudo leer, con su código (la interfaz lo muestra). */
export interface ProblemaImportar {
  codigo: CodigoError;
  /** Archivo o carpeta, relativo a la instalación cuando es posible (nunca el contenido). */
  donde: string;
}

export interface ResultadoDetectar {
  candidatos: CandidatoImportar[];
  problemas: ProblemaImportar[];
}

/** Contexto de una detección: la instalación y lo que se va encontrando. */
export interface ContextoDetectar {
  raiz: string;
  programa: ProgramaAjeno;
  /** Carpetas que nunca se vinculan (p. ej. la de datos de WolfCore Dev y sus ancestros). */
  prohibidas: readonly string[];
  problemas: ProblemaImportar[];
}

export function contexto(
  raiz: string,
  programa: ProgramaAjeno,
  prohibidas: readonly string[] = [],
): ContextoDetectar {
  return { raiz: path.resolve(raiz), programa, prohibidas, problemas: [] };
}

const relativa = (raiz: string, ruta: string): string => {
  const r = path.relative(raiz, ruta);
  return r !== '' && !r.startsWith('..') && !path.isAbsolute(r) ? r : path.basename(ruta);
};

export function anotar(ctx: ContextoDetectar, codigo: CodigoError, ruta: string): void {
  if (ctx.problemas.length >= 200) return;
  ctx.problemas.push({ codigo, donde: relativa(ctx.raiz, ruta) });
}

/* ───────────── Rutas ───────────── */

/** `a` está dentro de `b` (o es `b`), comparando sin distinguir mayúsculas en Windows. */
export function estaDentro(b: string, a: string): boolean {
  const cmp = (x: string): string => (path.sep === '\\' ? x.toLowerCase() : x);
  const r = path.relative(cmp(path.resolve(b)), cmp(path.resolve(a)));
  return r === '' || (!r.startsWith('..') && !path.isAbsolute(r));
}

/** Ruta absoluta de una unidad local o raíz POSIX: nunca UNC (`\\servidor`), `\\?\`, `\\.\` ni `:` raros. */
export function esRutaLocalAbsoluta(ruta: string): boolean {
  if (ruta === '' || ruta.length > 1024) return false;
  if ([...ruta].some((c) => c.charCodeAt(0) < 0x20)) return false;
  if (/^[\\/]{2}/.test(ruta)) return false;
  if (/^[A-Za-z]:[\\/]/.test(ruta)) return !ruta.slice(2).includes(':');
  return ruta.startsWith('/') && !ruta.includes(':');
}

/** Carpetas del sistema, del perfil y de otros programas que ninguna importación puede vincular. */
const PROTEGIDAS_WINDOWS =
  /^[a-z]:\/(?:windows|program files(?: \(x86\))?|programdata|system volume information|\$recycle\.bin|recovery|boot|msocache)(?:\/|$)/;
const PROTEGIDAS_POSIX = /^\/(?:etc|usr|bin|sbin|lib|lib64|dev|proc|sys|boot|root)(?:\/|$)/;

/**
 * Carpeta del sistema operativo, raíz de una unidad, `Users`, el perfil entero o su `AppData`:
 * ahí no vive el proyecto de nadie y vincularlas serviría a un ataque.
 */
export function esRutaProtegida(ruta: string): boolean {
  const n = ruta.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  if (n === '' || /^[a-z]:$/.test(n)) return true;
  if (PROTEGIDAS_WINDOWS.test(`${n}/`) || PROTEGIDAS_POSIX.test(`${n}/`)) return true;
  if (/^[a-z]:\/users(?:\/[^/]+)?$/.test(n) || /^[a-z]:\/users\/[^/]+\/appdata(?:\/|$)/.test(n)) {
    return true;
  }
  return !n.slice(1).includes('/') && !/^[a-z]:\//.test(n);
}

/**
 * Valida una carpeta que sale de una configuración ajena y devuelve su ruta real, o anota por qué
 * se descarta. Debe ser una ruta local absoluta, una carpeta que existe, y estar dentro de la
 * instalación o, si no, no ser una carpeta protegida ni una prohibida (se juzga por su ruta real:
 * una unión o un enlace dentro de la instalación que salga a `C:\Windows` no pasa).
 */
export async function validarCarpetaAjena(
  ctx: ContextoDetectar,
  bruta: string,
  origen: string,
): Promise<string | null> {
  if (!esRutaLocalAbsoluta(bruta)) {
    anotar(ctx, 'importar.ruta_fuera', origen);
    return null;
  }
  // Antes de tocar el disco: una carpeta protegida fuera de la instalación ni se consulta.
  if (esRutaProtegida(bruta) && !(path.isAbsolute(bruta) && estaDentro(ctx.raiz, bruta))) {
    anotar(ctx, 'importar.ruta_fuera', origen);
    return null;
  }
  let real: string;
  try {
    real = await realpath(path.resolve(bruta));
    if (!(await stat(real)).isDirectory()) throw new Error('no es una carpeta');
  } catch {
    anotar(ctx, 'importar.carpeta_invalida', origen);
    return null;
  }
  const raizReal = await realpath(ctx.raiz).catch(() => ctx.raiz);
  const dentro = estaDentro(raizReal, real);
  const prohibida = ctx.prohibidas.some((p) => estaDentro(real, p) || estaDentro(p, real));
  if (prohibida || (!dentro && esRutaProtegida(real))) {
    anotar(ctx, 'importar.ruta_fuera', origen);
    return null;
  }
  return real;
}

/* ───────────── Archivos de texto ajenos ───────────── */

/** UTF-8 o UTF-16 (LE o BE), con o sin BOM; null si parece binario. */
export function decodificarTextoAjeno(b: Buffer): string | null {
  let texto: string;
  if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) {
    texto = new TextDecoder('utf-8').decode(b.subarray(3));
  } else if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
    texto = new TextDecoder('utf-16le').decode(b.subarray(2));
  } else if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
    texto = new TextDecoder('utf-16le').decode(Buffer.from(b.subarray(2)).swap16());
  } else {
    // Sin BOM: un texto en UTF-16 de caracteres latinos tiene un 0 en cada segundo byte.
    const n = Math.min(b.length, 512) & ~1;
    let pares = 0;
    let impares = 0;
    for (let i = 0; i < n; i += 2) {
      if (b[i] === 0) pares++;
      if (b[i + 1] === 0) impares++;
    }
    const mitad = n / 4;
    if (n >= 4 && impares > mitad && pares === 0) texto = new TextDecoder('utf-16le').decode(b);
    else if (n >= 4 && pares > mitad && impares === 0) {
      texto = new TextDecoder('utf-16le').decode(Buffer.from(b).swap16());
    } else texto = new TextDecoder('utf-8').decode(b);
  }
  return texto.includes('\0') ? null : texto;
}

/**
 * Lee un archivo de configuración ajeno con límites. `null` si no existe. Con error (código):
 * no es un archivo normal (carpeta, tubería, dispositivo), su ruta real sale de `raiz`, pesa más
 * de `MAX_BYTES_CONFIG` (se mira el tamaño antes de abrirlo y se lee con tope aunque crezca) o
 * parece binario.
 */
export async function leerConfigAjena(
  ruta: string,
  raiz: string | null,
  max = MAX_BYTES_CONFIG,
): Promise<string | null> {
  let real: string;
  try {
    real = await realpath(ruta);
  } catch {
    return null;
  }
  if (raiz !== null) {
    const raizReal = await realpath(raiz).catch(() => path.resolve(raiz));
    if (!estaDentro(raizReal, real)) {
      throw new ErrorWolf(
        'importar.ruta_fuera',
        'Un archivo de configuración sale de la instalación.',
      );
    }
  }
  const info = await lstat(real);
  if (!info.isFile()) {
    throw new ErrorWolf('importar.archivo_ilegible', 'No es un archivo normal.');
  }
  if (info.size > max) {
    throw new ErrorWolf(
      'importar.archivo_grande',
      'Un archivo de configuración es demasiado grande para leerlo.',
      { maximo: Math.floor(max / 1024) },
    );
  }
  const f = await open(real, 'r');
  try {
    // Un byte de más: si el archivo creció entre el stat y la lectura, también se rechaza.
    const b = Buffer.alloc(max + 1);
    const { bytesRead } = await f.read(b, 0, max + 1, 0);
    if (bytesRead > max) {
      throw new ErrorWolf(
        'importar.archivo_grande',
        'Un archivo de configuración es demasiado grande para leerlo.',
        { maximo: Math.floor(max / 1024) },
      );
    }
    const texto = decodificarTextoAjeno(b.subarray(0, bytesRead));
    if (texto === null) {
      throw new ErrorWolf('importar.archivo_ilegible', 'El archivo no es de texto.');
    }
    return texto;
  } finally {
    await f.close();
  }
}

/** Como `leerConfigAjena`, pero un error se anota en el contexto y devuelve null. */
export async function leerConfigAnotando(
  ctx: ContextoDetectar,
  ruta: string,
  dentroDeLaRaiz = true,
): Promise<string | null> {
  try {
    return await leerConfigAjena(ruta, dentroDeLaRaiz ? ctx.raiz : null);
  } catch (e) {
    anotar(ctx, e instanceof ErrorWolf ? e.codigo : 'importar.archivo_ilegible', ruta);
    return null;
  }
}

/**
 * Archivos `*.conf` de una carpeta (sin entrar en subcarpetas), ordenados, hasta
 * `MAX_ARCHIVOS_VHOSTS`; si hay más se anota y se ignoran los sobrantes.
 */
export async function archivosConf(ctx: ContextoDetectar, carpeta: string): Promise<string[]> {
  let nombres: string[];
  try {
    nombres = (await readdir(carpeta, { withFileTypes: true }))
      .filter((e) => (e.isFile() || e.isSymbolicLink()) && /\.conf$/i.test(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
  if (nombres.length > MAX_ARCHIVOS_VHOSTS) {
    anotar(ctx, 'importar.demasiados', carpeta);
    nombres = nombres.slice(0, MAX_ARCHIVOS_VHOSTS);
  }
  return nombres.map((n) => path.join(carpeta, n));
}

/** Subcarpetas directas de una carpeta de sitios (sin las ocultas ni los enlaces rotos). */
export async function subcarpetas(ctx: ContextoDetectar, carpeta: string): Promise<string[]> {
  let nombres: string[];
  try {
    nombres = (await readdir(carpeta, { withFileTypes: true }))
      .filter((e) => (e.isDirectory() || e.isSymbolicLink()) && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
  if (nombres.length > MAX_CANDIDATOS) {
    anotar(ctx, 'importar.demasiados', carpeta);
    nombres = nombres.slice(0, MAX_CANDIDATOS);
  }
  return nombres.map((n) => path.join(carpeta, n));
}

/* ───────────── De la configuración al candidato ───────────── */

const CARPETAS_PUBLICAS = new Set([
  'public',
  'public_html',
  'web',
  'www',
  'htdocs',
  'webroot',
  'pub',
  'html',
]);

/**
 * El vhost apunta a la carpeta pública (`proyecto/public`); el sitio de WolfCore Dev es la raíz del
 * proyecto. Solo se sube un nivel si arriba hay un proyecto y no es la propia carpeta de sitios.
 */
export async function raizDelProyecto(
  ctx: ContextoDetectar,
  docroot: string,
  origen: string,
  carpetasDeSitios: readonly string[],
): Promise<string> {
  if (!CARPETAS_PUBLICAS.has(path.basename(docroot).toLowerCase())) return docroot;
  const padre = path.dirname(docroot);
  if (carpetasDeSitios.some((c) => path.resolve(c) === path.resolve(padre))) return docroot;
  const pistas = ['artisan', 'spark', 'composer.json', 'package.json', 'application', 'app'];
  let hay = false;
  for (const p of pistas) if (await existe(path.join(padre, p))) hay = true;
  if (!hay) return docroot;
  return (await validarCarpetaAjena(ctx, padre, origen)) ?? docroot;
}

const LOCALES = new Set(['', '127.0.0.1', 'localhost', '::1', '[::1]']);

/**
 * Base de datos que usa el proyecto, de su `.env`, `application/config/database.php`
 * (CodeIgniter 3), `app/Config/Database.php` (CodeIgniter 4) o `wp-config.php`. Solo se lee el
 * nombre, el motor y si es local: la clave de la base nunca se lee.
 */
export async function baseDelProyecto(
  ctx: ContextoDetectar,
  carpeta: string,
  valorPorDefecto: 'mysql' | 'mariadb',
): Promise<{ base: CandidatoImportar['base']; avisos: AvisoImportar[] }> {
  const leer = async (...partes: string[]): Promise<string | null> => {
    try {
      return await leerConfigAjena(path.join(carpeta, ...partes), carpeta);
    } catch (e) {
      anotar(
        ctx,
        e instanceof ErrorWolf ? e.codigo : 'importar.archivo_ilegible',
        path.join(carpeta, ...partes),
      );
      return null;
    }
  };
  let driver = '';
  let host = '';
  let nombre = '';
  const env = await leer('.env');
  if (env !== null) {
    const v = leerVariablesEnv(env);
    driver = (v.get('DB_CONNECTION') ?? '').toLowerCase();
    host = v.get('DB_HOST') ?? '';
    nombre = v.get('DB_DATABASE') ?? '';
  }
  if (nombre === '') {
    const ci =
      (await leer('application', 'config', 'database.php')) ??
      (await leer('app', 'Config', 'Database.php'));
    if (ci !== null) {
      nombre = /['"]database['"]\s*=>\s*['"]([^'"]+)['"]/.exec(ci)?.[1] ?? '';
      host = /['"]hostname['"]\s*=>\s*['"]([^'"]*)['"]/.exec(ci)?.[1] ?? host;
      driver = /['"]DBDriver['"]\s*=>\s*['"]([^'"]*)['"]/i.exec(ci)?.[1]?.toLowerCase() ?? driver;
    }
  }
  if (nombre === '') {
    const wp = await leer('wp-config.php');
    if (wp !== null) {
      nombre = /define\(\s*['"]DB_NAME['"]\s*,\s*['"]([^'"]+)['"]/.exec(wp)?.[1] ?? '';
      host = /define\(\s*['"]DB_HOST['"]\s*,\s*['"]([^'"]*)['"]/.exec(wp)?.[1] ?? host;
    }
  }
  if (nombre === '') return { base: null, avisos: [] };
  if (!/^(?:|mysql|mysqli|mariadb)$/.test(driver)) {
    return { base: null, avisos: ['motor_no_soportado'] };
  }
  const servidor = host.replace(/:\d+$/, '').toLowerCase();
  if (!LOCALES.has(servidor)) return { base: null, avisos: ['base_no_local'] };
  try {
    validarNombreBd(nombre);
  } catch {
    return { base: null, avisos: ['base_nombre_invalido'] };
  }
  return {
    base: { motor: driver === 'mariadb' ? 'mariadb' : valorPorDefecto, nombre },
    avisos: [],
  };
}

/** Nombre de dominio de un `ServerName`/`server_name`: sin puerto, en minúsculas y válido. */
export function dominioValido(crudo: string | null | undefined): string | null {
  if (!crudo) return null;
  const d = crudo.trim().toLowerCase().replace(/:\d+$/, '');
  if (d === '' || d === 'localhost' || d.length > 253 || !DOMINIO_VALIDO.test(d)) return null;
  return d.includes('.') ? d : null;
}

export function idDeCandidato(programa: ProgramaAjeno, carpeta: string): string {
  const clave = path.resolve(carpeta).replace(/\\/g, '/').toLowerCase();
  return `${programa}-${createHash('sha256').update(clave).digest('hex').slice(0, 12)}`;
}

/** Une candidatos con la misma carpeta (un vhost de Apache y otro de Nginx para el mismo sitio). */
export function unirPorCarpeta(lista: CandidatoImportar[]): CandidatoImportar[] {
  const por = new Map<string, CandidatoImportar>();
  for (const c of lista) {
    const k = path.resolve(c.carpeta).toLowerCase();
    const previo = por.get(k);
    if (!previo) {
      por.set(k, c);
      continue;
    }
    por.set(k, {
      ...previo,
      dominio: previo.dominio ?? c.dominio,
      php: previo.php ?? c.php,
      base: previo.base ?? c.base,
      avisos: [...new Set([...previo.avisos, ...c.avisos])].filter(
        (a) => !(a === 'sin_vhost' && (previo.dominio ?? c.dominio)),
      ) as AvisoImportar[],
    });
  }
  return [...por.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Crea el candidato de una carpeta ya validada: con el dominio y la versión de PHP que haya, y su
 * base si el proyecto la declara.
 */
export async function armarCandidato(
  ctx: ContextoDetectar,
  carpeta: string,
  o: {
    dominio: string | null;
    dominioCrudo?: string | null;
    php: string | null;
    motorPorDefecto: 'mysql' | 'mariadb';
    avisos?: AvisoImportar[];
  },
): Promise<CandidatoImportar> {
  const avisos: AvisoImportar[] = [...(o.avisos ?? [])];
  if (o.dominio === null) {
    avisos.push(o.dominioCrudo ? 'dominio_invalido' : 'sin_dominio');
  }
  if (o.php === null) avisos.push('php_desconocido');
  const { base, avisos: deBase } = await baseDelProyecto(ctx, carpeta, o.motorPorDefecto);
  return {
    id: idDeCandidato(ctx.programa, carpeta),
    programa: ctx.programa,
    nombre: path.basename(carpeta),
    carpeta,
    dominio: o.dominio,
    php: o.php,
    base,
    avisos: [...avisos, ...deBase],
  };
}

/** `8.2.12`, `8.3` o `php@8.3` → `8.2.12` / `8.3` (solo el número); null si no hay uno. */
export function versionPhpDeTexto(t: string | null | undefined): string | null {
  const m = t ? /(\d{1,2}\.\d{1,2}(?:\.\d{1,3})?)/.exec(t) : null;
  return m ? m[1]! : null;
}

/* ───────────── Piezas comunes de los lectores ───────────── */

/** INI simple: `[sección]` y `clave=valor` (comentarios `;` y `#`). Claves y secciones en minúsculas. */
export function leerIni(texto: string): Record<string, Record<string, string>> {
  const salida: Record<string, Record<string, string>> = {};
  let seccion = '';
  for (const cruda of texto.split(/\r?\n/, 20_000)) {
    const l = cruda.trim();
    if (l === '' || l.startsWith(';') || l.startsWith('#')) continue;
    const s = /^\[([^\]]+)\]$/.exec(l);
    if (s) {
      seccion = s[1]!.trim().toLowerCase();
      continue;
    }
    const kv = /^([^=]+?)\s*=\s*(.*)$/.exec(l);
    if (!kv) continue;
    const v = kv[2]!.trim().replace(/^"(.*)"$/, '$1');
    (salida[seccion] ??= {})[kv[1]!.trim().toLowerCase()] = v;
  }
  return salida;
}

export interface VhostConOrigen {
  nombre: string | null;
  documentRoot: string | null;
  archivo: string;
}

/**
 * Candidatos de los vhosts: cada `DocumentRoot` se valida (local, existente, dentro de la
 * instalación o fuera de lo protegido) y se sube a la raíz del proyecto si apunta a `public`.
 * La carpeta de sitios y la raíz de la instalación no son sitios (son el `localhost`).
 */
export async function candidatosDeVhosts(
  ctx: ContextoDetectar,
  vhosts: readonly VhostConOrigen[],
  o: {
    carpetasDeSitios: readonly string[];
    php: string | null;
    motorPorDefecto: 'mysql' | 'mariadb';
  },
): Promise<CandidatoImportar[]> {
  const lista: CandidatoImportar[] = [];
  const base = new Set(
    [...o.carpetasDeSitios, ctx.raiz].map((c) => path.resolve(c).replace(/\\/g, '/').toLowerCase()),
  );
  for (const v of vhosts) {
    if (lista.length >= MAX_CANDIDATOS) {
      anotar(ctx, 'importar.demasiados', v.archivo);
      break;
    }
    if (!v.documentRoot) continue;
    const real = await validarCarpetaAjena(ctx, v.documentRoot, v.archivo);
    if (real === null) continue;
    if (base.has(real.replace(/\\/g, '/').toLowerCase())) continue;
    const carpeta = await raizDelProyecto(ctx, real, v.archivo, o.carpetasDeSitios);
    const dominio = dominioValido(v.nombre);
    lista.push(
      await armarCandidato(ctx, carpeta, {
        dominio,
        dominioCrudo: v.nombre,
        php: o.php,
        motorPorDefecto: o.motorPorDefecto,
      }),
    );
  }
  return lista;
}

/** Candidatos de las carpetas de una carpeta de sitios (`www`, `htdocs`, `Herd`), sin vhost. */
export async function candidatosDeCarpetas(
  ctx: ContextoDetectar,
  carpetaDeSitios: string,
  o: {
    dominio: (nombre: string) => string | null;
    php: string | null;
    motorPorDefecto: 'mysql' | 'mariadb';
    avisos?: AvisoImportar[];
  },
): Promise<CandidatoImportar[]> {
  const real = await validarCarpetaAjena(ctx, carpetaDeSitios, carpetaDeSitios);
  if (real === null) return [];
  const lista: CandidatoImportar[] = [];
  for (const sub of await subcarpetas(ctx, real)) {
    const carpeta = await validarCarpetaAjena(ctx, sub, sub);
    if (carpeta === null) continue;
    lista.push(
      await armarCandidato(ctx, carpeta, {
        dominio: o.dominio(path.basename(carpeta)),
        php: o.php,
        motorPorDefecto: o.motorPorDefecto,
        avisos: o.avisos ?? [],
      }),
    );
  }
  return lista;
}

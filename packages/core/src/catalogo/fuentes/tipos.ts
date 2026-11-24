import type { IdCatalogo } from '../../plataforma/tipos';
import type { ServicioInstalable, VersionDisponible } from '../catalogo';
import { urlIndice } from '../comun';
import type { Huella } from '../huellas';
import { leerAcotado, pedirConSaltos } from '../red';

export interface ContextoFuente {
  f: typeof fetch;
  idCatalogo: IdCatalogo;
  senal?: AbortSignal;
  /** Para decidir el soporte de una rama por su fecha de fin. */
  ahora?: Date;
  /**
   * Versiones ya conocidas del servicio (caché válida y lista fija). Las fuentes sin índice
   * (MySQL) sondean desde la última de cada rama.
   */
  previas?: readonly VersionDisponible[];
  /** Validadores HTTP guardados con la caché (para pedir con `If-None-Match`/`If-Modified-Since`). */
  validadores?: Validadores;
  /** Notas que la fuente dejó en la consulta anterior (p. ej. una página que no respondió). */
  notas?: Readonly<Record<string, string>>;
  /** Vigencia de la caché del servicio. */
  ttlMs?: number;
  /** Lo que la fuente pide guardar con la caché si la consulta sale bien. */
  guardar?: { validadores?: Validadores; notas?: Record<string, string> };
}

/** ETag y Last-Modified de la respuesta de un índice. */
export interface Validadores {
  etag?: string;
  ultimaModificacion?: string;
}

/**
 * El servidor respondió 304: el índice no cambió desde la caché. `CatalogoVivo` renueva la fecha
 * de la caché con las mismas versiones (si no hay caché válida, cae a la lista fija).
 */
export class SinCambios extends Error {
  constructor() {
    super('El índice no cambió (304)');
  }
}

/** Encabezados condicionales a partir de los validadores guardados. */
export function encabezadosCondicionales(v: Validadores | undefined): Record<string, string> {
  const h: Record<string, string> = {};
  if (v?.etag) h['if-none-match'] = v.etag;
  if (v?.ultimaModificacion) h['if-modified-since'] = v.ultimaModificacion;
  return h;
}

/** Validadores de una respuesta (acotados: vienen de fuera). */
export function validadoresDe(res: Response): Validadores {
  const v: Validadores = {};
  const etag = res.headers.get('etag');
  const lm = res.headers.get('last-modified');
  if (etag && etag.length <= 200) v.etag = etag;
  if (lm && lm.length <= 100) v.ultimaModificacion = lm;
  return v;
}

/**
 * Fuente oficial de las versiones de un servicio. Devuelve lo que publica para `idCatalogo`
 * (en la Etapa C solo `win-x64`; para otro sistema, una lista vacía). Lo que devuelve pasa
 * después por `validarIndice`: una sola entrada mala descarta el índice entero.
 */
export interface FuenteVersiones {
  servicio: ServicioInstalable;
  /** Hosts de los que lee esta fuente (todos dentro de `HOSTS_INDICE`). */
  hostsIndice: readonly string[];
  listar(ctx: ContextoFuente): Promise<VersionDisponible[]>;
  /** Huella de una versión que se listó sin ella (`huellaDiferida`), pedida al instalar. */
  completar?(v: VersionDisponible, ctx: ContextoFuente): Promise<Huella | null>;
}

/** Plazo por índice. */
export const PLAZO_INDICE_MS = 15_000;
/** Tamaño máximo de un índice. */
export const MAX_INDICE_BYTES = 5 * 1024 * 1024;

/** Error de formato de un índice: hace que se descarte entero. */
export class IndiceMalformado extends Error {}

/**
 * Lee un índice de un host de `HOSTS_INDICE` (cada redirección también), con plazo de 15 s y
 * tamaño acotado.
 */
export async function leerIndice(
  ctx: ContextoFuente,
  url: string,
  o: { maxBytes?: number; encabezados?: Record<string, string> } = {},
): Promise<string> {
  const senales = [AbortSignal.timeout(PLAZO_INDICE_MS), ...(ctx.senal ? [ctx.senal] : [])];
  const res = await pedirConSaltos(
    ctx.f,
    url,
    {
      signal: AbortSignal.any(senales),
      headers: { 'user-agent': 'WolfCoreDev', ...(o.encabezados ?? {}) },
    },
    urlIndice,
  );
  if (!res.ok) {
    await res.body?.cancel().catch(() => undefined);
    throw new Error(`HTTP ${res.status} en ${new URL(url).hostname}`);
  }
  return leerAcotado(res, o.maxBytes ?? MAX_INDICE_BYTES);
}

export async function leerIndiceJson(
  ctx: ContextoFuente,
  url: string,
  o: { maxBytes?: number; encabezados?: Record<string, string> } = {},
): Promise<unknown> {
  const texto = await leerIndice(ctx, url, o);
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    throw new IndiceMalformado(`El índice de ${new URL(url).hostname} no es JSON`);
  }
}

/** Respuestas de "no existe" de un sondeo (S3 responde 403 a una clave que no existe). */
const AUSENTE = new Set([403, 404, 410]);

/**
 * `HEAD` a una URL de un host de `HOSTS_INDICE` (cada redirección también): true si existe, false
 * si el servidor dice que no (403/404/410). Otro estado (5xx, 429…) o un fallo de red lanzan: un
 * sondeo que no se pudo hacer no se toma como "no existe".
 */
export async function sondear(ctx: ContextoFuente, url: string): Promise<boolean> {
  const senales = [AbortSignal.timeout(PLAZO_INDICE_MS), ...(ctx.senal ? [ctx.senal] : [])];
  const res = await pedirConSaltos(
    ctx.f,
    url,
    {
      method: 'HEAD',
      signal: AbortSignal.any(senales),
      headers: { 'user-agent': 'WolfCoreDev' },
    },
    urlIndice,
  );
  await res.body?.cancel().catch(() => undefined);
  if (res.ok) return true;
  if (AUSENTE.has(res.status)) return false;
  throw new Error(`HTTP ${res.status} al sondear ${new URL(url).hostname}`);
}

/** Rama "mayor.menor" de una versión ("8.10.3" → "8.10"). */
export function ramaMayorMenor(version: string): string | null {
  const m = /^(\d+)\.(\d+)/.exec(version);
  return m ? `${Number(m[1])}.${Number(m[2])}` : null;
}

/** Suma `<hex>  <archivo>` de un archivo de sumas (SHASUMS256.txt, *.sha256sum, checksums.txt). */
export function sumaDe(texto: string, archivo: string | null): string | null {
  for (const linea of texto.split(/\r?\n/)) {
    const m = /^([0-9a-fA-F]{64})(?:\s+\*?(\S+))?\s*$/.exec(linea.trim());
    if (!m) continue;
    if (archivo === null || m[2] === archivo || m[2]?.split('/').pop() === archivo) {
      return m[1]!.toLowerCase();
    }
  }
  // Formato de PowerShell (`Get-FileHash`) que usa Deno en sus `.sha256sum`: líneas `Hash : <hex>`
  // y `Path : <ruta>`, leídas línea a línea.
  let hash: string | null = null;
  let ruta: string | null = null;
  for (const linea of texto.split(/\r?\n/).slice(0, 20)) {
    if (linea.length > 400) continue;
    const i = linea.indexOf(':');
    if (i < 0) continue;
    const clave = linea.slice(0, i).trim();
    const valor = linea.slice(i + 1).trim();
    if (clave === 'Hash' && /^[0-9a-fA-F]{64}$/.test(valor)) hash = valor.toLowerCase();
    if (clave === 'Path') ruta = valor;
  }
  if (hash && ruta && archivo !== null && ruta.split(/[\\/]/).pop() === archivo) return hash;
  return null;
}

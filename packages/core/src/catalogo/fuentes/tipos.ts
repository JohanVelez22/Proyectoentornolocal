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
  return null;
}

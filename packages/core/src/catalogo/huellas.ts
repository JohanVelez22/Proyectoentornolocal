import { z } from 'zod';

/**
 * Huella publicada de una descarga. SHA-256 y SHA-512 son fuertes; MD5 se verifica, pero cuenta
 * como débil (instalar con ella exige la confirmación del usuario).
 */
export type AlgoritmoHuella = 'sha256' | 'sha512' | 'md5';
export interface Huella {
  algoritmo: AlgoritmoHuella;
  /** Hex en minúsculas. */
  valor: string;
}

const LARGO_HEX: Record<AlgoritmoHuella, number> = { sha256: 64, sha512: 128, md5: 32 };

export const HuellaSchema = z
  .object({
    algoritmo: z.enum(['sha256', 'sha512', 'md5']),
    valor: z.string(),
  })
  .strict()
  .refine((h) => new RegExp(`^[0-9a-f]{${LARGO_HEX[h.algoritmo]}}$`).test(h.valor), {
    message: 'Huella mal formada',
  });

export function huellaFuerte(h: Huella | null | undefined): boolean {
  return !!h && (h.algoritmo === 'sha256' || h.algoritmo === 'sha512');
}

/**
 * Lleva una huella a hex en minúsculas y comprueba su largo. Acepta base64 (el SHA-512 de NuGet
 * llega así). Devuelve null si no es una huella válida de ese algoritmo.
 */
export function normalizarHuella(algoritmo: AlgoritmoHuella, valor: string): Huella | null {
  const largo = LARGO_HEX[algoritmo];
  const texto = valor.trim();
  if (new RegExp(`^[0-9a-fA-F]{${largo}}$`).test(texto)) {
    return { algoritmo, valor: texto.toLowerCase() };
  }
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(texto) && texto.length % 4 === 0) {
    const hex = Buffer.from(texto, 'base64').toString('hex');
    if (hex.length === largo) return { algoritmo, valor: hex };
  }
  return null;
}

/** La huella de una versión: la explícita o, si no hay, su `sha256` de siempre. */
export function huellaDe(v: { huella?: Huella | null; sha256?: string | null }): Huella | null {
  if (v.huella) return v.huella;
  return v.sha256 ? { algoritmo: 'sha256', valor: v.sha256.toLowerCase() } : null;
}

/**
 * Fuentes que publican una firma PGP de sus descargas (D10). Con firma, `instalar` la verifica
 * con el anillo fijado de la fuente **antes** de usar la suma o el archivo y falla cerrado.
 */
export type FuenteFirma = 'node' | 'composer' | 'nginx';

/**
 * Fuente de la firma de una versión, o null si su fuente no la publica:
 * - Node: `SHASUMS256.txt.sig` (firma la lista de sumas) en todas las versiones;
 * - Composer: `composer.phar.asc` desde 2.0.3 (1.x y 2.0.0–2.0.2 no la publican: 404
 *   comprobado; esas solo tienen su suma);
 * - Nginx: `nginx-<v>.zip.asc` (nginx.org no publica sumas, solo firmas).
 */
export function fuenteFirmaDe(v: { servicio: string; version: string }): FuenteFirma | null {
  if (v.servicio === 'node' || v.servicio === 'nginx') return v.servicio;
  if (v.servicio === 'composer') {
    const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v.version);
    if (!m) return null;
    const [mayor, menor, parche] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const firmada = mayor > 2 || (mayor === 2 && (menor > 0 || parche >= 3));
    return firmada ? 'composer' : null;
  }
  return null;
}

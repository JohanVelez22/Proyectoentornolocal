import { ErrorWolf } from '../errores';
import { clasificarErrorIa, errorIa, sinSecretosIa } from './errores';
import type { TipoProveedorIa } from './proveedores';

/** `fetch` inyectable (en las pruebas, el global contra un servidor falso). */
export type FetchIa = (url: string, init: RequestInit) => Promise<Response>;

/** Plazo por defecto de cada petición a un proveedor. */
export const PLAZO_IA_MS = 20_000;
/** Tope del cuerpo de una respuesta (las listas de modelos de OpenRouter pasan de 1 MB). */
export const MAX_CUERPO_IA = 8 * 1024 * 1024;

/** Lo común de una petición: plazo, cancelación, sin redirecciones y cuerpo acotado. */
export interface PeticionIa {
  tipo: TipoProveedorIa;
  url: string;
  metodo: 'GET' | 'POST';
  cabeceras: Record<string, string>;
  cuerpo?: unknown;
  /** Clave usada (para quitarla de cualquier texto que se devuelva). */
  clave: string | null;
  senal?: AbortSignal;
  plazoMs: number;
  fetchImpl: FetchIa;
}

async function leerAcotado(r: Response, max: number): Promise<string | null> {
  if (!r.body) return '';
  const lector = r.body.getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) return null;
      trozos.push(value);
    }
  } finally {
    await lector.cancel().catch(() => undefined);
  }
  return Buffer.concat(trozos).toString('utf8');
}

/**
 * Hace la petición y devuelve el JSON de la respuesta. Cualquier fallo es un ErrorWolf `ia.*`
 * sin la clave: ni en el mensaje, ni en `datos`, ni como `cause`. Las redirecciones nunca se
 * siguen (la clave iría en la cabecera a otro sitio): cuentan como respuesta inesperada.
 */
export async function pedirJsonIa(p: PeticionIa): Promise<unknown> {
  const ctl = new AbortController();
  let porPlazo = false;
  const plazo = setTimeout(() => {
    porPlazo = true;
    ctl.abort();
  }, p.plazoMs);
  const cancelar = (): void => ctl.abort();
  if (p.senal?.aborted) ctl.abort();
  p.senal?.addEventListener('abort', cancelar, { once: true });
  const abortado = (): ErrorWolf =>
    porPlazo
      ? errorIa('ia.plazo', { segundos: Math.max(1, Math.round(p.plazoMs / 1000)) })
      : errorIa('ia.cancelado');
  try {
    let r: Response;
    try {
      r = await p.fetchImpl(p.url, {
        method: p.metodo,
        headers: {
          accept: 'application/json',
          ...(p.cuerpo !== undefined ? { 'content-type': 'application/json' } : {}),
          ...p.cabeceras,
        },
        ...(p.cuerpo !== undefined ? { body: JSON.stringify(p.cuerpo) } : {}),
        redirect: 'manual',
        signal: ctl.signal,
      });
    } catch {
      if (ctl.signal.aborted) throw abortado();
      throw errorIa('ia.sin_red');
    }
    let texto: string | null;
    try {
      texto = await leerAcotado(r, MAX_CUERPO_IA);
    } catch {
      if (ctl.signal.aborted) throw abortado();
      throw errorIa('ia.sin_red');
    }
    if (r.status >= 300 && r.status < 400) {
      throw errorIa('ia.respuesta_rara', { estado: r.status });
    }
    if (texto === null) {
      throw errorIa('ia.respuesta_rara', { estado: r.status }, 'La respuesta es demasiado grande.');
    }
    if (!r.ok) {
      const codigo = clasificarErrorIa(r.status, texto, p.tipo);
      const detalle = sinSecretosIa(texto, p.clave);
      if (codigo === 'ia.respuesta_rara') {
        throw errorIa(
          codigo,
          { estado: r.status, ...(detalle ? { detalle } : {}) },
          `(HTTP ${r.status})`,
        );
      }
      throw errorIa(codigo);
    }
    try {
      return JSON.parse(texto) as unknown;
    } catch {
      throw errorIa('ia.respuesta_rara', { estado: r.status }, 'No es JSON.');
    }
  } finally {
    clearTimeout(plazo);
    p.senal?.removeEventListener('abort', cancelar);
  }
}

/** Objeto plano o null. */
export function objeto(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Número finito o undefined. */
export const numero = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/** Lanza `ia.respuesta_rara` si la respuesta no tiene la forma esperada. */
export function forma(): ErrorWolf {
  return errorIa('ia.respuesta_rara', undefined, 'La respuesta no tiene la forma esperada.');
}

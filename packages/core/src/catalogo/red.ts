import { ErrorWolf } from '../errores';

/** Máximo de redirecciones que se siguen en una descarga o en la lectura de un índice. */
export const MAX_SALTOS = 5;

const ESTADOS_REDIRECCION = new Set([301, 302, 303, 307, 308]);

/**
 * `fetch` que sigue las redirecciones a mano: cada salto (incluido el primero) debe ser https y
 * pasar `permitido`, o se corta con `catalogo.redireccion_ajena` **antes** de pedirlo. Así una
 * redirección nunca lleva a un host fuera de las listas, aunque el servidor oficial la mande.
 */
export async function pedirConSaltos(
  f: typeof fetch,
  url: string,
  init: RequestInit,
  permitido: (url: string) => boolean,
  maxSaltos = MAX_SALTOS,
): Promise<Response> {
  let actual = url;
  for (let salto = 0; ; salto++) {
    if (!permitido(actual)) {
      let host = '';
      try {
        host = new URL(actual).hostname;
      } catch {
        host = '';
      }
      throw new ErrorWolf(
        'catalogo.redireccion_ajena',
        `La descarga intentó ir a un sitio no permitido${host ? ` (${host})` : ''}`,
        host ? { host: host.slice(0, 100) } : undefined,
      );
    }
    const res = await f(actual, { ...init, redirect: 'manual' });
    if (!ESTADOS_REDIRECCION.has(res.status)) return res;
    const destino = res.headers.get('location');
    await res.body?.cancel().catch(() => undefined);
    if (!destino) {
      throw new ErrorWolf('catalogo.redireccion_ajena', 'Redirección sin destino');
    }
    if (salto + 1 > maxSaltos) {
      throw new ErrorWolf(
        'catalogo.demasiadas_redirecciones',
        `Demasiadas redirecciones (más de ${maxSaltos})`,
        { maximo: maxSaltos },
      );
    }
    actual = new URL(destino, actual).toString();
  }
}

/**
 * Lee el cuerpo como texto sin pasar de `maxBytes` (5 MB por defecto): si el servidor anuncia o
 * manda más, se corta con `catalogo.respuesta_grande` sin guardar el resto.
 */
export async function leerAcotado(res: Response, maxBytes = 5 * 1024 * 1024): Promise<string> {
  const grande = (): ErrorWolf =>
    new ErrorWolf(
      'catalogo.respuesta_grande',
      `La respuesta pasa del máximo de ${Math.round(maxBytes / 1024)} KB`,
      { maximo: maxBytes },
    );
  const anunciado = Number(res.headers.get('content-length') ?? 0);
  if (anunciado > maxBytes) {
    await res.body?.cancel().catch(() => undefined);
    throw grande();
  }
  if (!res.body) return '';
  const lector = res.body.getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) throw grande();
      trozos.push(value);
    }
  } finally {
    await lector.cancel().catch(() => undefined);
  }
  return Buffer.concat(trozos).toString('utf8');
}

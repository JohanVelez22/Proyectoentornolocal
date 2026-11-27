import { NOMBRE_VARIABLE_SECRETA, enmascararSecretos } from '../patronesSecretos';

/** Cabeceras de credenciales de siempre, más cualquiera que parezca un secreto. */
const SIEMPRE = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'x-api-key',
  'set-cookie',
]);

/** Palabras sueltas de un nombre (`X-Session`, `authCode`, `csrf_token`) que lo hacen secreto. */
const PALABRAS_SECRETAS = new Set([
  'session',
  'sessionid',
  'sid',
  'auth',
  'jwt',
  'sig',
  'signature',
  'csrf',
  'xsrf',
]);

/** ¿El nombre (de cabecera, parámetro, campo, clave JSON o variable) es de un valor secreto? */
export function esNombreSecreto(nombre: string): boolean {
  const n = nombre.trim();
  const minuscula = n.toLowerCase();
  if (SIEMPRE.has(minuscula) || NOMBRE_VARIABLE_SECRETA.test(n)) return true;
  if (/session|csrf|xsrf|signature|jwt/.test(minuscula)) return true;
  const palabras = n
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w !== '');
  // `code` solo cuenta suelto o como `auth_code`/`oauth_code`: `country_code` o `status_code` no.
  const junto = palabras.join('');
  if (junto === 'code' || junto === 'authcode' || junto === 'oauthcode') return true;
  return palabras.some((w) => PALABRAS_SECRETAS.has(w));
}

/**
 * Un texto JSON con el valor de toda clave de nombre secreto (a cualquier profundidad) cambiado
 * por `marca`. null si no es JSON o si no hay nada que ocultar (entonces se deja el texto tal cual).
 */
export function enmascararJson(texto: string, marca: string): string | null {
  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    return null;
  }
  let cambio = false;
  const recorrer = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(recorrer);
    if (x !== null && typeof x === 'object') {
      return Object.fromEntries(
        Object.entries(x).map(([k, v]) => {
          if (esNombreSecreto(k)) {
            cambio = true;
            return [k, marca];
          }
          return [k, recorrer(v)];
        }),
      );
    }
    return x;
  };
  const r = recorrer(valor);
  return cambio ? JSON.stringify(r, null, texto.includes('\n') ? 2 : undefined) : null;
}

/** Cabeceras que nunca acompañan a una redirección a otro origen. */
export function cabeceraDeCredencial(nombre: string): boolean {
  return esNombreSecreto(nombre);
}

export const MARCA_SECRETO = '<secreto>';
export const MASCARA = '***';

/**
 * `{{variable}}`: se admite el nombre con letras, números, `_`, `.` y `-`. Una sola pasada: el valor
 * de una variable no se vuelve a expandir.
 */
export const PATRON_VARIABLE = /\{\{\s*([A-Za-z_][\w.-]{0,63})\s*\}\}/g;

/** Valor que no es un secreto literal: solo referencias a variables (con un esquema opcional). */
const SOLO_VARIABLES =
  /^\s*(?:(?:Bearer|Basic|Token)\s+)?(?:\{\{\s*[A-Za-z_][\w.-]{0,63}\s*\}\}\s*)+$/i;
export const esSoloVariables = (v: string): boolean => SOLO_VARIABLES.test(v);

/** URL para mostrar: sin credenciales y con las claves de la consulta enmascaradas. */
export function urlSinSecretos(url: string): string {
  const sinCred = url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/?#@]*@/i, '$1***@');
  const [antes, resto] = splitConsulta(sinCred);
  if (resto === null) return enmascararSecretos(antes);
  const consulta = resto.consulta
    .split('&')
    .map((par) => {
      const i = par.indexOf('=');
      if (i < 0) return par;
      const k = par.slice(0, i);
      let nombre = k;
      try {
        nombre = decodeURIComponent(k);
      } catch {
        // se usa tal cual
      }
      return esNombreSecreto(nombre) ? `${k}=${MASCARA}` : par;
    })
    .join('&');
  return enmascararSecretos(`${antes}?${consulta}${resto.fragmento}`);
}

/** Separa `base`, `consulta` (sin `?`) y `fragmento` (con `#`); null si no hay consulta. */
export function splitConsulta(
  url: string,
): [string, { consulta: string; fragmento: string } | null] {
  const h = url.indexOf('#');
  const fragmento = h >= 0 ? url.slice(h) : '';
  const sinFrag = h >= 0 ? url.slice(0, h) : url;
  const q = sinFrag.indexOf('?');
  if (q < 0) return [url, null];
  return [sinFrag.slice(0, q), { consulta: sinFrag.slice(q + 1), fragmento }];
}

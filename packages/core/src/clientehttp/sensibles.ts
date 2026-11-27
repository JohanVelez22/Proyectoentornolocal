import { NOMBRE_VARIABLE_SECRETA, enmascararSecretos } from '../patronesSecretos';

/** Cabeceras de credenciales de siempre, más cualquiera que parezca un secreto. */
const SIEMPRE = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'x-api-key',
  'set-cookie',
]);

/** ¿El nombre (de cabecera, parámetro, campo o variable) es de un valor secreto? */
export function esNombreSecreto(nombre: string): boolean {
  const n = nombre.trim();
  return SIEMPRE.has(n.toLowerCase()) || NOMBRE_VARIABLE_SECRETA.test(n);
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

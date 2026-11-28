import { ErrorWolf } from '../errores';

/**
 * Direcciones IPv4 privadas (RFC 1918) y el rango que «Mi red» puede explorar (D53).
 *
 * Todo lo que toca a otros equipos (escaneo, ping, carpetas compartidas, abrir un recurso) pasa
 * por estas funciones: una IP pública, una dirección rara (ceros a la izquierda, octal, hexadecimal,
 * IPv6, nombres) o un rango mayor que un /24 se rechaza SIEMPRE en el núcleo, llegue por donde llegue.
 */

/** Mayor tamaño de red que se explora: un /24 (254 equipos) por adaptador. */
export const MAX_PREFIJO_ESCANEO = 24;
/** Tope de hosts que se pueden explorar de una vez (un /24 sin red ni difusión). */
export const MAX_HOSTS_ESCANEO = 254;

const OCTETO = /^(?:0|[1-9]\d{0,2})$/;

/**
 * IPv4 en notación decimal con puntos, estricta: cuatro octetos de 0 a 255, sin ceros a la
 * izquierda (`010` sería octal para algunas bibliotecas) y sin espacios. null si no es una.
 */
export function ipv4ANumero(ip: unknown): number | null {
  if (typeof ip !== 'string' || ip.length > 15) return null;
  const partes = ip.split('.');
  if (partes.length !== 4) return null;
  let n = 0;
  for (const p of partes) {
    if (!OCTETO.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

export function numeroAIpv4(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

/** ¿Es una IPv4 válida de 10/8, 172.16/12 o 192.168/16? */
export function esPrivadaRfc1918(ip: unknown): ip is string {
  const n = ipv4ANumero(ip);
  if (n === null) return false;
  const a = n >>> 24;
  const b = (n >>> 16) & 255;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Máscara de un prefijo (0 a 32) como número sin signo. */
const mascara = (prefijo: number): number =>
  prefijo === 0 ? 0 : (0xffffffff << (32 - prefijo)) >>> 0;

export interface RangoEscaneo {
  /** Dirección de red (p. ej. 192.168.1.0). */
  red: string;
  /** Prefijo efectivo: nunca menor que 24. */
  prefijo: number;
  /** La IP del propio equipo en esa red (no se le hace ping). */
  propia: string;
  /** Primer y último host (sin la red ni la difusión), como números. */
  primero: number;
  ultimo: number;
}

const rangoNoPermitido = (): ErrorWolf =>
  new ErrorWolf(
    'red.rango_no_permitido',
    'Solo se exploran redes privadas (10.x, 172.16 a 172.31 y 192.168.x), de hasta 254 equipos.',
  );

/**
 * Rango a explorar a partir de la IP y el prefijo del adaptador: la red de esa IP recortada a un
 * /24 como máximo (una /16 se reduce al /24 que contiene la IP del equipo). Lanza
 * `red.rango_no_permitido` si la IP no es privada, el prefijo no es un entero de 8 a 30 o no
 * queda ningún equipo que explorar.
 */
export function rangoDeEscaneo(
  ip: unknown,
  prefijoAdaptador: unknown,
  maxPrefijo = MAX_PREFIJO_ESCANEO,
): RangoEscaneo {
  const propia = ipv4ANumero(ip);
  if (propia === null || !esPrivadaRfc1918(ip)) throw rangoNoPermitido();
  if (
    typeof prefijoAdaptador !== 'number' ||
    !Number.isInteger(prefijoAdaptador) ||
    prefijoAdaptador < 8 ||
    prefijoAdaptador > 30
  ) {
    throw rangoNoPermitido();
  }
  // Nunca más grande que /24, aunque quien llame pida otra cosa.
  const prefijo = Math.max(prefijoAdaptador, Math.max(maxPrefijo, MAX_PREFIJO_ESCANEO));
  const red = (propia & mascara(prefijo)) >>> 0;
  const difusion = (red | (~mascara(prefijo) >>> 0)) >>> 0;
  const primero = red + 1;
  const ultimo = difusion - 1;
  // Todo el rango sigue siendo privado (un /24 dentro de un bloque privado lo es) y cabe en el tope.
  if (
    ultimo < primero ||
    ultimo - primero + 1 > MAX_HOSTS_ESCANEO ||
    !esPrivadaRfc1918(numeroAIpv4(primero)) ||
    !esPrivadaRfc1918(numeroAIpv4(ultimo))
  ) {
    throw rangoNoPermitido();
  }
  return { red: numeroAIpv4(red), prefijo, propia: numeroAIpv4(propia), primero, ultimo };
}

/** Las IP que se exploran: todas las del rango menos la del propio equipo. */
export function ipsDelRango(r: RangoEscaneo): string[] {
  const res: string[] = [];
  const propia = ipv4ANumero(r.propia);
  for (let n = r.primero; n <= r.ultimo; n++) {
    if (n !== propia) res.push(numeroAIpv4(n));
  }
  return res;
}

/** ¿Pertenece la IP a ese rango? */
export function enRango(r: RangoEscaneo, ip: string): boolean {
  const n = ipv4ANumero(ip);
  return n !== null && n >= r.primero && n <= r.ultimo;
}

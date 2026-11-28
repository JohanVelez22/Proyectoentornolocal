import { ErrorWolf } from '../errores';
import { esPrivadaRfc1918 } from './rfc1918';

/**
 * Validación de lo que «Mi red» (D53) manda a otros equipos o al sistema. Estricta a propósito:
 * la IP acaba en los argumentos de `net view` y `ping` y en una ruta UNC, y un nombre de carpeta
 * compartida acaba en un comando elevado. Nada de nombres de equipo, IPv6, ceros a la izquierda ni
 * caracteres de control: solo IPv4 privadas y nombres de recurso sin caracteres raros.
 */

/** Carácter que Windows no admite en un nombre de recurso compartido, los de control y `%` (variables). */
const PROHIBIDOS_RECURSO = /["/\\[\]:|<>+=;,?*%]/u;

/** Caracteres de control (0 a 31 y 127). */
const conControl = (t: string): boolean =>
  [...t].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127);

/** Largo máximo del nombre de un recurso compartido de Windows. */
export const MAX_NOMBRE_RECURSO = 80;

/**
 * Administrativos u ocultos de Windows (`ADMIN$`, `IPC$`, `C$`, `print$`…): todo nombre que termina
 * en `$` se trata como administrativo, nunca se toca ni se abre desde aquí.
 */
export const esNombreAdministrativo = (nombre: string): boolean => nombre.endsWith('$');

/** IPv4 privada estricta (la dirección canónica); lanza `red.equipo_no_valido` si no lo es. */
export function validarIpPrivada(ip: unknown): string {
  if (!esPrivadaRfc1918(ip)) {
    throw new ErrorWolf(
      'red.equipo_no_valido',
      'Solo se admiten direcciones IPv4 privadas de la red local.',
    );
  }
  return ip;
}

/** ¿Es un nombre de recurso o carpeta compartida aceptable? (sin lanzar) */
export function nombreDeRecursoValido(nombre: unknown): nombre is string {
  return (
    typeof nombre === 'string' &&
    nombre.length >= 1 &&
    nombre.length <= MAX_NOMBRE_RECURSO &&
    !PROHIBIDOS_RECURSO.test(nombre) &&
    !conControl(nombre) &&
    nombre === nombre.trim() &&
    !nombre.startsWith('.') &&
    !nombre.endsWith('.') &&
    !esNombreAdministrativo(nombre)
  );
}

/**
 * Nombre de un recurso o carpeta compartida: 1 a 80 caracteres, sin los que Windows prohíbe, sin
 * espacios ni puntos en los extremos. NO admite los administrativos (`C$`, `ADMIN$`, `IPC$`…):
 * ningún nombre que termine en `$`.
 */
export function validarNombreRecurso(nombre: unknown): string {
  if (!nombreDeRecursoValido(nombre)) {
    throw new ErrorWolf('red.recurso_no_valido', 'Nombre de recurso compartido no válido.');
  }
  return nombre;
}

/** Ruta UNC de un recurso de otro equipo: `\\IP\recurso`. Valida los dos tramos. */
export function rutaUncRecurso(ip: unknown, recurso: unknown): string {
  return `\\\\${validarIpPrivada(ip)}\\${validarNombreRecurso(recurso)}`;
}

/**
 * Valida una ruta UNC ya armada (la última barrera del proceso principal antes de abrirla):
 * exactamente `\\<IPv4 privada>\<recurso válido>`, nada más.
 */
export function validarRutaRecursoRed(ruta: unknown): string {
  const m = typeof ruta === 'string' ? /^\\\\([^\\]+)\\([^\\]+)$/.exec(ruta) : null;
  try {
    if (m) return rutaUncRecurso(m[1], m[2]);
  } catch {
    // Abajo: un solo código para cualquier ruta que no cuadre.
  }
  throw new ErrorWolf('red.recurso_no_valido', 'Ruta de recurso no válida.');
}

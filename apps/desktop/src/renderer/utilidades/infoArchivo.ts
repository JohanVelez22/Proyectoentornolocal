/**
 * Ayudas de «Info de archivo» (D55). Funciones puras.
 */

/**
 * ¿Es la raíz de una unidad (`X:\`, `X:/`, `X:`) o la raíz `/` de un sistema POSIX? Analizar una
 * carpeta así recorre el disco entero, por eso se pide confirmación antes.
 */
export function esRaizDeUnidad(ruta: string): boolean {
  return /^[A-Za-z]:[\\/]*$/.test(ruta) || /^\/+$/.test(ruta);
}

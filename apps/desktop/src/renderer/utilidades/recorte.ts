/**
 * Recorte por el centro de un texto largo (ruta, nombre de proyecto): el principio se corta con
 * puntos suspensivos y el final se ve siempre, que es lo que distingue una ruta de otra. Lo hace
 * el CSS de `TextoLargo` (dos tramos: el inicial se encoge, el final no); aquí solo se decide
 * dónde está el corte.
 */
export interface TextoPartido {
  /** Tramo que se acorta con «…» si no cabe. */
  inicio: string;
  /** Tramo final que siempre se ve entero ('' si el texto es corto). */
  fin: string;
}

const SEPARADOR = /[\\/]/;

/**
 * Parte `texto` en inicio y fin. El fin son los últimos `cola` caracteres, adelantados hasta el
 * primer separador de ruta que contengan (así empieza en `\carpeta` y no a media palabra). Un
 * texto que cabe en `cola` no se parte.
 */
export function partirParaRecorte(texto: string, cola = 24): TextoPartido {
  if (cola < 1 || texto.length <= cola) return { inicio: texto, fin: '' };
  let desde = texto.length - cola;
  const separador = texto.slice(desde).search(SEPARADOR);
  // Solo se adelanta si queda algo del tramo (un separador al final no deja el fin vacío).
  if (separador > 0 && separador < cola - 3) desde += separador;
  return { inicio: texto.slice(0, desde), fin: texto.slice(desde) };
}

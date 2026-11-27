import type { AtributosArchivo } from './tipos';

/**
 * Atributos de un archivo o carpeta en Windows (solo lectura y oculto), leídos con `attrib`: solo
 * consulta, nunca cambia nada. La salida es una línea con las letras de los atributos (A, S, H, R,
 * I…) y, a partir de la columna 21, la ruta. Como `attrib` escribe con la página de códigos del
 * sistema, la ruta se reconoce por su unidad (`C:\`) y no se compara con la pedida.
 */
export function interpretarAtributos(stdout: string): AtributosArchivo | null {
  for (const linea of stdout.split(/\r?\n/)) {
    const i = linea.search(/[A-Za-z]:[\\/]/);
    if (i < 0) continue;
    const letras = linea
      .slice(0, i)
      .split(/\s+/)
      .filter((x) => x !== '');
    if (letras.some((x) => !/^[A-Z]+$/.test(x))) continue;
    const marcas = new Set(letras.join('').split(''));
    return { soloLectura: marcas.has('R'), oculto: marcas.has('H') };
  }
  return null;
}

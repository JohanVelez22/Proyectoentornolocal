/** Ayudas de medida de texto para las pruebas de idiomas (no es una prueba). */
const segmentador = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Caracteres percibidos (grafemas), no unidades UTF-16: en hindi las vocales combinadas cuentan 1. */
export const grafemas = (texto: string): number => [...segmentador.segment(texto)].length;

/** zh, ja y ko dicen mucho con 2 a 4 caracteres: su mínimo de «que diga algo» es menor. */
export const esCjk = (id: string): boolean => id === 'zh' || id === 'ja' || id === 'ko';

/** Mínimo de grafemas: el valor dado para los demás idiomas y `cjk` para zh, ja y ko. */
export const minimo = (id: string, general: number, cjk = 2): number =>
  esCjk(id) ? Math.min(general, cjk) : general;

const ANCHO_COMPLETO = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꥠ-꥿가-힣豈-﫿︰-﹯＀-｠￠-￦]/u;

/** Ancho visual en celdas: CJK y caracteres de ancho completo cuentan doble; el resto, 1 por grafema. */
export const anchoVisual = (texto: string): number =>
  [...segmentador.segment(texto)].reduce(
    (suma, { segment }) => suma + (ANCHO_COMPLETO.test(segment) ? 2 : 1),
    0,
  );

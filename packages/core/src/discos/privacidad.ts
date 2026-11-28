/**
 * Privacidad de la salud de los discos (D57): ningún número de serie ni identificador único sale
 * de aquí. Lo ideal es no leerlos (los scripts no los piden); esto enmascara lo que llegara por
 * error dentro de un texto del sistema.
 */

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/g;

/**
 * Una palabra larga (≥ 16) que mezcla letras y cifras parece un número de serie o un identificador:
 * se tapa. Un modelo normal (`Samsung SSD 970 EVO Plus 1TB`) no la tiene.
 */
const PARECE_SERIE = /\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{16,}\b/g;
/** GUID. */
const PARECE_GUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
/** `0x` + 16 o más cifras hexadecimales (identificadores de bajo nivel). */
const PARECE_HEX_LARGO = /\b0x[0-9a-f]{16,}\b/gi;

export function enmascararSerie(texto: string): string {
  return texto.replace(PARECE_GUID, '…').replace(PARECE_HEX_LARGO, '…').replace(PARECE_SERIE, '…');
}

/** Ruta de usuario completa (`C:\Users\nombre\…`), también con `/`. */
const RUTA_USUARIO = /[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"'<>|]+(?:[\\/][^\s"'<>|]*)?/gi;

/**
 * Texto del sistema listo para mostrar o copiar: sin caracteres de control, sin rutas de usuario
 * completas, sin identificadores que parezcan series y acotado.
 */
export function sanearTextoSistema(texto: unknown, max = 300): string {
  if (typeof texto !== 'string') return '';
  const t = texto
    .replace(CONTROL, ' ')
    .replace(RUTA_USUARIO, '[ruta de usuario]')
    .replace(/\s+/g, ' ')
    .trim();
  const sinSerie = enmascararSerie(t);
  return sinSerie.length > max ? `${sinSerie.slice(0, max).trimEnd()}…` : sinSerie;
}

/** Modelo del disco: texto corto, sin control y sin lo que parezca una serie; null si queda vacío. */
export function modeloSeguro(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = enmascararSerie(v.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim())
    .slice(0, 80)
    .trim();
  return t === '' || /^[…\s]+$/.test(t) ? null : t;
}

import path from 'node:path';

/**
 * Ayudas sin estado para los módulos que no reciben la `Plataforma` (funciones puras, pasos de
 * receta, catálogo). Hasta la Etapa E WolfCore Dev solo corre en Windows y todos los binarios del
 * catálogo son de Windows: estas funciones dan los nombres de Windows en cualquier sistema (así
 * las pruebas de macOS y Linux siguen viendo lo mismo). E las hará depender del sistema.
 */

/** Sistema en el que corre el proceso. */
export const sistemaActual = (): NodeJS.Platform => process.platform;

/** `php` → `php.exe` (sin duplicar el sufijo). */
export const nombreEjecutable = (base: string): string =>
  /\.exe$/i.test(base) ? base : `${base}.exe`;

/** Último componente de una ruta, aceptando `\` y `/` (rutas de Windows en cualquier sistema). */
export const nombreArchivoDeRuta = (ruta: string): string => path.win32.basename(ruta);

/** Forma comparable de una ruta: en Windows las mayúsculas no cuentan. */
export const rutaComparable = (ruta: string): string =>
  process.platform === 'win32' ? ruta.toLowerCase() : ruta;

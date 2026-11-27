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

/** ¿Es una ruta absoluta de Windows (`C:/x`, `\\srv\x`) o de Unix (`/x`)? */
export const esRutaAbsoluta = (ruta: string): boolean =>
  path.win32.isAbsolute(ruta) || path.posix.isAbsolute(ruta);

/**
 * ¿Es una ruta absoluta completa en este sistema? En Windows exige la unidad (`X:/…`): `/x` o
 * `\x` dependen de la unidad actual del proceso que la lea (Nginx) y una ruta UNC sale del equipo.
 */
export const esRutaAbsolutaDelSistema = (ruta: string): boolean =>
  process.platform === 'win32' ? /^[A-Za-z]:[\\/]/.test(ruta) : path.posix.isAbsolute(ruta);

/**
 * ¿`ruta` está dentro de `carpeta` (o es ella)? Ambas se vuelven absolutas y normalizadas (`..`
 * no escapa) y se comparan sin mayúsculas en Windows. Una carpeta hermana con el mismo prefijo
 * (`bin-otro`) no cuenta.
 */
export function rutaDentroDe(carpeta: string, ruta: string): boolean {
  if (!carpeta || !ruta) return false;
  const padre = rutaComparable(path.resolve(carpeta));
  const hijo = rutaComparable(path.resolve(ruta));
  const rel = path.relative(padre, hijo);
  if (rel === '') return true;
  return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

/**
 * Nombre y segmentos de una ruta SIN depender del sistema donde corre el código.
 *
 * `path.basename` separa solo por el separador del sistema: fuera de Windows no parte
 * `C:\x\.env` y devuelve la ruta entera, y una clasificación de seguridad por nombre (env, secreto,
 * sensible) fallaba en silencio. Estas funciones separan siempre por `\` y por `/`, así que sirven
 * igual para rutas de Windows, POSIX, mixtas (`C:\a/b\c`) o UNC, vengan de donde vengan (IPC,
 * perfiles importados, datos escritos en otra plataforma). Son puras: valen también en la ventana.
 */

const esBarra = (c: string | undefined): boolean => c === '\\' || c === '/';

/**
 * Último segmento de la ruta, sin barras finales.
 * - `C:\x\carpeta\` → `carpeta`; `C:\a/b\c.env` → `c.env`; `\\srv\share\a.txt` → `a.txt`.
 * - Raíces: `C:\` → `C:` (la unidad), `/` → `''`, `\\srv\share\` → `share`.
 */
export function nombreDeRuta(ruta: string): string {
  let fin = ruta.length;
  while (fin > 0 && esBarra(ruta[fin - 1])) fin--;
  let ini = fin;
  while (ini > 0 && !esBarra(ruta[ini - 1])) ini--;
  return ruta.slice(ini, fin);
}

/** Segmentos de la ruta separando por `\` y `/`, sin los vacíos (`C:\a//b\` → `C:`, `a`, `b`). */
export function segmentosDeRuta(ruta: string): string[] {
  return ruta.split(/[\\/]/).filter((s) => s !== '');
}

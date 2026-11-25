import { access, readFile, stat } from 'node:fs/promises';

/** true si la ruta existe (archivo o carpeta). */
export async function existe(ruta: string): Promise<boolean> {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}

/** Tope de lo que `leerTexto` abre: un archivo de proyecto más grande no es una configuración. */
export const MAX_BYTES_TEXTO = 16 * 1024 * 1024;

/**
 * Texto UTF-8 sin BOM, o null si no se puede leer: no existe, no es un archivo normal (carpeta,
 * tubería) o pesa más de `MAX_BYTES_TEXTO`. Los proyectos de otros (importados, clonados) pueden
 * traer cualquier cosa; un archivo enorme no debe agotar la memoria.
 */
export async function leerTexto(ruta: string): Promise<string | null> {
  try {
    const info = await stat(ruta);
    if (!info.isFile() || info.size > MAX_BYTES_TEXTO) return null;
    const t = await readFile(ruta, 'utf8');
    return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
  } catch {
    return null;
  }
}

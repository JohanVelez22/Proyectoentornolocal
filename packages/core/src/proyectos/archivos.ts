import { access, readFile } from 'node:fs/promises';

/** true si la ruta existe (archivo o carpeta). */
export async function existe(ruta: string): Promise<boolean> {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}

/** Texto UTF-8 sin BOM, o null si no se puede leer. */
export async function leerTexto(ruta: string): Promise<string | null> {
  try {
    const t = await readFile(ruta, 'utf8');
    return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
  } catch {
    return null;
  }
}

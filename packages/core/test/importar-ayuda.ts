import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carpetaTemporal } from './temporales';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'importar');

/**
 * Copia un fixture a una carpeta temporal: `@RAIZ@` pasa a ser la ruta real de la copia (con
 * barras normales, como las escriben Laragon y XAMPP) y `dot-env` vuelve a llamarse `.env` (el
 * repositorio no confirma archivos `.env`). Devuelve la raíz de la copia.
 */
export async function copiarFixture(
  nombre: 'laragon' | 'xampp' | 'herd',
  raizDestino?: string,
): Promise<string> {
  const raiz = raizDestino ?? path.join(await carpetaTemporal('pel-imp-'), nombre);
  await mkdir(raiz, { recursive: true });
  const texto = raiz.replace(/\\/g, '/');
  async function recorrer(origen: string, destino: string): Promise<void> {
    await mkdir(destino, { recursive: true });
    for (const e of await readdir(origen, { withFileTypes: true })) {
      const o = path.join(origen, e.name);
      const d = path.join(destino, e.name === 'dot-env' ? '.env' : e.name);
      if (e.isDirectory()) await recorrer(o, d);
      else await writeFile(d, (await readFile(o, 'utf8')).replaceAll('@RAIZ@', texto));
    }
  }
  await recorrer(path.join(FIXTURES, nombre), raiz);
  return raiz;
}

/** Hash del árbol (rutas, tamaños y contenido) para comprobar que nada cambió. */
export async function hashArbol(raiz: string): Promise<string> {
  const h = createHash('sha256');
  async function rec(d: string): Promise<void> {
    for (const e of (await readdir(d, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const p = path.join(d, e.name);
      h.update(`${path.relative(raiz, p)}\n`);
      if (e.isDirectory()) await rec(p);
      else if (e.isFile()) h.update(await readFile(p));
    }
  }
  await rec(raiz);
  return h.digest('hex');
}

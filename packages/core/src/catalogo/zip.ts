import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';

/**
 * Extrae un zip en `destino`. Usa yauzl 3 directamente: extract-zip 2 (yauzl 2 + fd-slicer)
 * se queda colgado en Node 26 con entradas comprimidas grandes. Rechaza entradas con rutas
 * absolutas o que salen de `destino` (zip-slip).
 */
export async function extraerZip(archivo: string, destino: string): Promise<void> {
  const raiz = path.resolve(destino);
  await mkdir(raiz, { recursive: true });
  const zip = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.open(archivo, { lazyEntries: true, autoClose: false }, (e, z) =>
      e || !z ? reject(e ?? new Error('No se pudo abrir el zip')) : resolve(z),
    );
  });
  try {
    await new Promise<void>((resolve, reject) => {
      let fallo = false;
      const abortar = (e: unknown): void => {
        if (fallo) return;
        fallo = true;
        reject(e instanceof Error ? e : new Error(String(e)));
      };
      zip.on('error', abortar);
      zip.on('end', () => {
        if (!fallo) resolve();
      });
      zip.on('entry', (entrada: yauzl.Entry) => {
        void (async () => {
          const nombre = entrada.fileName.replace(/\\/g, '/');
          if (path.isAbsolute(nombre) || /^[a-zA-Z]:/.test(nombre)) {
            throw new Error(`El zip contiene una ruta absoluta: ${entrada.fileName}`);
          }
          const final = path.resolve(raiz, nombre);
          const rel = path.relative(raiz, final);
          if (rel.startsWith('..') || path.isAbsolute(rel)) {
            throw new Error(`El zip contiene una ruta fuera del destino: ${entrada.fileName}`);
          }
          if (nombre.endsWith('/')) {
            await mkdir(final, { recursive: true });
          } else {
            await mkdir(path.dirname(final), { recursive: true });
            const lectura = await new Promise<NodeJS.ReadableStream>((res, rej) => {
              zip.openReadStream(entrada, (e, s) =>
                e || !s ? rej(e ?? new Error('No se pudo leer la entrada')) : res(s),
              );
            });
            await pipeline(lectura, createWriteStream(final));
          }
          if (!fallo) zip.readEntry();
        })().catch(abortar);
      });
      zip.readEntry();
    });
  } finally {
    zip.close();
  }
}

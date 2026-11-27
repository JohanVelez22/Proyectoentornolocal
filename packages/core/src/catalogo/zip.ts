import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';
import { ErrorWolf } from '../errores';

/** true si algún tramo de la ruta termina en ".asar" (sin distinguir mayúsculas). */
function esAsar(nombre: string): boolean {
  return nombre.split('/').some((tramo) => /\.asar$/i.test(tramo));
}

/**
 * Topes de un zip: holgados para que quepan el JDK, el SDK de .NET (decenas de miles de
 * archivos) o MongoDB, y suficientes para cortar una bomba de descompresión.
 */
export const MAX_ENTRADAS_ZIP = 150_000;
export const MAX_BYTES_ZIP = 8 * 1024 * 1024 * 1024;

export interface LimitesZip {
  maxEntradas?: number;
  /** Suma de los tamaños descomprimidos declarados. */
  maxBytes?: number;
}

/**
 * Extrae un zip en `destino`. Usa yauzl 3 directamente: extract-zip 2 (yauzl 2 + fd-slicer)
 * se queda colgado en Node 26 con entradas comprimidas grandes. Rechaza entradas con rutas
 * absolutas o que salen de `destino` (zip-slip).
 */
export async function extraerZip(
  archivo: string,
  destino: string,
  limites: LimitesZip = {},
): Promise<void> {
  const maxEntradas = limites.maxEntradas ?? MAX_ENTRADAS_ZIP;
  const maxBytes = limites.maxBytes ?? MAX_BYTES_ZIP;
  let entradas = 0;
  let bytes = 0;
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
          entradas++;
          bytes += entrada.uncompressedSize;
          if (entradas > maxEntradas || bytes > maxBytes) {
            throw new ErrorWolf(
              'instalador.zip_demasiado_grande',
              'El paquete descargado es demasiado grande o trae demasiados archivos',
            );
          }
          const nombre = entrada.fileName.replace(/\\/g, '/');
          if (path.isAbsolute(nombre) || /^[a-zA-Z]:/.test(nombre)) {
            throw new Error(`El zip contiene una ruta absoluta: ${entrada.fileName}`);
          }
          const final = path.resolve(raiz, nombre);
          const rel = path.relative(raiz, final);
          if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
            throw new Error(`El zip contiene una ruta fuera del destino: ${entrada.fileName}`);
          }
          if (esAsar(nombre)) {
            // Dentro de Electron, fs trata cualquier ruta con un tramo "*.asar" como un paquete
            // y escribirla falla ("Invalid package"). Solo aparecen en apps de Electron que
            // vienen de regalo (pgAdmin 4 en el zip de PostgreSQL); ningún servicio los usa.
            if (!fallo) zip.readEntry();
            return;
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

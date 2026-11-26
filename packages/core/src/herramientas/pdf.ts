import { createRequire } from 'node:module';
import { lstat, open, readFile, rm } from 'node:fs/promises';
import { Worker } from 'node:worker_threads';
import { ErrorWolf } from '../errores';
import { abrirNuevo } from './salidaNueva';

/**
 * Optimizar un PDF re-guardándolo con `pdf-lib` y flujos de objetos (D33).
 *
 * El PDF es una entrada no confiable y `pdf-lib` es síncrono y puede tardar mucho (o no terminar)
 * con un archivo malformado. Por eso el trabajo corre en un hilo aparte con plazo y límite de
 * memoria: si se pasa, el hilo se termina y el error trae un código; la aplicación nunca se
 * cuelga. Además hay tope de tamaño, se exige la cabecera `%PDF-`, no se abren PDF cifrados y el
 * original no se toca nunca. Si el resultado no pesa menos, no se deja ningún archivo.
 *
 * El código del hilo va en una cadena (`eval`) y carga `pdf-lib` por su ruta absoluta, como el
 * pool de bcrypt (D20): no hace falta un segundo punto de entrada en el empaquetado.
 */

export const LIMITES_PDF = {
  bytes: 50 * 1024 * 1024,
  plazoMs: 60_000,
  memoriaMb: 1536,
} as const;

export interface OpcionesPdf {
  /** Tope de tamaño de entrada (pruebas). */
  maxBytes?: number;
  /** Plazo del hilo (pruebas). */
  plazoMs?: number;
  /** Módulo `pdf-lib` que carga el hilo (pruebas); por omisión, el de `pdf-lib`. */
  modulo?: string;
}

export interface ResultadoPdf {
  antes: number;
  despues: number;
  /** ¿El resultado pesa menos que el original? Si no, no se escribió ningún archivo. */
  mejoro: boolean;
  archivo: string | null;
}

const CODIGO_HILO = `
const { parentPort, workerData } = require('node:worker_threads');
(async () => {
  try {
    const { PDFDocument } = require(workerData.modulo);
    const doc = await PDFDocument.load(workerData.datos, {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    // pdf-lib acepta casi cualquier cosa tras la cabecera; un PDF sin páginas no es utilizable.
    if (doc.getPageCount() === 0) throw new Error('sin páginas');
    const salida = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    parentPort.postMessage({ ok: true, datos: salida }, [salida.buffer]);
  } catch (e) {
    const cifrado = e && (e.name === 'EncryptedPDFError' || /encrypted/i.test(String(e.message)));
    parentPort.postMessage({ ok: false, cifrado: Boolean(cifrado) });
  }
})();
`;

function rutaPdfLib(): string | null {
  try {
    const req: NodeRequire =
      typeof require === 'function' ? require : createRequire(import.meta.url);
    return req.resolve('pdf-lib');
  } catch {
    return null;
  }
}

const invalido = (): ErrorWolf =>
  new ErrorWolf('herramientas.pdf_invalido', 'El archivo no es un PDF que se pueda optimizar.');

/** Re-guarda en un hilo con plazo; devuelve los bytes nuevos o lanza un `ErrorWolf`. */
function reguardar(datos: Uint8Array, modulo: string, plazoMs: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    let w: Worker;
    try {
      w = new Worker(CODIGO_HILO, {
        eval: true,
        workerData: { modulo, datos },
        resourceLimits: { maxOldGenerationSizeMb: LIMITES_PDF.memoriaMb },
      });
    } catch {
      reject(invalido());
      return;
    }
    let cerrado = false;
    const cerrar = (accion: () => void): void => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(reloj);
      void w.terminate();
      accion();
    };
    const reloj = setTimeout(
      () =>
        cerrar(() =>
          reject(
            new ErrorWolf('herramientas.pdf_plazo', 'El PDF tardó demasiado y se canceló.', {
              segundos: Math.max(1, Math.round(plazoMs / 1000)),
            }),
          ),
        ),
      plazoMs,
    );
    w.on('message', (m: { ok: boolean; datos?: Uint8Array; cifrado?: boolean }) =>
      cerrar(() => {
        if (m.ok && m.datos) resolve(m.datos);
        else
          reject(
            m.cifrado
              ? new ErrorWolf('herramientas.pdf_cifrado', 'El PDF está cifrado.')
              : invalido(),
          );
      }),
    );
    w.on('error', () => cerrar(() => reject(invalido())));
    w.on('exit', () => cerrar(() => reject(invalido())));
  });
}

/**
 * Optimiza `origen` y, solo si pesa menos, lo escribe en un archivo nuevo (`destino`; si existe,
 * `nombre (1).pdf`). Ambas rutas salen de diálogos.
 */
export async function optimizarPdf(
  origen: string,
  destino: string,
  o: OpcionesPdf = {},
): Promise<ResultadoPdf> {
  const maxBytes = o.maxBytes ?? LIMITES_PDF.bytes;
  let st;
  try {
    st = await lstat(origen);
  } catch {
    throw invalido();
  }
  if (!st.isFile()) throw invalido();
  if (st.size > maxBytes) {
    throw new ErrorWolf('herramientas.pdf_grande', 'El PDF pesa demasiado.', {
      maximo: `${Math.round(maxBytes / (1024 * 1024))} MB`,
    });
  }
  const original = await readFile(origen);
  if (original.subarray(0, 1024).indexOf('%PDF-') < 0) throw invalido();

  const modulo = o.modulo ?? rutaPdfLib();
  if (!modulo) throw invalido();
  const nuevo = await reguardar(new Uint8Array(original), modulo, o.plazoMs ?? LIMITES_PDF.plazoMs);

  const antes = original.byteLength;
  if (nuevo.byteLength >= antes) {
    return { antes, despues: nuevo.byteLength, mejoro: false, archivo: null };
  }
  const { ruta, handle } = await abrirNuevo(destino);
  try {
    await handle.writeFile(nuevo);
    await handle.close();
  } catch (e) {
    await handle.close().catch(() => undefined);
    await rm(ruta, { force: true }).catch(() => undefined);
    throw e;
  }
  // Se confirma lo escrito (el hilo ya terminó; esto solo lee el tamaño final).
  const f = await open(ruta, 'r');
  try {
    return { antes, despues: (await f.stat()).size, mejoro: true, archivo: ruta };
  } finally {
    await f.close();
  }
}

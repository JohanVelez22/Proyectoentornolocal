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
  /** Lo que puede inflarse un solo flujo de objetos o de contenido (un PDF de 1 MB puede declarar 1 GB). */
  topeStreamMb: 256,
  /** Lo que pueden inflarse todos los flujos juntos. */
  topeTotalMb: 512,
  /** Crecimiento máximo del RSS del proceso mientras corre el hilo (memoria externa incluida). */
  crecimientoMb: 768,
} as const;

export interface OpcionesPdf {
  /** Tope de tamaño de entrada (pruebas). */
  maxBytes?: number;
  /** Plazo del hilo (pruebas). */
  plazoMs?: number;
  /** Módulo `pdf-lib` que carga el hilo (pruebas); por omisión, el de `pdf-lib`. */
  modulo?: string;
  /** Topes de inflado y de crecimiento del RSS (pruebas); por omisión, `LIMITES_PDF`. */
  topeStreamMb?: number;
  topeTotalMb?: number;
  crecimientoMb?: number;
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
let excedido = false;
// pdf-lib infla los flujos (también los de objetos, ObjStm) en un solo búfer que se duplica: un
// PDF de 1 MB puede declarar 1 GB. maxOldGenerationSizeMb no limita esos búferes, así que se
// cortan aquí, por flujo y en total, antes de reservar la memoria.
try {
  const ruta = require('node:path');
  const DecodeStream = require(
    ruta.join(ruta.dirname(workerData.modulo), 'core', 'streams', 'DecodeStream.js'),
  ).default;
  const original = DecodeStream.prototype.ensureBuffer;
  let total = 0;
  DecodeStream.prototype.ensureBuffer = function (pedido) {
    if (pedido > workerData.topeStream) {
      excedido = true;
      throw new Error('flujo demasiado grande');
    }
    const antes = this.buffer.byteLength;
    const r = original.call(this, pedido);
    total += this.buffer.byteLength - antes;
    if (total > workerData.topeTotal) {
      excedido = true;
      throw new Error('flujos demasiado grandes');
    }
    return r;
  };
} catch (e) {
  // Un módulo de pruebas sin esa estructura: sigue el vigía de memoria del proceso principal.
}
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
    parentPort.postMessage({ ok: false, cifrado: Boolean(cifrado), complejo: excedido });
  }
})();
`;

/**
 * Empaquetado: dentro del .asar el hilo no puede cargar módulos de forma fiable; las dependencias
 * de pdf-lib van en `asarUnpack` y se usa la ruta `app.asar.unpacked`.
 */
export function rutaDesempaquetada(ruta: string): string {
  return ruta.replace(/\.asar(?=[\\/])/, '.asar.unpacked');
}

function rutaPdfLib(): string | null {
  try {
    const req: NodeRequire =
      typeof require === 'function' ? require : createRequire(import.meta.url);
    return rutaDesempaquetada(req.resolve('pdf-lib'));
  } catch {
    return null;
  }
}

const complejo = (): ErrorWolf =>
  new ErrorWolf(
    'herramientas.pdf_demasiado_complejo',
    'El PDF es demasiado complejo (inflaría más memoria de la permitida) y se canceló.',
  );

const invalido = (): ErrorWolf =>
  new ErrorWolf('herramientas.pdf_invalido', 'El archivo no es un PDF que se pueda optimizar.');

/** Re-guarda en un hilo con plazo; devuelve los bytes nuevos o lanza un `ErrorWolf`. */
function reguardar(
  datos: Uint8Array,
  modulo: string,
  plazoMs: number,
  topes: { stream: number; total: number; crecimiento: number },
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    let w: Worker;
    try {
      w = new Worker(CODIGO_HILO, {
        eval: true,
        workerData: { modulo, datos, topeStream: topes.stream, topeTotal: topes.total },
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
      clearInterval(vigia);
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
    // Vigía del RSS: los búferes (memoria externa) no cuentan para `maxOldGenerationSizeMb`.
    const rssInicial = process.memoryUsage().rss;
    const vigia = setInterval(() => {
      if (process.memoryUsage().rss - rssInicial > topes.crecimiento) {
        cerrar(() => reject(complejo()));
      }
    }, 50);
    w.on(
      'message',
      (m: { ok: boolean; datos?: Uint8Array; cifrado?: boolean; complejo?: boolean }) =>
        cerrar(() => {
          if (m.ok && m.datos) resolve(m.datos);
          else if (m.complejo) reject(complejo());
          else
            reject(
              m.cifrado
                ? new ErrorWolf('herramientas.pdf_cifrado', 'El PDF está cifrado.')
                : invalido(),
            );
        }),
    );
    w.on('error', (e: Error & { code?: string }) =>
      cerrar(() => reject(e.code === 'ERR_WORKER_OUT_OF_MEMORY' ? complejo() : invalido())),
    );
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
  const nuevo = await reguardar(
    new Uint8Array(original),
    modulo,
    o.plazoMs ?? LIMITES_PDF.plazoMs,
    {
      stream: (o.topeStreamMb ?? LIMITES_PDF.topeStreamMb) * 1024 * 1024,
      total: (o.topeTotalMb ?? LIMITES_PDF.topeTotalMb) * 1024 * 1024,
      crecimiento: (o.crecimientoMb ?? LIMITES_PDF.crecimientoMb) * 1024 * 1024,
    },
  );

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

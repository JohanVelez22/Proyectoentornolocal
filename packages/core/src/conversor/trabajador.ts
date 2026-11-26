import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { ErrorWolf } from '../errores';

/**
 * Hilo de trabajo del conversor (D34). Las bibliotecas de documentos (mammoth, exceljs, pdfjs)
 * son pesadas y síncronas en buena parte, y el documento es una entrada no confiable: se ejecutan
 * en un `Worker` con límite de memoria y plazo. Si el plazo vence, el hilo se termina; si se
 * agota la memoria, el hilo cae solo; en ambos casos el error trae un código y la aplicación
 * sigue viva. El hilo no tiene ninguna ruta de red: el código no hace `fetch` ni abre sockets.
 *
 * Como en D33, el código del hilo va en una cadena (`eval`) y carga cada biblioteca por su ruta
 * absoluta: no hace falta un segundo punto de entrada en el empaquetado.
 */

export interface RutasModulos {
  mammoth: string;
  exceljs: string;
  /** URL `file:` del módulo ESM de pdf.js. */
  pdfjs: string;
}

const CODIGO_HILO = `
const { parentPort, workerData: W } = require('node:worker_threads');
const falla = (codigo, extra) => parentPort.postMessage({ ok: false, codigo, ...(extra || {}) });
const bytes = () => Buffer.from(W.datos.buffer, W.datos.byteOffset, W.datos.byteLength);

// Sin enlaces peligrosos en lo que sale de un documento de Word (también en Markdown).
const ESQUEMA_OK = /^(?:https?:|mailto:|#|[^:]*$)/i;
function limpiar(el) {
  let r = el;
  if (r && r.type === 'hyperlink' && typeof r.href === 'string') {
    const h = r.href.replace(/[\\u0000-\\u0020\\u007f-\\u009f]/g, '');
    if (!ESQUEMA_OK.test(h)) r = Object.assign({}, r, { href: '#' });
  }
  if (r && Array.isArray(r.children)) r = Object.assign({}, r, { children: r.children.map(limpiar) });
  return r;
}

function valor(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
    if (v.formula !== undefined || v.sharedFormula !== undefined) return valor(v.result);
    if (v.error !== undefined) return String(v.error);
    if (v.text !== undefined) return valor(v.text);
  }
  return String(v);
}

async function docx() {
  const mammoth = require(W.rutas.mammoth);
  const entrada = { buffer: bytes() };
  // Sin externalFileAccess: las imágenes o archivos enlazados fuera del documento no se leen.
  const opciones = { transformDocument: limpiar };
  let r;
  if (W.formato === 'html') r = await mammoth.convertToHtml(entrada, opciones);
  else if (W.formato === 'md') r = await mammoth.convertToMarkdown(entrada, opciones);
  else r = await mammoth.extractRawText(entrada);
  if (r.value.length > W.lim.salida) return falla('salida_grande');
  parentPort.postMessage({ ok: true, texto: r.value });
}

async function xlsxAFilas() {
  const ExcelJS = require(W.rutas.exceljs);
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(bytes());
  const hoja = libro.worksheets[0]; // solo la primera hoja
  const filas = [];
  if (hoja) {
    if (hoja.rowCount > W.lim.filas) return falla('limite_filas');
    if (hoja.columnCount > W.lim.columnas) return falla('limite_columnas');
    for (let r = 1; r <= hoja.rowCount; r++) {
      const v = hoja.getRow(r).values || [];
      const salida = [];
      for (let i = 1; i <= hoja.columnCount; i++) salida.push(valor(v[i]));
      filas.push(salida);
    }
  }
  parentPort.postMessage({ ok: true, filas });
}

async function filasAXlsx() {
  const ExcelJS = require(W.rutas.exceljs);
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Hoja1');
  for (const f of W.filas) hoja.addRow(f);
  const buf = await libro.xlsx.writeBuffer();
  const datos = new Uint8Array(buf);
  parentPort.postMessage({ ok: true, datos }, [datos.buffer]);
}

async function pdf() {
  const pdfjs = await import(W.rutas.pdfjs);
  const tarea = pdfjs.getDocument({
    data: new Uint8Array(W.datos),
    // Nada de JavaScript del PDF: ni eval de fuentes, ni XFA, ni fuentes del sistema.
    isEvalSupported: false,
    enableXfa: false,
    useSystemFonts: false,
    disableFontFace: true,
    useWorkerFetch: false,
    verbosity: 0,
  });
  let doc;
  try {
    doc = await tarea.promise;
  } catch (e) {
    return falla(e && e.name === 'PasswordException' ? 'cifrado' : 'invalido');
  }
  if (doc.numPages > W.lim.paginas) return falla('limite_paginas');
  let texto = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i);
    const contenido = await pagina.getTextContent();
    for (const it of contenido.items) {
      if (typeof it.str === 'string') texto += it.str + (it.hasEOL ? '\\n' : '');
    }
    texto += '\\n\\n';
    pagina.cleanup();
    if (texto.length > W.lim.salida) return falla('salida_grande');
  }
  await tarea.destroy();
  parentPort.postMessage({ ok: true, texto: texto.trim() + '\\n' });
}

const OPERACIONES = { docx, xlsxAFilas, filasAXlsx, pdf };
(async () => {
  try {
    await OPERACIONES[W.op]();
  } catch (e) {
    falla('invalido');
  }
})();
`;

function resolver(): RutasModulos {
  const req: NodeRequire = typeof require === 'function' ? require : createRequire(import.meta.url);
  const pdfjs = path.join(
    path.dirname(req.resolve('pdfjs-dist/package.json')),
    'legacy',
    'build',
    'pdf.mjs',
  );
  return {
    mammoth: req.resolve('mammoth'),
    exceljs: req.resolve('exceljs'),
    pdfjs: pathToFileURL(pdfjs).href,
  };
}

export interface LimitesHilo {
  plazoMs: number;
  memoriaMb: number;
  /**
   * Crecimiento máximo de la memoria del proceso (RSS) mientras corre el hilo. `memoriaMb` solo
   * limita el montón de V8: los `Buffer`/`ArrayBuffer` (un PDF de 1 MB inflado a 1 GB, un XML
   * grande) son memoria externa. Se vigila desde fuera del hilo y, si pasa, se termina.
   */
  crecimientoMb: number;
  filas: number;
  columnas: number;
  paginas: number;
  /** Tope de caracteres de lo que devuelve el hilo. */
  salida: number;
}

export type OperacionHilo = 'docx' | 'xlsxAFilas' | 'filasAXlsx' | 'pdf';

export interface SalidaHilo {
  texto?: string;
  filas?: (string | number | boolean | null)[][];
  datos?: Uint8Array;
}

export interface EntradaHilo {
  op: OperacionHilo;
  datos?: Uint8Array;
  filas?: unknown;
  formato?: 'html' | 'md' | 'txt';
  lim: LimitesHilo;
  senal?: AbortSignal;
  /** Para pruebas: otras rutas de módulos. */
  rutas?: RutasModulos;
}

const MB = 1024 * 1024;

function errorDeHilo(codigo: string, lim: LimitesHilo): ErrorWolf {
  switch (codigo) {
    case 'cifrado':
      return new ErrorWolf('conversor.pdf_cifrado', 'El PDF está cifrado.');
    case 'limite_filas':
      return new ErrorWolf('conversor.limite_filas', 'La tabla tiene demasiadas filas.', {
        maximo: lim.filas,
      });
    case 'limite_columnas':
      return new ErrorWolf('conversor.limite_columnas', 'La tabla tiene demasiadas columnas.', {
        maximo: lim.columnas,
      });
    case 'limite_paginas':
      return new ErrorWolf('conversor.limite_paginas', 'El PDF tiene demasiadas páginas.', {
        maximo: lim.paginas,
      });
    case 'salida_grande':
      return new ErrorWolf('conversor.archivo_grande', 'El resultado pesa demasiado.', {
        maximo: `${Math.round(lim.salida / MB)} MB`,
      });
    default:
      return new ErrorWolf(
        'conversor.archivo_invalido',
        'El archivo está dañado o no es del tipo indicado.',
      );
  }
}

/** Ejecuta una operación en un hilo con plazo, memoria acotada y cancelación. */
export function ejecutarHilo(e: EntradaHilo): Promise<SalidaHilo> {
  return new Promise((resolve, reject) => {
    if (e.senal?.aborted) {
      reject(new ErrorWolf('conversor.cancelado', 'Conversión cancelada.'));
      return;
    }
    let w: Worker;
    try {
      w = new Worker(CODIGO_HILO, {
        eval: true,
        workerData: {
          op: e.op,
          datos: e.datos,
          filas: e.filas,
          formato: e.formato,
          lim: e.lim,
          rutas: e.rutas ?? resolver(),
        },
        resourceLimits: { maxOldGenerationSizeMb: e.lim.memoriaMb },
      });
    } catch {
      reject(errorDeHilo('invalido', e.lim));
      return;
    }
    let cerrado = false;
    const cerrar = (accion: () => void): void => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(reloj);
      clearInterval(vigia);
      e.senal?.removeEventListener('abort', alAbortar);
      void w.terminate();
      accion();
    };
    const reloj = setTimeout(
      () =>
        cerrar(() =>
          reject(
            new ErrorWolf('conversor.plazo', 'La conversión tardó demasiado y se canceló.', {
              segundos: Math.max(1, Math.round(e.lim.plazoMs / 1000)),
            }),
          ),
        ),
      e.lim.plazoMs,
    );
    const rssInicial = process.memoryUsage().rss;
    const vigia = setInterval(() => {
      if (process.memoryUsage().rss - rssInicial > e.lim.crecimientoMb * MB) {
        cerrar(() =>
          reject(
            new ErrorWolf(
              'conversor.archivo_peligroso',
              'El archivo es demasiado complejo y se canceló.',
            ),
          ),
        );
      }
    }, 50);
    const alAbortar = (): void =>
      cerrar(() => reject(new ErrorWolf('conversor.cancelado', 'Conversión cancelada.')));
    e.senal?.addEventListener('abort', alAbortar, { once: true });

    w.on('message', (m: { ok: boolean; codigo?: string } & SalidaHilo) =>
      cerrar(() => (m.ok ? resolve(m) : reject(errorDeHilo(m.codigo ?? '', e.lim)))),
    );
    w.on('error', (err: Error & { code?: string }) =>
      cerrar(() =>
        reject(
          err.code === 'ERR_WORKER_OUT_OF_MEMORY'
            ? new ErrorWolf(
                'conversor.archivo_peligroso',
                'El archivo es demasiado complejo y se canceló.',
              )
            : errorDeHilo('invalido', e.lim),
        ),
      ),
    );
    w.on('exit', () => cerrar(() => reject(errorDeHilo('invalido', e.lim))));
  });
}

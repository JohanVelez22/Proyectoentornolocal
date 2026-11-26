import { lstat, open, rm } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { abrirNuevo } from '../herramientas/salidaNueva';
import { convertirConLibreOffice, type Lanzar } from './libreoffice';
import {
  errorDeRespuesta,
  resolverRutas,
  type EjecutorTrabajo,
  type LimitesTrabajo,
  type MensajeTrabajo,
  type RespuestaTrabajo,
  type RutasModulos,
} from './protocolo';

/**
 * Conversor de documentos local (D34). Nada sale del equipo: no hay `fetch` ni red en ningún
 * paso. Cada documento es una entrada no confiable:
 *
 * - tope de tamaño de entrada; la entrada se lee UNA vez (`open` + `fstat` + lectura con tope
 *   sobre el mismo descriptor) y esos mismos bytes se revisan y se convierten;
 * - TODO lo pesado va en un proceso de trabajo aparte (`EjecutorTrabajo`, inyectado): revisión del ZIP
 *   con JSZip (`zipSeguro.ts`), mammoth, exceljs, pdfjs, análisis del CSV, markdown-it y saneado
 *   de HTML, con plazo y vigilancia de su memoria. Este módulo solo coordina;
 * - tablas con tope de filas, columnas y celdas; fórmulas neutralizadas al escribir hojas;
 * - HTML siempre saneado; la salida nunca pisa un archivo (`abrirNuevo`) y siempre lleva la
 *   extensión del formato pedido, venga lo que venga del diálogo.
 */

export type Formato =
  'docx' | 'xlsx' | 'csv' | 'md' | 'html' | 'pdf' | 'txt' | 'odt' | 'pptx' | 'doc';

export type Motor = 'interno' | 'libreoffice';

export interface Conversion {
  de: Formato;
  a: Formato;
  motor: Motor;
}

export const CONVERSIONES: readonly Conversion[] = [
  { de: 'docx', a: 'html', motor: 'interno' },
  { de: 'docx', a: 'md', motor: 'interno' },
  { de: 'docx', a: 'txt', motor: 'interno' },
  { de: 'xlsx', a: 'csv', motor: 'interno' },
  { de: 'csv', a: 'xlsx', motor: 'interno' },
  { de: 'md', a: 'html', motor: 'interno' },
  // Estas dos necesitan que la aplicación aporte el motor de impresión (Chromium de Electron).
  { de: 'md', a: 'pdf', motor: 'interno' },
  { de: 'html', a: 'pdf', motor: 'interno' },
  { de: 'pdf', a: 'txt', motor: 'interno' },
  { de: 'docx', a: 'pdf', motor: 'libreoffice' },
  { de: 'docx', a: 'odt', motor: 'libreoffice' },
  { de: 'odt', a: 'docx', motor: 'libreoffice' },
  { de: 'odt', a: 'pdf', motor: 'libreoffice' },
  { de: 'odt', a: 'txt', motor: 'libreoffice' },
  { de: 'odt', a: 'html', motor: 'libreoffice' },
  { de: 'doc', a: 'docx', motor: 'libreoffice' },
  { de: 'doc', a: 'pdf', motor: 'libreoffice' },
  { de: 'doc', a: 'txt', motor: 'libreoffice' },
  { de: 'pptx', a: 'pdf', motor: 'libreoffice' },
];

const MB = 1024 * 1024;

export const LIMITES_CONVERSOR = {
  bytesEntrada: 50 * MB,
  /** Markdown y HTML: tope menor (se convierten a una cadena grande en memoria). */
  bytesEntradaTexto: 10 * MB,
  entradasZip: 10_000,
  bytesDescomprimidos: 500 * MB,
  proporcion: 200,
  plazoMs: 120_000,
  filas: 200_000,
  columnas: 1_000,
  /** Filas × columnas, tanto al leer un CSV como un xlsx. */
  celdas: 5_000_000,
  paginasPdf: 5_000,
  bytesSalida: 200 * MB,
  /** Lo que puede inflarse un flujo de un PDF y todos juntos (pdf-lib), en MB. */
  topeStreamMb: 256,
  topeTotalMb: 512,
} as const;

export type LimitesConversor = { -readonly [K in keyof typeof LIMITES_CONVERSOR]: number };

/** Imprime un HTML (ya saneado) a PDF; lo aporta la aplicación (Electron). Sin red ni JavaScript. */
export type ImprimirPdf = (html: string, senal?: AbortSignal) => Promise<Uint8Array>;

export interface ContextoConversor {
  /** Quien ejecuta lo pesado en un proceso aparte. Sin él no se convierte nada. */
  ejecutor?: EjecutorTrabajo;
  /** Ruta de `soffice` si LibreOffice está instalado (`Plataforma.libreOffice()`). */
  libreOffice?: string | null;
  imprimirPdf?: ImprimirPdf;
  limites?: Partial<LimitesConversor>;
  /** Para pruebas. */
  lanzarLibreOffice?: Lanzar;
  rutas?: RutasModulos;
}

export interface OpcionesConvertir {
  origen: string;
  a: Formato;
  destino: string;
}

/** Formatos que el conversor reconoce (la interfaz solo manda uno de estos). */
export const FORMATOS_CONVERSOR: readonly Formato[] = [
  'docx',
  'xlsx',
  'csv',
  'md',
  'html',
  'pdf',
  'txt',
  'odt',
  'pptx',
  'doc',
];

/** Partes que debe traer cada tipo de documento ZIP (si no, no es de ese tipo). */
export const PARTES_ZIP: Partial<Record<Formato, readonly string[]>> = {
  docx: ['word/document.xml'],
  xlsx: ['xl/workbook.xml'],
  pptx: ['ppt/presentation.xml'],
  odt: ['content.xml'],
};

/** Conversiones que se pueden ofrecer con lo que hay instalado y lo que aporta la aplicación. */
export function conversionesDisponibles(c: {
  libreOffice: string | null;
  imprimirPdf: boolean;
}): Conversion[] {
  return CONVERSIONES.filter((x) => {
    if (x.motor === 'libreoffice') return c.libreOffice !== null;
    if (x.a === 'pdf') return c.imprimirPdf;
    return true;
  });
}

const formatoDe = (ruta: string): Formato | null => {
  const e = path.extname(ruta).slice(1).toLowerCase();
  return FORMATOS_CONVERSOR.find((f) => f === e) ?? null;
};

const invalido = (): ErrorWolf =>
  new ErrorWolf('conversor.archivo_invalido', 'El archivo está dañado o no es del tipo indicado.');

const sinFormato = (): ErrorWolf =>
  new ErrorWolf('conversor.formato', 'Esa conversión no está disponible.');

function enTiempo<T>(p: Promise<T>, plazoMs: number, senal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const reloj = setTimeout(
      () =>
        reject(
          new ErrorWolf('conversor.plazo', 'La conversión tardó demasiado y se canceló.', {
            segundos: Math.max(1, Math.round(plazoMs / 1000)),
          }),
        ),
      plazoMs,
    );
    const alAbortar = (): void =>
      reject(new ErrorWolf('conversor.cancelado', 'Conversión cancelada.'));
    if (senal?.aborted) alAbortar();
    senal?.addEventListener('abort', alAbortar, { once: true });
    p.then(resolve, reject).finally(() => {
      clearTimeout(reloj);
      senal?.removeEventListener('abort', alAbortar);
    });
  });
}

/**
 * Lee el archivo con tope sobre un solo descriptor: `open`, `fstat` y lectura de a lo sumo
 * `tope + 1` bytes. Un archivo que crece entre medias no se lee entero.
 */
async function leerAcotado(ruta: string, tope: number): Promise<Uint8Array> {
  let st;
  try {
    st = await lstat(ruta);
  } catch {
    throw invalido();
  }
  if (!st.isFile()) throw invalido(); // ni enlaces ni carpetas ni archivos especiales
  const grande = (): ErrorWolf =>
    new ErrorWolf('conversor.archivo_grande', 'El archivo pesa demasiado.', {
      maximo: `${Math.round(tope / MB)} MB`,
    });
  let f;
  try {
    f = await open(ruta, 'r');
  } catch {
    throw invalido();
  }
  try {
    const e = await f.stat();
    if (!e.isFile()) throw invalido();
    if (e.size > tope) throw grande();
    const buf = Buffer.alloc(Math.min(e.size, tope) + 1);
    let n = 0;
    while (n < buf.length) {
      const { bytesRead } = await f.read(buf, n, buf.length - n, n);
      if (bytesRead === 0) break;
      n += bytesRead;
    }
    if (n > tope) throw grande();
    return new Uint8Array(buf.buffer, buf.byteOffset, n);
  } finally {
    await f.close().catch(() => undefined);
  }
}

/**
 * Convierte `origen` (de un diálogo "Abrir") a `a` en `destino` (de un diálogo "Guardar"). Si
 * `destino` ya existe se escribe `nombre (1).ext`; nunca se pisa nada.
 */
export async function convertir(
  o: OpcionesConvertir,
  senal?: AbortSignal,
  ctx: ContextoConversor = {},
): Promise<{ destino: string; bytes: number }> {
  const lim: LimitesConversor = { ...LIMITES_CONVERSOR, ...ctx.limites };
  const de = formatoDe(o.origen);
  const conv = de ? CONVERSIONES.find((c) => c.de === de && c.a === o.a) : undefined;
  if (!de || !conv || !ctx.ejecutor) throw sinFormato();
  if (conv.motor === 'libreoffice' && !ctx.libreOffice) {
    throw new ErrorWolf('conversor.libreoffice_ausente', 'LibreOffice no está instalado.');
  }
  if (conv.motor === 'interno' && o.a === 'pdf' && !ctx.imprimirPdf) {
    throw new ErrorWolf('conversor.pdf_no_disponible', 'La impresión a PDF no está disponible.');
  }

  const tope = de === 'md' || de === 'html' ? lim.bytesEntradaTexto : lim.bytesEntrada;
  const datos = await leerAcotado(o.origen, tope);

  const lt: LimitesTrabajo = {
    filas: lim.filas,
    columnas: lim.columnas,
    celdas: lim.celdas,
    paginas: lim.paginasPdf,
    salida: lim.bytesSalida,
    entradasZip: lim.entradasZip,
    bytesDescomprimidos: lim.bytesDescomprimidos,
    proporcion: lim.proporcion,
    topeStream: lim.topeStreamMb * MB,
    topeTotal: lim.topeTotalMb * MB,
  };
  const rutas = ctx.rutas ?? resolverRutas();
  const partes = PARTES_ZIP[de] ?? [];
  // Un corte propio: si vence el plazo o se cancela, el proceso de trabajo recibe la señal.
  const corte = new AbortController();
  senal?.addEventListener('abort', () => corte.abort(), { once: true });
  const ejecutar = async (
    m: {
      [K in MensajeTrabajo['op']]: Omit<Extract<MensajeTrabajo, { op: K }>, 'rutas' | 'lim'>;
    }[MensajeTrabajo['op']],
  ): Promise<Extract<RespuestaTrabajo, { ok: true }>> => {
    const r = await enTiempo(
      ctx.ejecutor!({ ...m, rutas, lim: lt } as MensajeTrabajo, {
        plazoMs: lim.plazoMs,
        senal: corte.signal,
      }),
      lim.plazoMs,
      senal,
    );
    if (!r.ok) throw errorDeRespuesta(r);
    return r;
  };
  const bytesDe = (t: string | undefined): Uint8Array => new TextEncoder().encode(t ?? '');

  let salida: Uint8Array;
  try {
    if (de === 'pdf' && Buffer.from(datos.subarray(0, 1024)).indexOf('%PDF-') < 0) {
      throw invalido();
    }
    if (conv.motor === 'libreoffice') {
      // Los ZIP (odt, pptx, docx) se revisan en el proceso de trabajo antes de dárselos a LibreOffice.
      if (partes.length) await ejecutar({ op: 'zip', datos, partes });
      salida = await convertirConLibreOffice({
        soffice: ctx.libreOffice!,
        datos,
        de,
        a: o.a,
        plazoMs: lim.plazoMs,
        maxSalida: lim.bytesSalida,
        senal: corte.signal,
        ...(ctx.lanzarLibreOffice ? { lanzar: ctx.lanzarLibreOffice } : {}),
      });
      // El HTML de LibreOffice es un documento completo: se sanea como cualquier otro.
      if (o.a === 'html') {
        const r = await ejecutar({
          op: 'htmlSanear',
          datos: salida,
          para: 'html',
          extraerCuerpo: true,
        });
        salida = bytesDe(r.texto);
      }
    } else if (de === 'docx') {
      const r = await ejecutar({
        op: 'docx',
        datos,
        partes,
        formato: o.a as 'html' | 'md' | 'txt',
      });
      salida = bytesDe(r.texto);
    } else if (de === 'xlsx') {
      salida = bytesDe((await ejecutar({ op: 'xlsxACsv', datos, partes })).texto);
    } else if (de === 'csv') {
      salida = (await ejecutar({ op: 'csvAXlsx', datos })).datos ?? new Uint8Array();
    } else if (de === 'pdf') {
      salida = bytesDe((await ejecutar({ op: 'pdfATexto', datos })).texto);
    } else {
      // md → html | pdf, html → pdf
      const para = o.a === 'html' ? 'html' : 'pdf';
      const r =
        de === 'md'
          ? await ejecutar({ op: 'mdAHtml', datos, para })
          : await ejecutar({ op: 'htmlSanear', datos, para, extraerCuerpo: true });
      if (o.a === 'html') {
        salida = bytesDe(r.texto);
      } else {
        salida = await enTiempo(ctx.imprimirPdf!(r.texto ?? '', corte.signal), lim.plazoMs, senal);
      }
    }
  } finally {
    corte.abort();
  }
  if (salida.byteLength > lim.bytesSalida) {
    throw new ErrorWolf('conversor.archivo_grande', 'El resultado pesa demasiado.', {
      maximo: `${Math.round(lim.bytesSalida / MB)} MB`,
    });
  }

  // La extensión del resultado es la del formato pedido: un diálogo no puede dejar un `.bat`.
  const dest =
    path.extname(o.destino).toLowerCase() === `.${o.a}` ? o.destino : `${o.destino}.${o.a}`;
  const { ruta, handle } = await abrirNuevo(dest);
  try {
    await handle.writeFile(salida);
  } catch (e) {
    await handle.close().catch(() => undefined);
    await rm(ruta, { force: true }).catch(() => undefined);
    throw e;
  }
  await handle.close();
  return { destino: ruta, bytes: salida.byteLength };
}

import { createRequire } from 'node:module';
import path from 'node:path';
import JSZip from 'jszip';
import { ErrorWolf } from '../errores';
import { dimensionesImagen, LIMITES_IMAGEN } from '../herramientas/imagenes';
import {
  celdaXlsx,
  decodificarTexto,
  escribirCsv,
  leerCsv,
  limiteCeldas,
  limiteColumnas,
  limiteFilas,
  type Celda,
} from './csv';
import { markdownAHtml, plantillaHtml, sanitizarHtml } from './markdown';
import {
  respuestaDeError,
  type EjecutorTrabajo,
  type LimitesTrabajo,
  type MensajeTrabajo,
  type RespuestaTrabajo,
} from './protocolo';
import { inspeccionarZip } from './zipSeguro';

/**
 * Las operaciones del conversor. Corren en el PROCESO DE TRABAJO (nunca en el principal): el
 * documento es una entrada no confiable y estas bibliotecas son pesadas. Cada operación revisa el
 * ZIP (si lo es) con JSZip antes de entregárselo a la biblioteca, y se detiene con un error con
 * código si algo se pasa de los topes. No hay red en ninguna.
 */

const req = (): NodeRequire =>
  typeof require === 'function' ? require : createRequire(import.meta.url);

const invalido = (): ErrorWolf =>
  new ErrorWolf('conversor.archivo_invalido', 'El archivo está dañado o no es del tipo indicado.');

const MB = 1024 * 1024;

function salidaGrande(lim: LimitesTrabajo): ErrorWolf {
  return new ErrorWolf('conversor.archivo_grande', 'El resultado pesa demasiado.', {
    maximo: `${Math.round(lim.salida / MB)} MB`,
  });
}

const limitesZip = (lim: LimitesTrabajo) => ({
  entradas: lim.entradasZip,
  bytesDescomprimidos: lim.bytesDescomprimidos,
  proporcion: lim.proporcion,
});

// ---------- HTML ----------

/** Solo se imprimen las imágenes `data:` con dimensiones razonables (se decodifican en Chromium). */
function limitarImagenes(html: string): string {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    const m = /src="data:image\/[a-z]+;base64,([A-Za-z0-9+/=]*)"/.exec(tag);
    if (!m) return '';
    const cabecera = new Uint8Array(Buffer.from(m[1]!.slice(0, 2048), 'base64'));
    const d = dimensionesImagen(cabecera);
    if (
      !d ||
      d.ancho < 1 ||
      d.alto < 1 ||
      d.ancho > LIMITES_IMAGEN.ladoMax ||
      d.alto > LIMITES_IMAGEN.ladoMax ||
      d.ancho * d.alto > LIMITES_IMAGEN.pixelesMax
    ) {
      return '';
    }
    return tag;
  });
}

function documentoHtml(cuerpo: string, para: 'html' | 'pdf'): string {
  return plantillaHtml(para === 'pdf' ? limitarImagenes(cuerpo) : cuerpo, {
    imagenesRemotas: para === 'html',
  });
}

/** Contenido de `<body>` si lo hay (la salida de LibreOffice es un documento completo). */
function cuerpoDe(html: string): string {
  const m = /<body\b[^>]*>([\s\S]*?)(?:<\/body\s*>|$)/i.exec(html);
  return m ? m[1]! : html;
}

// ---------- docx ----------

/** Anula los hipervínculos con esquemas peligrosos antes de que mammoth los convierta. */
function limpiarDocumento(el: unknown): unknown {
  let r = el as { type?: string; href?: unknown; children?: unknown[] };
  if (r && r.type === 'hyperlink' && typeof r.href === 'string') {
    // eslint-disable-next-line no-control-regex
    const h = r.href.replace(/[\u0000- \u007f-\u009f]/g, '');
    if (!/^(?:https?:|mailto:|#|[^:]*$)/i.test(h)) r = { ...r, href: '#' };
  }
  if (r && Array.isArray(r.children)) r = { ...r, children: r.children.map(limpiarDocumento) };
  return r;
}

async function docx(m: Extract<MensajeTrabajo, { op: 'docx' }>): Promise<string> {
  await inspeccionarZip(m.datos, limitesZip(m.lim), m.partes);
  const mammoth = req()(m.rutas.mammoth) as {
    convertToHtml(e: unknown, o?: unknown): Promise<{ value: string }>;
    convertToMarkdown(e: unknown, o?: unknown): Promise<{ value: string }>;
    extractRawText(e: unknown): Promise<{ value: string }>;
  };
  const entrada = { buffer: Buffer.from(m.datos.buffer, m.datos.byteOffset, m.datos.byteLength) };
  // Sin externalFileAccess: las imágenes o archivos enlazados fuera del documento no se leen.
  const opciones = { transformDocument: limpiarDocumento };
  const r =
    m.formato === 'html'
      ? await mammoth.convertToHtml(entrada, opciones)
      : m.formato === 'md'
        ? await mammoth.convertToMarkdown(entrada, opciones)
        : await mammoth.extractRawText(entrada);
  if (r.value.length > m.lim.salida) throw salidaGrande(m.lim);
  return m.formato === 'html' ? documentoHtml(sanitizarHtml(r.value), 'html') : r.value;
}

// ---------- xlsx / csv ----------

function valorDeCelda(v: unknown): Celda {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) {
      return (o.richText as { text: string }[]).map((t) => t.text).join('');
    }
    if (o.formula !== undefined || o.sharedFormula !== undefined) return valorDeCelda(o.result);
    if (o.error !== undefined) return String(o.error);
    if (o.text !== undefined) return valorDeCelda(o.text);
  }
  return String(v);
}

async function xlsxACsv(m: Extract<MensajeTrabajo, { op: 'xlsxACsv' }>): Promise<string> {
  await inspeccionarZip(m.datos, limitesZip(m.lim), m.partes);
  const ExcelJS = req()(m.rutas.exceljs) as typeof import('exceljs');
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(
    Buffer.from(m.datos.buffer, m.datos.byteOffset, m.datos.byteLength) as never,
  );
  const hoja = libro.worksheets[0]; // solo la primera hoja
  const filas: Celda[][] = [];
  if (hoja) {
    if (hoja.rowCount > m.lim.filas) throw limiteFilas(m.lim.filas);
    if (hoja.columnCount > m.lim.columnas) throw limiteColumnas(m.lim.columnas);
    if (hoja.rowCount * hoja.columnCount > m.lim.celdas) throw limiteCeldas(m.lim.celdas);
    for (let r = 1; r <= hoja.rowCount; r++) {
      const v = (hoja.getRow(r).values as unknown[] | undefined) ?? [];
      const fila: Celda[] = [];
      for (let i = 1; i <= hoja.columnCount; i++) fila.push(valorDeCelda(v[i]));
      filas.push(fila);
    }
  }
  const csv = escribirCsv(filas);
  if (csv.length > m.lim.salida) throw salidaGrande(m.lim);
  return csv;
}

async function csvAXlsx(m: Extract<MensajeTrabajo, { op: 'csvAXlsx' }>): Promise<Uint8Array> {
  const filas = leerCsv(decodificarTexto(m.datos), {
    filas: m.lim.filas,
    columnas: m.lim.columnas,
    celdas: m.lim.celdas,
  });
  const ExcelJS = req()(m.rutas.exceljs) as typeof import('exceljs');
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Hoja1');
  let hayPrefijo = false;
  filas.forEach((f, i) => {
    f.forEach((texto, j) => {
      const { valor, prefijo } = celdaXlsx(texto);
      if (valor === null) return;
      const celda = hoja.getCell(i + 1, j + 1);
      celda.value = valor;
      // Texto que una hoja tomaría por fórmula: formato texto (`@`, id 49); abajo se le añade
      // `quotePrefix`, que exceljs no sabe escribir.
      if (prefijo) {
        celda.numFmt = '@';
        hayPrefijo = true;
      }
    });
  });
  const bytes = new Uint8Array(await libro.xlsx.writeBuffer());
  return hayPrefijo ? aplicarQuotePrefix(bytes) : bytes;
}

/**
 * Marca con `quotePrefix="1"` los estilos de texto (`numFmtId="49"`) de nuestro propio xlsx: las
 * únicas celdas con ese formato son las que podrían tomarse por fórmula.
 */
export async function aplicarQuotePrefix(xlsx: Uint8Array): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(xlsx);
  const estilos = zip.file('xl/styles.xml');
  if (!estilos) return xlsx;
  const xml = await estilos.async('string');
  const nuevo = xml.replace(/<cellXfs\b[\s\S]*?<\/cellXfs>/, (bloque) =>
    bloque.replace(/<xf\b([^>]*)>/g, (xf, attrs: string) => {
      if (!/numFmtId="49"/.test(attrs) || /quotePrefix=/.test(attrs)) return xf;
      const cerrado = attrs.endsWith('/');
      return `<xf${cerrado ? attrs.slice(0, -1) : attrs} quotePrefix="1"${cerrado ? '/' : ''}>`;
    }),
  );
  zip.file('xl/styles.xml', nuevo);
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

// ---------- pdf ----------

async function pdfATexto(m: Extract<MensajeTrabajo, { op: 'pdfATexto' }>): Promise<string> {
  const pdfjs = (await import(m.rutas.pdfjs)) as typeof import('pdfjs-dist');
  const tarea = pdfjs.getDocument({
    data: new Uint8Array(m.datos),
    // Nada de JavaScript del PDF: ni eval de fuentes, ni XFA, ni fuentes del sistema.
    isEvalSupported: false,
    enableXfa: false,
    useSystemFonts: false,
    disableFontFace: true,
    useWorkerFetch: false,
    verbosity: 0,
  } as never);
  try {
    let doc;
    try {
      doc = await tarea.promise;
    } catch (e) {
      if ((e as { name?: string } | null)?.name === 'PasswordException') {
        throw new ErrorWolf('conversor.pdf_cifrado', 'El PDF está cifrado.');
      }
      throw invalido();
    }
    if (doc.numPages > m.lim.paginas) {
      throw new ErrorWolf('conversor.limite_paginas', 'El PDF tiene demasiadas páginas.', {
        maximo: m.lim.paginas,
      });
    }
    let texto = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const pagina = await doc.getPage(i);
      const contenido = await pagina.getTextContent();
      for (const it of contenido.items) {
        if ('str' in it) texto += it.str + (it.hasEOL ? '\n' : '');
      }
      texto += '\n\n';
      pagina.cleanup();
      if (texto.length > m.lim.salida) throw salidaGrande(m.lim);
    }
    return `${texto.trim()}\n`;
  } finally {
    // También en los retornos y errores tempranos.
    await tarea.destroy().catch(() => undefined);
  }
}

/**
 * pdf-lib infla los flujos (también los de objetos, ObjStm) en un solo búfer que se duplica: un
 * PDF de 1 MB puede declarar 1 GB. Se cortan aquí, por flujo y en total, antes de reservar la
 * memoria; el supervisor del proceso vigila además su memoria. El parche se deshace al terminar.
 */
async function pdfOptimizar(
  m: Extract<MensajeTrabajo, { op: 'pdfOptimizar' }>,
): Promise<Uint8Array> {
  let restaurar: (() => void) | null = null;
  let excedido = false;
  try {
    const ruta = path.join(path.dirname(m.rutas.pdflib), 'core', 'streams', 'DecodeStream.js');
    const DecodeStream = (req()(ruta) as { default: { prototype: Record<string, unknown> } })
      .default;
    const original = DecodeStream.prototype.ensureBuffer as (p: number) => unknown;
    let total = 0;
    DecodeStream.prototype.ensureBuffer = function (
      this: { buffer: { byteLength: number } },
      pedido: number,
    ) {
      if (pedido > m.lim.topeStream) {
        excedido = true;
        throw new Error('flujo demasiado grande');
      }
      const antes = this.buffer.byteLength;
      const r = original.call(this, pedido);
      total += this.buffer.byteLength - antes;
      if (total > m.lim.topeTotal) {
        excedido = true;
        throw new Error('flujos demasiado grandes');
      }
      return r;
    };
    restaurar = () => {
      DecodeStream.prototype.ensureBuffer = original;
    };
  } catch {
    // Estructura distinta de pdf-lib: queda el supervisor de memoria.
  }
  try {
    const { PDFDocument } = req()(m.rutas.pdflib) as typeof import('pdf-lib');
    const doc = await PDFDocument.load(m.datos, {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    if (doc.getPageCount() === 0) throw invalido();
    return await doc.save({ useObjectStreams: true, addDefaultPage: false });
  } catch (e) {
    if (e instanceof ErrorWolf) throw e;
    if (excedido) {
      throw new ErrorWolf(
        'herramientas.pdf_demasiado_complejo',
        'El PDF es demasiado complejo y se canceló.',
      );
    }
    const err = e as { name?: string; message?: string } | null;
    if (err?.name === 'EncryptedPDFError' || /encrypted/i.test(String(err?.message))) {
      throw new ErrorWolf('herramientas.pdf_cifrado', 'El PDF está cifrado.');
    }
    throw new ErrorWolf(
      'herramientas.pdf_invalido',
      'El archivo no es un PDF que se pueda optimizar.',
    );
  } finally {
    restaurar?.();
  }
}

// ---------- despacho ----------

const enc = (t: string): Uint8Array => new TextEncoder().encode(t);

/** Ejecuta una operación y devuelve su resultado o un error con código. Nunca lanza. */
export async function operar(m: MensajeTrabajo): Promise<RespuestaTrabajo> {
  try {
    switch (m.op) {
      case 'zip':
        await inspeccionarZip(m.datos, limitesZip(m.lim), m.partes);
        return { ok: true };
      case 'docx':
        return { ok: true, texto: await docx(m) };
      case 'xlsxACsv':
        return { ok: true, texto: await xlsxACsv(m) };
      case 'csvAXlsx':
        return { ok: true, datos: await csvAXlsx(m) };
      case 'pdfATexto':
        return { ok: true, texto: await pdfATexto(m) };
      case 'pdfOptimizar':
        return { ok: true, datos: await pdfOptimizar(m) };
      case 'mdAHtml':
        return {
          ok: true,
          texto: documentoHtml(markdownAHtml(decodificarTexto(m.datos)), m.para),
        };
      case 'htmlSanear': {
        const t = decodificarTexto(m.datos);
        const cuerpo = sanitizarHtml(m.extraerCuerpo ? cuerpoDe(t) : t);
        return { ok: true, texto: documentoHtml(cuerpo, m.para) };
      }
    }
  } catch (e) {
    return respuestaDeError(e);
  }
}

/**
 * EjecutorTrabajo SIN aislamiento: corre la operación en el mismo proceso. Solo sirve como doble de
 * prueba; la aplicación inyecta el `utilityProcess` con plazo y vigilancia de memoria.
 */
export const ejecutarEnProceso: EjecutorTrabajo = async (m, o) => {
  void enc;
  if (o.senal?.aborted) return { ok: false, codigo: 'conversor.cancelado' };
  return operar(m);
};

import { lstat, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { abrirNuevo } from '../herramientas/salidaNueva';
import { dimensionesImagen, LIMITES_IMAGEN } from '../herramientas/imagenes';
import { celdaSegura, decodificarTexto, escribirCsv, leerCsv, type Celda } from './csv';
import { convertirConLibreOffice, type Lanzar } from './libreoffice';
import { markdownAHtml, plantillaHtml, sanitizarHtml } from './markdown';
import { ejecutarHilo, type LimitesHilo, type RutasModulos } from './trabajador';
import { inspeccionarZip } from './zipSeguro';

/**
 * Conversor de documentos local (D34). Nada sale del equipo: no hay `fetch` ni red en ningún
 * paso. Cada documento es una entrada no confiable:
 *
 * - tope de tamaño de entrada; la entrada se lee UNA vez y esos mismos bytes se revisan y se
 *   convierten (sin carrera entre la revisión y el uso);
 * - ZIP (docx, xlsx, pptx, odt): revisión previa de entradas, tamaño descomprimido real,
 *   proporción y XML con DTD/entidades (`zipSeguro.ts`), antes de tocar la biblioteca;
 * - el trabajo pesado va en un hilo con plazo, tope de montón y vigilancia de la memoria externa
 *   (`trabajador.ts`); PDF sin ejecutar nada del PDF;
 * - tablas con tope de filas y columnas; fórmulas neutralizadas al escribir hojas de cálculo;
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
  /** Markdown y HTML se procesan en el hilo principal: tope menor. */
  bytesEntradaTexto: 10 * MB,
  entradasZip: 10_000,
  bytesDescomprimidos: 500 * MB,
  proporcion: 200,
  plazoMs: 120_000,
  memoriaMb: 1536,
  crecimientoMb: 1536,
  filas: 200_000,
  columnas: 1_000,
  paginasPdf: 5_000,
  bytesSalida: 200 * MB,
} as const;

export type LimitesConversor = { -readonly [K in keyof typeof LIMITES_CONVERSOR]: number };

/** Imprime un HTML (ya saneado) a PDF; lo aporta la aplicación (Electron). Sin red ni JavaScript. */
export type ImprimirPdf = (html: string, senal?: AbortSignal) => Promise<Uint8Array>;

export interface ContextoConversor {
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
const PARTES_ZIP: Partial<Record<Formato, readonly string[]>> = {
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

/** `<img>` de un HTML saneado: solo se imprimen las imágenes `data:` con dimensiones razonables. */
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
  if (!de || !conv) throw sinFormato();
  if (conv.motor === 'libreoffice' && !ctx.libreOffice) {
    throw new ErrorWolf('conversor.libreoffice_ausente', 'LibreOffice no está instalado.');
  }
  if (conv.motor === 'interno' && o.a === 'pdf' && !ctx.imprimirPdf) {
    throw new ErrorWolf('conversor.pdf_no_disponible', 'La impresión a PDF no está disponible.');
  }

  let st;
  try {
    st = await lstat(o.origen);
  } catch {
    throw invalido();
  }
  if (!st.isFile()) throw invalido();
  const tope = de === 'md' || de === 'html' ? lim.bytesEntradaTexto : lim.bytesEntrada;
  if (st.size > tope) {
    throw new ErrorWolf('conversor.archivo_grande', 'El archivo pesa demasiado.', {
      maximo: `${Math.round(tope / MB)} MB`,
    });
  }
  const datos = new Uint8Array(await readFile(o.origen));
  if (datos.byteLength > tope) {
    throw new ErrorWolf('conversor.archivo_grande', 'El archivo pesa demasiado.', {
      maximo: `${Math.round(tope / MB)} MB`,
    });
  }

  // Revisión previa del contenido (sobre los mismos bytes que se convertirán).
  const partes = PARTES_ZIP[de];
  if (partes) {
    await inspeccionarZip(
      Buffer.from(datos.buffer, datos.byteOffset, datos.byteLength),
      {
        entradas: lim.entradasZip,
        bytesDescomprimidos: lim.bytesDescomprimidos,
        proporcion: lim.proporcion,
      },
      partes,
    );
  } else if (de === 'pdf' && Buffer.from(datos.subarray(0, 1024)).indexOf('%PDF-') < 0) {
    throw invalido();
  }

  const hilo: LimitesHilo = {
    plazoMs: lim.plazoMs,
    memoriaMb: lim.memoriaMb,
    crecimientoMb: lim.crecimientoMb,
    filas: lim.filas,
    columnas: lim.columnas,
    paginas: lim.paginasPdf,
    salida: lim.bytesSalida,
  };
  const comunes = {
    lim: hilo,
    ...(senal ? { senal } : {}),
    ...(ctx.rutas ? { rutas: ctx.rutas } : {}),
  };

  let salida: Uint8Array;
  if (conv.motor === 'libreoffice') {
    salida = await convertirConLibreOffice({
      soffice: ctx.libreOffice!,
      datos,
      de,
      a: o.a,
      plazoMs: lim.plazoMs,
      maxSalida: lim.bytesSalida,
      ...(senal ? { senal } : {}),
      ...(ctx.lanzarLibreOffice ? { lanzar: ctx.lanzarLibreOffice } : {}),
    });
  } else if (de === 'docx') {
    const r = await ejecutarHilo({
      op: 'docx',
      datos,
      formato: o.a as 'html' | 'md' | 'txt',
      ...comunes,
    });
    const texto = r.texto ?? '';
    salida = new TextEncoder().encode(
      o.a === 'html' ? plantillaHtml(sanitizarHtml(texto), { imagenesRemotas: true }) : texto,
    );
  } else if (de === 'xlsx') {
    const r = await ejecutarHilo({ op: 'xlsxAFilas', datos, ...comunes });
    salida = new TextEncoder().encode(escribirCsv(r.filas ?? []));
  } else if (de === 'csv') {
    const filas = leerCsv(decodificarTexto(datos), { filas: lim.filas, columnas: lim.columnas });
    const seguras: Celda[][] = filas.map((f) => f.map(celdaSegura));
    const r = await ejecutarHilo({ op: 'filasAXlsx', filas: seguras, ...comunes });
    salida = r.datos ?? new Uint8Array();
  } else if (de === 'pdf') {
    const r = await ejecutarHilo({ op: 'pdf', datos, ...comunes });
    salida = new TextEncoder().encode(r.texto ?? '');
  } else {
    // md → html | pdf, html → pdf
    const texto = decodificarTexto(datos);
    const cuerpo = de === 'md' ? markdownAHtml(texto) : sanitizarHtml(texto);
    if (o.a === 'html') {
      salida = new TextEncoder().encode(plantillaHtml(cuerpo, { imagenesRemotas: true }));
    } else {
      const html = plantillaHtml(limitarImagenes(cuerpo), { imagenesRemotas: false });
      // La señal propia permite cortar la impresión (cerrar su ventana) si vence el plazo.
      const corte = new AbortController();
      try {
        salida = await enTiempo(ctx.imprimirPdf!(html, corte.signal), lim.plazoMs, senal);
      } finally {
        corte.abort();
      }
    }
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

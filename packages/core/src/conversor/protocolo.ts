import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ErrorWolf, esErrorWolf, type CodigoError, type DatosErrorWolf } from '../errores';
import { rutaDesempaquetada } from '../herramientas/pdf';

/**
 * Protocolo entre el núcleo y el proceso de trabajo del conversor (D34).
 *
 * Todo lo pesado (revisión del ZIP, mammoth, exceljs, pdfjs, pdf-lib, análisis del CSV, markdown-it
 * y el saneado de HTML) corre en un PROCESO aparte (`utilityProcess` en la aplicación), con plazo
 * y vigilancia de su memoria. El núcleo solo envía bytes y recibe texto, bytes o un error con
 * código. Quien ejecuta se inyecta (`EjecutorTrabajo`): en las pruebas del núcleo es `ejecutarEnProceso`
 * (sin aislamiento; solo vale como doble de prueba) y en la aplicación el `utilityProcess`.
 */

export interface RutasModulos {
  mammoth: string;
  exceljs: string;
  pdflib: string;
  /** URL `file:` del módulo ESM de pdf.js. */
  pdfjs: string;
}

export interface LimitesTrabajo {
  filas: number;
  columnas: number;
  celdas: number;
  paginas: number;
  /** Tope de caracteres de lo que devuelve el proceso. */
  salida: number;
  entradasZip: number;
  bytesDescomprimidos: number;
  proporcion: number;
  /** Lo que puede inflarse un flujo de un PDF (pdf-lib) y todos juntos, en bytes. */
  topeStream: number;
  topeTotal: number;
}

export type MensajeTrabajo = (
  | { op: 'zip'; datos: Uint8Array; partes: readonly string[] }
  | {
      op: 'docx';
      datos: Uint8Array;
      partes: readonly string[];
      formato: 'html' | 'md' | 'txt';
    }
  | { op: 'xlsxACsv'; datos: Uint8Array; partes: readonly string[] }
  | { op: 'csvAXlsx'; datos: Uint8Array }
  | { op: 'pdfATexto'; datos: Uint8Array }
  | { op: 'pdfOptimizar'; datos: Uint8Array }
  | { op: 'mdAHtml'; datos: Uint8Array; para: 'html' | 'pdf' }
  | { op: 'htmlSanear'; datos: Uint8Array; para: 'html' | 'pdf'; extraerCuerpo: boolean }
) & { rutas: RutasModulos; lim: LimitesTrabajo };

export type RespuestaTrabajo =
  | { ok: true; texto?: string; datos?: Uint8Array }
  | { ok: false; codigo: string; datos?: DatosErrorWolf };

export interface OpcionesEjecucion {
  plazoMs: number;
  senal?: AbortSignal;
}

/** Quien ejecuta un mensaje en el proceso de trabajo (se inyecta). */
export type EjecutorTrabajo = (
  m: MensajeTrabajo,
  o: OpcionesEjecucion,
) => Promise<RespuestaTrabajo>;

/** Rutas absolutas de las bibliotecas; dentro del .asar se usan las de `app.asar.unpacked`. */
export function resolverRutas(req?: NodeRequire): RutasModulos {
  const r: NodeRequire =
    req ?? (typeof require === 'function' ? require : createRequire(import.meta.url));
  const pdfjs = path.join(
    path.dirname(rutaDesempaquetada(r.resolve('pdfjs-dist/package.json'))),
    'legacy',
    'build',
    'pdf.mjs',
  );
  return {
    mammoth: rutaDesempaquetada(r.resolve('mammoth')),
    exceljs: rutaDesempaquetada(r.resolve('exceljs')),
    pdflib: rutaDesempaquetada(r.resolve('pdf-lib')),
    pdfjs: pathToFileURL(pdfjs).href,
  };
}

/** Respuesta de error de una operación (lo que viaja entre procesos). */
export function respuestaDeError(e: unknown): RespuestaTrabajo {
  if (esErrorWolf(e)) {
    return { ok: false, codigo: e.codigo, ...(e.datos ? { datos: e.datos } : {}) };
  }
  return { ok: false, codigo: 'conversor.archivo_invalido' };
}

/** Error del núcleo a partir de una respuesta de error. */
export function errorDeRespuesta(r: { codigo: string; datos?: DatosErrorWolf }): ErrorWolf {
  return new ErrorWolf(r.codigo as CodigoError, 'La conversión no se pudo completar.', r.datos);
}

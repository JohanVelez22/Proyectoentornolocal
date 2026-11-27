import { ErrorWolf } from '../errores';

/**
 * CSV propio (RFC 4180 con detección de separador) y neutralización de fórmulas (D34).
 *
 * Una celda de texto que empieza con `=`, `+`, `-`, `@`, tabulador, retorno de carro o salto de
 * línea (o con sus variantes de ancho completo) la evalúa Excel como fórmula al editarla o al
 * abrir un CSV (inyección de fórmulas: `=HYPERLINK(...)`, `=cmd|...`). En un CSV se antepone un
 * apóstrofo a esas celdas; en un xlsx la celda se guarda como texto con `quotePrefix` y su valor
 * no cambia. Solo los números sin signo o negativos (`-5`, `3.14`) se escriben como número;
 * `+1.5` no es un número aquí y se trata como texto.
 */

export type Celda = string | number | boolean | null;

/** Máximo de caracteres de una celda de Excel. */
export const MAX_CELDA = 32_767;

const PELIGROSA = /^[=+\-@\t\r\n＝＋－＠]/;
const NUMERO = /^-?(?:0|[1-9]\d{0,14})(?:\.\d{1,15})?$/;

/** Antepone `'` a un texto que una hoja de cálculo interpretaría como fórmula (para CSV). */
export function neutralizarFormula(texto: string): string {
  return PELIGROSA.test(texto) ? `'${texto}` : texto;
}

/**
 * Celda lista para una hoja de cálculo: número real, o texto (con `prefijo` si una hoja podría
 * tomarlo por fórmula: se guarda con `quotePrefix` y el valor no se altera).
 */
export function celdaXlsx(texto: string): { valor: Celda; prefijo: boolean } {
  if (texto === '') return { valor: null, prefijo: false };
  if (NUMERO.test(texto)) return { valor: Number(texto), prefijo: false };
  const t = texto.length > MAX_CELDA ? texto.slice(0, MAX_CELDA) : texto;
  return { valor: t, prefijo: PELIGROSA.test(t) };
}

export interface LimitesTabla {
  filas: number;
  columnas: number;
  /** Tope de celdas (filas × columnas recorridas). */
  celdas: number;
}

export const limiteFilas = (maximo: number): ErrorWolf =>
  new ErrorWolf('conversor.limite_filas', 'La tabla tiene demasiadas filas.', { maximo });
export const limiteColumnas = (maximo: number): ErrorWolf =>
  new ErrorWolf('conversor.limite_columnas', 'La tabla tiene demasiadas columnas.', { maximo });
export const limiteCeldas = (maximo: number): ErrorWolf =>
  new ErrorWolf('conversor.limite_celdas', 'La tabla tiene demasiadas celdas.', { maximo });

/** Texto del CSV: UTF-8 (con o sin BOM) o UTF-16 con BOM. */
export function decodificarTexto(datos: Uint8Array): string {
  if (datos.length >= 2 && datos[0] === 0xff && datos[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(datos.subarray(2));
  }
  if (datos.length >= 2 && datos[0] === 0xfe && datos[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(datos.subarray(2));
  }
  const t = new TextDecoder('utf-8').decode(datos);
  return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
}

/** Separador más probable según la primera línea (fuera de comillas). */
function separador(texto: string): string {
  const cuenta: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let comillas = false;
  for (let i = 0; i < texto.length && i < 65_536; i++) {
    const c = texto[i]!;
    if (c === '"') comillas = !comillas;
    else if (!comillas && (c === '\n' || c === '\r')) break;
    else if (!comillas && c in cuenta) cuenta[c]!++;
  }
  let mejor = ',';
  for (const k of [';', '\t']) if (cuenta[k]! > cuenta[mejor]!) mejor = k;
  return mejor;
}

/** Interpreta un CSV con tope de filas, de columnas y de celdas. */
export function leerCsv(texto: string, lim: LimitesTabla): string[][] {
  const sep = separador(texto);
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let comillas = false;
  let hayCampo = false;
  let celdas = 0;

  const cerrarCampo = (): void => {
    if (++celdas > lim.celdas) throw limiteCeldas(lim.celdas);
    fila.push(campo.length > MAX_CELDA ? campo.slice(0, MAX_CELDA) : campo);
    if (fila.length > lim.columnas) throw limiteColumnas(lim.columnas);
    campo = '';
    hayCampo = false;
  };
  const cerrarFila = (): void => {
    if (fila.length === 1 && fila[0] === '' && !hayCampo) {
      fila = [];
      return; // línea vacía
    }
    filas.push(fila);
    if (filas.length > lim.filas) throw limiteFilas(lim.filas);
    fila = [];
  };

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!;
    if (comillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else comillas = false;
      } else campo += c;
    } else if (c === '"' && campo === '') {
      comillas = true;
      hayCampo = true;
    } else if (c === sep) {
      cerrarCampo();
      hayCampo = true;
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      cerrarCampo();
      cerrarFila();
    } else {
      campo += c;
      hayCampo = true;
    }
  }
  if (campo !== '' || fila.length > 0 || hayCampo) {
    cerrarCampo();
    cerrarFila();
  }
  return filas;
}

/** Filas a CSV (comas, CRLF). Los textos peligrosos se neutralizan; los números, no. */
export function escribirCsv(filas: readonly (readonly Celda[])[]): string {
  const salida: string[] = [];
  for (const fila of filas) {
    salida.push(
      fila
        .map((c) => {
          if (c === null) return '';
          const t = typeof c === 'string' ? neutralizarFormula(c) : String(c);
          return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
        })
        .join(','),
    );
  }
  // BOM: Excel solo reconoce UTF-8 con él.
  return `\uFEFF${salida.join('\r\n')}\r\n`;
}

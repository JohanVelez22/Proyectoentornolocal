import { open } from 'node:fs/promises';

export type FormatoRespaldo = 'sql' | 'pgdump' | 'gz' | 'zip' | 'rar' | '7z' | 'desconocido';

/** Bytes que se leen del principio para decidir el formato. */
export const LARGO_CABEZA = 4096;

const empieza = (b: Buffer, firma: number[]): boolean =>
  b.length >= firma.length && firma.every((x, i) => b[i] === x);

/** true si la cabeza trae la marca de orden de bytes de UTF-16LE (FF FE). */
export const esUtf16le = (b: Buffer): boolean => empieza(b, [0xff, 0xfe]);

/** true si es un tar sin comprimir (firma "ustar" en el byte 257). */
export const esTar = (b: Buffer): boolean =>
  b.length >= 262 && b.subarray(257, 262).toString('latin1') === 'ustar';

/** Formato de un respaldo según sus primeros bytes (nunca por la extensión). */
export function formatoDeCabeza(b: Buffer): FormatoRespaldo {
  if (b.length === 0) return 'desconocido';
  if (b.subarray(0, 5).toString('latin1') === 'PGDMP') return 'pgdump';
  if (empieza(b, [0x1f, 0x8b])) return 'gz';
  if (empieza(b, [0x50, 0x4b, 0x03, 0x04])) return 'zip';
  if (empieza(b, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07])) return 'rar';
  if (empieza(b, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return '7z';
  // Texto: UTF-16 con BOM (PowerShell 5.1 redirige así) o sin bytes nulos.
  if (esUtf16le(b) || empieza(b, [0xfe, 0xff])) return 'sql';
  return b.includes(0) ? 'desconocido' : 'sql';
}

/** Primeros `largo` bytes de un archivo. */
export async function leerCabeza(ruta: string, largo = LARGO_CABEZA): Promise<Buffer> {
  const f = await open(ruta, 'r');
  try {
    const b = Buffer.alloc(largo);
    const { bytesRead } = await f.read(b, 0, largo, 0);
    return b.subarray(0, bytesRead);
  } finally {
    await f.close();
  }
}

/** Detecta el formato de un respaldo por sus bytes mágicos. */
export async function detectarFormato(ruta: string): Promise<FormatoRespaldo> {
  return formatoDeCabeza(await leerCabeza(ruta));
}

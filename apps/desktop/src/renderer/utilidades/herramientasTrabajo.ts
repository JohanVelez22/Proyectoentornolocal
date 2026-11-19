/**
 * Lo que corre dentro del Worker de Herramientas (regex y MD5). Separado para que el Worker no
 * arrastre markdown-it, diff ni bcryptjs.
 */
import { es } from '../i18n/es';

const t = es.herramientas.errores;

export interface Coincidencia {
  indice: number;
  fin: number;
  texto: string;
  grupos: (string | undefined)[];
  nombrados: Record<string, string | undefined>;
}

export interface ResultadoRegex {
  coincidencias: Coincidencia[];
  truncado: boolean;
  error?: string;
}

/** Todas las coincidencias (hasta `max`). Corre dentro del Worker: un patrón malo no congela. */
export function buscarCoincidencias(
  patron: string,
  banderas: string,
  texto: string,
  max = 1000,
): ResultadoRegex {
  if (!/^[dgimsuyv]*$/.test(banderas) || new Set(banderas).size !== banderas.length) {
    return { coincidencias: [], truncado: false, error: t.banderas };
  }
  let re: RegExp;
  try {
    re = new RegExp(patron, `${banderas.replace('g', '')}g`);
  } catch (e) {
    return { coincidencias: [], truncado: false, error: t.regex((e as Error).message) };
  }
  const coincidencias: Coincidencia[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    if (coincidencias.length >= max) return { coincidencias, truncado: true };
    coincidencias.push({
      indice: m.index,
      fin: m.index + m[0].length,
      texto: m[0],
      grupos: m.slice(1),
      nombrados: { ...(m.groups ?? {}) },
    });
    if (m[0] === '') re.lastIndex++;
    if (re.lastIndex > texto.length) break;
  }
  return { coincidencias, truncado: false };
}

const K_MD5 = Array.from(
  { length: 64 },
  (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0,
);
const R_MD5 = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

/** MD5 (RFC 1321). Solo para comprobar sumas: no sirve como protección. */
export function md5(datos: Uint8Array): string {
  const largo = datos.length;
  const total = (((largo + 8) >>> 6) + 1) * 64;
  const m = new Uint8Array(total);
  m.set(datos);
  m[largo] = 0x80;
  const vista = new DataView(m.buffer);
  vista.setUint32(total - 8, (largo * 8) >>> 0, true);
  vista.setUint32(total - 4, Math.floor(largo / 0x20000000), true);
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const x = new Uint32Array(16);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) x[i] = vista.getUint32(off + i * 4, true);
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const tmp = d;
      d = c;
      c = b;
      const suma = (a + f + (K_MD5[i] ?? 0) + (x[g] ?? 0)) >>> 0;
      const r = R_MD5[i] ?? 0;
      b = (b + ((suma << r) | (suma >>> (32 - r)))) >>> 0;
      a = tmp;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }
  const salida = new DataView(new ArrayBuffer(16));
  [a0, b0, c0, d0].forEach((v, i) => salida.setUint32(i * 4, v, true));
  return aHex(new Uint8Array(salida.buffer));
}

export function aHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

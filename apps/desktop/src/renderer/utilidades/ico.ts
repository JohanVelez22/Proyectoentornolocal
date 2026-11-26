/**
 * Archivo `.ico` con imágenes PNG dentro (válido desde Windows Vista). Cabecera ICONDIR de 6 bytes
 * (`00 00 01 00` + cantidad), una entrada ICONDIRENTRY de 16 bytes por imagen y luego los PNG.
 */

export const TAMANOS_ICO = [16, 32, 48, 64, 128, 256] as const;

export interface PngIco {
  /** Lado en píxeles (la imagen es cuadrada). */
  tamano: number;
  datos: Uint8Array;
}

const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47];

export function pngsAIco(pngs: PngIco[]): Uint8Array {
  if (pngs.length === 0 || pngs.length > TAMANOS_ICO.length) {
    throw new Error('invalid ICO image count');
  }
  const vistos = new Set<number>();
  for (const p of pngs) {
    if (!(TAMANOS_ICO as readonly number[]).includes(p.tamano) || vistos.has(p.tamano)) {
      throw new Error('invalid ICO size');
    }
    vistos.add(p.tamano);
    if (p.datos.length < FIRMA_PNG.length || FIRMA_PNG.some((b, i) => p.datos[i] !== b)) {
      throw new Error('each ICO image must be a PNG');
    }
  }
  const cabecera = 6 + 16 * pngs.length;
  const total = cabecera + pngs.reduce((s, p) => s + p.datos.length, 0);
  const ico = new Uint8Array(total);
  const v = new DataView(ico.buffer);
  v.setUint16(0, 0, true); // reservado
  v.setUint16(2, 1, true); // tipo 1 = icono
  v.setUint16(4, pngs.length, true);
  let desplazamiento = cabecera;
  pngs.forEach((p, i) => {
    const e = 6 + 16 * i;
    ico[e] = p.tamano === 256 ? 0 : p.tamano; // 0 significa 256
    ico[e + 1] = p.tamano === 256 ? 0 : p.tamano;
    ico[e + 2] = 0; // sin paleta
    ico[e + 3] = 0;
    v.setUint16(e + 4, 1, true); // planos
    v.setUint16(e + 6, 32, true); // bits por píxel
    v.setUint32(e + 8, p.datos.length, true);
    v.setUint32(e + 12, desplazamiento, true);
    ico.set(p.datos, desplazamiento);
    desplazamiento += p.datos.length;
  });
  return ico;
}

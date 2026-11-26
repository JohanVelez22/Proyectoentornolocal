import { lstat, open, rm } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { abrirNuevo } from './salidaNueva';

/**
 * Imágenes que pasan entre el disco y la interfaz (convertir a ICO/PNG y comprimir). La imagen es
 * una entrada no confiable: aquí NO se decodifica nunca; solo se lee la cabecera para saber sus
 * dimensiones y rechazar las bombas de descompresión (un PNG de 50000×50000 ocupa cientos de MB
 * al decodificarse aunque el archivo pese pocos KB) antes de que nadie las abra.
 */

export const LIMITES_IMAGEN = {
  /** Peso máximo del archivo de entrada. */
  bytesEntrada: 30 * 1024 * 1024,
  /** Peso máximo de lo que la interfaz guarda. */
  bytesSalida: 60 * 1024 * 1024,
  /** Lado máximo en píxeles. */
  ladoMax: 12_000,
  /** Área máxima (≈ 256 MB decodificada en RGBA). */
  pixelesMax: 64_000_000,
} as const;

export type TipoImagen = 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp' | 'ico';

export interface DimensionesImagen {
  tipo: TipoImagen;
  ancho: number;
  alto: number;
}

export interface ImagenLeida extends DimensionesImagen {
  nombre: string;
  bytes: Uint8Array;
}

const EXTENSIONES_SALIDA: Record<string, TipoImagen> = {
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.webp': 'webp',
  '.ico': 'ico',
};

const ascii = (b: Uint8Array, desde: number, texto: string): boolean =>
  b.length >= desde + texto.length &&
  texto.split('').every((c, i) => b[desde + i] === c.charCodeAt(0));

function vista(b: Uint8Array): DataView {
  return new DataView(b.buffer, b.byteOffset, b.byteLength);
}

/**
 * GIF: la pantalla lógica puede ser de 1×1 y traer un cuadro de 13000×13000, y los decodificadores
 * usan el cuadro. Se recorren los bloques (con tope de pasos y sin salirse del archivo) y se toma
 * el mayor entre la pantalla y `izquierda+ancho` / `arriba+alto` de cada cuadro.
 */
function dimensionesGif(b: Uint8Array, v: DataView): DimensionesImagen {
  let ancho = v.getUint16(6, true);
  let alto = v.getUint16(8, true);
  const tablaGlobal = b.length > 10 && (b[10]! & 0x80) !== 0;
  let i = 13 + (tablaGlobal ? 3 * 2 ** ((b[10]! & 7) + 1) : 0);
  /** Salta los subbloques de datos hasta el terminador; false si el archivo acaba antes. */
  const saltarSubbloques = (): boolean => {
    while (i < b.length) {
      const n = b[i++]!;
      if (n === 0) return true;
      i += n;
    }
    return false;
  };
  for (let pasos = 0; pasos < 10_000 && i < b.length; pasos++) {
    const tipo = b[i++]!;
    if (tipo === 0x3b) break;
    if (tipo === 0x21) {
      i++; // etiqueta de la extensión
      if (!saltarSubbloques()) break;
    } else if (tipo === 0x2c) {
      if (i + 9 > b.length) break;
      ancho = Math.max(ancho, v.getUint16(i, true) + v.getUint16(i + 4, true));
      alto = Math.max(alto, v.getUint16(i + 2, true) + v.getUint16(i + 6, true));
      const banderas = b[i + 8]!;
      i += 9;
      if (banderas & 0x80) i += 3 * 2 ** ((banderas & 7) + 1);
      i++; // tamaño mínimo del código LZW
      if (!saltarSubbloques()) break;
    } else {
      break;
    }
  }
  return { tipo: 'gif', ancho, alto };
}

/** Dimensiones declaradas en la cabecera, o null si no es un formato admitido o está truncada. */
export function dimensionesImagen(b: Uint8Array): DimensionesImagen | null {
  const v = vista(b);
  // PNG: firma de 8 bytes y el primer bloque es IHDR (ancho y alto de 32 bits).
  if (b.length >= 24 && b[0] === 0x89 && ascii(b, 1, 'PNG') && ascii(b, 12, 'IHDR')) {
    return { tipo: 'png', ancho: v.getUint32(16), alto: v.getUint32(20) };
  }
  if (b.length >= 10 && (ascii(b, 0, 'GIF87a') || ascii(b, 0, 'GIF89a'))) {
    return dimensionesGif(b, v);
  }
  if (b.length >= 26 && ascii(b, 0, 'BM')) {
    // BITMAPCOREHEADER (12 bytes) usa 16 bits; el resto, 32 con signo (alto negativo = de arriba).
    if (v.getUint32(14, true) === 12) {
      return { tipo: 'bmp', ancho: v.getUint16(18, true), alto: v.getUint16(20, true) };
    }
    return {
      tipo: 'bmp',
      ancho: Math.abs(v.getInt32(18, true)),
      alto: Math.abs(v.getInt32(22, true)),
    };
  }
  if (b.length >= 30 && ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP')) {
    if (ascii(b, 12, 'VP8X')) {
      return {
        tipo: 'webp',
        ancho: 1 + (b[24]! | (b[25]! << 8) | (b[26]! << 16)),
        alto: 1 + (b[27]! | (b[28]! << 8) | (b[29]! << 16)),
      };
    }
    if (ascii(b, 12, 'VP8L')) {
      const bits = v.getUint32(21, true);
      return { tipo: 'webp', ancho: 1 + (bits & 0x3fff), alto: 1 + ((bits >> 14) & 0x3fff) };
    }
    if (ascii(b, 12, 'VP8 ')) {
      return {
        tipo: 'webp',
        ancho: v.getUint16(26, true) & 0x3fff,
        alto: v.getUint16(28, true) & 0x3fff,
      };
    }
    return null;
  }
  if (b.length >= 22 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) {
    const n = v.getUint16(4, true);
    let ancho = 0;
    let alto = 0;
    for (let i = 0; i < n && 6 + 16 * (i + 1) <= b.length; i++) {
      ancho = Math.max(ancho, b[6 + 16 * i]! || 256);
      alto = Math.max(alto, b[7 + 16 * i]! || 256);
    }
    return ancho && alto ? { tipo: 'ico', ancho, alto } : null;
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    // Se recorren los bloques hasta un SOFn (el que trae las dimensiones); con tope de pasos.
    let i = 2;
    for (let pasos = 0; pasos < 4096 && i + 9 < b.length; pasos++) {
      if (b[i] !== 0xff) return null;
      const marca = b[i + 1]!;
      if (marca === 0xff) {
        i++;
        continue;
      }
      if (marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
        return { tipo: 'jpeg', alto: v.getUint16(i + 5), ancho: v.getUint16(i + 7) };
      }
      if (marca === 0xd8 || marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + v.getUint16(i + 2);
    }
    return null;
  }
  return null;
}

const enMb = (n: number): string => `${Math.round(n / (1024 * 1024))} MB`;

/**
 * Lee una imagen elegida en un diálogo. Rechaza lo que no es un archivo normal, lo que pesa más
 * del tope, lo que no es una imagen admitida (se mira el contenido, no la extensión) y lo que
 * declara dimensiones fuera de los límites. Nunca decodifica.
 */
export async function leerImagen(
  ruta: string,
  opciones: { maxBytes?: number } = {},
): Promise<ImagenLeida> {
  const maxBytes = opciones.maxBytes ?? LIMITES_IMAGEN.bytesEntrada;
  const noImagen = (): ErrorWolf =>
    new ErrorWolf('herramientas.imagen_tipo', 'Ese archivo no es una imagen admitida.');
  let st;
  try {
    st = await lstat(ruta);
  } catch {
    throw noImagen();
  }
  if (!st.isFile()) throw noImagen();
  if (st.size > maxBytes) {
    throw new ErrorWolf('herramientas.imagen_grande', 'La imagen pesa demasiado.', {
      maximo: enMb(maxBytes),
    });
  }
  const f = await open(ruta, 'r');
  let bytes: Uint8Array;
  try {
    const buf = Buffer.alloc(st.size);
    const { bytesRead } = await f.read(buf, 0, buf.length, 0);
    bytes = new Uint8Array(buf.buffer, buf.byteOffset, bytesRead);
  } finally {
    await f.close();
  }
  const dim = dimensionesImagen(bytes);
  if (!dim || dim.ancho < 1 || dim.alto < 1) throw noImagen();
  if (dim.ancho > LIMITES_IMAGEN.ladoMax || dim.alto > LIMITES_IMAGEN.ladoMax) {
    throw new ErrorWolf(
      'herramientas.imagen_dimensiones',
      'La imagen es demasiado ancha o alta para abrirla de forma segura.',
      { ancho: dim.ancho, alto: dim.alto, maximo: LIMITES_IMAGEN.ladoMax },
    );
  }
  if (dim.ancho * dim.alto > LIMITES_IMAGEN.pixelesMax) {
    throw new ErrorWolf(
      'herramientas.imagen_pixeles',
      'La imagen tiene demasiados píxeles en total para abrirla de forma segura.',
      {
        ancho: dim.ancho,
        alto: dim.alto,
        maximo: `${Math.round(LIMITES_IMAGEN.pixelesMax / 1_000_000)} Mpx`,
      },
    );
  }
  return { ...dim, nombre: path.basename(ruta), bytes };
}

/**
 * Guarda el resultado de una conversión o compresión en un archivo NUEVO (`destino` sale de un
 * diálogo "Guardar como"; si existe, se usa `nombre (1)`). La extensión debe ser de imagen y el
 * contenido debe coincidir con ella: la interfaz no puede escribir otra cosa por este camino.
 */
export async function guardarImagen(
  destino: string,
  datos: Uint8Array,
  opciones: { maxBytes?: number } = {},
): Promise<{ archivo: string; bytes: number }> {
  const maxBytes = opciones.maxBytes ?? LIMITES_IMAGEN.bytesSalida;
  const esperado = EXTENSIONES_SALIDA[path.extname(destino).toLowerCase()];
  const dim = dimensionesImagen(datos);
  if (!esperado || !dim || dim.tipo !== esperado) {
    throw new ErrorWolf(
      'herramientas.imagen_tipo',
      'El contenido no coincide con el tipo de imagen del archivo.',
    );
  }
  if (datos.byteLength > maxBytes) {
    throw new ErrorWolf('herramientas.imagen_grande', 'La imagen pesa demasiado.', {
      maximo: enMb(maxBytes),
    });
  }
  const { ruta, handle } = await abrirNuevo(destino);
  try {
    await handle.writeFile(datos);
    await handle.close();
  } catch (e) {
    await handle.close().catch(() => undefined);
    await rm(ruta, { force: true }).catch(() => undefined);
    throw e;
  }
  return { archivo: ruta, bytes: datos.byteLength };
}

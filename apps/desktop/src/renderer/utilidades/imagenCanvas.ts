/**
 * Conversión y compresión de imágenes en el renderer, con `createImageBitmap` y `OffscreenCanvas`
 * (nada sale del equipo). La entrada ya pasó por el núcleo, que rechazó las imágenes con
 * dimensiones o peso fuera de límite sin decodificarlas; aquí solo se decodifican esas.
 */

export type FormatoCompresion = 'jpeg' | 'webp';

export const MIME_IMAGEN: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
};

/** Tamaño final al limitar el lado mayor; nunca agranda y mantiene la proporción. */
export function escalar(
  ancho: number,
  alto: number,
  ladoMax: number | null,
): { ancho: number; alto: number } {
  if (!ladoMax || ladoMax < 1 || Math.max(ancho, alto) <= ladoMax) return { ancho, alto };
  const f = ladoMax / Math.max(ancho, alto);
  return { ancho: Math.max(1, Math.round(ancho * f)), alto: Math.max(1, Math.round(alto * f)) };
}

/** Porcentaje entero que se ahorró (negativo si el resultado pesa más). */
export function porcentajeAhorro(antes: number, despues: number): number {
  if (antes <= 0) return 0;
  return Math.round(((antes - despues) / antes) * 100);
}

/** Mismos límites que el núcleo (`LIMITES_IMAGEN`). */
export const LIMITE_LADO = 12_000;
export const LIMITE_PIXELES = 64_000_000;

/**
 * Comprobación posterior a la decodificación: el bitmap no puede ser mayor que lo que declaró la
 * cabecera (que el núcleo ya validó) ni salirse de los límites. Menor sí vale: algunos formatos
 * (GIF, ICO) se decodifican con un tamaño distinto del que declaran.
 */
export function bitmapAceptable(
  b: { width: number; height: number },
  declarado: { ancho: number; alto: number },
): boolean {
  return (
    b.width >= 1 &&
    b.height >= 1 &&
    b.width <= declarado.ancho &&
    b.height <= declarado.alto &&
    b.width <= LIMITE_LADO &&
    b.height <= LIMITE_LADO &&
    b.width * b.height <= LIMITE_PIXELES
  );
}

/** Decodifica y comprueba el tamaño; si no es aceptable, libera el bitmap y rechaza. */
export async function abrirBitmapVerificado(
  bytes: Uint8Array,
  tipo: string,
  declarado: { ancho: number; alto: number },
): Promise<ImageBitmap> {
  const b = await abrirBitmap(bytes, tipo);
  if (!bitmapAceptable(b, declarado)) {
    b.close();
    throw new Error('decoded size not acceptable');
  }
  return b;
}

export async function abrirBitmap(bytes: Uint8Array, tipo: string): Promise<ImageBitmap> {
  const mime = MIME_IMAGEN[tipo] ?? 'application/octet-stream';
  return createImageBitmap(new Blob([bytes as BlobPart], { type: mime }));
}

async function aBytes(
  lienzo: OffscreenCanvas,
  tipo: string,
  calidad?: number,
): Promise<Uint8Array> {
  const blob = await lienzo.convertToBlob(
    calidad === undefined ? { type: tipo } : { type: tipo, quality: calidad },
  );
  // Si el motor no sabe codificar el formato pedido devuelve PNG: se avisa en vez de guardarlo mal.
  if (blob.type !== tipo) throw new Error('format unavailable');
  return new Uint8Array(await blob.arrayBuffer());
}

/** PNG del mismo tamaño (o con el lado mayor limitado). */
export async function bitmapAPng(
  b: ImageBitmap,
  ladoMax: number | null = null,
): Promise<Uint8Array> {
  const { ancho, alto } = escalar(b.width, b.height, ladoMax);
  const lienzo = new OffscreenCanvas(ancho, alto);
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(b, 0, 0, ancho, alto);
  return aBytes(lienzo, 'image/png');
}

/** PNG cuadrado de `lado` px: la imagen entra entera y centrada, con fondo transparente. */
export async function cuadradoAPng(b: ImageBitmap, lado: number): Promise<Uint8Array> {
  const lienzo = new OffscreenCanvas(lado, lado);
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  const f = Math.min(lado / b.width, lado / b.height);
  const w = Math.max(1, Math.round(b.width * f));
  const h = Math.max(1, Math.round(b.height * f));
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(b, Math.round((lado - w) / 2), Math.round((lado - h) / 2), w, h);
  return aBytes(lienzo, 'image/png');
}

/** JPEG o WebP con calidad (1–100) y, si se pide, el lado mayor limitado. */
export async function comprimirBitmap(
  b: ImageBitmap,
  o: { formato: FormatoCompresion; calidad: number; ladoMax: number | null },
): Promise<Uint8Array> {
  const { ancho, alto } = escalar(b.width, b.height, o.ladoMax);
  const lienzo = new OffscreenCanvas(ancho, alto);
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  if (o.formato === 'jpeg') {
    // JPEG no tiene transparencia: sin fondo saldría negro.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(b, 0, 0, ancho, alto);
  const calidad = Math.min(1, Math.max(0.01, o.calidad / 100));
  return aBytes(lienzo, MIME_IMAGEN[o.formato]!, calidad);
}

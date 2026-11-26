/**
 * Dibujo del editor rápido de capturas (D35). Todo es puro: las anotaciones son datos, el pixelado
 * trabaja sobre una copia de los píxeles y el lienzo solo se toca en `renderizar`, con un
 * contexto mínimo que las pruebas sustituyen. Nada sale del equipo.
 */

export interface Punto {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Píxeles RGBA (lo mismo que un `ImageData`). */
export interface ImagenRgba {
  ancho: number;
  alto: number;
  datos: Uint8ClampedArray;
}

export const COLORES_DIBUJO = [
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#111827',
  '#ffffff',
] as const;
export const COLOR_RESALTADOR = '#facc15';
export const GROSORES_DIBUJO = [2, 4, 8] as const;
/** Lado mínimo del bloque del pixelado, en píxeles de la imagen. */
export const BLOQUE_PIXELADO_MIN = 16;
/** Color del relleno de "Ocultar": opaco, no deja nada del original debajo. */
export const COLOR_OCULTAR = '#000000';

/**
 * Lado del bloque del pixelado, en píxeles de la imagen: nunca menos de 16, ni de 16 píxeles de
 * pantalla (`factor` = píxeles de imagen por píxel CSS), ni de un cuarto del alto de la zona. Así un
 * texto pequeño queda en 4 bloques de alto como mucho y no se puede leer.
 */
export function bloquePixelado(altoRect: number, factor: number = 1): number {
  const f = Number.isFinite(factor) && factor > 0 ? factor : 1;
  const alto = Number.isFinite(altoRect) && altoRect > 0 ? altoRect : 0;
  return Math.max(BLOQUE_PIXELADO_MIN, Math.round(BLOQUE_PIXELADO_MIN * f), Math.round(alto / 4));
}
export const LIMITE_DESHACER = 50;
/** Tope de caracteres de un texto (el campo del editor también lo respeta). */
export const MAX_TEXTO = 200;

/** Herramientas del editor rápido. */
export type HerramientaCaptura =
  'recuadro' | 'flecha' | 'linea' | 'resaltar' | 'texto' | 'pixelar' | 'ocultar';

export type Anotacion =
  | { tipo: 'recuadro'; rect: Rect; color: string; grosor: number }
  | { tipo: 'linea'; desde: Punto; hasta: Punto; color: string; grosor: number }
  | {
      tipo: 'flecha';
      desde: Punto;
      hasta: Punto;
      cabeza: [Punto, Punto];
      color: string;
      grosor: number;
    }
  | { tipo: 'resaltar'; rect: Rect; color: string }
  | { tipo: 'texto'; pos: Punto; texto: string; color: string; tam: number }
  | { tipo: 'pixelar'; rect: Rect; tam: number }
  /** Relleno sólido: lo recomendado para datos sensibles (el pixelado conserva el color medio). */
  | { tipo: 'ocultar'; rect: Rect };

/** Rectángulo con ancho y alto positivos a partir de dos esquinas cualesquiera. */
export function normalizarRect(a: Punto, b: Punto): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    ancho: Math.abs(a.x - b.x),
    alto: Math.abs(a.y - b.y),
  };
}

export function recuadro(a: Punto, b: Punto, color: string, grosor: number): Anotacion {
  return { tipo: 'recuadro', rect: normalizarRect(a, b), color, grosor };
}

export function linea(desde: Punto, hasta: Punto, color: string, grosor: number): Anotacion {
  return { tipo: 'linea', desde: { ...desde }, hasta: { ...hasta }, color, grosor };
}

/** Flecha: la cabeza son dos puntos que parten de `hasta` a 28° del trazo, de largo `4×grosor+8`. */
export function flecha(desde: Punto, hasta: Punto, color: string, grosor: number): Anotacion {
  const largo = grosor * 4 + 8;
  const ang = Math.atan2(hasta.y - desde.y, hasta.x - desde.x);
  const abre = (Math.PI * 28) / 180;
  const punta = (d: number): Punto => ({
    x: hasta.x - largo * Math.cos(ang + d),
    y: hasta.y - largo * Math.sin(ang + d),
  });
  return {
    tipo: 'flecha',
    desde: { ...desde },
    hasta: { ...hasta },
    cabeza: [punta(abre), punta(-abre)],
    color,
    grosor,
  };
}

export function resaltar(a: Punto, b: Punto, color: string = COLOR_RESALTADOR): Anotacion {
  return { tipo: 'resaltar', rect: normalizarRect(a, b), color };
}

export function texto(pos: Punto, contenido: string, color: string, tam: number): Anotacion {
  return { tipo: 'texto', pos: { ...pos }, texto: contenido.slice(0, MAX_TEXTO), color, tam };
}

/** Pixelado de la zona entre dos esquinas; el bloque sale de `bloquePixelado`. */
export function pixelado(a: Punto, b: Punto, factor: number = 1): Anotacion {
  const rect = normalizarRect(a, b);
  return { tipo: 'pixelar', rect, tam: bloquePixelado(rect.alto, factor) };
}

export function ocultar(a: Punto, b: Punto): Anotacion {
  return { tipo: 'ocultar', rect: normalizarRect(a, b) };
}

/** Rectángulo entero que cubre `rect` por completo (sin bordes a medias por los decimales). */
export function rectEntero(rect: Rect): Rect {
  const x = Math.floor(rect.x);
  const y = Math.floor(rect.y);
  return {
    x,
    y,
    ancho: Math.ceil(rect.x + rect.ancho) - x,
    alto: Math.ceil(rect.y + rect.alto) - y,
  };
}

/** Límites de los bloques en un lado de `n` píxeles: bloques de al menos `lado` (el resto se reparte). */
function limites(n: number, lado: number): number[] {
  const bloques = Math.max(1, Math.floor(n / lado));
  const l: number[] = [];
  for (let i = 0; i <= bloques; i++) l.push(Math.round((i * n) / bloques));
  return l;
}

/**
 * Pixelado: dentro de `rect` (recortado a la imagen) cada bloque se rellena con el promedio de sus
 * colores. Los bloques miden como mínimo `tam` píxeles por lado (si la zona es menor, es un solo
 * bloque): el sobrante se reparte entre todos en vez de dejar una tira fina en el borde, que
 * conservaría el detalle. Devuelve una copia: la imagen que llega no se modifica.
 */
export function pixelar(imagen: ImagenRgba, rect: Rect, tam: number): ImagenRgba {
  const salida: ImagenRgba = {
    ancho: imagen.ancho,
    alto: imagen.alto,
    datos: new Uint8ClampedArray(imagen.datos),
  };
  const lado = Math.max(1, Math.min(256, Math.floor(tam) || 1));
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(imagen.ancho, Math.ceil(rect.x + rect.ancho));
  const y1 = Math.min(imagen.alto, Math.ceil(rect.y + rect.alto));
  if (x1 <= x0 || y1 <= y0) return salida;
  const xs = limites(x1 - x0, lado).map((v) => v + x0);
  const ys = limites(y1 - y0, lado).map((v) => v + y0);
  for (let j = 0; j < ys.length - 1; j++) {
    for (let i = 0; i < xs.length - 1; i++) {
      const bx = xs[i]!;
      const by = ys[j]!;
      const bx1 = xs[i + 1]!;
      const by1 = ys[j + 1]!;
      const suma = [0, 0, 0, 0];
      let n = 0;
      for (let y = by; y < by1; y++) {
        for (let x = bx; x < bx1; x++) {
          const k = (y * imagen.ancho + x) * 4;
          for (let c = 0; c < 4; c++) suma[c]! += imagen.datos[k + c]!;
          n++;
        }
      }
      if (n === 0) continue;
      const prom = suma.map((s) => Math.round(s / n));
      for (let y = by; y < by1; y++) {
        for (let x = bx; x < bx1; x++) {
          const k = (y * imagen.ancho + x) * 4;
          for (let c = 0; c < 4; c++) salida.datos[k + c] = prom[c]!;
        }
      }
    }
  }
  return salida;
}

/** Lo que `renderizar` necesita de un `CanvasRenderingContext2D` (las pruebas pasan uno falso). */
export interface Contexto2D {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  font: string;
  textBaseline: CanvasTextBaseline;
  globalAlpha: number;
  save(): void;
  restore(): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(t: string, x: number, y: number): void;
  getImageData(x: number, y: number, w: number, h: number): ImageData;
  putImageData(d: ImageData, x: number, y: number): void;
}

/** Dibuja una anotación vectorial (el pixelado va aparte: toca píxeles, no trazos). */
export function dibujarAnotacion(ctx: Contexto2D, a: Anotacion): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (a.tipo) {
    case 'recuadro':
      ctx.strokeStyle = a.color;
      ctx.lineWidth = a.grosor;
      ctx.strokeRect(a.rect.x, a.rect.y, a.rect.ancho, a.rect.alto);
      break;
    case 'resaltar':
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = a.color;
      ctx.fillRect(a.rect.x, a.rect.y, a.rect.ancho, a.rect.alto);
      break;
    case 'linea':
    case 'flecha':
      ctx.strokeStyle = a.color;
      ctx.lineWidth = a.grosor;
      ctx.beginPath();
      ctx.moveTo(a.desde.x, a.desde.y);
      ctx.lineTo(a.hasta.x, a.hasta.y);
      if (a.tipo === 'flecha') {
        ctx.moveTo(a.cabeza[0].x, a.cabeza[0].y);
        ctx.lineTo(a.hasta.x, a.hasta.y);
        ctx.lineTo(a.cabeza[1].x, a.cabeza[1].y);
      }
      ctx.stroke();
      break;
    case 'texto':
      ctx.fillStyle = a.color;
      ctx.font = `600 ${a.tam}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(a.texto, a.pos.x, a.pos.y);
      break;
    case 'ocultar': {
      // Relleno opaco y sobre un rectángulo entero: no queda ni un borde a medias con el original.
      const r = rectEntero(a.rect);
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLOR_OCULTAR;
      ctx.fillRect(r.x, r.y, r.ancho, r.alto);
      break;
    }
    case 'pixelar':
      break;
  }
  ctx.restore();
}

/**
 * Aplica las anotaciones en orden sobre lo que ya hay en el lienzo (la imagen base ya dibujada).
 * El pixelado lee los píxeles del lienzo en ese momento y los vuelve a escribir.
 */
export function renderizar(
  ctx: Contexto2D,
  ancho: number,
  alto: number,
  anotaciones: readonly Anotacion[],
): void {
  for (const a of anotaciones) {
    if (a.tipo !== 'pixelar') {
      dibujarAnotacion(ctx, a);
      continue;
    }
    const x = Math.max(0, Math.floor(a.rect.x));
    const y = Math.max(0, Math.floor(a.rect.y));
    const w = Math.min(ancho, Math.ceil(a.rect.x + a.rect.ancho)) - x;
    const h = Math.min(alto, Math.ceil(a.rect.y + a.rect.alto)) - y;
    if (w < 1 || h < 1) continue;
    const origen = ctx.getImageData(x, y, w, h);
    const res = pixelar(
      { ancho: w, alto: h, datos: origen.data },
      { x: 0, y: 0, ancho: w, alto: h },
      a.tam,
    );
    origen.data.set(res.datos);
    ctx.putImageData(origen, x, y);
  }
}

/**
 * Historial de estados con deshacer y rehacer. Guarda como mucho `limite` pasos hacia atrás; al
 * hacer algo nuevo se descarta lo que se había deshecho. Los estados se tratan como inmutables.
 */
export class PilaDeshacer<T> {
  private estados: T[];
  private indice = 0;

  constructor(
    inicial: T,
    private readonly limite: number = LIMITE_DESHACER,
  ) {
    this.estados = [inicial];
  }

  get actual(): T {
    return this.estados[this.indice]!;
  }

  get puedeDeshacer(): boolean {
    return this.indice > 0;
  }

  get puedeRehacer(): boolean {
    return this.indice < this.estados.length - 1;
  }

  /** Vacía el historial y empieza de nuevo en `inicial` (por ejemplo, al elegir otra zona). */
  reiniciar(inicial: T): T {
    this.estados = [inicial];
    this.indice = 0;
    return inicial;
  }

  hacer(estado: T): T {
    this.estados = this.estados.slice(0, this.indice + 1);
    this.estados.push(estado);
    if (this.estados.length > this.limite + 1) this.estados.shift();
    this.indice = this.estados.length - 1;
    return estado;
  }

  deshacer(): T {
    if (this.indice > 0) this.indice--;
    return this.actual;
  }

  rehacer(): T {
    if (this.indice < this.estados.length - 1) this.indice++;
    return this.actual;
  }
}

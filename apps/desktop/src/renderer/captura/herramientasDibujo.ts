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
/** Lado del bloque del pixelado, en píxeles de la imagen. */
export const BLOQUE_PIXELADO = 12;
export const LIMITE_DESHACER = 50;
/** Tope de caracteres de un texto (el campo del editor también lo respeta). */
export const MAX_TEXTO = 200;

/** Herramientas del editor rápido. */
export type HerramientaCaptura = 'recuadro' | 'flecha' | 'linea' | 'resaltar' | 'texto' | 'pixelar';

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
  | { tipo: 'pixelar'; rect: Rect; tam: number };

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

export function pixelado(a: Punto, b: Punto, tam: number = BLOQUE_PIXELADO): Anotacion {
  return { tipo: 'pixelar', rect: normalizarRect(a, b), tam };
}

/**
 * Pixelado: dentro de `rect` (recortado a la imagen) cada bloque de `tam`×`tam` píxeles, contado
 * desde la esquina del rectángulo, se rellena con el promedio de sus colores. Devuelve una copia:
 * la imagen que llega no se modifica.
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
  for (let by = y0; by < y1; by += lado) {
    for (let bx = x0; bx < x1; bx += lado) {
      const bx1 = Math.min(bx + lado, x1);
      const by1 = Math.min(by + lado, y1);
      const suma = [0, 0, 0, 0];
      let n = 0;
      for (let y = by; y < by1; y++) {
        for (let x = bx; x < bx1; x++) {
          const i = (y * imagen.ancho + x) * 4;
          for (let c = 0; c < 4; c++) suma[c]! += imagen.datos[i + c]!;
          n++;
        }
      }
      if (n === 0) continue;
      const prom = suma.map((s) => Math.round(s / n));
      for (let y = by; y < by1; y++) {
        for (let x = bx; x < bx1; x++) {
          const i = (y * imagen.ancho + x) * 4;
          for (let c = 0; c < 4; c++) salida.datos[i + c] = prom[c]!;
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

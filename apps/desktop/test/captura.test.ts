import { esAtajoCaptura } from '@pel/core';
import { describe, expect, it } from 'vitest';
import { atajoDePulsacion, type PulsacionTeclado } from '../src/renderer/utilidades/atajo';
import {
  PilaDeshacer,
  dibujarAnotacion,
  flecha,
  linea,
  normalizarRect,
  pixelar,
  pixelado,
  recuadro,
  renderizar,
  resaltar,
  texto,
  type Contexto2D,
  type ImagenRgba,
} from '../src/renderer/captura/herramientasDibujo';

/** Imagen 4×4 en escala de grises: el píxel (x, y) vale 10·(y·4 + x). */
function imagen4x4(): ImagenRgba {
  const datos = new Uint8ClampedArray(4 * 4 * 4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = 10 * (y * 4 + x);
      datos.set([v, v, v, 255], (y * 4 + x) * 4);
    }
  }
  return { ancho: 4, alto: 4, datos };
}
const gris = (i: ImagenRgba, x: number, y: number): number => i.datos[(y * i.ancho + x) * 4]!;

describe('pixelar', () => {
  it('promedia bloques de tam×tam dentro del rectángulo', () => {
    const r = pixelar(imagen4x4(), { x: 0, y: 0, ancho: 4, alto: 4 }, 2);
    // Bloque (0,0): píxeles 0, 10, 40, 50 → 25. Bloque (2,0): 20, 30, 60, 70 → 45.
    expect(gris(r, 0, 0)).toBe(25);
    expect(gris(r, 1, 1)).toBe(25);
    expect(gris(r, 2, 0)).toBe(45);
    expect(gris(r, 3, 1)).toBe(45);
    // Bloque (0,2): 80, 90, 120, 130 → 105. Bloque (2,2): 100, 110, 140, 150 → 125.
    expect(gris(r, 0, 3)).toBe(105);
    expect(gris(r, 3, 3)).toBe(125);
  });

  it('no toca lo de fuera del rectángulo ni modifica la imagen de origen', () => {
    const origen = imagen4x4();
    const copia = new Uint8ClampedArray(origen.datos);
    const r = pixelar(origen, { x: 0, y: 0, ancho: 2, alto: 2 }, 2);
    expect(gris(r, 0, 0)).toBe(25);
    expect(gris(r, 2, 0)).toBe(20);
    expect(gris(r, 3, 3)).toBe(150);
    expect(origen.datos).toEqual(copia);
  });

  it('recorta el rectángulo a la imagen y acepta bloques más grandes que ella', () => {
    const r = pixelar(imagen4x4(), { x: -5, y: -5, ancho: 100, alto: 100 }, 99);
    const promedio = Math.round(
      Array.from({ length: 16 }, (_, i) => i * 10).reduce((a, b) => a + b, 0) / 16,
    );
    expect(gris(r, 0, 0)).toBe(promedio);
    expect(gris(r, 3, 3)).toBe(promedio);
    // Un tamaño no válido no rompe nada (cae a 1 = sin cambio).
    expect(pixelar(imagen4x4(), { x: 0, y: 0, ancho: 4, alto: 4 }, 0).datos).toEqual(
      imagen4x4().datos,
    );
  });
});

describe('PilaDeshacer', () => {
  it('deshace y rehace, y lo nuevo descarta lo deshecho', () => {
    const p = new PilaDeshacer<number>(0);
    p.hacer(1);
    p.hacer(2);
    expect(p.deshacer()).toBe(1);
    expect(p.puedeRehacer).toBe(true);
    expect(p.rehacer()).toBe(2);
    p.deshacer();
    p.hacer(9);
    expect(p.puedeRehacer).toBe(false);
    expect(p.actual).toBe(9);
    expect(p.deshacer()).toBe(1);
    expect(p.deshacer()).toBe(0);
    expect(p.puedeDeshacer).toBe(false);
    expect(p.deshacer()).toBe(0);
  });

  it('guarda como mucho 50 pasos hacia atrás', () => {
    const p = new PilaDeshacer<number>(0);
    for (let i = 1; i <= 80; i++) p.hacer(i);
    let pasos = 0;
    while (p.puedeDeshacer) {
      p.deshacer();
      pasos++;
    }
    expect(pasos).toBe(50);
    expect(p.actual).toBe(30);
  });

  it('respeta un límite propio', () => {
    const p = new PilaDeshacer<string>('a', 2);
    p.hacer('b');
    p.hacer('c');
    p.hacer('d');
    expect(p.deshacer()).toBe('c');
    expect(p.deshacer()).toBe('b');
    expect(p.deshacer()).toBe('b');
  });
});

describe('anotaciones', () => {
  it('normalizan las esquinas en cualquier orden', () => {
    expect(normalizarRect({ x: 9, y: 2 }, { x: 3, y: 8 })).toEqual({
      x: 3,
      y: 2,
      ancho: 6,
      alto: 6,
    });
    expect(recuadro({ x: 5, y: 5 }, { x: 1, y: 1 }, '#fff', 2)).toMatchObject({
      tipo: 'recuadro',
      rect: { x: 1, y: 1, ancho: 4, alto: 4 },
    });
  });

  it('la flecha pone dos puntas simétricas detrás de la punta', () => {
    const f = flecha({ x: 0, y: 0 }, { x: 100, y: 0 }, '#f00', 4);
    if (f.tipo !== 'flecha') throw new Error('tipo');
    const [a, b] = f.cabeza;
    expect(a.x).toBeCloseTo(b.x);
    expect(a.x).toBeLessThan(100);
    expect(a.y).toBeCloseTo(-b.y);
    expect(Math.abs(a.y)).toBeGreaterThan(0);
  });

  it('el texto se acota y el pixelado usa el bloque por defecto', () => {
    const t = texto({ x: 0, y: 0 }, 'x'.repeat(500), '#000', 18);
    expect(t.tipo === 'texto' && t.texto.length).toBe(200);
    expect(pixelado({ x: 0, y: 0 }, { x: 5, y: 5 })).toMatchObject({ tipo: 'pixelar', tam: 12 });
  });
});

function contextoFalso(): { ctx: Contexto2D; llamadas: string[] } {
  const llamadas: string[] = [];
  const dato = { data: new Uint8ClampedArray(2 * 2 * 4).fill(0) } as unknown as ImageData;
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    save: () => llamadas.push('save'),
    restore: () => llamadas.push('restore'),
    beginPath: () => llamadas.push('beginPath'),
    moveTo: (x: number, y: number) => llamadas.push(`moveTo ${x},${y}`),
    lineTo: (x: number, y: number) => llamadas.push(`lineTo ${x},${y}`),
    stroke: () => llamadas.push('stroke'),
    fillRect: (...a: number[]) => llamadas.push(`fillRect ${a.join(',')}`),
    strokeRect: (...a: number[]) => llamadas.push(`strokeRect ${a.join(',')}`),
    fillText: (t: string) => llamadas.push(`fillText ${t}`),
    getImageData: (...a: number[]) => {
      llamadas.push(`getImageData ${a.join(',')}`);
      return dato;
    },
    putImageData: (_d: ImageData, x: number, y: number) => llamadas.push(`putImageData ${x},${y}`),
  } as unknown as Contexto2D;
  return { ctx, llamadas };
}

describe('dibujo sobre el lienzo', () => {
  it('cada anotación vectorial hace su trazo y restaura el contexto', () => {
    const { ctx, llamadas } = contextoFalso();
    dibujarAnotacion(ctx, recuadro({ x: 1, y: 2 }, { x: 4, y: 6 }, '#f00', 4));
    dibujarAnotacion(ctx, linea({ x: 0, y: 0 }, { x: 3, y: 3 }, '#0f0', 2));
    dibujarAnotacion(ctx, resaltar({ x: 0, y: 0 }, { x: 2, y: 2 }));
    dibujarAnotacion(ctx, texto({ x: 1, y: 1 }, 'hola', '#00f', 20));
    expect(llamadas).toContain('strokeRect 1,2,3,4');
    expect(llamadas).toContain('lineTo 3,3');
    expect(llamadas).toContain('fillRect 0,0,2,2');
    expect(llamadas).toContain('fillText hola');
    expect(llamadas.filter((l) => l === 'save').length).toBe(
      llamadas.filter((l) => l === 'restore').length,
    );
  });

  it('renderizar pixela leyendo y escribiendo solo el rectángulo recortado', () => {
    const { ctx, llamadas } = contextoFalso();
    renderizar(ctx, 2, 2, [pixelado({ x: -3, y: -3 }, { x: 50, y: 50 }, 2)]);
    expect(llamadas).toEqual(['getImageData 0,0,2,2', 'putImageData 0,0']);
  });
});

describe('atajoDePulsacion', () => {
  const p = (code: string, extra: Partial<PulsacionTeclado> = {}): PulsacionTeclado => ({
    code,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...extra,
  });

  it('arma el atajo con modificadores en orden fijo', () => {
    expect(atajoDePulsacion(p('KeyS', { ctrlKey: true, shiftKey: true }))).toBe('Ctrl+Shift+S');
    expect(atajoDePulsacion(p('Digit4', { metaKey: true, shiftKey: true }))).toBe('Shift+Super+4');
    expect(atajoDePulsacion(p('F12', { altKey: true }))).toBe('Alt+F12');
  });

  it('rechaza lo que no sirve: sin modificador, solo modificadores u otras teclas', () => {
    expect(atajoDePulsacion(p('KeyS'))).toBeNull();
    expect(atajoDePulsacion(p('ControlLeft', { ctrlKey: true }))).toBeNull();
    expect(atajoDePulsacion(p('Enter', { ctrlKey: true }))).toBeNull();
    expect(atajoDePulsacion(p('F25', { ctrlKey: true }))).toBeNull();
  });

  it('lo que arma siempre es un atajo válido para el núcleo', () => {
    for (const code of ['KeyA', 'Digit0', 'F1', 'F24']) {
      expect(esAtajoCaptura(atajoDePulsacion(p(code, { ctrlKey: true, altKey: true })))).toBe(true);
    }
  });
});

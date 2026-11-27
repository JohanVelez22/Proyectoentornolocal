import { esAtajoCaptura } from '@pel/core';
import { describe, expect, it } from 'vitest';
import { atajoDePulsacion, type PulsacionTeclado } from '../src/renderer/utilidades/atajo';
import {
  COLOR_OCULTAR,
  PilaDeshacer,
  bloquePixelado,
  dibujarAnotacion,
  flecha,
  linea,
  normalizarRect,
  ocultar,
  pixelar,
  pixelado,
  recuadro,
  rectEntero,
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

describe('bloque del pixelado', () => {
  it('es max(16, round(16·factor), round(alto/4)) en píxeles de imagen', () => {
    expect(bloquePixelado(10, 1)).toBe(16);
    expect(bloquePixelado(100, 1)).toBe(25);
    expect(bloquePixelado(100, 2)).toBe(32);
    expect(bloquePixelado(100, 1.5)).toBe(25);
    expect(bloquePixelado(20, 1.5)).toBe(24);
    expect(bloquePixelado(400, 1)).toBe(100);
    expect(bloquePixelado(0, 1)).toBe(16);
  });

  it('un valor raro no rompe el cálculo', () => {
    expect(bloquePixelado(NaN, NaN)).toBe(16);
    expect(bloquePixelado(-5, -2)).toBe(16);
    expect(bloquePixelado(Infinity, 0)).toBe(16);
  });

  it('la anotación de pixelado lo usa con el alto de su rectángulo y el factor de la vista', () => {
    expect(pixelado({ x: 0, y: 0 }, { x: 300, y: 200 })).toMatchObject({ tam: 50 });
    expect(pixelado({ x: 0, y: 0 }, { x: 30, y: 20 }, 2)).toMatchObject({ tam: 32 });
  });
});

/** Imagen de ruido determinista (no hay dos píxeles vecinos iguales a propósito). */
function ruido(ancho: number, alto: number): ImagenRgba {
  const datos = new Uint8ClampedArray(ancho * alto * 4);
  let s = 12345;
  for (let i = 0; i < datos.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    datos[i] = i % 4 === 3 ? 255 : (s >> 8) & 255;
  }
  return { ancho, alto, datos };
}

const px = (im: ImagenRgba, x: number, y: number): string =>
  Array.from(im.datos.slice((y * im.ancho + x) * 4, (y * im.ancho + x) * 4 + 4)).join(',');

describe('el pixelado no conserva los píxeles originales de la región', () => {
  it('dentro de la región casi ningún píxel sigue siendo el original y cada bloque es uniforme', () => {
    const origen = ruido(200, 120);
    const rect = { x: 20, y: 10, ancho: 150, alto: 100 };
    const tam = bloquePixelado(rect.alto, 1);
    const r = pixelar(origen, rect, tam);
    let iguales = 0;
    let total = 0;
    for (let y = rect.y; y < rect.y + rect.alto; y++) {
      for (let x = rect.x; x < rect.x + rect.ancho; x++) {
        total++;
        if (px(r, x, y) === px(origen, x, y)) iguales++;
      }
    }
    // Con ruido, solo coinciden los píxeles cuyo valor es justo el promedio de su bloque.
    expect(iguales / total).toBeLessThan(0.01);
    // Pocos bloques: a lo sumo 4 de alto (alto/4) y cada uno es de un solo color.
    const colores = new Set<string>();
    for (let y = rect.y; y < rect.y + rect.alto; y++) {
      for (let x = rect.x; x < rect.x + rect.ancho; x++) colores.add(px(r, x, y));
    }
    expect(colores.size).toBeLessThanOrEqual(4 * Math.ceil(rect.ancho / tam));
  });

  it('fuera de la región la imagen queda intacta', () => {
    const origen = ruido(60, 60);
    const r = pixelar(origen, { x: 10, y: 10, ancho: 30, alto: 30 }, 16);
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 60; x++) {
        const dentro = x >= 10 && x < 40 && y >= 10 && y < 40;
        if (!dentro) expect(px(r, x, y)).toBe(px(origen, x, y));
      }
    }
  });

  it('los bordes no dejan una tira fina de detalle: todo bloque mide al menos el lado pedido', () => {
    const origen = ruido(100, 40);
    // 53 de ancho con bloques de 16 deja 5 de resto: se reparte, no se deja una tira de 5.
    const r = pixelar(origen, { x: 0, y: 0, ancho: 53, alto: 40 }, 16);
    const fila = (y: number): string[] => Array.from({ length: 53 }, (_, x) => px(r, x, y));
    const tramos: number[] = [];
    let largo = 1;
    const f = fila(0);
    for (let x = 1; x < 53; x++) {
      if (f[x] === f[x - 1]) largo++;
      else {
        tramos.push(largo);
        largo = 1;
      }
    }
    tramos.push(largo);
    expect(tramos.every((t) => t >= 16)).toBe(true);
    expect(tramos.reduce((a, b) => a + b, 0)).toBe(53);
  });

  it('con coordenadas decimales no queda un borde a medias con el original', () => {
    const origen = ruido(50, 50);
    const r = pixelar(origen, { x: 10.4, y: 10.4, ancho: 20.3, alto: 20.3 }, 16);
    // Cubre de 10 a 31 (suelo y techo): ni el píxel 10 ni el 30 conservan el original.
    expect(px(r, 10, 10)).not.toBe(px(origen, 10, 10));
    expect(px(r, 30, 30)).not.toBe(px(origen, 30, 30));
  });
});

describe('ocultar (relleno sólido)', () => {
  it('es una anotación con el rectángulo normalizado', () => {
    expect(ocultar({ x: 9, y: 9 }, { x: 1, y: 3 })).toEqual({
      tipo: 'ocultar',
      rect: { x: 1, y: 3, ancho: 8, alto: 6 },
    });
  });

  it('rectEntero cubre por completo el rectángulo decimal', () => {
    expect(rectEntero({ x: 10.4, y: 2.9, ancho: 20.3, alto: 5.2 })).toEqual({
      x: 10,
      y: 2,
      ancho: 21,
      alto: 7,
    });
  });

  it('pinta opaco, sobre un rectángulo entero, y no deja nada del original en la región', () => {
    // Contexto con píxeles de verdad: fillRect escribe el color en una imagen de ruido.
    const origen = ruido(40, 30);
    const datos = new Uint8ClampedArray(origen.datos);
    let alfa = 1;
    let estilo = '';
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      save: () => undefined,
      restore: () => undefined,
      beginPath: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => undefined,
      strokeRect: () => undefined,
      fillText: () => undefined,
      getImageData: () => ({ data: datos }) as unknown as ImageData,
      putImageData: () => undefined,
      fillRect(x: number, y: number, w: number, h: number) {
        const yo = ctx as unknown as { globalAlpha: number; fillStyle: string };
        alfa = yo.globalAlpha;
        estilo = String(yo.fillStyle);
        for (let j = y; j < y + h; j++) {
          for (let i = x; i < x + w; i++) {
            datos.set([0, 0, 0, 255], (j * 40 + i) * 4);
          }
        }
      },
    } as unknown as Contexto2D;
    renderizar(ctx, 40, 30, [ocultar({ x: 5.5, y: 4.5 }, { x: 25.2, y: 20.1 })]);
    expect(estilo).toBe(COLOR_OCULTAR);
    expect(alfa).toBe(1);
    const salida: ImagenRgba = { ancho: 40, alto: 30, datos };
    for (let y = 4; y <= 20; y++) {
      for (let x = 5; x <= 25; x++) {
        expect(px(salida, x, y), `${x},${y}`).toBe('0,0,0,255');
      }
    }
    // Fuera sigue el original.
    expect(px(salida, 4, 4)).toBe(px(origen, 4, 4));
    expect(px(salida, 26, 21)).toBe(px(origen, 26, 21));
  });
});

describe('PilaDeshacer', () => {
  it('reiniciar vacía el historial: no se puede deshacer hacia lo de antes', () => {
    const p = new PilaDeshacer<string[]>([]);
    p.hacer(['flecha']);
    p.hacer(['flecha', 'texto']);
    p.deshacer();
    expect(p.puedeRehacer).toBe(true);
    expect(p.reiniciar([])).toEqual([]);
    expect(p.actual).toEqual([]);
    expect(p.puedeDeshacer).toBe(false);
    expect(p.puedeRehacer).toBe(false);
    expect(p.deshacer()).toEqual([]);
    p.hacer(['recuadro']);
    expect(p.deshacer()).toEqual([]);
    expect(p.puedeDeshacer).toBe(false);
  });

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
    expect(pixelado({ x: 0, y: 0 }, { x: 5, y: 5 })).toMatchObject({ tipo: 'pixelar', tam: 16 });
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
    expect(atajoDePulsacion(p('KeyS', { ctrlKey: true, altKey: true, shiftKey: true }))).toBe(
      'Ctrl+Alt+Shift+S',
    );
    expect(atajoDePulsacion(p('Digit4', { metaKey: true, shiftKey: true }))).toBe('Shift+Super+4');
    expect(atajoDePulsacion(p('F12', { altKey: true }))).toBe('Alt+F12');
  });

  it('rechaza lo que no sirve: sin modificador, solo modificadores u otras teclas', () => {
    expect(atajoDePulsacion(p('KeyS'))).toBeNull();
    expect(atajoDePulsacion(p('ControlLeft', { ctrlKey: true }))).toBeNull();
    expect(atajoDePulsacion(p('Enter', { ctrlKey: true }))).toBeNull();
    expect(atajoDePulsacion(p('F25', { ctrlKey: true }))).toBeNull();
  });

  it('lo que arma con Ctrl+Alt+Mayús siempre es un atajo válido para el núcleo', () => {
    for (const code of ['KeyA', 'Digit0', 'F1', 'F24']) {
      const k = { ctrlKey: true, altKey: true, shiftKey: true };
      expect(esAtajoCaptura(atajoDePulsacion(p(code, k)))).toBe(true);
    }
  });

  it('arma lo que el núcleo luego rechaza (el núcleo manda): AltGr y atajos comunes', () => {
    // Ctrl+Alt es AltGr en teclados europeos; Ctrl+C es copiar.
    expect(esAtajoCaptura(atajoDePulsacion(p('KeyQ', { ctrlKey: true, altKey: true })))).toBe(
      false,
    );
    expect(esAtajoCaptura(atajoDePulsacion(p('KeyC', { ctrlKey: true })))).toBe(false);
    expect(esAtajoCaptura(atajoDePulsacion(p('F4', { altKey: true })))).toBe(false);
    expect(esAtajoCaptura(atajoDePulsacion(p('KeyK', { shiftKey: true })))).toBe(false);
  });
});

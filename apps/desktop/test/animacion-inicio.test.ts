import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PARAMETRO_SIN_ANIMACION } from '../src/shared/animacion';
import { esModoHumo } from '../src/main/carpetaHumo';
import {
  DURACION_MAX_MS,
  entornoDelNavegador,
  FUNDIDO_REDUCIDO_MS,
  FUNDIDO_SALTO_MS,
  iniciarAnimacion,
  modoAnimacion,
  type FaseAnimacion,
} from '../src/renderer/utilidades/animacionInicio';

const leer = (rel: string): string => readFileSync(path.join(__dirname, '..', rel), 'utf8');

describe('modoAnimacion: cuándo se muestra', () => {
  const base = { activada: true, humo: false, movimientoReducido: false };
  it('con la preferencia activada se dibuja completa', () => {
    expect(modoAnimacion(base)).toBe('completa');
  });
  it('con la preferencia apagada no se muestra', () => {
    expect(modoAnimacion({ ...base, activada: false })).toBe('ninguna');
  });
  it('en la prueba de humo no se muestra, aunque la preferencia esté activada', () => {
    expect(modoAnimacion({ ...base, humo: true })).toBe('ninguna');
    expect(modoAnimacion({ ...base, humo: true, movimientoReducido: true })).toBe('ninguna');
  });
  it('con movimiento reducido solo hay un fundido', () => {
    expect(modoAnimacion({ ...base, movimientoReducido: true })).toBe('reducida');
  });
  it('apagada gana sobre movimiento reducido', () => {
    expect(modoAnimacion({ ...base, activada: false, movimientoReducido: true })).toBe('ninguna');
  });
  it('los tiempos: 2,5 s como máximo y un fundido reducido de 300 ms o menos', () => {
    expect(DURACION_MAX_MS).toBeLessThanOrEqual(2500);
    expect(FUNDIDO_REDUCIDO_MS).toBeLessThanOrEqual(300);
    expect(FUNDIDO_SALTO_MS).toBeLessThanOrEqual(300);
  });
});

function objetivo(): EventTarget {
  return new EventTarget();
}
function tecla(o: EventTarget, key: string): void {
  o.dispatchEvent(Object.assign(new Event('keydown'), { key }));
}

describe('iniciarAnimacion', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function arrancar(modo: 'completa' | 'reducida' = 'completa') {
    const o = objetivo();
    const fases: FaseAnimacion[] = [];
    const control = iniciarAnimacion({ modo, objetivo: o, alCambiar: (f) => fases.push(f) });
    return { o, fases, control };
  }

  it('arranca sin esperar: vuelve de inmediato y la fase es «animando»', () => {
    const { control, fases } = arrancar();
    expect(control.fase()).toBe('animando');
    expect(fases).toEqual(['animando']);
  });

  it('la capa desaparece a los 2,5 s como máximo, aunque la app tarde más', () => {
    const { control, fases } = arrancar();
    vi.advanceTimersByTime(DURACION_MAX_MS - 1);
    expect(control.fase()).toBe('animando');
    vi.advanceTimersByTime(1);
    expect(control.fase()).toBe('terminada');
    expect(fases.at(-1)).toBe('terminada');
  });

  it('con movimiento reducido dura 300 ms o menos', () => {
    const { control } = arrancar('reducida');
    vi.advanceTimersByTime(300);
    expect(control.fase()).toBe('terminada');
  });

  it('un clic la salta: fundido corto y se elimina', () => {
    const { o, control, fases } = arrancar();
    vi.advanceTimersByTime(400);
    o.dispatchEvent(new Event('pointerdown'));
    expect(control.fase()).toBe('saliendo');
    vi.advanceTimersByTime(FUNDIDO_SALTO_MS);
    expect(control.fase()).toBe('terminada');
    expect(fases).toEqual(['animando', 'saliendo', 'terminada']);
  });

  it('Esc la salta; otras teclas no', () => {
    const { o, control } = arrancar();
    tecla(o, 'a');
    tecla(o, 'Enter');
    expect(control.fase()).toBe('animando');
    tecla(o, 'Escape');
    expect(control.fase()).toBe('saliendo');
    vi.advanceTimersByTime(FUNDIDO_SALTO_MS);
    expect(control.fase()).toBe('terminada');
  });

  it('no bloquea ni consume el evento: no detiene su propagación ni lo cancela', () => {
    const { o } = arrancar();
    const e = Object.assign(new Event('keydown', { cancelable: true }), { key: 'Escape' });
    const detener = vi.spyOn(e, 'stopPropagation');
    o.dispatchEvent(e);
    expect(detener).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });

  it('saltar dos veces o tras terminar no repite fases', () => {
    const { o, control, fases } = arrancar();
    o.dispatchEvent(new Event('pointerdown'));
    o.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(10_000);
    control.saltar();
    expect(fases).toEqual(['animando', 'saliendo', 'terminada']);
  });

  it('al terminar se quitan los oyentes y no queda ningún temporizador', () => {
    const o = objetivo();
    const quitar = vi.spyOn(o, 'removeEventListener');
    iniciarAnimacion({ modo: 'completa', objetivo: o, alCambiar: () => undefined });
    vi.advanceTimersByTime(DURACION_MAX_MS);
    expect(quitar).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('detener (desmontar la capa) limpia oyentes y temporizadores sin más fases', () => {
    const { o, control, fases } = arrancar();
    control.detener();
    expect(vi.getTimerCount()).toBe(0);
    o.dispatchEvent(new Event('pointerdown'));
    expect(fases).toEqual(['animando']);
  });
});

describe('no retrasa el arranque', () => {
  it('main.ts monta la app sin esperar a la animación (vive en App.vue y no se espera)', () => {
    const main = leer('src/renderer/main.ts');
    expect(main).not.toMatch(/animacion/i);
    expect(main).toMatch(/\.finally\(\(\) => app\.mount\('#app'\)\)/);
  });
  it('la capa no recibe punteros ni foco y se oculta a los lectores de pantalla', () => {
    const v = leer('src/renderer/componentes/AnimacionInicio.vue');
    expect(v).toMatch(/aria-hidden="true"/);
    expect(v).toMatch(/pointer-events:\s*none/);
    expect(v).not.toMatch(/tabindex|autofocus|\.focus\(/);
  });
  it('solo anima transform, opacity y stroke-dashoffset (sin JS por fotograma)', () => {
    const v = leer('src/renderer/componentes/AnimacionInicio.vue');
    expect(v).not.toMatch(/requestAnimationFrame|setInterval/);
    const props = [...v.matchAll(/^\s*(?:from|to|\d+%)\s*\{([^}]*)\}/gm)].flatMap((m) =>
      [...m[1]!.matchAll(/([a-z-]+)\s*:/g)].map((x) => x[1]),
    );
    expect(new Set(props)).toEqual(new Set(['opacity', 'transform', 'stroke-dashoffset']));
  });
});

describe('prueba de humo y capturas', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('esModoHumo se activa solo con --wolfcore-humo', () => {
    expect(esModoHumo(['electron', '.', '--wolfcore-humo'])).toBe(true);
    expect(esModoHumo(['electron', '.'])).toBe(false);
  });
  it('el renderer ve el parámetro que pone el proceso principal', () => {
    vi.stubGlobal('window', {
      location: { search: `?${PARAMETRO_SIN_ANIMACION}=1` },
      matchMedia: () => ({ matches: false }),
    });
    const e = entornoDelNavegador(true);
    expect(e.humo).toBe(true);
    expect(modoAnimacion(e)).toBe('ninguna');
  });
  it('sin el parámetro y con prefers-reduced-motion se usa el fundido', () => {
    vi.stubGlobal('window', {
      location: { search: '' },
      matchMedia: (q: string) => ({ matches: q.includes('reduce') }),
    });
    expect(modoAnimacion(entornoDelNavegador(true))).toBe('reducida');
  });
  it('sin ventana (entorno raro) no falla y anima', () => {
    expect(modoAnimacion(entornoDelNavegador(true))).toBe('completa');
  });
  it('el proceso principal pasa el parámetro en la carga (archivo y servidor de desarrollo)', () => {
    const idx = leer('src/main/index.ts');
    expect(idx).toMatch(/esModoHumo\(process\.argv\)/);
    expect(idx).toMatch(/searchParams\.set\(PARAMETRO_SIN_ANIMACION/);
    expect(idx).toMatch(/query: \{ \[PARAMETRO_SIN_ANIMACION\]/);
  });
});

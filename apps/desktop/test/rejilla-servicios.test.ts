import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const leer = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');
const css = (src: string): string => src.slice(src.indexOf('<style'));
function regla(src: string, selector: string): string {
  const c = css(src);
  const i = c.indexOf(`${selector} {`);
  expect(i, selector).toBeGreaterThan(-1);
  return c.slice(i, c.indexOf('}', i));
}

const vista = leer('vistas', 'Servicios.vue');
const tarjeta = leer('componentes', 'TarjetaServicio.vue');

describe('rejilla de Servicios: tarjetas independientes y del mismo tamaño (D54b)', () => {
  it('la rejilla reparte columnas iguales con un mínimo que nunca supera el contenedor y filas de igual altura', () => {
    const r = regla(vista, '.rejilla');
    expect(r).toContain('display: grid');
    expect(r).toMatch(
      /grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(100%,\s*\d+px\),\s*1fr\)\)/,
    );
    expect(r).toContain('grid-auto-rows: 1fr');
    expect(r).toMatch(/gap:\s*16px/);
  });

  it('cada tarjeta puede encogerse (min-width: 0) y no se sale de su celda, así nunca se monta sobre la vecina', () => {
    const r = regla(vista, '.rejilla > *');
    expect(r).toContain('min-width: 0');
  });

  it('la tarjeta no anima el tamaño ni la posición (solo el color del borde)', () => {
    const r = regla(tarjeta, '.tarjeta');
    expect(r).toContain('min-width: 0');
    expect(r).not.toMatch(/transform|position:\s*(absolute|sticky)|margin-top:\s*-/);
    expect(r).toMatch(/transition:\s*border-color/);
  });

  it('la cabecera se pliega y los textos largos se parten en vez de empujar la tarjeta', () => {
    expect(regla(tarjeta, '.cabeza')).toContain('flex-wrap: wrap');
    expect(regla(tarjeta, '.mensaje')).toContain('overflow-wrap: anywhere');
    expect(regla(tarjeta, '.conflicto-cuerpo')).toContain('overflow-wrap: anywhere');
  });
});

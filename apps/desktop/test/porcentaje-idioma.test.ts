import { afterEach, describe, expect, it } from 'vitest';
import { cambiarIdioma } from '../src/renderer/i18n';
import { formatoPorcentaje } from '../src/renderer/utilidades/metricas';

/** Espacios duros y estrechos de Intl → espacio normal, para comparar. */
const norm = (s: string): string => s.replace(/\s/g, ' ');

describe('Porcentaje según el idioma (D54b C2)', () => {
  afterEach(() => cambiarIdioma('es'));

  it('en inglés no lleva espacio: «41%»', () => {
    cambiarIdioma('en');
    expect(norm(formatoPorcentaje(41))).toBe('41%');
  });

  it('en alemán y francés lleva espacio («41 %») y en español rioplatense no («41%»)', () => {
    cambiarIdioma('de');
    expect(norm(formatoPorcentaje(41))).toBe('41 %');
    cambiarIdioma('fr');
    expect(norm(formatoPorcentaje(41))).toBe('41 %');
    cambiarIdioma('es');
    expect(norm(formatoPorcentaje(41))).toBe('41%');
  });

  it('conserva un decimal bajo 10 y respeta el separador del idioma', () => {
    cambiarIdioma('en');
    expect(norm(formatoPorcentaje(4.56))).toBe('4.6%');
    cambiarIdioma('es');
    expect(norm(formatoPorcentaje(4.56))).toBe('4,6%');
  });

  it('un valor no finito da «—»', () => {
    expect(formatoPorcentaje(Number.NaN)).toBe('—');
  });
});

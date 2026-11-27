import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IDIOMAS_BASE, esIdiomaBase } from '../src/renderer/i18n';
import { IDIOMAS } from '../src/shared/idiomas';

const CSS = readFileSync(join(__dirname, '../src/renderer/estilos.css'), 'utf8');
const TEMA = readFileSync(join(__dirname, '../src/renderer/tema.ts'), 'utf8');

/** Valor de `--fuente` dentro de un selector (`:root` o `:root:lang(xx)`). */
function pila(selector: string): string {
  const i = CSS.indexOf(`${selector} {`);
  expect(i, selector).toBeGreaterThanOrEqual(0);
  const bloque = CSS.slice(i, CSS.indexOf('\n}', i));
  return /--fuente:\s*([^;]+);/.exec(bloque)?.[1] ?? '';
}

describe('fuentes de los idiomas con otra escritura (solo las del sistema de Windows)', () => {
  it('la pila general trae respaldo para chino, japonés, coreano, devanagari y tailandés', () => {
    const p = pila(':root');
    for (const f of [
      'Microsoft YaHei',
      'Yu Gothic',
      'Malgun Gothic',
      'Nirmala UI',
      'Leelawadee UI',
    ]) {
      expect(p, f).toContain(`'${f}`);
    }
    expect(p.trim().endsWith('sans-serif')).toBe(true);
  });

  it('cada idioma con caracteres propios pone primero su fuente según <html lang>', () => {
    expect(pila(':root:lang(zh)')).toMatch(/Microsoft YaHei/);
    expect(pila(':root:lang(ja)')).toMatch(/Yu Gothic/);
    expect(pila(':root:lang(ko)')).toMatch(/Malgun Gothic/);
    expect(pila(':root:lang(hi)')).toMatch(/Nirmala UI/);
    expect(pila(':root:lang(th)')).toMatch(/Leelawadee UI/);
    // En chino no se mete antes la fuente japonesa (los caracteres Han saldrían con otro trazo).
    expect(pila(':root:lang(zh)')).not.toMatch(/Yu Gothic|Malgun/);
    expect(pila(':root:lang(ja)')).not.toMatch(/YaHei|Malgun/);
  });

  it('no descarga nada: sin @font-face ni url() de fuentes, y Naive usa la misma pila', () => {
    expect(CSS).not.toMatch(/@font-face/);
    expect(CSS).not.toMatch(/url\(\s*['"]?https?:/);
    expect(TEMA).toMatch(/const FUENTE = 'var\(--fuente\)'/);
  });

  it('los idiomas base son es, en, pt y fr; el resto es traducción automática', () => {
    expect([...IDIOMAS_BASE]).toEqual(['es', 'en', 'pt', 'fr']);
    expect(IDIOMAS.filter((i) => !esIdiomaBase(i.id))).toHaveLength(IDIOMAS.length - 4);
  });
});

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = join(__dirname, '../src/renderer');
const ENVOLTORIOS = ['Desplegable.vue', 'MenuDesplegable.vue'];

function vues(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return vues(p);
    return n.endsWith('.vue') ? [p] : [];
  });
}

describe('desplegables', () => {
  it('solo los envoltorios usan NSelect y NDropdown', () => {
    const fallos = vues(RAIZ)
      .filter((f) => !ENVOLTORIOS.includes(basename(f)))
      .filter((f) => /<(NSelect|n-select|NDropdown|n-dropdown)\b/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(RAIZ, f));
    expect(fallos).toEqual([]);
  });

  it('los envoltorios fijan bottom-start', () => {
    const base = join(RAIZ, 'componentes');
    const d = readFileSync(join(base, 'Desplegable.vue'), 'utf8');
    const m = readFileSync(join(base, 'MenuDesplegable.vue'), 'utf8');
    expect(d).toContain('placement="bottom-start"');
    expect(m).toContain('placement="bottom-start"');
    expect(m).toContain(':flip="false"');
  });
});

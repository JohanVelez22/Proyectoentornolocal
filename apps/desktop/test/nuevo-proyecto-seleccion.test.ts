import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const fuente = readFileSync(
  path.join(__dirname, '..', 'src', 'renderer', 'componentes', 'PasoTipoProyecto.vue'),
  'utf8',
);

describe('Nuevo proyecto: la selección es índigo, no verde (D54a, I13)', () => {
  it('el tipo elegido usa el acento y lleva una marca de verificación', () => {
    const activo = /\.tipo\.activo\s*\{([^}]*)\}/s.exec(fuente)?.[1] ?? '';
    expect(activo).toContain('var(--acento)');
    expect(activo).toMatch(/background:\s*rgba\(var\(--acento-rgb\),\s*0\.06\)/);
    expect(fuente).not.toContain('--texto-ok');
    expect(fuente).toMatch(/v-if="x\.id === tipo"[^>]*class="marca"/s);
  });
});

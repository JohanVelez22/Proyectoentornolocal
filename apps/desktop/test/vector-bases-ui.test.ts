import { describe, expect, it } from 'vitest';
import { basesConAviso, contarListas, elegibles } from '../src/renderer/utilidades/vectorBases';

describe('utilidades de pgvector en varias bases (D54b)', () => {
  it('separa las bases con datos reales que piden aviso adicional', () => {
    expect(
      basesConAviso([
        { base: 'a', estado: 'activada' },
        { base: 'b', estado: 'requiere-aviso' },
        { base: 'c', estado: 'error', motivo: 'otro' },
      ]),
    ).toEqual(['b']);
  });
  it('cuenta como listas las activadas y las que ya la tenían', () => {
    expect(
      contarListas([
        { base: 'a', estado: 'activada' },
        { base: 'b', estado: 'ya-estaba' },
        { base: 'c', estado: 'error' },
        { base: 'd', estado: 'requiere-aviso' },
      ]),
    ).toBe(2);
  });
  it('solo ofrece las bases que aún no tienen la extensión', () => {
    expect(
      elegibles([
        { base: 'a', activo: true },
        { base: 'b', activo: false },
      ]),
    ).toEqual(['b']);
  });
});

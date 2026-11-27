import { describe, expect, it } from 'vitest';
import { esNumeroVersion } from '../src/renderer/utilidades/version';

describe('esNumeroVersion', () => {
  it('reconoce números de versión', () => {
    expect(esNumeroVersion('8.3.1')).toBe(true);
    expect(esNumeroVersion('v2.1')).toBe(true);
  });
  it('rechaza textos y vacíos', () => {
    expect(esNumeroVersion('sin versión')).toBe(false);
    expect(esNumeroVersion('no instalado')).toBe(false);
    expect(esNumeroVersion(null)).toBe(false);
    expect(esNumeroVersion(undefined)).toBe(false);
  });
});

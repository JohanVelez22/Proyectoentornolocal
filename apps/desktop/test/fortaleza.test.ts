import { describe, expect, it } from 'vitest';
import { evaluarFortaleza } from '../src/renderer/utilidades/fortaleza';

describe('evaluarFortaleza (local, zxcvbn-ts)', () => {
  it('password puntúa 0 y avisa de que es muy común', () => {
    const r = evaluarFortaleza('password');
    expect(r.puntaje).toBe(0);
    expect(r.avisos).toContain('topTen');
  });

  it('una frase larga puntúa 3 o más', () => {
    expect(evaluarFortaleza('correcthorsebatterystaple').puntaje).toBeGreaterThanOrEqual(3);
    expect(evaluarFortaleza('Wolf-Dev-Cielo-Rio-92!').puntaje).toBeGreaterThanOrEqual(3);
  });

  it('vacía puntúa 0 sin avisos y no falla', () => {
    expect(evaluarFortaleza('')).toEqual({ puntaje: 0, avisos: [] });
  });

  it('una clave enorme no se atasca (se evalúa un tramo acotado)', () => {
    const t = Date.now();
    const r = evaluarFortaleza('ab9#'.repeat(5000));
    expect(Date.now() - t).toBeLessThan(2000);
    expect([0, 1, 2, 3, 4]).toContain(r.puntaje);
  });

  it('los avisos son códigos sin la clave escrita', () => {
    const r = evaluarFortaleza('qwerty123');
    for (const a of r.avisos) expect(a).not.toContain('qwerty');
  });
});

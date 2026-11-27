import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';
import { resumenPastilla } from '../src/renderer/utilidades/pastilla';

const base = { cargado: true, fallo: false, encendidos: 0, tuneles: 0, hayError: false };

describe('resumenPastilla', () => {
  it('mientras carga dice "Conectando…"', () => {
    expect(resumenPastilla({ ...base, cargado: false }).texto).toBe('Conectando con el núcleo…');
  });

  it('un servicio con error se indica también con texto y tono de alerta', () => {
    const r = resumenPastilla({ ...base, encendidos: 1, hayError: true });
    expect(r.texto).toContain('con errores');
    expect(r.tono).toBe('alerta');
  });

  it('sin errores no menciona errores; con servicios encendidos el tono es viva', () => {
    const r = resumenPastilla({ ...base, encendidos: 2, tuneles: 1 });
    expect(r.texto).not.toContain('errores');
    expect(r.tono).toBe('viva');
  });

  it('si la carga inicial falló lo dice en vez de quedarse cargando', () => {
    const r = resumenPastilla({ ...base, cargado: true, fallo: true });
    expect(r.texto).toBe('Sin conexión con el núcleo');
    expect(r.tono).toBe('alerta');
  });
  it('siempre hay un texto corto de 14 caracteres como máximo, en los cuatro idiomas (D54a)', () => {
    const casos = [
      { ...base, cargado: false },
      { ...base, fallo: true },
      base,
      { ...base, encendidos: 12 },
      { ...base, encendidos: 1 },
      { ...base, hayError: true, conError: 12 },
    ];
    for (const [id, d] of Object.entries(diccionarios)) {
      const g = d.resumenGlobal;
      const cortos = [
        g.cortoApagado,
        g.cortoCargando,
        g.cortoSinConexion,
        g.cortoEncendidos(12),
        g.cortoErrores(12),
        g.cortoEncendidos(1),
        g.cortoErrores(1),
      ];
      for (const c of cortos) expect(c.length, `${id}: ${c}`).toBeLessThanOrEqual(14);
    }
    for (const c of casos) expect(resumenPastilla(c).corto.length).toBeLessThanOrEqual(14);
  });

  it('el texto corto dice lo esencial: apagado, encendidos o con error', () => {
    expect(resumenPastilla(base).corto).toBe('Todo apagado');
    expect(resumenPastilla({ ...base, encendidos: 3 }).corto).toBe('3 encendidos');
    expect(resumenPastilla({ ...base, encendidos: 1 }).corto).toBe('1 encendido');
    expect(resumenPastilla({ ...base, encendidos: 3, hayError: true, conError: 1 }).corto).toBe(
      '1 con error',
    );
    expect(resumenPastilla({ ...base, cargado: false }).corto).toBe('Conectando…');
  });
});

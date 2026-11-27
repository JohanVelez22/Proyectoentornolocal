import { describe, expect, it } from 'vitest';
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
});

import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';
import { anchoVisual } from './ayudas-i18n';
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
  it('siempre hay un texto corto de 14 caracteres como máximo, en los 16 idiomas, medido en ancho visual (D54a)', () => {
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
      for (const c of cortos) expect(anchoVisual(c), `${id}: ${c}`).toBeLessThanOrEqual(14);
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

describe('pastilla con servicios en error (D54c)', () => {
  const php = { id: 'php-8.0', nombre: 'PHP 8.0', mensaje: 'El puerto 9080 está ocupado.' };
  const mysql = { id: 'mysql', nombre: 'MySQL' };

  it('con un solo error nombra el servicio y el title lleva el motivo y «Ir al servicio»', () => {
    const r = resumenPastilla({
      ...base,
      encendidos: 2,
      hayError: true,
      conError: 1,
      errores: [php],
    });
    expect(r.largo).toBe('PHP 8.0: error');
    expect(r.title).toContain('PHP 8.0: El puerto 9080 está ocupado.');
    expect(r.title).toContain('Ir al servicio');
    expect(r.title).not.toContain('Ver Servicios');
    expect(r.destinoId).toBe('php-8.0');
    expect(r.tono).toBe('alerta');
  });

  it('con varios errores dice cuántos y el title pide ver Servicios, sin plurales mal puestos', () => {
    const r = resumenPastilla({ ...base, hayError: true, conError: 2, errores: [php, mysql] });
    expect(r.largo).toBe('2 servicios con error');
    expect(r.title).toContain('Ver Servicios');
    expect(r.title).not.toContain('Ir al servicio');
    expect(r.destinoId).toBe('php-8.0');
  });

  it('en ancho estrecho se queda con «N con error» y no solo el punto', () => {
    const r = resumenPastilla({ ...base, hayError: true, conError: 2, errores: [php, mysql] });
    expect(r.corto).toBe('2 con errores');
  });

  it('el title suma los problemas de Inicio, con singular y plural', () => {
    const uno = resumenPastilla({ ...base, encendidos: 1, problemas: 1 });
    expect(uno.title).toContain('1 problema en Inicio');
    const tres = resumenPastilla({ ...base, encendidos: 1, problemas: 3 });
    expect(tres.title).toContain('3 problemas en Inicio');
    expect(resumenPastilla({ ...base, encendidos: 1 }).title).not.toContain('Inicio');
  });

  it('sin errores el texto largo es el corto y el title lleva a Servicios', () => {
    const r = resumenPastilla({ ...base, encendidos: 3 });
    expect(r.largo).toBe(r.corto);
    expect(r.title).toContain('Ver Servicios');
    expect(r.destinoId).toBeNull();
  });

  it('los textos nuevos existen en los 16 idiomas', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      const g = d.resumenGlobal;
      expect(g.errorServicio('PHP 8.0'), id).toContain('PHP 8.0');
      expect(g.variosErrores(3), id).toContain('3');
      expect(g.irAlServicio.length, id).toBeGreaterThan(2);
      expect(g.problemasInicio(1), id).toContain('1');
      expect(g.problemasInicio(5), id).toContain('5');
    }
  });
});

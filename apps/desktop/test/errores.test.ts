import { CODIGOS_ERROR, PARAMETROS_ERROR } from '@pel/core';
import { describe, expect, it } from 'vitest';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { mensajeDeError, traducirError } from '../src/renderer/utilidades/errores';

describe('traducirError', () => {
  it('traduce por código y rellena los parámetros, en español y en inglés', () => {
    const e = {
      message: 'El puerto 80 ya está asignado a PHP.',
      codigo: 'servicios.puerto_asignado',
      datos: { puerto: 80, otro: 'PHP' },
    };
    expect(traducirError(e, es)).toBe(
      es.errores.codigos['servicios.puerto_asignado']
        .replace('{puerto}', '80')
        .replace('{otro}', 'PHP'),
    );
    expect(traducirError(e, en)).toBe('Port 80 is already assigned to PHP.');
    expect(traducirError(e, en)).not.toMatch(/[áéíóúñ]/);
  });

  it('un código desconocido o ausente usa el mensaje en español de respaldo', () => {
    expect(traducirError({ message: 'Fallo claro', codigo: 'inventado.x' }, en)).toBe(
      'Fallo claro',
    );
    expect(traducirError({ message: 'Sin código' }, en)).toBe('Sin código');
    expect(traducirError({ message: 'x', codigo: 'tras-reemplazo' }, en)).toBe('x');
  });

  it('sin mensaje ni código usa el texto genérico del idioma', () => {
    expect(traducirError({ message: '' }, en)).toBe(en.errores.desconocido);
    expect(mensajeDeError('texto')).toBe('texto');
    expect(mensajeDeError(null)).toBeTypeOf('string');
  });

  it('un parámetro que falta deja la marca visible en vez de "undefined"', () => {
    const t = traducirError({ message: 'm', codigo: 'servicios.puerto_asignado', datos: {} }, en);
    expect(t).not.toContain('undefined');
  });

  it('todos los códigos se traducen sin dejar marcas sin resolver al darles sus parámetros', () => {
    for (const c of CODIGOS_ERROR) {
      const datos = Object.fromEntries(PARAMETROS_ERROR[c].map((k) => [k, 'v']));
      for (const t of [es, en]) {
        expect(traducirError({ message: 'm', codigo: c, datos }, t), c).not.toMatch(/\{\w+\}/);
      }
    }
  });
});

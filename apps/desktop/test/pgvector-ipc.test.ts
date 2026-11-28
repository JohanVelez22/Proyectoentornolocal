import { describe, expect, it } from 'vitest';
import { objetivoPostgres, pedidoVectorBases, pedidoVectorPlantilla } from '../src/main/validacion';

describe('validación de pgvector en varias bases (D54b)', () => {
  it('acepta nombres válidos, quita repetidos y no da por confirmado nada que no sea true', () => {
    expect(pedidoVectorBases({ bases: ['a', 'b', 'a'], confirmado: true })).toEqual({
      bases: ['a', 'b'],
      confirmado: true,
      datosRealesConfirmadas: [],
    });
    expect(pedidoVectorBases({ bases: ['a'], confirmado: 'true' }).confirmado).toBe(false);
    expect(pedidoVectorBases({ bases: ['a'] }).confirmado).toBe(false);
    expect(
      pedidoVectorBases({ bases: ['a'], confirmado: true, datosRealesConfirmadas: ['a'] })
        .datosRealesConfirmadas,
    ).toEqual(['a']);
  });

  it('rechaza nombres que no son identificadores de PostgreSQL, listas enormes y claves ajenas', () => {
    expect(() => pedidoVectorBases({ bases: ['A b'], confirmado: true })).toThrow();
    expect(() => pedidoVectorBases({ bases: ['a";--'], confirmado: true })).toThrow();
    expect(() => pedidoVectorBases({ bases: [1], confirmado: true })).toThrow();
    expect(() => pedidoVectorBases({ bases: 'a', confirmado: true })).toThrow();
    expect(() =>
      pedidoVectorBases({
        bases: Array.from({ length: 201 }, (_, i) => `b${i}`),
        confirmado: true,
      }),
    ).toThrow();
    expect(() => pedidoVectorBases({ bases: ['a'], confirmado: true, x: 1 })).toThrow();
    expect(() => pedidoVectorBases(null)).toThrow();
  });

  it('la plantilla pide activar booleano y solo conoce sus claves', () => {
    expect(pedidoVectorPlantilla({ activar: false, confirmado: true })).toEqual({
      activar: false,
      confirmado: true,
    });
    expect(pedidoVectorPlantilla({ activar: true }).confirmado).toBe(false);
    expect(() => pedidoVectorPlantilla({ activar: 1, confirmado: true })).toThrow();
    expect(() => pedidoVectorPlantilla({ activar: true, bases: [] })).toThrow();
  });

  it('solo PostgreSQL (o una de sus instancias) sirve para pgvector', () => {
    expect(objetivoPostgres('postgresql')).toBe('postgresql');
    expect(() => objetivoPostgres('mysql')).toThrow();
    expect(() => objetivoPostgres('mongodb')).toThrow();
  });
});

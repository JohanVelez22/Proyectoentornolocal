import { describe, expect, it } from 'vitest';
import type { VistaEnv } from '../src/shared/api';
import {
  armarPedido,
  contarPendientes,
  etiquetaCopia,
  exigeAceptarVersionado,
  nombreNuevoValido,
  valorDeFila,
} from '../src/renderer/utilidades/env';

const CENTINELA = 'centinela-secreta-d';
const fila = (o: Partial<VistaEnv['filas'][number]> = {}): VistaEnv['filas'][number] => ({
  clave: 'DB_PASSWORD',
  valorVisible: '••••ta-d',
  secreta: true,
  vacia: false,
  ...o,
});

describe('utilidades del gestor de .env', () => {
  it('una copia se muestra con su fecha', () => {
    expect(etiquetaCopia('env-tienda-20261124-153045-123-abcdef.respaldo')).toBe(
      '2026-11-24 15:30:45',
    );
    expect(etiquetaCopia('otra')).toBe('otra');
  });

  it('una variable nueva: nombre válido y que no exista', () => {
    const filas = [fila({ clave: 'APP_NAME', secreta: false })];
    expect(nombreNuevoValido('NUEVA', filas)).toBe(true);
    expect(nombreNuevoValido('APP_NAME', filas)).toBe(false);
    for (const malo of ['', '1A', 'con espacio', 'a-b', 'x'.repeat(200)]) {
      expect(nombreNuevoValido(malo, filas), malo).toBe(false);
    }
  });

  it('el pedido solo lleva lo que hay', () => {
    expect(armarPedido({}, [], [])).toEqual({});
    expect(armarPedido({ A: '1', B: null }, ['C'], ['redis'])).toEqual({
      cambios: { A: '1', B: null },
      desdeEjemplo: ['C'],
      bloques: ['redis'],
    });
  });

  it('cuenta lo pendiente', () => {
    expect(contarPendientes({})).toBe(0);
    expect(
      contarPendientes({ cambios: { A: '1' }, desdeEjemplo: ['B', 'C'], bloques: ['bd'] }),
    ).toBe(4);
  });

  it('git que sigue el .env o que no se pudo saber exige confirmación aparte', () => {
    const base = { existe: true, ignoraEnv: true };
    expect(exigeAceptarVersionado({ ...base, envVersionado: false })).toBe(false);
    expect(exigeAceptarVersionado({ ...base, envVersionado: true })).toBe(true);
    expect(exigeAceptarVersionado({ ...base, envVersionado: null })).toBe(true);
    expect(exigeAceptarVersionado(undefined)).toBe(false);
  });

  it('una secreta se pinta enmascarada hasta que se revela; lo escrito manda', () => {
    expect(valorDeFila(fila(), undefined, null)).toBe('••••ta-d');
    expect(valorDeFila(fila(), undefined, CENTINELA)).toBe(CENTINELA);
    expect(valorDeFila(fila(), 'nuevo', CENTINELA)).toBe('nuevo');
    expect(valorDeFila(fila(), null, CENTINELA)).toBe('');
    // Una variable normal nunca usa el valor revelado.
    expect(valorDeFila(fila({ secreta: false, valorVisible: 'x' }), undefined, 'y')).toBe('x');
  });
});

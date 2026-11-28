import { diccionarios } from '../src/renderer/i18n';
import { describe, expect, it } from 'vitest';
import {
  basesConAviso,
  claveMotivo,
  contarListas,
  elegibles,
} from '../src/renderer/utilidades/vectorBases';

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

  it('no ofrece las bases con nombre no válido', () => {
    expect(
      elegibles([
        { base: 'a', activo: false, valida: true },
        { base: 'Mi Base', activo: false, valida: false },
      ]),
    ).toEqual(['a']);
  });

  it('cada motivo del núcleo tiene su texto en los 16 idiomas (dependencias, sistema y nombre no válido incluidos)', () => {
    const motivos = [
      'sin-pgvector',
      'no-existe',
      'permiso',
      'conexion',
      'en-uso',
      'dependencias',
      'sistema',
      'nombre-no-valido',
      'otro',
    ] as const;
    for (const [id, d] of Object.entries(diccionarios)) {
      for (const m of motivos) {
        expect(d.bd.pgvector.motivos[claveMotivo(m)], `${id}/${m}`).toBeTruthy();
      }
      expect(d.bd.pgvector.truncado, id).toBeTruthy();
      expect(d.bd.pgvector.plantilla.noSePudo, id).toBeTruthy();
      for (const c of [
        'bd.vector_sin_bases',
        'bd.vector_demasiadas',
        'bd.vector_ocupado',
      ] as const) {
        expect(d.errores.codigos[c], `${id}/${c}`).toBeTruthy();
      }
    }
    expect(claveMotivo(undefined)).toBe('otro');
  });
});

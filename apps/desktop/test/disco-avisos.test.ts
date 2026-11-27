import { describe, expect, it } from 'vitest';
import type { UnidadDisco } from '../src/shared/api';
import { agruparAvisos } from '../src/renderer/utilidades/avisosInicio';
import {
  entradasDisco,
  nivelDisco,
  peorNivel,
  UMBRAL_DISCO_AVISO,
  UMBRAL_DISCO_CRITICO,
} from '../src/renderer/utilidades/disco';

const GB = 1024 ** 3;
const unidad = (ruta: string, libreGb: number, totalGb = 100): UnidadDisco => ({
  ruta,
  etiqueta: '',
  tipo: 'fijo',
  total: totalGb * GB,
  libre: libreGb * GB,
});

describe('nivelDisco (D54a)', () => {
  it('ámbar por debajo del 15 % libre y rojo por debajo del 5 %', () => {
    expect(UMBRAL_DISCO_AVISO).toBe(0.15);
    expect(UMBRAL_DISCO_CRITICO).toBe(0.05);
    expect(nivelDisco(50, 100)).toBe('ok');
    expect(nivelDisco(15, 100)).toBe('ok'); // justo el 15 %: todavía bien
    expect(nivelDisco(14.9, 100)).toBe('aviso');
    expect(nivelDisco(5, 100)).toBe('aviso'); // justo el 5 %: ámbar
    expect(nivelDisco(4.9, 100)).toBe('critico');
    expect(nivelDisco(0, 100)).toBe('critico');
  });

  it('sin total conocido no inventa una alarma', () => {
    expect(nivelDisco(0, 0)).toBe('ok');
    expect(nivelDisco(Number.NaN, 100)).toBe('ok');
  });
});

describe('entradasDisco (D54a)', () => {
  const unidades = [unidad('C:\\', 10), unidad('D:\\', 60)];

  it('si la carpeta de datos está en C:, una sola entrada', () => {
    const r = entradasDisco({
      unidades,
      carpetaDatos: 'C:\\Users\\x\\AppData\\Local\\WolfCoreDev',
      discoDatos: null,
    });
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ rol: 'ambos', unidad: 'C:', nivel: 'aviso' });
  });

  it('si los datos están en otra unidad, dos entradas (sistema y datos)', () => {
    const r = entradasDisco({ unidades, carpetaDatos: 'd:\\WolfCore', discoDatos: null });
    expect(r.map((e) => [e.rol, e.unidad, e.nivel])).toEqual([
      ['sistema', 'C:', 'aviso'],
      ['datos', 'D:', 'ok'],
    ]);
  });

  it('usa la muestra de rendimiento si la unidad de datos no está en la lista', () => {
    const r = entradasDisco({
      unidades: [unidad('C:\\', 50)],
      carpetaDatos: 'E:\\Datos',
      discoDatos: { usado: 98 * GB, libre: 2 * GB },
    });
    expect(r.find((e) => e.rol === 'datos')).toMatchObject({ unidad: 'E:', nivel: 'critico' });
  });

  it('sin unidades ni muestra no devuelve nada, y peorNivel toma el más grave', () => {
    expect(entradasDisco({ unidades: [], carpetaDatos: null, discoDatos: null })).toEqual([]);
    const r = entradasDisco({
      unidades: [unidad('C:\\', 3), unidad('D:\\', 10)],
      carpetaDatos: 'D:\\x',
      discoDatos: null,
    });
    expect(peorNivel(r)).toBe('critico');
    expect(peorNivel([])).toBe('ok');
  });
});

describe('agruparAvisos (D54a)', () => {
  const cinco = ['a', 'b', 'c', 'd', 'e'];

  it('plegado enseña los dos primeros y dice cuántos quedan', () => {
    const g = agruparAvisos(cinco, false);
    expect(g.visibles).toEqual(['a', 'b']);
    expect(g).toMatchObject({ ocultos: 3, total: 5, plegable: true });
  });

  it('desplegado enseña todos', () => {
    const g = agruparAvisos(cinco, true);
    expect(g.visibles).toEqual(cinco);
    expect(g.ocultos).toBe(0);
  });

  it('con dos o menos no hay nada que plegar', () => {
    expect(agruparAvisos(['a', 'b'], false)).toMatchObject({ plegable: false, ocultos: 0 });
    expect(agruparAvisos([], false)).toMatchObject({ visibles: [], total: 0, plegable: false });
  });
});

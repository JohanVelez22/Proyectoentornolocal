import { describe, expect, it } from 'vitest';
import type { UnidadDisco } from '../src/shared/api';
import { agruparAvisos } from '../src/renderer/utilidades/avisosInicio';
import {
  entradasDisco,
  nivelDisco,
  peorNivel,
  porcentajeDe,
  UMBRAL_DISCO_AVISO,
  UMBRAL_DISCO_AVISO_BYTES,
  UMBRAL_DISCO_CRITICO,
  UMBRAL_DISCO_CRITICO_BYTES,
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
  const g = (n: number): number => n * GB;
  it('ámbar con menos del 15 % Y menos de 30 GB; rojo con menos del 5 % o menos de 5 GB', () => {
    expect(UMBRAL_DISCO_AVISO).toBe(0.15);
    expect(UMBRAL_DISCO_CRITICO).toBe(0.05);
    expect(UMBRAL_DISCO_AVISO_BYTES).toBe(g(30));
    expect(UMBRAL_DISCO_CRITICO_BYTES).toBe(g(5));
    // Disco pequeño (100 GB): manda el porcentaje, y 30 GB no se alcanza nunca antes del 15 %.
    expect(nivelDisco(g(50), g(100))).toBe('ok');
    expect(nivelDisco(g(15), g(100))).toBe('ok'); // justo el 15 %: todavía bien
    expect(nivelDisco(g(14.9), g(100))).toBe('aviso');
    expect(nivelDisco(g(5), g(100))).toBe('aviso'); // justo el 5 % y los 5 GB: ámbar
    expect(nivelDisco(g(4.9), g(100))).toBe('critico');
    expect(nivelDisco(0, g(100))).toBe('critico');
  });

  it('en un disco grande, el porcentaje solo no alarma: hacen falta también los GB', () => {
    // 1 TB con 100 GB libres (10 %): bajo el 15 % pero muy por encima de 30 GB: bien.
    expect(nivelDisco(g(100), g(1000))).toBe('ok');
    // 1 TB con 29 GB (2,9 %): ámbar solo si baja de 15 % Y 30 GB, pero el 2,9 % ya es rojo.
    expect(nivelDisco(g(29), g(1000))).toBe('critico');
    // 400 GB con 31 GB libres (7,75 %): bajo el 15 % pero sobre 30 GB: bien.
    expect(nivelDisco(g(31), g(400))).toBe('ok');
    expect(nivelDisco(g(29), g(400))).toBe('aviso');
    // Un disco de 60 GB con 4 GB (6,7 %) es rojo por los GB aunque pase del 5 %.
    expect(nivelDisco(g(4), g(60))).toBe('critico');
    // 4 TB con 4,9 GB (0,1 %): rojo por las dos vías.
    expect(nivelDisco(g(4.9), g(4000))).toBe('critico');
  });

  it('sin total conocido no inventa una alarma', () => {
    expect(nivelDisco(0, 0)).toBe('ok');
    expect(nivelDisco(Number.NaN, 100)).toBe('ok');
  });

  it('el porcentaje se redondea hacia abajo y coincide con el color en el límite', () => {
    expect(porcentajeDe(0.149)).toBe(14);
    expect(porcentajeDe(0.15)).toBe(15);
    expect(porcentajeDe(0.29)).toBe(29);
    expect(porcentajeDe(0.999)).toBe(99);
    expect(porcentajeDe(1)).toBe(100);
    // 14,9 % libre en un disco de 100 GB: se ve «14 %» y es ámbar.
    expect(porcentajeDe(14.9 / 100)).toBe(14);
    expect(nivelDisco(g(14.9), g(100))).toBe('aviso');
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

  it('sin letra de unidad pero con la muestra de rendimiento, crea la entrada con la muestra', () => {
    const r = entradasDisco({
      unidades: [],
      carpetaDatos: null,
      discoDatos: { usado: 60 * GB, libre: 40 * GB },
    });
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ rol: 'datos', unidad: '', nivel: 'ok' });
    expect(r[0]!.fraccionLibre).toBeCloseTo(0.4);
    // Si coincide con la unidad del sistema, no se repite.
    expect(
      entradasDisco({
        unidades: [unidad('C:\\', 40)],
        carpetaDatos: null,
        discoDatos: { usado: 60 * GB, libre: 40 * GB },
      }).map((e) => e.rol),
    ).toEqual(['sistema']);
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

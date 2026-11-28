import { describe, expect, it } from 'vitest';
import {
  evaluarDisco,
  limiteTemperatura,
  UMBRALES_DISCO,
  type EntradaVeredicto,
} from '../src/discos/veredicto';
import type { ContadoresDisco } from '../src/discos/tipos';

const contadores = (c: Partial<ContadoresDisco> = {}): ContadoresDisco => ({
  temperaturaC: null,
  temperaturaMaxC: null,
  desgastePct: null,
  erroresLecturaCorregidos: null,
  erroresLecturaNoCorregidos: null,
  erroresEscrituraCorregidos: null,
  erroresEscrituraNoCorregidos: null,
  horasEncendido: null,
  ...c,
});

const base = (e: Partial<EntradaVeredicto> = {}): EntradaVeredicto => ({
  salud: 'healthy',
  operacional: ['OK'],
  medio: 'ssd',
  bus: 'sata',
  contadores: null,
  prediccionFallo: null,
  ...e,
});

describe('umbrales', () => {
  it('son los documentados', () => {
    expect(UMBRALES_DISCO.desgasteAtencion).toBe(80);
    expect(UMBRALES_DISCO.temperaturaSsdAtencion).toBe(60);
    expect(UMBRALES_DISCO.temperaturaHddAtencion).toBe(50);
  });
});

describe('evaluarDisco', () => {
  it('sin ningún dato: no disponible', () => {
    expect(evaluarDisco(base({ salud: null, operacional: [] })).veredicto).toBe('no_disponible');
  });

  it('Healthy sin contadores (USB): bien, sin inventar nada', () => {
    expect(evaluarDisco(base({ bus: 'usb' }))).toEqual({ veredicto: 'bien', motivos: [] });
  });

  it('crítico: Warning, Unhealthy, fallo operacional, errores sin corregir o predicción', () => {
    expect(evaluarDisco(base({ salud: 'warning' }))).toEqual({
      veredicto: 'critico',
      motivos: ['estado_warning'],
    });
    expect(evaluarDisco(base({ salud: 'unhealthy' })).motivos).toContain('estado_unhealthy');
    expect(evaluarDisco(base({ operacional: ['Lost Communication'] })).veredicto).toBe('critico');
    expect(evaluarDisco(base({ operacional: ['Predictive Failure'] })).veredicto).toBe('critico');
    expect(
      evaluarDisco(base({ contadores: contadores({ erroresLecturaNoCorregidos: 1 }) })).motivos,
    ).toEqual(['errores_sin_corregir']);
    expect(
      evaluarDisco(base({ contadores: contadores({ erroresEscrituraNoCorregidos: 3 }) })).veredicto,
    ).toBe('critico');
    expect(evaluarDisco(base({ prediccionFallo: true })).motivos).toEqual(['prediccion_fallo']);
  });

  it('crítico manda sobre atención', () => {
    const r = evaluarDisco(base({ salud: 'warning', contadores: contadores({ desgastePct: 95 }) }));
    expect(r.veredicto).toBe('critico');
  });

  it('cero errores sin corregir no es crítico', () => {
    const r = evaluarDisco(base({ contadores: contadores({ erroresLecturaNoCorregidos: 0 }) }));
    expect(r.veredicto).toBe('bien');
  });

  it('atención por desgaste desde el 80 %', () => {
    expect(evaluarDisco(base({ contadores: contadores({ desgastePct: 79 }) })).veredicto).toBe(
      'bien',
    );
    expect(evaluarDisco(base({ contadores: contadores({ desgastePct: 80 }) }))).toEqual({
      veredicto: 'atencion',
      motivos: ['desgaste'],
    });
  });

  it('temperatura por tipo cuando el fabricante no da máximo', () => {
    const t = (medio: 'ssd' | 'hdd', bus: 'sata' | 'nvme', c: number) =>
      evaluarDisco(base({ medio, bus, contadores: contadores({ temperaturaC: c }) })).veredicto;
    expect(t('ssd', 'sata', 59)).toBe('bien');
    expect(t('ssd', 'sata', 60)).toBe('atencion');
    expect(t('ssd', 'nvme', 60)).toBe('atencion');
    expect(t('hdd', 'sata', 49)).toBe('bien');
    expect(t('hdd', 'sata', 50)).toBe('atencion');
  });

  it('con TemperatureMax del fabricante, solo si lo supera (estricto)', () => {
    const e = (c: number) =>
      evaluarDisco(base({ contadores: contadores({ temperaturaC: c, temperaturaMaxC: 70 }) }));
    expect(e(65).veredicto).toBe('bien');
    expect(e(70).veredicto).toBe('bien');
    expect(e(71).motivos).toEqual(['temperatura']);
  });

  it('un 0 de temperatura no es creíble y no cuenta', () => {
    const r = evaluarDisco(base({ contadores: contadores({ temperaturaC: 0 }) }));
    expect(r.veredicto).toBe('bien');
  });

  it('sin tipo conocido y sin máximo no se adivina un umbral', () => {
    expect(limiteTemperatura({ medio: null, bus: 'usb', contadores: contadores() })).toBeNull();
    const r = evaluarDisco(
      base({ medio: null, bus: 'usb', contadores: contadores({ temperaturaC: 90 }) }),
    );
    expect(r.veredicto).toBe('bien');
  });

  it('errores corregidos: atención solo si SUBEN respecto de la lectura anterior', () => {
    const c = contadores({ erroresLecturaCorregidos: 12 });
    expect(evaluarDisco(base({ contadores: c }), null).veredicto).toBe('bien');
    expect(evaluarDisco(base({ contadores: c }), 12).veredicto).toBe('bien');
    expect(evaluarDisco(base({ contadores: c }), 5)).toEqual({
      veredicto: 'atencion',
      motivos: ['errores_corregidos_suben'],
    });
  });

  it('acumula los motivos de atención', () => {
    const r = evaluarDisco(base({ contadores: contadores({ desgastePct: 85, temperaturaC: 65 }) }));
    expect(r.motivos).toEqual(['desgaste', 'temperatura']);
  });
});

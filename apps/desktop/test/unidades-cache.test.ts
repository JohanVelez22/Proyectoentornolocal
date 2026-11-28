import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiEntorno } from '../src/shared/api';
import { CADUCIDAD_UNIDADES_MS, useMetricas } from '../src/renderer/stores/metricas';

const fuente = (...r: string[]): string =>
  readFileSync(join(__dirname, '..', 'src', 'renderer', ...r), 'utf8');

const unidad = { ruta: 'C:/', etiqueta: 'C', tipo: 'fijo' as const, libre: 10, total: 100 };

function entornoFalso() {
  const unidades = vi.fn(async () => [unidad]);
  const carpetaDatos = vi.fn(async () => 'C:/Datos');
  const api = { discoUso: { unidades }, carpetaDatos };
  vi.stubGlobal('window', { entorno: api as unknown as ApiEntorno });
  return { unidades, carpetaDatos };
}

describe('caché de unidades de disco en el almacén de métricas (D54d)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('dos consultas a la vez comparten una sola lectura', async () => {
    const f = entornoFalso();
    const m = useMetricas();
    await Promise.all([m.cargarUnidades(), m.cargarUnidades()]);
    expect(f.unidades).toHaveBeenCalledTimes(1);
    expect(f.carpetaDatos).toHaveBeenCalledTimes(1);
    expect(m.unidades).toEqual([unidad]);
    expect(m.carpetaDatos).toBe('C:/Datos');
    expect(m.unidadesLeidas).toBe(true);
  });

  it('mientras no caduque, un nuevo montaje no vuelve a consultar', async () => {
    const f = entornoFalso();
    const m = useMetricas();
    await m.cargarUnidades();
    vi.advanceTimersByTime(CADUCIDAD_UNIDADES_MS - 1);
    await m.cargarUnidades();
    expect(f.unidades).toHaveBeenCalledTimes(1);
  });

  it('al caducar se vuelve a leer, y forzar lo salta (tras limpiar versiones)', async () => {
    const f = entornoFalso();
    const m = useMetricas();
    await m.cargarUnidades();
    vi.advanceTimersByTime(CADUCIDAD_UNIDADES_MS);
    await m.cargarUnidades();
    expect(f.unidades).toHaveBeenCalledTimes(2);
    await m.cargarUnidades({ forzar: true });
    expect(f.unidades).toHaveBeenCalledTimes(3);
  });

  it('si una lectura falla, la otra vale y no se queda cacheado el fallo', async () => {
    const f = entornoFalso();
    f.unidades.mockRejectedValueOnce(new Error('sin permiso'));
    const m = useMetricas();
    await m.cargarUnidades();
    expect(m.unidades).toEqual([]);
    expect(m.carpetaDatos).toBe('C:/Datos');
    expect(m.unidadesLeidas).toBe(true);
    // Un fallo no se da por bueno: la siguiente consulta lo reintenta.
    await m.cargarUnidades();
    expect(f.unidades).toHaveBeenCalledTimes(2);
    expect(m.unidades).toEqual([unidad]);
  });

  it('TarjetaDisco ya no tiene su propia caché: lee del almacén', () => {
    const t = fuente('componentes', 'TarjetaDisco.vue');
    expect(t).toContain('cargarUnidades');
    expect(t).not.toContain('discoUso.unidades');
    expect(t).not.toContain('Promise.allSettled');
  });
});

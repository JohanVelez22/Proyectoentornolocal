import { describe, expect, it, vi } from 'vitest';
import {
  crearOrdenes,
  ordenDeArgs,
  type NucleoOrdenes,
  type ResultadoOrden,
} from '../src/main/ordenes';

describe('ordenDeArgs', () => {
  it('solo reconoce --iniciar-todo y --detener-todo, exactos', () => {
    expect(ordenDeArgs(['WolfCore Dev.exe', '--iniciar-todo'])).toBe('iniciar-todo');
    expect(ordenDeArgs(['x', '--allow-file-access', '--detener-todo'])).toBe('detener-todo');
    expect(ordenDeArgs(['x'])).toBeNull();
    for (const malo of ['--iniciar-todo=1', '--INICIAR-TODO', 'iniciar-todo', '--abrir-tunel']) {
      expect(ordenDeArgs(['x', malo]), malo).toBeNull();
    }
    expect(ordenDeArgs(['x', 'constructor', '__proto__', 'toString'])).toBeNull();
  });
});

describe('crearOrdenes', () => {
  const nucleoFalso = (orden: string[], falla = false): NucleoOrdenes => ({
    iniciarTodo: async () => {
      orden.push('iniciar');
      if (falla) throw new Error('No se pudo iniciar todo. Falló:\n- MySQL 8.4: puerto');
    },
    detenerTodo: async () => {
      orden.push('detener');
    },
  });

  it('con el núcleo listo ejecuta el mismo flujo que la bandeja y registra el resultado', async () => {
    const orden: string[] = [];
    const res: ResultadoOrden[] = [];
    const n = nucleoFalso(orden);
    const o = crearOrdenes({ nucleo: () => n, registrar: (r) => res.push(r) });
    await o.ejecutar('iniciar-todo');
    await o.ejecutar('detener-todo');
    expect(orden).toEqual(['iniciar', 'detener']);
    expect(res.map((r) => [r.orden, r.ok])).toEqual([
      ['iniciar-todo', true],
      ['detener-todo', true],
    ]);
  });

  it('antes de que cargue el núcleo espera y la ejecuta al quedar listo', async () => {
    const orden: string[] = [];
    let n: NucleoOrdenes | null = null;
    const o = crearOrdenes({ nucleo: () => n, registrar: () => undefined });
    await o.ejecutar('iniciar-todo');
    expect(orden).toEqual([]);
    n = nucleoFalso(orden);
    await o.listo();
    expect(orden).toEqual(['iniciar']);
    await o.listo();
    expect(orden).toEqual(['iniciar']);
  });

  it('un fallo queda registrado con el detalle, sin lanzar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res: ResultadoOrden[] = [];
    const n = nucleoFalso([], true);
    const o = crearOrdenes({ nucleo: () => n, registrar: (r) => res.push(r) });
    await expect(o.ejecutar('iniciar-todo')).resolves.toBeUndefined();
    expect(res[0]).toMatchObject({ orden: 'iniciar-todo', ok: false });
    expect(res[0]!.error).toContain('MySQL 8.4');
  });
});

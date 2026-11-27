import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
import {
  RutasElegidas,
  destinoLimpieza,
  idPapeleraVersion,
  seleccionLimpieza,
} from '../src/main/validacion';
import { RUTAS_IPC } from '../src/shared/api';

describe('limpieza de versiones (D30): validación y rutas IPC', () => {
  it('las rutas están en la lista blanca', () => {
    expect(RUTAS_IPC).toContain('limpiezaVersiones.sinUso');
    expect(RUTAS_IPC).toContain('limpiezaVersiones.limpiar');
    expect(RUTAS_IPC).toContain('limpiezaVersiones.papelera');
    expect(RUTAS_IPC).toContain('limpiezaVersiones.recuperar');
  });

  it('incluirContenidoAjeno solo admite un booleano y el id de la papelera no admite rutas', () => {
    expect(
      seleccionLimpieza([{ servicio: 'node', version: '20.1.0', incluirContenidoAjeno: true }]),
    ).toEqual([{ servicio: 'node', version: '20.1.0', incluirContenidoAjeno: true }]);
    expect(() =>
      seleccionLimpieza([{ servicio: 'node', version: '20.1.0', incluirContenidoAjeno: 'si' }]),
    ).toThrow();
    expect(idPapeleraVersion('node__20.1.0__20261125-120000-abc123')).toBe(
      'node__20.1.0__20261125-120000-abc123',
    );
    for (const mal of ['../x', 'node__..__20261125-120000-abc123', 'a/b', '', 5, null]) {
      expect(() => idPapeleraVersion(mal)).toThrow();
    }
  });

  it('la selección solo admite servicios del catálogo y carpetas de versión (nunca rutas)', () => {
    expect(seleccionLimpieza([{ servicio: 'node', version: '20.1.0' }])).toEqual([
      { servicio: 'node', version: '20.1.0' },
    ]);
    for (const mala of [
      [],
      'node',
      [{ servicio: 'node', version: '..' }],
      [{ servicio: 'node', version: '..\\data' }],
      [{ servicio: 'node', version: 'a/b' }],
      [{ servicio: 'node', version: 'C:\\x' }],
      [{ servicio: '../data', version: '1.0.0' }],
      [{ servicio: 'node' }],
      Array.from({ length: 201 }, () => ({ servicio: 'node', version: '1.0.0' })),
    ]) {
      expect(() => seleccionLimpieza(mala)).toThrow();
    }
    expect(destinoLimpieza('papelera')).toBe('papelera');
    expect(destinoLimpieza('definitivo')).toBe('definitivo');
    expect(() => destinoLimpieza('data')).toThrow();
  });

  function montar() {
    const canales = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
    const ipcMain: IpcMainLike = { handle: (canal, fn) => void canales.set(canal, fn as never) };
    const nucleo = {
      eventos: { on: () => () => undefined },
      aislado: false,
      rutas: { base: 'C:\\prueba\\datos' },
      versionesSinUso: vi.fn(async () => []),
      versionesEnPapelera: vi.fn(async () => []),
      recuperarVersion: vi.fn(async () => undefined),
      limpiarVersiones: vi.fn(async () => ({
        liberados: 0,
        enPapelera: 0,
        fallidos: [],
        pendientes: 0,
        instantanea: '',
      })),
    };
    const sistema = {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
      abrirGrabadora: vi.fn(),
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(),
      guardarArchivo: vi.fn(),
      elegirArchivos: vi.fn(),
    };
    const ventana: VentanaLike = {
      isDestroyed: () => false,
      webContents: { send: () => undefined },
    };
    registrarIpc(
      nucleo as unknown as NucleoIpc,
      ipcMain,
      ventana,
      sistema,
      () => true,
      new RutasElegidas(),
      {},
    );
    const llamar = (ruta: string, ...a: unknown[]) => canales.get(`entorno:${ruta}`)!({}, ...a);
    return { nucleo, llamar };
  }

  it('la vista previa no borra y limpiar exige confirmado: true', async () => {
    const { nucleo, llamar } = montar();
    expect(await llamar('limpiezaVersiones.sinUso')).toEqual({ ok: true, valor: [] });
    const sel = [{ servicio: 'node', version: '20.1.0' }];
    for (const confirmado of [false, undefined, 'true', 1]) {
      const r = (await llamar('limpiezaVersiones.limpiar', sel, confirmado, 'papelera')) as {
        ok: boolean;
      };
      expect(r.ok).toBe(false);
    }
    expect(nucleo.limpiarVersiones).not.toHaveBeenCalled();
    const ok = (await llamar('limpiezaVersiones.limpiar', sel, true, 'definitivo')) as {
      ok: boolean;
    };
    expect(ok.ok).toBe(true);
    expect(nucleo.limpiarVersiones).toHaveBeenCalledWith(sel, true, 'definitivo');
    // Una selección con una ruta libre ni llega al núcleo.
    nucleo.limpiarVersiones.mockClear();
    const mala = (await llamar(
      'limpiezaVersiones.limpiar',
      [{ servicio: 'node', version: '..\\..\\data' }],
      true,
      'papelera',
    )) as { ok: boolean };
    expect(mala.ok).toBe(false);
    expect(nucleo.limpiarVersiones).not.toHaveBeenCalled();
  });

  it('recuperar valida el id antes de llegar al núcleo', async () => {
    const { nucleo, llamar } = montar();
    expect(await llamar('limpiezaVersiones.papelera')).toEqual({ ok: true, valor: [] });
    const mal = (await llamar('limpiezaVersiones.recuperar', '../data')) as { ok: boolean };
    expect(mal.ok).toBe(false);
    expect(nucleo.recuperarVersion).not.toHaveBeenCalled();
    const id = 'node__20.1.0__20261125-120000-abc123';
    expect(((await llamar('limpiezaVersiones.recuperar', id)) as { ok: boolean }).ok).toBe(true);
    expect(nucleo.recuperarVersion).toHaveBeenCalledWith(id);
  });
});

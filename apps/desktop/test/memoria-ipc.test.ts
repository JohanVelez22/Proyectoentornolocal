import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';

// Rutas `memoria.*` (D36): el modo y la confirmación se validan en la frontera, y la lista de
// acciones que llega del renderer es acotada. Con un núcleo falso: ningún proceso real se toca.

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function preparar() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = {
    handle: (canal, fn) => void canales.set(canal, fn as Manejador),
  };
  const nucleo = {
    eventos: { on: () => () => undefined },
    planMemoria: vi.fn(async (modo: string) => ({
      modo,
      acciones: [],
      estimado: 0,
      sinDatosActividad: false,
    })),
    aplicarMemoria: vi.fn(async () => ({ liberado: 0, resultados: [] })),
  } as unknown as NucleoIpc;
  const ventana: VentanaLike = {
    isDestroyed: () => false,
    webContents: { send: () => undefined },
  };
  registrarIpc(
    nucleo,
    ipcMain,
    ventana,
    {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(async () => '1'),
      guardarArchivo: vi.fn(async () => null),
      elegirArchivos: vi.fn(async () => []),
    },
    undefined,
    undefined,
    {},
  );
  const llamar = (ruta: string, ...a: unknown[]): unknown =>
    canales.get(`entorno:${ruta}`)!({}, ...a);
  return { llamar, nucleo };
}

describe('rutas memoria.*', () => {
  it('plan solo acepta liviano, moderado o profundo', async () => {
    const t = preparar();
    for (const modo of ['liviano', 'moderado', 'profundo']) {
      expect(await t.llamar('memoria.plan', modo)).toMatchObject({ ok: true });
    }
    for (const malo of ['extremo', '', null, 3, { modo: 'liviano' }, undefined]) {
      expect(await t.llamar('memoria.plan', malo)).toMatchObject({ ok: false });
    }
    expect(t.nucleo.planMemoria).toHaveBeenCalledTimes(3);
  });

  it('aplicar exige confirmación exactamente true y no toca el núcleo sin ella', async () => {
    const t = preparar();
    for (const malo of [undefined, false, 'true', 1, null, {}]) {
      expect(await t.llamar('memoria.aplicar', ['cache-app:sesion'], malo)).toMatchObject({
        ok: false,
      });
    }
    expect(t.nucleo.aplicarMemoria).not.toHaveBeenCalled();
    expect(await t.llamar('memoria.aplicar', ['cache-app:sesion'], true)).toMatchObject({
      ok: true,
    });
    expect(t.nucleo.aplicarMemoria).toHaveBeenCalledWith(['cache-app:sesion'], true);
  });

  it('aplicar rechaza listas vacías, enormes o con elementos que no son texto', async () => {
    const t = preparar();
    for (const malo of [
      [],
      'cache-app:sesion',
      null,
      [1],
      [''],
      ['x'.repeat(101)],
      Array.from({ length: 61 }, (_, i) => `cerrar-programa:${i}`),
    ]) {
      expect(await t.llamar('memoria.aplicar', malo, true)).toMatchObject({ ok: false });
    }
    expect(t.nucleo.aplicarMemoria).not.toHaveBeenCalled();
  });

  it('no hay ruta que reciba un pid, un nombre de proceso ni una ruta de archivo', () => {
    const t = preparar();
    // Las únicas rutas de memoria son plan y aplicar (ids de acción del último plan).
    expect(() => t.llamar('memoria.cerrar', 100)).toThrow();
    expect(() => t.llamar('memoria.matar', 100)).toThrow();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';

// Rutas `memoria.*` (D54b): el nivel y la confirmación se validan en la frontera. Con un núcleo
// falso: ningún proceso real se toca ni se pide ningún UAC.

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function preparar() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = {
    handle: (canal, fn) => void canales.set(canal, fn as Manejador),
  };
  const nucleo = {
    eventos: { on: () => () => undefined },
    estimarMemoria: vi.fn(async () => ({ sistema: null, listaEspera: null, niveles: {} })),
    liberarMemoria: vi.fn(async (nivel: string) => ({ nivel, liberado: 0 })),
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
      abrirGrabadora: vi.fn(),
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
  it('estimar solo lee y no recibe argumentos', async () => {
    const t = preparar();
    expect(await t.llamar('memoria.estimar')).toMatchObject({ ok: true });
    expect(t.nucleo.estimarMemoria).toHaveBeenCalledTimes(1);
    expect(t.nucleo.liberarMemoria).not.toHaveBeenCalled();
  });

  it('liberar solo acepta liviano, moderado o profundo', async () => {
    const t = preparar();
    for (const nivel of ['liviano', 'moderado']) {
      expect(await t.llamar('memoria.liberar', nivel)).toMatchObject({ ok: true });
    }
    expect(await t.llamar('memoria.liberar', 'profundo', true)).toMatchObject({ ok: true });
    for (const malo of ['extremo', '', null, 3, { nivel: 'liviano' }, undefined]) {
      expect(await t.llamar('memoria.liberar', malo, true)).toMatchObject({ ok: false });
    }
    expect(t.nucleo.liberarMemoria).toHaveBeenCalledTimes(3);
  });

  it('profundo exige la confirmación exactamente true y no toca el núcleo sin ella (nunca se pide el UAC)', async () => {
    const t = preparar();
    for (const malo of [undefined, false, 'true', 1, null, {}]) {
      expect(await t.llamar('memoria.liberar', 'profundo', malo)).toMatchObject({ ok: false });
    }
    expect(t.nucleo.liberarMemoria).not.toHaveBeenCalled();
    expect(await t.llamar('memoria.liberar', 'profundo', true)).toMatchObject({ ok: true });
    expect(t.nucleo.liberarMemoria).toHaveBeenCalledWith('profundo', true);
  });

  it('liviano y moderado no piden administrador: pasan false si no hay confirmación', async () => {
    const t = preparar();
    await t.llamar('memoria.liberar', 'liviano');
    await t.llamar('memoria.liberar', 'moderado', 'raro');
    expect(t.nucleo.liberarMemoria).toHaveBeenNthCalledWith(1, 'liviano', false);
    expect(t.nucleo.liberarMemoria).toHaveBeenNthCalledWith(2, 'moderado', false);
  });

  it('no hay ruta que reciba un pid, un nombre de proceso ni una ruta de archivo', () => {
    const t = preparar();
    // Las únicas rutas de memoria son estimar y liberar (niveles cerrados).
    expect(() => t.llamar('memoria.cerrar', 100)).toThrow();
    expect(() => t.llamar('memoria.matar', 100)).toThrow();
    expect(() => t.llamar('memoria.plan', 'liviano')).toThrow();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';

// Rutas `herramientas.equipo` e `ia.compatibilidad` (D55): validan en la frontera y solo leen.
// Con un núcleo falso: no se toca el hardware ni la red.

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function preparar() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = {
    handle: (canal, fn) => void canales.set(canal, fn as Manejador),
  };
  const nucleo = {
    eventos: { on: () => () => undefined },
    infoEquipo: vi.fn(async () => ({ ram: { totalBytes: 1, libreBytes: null } })),
    compatibilidadModelos: vi.fn(async () => ({ sugerencia: {}, modelos: [] })),
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

describe('herramientas.equipo', () => {
  it('sin argumento usa la caché; «forzar» debe ser booleano', async () => {
    const t = preparar();
    expect(await t.llamar('herramientas.equipo')).toMatchObject({ ok: true });
    expect(t.nucleo.infoEquipo).toHaveBeenLastCalledWith(false);
    expect(await t.llamar('herramientas.equipo', true)).toMatchObject({ ok: true });
    expect(t.nucleo.infoEquipo).toHaveBeenLastCalledWith(true);
    expect(await t.llamar('herramientas.equipo', 'si')).toMatchObject({ ok: false });
    expect(await t.llamar('herramientas.equipo', { x: 1 })).toMatchObject({ ok: false });
  });
});

describe('ia.compatibilidad', () => {
  it('acepta de 1 a 16 nombres de modelo válidos', async () => {
    const t = preparar();
    expect(await t.llamar('ia.compatibilidad', ['llama3.2', 'qwen2.5-coder:7b'])).toMatchObject({
      ok: true,
    });
    expect(t.nucleo.compatibilidadModelos).toHaveBeenLastCalledWith([
      'llama3.2',
      'qwen2.5-coder:7b',
    ]);
  });

  it('rechaza lo que no es una lista de nombres válidos', async () => {
    const t = preparar();
    const largo = Array.from({ length: 17 }, () => 'llama3.2');
    for (const malo of [
      undefined,
      null,
      'llama3.2',
      [],
      largo,
      ['llama3.2', 3],
      ['../x'],
      ['con espacio'],
      [''],
    ]) {
      expect(await t.llamar('ia.compatibilidad', malo), JSON.stringify(malo)).toMatchObject({
        ok: false,
      });
    }
  });
});

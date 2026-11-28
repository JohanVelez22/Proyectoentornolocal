import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';

// Rutas de la salud de los discos (D57): sin argumentos y solo leen; la lectura elevada es otro canal.
// Con un núcleo falso: no se toca el hardware ni la red.

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function preparar() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = {
    handle: (canal, fn) => void canales.set(canal, fn as Manejador),
  };
  const leer = vi.fn(async () => ({ discos: [], prediccion: 'ok', conAdmin: false, leidoEn: 'x' }));
  const eventos = vi.fn(async () => []);
  const nucleo = {
    eventos: { on: () => () => undefined },
    saludDiscos: { leer, eventos },
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
  return { llamar, nucleo, leer, eventos };
}

describe('herramientas.saludDiscos*', () => {
  it('la lectura normal no pide administrador', async () => {
    const t = preparar();
    expect(await t.llamar('herramientas.saludDiscos')).toMatchObject({ ok: true });
    expect(t.leer).toHaveBeenLastCalledWith();
  });

  it('la lectura elevada es un canal aparte y pasa admin: true', async () => {
    const t = preparar();
    expect(await t.llamar('herramientas.saludDiscosAdmin')).toMatchObject({ ok: true });
    expect(t.leer).toHaveBeenLastCalledWith({ admin: true });
  });

  it('ni los argumentos del renderer cambian lo que se lee', async () => {
    const t = preparar();
    await t.llamar('herramientas.saludDiscos', { admin: true });
    expect(t.leer).toHaveBeenLastCalledWith();
  });

  it('los eventos se piden sin argumentos', async () => {
    const t = preparar();
    expect(await t.llamar('herramientas.eventosDisco')).toMatchObject({ ok: true, valor: [] });
    expect(t.eventos).toHaveBeenCalledTimes(1);
  });
});

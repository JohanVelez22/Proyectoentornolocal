import { describe, expect, it, vi } from 'vitest';
import {
  registrarIpc,
  type CapturaIpc,
  type IpcMainLike,
  type NucleoIpc,
  type VentanaLike,
} from '../src/main/ipc';

// Rutas `captura.*` de la ventana principal (D35), con un núcleo y un servicio falsos.

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function preparar(registrar: CapturaIpc['registrarAtajo']) {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = {
    handle: (canal, fn) => void canales.set(canal, fn as Manejador),
  };
  const config = { atajo: null as string | null, formato: 'png' as 'png' | 'jpg' };
  const nucleo = {
    eventos: { on: () => () => undefined },
    capturaConfig: vi.fn(async () => ({ ...config })),
    guardarCapturaConfig: vi.fn(async (c: Partial<typeof config>) => {
      if (c.formato && c.formato !== 'png' && c.formato !== 'jpg') throw new Error('no válido');
      Object.assign(config, c);
      return { ...config };
    }),
  } as unknown as NucleoIpc;
  const captura: CapturaIpc = {
    estadoUi: vi.fn(async () => ({
      config: { ...config },
      sistema: { disponible: true, permiso: 'no_aplica' as const },
      atajoActivo: false,
      atajoOcupado: false,
    })),
    registrarAtajo: vi.fn(registrar),
    iniciar: vi.fn(async () => ({ ok: true })),
    tomarPendiente: vi.fn(() => null),
  };
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
    { captura },
  );
  const llamar = (ruta: string, ...a: unknown[]): unknown =>
    canales.get(`entorno:${ruta}`)!({}, ...a);
  return { llamar, nucleo, captura, config };
}

describe('rutas captura.*', () => {
  it('guardarConfig registra el atajo y luego lo guarda', async () => {
    const t = preparar(() => ({ ok: true }));
    const r = await t.llamar('captura.guardarConfig', { atajo: 'Ctrl+Shift+S' });
    expect(r).toEqual({
      ok: true,
      valor: { config: { atajo: 'Ctrl+Shift+S', formato: 'png' }, atajo: { ok: true } },
    });
    expect(t.captura.registrarAtajo).toHaveBeenCalledWith('Ctrl+Shift+S');
  });

  it('si el atajo está ocupado no se guarda nada y se devuelve el motivo', async () => {
    const t = preparar(() => ({ ok: false, codigo: 'captura.atajo_ocupado' }));
    const r = await t.llamar('captura.guardarConfig', { atajo: 'Ctrl+Shift+S' });
    expect(r).toEqual({
      ok: true,
      valor: {
        config: { atajo: null, formato: 'png' },
        atajo: { ok: false, codigo: 'captura.atajo_ocupado' },
      },
    });
    expect(t.nucleo.guardarCapturaConfig).not.toHaveBeenCalled();
    expect(t.config.atajo).toBeNull();
  });

  it('cambiar solo el formato no toca el atajo del sistema', async () => {
    const t = preparar(() => ({ ok: true }));
    await t.llamar('captura.guardarConfig', { formato: 'jpg' });
    expect(t.captura.registrarAtajo).not.toHaveBeenCalled();
    expect(t.config.formato).toBe('jpg');
  });

  it('si guardar falla, el atajo vuelve al que había', async () => {
    const t = preparar(() => ({ ok: true }));
    const r = (await t.llamar('captura.guardarConfig', { atajo: 'Alt+F9', formato: 'bmp' })) as {
      ok: boolean;
    };
    expect(r.ok).toBe(false);
    expect(t.captura.registrarAtajo).toHaveBeenLastCalledWith(null);
  });

  it('rechaza argumentos que no son un objeto plano', async () => {
    const t = preparar(() => ({ ok: true }));
    for (const malo of [null, 'x', 5, [1]]) {
      expect(await t.llamar('captura.guardarConfig', malo)).toMatchObject({ ok: false });
    }
    expect(t.captura.registrarAtajo).not.toHaveBeenCalled();
  });

  it('iniciar solo acepta región, ventana o pantalla', async () => {
    const t = preparar(() => ({ ok: true }));
    for (const modo of ['region', 'ventana', 'pantalla']) {
      expect(await t.llamar('captura.iniciar', modo)).toEqual({ ok: true, valor: { ok: true } });
    }
    for (const malo of ['todo', '', null, 3, { modo: 'region' }]) {
      expect(await t.llamar('captura.iniciar', malo)).toMatchObject({ ok: false });
    }
    expect(t.captura.iniciar).toHaveBeenCalledTimes(3);
  });

  it('leer y tomarPendiente pasan por el servicio', async () => {
    const t = preparar(() => ({ ok: true }));
    expect(await t.llamar('captura.leer')).toMatchObject({
      ok: true,
      valor: { sistema: { disponible: true } },
    });
    expect(await t.llamar('captura.tomarPendiente')).toEqual({ ok: true, valor: null });
  });
});

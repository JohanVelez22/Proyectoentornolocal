import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { RUTAS_IPC } from '../src/shared/api';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Resultado = {
  ok: boolean;
  valor?: unknown;
  error?: { mensaje: string; codigo?: string; datos?: Record<string, unknown> };
};

function montarIpc() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const nucleo = {
    eventos: { on: () => () => undefined },
    sitios: { listar: vi.fn(async () => [{ id: 'tienda' }]) },
    abrirTerminal: vi.fn(async () => undefined),
    terminales: vi.fn(async () => ({
      disponibles: [{ id: 'powershell', nombre: 'Windows PowerShell', ruta: 'C:/x' }],
      porDefecto: null,
    })),
    cambiarTerminalPorDefecto: vi.fn(async () => undefined),
    adminerProyecto: vi.fn(async () => ({
      base: { motor: 'mysql', base: 'tienda', usuario: 'app' },
      url: 'http://127.0.0.1:8090/?server=127.0.0.1:3306&username=app&db=tienda',
    })),
  };
  registrarIpc(
    nucleo as unknown as NucleoIpc,
    ipcMain,
    { isDestroyed: () => false, webContents: { send: () => undefined } },
    {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
      abrirGrabadora: vi.fn(),
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(),
      guardarArchivo: vi.fn(),
      elegirArchivos: vi.fn(),
    },
    () => true,
  );
  const llamar = async (ruta: string, ...a: unknown[]) =>
    (await canales.get(`entorno:${ruta}`)!({}, ...a)) as Resultado;
  return { nucleo, llamar, canales };
}

describe('IPC de la terminal y de la base del proyecto', () => {
  it('las rutas existen', () => {
    const { canales } = montarIpc();
    for (const r of [
      'terminal.abrir',
      'terminal.disponibles',
      'terminal.cambiarPorDefecto',
      'adminer.proyecto',
    ]) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
  });

  it('terminal.abrir: sin terminal usa la predeterminada; una elegida debe ser conocida', async () => {
    const { nucleo, llamar } = montarIpc();
    expect((await llamar('terminal.abrir', 'tienda')).ok).toBe(true);
    expect(nucleo.abrirTerminal).toHaveBeenLastCalledWith('tienda', null);
    expect((await llamar('terminal.abrir', 'tienda', 'git-bash')).ok).toBe(true);
    expect(nucleo.abrirTerminal).toHaveBeenLastCalledWith('tienda', 'git-bash');
    nucleo.abrirTerminal.mockClear();
    for (const malo of ['bash; rm -rf', 'C:\\Windows\\System32\\cmd.exe', 7, {}]) {
      const r = await llamar('terminal.abrir', 'tienda', malo);
      expect(r.ok).toBe(false);
      expect(r.error?.codigo).toBe('terminal.invalida');
    }
    expect((await llamar('terminal.abrir', '')).ok).toBe(false);
    expect(nucleo.abrirTerminal).not.toHaveBeenCalled();
  });

  it('terminal.cambiarPorDefecto: id conocido o null; nada más', async () => {
    const { nucleo, llamar } = montarIpc();
    expect((await llamar('terminal.cambiarPorDefecto', 'pwsh')).ok).toBe(true);
    expect((await llamar('terminal.cambiarPorDefecto', null)).ok).toBe(true);
    expect(nucleo.cambiarTerminalPorDefecto.mock.calls).toEqual([['pwsh'], [null]]);
    const r = await llamar('terminal.cambiarPorDefecto', 'otra');
    expect(r.error?.codigo).toBe('terminal.invalida');
    expect(nucleo.cambiarTerminalPorDefecto).toHaveBeenCalledTimes(2);
    expect((await llamar('terminal.disponibles')).valor).toMatchObject({ porDefecto: null });
  });

  it('adminer.proyecto: solo con un id de sitio; la URL nunca lleva clave', async () => {
    const { nucleo, llamar } = montarIpc();
    const r = await llamar('adminer.proyecto', 'tienda');
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r.valor)).not.toMatch(/password|clave/i);
    expect((await llamar('adminer.proyecto', '')).ok).toBe(false);
    expect(nucleo.adminerProyecto).toHaveBeenCalledTimes(1);
  });

  it('textos de la terminal y la base en es y en', () => {
    expect(es.terminalSitio.boton).toBe('Terminal');
    expect(en.terminalSitio.boton).toBe('Terminal');
    for (const d of [es, en]) {
      expect(d.errores.codigos['terminal.no_abrio']).toBeTruthy();
      expect(d.errores.codigos['terminal.no_instalada']).toBeTruthy();
      expect(d.errores.codigos['terminal.invalida']).toBeTruthy();
    }
  });
});

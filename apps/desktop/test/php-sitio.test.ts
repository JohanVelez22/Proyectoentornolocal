import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { RUTAS_IPC } from '../src/shared/api';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Resultado = { ok: boolean; valor?: unknown; error?: { codigo?: string } };

const X = { activo: true, modo: ['debug'], puerto: 9003, inicio: 'trigger' };

function montarIpc() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const aplicar = { nginx: { ok: true, salida: '' }, hosts: { ok: true }, httpsPendiente: [] };
  const nucleo = {
    eventos: { on: () => () => undefined },
    guardarPhpIniSitio: vi.fn(async () => ({ aplicar })),
    xdebugSitio: vi.fn(async () => ({ aplicar })),
    phpSitio: vi.fn(async () => ({ phpIni: {}, xdebug: null })),
    vistaLaunchJsonSitio: vi.fn(async () => ({ existe: false, contenido: '{}', diff: '' })),
    escribirLaunchJsonSitio: vi.fn(async () => ({ creado: true, respaldo: null })),
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

const RUTAS = [
  'sitios.phpSitio',
  'sitios.guardarPhpIni',
  'sitios.xdebug',
  'sitios.launchJsonVista',
  'sitios.launchJson',
] as const;

describe('IPC de PHP por sitio (ini propio, Xdebug y launch.json)', () => {
  it('las rutas existen', () => {
    const { canales } = montarIpc();
    for (const r of RUTAS) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
  });

  it('rechaza ids, ajustes y Xdebug inválidos con php.argumento_invalido sin llamar al núcleo', async () => {
    const { nucleo, llamar } = montarIpc();
    const casos: [string, unknown[]][] = [
      ['sitios.phpSitio', ['../x']],
      ['sitios.guardarPhpIni', ['C:\\x', {}]],
      ['sitios.guardarPhpIni', ['tienda', 'memory_limit=1G']],
      ['sitios.guardarPhpIni', ['tienda', ['memory_limit']]],
      ['sitios.guardarPhpIni', ['tienda', { memory_limit: 1 }]],
      ['sitios.guardarPhpIni', ['tienda', { memory_limit: 'x'.repeat(300) }]],
      [
        'sitios.guardarPhpIni',
        ['tienda', Object.fromEntries(Array.from({ length: 41 }, (_, i) => [`k${i}`, '1']))],
      ],
      ['sitios.xdebug', ['tienda', 'debug']],
      ['sitios.xdebug', ['tienda', [X]]],
      ['sitios.xdebug', [42, X]],
      ['sitios.launchJsonVista', ['']],
      ['sitios.launchJson', [{}]],
    ];
    for (const [ruta, args] of casos) {
      const r = await llamar(ruta, ...args);
      expect(r.ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
      expect(r.error?.codigo).toBe('php.argumento_invalido');
    }
    for (const fn of Object.values(nucleo)) {
      if (typeof fn === 'function' && 'mock' in fn) expect(fn).not.toHaveBeenCalled();
    }
  });

  it('lo válido llega al núcleo (el núcleo valida el detalle y arma las rutas)', async () => {
    const { nucleo, llamar } = montarIpc();
    expect((await llamar('sitios.guardarPhpIni', 'tienda', { memory_limit: '1G' })).ok).toBe(true);
    expect(nucleo.guardarPhpIniSitio).toHaveBeenCalledWith('tienda', { memory_limit: '1G' });
    expect((await llamar('sitios.xdebug', 'tienda', X)).ok).toBe(true);
    expect((await llamar('sitios.xdebug', 'tienda', null)).ok).toBe(true);
    expect(nucleo.xdebugSitio).toHaveBeenLastCalledWith('tienda', null);
    expect((await llamar('sitios.phpSitio', 'tienda')).ok).toBe(true);
    expect((await llamar('sitios.launchJsonVista', 'tienda')).ok).toBe(true);
    expect((await llamar('sitios.launchJson', 'tienda')).ok).toBe(true);
    expect(nucleo.escribirLaunchJsonSitio).toHaveBeenCalledWith('tienda');
  });

  it('textos de la sección PHP del sitio en es y en', () => {
    expect(Object.keys(es.phpSitio).sort()).toEqual(Object.keys(en.phpSitio).sort());
  });
});

import { describe, expect, it, vi } from 'vitest';
import { CLAVES_RAPIDAS, ErrorWolf } from '@pel/core';
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
  const iniPhp = {
    leer: vi.fn(async () => 'memory_limit = 128M'),
    valores: vi.fn(async () => ({ memory_limit: '128M' })),
    conValores: vi.fn(async () => 'memory_limit = 1G'),
    diff: vi.fn(async () => '@@ -1,1 +1,1 @@'),
    guardar: vi.fn(async () => ({ respaldo: 'php.ini-2026-11-23T10-00-00-000Z.txt' })),
    respaldos: vi.fn(async () => []),
    restaurar: vi.fn(async () => ({ respaldo: 'php.ini-2026-11-23T10-00-01-000Z.txt' })),
  };
  const extensionesPhp = {
    listar: vi.fn(async () => []),
    activar: vi.fn(async () => undefined),
    instalar: vi.fn(async () => undefined),
  };
  const nucleo = { eventos: { on: () => () => undefined }, iniPhp, extensionesPhp };
  registrarIpc(
    nucleo as unknown as NucleoIpc,
    ipcMain,
    { isDestroyed: () => false, webContents: { send: () => undefined } },
    {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
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
  return { iniPhp, extensionesPhp, llamar, canales };
}

const RUTAS = [
  'php.iniLeer',
  'php.iniValores',
  'php.iniConValores',
  'php.iniDiff',
  'php.iniGuardar',
  'php.iniRespaldos',
  'php.iniRestaurar',
  'php.extensiones',
  'php.extensionActivar',
  'php.extensionInstalar',
] as const;

describe('IPC de PHP (php.ini y extensiones)', () => {
  it('las rutas existen', () => {
    const { canales } = montarIpc();
    for (const r of RUTAS) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
  });

  it('rechaza argumentos inválidos con php.argumento_invalido sin llamar al núcleo', async () => {
    const { iniPhp, extensionesPhp, llamar } = montarIpc();
    const casos: [string, unknown[]][] = [
      ['php.iniLeer', ['../8.4']],
      ['php.iniLeer', [8.4]],
      ['php.iniValores', ['8']],
      ['php.iniConValores', ['8.4', { extension: 'evil' }]],
      ['php.iniConValores', ['8.4', { memory_limit: 5 }]],
      ['php.iniConValores', ['8.4', ['memory_limit']]],
      ['php.iniConValores', ['8.4', {}, 7]],
      ['php.iniDiff', ['8.4', 7]],
      ['php.iniGuardar', ['8.4', 'a\0b']],
      ['php.iniGuardar', ['8.4', 'x'.repeat(1024 * 1024 + 1)]],
      ['php.iniRestaurar', ['8.4', '../../config.json']],
      ['php.iniRestaurar', ['8.4', 'C:\\php.ini']],
      ['php.extensiones', ['8.4.1']],
      ['php.extensionActivar', ['8.4', '../gd', true]],
      ['php.extensionActivar', ['8.4', 'gd', 'true']],
      ['php.extensionInstalar', ['8.4', 'Xdebug;']],
    ];
    for (const [ruta, args] of casos) {
      const r = await llamar(ruta, ...args);
      expect(r.ok, `${ruta} ${JSON.stringify(args).slice(0, 80)}`).toBe(false);
      expect(r.error?.codigo, ruta).toBe('php.argumento_invalido');
    }
    for (const m of [...Object.values(iniPhp), ...Object.values(extensionesPhp)]) {
      expect(m).not.toHaveBeenCalled();
    }
  });

  it('pasa los argumentos validados al núcleo', async () => {
    const { iniPhp, extensionesPhp, llamar } = montarIpc();
    expect(await llamar('php.iniLeer', '8.4')).toEqual({ ok: true, valor: 'memory_limit = 128M' });
    await llamar('php.iniValores', '8.4');
    expect(iniPhp.valores).toHaveBeenCalledWith('8.4', CLAVES_RAPIDAS);
    await llamar('php.iniConValores', '8.4', { memory_limit: '1G' });
    expect(iniPhp.conValores).toHaveBeenCalledWith('8.4', { memory_limit: '1G' });
    await llamar('php.iniConValores', '8.4', { memory_limit: '2G' }, 'memory_limit=1M');
    expect(iniPhp.conValores).toHaveBeenLastCalledWith(
      '8.4',
      { memory_limit: '2G' },
      'memory_limit=1M',
    );
    await llamar('php.iniGuardar', '8.4', 'memory_limit = 1G');
    expect(iniPhp.guardar).toHaveBeenCalledWith('8.4', 'memory_limit = 1G');
    await llamar('php.iniRestaurar', '8.4', 'php.ini-2026-11-23T10-00-00-000Z.txt');
    expect(iniPhp.restaurar).toHaveBeenCalledWith('8.4', 'php.ini-2026-11-23T10-00-00-000Z.txt');
    await llamar('php.extensionActivar', '8.4', 'gd', false);
    expect(extensionesPhp.activar).toHaveBeenCalledWith('8.4', 'gd', false);
    await llamar('php.extensionInstalar', '8.4', 'xdebug');
    expect(extensionesPhp.instalar).toHaveBeenCalledWith('8.4', 'xdebug');
  });

  it('un php.ini inválido llega con su código y la salida recortada', async () => {
    const { iniPhp, llamar } = montarIpc();
    iniPhp.guardar.mockRejectedValueOnce(
      new ErrorWolf('php.ini_invalido', 'PHP 8.4 no arranca', { salida: 'PHP Warning: x' }),
    );
    const r = await llamar('php.iniGuardar', '8.4', 'extension=nada');
    expect(r.error).toMatchObject({
      codigo: 'php.ini_invalido',
      datos: { salida: 'PHP Warning: x' },
    });
  });

  it('los textos de la pantalla PHP existen en español e inglés', () => {
    expect(Object.keys(en.php).sort()).toEqual(Object.keys(es.php).sort());
    expect(es.nav.php).toBeTruthy();
    expect(en.nav.php).toBeTruthy();
    for (const k of CLAVES_RAPIDAS) {
      expect(es.php.rapidos[k], k).toBeTruthy();
      expect(en.php.rapidos[k], k).toBeTruthy();
    }
  });
});

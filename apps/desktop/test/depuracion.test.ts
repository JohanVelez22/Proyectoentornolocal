import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { EVENTOS_IPC, RUTAS_IPC } from '../src/shared/api';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { SECCIONES_NAV } from '../src/renderer/navegacion';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Resultado = { ok: boolean; valor?: unknown; error?: { codigo?: string } };

const SECRETO = 'sk-centinela-no-debe-salir-123456';

function montarIpc() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const nucleo = {
    eventos: { on: () => () => undefined },
    estadoDepuracion: vi.fn(() => ({
      activo: false,
      direccion: '127.0.0.1',
      puerto: null,
      total: 0,
    })),
    activarDepuracion: vi.fn(async () => ({ activo: true })),
    capturaDumpsSitio: vi.fn(async () => ({ sitio: {}, aplicar: null })),
    listaDumps: vi.fn(() => []),
    leerDump: vi.fn(() => null),
    limpiarDumps: vi.fn(),
    textoDumpParaCopiar: vi.fn(() => 'texto enmascarado sk-***'),
    listaErrores: vi.fn(async () => []),
    leerError: vi.fn(async () => null),
    abrirEnEditor: vi.fn(async () => undefined),
  };
  const copiar = vi.fn();
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
      copiar,
      version: vi.fn(),
      guardarArchivo: vi.fn(),
      elegirArchivos: vi.fn(),
    },
    () => true,
  );
  const llamar = async (ruta: string, ...a: unknown[]) =>
    (await canales.get(`entorno:${ruta}`)!({}, ...a)) as Resultado;
  return { nucleo, llamar, canales, copiar };
}

const RUTAS = [
  'depuracion.estado',
  'depuracion.activar',
  'depuracion.captura',
  'depuracion.lista',
  'depuracion.leer',
  'depuracion.limpiar',
  'depuracion.copiar',
  'errores.lista',
  'errores.leer',
  'editor.abrirEn',
] as const;

describe('IPC de la captura de dumps', () => {
  it('las rutas y el evento existen', () => {
    const { canales } = montarIpc();
    for (const r of RUTAS) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
    expect(EVENTOS_IPC).toContain('dump:nuevo');
  });

  it('rechaza ids, filtros y confirmaciones inválidos sin llamar al núcleo', async () => {
    const { nucleo, llamar } = montarIpc();
    const casos: [string, unknown[]][] = [
      ['depuracion.activar', ['si']],
      ['depuracion.captura', ['../x', true, true]],
      ['depuracion.captura', ['C:\\proyectos\\x', false]],
      ['depuracion.captura', ['tienda', 'true', true]],
      ['depuracion.captura', ['tienda', true, 'si']],
      ['depuracion.captura', ['tienda', true, 1]],
      ['depuracion.leer', ['../../run/depuracion.json']],
      ['depuracion.leer', [42]],
      ['depuracion.copiar', ['d1']],
      ['depuracion.lista', ['php']],
      ['depuracion.lista', [{ origen: 'ruby' }]],
      ['depuracion.lista', [{ texto: 'a\u0000b' }]],
      ['depuracion.lista', [{ texto: 'x'.repeat(201) }]],
      ['depuracion.lista', [{ sitioId: '../x' }]],
      ['depuracion.lista', [{ ruta: 'C:/x' }]],
    ];
    for (const [ruta, args] of casos) {
      const r = await llamar(ruta, ...args);
      expect(r.ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
      expect(r.error?.codigo).toBe('depuracion.argumento_invalido');
    }
    for (const fn of Object.values(nucleo)) {
      if (typeof fn === 'function' && 'mock' in fn) expect(fn).not.toHaveBeenCalled();
    }
  });

  it('lo válido llega al núcleo; la confirmación solo pasa si es exactamente true', async () => {
    const { nucleo, llamar } = montarIpc();
    expect((await llamar('depuracion.activar', true)).ok).toBe(true);
    expect(nucleo.activarDepuracion).toHaveBeenCalledWith(true);
    expect((await llamar('depuracion.captura', 'tienda', true, true)).ok).toBe(true);
    expect(nucleo.capturaDumpsSitio).toHaveBeenLastCalledWith('tienda', true, true);
    expect((await llamar('depuracion.captura', 'tienda', true)).ok).toBe(true);
    expect(nucleo.capturaDumpsSitio).toHaveBeenLastCalledWith('tienda', true);
    expect((await llamar('depuracion.lista', { sitioId: 'tienda', origen: 'php', texto: 'x' })).ok);
    expect(nucleo.listaDumps).toHaveBeenLastCalledWith({
      sitioId: 'tienda',
      origen: 'php',
      texto: 'x',
    });
    expect((await llamar('depuracion.lista')).ok).toBe(true);
    expect((await llamar('depuracion.leer', 'dmhx1-3')).ok).toBe(true);
    expect(nucleo.leerDump).toHaveBeenCalledWith('dmhx1-3');
    expect((await llamar('depuracion.limpiar')).ok).toBe(true);
    expect(nucleo.limpiarDumps).toHaveBeenCalled();
  });

  it('copiar va enmascarado al portapapeles y no devuelve el texto', async () => {
    const { nucleo, llamar, copiar } = montarIpc();
    nucleo.textoDumpParaCopiar.mockReturnValue('API_KEY=*** enmascarado');
    const r = await llamar('depuracion.copiar', 'dmhx1-3');
    expect(r.ok).toBe(true);
    expect(r.valor).toBeUndefined();
    expect(copiar).toHaveBeenCalledWith('API_KEY=*** enmascarado');
    expect(JSON.stringify(r)).not.toContain(SECRETO);
  });

  it('errores y editor: argumentos inválidos no llegan al núcleo', async () => {
    const { nucleo, llamar } = montarIpc();
    const casos: [string, unknown[]][] = [
      ['errores.lista', [{ sitioId: '../x' }]],
      ['errores.lista', [{ desde: 'ayer' }]],
      ['errores.lista', [{ otro: 1 }]],
      ['errores.lista', ['tienda']],
      ['errores.leer', ['../../etc']],
      ['errores.leer', ['0123456789ABCDEF']],
      ['errores.leer', [123]],
      ['editor.abrirEn', ['C:/x', 'C:/x/a.php', 1]],
      ['editor.abrirEn', ['tienda', 42, 1]],
      ['editor.abrirEn', ['tienda', 'C:/x/a.php\n', 1]],
      ['editor.abrirEn', ['tienda', 'x'.repeat(2000), 1]],
      ['editor.abrirEn', ['tienda', 'C:/x/a.php', 0]],
      ['editor.abrirEn', ['tienda', 'C:/x/a.php', 1.5]],
      ['editor.abrirEn', ['tienda', 'C:/x/a.php', '3']],
    ];
    for (const [ruta, args] of casos) {
      const r = await llamar(ruta, ...args);
      expect(r.ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
      expect(r.error?.codigo).toBe('depuracion.argumento_invalido');
    }
    expect(nucleo.listaErrores).not.toHaveBeenCalled();
    expect(nucleo.leerError).not.toHaveBeenCalled();
    expect(nucleo.abrirEnEditor).not.toHaveBeenCalled();
  });

  it('errores y editor: lo válido llega al núcleo', async () => {
    const { nucleo, llamar } = montarIpc();
    expect(
      (await llamar('errores.lista', { sitioId: 'tienda', desde: '2026-11-23T00:00:00.000Z' })).ok,
    ).toBe(true);
    expect(nucleo.listaErrores).toHaveBeenLastCalledWith({
      sitioId: 'tienda',
      desde: '2026-11-23T00:00:00.000Z',
    });
    expect((await llamar('errores.lista')).ok).toBe(true);
    expect((await llamar('errores.leer', '0123456789abcdef')).ok).toBe(true);
    expect(nucleo.leerError).toHaveBeenCalledWith('0123456789abcdef');
    expect((await llamar('editor.abrirEn', 'tienda', 'C:/p/tienda/app/X.php', 12)).ok).toBe(true);
    // La validación de que el archivo está dentro del sitio la hace el núcleo (rutas reales).
    expect(nucleo.abrirEnEditor).toHaveBeenCalledWith('tienda', 'C:/p/tienda/app/X.php', 12, null);
  });

  it('pantalla en la barra lateral y textos en es y en', () => {
    expect(SECCIONES_NAV).toContain('depuracion');
    expect(Object.keys(es.depuracion).sort()).toEqual(Object.keys(en.depuracion).sort());
    expect(es.nav.depuracion).toBeTruthy();
    expect(en.nav.depuracion).toBeTruthy();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { RUTAS_IPC } from '../src/shared/api';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';

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
    abrirEditor: vi.fn(async () => ({
      editor: { id: 'vscode', nombre: 'VS Code' },
      sustituyo: null,
    })),
    abrirEnEditor: vi.fn(async () => ({
      editor: { id: 'vscode', nombre: 'VS Code' },
      sustituyo: null,
    })),
    editores: vi.fn(async () => ({
      disponibles: [{ id: 'vscode', nombre: 'Visual Studio Code', ruta: 'C:/x/Code.exe' }],
      porDefecto: null,
    })),
    cambiarEditorPredeterminado: vi.fn(async () => undefined),
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

describe('IPC del editor', () => {
  it('las rutas existen', () => {
    const { canales } = montarIpc();
    for (const r of ['editor.abrirEn', 'editor.disponibles', 'editor.cambiarPorDefecto']) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
  });

  it('editor.cambiarPorDefecto: id conocido o null; nada más (nunca una ruta)', async () => {
    const { nucleo, llamar } = montarIpc();
    expect((await llamar('editor.cambiarPorDefecto', 'cursor')).ok).toBe(true);
    expect((await llamar('editor.cambiarPorDefecto', null)).ok).toBe(true);
    expect(nucleo.cambiarEditorPredeterminado.mock.calls).toEqual([['cursor'], [null]]);
    for (const malo of ['otro', 'C:/Windows/System32/cmd.exe', 7, {}]) {
      const r = await llamar('editor.cambiarPorDefecto', malo);
      expect(r.error?.codigo).toBe('herramientas.editor_invalido');
    }
    expect(nucleo.cambiarEditorPredeterminado).toHaveBeenCalledTimes(2);
    expect((await llamar('editor.disponibles')).valor).toMatchObject({ porDefecto: null });
  });

  it('editor.abrirEn y abrirEditor: el editor pedido debe ser un id conocido', async () => {
    const { nucleo, llamar } = montarIpc();
    expect((await llamar('editor.abrirEn', 'tienda', 'C:/p/tienda/a.php', 3, 'phpstorm')).ok).toBe(
      true,
    );
    expect(nucleo.abrirEnEditor).toHaveBeenLastCalledWith(
      'tienda',
      'C:/p/tienda/a.php',
      3,
      'phpstorm',
    );
    expect((await llamar('sistema.abrirEditor', 'tienda', 'zed')).ok).toBe(true);
    expect(nucleo.abrirEditor).toHaveBeenLastCalledWith('tienda', 'zed');
    for (const malo of ['C:/x/evil.exe', '../code', 5]) {
      const a = await llamar('editor.abrirEn', 'tienda', 'C:/p/tienda/a.php', 3, malo);
      const b = await llamar('sistema.abrirEditor', 'tienda', malo);
      expect(a.error?.codigo).toBe('herramientas.editor_invalido');
      expect(b.error?.codigo).toBe('herramientas.editor_invalido');
    }
    expect(nucleo.abrirEnEditor).toHaveBeenCalledTimes(1);
    expect(nucleo.abrirEditor).toHaveBeenCalledTimes(1);
  });

  it('textos del editor en es, en, pt y fr', () => {
    for (const d of [es, en, pt, fr]) {
      expect(d.editorSitio.elegir).toBeTruthy();
      expect(d.editorSitio.sustituido('A', 'B')).toMatch(/A.*B|B.*A/);
      expect(d.errores.codigos['herramientas.sin_editor']).toBeTruthy();
      expect(d.errores.codigos['herramientas.editor_no_instalado']).toBeTruthy();
      expect(d.errores.codigos['herramientas.editor_invalido']).toBeTruthy();
    }
  });
});

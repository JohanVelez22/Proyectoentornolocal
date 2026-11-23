import { SNIPPETS_NGINX } from '@pel/core';
import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { RUTAS_IPC } from '../src/shared/api';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Resultado = { ok: boolean; valor?: unknown; error?: { codigo?: string } };

function montarIpc() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const editorVhost = {
    vista: vi.fn(async () => ({ generado: 'server {}', reglas: '', manual: null })),
    aplicar: vi.fn(async () => ({ ok: true, avisos: [], respaldo: null })),
    historial: vi.fn(async () => []),
    restaurar: vi.fn(async () => ({ ok: true, avisos: [], respaldo: null })),
  };
  const nucleo = { eventos: { on: () => () => undefined }, editorVhost };
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
  return { editorVhost, llamar, canales };
}

const RUTAS = [
  'nginx.vista',
  'nginx.aplicar',
  'nginx.historial',
  'nginx.restaurar',
  'nginx.snippets',
] as const;

describe('IPC del editor de vhost de Nginx', () => {
  it('las rutas existen', () => {
    const { canales } = montarIpc();
    for (const r of RUTAS) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
  });

  it('rechaza ids, cambios y versiones inválidos con nginx.argumento_invalido sin llamar al núcleo', async () => {
    const { editorVhost, llamar } = montarIpc();
    const casos: [string, unknown[]][] = [
      ['nginx.vista', ['../x']],
      ['nginx.vista', [42]],
      ['nginx.aplicar', ['C:\\x', { reglas: '' }]],
      ['nginx.aplicar', ['blog', 'gzip on;']],
      ['nginx.aplicar', ['blog', {}]],
      ['nginx.aplicar', ['blog', { reglas: 1 }]],
      ['nginx.aplicar', ['blog', { reglas: 'x'.repeat(70_000) }]],
      ['nginx.aplicar', ['blog', { reglas: 'a\u0000' }]],
      ['nginx.aplicar', ['blog', { manual: 3 }]],
      ['nginx.aplicar', ['blog', { manual: 'x'.repeat(300_000) }]],
      ['nginx.aplicar', ['blog', { reglas: '', ruta: 'C:/x.conf' }]],
      ['nginx.historial', [{}]],
      ['nginx.restaurar', ['blog', '../../config.json']],
      ['nginx.restaurar', ['blog', 42]],
    ];
    for (const [ruta, args] of casos) {
      const r = await llamar(ruta, ...args);
      expect(r.ok, `${ruta} ${JSON.stringify(args).slice(0, 80)}`).toBe(false);
      expect(r.error?.codigo).toBe('nginx.argumento_invalido');
    }
    for (const fn of Object.values(editorVhost)) expect(fn).not.toHaveBeenCalled();
  });

  it('lo válido llega al núcleo (el núcleo revisa las directivas y arma las rutas)', async () => {
    const { editorVhost, llamar } = montarIpc();
    expect((await llamar('nginx.vista', 'blog')).ok).toBe(true);
    expect((await llamar('nginx.aplicar', 'blog', { reglas: 'gzip on;' })).ok).toBe(true);
    expect(editorVhost.aplicar).toHaveBeenLastCalledWith('blog', { reglas: 'gzip on;' });
    expect((await llamar('nginx.aplicar', 'blog', { manual: null })).ok).toBe(true);
    expect(editorVhost.aplicar).toHaveBeenLastCalledWith('blog', { manual: null });
    expect((await llamar('nginx.historial', 'blog')).ok).toBe(true);
    const v = 'vhost-2026-11-23T12-00-00-000Z.txt';
    expect((await llamar('nginx.restaurar', 'blog', v)).ok).toBe(true);
    expect(editorVhost.restaurar).toHaveBeenCalledWith('blog', v);
    const s = await llamar('nginx.snippets');
    expect(s.valor).toEqual(SNIPPETS_NGINX);
  });

  it('textos del editor en es y en, con un título por snippet', () => {
    expect(Object.keys(es.nginxEditor).sort()).toEqual(Object.keys(en.nginxEditor).sort());
    for (const s of SNIPPETS_NGINX) {
      const clave = s.titulo.replace('nginxEditor.snippets.', '');
      expect(es.nginxEditor.snippets).toHaveProperty(clave);
      expect(en.nginxEditor.snippets).toHaveProperty(clave);
    }
  });
});

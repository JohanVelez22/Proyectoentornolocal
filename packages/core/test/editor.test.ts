import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { abrirEnVsCode, buscarVsCode, MENSAJE_SIN_VSCODE } from '../src/herramientas/editor';

const W = path.win32;

describe('VS Code', () => {
  it('lo encuentra por el code.cmd del PATH (Code.exe está una carpeta arriba)', () => {
    const bin = 'D:\\Herramientas\\VS Code\\bin';
    const existe = (r: string) =>
      [W.join(bin, 'code.cmd'), 'D:\\Herramientas\\VS Code\\Code.exe'].includes(r);
    const entorno = { Path: `C:\\Windows;${bin}`, LOCALAPPDATA: 'C:\\U\\AppData\\Local' };
    expect(buscarVsCode({ entorno, existe })).toBe('D:\\Herramientas\\VS Code\\Code.exe');
  });

  it('si no está en el PATH busca las rutas típicas de instalación', () => {
    const local = 'C:\\Users\\yo\\AppData\\Local';
    const usuario = W.join(local, 'Programs', 'Microsoft VS Code', 'Code.exe');
    const sistema = W.join('C:\\Program Files', 'Microsoft VS Code', 'Code.exe');
    const entorno = { PATH: 'C:\\Windows', LOCALAPPDATA: local, ProgramFiles: 'C:\\Program Files' };
    expect(buscarVsCode({ entorno, existe: (r) => r === usuario })).toBe(usuario);
    expect(buscarVsCode({ entorno, existe: (r) => r === sistema })).toBe(sistema);
    expect(buscarVsCode({ entorno, existe: () => false })).toBeNull();
  });

  it('abre la carpeta como un argumento (sin shell) y sin ELECTRON_RUN_AS_NODE', async () => {
    const lanzar = vi.fn(async () => undefined);
    const exe = 'C:\\VS Code\\Code.exe';
    await abrirEnVsCode('C:\\Proyectos\\Mi proyecto’s', {
      entorno: { PATH: 'C:\\VS Code\\bin', ELECTRON_RUN_AS_NODE: '1' },
      existe: (r) => r === 'C:\\VS Code\\bin\\code.cmd' || r === exe,
      lanzar,
    });
    expect(lanzar).toHaveBeenCalledTimes(1);
    const [cmd, args, opts] = lanzar.mock.calls[0]! as unknown as [
      string,
      string[],
      { cwd: string; env: NodeJS.ProcessEnv },
    ];
    expect(cmd).toBe(exe);
    expect(args).toEqual(['C:\\Proyectos\\Mi proyecto’s']);
    expect(opts.cwd).toBe('C:\\Proyectos\\Mi proyecto’s');
    expect(opts.env).not.toHaveProperty('ELECTRON_RUN_AS_NODE');
  });

  it('sin VS Code falla con un mensaje claro', async () => {
    await expect(
      abrirEnVsCode('C:\\x', { entorno: {}, existe: () => false, lanzar: vi.fn() }),
    ).rejects.toThrow(MENSAJE_SIN_VSCODE);
  });
});

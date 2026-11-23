import { mkdir, realpath, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  abrirArchivoDelSitio,
  abrirEnVsCode,
  buscarVsCode,
  type DepsEditor,
  MENSAJE_SIN_VSCODE,
} from '../src/herramientas/editor';
import { carpetaTemporal } from './temporales';

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

describe('abrir un archivo del sitio en una línea', () => {
  const exe = 'C:\\VS Code\\Code.exe';
  const deps = (lanzar: DepsEditor['lanzar']): DepsEditor => ({
    entorno: { PATH: 'C:\\VS Code\\bin' },
    existe: (r: string) => r === 'C:\\VS Code\\bin\\code.cmd' || r === exe,
    lanzar,
  });

  it('abre la carpeta del sitio y el archivo en la línea con -g', async () => {
    const base = await carpetaTemporal('pel-editor-');
    const carpeta = path.join(base, 'sitio');
    await mkdir(path.join(carpeta, 'app'), { recursive: true });
    const archivo = path.join(carpeta, 'app', 'Caja.php');
    await writeFile(archivo, '<?php\n');
    const lanzar = vi.fn(async () => undefined);
    await abrirArchivoDelSitio(carpeta, archivo, 42, deps(lanzar));
    const [, args, opts] = lanzar.mock.calls[0]! as unknown as [string, string[], { cwd: string }];
    expect(args[0]).toBe(await realpath(carpeta));
    expect(args[1]).toBe('-g');
    expect(args[2]).toBe(`${await realpath(archivo)}:42`);
    expect(opts.cwd).toBe(await realpath(carpeta));
  });

  it('rechaza rutas fuera del sitio, relativas, con .., carpetas o que no existen', async () => {
    const base = await carpetaTemporal('pel-editor-');
    const carpeta = path.join(base, 'sitio');
    await mkdir(carpeta, { recursive: true });
    const fuera = path.join(base, 'secreto.txt');
    await writeFile(fuera, 'x');
    const hermana = path.join(base, 'sitio-otro', 'a.php');
    await mkdir(path.dirname(hermana), { recursive: true });
    await writeFile(hermana, 'x');
    const lanzar = vi.fn(async () => undefined);
    for (const a of [
      fuera,
      hermana,
      path.join(carpeta, '..', 'secreto.txt'),
      'secreto.txt',
      carpeta,
      path.join(carpeta, 'no-existe.php'),
      `${path.join(carpeta, 'a.php')}\n`,
      '-r',
    ]) {
      await expect(abrirArchivoDelSitio(carpeta, a, 1, deps(lanzar)), a).rejects.toMatchObject({
        codigo: expect.stringMatching(/^depuracion\./),
      });
    }
    expect(lanzar).not.toHaveBeenCalled();
  });

  it('un enlace dentro del sitio que apunta afuera se rechaza', async () => {
    const base = await carpetaTemporal('pel-editor-');
    const carpeta = path.join(base, 'sitio');
    const afuera = path.join(base, 'afuera');
    await mkdir(carpeta, { recursive: true });
    await mkdir(afuera, { recursive: true });
    await writeFile(path.join(afuera, 'x.php'), 'x');
    try {
      await symlink(afuera, path.join(carpeta, 'enlace'), 'junction');
    } catch {
      return; // Sin permiso para crear enlaces: nada que probar.
    }
    const lanzar = vi.fn(async () => undefined);
    await expect(
      abrirArchivoDelSitio(carpeta, path.join(carpeta, 'enlace', 'x.php'), 1, deps(lanzar)),
    ).rejects.toMatchObject({ codigo: 'depuracion.archivo_fuera_del_sitio' });
    expect(lanzar).not.toHaveBeenCalled();
  });

  it('la línea debe ser un entero positivo', async () => {
    const lanzar = vi.fn(async () => undefined);
    for (const l of [0, -1, 1.5, Number.NaN, 1e9]) {
      await expect(abrirArchivoDelSitio('C:/x', 'C:/x/a.php', l, deps(lanzar))).rejects.toThrow();
    }
  });
});

import { mkdir, realpath, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { abrirArchivoDelSitio, abrirEnEditor, type DepsEditor } from '../src/herramientas/editor';
import { argsAbrir, IDS_EDITOR } from '../src/herramientas/editores';
import { editoresWindows } from '../src/plataforma/editoresWin';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import type { EditorDisponible } from '../src/plataforma/tipos';
import { buscarVsCode } from '../src/plataforma/vscodeWin';
import { carpetaTemporal } from './temporales';

const W = path.win32;
const VSCODE: EditorDisponible = {
  id: 'vscode',
  nombre: 'Visual Studio Code',
  ruta: 'C:\\VS Code\\Code.exe',
};
const SUBLIME: EditorDisponible = {
  id: 'sublime',
  nombre: 'Sublime Text',
  ruta: 'C:\\S\\sublime_text.exe',
};
const lanzador = () => vi.fn(async () => undefined);
const llamada = (l: ReturnType<typeof lanzador>) =>
  l.mock.calls[0]! as unknown as [string, string[], { cwd: string; env: NodeJS.ProcessEnv }];

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
});

describe('argsAbrir', () => {
  const f = { ruta: 'C:\\p\\a.php', linea: 7 };
  it('cada editor con sus argumentos', () => {
    for (const id of ['vscode', 'cursor', 'windsurf'] as const) {
      expect(argsAbrir(id, 'C:\\p', f), id).toEqual(['C:\\p', '-g', 'C:\\p\\a.php:7']);
    }
    expect(argsAbrir('phpstorm', 'C:\\p', f)).toEqual(['--line', '7', 'C:\\p\\a.php']);
    expect(argsAbrir('sublime', 'C:\\p', f)).toEqual(['C:\\p\\a.php:7']);
    expect(argsAbrir('zed', 'C:\\p', f)).toEqual(['C:\\p\\a.php:7']);
    expect(argsAbrir('notepadpp', 'C:\\p', f)).toEqual(['-n7', 'C:\\p\\a.php']);
  });

  it('sin archivo abre la carpeta (Notepad++ no abre carpetas: vacío)', () => {
    for (const id of IDS_EDITOR) {
      expect(argsAbrir(id, 'C:\\p'), id).toEqual(id === 'notepadpp' ? [] : ['C:\\p']);
    }
  });
});

describe('abrirEnEditor', () => {
  it('pasa los argumentos en lista, sin shell y sin ELECTRON_RUN_AS_NODE', async () => {
    const lanzar = lanzador();
    const r = await abrirEnEditor(
      'C:\\Proyectos\\Mi proyecto’s',
      { predeterminado: 'vscode' },
      {
        editores: async () => [VSCODE, SUBLIME],
        entorno: { PATH: 'x', ELECTRON_RUN_AS_NODE: '1' },
        lanzar,
      },
    );
    const [cmd, args, opts] = llamada(lanzar);
    expect(cmd).toBe(VSCODE.ruta);
    expect(args).toEqual(['C:\\Proyectos\\Mi proyecto’s']);
    expect(opts.cwd).toBe('C:\\Proyectos\\Mi proyecto’s');
    expect(opts.env).not.toHaveProperty('ELECTRON_RUN_AS_NODE');
    expect(r).toEqual({ editor: { id: 'vscode', nombre: VSCODE.nombre }, sustituyo: null });
  });

  it('el editor pedido manda sobre el predeterminado', async () => {
    const lanzar = lanzador();
    await abrirEnEditor(
      'C:\\p',
      { editor: 'sublime', predeterminado: 'vscode' },
      { editores: async () => [VSCODE, SUBLIME], lanzar },
    );
    expect(llamada(lanzar)[0]).toBe(SUBLIME.ruta);
  });

  it('un editor pedido que no está instalado es un error', async () => {
    const lanzar = lanzador();
    await expect(
      abrirEnEditor('C:\\p', { editor: 'zed' }, { editores: async () => [VSCODE], lanzar }),
    ).rejects.toMatchObject({ codigo: 'herramientas.editor_no_instalado' });
    expect(lanzar).not.toHaveBeenCalled();
  });

  it('predeterminado no instalado: cae al primero detectado y lo informa', async () => {
    const lanzar = lanzador();
    const r = await abrirEnEditor(
      'C:\\p',
      { predeterminado: 'phpstorm' },
      { editores: async () => [VSCODE, SUBLIME], lanzar },
    );
    expect(llamada(lanzar)[0]).toBe(VSCODE.ruta);
    expect(r.sustituyo).toBe('phpstorm');
  });

  it('sin predeterminado usa el primero, sin aviso', async () => {
    const lanzar = lanzador();
    const r = await abrirEnEditor('C:\\p', {}, { editores: async () => [SUBLIME, VSCODE], lanzar });
    expect(llamada(lanzar)[0]).toBe(SUBLIME.ruta);
    expect(r.sustituyo).toBeNull();
  });

  it('ningún editor instalado: herramientas.sin_editor', async () => {
    const lanzar = lanzador();
    await expect(
      abrirEnEditor('C:\\p', {}, { editores: async () => [], lanzar }),
    ).rejects.toMatchObject({ codigo: 'herramientas.sin_editor' });
    expect(lanzar).not.toHaveBeenCalled();
  });

  it('la lista sale de la plataforma falsa (sin ejecutar nada real)', async () => {
    const p = new PlataformaFalsa();
    const lanzar = lanzador();
    await abrirEnEditor('C:\\p', {}, { editores: () => p.editoresInstalados(), lanzar });
    expect(llamada(lanzar)[0]).toBe('C:/Falso/Code.exe');
  });
});

describe('editoresWindows', () => {
  const local = 'C:\\Users\\yo\\AppData\\Local';
  const entorno = {
    PATH: 'C:\\Windows',
    LOCALAPPDATA: local,
    ProgramFiles: 'C:\\Program Files',
  };

  it('detecta cada editor por sus rutas conocidas y en el orden fijo', () => {
    const jb = W.join('C:\\Program Files', 'JetBrains');
    const rutas = new Set([
      W.join('C:\\Program Files', 'Notepad++', 'notepad++.exe'),
      W.join('C:\\Program Files', 'Sublime Text', 'sublime_text.exe'),
      W.join(jb, 'PhpStorm 2024.1', 'bin', 'phpstorm64.exe'),
      W.join(jb, 'PhpStorm 2025.2', 'bin', 'phpstorm64.exe'),
      W.join(local, 'Programs', 'cursor', 'Cursor.exe'),
      W.join(local, 'Programs', 'Microsoft VS Code', 'Code.exe'),
      W.join(local, 'Programs', 'Zed', 'zed.exe'),
      W.join(local, 'Programs', 'Windsurf', 'Windsurf.exe'),
    ]);
    const lista = editoresWindows(entorno, {
      existe: (r) => rutas.has(r),
      listar: (c) => (c === jb ? ['PhpStorm 2024.1', 'PhpStorm 2025.2', 'IDEA'] : []),
    });
    expect(lista.map((e) => e.id)).toEqual([...IDS_EDITOR]);
    expect(lista.find((e) => e.id === 'phpstorm')?.ruta).toContain('PhpStorm 2025.2');
  });

  it('no inventa editores: sin archivos no hay nada', () => {
    expect(editoresWindows(entorno, { existe: () => false, listar: () => [] })).toEqual([]);
  });
});

describe('abrir un archivo del sitio en una línea', () => {
  const deps = (lanzar: DepsEditor['lanzar']): DepsEditor => ({
    editores: async () => [VSCODE],
    lanzar,
  });
  const sin = {};

  it('abre la carpeta del sitio y el archivo en la línea con -g', async () => {
    const base = await carpetaTemporal('pel-editor-');
    const carpeta = path.join(base, 'sitio');
    await mkdir(path.join(carpeta, 'app'), { recursive: true });
    const archivo = path.join(carpeta, 'app', 'Caja.php');
    await writeFile(archivo, '<?php\n');
    const lanzar = lanzador();
    await abrirArchivoDelSitio(carpeta, archivo, 42, sin, deps(lanzar));
    const [, args, opts] = llamada(lanzar);
    expect(args[0]).toBe(await realpath(carpeta));
    expect(args[1]).toBe('-g');
    expect(args[2]).toBe(`${await realpath(archivo)}:42`);
    expect(opts.cwd).toBe(await realpath(carpeta));
  });

  it('con otro editor usa sus argumentos y sigue exigiendo el archivo dentro del sitio', async () => {
    const base = await carpetaTemporal('pel-editor-');
    const carpeta = path.join(base, 'sitio');
    await mkdir(carpeta, { recursive: true });
    const archivo = path.join(carpeta, 'a.php');
    await writeFile(archivo, 'x');
    const fuera = path.join(base, 'secreto.txt');
    await writeFile(fuera, 'x');
    const lanzar = lanzador();
    const d: DepsEditor = { editores: async () => [VSCODE, SUBLIME], lanzar };
    await abrirArchivoDelSitio(carpeta, archivo, 3, { editor: 'sublime' }, d);
    const [cmd, args] = llamada(lanzar);
    expect(cmd).toBe(SUBLIME.ruta);
    expect(args).toEqual([`${await realpath(archivo)}:3`]);
    const otro = lanzador();
    await expect(
      abrirArchivoDelSitio(carpeta, fuera, 1, { editor: 'sublime' }, { ...d, lanzar: otro }),
    ).rejects.toMatchObject({ codigo: 'depuracion.archivo_fuera_del_sitio' });
    expect(otro).not.toHaveBeenCalled();
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
    const lanzar = lanzador();
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
      await expect(abrirArchivoDelSitio(carpeta, a, 1, sin, deps(lanzar)), a).rejects.toMatchObject(
        { codigo: expect.stringMatching(/^depuracion\./) },
      );
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
    const lanzar = lanzador();
    await expect(
      abrirArchivoDelSitio(carpeta, path.join(carpeta, 'enlace', 'x.php'), 1, sin, deps(lanzar)),
    ).rejects.toMatchObject({ codigo: 'depuracion.archivo_fuera_del_sitio' });
    expect(lanzar).not.toHaveBeenCalled();
  });

  it('la línea debe ser un entero positivo', async () => {
    const lanzar = lanzador();
    for (const l of [0, -1, 1.5, Number.NaN, 1e9]) {
      await expect(
        abrirArchivoDelSitio('C:/x', 'C:/x/a.php', l, sin, deps(lanzar)),
      ).rejects.toThrow();
    }
  });
});

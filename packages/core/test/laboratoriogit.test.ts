import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PARAMETROS_ERROR } from '../src/errores';
import { Git } from '../src/git/git';
import {
  ARCHIVOS_LABORATORIO,
  LaboratorioGit,
  validarOrden,
  type EjecutarGit,
  type OpcionesLaboratorio,
} from '../src/git/laboratorio';

// Laboratorio de práctica de Git (D50). Todo en carpetas temporales; nunca se ejecuta git en el repo del proyecto.
// Cada prueba con git real lanza muchos procesos: con la máquina cargada necesita más de 5 s.
vi.setConfig({ testTimeout: 60_000 });
const rutaGit = new Git().buscar('git');
const hayGit = rutaGit !== null;

let base: string;
let raiz: string;
beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-labgit-'));
  raiz = path.join(base, 'laboratorio-git');
});
afterEach(() => rmSync(base, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

interface Llamada {
  cmd: string;
  args: string[];
  cwd?: string;
  env: Record<string, string>;
}
function falso(salida = ''): { ejecutar: EjecutarGit; llamadas: Llamada[] } {
  const llamadas: Llamada[] = [];
  return {
    llamadas,
    ejecutar: async (cmd, args, o) => {
      llamadas.push({ cmd, args, cwd: o.cwd, env: o.env });
      return {
        codigo: 0,
        stdout: args.includes('--version') ? 'git version 2.45.1' : salida,
        stderr: '',
      };
    },
  };
}
const crear = (f: ReturnType<typeof falso>): LaboratorioGit =>
  new LaboratorioGit({
    raiz,
    buscarGit: () => 'C:\\git\\git.exe',
    ejecutar: f.ejecutar,
    entorno: {
      PATH: '/bin',
      SystemRoot: 'C:\\Windows',
      GIT_DIR: '/real/.git',
      GIT_WORK_TREE: '/real',
      GIT_CONFIG_GLOBAL: '/home/real/.gitconfig',
      GIT_SSH_COMMAND: 'ssh -i clave',
      HOME: '/home/real',
      USERPROFILE: 'C:\\Users\\real',
      GH_TOKEN: 'no-debe-pasar',
    },
  });

describe('validarOrden (lista cerrada y argumentos validados)', () => {
  it('acepta las órdenes de la lista', () => {
    for (const o of [
      { cmd: 'init' },
      { cmd: 'status' },
      { cmd: 'add', archivo: 'notas.txt' },
      { cmd: 'add', archivo: 'todo' },
      { cmd: 'commit', mensaje: 'Primer commit' },
      { cmd: 'log' },
      { cmd: 'diff' },
      { cmd: 'diff', preparado: true },
      { cmd: 'branch' },
      { cmd: 'branch', nombre: 'rama-a' },
      { cmd: 'switch', nombre: 'feature/x', crear: true },
      { cmd: 'merge', nombre: 'rama-a' },
      { cmd: 'merge', abortar: true },
      { cmd: 'stash', accion: 'push' },
      { cmd: 'restore', archivo: 'lista.txt', preparado: true },
      { cmd: 'reset-soft' },
      { cmd: 'revert' },
      { cmd: 'remote', accion: 'add' },
      { cmd: 'remote', accion: 'ver' },
      { cmd: 'fetch' },
      { cmd: 'pull' },
      { cmd: 'push' },
      { cmd: 'push', etiquetas: true },
      { cmd: 'tag' },
      { cmd: 'tag', nombre: 'v1.0' },
    ]) {
      expect(() => validarOrden(o), JSON.stringify(o)).not.toThrow();
    }
  });
  it('rechaza órdenes ajenas, nombres peligrosos, mensajes con - y archivos libres', () => {
    const malas: unknown[] = [
      null,
      'status',
      {},
      { cmd: 'clone' },
      { cmd: 'config' },
      { cmd: 'reset' },
      { cmd: 'push', force: true },
      { cmd: 'switch', nombre: '--detach' },
      { cmd: 'switch', nombre: '-x' },
      { cmd: 'branch', nombre: 'a b' },
      { cmd: 'branch', nombre: 'a..b' },
      { cmd: 'branch', nombre: 'a.lock' },
      { cmd: 'branch', nombre: '../x' },
      { cmd: 'branch', nombre: 'a;rm' },
      { cmd: 'merge', nombre: '' },
      { cmd: 'merge' },
      { cmd: 'tag', nombre: '-d' },
      { cmd: 'tag', nombre: 'v1..2' },
      { cmd: 'commit', mensaje: '--amend' },
      { cmd: 'commit', mensaje: ' -m' },
      { cmd: 'commit', mensaje: '' },
      { cmd: 'commit', mensaje: 'a\nb' },
      { cmd: 'commit', mensaje: 'x'.repeat(201) },
      { cmd: 'commit' },
      { cmd: 'add', archivo: '../x' },
      { cmd: 'add', archivo: '-A' },
      { cmd: 'add', archivo: 'otro.txt' },
      { cmd: 'restore', archivo: '.git/config' },
      { cmd: 'stash', accion: 'drop' },
      { cmd: 'remote', accion: 'add', url: 'x' },
      { cmd: 'push', etiquetas: 'si' },
    ];
    for (const o of malas) expect(() => validarOrden(o), JSON.stringify(o)).toThrow();
  });
  it('los códigos de error nuevos están declarados', () => {
    for (const c of [
      'laboratoriogit.sin_git',
      'laboratoriogit.orden_invalida',
      'laboratoriogit.ruta_insegura',
    ])
      expect(c in PARAMETROS_ERROR, c).toBe(true);
  });
});

describe('entorno y argumentos de cada ejecución', () => {
  it('aísla la configuración: HOME, USERPROFILE y GIT_CONFIG_GLOBAL en el laboratorio, sin hooks ni red', async () => {
    const f = falso('ok');
    const lab = crear(f);
    await lab.ejecutar({ cmd: 'status' });
    const l = f.llamadas.find((x) => x.args.includes('status'))!;
    expect(l.cmd).toBe('C:\\git\\git.exe');
    const dentro = (p: string): boolean =>
      path.resolve(p).startsWith(path.resolve(raiz) + path.sep);
    expect(dentro(l.env.GIT_CONFIG_GLOBAL!)).toBe(true);
    expect(dentro(l.env.HOME!)).toBe(true);
    expect(dentro(l.env.USERPROFILE!)).toBe(true);
    expect(l.env.GIT_CONFIG_NOSYSTEM).toBe('1');
    expect(l.env.GIT_TERMINAL_PROMPT).toBe('0');
    expect(l.env.GIT_ASKPASS).toBe('');
    expect(l.env.GIT_DIR).toBeUndefined();
    expect(l.env.GIT_WORK_TREE).toBeUndefined();
    expect(l.env.GIT_SSH_COMMAND).toBeUndefined();
    expect(l.env.GH_TOKEN).toBeUndefined();
    expect(l.env.PATH).toBe('/bin');
    expect(dentro(l.cwd!)).toBe(true);
    const a = l.args.join(' ');
    for (const c of [
      'user.name=Practica',
      'user.email=practica@ejemplo.invalid',
      'protocol.allow=never',
      'protocol.file.allow=always',
      'core.fsmonitor=false',
      'credential.helper=',
    ])
      expect(a, c).toContain(`-c ${c}`);
    const hooks = /-c core\.hooksPath=(\S+)/.exec(a)![1]!;
    expect(dentro(hooks)).toBe(true);
    expect(existsSync(hooks)).toBe(true);
  });
  it('init y commit usan argumentos fijos; el mensaje va como un único argumento', async () => {
    const f = falso();
    const lab = crear(f);
    await lab.ejecutar({ cmd: 'commit', mensaje: 'Un mensaje con espacios; y "comillas"' });
    const l = f.llamadas.find((x) => x.args.includes('commit'))!;
    const i = l.args.indexOf('commit');
    expect(l.args.slice(i)).toEqual(['commit', '-m', 'Un mensaje con espacios; y "comillas"']);
    await lab.ejecutar({ cmd: 'add', archivo: 'notas.txt' });
    const a = f.llamadas.find((x) => x.args.includes('add'))!;
    expect(a.args.slice(a.args.indexOf('add'))).toEqual(['add', '--', 'notas.txt']);
  });
  it('sin git en el sistema: estado vacío y las órdenes dan un error claro', async () => {
    const lab = new LaboratorioGit({ raiz, buscarGit: () => null, ejecutar: falso().ejecutar });
    expect(await lab.estado()).toMatchObject({ disponible: false, existe: false, archivos: [] });
    await expect(lab.ejecutar({ cmd: 'status' })).rejects.toMatchObject({
      codigo: 'laboratoriogit.sin_git',
    });
    expect(existsSync(raiz)).toBe(false);
  });
  it('escribirArchivo solo acepta archivos predefinidos y texto acotado', async () => {
    const lab = crear(falso());
    await lab.escribirArchivo('notas.txt', 'hola\n');
    expect(readFileSync(path.join(raiz, 'trabajo', 'notas.txt'), 'utf8')).toBe('hola\n');
    for (const id of ['../fuera.txt', '.git/config', 'otro.txt'])
      await expect(lab.escribirArchivo(id, 'x')).rejects.toMatchObject({
        codigo: 'laboratoriogit.archivo_invalido',
      });
    await expect(lab.escribirArchivo('notas.txt', 'x'.repeat(2001))).rejects.toMatchObject({
      codigo: 'laboratoriogit.contenido_invalido',
    });
    await expect(lab.escribirArchivo('notas.txt', 'a\0b')).rejects.toMatchObject({
      codigo: 'laboratoriogit.contenido_invalido',
    });
    expect(ARCHIVOS_LABORATORIO).toContain('notas.txt');
  });
  it('recorta y limpia la salida (sin ANSI)', async () => {
    const lab = crear(falso('\u001b[31mrojo\u001b[0m\n' + 'x\n'.repeat(5000)));
    const r = await lab.ejecutar({ cmd: 'status' });
    expect(r.salida).not.toContain('\u001b');
    expect(r.salida.length).toBeLessThan(8200);
    expect(r.truncada).toBe(true);
  });
});

describe('reiniciar borra solo el laboratorio', () => {
  it('quita la carpeta y la prepara de nuevo; no toca vecinos', async () => {
    const lab = crear(falso());
    await lab.estado();
    writeFileSync(path.join(base, 'vecino.txt'), 'no tocar');
    writeFileSync(path.join(raiz, 'trabajo', 'extra.txt'), 'se va');
    await lab.reiniciar();
    expect(existsSync(path.join(raiz, 'trabajo', 'extra.txt'))).toBe(false);
    expect(readFileSync(path.join(base, 'vecino.txt'), 'utf8')).toBe('no tocar');
  });
  it('se niega si la carpeta no es del laboratorio (sin marca)', async () => {
    mkdirSync(raiz);
    writeFileSync(path.join(raiz, 'ajeno.txt'), 'mío');
    const lab = crear(falso());
    await expect(lab.reiniciar()).rejects.toMatchObject({ codigo: 'laboratoriogit.ruta_insegura' });
    expect(existsSync(path.join(raiz, 'ajeno.txt'))).toBe(true);
  });
  it('si la raíz es una unión/enlace, no la sigue ni borra su destino', async () => {
    const destino = path.join(base, 'destino');
    mkdirSync(destino);
    writeFileSync(path.join(destino, 'dato.txt'), 'intacto');
    writeFileSync(path.join(destino, '.wolfcore-laboratorio'), 'laboratorio-git');
    try {
      symlinkSync(destino, raiz, 'junction');
    } catch {
      return; // sin permiso para crear enlaces
    }
    const lab = crear(falso());
    await expect(lab.reiniciar()).rejects.toMatchObject({ codigo: 'laboratoriogit.ruta_insegura' });
    await expect(lab.ejecutar({ cmd: 'status' })).rejects.toMatchObject({
      codigo: 'laboratoriogit.ruta_insegura',
    });
    expect(readFileSync(path.join(destino, 'dato.txt'), 'utf8')).toBe('intacto');
  });
  it('un enlace dentro del laboratorio se quita sin borrar su destino', async () => {
    const lab = crear(falso());
    await lab.estado();
    const fuera = path.join(base, 'fuera');
    mkdirSync(fuera);
    writeFileSync(path.join(fuera, 'dato.txt'), 'intacto');
    try {
      symlinkSync(fuera, path.join(raiz, 'trabajo', 'enlace'), 'junction');
    } catch {
      return;
    }
    await lab.reiniciar();
    expect(readFileSync(path.join(fuera, 'dato.txt'), 'utf8')).toBe('intacto');
  });
});

describe.skipIf(!hayGit)('con git real', () => {
  const lab = (extra: Partial<OpcionesLaboratorio> = {}): LaboratorioGit =>
    new LaboratorioGit({ raiz, buscarGit: () => rutaGit, ...extra });
  type Orden = Parameters<LaboratorioGit['ejecutar']>[0];

  it('init, commit, rama, merge y push al remoto local; el autor es Practica aunque exista un ~/.gitconfig ajeno', async () => {
    const hogar = path.join(base, 'hogar-ajeno');
    mkdirSync(hogar);
    writeFileSync(
      path.join(hogar, '.gitconfig'),
      '[user]\n\tname = Intruso\n\temail = intruso@real.example\n',
    );
    const l = lab({
      entorno: {
        ...process.env,
        HOME: hogar,
        USERPROFILE: hogar,
        GIT_DIR: path.join(base, 'no-existe'),
      },
    });
    const est = await l.estado();
    expect(est.disponible).toBe(true);
    expect(est.existe).toBe(true);
    const ok = async (o: Orden) => {
      const r = await l.ejecutar(o);
      expect(r.codigo, `${r.orden}\n${r.salida}`).toBe(0);
      return r;
    };
    await ok({ cmd: 'init' });
    await ok({ cmd: 'add', archivo: 'todo' });
    await ok({ cmd: 'commit', mensaje: 'Primer commit' });
    await ok({ cmd: 'switch', nombre: 'rama-a', crear: true });
    await l.escribirArchivo('notas.txt', 'cambio en rama-a\n');
    await ok({ cmd: 'add', archivo: 'notas.txt' });
    await ok({ cmd: 'commit', mensaje: 'Cambio en rama-a' });
    await ok({ cmd: 'switch', nombre: 'main' });
    await ok({ cmd: 'merge', nombre: 'rama-a' });
    await ok({ cmd: 'remote', accion: 'add' });
    await ok({ cmd: 'push' });
    await ok({ cmd: 'tag', nombre: 'v1.0' });
    const rlog = await ok({ cmd: 'log' });
    expect(rlog.salida).toContain('Cambio en rama-a');
    expect(rlog.grafo).toContain('Primer commit');
    const autor = execFileSync(
      rutaGit!,
      ['-C', path.join(raiz, 'trabajo'), 'log', '-1', '--format=%an <%ae>'],
      {
        encoding: 'utf8',
        env: {
          PATH: process.env.PATH ?? '',
          SystemRoot: process.env.SystemRoot ?? '',
          HOME: path.join(base, 'otro'),
        },
      },
    ).trim();
    expect(autor).toBe('Practica <practica@ejemplo.invalid>');
    const remoto = execFileSync(
      rutaGit!,
      ['--git-dir', path.join(raiz, 'remoto.git'), 'log', '--oneline', 'main'],
      { encoding: 'utf8' },
    );
    expect(remoto).toContain('Cambio en rama-a');
    expect(readFileSync(path.join(raiz, 'gitconfig-global'), 'utf8')).not.toContain('Intruso');
  });

  it('un hook del repositorio no se ejecuta', async () => {
    const l = lab();
    await l.estado();
    await l.ejecutar({ cmd: 'init' });
    const hooks = path.join(raiz, 'trabajo', '.git', 'hooks');
    mkdirSync(hooks, { recursive: true });
    const marca = path.join(base, 'hook-corrio').replace(/\\/g, '/');
    writeFileSync(path.join(hooks, 'pre-commit'), `#!/bin/sh\necho x > "${marca}"\nexit 1\n`);
    await l.ejecutar({ cmd: 'add', archivo: 'todo' });
    const r = await l.ejecutar({ cmd: 'commit', mensaje: 'Con hook' });
    expect(r.codigo).toBe(0);
    expect(existsSync(path.join(base, 'hook-corrio'))).toBe(false);
  });

  it('conflicto guiado: dos ramas cambian la misma línea, merge falla, se elige y se confirma', async () => {
    const l = lab();
    await l.estado();
    const run = (o: Orden) => l.ejecutar(o);
    await run({ cmd: 'init' });
    await run({ cmd: 'add', archivo: 'todo' });
    await run({ cmd: 'commit', mensaje: 'Base' });
    await run({ cmd: 'switch', nombre: 'rama-a', crear: true });
    await l.escribirArchivo('colores.txt', 'color: rojo\n');
    await run({ cmd: 'add', archivo: 'colores.txt' });
    await run({ cmd: 'commit', mensaje: 'Rojo' });
    await run({ cmd: 'switch', nombre: 'main' });
    await l.escribirArchivo('colores.txt', 'color: verde\n');
    await run({ cmd: 'add', archivo: 'colores.txt' });
    await run({ cmd: 'commit', mensaje: 'Verde' });
    const m = await run({ cmd: 'merge', nombre: 'rama-a' });
    expect(m.codigo).not.toBe(0);
    expect(m.salida).toMatch(/CONFLICT/);
    expect(m.salida).not.toMatch(/Command failed|--no-pager/);
    expect((await l.leerArchivo('colores.txt')).contenido).toContain('<<<<<<<');
    await l.escribirArchivo('colores.txt', 'color: rojo\n');
    await run({ cmd: 'add', archivo: 'colores.txt' });
    const c = await run({ cmd: 'commit', mensaje: 'Resolver conflicto' });
    expect(c.codigo).toBe(0);
    expect(c.grafo).toMatch(/Resolver conflicto/);
  });

  it('cada subcomando de la lista funciona', async () => {
    const l = lab();
    await l.estado();
    const ok = async (o: Orden) => {
      const r = await l.ejecutar(o);
      expect(r.codigo, `${r.orden}\n${r.salida}`).toBe(0);
    };
    await ok({ cmd: 'init' });
    await ok({ cmd: 'status' });
    await ok({ cmd: 'add', archivo: 'todo' });
    await ok({ cmd: 'diff', preparado: true });
    await ok({ cmd: 'commit', mensaje: 'Uno' });
    await l.escribirArchivo('lista.txt', 'otra cosa\n');
    await ok({ cmd: 'diff' });
    await ok({ cmd: 'stash', accion: 'push' });
    await ok({ cmd: 'stash', accion: 'list' });
    await ok({ cmd: 'stash', accion: 'pop' });
    await ok({ cmd: 'restore', archivo: 'lista.txt' });
    await l.escribirArchivo('lista.txt', 'otra cosa\n');
    await ok({ cmd: 'add', archivo: 'lista.txt' });
    await ok({ cmd: 'restore', archivo: 'lista.txt', preparado: true });
    await ok({ cmd: 'restore', archivo: 'lista.txt' });
    await ok({ cmd: 'branch', nombre: 'otra' });
    await ok({ cmd: 'branch' });
    await ok({ cmd: 'switch', nombre: 'otra' });
    await ok({ cmd: 'switch', nombre: 'main' });
    await l.escribirArchivo('notas.txt', 'dos\n');
    await ok({ cmd: 'add', archivo: 'notas.txt' });
    await ok({ cmd: 'commit', mensaje: 'Dos' });
    await ok({ cmd: 'revert' });
    await ok({ cmd: 'reset-soft' });
    await ok({ cmd: 'commit', mensaje: 'Tres' });
    await ok({ cmd: 'remote', accion: 'add' });
    await ok({ cmd: 'remote', accion: 'ver' });
    await ok({ cmd: 'push' });
    await ok({ cmd: 'tag', nombre: 'v1' });
    await ok({ cmd: 'tag' });
    await ok({ cmd: 'push', etiquetas: true });
    await ok({ cmd: 'fetch' });
    await ok({ cmd: 'pull' });
  });

  it('push sin remoto configurado falla con un mensaje, sin red ni preguntas', async () => {
    const l = lab();
    await l.estado();
    await l.ejecutar({ cmd: 'init' });
    const r = await l.ejecutar({ cmd: 'push' });
    expect(r.codigo).not.toBe(0);
  });
});

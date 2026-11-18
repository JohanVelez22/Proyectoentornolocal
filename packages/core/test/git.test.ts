import { spawnSync } from 'node:child_process';
import { lookup } from 'node:dns/promises';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Git, MENSAJE_CAMBIOS_LOCALES, MENSAJE_DIVERGENCIA, validarUrlGit } from '../src/git/git';
import type { Ejecutor, Lanzador, OpcionesLanzar } from '../src/plataforma/tipos';
import { carpetaTemporal } from './temporales';

const TOKEN = 'ghp_TokenDePruebaMuySecreto1234567890';
const BASIC = Buffer.from(`x-access-token:${TOKEN}`).toString('base64');

interface Llamada {
  cmd: string;
  args: string[];
  opts?: { cwd?: string; env?: Record<string, string> };
}

/** Ejecutor falso: responde según el subcomando de git (args unidos por espacios). */
function ejecutorFalso(
  respuestas: Record<string, { codigo?: number; stdout?: string; stderr?: string }>,
  llamadas: Llamada[] = [],
): Ejecutor {
  return async (cmd, args, opts) => {
    llamadas.push({ cmd, args, opts });
    const clave = args.join(' ');
    const r = Object.entries(respuestas).find(([k]) => clave.includes(k))?.[1];
    return { codigo: r?.codigo ?? 0, stdout: r?.stdout ?? '', stderr: r?.stderr ?? '' };
  };
}

/** Lanzador falso: emite las líneas dadas y devuelve el código; puede crear archivos. */
function lanzadorFalso(
  lineas: string[],
  codigo: number,
  llamadas: { cmd: string; args: string[]; opts?: OpcionesLanzar }[],
  efecto?: (args: string[]) => void,
): Lanzador {
  return async (cmd, args, opts) => {
    llamadas.push({ cmd, args, opts });
    efecto?.(args);
    for (const l of lineas) opts?.alLinea?.(l, 'stderr');
    return { codigo };
  };
}

const sinRutas = { existe: () => false, entorno: { Path: '' } };

describe('validarUrlGit', () => {
  it('acepta https, git@ y owner/name', () => {
    expect(validarUrlGit('https://github.com/a/b.git')).toEqual({ tipo: 'url' });
    expect(validarUrlGit('git@github.com:a/b.git')).toEqual({ tipo: 'url' });
    expect(validarUrlGit('dueno/repo-1.x')).toEqual({ tipo: 'gh' });
  });

  it.each([
    'file:///C:/repo',
    'ext::sh -c calc',
    '-uhttps://github.com/a/b',
    '--upload-pack=calc',
    'http://github.com/a/b',
    'https://usuario:clave@github.com/a/b',
    'https://github.com/a/b c',
    'git@github.com:a/b\nx',
    'dueno/..',
    'a/b/c',
    '',
  ])('rechaza %j', (url) => {
    expect(() => validarUrlGit(url)).toThrow();
  });
});

describe('Git.clonar con un ejecutor falso', () => {
  it('con token: el token no está en args, URL ni salida; va por GIT_CONFIG_*', async () => {
    const dir = await carpetaTemporal('pel-git-');
    const destino = path.join(dir, 'repo');
    const llamadas: { cmd: string; args: string[]; opts?: OpcionesLanzar }[] = [];
    const progreso: string[] = [];
    const git = new Git({
      ...sinRutas,
      lanzar: lanzadorFalso(
        [
          `Cloning into 'repo'... ${TOKEN}`,
          `Authorization: Basic ${BASIC}`,
          'Receiving 1%\rReceiving 100%',
        ],
        0,
        llamadas,
      ),
    });
    await git.clonar('https://github.com/dueno/privado.git', destino, {
      token: TOKEN,
      alProgreso: (l) => progreso.push(l),
    });
    expect(llamadas).toHaveLength(1);
    const { cmd, args, opts } = llamadas[0]!;
    expect(cmd).toBe('git');
    expect(args).toEqual([
      'clone',
      '--progress',
      '--',
      'https://github.com/dueno/privado.git',
      destino,
    ]);
    expect(args.join(' ')).not.toContain(TOKEN);
    expect(args.join(' ')).not.toContain(BASIC);
    const env = opts!.env!;
    expect(env.GIT_TERMINAL_PROMPT).toBe('0');
    expect(env.GIT_CONFIG_COUNT).toBe('2');
    expect(env.GIT_CONFIG_KEY_0).toBe('credential.helper');
    expect(env.GIT_CONFIG_VALUE_0).toBe('');
    expect(env.GIT_CONFIG_KEY_1).toBe('http.https://github.com/.extraHeader');
    expect(env.GIT_CONFIG_VALUE_1).toBe(`Authorization: Basic ${BASIC}`);
    expect(progreso.join('\n')).not.toContain(TOKEN);
    expect(progreso.join('\n')).not.toContain(BASIC);
    expect(progreso).toContain('Receiving 100%');
  });

  it('sin token no agrega cabeceras ni toca credential.helper', async () => {
    const dir = await carpetaTemporal('pel-git-');
    const llamadas: { cmd: string; args: string[]; opts?: OpcionesLanzar }[] = [];
    const git = new Git({ ...sinRutas, lanzar: lanzadorFalso([], 0, llamadas) });
    await git.clonar('git@github.com:dueno/repo.git', path.join(dir, 'r'));
    const env = llamadas[0]!.opts!.env!;
    expect(env.GIT_TERMINAL_PROMPT).toBe('0');
    expect(env.GIT_CONFIG_COUNT).toBeUndefined();
  });

  it('no manda el token a un host que no es github.com', async () => {
    const dir = await carpetaTemporal('pel-git-');
    const llamadas: { cmd: string; args: string[]; opts?: OpcionesLanzar }[] = [];
    const git = new Git({ ...sinRutas, lanzar: lanzadorFalso([], 0, llamadas) });
    await git.clonar('https://gitlab.com/dueno/repo.git', path.join(dir, 'r'), { token: TOKEN });
    expect(JSON.stringify(llamadas)).not.toContain(BASIC);
    expect(JSON.stringify(llamadas)).not.toContain(TOKEN);
  });

  it('owner/name se clona con gh repo clone (token por GH_TOKEN, nunca en args)', async () => {
    const dir = await carpetaTemporal('pel-git-');
    const destino = path.join(dir, 'repo');
    const llamadas: { cmd: string; args: string[]; opts?: OpcionesLanzar }[] = [];
    const git = new Git({ ...sinRutas, lanzar: lanzadorFalso([], 0, llamadas) });
    await git.clonar('dueno/repo', destino, { token: TOKEN });
    expect(llamadas[0]!.cmd).toBe('gh');
    expect(llamadas[0]!.args).toEqual(['repo', 'clone', 'dueno/repo', destino, '--', '--progress']);
    expect(llamadas[0]!.args.join(' ')).not.toContain(TOKEN);
    expect(llamadas[0]!.opts!.env!.GH_TOKEN).toBe(TOKEN);
    expect(llamadas[0]!.opts!.env!.GH_PROMPT_DISABLED).toBe('1');
  });

  it('rechaza un destino que no está vacío sin lanzar nada', async () => {
    const dir = await carpetaTemporal('pel-git-');
    writeFileSync(path.join(dir, 'x.txt'), 'x');
    const llamadas: { cmd: string; args: string[]; opts?: OpcionesLanzar }[] = [];
    const git = new Git({ ...sinRutas, lanzar: lanzadorFalso([], 0, llamadas) });
    await expect(git.clonar('https://github.com/a/b', dir)).rejects.toThrow(/no está vacía/);
    expect(llamadas).toHaveLength(0);
    expect(existsSync(path.join(dir, 'x.txt'))).toBe(true);
  });

  it('si falla borra solo lo que creó el clon y el error no lleva el token', async () => {
    const dir = await carpetaTemporal('pel-git-');
    const vacia = path.join(dir, 'vacia');
    mkdirSync(vacia);
    const nueva = path.join(dir, 'a', 'b', 'repo');
    const crear = (args: string[]): void => {
      const d = args[args.length - 1]!;
      mkdirSync(path.join(d, '.git'), { recursive: true });
      writeFileSync(path.join(d, '.git', 'config'), '[core]');
    };
    const falla = (): Git =>
      new Git({
        ...sinRutas,
        lanzar: lanzadorFalso([`fatal: Authentication failed ${TOKEN} ${BASIC}`], 128, [], crear),
      });
    const e1 = await falla()
      .clonar('https://github.com/a/b', vacia, { token: TOKEN })
      .catch((e: Error) => e);
    expect(e1).toBeInstanceOf(Error);
    expect((e1 as Error).message).toMatch(/No se pudo clonar/);
    expect((e1 as Error).message).not.toContain(TOKEN);
    expect((e1 as Error).message).not.toContain(BASIC);
    expect(existsSync(vacia)).toBe(true);
    expect(readdirSync(vacia)).toEqual([]);

    await expect(falla().clonar('https://github.com/a/b', nueva)).rejects.toThrow();
    expect(existsSync(path.join(dir, 'a'))).toBe(false);
    expect(existsSync(dir)).toBe(true);
  });

  it('si git no existe lo dice en claro', async () => {
    const dir = await carpetaTemporal('pel-git-');
    const git = new Git({
      ...sinRutas,
      lanzar: async () => {
        throw Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' });
      },
    });
    await expect(git.clonar('https://github.com/a/b', path.join(dir, 'r'))).rejects.toThrow(
      /No se encontró git/,
    );
  });
});

describe('Git.disponible', () => {
  it('busca en el PATH y en las rutas conocidas y lee la sesión de gh', async () => {
    const llamadas: Llamada[] = [];
    const git = new Git({
      entorno: { Path: 'C:\\otra;C:\\herr' },
      existe: (r) =>
        r === path.win32.join('C:\\herr', 'git.exe') ||
        r === path.win32.join('C:\\Program Files\\GitHub CLI', 'gh.exe'),
      exec: ejecutorFalso(
        {
          'auth status': {
            stdout:
              'github.com\n  ✓ Logged in to github.com account johan-dev (keyring)\n  - Token: gho_****\n',
          },
        },
        llamadas,
      ),
    });
    const d = await git.disponible();
    expect(d).toEqual({
      git: path.win32.join('C:\\herr', 'git.exe'),
      gh: path.win32.join('C:\\Program Files\\GitHub CLI', 'gh.exe'),
      ghSesion: true,
      usuario: 'johan-dev',
    });
    expect(llamadas[0]!.args).toEqual(['auth', 'status', '--hostname', 'github.com']);
  });

  it('sin gh: ghSesion falso y no llama a nada', async () => {
    const llamadas: Llamada[] = [];
    const git = new Git({ ...sinRutas, exec: ejecutorFalso({}, llamadas) });
    expect(await git.disponible()).toEqual({ git: null, gh: null, ghSesion: false });
    expect(llamadas).toHaveLength(0);
  });

  it('gh sin sesión', async () => {
    const git = new Git({
      entorno: { Path: 'C:\\gh' },
      existe: (r) => r === path.win32.join('C:\\gh', 'gh.exe'),
      exec: ejecutorFalso({ 'auth status': { codigo: 1, stderr: 'You are not logged in' } }),
    });
    expect(await git.disponible()).toMatchObject({ ghSesion: false, gh: expect.any(String) });
  });
});

const statusV2 = (o: { ab?: string; upstream?: boolean; entradas?: string[]; head?: string }) =>
  [
    '# branch.oid abc',
    `# branch.head ${o.head ?? 'main'}`,
    ...(o.upstream === false
      ? []
      : ['# branch.upstream origin/main', `# branch.ab ${o.ab ?? '+0 -0'}`]),
    ...(o.entradas ?? []),
  ].join('\n');

describe('Git.estado', () => {
  it('lee rama, cambios, adelante/atrás y el remoto sin credenciales', async () => {
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso({
        'status --porcelain=v2': {
          stdout: statusV2({
            ab: '+2 -3',
            entradas: ['1 .M N... 100644 100644 100644 a b x.php', '? nuevo.txt'],
          }),
        },
        'remote get-url origin': { stdout: 'https://usuario:ghp_xx@github.com/a/b.git\n' },
      }),
    });
    expect(await git.estado('C:\\p')).toEqual({
      rama: 'main',
      cambiosLocales: 2,
      adelante: 2,
      atras: 3,
      remoto: 'https://github.com/a/b.git',
    });
  });

  it('sin remoto ni upstream y con HEAD suelto', async () => {
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso({
        'status --porcelain=v2': { stdout: statusV2({ upstream: false, head: '(detached)' }) },
        'remote get-url origin': { codigo: 2, stderr: 'error: No such remote' },
      }),
    });
    expect(await git.estado('C:\\p')).toEqual({
      rama: null,
      cambiosLocales: 0,
      adelante: 0,
      atras: 0,
      remoto: null,
    });
  });

  it('una carpeta que no es repositorio da un error claro', async () => {
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso({ status: { codigo: 128, stderr: 'fatal: not a git repository' } }),
    });
    await expect(git.estado('C:\\p')).rejects.toThrow(/no es un repositorio/i);
  });
});

describe('Git.traerCambios con un ejecutor falso', () => {
  const tocaArbol = (ll: Llamada[]): boolean =>
    ll.some((l) => ['merge', 'pull', 'reset', 'checkout', 'rebase', 'stash'].includes(l.args[0]!));

  it('con cambios locales no hace fetch ni toca nada', async () => {
    const llamadas: Llamada[] = [];
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso(
        {
          'status --porcelain=v2': {
            stdout: statusV2({ entradas: ['1 .M N... 1 1 1 a b x.php'] }),
          },
        },
        llamadas,
      ),
    });
    await expect(git.traerCambios('C:\\p')).rejects.toThrow(MENSAJE_CAMBIOS_LOCALES);
    expect(llamadas.some((l) => l.args[0] === 'fetch')).toBe(false);
    expect(tocaArbol(llamadas)).toBe(false);
  });

  it('con la rama divergida no toca nada', async () => {
    const llamadas: Llamada[] = [];
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso(
        { 'status --porcelain=v2': { stdout: statusV2({ ab: '+1 -2' }) } },
        llamadas,
      ),
    });
    await expect(git.traerCambios('C:\\p')).rejects.toThrow(MENSAJE_DIVERGENCIA);
    expect(llamadas.some((l) => l.args[0] === 'fetch')).toBe(true);
    expect(tocaArbol(llamadas)).toBe(false);
  });

  it('sin rama remota avisa sin tocar nada', async () => {
    const llamadas: Llamada[] = [];
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso(
        { 'status --porcelain=v2': { stdout: statusV2({ upstream: false }) } },
        llamadas,
      ),
    });
    await expect(git.traerCambios('C:\\p')).rejects.toThrow(/no sigue a ninguna rama remota/);
    expect(tocaArbol(llamadas)).toBe(false);
  });

  it('al día: no hace merge', async () => {
    const llamadas: Llamada[] = [];
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso({ 'status --porcelain=v2': { stdout: statusV2({}) } }, llamadas),
    });
    expect(await git.traerCambios('C:\\p')).toEqual({
      actualizado: false,
      cambios: { composerLock: false, packageLock: false, migraciones: [], requirements: false },
    });
    expect(tocaArbol(llamadas)).toBe(false);
  });

  it('avance rápido: merge --ff-only y detecta qué cambió', async () => {
    const llamadas: Llamada[] = [];
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso(
        {
          'status --porcelain=v2': { stdout: statusV2({ ab: '+0 -3' }) },
          'rev-parse HEAD': { stdout: 'aaa111\n' },
          diff: {
            stdout: [
              'composer.lock',
              'web/package-lock.json',
              'database/migrations/2026_11_01_000000_crear_tabla.php',
              'app/migrations/0002_auto.py',
              'requirements-dev.txt',
              'README.md',
            ].join('\n'),
          },
        },
        llamadas,
      ),
    });
    const r = await git.traerCambios('C:\\p', { token: TOKEN });
    expect(r).toEqual({
      actualizado: true,
      cambios: {
        composerLock: true,
        packageLock: true,
        migraciones: [
          'database/migrations/2026_11_01_000000_crear_tabla.php',
          'app/migrations/0002_auto.py',
        ],
        requirements: true,
      },
    });
    const merge = llamadas.find((l) => l.args[0] === 'merge')!;
    expect(merge.args).toEqual(['merge', '--ff-only', '@{upstream}']);
    const diff = llamadas.find((l) => l.args.includes('diff'))!;
    expect(diff.args.join(' ')).toContain('aaa111 HEAD');
    // fetch con el token por variable de entorno, nunca en args
    const fetch = llamadas.find((l) => l.args[0] === 'fetch')!;
    expect(fetch.args.join(' ')).not.toContain(TOKEN);
    expect(fetch.opts!.env!.GIT_TERMINAL_PROMPT).toBe('0');
  });

  it('un fallo de fetch no filtra el token', async () => {
    const git = new Git({
      ...sinRutas,
      exec: ejecutorFalso({
        'status --porcelain=v2': { stdout: statusV2({}) },
        fetch: { codigo: 128, stderr: `fatal: https://x:${TOKEN}@github.com ${BASIC}` },
      }),
    });
    const e = (await git.traerCambios('C:\\p', { token: TOKEN }).catch((x: Error) => x)) as Error;
    expect(e.message).toMatch(/No se pudieron traer/);
    expect(e.message).not.toContain(TOKEN);
    expect(e.message).not.toContain(BASIC);
  });
});

/* ───────────── Pruebas reales (git local; la de red solo con conexión) ───────────── */

const hayGit = spawnSync('git', ['--version'], { windowsHide: true }).status === 0;
const hayRed = hayGit
  ? await Promise.race([
      lookup('github.com').then(
        () => true,
        () => false,
      ),
      new Promise<boolean>((r) => setTimeout(() => r(false), 3000)),
    ])
  : false;

const correr = (cwd: string, ...args: string[]): string => {
  const r = spawnSync('git', args, { cwd, windowsHide: true, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
};

const commit = (cwd: string, archivo: string, contenido: string): void => {
  mkdirSync(path.dirname(path.join(cwd, archivo)), { recursive: true });
  writeFileSync(path.join(cwd, archivo), contenido);
  correr(cwd, 'add', '-A');
  correr(cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', archivo);
};

describe.skipIf(!hayGit)('Git real (local)', () => {
  /** Remoto bare + clon "trabajo" (el del usuario) + clon "otro" que empuja commits. */
  async function preparar(): Promise<{ trabajo: string; otro: string }> {
    const dir = await carpetaTemporal('pel-git-real-');
    const remoto = path.join(dir, 'remoto.git');
    correr(dir, 'init', '-q', '--bare', '-b', 'main', remoto);
    const otro = path.join(dir, 'otro');
    correr(dir, 'clone', '-q', remoto, otro);
    correr(otro, 'checkout', '-q', '-b', 'main');
    commit(otro, 'README.md', 'hola');
    correr(otro, 'push', '-q', '-u', 'origin', 'main');
    const trabajo = path.join(dir, 'trabajo');
    correr(dir, 'clone', '-q', remoto, trabajo);
    return { trabajo, otro };
  }

  it('GIT_CONFIG_* llega a git: el extraHeader se lee para github.com y no queda en config', async () => {
    const { trabajo } = await preparar();
    const git = new Git();
    const env = git.entornoGit(TOKEN, 'https://github.com/a/b');
    const r = spawnSync(
      'git',
      ['config', '--get-urlmatch', 'http.extraHeader', 'https://github.com/a/b'],
      { cwd: trabajo, windowsHide: true, encoding: 'utf8', env: { ...process.env, ...env } },
    );
    expect(r.stdout.trim()).toBe(`Authorization: Basic ${BASIC}`);
    const otroHost = spawnSync(
      'git',
      ['config', '--get-urlmatch', 'http.extraHeader', 'https://evil.example/a/b'],
      { cwd: trabajo, windowsHide: true, encoding: 'utf8', env: { ...process.env, ...env } },
    );
    expect(otroHost.stdout.trim()).toBe('');
    expect(readFileSync(path.join(trabajo, '.git', 'config'), 'utf8')).not.toContain(BASIC);
  });

  it('traerCambios: avance rápido detecta composer.lock y migraciones', async () => {
    const { trabajo, otro } = await preparar();
    commit(otro, 'composer.lock', '{}');
    commit(otro, 'database/migrations/2026_crear.php', '<?php');
    correr(otro, 'push', '-q');
    const git = new Git();
    const r = await git.traerCambios(trabajo);
    expect(r.actualizado).toBe(true);
    expect(r.cambios.composerLock).toBe(true);
    expect(r.cambios.migraciones).toEqual(['database/migrations/2026_crear.php']);
    expect(existsSync(path.join(trabajo, 'composer.lock'))).toBe(true);
    expect(await git.estado(trabajo)).toMatchObject({ rama: 'main', atras: 0, adelante: 0 });
  });

  it('traerCambios con cambios locales: no toca el archivo ni HEAD', async () => {
    const { trabajo, otro } = await preparar();
    commit(otro, 'composer.lock', '{}');
    correr(otro, 'push', '-q');
    writeFileSync(path.join(trabajo, 'README.md'), 'mio');
    const antes = correr(trabajo, 'rev-parse', 'HEAD');
    const git = new Git();
    await expect(git.traerCambios(trabajo)).rejects.toThrow(MENSAJE_CAMBIOS_LOCALES);
    expect(readFileSync(path.join(trabajo, 'README.md'), 'utf8')).toBe('mio');
    expect(correr(trabajo, 'rev-parse', 'HEAD')).toBe(antes);
    expect(existsSync(path.join(trabajo, 'composer.lock'))).toBe(false);
  });

  it('traerCambios con la rama divergida: no toca nada', async () => {
    const { trabajo, otro } = await preparar();
    commit(otro, 'remoto.txt', 'r');
    correr(otro, 'push', '-q');
    commit(trabajo, 'local.txt', 'l');
    const antes = correr(trabajo, 'rev-parse', 'HEAD');
    const git = new Git();
    await expect(git.traerCambios(trabajo)).rejects.toThrow(MENSAJE_DIVERGENCIA);
    expect(correr(trabajo, 'rev-parse', 'HEAD')).toBe(antes);
    expect(existsSync(path.join(trabajo, 'remoto.txt'))).toBe(false);
  });
});

describe.skipIf(!hayRed)('Git real con red', () => {
  it('clona un repositorio público pequeño en una carpeta temporal', async () => {
    const dir = await carpetaTemporal('pel-git-red-');
    const destino = path.join(dir, 'hola mundo');
    const progreso: string[] = [];
    const git = new Git();
    await git.clonar('https://github.com/octocat/Hello-World.git', destino, {
      alProgreso: (l) => progreso.push(l),
    });
    expect(existsSync(path.join(destino, 'README'))).toBe(true);
    expect(await git.estado(destino)).toMatchObject({
      remoto: 'https://github.com/octocat/Hello-World.git',
      cambiosLocales: 0,
    });
    expect(progreso.length).toBeGreaterThan(0);
    const config = readFileSync(path.join(destino, '.git', 'config'), 'utf8');
    expect(config).not.toMatch(/extraheader|Authorization/i);
  }, 120_000);

  it('con un token rechazado: falla sin colgarse, sin filtrar el token y sin dejar la carpeta', async () => {
    const dir = await carpetaTemporal('pel-git-red-');
    const destino = path.join(dir, 'repo');
    const progreso: string[] = [];
    const git = new Git();
    const e = (await git
      .clonar('https://github.com/octocat/Hello-World.git', destino, {
        token: TOKEN,
        alProgreso: (l) => progreso.push(l),
      })
      .catch((x: Error) => x)) as Error;
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toMatch(/rechazó el acceso/);
    for (const t of [e.message, ...progreso]) {
      expect(t).not.toContain(TOKEN);
      expect(t).not.toContain(BASIC);
    }
    expect(existsSync(destino)).toBe(false);
  }, 120_000);
});

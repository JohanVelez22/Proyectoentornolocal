import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GitHub, interpretarGhRepoList } from '../src/git/github';
import type { Ejecutor } from '../src/plataforma/tipos';

const TOKEN = 'ghp_TokenDePruebaMuySecreto1234567890';

const GH = path.win32.join('C:\\Program Files\\GitHub CLI', 'gh.exe');

const salidaGh = JSON.stringify([
  {
    name: 'rents',
    nameWithOwner: 'johan/rents',
    isPrivate: true,
    description: 'Alquileres',
    updatedAt: '2026-11-10T10:00:00Z',
    url: 'https://github.com/johan/rents',
  },
  {
    name: 'coffe',
    nameWithOwner: 'johan/coffe',
    isPrivate: false,
    description: null,
    updatedAt: '2026-11-12T10:00:00Z',
    url: 'https://github.com/johan/coffe',
  },
]);

describe('interpretarGhRepoList', () => {
  it('convierte la salida JSON de gh repo list', () => {
    expect(interpretarGhRepoList(salidaGh)).toEqual([
      {
        nombre: 'rents',
        completo: 'johan/rents',
        privado: true,
        descripcion: 'Alquileres',
        actualizado: '2026-11-10T10:00:00Z',
        url: 'https://github.com/johan/rents',
      },
      {
        nombre: 'coffe',
        completo: 'johan/coffe',
        privado: false,
        descripcion: '',
        actualizado: '2026-11-12T10:00:00Z',
        url: 'https://github.com/johan/coffe',
      },
    ]);
  });

  it('ignora entradas mal formadas y falla con JSON inválido', () => {
    expect(interpretarGhRepoList('[{"name":1}]')).toEqual([]);
    expect(() => interpretarGhRepoList('no es json')).toThrow();
  });
});

interface Llamada {
  cmd: string;
  args: string[];
  env?: Record<string, string>;
}

function crear(o: {
  sesion: boolean;
  gh?: boolean;
  exec?: Ejecutor;
  fetch?: typeof fetch;
  llamadas?: Llamada[];
}): GitHub {
  const llamadas = o.llamadas ?? [];
  return new GitHub({
    entorno: { Path: '' },
    existe: (r) => o.gh !== false && r === GH,
    exec:
      o.exec ??
      (async (cmd, args, opts) => {
        llamadas.push({ cmd, args, env: opts?.env });
        if (args[0] === 'auth') return { codigo: o.sesion ? 0 : 1, stdout: '', stderr: '' };
        if (args[0] === 'repo') return { codigo: 0, stdout: salidaGh, stderr: '' };
        return { codigo: 0, stdout: '', stderr: '' };
      }),
    fetch:
      o.fetch ??
      (async () => {
        throw new Error('no debería llamarse');
      }),
  });
}

describe('GitHub.repos', () => {
  it('con sesión de gh usa gh repo list --json, busca y pagina', async () => {
    const llamadas: Llamada[] = [];
    const gh = crear({ sesion: true, llamadas });
    const r = await gh.repos({ buscar: 'COF' });
    expect(r.map((x) => x.completo)).toEqual(['johan/coffe']);
    const lista = llamadas.find((l) => l.args[0] === 'repo')!;
    expect(lista.cmd).toBe(GH);
    expect(lista.args.slice(0, 2)).toEqual(['repo', 'list']);
    expect(lista.args).toContain('--json');
    expect(lista.args[lista.args.indexOf('--json') + 1]).toBe(
      'name,nameWithOwner,isPrivate,description,updatedAt,url',
    );
    expect(await gh.repos({ pagina: 2 })).toEqual([]);
  });

  it('sin sesión usa la API REST con el token en la cabecera, paginada', async () => {
    const pedidas: { url: string; auth: string | null }[] = [];
    const pagina = (n: number, desde: number) =>
      Array.from({ length: n }, (_, i) => ({
        name: `r${desde + i}`,
        full_name: `johan/r${desde + i}`,
        private: i % 2 === 0,
        description: 'd',
        updated_at: '2026-11-01T00:00:00Z',
        html_url: `https://github.com/johan/r${desde + i}`,
      }));
    const falso = (async (url: string, init?: RequestInit) => {
      pedidas.push({ url, auth: new Headers(init?.headers).get('authorization') });
      const p = Number(new URL(url).searchParams.get('page'));
      const datos = p === 1 ? pagina(100, 0) : p === 2 ? pagina(5, 100) : [];
      return new Response(JSON.stringify(datos), { status: 200 });
    }) as typeof fetch;
    const gh = crear({ sesion: false, gh: false, fetch: falso });
    const r = await gh.repos({ token: TOKEN });
    expect(r).toHaveLength(50);
    expect(r[0]).toEqual({
      nombre: 'r0',
      completo: 'johan/r0',
      privado: true,
      descripcion: 'd',
      actualizado: '2026-11-01T00:00:00Z',
      url: 'https://github.com/johan/r0',
    });
    expect((await gh.repos({ token: TOKEN, pagina: 3 })).map((x) => x.nombre)).toEqual([
      'r100',
      'r101',
      'r102',
      'r103',
      'r104',
    ]);
    expect(pedidas[0]!.url.startsWith('https://api.github.com/user/repos?')).toBe(true);
    expect(pedidas[0]!.url).not.toContain(TOKEN);
    expect(pedidas[0]!.auth).toBe(`Bearer ${TOKEN}`);
  });

  it('un token rechazado da un error claro sin el token', async () => {
    const falso = (async () =>
      new Response(JSON.stringify({ message: `Bad credentials ${TOKEN}` }), {
        status: 401,
      })) as typeof fetch;
    const gh = crear({ sesion: false, gh: false, fetch: falso });
    const e = (await gh.repos({ token: TOKEN }).catch((x: Error) => x)) as Error;
    expect(e.message).toMatch(/no es válido/);
    expect(e.message).not.toContain(TOKEN);
  });

  it('un token con caracteres raros se rechaza antes de usarlo', async () => {
    const gh = crear({ sesion: false, gh: false });
    const e = (await gh.repos({ token: 'abc\r\nX-Otra: 1' }).catch((x: Error) => x)) as Error;
    expect(e.message).toMatch(/no es válido/);
    expect(e.message).not.toContain('X-Otra');
  });

  it('sin sesión ni token pide conectar GitHub', async () => {
    const gh = crear({ sesion: false });
    await expect(gh.repos()).rejects.toThrow(/Conecte GitHub/);
  });
});

describe('GitHub.instalarGh e iniciarSesionGh', () => {
  it('instalarGh usa winget con el id exacto', async () => {
    const llamadas: Llamada[] = [];
    const gh = new GitHub({
      entorno: { Path: '' },
      existe: () => false,
      exec: async (cmd, args) => {
        llamadas.push({ cmd, args });
        return { codigo: 0, stdout: '', stderr: '' };
      },
    });
    await gh.instalarGh();
    expect(llamadas[0]!.cmd).toBe('winget');
    expect(llamadas[0]!.args.slice(0, 4)).toEqual(['install', '--id', 'GitHub.cli', '-e']);
  });

  it('iniciarSesionGh abre gh auth login --web en una terminal visible', async () => {
    const lanzadas: { cmd: string; args: string[] }[] = [];
    const gh = new GitHub({
      entorno: { Path: '', USERPROFILE: 'C:\\Users\\Jóhan O’Neil' },
      existe: (r) => r === GH,
      lanzarSeparado: async (cmd, args) => {
        lanzadas.push({ cmd, args });
      },
    });
    await gh.iniciarSesionGh();
    expect(lanzadas).toHaveLength(1);
    expect(lanzadas[0]!.cmd).toBe('powershell.exe');
    const comando = lanzadas[0]!.args.join(' ');
    expect(comando).toContain('-NoExit');
    expect(comando).toContain("'C:\\Program Files\\GitHub CLI\\gh.exe'");
    expect(comando).toContain('auth login --web');
  });

  it('iniciarSesionGh sin gh instalado avisa', async () => {
    const gh = new GitHub({ entorno: { Path: '' }, existe: () => false });
    await expect(gh.iniciarSesionGh()).rejects.toThrow(/GitHub CLI/);
  });
});

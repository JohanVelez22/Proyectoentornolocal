import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import {
  catalogo,
  CatalogoSchema,
  ejecutableDe,
  listarVersiones,
  urlOficial,
} from '../src/catalogo/catalogo';
import { Terminal } from '../src/herramientas/terminal';
import { Runtimes, elegirVersion } from '../src/runtimes/runtimes';
import { Rutas } from '../src/rutas';

let base: string;
let rutas: Rutas;
beforeEach(async () => {
  base = await carpetaTemporal('pel-rt-');
  rutas = new Rutas(base);
});

const instalar = (tipo: 'node' | 'python', version: string): void => {
  const d = rutas.bin(tipo, version);
  mkdirSync(d, { recursive: true });
  writeFileSync(path.join(d, tipo === 'node' ? 'node.exe' : 'python.exe'), 'x');
};
const proyecto = async (archivos: Record<string, string>): Promise<string> => {
  const c = await carpetaTemporal('pel-proy-');
  for (const [n, t] of Object.entries(archivos)) writeFileSync(path.join(c, n), t);
  return c;
};

describe('catálogo de runtimes', () => {
  it('node y python pasan el esquema y la lista de hosts', async () => {
    expect(() => CatalogoSchema.parse(JSON.parse(JSON.stringify(catalogo)))).not.toThrow();
    expect(catalogo.node.length).toBe(2);
    expect(catalogo.python.map((e) => e.version.split('.').slice(0, 2).join('.'))).toEqual([
      '3.13',
      '3.12',
    ]);
    for (const e of [...catalogo.node, ...catalogo.python]) {
      expect(urlOficial(e.url)).toBe(true);
      expect(e.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(e.formato).toBe('zip');
    }
    for (const e of catalogo.node) {
      expect(e.ejecutable).toBe('node.exe');
      expect(e.subcarpeta).toBe(`node-v${e.version}-win-x64`);
      expect(e.url).toBe(`https://nodejs.org/dist/v${e.version}/node-v${e.version}-win-x64.zip`);
    }
    for (const e of catalogo.python) {
      expect(e.ejecutable).toBe('python.exe');
      expect(e.subcarpeta).toBe('tools');
      expect(e.url).toBe(
        `https://api.nuget.org/v3-flatcontainer/python/${e.version}/python.${e.version}.nupkg`,
      );
    }
    expect(urlOficial('https://nodejs.org.evil.com/x.zip')).toBe(false);
    expect(urlOficial('http://nodejs.org/x.zip')).toBe(false);
    expect(ejecutableDe('node')).toBe('node.exe');
    expect(ejecutableDe('python')).toBe('python.exe');
    expect((await listarVersiones('node'))[0]).toMatchObject({ servicio: 'node', formato: 'zip' });
  });
});

describe('Runtimes.instalados / rutaBin', () => {
  it('lista solo las versiones con ejecutable, de la más nueva a la más vieja', async () => {
    instalar('node', '22.5.0');
    instalar('node', '24.22.3');
    mkdirSync(rutas.bin('node', '20.0.0'), { recursive: true }); // sin node.exe
    const r = new Runtimes(rutas);
    expect(await r.instalados('node')).toEqual(['24.22.3', '22.5.0']);
    expect(await r.instalados('python')).toEqual([]);
    expect(r.rutaBin('node', '24.22.3')).toBe(rutas.bin('node', '24.22.3'));
  });
});

describe('elegirVersion', () => {
  const nodes = ['24.22.3', '22.11.0', '20.20.2'];
  it.each([
    ['22', '22.11.0'],
    ['v22.11', '22.11.0'],
    ['22.x', '22.11.0'],
    ['>=20', '24.22.3'],
    ['^20.1.0', '20.20.2'],
    ['~22.11.0', '22.11.0'],
    ['>=18 <23', '22.11.0'],
    ['<22', '20.20.2'],
    ['18 || 20', '20.20.2'],
    ['lts/*', '24.22.3'],
    ['node', '24.22.3'],
    ['>=99', undefined],
    ['16', undefined],
  ])('hint %s', (hint, esperado) => {
    expect(elegirVersion(nodes, hint)).toBe(esperado);
  });
  it('sin pista usa la más nueva', () => {
    expect(elegirVersion(nodes, undefined)).toBe('24.22.3');
    expect(elegirVersion([], undefined)).toBeUndefined();
  });
});

describe('Runtimes.paraProyecto', () => {
  const armar = (): Runtimes => {
    for (const v of ['24.22.3', '22.11.0', '20.20.2']) instalar('node', v);
    for (const v of ['3.13.17', '3.12.10']) instalar('python', v);
    return new Runtimes(rutas);
  };

  it('sin pista: la última instalada de cada tipo', async () => {
    const c = await proyecto({});
    expect(await armar().paraProyecto({ carpeta: c })).toEqual({
      node: '24.22.3',
      python: '3.13.17',
    });
  });
  it('wolfcore.yml manda sobre .nvmrc y package.json', async () => {
    const c = await proyecto({
      'wolfcore.yml': 'nombre: x\nruntimes:\n  node: "20"\n  python: 3.12 # comentario\n',
      '.nvmrc': '22',
      'package.json': '{"engines":{"node":">=24"}}',
    });
    expect(await armar().paraProyecto({ carpeta: c })).toEqual({
      node: '20.20.2',
      python: '3.12.10',
    });
  });
  it('sitio.runtimes (si existe) manda sobre todo', async () => {
    const c = await proyecto({ '.nvmrc': '22' });
    expect(await armar().paraProyecto({ carpeta: c, runtimes: { node: '24' } })).toMatchObject({
      node: '24.22.3',
    });
  });
  it('.nvmrc y luego .node-version', async () => {
    const a = await proyecto({ '.nvmrc': 'v22.11.0\n', '.node-version': '20' });
    expect((await armar().paraProyecto({ carpeta: a })).node).toBe('22.11.0');
    const b = await proyecto({ '.node-version': '20\r\n' });
    expect((await armar().paraProyecto({ carpeta: b })).node).toBe('20.20.2');
  });
  it('package.json engines.node (y tolera JSON roto)', async () => {
    const a = await proyecto({ 'package.json': '{"engines":{"node":"^22.0.0"}}' });
    expect((await armar().paraProyecto({ carpeta: a })).node).toBe('22.11.0');
    const b = await proyecto({ 'package.json': '{roto' });
    expect((await armar().paraProyecto({ carpeta: b })).node).toBe('24.22.3');
  });
  it('.python-version y pyproject requires-python', async () => {
    const a = await proyecto({ '.python-version': '3.12.10\n' });
    expect((await armar().paraProyecto({ carpeta: a })).python).toBe('3.12.10');
    const b = await proyecto({
      'pyproject.toml': '[project]\nname = "x"\nrequires-python = ">=3.10,<3.13"\n',
    });
    expect((await armar().paraProyecto({ carpeta: b })).python).toBe('3.12.10');
    const c = await proyecto({ 'pyproject.toml': "[project]\nrequires-python = '~=3.12'\n" });
    expect((await armar().paraProyecto({ carpeta: c })).python).toBe('3.13.17');
  });
  it('pista sin versión instalada que la cumpla: no se elige ninguna', async () => {
    const c = await proyecto({ '.nvmrc': '16' });
    expect((await armar().paraProyecto({ carpeta: c })).node).toBeUndefined();
  });
  it('sin nada instalado devuelve {}', async () => {
    const c = await proyecto({});
    expect(await new Runtimes(rutas).paraProyecto({ carpeta: c })).toEqual({});
  });
});

describe('Terminal con runtimes', () => {
  it('PATH: php, node, node/node_modules/.bin, python, python/Scripts, tools/bin, PATH actual', async () => {
    instalar('node', '22.11.0');
    instalar('python', '3.12.10');
    mkdirSync(rutas.bin('php', '8.4'), { recursive: true });
    const carpeta = await proyecto({ '.nvmrc': '22' });
    const llamadas: { env: NodeJS.ProcessEnv }[] = [];
    const t = new Terminal({
      rutas,
      entorno: { Path: 'C:\\Windows', LOCALAPPDATA: 'C:\\x' },
      existe: (p) => !p.endsWith('wt.exe') && (p.startsWith(base) || p === carpeta),
      asegurarPhpIni: async (r) => rutas.phpIni(r),
      lanzar: async (_c, _a, o) => {
        llamadas.push(o);
      },
      runtimes: new Runtimes(rutas),
    });
    await t.abrir({ carpeta, php: '8.4' });
    const n = rutas.bin('node', '22.11.0');
    const p = rutas.bin('python', '3.12.10');
    expect(llamadas[0]!.env.Path).toBe(
      [
        rutas.bin('php', '8.4'),
        n,
        path.join(n, 'node_modules', '.bin'),
        p,
        path.join(p, 'Scripts'),
        path.join(base, 'tools', 'bin'),
        'C:\\Windows',
      ].join(';'),
    );
  });
});

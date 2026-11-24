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
import {
  Runtimes,
  TIPOS_RUNTIME,
  elegirVersion,
  elegirJava,
  esLtsJava,
  esTipoRuntime,
  variablesRuntime,
} from '../src/runtimes/runtimes';
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
      avisos: [],
    });
  });
  it('sin pista y con predeterminada instalada (Servicios → Versiones): esa; si no está, la más nueva', async () => {
    const c = await proyecto({});
    armar();
    const pred = new Runtimes(rutas, async (t) => (t === 'node' ? '22.11.0' : '3.9.0'));
    expect(await pred.paraProyecto({ carpeta: c })).toEqual({
      node: '22.11.0',
      python: '3.13.17',
      avisos: [],
    });
    // Una pista del proyecto manda sobre la predeterminada.
    const c2 = await proyecto({ '.nvmrc': '20' });
    expect((await pred.paraProyecto({ carpeta: c2 })).node).toBe('20.20.2');
  });
  it('wolfcore.yml manda sobre .nvmrc y package.json', async () => {
    const c = await proyecto({
      'wolfcore.yml': 'version: 1\nnode: "20"\npython: 3.12 # comentario\n',
      '.nvmrc': '22',
      'package.json': '{"engines":{"node":">=24"}}',
    });
    expect(await armar().paraProyecto({ carpeta: c })).toEqual({
      node: '20.20.2',
      python: '3.12.10',
      avisos: [],
    });
  });
  it('wolfcore.yml inválido se ignora con aviso', async () => {
    const c = await proyecto({ 'wolfcore.yml': 'node: [20\n', '.nvmrc': '22' });
    const r = await armar().paraProyecto({ carpeta: c });
    expect(r.node).toBe('22.11.0');
    expect(r.avisos).toEqual([expect.stringMatching(/^wolfcore\.yml no es válido/)]);
  });
  it('sitio.runtimes (si existe) manda sobre todo', async () => {
    const c = await proyecto({ '.nvmrc': '22', 'wolfcore.yml': 'node: "20"\n' });
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
  it('versión fijada (sitio, wolfcore.yml, .nvmrc, .python-version) sin instalar: ninguna y aviso', async () => {
    const c = await proyecto({ '.nvmrc': '16', '.python-version': '3.9' });
    expect(await armar().paraProyecto({ carpeta: c })).toEqual({
      avisos: [
        'El proyecto pide Node 16, que no está instalado. Instálelo desde Servicios.',
        'El proyecto pide Python 3.9, que no está instalado. Instálelo desde Servicios.',
      ],
    });
    const y = await proyecto({ 'wolfcore.yml': 'node: "18"\n' });
    expect((await armar().paraProyecto({ carpeta: y })).avisos).toEqual([
      'El proyecto pide Node 18, que no está instalado. Instálelo desde Servicios.',
    ]);
    const s = await proyecto({});
    const r = await armar().paraProyecto({ carpeta: s, runtimes: { python: '3.11' } });
    expect(r.python).toBeUndefined();
    expect(r.node).toBe('24.22.3');
  });
  it('rango orientativo (engines, requires-python) sin cumplir: la más nueva y aviso', async () => {
    const c = await proyecto({
      'package.json': '{"engines":{"node":">=99"}}',
      'pyproject.toml': '[project]\nrequires-python = "<3.10"\n',
    });
    expect(await armar().paraProyecto({ carpeta: c })).toEqual({
      node: '24.22.3',
      python: '3.13.17',
      avisos: [
        'El proyecto pide Node >=99, que no está instalado; se usa Node 24.22.3. Instálelo desde Servicios si hace falta.',
        'El proyecto pide Python <3.10, que no está instalado; se usa Python 3.13.17. Instálelo desde Servicios si hace falta.',
      ],
    });
  });
  it('sin nada instalado: vacío; con una versión pedida, aviso', async () => {
    const c = await proyecto({});
    expect(await new Runtimes(rutas).paraProyecto({ carpeta: c })).toEqual({ avisos: [] });
    const d = await proyecto({ 'package.json': '{"engines":{"node":">=20"}}' });
    expect(await new Runtimes(rutas).paraProyecto({ carpeta: d })).toEqual({
      avisos: ['El proyecto pide Node >=20, que no está instalado. Instálelo desde Servicios.'],
    });
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

describe('D5: Java, .NET, Go y Rust como runtimes', () => {
  const EXE: Record<string, string> = {
    java: path.join('bin', 'java.exe'),
    dotnet: 'dotnet.exe',
    go: path.join('bin', 'go.exe'),
  };
  const instalarLenguaje = (tipo: 'java' | 'dotnet' | 'go', version: string): void => {
    const exe = path.join(rutas.bin(tipo, version), EXE[tipo]!);
    mkdirSync(path.dirname(exe), { recursive: true });
    writeFileSync(exe, 'x');
  };
  const instalarRust = (version: string): void => {
    const rustc = path.join(
      base,
      'bin',
      'rust',
      'rustup',
      'toolchains',
      `${version}-x86_64-pc-windows-msvc`,
      'bin',
      'rustc.exe',
    );
    mkdirSync(path.dirname(rustc), { recursive: true });
    writeFileSync(rustc, 'x');
  };

  it('TIPOS_RUNTIME tiene los seis y esTipoRuntime solo acepta esos', () => {
    expect([...TIPOS_RUNTIME]).toEqual(['node', 'python', 'java', 'dotnet', 'go', 'rust']);
    expect(esTipoRuntime('go')).toBe(true);
    expect(esTipoRuntime('ruby')).toBe(false);
    expect(esTipoRuntime(undefined)).toBe(false);
  });

  it('variablesRuntime por tipo', () => {
    expect(variablesRuntime('node', 'C:\\n')).toEqual({});
    expect(variablesRuntime('python', 'C:\\p')).toEqual({});
    expect(variablesRuntime('java', 'C:\\jdk')).toEqual({ JAVA_HOME: 'C:\\jdk' });
    expect(variablesRuntime('dotnet', 'C:\\dn')).toEqual({
      DOTNET_ROOT: 'C:\\dn',
      DOTNET_CLI_TELEMETRY_OPTOUT: '1',
    });
    expect(variablesRuntime('go', 'C:\\go', { datos: 'C:\\datos' })).toEqual({
      GOROOT: 'C:\\go',
      GOTOOLCHAIN: 'local',
      GOPATH: path.join('C:\\datos', 'cache', 'go'),
      GOCACHE: path.join('C:\\datos', 'cache', 'go-build'),
    });
    expect(variablesRuntime('rust', 'C:\\rust', { version: '1.100.0' })).toEqual({
      RUSTUP_HOME: path.join('C:\\rust', 'rustup'),
      CARGO_HOME: path.join('C:\\rust', 'cargo'),
      RUSTUP_TOOLCHAIN: '1.100.0',
    });
  });

  it('instalados y rutaBin: Go, Java y .NET por carpeta; Rust por toolchain de rustup', async () => {
    instalarLenguaje('go', '1.27.4');
    instalarLenguaje('java', '21.0.13.1');
    instalarLenguaje('dotnet', '10.0.404');
    instalarRust('1.99.1');
    instalarRust('1.100.0');
    const r = new Runtimes(rutas);
    expect(await r.instalados('go')).toEqual(['1.27.4']);
    expect(await r.instalados('java')).toEqual(['21.0.13.1']);
    expect(await r.instalados('dotnet')).toEqual(['10.0.404']);
    expect(await r.instalados('rust')).toEqual(['1.100.0', '1.99.1']);
    expect(r.rutaBin('go', '1.27.4')).toBe(rutas.bin('go', '1.27.4'));
    expect(r.rutaBin('rust', '1.100.0')).toBe(path.join(base, 'bin', 'rust'));
    // Una carpeta de rustup que no es un toolchain de una versión no cuenta.
    mkdirSync(
      path.join(
        base,
        'bin',
        'rust',
        'rustup',
        'toolchains',
        'nightly-x86_64-pc-windows-msvc',
        'bin',
      ),
      { recursive: true },
    );
    expect(await r.instalados('rust')).toEqual(['1.100.0', '1.99.1']);
  });

  it('el entorno de un sitio con runtimes.go pone GOROOT y el bin al principio del PATH', async () => {
    instalarLenguaje('go', '1.27.4');
    const r = new Runtimes(rutas);
    const c = await proyecto({});
    const rt = await r.paraProyecto({ carpeta: c, runtimes: { go: '1.27' } });
    expect(rt.go).toBe('1.27.4');
    expect(r.variables(rt)).toEqual({
      GOROOT: rutas.bin('go', '1.27.4'),
      GOTOOLCHAIN: 'local',
      GOPATH: path.join(base, 'cache', 'go'),
      GOCACHE: path.join(base, 'cache', 'go-build'),
    });
    expect(r.carpetasPath(rt)).toEqual([
      path.join(rutas.bin('go', '1.27.4'), 'bin'),
      path.join(base, 'cache', 'go', 'bin'),
    ]);
  });

  it('go.mod pide Go: se usa el instalado; sin archivo ni sitio, Go y Java no entran al entorno', async () => {
    instalarLenguaje('go', '1.27.4');
    instalarLenguaje('java', '21.0.13.1');
    const r = new Runtimes(rutas);
    const sin = await proyecto({});
    expect(await r.paraProyecto({ carpeta: sin })).toEqual({ avisos: [] });
    const c = await proyecto({ 'go.mod': 'module x\n\ngo 1.22\n' });
    expect(await r.paraProyecto({ carpeta: c })).toEqual({ go: '1.27.4', avisos: [] });
  });

  it('un mínimo no cumplido cae a la más nueva con aviso; un toolchain fijo no instalado, solo aviso', async () => {
    instalarLenguaje('java', '17.0.9');
    instalarRust('1.100.0');
    const r = new Runtimes(rutas);
    const j = await proyecto({
      'pom.xml':
        '<project><properties><maven.compiler.release>21</maven.compiler.release></properties></project>',
    });
    const rj = await r.paraProyecto({ carpeta: j });
    expect(rj.java).toBe('17.0.9');
    expect(rj.avisos[0]).toMatch(/Java >=21.*no está instalado/);
    const ru = await proyecto({ 'rust-toolchain.toml': '[toolchain]\nchannel = "1.85.0"\n' });
    const rr = await r.paraProyecto({ carpeta: ru });
    expect(rr.rust).toBeUndefined();
    expect(rr.avisos[0]).toMatch(/Rust 1\.85\.0.*no está instalado/);
  });

  it('Rust: RUSTUP_HOME, CARGO_HOME, RUSTUP_TOOLCHAIN y cargo/bin en el PATH', async () => {
    instalarRust('1.100.0');
    const r = new Runtimes(rutas);
    const c = await proyecto({ 'rust-toolchain.toml': '[toolchain]\nchannel = "1.100.0"\n' });
    const rt = await r.paraProyecto({ carpeta: c });
    expect(rt.rust).toBe('1.100.0');
    expect(r.variables(rt)).toEqual({
      RUSTUP_HOME: path.join(base, 'bin', 'rust', 'rustup'),
      CARGO_HOME: path.join(base, 'bin', 'rust', 'cargo'),
      RUSTUP_TOOLCHAIN: '1.100.0',
    });
    expect(r.carpetasPath(rt)).toEqual([path.join(base, 'bin', 'rust', 'cargo', 'bin')]);
  });

  it('la terminal del sitio lleva las variables de su runtime', async () => {
    instalarLenguaje('java', '21.0.13.1');
    const carpeta = await proyecto({ 'pom.xml': '<project/>' });
    const llamadas: { env: NodeJS.ProcessEnv }[] = [];
    const t = new Terminal({
      rutas,
      entorno: { Path: 'C:\\Windows', LOCALAPPDATA: 'C:\\x' },
      existe: (p) => !p.endsWith('wt.exe') && (p.startsWith(base) || p === carpeta),
      lanzar: async (_c, _a, o) => {
        llamadas.push(o);
      },
      runtimes: new Runtimes(rutas),
    });
    await t.abrir({ carpeta, php: null });
    expect(llamadas[0]!.env.JAVA_HOME).toBe(rutas.bin('java', '21.0.13.1'));
    expect(llamadas[0]!.env.Path).toContain(path.join(rutas.bin('java', '21.0.13.1'), 'bin'));
  });
});

describe('D5 revisión: Java prefiere el mayor pedido o la LTS, y avisos de Rust', () => {
  const instalarJava = (v: string): void => {
    const exe = path.join(rutas.bin('java', v), 'bin', 'java.exe');
    mkdirSync(path.dirname(exe), { recursive: true });
    writeFileSync(exe, 'x');
  };
  const pom = (n: number): string =>
    `<project><properties><maven.compiler.release>${n}</maven.compiler.release></properties></project>`;

  it('esLtsJava', () => {
    expect([8, 11, 17, 21, 25, 29].every(esLtsJava)).toBe(true);
    expect([9, 18, 22, 23, 24, 26, 27].some(esLtsJava)).toBe(false);
  });

  it('elegirJava: mismo mayor, si no la LTS más nueva que cumpla, si no la más nueva', () => {
    const i = ['27.0.1', '25.0.5.1', '21.0.13.1', '17.0.9'];
    expect(elegirJava(i, '>=21')).toBe('21.0.13.1');
    expect(elegirJava(i, '>=22')).toBe('25.0.5.1');
    expect(elegirJava(i, '>=26')).toBe('27.0.1');
    expect(elegirJava(i, undefined)).toBe('25.0.5.1');
    expect(elegirJava(['27.0.1', '26.0.2'], undefined)).toBe('27.0.1');
    expect(elegirJava(i, '21')).toBe('21.0.13.1');
    expect(elegirJava(i, '>=30')).toBeUndefined();
  });

  it('el proyecto con pom de Java 21 usa el 21 aunque haya 27 y 25; sin archivo exacto, la LTS', async () => {
    for (const v of ['27.0.1', '25.0.5.1', '21.0.13.1']) instalarJava(v);
    const r = new Runtimes(rutas);
    expect((await r.paraProyecto({ carpeta: await proyecto({ 'pom.xml': pom(21) }) })).java).toBe(
      '21.0.13.1',
    );
    expect((await r.paraProyecto({ carpeta: await proyecto({ 'pom.xml': pom(22) }) })).java).toBe(
      '25.0.5.1',
    );
    expect(
      (await r.paraProyecto({ carpeta: await proyecto({ 'pom.xml': '<project/>' }) })).java,
    ).toBe('25.0.5.1');
  });

  it('un canal de Rust no numérico se avisa', async () => {
    const r = new Runtimes(rutas);
    const c = await proyecto({
      'rust-toolchain.toml': '[toolchain]\nchannel = "nightly-2025-01-01"\n',
    });
    const rt = await r.paraProyecto({ carpeta: c });
    expect(rt.avisos.some((a) => a.includes('nightly-2025-01-01') && a.includes('Rust'))).toBe(
      true,
    );
  });
});

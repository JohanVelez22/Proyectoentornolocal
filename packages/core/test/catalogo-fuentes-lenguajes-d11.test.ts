import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  catalogo,
  HOSTS_INDICE,
  HOSTS_PERMITIDOS,
  urlIndice,
  urlOficial,
  type ServicioInstalable,
  type VersionDisponible,
} from '../src/catalogo/catalogo';
import { RUTAS_ACOTADAS } from '../src/catalogo/comun';
import { fuenteBun } from '../src/catalogo/fuentes/bun';
import { fuenteDart } from '../src/catalogo/fuentes/dart';
import { fuenteDeno } from '../src/catalogo/fuentes/deno';
import { fuenteKotlin } from '../src/catalogo/fuentes/kotlin';
import { fuenteZig } from '../src/catalogo/fuentes/zig';
import {
  IndiceMalformado,
  sumaDe,
  type ContextoFuente,
  type FuenteVersiones,
} from '../src/catalogo/fuentes/tipos';
import { Instalador } from '../src/catalogo/instalador';
import { listaFija, validarIndice } from '../src/catalogo/vivo';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Rutas } from '../src/rutas';
import { fetchFalso, fixture, HOY, zipDe, type Ruta } from './catalogo-falso';
import { carpetaTemporal } from './temporales';

const GH = (repo: string): string => `https://api.github.com/repos/${repo}/releases?per_page=10`;
const ZIG_INDICE = 'https://ziglang.org/download/index.json';
const DART_LISTADO =
  'https://storage.googleapis.com/storage/v1/b/dart-archive/o?prefix=channels/stable/release/&delimiter=/&maxResults=1000&fields=prefixes,nextPageToken';
const DART_BASE = 'https://storage.googleapis.com/dart-archive/channels/stable/release/';
const DART_VERSIONES_FIJAS = ['3.14.1', '3.13.7', '3.12.2', '3.11.6', '3.10.9', '3.9.4'];

const rutasDart = (): Record<string, Ruta> => {
  const r: Record<string, Ruta> = { [DART_LISTADO]: fixture('dart-versiones.json') };
  for (const v of DART_VERSIONES_FIJAS) {
    r[`${DART_BASE}${v}/sdk/dartsdk-windows-x64-release.zip.sha256sum`] = fixture(
      `dart-${v}.sha256sum`,
    );
  }
  return r;
};

const ctx = (rutas: Record<string, Ruta>): ContextoFuente & { pedidas: string[] } => {
  const ff = fetchFalso(rutas);
  return { f: ff.f, idCatalogo: 'win-x64', ahora: HOY, pedidas: ff.pedidas };
};
const de = (v: VersionDisponible[], version: string): VersionDisponible =>
  v.find((x) => x.version === version)!;
const sha = (b: Buffer | string): string => createHash('sha256').update(b).digest('hex');

/** La firma minisign de Zig se prueba en minisign.test.ts; aquí se deja fuera. */
const SIN_MINISIGN = { claveMinisign: () => null };

const temporales: string[] = [];
afterEach(async () => {
  for (const t of temporales.splice(0)) await rm(t, { recursive: true, force: true });
});
async function rutasTemp(): Promise<Rutas> {
  const base = await carpetaTemporal('pel-d11-');
  temporales.push(base);
  const r = new Rutas(base);
  await r.asegurar();
  return r;
}

describe('D11: hosts', () => {
  it('Zig y Dart están escritos uno por uno, y el host compartido de Google solo con su ruta', () => {
    for (const h of ['ziglang.org', 'storage.googleapis.com']) {
      expect(HOSTS_PERMITIDOS).toContain(h);
      expect(HOSTS_INDICE).toContain(h);
    }
    for (const h of [...HOSTS_INDICE, ...HOSTS_PERMITIDOS]) expect(h).not.toMatch(/[*?]/);
    expect(Object.keys(RUTAS_ACOTADAS)).toEqual([
      'storage.googleapis.com',
      'dl.equinox.io',
      'bin.equinox.io',
    ]);
    expect(urlOficial(`${DART_BASE}3.14.1/sdk/dartsdk-windows-x64-release.zip`)).toBe(true);
    expect(urlIndice(DART_LISTADO)).toBe(true);
    // Otro bucket del mismo host, rutas que salen del prefijo y variantes del host.
    expect(urlOficial('https://storage.googleapis.com/otro-bucket/x.zip')).toBe(false);
    expect(urlOficial('https://storage.googleapis.com/dart-archive/otra/x.zip')).toBe(false);
    expect(urlOficial(`${DART_BASE}../../../../evil/x.zip`)).toBe(false);
    expect(urlOficial(`${DART_BASE}%2e%2e/%2e%2e/%2e%2e/%2e%2e/evil/x.zip`)).toBe(false);
    expect(urlIndice('https://storage.googleapis.com/storage/v1/b/otro/o')).toBe(false);
    expect(urlOficial('https://dart-archive.storage.googleapis.com/x.zip')).toBe(false);
    expect(
      urlOficial(`https://evil.storage.googleapis.com/dart-archive/channels/stable/release/x`),
    ).toBe(false);
    expect(urlOficial('https://ziglang.org.evil.com/download/x.zip')).toBe(false);
    expect(urlOficial('https://ziglang.org/download/0.17.1/zig-x86_64-windows-0.17.1.zip')).toBe(
      true,
    );
  });
});

describe('D11: Bun', () => {
  const rutas = (): Record<string, Ruta> => ({ [GH('oven-sh/bun')]: fixture('github-bun.json') });

  it('versiones de las releases (bun-vX), zip de Windows x64 con su SHA-256', async () => {
    const v = await fuenteBun.listar(ctx(rutas()));
    expect(v.map((x) => x.version)).toEqual(['1.4.5', '1.4.4', '1.4.3', '1.4.2']);
    expect(de(v, '1.4.5')).toMatchObject({
      servicio: 'bun',
      rama: '1.4',
      url: 'https://github.com/oven-sh/bun/releases/download/bun-v1.4.5/bun-windows-x64.zip',
      subcarpeta: 'bun-windows-x64',
      ejecutable: 'bun.exe',
      formato: 'zip',
      huella: {
        algoritmo: 'sha256',
        valor: '815ab45ec7f549abf87e6869584b506eab088e24225683957b7e150b47d6de30',
      },
    });
    expect(() => validarIndice('bun', v)).not.toThrow();
  });

  it('una etiqueta sin el prefijo bun-v (canary) no se ofrece', async () => {
    const r = JSON.parse(fixture('github-bun.json')) as { tag_name: string }[];
    r.unshift({ ...r[0]!, tag_name: 'canary' });
    const v = await fuenteBun.listar(ctx({ [GH('oven-sh/bun')]: JSON.stringify(r) }));
    expect(v.map((x) => x.version)).not.toContain('canary');
    expect(v).toHaveLength(4);
  });

  it('sin digest usa SHASUMS256.txt de la release', async () => {
    const r = JSON.parse(fixture('github-bun.json')) as {
      assets: { name: string; digest?: string | null; browser_download_url: string }[];
    }[];
    for (const a of r[0]!.assets) delete a.digest;
    const base = 'https://github.com/oven-sh/bun/releases/download/bun-v1.4.5/';
    const sumas = `${'a'.repeat(64)}  bun-windows-x64.zip\n${'b'.repeat(64)}  bun-linux-x64.zip\n`;
    const v = await fuenteBun.listar(
      ctx({
        [GH('oven-sh/bun')]: JSON.stringify(r.slice(0, 1)),
        [`${base}SHASUMS256.txt`]: sumas,
      }),
    );
    expect(v[0]!.huella).toEqual({ algoritmo: 'sha256', valor: 'a'.repeat(64) });
  });

  it('un asset fuera del repositorio descarta el índice entero', async () => {
    const r = JSON.parse(fixture('github-bun.json')) as {
      assets: { browser_download_url: string }[];
    }[];
    r[0]!.assets[0]!.browser_download_url = 'https://github.com/otro/bun/releases/download/x/y.zip';
    await expect(
      fuenteBun.listar(ctx({ [GH('oven-sh/bun')]: JSON.stringify(r) })),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });
});

describe('D11: Deno', () => {
  const rutas = (): Record<string, Ruta> => ({
    [GH('denoland/deno')]: fixture('github-deno.json'),
  });

  it('zip de Windows x64 con deno.exe en la raíz y su SHA-256', async () => {
    const v = await fuenteDeno.listar(ctx(rutas()));
    expect(v[0]).toMatchObject({
      servicio: 'deno',
      version: '2.9.8',
      rama: '2.9',
      url: 'https://github.com/denoland/deno/releases/download/v2.9.8/deno-x86_64-pc-windows-msvc.zip',
      ejecutable: 'deno.exe',
      huella: {
        algoritmo: 'sha256',
        valor: 'cba84b26e0df5ae7f74fc66b86a95b866872a86292ebd84fa1e959927edd93bf',
      },
    });
    expect(v[0]!.subcarpeta).toBeUndefined();
    // Nunca el zip de ARM.
    expect(v.every((x) => x.url.includes('x86_64'))).toBe(true);
    expect(() => validarIndice('deno', v)).not.toThrow();
  });

  it('sin digest lee el .sha256sum de PowerShell (Hash/Path) de la release', async () => {
    const r = JSON.parse(fixture('github-deno.json')) as {
      assets: { name: string; digest?: string | null; browser_download_url: string }[];
    }[];
    for (const a of r[0]!.assets) delete a.digest;
    const url = r[0]!.assets.find((a) => a.name.endsWith('.zip.sha256sum'))!.browser_download_url;
    const v = await fuenteDeno.listar(
      ctx({
        [GH('denoland/deno')]: JSON.stringify(r.slice(0, 1)),
        [url]: fixture('deno-sha256sum.txt'),
      }),
    );
    expect(v[0]!.huella?.valor).toBe(
      'cba84b26e0df5ae7f74fc66b86a95b866872a86292ebd84fa1e959927edd93bf',
    );
  });

  it('sumaDe en formato PowerShell exige que la ruta sea el archivo pedido', () => {
    const t = fixture('deno-sha256sum.txt');
    expect(sumaDe(t, 'deno-x86_64-pc-windows-msvc.zip')).toBe(
      'cba84b26e0df5ae7f74fc66b86a95b866872a86292ebd84fa1e959927edd93bf',
    );
    expect(sumaDe(t, 'otro.zip')).toBeNull();
    expect(sumaDe(t, null)).toBeNull();
  });
});

describe('D11: Kotlin', () => {
  const rutas = (): Record<string, Ruta> => ({
    [GH('JetBrains/kotlin')]: fixture('github-kotlin.json'),
  });

  it('el compilador kotlin-compiler-<v>.zip con su SHA-256; los RC y Beta son preview', async () => {
    const v = await fuenteKotlin.listar(ctx(rutas()));
    expect(de(v, '2.4.21')).toMatchObject({
      servicio: 'kotlin',
      rama: '2.4',
      url: 'https://github.com/JetBrains/kotlin/releases/download/v2.4.21/kotlin-compiler-2.4.21.zip',
      subcarpeta: 'kotlinc',
      ejecutable: 'bin/kotlinc.bat',
      soporte: 'actual',
      huella: {
        algoritmo: 'sha256',
        valor: '7cc140e76daf416a0424a5557f99afd7ca89ebd463ea1101261e3e01c33e75cd',
      },
    });
    expect(de(v, '2.5.0-RC').soporte).toBe('preview');
    // Nunca el compilador nativo de GraalVM.
    expect(v.every((x) => !x.url.includes('graalvm'))).toBe(true);
    expect(() => validarIndice('kotlin', v)).not.toThrow();
  });
});

describe('D11: Zig', () => {
  const rutas = (): Record<string, Ruta> => ({ [ZIG_INDICE]: fixture('zig-index.json') });

  it('la última de cada rama 0.N, sin master, con SHA-256 y las dos formas del nombre del zip', async () => {
    const v = await fuenteZig.listar(ctx(rutas()));
    expect(v.map((x) => x.version)).toEqual(['0.17.1', '0.16.0', '0.15.2', '0.14.1', '0.13.0']);
    expect(de(v, '0.17.1')).toMatchObject({
      servicio: 'zig',
      rama: '0.17',
      url: 'https://ziglang.org/download/0.17.1/zig-x86_64-windows-0.17.1.zip',
      subcarpeta: 'zig-x86_64-windows-0.17.1',
      ejecutable: 'zig.exe',
      huella: {
        algoritmo: 'sha256',
        valor: 'b03f477a1943673e02aca0f570e8030dffd536ce1f45cbc4d3326ec31159562e',
      },
    });
    // Hasta 0.14.0 el nombre era zig-windows-x86_64-<v>.
    expect(de(v, '0.13.0')).toMatchObject({
      url: 'https://ziglang.org/download/0.13.0/zig-windows-x86_64-0.13.0.zip',
      subcarpeta: 'zig-windows-x86_64-0.13.0',
    });
    expect(v.some((x) => x.version.includes('dev'))).toBe(false);
    expect(() => validarIndice('zig', v)).not.toThrow();
  });

  it('un tarball con otro nombre, otro host o una ruta rara descarta el índice', async () => {
    for (const malo of [
      'https://ziglang.org/download/0.17.1/../../evil.zip',
      'https://evil.example/download/0.17.1/zig-x86_64-windows-0.17.1.zip',
      'https://ziglang.org/download/0.17.0/zig-x86_64-windows-0.17.1.zip',
      'https://ziglang.org/builds/zig-x86_64-windows-0.17.1.zip',
    ]) {
      const idx = JSON.parse(fixture('zig-index.json')) as Record<
        string,
        Record<string, { tarball: string }>
      >;
      idx['0.17.1']!['x86_64-windows']!.tarball = malo;
      await expect(
        fuenteZig.listar(ctx({ [ZIG_INDICE]: JSON.stringify(idx) })),
      ).rejects.toBeInstanceOf(IndiceMalformado);
    }
  });

  it('una huella mal formada llega cruda y la validación la rechaza', async () => {
    const idx = JSON.parse(fixture('zig-index.json')) as Record<
      string,
      Record<string, { shasum: string }>
    >;
    idx['0.17.1']!['x86_64-windows']!.shasum = 'xyz';
    const v = await fuenteZig.listar(ctx({ [ZIG_INDICE]: JSON.stringify(idx) }));
    expect(() => validarIndice('zig', v)).toThrow();
  });
});

describe('D11: Dart', () => {
  it('las seis ramas más nuevas del listado, orden numérico y huella de su .sha256sum', async () => {
    const v = await fuenteDart.listar(ctx(rutasDart()));
    expect(v.map((x) => x.version)).toEqual(DART_VERSIONES_FIJAS);
    expect(de(v, '3.14.1')).toMatchObject({
      servicio: 'dart',
      rama: '3.14',
      url: `${DART_BASE}3.14.1/sdk/dartsdk-windows-x64-release.zip`,
      subcarpeta: 'dart-sdk',
      ejecutable: 'bin/dart.exe',
      soporte: 'actual',
      huella: {
        algoritmo: 'sha256',
        valor: 'fb2550f71e3408f2a69ff6ee29573f341991a927f8bc9ad0601dd3c9b19945c8',
      },
    });
    expect(de(v, '3.9.4').soporte).toBe('fin');
    expect(() => validarIndice('dart', v)).not.toThrow();
  });

  it('las carpetas numéricas viejas, latest y las versiones 1.x/2.x no entran', async () => {
    const v = await fuenteDart.listar(ctx(rutasDart()));
    expect(v.map((x) => x.version)).not.toContain('2.19.6');
    expect(v.map((x) => x.version)).not.toContain('1.11.0');
    expect(v.map((x) => x.version).some((x) => x.length > 7)).toBe(false);
  });

  it('un listado paginado se lee entero y uno interminable se descarta', async () => {
    const todo = JSON.parse(fixture('dart-versiones.json')) as { prefixes: string[] };
    const mitad = Math.floor(todo.prefixes.length / 2);
    const p1 = { prefixes: todo.prefixes.slice(0, mitad), nextPageToken: 'T2' };
    const p2 = { prefixes: todo.prefixes.slice(mitad) };
    const r = rutasDart();
    r[DART_LISTADO] = JSON.stringify(p1);
    r[`${DART_LISTADO}&pageToken=T2`] = JSON.stringify(p2);
    expect((await fuenteDart.listar(ctx(r))).map((x) => x.version)).toEqual(DART_VERSIONES_FIJAS);
    r[`${DART_LISTADO}&pageToken=T2`] = JSON.stringify({ ...p2, nextPageToken: 'T2' });
    await expect(fuenteDart.listar(ctx(r))).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('el .sha256sum de otro archivo no se acepta como huella', async () => {
    const r = rutasDart();
    r[`${DART_BASE}3.14.1/sdk/dartsdk-windows-x64-release.zip.sha256sum`] =
      `${'c'.repeat(64)} *dartsdk-macos-arm64-release.zip\n`;
    const v = await fuenteDart.listar(ctx(r));
    expect(de(v, '3.14.1').huella).toBeNull();
    expect(de(v, '3.14.1').huellaDiferida).toBe(true);
  });

  it('completar lee la huella de las versiones que se listaron sin ella', async () => {
    const h = await fuenteDart.completar!(
      { servicio: 'dart', version: '3.12.2' } as VersionDisponible,
      ctx(rutasDart()),
    );
    expect(h).toEqual({
      algoritmo: 'sha256',
      valor: '77fd96c823ed09a85e58209a2c5f16b0fc02e5ed4f3e3d46fddf4be763d498d6',
    });
  });

  it('el listado que redirige a otro bucket se corta', async () => {
    const r: Record<string, Ruta> = {
      [DART_LISTADO]: { ir: 'https://storage.googleapis.com/storage/v1/b/otro-bucket/o' },
    };
    await expect(fuenteDart.listar(ctx(r))).rejects.toMatchObject({
      codigo: 'catalogo.redireccion_ajena',
    });
  });
});

describe('D11: lista fija', () => {
  it.each(['bun', 'deno', 'zig', 'kotlin', 'dart'] as const)(
    '%s trae versiones con huella fuerte y URL oficial',
    (s) => {
      const l = listaFija(s);
      expect(l.length).toBeGreaterThan(0);
      for (const e of l) {
        expect(urlOficial(e.url)).toBe(true);
        expect(['sha256', 'sha512']).toContain(e.huella?.algoritmo);
      }
      expect(() => validarIndice(s, l)).not.toThrow();
      expect(catalogo[s].length).toBe(l.length);
    },
  );
});

/** Lo que cada fuente instala: el zip falso, la carpeta y el ejecutable esperados. */
const CASOS: {
  servicio: ServicioInstalable;
  fuente: FuenteVersiones;
  rutas: () => Record<string, Ruta>;
  version: string;
  zip: Record<string, string>;
  exe: string[];
}[] = [
  {
    servicio: 'bun',
    fuente: fuenteBun,
    rutas: () => ({ [GH('oven-sh/bun')]: fixture('github-bun.json') }),
    version: '1.4.5',
    zip: { 'bun-windows-x64/bun.exe': 'EXE' },
    exe: ['bun.exe'],
  },
  {
    servicio: 'deno',
    fuente: fuenteDeno,
    rutas: () => ({ [GH('denoland/deno')]: fixture('github-deno.json') }),
    version: '2.9.8',
    zip: { 'deno.exe': 'EXE' },
    exe: ['deno.exe'],
  },
  {
    servicio: 'zig',
    fuente: fuenteZig,
    rutas: () => ({ [ZIG_INDICE]: fixture('zig-index.json') }),
    version: '0.17.1',
    zip: { 'zig-x86_64-windows-0.17.1/zig.exe': 'EXE', 'zig-x86_64-windows-0.17.1/lib/a': 'x' },
    exe: ['zig.exe'],
  },
  {
    servicio: 'kotlin',
    fuente: fuenteKotlin,
    rutas: () => ({ [GH('JetBrains/kotlin')]: fixture('github-kotlin.json') }),
    version: '2.4.21',
    zip: { 'kotlinc/bin/kotlinc.bat': 'BAT', 'kotlinc/build.txt': '2.4.21' },
    exe: ['bin', 'kotlinc.bat'],
  },
  {
    servicio: 'dart',
    fuente: fuenteDart,
    rutas: rutasDart,
    version: '3.14.1',
    zip: { 'dart-sdk/bin/dart.exe': 'EXE', 'dart-sdk/version': '3.14.1' },
    exe: ['bin', 'dart.exe'],
  },
];

describe.each(CASOS)('D11: instalar $servicio con servidor falso', (c) => {
  const preparar = async (): Promise<{ v: VersionDisponible; zip: Buffer }> => {
    const zip = zipDe(c.zip);
    const v = de(await c.fuente.listar(ctx(c.rutas())), c.version);
    return {
      v: { ...v, sha256: sha(zip), huella: { algoritmo: 'sha256', valor: sha(zip) } },
      zip,
    };
  };

  it('extrae en bin/<servicio>/<versión> con el ejecutable en su sitio', async () => {
    const { v, zip } = await preparar();
    const r = await rutasTemp();
    const inst = new Instalador(
      r,
      new Eventos<EventosNucleo>(),
      fetchFalso({ [v.url]: zip }).f,
      SIN_MINISIGN,
    );
    await inst.instalar(v);
    expect(existsSync(path.join(r.bin(c.servicio, c.version), ...c.exe))).toBe(true);
    expect(await inst.instalados(c.servicio)).toEqual([c.version]);
  });

  it('una descarga con otra suma no se instala y no deja nada', async () => {
    const { v } = await preparar();
    const r = await rutasTemp();
    const inst = new Instalador(
      r,
      new Eventos<EventosNucleo>(),
      fetchFalso({ [v.url]: zipDe({ ...c.zip, 'otro.txt': 'cambiado' }) }).f,
      SIN_MINISIGN,
    );
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.huella_no_coincide' });
    expect(existsSync(r.bin(c.servicio, c.version))).toBe(false);
  });

  it('una URL de otro host se rechaza al validar el índice y al instalar', async () => {
    const { v } = await preparar();
    expect(() =>
      validarIndice(c.servicio, [{ ...v, url: 'https://evil.example/x.zip' }]),
    ).toThrow();
    const r = await rutasTemp();
    const ff = fetchFalso({});
    const inst = new Instalador(r, new Eventos<EventosNucleo>(), ff.f, SIN_MINISIGN);
    await expect(inst.instalar({ ...v, url: 'https://evil.example/x.zip' })).rejects.toBeDefined();
    expect(ff.pedidas.some((u) => u.includes('evil.example'))).toBe(false);
  });

  it('una redirección a un host ajeno se corta antes de pedirlo', async () => {
    const { v } = await preparar();
    const r = await rutasTemp();
    const ff = fetchFalso({ [v.url]: { ir: 'https://evil.example/x.zip' } });
    const inst = new Instalador(r, new Eventos<EventosNucleo>(), ff.f, SIN_MINISIGN);
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.redireccion_ajena' });
    expect(ff.pedidas.some((u) => u.includes('evil.example'))).toBe(false);
  });

  it('en otro sistema la fuente devuelve una lista vacía', async () => {
    const x = fetchFalso(c.rutas());
    expect(await c.fuente.listar({ f: x.f, idCatalogo: 'linux-x64', ahora: HOY })).toEqual([]);
  });
});

describe('D11: Dart no sigue una redirección a otro bucket de Google', () => {
  it('el zip que redirige a otro bucket del mismo host da catalogo.redireccion_ajena', async () => {
    const v = de(await fuenteDart.listar(ctx(rutasDart())), '3.14.1');
    const ff = fetchFalso({ [v.url]: { ir: 'https://storage.googleapis.com/otro-bucket/x.zip' } });
    const inst = new Instalador(await rutasTemp(), new Eventos<EventosNucleo>(), ff.f);
    await expect(inst.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.redireccion_ajena' });
    expect(ff.pedidas).toEqual([v.url]);
  });
});

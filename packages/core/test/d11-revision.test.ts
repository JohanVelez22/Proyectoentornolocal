import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { urlIndice, urlOficial } from '../src/catalogo/catalogo';
import { fuenteBun } from '../src/catalogo/fuentes/bun';
import { fuenteDart } from '../src/catalogo/fuentes/dart';
import { fuenteDeno } from '../src/catalogo/fuentes/deno';
import { IndiceMalformado, sumaDe, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import { fuenteKotlin } from '../src/catalogo/fuentes/kotlin';
import {
  CLAVE_MINISIGN_ZIG,
  leerMinisig,
  verificarMinisign,
  type FirmaMinisign,
} from '../src/catalogo/minisign';
import { detectarProyecto as detectarAmpliada } from '../src/proyectos/detectar';
import { Runtimes, variablesRuntime } from '../src/runtimes/runtimes';
import { Rutas } from '../src/rutas';
import { fetchFalso, fixture, HOY, type Ruta } from './catalogo-falso';
import { carpetaTemporal } from './temporales';

const GH = (repo: string): string => `https://api.github.com/repos/${repo}/releases?per_page=10`;
const ctx = (rutas: Record<string, Ruta>): ContextoFuente & { pedidas: string[] } => {
  const ff = fetchFalso(rutas);
  return { f: ff.f, idCatalogo: 'win-x64', ahora: HOY, pedidas: ff.pedidas };
};

type Release = {
  tag_name: string;
  assets: { name: string; browser_download_url: string; digest?: string | null }[];
};

describe('D11 revisión: la URL del asset es exactamente la de su tag y su nombre', () => {
  const lista = (): Release[] => JSON.parse(fixture('github-deno.json')) as Release[];
  const con = (cambio: (r: Release[]) => void): Promise<unknown> => {
    const r = lista();
    cambio(r);
    return fuenteDeno.listar(ctx({ [GH('denoland/deno')]: JSON.stringify(r) }));
  };

  it('la URL real pasa', async () => {
    await expect(con(() => undefined)).resolves.toBeDefined();
  });

  it('una URL que apunta a otro tag del mismo repo se rechaza', async () => {
    await expect(
      con((r) => {
        const a = r[0]!.assets.find((x) => x.name === 'deno-x86_64-pc-windows-msvc.zip')!;
        a.browser_download_url = a.browser_download_url.replace('/v2.9.8/', '/v2.9.7/');
      }),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('una URL que apunta a otro asset del mismo repo se rechaza', async () => {
    await expect(
      con((r) => {
        const a = r[0]!.assets.find((x) => x.name === 'deno-x86_64-pc-windows-msvc.zip')!;
        a.browser_download_url = a.browser_download_url.replace(
          'deno-x86_64-pc-windows-msvc.zip',
          'deno-aarch64-pc-windows-msvc.zip',
        );
      }),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('dueño y repo se comparan sin distinguir mayúsculas; el resto, exacto', async () => {
    await expect(
      con((r) => {
        const a = r[0]!.assets.find((x) => x.name === 'deno-x86_64-pc-windows-msvc.zip')!;
        a.browser_download_url = a.browser_download_url.replace(
          '/denoland/deno/',
          '/DenoLand/Deno/',
        );
      }),
    ).resolves.toBeDefined();
    await expect(
      con((r) => {
        const a = r[0]!.assets.find((x) => x.name === 'deno-x86_64-pc-windows-msvc.zip')!;
        a.browser_download_url += '/extra';
      }),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('el archivo de sumas también debe ser exactamente el de su release', async () => {
    const r = JSON.parse(fixture('github-deno-sumas.json')) as Release[];
    const suma = r[0]!.assets.find((a) => a.name === 'deno-x86_64-pc-windows-msvc.zip.sha256sum')!;
    suma.browser_download_url = suma.browser_download_url.replace('/v2.9.8/', '/v2.9.7/');
    const pedidas: string[] = [];
    const c = ctx({ [GH('denoland/deno')]: JSON.stringify(r) });
    await expect(fuenteDeno.listar(c)).rejects.toBeInstanceOf(IndiceMalformado);
    pedidas.push(...c.pedidas);
    expect(pedidas.some((u) => u.includes('.sha256sum'))).toBe(false);
  });

  it('Bun: un asset de otro tag se rechaza', async () => {
    const r = JSON.parse(fixture('github-bun.json')) as Release[];
    const a = r[0]!.assets.find((x) => x.name === 'bun-windows-x64.zip')!;
    a.browser_download_url = a.browser_download_url.replace('bun-v1.4.5', 'bun-v1.4.4');
    await expect(
      fuenteBun.listar(ctx({ [GH('oven-sh/bun')]: JSON.stringify(r) })),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });
});

describe('D11 revisión: archivo de sumas de la release', () => {
  const rutasDeno = (): { rutas: Record<string, Ruta>; windows: string } => {
    const r = JSON.parse(fixture('github-deno-sumas.json')) as Release[];
    const rutas: Record<string, Ruta> = { [GH('denoland/deno')]: JSON.stringify(r) };
    for (const a of r[0]!.assets) {
      if (a.name.endsWith('.sha256sum')) {
        // Las de otras plataformas traen otra suma: tomarlas daría una huella equivocada.
        rutas[a.browser_download_url] = a.name.includes('x86_64-pc-windows')
          ? fixture('deno-sha256sum.txt')
          : `Algorithm : SHA256\nHash      : ${'EE'.repeat(32)}\nPath      : C:\\a\\${a.name.replace('.sha256sum', '')}\n`;
      }
    }
    return {
      rutas,
      windows: r[0]!.assets.find((a) => a.name === 'deno-x86_64-pc-windows-msvc.zip.sha256sum')!
        .browser_download_url,
    };
  };

  it('Deno sin digest y con varios .sha256sum: usa el de su archivo y no pide los demás', async () => {
    const { rutas, windows } = rutasDeno();
    const c = ctx(rutas);
    const v = await fuenteDeno.listar(c);
    expect(v[0]!.huella?.valor).toBe(
      'cba84b26e0df5ae7f74fc66b86a95b866872a86292ebd84fa1e959927edd93bf',
    );
    expect(c.pedidas.filter((u) => u.endsWith('.sha256sum'))).toEqual([windows]);
  });

  it('Kotlin: un .sha256 con el hex solitario se acepta', async () => {
    const r = JSON.parse(fixture('github-kotlin.json')) as Release[];
    const k = r.filter((x) => x.tag_name === 'v2.4.21');
    for (const a of k[0]!.assets) delete a.digest;
    const url = k[0]!.assets.find(
      (a) => a.name === 'kotlin-compiler-2.4.21.zip.sha256',
    )!.browser_download_url;
    const v = await fuenteKotlin.listar(
      ctx({ [GH('JetBrains/kotlin')]: JSON.stringify(k), [url]: `${'7c'.repeat(32)}\n` }),
    );
    expect(v[0]!.huella).toEqual({ algoritmo: 'sha256', valor: '7c'.repeat(32) });
  });

  it('Bun: si no hay archivo propio usa SHASUMS256.txt', async () => {
    const r = JSON.parse(fixture('github-bun.json')) as Release[];
    for (const a of r[0]!.assets) delete a.digest;
    const base = 'https://github.com/oven-sh/bun/releases/download/bun-v1.4.5/';
    const v = await fuenteBun.listar(
      ctx({
        [GH('oven-sh/bun')]: JSON.stringify(r.slice(0, 1)),
        [`${base}SHASUMS256.txt`]: `${'a'.repeat(64)}  bun-windows-x64.zip\n`,
      }),
    );
    expect(v[0]!.huella?.valor).toBe('a'.repeat(64));
  });
});

describe('D11 revisión: sumaDe en formato PowerShell con varios bloques', () => {
  const bloque = (hash: string, archivo: string): string =>
    `Algorithm : SHA256\r\nHash      : ${hash}\r\nPath      : C:\\a\\b\\${archivo}\r\n\r\n`;

  it('empareja cada Hash con el Path que le sigue', () => {
    const t = bloque('A'.repeat(64), 'uno.zip') + bloque('B'.repeat(64), 'dos.zip');
    expect(sumaDe(t, 'uno.zip')).toBe('a'.repeat(64));
    expect(sumaDe(t, 'dos.zip')).toBe('b'.repeat(64));
    expect(sumaDe(t, 'tres.zip')).toBeNull();
  });

  it('un Hash sin su Path no se mezcla con el Path de otro bloque', () => {
    const t = `Hash : ${'A'.repeat(64)}\r\n${bloque('B'.repeat(64), 'dos.zip')}`;
    expect(sumaDe(t, 'dos.zip')).toBe('b'.repeat(64));
  });

  it('un solo bloque sigue valiendo', () => {
    expect(sumaDe(bloque('C'.repeat(64), 'x.zip'), 'x.zip')).toBe('c'.repeat(64));
  });
});

describe('D11 revisión: Dart sin nombre en el .sha256sum', () => {
  const BASE = 'https://storage.googleapis.com/dart-archive/channels/stable/release/';
  const LISTADO =
    'https://storage.googleapis.com/storage/v1/b/dart-archive/o?prefix=channels/stable/release/&delimiter=/&maxResults=1000&fields=prefixes,nextPageToken';
  const rutas = (suma: string): Record<string, Ruta> => ({
    [LISTADO]: fixture('dart-versiones.json'),
    [`${BASE}3.14.1/sdk/dartsdk-windows-x64-release.zip.sha256sum`]: suma,
  });

  it('completar lanza IndiceMalformado si el archivo nombra otro zip', async () => {
    await expect(
      fuenteDart.completar!(
        { servicio: 'dart', version: '3.14.1' } as never,
        ctx(rutas(`${'c'.repeat(64)} *dartsdk-macos-arm64-release.zip\n`)),
      ),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('completar lanza IndiceMalformado con un archivo vacío o con basura', async () => {
    for (const t of ['', 'basura\n']) {
      await expect(
        fuenteDart.completar!({ servicio: 'dart', version: '3.14.1' } as never, ctx(rutas(t))),
      ).rejects.toBeInstanceOf(IndiceMalformado);
    }
  });
});

describe('D11 revisión: el índice de Dart exige su ruta exacta', () => {
  const idx = (p: string): string => `https://storage.googleapis.com${p}`;

  it('acepta la ruta exacta y sus subrutas', () => {
    expect(urlIndice(idx('/storage/v1/b/dart-archive/o?prefix=x'))).toBe(true);
    expect(urlIndice(idx('/storage/v1/b/dart-archive/o/channels%2Fstable'))).toBe(false);
    expect(urlIndice(idx('/storage/v1/b/dart-archive/o/algo'))).toBe(true);
  });

  it.each([
    '/storage/v1/b/dart-archive/other',
    '/storage/v1/b/dart-archive/obj',
    '/storage/v1/b/dart-archive/oo',
    '/storage/v1/b/dart-archive%2fo',
    '/storage/v1/b/dart-archive%2Fo',
    '/storage/v1/b/DART-ARCHIVE/o',
    '/storage/v1/b/dart-archive/o;x=1',
    '/storage/v1/b/dart-archive;/o',
    '/DART-ARCHIVE/channels/stable/release/x',
    '/storage/v1/b/otro/o',
  ])('rechaza %s', (p) => {
    expect(urlIndice(idx(p))).toBe(false);
  });

  it.each([
    '/dart-archive/channels/stable/release/3.14.1/x.zip;a',
    '/dart-archive/channels/stable/release/%2fotro/x.zip',
    '/dart-archive/channels/stable/release/%2Fotro/x.zip',
    '/dart-archive/channels/stable/release/%5cotro/x.zip',
    '/dart-archive/Channels/stable/release/x.zip',
    '/DART-ARCHIVE/channels/stable/release/x.zip',
    '/dart-archive/channels/stable/releases/x.zip',
  ])('las descargas rechazan %s', (p) => {
    expect(urlOficial(idx(p))).toBe(false);
  });

  it('las descargas normales pasan', () => {
    expect(
      urlOficial(
        idx('/dart-archive/channels/stable/release/3.14.1/sdk/dartsdk-windows-x64-release.zip'),
      ),
    ).toBe(true);
  });
});

/* ───────────── Detección: Kotlin y Dart ───────────── */

async function carpeta(): Promise<string> {
  return carpetaTemporal('pel-d11r-');
}
async function det(archivos: Record<string, string>) {
  const d = await carpeta();
  for (const [n, t] of Object.entries(archivos)) await writeFile(path.join(d, n), t);
  return (await detectarAmpliada(d, { pgvector: false })).runtimesPedidos;
}

describe('D11 revisión: Kotlin solo si el proyecto realmente lo usa', () => {
  it('un proyecto Java con Kotlin DSL no es un proyecto de Kotlin', async () => {
    const dsl = [
      'plugins {',
      '  java',
      '  `kotlin-dsl`',
      '}',
      'import org.gradle.kotlin.dsl.*',
      'val x = gradle.kotlin.dsl.foo',
      'sourceCompatibility = "17"',
    ].join('\n');
    const r = await det({ 'build.gradle.kts': dsl });
    expect(r).not.toHaveProperty('kotlin');
    expect(r).toMatchObject({ java: '17' });
    expect(
      await det({ 'build.gradle.kts': 'plugins { id("org.gradle.kotlin.kotlin-dsl") }' }),
    ).not.toHaveProperty('kotlin');
    expect(
      await det({ 'build.gradle': '// kotlin version "2.0.0"\nplugins { id "java" }' }),
    ).not.toHaveProperty('kotlin');
  });

  it('kotlin("…"), org.jetbrains.kotlin y kotlin-maven-plugin sí cuentan', async () => {
    expect(await det({ 'build.gradle.kts': 'plugins { kotlin("jvm") }' })).toMatchObject({
      kotlin: null,
    });
    expect(
      await det({ 'build.gradle': "plugins { id 'org.jetbrains.kotlin.jvm' version '2.0.21' }" }),
    ).toMatchObject({ kotlin: '2.0' });
    expect(
      await det({ 'pom.xml': '<project><plugin>kotlin-maven-plugin</plugin></project>' }),
    ).toMatchObject({ kotlin: null });
    // Una mención suelta de kotlin (sin ninguna de las formas anteriores) no basta.
    expect(await det({ 'build.gradle': 'description = "kotlin-ish"' })).not.toHaveProperty(
      'kotlin',
    );
  });
});

describe('D11 revisión: Dart y Flutter', () => {
  it('un pubspec con flutter no añade Dart', async () => {
    const flutterDep = 'name: app\ndependencies:\n  flutter:\n    sdk: flutter\n';
    expect(await det({ 'pubspec.yaml': flutterDep })).not.toHaveProperty('dart');
    expect(
      await det({ 'pubspec.yaml': 'name: app\nflutter:\n  uses-material-design: true\n' }),
    ).not.toHaveProperty('dart');
    expect(
      await det({ 'pubspec.yaml': 'name: a\nenvironment:\n  sdk: ^3.5.0\n  flutter: ">=3.0.0"\n' }),
    ).not.toHaveProperty('dart');
    expect(await det({ 'pubspec.yaml': 'name: a\nenvironment:\n  sdk: ^3.5.0\n' })).toEqual({
      dart: '3.5.0',
    });
  });
});

describe('D11 revisión: Dart respeta el tope y el mayor', () => {
  let base: string;
  let rutas: Rutas;
  beforeEach(async () => {
    base = await carpetaTemporal('pel-d11r-rt-');
    rutas = new Rutas(base);
  });
  const instalarDart = (v: string): void => {
    const exe = path.join(rutas.bin('dart', v), 'bin', 'dart.exe');
    mkdirSync(path.dirname(exe), { recursive: true });
    writeFileSync(exe, 'x');
  };
  const proyecto = async (pubspec: string): Promise<string> => {
    const c = await carpeta();
    writeFileSync(path.join(c, 'pubspec.yaml'), pubspec);
    return c;
  };

  it('">=3.0.0 <4.0.0" no elige un Dart 4', async () => {
    instalarDart('3.14.1');
    instalarDart('4.1.0');
    const r = new Runtimes(rutas);
    const rt = await r.paraProyecto({
      carpeta: await proyecto('environment:\n  sdk: ">=3.0.0 <4.0.0"\n'),
    });
    expect(rt.dart).toBe('3.14.1');
    expect(rt.avisos).toEqual([]);
  });

  it('"^3.5.0" se queda en el mayor 3 aunque haya un Dart 4', async () => {
    instalarDart('3.14.1');
    instalarDart('4.1.0');
    const rt = await new Runtimes(rutas).paraProyecto({
      carpeta: await proyecto('environment:\n  sdk: ^3.5.0\n'),
    });
    expect(rt.dart).toBe('3.14.1');
  });

  it('si solo hay un Dart fuera del tope, no se usa y se avisa', async () => {
    instalarDart('4.1.0');
    const rt = await new Runtimes(rutas).paraProyecto({
      carpeta: await proyecto('environment:\n  sdk: ">=3.0.0 <4.0.0"\n'),
    });
    expect(rt.dart).toBeUndefined();
    expect(rt.avisos[0]).toMatch(/Dart .*no está instalado/);
  });

  it('un proyecto Flutter no entra con Dart y avisa de que Flutter trae el suyo', async () => {
    instalarDart('3.14.1');
    const rt = await new Runtimes(rutas).paraProyecto({
      carpeta: await proyecto('name: app\ndependencies:\n  flutter:\n    sdk: flutter\n'),
    });
    expect(rt.dart).toBeUndefined();
    expect(rt.avisos).toEqual([expect.stringMatching(/Flutter/)]);
  });
});

describe('D11 revisión: carpetas de usuario', () => {
  it('Deno instala sus scripts dentro de la carpeta de datos', () => {
    const datos = 'C:\\datos';
    expect(variablesRuntime('deno', 'C:\\deno', { datos })).toEqual({
      DENO_DIR: path.join(datos, 'cache', 'deno'),
      DENO_INSTALL_ROOT: path.join(datos, 'cache', 'deno'),
    });
  });

  it('con Deno, el bin de DENO_INSTALL_ROOT entra al PATH', async () => {
    const base = await carpetaTemporal('pel-d11r-dn-');
    const r = new Rutas(base);
    expect(r && new Runtimes(r).carpetasPath({ deno: '2.9.8' })).toEqual([
      r.bin('deno', '2.9.8'),
      path.join(base, 'cache', 'deno', 'bin'),
    ]);
    await mkdir(base, { recursive: true });
  });
});

/* ───────────── Fuzz de minisign ───────────── */

function nuevaClave(): { publica: string; firmar: (d: Buffer, c: string) => Buffer } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(12);
  const id = Buffer.from('0123456789abcdef', 'hex');
  return {
    publica: Buffer.concat([Buffer.from('Ed'), id, raw]).toString('base64'),
    firmar(digest, comentario) {
      const firma = sign(null, digest, privateKey);
      const global = sign(null, Buffer.concat([firma, Buffer.from(comentario)]), privateKey);
      return Buffer.from(
        [
          'untrusted comment: signature from minisign secret key',
          Buffer.concat([Buffer.from('ED'), id, firma]).toString('base64'),
          `trusted comment: ${comentario}`,
          global.toString('base64'),
          '',
        ].join('\n'),
      );
    },
  };
}

describe('D11 revisión: fuzz de minisign', () => {
  const k = nuevaClave();
  const digest = createHash('blake2b512').update('x').digest();
  const COMENTARIO = 'timestamp:1\tfile:a.zip\thashed';
  const buena = k.firmar(digest, COMENTARIO);
  let semilla = 987654;
  const azar = (n: number): number => {
    semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
    return semilla % n;
  };

  /** Todo esto jamás lanza: o no se interpreta o se interpreta y se verifica. */
  const intentar = (bytes: Buffer, d: Buffer = digest): boolean => {
    const f = leerMinisig(bytes);
    if ('ok' in f) return false;
    return verificarMinisign({
      clave: k.publica,
      firma: f as FirmaMinisign,
      digest: d,
      nombreArchivo: 'a.zip',
    }).ok;
  };

  it('la firma buena valida (control)', () => {
    expect(intentar(buena)).toBe(true);
  });

  it('truncados en cada posición nunca validan ni lanzan', () => {
    for (let n = 0; n < buena.length - 1; n++)
      expect(() => intentar(buena.subarray(0, n))).not.toThrow();
    for (let n = 0; n < buena.length - 2; n++) expect(intentar(buena.subarray(0, n))).toBe(false);
  });

  it('500 inserciones, 500 borrados y 500 cambios nunca lanzan ni validan una firma distinta', () => {
    for (let i = 0; i < 500; i++) {
      const p = azar(buena.length);
      const ins = Buffer.concat([
        buena.subarray(0, p),
        Buffer.from([azar(256)]),
        buena.subarray(p),
      ]);
      const del = Buffer.concat([buena.subarray(0, p), buena.subarray(p + 1)]);
      const cam = Buffer.from(buena);
      cam[p] = azar(256);
      for (const m of [ins, del, cam]) {
        expect(() => intentar(m)).not.toThrow();
        // Solo vale si lo firmado (líneas 2 a 4) no cambió: p. ej. un cambio en el comentario sin firmar.
        if (intentar(m)) {
          expect(m.toString('utf8').split('\n').slice(1, 4)).toEqual(
            buena.toString('utf8').split('\n').slice(1, 4),
          );
        }
      }
    }
  });

  it('líneas reordenadas, repetidas o con CR sueltos no validan', () => {
    const l = buena.toString('utf8').trimEnd().split('\n');
    const variantes = [
      [l[1], l[0], l[2], l[3]],
      [l[0], l[2], l[1], l[3]],
      [l[0], l[1], l[3], l[2]],
      [l[3], l[2], l[1], l[0]],
      [l[0], l[1], l[2], l[3], l[3]],
      [l[0], l[1], l[1], l[2], l[3]],
    ].map((v) => Buffer.from(`${v.join('\n')}\n`));
    for (const v of variantes) expect(intentar(v)).toBe(false);
    for (const cr of [
      l.join('\r'),
      `${l.join('\n')}\r`,
      l.join('\n\r'),
      `${l[0]}\r${l[1]}\n${l[2]}\n${l[3]}\n`,
      `${l[0]}\n${l[1]}\r\r\n${l[2]}\n${l[3]}\n`,
    ]) {
      expect(() => intentar(Buffer.from(cr))).not.toThrow();
      expect(intentar(Buffer.from(cr))).toBe(false);
    }
  });

  it('un comentario de más de 1 KB (confiable o no) se rechaza', () => {
    const l = buena.toString('utf8').trimEnd().split('\n');
    const largo = 'x'.repeat(1100);
    expect(
      intentar(Buffer.from([`untrusted comment: ${largo}`, l[1], l[2], l[3]].join('\n'))),
    ).toBe(false);
    expect(
      leerMinisig(Buffer.from([l[0], l[1], `trusted comment: ${largo}`, l[3]].join('\n'))),
    ).toMatchObject({ ok: false });
    const firmaLarga = k.firmar(digest, `timestamp:1\tfile:a.zip\t${largo}`);
    expect(leerMinisig(firmaLarga)).toMatchObject({ ok: false });
  });

  it('un digest de otra longitud no lanza y no valida', () => {
    for (const n of [0, 1, 32, 63, 65, 128]) {
      expect(() => intentar(buena, Buffer.alloc(n))).not.toThrow();
      expect(intentar(buena, Buffer.alloc(n))).toBe(false);
    }
  });

  it('claves y firmas con tipos raros no lanzan', () => {
    const f = leerMinisig(buena) as FirmaMinisign;
    for (const clave of [
      '',
      'Ed',
      'A'.repeat(56),
      CLAVE_MINISIGN_ZIG.slice(0, 50),
      '\u0000'.repeat(56),
    ]) {
      expect(() =>
        verificarMinisign({ clave, firma: f, digest, nombreArchivo: 'a.zip' }),
      ).not.toThrow();
    }
    expect(() =>
      verificarMinisign({
        clave: k.publica,
        firma: { ...f, firma: Buffer.alloc(3), firmaGlobal: Buffer.alloc(0), idClave: f.idClave },
        digest,
        nombreArchivo: 'a.zip',
      }),
    ).not.toThrow();
  });
});

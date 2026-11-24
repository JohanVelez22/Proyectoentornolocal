import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  catalogo,
  HOSTS_INDICE,
  HOSTS_PERMITIDOS,
  urlIndice,
  urlOficial,
  type VersionDisponible,
} from '../src/catalogo/catalogo';
import { fuenteDotnet } from '../src/catalogo/fuentes/dotnet';
import { fuenteGo } from '../src/catalogo/fuentes/go';
import { fuenteJava } from '../src/catalogo/fuentes/java';
import { fuenteRust } from '../src/catalogo/fuentes/rust';
import { IndiceMalformado, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import { Instalador } from '../src/catalogo/instalador';
import { extraerZip, MAX_BYTES_ZIP, MAX_ENTRADAS_ZIP } from '../src/catalogo/zip';
import { listaFija, validarIndice } from '../src/catalogo/vivo';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { desinstalarEnCarpeta } from '../src/plataforma/rustupRegistro';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import type { ProgresoInstalacion } from '../src/tipos';
import { fetchFalso, fixture, HOY, zipDe, type Ruta } from './catalogo-falso';
import { carpetaTemporal } from './temporales';

const API = 'https://api.adoptium.net/v3';
const ACTIVOS = (n: number) =>
  `${API}/assets/latest/${n}/hotspot?architecture=x64&image_type=jdk&os=windows`;
const DOTNET = 'https://builds.dotnet.microsoft.com/dotnet/release-metadata/';
const GO_INDICE = 'https://go.dev/dl/?mode=json&include=all';
const RUSTUP =
  'https://static.rust-lang.org/rustup/archive/1.29.3/x86_64-pc-windows-msvc/rustup-init';
const RUST_RELEASES = 'https://api.github.com/repos/rust-lang/rust/releases?per_page=30';

const rutasJava = (): Record<string, Ruta> => ({
  [`${API}/info/available_releases`]: fixture('adoptium-disponibles.json'),
  [ACTIVOS(27)]: fixture('adoptium-27.json'),
  [ACTIVOS(25)]: fixture('adoptium-25.json'),
  [ACTIVOS(21)]: fixture('adoptium-21.json'),
});
const rutasDotnet = (): Record<string, Ruta> => ({
  [`${DOTNET}releases-index.json`]: fixture('dotnet-indice.json'),
  [`${DOTNET}11.0/releases.json`]: fixture('dotnet-11.0.json'),
  [`${DOTNET}10.0/releases.json`]: fixture('dotnet-10.0.json'),
  [`${DOTNET}9.0/releases.json`]: fixture('dotnet-9.0.json'),
  [`${DOTNET}8.0/releases.json`]: fixture('dotnet-8.0.json'),
});
const rutasGo = (): Record<string, Ruta> => ({ [GO_INDICE]: fixture('go-dl.json') });
const rutasRust = (): Record<string, Ruta> => ({
  [RUST_RELEASES]: fixture('rust-releases.json'),
  [`${RUSTUP}.exe.sha256`]: fixture('rustup-init.sha256'),
});

const ctx = (rutas: Record<string, Ruta>): ContextoFuente & { pedidas: string[] } => {
  const ff = fetchFalso(rutas);
  return { f: ff.f, idCatalogo: 'win-x64', ahora: HOY, pedidas: ff.pedidas };
};

const de = (v: VersionDisponible[], version: string): VersionDisponible =>
  v.find((x) => x.version === version)!;

describe('D5: hosts', () => {
  it('cada host nuevo está escrito uno por uno, sin comodines', () => {
    for (const h of [
      'builds.dotnet.microsoft.com',
      'go.dev',
      'dl.google.com',
      'static.rust-lang.org',
    ]) {
      expect(HOSTS_PERMITIDOS).toContain(h);
    }
    for (const h of [
      'api.adoptium.net',
      'builds.dotnet.microsoft.com',
      'go.dev',
      'static.rust-lang.org',
    ]) {
      expect(HOSTS_INDICE).toContain(h);
    }
    // Java baja de GitHub Releases (ya permitido); su API solo es un índice.
    expect(HOSTS_PERMITIDOS).not.toContain('api.adoptium.net');
    for (const h of [...HOSTS_INDICE, ...HOSTS_PERMITIDOS]) expect(h).not.toMatch(/[*?]/);
    expect(urlIndice('https://api.adoptium.net/v3/info/available_releases')).toBe(true);
    expect(urlOficial('https://dl.google.com/go/go1.27.4.windows-amd64.zip')).toBe(true);
    expect(urlOficial('https://evil.dl.google.com/go/x.zip')).toBe(false);
    expect(urlOficial('https://go.dev.evil.com/dl/x.zip')).toBe(false);
  });
});

describe('D5: Java (Temurin)', () => {
  it('LTS y última versión de características, con su SHA-256 y rama', async () => {
    const v = await fuenteJava.listar(ctx(rutasJava()));
    expect(v.map((x) => x.version)).toEqual(['27.0.1', '25.0.5.1', '21.0.13.1']);
    expect(de(v, '25.0.5.1')).toMatchObject({
      servicio: 'java',
      rama: '25',
      soporte: 'lts',
      url: 'https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.5.1%2B2/OpenJDK25U-jdk_x64_windows_hotspot_25.0.5.1_2.zip',
      subcarpeta: 'jdk-25.0.5.1+2',
      ejecutable: 'bin/java.exe',
      formato: 'zip',
      huella: {
        algoritmo: 'sha256',
        valor: '849d380ab0a64d9098e7d3a2de28beb73841c3b255c8284f019ccd8748c5eb5b',
      },
    });
    expect(de(v, '27.0.1').soporte).toBe('actual');
    // Pasa la validación del índice (URL de un host de descarga, huella bien formada).
    expect(() => validarIndice('java', v)).not.toThrow();
  });

  it('un enlace fuera de los binarios de esa versión descarta el índice entero', async () => {
    const malo = JSON.parse(fixture('adoptium-21.json')) as {
      binary: { package: { link: string } };
    }[];
    malo[0]!.binary.package.link =
      'https://github.com/otro/temurin21-binaries/releases/download/x/y.zip';
    const rutas = { ...rutasJava(), [ACTIVOS(21)]: JSON.stringify(malo) };
    await expect(fuenteJava.listar(ctx(rutas))).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('una URL de otro host o una huella mal formada se rechaza al validar el índice', async () => {
    const v = await fuenteJava.listar(ctx(rutasJava()));
    const ajena = v.map((x, i) => (i === 0 ? { ...x, url: 'https://evil.example/jdk.zip' } : x));
    expect(() => validarIndice('java', ajena)).toThrowError(
      expect.objectContaining({ codigo: 'catalogo.indice_invalido' }),
    );
    const sinHuella = v.map((x, i) =>
      i === 0 ? { ...x, huella: { algoritmo: 'sha256' as const, valor: 'zz' }, sha256: 'zz' } : x,
    );
    expect(() => validarIndice('java', sinHuella)).toThrow();
  });

  it('redirección del índice a un host fuera de la lista: se corta antes de pedirlo', async () => {
    const c = ctx({
      ...rutasJava(),
      [`${API}/info/available_releases`]: { ir: 'https://evil.example/x.json' },
    });
    await expect(fuenteJava.listar(c)).rejects.toMatchObject({
      codigo: 'catalogo.redireccion_ajena',
    });
    expect(c.pedidas.some((u) => u.includes('evil.example'))).toBe(false);
  });

  it('en otro sistema devuelve una lista vacía', async () => {
    const c = { ...ctx(rutasJava()), idCatalogo: 'linux-x64' as const };
    expect(await fuenteJava.listar(c)).toEqual([]);
  });
});

describe('D5: .NET SDK', () => {
  it('el último SDK de cada canal desde 8.0, con SHA-512 y su soporte', async () => {
    const c = ctx(rutasDotnet());
    const v = await fuenteDotnet.listar(c);
    expect(v.map((x) => x.version)).toEqual(['11.0.100', '10.0.404', '9.0.321', '8.0.428']);
    expect(de(v, '10.0.404')).toMatchObject({
      servicio: 'dotnet',
      rama: '10.0',
      soporte: 'lts',
      finSoporte: '2028-11-14',
      url: 'https://builds.dotnet.microsoft.com/dotnet/Sdk/10.0.404/dotnet-sdk-10.0.404-win-x64.zip',
      ejecutable: 'dotnet.exe',
      sha256: null,
    });
    expect(de(v, '10.0.404').huella).toMatchObject({ algoritmo: 'sha512' });
    expect(de(v, '10.0.404').huella?.valor).toMatch(/^[0-9a-f]{128}$/);
    expect(de(v, '11.0.100').soporte).toBe('preview');
    expect(de(v, '9.0.321').soporte).toBe('fin');
    // El canal 6.0 no se pide (fuera del mínimo).
    expect(c.pedidas.some((u) => u.includes('/6.0/'))).toBe(false);
    expect(() => validarIndice('dotnet', v)).not.toThrow();
  });

  it.each([
    ['otro host', () => 'https://evil.example/sdk.zip'],
    [
      'otra carpeta del mismo host',
      () =>
        'https://builds.dotnet.microsoft.com/dotnet/otra/9.0.321/dotnet-sdk-9.0.321-win-x64.zip',
    ],
    [
      'otra versión en la ruta',
      () => 'https://builds.dotnet.microsoft.com/dotnet/Sdk/9.0.1/dotnet-sdk-9.0.1-win-x64.zip',
    ],
    [
      'otro archivo',
      () => 'https://builds.dotnet.microsoft.com/dotnet/Sdk/9.0.321/malo-win-x64.zip',
    ],
  ])(
    'una URL del SDK fuera de su carpeta de versión (%s) descarta el índice entero',
    async (_n, url) => {
      const malo = JSON.parse(fixture('dotnet-9.0.json')) as {
        releases: { sdk: { files: { url: string }[] } }[];
      };
      for (const f of malo.releases[0]!.sdk.files) f.url = url();
      await expect(
        fuenteDotnet.listar(
          ctx({ ...rutasDotnet(), [`${DOTNET}9.0/releases.json`]: JSON.stringify(malo) }),
        ),
      ).rejects.toBeInstanceOf(IndiceMalformado);
    },
  );

  it('un releases.json fuera del host oficial descarta el índice', async () => {
    const idx = JSON.parse(fixture('dotnet-indice.json')) as {
      'releases-index': { 'releases.json': string }[];
    };
    idx['releases-index'][1]!['releases.json'] = 'https://evil.example/10.0/releases.json';
    await expect(
      fuenteDotnet.listar(
        ctx({ ...rutasDotnet(), [`${DOTNET}releases-index.json`]: JSON.stringify(idx) }),
      ),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('una redirección a un host fuera de la lista da catalogo.redireccion_ajena', async () => {
    await expect(
      fuenteDotnet.listar(
        ctx({
          ...rutasDotnet(),
          [`${DOTNET}10.0/releases.json`]: { ir: 'https://evil.example/r.json' },
        }),
      ),
    ).rejects.toMatchObject({ codigo: 'catalogo.redireccion_ajena' });
  });
});

describe('D5: Go', () => {
  it('la última versión de cada rama, solo estables, con SHA-256 y como mucho 6 ramas', async () => {
    const v = await fuenteGo.listar(ctx(rutasGo()));
    expect(v.map((x) => x.version)).toEqual([
      '1.27.4',
      '1.26.11',
      '1.25.12',
      '1.24.14',
      '1.23.12',
      '1.22.12',
    ]);
    expect(v.map((x) => x.rama)).toEqual(['1.27', '1.26', '1.25', '1.24', '1.23', '1.22']);
    expect(de(v, '1.27.4')).toMatchObject({
      servicio: 'go',
      url: 'https://go.dev/dl/go1.27.4.windows-amd64.zip',
      subcarpeta: 'go',
      ejecutable: 'bin/go.exe',
      soporte: 'actual',
      huella: {
        algoritmo: 'sha256',
        valor: '178ab98950ac69ab25069307dc6ade79f3816e414cce95b4da166a115cde1e7e',
      },
    });
    expect(de(v, '1.26.11').soporte).toBe('actual');
    expect(de(v, '1.25.12').soporte).toBe('fin');
    expect(() => validarIndice('go', v)).not.toThrow();
  });

  it('un archivo con otro nombre delata un índice manipulado', async () => {
    const malo = JSON.parse(fixture('go-dl.json')) as {
      files: { filename: string; kind: string }[];
    }[];
    for (const f of malo[0]!.files) {
      if (f.kind === 'archive' && f.filename.includes('windows')) f.filename = '../../evil.zip';
    }
    await expect(
      fuenteGo.listar(ctx({ [GO_INDICE]: JSON.stringify(malo) })),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('go.dev/dl/… redirige a dl.google.com (permitido) pero no a otro host', async () => {
    const zip = zipDe({ 'go/bin/go.exe': 'EXE', 'go/VERSION': 'go1.27.4' });
    const rutas = (ir: string): Record<string, Ruta> => ({
      'https://go.dev/dl/go1.27.4.windows-amd64.zip': { ir },
      'https://dl.google.com/go/go1.27.4.windows-amd64.zip': zip,
    });
    const dir = rutasTemp();
    const go = (await fuenteGo.listar(ctx(rutasGo()))).find((x) => x.version === '1.27.4')!;
    const conZip = {
      ...go,
      sha256: sha(zip),
      huella: { algoritmo: 'sha256' as const, valor: sha(zip) },
    };

    const ok = new Instalador(
      await dir.rutas(),
      new Eventos<EventosNucleo>(),
      fetchFalso(rutas('https://dl.google.com/go/go1.27.4.windows-amd64.zip')).f,
    );
    await ok.instalar(conZip);
    expect(await ok.instalados('go')).toEqual(['1.27.4']);

    const ajeno = fetchFalso(rutas('https://evil.example/go.zip'));
    const mal = new Instalador(await dir.rutas(), new Eventos<EventosNucleo>(), ajeno.f);
    await expect(mal.instalar(conZip)).rejects.toMatchObject({
      codigo: 'catalogo.redireccion_ajena',
    });
    expect(ajeno.pedidas.some((u) => u.includes('evil.example'))).toBe(false);
  });
});

describe('D5: Rust', () => {
  it('versiones estables de rust-lang/rust, la última de cada rama; la suma se pide al instalar', async () => {
    const c = ctx(rutasRust());
    const v = await fuenteRust.listar(c);
    expect(v.map((x) => x.version)).toEqual([
      '1.100.0',
      '1.99.1',
      '1.98.0',
      '1.97.0',
      '1.96.0',
      '1.95.0',
    ]);
    expect(de(v, '1.100.0')).toMatchObject({
      servicio: 'rust',
      rama: '1.100',
      url: 'https://static.rust-lang.org/rustup/archive/1.29.3/x86_64-pc-windows-msvc/rustup-init.exe',
      formato: 'exe',
      soporte: 'actual',
      huella: null,
      huellaDiferida: true,
    });
    expect(de(v, '1.99.1').soporte).toBe('fin');
    // Nada de betas, borradores ni etiquetas que no son versión.
    expect(v.some((x) => /beta|nightly|1\.102/.test(x.version))).toBe(false);
    expect(await fuenteRust.completar!(v[0]!, c)).toEqual({
      algoritmo: 'sha256',
      valor: '38027d51d69a5d05493627a0634dbea52d6cd793c8f072d2373d3f4163eec7db',
    });
    expect(() => validarIndice('rust', v)).not.toThrow();
  });

  it('la suma puede traer el nombre del archivo; una suma ilegible da null', async () => {
    const hex = '38027d51d69a5d05493627a0634dbea52d6cd793c8f072d2373d3f4163eec7db';
    const v = (await fuenteRust.listar(ctx(rutasRust())))[0]!;
    const conNombre = ctx({
      ...rutasRust(),
      [`${RUSTUP}.exe.sha256`]: `${hex} *rustup-init.exe\n`,
    });
    expect((await fuenteRust.completar!(v, conNombre))?.valor).toBe(hex);
    const rara = ctx({ ...rutasRust(), [`${RUSTUP}.exe.sha256`]: 'no es una suma' });
    expect(await fuenteRust.completar!(v, rara)).toBeNull();
  });
});

describe('D5: lista fija', () => {
  it.each(['java', 'dotnet', 'go', 'rust'] as const)(
    '%s trae versiones con huella fuerte y URL oficial',
    (s) => {
      const l = listaFija(s);
      expect(l.length).toBeGreaterThan(0);
      for (const e of l) {
        expect(urlOficial(e.url)).toBe(true);
        expect(['sha256', 'sha512']).toContain(e.huella?.algoritmo);
      }
      expect(() =>
        validarIndice(
          s,
          l.map(({ origen, ...r }) => ({ ...r, origen })),
        ),
      ).not.toThrow();
      expect(catalogo[s].length).toBe(l.length);
    },
  );

  it('.NET usa SHA-512 (el que publica su índice) y Go y Java SHA-256', () => {
    expect(listaFija('dotnet')[0]!.huella?.algoritmo).toBe('sha512');
    expect(listaFija('go')[0]!.huella?.algoritmo).toBe('sha256');
    expect(listaFija('java')[0]!.huella?.algoritmo).toBe('sha256');
  });
});

describe('D5: instalar Java con servidor falso', () => {
  it('extrae el JDK en bin/java/<versión> con la carpeta de la release y verifica la huella', async () => {
    const zip = zipDe({ 'jdk-21.0.13.1+2/bin/java.exe': 'EXE', 'jdk-21.0.13.1+2/release': 'x' });
    const j = (await fuenteJava.listar(ctx(rutasJava()))).find((x) => x.version === '21.0.13.1')!;
    const v = { ...j, sha256: sha(zip), huella: { algoritmo: 'sha256' as const, valor: sha(zip) } };
    const dir = rutasTemp();
    const r = await dir.rutas();
    const inst = new Instalador(r, new Eventos<EventosNucleo>(), fetchFalso({ [v.url]: zip }).f);
    await inst.instalar(v);
    expect(existsSync(path.join(r.bin('java', '21.0.13.1'), 'bin', 'java.exe'))).toBe(true);
    // Una descarga alterada no se instala.
    const otro = new Instalador(
      await dir.rutas(),
      new Eventos<EventosNucleo>(),
      fetchFalso({ [v.url]: zipDe({ 'jdk-21.0.13.1+2/bin/java.exe': 'OTRO' }) }).f,
    );
    await expect(otro.instalar(v)).rejects.toMatchObject({ codigo: 'catalogo.huella_no_coincide' });
  });
});

/* ───────────── Rust: rustup dentro de la carpeta de datos ───────────── */

const sha = (b: Buffer | string): string => createHash('sha256').update(b).digest('hex');

const temporales: string[] = [];
afterEach(async () => {
  for (const t of temporales.splice(0)) await rm(t, { recursive: true, force: true });
});
function rutasTemp(): { rutas: () => Promise<Rutas> } {
  return {
    rutas: async () => {
      const base = await carpetaTemporal('pel-d5-');
      temporales.push(base);
      const r = new Rutas(base);
      await r.asegurar();
      return r;
    },
  };
}

describe('D5: InstaladorRust', () => {
  const INIT = Buffer.from('rustup-init-falso');
  let rutas: Rutas;
  let eventos: Eventos<EventosNucleo>;
  let progreso: ProgresoInstalacion[];
  let llamadas: { cmd: string; args: string[]; env?: Record<string, string> }[];
  let borrar: string[];

  beforeEach(async () => {
    rutas = await rutasTemp().rutas();
    eventos = new Eventos<EventosNucleo>();
    progreso = [];
    eventos.on('instalacion:progreso', (p) => progreso.push(p));
    llamadas = [];
    borrar = [];
  });

  /** Ejecutor falso: rustup-init deja rustup en CARGO_HOME y `toolchain install` crea el toolchain. */
  const ejecutor = (): Ejecutor => async (cmd, args, o) => {
    llamadas.push({ cmd, args, ...(o?.env ? { env: o.env } : {}) });
    const env = o?.env ?? {};
    if (args[0] === '-y') {
      const bin = path.join(env['CARGO_HOME']!, 'bin');
      await mkdir(bin, { recursive: true });
      await writeFile(path.join(bin, 'rustup.exe'), 'rustup');
    } else if (args[0] === 'toolchain' && args[1] === 'install') {
      const bin = path.join(
        env['RUSTUP_HOME']!,
        'toolchains',
        `${args[2]}-x86_64-pc-windows-msvc`,
        'bin',
      );
      await mkdir(bin, { recursive: true });
      await writeFile(path.join(bin, 'rustc.exe'), 'rustc');
      await writeFile(path.join(bin, 'cargo.exe'), 'cargo');
      const rustlib = path.join(bin, '..', 'lib', 'rustlib');
      await mkdir(rustlib, { recursive: true });
      await writeFile(path.join(rustlib, 'multirust-channel-manifest.toml'), '');
    } else if (args[0] === 'toolchain' && args[1] === 'uninstall') {
      borrar.push(args[2]!);
      await rm(path.join(env['RUSTUP_HOME']!, 'toolchains', `${args[2]}-x86_64-pc-windows-msvc`), {
        recursive: true,
        force: true,
      });
    }
    return { codigo: 0, stdout: '', stderr: '' };
  };

  const instalador = (rutasFalsas: Record<string, Ruta>, exec = ejecutor()): Instalador =>
    new Instalador(rutas, eventos, fetchFalso(rutasFalsas).f, { exec });

  const fuente = async (): Promise<VersionDisponible> =>
    (await fuenteRust.listar(ctx(rutasRust())))[0]!;

  it('descarga rustup-init verificado, lo corre con RUSTUP_HOME y CARGO_HOME propios y instala el toolchain', async () => {
    const inst = instalador({
      [`${RUSTUP}.exe.sha256`]: `${sha(INIT)}\n`,
      [`${RUSTUP}.exe`]: INIT,
    });
    await inst.instalar(await fuente());
    expect(llamadas).toHaveLength(2);
    const [init, tc] = llamadas;
    expect(init!.args).toEqual([
      '-y',
      '--no-modify-path',
      '--default-toolchain',
      'none',
      '--profile',
      'minimal',
    ]);
    expect(tc!.args).toEqual([
      'toolchain',
      'install',
      '1.100.0',
      '--profile',
      'minimal',
      '--no-self-update',
    ]);
    const raiz = path.join(rutas.base, 'bin', 'rust');
    for (const l of llamadas) {
      expect(l.env).toEqual({
        RUSTUP_HOME: path.join(raiz, 'rustup'),
        CARGO_HOME: path.join(raiz, 'cargo'),
        RUSTUP_DIST_SERVER: '',
        RUSTUP_UPDATE_ROOT: '',
        RUSTUP_TOOLCHAIN: '',
      });
    }
    expect(tc!.cmd).toBe(path.join(raiz, 'cargo', 'bin', 'rustup.exe'));
    expect(await inst.instalados('rust')).toEqual(['1.100.0']);
    expect(await inst.instalado('rust', '1.100.0')).toBe(true);
    expect(progreso.at(-1)).toMatchObject({ servicio: 'rust', fase: 'listo', porcentaje: 100 });
    // Nada queda en tmp.
    expect(await readdir(rutas.tmp())).toEqual([]);
  });

  it('con un .sha256 distinto, rustup-init no se ejecuta y se borra', async () => {
    const inst = instalador({
      [`${RUSTUP}.exe.sha256`]: `${'0'.repeat(64)}\n`,
      [`${RUSTUP}.exe`]: INIT,
    });
    await expect(inst.instalar(await fuente())).rejects.toMatchObject({
      codigo: 'catalogo.huella_no_coincide',
    });
    expect(llamadas).toEqual([]);
    expect(await readdir(rutas.tmp())).toEqual([]);
    expect(progreso.at(-1)?.fase).toBe('error');
  });

  it('sin .sha256 pide confirmación; con ella instala sin verificar', async () => {
    const f = { [`${RUSTUP}.exe`]: INIT } as Record<string, Ruta>;
    await expect(instalador(f).instalar(await fuente())).rejects.toMatchObject({
      codigo: 'catalogo.sin_huella',
    });
    expect(llamadas).toEqual([]);
    await instalador(f).instalar(await fuente(), { confirmarSinHuella: true });
    expect(llamadas).toHaveLength(2);
  });

  it('si el .sha256 no responde: huella_no_disponible (nunca "sin huella")', async () => {
    const inst = new Instalador(rutas, eventos, fetchFalso({}, true).f, { exec: ejecutor() });
    await expect(inst.instalar(await fuente(), { confirmarSinHuella: true })).rejects.toMatchObject(
      {
        codigo: 'catalogo.huella_no_disponible',
      },
    );
    expect(llamadas).toEqual([]);
  });

  it('una redirección de rustup-init a un host ajeno se corta y no se ejecuta nada', async () => {
    const ff = fetchFalso({
      [`${RUSTUP}.exe.sha256`]: `${sha(INIT)}\n`,
      [`${RUSTUP}.exe`]: { ir: 'https://evil.example/rustup-init.exe' },
    });
    const inst = new Instalador(rutas, eventos, ff.f, { exec: ejecutor() });
    await expect(inst.instalar(await fuente())).rejects.toMatchObject({
      codigo: 'catalogo.redireccion_ajena',
    });
    expect(ff.pedidas.some((u) => u.includes('evil.example'))).toBe(false);
    expect(llamadas).toEqual([]);
  });

  it('un segundo toolchain reutiliza rustup (no vuelve a descargar rustup-init)', async () => {
    const ff = fetchFalso({ [`${RUSTUP}.exe.sha256`]: `${sha(INIT)}\n`, [`${RUSTUP}.exe`]: INIT });
    const inst = new Instalador(rutas, eventos, ff.f, { exec: ejecutor() });
    const v = await fuente();
    await inst.instalar(v);
    await inst.instalar({ ...v, version: '1.99.1', rama: '1.99' });
    expect(ff.pedidas.filter((u) => u.endsWith('rustup-init.exe'))).toHaveLength(1);
    expect(await inst.instalados('rust')).toEqual(['1.100.0', '1.99.1']);
    // Instalar uno ya instalado repite solo `toolchain install` (idempotente): sin bajar nada.
    const antes = llamadas.length;
    await inst.instalar(v);
    expect(llamadas.slice(antes).map((l) => l.args.slice(0, 2))).toEqual([
      ['toolchain', 'install'],
    ]);
    expect(ff.pedidas.filter((u) => u.endsWith('.sha256'))).toHaveLength(1);
  });

  it('desinstalar quita solo el toolchain y nunca borra la carpeta de datos', async () => {
    const inst = instalador({
      [`${RUSTUP}.exe.sha256`]: `${sha(INIT)}\n`,
      [`${RUSTUP}.exe`]: INIT,
    });
    await inst.instalar(await fuente());
    await mkdir(path.join(rutas.base, 'data', 'mysql'), { recursive: true });
    await inst.desinstalar('rust', '1.100.0');
    expect(borrar).toEqual(['1.100.0']);
    expect(await inst.instalados('rust')).toEqual([]);
    expect(existsSync(path.join(rutas.base, 'data', 'mysql'))).toBe(true);
    expect(
      await readFile(path.join(rutas.base, 'bin', 'rust', 'cargo', 'bin', 'rustup.exe'), 'utf8'),
    ).toBe('rustup');
    await expect(inst.desinstalar('rust', '../x')).rejects.toBeDefined();
  });

  it('no usa ~/.cargo ni ~/.rustup: ninguna ruta ni variable apunta fuera de la carpeta de datos', async () => {
    const inst = instalador({
      [`${RUSTUP}.exe.sha256`]: `${sha(INIT)}\n`,
      [`${RUSTUP}.exe`]: INIT,
    });
    await inst.instalar(await fuente());
    for (const l of llamadas) {
      for (const val of [l.cmd, ...Object.values(l.env ?? {})].filter((x) => x !== '')) {
        expect(val.startsWith(rutas.base)).toBe(true);
      }
      // Nunca se toca el PATH.
      expect(Object.keys(l.env ?? {}).some((k) => k.toLowerCase() === 'path')).toBe(false);
      expect(l.args).toContain(l.args[0] === '-y' ? '--no-modify-path' : l.args[0]);
    }
  });

  const servidor = (): Record<string, Ruta> => ({
    [`${RUSTUP}.exe.sha256`]: `${sha(INIT)}\n`,
    [`${RUSTUP}.exe`]: INIT,
  });

  it('un toolchain a medias (solo rustc) no cuenta como instalado y se repara al instalar', async () => {
    const tc = path.join(
      rutas.base,
      'bin',
      'rust',
      'rustup',
      'toolchains',
      '1.100.0-x86_64-pc-windows-msvc',
      'bin',
    );
    await mkdir(tc, { recursive: true });
    await writeFile(path.join(tc, 'rustc.exe'), 'rustc');
    const inst = instalador(servidor());
    expect(await inst.instalados('rust')).toEqual([]);
    expect(await inst.instalado('rust', '1.100.0')).toBe(false);
    await inst.instalar(await fuente());
    expect(await inst.instalados('rust')).toEqual(['1.100.0']);
  });

  it('el .sha256 solo se pide si rustup todavía no está', async () => {
    const ff = fetchFalso(servidor());
    const inst = new Instalador(rutas, eventos, ff.f, { exec: ejecutor() });
    await inst.instalar(await fuente());
    expect(ff.pedidas.filter((u) => u.endsWith('.sha256'))).toHaveLength(1);
    await inst.instalar({ ...(await fuente()), version: '1.99.1', rama: '1.99' });
    expect(ff.pedidas.filter((u) => u.endsWith('.sha256'))).toHaveLength(1);
  });

  it('dos instalaciones a la vez se ejecutan una detrás de otra', async () => {
    let activas = 0;
    let maximo = 0;
    const base = ejecutor();
    const lento: Ejecutor = async (c, a, o) => {
      activas++;
      maximo = Math.max(maximo, activas);
      await new Promise((r) => setTimeout(r, 15));
      const res = await base(c, a, o);
      activas--;
      return res;
    };
    const inst = instalador(servidor(), lento);
    const v = await fuente();
    await Promise.all([
      inst.instalar(v),
      inst.instalar({ ...v, version: '1.99.1', rama: '1.99' }),
      inst.instalar({ ...v, version: '1.98.0', rama: '1.98' }),
    ]);
    expect(maximo).toBe(1);
    expect(await inst.instalados('rust')).toEqual(['1.100.0', '1.98.0', '1.99.1']);
  });

  it('los fallos de rustup salen con código, datos y el final del stderr', async () => {
    const base = ejecutor();
    const falla: Ejecutor = async (c, a, o) => {
      if (a[0] === 'toolchain') {
        return {
          codigo: 3,
          stdout: '',
          stderr: 'linea 1\nerror: no se pudo bajar el componente\n',
        };
      }
      return base(c, a, o);
    };
    await expect(instalador(servidor(), falla).instalar(await fuente())).rejects.toMatchObject({
      codigo: 'rust.toolchain_fallo',
      datos: { version: '1.100.0', codigo: 3 },
    });
    rutas = await rutasTemp().rutas();
    const init: Ejecutor = async () => ({ codigo: 9, stdout: '', stderr: 'boom' });
    await expect(instalador(servidor(), init).instalar(await fuente())).rejects.toMatchObject({
      codigo: 'rust.rustup_init_fallo',
      datos: { codigo: 9, detalle: 'boom' },
    });
    rutas = await rutasTemp().rutas();
    const sinExe = fetchFalso({ [`${RUSTUP}.exe.sha256`]: `${sha(INIT)}\n` });
    await expect(
      new Instalador(rutas, eventos, sinExe.f, { exec: ejecutor() }).instalar(await fuente()),
    ).rejects.toMatchObject({ codigo: 'rust.descarga_fallo', datos: { estado: 404 } });
  });

  it('la señal llega a los procesos de rustup y el entorno vacía lo heredado que los desvíe', async () => {
    const ctl = new AbortController();
    const vistas: (AbortSignal | undefined)[] = [];
    const base = ejecutor();
    const espia: Ejecutor = async (c, a, o) => {
      vistas.push(o?.senal);
      return base(c, a, o);
    };
    await new Instalador(rutas, eventos, fetchFalso(servidor()).f, { exec: espia }).instalar(
      await fuente(),
      { senal: ctl.signal },
    );
    expect(vistas).toHaveLength(2);
    expect(vistas.every((x) => x === ctl.signal)).toBe(true);
    for (const l of llamadas) {
      expect(l.env).toMatchObject({
        RUSTUP_DIST_SERVER: '',
        RUSTUP_UPDATE_ROOT: '',
        RUSTUP_TOOLCHAIN: '',
      });
    }
  });

  it('entrada de desinstalación de rustup: la nuestra se borra, la ajena se respeta y se avisa', async () => {
    const plat = new PlataformaFalsa();
    const avisos: string[] = [];
    const instalarCon = async (uninstall: (base: string) => string | null): Promise<void> => {
      rutas = await rutasTemp().rutas();
      plat.entradaRustup = uninstall(rutas.base);
      await new Instalador(rutas, eventos, fetchFalso(servidor()).f, {
        exec: ejecutor(),
        plataforma: plat,
        alAvisar: (c) => avisos.push(c),
      }).instalar(await fuente());
    };
    // Nuestra: apunta dentro de la carpeta de datos.
    await instalarCon(
      (b) => `"${path.join(b, 'bin', 'rust', 'cargo', 'bin', 'rustup.exe')}" self uninstall`,
    );
    expect(plat.entradaRustup).toBeNull();
    expect(avisos).toEqual([]);
    // Ajena: otra instalación del usuario.
    const ajena = '"C:\\Users\\ana\\.cargo\\bin\\rustup.exe" self uninstall';
    await instalarCon(() => ajena);
    expect(plat.entradaRustup).toBe(ajena);
    expect(avisos).toEqual(['avisos.rustup_entrada_ajena']);
    // Sin entrada: nada.
    await instalarCon(() => null);
    expect(avisos).toHaveLength(1);
  });

  it('desinstalarEnCarpeta: solo si el desinstalador está dentro de la carpeta de datos', () => {
    const datos = 'C:\\Users\\ana\\AppData\\Local\\WolfCoreDev';
    const dentro = `${datos}\\bin\\rust\\cargo\\bin\\rustup.exe`;
    expect(desinstalarEnCarpeta(`"${dentro}" self uninstall`, datos)).toBe(true);
    expect(desinstalarEnCarpeta(`${dentro} self uninstall`, datos)).toBe(true);
    expect(desinstalarEnCarpeta(`"${datos.toLowerCase()}\\x\\rustup.exe"`, datos)).toBe(true);
    for (const mal of [
      '"C:\\Users\\ana\\.cargo\\bin\\rustup.exe" self uninstall',
      `"${datos}\\..\\..\\rustup.exe"`,
      `"${datos}-otra\\rustup.exe"`,
      '"rustup.exe"',
      '',
      `"${datos}"`,
    ]) {
      expect(desinstalarEnCarpeta(mal, datos), mal).toBe(false);
    }
  });
});

describe('D5 revisión: topes del zip', () => {
  it('rechaza más entradas o más bytes que los topes y deja pasar un paquete normal', async () => {
    const dir = await carpetaTemporal('pel-zip-');
    const archivos: Record<string, string> = {};
    for (let i = 0; i < 6; i++) archivos[`d/f${i}.txt`] = 'x'.repeat(100);
    const z = path.join(dir, 'a.zip');
    await writeFile(z, zipDe(archivos));
    await extraerZip(z, path.join(dir, 'ok'));
    expect(existsSync(path.join(dir, 'ok', 'd', 'f5.txt'))).toBe(true);
    await expect(extraerZip(z, path.join(dir, 'e'), { maxEntradas: 5 })).rejects.toMatchObject({
      codigo: 'instalador.zip_demasiado_grande',
    });
    await expect(extraerZip(z, path.join(dir, 'b'), { maxBytes: 500 })).rejects.toMatchObject({
      codigo: 'instalador.zip_demasiado_grande',
    });
  });

  it('los topes por defecto dejan sitio al SDK de .NET y al JDK', () => {
    expect(MAX_ENTRADAS_ZIP).toBeGreaterThanOrEqual(100_000);
    expect(MAX_BYTES_ZIP).toBeGreaterThanOrEqual(4 * 1024 ** 3);
  });
});

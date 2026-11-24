import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { detectarProyecto as detectarAmpliada } from '../src/proyectos/detectar';
import { detectarSitio as detectarProyecto } from '../src/sitios/detectar';

async function carpeta(nombre: string): Promise<string> {
  const base = await carpetaTemporal('pel-det-');
  const dir = join(base, nombre);
  await mkdir(dir, { recursive: true });
  return dir;
}

describe('detectarProyecto', () => {
  it('detecta laravel con la versión de PHP', async () => {
    const d = await carpeta('WolfCore System');
    await writeFile(join(d, 'artisan'), '');
    await writeFile(join(d, 'composer.json'), JSON.stringify({ require: { php: '^8.4.1' } }));
    expect(await detectarProyecto(d)).toEqual({
      tipo: 'laravel',
      php: '8.4',
      sugerenciaDominio: 'wolfcore-system.test',
      urlBaseVar: 'APP_URL',
    });
  });

  it('laravel con ^8.3 da 8.3', async () => {
    const d = await carpeta('api');
    await writeFile(join(d, 'artisan'), '');
    await writeFile(join(d, 'composer.json'), JSON.stringify({ require: { php: '^8.3' } }));
    expect((await detectarProyecto(d)).php).toBe('8.3');
  });

  it('detecta codeigniter3 con APP_BASE_URL en .env', async () => {
    const d = await carpeta('Gestión Ñandú');
    await mkdir(join(d, 'application'));
    await mkdir(join(d, 'system/core'), { recursive: true });
    await writeFile(join(d, 'system/core/CodeIgniter.php'), '');
    await writeFile(join(d, '.env'), 'APP_BASE_URL=http://x.test/\n');
    const r = await detectarProyecto(d);
    expect(r.tipo).toBe('codeigniter3');
    expect(r.urlBaseVar).toBe('APP_BASE_URL');
    expect(r.sugerenciaDominio).toBe('gestion-nandu.test');
  });

  it('codeigniter3 sin la variable da null', async () => {
    const d = await carpeta('ci');
    await mkdir(join(d, 'application'));
    await mkdir(join(d, 'system/core'), { recursive: true });
    await writeFile(join(d, 'system/core/CodeIgniter.php'), '');
    expect((await detectarProyecto(d)).urlBaseVar).toBeNull();
  });

  it('codeigniter3 no deriva php de composer.json', async () => {
    const d = await carpeta('ci-composer');
    await mkdir(join(d, 'application'));
    await mkdir(join(d, 'system/core'), { recursive: true });
    await writeFile(join(d, 'system/core/CodeIgniter.php'), '');
    await writeFile(join(d, 'composer.json'), JSON.stringify({ require: { php: '>=5.3.7' } }));
    expect((await detectarProyecto(d)).php).toBeNull();
  });

  it('detecta estático y personalizado', async () => {
    const d = await carpeta('Sitio Web');
    await writeFile(join(d, 'index.html'), '');
    expect(await detectarProyecto(d)).toEqual({
      tipo: 'estatico',
      php: null,
      sugerenciaDominio: 'sitio-web.test',
      urlBaseVar: null,
    });
    const p = await carpeta('legacy');
    await writeFile(join(p, 'index.php'), '');
    expect((await detectarProyecto(p)).tipo).toBe('personalizado');
  });
});

describe('D5: Java, .NET, Go y Rust en la detección ampliada', () => {
  const det = async (archivos: Record<string, string>) => {
    const d = await carpeta('proy');
    for (const [n, t] of Object.entries(archivos)) await writeFile(join(d, n), t);
    return (await detectarAmpliada(d, { pgvector: false })).runtimesPedidos;
  };

  it('sin archivos de esos lenguajes no hay ninguna clave', async () => {
    expect(await det({ 'index.html': '' })).toEqual({});
  });

  it('pom.xml: maven.compiler.release, java.version, 1.8 y sin versión', async () => {
    const pom = (p: string) => `<project><properties>${p}</properties></project>`;
    expect(
      await det({ 'pom.xml': pom('<maven.compiler.release>21</maven.compiler.release>') }),
    ).toEqual({
      java: '21',
    });
    expect(await det({ 'pom.xml': pom('<java.version>17</java.version>') })).toEqual({
      java: '17',
    });
    expect(
      await det({ 'pom.xml': pom('<maven.compiler.source>1.8</maven.compiler.source>') }),
    ).toEqual({
      java: '8',
    });
    expect(await det({ 'pom.xml': '<project/>' })).toEqual({ java: null });
  });

  it('build.gradle(.kts): toolchain y sourceCompatibility', async () => {
    expect(
      await det({
        'build.gradle.kts':
          'java { toolchain { languageVersion.set(JavaLanguageVersion.of(21)) } }',
      }),
    ).toEqual({ java: '21' });
    expect(await det({ 'build.gradle': "sourceCompatibility = '17'" })).toEqual({ java: '17' });
    expect(await det({ 'build.gradle': 'plugins { id "java" }' })).toEqual({ java: null });
  });

  it('global.json, *.csproj y *.sln', async () => {
    expect(await det({ 'global.json': '{"sdk":{"version":"8.0.100"}}' })).toEqual({
      dotnet: '8.0',
    });
    expect(
      await det({
        'App.csproj':
          '<Project><PropertyGroup><TargetFramework>net9.0</TargetFramework></PropertyGroup></Project>',
      }),
    ).toEqual({ dotnet: '9.0' });
    expect(await det({ 'App.sln': '' })).toEqual({ dotnet: null });
    // net48 (Framework) no es un SDK que se instale aquí.
    expect(
      await det({ 'Vieja.csproj': '<Project><TargetFramework>net48</TargetFramework></Project>' }),
    ).toEqual({ dotnet: null });
    // Un global.json roto no tumba la detección.
    expect(await det({ 'global.json': '{roto' })).toEqual({ dotnet: null });
  });

  it('go.mod: go y toolchain', async () => {
    expect(await det({ 'go.mod': 'module x\n\ngo 1.22.0\n' })).toEqual({ go: '1.22.0' });
    expect(await det({ 'go.mod': 'module x\n\ngo 1.22\n\ntoolchain go1.22.5\n' })).toEqual({
      go: '1.22.5',
    });
    expect(await det({ 'go.mod': 'module x\n' })).toEqual({ go: null });
  });

  it('rust-toolchain(.toml) y Cargo.toml', async () => {
    expect(await det({ 'rust-toolchain.toml': '[toolchain]\nchannel = "1.85.0"\n' })).toEqual({
      rust: '1.85.0',
    });
    expect(await det({ 'rust-toolchain': '1.80.1\n' })).toEqual({ rust: '1.80.1' });
    // "stable" o "nightly" no son una versión instalable por número.
    expect(
      await det({ 'rust-toolchain.toml': '[toolchain]\nchannel = "nightly-2025-01-01"\n' }),
    ).toEqual({ rust: null });
    expect(await det({ 'Cargo.toml': '[package]\nname = "x"\n' })).toEqual({ rust: null });
  });

  it('un archivo de más de 1 MB no se interpreta y varios lenguajes conviven', async () => {
    const grande = `module x\n${'// '.padEnd(1024 * 1024 + 10, 'x')}\ngo 1.22\n`;
    expect(await det({ 'go.mod': grande })).toEqual({});
    expect(await det({ 'go.mod': 'module x\ngo 1.21\n', 'pom.xml': '<project/>' })).toEqual({
      go: '1.21',
      java: null,
    });
  });
});

describe('D5 revisión: archivos hostiles no congelan la detección', () => {
  const det = async (archivos: Record<string, string>) => {
    const d = await carpeta('proy');
    for (const [n, t] of Object.entries(archivos)) await writeFile(join(d, n), t);
    const t0 = Date.now();
    const r = (await detectarAmpliada(d, { pgvector: false })).runtimesPedidos;
    return { r, ms: Date.now() - t0 };
  };
  const MB = 1024 * 1024;
  const hostiles: [string, string][] = [
    ['1 MB de saltos de línea', '\n'.repeat(MB)],
    ['1 MB de espacios', ' '.repeat(MB)],
    ['60 KB de saltos de línea', '\n'.repeat(60 * 1024)],
    ['60 KB de espacios', ' '.repeat(60 * 1024)],
    ['60 KB de "go " repetido', 'go '.repeat(20 * 1024)],
    ['60 KB de tabulaciones y canal', `channel${'\t'.repeat(60 * 1024)}`],
  ];

  it.each(hostiles)('%s en cada archivo de proyecto termina en menos de 1 s', async (_n, texto) => {
    const { ms } = await det({
      'go.mod': texto,
      'pom.xml': texto,
      'build.gradle': texto,
      'rust-toolchain.toml': texto,
      'global.json': texto,
      'App.csproj': texto,
    });
    expect(ms).toBeLessThan(1000);
  });

  it('un go.mod de 1 MB no se interpreta; uno de 60 KB con la versión al final sí', async () => {
    expect((await det({ 'go.mod': 'x\n'.repeat(MB / 2) })).r).toEqual({});
    const justo = `${'// c\n'.repeat(10_000)}go 1.23\n`;
    expect((await det({ 'go.mod': justo })).r).toEqual({ go: '1.23' });
  });

  it('solo se leen 20 proyectos de .NET', async () => {
    const archivos: Record<string, string> = {};
    for (let i = 0; i < 30; i++) {
      archivos[`P${String(i).padStart(2, '0')}.csproj`] =
        i === 25 ? '<Project><TargetFramework>net9.0</TargetFramework></Project>' : '<Project/>';
    }
    // El que pide net9.0 es el 26.º: queda fuera del tope, el proyecto sigue siendo .NET.
    expect((await det(archivos)).r).toEqual({ dotnet: null });
  });

  it('rust-toolchain con un canal no numérico lo informa', async () => {
    const d = await carpeta('rt');
    await writeFile(
      join(d, 'rust-toolchain.toml'),
      '[toolchain]\nchannel = "nightly-2025-01-01"\n',
    );
    const { pedidosLenguajes } = await import('../src/runtimes/lenguajes');
    expect((await pedidosLenguajes(d)).rust).toMatchObject({
      version: null,
      canal: 'nightly-2025-01-01',
    });
  });
});

describe('D11: Bun, Deno, Zig, Kotlin y Dart en la detección ampliada', () => {
  const det = async (archivos: Record<string, string>) => {
    const d = await carpeta('proy');
    for (const [n, t] of Object.entries(archivos)) await writeFile(join(d, n), t);
    return (await detectarAmpliada(d, { pgvector: false })).runtimesPedidos;
  };

  it('Bun: bun.lock(b), bunfig.toml, .bun-version y packageManager', async () => {
    expect(await det({ 'bun.lockb': '' })).toEqual({ bun: null });
    expect(await det({ 'bunfig.toml': '' })).toEqual({ bun: null });
    expect(await det({ 'bun.lock': '', '.bun-version': 'v1.1.8\n' })).toEqual({ bun: '1.1.8' });
    expect(await det({ 'package.json': '{"packageManager":"bun@1.2.3"}' })).toEqual({
      bun: '1.2.3',
    });
    // Un proyecto de npm o pnpm no es un proyecto de Bun.
    expect(await det({ 'package.json': '{"packageManager":"pnpm@9.0.0"}' })).toEqual({});
    expect(await det({ 'package.json': '{"name":"x"}' })).toEqual({});
  });

  it('Deno: deno.json(c), deno.lock y .dvmrc', async () => {
    expect(await det({ 'deno.json': '{}' })).toEqual({ deno: null });
    expect(await det({ 'deno.jsonc': '{}' })).toEqual({ deno: null });
    expect(await det({ 'deno.lock': '{}', '.dvmrc': '2.9.8' })).toEqual({ deno: '2.9.8' });
  });

  it('Zig: build.zig, .zigversion y minimum_zig_version (se fija la rama)', async () => {
    expect(await det({ 'build.zig': '' })).toEqual({ zig: null });
    expect(await det({ 'build.zig': '', '.zigversion': '0.14.1' })).toEqual({ zig: '0.14' });
    expect(
      await det({ 'build.zig.zon': '.{\n  .name = .x,\n  .minimum_zig_version = "0.15.1",\n}' }),
    ).toEqual({ zig: '0.15' });
  });

  it('Kotlin: Gradle con Kotlin (con o sin versión), Maven y archivos .kt', async () => {
    expect(
      await det({ 'build.gradle.kts': 'plugins { kotlin("jvm") version "2.0.21" }' }),
    ).toMatchObject({ kotlin: '2.0' });
    expect(
      await det({ 'build.gradle': "plugins { id 'org.jetbrains.kotlin.jvm' version '1.9.24' }" }),
    ).toMatchObject({ kotlin: '1.9' });
    expect(await det({ 'build.gradle.kts': 'plugins { kotlin("jvm") }' })).toMatchObject({
      kotlin: null,
    });
    expect(
      await det({ 'pom.xml': '<project><plugin>kotlin-maven-plugin</plugin></project>' }),
    ).toMatchObject({ kotlin: null });
    expect(await det({ 'Main.kt': 'fun main() {}' })).toEqual({ kotlin: null });
    // Gradle sin Kotlin no marca Kotlin (solo Java).
    expect(await det({ 'build.gradle': 'plugins { id "java" }' })).toEqual({ java: null });
  });

  it('Dart: environment.sdk del pubspec (^ y rangos); sin él, sin versión', async () => {
    expect(await det({ 'pubspec.yaml': 'name: x\nenvironment:\n  sdk: ^3.5.0\n' })).toEqual({
      dart: '3.5.0',
    });
    expect(await det({ 'pubspec.yaml': 'environment:\n  sdk: ">=3.0.0 <4.0.0"\n' })).toEqual({
      dart: '3.0.0',
    });
    expect(await det({ 'pubspec.yaml': 'name: x\n' })).toEqual({ dart: null });
    // Un `sdk:` fuera de `environment` (en una dependencia que no es Flutter) no cuenta.
    expect(
      await det({ 'pubspec.yaml': 'name: x\ndependencies:\n  otra:\n    sdk: ^9.9.9\n' }),
    ).toEqual({ dart: null });
  });

  it('sin archivos de esos lenguajes no hay ninguna clave', async () => {
    expect(await det({ 'index.html': '', 'package.json': '{}' })).toEqual({});
  });
});

describe('D11: archivos hostiles de Bun, Deno, Zig, Kotlin y Dart no congelan la detección', () => {
  const MB = 1024 * 1024;
  const hostiles: [string, string][] = [
    ['1 MB de saltos de línea', '\n'.repeat(MB)],
    ['60 KB de espacios', ' '.repeat(60 * 1024)],
    ['60 KB de "sdk" repetido', 'sdk '.repeat(15 * 1024)],
    ['60 KB de líneas de environment', 'environment:\n'.repeat(4000)],
    ['60 KB de "kotlin version" repetido', 'kotlin version '.repeat(4000)],
    ['60 KB de tabulaciones', '.minimum_zig_version\t'.repeat(3000)],
  ];

  it.each(hostiles)('%s en cada archivo termina en menos de 1 s', async (_n, texto) => {
    const d = await carpeta('proy');
    for (const n of [
      'pubspec.yaml',
      'build.zig.zon',
      '.zigversion',
      'build.gradle.kts',
      'pom.xml',
      'package.json',
      '.bun-version',
      '.dvmrc',
      'deno.json',
      'bun.lockb',
    ]) {
      await writeFile(join(d, n), texto);
    }
    const t0 = Date.now();
    await detectarAmpliada(d, { pgvector: false });
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});

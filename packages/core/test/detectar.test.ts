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

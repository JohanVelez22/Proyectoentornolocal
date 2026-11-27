import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  catalogo,
  CatalogoSchema,
  HOSTS_PERMITIDOS,
  urlOficial,
  type VersionDisponible,
} from '../src/catalogo/catalogo';
import { extraer7z } from '../src/catalogo/extraer7z';
import { fuenteRuby } from '../src/catalogo/fuentes/ruby';
import { IndiceMalformado, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import { Instalador } from '../src/catalogo/instalador';
import { aplicarListaFija, listaFija, validarIndice } from '../src/catalogo/vivo';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { Ejecutor } from '../src/plataforma/tipos';
import { detectarProyecto } from '../src/proyectos/detectar';
import { resolverPrograma, type Herramientas } from '../src/proyectos/pasos/comun';
import { procesoDeArranque, recetaPorDefecto } from '../src/proyectos/recetas';
import { lanzamientoGradle, lanzamientoMaven } from '../src/runtimes/lanzadoresJava';
import { pedidosLenguajes } from '../src/runtimes/lenguajes';
import { Runtimes, variablesRuntime } from '../src/runtimes/runtimes';
import { Rutas } from '../src/rutas';
import { fetchFalso, HOY } from './catalogo-falso';
import { carpetaTemporal } from './temporales';

const temporales: string[] = [];
afterEach(async () => {
  for (const t of temporales.splice(0)) await rm(t, { recursive: true, force: true });
});
async function temp(prefijo = 'pel-d47-'): Promise<string> {
  const c = await carpetaTemporal(prefijo);
  temporales.push(c);
  return c;
}
async function proyecto(archivos: Record<string, string>): Promise<string> {
  const d = await temp('pel-d47-proy-');
  for (const [n, t] of Object.entries(archivos)) {
    await mkdir(path.dirname(path.join(d, n)), { recursive: true });
    await writeFile(path.join(d, n), t);
  }
  return d;
}
const detectar = (archivos: Record<string, string>) =>
  proyecto(archivos).then((d) => detectarProyecto(d, { pgvector: false }));

const H256 = (c: string): string => c.repeat(64);

describe('D47: lista fija con huella fuerte', () => {
  it('Ruby, Maven y Gradle pasan el esquema, de hosts oficiales y con su huella', () => {
    expect(() => CatalogoSchema.parse(JSON.parse(JSON.stringify(catalogo)))).not.toThrow();
    for (const s of ['ruby', 'maven', 'gradle'] as const) {
      const lista = listaFija(s);
      expect(lista.length).toBeGreaterThan(0);
      for (const v of lista) {
        expect(urlOficial(v.url)).toBe(true);
        expect(v.huella?.valor).toMatch(/^[0-9a-f]+$/);
      }
      expect(() => validarIndice(s, lista)).not.toThrow();
    }
    expect(listaFija('ruby').map((v) => v.version)).toEqual(['4.0.10-1', '3.4.13-1', '3.3.14-1']);
    expect(listaFija('ruby').every((v) => v.formato === '7z')).toBe(true);
    // Maven publica SHA-512 y es esa la que se fija; Gradle, SHA-256.
    expect(listaFija('maven').every((v) => v.huella?.algoritmo === 'sha512')).toBe(true);
    expect(listaFija('gradle').every((v) => v.huella?.algoritmo === 'sha256')).toBe(true);
    expect(listaFija('maven').map((v) => v.rama)).toEqual(['3.10', '3.9']);
    expect(listaFija('gradle').map((v) => v.rama)).toEqual(['9.9', '8.14']);
  });

  it('los hosts de Maven y Gradle están escritos uno por uno', () => {
    expect(HOSTS_PERMITIDOS).toContain('archive.apache.org');
    expect(HOSTS_PERMITIDOS).toContain('services.gradle.org');
    expect(urlOficial('https://archive.apache.org.evil.com/x.zip')).toBe(false);
    expect(urlOficial('http://services.gradle.org/distributions/x.zip')).toBe(false);
  });

  it('Temurin 17 (LTS) y .NET 8 (LTS) también llevan su huella fijada', () => {
    expect(listaFija('java').map((v) => v.rama)).toEqual(['25', '21', '17']);
    expect(listaFija('dotnet').map((v) => v.version)).toContain('8.0.428');
  });
});

describe('D47: fuente de Ruby (RubyInstaller2)', () => {
  const asset = (v: string, digest: string | null, nombre = `rubyinstaller-${v}-x64.7z`) => ({
    name: nombre,
    browser_download_url: `https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-${v}/${nombre}`,
    digest,
  });
  const release = (v: string, digest: string) => ({
    tag_name: `RubyInstaller-${v}`,
    draft: false,
    prerelease: false,
    assets: [
      asset(v, `sha256:${digest}`),
      asset(v, `sha256:${H256('e')}`, `rubyinstaller-devkit-${v}-x64.exe`),
    ],
  });
  const URL = 'https://api.github.com/repos/oneclick/rubyinstaller2/releases?per_page=10';
  const ctx = (cuerpo: unknown): ContextoFuente => ({
    f: fetchFalso({ [URL]: JSON.stringify(cuerpo) }).f,
    idCatalogo: 'win-x64',
    ahora: HOY,
  });
  const cuerpo = [
    release('4.0.10-1', H256('1')),
    release('3.4.13-1', H256('2')),
    release('3.3.14-1', H256('3')),
    release('3.2.11-1', H256('4')),
  ];

  it('ofrece el .7z sin instalador con su SHA-256 y el soporte de cada rama', async () => {
    const v = await fuenteRuby.listar(ctx(cuerpo));
    expect(v.map((x) => x.version)).toEqual(['4.0.10-1', '3.4.13-1', '3.3.14-1', '3.2.11-1']);
    expect(v[1]).toMatchObject({
      servicio: 'ruby',
      rama: '3.4',
      formato: '7z',
      subcarpeta: 'rubyinstaller-3.4.13-1-x64',
      ejecutable: 'bin/ruby.exe',
      url: 'https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-3.4.13-1/rubyinstaller-3.4.13-1-x64.7z',
      huella: { algoritmo: 'sha256', valor: H256('2') },
      soporte: 'actual',
    });
    // 3.3 sigue con soporte (hasta 2027-03-31) aunque haya 3.4 y 4.0; 3.2 ya no.
    expect(v[2]).toMatchObject({ soporte: 'actual', finSoporte: '2027-03-31' });
    expect(v[3]).toMatchObject({ soporte: 'fin', finSoporte: '2026-04-01' });
    expect(() => validarIndice('ruby', v)).not.toThrow();
  });

  it('un asset fuera del repositorio descarta el índice entero', async () => {
    const malo = structuredClone(cuerpo);
    malo[0]!.assets[0]!.browser_download_url =
      'https://github.com/otro/repo/releases/download/x/y.7z';
    await expect(fuenteRuby.listar(ctx(malo))).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('la lista fija manda: una huella en vivo distinta para la misma URL descarta el índice', async () => {
    const fija = listaFija('ruby').find((x) => x.version === '3.4.13-1')!;
    const vivo = await fuenteRuby.listar(ctx(cuerpo));
    expect(() => aplicarListaFija('ruby', vivo)).toThrow(IndiceMalformado);
    const igual = await fuenteRuby.listar(ctx([release('3.4.13-1', fija.huella!.valor)]));
    expect(aplicarListaFija('ruby', igual)).toHaveLength(1);
  });
});

describe('D47: instalar un .7z', () => {
  const LISTA_NOMBRES = ['rb/', 'rb/bin/', 'rb/bin/ruby.exe', 'rb/lib/x.rb'].join('\n');
  const LISTA_DETALLE = [
    'drwxr-xr-x  0 0      0           0 nov. 19 15:45 rb/',
    '-rw-r--r--  0 0      0          10 nov. 19 15:45 rb/bin/ruby.exe',
  ].join('\n');

  /** tar falso: lista lo dado y, al extraer, crea los archivos en el destino. */
  function tarFalso(
    o: { nombres?: string; detalle?: string; extraer?: (d: string) => Promise<void> } = {},
  ) {
    const llamadas: string[][] = [];
    const exec: Ejecutor = async (_cmd, args) => {
      llamadas.push(args);
      if (args[0] === '-tf') return { codigo: 0, stdout: o.nombres ?? LISTA_NOMBRES, stderr: '' };
      if (args[0] === '-tvf') return { codigo: 0, stdout: o.detalle ?? LISTA_DETALLE, stderr: '' };
      await o.extraer?.(args[args.indexOf('-C') + 1]!);
      return { codigo: 0, stdout: '', stderr: '' };
    };
    return { exec, llamadas };
  }

  it('lista dos veces, extrae con -C y no usa shell', async () => {
    const t = tarFalso();
    await extraer7z(t.exec, 'tar.exe', 'a.7z', 'dest');
    expect(t.llamadas).toEqual([
      ['-tf', 'a.7z'],
      ['-tvf', 'a.7z'],
      ['-xf', 'a.7z', '-C', 'dest'],
    ]);
  });

  it.each([
    ['ruta con ..', 'rb/../../fuera.dll'],
    ['ruta absoluta', 'C:/Windows/x.dll'],
    ['ruta raíz', '/etc/x'],
    ['UNC', '\\\\srv\\share\\x'],
  ])('rechaza %s sin extraer', async (_n, nombre) => {
    const t = tarFalso({ nombres: `rb/\n${nombre}` });
    await expect(extraer7z(t.exec, 'tar.exe', 'a.7z', 'dest')).rejects.toMatchObject({
      codigo: 'catalogo.paquete_invalido',
    });
    expect(t.llamadas.some((a) => a[0] === '-xf')).toBe(false);
  });

  it('rechaza enlaces simbólicos y duros', async () => {
    for (const tipo of ['l', 'h']) {
      const t = tarFalso({ detalle: `${tipo}rwxr-xr-x  0 0 0 0 nov. 19 15:45 rb/enlace` });
      await expect(extraer7z(t.exec, 'tar.exe', 'a.7z', 'dest')).rejects.toMatchObject({
        codigo: 'catalogo.paquete_invalido',
      });
    }
  });

  it('rechaza un paquete que pesa descomprimido más de lo permitido', async () => {
    const t = tarFalso({ detalle: '-rw-r--r--  0 0 0 99999999999999 nov. 19 15:45 rb/x' });
    await expect(extraer7z(t.exec, 'tar.exe', 'a.7z', 'dest')).rejects.toMatchObject({
      codigo: 'catalogo.paquete_invalido',
    });
  });

  it('el instalador verifica la huella, extrae con tar y deja bin/ruby/<versión>', async () => {
    const rutas = new Rutas(await temp());
    await rutas.asegurar();
    const cuerpo = Buffer.from('contenido del 7z');
    const sha = createHash('sha256').update(cuerpo).digest('hex');
    const v: VersionDisponible = {
      servicio: 'ruby',
      version: '3.4.13-1',
      rama: '3.4',
      url: 'https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-3.4.13-1/rubyinstaller-3.4.13-1-x64.7z',
      sha256: sha,
      huella: { algoritmo: 'sha256', valor: sha },
      formato: '7z',
      subcarpeta: 'rb',
      ejecutable: 'bin/ruby.exe',
    };
    const t = tarFalso({
      extraer: async (dest) => {
        await mkdir(path.join(dest, 'rb', 'bin'), { recursive: true });
        await writeFile(path.join(dest, 'rb', 'bin', 'ruby.exe'), 'EXE');
      },
    });
    const inst = new Instalador(
      rutas,
      new Eventos<EventosNucleo>(),
      fetchFalso({ [v.url]: cuerpo }).f,
      { exec: t.exec, rutaTar: 'tar-falso' },
    );
    await inst.instalar(v);
    expect(existsSync(path.join(rutas.bin('ruby', '3.4.13-1'), 'bin', 'ruby.exe'))).toBe(true);
    expect(await inst.instalados('ruby')).toEqual(['3.4.13-1']);
    expect(await readdir(rutas.tmp())).toEqual([]);

    // Con otra suma no se extrae nada.
    const rutas2 = new Rutas(await temp());
    await rutas2.asegurar();
    const t2 = tarFalso();
    const inst2 = new Instalador(
      rutas2,
      new Eventos<EventosNucleo>(),
      fetchFalso({ [v.url]: Buffer.from('otro') }).f,
      { exec: t2.exec, rutaTar: 'tar-falso' },
    );
    await expect(inst2.instalar(v)).rejects.toMatchObject({
      codigo: 'catalogo.huella_no_coincide',
    });
    expect(t2.llamadas).toEqual([]);
  });
});

describe('D47: Maven y Gradle sin shell', () => {
  it('Maven: java con plexus-classworlds y m2.conf', async () => {
    const mvn = await temp();
    await mkdir(path.join(mvn, 'boot'), { recursive: true });
    await writeFile(path.join(mvn, 'boot', 'plexus-classworlds-2.9.0.jar'), '');
    const r = await lanzamientoMaven(mvn, 'C:\\jdk\\bin\\java.exe', 'C:\\proy', [
      'spring-boot:run',
    ]);
    expect(r.cmd).toBe('C:\\jdk\\bin\\java.exe');
    expect(r.args).toEqual([
      '-classpath',
      path.join(mvn, 'boot', 'plexus-classworlds-2.9.0.jar'),
      `-Dclassworlds.conf=${path.join(mvn, 'bin', 'm2.conf')}`,
      `-Dmaven.home=${mvn}`,
      '-Dmaven.multiModuleProjectDirectory=C:\\proy',
      'org.codehaus.plexus.classworlds.launcher.Launcher',
      'spring-boot:run',
    ]);
    await expect(lanzamientoMaven(await temp(), 'java', 'x', [])).rejects.toThrow(/incompleta/);
  });

  it('Gradle 8 y 9 arrancan con -jar; uno anterior, con GradleMain', async () => {
    const g = await temp();
    await mkdir(path.join(g, 'lib', 'agents'), { recursive: true });
    await writeFile(path.join(g, 'lib', 'gradle-gradle-cli-main-9.9.2.jar'), '');
    const agente = path.join(g, 'lib', 'agents', 'gradle-instrumentation-agent-9.9.2.jar');
    await writeFile(agente, '');
    const nuevo = await lanzamientoGradle(g, 'java', ['bootRun']);
    expect(nuevo.args).toContain('-jar');
    expect(nuevo.args).toContain(`-javaagent:${agente}`);
    expect(nuevo.args.at(-1)).toBe('bootRun');

    const v = await temp();
    await mkdir(path.join(v, 'lib'), { recursive: true });
    await writeFile(path.join(v, 'lib', 'gradle-launcher-7.6.jar'), '');
    const viejo = await lanzamientoGradle(v, 'java', ['build']);
    expect(viejo.args).toContain('org.gradle.launcher.GradleMain');
    await expect(lanzamientoGradle(await temp(), 'java', [])).rejects.toThrow(/incompleta/);
  });

  it('resolverPrograma convierte mvn y gradle en java, y pide Maven y el JDK', async () => {
    const rutas = new Rutas(await temp());
    const d = { runtimes: new Runtimes(rutas) };
    const mvn = rutas.bin('maven', '3.10.2');
    await mkdir(path.join(mvn, 'boot'), { recursive: true });
    await writeFile(path.join(mvn, 'boot', 'plexus-classworlds-2.9.0.jar'), '');
    const h = (versiones: Herramientas['versiones']): Herramientas => ({ env: {}, versiones });
    const r = await resolverPrograma(
      ['mvn', 'spring-boot:run'],
      'C:\\proy',
      d,
      h({ maven: '3.10.2', java: '21.0.13.1' }),
    );
    expect(r.cmd).toBe(path.join(rutas.bin('java', '21.0.13.1'), 'bin', 'java.exe'));
    expect(r.args.at(-1)).toBe('spring-boot:run');
    await expect(resolverPrograma(['mvn', 'x'], 'C:\\p', d, h({ java: '21' }))).rejects.toThrow(
      /Maven instalado/,
    );
    await expect(
      resolverPrograma(['gradle', 'x'], 'C:\\p', d, h({ gradle: '9.9.2' })),
    ).rejects.toThrow(/JDK/);
    await expect(resolverPrograma(['mvn.cmd', 'x'], 'C:\\p', d, h({}))).rejects.toThrow(/shell/);
    await expect(resolverPrograma(['ruby', 'x'], 'C:\\p', d, h({}))).rejects.toThrow(
      /Ruby instalado/,
    );
  });
});

describe('D47: runtimes de Ruby, Maven y Gradle', () => {
  const instalar = async (rutas: Rutas, tipo: string, version: string, exe: string) => {
    const f = path.join(rutas.bin(tipo, version), ...exe.split('/'));
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, 'x');
  };

  it('variables y PATH por proyecto, sin tocar el PATH del usuario', async () => {
    const rutas = new Rutas(await temp());
    await instalar(rutas, 'ruby', '3.4.13-1', 'bin/ruby.exe');
    const rt = new Runtimes(rutas);
    expect(await rt.instalados('ruby')).toEqual(['3.4.13-1']);
    expect(variablesRuntime('maven', 'C:\\m')).toEqual({ MAVEN_HOME: 'C:\\m' });
    expect(variablesRuntime('gradle', 'C:\\g')).toEqual({ GRADLE_HOME: 'C:\\g' });
    expect(rt.carpetasPath({ ruby: '3.4.13-1', maven: '3.10.2', gradle: '9.9.2' })).toEqual([
      path.join(rutas.bin('ruby', '3.4.13-1'), 'bin'),
      path.join(rutas.bin('maven', '3.10.2'), 'bin'),
      path.join(rutas.bin('gradle', '9.9.2'), 'bin'),
    ]);
  });

  it('el proyecto pide su rama de Ruby; Maven sin JDK avisa', async () => {
    const rutas = new Rutas(await temp());
    await instalar(rutas, 'ruby', '3.3.14-1', 'bin/ruby.exe');
    await instalar(rutas, 'ruby', '3.4.13-1', 'bin/ruby.exe');
    await instalar(rutas, 'maven', '3.9.16', 'bin/mvn.cmd');
    const rt = new Runtimes(rutas);
    const rb = await proyecto({ '.ruby-version': 'ruby-3.3.5\n', Gemfile: 'source "x"\n' });
    expect(await rt.paraProyecto({ carpeta: rb })).toMatchObject({ ruby: '3.3.14-1', avisos: [] });
    const sinRuby = await proyecto({ '.ruby-version': '3.1.2' });
    const r = await rt.paraProyecto({ carpeta: sinRuby });
    expect(r.ruby).toBeUndefined();
    expect(r.avisos.join(' ')).toMatch(/Ruby 3\.1.*no está instalado/);

    const pom = await proyecto({ 'pom.xml': '<project/>' });
    const m = await rt.paraProyecto({ carpeta: pom });
    expect(m.maven).toBe('3.9.16');
    expect(m.avisos.join(' ')).toMatch(/Maven necesita un JDK/);
    await instalar(rutas, 'java', '21.0.13.1', 'bin/java.exe');
    expect(await rt.paraProyecto({ carpeta: pom })).toMatchObject({
      java: '21.0.13.1',
      avisos: [],
    });
  });

  it('pedidos de los archivos: Gemfile, wrapper de Maven y de Gradle', async () => {
    const p = await pedidosLenguajes(
      await proyecto({
        Gemfile: 'source "https://rubygems.org"\nruby ">= 3.2"\ngem "rails"\n',
        'pom.xml': '<project/>',
        '.mvn/wrapper/maven-wrapper.properties':
          'distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip\n',
        'build.gradle': 'plugins { id "java" }',
        'gradle/wrapper/gradle-wrapper.properties':
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-bin.zip\n',
      }),
    );
    expect(p.ruby).toEqual({ version: '3.2', origen: 'Gemfile', minimo: true });
    expect(p.maven).toEqual({ version: '3.9', origen: 'pom.xml', minimo: false });
    expect(p.gradle).toEqual({ version: '8.14', origen: 'build.gradle', minimo: false });
  });
});

describe('D47: detección y recetas (proyectos temporales)', () => {
  it('Rails: Gemfile con rails y bin/rails; solo 127.0.0.1', async () => {
    const d = await detectar({
      Gemfile: 'source "x"\ngem "rails", "~> 8.0"\n',
      'bin/rails': '#!/usr/bin/env ruby\n',
    });
    expect(d.tipo).toBe('rails');
    expect(d.arranque).toEqual([
      'ruby',
      'bin/rails',
      'server',
      '-b',
      '127.0.0.1',
      '-p',
      '{puerto}',
    ]);
    const receta = recetaPorDefecto(d);
    expect(receta.map((p) => p.tipo)).toEqual(['comando', 'sitio-crear']);
    expect(receta[0]!.args).toEqual({ comando: ['ruby', '-S', 'bundle', 'install'] });
    const proceso = (receta[1]!.args!.procesos as unknown[])[0];
    expect(proceso).toMatchObject({ id: 'rails', proxy: true, cwd: 'raiz', puerto: null });
    expect(receta[1]!.args).toMatchObject({ tipo: 'rails', https: true });
    // Sin bin/rails o sin la gema no es Rails.
    expect((await detectar({ Gemfile: 'gem "rails"' })).tipo).not.toBe('rails');
    expect((await detectar({ Gemfile: 'gem "sinatra"', 'bin/rails': '' })).tipo).not.toBe('rails');
  });

  it('Spring Boot con Maven o con Gradle', async () => {
    const mvn = await detectar({
      'pom.xml': '<parent><artifactId>spring-boot-starter-parent</artifactId></parent>',
    });
    expect(mvn.tipo).toBe('springboot');
    expect(mvn.arranque).toEqual([
      'mvn',
      'spring-boot:run',
      '-Dspring-boot.run.arguments=--server.address=127.0.0.1 --server.port={puerto}',
    ]);
    const gr = await detectar({
      'build.gradle.kts': 'plugins { id("org.springframework.boot") version "3.4.0" }',
    });
    expect(gr.tipo).toBe('springboot');
    expect(gr.arranque).toEqual([
      'gradle',
      'bootRun',
      '--no-daemon',
      '--args=--server.address=127.0.0.1 --server.port={puerto}',
    ]);
    expect(recetaPorDefecto(gr).map((p) => p.tipo)).toEqual(['sitio-crear']);
    expect((await detectar({ 'pom.xml': '<project/>' })).tipo).not.toBe('springboot');
  });

  it('ASP.NET Core solo con el SDK web', async () => {
    const web = await detectar({
      'App.csproj': '<Project Sdk="Microsoft.NET.Sdk.Web"></Project>',
    });
    expect(web.tipo).toBe('aspnet');
    expect(web.arranque).toEqual(['dotnet', 'run', '--urls', 'http://127.0.0.1:{puerto}']);
    const consola = await detectar({ 'App.csproj': '<Project Sdk="Microsoft.NET.Sdk"></Project>' });
    expect(consola.tipo).not.toBe('aspnet');
  });

  it('Express y Nest: node con npm run start o start:dev; Vite sin comando', async () => {
    const pkg = (deps: object, scripts: object): string =>
      JSON.stringify({ dependencies: deps, scripts });
    const ex = await detectar({ 'package.json': pkg({ express: '^5' }, { start: 'node app.js' }) });
    expect(ex).toMatchObject({ tipo: 'node', arranque: ['npm', 'run', 'start'] });
    const nest = await detectar({
      'package.json': pkg({ '@nestjs/core': '^11' }, { 'start:dev': 'nest start --watch' }),
    });
    expect(nest.arranque).toEqual(['npm', 'run', 'start:dev']);
    expect(recetaPorDefecto(ex).map((p) => p.tipo)).toEqual(['npm-ci', 'sitio-crear']);
    expect(procesoDeArranque(ex)).toMatchObject({
      id: 'servidor',
      comando: ['npm', 'run', 'start'],
      puerto: null,
      proxy: true,
    });
    // Express sin script de arranque: sin proceso. Vite: tampoco trae comando.
    const sin = await detectar({ 'package.json': pkg({ express: '^5' }, {}) });
    expect(sin.tipo).toBe('node');
    expect(sin.arranque ?? null).toBeNull();
    const vite = await detectar({ 'package.json': pkg({ vite: '^6' }, { dev: 'vite' }) });
    expect(vite.tipo).toBe('node');
    expect(vite.arranque ?? null).toBeNull();
  });
});

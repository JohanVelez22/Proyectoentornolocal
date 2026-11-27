import { open, readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Lenguajes cuyo runtime se pide a los archivos del proyecto (Java, .NET, Go, Rust, Bun, Deno,
 * Zig, Kotlin y Dart).
 */
export const LENGUAJES_PROYECTO = [
  'java',
  'dotnet',
  'go',
  'rust',
  'bun',
  'deno',
  'zig',
  'kotlin',
  'dart',
  'ruby',
  'maven',
  'gradle',
] as const;
export type LenguajeProyecto = (typeof LENGUAJES_PROYECTO)[number];

/** Lo que pide un archivo del proyecto. `version` null: hay proyecto pero no dice qué versión. */
export interface PedidoLenguaje {
  /** Versión limpia ("21", "8.0", "1.22", "1.85.0"); null si el archivo no la dice. */
  version: string | null;
  /** Archivo del que sale. */
  origen: string;
  /** La versión es un mínimo (compilar para Java 17 también sirve con un JDK 21). */
  minimo: boolean;
  /** Rust: canal que pidió el archivo y no es un número (nightly, beta, stable). */
  canal?: string;
  /** Restricción completa que pidió el archivo (Dart: "^3.5.0", ">=3.0.0 <4.0.0"), con su tope. */
  restriccion?: string;
}

/** Tope de lectura de estos archivos: uno más grande no se interpreta. */
const MAX_BYTES = 64 * 1024;
/** Líneas más largas que esto no se miran (ningún archivo de proyecto real las trae). */
const MAX_LINEA = 300;
/** Proyectos de .NET que se leen (de los que hay en la raíz). */
const MAX_CSPROJ = 20;

/** Texto del archivo (hasta 64 KB leídos; si es más grande, null). Sin BOM. */
async function leer(ruta: string): Promise<string | null> {
  let fh;
  try {
    fh = await open(ruta, 'r');
    const buf = Buffer.alloc(MAX_BYTES + 1);
    const { bytesRead } = await fh.read(buf, 0, MAX_BYTES + 1, 0);
    if (bytesRead > MAX_BYTES) return null;
    const t = buf.subarray(0, bytesRead).toString('utf8');
    return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
  } catch {
    return null;
  } finally {
    await fh?.close().catch(() => undefined);
  }
}

/** Líneas recortadas y acotadas: todo el análisis va línea a línea (sin retroceso entre líneas). */
function lineas(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .filter((l) => l.length <= MAX_LINEA)
    .map((l) => l.trim());
}

async function nombresEn(carpeta: string): Promise<string[]> {
  try {
    return (await readdir(carpeta)).slice(0, 2000);
  } catch {
    return [];
  }
}

/** "1.8" → "8" (Java 8 se escribe 1.8); "17" → "17"; "17.0.2" → "17". */
function mayorJava(valor: string): string | null {
  const m = /^(?:1\.)?(\d{1,2})(?:\.|$)/.exec(valor.trim().slice(0, 40));
  return m ? m[1]! : null;
}

/** Contenido de `<etiqueta>…</` (sin anidar), por búsqueda de texto (lineal). */
function contenidoXml(xml: string, etiqueta: string): string | null {
  const ini = xml.indexOf(`<${etiqueta}>`);
  if (ini < 0) return null;
  const desde = ini + etiqueta.length + 2;
  const fin = xml.indexOf('</', desde);
  return fin < 0 ? null : xml.slice(desde, Math.min(fin, desde + 40));
}

function javaDePom(xml: string): string | null {
  for (const etiqueta of ['maven.compiler.release', 'java.version', 'maven.compiler.source']) {
    const c = contenidoXml(xml, etiqueta);
    const v = c ? mayorJava(c) : null;
    if (v) return v;
  }
  return null;
}

function javaDeGradle(texto: string): string | null {
  for (const l of lineas(texto)) {
    const i = l.indexOf('JavaLanguageVersion.of(');
    if (i >= 0) {
      const m = /^(?:["'])?(\d{1,2})/.exec(l.slice(i + 23, i + 30));
      if (m) return m[1]!;
    }
  }
  for (const l of lineas(texto)) {
    const m =
      /^(?:source|target)Compatibility[ \t]*=?[ \t]*(?:JavaVersion\.VERSION_)?["']?(\d+(?:[._]\d+)?)/.exec(
        l,
      );
    if (m) return mayorJava(m[1]!.replace('_', '.'));
  }
  return null;
}

async function pedidoJava(carpeta: string): Promise<PedidoLenguaje | null> {
  const pom = await leer(path.join(carpeta, 'pom.xml'));
  if (pom !== null) return { version: javaDePom(pom), origen: 'pom.xml', minimo: true };
  for (const nombre of ['build.gradle.kts', 'build.gradle']) {
    const g = await leer(path.join(carpeta, nombre));
    if (g !== null) return { version: javaDeGradle(g), origen: nombre, minimo: true };
  }
  return null;
}

/** `net8.0` de un `<TargetFramework(s)>` de un .csproj (solo .NET 5 o más nuevo). */
function frameworkDe(xml: string): string | null {
  let desde = 0;
  for (let n = 0; n < 5; n++) {
    const i = xml.indexOf('<TargetFramework', desde);
    if (i < 0) return null;
    const m = /\bnet(\d+)\.(\d+)\b/.exec(xml.slice(i, i + 200));
    if (m && Number(m[1]) >= 5) return `${m[1]}.${m[2]}`;
    desde = i + 1;
  }
  return null;
}

async function pedidoDotnet(carpeta: string): Promise<PedidoLenguaje | null> {
  const global = await leer(path.join(carpeta, 'global.json'));
  if (global !== null) {
    try {
      const j = JSON.parse(global) as { sdk?: { version?: unknown } } | null;
      const v = typeof j?.sdk?.version === 'string' ? j.sdk.version : '';
      const m = /^(\d+)\.(\d+)/.exec(v);
      if (m) return { version: `${m[1]}.${m[2]}`, origen: 'global.json', minimo: false };
    } catch {
      // un global.json roto no impide mirar el resto
    }
  }
  const nombres = await nombresEn(carpeta);
  const proyectos = nombres.filter((n) => /\.(csproj|fsproj|vbproj)$/i.test(n));
  for (const n of proyectos.slice(0, MAX_CSPROJ)) {
    const xml = await leer(path.join(carpeta, n));
    const v = xml ? frameworkDe(xml) : null;
    if (v) return { version: v, origen: n, minimo: true };
  }
  if (global !== null || proyectos.length > 0 || nombres.some((n) => /\.sln$/i.test(n))) {
    return { version: null, origen: proyectos[0] ?? 'global.json', minimo: true };
  }
  return null;
}

async function pedidoGo(carpeta: string): Promise<PedidoLenguaje | null> {
  const mod = await leer(path.join(carpeta, 'go.mod'));
  if (mod === null) return null;
  // `toolchain go1.22.5` fija la versión exacta; `go 1.22` es el mínimo.
  let tc: string | null = null;
  let g: string | null = null;
  for (const l of lineas(mod)) {
    tc ??= /^toolchain[ \t]+go(\d+\.\d+(?:\.\d+)?)$/.exec(l)?.[1] ?? null;
    g ??= /^go[ \t]+(\d+\.\d+(?:\.\d+)?)$/.exec(l)?.[1] ?? null;
  }
  if (tc) return { version: tc, origen: 'go.mod', minimo: false };
  return { version: g, origen: 'go.mod', minimo: true };
}

async function pedidoRust(carpeta: string): Promise<PedidoLenguaje | null> {
  const toml = await leer(path.join(carpeta, 'rust-toolchain.toml'));
  const plano = toml === null ? await leer(path.join(carpeta, 'rust-toolchain')) : null;
  const origen = toml !== null ? 'rust-toolchain.toml' : 'rust-toolchain';
  let canal: string | null = null;
  const texto = toml ?? plano;
  if (texto !== null) {
    const ls = lineas(texto);
    canal =
      ls.map((l) => /^channel[ \t]*=[ \t]*["']([^"']{1,60})["']/.exec(l)?.[1]).find(Boolean) ??
      null;
    // Formato antiguo: solo el canal en una línea.
    if (canal === null && plano !== null) {
      canal = ls.find((l) => l !== '' && !l.startsWith('#')) ?? null;
    }
  } else {
    return (await leer(path.join(carpeta, 'Cargo.toml'))) !== null
      ? { version: null, origen: 'Cargo.toml', minimo: false }
      : null;
  }
  // "stable", "beta" y "nightly" (con o sin fecha) no son una versión instalable por número.
  const numerico = canal !== null && /^\d+\.\d+(?:\.\d+)?$/.test(canal);
  return {
    version: numerico ? canal : null,
    origen,
    minimo: false,
    ...(canal !== null && !numerico ? { canal: canal.slice(0, 60) } : {}),
  };
}

/** Versión exacta "1.1.8" de la primera línea útil de un archivo de versión (admite `v`). */
function versionDeArchivo(texto: string | null): string | null {
  if (texto === null) return null;
  const l = lineas(texto).find((x) => x !== '' && !x.startsWith('#'));
  return l?.match(/^v?(\d{1,3}\.\d{1,3}\.\d{1,3})$/)?.[1] ?? null;
}

async function pedidoBun(carpeta: string, nombres: Set<string>): Promise<PedidoLenguaje | null> {
  // `packageManager: "bun@1.1.8"` de package.json (corepack) o `.bun-version`.
  const pkg = await leer(path.join(carpeta, 'package.json'));
  let desdePkg: string | null = null;
  if (pkg !== null) {
    try {
      const j = JSON.parse(pkg) as { packageManager?: unknown } | null;
      const pm = typeof j?.packageManager === 'string' ? j.packageManager : '';
      desdePkg = /^bun@(\d{1,3}\.\d{1,3}\.\d{1,3})/.exec(pm.slice(0, 60))?.[1] ?? null;
    } catch {
      // un package.json roto no impide mirar el resto
    }
  }
  const archivo = versionDeArchivo(await leer(path.join(carpeta, '.bun-version')));
  const version = archivo ?? desdePkg;
  const marca = ['bun.lockb', 'bun.lock', 'bunfig.toml', '.bun-version'].find((n) =>
    nombres.has(n),
  );
  if (version !== null) {
    return { version, origen: archivo !== null ? '.bun-version' : 'package.json', minimo: false };
  }
  return marca ? { version: null, origen: marca, minimo: false } : null;
}

async function pedidoDeno(carpeta: string, nombres: Set<string>): Promise<PedidoLenguaje | null> {
  const marca = ['deno.json', 'deno.jsonc', 'deno.lock', '.dvmrc'].find((n) => nombres.has(n));
  if (!marca) return null;
  const version = versionDeArchivo(await leer(path.join(carpeta, '.dvmrc')));
  return { version, origen: version !== null ? '.dvmrc' : marca, minimo: false };
}

async function pedidoZig(carpeta: string, nombres: Set<string>): Promise<PedidoLenguaje | null> {
  if (!nombres.has('build.zig') && !nombres.has('build.zig.zon') && !nombres.has('.zigversion')) {
    return null;
  }
  // Zig rompe la compatibilidad entre ramas "0.N": se fija la rama (`0.14.1` → `0.14`).
  const fija = versionDeArchivo(await leer(path.join(carpeta, '.zigversion')));
  if (fija) {
    const rama = /^(\d+\.\d+)/.exec(fija)?.[1] ?? fija;
    return { version: rama, origen: '.zigversion', minimo: false };
  }
  const zon = await leer(path.join(carpeta, 'build.zig.zon'));
  if (zon !== null) {
    for (const l of lineas(zon)) {
      const m =
        /^\.minimum_zig_version[ \t]*=[ \t]*"(\d{1,3}\.\d{1,3})(?:\.\d{1,3})?[^"]{0,20}"/.exec(l);
      if (m) return { version: m[1]!, origen: 'build.zig.zon', minimo: false };
    }
  }
  return {
    version: null,
    origen: nombres.has('build.zig') ? 'build.zig' : 'build.zig.zon',
    minimo: false,
  };
}

/** "2.0.21" de `kotlin("jvm") version "2.0.21"` o `id 'org.jetbrains.kotlin.jvm' version '2.0.21'`. */
/**
 * ¿Esta línea de un build de Gradle usa el plugin de Kotlin? Solo `kotlin("…")` u
 * `org.jetbrains.kotlin…`; el Kotlin DSL de Gradle (`kotlin-dsl`, `org.gradle.kotlin.dsl`) lo
 * usan también los proyectos de Java y no cuenta.
 */
function lineaConKotlin(l: string): boolean {
  if (l.startsWith('//') || l.includes('kotlin-dsl') || l.includes('gradle.kotlin.dsl')) {
    return false;
  }
  return /kotlin\(["']/.test(l) || l.includes('org.jetbrains.kotlin');
}

function kotlinDeGradle(texto: string): { usa: boolean; version: string | null } {
  let usa = false;
  for (const l of lineas(texto)) {
    if (!lineaConKotlin(l)) continue;
    usa = true;
    const i = l.indexOf('version');
    const m = i >= 0 ? /^version[ \t]*["'](\d{1,2}\.\d{1,2})/.exec(l.slice(i, i + 40)) : null;
    if (m) return { usa, version: m[1]! };
  }
  return { usa, version: null };
}

async function pedidoKotlin(carpeta: string, nombres: Set<string>): Promise<PedidoLenguaje | null> {
  for (const nombre of ['build.gradle.kts', 'build.gradle']) {
    const g = await leer(path.join(carpeta, nombre));
    if (g === null) continue;
    const k = kotlinDeGradle(g);
    if (k.usa) return { version: k.version, origen: nombre, minimo: true };
  }
  const pom = await leer(path.join(carpeta, 'pom.xml'));
  if (pom !== null && pom.includes('kotlin-maven-plugin')) {
    return { version: null, origen: 'pom.xml', minimo: true };
  }
  const kt = [...nombres].find((n) => /\.kt$/i.test(n));
  return kt ? { version: null, origen: kt, minimo: true } : null;
}

/** "3.3" de `3.3.5` o `ruby-3.3.5`: Ruby se fija por rama (el parche lo da el instalador). */
const RAMA_RUBY = /^(?:ruby-)?(\d{1,2})\.(\d{1,2})(?:\.\d{1,3})?(?:-p\d{1,4})?$/;

async function pedidoRuby(carpeta: string, nombres: Set<string>): Promise<PedidoLenguaje | null> {
  const archivo = lineas((await leer(path.join(carpeta, '.ruby-version'))) ?? '').find(
    (l) => l !== '' && !l.startsWith('#'),
  );
  const m = archivo === undefined ? null : RAMA_RUBY.exec(archivo);
  if (m) return { version: `${m[1]}.${m[2]}`, origen: '.ruby-version', minimo: false };
  const gemfile = await leer(path.join(carpeta, 'Gemfile'));
  if (gemfile !== null) {
    for (const l of lineas(gemfile)) {
      // `ruby "3.3.5"` fija la rama; `ruby ">= 3.2"` o `~> 3.2` es un mínimo.
      const g = /^ruby[ \t(]+["']([~><=! ]{0,3})(\d{1,2})\.(\d{1,2})/.exec(l);
      if (g) return { version: `${g[2]}.${g[3]}`, origen: 'Gemfile', minimo: g[1]!.trim() !== '' };
    }
    return { version: null, origen: 'Gemfile', minimo: false };
  }
  return nombres.has('.ruby-version')
    ? { version: null, origen: '.ruby-version', minimo: false }
    : null;
}

/** "8.14" de `distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-bin.zip`. */
function ramaDeDistribucion(texto: string | null, patron: RegExp): string | null {
  if (texto === null) return null;
  for (const l of lineas(texto)) {
    if (!l.startsWith('distributionUrl')) continue;
    const m = patron.exec(l);
    if (m) return `${m[1]}.${m[2]}`;
  }
  return null;
}

async function pedidoMaven(carpeta: string): Promise<PedidoLenguaje | null> {
  if ((await leer(path.join(carpeta, 'pom.xml'))) === null) return null;
  const rama = ramaDeDistribucion(
    await leer(path.join(carpeta, '.mvn', 'wrapper', 'maven-wrapper.properties')),
    /apache-maven-(\d{1,2})\.(\d{1,2})/,
  );
  return { version: rama, origen: 'pom.xml', minimo: false };
}

async function pedidoGradle(carpeta: string, nombres: Set<string>): Promise<PedidoLenguaje | null> {
  const marca = ['build.gradle.kts', 'build.gradle', 'settings.gradle.kts', 'settings.gradle'].find(
    (n) => nombres.has(n),
  );
  if (!marca) return null;
  const rama = ramaDeDistribucion(
    await leer(path.join(carpeta, 'gradle', 'wrapper', 'gradle-wrapper.properties')),
    /gradle-(\d{1,2})\.(\d{1,2})/,
  );
  return { version: rama, origen: marca, minimo: false };
}

/** Lo que dice un `pubspec.yaml` (línea a línea, sin retroceso). */
interface Pubspec {
  /** El proyecto usa Flutter (que trae su propio Dart). */
  flutter: boolean;
  /** Restricción de `environment.sdk` tal cual ("^3.5.0", ">=3.0.0 <4.0.0"). */
  restriccion: string | null;
  /** Versión mínima que dice la restricción. */
  minima: string | null;
}

/** Caracteres que puede tener una restricción de versión de Dart. */
const RESTRICCION_DART = /^[\^<>=!0-9.\s,|x*+-]{1,60}$/;

function leerPubspec(yaml: string): Pubspec {
  const p: Pubspec = { flutter: false, restriccion: null, minima: null };
  let dentro = false;
  for (const l of yaml.split(/\r?\n/).filter((x) => x.length <= MAX_LINEA)) {
    // `flutter:` (clave propia o dependencia) y `sdk: flutter`: proyecto de Flutter.
    if (/^[ \t]*flutter[ \t]*:/.test(l) || /sdk[ \t]*:[ \t]*["']?flutter\b/.test(l)) {
      p.flutter = true;
    }
    if (/^environment[ \t]*:/.test(l)) {
      dentro = true;
      continue;
    }
    if (dentro && /^\S/.test(l) && !l.startsWith('#')) dentro = false;
    if (!dentro) continue;
    const m = /^[ \t]+sdk[ \t]*:[ \t]*(\S[^#]{0,80})/.exec(l);
    if (!m || p.restriccion !== null) continue;
    const valor = m[1]!.trim().replace(/^["']/, '').replace(/["']$/, '').trim();
    if (!RESTRICCION_DART.test(valor)) continue;
    p.restriccion = valor;
    p.minima = /(?:\^|>=)[ \t]*(\d{1,3}\.\d{1,3}(?:\.\d{1,3})?)/.exec(valor)?.[1] ?? null;
  }
  return p;
}

/**
 * `environment.sdk` del pubspec: la restricción completa (con su tope `<X` y el mayor del `^`) y
 * su mínimo. Un proyecto de Flutter no usa el Dart suelto (Flutter trae el suyo): no se añade.
 */
async function pedidoDart(carpeta: string): Promise<PedidoLenguaje | null> {
  const yaml = await leer(path.join(carpeta, 'pubspec.yaml'));
  if (yaml === null) return null;
  const p = leerPubspec(yaml);
  if (p.flutter) return null;
  return {
    version: p.minima,
    origen: 'pubspec.yaml',
    minimo: true,
    ...(p.restriccion ? { restriccion: p.restriccion } : {}),
  };
}

/** ¿La carpeta es un proyecto de Flutter (pubspec con `flutter`)? */
export async function esProyectoFlutter(carpeta: string): Promise<boolean> {
  const yaml = await leer(path.join(carpeta, 'pubspec.yaml'));
  return yaml !== null && leerPubspec(yaml).flutter;
}

/**
 * Lo que piden los archivos de la carpeta para Java (`pom.xml`, `build.gradle(.kts)`), .NET
 * (`global.json`, `*.csproj`, `*.sln`), Go (`go.mod`), Rust (`rust-toolchain(.toml)`, `Cargo.toml`),
 * Bun (`bun.lock(b)`, `bunfig.toml`, `.bun-version`), Deno (`deno.json(c)`, `.dvmrc`), Zig (`build.zig`,
 * `.zigversion`), Kotlin (Gradle o Maven con Kotlin, `*.kt`), Dart (`pubspec.yaml`), Ruby
 * (`Gemfile`, `.ruby-version`), Maven (`pom.xml`) y Gradle (`build.gradle(.kts)`).
 * Solo está la clave de los lenguajes que el proyecto usa; su `version` es null si el archivo no
 * dice cuál. Lee solo la raíz de la carpeta y archivos de hasta 64 KB (y 20 proyectos de .NET).
 */
export async function pedidosLenguajes(
  carpeta: string,
): Promise<Partial<Record<LenguajeProyecto, PedidoLenguaje>>> {
  const res: Partial<Record<LenguajeProyecto, PedidoLenguaje>> = {};
  const java = await pedidoJava(carpeta);
  if (java) res.java = java;
  const dotnet = await pedidoDotnet(carpeta);
  if (dotnet) res.dotnet = dotnet;
  const go = await pedidoGo(carpeta);
  if (go) res.go = go;
  const rust = await pedidoRust(carpeta);
  if (rust) res.rust = rust;
  const nombres = new Set(await nombresEn(carpeta));
  const bun = await pedidoBun(carpeta, nombres);
  if (bun) res.bun = bun;
  const deno = await pedidoDeno(carpeta, nombres);
  if (deno) res.deno = deno;
  const zig = await pedidoZig(carpeta, nombres);
  if (zig) res.zig = zig;
  const kotlin = await pedidoKotlin(carpeta, nombres);
  if (kotlin) res.kotlin = kotlin;
  const dart = await pedidoDart(carpeta);
  if (dart) res.dart = dart;
  const ruby = await pedidoRuby(carpeta, nombres);
  if (ruby) res.ruby = ruby;
  const maven = await pedidoMaven(carpeta);
  if (maven) res.maven = maven;
  const gradle = await pedidoGradle(carpeta, nombres);
  if (gradle) res.gradle = gradle;
  return res;
}

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { leerTexto } from '../proyectos/archivos';

/** Lenguajes cuyo runtime se pide a los archivos del proyecto (Java, .NET, Go y Rust). */
export const LENGUAJES_PROYECTO = ['java', 'dotnet', 'go', 'rust'] as const;
export type LenguajeProyecto = (typeof LENGUAJES_PROYECTO)[number];

/** Lo que pide un archivo del proyecto. `version` null: hay proyecto pero no dice qué versión. */
export interface PedidoLenguaje {
  /** Versión limpia ("21", "8.0", "1.22", "1.85.0"); null si el archivo no la dice. */
  version: string | null;
  /** Archivo del que sale. */
  origen: string;
  /** La versión es un mínimo (compilar para Java 17 también sirve con un JDK 21). */
  minimo: boolean;
}

/** Tope de lectura de un archivo de proyecto: uno más grande no se interpreta. */
const MAX_BYTES = 1024 * 1024;

async function leer(ruta: string): Promise<string | null> {
  try {
    if ((await stat(ruta)).size > MAX_BYTES) return null;
  } catch {
    return null;
  }
  return leerTexto(ruta);
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
  const m = /^\s*(?:1\.)?(\d{1,2})(?:[.\s]|$)/.exec(valor);
  return m ? m[1]! : null;
}

function javaDePom(xml: string): string | null {
  for (const etiqueta of ['maven.compiler.release', 'java.version', 'maven.compiler.source']) {
    const m = new RegExp(`<${etiqueta.replace(/\./g, '\\.')}>\\s*([^<$]+?)\\s*</`).exec(xml);
    const v = m ? mayorJava(m[1]!) : null;
    if (v) return v;
  }
  return null;
}

function javaDeGradle(texto: string): string | null {
  const t = /JavaLanguageVersion\.of\(\s*["']?(\d{1,2})["']?\s*\)/.exec(texto);
  if (t) return t[1]!;
  const s =
    /(?:sourceCompatibility|targetCompatibility)\s*=?\s*(?:JavaVersion\.VERSION_)?["']?(\d+(?:[._]\d+)?)/.exec(
      texto,
    );
  return s ? mayorJava(s[1]!.replace('_', '.')) : null;
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
  for (const n of proyectos) {
    const xml = await leer(path.join(carpeta, n));
    const m = xml ? /<TargetFrameworks?>[^<]*?\bnet(\d+)\.(\d+)\b/.exec(xml) : null;
    if (m && Number(m[1]) >= 5) return { version: `${m[1]}.${m[2]}`, origen: n, minimo: true };
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
  const tc = /^\s*toolchain\s+go(\d+\.\d+(?:\.\d+)?)\s*$/m.exec(mod);
  if (tc) return { version: tc[1]!, origen: 'go.mod', minimo: false };
  const g = /^\s*go\s+(\d+\.\d+(?:\.\d+)?)\s*$/m.exec(mod);
  return { version: g ? g[1]! : null, origen: 'go.mod', minimo: true };
}

async function pedidoRust(carpeta: string): Promise<PedidoLenguaje | null> {
  const toml = await leer(path.join(carpeta, 'rust-toolchain.toml'));
  const plano = toml === null ? await leer(path.join(carpeta, 'rust-toolchain')) : null;
  const origen = toml !== null ? 'rust-toolchain.toml' : 'rust-toolchain';
  let canal: string | null = null;
  if (toml !== null) canal = /^\s*channel\s*=\s*["']([^"']+)["']/m.exec(toml)?.[1] ?? null;
  else if (plano !== null) {
    // Formato antiguo: el canal solo, o `channel = "..."` si ya es TOML.
    canal =
      /^\s*channel\s*=\s*["']([^"']+)["']/m.exec(plano)?.[1] ??
      plano
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l !== '' && !l.startsWith('#')) ??
      null;
  }
  if (toml === null && plano === null) {
    return (await leer(path.join(carpeta, 'Cargo.toml'))) !== null
      ? { version: null, origen: 'Cargo.toml', minimo: false }
      : null;
  }
  // "stable", "beta" y "nightly" (con o sin fecha) no son una versión instalable por número.
  const version = canal && /^\d+\.\d+(?:\.\d+)?$/.test(canal) ? canal : null;
  return { version, origen, minimo: false };
}

/**
 * Lo que piden los archivos de la carpeta para Java (`pom.xml`, `build.gradle(.kts)`), .NET
 * (`global.json`, `*.csproj`, `*.sln`), Go (`go.mod`) y Rust (`rust-toolchain(.toml)`, `Cargo.toml`).
 * Solo está la clave de los lenguajes que el proyecto usa; su `version` es null si el archivo no
 * dice cuál. Lee solo la raíz de la carpeta y archivos de hasta 1 MB.
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
  return res;
}

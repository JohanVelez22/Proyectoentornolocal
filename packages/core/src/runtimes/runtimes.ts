import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { ejecutableDe } from '../catalogo/catalogo';
import { leerTexto } from '../proyectos/archivos';
import { leerConfigProyecto } from '../proyectos/config';
import type { Rutas } from '../rutas';
import { esProyectoFlutter, pedidosLenguajes, type LenguajeProyecto } from './lenguajes';
import { carpetaRust, carpetasRustup, versionesRust } from './rust';

export const TIPOS_RUNTIME = [
  'node',
  'python',
  'java',
  'dotnet',
  'go',
  'rust',
  'bun',
  'deno',
  'zig',
  'kotlin',
  'dart',
] as const;
export type TipoRuntime = (typeof TIPOS_RUNTIME)[number];
export type VersionesRuntime = Partial<Record<TipoRuntime, string>>;

export function esTipoRuntime(v: unknown): v is TipoRuntime {
  return typeof v === 'string' && (TIPOS_RUNTIME as readonly string[]).includes(v);
}

/** Lo que `paraProyecto` necesita de un sitio. */
export interface SitioConRuntimes {
  carpeta: string;
  runtimes?: Partial<Record<TipoRuntime, string | null>> | null;
}

/**
 * Variables de entorno que necesita el runtime `tipo` instalado en `carpeta` (`Runtimes.rutaBin`):
 * `JAVA_HOME`; `DOTNET_ROOT` (sin telemetría); `GOROOT`, `GOTOOLCHAIN=local`, `GOPATH` y `GOCACHE` (en la carpeta de datos);
 * `RUSTUP_HOME` y `CARGO_HOME` propios (con `RUSTUP_TOOLCHAIN` si se da la versión);
 * `BUN_INSTALL` y `DENO_DIR` (cachés en la carpeta de datos), `ZIG_GLOBAL_CACHE_DIR`,
 * `KOTLIN_HOME` y `PUB_CACHE` (en la carpeta de datos, no en el perfil del usuario). Node y
 * Python no necesitan ninguna. Kotlin además necesita `JAVA_HOME`: sale del Java del proyecto.
 */
export function variablesRuntime(
  tipo: TipoRuntime,
  carpeta: string,
  o: { datos?: string; version?: string } = {},
): Record<string, string> {
  switch (tipo) {
    case 'java':
      return { JAVA_HOME: carpeta };
    case 'dotnet':
      return { DOTNET_ROOT: carpeta, DOTNET_CLI_TELEMETRY_OPTOUT: '1' };
    case 'go':
      return {
        GOROOT: carpeta,
        // Nunca baja otro toolchain por su cuenta: usa el instalado desde WolfCore Dev.
        GOTOOLCHAIN: 'local',
        ...(o.datos
          ? {
              GOPATH: path.join(o.datos, 'cache', 'go'),
              GOCACHE: path.join(o.datos, 'cache', 'go-build'),
            }
          : {}),
      };
    case 'rust': {
      const { rustupHome, cargoHome } = carpetasRustup(carpeta);
      return {
        RUSTUP_HOME: rustupHome,
        CARGO_HOME: cargoHome,
        ...(o.version ? { RUSTUP_TOOLCHAIN: o.version } : {}),
      };
    }
    case 'bun':
      return o.datos ? { BUN_INSTALL: path.join(o.datos, 'cache', 'bun') } : {};
    case 'deno':
      // Las cachés y los scripts de `deno install` quedan en la carpeta de datos, no en el perfil.
      return o.datos
        ? {
            DENO_DIR: path.join(o.datos, 'cache', 'deno'),
            DENO_INSTALL_ROOT: path.join(o.datos, 'cache', 'deno'),
          }
        : {};
    case 'zig':
      return o.datos ? { ZIG_GLOBAL_CACHE_DIR: path.join(o.datos, 'cache', 'zig') } : {};
    case 'kotlin':
      return { KOTLIN_HOME: carpeta };
    case 'dart':
      return o.datos ? { PUB_CACHE: path.join(o.datos, 'cache', 'pub') } : {};
    default:
      return {};
  }
}

/** Versiones elegidas para un proyecto y avisos en español para mostrar al usuario. */
export type RuntimesProyecto = VersionesRuntime & {
  avisos: string[];
  /** No se pudo leer `wolfcore.yml` (u otra pista): lo que se resolvió puede no ser lo que pide el proyecto. */
  lecturaFallida?: true;
};

/** Resolutor que usan Terminal y los procesos de proyecto. */
export interface ResolutorRuntimes {
  paraProyecto(sitio: SitioConRuntimes): Promise<RuntimesProyecto>;
  /** Carpetas a anteponer al PATH, en orden, para las versiones dadas. */
  carpetasPath(versiones: VersionesRuntime): string[];
  /** Variables de entorno (`JAVA_HOME`, `GOROOT`…) de las versiones dadas. */
  variables?(versiones: VersionesRuntime): Record<string, string>;
}

type Triple = [number, number, number];

function triple(v: string): Triple {
  const [a = 0, b = 0, c = 0] = v.split('.').map((x) => Number.parseInt(x, 10) || 0);
  return [a, b, c];
}
function cmp(a: Triple, b: Triple): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}
const ordenar = (versiones: string[]): string[] =>
  [...versiones].sort((x, y) => cmp(triple(y), triple(x)));

/** Un comparador: predicado sobre una versión "a.b.c". */
type Pred = (v: Triple) => boolean;

const NUM = String.raw`(\d+|[xX*])`;
const PARCIAL = new RegExp(`^v?${NUM}(?:\\.${NUM})?(?:\\.${NUM})?(?:[-+].*)?$`);

/** "22", "22.x", "3.12.*" → partes numéricas fijas (los comodines se descartan). */
function partes(texto: string): number[] | null {
  const m = PARCIAL.exec(texto);
  if (!m) return null;
  const fijas: number[] = [];
  for (const g of [m[1], m[2], m[3]]) {
    if (g === undefined || /^[xX*]$/.test(g)) break;
    fijas.push(Number(g));
  }
  return fijas;
}
const completar = (p: number[]): Triple => [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
const prefijo =
  (p: number[]): Pred =>
  (v) =>
    p.every((n, i) => v[i] === n);
/** Primera versión de la serie siguiente tras incrementar la parte `i`. */
function subir(p: number[], i: number): Triple {
  const t = completar(p.slice(0, i + 1));
  t[i] = (t[i] ?? 0) + 1;
  for (let j = i + 1; j < 3; j++) t[j] = 0;
  return t;
}

function comparador(op: string, texto: string): Pred | null {
  const p = partes(texto);
  if (!p) return null;
  const base = completar(p);
  switch (op) {
    case '':
    case '=':
    case '==':
      return prefijo(p);
    case '>=':
      return (v) => cmp(v, base) >= 0;
    case '>':
      // ">3.12" excluye toda la serie 3.12
      return p.length === 0 ? () => false : (v) => cmp(v, subir(p, p.length - 1)) >= 0;
    case '<':
      return (v) => cmp(v, base) < 0;
    case '<=':
      return p.length === 0 ? () => true : (v) => cmp(v, subir(p, p.length - 1)) < 0;
    case '^': {
      if (p.length === 0) return () => true;
      // El primer componente distinto de cero fija el tope (^0.2.3 → <0.3.0).
      let i = p.findIndex((n) => n !== 0);
      if (i === -1) i = p.length - 1;
      const tope = subir(p, i);
      return (v) => cmp(v, base) >= 0 && cmp(v, tope) < 0;
    }
    case '~': {
      if (p.length === 0) return () => true;
      const tope = subir(p, p.length === 1 ? 0 : 1);
      return (v) => cmp(v, base) >= 0 && cmp(v, tope) < 0;
    }
    case '~=': {
      // PEP 440: ~=3.12 → >=3.12, ==3.* ; ~=3.12.1 → >=3.12.1, ==3.12.*
      if (p.length < 2) return null;
      const tope = subir(p, p.length - 2);
      return (v) => cmp(v, base) >= 0 && cmp(v, tope) < 0;
    }
    case '!=':
      return (v) => !prefijo(p)(v);
    default:
      return null;
  }
}

/** Una alternativa (sin `||`): varios comparadores unidos por espacios o comas. */
function alternativa(texto: string): Pred | null {
  const limpio = texto
    .replace(/(\^|~=|~|>=|<=|==|!=|>|<|=)\s+/g, '$1')
    .replace(/,/g, ' ')
    .trim();
  if (limpio === '') return null;
  const preds: Pred[] = [];
  for (const tok of limpio.split(/\s+/)) {
    const m = /^(\^|~=|~|>=|<=|==|!=|>|<|=)?(.+)$/.exec(tok);
    if (!m) return null;
    const p = comparador(m[1] ?? '', m[2]!);
    if (!p) return null;
    preds.push(p);
  }
  return (v) => preds.every((p) => p(v));
}

const CUALQUIERA = /^(\*|x|latest|stable|node|current|lts\/.*|lts)$/i;

/** null: la pista no se entiende. */
function predicado(pista: string): Pred | null {
  const t = pista.trim();
  if (CUALQUIERA.test(t)) return () => true;
  const alts = t.split('||').map(alternativa);
  if (alts.some((a) => a === null)) return null;
  return (v) => alts.some((a) => a!(v));
}

/** ¿Se entiende la pista de versión? (`elegirVersion` ante una que no se entiende usa la más nueva). */
export function pistaEntendida(pista: string): boolean {
  return predicado(pista) !== null;
}

/**
 * Elige entre `instaladas` la versión más nueva que cumple `pista`. Sin pista (o con una que no
 * se entiende) usa la más nueva; con una pista válida que nada cumple, devuelve undefined.
 */
export function elegirVersion(
  instaladas: string[],
  pista: string | null | undefined,
): string | undefined {
  const lista = ordenar(instaladas);
  const pred = pista ? predicado(pista) : null;
  if (!pred) return lista[0];
  return lista.find((v) => pred(triple(v)));
}

/** LTS de Java: 8, 11, 17, 21 y, desde ahí, una cada cuatro versiones (25, 29, 33…). */
export const esLtsJava = (mayor: number): boolean =>
  mayor === 8 || mayor === 11 || mayor === 17 || (mayor >= 21 && (mayor - 21) % 4 === 0);

/**
 * Java: de las que cumplen la pista, el mismo mayor que pide el proyecto (`>=21` → 21 si está) o,
 * si no, la LTS más nueva; sin LTS que cumpla, la más nueva. Sin pista: la LTS más nueva.
 */
export function elegirJava(
  instaladas: string[],
  pista: string | null | undefined,
): string | undefined {
  const pred = pista ? predicado(pista) : null;
  const lista = ordenar(instaladas).filter((v) => !pred || pred(triple(v)));
  if (lista.length === 0) return undefined;
  const mayor = pista ? /^>=\s*(\d+)/.exec(pista)?.[1] : undefined;
  if (mayor !== undefined) {
    const igual = lista.find((v) => triple(v)[0] === Number(mayor));
    if (igual) return igual;
  }
  return lista.find((v) => esLtsJava(triple(v)[0])) ?? lista[0];
}

const leer = leerTexto;

const primeraLinea = (t: string | null): string | undefined =>
  t
    ?.split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l !== '' && !l.startsWith('#'));

/**
 * Una pista de versión. `fija`: el proyecto pide esa versión (sitio, wolfcore.yml, .nvmrc,
 * .node-version, .python-version); si no está instalada, no se usa ninguna. Las orientativas
 * (engines.node, requires-python) caen a la más nueva instalada.
 */
export interface PistaRuntime {
  valor: string;
  origen: string;
  fija: boolean;
}

async function enginesNode(carpeta: string): Promise<string | undefined> {
  const t = await leer(path.join(carpeta, 'package.json'));
  if (t === null) return undefined;
  try {
    const j: unknown = JSON.parse(t);
    const engines = (j as { engines?: { node?: unknown } } | null)?.engines;
    return typeof engines?.node === 'string' ? engines.node : undefined;
  } catch {
    return undefined;
  }
}

async function requiresPython(carpeta: string): Promise<string | undefined> {
  const t = await leer(path.join(carpeta, 'pyproject.toml'));
  return t === null ? undefined : /^\s*requires-python\s*=\s*["']([^"']+)["']/m.exec(t)?.[1];
}

/** Pistas de los archivos de versión del proyecto, en orden de prioridad (sin wolfcore.yml). */
export async function pistasArchivos(
  carpeta: string,
): Promise<Record<'node' | 'python', PistaRuntime[]>> {
  const pista = (valor: string | undefined, origen: string, fija: boolean): PistaRuntime[] =>
    valor ? [{ valor, origen, fija }] : [];
  return {
    node: [
      ...pista(primeraLinea(await leer(path.join(carpeta, '.nvmrc'))), '.nvmrc', true),
      ...pista(
        primeraLinea(await leer(path.join(carpeta, '.node-version'))),
        '.node-version',
        true,
      ),
      ...pista(await enginesNode(carpeta), 'package.json', false),
    ],
    python: [
      ...pista(
        primeraLinea(await leer(path.join(carpeta, '.python-version'))),
        '.python-version',
        true,
      ),
      ...pista(await requiresPython(carpeta), 'pyproject.toml', false),
    ],
  };
}

const NOMBRE: Record<TipoRuntime, string> = {
  node: 'Node',
  python: 'Python',
  java: 'Java',
  dotnet: '.NET',
  go: 'Go',
  rust: 'Rust',
  bun: 'Bun',
  deno: 'Deno',
  zig: 'Zig',
  kotlin: 'Kotlin',
  dart: 'Dart',
};

/** Pistas de Java, .NET, Go, Rust, Bun, Deno, Zig, Kotlin y Dart a partir de lo que piden los archivos del proyecto. */
async function pistasLenguaje(carpeta: string): Promise<{
  pistas: Partial<Record<LenguajeProyecto, PistaRuntime[]>>;
  canalRust: string | null;
}> {
  const res: Partial<Record<LenguajeProyecto, PistaRuntime[]>> = {};
  const pedidos = await pedidosLenguajes(carpeta);
  for (const [tipo, p] of Object.entries(pedidos)) {
    // Una restricción con su tope (`>=3.0.0 <4.0.0`, `^3.5.0`) se respeta tal cual: el SDK fuera
    // de ella no sirve (`pub get` falla), así que no se cae a "la más nueva".
    res[tipo as LenguajeProyecto] = p.restriccion
      ? [{ valor: p.restriccion, origen: p.origen, fija: true }]
      : p.version
        ? [{ valor: p.minimo ? `>=${p.version}` : p.version, origen: p.origen, fija: !p.minimo }]
        : [];
  }
  return { pistas: res, canalRust: pedidos.rust?.canal ?? null };
}

export class Runtimes implements ResolutorRuntimes {
  constructor(
    private readonly rutas: Rutas,
    /** Versión predeterminada elegida en Servicios → Versiones (si está instalada, manda sobre la más nueva). */
    private readonly predeterminada: (tipo: TipoRuntime) => Promise<string | null> = async () =>
      null,
  ) {}

  /**
   * Carpeta del runtime. Rust no tiene una por versión: rustup guarda los toolchains en una
   * carpeta común (`bin/rust`), de donde salen `RUSTUP_HOME` y `CARGO_HOME`.
   */
  rutaBin(tipo: TipoRuntime, version: string): string {
    return tipo === 'rust' ? carpetaRust(this.rutas) : this.rutas.bin(tipo, version);
  }

  async instalados(tipo: TipoRuntime): Promise<string[]> {
    if (tipo === 'rust') return ordenar(await versionesRust(this.rutas));
    const dir = path.dirname(this.rutas.bin(tipo, '_'));
    const exe = ejecutableDe(tipo)!;
    let nombres: string[];
    try {
      nombres = await readdir(dir);
    } catch {
      return [];
    }
    return ordenar(nombres.filter((n) => existsSync(path.join(this.rutas.bin(tipo, n), exe))));
  }

  /**
   * Prioridad: sitio.runtimes → wolfcore.yml → archivos de versión → la más nueva instalada.
   * Decide la primera pista que se entiende (ver `PistaRuntime` para qué pasa si no se cumple).
   */
  async paraProyecto(sitio: SitioConRuntimes): Promise<RuntimesProyecto> {
    const res: RuntimesProyecto = { avisos: [] };
    let yml: { node: string | null; python: string | null } = { node: null, python: null };
    try {
      yml = (await leerConfigProyecto(sitio.carpeta)) ?? yml;
    } catch (e) {
      res.avisos.push(`${e instanceof Error ? e.message : String(e)}. Se ignora.`);
      res.lecturaFallida = true;
    }
    const archivos = await pistasArchivos(sitio.carpeta);
    const { pistas: lenguajes, canalRust } = await pistasLenguaje(sitio.carpeta);
    if (canalRust !== null) {
      res.avisos.push(
        `El proyecto pide el canal "${canalRust}" de Rust, que no es una versión fija: se usa la versión de Rust instalada.`,
      );
    }
    if (sitio.runtimes?.dart === undefined && (await esProyectoFlutter(sitio.carpeta))) {
      res.avisos.push(
        'El proyecto es de Flutter, que trae su propio Dart: no se añade el Dart de WolfCore Dev.',
      );
    }
    // Kotlin compila con un Java: si el proyecto usa Kotlin, Java entra aunque no lo pida ningún
    // archivo suyo (con la versión que cumpla, o la LTS más nueva).
    const usaKotlin = sitio.runtimes?.kotlin !== undefined || lenguajes.kotlin !== undefined;
    for (const tipo of TIPOS_RUNTIME) {
      const elegir = tipo === 'java' ? elegirJava : elegirVersion;
      const pistas: PistaRuntime[] = [];
      const delSitio = sitio.runtimes?.[tipo];
      if (delSitio) pistas.push({ valor: delSitio, origen: 'sitio', fija: true });
      if (tipo === 'node' || tipo === 'python') {
        if (yml[tipo]) pistas.push({ valor: yml[tipo], origen: 'wolfcore.yml', fija: true });
        pistas.push(...archivos[tipo]);
      } else {
        // Java, .NET, Go y Rust solo entran al entorno si el proyecto los usa (lo dice un
        // archivo suyo o lo fijó el sitio): no se suman al PATH de todos los proyectos.
        const delArchivo = lenguajes[tipo];
        if (!delSitio && delArchivo === undefined && !(tipo === 'java' && usaKotlin)) continue;
        pistas.push(...(delArchivo ?? []));
      }
      const instaladas = await this.instalados(tipo);
      const pista = pistas.find((p) => predicado(p.valor) !== null);
      if (!pista) {
        const pred = await this.predeterminada(tipo).catch(() => null);
        const v = pred && instaladas.includes(pred) ? pred : elegir(instaladas, undefined);
        if (v) res[tipo] = v;
        continue;
      }
      const v = elegir(instaladas, pista.valor);
      if (v) {
        res[tipo] = v;
        continue;
      }
      const pide = `El proyecto pide ${NOMBRE[tipo]} ${pista.valor}, que no está instalado`;
      const masNueva = pista.fija ? undefined : elegir(instaladas, undefined);
      if (masNueva) {
        res[tipo] = masNueva;
        res.avisos.push(
          `${pide}; se usa ${NOMBRE[tipo]} ${masNueva}. Instálelo desde Servicios si hace falta.`,
        );
      } else {
        res.avisos.push(`${pide}. Instálelo desde Servicios.`);
      }
    }
    if (res.kotlin && !res.java) {
      res.avisos.push(
        'Kotlin necesita un Java instalado y no hay ninguno. Instálelo desde Servicios.',
      );
    }
    return res;
  }

  /**
   * Variables de entorno de las versiones dadas (`JAVA_HOME`, `DOTNET_ROOT`, `GOROOT`/`GOPATH`,
   * `RUSTUP_HOME`/`CARGO_HOME`). Las usan los procesos de proyecto, las recetas y la terminal.
   */
  variables(v: VersionesRuntime): Record<string, string> {
    const salida: Record<string, string> = {};
    for (const tipo of TIPOS_RUNTIME) {
      const version = v[tipo];
      if (!version) continue;
      Object.assign(
        salida,
        variablesRuntime(tipo, this.rutaBin(tipo, version), { datos: this.rutas.base, version }),
      );
    }
    // Kotlin ya trae KOTLIN_HOME; el Java que lo ejecuta lo da su JAVA_HOME (de `java`).
    return salida;
  }

  /**
   * Node: carpeta de node.exe (npm/npx) y su node_modules/.bin. Python: carpeta y Scripts. Java:
   * `bin`. .NET: la carpeta de dotnet. Go: `bin` y el `bin` de GOPATH. Rust: `cargo/bin`. Bun, Deno y
   * Zig: su carpeta (Bun también el `bin` de BUN_INSTALL). Kotlin y Dart: `bin`.
   */
  carpetasPath(v: VersionesRuntime): string[] {
    const salida: string[] = [];
    if (v.node) {
      const n = this.rutaBin('node', v.node);
      salida.push(n, path.join(n, 'node_modules', '.bin'));
    }
    if (v.python) {
      const p = this.rutaBin('python', v.python);
      salida.push(p, path.join(p, 'Scripts'));
    }
    if (v.java) salida.push(path.join(this.rutaBin('java', v.java), 'bin'));
    if (v.dotnet) salida.push(this.rutaBin('dotnet', v.dotnet));
    if (v.go) {
      salida.push(
        path.join(this.rutaBin('go', v.go), 'bin'),
        path.join(this.rutas.base, 'cache', 'go', 'bin'),
      );
    }
    if (v.rust) {
      salida.push(path.join(carpetasRustup(this.rutaBin('rust', v.rust)).cargoHome, 'bin'));
    }
    if (v.bun) {
      salida.push(this.rutaBin('bun', v.bun), path.join(this.rutas.base, 'cache', 'bun', 'bin'));
    }
    if (v.deno) {
      salida.push(this.rutaBin('deno', v.deno), path.join(this.rutas.base, 'cache', 'deno', 'bin'));
    }
    if (v.zig) salida.push(this.rutaBin('zig', v.zig));
    if (v.kotlin) salida.push(path.join(this.rutaBin('kotlin', v.kotlin), 'bin'));
    if (v.dart) salida.push(path.join(this.rutaBin('dart', v.dart), 'bin'));
    return salida;
  }
}

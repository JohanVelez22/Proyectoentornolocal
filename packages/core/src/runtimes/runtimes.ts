import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ejecutableDe } from '../catalogo/catalogo';
import type { Rutas } from '../rutas';

export type TipoRuntime = 'node' | 'python';
export type VersionesRuntime = { node?: string; python?: string };

/** Lo que `paraProyecto` necesita de un sitio (el campo `runtimes` lo agrega la Task 2). */
export interface SitioConRuntimes {
  carpeta: string;
  runtimes?: { node?: string | null; python?: string | null } | null;
}

/** Resolutor que usan Terminal y los procesos de proyecto. */
export interface ResolutorRuntimes {
  paraProyecto(sitio: SitioConRuntimes): Promise<VersionesRuntime>;
  /** Carpetas a anteponer al PATH, en orden, para las versiones dadas. */
  carpetasPath(versiones: VersionesRuntime): string[];
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

async function leer(ruta: string): Promise<string | null> {
  try {
    const t = await readFile(ruta, 'utf8');
    return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
  } catch {
    return null;
  }
}

const quitarComillas = (v: string): string =>
  v
    .replace(/\s+#.*$/, '')
    .trim()
    .replace(/^(["'])(.*)\1$/, '$2')
    .trim();

/** `runtimes:` de wolfcore.yml (solo claves node/python de ese bloque; sin dependencia de YAML). */
function pistasWolfcore(texto: string): VersionesRuntime {
  const salida: VersionesRuntime = {};
  let dentro = false;
  for (const linea of texto.split(/\r?\n/)) {
    if (/^\s*(#.*)?$/.test(linea)) continue;
    if (/^runtimes\s*:\s*(#.*)?$/.test(linea)) {
      dentro = true;
      continue;
    }
    if (!dentro) continue;
    if (!/^\s/.test(linea)) break; // otra clave de primer nivel
    const m = /^\s+(node|python)\s*:\s*(.*)$/.exec(linea);
    if (m) {
      const v = quitarComillas(m[2]!);
      if (v) salida[m[1] as TipoRuntime] = v;
    }
  }
  return salida;
}

const primeraLinea = (t: string | null): string | undefined =>
  t
    ?.split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l !== '' && !l.startsWith('#'));

export class Runtimes implements ResolutorRuntimes {
  constructor(private readonly rutas: Rutas) {}

  rutaBin(tipo: TipoRuntime, version: string): string {
    return this.rutas.bin(tipo, version);
  }

  async instalados(tipo: TipoRuntime): Promise<string[]> {
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

  /** Prioridad: sitio.runtimes → wolfcore.yml → archivos de versión → la más nueva instalada. */
  async paraProyecto(sitio: SitioConRuntimes): Promise<VersionesRuntime> {
    const yml = pistasWolfcore((await leer(path.join(sitio.carpeta, 'wolfcore.yml'))) ?? '');
    const res: VersionesRuntime = {};

    const nodes = await this.instalados('node');
    if (nodes.length > 0) {
      const v = this.resolver(nodes, [
        sitio.runtimes?.node,
        yml.node,
        primeraLinea(await leer(path.join(sitio.carpeta, '.nvmrc'))),
        primeraLinea(await leer(path.join(sitio.carpeta, '.node-version'))),
        await this.enginesNode(sitio.carpeta),
      ]);
      if (v) res.node = v;
    }
    const pys = await this.instalados('python');
    if (pys.length > 0) {
      const v = this.resolver(pys, [
        sitio.runtimes?.python,
        yml.python,
        primeraLinea(await leer(path.join(sitio.carpeta, '.python-version'))),
        await this.requiresPython(sitio.carpeta),
      ]);
      if (v) res.python = v;
    }
    return res;
  }

  /** La primera pista que se entiende decide; si nada la cumple, no se elige versión. */
  private resolver(
    instaladas: string[],
    candidatas: (string | null | undefined)[],
  ): string | undefined {
    for (const c of candidatas) {
      if (c && predicado(c)) return elegirVersion(instaladas, c);
    }
    return elegirVersion(instaladas, undefined);
  }

  private async enginesNode(carpeta: string): Promise<string | undefined> {
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

  private async requiresPython(carpeta: string): Promise<string | undefined> {
    const t = await leer(path.join(carpeta, 'pyproject.toml'));
    return t === null ? undefined : /^\s*requires-python\s*=\s*["']([^"']+)["']/m.exec(t)?.[1];
  }

  /** Node: carpeta de node.exe (npm/npx) y su node_modules/.bin. Python: carpeta y Scripts. */
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
    return salida;
  }
}

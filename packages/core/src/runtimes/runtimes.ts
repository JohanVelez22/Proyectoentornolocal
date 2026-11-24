import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { ejecutableDe } from '../catalogo/catalogo';
import { leerTexto } from '../proyectos/archivos';
import { leerConfigProyecto } from '../proyectos/config';
import type { Rutas } from '../rutas';

export type TipoRuntime = 'node' | 'python';
export type VersionesRuntime = { node?: string; python?: string };

/** Lo que `paraProyecto` necesita de un sitio. */
export interface SitioConRuntimes {
  carpeta: string;
  runtimes?: { node?: string | null; python?: string | null } | null;
}

/** Versiones elegidas para un proyecto y avisos en español para mostrar al usuario. */
export type RuntimesProyecto = VersionesRuntime & { avisos: string[] };

/** Resolutor que usan Terminal y los procesos de proyecto. */
export interface ResolutorRuntimes {
  paraProyecto(sitio: SitioConRuntimes): Promise<RuntimesProyecto>;
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
): Promise<Record<TipoRuntime, PistaRuntime[]>> {
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

const NOMBRE: Record<TipoRuntime, string> = { node: 'Node', python: 'Python' };

export class Runtimes implements ResolutorRuntimes {
  constructor(
    private readonly rutas: Rutas,
    /** Versión predeterminada elegida en Servicios → Versiones (si está instalada, manda sobre la más nueva). */
    private readonly predeterminada: (tipo: TipoRuntime) => Promise<string | null> = async () =>
      null,
  ) {}

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
    }
    const archivos = await pistasArchivos(sitio.carpeta);
    for (const tipo of ['node', 'python'] as const) {
      const pistas: PistaRuntime[] = [];
      const delSitio = sitio.runtimes?.[tipo];
      if (delSitio) pistas.push({ valor: delSitio, origen: 'sitio', fija: true });
      if (yml[tipo]) pistas.push({ valor: yml[tipo], origen: 'wolfcore.yml', fija: true });
      pistas.push(...archivos[tipo]);
      const instaladas = await this.instalados(tipo);
      const pista = pistas.find((p) => predicado(p.valor) !== null);
      if (!pista) {
        const pred = await this.predeterminada(tipo).catch(() => null);
        const v = pred && instaladas.includes(pred) ? pred : elegirVersion(instaladas, undefined);
        if (v) res[tipo] = v;
        continue;
      }
      const v = elegirVersion(instaladas, pista.valor);
      if (v) {
        res[tipo] = v;
        continue;
      }
      const pide = `El proyecto pide ${NOMBRE[tipo]} ${pista.valor}, que no está instalado`;
      const masNueva = pista.fija ? undefined : elegirVersion(instaladas, undefined);
      if (masNueva) {
        res[tipo] = masNueva;
        res.avisos.push(
          `${pide}; se usa ${NOMBRE[tipo]} ${masNueva}. Instálelo desde Servicios si hace falta.`,
        );
      } else {
        res.avisos.push(`${pide}. Instálelo desde Servicios.`);
      }
    }
    return res;
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

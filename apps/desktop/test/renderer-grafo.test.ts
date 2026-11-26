import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * El renderer corre en una página: no hay Node. Si su grafo de imports llega a `node:*`, a un
 * módulo incorporado de Node, a un cliente de base de datos o a `electron`, la ventana sale en
 * blanco (D41; el CI no lo vio porque el build lo oculta y solo `npm run dev` lo mostraba).
 */
const DESKTOP = path.join(__dirname, '..');
const RENDERER = path.join(DESKTOP, 'src', 'renderer');
const SHARED = path.join(DESKTOP, 'src', 'shared');
const CLIENTE = path.join(DESKTOP, '..', '..', 'packages', 'core', 'src', 'cliente.ts');

const PROHIBIDOS = new Set([
  ...builtinModules,
  'mysql2',
  'pg',
  'better-sqlite3',
  'electron',
  'mariadb',
  'sqlite3',
]);

function esProhibido(spec: string): boolean {
  if (spec.startsWith('node:')) return true;
  const raiz = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]!;
  return PROHIBIDOS.has(raiz) || PROHIBIDOS.has(spec);
}

function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) return fuentes(p);
    return /\.(ts|vue)$/.test(n) && !n.endsWith('.d.ts') ? [p] : [];
  });
}

function codigoDe(f: string): string {
  const t = readFileSync(f, 'utf8');
  if (!f.endsWith('.vue')) return t;
  return [...t.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
}

/** Especificadores que se importan como valor (los `import type` se borran al compilar). */
export function especificadores(codigo: string): string[] {
  const sin = codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const res: string[] = [];
  for (const m of sin.matchAll(
    /\b(import|export)\s+(type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/g,
  )) {
    if (m[2]) continue;
    res.push(m[4]!);
  }
  for (const m of sin.matchAll(/\bimport\s*['"]([^'"]+)['"]/g)) res.push(m[1]!);
  for (const m of sin.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) res.push(m[1]!);
  for (const m of sin.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)) res.push(m[1]!);
  return res;
}

function resolver(desde: string, spec: string): string | null {
  const limpio = spec.replace(/\?.*$/, '');
  let base: string | null = null;
  if (limpio === '@pel/core') return CLIENTE;
  if (limpio.startsWith('@/')) base = path.join(RENDERER, limpio.slice(2));
  else if (limpio.startsWith('.')) base = path.resolve(path.dirname(desde), limpio);
  if (!base) return null;
  for (const c of [base, `${base}.ts`, `${base}.vue`, path.join(base, 'index.ts')]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

function recorrer(entradas: string[]): { visitados: string[]; malos: string[] } {
  const visitados = new Set<string>();
  const malos: string[] = [];
  const pila = [...entradas];
  while (pila.length > 0) {
    const f = pila.pop()!;
    if (visitados.has(f)) continue;
    visitados.add(f);
    for (const spec of especificadores(codigoDe(f))) {
      if (esProhibido(spec)) {
        malos.push(`${path.relative(DESKTOP, f)} importa '${spec}'`);
        continue;
      }
      const destino = resolver(f, spec);
      if (destino) pila.push(destino);
    }
  }
  return { visitados: [...visitados], malos };
}

describe('el grafo de imports del renderer no toca Node ni bases de datos', () => {
  const entradas = [...fuentes(RENDERER), ...fuentes(SHARED), CLIENTE];
  const { visitados, malos } = recorrer(entradas);

  it('recorre el renderer y lo que resuelve el alias de @pel/core', () => {
    const rel = visitados.map((v) => v.split(path.sep).join('/'));
    expect(rel.some((v) => v.endsWith('renderer/main.ts'))).toBe(true);
    expect(rel.some((v) => v.endsWith('core/src/cliente.ts'))).toBe(true);
    expect(rel.some((v) => v.endsWith('core/src/constantesUi.ts'))).toBe(true);
    expect(rel.some((v) => v.endsWith('core/src/tuneles/proveedor.ts'))).toBe(true);
  });

  it('no aparece node:*, un módulo incorporado de Node, mysql2, pg, better-sqlite3 ni electron', () => {
    expect(malos).toEqual([]);
  });

  it('el detector ve lo prohibido (control)', () => {
    expect(especificadores("import { BlockList } from 'node:net';")).toEqual(['node:net']);
    expect(especificadores("export { a } from 'fs'; import type { T } from 'net';")).toEqual([
      'fs',
    ]);
    expect(esProhibido('fs/promises')).toBe(true);
    expect(esProhibido('mysql2/promise')).toBe(true);
    expect(esProhibido('vue')).toBe(false);
  });
});

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * El conversor de documentos (D34) carga mammoth, exceljs y pdfjs-dist por ruta absoluta desde
 * un `Worker` con `eval`. Dentro del .asar eso no funciona de forma fiable (ni para el módulo ni
 * para sus dependencias): todo el árbol de dependencias tiene que ir en `asarUnpack`.
 */

const raiz = path.resolve(__dirname, '..', '..', '..');
const modulos = path.join(raiz, 'node_modules');

function resolverDir(desde: string, nombre: string): string | null {
  for (let d = desde; ; d = path.dirname(d)) {
    const c = path.join(d, 'node_modules', nombre);
    if (existsSync(path.join(c, 'package.json'))) return c;
    if (path.dirname(d) === d) return null;
  }
}

/** Carpetas de primer nivel de `node_modules` que hay que desempaquetar (sin dependencias opcionales). */
function cierre(raices: string[]): string[] {
  const vistos = new Set<string>();
  const tops = new Set<string>();
  const visitar = (dir: string): void => {
    if (vistos.has(dir)) return;
    vistos.add(dir);
    const rel = path.relative(modulos, dir).split(path.sep);
    if (rel[0] !== '..') tops.add(rel[0]!.startsWith('@') ? `${rel[0]}/${rel[1]}` : rel[0]!);
    const j = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    for (const n of Object.keys(j.dependencies ?? {})) {
      const d = resolverDir(dir, n);
      if (d) visitar(d);
    }
  };
  for (const r of raices) visitar(path.join(modulos, r));
  return [...tops].sort();
}

describe('empaquetado del conversor', () => {
  const yml = readFileSync(path.join(__dirname, '..', 'electron-builder.yml'), 'utf8');
  const desempaquetados = new Set(
    [...yml.matchAll(/^\s+-\s+(node_modules\/\S+)\/\*\*\s*$/gm)].map((m) => m[1]!),
  );

  it('mammoth, exceljs, pdfjs-dist, pdf-lib y todas sus dependencias están en asarUnpack', () => {
    const faltan = cierre(['mammoth', 'exceljs', 'pdfjs-dist', 'pdf-lib', 'jszip'])
      .map((n) => `node_modules/${n}`)
      .filter((n) => !desempaquetados.has(n));
    expect(faltan).toEqual([]);
  });

  it('las bibliotecas del conversor son dependencias de la aplicación (se empaquetan)', () => {
    const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    for (const n of ['mammoth', 'exceljs', 'pdfjs-dist', 'pdf-lib']) {
      expect(pkg.dependencies[n], n).toMatch(/^\d+\.\d+\.\d+$/); // versión fija
    }
  });
});

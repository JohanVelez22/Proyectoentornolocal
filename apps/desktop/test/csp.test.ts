import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CSP_CAPTURA } from '../src/main/captura';

function csp(html: string): Map<string, string[]> {
  const m = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html);
  expect(m, 'la página declara una CSP').not.toBeNull();
  const dirs = new Map<string, string[]>();
  for (const d of m![1]!.split(';')) {
    const [nombre, ...valores] = d.trim().split(/\s+/);
    if (nombre) dirs.set(nombre, valores);
  }
  return dirs;
}

const leer = (rel: string): string => readFileSync(path.join(__dirname, '..', rel), 'utf8');

describe.each([
  ['ventana principal', 'src/renderer/index.html'],
  ['ventana de captura', 'src/renderer/captura/index.html'],
])('CSP de la %s', (_n, rel) => {
  const dirs = csp(leer(rel));

  it("declara script-src 'self' sin unsafe-inline ni unsafe-eval", () => {
    expect(dirs.get('script-src')).toEqual(["'self'"]);
  });

  it('cierra lo que no se usa y no admite orígenes remotos de http(s)', () => {
    expect(dirs.get('default-src')).toEqual(["'self'"]);
    expect(dirs.get('object-src')).toEqual(["'none'"]);
    expect(dirs.get('base-uri')).toEqual(["'none'"]);
    expect(dirs.get('form-action')).toEqual(["'none'"]);
    for (const [k, v] of dirs) {
      expect(
        v.some((x) => /^https?:/.test(x) || x === '*'),
        k,
      ).toBe(false);
    }
  });

  it("solo style-src lleva 'unsafe-inline' (Naive UI inyecta <style>)", () => {
    for (const [k, v] of dirs) {
      if (k !== 'style-src') expect(v, k).not.toContain("'unsafe-inline'");
      expect(v, k).not.toContain("'unsafe-eval'");
    }
    expect(dirs.get('style-src')).toContain("'unsafe-inline'");
  });
});

describe('CSP de las demás ventanas', () => {
  it('la de captura coincide con la constante del proceso principal', () => {
    expect(leer('src/renderer/captura/index.html')).toContain(CSP_CAPTURA);
  });

  it('la ventana que imprime a PDF no ejecuta JavaScript y su HTML lleva default-src none', () => {
    expect(leer('src/main/conversorPdfConfig.ts')).toContain('javascript: false');
    const plantilla = readFileSync(
      path.join(__dirname, '..', '..', '..', 'packages', 'core', 'src', 'conversor', 'markdown.ts'),
      'utf8',
    );
    expect(plantilla).toContain("default-src 'none'");
  });

  it('la ventana principal permite ws:/wss: solo en connect-src', () => {
    const d = csp(leer('src/renderer/index.html'));
    expect(d.get('connect-src')).toEqual(["'self'", 'ws:', 'wss:']);
  });
});

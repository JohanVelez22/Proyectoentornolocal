import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';
import {
  contenidoHttp,
  filtrarCodigos,
  filtrarMetodos,
  guiaTuneles,
  partesGuia,
  textoEn,
} from '../src/renderer/utilidades/guias';
import { renderizarMarkdown } from '../src/renderer/utilidades/herramientas';

const IDIOMAS = ['es', 'en', 'pt', 'fr'] as const;
const CODIGOS = [
  100, 101, 200, 201, 202, 204, 206, 301, 302, 303, 304, 307, 308, 400, 401, 403, 404, 405, 406,
  408, 409, 410, 413, 415, 418, 422, 425, 429, 451, 500, 501, 502, 503, 504,
];
const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'];

const RAIZ = join(__dirname, '../../../docs/contenido');
const crudo = JSON.parse(readFileSync(join(RAIZ, 'http.json'), 'utf8')) as typeof contenidoHttp;

describe('guía HTTP: contenido', () => {
  it('trae todos los códigos y métodos pedidos, sin duplicados', () => {
    const codigos = crudo.codigos.map((c) => c.codigo);
    for (const c of CODIGOS) expect(codigos, `código ${c}`).toContain(c);
    expect(new Set(codigos).size).toBe(codigos.length);
    const metodos = crudo.metodos.map((m) => m.nombre);
    for (const m of METODOS) expect(metodos, `método ${m}`).toContain(m);
    expect(new Set(metodos).size).toBe(metodos.length);
  });

  it('cada entrada está completa en los 4 idiomas', () => {
    for (const c of crudo.codigos) {
      expect(c.familia).toBe(`${Math.floor(c.codigo / 100)}xx`);
      for (const l of IDIOMAS) {
        const t = c[l]!;
        expect(t, `${c.codigo} ${l}`).toBeDefined();
        for (const k of ['resumen', 'explicacion', 'ejemplo'] as const)
          expect(t[k].trim(), `${c.codigo} ${l} ${k}`).not.toBe('');
        expect(t.causasComunes.length, `${c.codigo} ${l}`).toBeGreaterThan(0);
        expect(t.comoSolucionar.length, `${c.codigo} ${l}`).toBeGreaterThan(0);
        expect(t.causasComunes.length).toBe(c.es!.causasComunes.length);
        expect(t.comoSolucionar.length).toBe(c.es!.comoSolucionar.length);
      }
    }
    for (const m of crudo.metodos)
      for (const l of IDIOMAS)
        for (const k of ['resumen', 'explicacion', 'ejemplo'] as const)
          expect(m[l]![k].trim(), `${m.nombre} ${l} ${k}`).not.toBe('');
  });

  it('seguro e idempotente son coherentes con HTTP', () => {
    const por = Object.fromEntries(crudo.metodos.map((m) => [m.nombre, m]));
    for (const m of ['GET', 'HEAD', 'OPTIONS', 'TRACE']) expect(por[m]!.seguro, m).toBe(true);
    for (const m of ['POST', 'PUT', 'PATCH', 'DELETE', 'CONNECT'])
      expect(por[m]!.seguro, m).toBe(false);
    for (const m of ['PUT', 'DELETE']) expect(por[m]!.idempotente, m).toBe(true);
    for (const m of ['POST', 'PATCH', 'CONNECT']) expect(por[m]!.idempotente, m).toBe(false);
    // Todo método seguro es idempotente.
    for (const m of crudo.metodos) if (m.seguro) expect(m.idempotente, m.nombre).toBe(true);
  });

  it('marca 418 como broma y 419 como no estándar', () => {
    const c418 = crudo.codigos.find((c) => c.codigo === 418)!;
    expect(c418.estandar).toBe(false);
    expect(c418.broma).toBe(true);
    for (const l of IDIOMAS) expect(c418[l]!.explicacion).toContain('2324');
    expect(crudo.codigos.find((c) => c.codigo === 419)!.estandar).toBe(false);
  });

  it('los ejemplos no llevan datos reales (solo dominios ficticios)', () => {
    const dominios = JSON.stringify(crudo).match(/https?:\/\/[a-z0-9.-]+/gi) ?? [];
    for (const d of dominios)
      expect(d, d).toMatch(
        /(\.test|\.local|localhost|127\.0\.0\.1|ejemplo\.com|example\.com|trycloudflare|ngrok|cloudflare)/i,
      );
  });
});

describe('guía HTTP: búsqueda', () => {
  const todos = contenidoHttp.codigos;
  it('busca por número, nombre y texto, sin tildes ni mayúsculas', () => {
    expect(filtrarCodigos(todos, 'es', '404', null).map((c) => c.codigo)).toContain(404);
    expect(filtrarCodigos(todos, 'es', 'teapot', null).map((c) => c.codigo)).toEqual([418]);
    expect(filtrarCodigos(todos, 'es', 'REDIRECCION', null).length).toBeGreaterThan(0);
    expect(filtrarCodigos(todos, 'es', 'zzzz-no-existe', null)).toEqual([]);
  });
  it('filtra por familia', () => {
    const r = filtrarCodigos(todos, 'es', '', '5xx');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.familia === '5xx')).toBe(true);
  });
  it('busca en el idioma activo', () => {
    expect(filtrarCodigos(todos, 'fr', 'redirection', null).length).toBeGreaterThan(0);
    expect(filtrarMetodos(contenidoHttp.metodos, 'en', 'trace').map((m) => m.nombre)).toContain(
      'TRACE',
    );
  });
  it('usa el inglés si falta la traducción', () => {
    const c = { ...todos[0]!, pt: undefined };
    const r = textoEn(c, 'pt');
    expect(r.traducido).toBe(false);
    expect(r.texto).toBe(c.en);
    expect(textoEn(todos[0]!, 'pt').traducido).toBe(true);
  });
});

describe('guía de túneles', () => {
  it('existe en los 4 idiomas con las mismas secciones y bloques de código', () => {
    const esMd = guiaTuneles('es');
    const encab = (s: string) => s.match(/^## \d+\./gm)?.length;
    const bloques = (s: string) => partesGuia(s).filter((p) => p.tipo === 'codigo');
    for (const l of IDIOMAS) {
      const md = guiaTuneles(l);
      expect(md.length, l).toBeGreaterThan(5000);
      expect(encab(md), l).toBe(encab(esMd));
      expect(
        bloques(md).map((b) => b.texto),
        l,
      ).toEqual(bloques(esMd).map((b) => b.texto));
    }
    expect(guiaTuneles('en')).not.toBe(esMd);
  });

  it('separa los bloques de código del texto', () => {
    const p = partesGuia('Hola\n\n```bash\nngrok http 80\n```\n\nFin\n');
    expect(p).toEqual([
      { tipo: 'texto', texto: 'Hola\n\n' },
      { tipo: 'codigo', texto: 'ngrok http 80' },
      { tipo: 'texto', texto: '\n\nFin\n' },
    ]);
  });

  it('explica por qué no hay ngrok TCP para FTP y propone las alternativas', () => {
    for (const l of IDIOMAS) {
      const md = guiaTuneles(l);
      expect(md, l).toMatch(/FTP/);
      expect(md, l).toMatch(/SFTP/);
      expect(md, l).toMatch(/FTPS/);
    }
  });

  it('se pinta con el sanitizador: sin HTML crudo ni enlaces peligrosos', () => {
    const html = renderizarMarkdown(
      '<script>alert(1)</script> [x](javascript:alert(1)) ![i](http://a/b.png)',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('<img');
    for (const l of IDIOMAS)
      expect(renderizarMarkdown(guiaTuneles(l))).not.toMatch(/<script|<img/i);
  });

  it('los textos de la interfaz de las guías existen en los 4 idiomas', () => {
    for (const d of [es, en, pt, fr]) {
      expect(d.herramientas.lista.guiaTuneles.nombre).not.toBe('');
      expect(d.herramientas.lista.guiaHttp.nombre).not.toBe('');
      expect(Object.keys(d.guias.http.familias)).toEqual(['1xx', '2xx', '3xx', '4xx', '5xx']);
    }
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = join(__dirname, '../../../docs/contenido');
const IDIOMAS = ['es', 'en', 'pt', 'fr'] as const;
type Json = Record<string, unknown>;
const http = JSON.parse(readFileSync(join(RAIZ, 'http.json'), 'utf8')) as {
  metodos: Json[];
  codigos: Json[];
};

const claves = (o: Json): string[] => Object.keys(o).sort();
const textoNoVacio = (v: unknown): boolean => typeof v === 'string' && v.trim() !== '';
const listaDeTextos = (v: unknown): boolean =>
  Array.isArray(v) && v.length > 0 && v.every((x) => textoNoVacio(x));

describe('esquema de docs/contenido/http.json', () => {
  it('solo trae metodos y codigos', () => {
    expect(claves(http as unknown as Json)).toEqual(['codigos', 'metodos']);
  });

  it('cada método lleva nombre, seguro, idempotente y los 4 idiomas completos', () => {
    for (const m of http.metodos) {
      expect(claves(m), String(m.nombre)).toEqual(
        ['en', 'es', 'fr', 'idempotente', 'nombre', 'pt', 'seguro'].sort(),
      );
      expect(textoNoVacio(m.nombre), 'nombre').toBe(true);
      expect(typeof m.seguro, `${m.nombre} seguro`).toBe('boolean');
      expect(typeof m.idempotente, `${m.nombre} idempotente`).toBe('boolean');
      for (const l of IDIOMAS) {
        const t = m[l] as Json;
        expect(claves(t), `${m.nombre} ${l}`).toEqual(['ejemplo', 'explicacion', 'resumen']);
        for (const k of Object.keys(t))
          expect(textoNoVacio(t[k]), `${m.nombre} ${l} ${k}`).toBe(true);
      }
    }
  });

  it('cada código lleva codigo, nombre, familia, estandar explícito y los 4 idiomas completos', () => {
    for (const c of http.codigos) {
      const id = String(c.codigo);
      // `broma` es opcional (solo el 418); lo demás es obligatorio y no hay claves sueltas.
      const { broma, ...resto } = c;
      expect(broma === undefined || broma === true, `${id} broma`).toBe(true);
      expect(claves(resto), id).toEqual(
        ['codigo', 'en', 'es', 'estandar', 'familia', 'fr', 'nombre', 'pt'].sort(),
      );
      expect(
        Number.isInteger(c.codigo) && (c.codigo as number) >= 100 && (c.codigo as number) < 600,
      ).toBe(true);
      expect(textoNoVacio(c.nombre), `${id} nombre`).toBe(true);
      expect(c.familia, `${id} familia`).toBe(`${Math.floor((c.codigo as number) / 100)}xx`);
      expect(typeof c.estandar, `${id} estandar debe ser true o false, explícito`).toBe('boolean');
      for (const l of IDIOMAS) {
        const t = c[l] as Json;
        expect(claves(t), `${id} ${l}`).toEqual(
          ['causasComunes', 'comoSolucionar', 'ejemplo', 'explicacion', 'resumen'].sort(),
        );
        for (const k of ['resumen', 'explicacion', 'ejemplo']) {
          expect(textoNoVacio(t[k]), `${id} ${l} ${k}`).toBe(true);
        }
        expect(listaDeTextos(t.causasComunes), `${id} ${l} causasComunes`).toBe(true);
        expect(listaDeTextos(t.comoSolucionar), `${id} ${l} comoSolucionar`).toBe(true);
      }
    }
  });

  it('solo 418 y 419 están marcados como no estándar', () => {
    const no = http.codigos.filter((c) => c.estandar === false).map((c) => c.codigo);
    expect(no).toEqual([418, 419]);
  });
});

/** Tuteo francés: la interfaz trata de «vous» (glosario de i18n/fr.ts: «jamais de tu»). */
const TUTEO_FR = [
  /(?<![\p{L}\p{N}_'’-])(?:tu|ton|ta|tes|te|toi)(?![\p{L}\p{N}_-])/giu,
  /(?<![\p{L}\p{N}_])t['’](?=\p{L})/giu,
  /-(?:toi|tu)(?![\p{L}\p{N}_])/giu,
];

function tuteos(texto: string): string[] {
  const res: string[] = [];
  for (const re of TUTEO_FR) {
    for (const m of texto.matchAll(re)) {
      res.push(texto.slice(Math.max(0, m.index - 25), m.index + m[0].length + 25));
    }
  }
  return res;
}

function textosFr(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(textosFr);
  if (v && typeof v === 'object') return Object.values(v).flatMap(textosFr);
  return [];
}

describe('francés con «vous» (sin tuteo)', () => {
  it('el detector distingue el tuteo de las palabras que lo contienen (control)', () => {
    expect(
      tuteos("Tu dois te connecter ou reconnecte-toi, ton token, ta clé, tes liens, t'aider"),
    ).toHaveLength(7);
    expect(
      tuteos(
        'Vous devez vous connecter ; les routes, la liste, un autre test, VOTRE_TOKEN, mi-tunel',
      ),
    ).toEqual([]);
  });

  it('http.json: ningún bloque fr tutea', () => {
    const malos: string[] = [];
    for (const e of [...http.metodos, ...http.codigos]) {
      for (const t of textosFr(e.fr)) {
        for (const x of tuteos(t)) malos.push(`${String(e.codigo ?? e.nombre)}: …${x}…`);
      }
    }
    expect(malos).toEqual([]);
  });

  it('guia-tuneles.fr.md no tutea', () => {
    const md = readFileSync(join(RAIZ, 'guia-tuneles.fr.md'), 'utf8');
    expect(tuteos(md)).toEqual([]);
  });
});

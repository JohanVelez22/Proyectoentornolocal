import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { AVISOS_PERFIL, CODIGOS_ERROR, IDIOMAS_UI, MOTIVOS_PERFIL } from '@pel/core';
import { describe, expect, it } from 'vitest';
import { textosMain } from '../src/main/textos';
import { IDIOMAS, diccionarios } from '../src/renderer/i18n';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';
import { CODIGOS_AVISO, CODIGOS_AVISO_POR_IDIOMA, textoAviso } from '../src/shared/textosAvisos';

const RAIZ = join(__dirname, '../src/renderer');

/** Rutas de todas las hojas: `a.b.c` → 'string' | 'function/2' | 'array/3'. */
function forma(o: unknown, pre = ''): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    const ruta = pre ? `${pre}.${k}` : k;
    if (typeof v === 'function') r[ruta] = `function/${v.length}`;
    else if (Array.isArray(v)) r[ruta] = `array/${v.length}`;
    else if (v !== null && typeof v === 'object') Object.assign(r, forma(v, ruta));
    else r[ruta] = typeof v;
  }
  return r;
}

function archivos(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'i18n' ? [] : archivos(p, ext);
    return ext.test(n) ? [p] : [];
  });
}

/** Palabras sueltas que se permiten como texto fijo en una plantilla (marcas y siglas). */
const PERMITIDAS = new Set(['WolfCore', 'Dev', 'PHP', 'Nginx', 'MCP', 'HTTPS', 'GitHub', 'Git']);

const ESPANOL =
  /[áéíóúñ¿¡ÁÉÍÓÚÑ]|\b(?:de|del|la|las|los|el|para|con|sin|una|uno|que|por|en|se|su|sus|al|no|si|ya|hay|esta|este|guardar|abrir|cerrar|borrar|cancelar|aceptar|nuevo|nueva|proyecto|servicio|carpeta|archivo|puerto|clave|usuario|error|copiar|instalar|encender|apagar)\b/i;

/** Texto visible de una plantilla: nodos de texto y atributos estáticos que se muestran. */
function textosVisibles(plantilla: string): string[] {
  const sinComentarios = plantilla.replace(/<!--[\s\S]*?-->/g, '');
  const res: string[] = [];
  // Atributos estáticos que se ven (o se leen en voz alta).
  for (const m of sinComentarios.matchAll(
    /\s(?:placeholder|title|label|aria-label|alt|content|description|positive-text|negative-text)="([^"]*)"/g,
  )) {
    res.push(m[1]!);
  }
  // Nodos de texto, sin interpolaciones.
  const sinEtiquetas = sinComentarios
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, '\n');
  for (const linea of sinEtiquetas.split('\n')) {
    const t = linea.trim();
    if (t) res.push(t);
  }
  return res;
}

function plantillaDe(sfc: string): string {
  const i = sfc.indexOf('<template>');
  const f = sfc.lastIndexOf('</template>');
  return i < 0 || f < 0 ? '' : sfc.slice(i + '<template>'.length, f);
}

/** Literales de cadena del script (sin comentarios) con tildes, ¿ o ¡: textos en español. */
function literalesEnEspanol(codigo: string): string[] {
  const sinComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const res: string[] = [];
  const literal = /'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`|"((?:[^"\\\n]|\\.)*)"/g;
  for (const m of sinComentarios.matchAll(literal)) {
    const t = m[1] ?? m[2] ?? m[3] ?? '';
    if (/[áéíóúñ¿¡ÁÉÍÓÚÑ]/.test(t)) res.push(t);
  }
  return res;
}

/** Hojas de texto (cadenas) de un diccionario: ruta → texto. */
function hojasTexto(o: unknown, pre = ''): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    const ruta = pre ? `${pre}.${k}` : k;
    if (typeof v === 'string') r[ruta] = v;
    else if (v !== null && typeof v === 'object') Object.assign(r, hojasTexto(v, ruta));
  }
  return r;
}

const marcas = (t: string): string[] => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
const OTROS = { en, pt, fr } as const;
/** Marcas, siglas y nombres de productos o comandos que se escriben igual en todos los idiomas. */
const MARCAS = new Set(
  (
    'WolfCore Dev PHP Nginx Apache MySQL MariaDB PostgreSQL Redis MongoDB Node Composer npm pnpm yarn Git ' +
    'GitHub GitLab Docker Podman Cloudflare ngrok Expose Tailscale Mailpit MailHog Adminer HTTPS HTTP SSL ' +
    'TLS DNS MCP API URL CLI JSON YAML ZIP PDF SQL FTP SMTP QR Doctor Claude Codex Gemini Qwen Copilot ' +
    'Cursor Opencode Antigravity Kilo OmniRouter FreeLLMAPI OpenAI Anthropic Ollama Windows macOS Linux ' +
    'Laravel Symfony WordPress Vite Xdebug OpenSSL IP ID PID RAM CPU PATH hosts vhost localhost'
  ).split(' '),
);

/** Palabras de un texto sin marcas ni siglas (los nombres de productos y comandos no se traducen). */
const palabrasTraducibles = (texto: string): string[] =>
  (texto.match(/\p{L}{2,}/gu) ?? []).filter((p) => !MARCAS.has(p) && !/^[A-Z0-9]+$/.test(p));

/**
 * Textos largos (3 palabras o más): ahí una coincidencia con es o en es relleno sin traducir. Las
 * etiquetas de una o dos palabras ("Abrir", "Services") coinciden a menudo por ser cognados y se
 * revisan aparte con un tope más holgado.
 */
const esLargo = (ruta: string, base: Record<string, string>): boolean =>
  palabrasTraducibles(base[ruta] ?? '').length >= 3;
const esCorto = (ruta: string, base: Record<string, string>): boolean =>
  !esLargo(ruta, base) && palabrasTraducibles(base[ruta] ?? '').length > 0;

describe('i18n', () => {
  it('todos los diccionarios tienen la misma forma (claves, tipos y aridad de funciones)', () => {
    for (const id of IDIOMAS_UI) expect(forma(diccionarios[id]), id).toEqual(forma(es));
    expect(forma(en)).toEqual(forma(es));
    expect(forma(pt)).toEqual(forma(es));
    expect(forma(fr)).toEqual(forma(es));
  });

  it('el registro IDIOMAS cubre IDIOMAS_UI con su nombre nativo y su locale de Intl', () => {
    expect(IDIOMAS.map((i) => i.id)).toEqual([...IDIOMAS_UI]);
    expect(IDIOMAS.map((i) => i.localeIntl)).toEqual(['es-AR', 'en-US', 'pt-BR', 'fr-FR']);
    for (const i of IDIOMAS) {
      expect(i.nombreNativo).not.toBe('');
      for (const d of [es, en, pt, fr]) expect(d.preferencias.idiomas[i.id]).toBe(i.nombreNativo);
    }
  });

  it('los marcadores {x} de cada texto coinciden con los de es', () => {
    const base = hojasTexto(es);
    for (const [id, d] of Object.entries(OTROS)) {
      const h = hojasTexto(d);
      for (const [ruta, t] of Object.entries(base)) {
        expect(marcas(h[ruta] ?? ''), `${id}:${ruta}`).toEqual(marcas(t));
      }
    }
  });

  it('las funciones con interpolación usan todos sus argumentos en cada idioma', () => {
    const args = ['ARG1', 'ARG2', 'ARG3', 'ARG4'];
    const llamar = (o: unknown, ruta: string): string => {
      const f = ruta.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown>)[k], o);
      return String((f as (...a: string[]) => unknown)(...args));
    };
    const rutas: string[] = [];
    const buscar = (o: unknown, pre: string): void => {
      for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
        const r = pre ? `${pre}.${k}` : k;
        if (typeof v === 'function') rutas.push(r);
        else if (v && typeof v === 'object' && !Array.isArray(v)) buscar(v, r);
      }
    };
    buscar(es, '');
    expect(rutas.length).toBeGreaterThan(50);
    for (const r of rutas) {
      let esperados: string[];
      try {
        const salidaEs = llamar(es, r);
        esperados = args.filter((a) => salidaEs.includes(a));
      } catch {
        continue;
      }
      for (const [id, d] of Object.entries(OTROS)) {
        const salida = llamar(d, r);
        for (const a of esperados) expect(salida, `${id}:${r}`).toContain(a);
      }
    }
  });

  /** Rutas de los textos de `base` que `d` deja idénticos, separadas en largos y cortos. */
  function copiados(
    base: Record<string, string>,
    d: unknown,
  ): { largos: number; cortos: number; lista: string[] } {
    const h = hojasTexto(d);
    const largos = Object.keys(base).filter((r) => esLargo(r, base));
    const cortos = Object.keys(base).filter((r) => esCorto(r, base));
    const igualesLargos = largos.filter((r) => h[r] === base[r]);
    const igualesCortos = cortos.filter((r) => h[r] === base[r]);
    return {
      largos: igualesLargos.length / largos.length,
      cortos: igualesCortos.length / cortos.length,
      lista: [...igualesLargos, ...igualesCortos].slice(0, 30),
    };
  }

  it('ningún texto de pt o fr es igual al de es en más del 5 % de las hojas', () => {
    const base = hojasTexto(es);
    expect(Object.keys(base).filter((r) => esLargo(r, base)).length).toBeGreaterThan(500);
    for (const [id, d] of Object.entries({ pt, fr })) {
      const c = copiados(base, d);
      // Largos: relleno sin traducir. Cortos: en es↔pt los cognados (Abrir, Cancelar…) coinciden mucho.
      expect(c.largos, `${id} largos: ${c.lista.join(', ')}`).toBeLessThanOrEqual(0.05);
      expect(c.cortos, `${id} cortos: ${c.lista.join(', ')}`).toBeLessThanOrEqual(0.35);
    }
  });

  it('pt y fr no copian los textos de en como relleno', () => {
    const base = hojasTexto(en);
    for (const [id, d] of Object.entries({ pt, fr })) {
      const c = copiados(base, d);
      expect(c.largos, `${id} largos: ${c.lista.join(', ')}`).toBeLessThanOrEqual(0.05);
      expect(c.cortos, `${id} cortos: ${c.lista.join(', ')}`).toBeLessThanOrEqual(0.35);
    }
  });

  it('textos del proceso principal en los cuatro idiomas', () => {
    const base = textosMain('es') as Record<string, string>;
    for (const id of IDIOMAS_UI) {
      const t = textosMain(id) as Record<string, string>;
      expect(Object.keys(t).sort(), id).toEqual(Object.keys(base).sort());
      for (const v of Object.values(t)) expect(v).not.toBe('');
    }
    for (const id of ['pt', 'fr'] as const) {
      const t = textosMain(id) as Record<string, string>;
      // Cognados como "Abrir" o "Cancelar" pueden coincidir; más de dos sería relleno.
      expect(Object.keys(base).filter((k) => t[k] === base[k]).length, id).toBeLessThanOrEqual(2);
    }
  });

  it('textos de avisos en los cuatro idiomas: mismos códigos y texto propio', () => {
    for (const id of IDIOMAS_UI) {
      expect([...CODIGOS_AVISO_POR_IDIOMA[id]].sort(), id).toEqual([...CODIGOS_AVISO].sort());
    }
    const datos = {
      nombre: 'N',
      fuente: 'F',
      puerto: 80,
      dias: 3,
      servicio: 'S',
      nueva: 'V2',
      actual: 'V1',
    };
    for (const codigo of CODIGOS_AVISO) {
      const e = textoAviso('es', { tipo: 'doctor', codigo, datos });
      for (const id of ['pt', 'fr'] as const) {
        const t = textoAviso(id, { tipo: 'doctor', codigo, datos });
        expect(t.titulo, `${id}:${codigo}`).not.toBe('');
        expect(t.cuerpo, `${id}:${codigo}`).not.toBe('');
        expect(t.titulo, `${id}:${codigo}`).not.toBe(e.titulo);
        expect(t.accion === undefined, `${id}:${codigo}`).toBe(e.accion === undefined);
      }
    }
    for (const tipo of [
      'servicio-caido',
      'puerto-ocupado',
      'certificado-por-vencer',
      'tunel-caido',
      'proceso-error',
      'proceso-terminado',
      'receta-terminada',
      'doctor',
      'contenedor-detenido',
      'version-nueva',
    ] as const) {
      const e = textoAviso('es', { tipo, codigo: 'x.desconocido', datos: {} });
      for (const id of ['pt', 'fr'] as const) {
        const t = textoAviso(id, { tipo, codigo: 'x.desconocido', datos: {} });
        expect(t.titulo, `${id}:${tipo}`).not.toBe(e.titulo);
      }
    }
  });

  it('pt y fr no tienen rastros de español (ñ, ¿ o ¡)', () => {
    for (const [id, d] of Object.entries({ pt, fr })) {
      // Los nombres de los idiomas van en su propio idioma ("Español" en todos los diccionarios).
      const malos = Object.entries(hojasTexto(d)).filter(
        ([ruta, t]) => !ruta.startsWith('preferencias.idiomas.') && /[ñ¿¡]/.test(t),
      );
      expect(malos, id).toEqual([]);
    }
  });

  it('en no tiene textos en español (tildes, ¿ o ¡)', () => {
    const hojas: string[] = [];
    const recorrer = (o: unknown): void => {
      for (const v of Object.values(o as Record<string, unknown>)) {
        if (typeof v === 'string') hojas.push(v);
        else if (v && typeof v === 'object') recorrer(v);
      }
    };
    // Los nombres de los idiomas van en su propio idioma ("Español" en ambos diccionarios).
    recorrer({ ...en, preferencias: { ...en.preferencias, idiomas: {} } });
    expect(hojas.filter((h) => /[áéíóúñ¿¡]/.test(h))).toEqual([]);
  });

  describe('"rama" solo existe en contextos de Git (D1 + D41)', () => {
    /** es "rama/ramo", en "branch", pt "branch/ramo", fr "branche": ninguno fuera de Git. */
    const PROHIBIDA = /\b(?:ramas?|ramos?|branch(?:es)?|branches?|branche)\b/i;

    /** Hojas de texto (funciones evaluadas con 'X'); sin los marcadores `{rama}` (son parámetros). */
    function hojasDe(dic: unknown): { ruta: string; texto: string }[] {
      const hojas: { ruta: string; texto: string }[] = [];
      const recorrer = (o: unknown, ruta: string): void => {
        for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
          const r = ruta ? `${ruta}.${k}` : k;
          let texto: string | undefined;
          if (typeof v === 'string') texto = v;
          else if (typeof v === 'function') {
            try {
              texto = String((v as (...a: unknown[]) => unknown)('X', 'X', 'X'));
            } catch {
              texto = undefined;
            }
          } else if (v && typeof v === 'object') recorrer(v, r);
          if (texto !== undefined) hojas.push({ ruta: r, texto: texto.replace(/\{\w+\}/g, '') });
        }
      };
      recorrer(dic, '');
      return hojas;
    }

    /** Lista blanca explícita: solo las claves de Git de los diccionarios (`git.*`, `*.git.*`, `git*`). */
    const RUTA_GIT = /(^|\.)git/i;

    it('ningún diccionario del renderer (es, en, pt y fr) lo usa fuera de Git', () => {
      const fallos: string[] = [];
      for (const [id, d] of Object.entries({ es, en, pt, fr })) {
        for (const h of hojasDe(d)) {
          if (!RUTA_GIT.test(h.ruta) && PROHIBIDA.test(h.texto)) fallos.push(`${id}: ${h.ruta}`);
        }
      }
      expect(fallos).toEqual([]);
    });

    it('ni los textos de main (bandeja y diálogos nativos) en ningún idioma', () => {
      const fallos: string[] = [];
      for (const id of IDIOMAS_UI) {
        for (const h of hojasDe(textosMain(id))) {
          if (PROHIBIDA.test(h.texto)) fallos.push(`${id}: ${h.ruta}`);
        }
      }
      expect(fallos).toEqual([]);
    });

    it('ni los avisos y los textos del Doctor (textosAvisos) en ningún idioma', () => {
      const datos = { servicio: 'X', nueva: 'X', actual: 'X', version: 'X', nombre: 'X' };
      const fallos: string[] = [];
      for (const id of IDIOMAS_UI) {
        for (const codigo of CODIGOS_AVISO_POR_IDIOMA[id]) {
          if (RUTA_GIT.test(codigo)) continue;
          const t = textoAviso(id, { tipo: 'doctor', codigo, datos });
          for (const campo of [t.titulo, t.cuerpo, t.accion ?? '']) {
            if (PROHIBIDA.test(campo)) fallos.push(`${id}: ${codigo}`);
          }
        }
      }
      expect(fallos).toEqual([]);
    });

    it('ni las cadenas fijas del núcleo, de main, shared y preload (errores, Doctor, tooltips)', () => {
      const RAIZ_SRC = join(__dirname, '../src');
      const RAIZ_NUCLEO = join(__dirname, '../../../packages/core/src');
      /** Lista blanca de archivos que hablan de Git (ramas del repositorio del usuario). */
      const ARCHIVOS_GIT = new Set(['git/git.ts', 'git/tipos.ts']);
      /** Líneas de Git en otros archivos: se justifica cada una aquí, con la palabra de Git. */
      const LINEAS_GIT = [/\bgit (?:fetch|pull)\b/i, /repositorio del proyecto/i];

      const recorrerTs = (dir: string): string[] =>
        readdirSync(dir).flatMap((n) => {
          const p = join(dir, n);
          if (statSync(p).isDirectory()) return n === 'i18n' ? [] : recorrerTs(p);
          return /\.(ts|vue)$/.test(n) ? [p] : [];
        });
      /** Literales de cadena; los comentarios se saltan sin romper un "/*" dentro de una cadena. */
      const literales = (c: string): string[] =>
        [
          ...c.matchAll(
            /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g,
          ),
        ].map((m) => m[1] ?? m[2] ?? m[3] ?? '');

      const fallos: string[] = [];
      for (const [raiz, base] of [
        [RAIZ_NUCLEO, ''],
        [RAIZ_SRC, ''],
      ] as const) {
        for (const f of recorrerTs(raiz)) {
          const rel = relative(raiz, f).replaceAll('\\', '/');
          if (base === '' && ARCHIVOS_GIT.has(rel)) continue;
          const fuente = readFileSync(f, 'utf8');
          // De una plantilla solo cuentan los scripts: sus textos fijos ya los vigila otra prueba.
          const codigo = f.endsWith('.vue')
            ? [...fuente.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
                .map((m) => m[1] ?? '')
                .join('\n')
            : fuente;
          for (const l of literales(codigo)) {
            const texto = l.replace(/\$\{[^}]*\}/g, '').replace(/\{\w+\}/g, '');
            if (!/\s/.test(texto) || !PROHIBIDA.test(texto)) continue;
            if (LINEAS_GIT.some((re) => re.test(texto))) continue;
            fallos.push(`${rel}: ${texto.slice(0, 80)}`);
          }
        }
      }
      expect(fallos).toEqual([]);
    });
  });

  it('ninguna plantilla .vue tiene texto fijo fuera de i18n', () => {
    const fallos: string[] = [];
    for (const f of archivos(RAIZ, /\.vue$/)) {
      for (const t of textosVisibles(plantillaDe(readFileSync(f, 'utf8')))) {
        const palabras = t.match(/[\p{L}]{2,}/gu) ?? [];
        if (palabras.some((p) => !PERMITIDAS.has(p)) && ESPANOL.test(t)) {
          fallos.push(`${relative(RAIZ, f)}: ${t}`);
        }
      }
    }
    expect(fallos).toEqual([]);
  });

  it('ningún script del renderer (.vue o .ts) tiene literales en español fuera de i18n', () => {
    const fallos: string[] = [];
    for (const f of archivos(RAIZ, /\.(vue|ts)$/)) {
      const fuente = readFileSync(f, 'utf8');
      const codigo = f.endsWith('.vue')
        ? [...fuente.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
        : fuente;
      for (const t of literalesEnEspanol(codigo)) fallos.push(`${relative(RAIZ, f)}: ${t}`);
    }
    expect(fallos).toEqual([]);
  });

  it('cada CodigoError tiene texto en los cuatro idiomas, con los mismos parámetros', () => {
    const codigos = [...CODIGOS_ERROR].sort();
    for (const d of [es, en, pt, fr])
      expect(Object.keys(d.errores.codigos).sort()).toEqual(codigos);
    for (const c of CODIGOS_ERROR) {
      const e = es.errores.codigos[c];
      expect(e, c).not.toBe('');
      for (const [id, d] of Object.entries(OTROS)) {
        const i = d.errores.codigos[c];
        expect(i, `${id}:${c}`).not.toBe('');
        expect(marcas(i), `${id}:${c}`).toEqual(marcas(e));
      }
    }
  });
});

describe('perfiles (D26): motivos y avisos en los cuatro idiomas', () => {
  it('cada código que da el núcleo tiene su texto', () => {
    for (const t of [es, en, pt, fr]) {
      for (const m of MOTIVOS_PERFIL) expect(t.perfiles.motivos[m], m).toBeTruthy();
      for (const a of AVISOS_PERFIL) expect(t.perfiles.avisos[a], a).toBeTruthy();
      for (const q of ['ia', 'smtp', 'puerto', 'carpeta_vigilada'] as const) {
        expect(t.perfiles.quitado[q], q).toBeTruthy();
      }
    }
  });

  it('limpieza de disco: el navegador abierto avisa del segundo plano y del inicio rápido de Edge, y TEMP no seguro tiene texto', () => {
    for (const t of [es, en, pt, fr]) {
      const b = t.limpiezaDisco.bloqueos;
      expect(b['navegador-abierto']).toMatch(/Edge/);
      expect(b['navegador-abierto']).toMatch(/segundo plano|background|arrière-plan/i);
      expect(b['temp-no-seguro']).toMatch(/TEMP/);
      expect(t.limpiezaDisco.registroFallido.length).toBeGreaterThan(20);
    }
  });
});

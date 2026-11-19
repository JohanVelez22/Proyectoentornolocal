import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';

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

describe('i18n', () => {
  it('es y en tienen exactamente las mismas claves, tipos y aridad de funciones', () => {
    expect(forma(en)).toEqual(forma(es));
  });

  it('en no tiene textos en español (tildes, ¿ o ¡)', () => {
    const hojas: string[] = [];
    const recorrer = (o: unknown): void => {
      for (const v of Object.values(o as Record<string, unknown>)) {
        if (typeof v === 'string') hojas.push(v);
        else if (v && typeof v === 'object') recorrer(v);
      }
    };
    recorrer(en);
    expect(hojas.filter((h) => /[áéíóúñ¿¡]/.test(h))).toEqual([]);
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
});

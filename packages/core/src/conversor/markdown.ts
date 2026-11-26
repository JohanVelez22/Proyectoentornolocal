import MarkdownIt from 'markdown-it';

/**
 * Markdown y HTML sin confianza (D34).
 *
 * `markdown-it` va con `html: false` (el HTML crudo del Markdown se escapa) y su validador de
 * enlaces por omisión (rechaza `javascript:`, `vbscript:`, `file:` y `data:` salvo imágenes
 * PNG/JPEG/GIF/WebP). Aun así, todo HTML que sale de aquí (de Markdown, de Word o de un `.html`
 * que se imprime a PDF) pasa por `sanitizarHtml`: lista blanca de etiquetas y atributos, sin
 * `<script>`, `<style>`, manejadores `on*` ni esquemas peligrosos. Es defensa en profundidad: la
 * salida se abre luego en un navegador o en un visor, fuera de esta aplicación.
 */

const ETIQUETAS = new Set([
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'ins',
  'sub',
  'sup',
  'code',
  'pre',
  'blockquote',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'span',
  'div',
  'dl',
  'dt',
  'dd',
]);

/** Etiquetas vacías: no llevan cierre. */
const VACIAS = new Set(['br', 'hr', 'img']);

/** Etiquetas cuyo CONTENIDO también se descarta. */
const CON_CONTENIDO_PELIGROSO = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
];

const ATRIBUTOS: Record<string, readonly string[]> = {
  a: ['href', 'title'],
  img: ['src', 'alt', 'title'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
};

const NOMBRES: Record<string, string> = {
  colon: ':',
  tab: '\t',
  newline: '\n',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodificar(v: string): string {
  return v.replace(
    /&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));?/gi,
    (m, hex: string, dec: string, nom: string) => {
      if (hex || dec) {
        const n = hex ? parseInt(hex, 16) : parseInt(dec, 10);
        return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
      }
      return NOMBRES[nom.toLowerCase()] ?? m;
    },
  );
}

const escaparTexto = (s: string): string => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escaparAtributo = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Controles, espacios y caracteres invisibles que los navegadores ignoran dentro de un esquema.
// eslint-disable-next-line no-control-regex
const INVISIBLES = new RegExp('[\u0000-\u0020\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]', 'g');

/** Un enlace o una imagen solo puede ir a http(s), mailto, un ancla, una ruta relativa o una imagen `data:`. */
export function urlSegura(valor: string, imagen: boolean): boolean {
  const limpia = decodificar(valor).replace(INVISIBLES, '');
  const esquema = /^([a-z][a-z0-9+.-]*):/i.exec(limpia);
  if (!esquema) return true;
  const e = esquema[1]!.toLowerCase();
  if (e === 'http' || e === 'https') return true;
  if (e === 'mailto') return !imagen;
  if (e === 'data') return imagen && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(limpia);
  return false;
}

const RE_ETIQUETA =
  /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;
const RE_ATRIBUTO = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function atributos(etiqueta: string, crudos: string): string {
  const permitidos = ATRIBUTOS[etiqueta] ?? [];
  let salida = '';
  for (const m of crudos.matchAll(RE_ATRIBUTO)) {
    const nombre = m[1]!.toLowerCase();
    const valor = decodificar(m[2] ?? m[3] ?? m[4] ?? '');
    const ok =
      nombre === 'id'
        ? /^[\w:.-]{1,100}$/.test(valor)
        : permitidos.includes(nombre) &&
          (nombre === 'href' || nombre === 'src'
            ? urlSegura(valor, nombre === 'src')
            : nombre === 'colspan' || nombre === 'rowspan'
              ? /^\d{1,4}$/.test(valor)
              : true);
    if (ok) salida += ` ${nombre}="${escaparAtributo(valor)}"`;
  }
  return salida;
}

/** Deja solo etiquetas y atributos de la lista blanca; lo demás se descarta o se escapa. */
export function sanitizarHtml(html: string): string {
  let h = html.replace(/\0/g, '');
  h = h.replace(/<!--[\s\S]*?(?:-->|$)/g, '');
  for (const t of CON_CONTENIDO_PELIGROSO) {
    h = h.replace(new RegExp(`<${t}\\b[\\s\\S]*?(?:<\\/${t}\\s*>|$)`, 'gi'), '');
  }
  // Declaraciones y instrucciones de procesamiento (`<!DOCTYPE …>`, `<?xml …?>`).
  h = h.replace(/<[!?][^>]*>?/g, '');

  let salida = '';
  let desde = 0;
  for (const m of h.matchAll(RE_ETIQUETA)) {
    salida += escaparTexto(h.slice(desde, m.index));
    desde = m.index + m[0].length;
    const cierre = m[1] === '/';
    const nombre = m[2]!.toLowerCase();
    if (!ETIQUETAS.has(nombre)) continue;
    if (cierre) {
      if (!VACIAS.has(nombre)) salida += `</${nombre}>`;
    } else {
      salida += `<${nombre}${atributos(nombre, m[3] ?? '')}${VACIAS.has(nombre) ? ' /' : ''}>`;
    }
  }
  return salida + escaparTexto(h.slice(desde));
}

/**
 * Documento HTML completo con una política de contenido restrictiva: sin scripts ni estilos
 * remotos. Las imágenes remotas solo se permiten en el HTML que se entrega al usuario; al
 * imprimir a PDF no hay red.
 */
export function plantillaHtml(cuerpo: string, o: { imagenesRemotas: boolean }): string {
  const img = o.imagenesRemotas ? 'data: http: https:' : 'data:';
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${img}; style-src 'unsafe-inline'">`,
    '<style>body{font-family:system-ui,sans-serif;line-height:1.5;max-width:46em;margin:2em auto;padding:0 1em}table{border-collapse:collapse}td,th{border:1px solid #888;padding:.25em .5em}pre{overflow:auto;background:#f4f4f4;padding:.5em}</style>',
    '</head>',
    '<body>',
    cuerpo,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

/** Markdown → cuerpo HTML ya saneado. */
export function markdownAHtml(texto: string): string {
  return sanitizarHtml(md.render(texto));
}

import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
  type LanguageSupport,
} from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState, type Extension } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { COLORES_EDITOR } from './coloresEditor';

/**
 * Editor de código (D43): CodeMirror 6, empaquetado (sin CDN) y con los lenguajes en trozos aparte
 * que se cargan al abrir un archivo de ese tipo. Los estilos los inyecta CodeMirror con
 * `style-src 'unsafe-inline'`, que la CSP de la ventana ya permite; no usa `eval` ni `Function`.
 */

/** Tema de CodeMirror a partir de los colores (fondo, texto, margen y resaltado de sintaxis). */
export function temaEditor(oscuro: boolean): Extension {
  const c = COLORES_EDITOR[oscuro ? 'oscuro' : 'claro'];
  const vista = EditorView.theme(
    {
      '&': { color: c.texto, backgroundColor: c.fondo, height: '100%' },
      '.cm-scroller': { fontFamily: 'var(--fuente-mono)', fontSize: '13px', lineHeight: '1.55' },
      '.cm-content': { caretColor: c.texto },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: c.texto },
      '&.cm-focused': { outline: '2px solid var(--acento)', outlineOffset: '-2px' },
      '.cm-gutters': {
        backgroundColor: c.margen,
        color: c.numeros,
        border: 'none',
        borderRight: '1px solid rgba(128, 128, 128, 0.2)',
      },
      '.cm-activeLine': { backgroundColor: c.activa },
      '.cm-activeLineGutter': { backgroundColor: c.activa, color: c.texto },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection':
        { backgroundColor: 'rgba(var(--acento-rgb), 0.28)' },
      '.cm-selectionMatch': { backgroundColor: 'rgba(var(--acento-rgb), 0.18)' },
      '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
        backgroundColor: 'rgba(var(--acento-rgb), 0.25)',
        outline: '1px solid rgba(var(--acento-rgb), 0.6)',
      },
      '.cm-foldPlaceholder': {
        backgroundColor: c.activa,
        color: c.numeros,
        border: '1px solid rgba(128, 128, 128, 0.3)',
      },
      '.cm-panels': { backgroundColor: c.margen, color: c.texto },
      '.cm-panels.cm-panels-bottom': { borderTop: '1px solid rgba(128, 128, 128, 0.25)' },
      '.cm-panel.cm-search input, .cm-panel.cm-search button, .cm-panel.cm-search label': {
        fontSize: '12.5px',
      },
      '.cm-panel.cm-search input': {
        color: c.texto,
        backgroundColor: c.fondo,
        border: '1px solid rgba(128, 128, 128, 0.45)',
        borderRadius: '4px',
      },
      '.cm-panel.cm-search button': {
        color: c.texto,
        backgroundColor: c.activa,
        backgroundImage: 'none',
        border: '1px solid rgba(128, 128, 128, 0.45)',
        borderRadius: '4px',
      },
      '.cm-searchMatch': { backgroundColor: 'rgba(var(--acento-rgb), 0.22)' },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: 'rgba(var(--acento-rgb), 0.4)',
      },
    },
    { dark: oscuro },
  );
  const sintaxis = HighlightStyle.define([
    {
      tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
      color: c.comentario,
      fontStyle: 'italic',
    },
    {
      tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword],
      color: c.palabra,
    },
    { tag: [t.string, t.special(t.string), t.regexp, t.character], color: c.cadena },
    { tag: [t.number, t.bool, t.null, t.atom, t.literal], color: c.numero },
    {
      tag: [
        t.function(t.variableName),
        t.function(t.propertyName),
        t.className,
        t.typeName,
        t.definition(t.variableName),
      ],
      color: c.funcion,
    },
    { tag: [t.tagName, t.angleBracket, t.heading, t.invalid], color: c.etiqueta },
    { tag: [t.attributeName, t.propertyName, t.labelName, t.namespace], color: c.atributo },
    { tag: [t.link, t.url], color: c.enlace, textDecoration: 'underline' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
  ]);
  return [vista, syntaxHighlighting(sintaxis)];
}

/** Lenguaje por extensión; los paquetes se cargan al pedirlos (un trozo aparte por lenguaje). */
const LENGUAJES: Record<string, () => Promise<LanguageSupport>> = {
  js: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  mjs: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  cjs: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  jsx: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  ts: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  mts: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  tsx: () =>
    import('@codemirror/lang-javascript').then((m) =>
      m.javascript({ typescript: true, jsx: true }),
    ),
  json: () => import('@codemirror/lang-json').then((m) => m.json()),
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  htm: () => import('@codemirror/lang-html').then((m) => m.html()),
  vue: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  php: () => import('@codemirror/lang-php').then((m) => m.php()),
  py: () => import('@codemirror/lang-python').then((m) => m.python()),
  md: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  yml: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
  yaml: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
};

/** Extensión del archivo, sin punto y en minúsculas ('' si no tiene). */
export function extensionDe(nombre: string): string {
  const i = nombre.lastIndexOf('.');
  return i > 0 ? nombre.slice(i + 1).toLowerCase() : '';
}

/** Soporte del lenguaje del archivo, o null si no hay (se edita como texto plano). */
export async function lenguajeDe(nombre: string): Promise<LanguageSupport | null> {
  const carga = LENGUAJES[extensionDe(nombre)];
  if (!carga) return null;
  try {
    return await carga();
  } catch {
    return null;
  }
}

export interface OpcionesBase {
  /** Etiqueta accesible del área de texto. */
  etiqueta: string;
  /** Frases de la interfaz de CodeMirror (búsqueda, plegado…) en el idioma activo. */
  frases: Record<string, string>;
  alCambiar: () => void;
  alMoverCursor: (linea: number, columna: number) => void;
  alGuardar: () => void;
}

/** Extensiones comunes del editor: números de línea, historial, búsqueda, plegado y atajos. */
export function extensionesBase(o: OpcionesBase): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    history(),
    foldGutter(),
    drawSelection(),
    indentOnInput(),
    bracketMatching(),
    highlightSelectionMatches(),
    EditorState.phrases.of(o.frases),
    EditorView.contentAttributes.of({ 'aria-label': o.etiqueta }),
    keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          o.alGuardar();
          return true;
        },
      },
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      ...foldKeymap,
      indentWithTab,
    ]),
    EditorView.updateListener.of((u) => {
      if (u.docChanged) o.alCambiar();
      if (u.selectionSet || u.docChanged) {
        const pos = u.state.selection.main.head;
        const linea = u.state.doc.lineAt(pos);
        o.alMoverCursor(linea.number, pos - linea.from + 1);
      }
    }),
  ];
}

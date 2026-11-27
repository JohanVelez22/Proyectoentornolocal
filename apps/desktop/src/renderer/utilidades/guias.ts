/**
 * Guías integradas (D42): guía de túneles y guía HTTP. El contenido vive en `docs/contenido/` y se
 * empaqueta con la app por importación estática: no hay red ni lectura de archivos en ejecución.
 */
import type { IdiomaUi } from '@pel/core';
import gitJson from '../../../../../docs/contenido/git.json';
import httpJson from '../../../../../docs/contenido/http.json';
import tunelesEn from '../../../../../docs/contenido/guia-tuneles.en.md?raw';
import tunelesEs from '../../../../../docs/contenido/guia-tuneles.md?raw';
import tunelesFr from '../../../../../docs/contenido/guia-tuneles.fr.md?raw';
import tunelesPt from '../../../../../docs/contenido/guia-tuneles.pt.md?raw';

export interface TextoCodigo {
  resumen: string;
  explicacion: string;
  causasComunes: string[];
  comoSolucionar: string[];
  ejemplo: string;
}

export interface TextoMetodo {
  resumen: string;
  explicacion: string;
  ejemplo: string;
}

type PorIdioma<T> = Partial<Record<IdiomaUi, T>> & { en: T };

export interface Codigo extends PorIdioma<TextoCodigo> {
  codigo: number;
  nombre: string;
  familia: Familia;
  /** `false` en los códigos que no forman parte del estándar (419 de Laravel, 418 de broma). */
  estandar?: boolean;
  broma?: boolean;
}

export interface Metodo extends PorIdioma<TextoMetodo> {
  nombre: string;
  seguro: boolean;
  idempotente: boolean;
}

export type Familia = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
export const FAMILIAS: readonly Familia[] = ['1xx', '2xx', '3xx', '4xx', '5xx'];

export const contenidoHttp = httpJson as unknown as { metodos: Metodo[]; codigos: Codigo[] };

export interface TextoTema {
  resumen: string;
  explicacion: string;
  ejemplo: string;
  titulo: string;
  erroresComunes: string[];
}

export type GrupoGit = 'basico' | 'ramas' | 'deshacer' | 'remotos' | 'github';
export const GRUPOS_GIT: readonly GrupoGit[] = ['basico', 'ramas', 'deshacer', 'remotos', 'github'];

export interface TemaGit extends PorIdioma<TextoTema> {
  id: string;
  grupo: GrupoGit;
  /** Comando o concepto, igual en todos los idiomas. */
  nombre: string;
  peligroso: boolean;
}

export const contenidoGit = gitJson as unknown as { temas: TemaGit[] };

const TUNELES: Record<IdiomaUi, string> = {
  es: tunelesEs,
  en: tunelesEn,
  pt: tunelesPt,
  fr: tunelesFr,
};

/** Markdown de la guía de túneles en el idioma activo. */
export function guiaTuneles(idioma: IdiomaUi): string {
  return TUNELES[idioma] ?? tunelesEn;
}

export interface ParteGuia {
  tipo: 'texto' | 'codigo';
  texto: string;
}

/**
 * Separa el Markdown en texto y bloques de código. El texto se pinta con el renderizador
 * sanitizado de Markdown; el código se pinta como texto plano con su botón de copiar.
 */
export function partesGuia(md: string): ParteGuia[] {
  const partes: ParteGuia[] = [];
  const fence = /^```[^\n]*\n([\s\S]*?)^```[ \t]*$/gm;
  let ultimo = 0;
  for (const m of md.matchAll(fence)) {
    const ini = m.index ?? 0;
    const previo = md.slice(ultimo, ini);
    if (previo.trim()) partes.push({ tipo: 'texto', texto: previo });
    partes.push({ tipo: 'codigo', texto: (m[1] ?? '').replace(/\n$/, '') });
    ultimo = ini + m[0].length;
  }
  const resto = md.slice(ultimo);
  if (resto.trim()) partes.push({ tipo: 'texto', texto: resto });
  return partes;
}

/** Texto de una entrada en el idioma pedido, o en inglés si no está traducida. */
export function textoEn<T>(e: PorIdioma<T>, idioma: IdiomaUi): { texto: T; traducido: boolean } {
  const t = e[idioma];
  return t !== undefined ? { texto: t, traducido: true } : { texto: e.en, traducido: false };
}

const normalizar = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function filtrarCodigos(
  codigos: readonly Codigo[],
  idioma: IdiomaUi,
  consulta: string,
  familia: Familia | null,
): Codigo[] {
  const q = normalizar(consulta.trim());
  return codigos.filter((c) => {
    if (familia && c.familia !== familia) return false;
    if (!q) return true;
    const t = textoEn(c, idioma).texto;
    const pajar = normalizar(
      [
        String(c.codigo),
        c.nombre,
        t.resumen,
        t.explicacion,
        ...t.causasComunes,
        ...t.comoSolucionar,
      ].join(' '),
    );
    return pajar.includes(q);
  });
}

export function filtrarMetodos(
  metodos: readonly Metodo[],
  idioma: IdiomaUi,
  consulta: string,
): Metodo[] {
  const q = normalizar(consulta.trim());
  if (!q) return [...metodos];
  return metodos.filter((m) => {
    const t = textoEn(m, idioma).texto;
    return normalizar([m.nombre, t.resumen, t.explicacion].join(' ')).includes(q);
  });
}

/** Temas de la guía de Git que coinciden con la búsqueda (nombre, título, resumen, texto y errores) y el grupo. */
export function filtrarTemasGit(
  temas: readonly TemaGit[],
  idioma: IdiomaUi,
  consulta: string,
  grupo: GrupoGit | null,
): TemaGit[] {
  const q = normalizar(consulta.trim());
  return temas.filter((x) => {
    if (grupo && x.grupo !== grupo) return false;
    if (!q) return true;
    const t = textoEn(x, idioma).texto;
    return normalizar(
      [x.nombre, t.titulo, t.resumen, t.explicacion, t.ejemplo, ...t.erroresComunes].join(' '),
    ).includes(q);
  });
}

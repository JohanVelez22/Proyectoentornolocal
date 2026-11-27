/**
 * Idioma de la interfaz. `textos` tiene la forma de `es` (y de `en`), pero cada acceso lee el
 * idioma activo: `textos.nav.inicio` en una plantilla o un `computed` se vuelve a pintar solo al
 * cambiar de idioma, y `const t = textos.proyectos` sigue siendo "vivo" (es otro nodo del mismo
 * proxy, no una copia). Lo único que no se actualiza es un texto ya copiado a una variable; por
 * eso las vistas se vuelven a montar al cambiar de idioma (ver Marco.vue).
 */
import { IDIOMAS_UI, type IdiomaUi } from '@pel/core';
import { computed, ref } from 'vue';
import { IDIOMAS, esIdiomaBase } from '../../shared/idiomas';
import { de } from './de';
import { en } from './en';
import { es, type Textos, type TextosParciales } from './es';
import { fr } from './fr';
import { hi } from './hi';
import { id } from './id';
import { it } from './it';
import { ja } from './ja';
import { ko } from './ko';
import { nl } from './nl';
import { pl } from './pl';
import { pt } from './pt';
import { ru } from './ru';
import { tr } from './tr';
import { uk } from './uk';
import { zh } from './zh';
import { deExtra } from './extra/de';
import { hiExtra } from './extra/hi';
import { idExtra } from './extra/id';
import { itExtra } from './extra/it';
import { jaExtra } from './extra/ja';
import { koExtra } from './extra/ko';
import { nlExtra } from './extra/nl';
import { plExtra } from './extra/pl';
import { ruExtra } from './extra/ru';
import { trExtra } from './extra/tr';
import { ukExtra } from './extra/uk';
import { zhExtra } from './extra/zh';

export type { Textos, TextosParciales } from './es';

export {
  IDIOMAS,
  IDIOMAS_BASE,
  esIdiomaBase,
  idiomaDeLocale,
  type InfoIdioma,
} from '../../shared/idiomas';
export type Idioma = IdiomaUi;

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Diccionario completo a partir de uno parcial: cada clave que falte en `parcial` sale de `base`
 * (el inglés). Las claves que `base` no conoce se descartan; los arreglos y las funciones se
 * toman enteros, sin mezclar. Devuelve un objeto nuevo (no toca `parcial` ni `base`).
 */
export function completar<T extends object>(base: T, parcial: unknown): T {
  const res: Record<string, unknown> = {};
  const p = esObjeto(parcial) ? parcial : {};
  for (const [k, vBase] of Object.entries(base)) {
    const v = p[k];
    if (esObjeto(vBase)) res[k] = completar(vBase, v);
    else res[k] = v !== undefined && typeof v === typeof vBase ? v : vBase;
  }
  return res as T;
}

/**
 * Fusión profunda de dos diccionarios parciales: lo de `extra` pisa a `base` hoja a hoja (los
 * arreglos y las funciones se toman enteros). Devuelve un objeto nuevo.
 */
export function fusionar(base: unknown, extra: unknown): TextosParciales {
  const b = esObjeto(base) ? base : {};
  const e = esObjeto(extra) ? extra : {};
  const res: Record<string, unknown> = { ...b };
  for (const [k, v] of Object.entries(e)) {
    res[k] = esObjeto(v) && esObjeto(b[k]) ? fusionar(b[k], v) : v;
  }
  return res as TextosParciales;
}

/**
 * Diccionarios tal como se escribieron: es, en, pt y fr completos (el compilador lo exige) y los
 * demás idiomas con `TextosParciales`, que pueden dejar claves sin traducir. Las claves añadidas
 * después de su traducción inicial viven en `extra/<idioma>.ts` y se fusionan encima.
 */
export const fuentes: Record<IdiomaUi, TextosParciales> = {
  es,
  en,
  pt,
  fr,
  de: fusionar(de, deExtra),
  it: fusionar(it, itExtra),
  ru: fusionar(ru, ruExtra),
  zh: fusionar(zh, zhExtra),
  ja: fusionar(ja, jaExtra),
  ko: fusionar(ko, koExtra),
  hi: fusionar(hi, hiExtra),
  tr: fusionar(tr, trExtra),
  id: fusionar(id, idExtra),
  pl: fusionar(pl, plExtra),
  nl: fusionar(nl, nlExtra),
  uk: fusionar(uk, ukExtra),
};

/**
 * Diccionarios listos para usar. Los cuatro idiomas base se usan tal cual; los demás se completan
 * una sola vez al cargar con el inglés, así una clave sin traducir muestra el texto en inglés.
 */
export const diccionarios: Record<IdiomaUi, Textos> = Object.fromEntries(
  IDIOMAS_UI.map((i) => [i, esIdiomaBase(i) ? fuentes[i] : completar(en, fuentes[i])]),
) as Record<IdiomaUi, Textos>;

/** Idioma activo (lo fija la tienda de preferencias). */
export const idioma = ref<Idioma>('es');

/** Locale de `Intl` para fechas y números del idioma activo. */
export const localeIntl = computed(
  () => IDIOMAS.find((i) => i.id === idioma.value)?.localeIntl ?? 'es-AR',
);

export function cambiarIdioma(i: Idioma): void {
  idioma.value = i;
  if (typeof document !== 'undefined') document.documentElement.lang = i;
}

function resolver(ruta: readonly string[]): unknown {
  let v: unknown = diccionarios[idioma.value];
  for (const k of ruta) {
    if (v === null || typeof v !== 'object') return undefined;
    v = (v as Record<string, unknown>)[k];
  }
  return v;
}

const esNodo = (v: unknown): v is object =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const nodos = new Map<string, object>();

function nodo(ruta: readonly string[]): object {
  const clave = ruta.join('\u0000');
  const previo = nodos.get(clave);
  if (previo) return previo;
  const p = new Proxy(
    {},
    {
      get(_t, k) {
        // Vue no debe envolverlo en reactive(): la reactividad la da `idioma`.
        if (k === '__v_skip') return true;
        if (typeof k !== 'string') return undefined;
        const v = resolver([...ruta, k]);
        return esNodo(v) ? nodo([...ruta, k]) : v;
      },
      has(_t, k) {
        const o = resolver(ruta);
        return esNodo(o) && k in o;
      },
      ownKeys() {
        const o = resolver(ruta);
        return esNodo(o) ? Reflect.ownKeys(o) : [];
      },
      getOwnPropertyDescriptor(_t, k) {
        const o = resolver(ruta);
        if (!esNodo(o) || typeof k !== 'string' || !(k in o)) return undefined;
        const v = (o as Record<string, unknown>)[k];
        return {
          value: esNodo(v) ? nodo([...ruta, k]) : v,
          writable: false,
          enumerable: true,
          configurable: true,
        };
      },
      set() {
        return false;
      },
    },
  );
  nodos.set(clave, p);
  return p;
}

/** Textos del idioma activo (ver la nota de arriba). */
export const textos = nodo([]) as Textos;

/** Fecha (y hora, según `opciones`) en el idioma activo; '' si no es una fecha válida. */
export function formatearFecha(
  valor: Date | string | number,
  opciones: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(localeIntl.value, opciones);
}

/** Número en el idioma activo (separador de miles y decimales). */
export function formatearNumero(n: number, opciones?: Intl.NumberFormatOptions): string {
  return n.toLocaleString(localeIntl.value, opciones);
}

/**
 * Idioma de la interfaz. `textos` tiene la forma de `es` (y de `en`), pero cada acceso lee el
 * idioma activo: `textos.nav.inicio` en una plantilla o un `computed` se vuelve a pintar solo al
 * cambiar de idioma, y `const t = textos.proyectos` sigue siendo "vivo" (es otro nodo del mismo
 * proxy, no una copia). Lo único que no se actualiza es un texto ya copiado a una variable; por
 * eso las vistas se vuelven a montar al cambiar de idioma (ver Marco.vue).
 */
import type { IdiomaUi } from '@pel/core';
import { computed, ref } from 'vue';
import { IDIOMAS } from '../../shared/idiomas';
import { en } from './en';
import { es, type Textos } from './es';
import { fr } from './fr';
import { pt } from './pt';

import { de } from './de';

import { it } from './it';

import { ru } from './ru';

import { zh } from './zh';

import { ja } from './ja';

import { ko } from './ko';

import { hi } from './hi';

import { tr } from './tr';

import { id } from './id';

export type { Textos } from './es';

export { IDIOMAS, idiomaDeLocale, type InfoIdioma } from '../../shared/idiomas';
export type Idioma = IdiomaUi;

export const diccionarios: Record<IdiomaUi, Textos> = { es, en, pt, fr, de, it, ru, zh, ja, ko, hi, tr, id };

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

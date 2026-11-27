import { IDIOMAS_UI, type IdiomaUi } from '@pel/core';

/** Un idioma de la interfaz: de este registro salen el selector, `localeIntl` y la detección. */
export interface InfoIdioma {
  id: IdiomaUi;
  /** Nombre del idioma escrito en ese mismo idioma (es igual en todos los diccionarios). */
  nombreNativo: string;
  /** Locale de `Intl` para fechas y números. */
  localeIntl: string;
}

/**
 * Registro de idiomas. Para sumar uno: agregar su id a `IDIOMAS_UI` (núcleo), una entrada aquí,
 * su diccionario en `renderer/i18n/<id>.ts` y su entrada en `main/textos.ts` y
 * `shared/textosAvisos.ts`; el compilador y `i18n.test.ts` señalan lo que falte.
 */
export const IDIOMAS: readonly InfoIdioma[] = [
  { id: 'es', nombreNativo: 'Español', localeIntl: 'es-AR' },
  { id: 'en', nombreNativo: 'English', localeIntl: 'en-US' },
  { id: 'pt', nombreNativo: 'Português', localeIntl: 'pt-BR' },
  { id: 'fr', nombreNativo: 'Français', localeIntl: 'fr-FR' },
  { id: 'de', nombreNativo: 'Deutsch', localeIntl: 'de-DE' },
  { id: 'it', nombreNativo: 'Italiano', localeIntl: 'it-IT' },
  { id: 'ru', nombreNativo: 'Русский', localeIntl: 'ru-RU' },
  { id: 'zh', nombreNativo: '中文 简体', localeIntl: 'zh-CN' },
  { id: 'ja', nombreNativo: '日本語', localeIntl: 'ja-JP' },
  { id: 'ko', nombreNativo: '한국어', localeIntl: 'ko-KR' },
  { id: 'hi', nombreNativo: 'हिन्दी', localeIntl: 'hi-IN' },
  { id: 'tr', nombreNativo: 'Türkçe', localeIntl: 'tr-TR' },
  { id: 'id', nombreNativo: 'Bahasa Indonesia', localeIntl: 'id-ID' },
  { id: 'pl', nombreNativo: 'Polski', localeIntl: 'pl-PL' },
] satisfies readonly InfoIdioma[];

/** Idioma de la interfaz para el locale del sistema (`pt-PT` → pt, `fr-CA` → fr…); si no, español. */
export function idiomaDeLocale(locale: string): IdiomaUi {
  const base = locale.trim().split(/[-_]/)[0]?.toLowerCase() ?? '';
  return (IDIOMAS_UI as readonly string[]).includes(base) ? (base as IdiomaUi) : 'es';
}

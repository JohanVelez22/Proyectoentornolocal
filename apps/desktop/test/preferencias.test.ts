import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cambiarIdioma, idioma, localeIntl, textos } from '../src/renderer/i18n';
import { idiomaDeLocale } from '../src/shared/idiomas';
import { esOscuro, usePreferencias } from '../src/renderer/stores/preferencias';
import { acentoDe, mezclar, primarioDe, temaDe } from '../src/renderer/tema';

type Prefs = {
  tema: 'sistema' | 'claro' | 'oscuro';
  idioma: 'es' | 'en' | 'pt' | 'fr' | null;
  acento: string | null;
  asistenteVisto: boolean;
};

function apiFalsa(inicial: Prefs) {
  let guardadas = { ...inicial };
  const api = {
    preferencias: {
      leer: vi.fn(async () => ({ ...guardadas })),
      guardar: vi.fn(async (c: Partial<Prefs>) => {
        guardadas = { ...guardadas, ...c };
        return { ...guardadas };
      }),
    },
  };
  vi.stubGlobal('window', { entorno: api });
  return api;
}

beforeEach(() => {
  setActivePinia(createPinia());
  cambiarIdioma('es');
});
afterEach(() => {
  vi.unstubAllGlobals();
  cambiarIdioma('es');
});

describe('textos del idioma activo', () => {
  it('cambian en caliente, también por un nodo guardado en una constante', () => {
    const nav = textos.nav;
    expect(nav.inicio).toBe('Inicio');
    cambiarIdioma('en');
    expect(nav.inicio).toBe('Home');
    expect(textos.acciones.guardar).toBe('Save');
    expect(Object.keys(textos.preferencias.temas)).toEqual(['sistema', 'claro', 'oscuro']);
    expect(textos.paleta.irA('Settings')).toBe('Go to Settings');
  });
});

describe('preferencias', () => {
  it('esOscuro: sistema sigue al sistema; claro y oscuro son fijos', () => {
    expect(esOscuro('sistema', true)).toBe(true);
    expect(esOscuro('sistema', false)).toBe(false);
    expect(esOscuro('claro', true)).toBe(false);
    expect(esOscuro('oscuro', false)).toBe(true);
  });

  it('cargar aplica tema, acento e idioma', async () => {
    apiFalsa({ tema: 'oscuro', idioma: 'en', acento: '#16a34a', asistenteVisto: false });
    const p = usePreferencias();
    await p.cargar();
    expect(p.tema).toBe('oscuro');
    expect(p.acento).toBe('#16a34a');
    expect(p.asistenteVisto).toBe(false);
    expect(idioma.value).toBe('en');
    expect(p.cargado).toBe(true);
  });

  it('guardar aplica al instante y guarda solo lo cambiado', async () => {
    const api = apiFalsa({ tema: 'sistema', idioma: 'es', acento: null, asistenteVisto: true });
    const p = usePreferencias();
    await p.cargar();
    const promesa = p.cambiarIdioma('en');
    expect(idioma.value).toBe('en'); // antes de que responda el proceso principal
    await promesa;
    expect(api.preferencias.guardar).toHaveBeenCalledWith({ idioma: 'en' });
    await p.cambiarTema('claro');
    expect(p.tema).toBe('claro');
  });

  it('si guardar falla vuelve al valor anterior y propaga el error', async () => {
    const api = apiFalsa({ tema: 'claro', idioma: 'es', acento: null, asistenteVisto: true });
    const p = usePreferencias();
    await p.cargar();
    api.preferencias.guardar.mockRejectedValueOnce(new Error('disco lleno'));
    await expect(p.cambiarTema('oscuro')).rejects.toThrow('disco lleno');
    expect(p.tema).toBe('claro');
    api.preferencias.guardar.mockRejectedValueOnce(new Error('x'));
    await expect(p.cambiarIdioma('en')).rejects.toThrow();
    expect(idioma.value).toBe('es');
  });
});

describe('tema y acento', () => {
  it('el acento por defecto es el índigo de siempre en ambos modos', () => {
    expect(primarioDe(null, false)).toBe('#4f5bd5');
    expect(primarioDe(null, true)).toBe('#8b93ff');
    expect(temaDe(false, null).common?.primaryColor).toBe('#4f5bd5');
  });
  it('un acento de la tabla usa su variante oscura; uno propio se aclara', () => {
    expect(acentoDe('#16A34A')?.id).toBe('verde');
    expect(primarioDe('#16a34a', true)).toBe('#4ade80');
    expect(primarioDe('#000000', false)).toBe('#000000');
    expect(primarioDe('#000000', true)).toBe(mezclar('#000000', 0.35));
    expect(mezclar('#000000', 1)).toBe('#ffffff');
    expect(mezclar('#ffffff', -1)).toBe('#000000');
  });
});

describe('idiomaDeLocale', () => {
  it('pt-* es portugués, fr-* francés, en-* inglés y es-* español', () => {
    expect(idiomaDeLocale('pt-PT')).toBe('pt');
    expect(idiomaDeLocale('pt-BR')).toBe('pt');
    expect(idiomaDeLocale('fr-CA')).toBe('fr');
    expect(idiomaDeLocale('fr')).toBe('fr');
    expect(idiomaDeLocale('en-GB')).toBe('en');
    expect(idiomaDeLocale('EN_us')).toBe('en');
    expect(idiomaDeLocale('es-419')).toBe('es');
    expect(idiomaDeLocale('ES_ar')).toBe('es');
  });
  it('cualquier otro locale cae al español', () => {
    expect(idiomaDeLocale('de-DE')).toBe('es');
    expect(idiomaDeLocale('estonian')).toBe('es');
    expect(idiomaDeLocale('')).toBe('es');
  });
});

describe('localeIntl por idioma', () => {
  it('sale del registro IDIOMAS', () => {
    for (const [id, loc] of [
      ['es', 'es-AR'],
      ['en', 'en-US'],
      ['pt', 'pt-BR'],
      ['fr', 'fr-FR'],
    ] as const) {
      cambiarIdioma(id);
      expect(localeIntl.value).toBe(loc);
    }
    cambiarIdioma('es');
  });
});

import { describe, expect, it } from 'vitest';
import { CODIGOS_EVIDENCIA } from '@pel/core';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';
import { textoEvidencia } from '../src/renderer/utilidades/doctor';

/** D38c: lo que el Doctor vio sale del núcleo como código + datos y se traduce en la interfaz. */
const IDIOMAS = { es, en, pt, fr } as const;

describe('evidencia del Doctor en es, en, pt y fr', () => {
  for (const [id, t] of Object.entries(IDIOMAS)) {
    it(`${id}: todos los códigos de evidencia tienen texto y ninguno sobra`, () => {
      const tabla = t.doctor.evidencias as Record<string, string>;
      expect(Object.keys(tabla).sort()).toEqual([...CODIGOS_EVIDENCIA].sort());
      for (const c of CODIGOS_EVIDENCIA) expect(tabla[c], c).toBeTruthy();
    });
  }

  it('cada idioma usa los mismos {parámetros} que el español', () => {
    const marcas = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const ref = es.doctor.evidencias as Record<string, string>;
    for (const t of [en, pt, fr]) {
      const tabla = t.doctor.evidencias as Record<string, string>;
      for (const c of CODIGOS_EVIDENCIA) expect(marcas(tabla[c]!), c).toEqual(marcas(ref[c]!));
    }
  });

  it('rellena los datos y despliega las líneas', () => {
    const e = {
      codigo: 'firewall_reglas',
      datos: { propias: 2, pruebas: 1 },
      lineas: [{ codigo: 'texto', datos: { texto: 'nginx.exe [{A-1}]' } }],
    };
    expect(textoEvidencia(e, en)).toBe(
      'WolfCore Dev: 2 · Leftovers from WolfCore tests: 1\nnginx.exe [{A-1}]',
    );
    expect(textoEvidencia({ codigo: 'ca_vencida', datos: { dias: 3 } }, fr)).toBe(
      'La CA a expiré il y a 3 jours',
    );
  });

  it('un código desconocido no inventa una frase: solo muestra el dato `texto`', () => {
    expect(textoEvidencia({ codigo: 'nuevo', datos: { texto: 'x' } })).toBe('x');
    expect(textoEvidencia({ codigo: 'nuevo', datos: {} })).toBe('');
  });
});

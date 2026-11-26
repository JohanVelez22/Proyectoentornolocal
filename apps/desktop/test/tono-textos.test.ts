import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

/** Todas las cadenas de un diccionario (las funciones se evalúan con argumentos de prueba). */
function hojas(v: unknown, ruta = ''): [string, string][] {
  if (typeof v === 'string') return [[ruta, v]];
  if (typeof v === 'function') {
    try {
      const r = (v as (...a: unknown[]) => unknown)('x', 'x', 'x');
      return typeof r === 'string' ? [[ruta, r]] : hojas(r, ruta);
    } catch {
      return [];
    }
  }
  if (Array.isArray(v)) return v.flatMap((x, i) => hojas(x, `${ruta}[${i}]`));
  if (v && typeof v === 'object') {
    return Object.entries(v).flatMap(([k, x]) => hojas(x, ruta ? `${ruta}.${k}` : k));
  }
  return [];
}

const TUTEO: Record<string, RegExp> = {
  // Solo formas inequívocas del tuteo: «abre» o «crea» también son verbos en tercera persona.
  es: /(?<![\p{L}])(puedes|tienes|quieres|necesitas|tu|tus|contigo|abriste|vuelve a (analizar|abrirlo|verla))(?![\p{L}])/iu,
  fr: /(?<![\p{L}])(tu|toi|ton|ta|tes|te|t’|t')(?![\p{L}])/iu,
  pt: /(?<![\p{L}])(tu|teu|tua|teus|tuas|contigo)(?![\p{L}])/iu,
};

describe('Tono de los textos: usted en español, «vous» en francés, «você» en portugués (D38b)', () => {
  for (const [id, re] of Object.entries(TUTEO)) {
    it(`${id}: ningún texto de la interfaz tutea`, () => {
      const malos = hojas(diccionarios[id as keyof typeof diccionarios])
        .filter(([, t]) => re.test(t))
        .map(([r, t]) => `${r}: ${t.slice(0, 80)}`);
      expect(malos).toEqual([]);
    });
  }
});

describe('Etiquetas cortas del Doctor (D38b)', () => {
  it('el nombre de cada revisión es una etiqueta, no un párrafo (firewall tenía el texto de su reparación)', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      for (const [k, v] of Object.entries(d.doctor.revisiones)) {
        expect((v as string).length, `${id}/${k}`).toBeLessThanOrEqual(40);
      }
    }
  });
});

describe('Nombre de servicios externos (D38b)', () => {
  it('el sufijo «(externo)» del núcleo sale en el idioma de la interfaz', async () => {
    const { nombreServicio } = await import('../src/renderer/utilidades/nombreServicio');
    const sufijo = /^MySQL \((\S+)\)$/.exec(nombreServicio('MySQL (externo)'))?.[1];
    expect(sufijo).toBeTruthy();
    expect(nombreServicio('Nginx')).toBe('Nginx');
  });
});

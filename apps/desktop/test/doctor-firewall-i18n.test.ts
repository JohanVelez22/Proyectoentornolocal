import { describe, expect, it } from 'vitest';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';

/** D46: textos del Doctor para quitar y restaurar reglas del cortafuegos, en los cuatro idiomas. */
const IDIOMAS = { es, en, pt, fr } as const;
const CODIGOS = [
  'doctor.firewall_quitadas',
  'doctor.firewall_parcial',
  'doctor.firewall_sin_cambios',
  'doctor.firewall_registro_fallido',
] as const;

describe('Doctor: cortafuegos (D46) en es, en, pt y fr', () => {
  for (const [id, t] of Object.entries(IDIOMAS)) {
    it(`${id}: textos de avisos, reparaciones y diálogo`, () => {
      const errores = t.errores.codigos as Record<string, string>;
      for (const c of CODIGOS) expect(errores[c], c).toBeTruthy();
      expect(errores['doctor.firewall_quitadas']).toContain('{cantidad}');
      const d = t.doctor;
      const rep = d.reparaciones as Record<string, string>;
      expect(rep.firewall).toContain('cortafuegos-quitadas.json');
      expect(rep.firewall_restaurar).toContain('cortafuegos-quitadas.json');
      expect(d.dialogo.reglas).toBeTruthy();
      expect(d.dialogo.reglasNota).toBeTruthy();
    });
  }

  it('el francés trata de «vous», no de «tu»', () => {
    const f = fr.doctor;
    const textos = [
      f.dialogo.reglasNota,
      (f.reparaciones as Record<string, string>).firewall_restaurar,
      (fr.errores.codigos as Record<string, string>)['doctor.firewall_quitadas'],
      (fr.errores.codigos as Record<string, string>)['doctor.firewall_parcial'],
    ].join(' ');
    expect(textos).toMatch(/\bvotre\b|\bvous\b|\bVérifiez\b/);
    expect(textos).not.toMatch(/\b(tu|ton|ta|tes|toi)\b/i);
  });
});

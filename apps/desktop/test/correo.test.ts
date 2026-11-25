import { IDS_CAPTADOR } from '@pel/core';
import { describe, expect, it } from 'vitest';
import { idCaptador } from '../src/main/validacion';
import { diccionarios, IDIOMAS } from '../src/renderer/i18n';
import { categoriaDe, CAPTADORES_CORREO } from '../src/renderer/stores/servicios';
import { bloqueEnvCorreo } from '../src/renderer/utilidades/correo';

describe('Correo A: captadores locales (D21)', () => {
  it('la interfaz agrupa en Correo exactamente los captadores del núcleo', () => {
    expect([...CAPTADORES_CORREO].sort()).toEqual([...IDS_CAPTADOR].sort());
    for (const id of IDS_CAPTADOR) {
      expect(categoriaDe({ id, categoria: 'herramienta' })).toBe('correo');
    }
    expect(categoriaDe({ id: 'ollama', categoria: 'ia' })).toBe('ia');
  });

  it('el canal correo.elegir solo acepta ids de captadores', () => {
    for (const id of IDS_CAPTADOR) expect(idCaptador(id)).toBe(id);
    for (const malo of ['mailhog', 'maildev', 'mysql', '', 'mailpit ', null, undefined, 3, {}]) {
      expect(() => idCaptador(malo), String(malo)).toThrow();
    }
  });

  it('el bloque .env apunta al puerto SMTP que se le pasa y nunca trae una clave', () => {
    const b = bloqueEnvCorreo(2599);
    expect(b).toContain('MAIL_HOST=127.0.0.1');
    expect(b).toContain('MAIL_PORT=2599');
    expect(b).toContain('MAIL_PASSWORD=null');
  });

  it('los textos de los captadores existen en los cuatro idiomas y nombran al captador', () => {
    for (const { id: idioma } of IDIOMAS) {
      const t = diccionarios[idioma].correo;
      expect(t.envAyuda('smtp4dev'), idioma).toContain('smtp4dev');
      for (const k of ['opcional', 'noInstalado', 'instalar', 'usar', 'apagar']) {
        expect((t.captador as Record<string, string>)[k], `${idioma}.${k}`).toBeTruthy();
      }
      expect(t.notaDescartados, idioma).toMatch(/MailHog/);
      expect(t.notaDescartados, idioma).toMatch(/MailDev/);
      expect(t.notaHost, idioma).toContain('127.0.0.1');
    }
  });
});

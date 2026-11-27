import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';
import { SECCIONES_NAV } from '../src/renderer/navegacion';
import { PASOS_RECORRIDO } from '../src/renderer/utilidades/recorrido';

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');
const vue = fuente('componentes', 'AsistenteInicio.vue');

describe('Recorrido de bienvenida (D38b)', () => {
  it('tiene entre 5 y 7 pasos y cada zona existe en la barra lateral', () => {
    expect(PASOS_RECORRIDO.length).toBeGreaterThanOrEqual(5);
    expect(PASOS_RECORRIDO.length).toBeLessThanOrEqual(7);
    for (const p of PASOS_RECORRIDO) {
      if (p.zona) expect(SECCIONES_NAV).toContain(p.zona);
    }
  });

  it('cada paso tiene título y texto en los 4 idiomas', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      for (const p of PASOS_RECORRIDO) {
        const x = d.asistenteInicio.pasos[p.id];
        expect(x.titulo.length, `${id}/${p.id}`).toBeGreaterThan(2);
        expect(x.texto.length, `${id}/${p.id}`).toBeGreaterThan(20);
      }
      expect(d.asistenteInicio.paso(2, 7), id).toContain('7');
    }
  });

  it('es un diálogo accesible: foco atrapado, Esc, aria-live y botón Saltar', () => {
    expect(vue).toContain('role="dialog"');
    expect(vue).toContain('aria-modal="true"');
    expect(vue).toContain('aria-live="polite"');
    expect(vue).toContain("'Escape'");
    expect(vue).toContain("'Tab'");
    expect(vue).toContain('t.saltar');
    expect(vue).toContain('t.anterior');
    expect(vue).toContain('t.siguiente');
  });

  it('los botones del pie caben en una sola fila a 960 px: sin salto de línea y «Saltar» corto (D38c)', () => {
    expect(vue).toMatch(/\.botones \{[^}]*flex-wrap: nowrap/);
    expect(vue).toMatch(/\.botones :deep\(\.n-button\) \{[^}]*white-space: nowrap/);
    // «Saltar» es una palabra; el resto del pie conserva su texto completo.
    for (const [id, d] of Object.entries(diccionarios)) {
      expect(d.asistenteInicio.saltar.length, id).toBeLessThanOrEqual(8);
      expect(d.asistenteInicio.saltar, id).not.toMatch(/\s/);
    }
  });

  it('la barra lateral marca cada entrada con data-nav y Ajustes puede reabrir el recorrido', () => {
    expect(fuente('componentes', 'Marco.vue')).toContain("{ 'data-nav': k }");
    expect(fuente('componentes', 'SeccionApariencia.vue')).toContain(
      'solicitudes.asistente = true',
    );
  });

  it('hay un solo asistente de primer uso: el recorrido usa ui.asistenteVisto', () => {
    expect(vue).toContain('marcarAsistenteVisto');
    expect(fuente('componentes', 'Marco.vue')).toContain('<AsistenteInicio />');
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { temaDe } from '../src/renderer/tema';

const px = (v: unknown): number => Number.parseInt(String(v), 10);

describe('objetivos de clic del tema (D54a, I9; WCAG 2.5.8)', () => {
  for (const oscuro of [false, true]) {
    const nombre = oscuro ? 'oscuro' : 'claro';
    const tema = temaDe(oscuro, null);

    it(`${nombre}: cerrar de cajones, diálogos y tarjetas mide 32 px`, () => {
      for (const c of [tema.Drawer, tema.Dialog, tema.Card]) {
        expect(px(c?.closeSize)).toBeGreaterThanOrEqual(32);
        expect(px(c?.closeIconSize)).toBe(18);
      }
    });

    it(`${nombre}: el interruptor pequeño también mide 24 px de alto`, () => {
      expect(px(tema.Switch?.railHeightSmall)).toBe(24);
      expect(px(tema.Switch?.railWidthSmall)).toBeGreaterThan(24);
    });

    it(`${nombre}: el interruptor mide 24 px de alto`, () => {
      expect(px(tema.Switch?.railHeightMedium)).toBe(24);
      expect(px(tema.Switch?.railWidthMedium)).toBe(44);
    });
  }

  it('los nombres de servicio externos salen en el idioma de la interfaz en las tarjetas', () => {
    const src = (f: string): string =>
      readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'componentes', f), 'utf8');
    expect(src('TarjetaServiciosProcesos.vue')).toContain('ti.irA(nombreServicio(s.nombre))');
    // En TarjetaServicio ningún texto o etiqueta usa el nombre crudo del núcleo.
    expect(src('TarjetaServicio.vue')).not.toMatch(/[^(.\w]servicio\.nombre/);
    expect(src('TarjetaServicio.vue')).not.toMatch(/props\.servicio\.nombre(?!\))/);
  });

  it('el CSS global da 28 px a los botones de solo icono y a la zona de las casillas', () => {
    const css = readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'estilos.css'), 'utf8');
    expect(css).toMatch(
      /\.n-button:not\(:has\(\.n-button__content\)\)\s*\{[^}]*min-height:\s*28px/,
    );
    expect(css).toMatch(/\.n-checkbox\s*\{[^}]*min-height:\s*28px/);
  });
});

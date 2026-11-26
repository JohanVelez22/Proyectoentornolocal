import { describe, expect, it } from 'vitest';
import { ACENTOS, contraste as contrasteHex, temaDe, textoSobre } from '../src/renderer/tema';

/** Contraste WCAG 2.x entre dos colores `#rrggbb`. */
function luminancia([r, g, b]: number[]): number {
  const f = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
}
const rgb = (hex: string): number[] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function contraste(a: number[], b: number[]): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}
/** `rgba(r, g, b, a)` o `#rrggbb` sobre un fondo. */
function sobre(color: string, fondo: string): number[] {
  if (color.startsWith('#')) return rgb(color);
  const [r, g, b, a] = color.match(/[\d.]+/g)!.map(Number) as [number, number, number, number];
  const f = rgb(fondo);
  return [r, g, b].map((c, i) => c * a + f[i]! * (1 - a));
}

const AA = 4.5;

describe('el tema da contraste AA (4.5:1) a los textos secundarios de Naive UI', () => {
  const claro = temaDe(false, null);
  const oscuro = temaDe(true, null);

  it('claro: texto terciario, marcador y texto vacío sobre el fondo y sobre blanco', () => {
    for (const fondo of ['#f5f6f8', '#ffffff', '#fbfbfc']) {
      for (const c of [
        String(claro.common!.textColor3),
        String(claro.common!.placeholderColor),
        String(claro.Empty!.textColor),
      ]) {
        expect(
          contraste(sobre(c, fondo), rgb(fondo)),
          `${c} sobre ${fondo}`,
        ).toBeGreaterThanOrEqual(AA);
      }
    }
  });

  it('claro: el texto blanco de los botones de aviso (ámbar) llega a AA en reposo, hover y pulsado', () => {
    for (const c of [
      String(claro.common!.warningColor),
      String(claro.common!.warningColorHover),
      String(claro.common!.warningColorPressed),
    ]) {
      expect(contraste(rgb('#ffffff'), rgb(c)), c).toBeGreaterThanOrEqual(AA);
    }
  });

  it('oscuro: marcador y texto vacío sobre los fondos de página, tarjeta y campo', () => {
    for (const fondo of ['#121317', '#1a1b21', '#2a2c34']) {
      for (const c of [String(oscuro.common!.placeholderColor), String(oscuro.Empty!.textColor)]) {
        expect(
          contraste(sobre(c, fondo), rgb(fondo)),
          `${c} sobre ${fondo}`,
        ).toBeGreaterThanOrEqual(AA);
      }
    }
  });
});

describe('el texto sobre el acento (botones principales) llega a AA con cada acento', () => {
  it.each(ACENTOS.flatMap((a) => [a.claro, a.oscuro]))('sobre %s', (fondo) => {
    expect(contrasteHex(textoSobre(fondo), fondo)).toBeGreaterThanOrEqual(AA);
  });

  it('el tema lo aplica a los botones primarios', () => {
    for (const oscuro of [false, true]) {
      const t = temaDe(oscuro, null);
      const fondo = String(t.common!.primaryColor);
      expect(String(t.Button!.textColorPrimary)).toBe(textoSobre(fondo));
    }
  });
});

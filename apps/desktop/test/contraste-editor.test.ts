import { describe, expect, it } from 'vitest';
import { contraste } from '../src/renderer/tema';
import { COLORES_EDITOR } from '../src/renderer/utilidades/coloresEditor';

const AA = 4.5;

describe('el editor de código da contraste AA (4.5:1) en el tema claro y en el oscuro', () => {
  for (const tema of ['claro', 'oscuro'] as const) {
    const c = COLORES_EDITOR[tema];

    it(`${tema}: el texto y cada color de sintaxis se leen sobre el fondo y sobre la línea activa`, () => {
      const sintaxis = {
        texto: c.texto,
        comentario: c.comentario,
        palabra: c.palabra,
        cadena: c.cadena,
        numero: c.numero,
        funcion: c.funcion,
        etiqueta: c.etiqueta,
        atributo: c.atributo,
        enlace: c.enlace,
      };
      for (const [nombre, color] of Object.entries(sintaxis)) {
        for (const fondo of [c.fondo, c.activa]) {
          expect(
            contraste(color, fondo),
            `${tema} ${nombre} sobre ${fondo}`,
          ).toBeGreaterThanOrEqual(AA);
        }
      }
    });

    it(`${tema}: los números de línea se leen sobre el margen y sobre la línea activa`, () => {
      expect(contraste(c.numeros, c.margen), `${tema} margen`).toBeGreaterThanOrEqual(AA);
      expect(contraste(c.numeros, c.activa), `${tema} activa`).toBeGreaterThanOrEqual(AA);
      expect(contraste(c.texto, c.margen), `${tema} texto activo`).toBeGreaterThanOrEqual(AA);
    });
  }
});

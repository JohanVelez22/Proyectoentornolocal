import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

const marco = readFileSync(
  path.join(__dirname, '..', 'src', 'renderer', 'componentes', 'Marco.vue'),
  'utf8',
);
const plantilla = marco.slice(marco.indexOf('<template>'), marco.indexOf('<style'));
const css = marco.slice(marco.indexOf('<style'));

/** Cuerpo de la regla CSS que empieza en `selector {`. */
function regla(selector: string): string {
  const i = css.indexOf(`${selector} {`);
  expect(i, selector).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i));
}

describe('buscador general centrado en la barra superior (D41)', () => {
  it('va en su propia columna central, no junto a los controles de la derecha', () => {
    const centro = plantilla.indexOf('class="cabecera-centro"');
    const buscador = plantilla.indexOf('class="buscador"');
    const acciones = plantilla.indexOf('class="cabecera-acciones"');
    expect(centro).toBeGreaterThan(-1);
    expect(buscador).toBeGreaterThan(centro);
    expect(buscador).toBeLessThan(acciones);
    // La campana, la memoria y los selectores quedan después, en el grupo de la derecha.
    expect(plantilla.indexOf('<CampanaAvisos')).toBeGreaterThan(acciones);
  });

  it('la barra es una cuadrícula título | buscador | controles con el buscador de 480 a 560 px', () => {
    const r = regla('.cabecera');
    expect(r).toContain('display: grid');
    const m = /grid-template-columns:\s*1fr minmax\(0,\s*(\d+)px\)\s*1fr/.exec(r);
    expect(m).not.toBeNull();
    const maximo = Number(m![1]);
    expect(maximo).toBeGreaterThanOrEqual(480);
    expect(maximo).toBeLessThanOrEqual(560);
    expect(regla('.buscador')).toContain(`max-width: ${maximo}px`);
  });

  it('en ventanas estrechas pasa a icono y el título se recorta con puntos suspensivos', () => {
    expect(css).toMatch(/@container \(max-width: \d+px\)\s*\{[^@]*\.buscador-texto/);
    expect(css).toMatch(/@container[^@]*\.buscador kbd[^@]*display: none/);
    expect(regla('.cabecera h1')).toContain('text-overflow: ellipsis');
    expect(regla('.cabecera h1')).toContain('min-width: 0');
    expect(regla('.cabecera')).toContain('container-type: inline-size');
  });

  it('la región de arrastre sigue: la barra arrastra y el buscador y los controles no', () => {
    expect(regla('.cabecera')).toContain('-webkit-app-region: drag');
    expect(regla('.buscador')).toContain('-webkit-app-region: no-drag');
    expect(regla('.cabecera-acciones')).toContain('-webkit-app-region: no-drag');
  });

  it('abre la paleta (Ctrl+K), tiene nombre accesible y foco visible', () => {
    expect(plantilla).toContain('@click="solicitudes.paleta = true"');
    expect(plantilla).toContain(':aria-label="textos.barra.paleta"');
    expect(css).toContain('.buscador:focus-visible');
  });

  it('se ve en tema claro y oscuro: solo grises translúcidos y el acento del tema', () => {
    const r = regla('.buscador');
    expect(r).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(r).toContain('rgba(128, 128, 128');
    expect(r).toContain('color: inherit');
  });

  it('el texto y el atajo existen en los 4 idiomas', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      expect(d.barra.paleta.length, id).toBeGreaterThan(0);
      expect(d.barra.atajoPaleta, id).toBe('Ctrl+K');
    }
  });
});

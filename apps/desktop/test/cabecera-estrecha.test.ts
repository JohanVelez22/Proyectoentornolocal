import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const leer = (n: string): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'componentes', n), 'utf8');
const marco = leer('Marco.vue');
const memoria = leer('BotonMemoria.vue');

describe('barra superior con ventana estrecha o escala de Windows alta (D54b)', () => {
  it('el menú lateral empieza plegado y se pliega al cruzar los 900 px, para que los controles de la derecha (tema incluido) no se corten', () => {
    expect(marco).toMatch(/ANCHO_PLEGAR = 900/);
    expect(marco).toMatch(/window\.innerWidth < ANCHO_PLEGAR/);
    expect(marco).toContain('matchMedia(`(max-width: ${ANCHO_PLEGAR - 1}px)`)');
    expect(marco).toContain("removeEventListener('change', alCambiarAncho)");
  });

  it('con el menú plegado se ocultan los títulos de grupo, que no caben en el carril', () => {
    expect(marco).toContain('.n-menu.n-menu--collapsed .n-menu-item-group-title');
  });

  it('el botón de memoria pierde el texto (no el icono ni la etiqueta accesible) en una barra de 760 px o menos', () => {
    expect(memoria).toMatch(/@container \(max-width: 760px\)\s*\{\s*\.memoria-texto/);
    expect(memoria).toContain(':aria-label="t.tituloEtiqueta"');
  });
});

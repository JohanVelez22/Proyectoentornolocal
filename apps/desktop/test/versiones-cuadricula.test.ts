import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');

describe('Versiones en cuadrícula (D41)', () => {
  const grupo = fuente('componentes', 'GrupoRama.vue');
  const tarjeta = fuente('componentes', 'FilaVersion.vue');

  it('las tarjetas van en un grid que se reparte el ancho con auto-fill y minmax', () => {
    expect(grupo).toMatch(/\.cuadricula\s*\{[^}]*display:\s*grid/);
    expect(grupo).toMatch(
      /grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(100%,\s*\d+px\),\s*1fr\)\)/,
    );
    expect(grupo).toContain('class="cuadricula" role="list"');
  });

  it('cada versión es una tarjeta (listitem) y no una fila de tabla', () => {
    expect(tarjeta).toContain('role="listitem"');
    expect(tarjeta).not.toContain('role="row"');
    expect(tarjeta).toMatch(/\.tarjeta\s*\{[^}]*border:/);
  });

  it('las tarjetas se ven en tema claro y oscuro: bordes y fondos translúcidos, sin colores fijos', () => {
    const css = tarjeta.slice(tarjeta.indexOf('<style'));
    expect(css).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(css).toContain('rgba(128, 128, 128');
    expect(css).toContain('var(--acento-rgb)');
  });

  it('el filtro de serie y "mostrar todas" siguen en la barra', () => {
    const v = fuente('componentes', 'VersionesServicio.vue');
    expect(v).toContain(':options="opcionesRama"');
    expect(v).toContain('@update:checked="cambiarTodas"');
    expect(v).toContain('mostrarTodas');
  });

  it('los textos de la cuadrícula existen en los 4 idiomas', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      const t = d.versiones;
      expect(typeof t.mostrarTodas, id).toBe('string');
      expect(typeof t.filtroRama, id).toBe('string');
      expect(typeof t.vacio, id).toBe('string');
    }
  });
});

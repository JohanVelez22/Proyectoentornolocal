import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fuente = readFileSync('src/renderer/componentes/TarjetaServicio.vue', 'utf8');
const plantilla = /<template>([\s\S]*?)<\/template>\s*<style/.exec(fuente)?.[1] ?? '';
const estilos = fuente.slice(fuente.indexOf('<style'));
const regla = (selector: string): string => {
  const escapado = selector.replace(/[.]/g, String.raw`\.`);
  return (
    new RegExp(String.raw`(?:^|
)${escapado}\s*\{([^}]*)\}`).exec(estilos)?.[1] ?? ''
  );
};

describe('Tarjeta de servicio: estructura fija (D54b C2)', () => {
  it('la cabecera lleva solo icono, nombre y estado; las acciones van en su propia fila', () => {
    const cabeza = /<header class="cabeza">([\s\S]*?)<\/header>/.exec(plantilla)?.[1] ?? '';
    expect(cabeza).toContain('class="icono"');
    expect(cabeza).toContain('class="titulo"');
    expect(cabeza).toContain('<EstadoPunto');
    expect(cabeza).not.toContain('NButton');
    expect(cabeza).not.toContain('MenuDesplegable');
    const fila =
      /<div v-if="servicioVersiones \|\| deDatos" class="acciones"[\s\S]*?<\/MenuDesplegable>\s*<\/div>/.exec(
        plantilla,
      )?.[0];
    expect(fila).toBeDefined();
    expect(fila).toContain('abrirVersiones');
    expect(fila).toContain('MenuDesplegable');
    // La fila de acciones sigue inmediatamente a la cabecera.
    expect(plantilla.indexOf('</header>')).toBeLessThan(plantilla.indexOf('class="acciones"'));
    expect(plantilla.indexOf('class="acciones"')).toBeLessThan(plantilla.indexOf('class="datos"'));
  });

  it('ni la cabecera ni la fila de acciones dependen del ancho del texto (sin wrap)', () => {
    expect(regla('.cabeza')).not.toMatch(/flex-wrap:\s*wrap/);
    expect(regla('.acciones')).not.toMatch(/flex-wrap:\s*wrap/);
    expect(regla('.cabeza')).toMatch(/flex-wrap:\s*nowrap/);
  });

  it('el nombre se trunca con elipsis y lleva title', () => {
    expect(plantilla).toMatch(/<h3 :title="nombreServicio\(servicio\.nombre\)">/);
    expect(estilos).toContain('text-overflow: ellipsis');
    expect(estilos).toContain('white-space: nowrap');
  });

  it('puerto y PID comparten altura y alineación vertical aunque uno lleve un enlace', () => {
    const dd = regla('.datos dd');
    expect(dd).toMatch(/align-items:\s*center/);
    expect(dd).toMatch(/min-height:\s*32px/);
    expect(regla('.puerto')).not.toMatch(/flex-wrap:\s*wrap/);
  });
});

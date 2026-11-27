import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');

describe('Servicios, Inicio y la pastilla comparten una sola fuente (D54a)', () => {
  it('los tres cuentan con servicios.resumen, nunca con servicios.lista', () => {
    const marco = fuente('componentes', 'Marco.vue');
    expect(marco).toContain('servicios.resumen.encendidos');
    expect(marco).not.toMatch(/servicios\.lista|servicios\.encendidos/);

    const inicio = fuente('vistas', 'Inicio.vue');
    expect(inicio).toContain('servicios.resumen.encendidos');
    expect(inicio).toContain('servicios.resumen.propios');
    expect(inicio).not.toContain('servicios.resumen.total');
    expect(inicio).not.toContain('servicios.lista.length');

    const tarjeta = fuente('componentes', 'TarjetaServiciosProcesos.vue');
    expect(tarjeta).toContain('servicios.visibles');

    const vista = fuente('vistas', 'Servicios.vue');
    expect(vista).toContain('servicios.resumen.porArrancar');
    expect(vista).toContain('servicios.instaladosListos');
  });

  it('donde se ofrecen servicios para elegir o encender se usa la fuente única (visibles)', () => {
    for (const f of [
      'DialogoWorkspace.vue',
      'PaletaComandos.vue',
      'AsistenteNuevoProyecto.vue',
      'AsistenteImportar.vue',
      'DialogoImportar.vue',
    ]) {
      const t = fuente('componentes', f);
      expect(t, f).toContain('servicios.visibles');
      expect(t, f).not.toContain('servicios.lista');
    }
  });

  it('la cabecera no depende de una columna fija: los controles no se encogen y nada se solapa', () => {
    const marco = fuente('componentes', 'Marco.vue');
    expect(marco).not.toContain('--lado');
    expect(marco).toMatch(/grid-template-columns:[^;]*minmax\(min-content, 1fr\)/);
    // Una columna con tope en píxeles se llevaría el sitio antes que el título.
    expect(marco).not.toMatch(/grid-template-columns:[^;]*minmax\([^)]*,\s*\d+px\)/);
  });

  it('la pastilla es un botón que lleva a Servicios y su texto corto no se oculta por ancho', () => {
    const marco = fuente('componentes', 'Marco.vue');
    expect(marco).toMatch(/<button[^>]*class="pastilla"/s);
    expect(marco).toContain("navegar('servicios')");
    expect(marco).toContain('pastilla.corto');
    // Ya no depende del contenedor de 1440 px: solo por debajo de 900 px se reduce al punto.
    expect(marco).not.toMatch(/@container \(min-width: 1440px\)\s*\{[^}]*\.pastilla-texto/s);
  });
});

describe('Inicio: avisos agrupados, disco y memoria (D54a)', () => {
  it('«Finalizar proceso» ya no es un botón del aviso: va en un menú con su confirmación', () => {
    const panel = fuente('componentes', 'PanelRendimiento.vue');
    expect(panel).toContain('MenuDesplegable');
    expect(panel).toContain('dialog.warning');
    expect(panel).not.toMatch(/<NButton[^>]*type="error"[^>]*>\s*\{\{ t\.alertas\.finalizar/s);
  });

  it('la memoria alta es una insignia, no un banner', () => {
    const panel = fuente('componentes', 'PanelRendimiento.vue');
    expect(panel).toContain('memoriaAlta');
    expect(panel).toContain('t.insignias.memoriaAlta');
    expect(panel).not.toContain('NAlert');
  });

  it('«Liberar espacio» solo ofrece lo que ya existe y no borra nada por su cuenta', () => {
    const disco = fuente('componentes', 'TarjetaDisco.vue');
    expect(disco).toContain('DialogoLimpiarVersiones');
    expect(disco).toContain("'limpiezaDisco'");
    expect(disco).toContain("'usoDisco'");
    expect(disco).toContain('discoUso.unidades');
    // Una lectura que falla no deja la tarjeta en «—»; el botón lleva el icono a la derecha.
    expect(disco).toContain('Promise.allSettled');
    expect(disco).not.toContain('Promise.all(');
    expect(disco).toContain('icon-placement="right"');
    // Ninguna llamada de borrado en esta tarjeta.
    expect(disco).not.toMatch(/limpiar\(|limpiezaVersiones\.limpiar|eliminar|borrar/);
  });

  it('los textos nuevos existen en los cuatro idiomas y el francés habla de «vous»', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      const p = d.panel;
      for (const k of ['liberar', 'versiones', 'temporales', 'ocupaMas', 'poco', 'casiLleno']) {
        expect(
          (p.discos as unknown as Record<string, string>)[k]?.length,
          `${id}/discos.${k}`,
        ).toBeGreaterThan(3);
      }
      expect(p.insignias.memoriaAlta.length, `${id}/memoriaAlta`).toBeGreaterThan(3);
      expect(p.alertas.grupo(3), id).toContain('3');
      expect(p.alertas.verTodos(5), id).toContain('5');
      expect(d.servicios.franjaExternos.accion.length, id).toBeGreaterThan(5);
      expect(d.servicios.sinParaEncender.length, id).toBeGreaterThan(10);
    }
  });
});

describe('Escala de diseño (D54a)', () => {
  it('estilos.css define los tokens de letra, espaciado y radio', () => {
    const css = fuente('estilos.css');
    for (const t of [
      '--wc-texto-xs',
      '--wc-texto-sm',
      '--wc-texto-md',
      '--wc-texto-lg',
      '--wc-texto-xl',
      '--wc-texto-2xl',
      '--wc-esp-1',
      '--wc-esp-2',
      '--wc-esp-3',
      '--wc-esp-4',
      '--wc-esp-6',
      '--wc-esp-8',
      '--wc-radio-sm',
      '--wc-radio-md',
      '--wc-radio-lg',
      '--wc-radio-completo',
    ]) {
      expect(css, t).toContain(`${t}:`);
    }
  });
});

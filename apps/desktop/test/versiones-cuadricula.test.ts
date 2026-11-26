import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';
import { useVersiones, type FilaVersion } from '../src/renderer/stores/versiones';
import { abrirPlegados } from '../src/renderer/utilidades/foco';
import { partirRama, quedaALaVista } from '../src/renderer/utilidades/versionesCompactas';

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');

const grupo = fuente('componentes', 'GrupoRama.vue');
const tarjeta = fuente('componentes', 'FilaVersion.vue');

describe('Versiones en cuadrícula (D41, compacta en D38a)', () => {
  it('las tarjetas van en un grid que se reparte el ancho con auto-fill y minmax(200px, 1fr)', () => {
    expect(grupo).toMatch(/\.cuadricula\s*\{[^}]*display:\s*grid/);
    expect(grupo).toMatch(
      /\.cuadricula\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(200px,\s*1fr\)\)/,
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
      expect(t.anteriores(3), id).toContain('3');
    }
  });
});

const fila = (version: string, extra: Partial<FilaVersion> = {}): FilaVersion =>
  ({
    version,
    instalada: false,
    encendida: false,
    predeterminada: false,
    bloqueada: false,
    actualizacion: null,
    huella: 'firmada',
    instancia: null,
    puerto: null,
    ...extra,
  }) as FilaVersion;

describe('Versiones compactas (D38a)', () => {
  it('por defecto solo se ve el último parche de cada versión menor; el resto, plegado', () => {
    const r = partirRama([fila('8.4.12'), fila('8.4.11'), fila('8.4.10')]);
    expect(r.visibles.map((f) => f.version)).toEqual(['8.4.12']);
    expect(r.anteriores.map((f) => f.version)).toEqual(['8.4.11', '8.4.10']);
  });

  it('un parche anterior instalado, encendido o con aviso no se esconde', () => {
    const r = partirRama([
      fila('8.4.12'),
      fila('8.4.11', { instalada: true }),
      fila('8.4.10'),
      fila('8.4.9', { actualizacion: '8.4.12' }),
      fila('8.4.8', { bloqueada: true }),
    ]);
    expect(r.visibles.map((f) => f.version)).toEqual(['8.4.12', '8.4.11', '8.4.9', '8.4.8']);
    expect(r.anteriores.map((f) => f.version)).toEqual(['8.4.10']);
    expect(quedaALaVista(fila('1.0.0'))).toBe(false);
  });

  it('una versión menor con un solo parche no tiene desplegable', () => {
    expect(partirRama([fila('3.0.1')]).anteriores).toEqual([]);
    expect(partirRama([])).toEqual({ visibles: [], anteriores: [] });
  });

  it('«Mostrar todas» empieza desmarcado', () => {
    setActivePinia(createPinia());
    expect(useVersiones().todas).toBe(false);
  });

  it('cada versión menor lleva su desplegable de parches anteriores y se abre con el resaltado', () => {
    expect(grupo).toContain('<details v-if="partes.anteriores.length"');
    expect(grupo).toContain(':open="abrirAnteriores"');
    expect(grupo).toContain('partirRama(props.rama.versiones)');
  });

  it('el foco abre los desplegables plegados que contienen la versión pedida', () => {
    const interior = { open: false };
    const exterior = { open: false };
    const el = {
      closest(selector: string) {
        expect(selector).toBe('details:not([open])');
        return [interior, exterior].find((d) => !d.open) ?? null;
      },
    };
    expect(abrirPlegados(el)).toBe(2);
    expect(interior.open && exterior.open).toBe(true);
    // Sin desplegable (o ya abierto) no hace nada.
    expect(abrirPlegados({ closest: () => null })).toBe(0);
    expect(fuente('composables', 'useFoco.ts')).toContain('abrirPlegados(el)');
  });

  it('la versión y la firma van en una línea con Instalar pequeño a la derecha', () => {
    expect(tarjeta).toMatch(
      /<div class="linea">[\s\S]*class="numero"[\s\S]*class="firma[\s\S]*class="espacio"[\s\S]*<NButton[\s\S]*size="tiny"[\s\S]*t\.instalar/,
    );
    expect(tarjeta).toMatch(/\.espacio\s*\{[^}]*flex:\s*1/);
    expect(tarjeta).toContain('data-foco');
  });
});

describe('Versiones compactas: contraste AA en los dos temas', () => {
  const css = fuente('estilos.css');
  const NOMBRES = ['--texto-ok', '--texto-aviso', '--texto-enlace', '--texto-peligro'];

  /** Valor `#rrggbb` de un token dentro del bloque que empieza con `inicio`. */
  const token = (inicio: string, nombre: string): string => {
    const desde = css.indexOf(inicio);
    const bloque = css.slice(desde, css.indexOf('}', desde));
    const linea = bloque.split('\n').find((l) => l.trim().startsWith(`${nombre}:`)) ?? '';
    return /#[0-9a-f]{6}/i.exec(linea)?.[0] ?? '';
  };
  const luz = (hex: string): number => {
    const n = Number.parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const contraste = (a: string, b: string): number => {
    const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
    return (x! + 0.05) / (y! + 0.05);
  };

  it.each(NOMBRES)('%s llega a 4.5:1 sobre los fondos claros', (n) => {
    const c = token(':root {\n  --texto-ok', n);
    expect(c, n).not.toBe('');
    for (const fondo of ['#f5f6f8', '#ffffff', '#fbfbfc']) {
      expect(contraste(c, fondo), `${n} sobre ${fondo}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(NOMBRES)('%s llega a 4.5:1 sobre los fondos oscuros', (n) => {
    const c = token(":root[data-tema='oscuro'] {\n  --texto-ok", n);
    expect(c, n).not.toBe('');
    for (const fondo of ['#121317', '#1a1b21', '#2a2c34']) {
      expect(contraste(c, fondo), `${n} sobre ${fondo}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('las marcas de la tarjeta usan esos colores', () => {
    const css2 = tarjeta.slice(tarjeta.indexOf('<style'));
    for (const n of NOMBRES) expect(css2).toContain(`var(${n})`);
  });
});

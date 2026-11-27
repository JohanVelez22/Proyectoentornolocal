import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';
import { es } from '../src/renderer/i18n/es';
import { sistemaDe } from '../src/renderer/utilidades/grabadora';
import {
  HERRAMIENTAS_ANCHAS,
  PESTANAS_TARJETA,
  SECCIONES_HERRAMIENTAS,
  TARJETAS,
  TARJETAS_POR_SECCION,
  pestanasDe,
  resolverHerramienta,
} from '../src/renderer/utilidades/herramientasSecciones';

const fuente = (...p: string[]): string => readFileSync(path.join(__dirname, '..', ...p), 'utf8');
/** Nombres de la tecla Mayús según el idioma (inglés, francés, alemán, italiano, español). */
const MAYUS = 'Shift|Maj|Umschalt|Maiusc|Mayús';
const IDS_HERRAMIENTA = Object.keys(es.herramientas.lista);

describe('Herramientas por secciones (D38a)', () => {
  it('hay 5 secciones con las tarjetas pedidas', () => {
    expect(SECCIONES_HERRAMIENTAS).toEqual(['codigo', 'red', 'seguridad', 'archivos', 'sistema']);
    expect(TARJETAS_POR_SECCION).toEqual({
      codigo: ['editor', 'buscar', 'comparar', 'regex', 'json', 'markdown'],
      red: ['clienteHttp', 'puertos', 'websocket', 'certificados', 'compartir', 'guias'],
      seguridad: ['contrasenas', 'cripto', 'entorno'],
      archivos: [
        'imagenes',
        'comprimir',
        'conversor',
        'infoArchivo',
        'usoDisco',
        'bom',
        'qr',
        'captura',
        'grabarPantalla',
      ],
      sistema: ['limpiezaDisco', 'tiempo'],
    });
  });

  it('ninguna tarjeta se repite y todas tienen texto y componente', () => {
    expect(new Set(TARJETAS).size).toBe(TARJETAS.length);
    const vista = fuente('src', 'renderer', 'vistas', 'Herramientas.vue');
    for (const c of TARJETAS) {
      const tienePropio = c in es.herramientas.tarjetas || c in es.herramientas.lista;
      expect(tienePropio, c).toBe(true);
      const herramientas = pestanasDe(c).length ? [...pestanasDe(c)] : [c];
      for (const h of herramientas) {
        expect(vista, h).toMatch(new RegExp(`\\b${h}:\\s+defineAsyncComponent`));
      }
    }
  });

  it('toda herramienta de la lista vive en una tarjeta o en una pestaña (nada se quitó)', () => {
    for (const id of IDS_HERRAMIENTA) {
      const d = resolverHerramienta(id);
      expect(d, id).not.toBeNull();
      expect(TARJETAS, id).toContain(d!.tarjeta);
    }
  });

  it('las tarjetas unificadas reúnen sus herramientas en pestañas', () => {
    expect(PESTANAS_TARJETA.comparar).toEqual(['diff', 'diffCarpetas']);
    expect(PESTANAS_TARJETA.qr).toEqual(['qr', 'qrWifi']);
    expect(PESTANAS_TARJETA.guias).toEqual(['guiaHttp', 'guiaTuneles', 'guiaGit']);
    expect(pestanasDe('puertos')).toEqual([]);
  });

  it('los ids viejos abren la tarjeta unificada en la pestaña correcta', () => {
    expect(resolverHerramienta('diff')).toEqual({ tarjeta: 'comparar', herramienta: 'diff' });
    expect(resolverHerramienta('diffCarpetas')).toEqual({
      tarjeta: 'comparar',
      herramienta: 'diffCarpetas',
    });
    expect(resolverHerramienta('qrWifi')).toEqual({ tarjeta: 'qr', herramienta: 'qrWifi' });
    expect(resolverHerramienta('guiaTuneles')).toEqual({
      tarjeta: 'guias',
      herramienta: 'guiaTuneles',
    });
    expect(resolverHerramienta('guiaHttp')).toEqual({ tarjeta: 'guias', herramienta: 'guiaHttp' });
  });

  it('el id de una tarjeta abre su primera pestaña; una herramienta sola, ella misma', () => {
    expect(resolverHerramienta('comparar')).toEqual({ tarjeta: 'comparar', herramienta: 'diff' });
    expect(resolverHerramienta('qr')).toEqual({ tarjeta: 'qr', herramienta: 'qr' });
    expect(resolverHerramienta('guias')).toEqual({ tarjeta: 'guias', herramienta: 'guiaHttp' });
    expect(resolverHerramienta('puertos')).toEqual({ tarjeta: 'puertos', herramienta: 'puertos' });
    expect(resolverHerramienta('editor')).toEqual({ tarjeta: 'editor', herramienta: 'editor' });
    expect(resolverHerramienta('no-existe')).toBeNull();
    expect(resolverHerramienta('')).toBeNull();
  });

  it('los cuatro caminos que piden una herramienta usan ids que se resuelven', () => {
    // Paleta: un comando por cada id de la lista.
    expect(fuente('src', 'renderer', 'componentes', 'PaletaComandos.vue')).toContain(
      'Object.entries(textos.herramientas.lista)',
    );
    // abrirEnEditor, Marco (captura → imágenes) y Rendimiento (Inicio → puertos).
    expect(fuente('src', 'renderer', 'composables', 'abrirEnEditor.ts')).toContain(
      "solicitudes.herramienta = 'editor'",
    );
    expect(fuente('src', 'renderer', 'componentes', 'Marco.vue')).toContain(
      "solicitudes.herramienta = 'imagenes'",
    );
    expect(fuente('src', 'renderer', 'componentes', 'PanelRendimiento.vue')).toContain(
      "solicitudes.herramienta = 'puertos'",
    );
    for (const id of ['editor', 'imagenes', 'puertos'])
      expect(resolverHerramienta(id)).not.toBeNull();
    // La pantalla atiende `solicitudes.herramienta` con el mismo resolutor.
    const vista = fuente('src', 'renderer', 'vistas', 'Herramientas.vue');
    expect(vista).toContain('resolverHerramienta(c)');
    expect(vista).toContain('solicitudes.herramienta = null');
  });

  it('la guía de Git (D50) es una pestaña de la tarjeta Guías', () => {
    expect(IDS_HERRAMIENTA).toContain('guiaGit');
    expect(PESTANAS_TARJETA.guias as readonly string[]).toContain('guiaGit');
    expect(resolverHerramienta('guiaGit')).toEqual({ tarjeta: 'guias', herramienta: 'guiaGit' });
  });

  it('el buscador encuentra una tarjeta por el nombre de cualquiera de sus pestañas', () => {
    const vista = fuente('src', 'renderer', 'vistas', 'Herramientas.vue');
    expect(vista).toContain('pestanasDe(tarjeta).map');
    expect(vista).toContain('t.lista[p as Clave]');
  });

  it('los paneles anchos siguen siendo los mismos', () => {
    for (const h of [
      'diff',
      'diffCarpetas',
      'puertos',
      'guiaHttp',
      'guiaTuneles',
      'guiaGit',
      'editor',
    ]) {
      expect(HERRAMIENTAS_ANCHAS, h).toContain(h);
    }
  });

  it('los textos de secciones, tarjetas y pestañas existen en los 4 idiomas', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      const h = d.herramientas;
      for (const s of SECCIONES_HERRAMIENTAS) expect(h.secciones[s], `${id}:${s}`).toBeTruthy();
      for (const c of ['comparar', 'qr', 'guias'] as const) {
        expect(h.tarjetas[c].nombre, `${id}:${c}`).toBeTruthy();
        expect(h.tarjetas[c].descripcion, `${id}:${c}`).toBeTruthy();
      }
      for (const p of Object.values(PESTANAS_TARJETA).flat()) {
        expect(h.pestanas[p], `${id}:${p}`).toBeTruthy();
      }
    }
  });
});

describe('Grabar pantalla en Herramientas (D38a)', () => {
  it('es una tarjeta de Archivos y medios con panel propio', () => {
    expect(TARJETAS_POR_SECCION.archivos).toContain('grabarPantalla');
    expect(resolverHerramienta('grabarPantalla')).toEqual({
      tarjeta: 'grabarPantalla',
      herramienta: 'grabarPantalla',
    });
  });

  it('reconoce el sistema por navigator.platform', () => {
    expect(sistemaDe('Win32')).toBe('windows');
    expect(sistemaDe('MacIntel')).toBe('macos');
    expect(sistemaDe('Linux x86_64')).toBe('linux');
    expect(sistemaDe('')).toBe('linux');
  });

  it('hay guía de Windows, macOS y Linux en los 16 idiomas, con los atajos que pide el plan', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      const g = d.herramientas.grabar;
      expect(g.abrir, id).toBeTruthy();
      expect(g.noSePudo, id).toBeTruthy();
      for (const s of ['windows', 'macos', 'linux'] as const) {
        expect(g.guias[s].pasos.length, `${id}:${s}`).toBeGreaterThan(0);
      }
      const windows = g.guias.windows.pasos.join(' ');
      // «Win», la tecla R y una tecla de mayúsculas, con el nombre que use cada idioma.
      expect(windows, id).toMatch(new RegExp(`Win [+] (?:${MAYUS}) [+] R`));
      expect(windows, id).toContain('Win + Alt + R');
      expect(g.guias.macos.pasos.join(' '), id).toMatch(new RegExp(`Cmd [+] (?:${MAYUS}) [+] 5`));
    }
  });

  it('el panel de Windows solo muestra el botón en Windows y el resto lleva guía', () => {
    const panel = fuente('src', 'renderer', 'componentes', 'herramientas', 'GrabarPantalla.vue');
    expect(panel).toContain("sistema === 'windows'");
    expect(panel).toContain('api().sistema.abrirGrabadora()');
    expect(panel).toContain('t.guias[sistema.value]');
    expect(panel).not.toContain('process.platform');
    // El URI vive solo en el proceso principal: la ventana no lo conoce ni abre nada por su cuenta.
    expect(panel).not.toContain('ms-screenclip');
    expect(panel).not.toContain('openExternal');
  });
});

describe('Doctor: enlaza a Puertos en vez de repetir la tabla (D38a)', () => {
  it('un hallazgo de puertos ofrece «Ver puertos» y abre la herramienta Puertos', () => {
    const tarjeta = fuente('src', 'renderer', 'componentes', 'TarjetaHallazgo.vue');
    expect(tarjeta).toContain("hallazgo.revision === 'puertos'");
    expect(tarjeta).toContain("solicitudes.herramienta = 'puertos'");
    expect(tarjeta).toContain("router.push({ name: 'herramientas' })");
    for (const [id, d] of Object.entries(diccionarios)) {
      expect(d.doctor.verPuertos, id).toBeTruthy();
    }
  });
});

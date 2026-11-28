import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

const fuente = (...r: string[]): string =>
  readFileSync(join(__dirname, '..', 'src', 'renderer', ...r), 'utf8');

describe('Segunda pasada de diseño (D54c): estructura', () => {
  it('Agentes: rutas recortadas por el principio, paquete en una línea y aviso plegable', () => {
    const texto = fuente('componentes', 'TextoLargo.vue');
    expect(texto).toContain('direction: rtl');
    expect(texto).toMatch(/\.por-inicio\s*\{\s*gap: 8px/);
    const agente = fuente('componentes', 'TarjetaAgente.vue');
    expect(agente).toMatch(
      /\.titulo \.tenue\s*\{[^}]*white-space: nowrap[^}]*text-overflow: ellipsis/s,
    );
    const vista = fuente('vistas', 'Agentes.vue');
    expect(vista).toContain('<AvisoPlegable');
    expect(vista).not.toMatch(/<NAlert[^>]*class="nota-mcp"/);
  });

  it('el texto del token MCP usa las comillas de cada idioma y el título existe en los 16', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      expect(d.agentes.notaMcpTitulo.length, id).toBeGreaterThan(5);
    }
    expect(diccionarios.en.agentes.notaMcp).not.toContain('«wolfcore»');
    expect(diccionarios.en.agentes.notaMcp).toContain('“wolfcore”');
    expect(diccionarios.en.agentes.notaMcp).not.toContain('("Open');
  });

  it('AvisoPlegable en oscuro: fondo al 8 % y borde de 1 px al 25 %', () => {
    const aviso = fuente('componentes', 'AvisoPlegable.vue');
    expect(aviso).toContain("data-tema='oscuro'");
    expect(aviso).toContain('rgba(var(--aviso-rgb), 0.08)');
    expect(aviso).toContain('1px solid rgba(var(--aviso-rgb), 0.25)');
  });

  it('Correo: la tarjeta comparte la cabecera de TarjetaServicio, sin wrap y con la misma altura', () => {
    const c = fuente('componentes', 'TarjetaCaptador.vue');
    expect(c).toMatch(/\.cabeza\s*\{[^}]*flex-wrap: nowrap/s);
    expect(c).toMatch(/\.nombre\s*\{[^}]*text-overflow: ellipsis/s);
    expect(c).toMatch(/\.tarjeta\s*\{[^}]*height: 100%/s);
    expect(c).toMatch(/\.botones\s*\{\s*margin-top: auto/);
  });

  it('«Instalar» es secundario y con CloudDownloadOutline en las tarjetas', () => {
    for (const f of ['TarjetaCaptador.vue', 'TarjetaAgente.vue', 'FilaVersion.vue']) {
      const s = fuente('componentes', f);
      expect(s, f).toContain('CloudDownloadOutline');
    }
    expect(fuente('componentes', 'TarjetaCaptador.vue')).not.toContain('Download,');
    const servicio = fuente('componentes', 'TarjetaServicio.vue');
    expect(servicio).not.toMatch(/:type="encendido \? 'default' : 'primary'"/);
  });

  it('Doctor: «Ver puertos» es un enlace en la fila de «Ver detalles» y «Reparar» no es pequeño', () => {
    const h = fuente('componentes', 'TarjetaHallazgo.vue');
    expect(h).toMatch(/data-testid="ver-puertos"/);
    expect(h).toMatch(/<NButton\s+v-if="esDePuertos"\s+text\s+size="small"\s+type="primary"/);
    expect(h).toMatch(/v-if="!rep\.soloInforma"\s+type="primary"\s+:loading/);
  });

  it('la paleta no repite «Ir a» y el Centro de avisos vacío no tiene botones desactivados', () => {
    const p = fuente('componentes', 'PaletaComandos.vue');
    expect(p).not.toContain('t.irA(textos.nav');
    const a = fuente('componentes', 'PanelAvisos.vue');
    expect(a).not.toContain(':disabled="avisos');
  });

  it('Proyectos vacío no repite «Nuevo proyecto» arriba', () => {
    const v = fuente('vistas', 'Proyectos.vue');
    expect(v).toMatch(
      /v-if="sitios\.lista\.length"\s+size="small"\s+secondary\s+@click="creandoProyecto = true"/,
    );
  });

  it('el grupo Herramientas de Servicios tiene nombre propio, distinto del de la pantalla', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      expect(d.servicios.grupos.herramientas, id).not.toBe(d.nav.herramientas);
    }
    expect(diccionarios.en.panel.discos.libre('C:', '382 GB', 41)).toBe('C: 382 GB free (41%)');
  });
});

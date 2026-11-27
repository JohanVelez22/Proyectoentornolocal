import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';
import { grafemas, minimo } from './ayudas-i18n';
import { partirParaRecorte } from '../src/renderer/utilidades/recorte';

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');

describe('Recorte por el centro de textos largos (D38c)', () => {
  it('un texto corto no se parte', () => {
    expect(partirParaRecorte('C:\\app\\a.json')).toEqual({ inicio: 'C:\\app\\a.json', fin: '' });
    expect(partirParaRecorte('x'.repeat(24))).toEqual({ inicio: 'x'.repeat(24), fin: '' });
  });

  it('una ruta larga conserva el final desde un separador y no pierde nada', () => {
    const ruta =
      'C:\\Users\\alguien\\AppData\\Local\\WolfCoreDev\\agentes\\claude\\bin\\versiones\\2.1.4\\claude.exe';
    const { inicio, fin } = partirParaRecorte(ruta);
    expect(inicio + fin).toBe(ruta);
    expect(fin.startsWith('\\')).toBe(true);
    expect(fin.endsWith('claude.exe')).toBe(true);
    expect(fin.length).toBeLessThanOrEqual(24);
    expect(
      partirParaRecorte('/home/u/proyectos/muy/profundo/que/no/cabe/en/la/tarjeta/config.toml').fin,
    ).toMatch(/config\.toml$/);
  });

  it('un nombre sin separadores se corta en los últimos caracteres', () => {
    const nombre = 'Proyecto con un nombre larguísimo de cliente 2026 v2 final';
    const { inicio, fin } = partirParaRecorte(nombre, 10);
    expect(fin).toBe(nombre.slice(-10));
    expect(inicio + fin).toBe(nombre);
  });

  it('un separador pegado al final no deja un final vacío ni sin sentido', () => {
    const texto = 'C:\\muy\\larga\\' + 'a'.repeat(30) + '\\';
    const { inicio, fin } = partirParaRecorte(texto, 8);
    expect(fin.length).toBeGreaterThan(0);
    expect(inicio + fin).toBe(texto);
  });
});

describe('TextoLargo: legible entero con teclado y copiable', () => {
  const v = fuente('componentes', 'TextoLargo.vue');

  it('si se recorta, es enfocable, abre el globo con el foco y Esc lo cierra', () => {
    expect(v).toContain(':tabindex="recortado ? 0 : undefined"');
    expect(v).toContain('@focus="mostrar"');
    expect(v).toContain('@blur="visible = false"');
    expect(v).toContain('@keydown.esc="visible = false"');
    expect(v).toContain(':aria-label="recortado ? texto : undefined"');
    expect(v).toContain('trigger="manual"');
  });

  it('si cambia el texto, vuelve a medir (ya no queda enfocable ni con globo por un texto anterior)', () => {
    expect(v).toMatch(/watch\(\s*\(\) => props\.texto,\s*\(\) => nextTick\(medir\),?\s*\)/);
    expect(v).toMatch(/import {[^}]*nextTick[^}]*watch[^}]*} from 'vue'/s);
  });

  it('el final nunca se encoge y el inicio sí, con puntos suspensivos', () => {
    expect(v).toMatch(/\.inicio \{[^}]*text-overflow: ellipsis/);
    expect(v).toMatch(/\.fin \{[^}]*flex-shrink: 0/);
  });

  it('el botón copiar tiene etiqueta en los 16 idiomas (mínimo menor en zh, ja y ko)', () => {
    expect(v).toContain('api().sistema.copiar(props.texto)');
    for (const [id, d] of Object.entries(diccionarios)) {
      expect(grafemas(d.acciones.copiarCompleto), id).toBeGreaterThan(minimo(id, 5));
    }
  });

  it('Agentes (ruta y archivo de configuración) y el nombre del proyecto lo usan', () => {
    const agente = fuente('componentes', 'TarjetaAgente.vue');
    expect(agente).toContain('<TextoLargo :texto="a.ruta ?? \'\'" mono />');
    expect(agente).toContain('<TextoLargo :texto="a.archivoConfig" mono />');
    expect(fuente('componentes', 'TarjetaProyecto.vue')).toMatch(
      /<TextoLargo :texto="nombre"[^>]*:copiable="false"/,
    );
  });
});

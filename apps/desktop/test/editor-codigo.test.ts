import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { MAX_BYTES_EDITOR } from '@pel/core';
import { es } from '../src/renderer/i18n/es';
import { en } from '../src/renderer/i18n/en';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';
import { RutasElegidas, validarAbrirEditor, validarGuardarEditor } from '../src/main/validacion';

const dir = mkdtempSync(join(tmpdir(), 'pel-editor-val-'));
const archivo = join(dir, 'a.txt');
writeFileSync(archivo, 'x');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const huella = { tamano: 1, mtimeMs: 1700000000000.5, hash: 'a'.repeat(64) };
const guardado = {
  contenido: 'hola',
  huella,
  eol: 'lf',
  bom: false,
  confirmado: true,
};

function elegidas(): RutasElegidas {
  const e = new RutasElegidas();
  e.registrar(archivo);
  return e;
}

describe('editor de código: validación del proceso principal (D43)', () => {
  it('solo abre rutas que salieron de un diálogo', () => {
    expect(() => validarAbrirEditor(archivo, {}, new RutasElegidas())).toThrow(/diálogo/);
    expect(() => validarAbrirEditor(join(dir, 'otra.txt'), {}, elegidas())).toThrow(/diálogo/);
    expect(validarAbrirEditor(archivo, {}, elegidas())).toEqual({ ruta: archivo, opciones: {} });
    expect(validarAbrirEditor(archivo, { confirmadoRiesgo: true }, elegidas()).opciones).toEqual({
      confirmadoRiesgo: true,
    });
  });

  it('abrir rechaza claves de más y confirmadoRiesgo que no es booleano', () => {
    expect(() => validarAbrirEditor(archivo, { ruta: 'C:/otra' }, elegidas())).toThrow();
    expect(() => validarAbrirEditor(archivo, { confirmadoRiesgo: 'si' }, elegidas())).toThrow();
  });

  it('solo guarda rutas elegidas y deja pasar `confirmado` tal cual para que lo exija el núcleo', () => {
    expect(() => validarGuardarEditor(archivo, guardado, new RutasElegidas())).toThrow(/diálogo/);
    const v = validarGuardarEditor(archivo, guardado, elegidas());
    expect(v.ruta).toBe(archivo);
    expect(v.opciones.confirmado).toBe(true);
    // Sin `confirmado` no se inventa uno: llega `undefined` y el núcleo rechaza con editor.sin_confirmar.
    const sin = validarGuardarEditor(archivo, { ...guardado, confirmado: undefined }, elegidas());
    expect(sin.opciones.confirmado).toBeUndefined();
  });

  it('guardar acota el contenido, la huella y las banderas', () => {
    const e = elegidas();
    const malos: unknown[] = [
      { ...guardado, contenido: 5 },
      { ...guardado, contenido: 'a'.repeat(MAX_BYTES_EDITOR + 1) },
      { ...guardado, huella: { ...huella, hash: 'xyz' } },
      { ...guardado, huella: { ...huella, tamano: -1 } },
      { ...guardado, huella: { ...huella, mtimeMs: Number.NaN } },
      { ...guardado, huella: { ...huella, extra: 1 } },
      { ...guardado, eol: 'cr' },
      { ...guardado, bom: 'no' },
      { ...guardado, sobrescribir: 1 },
      { ...guardado, ruta: 'C:/otra' },
      null,
    ];
    for (const m of malos) expect(() => validarGuardarEditor(archivo, m, e)).toThrow();
  });
});

describe('editor de código: textos en los cuatro idiomas (D43)', () => {
  const CLAVES_CM = [
    'Control character',
    'Selection deleted',
    'Go to line',
    'go',
    'Find',
    'Replace',
    'next',
    'previous',
    'all',
    'match case',
    'regexp',
    'by word',
    'replace',
    'replace all',
    'close',
    'current match',
    'on line',
    'replaced match on line $',
    'replaced $ matches',
    'folded code',
    'unfold',
    'to',
  ];

  it('la herramienta, sus textos y las frases de CodeMirror existen en es, en, pt y fr', () => {
    for (const [id, d] of Object.entries({ es, en, pt, fr })) {
      expect(d.herramientas.lista.editor.nombre.length, id).toBeGreaterThan(3);
      expect(d.herramientas.lista.editor.descripcion.length, id).toBeGreaterThan(10);
      for (const k of CLAVES_CM)
        expect(d.editorCodigo.cm[k as keyof typeof d.editorCodigo.cm], `${id}:${k}`).toBeTruthy();
      expect(d.editorCodigo.refuerzo.instruccion('x.txt'), id).toContain('x.txt');
      expect(d.editorCodigo.confirmarGuardar.texto('x.txt'), id).toContain('x.txt');
    }
  });

  it('en francés se usa «vous», nunca el tuteo', () => {
    const patrones = [
      /(?<![\p{L}\p{N}_'’-])(?:tu|ton|ta|tes|te|toi)(?![\p{L}\p{N}_-])/giu,
      /(?<![\p{L}\p{N}_])t['’](?=\p{L})/giu,
      /-(?:toi|tu)(?![\p{L}\p{N}_])/giu,
    ];
    const codigos = Object.entries(fr.errores.codigos)
      .filter(([k]) => k.startsWith('editor.'))
      .map(([, v]) => v);
    const textos = JSON.stringify([
      fr.editorCodigo.intro(2),
      fr.editorCodigo,
      fr.herramientas.lista.editor,
      codigos,
    ]);
    for (const p of patrones) expect(textos.match(p) ?? []).toEqual([]);
    expect(textos).toMatch(/vous/i);
  });
});

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { ErrorWolf, MAX_BYTES_EDITOR } from '@pel/core';
import { es } from '../src/renderer/i18n/es';
import { en } from '../src/renderer/i18n/en';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
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
  e.registrar(archivo, 'editor');
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

  it('una ruta elegida para otra cosa (abrir) no vale para el editor, ni al revés', () => {
    const solo = new RutasElegidas();
    solo.registrar(archivo, 'abrir');
    expect(() => validarAbrirEditor(archivo, {}, solo)).toThrow(/diálogo/);
    expect(() => validarGuardarEditor(archivo, guardado, solo)).toThrow(/diálogo/);
    const ed = elegidas();
    expect(ed.tiene(archivo, 'abrir')).toBe(false);
  });

  it('guardar acepta eol mixto y aceptarNormalizar booleano', () => {
    const v = validarGuardarEditor(
      archivo,
      { ...guardado, eol: 'mixto', aceptarNormalizar: true },
      elegidas(),
    );
    expect(v.opciones.eol).toBe('mixto');
    expect(v.opciones.aceptarNormalizar).toBe(true);
    expect(() =>
      validarGuardarEditor(archivo, { ...guardado, aceptarNormalizar: 'si' }, elegidas()),
    ).toThrow();
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
      for (const k of [
        d.editorCodigo.enlaceDuro,
        d.editorCodigo.saltosMixtos.aviso,
        d.editorCodigo.saltosMixtos.aceptar,
        d.editorCodigo.envGestor.aviso,
        d.editorCodigo.envGestor.boton,
        d.editorCodigo.huellaPerdida,
      ]) {
        expect(k.length, id).toBeGreaterThan(10);
      }
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

describe('rutas editorCodigo.* (D43)', () => {
  type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

  function preparar(guardar: (...a: unknown[]) => Promise<unknown>) {
    const canales = new Map<string, Manejador>();
    const ipcMain: IpcMainLike = {
      handle: (canal, fn) => void canales.set(canal, fn as Manejador),
    };
    const nucleo = {
      eventos: { on: () => () => undefined },
      abrirArchivoEditor: vi.fn(async () => ({
        estado: 'confirmar',
        nombre: 'a.txt',
        riesgos: ['secreto'],
      })),
      guardarArchivoEditor: vi.fn(guardar),
    } as unknown as NucleoIpc;
    const ventana: VentanaLike = {
      isDestroyed: () => false,
      webContents: { send: () => undefined },
    };
    const sistema = {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(async () => archivo),
      abrirUrl: vi.fn(),
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(async () => '1'),
      guardarArchivo: vi.fn(async () => null),
      elegirArchivos: vi.fn(async () => []),
    };
    registrarIpc(nucleo, ipcMain, ventana, sistema, undefined, undefined, {});
    const llamar = (ruta: string, ...a: unknown[]): unknown =>
      canales.get(`entorno:${ruta}`)!({}, ...a);
    return { llamar, nucleo };
  }

  it('la ruta tiene que salir del diálogo: sin elegirla antes, ni abrir ni guardar llegan al núcleo', async () => {
    const t = preparar(async () => ({ huella, copia: 'c' }));
    expect(await t.llamar('editorCodigo.abrir', archivo, {})).toMatchObject({ ok: false });
    expect(await t.llamar('editorCodigo.guardar', archivo, guardado)).toMatchObject({ ok: false });
    expect(t.nucleo.abrirArchivoEditor).not.toHaveBeenCalled();
    expect(t.nucleo.guardarArchivoEditor).not.toHaveBeenCalled();
    await t.llamar('editorCodigo.elegir');
    expect(await t.llamar('editorCodigo.abrir', archivo, {})).toMatchObject({
      ok: true,
      valor: { estado: 'confirmar' },
    });
  });

  it('guardar devuelve el resultado, y los dos rechazos que la ventana resuelve salen tipados', async () => {
    const casos: [string, Error | null, unknown][] = [
      ['guardado', null, { estado: 'guardado', huella, copia: 'c' }],
      ['cambiado', new ErrorWolf('editor.archivo_cambiado', 'x'), { estado: 'cambiado' }],
      [
        'reforzar',
        new ErrorWolf('editor.confirmacion_reforzada', 'x', { riesgos: 'secreto,enlace-duro' }),
        { estado: 'reforzar', riesgos: ['secreto', 'enlace-duro'] },
      ],
      ['normalizar', new ErrorWolf('editor.eol_mixto', 'x'), { estado: 'normalizar' }],
    ];
    for (const [nombre, error, esperado] of casos) {
      const t = preparar(async () => {
        if (error) throw error;
        return { huella, copia: 'c' };
      });
      await t.llamar('editorCodigo.elegir');
      expect(await t.llamar('editorCodigo.guardar', archivo, guardado), nombre).toEqual({
        ok: true,
        valor: esperado,
      });
    }
  });

  it('cualquier otro error del núcleo sigue siendo un error (con su código)', async () => {
    const t = preparar(async () => {
      throw new ErrorWolf('editor.archivo_env', 'No se edita.');
    });
    await t.llamar('editorCodigo.elegir');
    expect(await t.llamar('editorCodigo.guardar', archivo, guardado)).toMatchObject({
      ok: false,
      error: { codigo: 'editor.archivo_env' },
    });
  });
});

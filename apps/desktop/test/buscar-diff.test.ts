import { fork } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { ErrorWolf, esErrorWolf, type MensajeDiff } from '@pel/core';
import { es } from '../src/renderer/i18n/es';
import { en } from '../src/renderer/i18n/en';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
import type { ProcesoTrabajo } from '../src/main/conversorSupervisor';
import { crearEjecutorDiffSupervisado } from '../src/main/diffSupervisor';
import { crearSalida, SALIDA_APAGAR, type VentanaSalida } from '../src/main/salida';

/** D44: Buscar pulido y Diff de carpetas en el proceso principal, más M-A y M-C. */
const dir = mkdtempSync(join(tmpdir(), 'pel-d44-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const archivo = join(dir, 'a.txt');
writeFileSync(archivo, 'x');

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function preparar(nucleoExtra: Record<string, unknown> = {}) {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (canal, fn) => void canales.set(canal, fn as Manejador) };
  const nucleo = {
    eventos: { on: () => () => undefined },
    abrirArchivoEditor: vi.fn(async () => ({ estado: 'abierto' })),
    rutaDeResultadoBusqueda: vi.fn(async () => archivo),
    diffCarpetas: {
      comparar: vi.fn(async () => ({ id: 'c1' })),
      cancelar: vi.fn(() => true),
      archivo: vi.fn(async () => ({ tipo: 'binario' })),
      rutaParaEditor: vi.fn(async () => archivo),
    },
    ...nucleoExtra,
  } as unknown as NucleoIpc;
  const ventana: VentanaLike = { isDestroyed: () => false, webContents: { send: () => undefined } };
  const sistema = {
    elegirCarpeta: vi.fn(async () => dir),
    elegirArchivo: vi.fn(async () => archivo),
    abrirUrl: vi.fn(),
    abrirCarpeta: vi.fn(),
    copiar: vi.fn(),
    version: vi.fn(async () => '1'),
    guardarArchivo: vi.fn(async () => null),
    elegirArchivos: vi.fn(async () => []),
  };
  const cambios: boolean[] = [];
  registrarIpc(nucleo, ipcMain, ventana, sistema, undefined, undefined, {
    alCambiarEditorSinGuardar: (b) => void cambios.push(b),
  });
  const llamar = (ruta: string, ...a: unknown[]) =>
    canales.get(`entorno:${ruta}`)!({}, ...a) as Promise<{
      ok: boolean;
      valor?: unknown;
      error?: { codigo?: string };
    }>;
  return { llamar, nucleo, cambios };
}

describe('buscar.prepararEditor (D44)', () => {
  it('registra la ruta del resultado del núcleo con el propósito editor y el editor la acepta', async () => {
    const t = preparar();
    // Antes de preparar, el editor no acepta esa ruta.
    expect(await t.llamar('editorCodigo.abrir', archivo, {})).toMatchObject({ ok: false });
    const r = await t.llamar('buscar.prepararEditor', 'b1', 3);
    expect(r).toEqual({ ok: true, valor: archivo });
    expect(t.nucleo.rutaDeResultadoBusqueda).toHaveBeenCalledWith('b1', 3);
    expect(await t.llamar('editorCodigo.abrir', archivo, {})).toMatchObject({ ok: true });
  });

  it('una ruta (o cualquier cosa que no sea un número) en lugar del id del resultado se rechaza sin tocar el núcleo', async () => {
    const t = preparar();
    for (const malo of [archivo, '3', -1, 0, 1.5, null, {}, 2_000_000]) {
      expect((await t.llamar('buscar.prepararEditor', 'b1', malo)).ok, String(malo)).toBe(false);
    }
    for (const malo of [archivo.repeat(10), '', 7, null]) {
      expect((await t.llamar('buscar.prepararEditor', malo, 1)).ok).toBe(false);
    }
    expect(t.nucleo.rutaDeResultadoBusqueda).not.toHaveBeenCalled();
    // Y nada quedó registrado para el editor.
    expect(await t.llamar('editorCodigo.abrir', archivo, {})).toMatchObject({ ok: false });
  });

  it('un resultado caducado sale como error con su código y no registra nada', async () => {
    const t = preparar({
      rutaDeResultadoBusqueda: vi.fn(async () => {
        throw new ErrorWolf('buscar.resultado_caducado', 'caducó');
      }),
    });
    expect(await t.llamar('buscar.prepararEditor', 'b1', 1)).toMatchObject({
      ok: false,
      error: { codigo: 'buscar.resultado_caducado' },
    });
    expect(await t.llamar('editorCodigo.abrir', archivo, {})).toMatchObject({ ok: false });
  });

  it('buscar.iniciar acepta contexto y incluirPesadas, y los valida', async () => {
    const t = preparar({
      iniciarBusqueda: vi.fn(() => 'b1'),
      sitios: { listar: vi.fn(async () => [{ id: 's1', carpeta: dir }]) },
    });
    const base = {
      sitioId: 's1',
      consulta: 'x',
      modo: 'ambos',
      regex: false,
      mayusculas: false,
      incluir: [],
      excluir: [],
    };
    expect(
      (await t.llamar('buscar.iniciar', { ...base, contexto: 3, incluirPesadas: true })).ok,
    ).toBe(true);
    expect(t.nucleo.iniciarBusqueda).toHaveBeenCalledWith(
      expect.objectContaining({ contexto: 3, incluirPesadas: true }),
    );
    for (const malo of [{ contexto: 6 }, { contexto: 1.5 }, { incluirPesadas: 'si' }]) {
      expect((await t.llamar('buscar.iniciar', { ...base, ...malo })).ok).toBe(false);
    }
    // La ventana no puede imponer las carpetas vetadas ni quitarlas.
    await t.llamar('buscar.iniciar', { ...base, vetadas: ['C:/'] });
    const llamada = (t.nucleo.iniciarBusqueda as unknown as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    )![0] as Record<string, unknown>;
    expect(llamada['vetadas']).toBeUndefined();
  });
});

describe('diffCarpetas.* (D44)', () => {
  it('las carpetas salen de un diálogo; sin elegirlas, el núcleo no se toca', async () => {
    const t = preparar();
    expect((await t.llamar('diffCarpetas.comparar', dir, dir)).ok).toBe(false);
    expect(t.nucleo.diffCarpetas.comparar).not.toHaveBeenCalled();
    await t.llamar('sistema.elegirCarpeta');
    expect(await t.llamar('diffCarpetas.comparar', dir, dir)).toEqual({
      ok: true,
      valor: { id: 'c1' },
    });
    expect((await t.llamar('diffCarpetas.comparar', dir, join(dir, 'otra'))).ok).toBe(false);
    expect((await t.llamar('diffCarpetas.comparar', 5, dir)).ok).toBe(false);
  });

  it('archivo y prepararEditor usan números, nunca rutas, y validan el lado', async () => {
    const t = preparar();
    expect((await t.llamar('diffCarpetas.archivo', 'c1', 4)).ok).toBe(true);
    expect(t.nucleo.diffCarpetas.archivo).toHaveBeenCalledWith('c1', 4);
    for (const malo of [archivo, '4', 0, -2, 0.5]) {
      expect((await t.llamar('diffCarpetas.archivo', 'c1', malo)).ok).toBe(false);
    }
    expect((await t.llamar('diffCarpetas.prepararEditor', 'c1', archivo, 'a')).ok).toBe(false);
    expect((await t.llamar('diffCarpetas.prepararEditor', 'c1', 1, 'c')).ok).toBe(false);
    expect((await t.llamar('diffCarpetas.prepararEditor', 'c1', 1, archivo)).ok).toBe(false);
    expect(t.nucleo.diffCarpetas.rutaParaEditor).not.toHaveBeenCalled();
    expect(await t.llamar('editorCodigo.abrir', archivo, {})).toMatchObject({ ok: false });
    expect(await t.llamar('diffCarpetas.prepararEditor', 'c1', 1, 'b')).toEqual({
      ok: true,
      valor: archivo,
    });
    expect(await t.llamar('editorCodigo.abrir', archivo, {})).toMatchObject({ ok: true });
  });

  it('cancelar llega al servicio', async () => {
    const t = preparar();
    expect(await t.llamar('diffCarpetas.cancelar')).toEqual({ ok: true, valor: true });
  });
});

describe('editorCodigo.avisarCambios (M-A)', () => {
  it('pasa el aviso al proceso principal y solo acepta booleanos', async () => {
    const t = preparar();
    expect((await t.llamar('editorCodigo.avisarCambios', true)).ok).toBe(true);
    expect((await t.llamar('editorCodigo.avisarCambios', false)).ok).toBe(true);
    expect((await t.llamar('editorCodigo.avisarCambios', 'si')).ok).toBe(false);
    expect((await t.llamar('editorCodigo.avisarCambios')).ok).toBe(false);
    expect(t.cambios).toEqual([true, false]);
  });
});

describe('Salir de la bandeja con cambios sin guardar (M-A)', () => {
  function ventana(): VentanaSalida {
    return {
      isDestroyed: () => false,
      isMinimized: () => false,
      restore: () => undefined,
      show: () => undefined,
      focus: () => undefined,
      moveTop: () => undefined,
      setAlwaysOnTop: () => undefined,
    };
  }

  it('pregunta antes de apagar nada; si el usuario sigue editando, no sale', async () => {
    const preguntar = vi.fn(async () => SALIDA_APAGAR);
    const terminar = vi.fn(async () => undefined);
    const preguntarSinGuardar = vi.fn(async () => false);
    await crearSalida({
      ventana,
      saliendo: () => false,
      preguntar,
      terminar,
      sinGuardar: () => true,
      preguntarSinGuardar,
    }).salir();
    expect(preguntarSinGuardar).toHaveBeenCalledTimes(1);
    expect(preguntar).not.toHaveBeenCalled();
    expect(terminar).not.toHaveBeenCalled();
  });

  it('si acepta perder los cambios, sigue con la pregunta de apagar y sale', async () => {
    const orden: string[] = [];
    const salida = crearSalida({
      ventana,
      saliendo: () => false,
      sinGuardar: () => true,
      preguntarSinGuardar: async () => {
        orden.push('sinGuardar');
        return true;
      },
      preguntar: async () => {
        orden.push('apagar');
        return SALIDA_APAGAR;
      },
      terminar: async (d) => void orden.push(`terminar:${d}`),
    });
    await salida.salir();
    expect(orden).toEqual(['sinGuardar', 'apagar', 'terminar:true']);
  });

  it('sin cambios no hay pregunta extra, y un error del diálogo no deja salir', async () => {
    const preguntarSinGuardar = vi.fn(async () => true);
    const terminar = vi.fn(async () => undefined);
    await crearSalida({
      ventana,
      saliendo: () => false,
      sinGuardar: () => false,
      preguntarSinGuardar,
      preguntar: async () => SALIDA_APAGAR,
      terminar,
    }).salir();
    expect(preguntarSinGuardar).not.toHaveBeenCalled();
    expect(terminar).toHaveBeenCalledWith(true);
    terminar.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await crearSalida({
      ventana,
      saliendo: () => false,
      sinGuardar: () => true,
      preguntarSinGuardar: async () => {
        throw new Error('sin diálogo');
      },
      preguntar: async () => SALIDA_APAGAR,
      terminar,
    }).salir();
    expect(terminar).not.toHaveBeenCalled();
  });

  it('el cierre de sesión del sistema nunca pasa por esta pregunta', async () => {
    const { readFileSync } = await import('node:fs');
    const fuente = readFileSync(join(__dirname, '..', 'src', 'main', 'index.ts'), 'utf8');
    const i = fuente.indexOf('function cerrarPorSistema');
    const cuerpo = fuente.slice(i, fuente.indexOf('const salida = crearSalida'));
    expect(cuerpo).not.toMatch(/sinGuardar|editorSinGuardar|showMessageBox/);
  });
});

/* ───────────── Supervisor del diff ───────────── */

const MSG: MensajeDiff = {
  op: 'carpetas',
  a: 'a',
  b: 'b',
  vetadas: [],
  lim: {
    archivosPorLado: 1,
    profundidad: 1,
    bytesPorArchivo: 1,
    bytesTotales: 1,
    entradasPorGrupo: 1,
    bytesTexto: 1,
    filasDiff: 1,
    cambiosMaximos: 1,
    plazoMs: 1,
  },
};

const MSG_ARCHIVO: MensajeDiff = {
  op: 'archivo',
  a: 'a',
  b: 'b',
  rel: 'x.txt',
  sitios: [],
  lim: MSG.lim,
};

async function codigoDe(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (esErrorWolf(e)) return e.codigo;
    throw e;
  }
  return 'sin-error';
}

class Falso implements ProcesoTrabajo {
  pid = 4242;
  matado = false;
  private alMensaje: (m: unknown) => void = () => undefined;
  postMessage(): void {}
  onMessage(cb: (m: unknown) => void): void {
    this.alMensaje = cb;
  }
  onExit(): void {}
  kill(): void {
    this.matado = true;
  }
  contestar(r: unknown): void {
    this.alMensaje(r);
  }
}

describe('supervisor del diff (D44)', () => {
  it('devuelve lo que contesta el proceso y lo termina; rechaza respuestas con forma inválida', async () => {
    const p = new Falso();
    const ejecutar = crearEjecutorDiffSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const r = ejecutar(MSG_ARCHIVO, { plazoMs: 5000 });
    p.contestar({ ok: true, datos: { tipo: 'binario' } });
    expect(await r).toEqual({ ok: true, datos: { tipo: 'binario' } });
    expect(p.matado).toBe(true);
    for (const mala of [null, 'x', { ok: true }, { ok: false, codigo: 'inventado.x' }, { ok: 1 }]) {
      const q = new Falso();
      const e = crearEjecutorDiffSupervisado({ lanzar: () => q, memoriaDe: () => 1 });
      const pr = e(MSG, { plazoMs: 5000 });
      q.contestar(mala);
      expect(await codigoDe(pr)).toBe('diff.fallo');
    }
  });

  it('cancelar mata el proceso con su PID; el plazo y la memoria también', async () => {
    const p = new Falso();
    const control = new AbortController();
    const ejecutar = crearEjecutorDiffSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const r = ejecutar(MSG, { plazoMs: 5000, senal: control.signal });
    control.abort();
    expect(await codigoDe(r)).toBe('diff.cancelado');
    expect(p.matado).toBe(true);
    const p2 = new Falso();
    const e2 = crearEjecutorDiffSupervisado({ lanzar: () => p2, memoriaDe: () => 1 });
    expect(await codigoDe(e2(MSG, { plazoMs: 30 }))).toBe('diff.plazo');
    expect(p2.matado).toBe(true);
    const p3 = new Falso();
    const e3 = crearEjecutorDiffSupervisado({
      lanzar: () => p3,
      memoriaDe: () => 10 * 1024 * 1024 * 1024,
      intervaloMs: 5,
    });
    expect(await codigoDe(e3(MSG, { plazoMs: 5000 }))).toBe('diff.memoria');
    expect(p3.matado).toBe(true);
    // Ya cancelada de antemano: ni siquiera lanza el proceso.
    const lanzar = vi.fn(() => new Falso());
    control.abort();
    expect(
      await codigoDe(
        crearEjecutorDiffSupervisado({ lanzar, memoriaDe: () => 1 })(MSG, {
          plazoMs: 1000,
          senal: control.signal,
        }),
      ),
    ).toBe('diff.cancelado');
    expect(lanzar).not.toHaveBeenCalled();
  });

  it('solo una operación a la vez', async () => {
    const p = new Falso();
    const ejecutar = crearEjecutorDiffSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const primera = ejecutar(MSG_ARCHIVO, { plazoMs: 5000 });
    expect(await codigoDe(ejecutar(MSG_ARCHIVO, { plazoMs: 5000 }))).toBe('diff.ocupado');
    p.contestar({ ok: true, datos: { tipo: 'binario' } });
    await primera;
    const q = new Falso();
    const otra = crearEjecutorDiffSupervisado({ lanzar: () => q, memoriaDe: () => 1 });
    const x = otra(MSG_ARCHIVO, { plazoMs: 5000 });
    q.contestar({ ok: true, datos: { tipo: 'binario' } });
    await x;
  });
});

describe('el diff corre FUERA del proceso principal (proceso real)', () => {
  const vivo = (pid: number): boolean => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };
  function real(codigo: string) {
    const script = join(dir, `trabajo-${Math.random().toString(36).slice(2)}.cjs`);
    writeFileSync(script, codigo);
    let pidHijo: number | undefined;
    return {
      pid: () => pidHijo,
      lanzar: (): ProcesoTrabajo => {
        const hijo = fork(script, [], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
        pidHijo = hijo.pid;
        return {
          get pid() {
            return hijo.pid;
          },
          postMessage: (m) => hijo.send(m as never),
          onMessage: (cb) => void hijo.on('message', cb),
          onExit: (cb) => void hijo.on('exit', cb),
          kill: () => void hijo.kill(),
        };
      },
    };
  }

  it('contesta desde otro proceso (otro PID) y el proceso muere al terminar', async () => {
    const r = real(
      `process.on('message', () => process.send({ ok: true, datos: { tipo: 'tope', bytesA: process.pid, bytesB: 0 } }));`,
    );
    const resp = await crearEjecutorDiffSupervisado({ lanzar: r.lanzar, memoriaDe: () => 1 })(
      MSG_ARCHIVO,
      {
        plazoMs: 10_000,
      },
    );
    expect(resp.ok).toBe(true);
    const hijo = (resp as unknown as { datos: { bytesA: number } }).datos.bytesA;
    expect(hijo).not.toBe(process.pid);
    expect(hijo).toBe(r.pid());
    for (let i = 0; i < 50 && vivo(hijo); i++) await new Promise((x) => setTimeout(x, 100));
    expect(vivo(hijo)).toBe(false);
  }, 20_000);

  it('una operación colgada se cancela sin bloquear el proceso principal y el proceso muere', async () => {
    const r = real(`process.on('message', () => { for (;;) {} });`);
    const control = new AbortController();
    const ejecutar = crearEjecutorDiffSupervisado({ lanzar: r.lanzar, memoriaDe: () => 1 });
    const pr = ejecutar(MSG, { plazoMs: 60_000, senal: control.signal });
    // Mientras el trabajo gira sin parar, este proceso sigue respondiendo.
    let latidos = 0;
    const reloj = setInterval(() => latidos++, 20);
    await new Promise((x) => setTimeout(x, 300));
    clearInterval(reloj);
    expect(latidos).toBeGreaterThan(5);
    control.abort();
    expect(await codigoDe(pr)).toBe('diff.cancelado');
    const pid = r.pid()!;
    for (let i = 0; i < 50 && vivo(pid); i++) await new Promise((x) => setTimeout(x, 100));
    expect(vivo(pid)).toBe(false);
  }, 20_000);
});

/* ───────────── i18n ───────────── */

describe('textos de D44 en los cuatro idiomas', () => {
  const idiomas = { es, en, pt, fr };

  it('Buscar pulido, Diff de carpetas y sus errores existen en es, en, pt y fr', () => {
    for (const [id, d] of Object.entries(idiomas)) {
      const b = d.herramientas.busqueda;
      for (const k of [
        b.incluirPesadas,
        b.contexto,
        b.carpeta,
        b.listaAria,
        b.atajos,
        b.sinGrupo,
        b.topeBytes,
        b.grupoNombres(2),
        b.grupoContenido(3),
        b.mostrarMas(5),
        b.linea(7),
      ])
        expect(String(k).length, `${id}:busqueda`).toBeGreaterThan(2);
      expect(b.grupoNombres(2), id).toContain('2');
      expect(d.herramientas.lista.diffCarpetas.nombre.length, id).toBeGreaterThan(3);
      expect(d.herramientas.lista.diffCarpetas.descripcion.length, id).toBeGreaterThan(10);
      const c = d.herramientas.diffCarpetas;
      const planos = Object.entries(c).flatMap(([k, v]) =>
        typeof v === 'string'
          ? [[k, v]]
          : typeof v === 'function'
            ? [[k, (v as (...a: never[]) => string)(...([2, 3, 4] as never[]))]]
            : Object.entries(v).map(([k2, v2]) => [`${k}.${k2}`, String(v2)]),
      );
      for (const [k, v] of planos)
        expect(String(v).length, `${id}:diffCarpetas.${k}`).toBeGreaterThan(1);
      expect(c.saltosDistintos(c.saltos.crlf, c.saltos.lf), id).toContain('CRLF');
      for (const cod of [
        'buscar.ruta_vetada',
        'buscar.resultado_caducado',
        'buscar.resultado_invalido',
        'diff.raiz_invalida',
        'diff.ruta_vetada',
        'diff.cancelado',
        'diff.plazo',
        'diff.memoria',
        'diff.ocupado',
        'diff.caducado',
        'diff.archivo_invalido',
        'diff.fallo',
      ]) {
        expect(
          (d.errores.codigos as Record<string, string | undefined>)[cod]?.length,
          `${id}:${cod}`,
        ).toBeGreaterThan(5);
      }
    }
  });

  it('en francés se usa «vous», nunca el tuteo', () => {
    const patrones = [
      /(?<![\p{L}\p{N}_'’-])(?:tu|ton|ta|tes|te|toi)(?![\p{L}\p{N}_-])/giu,
      /(?<![\p{L}\p{N}_])t['’](?=\p{L})/giu,
      /-(?:toi|tu)(?![\p{L}\p{N}_])/giu,
    ];
    const codigos = Object.entries(fr.errores.codigos)
      .filter(([k]) => k.startsWith('diff.') || k.startsWith('buscar.'))
      .map(([, v]) => v);
    const texto = JSON.stringify([
      fr.herramientas.diffCarpetas,
      fr.herramientas.busqueda,
      fr.herramientas.lista.diffCarpetas,
      fr.editorCodigo.envGestor,
      codigos,
    ]);
    for (const p of patrones) expect(texto.match(p) ?? []).toEqual([]);
    expect(texto).toMatch(/vous/i);
  });

  it('M-C: el botón dice qué .env abre y el aviso aclara que puede no ser el que se intentó abrir', () => {
    expect(es.editorCodigo.envGestor.boton).toMatch(/\.env de la raíz/);
    expect(es.editorCodigo.envGestor.aviso).toMatch(/puede no ser/);
    expect(en.editorCodigo.envGestor.boton).toMatch(/\.env in the project root/);
    expect(en.editorCodigo.envGestor.aviso).toMatch(/may not be/);
    expect(pt.editorCodigo.envGestor.boton).toMatch(/\.env da raiz/);
    expect(pt.editorCodigo.envGestor.aviso).toMatch(/pode não ser/);
    expect(fr.editorCodigo.envGestor.boton).toMatch(/\.env à la racine/);
    expect(fr.editorCodigo.envGestor.aviso).toMatch(/n’est peut-être pas/);
  });

  it('los textos de salir con cambios sin guardar de main existen en los cuatro idiomas', async () => {
    const { textosMain } = await import('../src/main/textos');
    for (const id of ['es', 'en', 'pt', 'fr'] as const) {
      const t = textosMain(id);
      for (const k of [
        t.sinGuardarTitulo,
        t.sinGuardarTexto,
        t.sinGuardarSalir,
        t.sinGuardarSeguir,
      ])
        expect(k.length, id).toBeGreaterThan(5);
    }
  });
});

/* ───────────── Segunda ronda ───────────── */

describe('M-3: el supervisor valida la forma de lo que contesta el trabajador', () => {
  const entrada = { ruta: 'a/b.txt', tamanoA: 1, tamanoB: null };
  const resumen = {
    archivosA: 1,
    archivosB: 0,
    iguales: 0,
    sinComparar: 0,
    omitidos: 0,
    truncado: false,
    recortado: false,
    totalSoloA: 1,
    totalSoloB: 0,
    totalDistintos: 0,
  };
  const carpetasOk = { soloA: [entrada], soloB: [], distintos: [], resumen };

  async function responder(op: MensajeDiff['op'], respuesta: unknown): Promise<string> {
    const p = new Falso();
    const ejecutar = crearEjecutorDiffSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const m = { ...MSG, op } as MensajeDiff;
    const pr = ejecutar(m, { plazoMs: 5000 });
    p.contestar(respuesta);
    return codigoDe(pr);
  }

  it('acepta una respuesta bien formada de cada operación', async () => {
    expect(await responder('carpetas', { ok: true, datos: carpetasOk })).toBe('sin-error');
    for (const datos of [
      { tipo: 'binario' },
      { tipo: 'sensible' },
      { tipo: 'tope', bytesA: 1, bytesB: 2 },
      { tipo: 'demasiado-distinto' },
      {
        tipo: 'texto',
        filas: [{ tipo: 'agregada', numA: null, numB: 1, texto: 'x' }],
        agregadas: 1,
        quitadas: 0,
        truncado: false,
        soloSaltos: false,
        saltosA: 'lf',
        saltosB: 'crlf',
      },
    ]) {
      expect(await responder('archivo', { ok: true, datos })).toBe('sin-error');
    }
  });

  it('rechaza arrays que no lo son, rutas que no son texto y tipos inventados', async () => {
    const malas: unknown[] = [
      { ...carpetasOk, soloA: 'no-es-array' },
      { ...carpetasOk, soloA: [{ ...entrada, ruta: 42 }] },
      { ...carpetasOk, distintos: [{ ...entrada, ruta: '' }] },
      { ...carpetasOk, soloB: [{ ...entrada, tamanoA: 'grande' }] },
      { ...carpetasOk, soloA: Array.from({ length: 5001 }, () => entrada) },
      { ...carpetasOk, resumen: { ...resumen, truncado: 'si' } },
      { ...carpetasOk, resumen: null },
      { soloA: [], soloB: [] },
    ];
    for (const datos of malas) {
      expect(await responder('carpetas', { ok: true, datos }), JSON.stringify(datos)).toBe(
        'diff.fallo',
      );
    }
    for (const datos of [
      { tipo: 'inventado' },
      { tipo: 'tope', bytesA: 'x', bytesB: 2 },
      { tipo: 'texto', filas: 'no' },
      {
        tipo: 'texto',
        filas: [{ tipo: 'agregada', numA: null, numB: 1, texto: 7 }],
        agregadas: 1,
        quitadas: 0,
        truncado: false,
        soloSaltos: false,
        saltosA: 'lf',
        saltosB: 'lf',
      },
    ]) {
      expect(await responder('archivo', { ok: true, datos }), JSON.stringify(datos)).toBe(
        'diff.fallo',
      );
    }
    // Una respuesta de archivo no vale para una comparación de carpetas, ni al revés.
    expect(await responder('carpetas', { ok: true, datos: { tipo: 'binario' } })).toBe(
      'diff.fallo',
    );
    expect(await responder('archivo', { ok: true, datos: carpetasOk })).toBe('diff.fallo');
  });
});

describe('M-6: el aviso de cambios sin guardar se reinicia al recargar o si muere la ventana', () => {
  it('did-navigate (navegación confirmada) y render-process-gone ponen editorSinGuardar a false', async () => {
    const { readFileSync } = await import('node:fs');
    const fuente = readFileSync(join(__dirname, '..', 'src', 'main', 'index.ts'), 'utf8');
    expect(fuente).toMatch(/on\('did-navigate', \(\) => \{\s*editorSinGuardar = false;/);
    // No se reinicia al EMPEZAR la navegación: si el usuario cancela el aviso, el editor sigue vivo.
    expect(fuente).not.toMatch(/did-start-navigation/);
    expect(fuente).toMatch(/on\('render-process-gone', \(\) => \{\s*editorSinGuardar = false;/);
  });
});

describe('Segunda ronda: textos y IPC', () => {
  it('el aviso de archivo sensible existe en los cuatro idiomas, en Buscar y en el diff', () => {
    for (const [id, d] of Object.entries({ es, en, pt, fr })) {
      expect(d.herramientas.busqueda.sensible(7), id).toContain('7');
      expect(d.herramientas.diffCarpetas.sensible.length, id).toBeGreaterThan(30);
    }
  });

  it('M-9: el texto de «solo saltos» cubre también el salto del final del archivo', () => {
    expect(es.herramientas.diffCarpetas.soloSaltos).toMatch(/final del archivo/);
    expect(en.herramientas.diffCarpetas.soloSaltos).toMatch(/end of the file/);
    expect(pt.herramientas.diffCarpetas.soloSaltos).toMatch(/fim do arquivo/);
    expect(fr.herramientas.diffCarpetas.soloSaltos).toMatch(/fin du fichier/);
  });

  it('buscar.iniciar ignora un `sitios` o `vetadas` puesto por la ventana', async () => {
    const t = preparar({
      iniciarBusqueda: vi.fn(() => 'b1'),
      sitios: { listar: vi.fn(async () => [{ id: 's1', carpeta: dir }]) },
    });
    await t.llamar('buscar.iniciar', {
      sitioId: 's1',
      consulta: 'x',
      modo: 'ambos',
      regex: false,
      mayusculas: false,
      incluir: [],
      excluir: [],
      sitios: 'cualquier-cosa',
      vetadas: [],
    });
    const llamada = (t.nucleo.iniciarBusqueda as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as Record<string, unknown>;
    expect(llamada['sitios']).toBeUndefined();
    expect(llamada['vetadas']).toBeUndefined();
  });
});

import { fork } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
  esErrorWolf,
  LIMITES_USO_DISCO,
  operarUsoDisco,
  type MensajeUsoDisco,
  type ProgresoUsoDisco,
} from '@pel/core';
import type { ProcesoTrabajo } from '../src/main/conversorSupervisor';
import { crearEjecutorUsoDiscoSupervisado } from '../src/main/discoSupervisor';
import { es } from '../src/renderer/i18n/es';
import { en } from '../src/renderer/i18n/en';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';

/** D51: supervisor del proceso de trabajo de «Uso del disco» y sus textos. */
const dir = mkdtempSync(join(tmpdir(), 'pel-d51-app-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const MSG: MensajeUsoDisco = { op: 'escanear', raiz: dir, lim: { ...LIMITES_USO_DISCO } };

const codigoDe = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
  } catch (e) {
    if (esErrorWolf(e)) return e.codigo;
    throw e;
  }
  return 'sin-error';
};

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
  decir(m: unknown): void {
    this.alMensaje(m);
  }
}

const arbolMinimo = { nombre: 'x', tipo: 'carpeta', tamano: 0, archivos: 0 };
const resultadoMinimo = {
  raiz: 'C:\\x',
  total: 0,
  archivos: 0,
  carpetas: 0,
  duracionMs: 1,
  truncado: false,
  enlacesDurosIncompleto: false,
  omitidos: { enlaces: 0, denegados: 0, especiales: 0, enlacesDuros: 0 },
  enlaces: [],
  arbol: arbolMinimo,
  archivosTop: [],
  carpetasTop: [],
  extensiones: { lista: [], otros: { bytes: 0, archivos: 0 } },
};

describe('supervisor de Uso del disco (D51)', () => {
  it('reenvía el progreso, devuelve el resultado y termina el proceso', async () => {
    const p = new Falso();
    const vistas: ProgresoUsoDisco[] = [];
    const ejecutar = crearEjecutorUsoDiscoSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const r = ejecutar(MSG, { plazoMs: 5000, alProgreso: (x) => vistas.push(x) });
    p.decir({ tipo: 'progreso', archivos: 3, carpetas: 1, bytes: 9, actual: 'C:\\x' });
    expect(p.matado).toBe(false);
    p.decir({ tipo: 'fin', ok: true, datos: resultadoMinimo });
    expect(await r).toEqual({ ok: true, datos: resultadoMinimo });
    expect(vistas).toEqual([{ archivos: 3, carpetas: 1, bytes: 9, actual: 'C:\\x' }]);
    expect(p.matado).toBe(true);
  });

  it('rechaza respuestas con forma inválida, árboles enormes o códigos inventados', async () => {
    const hojas = Array.from({ length: 30_001 }, () => ({ ...arbolMinimo, tipo: 'archivo' }));
    const malas: unknown[] = [
      null,
      'x',
      { tipo: 'fin' },
      { tipo: 'fin', ok: true, datos: {} },
      { tipo: 'fin', ok: true, datos: { ...resultadoMinimo, total: -1 } },
      {
        tipo: 'fin',
        ok: true,
        datos: { ...resultadoMinimo, arbol: { ...arbolMinimo, hijos: hojas } },
      },
      {
        tipo: 'fin',
        ok: true,
        datos: { ...resultadoMinimo, arbol: { ...arbolMinimo, tipo: 'raro' } },
      },
      { tipo: 'fin', ok: false, codigo: 'inventado.x' },
      { tipo: 'progreso', archivos: 'x' },
      { ok: true, datos: resultadoMinimo },
    ];
    for (const mala of malas) {
      const q = new Falso();
      const e = crearEjecutorUsoDiscoSupervisado({ lanzar: () => q, memoriaDe: () => 1 });
      const pr = e(MSG, { plazoMs: 5000 });
      q.decir(mala);
      expect(await codigoDe(pr)).toBe('disco.fallo');
      expect(q.matado).toBe(true);
    }
  });

  it('acepta rutas largas de Windows (hasta 32 767) en los tops y nodos «otros» con denegados (M1/M2)', async () => {
    const larga = 'C:' + String.fromCharCode(92) + 'x'.repeat(5000);
    const datos = {
      ...resultadoMinimo,
      archivosTop: [{ ruta: larga, tamano: 5 }],
      carpetasTop: [{ ruta: larga, tamano: 5, archivos: 1 }],
      enlaces: [larga],
      arbol: {
        ...arbolMinimo,
        hijos: [{ nombre: '', tipo: 'otros', tamano: 0, archivos: 0, denegados: 300 }],
      },
    };
    const p = new Falso();
    const e = crearEjecutorUsoDiscoSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const pr = e(MSG, { plazoMs: 5000 });
    p.decir({ tipo: 'fin', ok: true, datos });
    expect((await pr).ok).toBe(true);
    // Más de 32 767 sigue rechazándose.
    const q = new Falso();
    const e2 = crearEjecutorUsoDiscoSupervisado({ lanzar: () => q, memoriaDe: () => 1 });
    const pr2 = e2(MSG, { plazoMs: 5000 });
    q.decir({
      tipo: 'fin',
      ok: true,
      datos: { ...datos, archivosTop: [{ ruta: 'x'.repeat(32_768), tamano: 5 }] },
    });
    expect(await codigoDe(pr2)).toBe('disco.fallo');
  });

  it('un error con código del catálogo pasa tal cual', async () => {
    const p = new Falso();
    const e = crearEjecutorUsoDiscoSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const pr = e(MSG, { plazoMs: 5000 });
    p.decir({ tipo: 'fin', ok: false, codigo: 'disco.raiz_invalida' });
    expect(await pr).toEqual({ ok: false, codigo: 'disco.raiz_invalida' });
  });

  it('cancelar mata el proceso por su PID; el plazo y la memoria también', async () => {
    const p = new Falso();
    const control = new AbortController();
    const ejecutar = crearEjecutorUsoDiscoSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const r = ejecutar(MSG, { plazoMs: 5000, senal: control.signal });
    control.abort();
    expect(await codigoDe(r)).toBe('disco.cancelado');
    expect(p.matado).toBe(true);
    const p2 = new Falso();
    const e2 = crearEjecutorUsoDiscoSupervisado({ lanzar: () => p2, memoriaDe: () => 1 });
    expect(await codigoDe(e2(MSG, { plazoMs: 30 }))).toBe('disco.plazo');
    expect(p2.matado).toBe(true);
    const p3 = new Falso();
    const e3 = crearEjecutorUsoDiscoSupervisado({
      lanzar: () => p3,
      memoriaDe: () => 10 * 1024 * 1024 * 1024,
      intervaloMs: 5,
    });
    expect(await codigoDe(e3(MSG, { plazoMs: 5000 }))).toBe('disco.memoria');
    expect(p3.matado).toBe(true);
    // Ya cancelado de antemano: ni siquiera lanza el proceso.
    const lanzar = vi.fn(() => new Falso());
    expect(
      await codigoDe(
        crearEjecutorUsoDiscoSupervisado({ lanzar, memoriaDe: () => 1 })(MSG, {
          plazoMs: 1000,
          senal: control.signal,
        }),
      ),
    ).toBe('disco.cancelado');
    expect(lanzar).not.toHaveBeenCalled();
  });

  it('solo un análisis a la vez', async () => {
    const p = new Falso();
    const ejecutar = crearEjecutorUsoDiscoSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const primero = ejecutar(MSG, { plazoMs: 5000 });
    expect(await codigoDe(ejecutar(MSG, { plazoMs: 5000 }))).toBe('disco.ocupado');
    p.decir({ tipo: 'fin', ok: true, datos: resultadoMinimo });
    await primero;
  });

  it('con el escáner real de fondo (como lo hace el trabajador) da el total de la carpeta', async () => {
    const raiz = join(dir, 'real');
    mkdirSync(join(raiz, 'a'), { recursive: true });
    writeFileSync(join(raiz, 'a', 'uno.bin'), Buffer.alloc(1500));
    writeFileSync(join(raiz, 'dos.bin'), Buffer.alloc(500));
    const lanzar = (): ProcesoTrabajo => {
      let alMensaje: (m: unknown) => void = () => undefined;
      return {
        pid: 1,
        postMessage: (m) => {
          void operarUsoDisco(m as MensajeUsoDisco, {
            alProgreso: (p) => alMensaje({ tipo: 'progreso', ...p }),
          }).then((r) => alMensaje({ tipo: 'fin', ...r }));
        },
        onMessage: (cb) => {
          alMensaje = cb;
        },
        onExit: () => undefined,
        kill: () => undefined,
      };
    };
    const r = await crearEjecutorUsoDiscoSupervisado({ lanzar, memoriaDe: () => 1 })(
      { ...MSG, raiz },
      { plazoMs: 10_000 },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.datos.total).toBe(2000);
      expect(r.datos.archivos).toBe(2);
    }
  });
});

describe('Uso del disco corre FUERA del proceso principal (proceso real)', () => {
  const vivo = (pid: number): boolean => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };

  it('cancelar termina el proceso de trabajo y el principal sigue respondiendo', async () => {
    const script = join(dir, 'trabajo.cjs');
    writeFileSync(script, `process.on('message', () => { for (;;) {} });`);
    let pidHijo: number | undefined;
    const lanzar = (): ProcesoTrabajo => {
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
    };
    const control = new AbortController();
    const pr = crearEjecutorUsoDiscoSupervisado({ lanzar, memoriaDe: () => 1 })(MSG, {
      plazoMs: 60_000,
      senal: control.signal,
    });
    let latidos = 0;
    const reloj = setInterval(() => latidos++, 20);
    await new Promise((x) => setTimeout(x, 300));
    clearInterval(reloj);
    expect(latidos).toBeGreaterThan(5);
    control.abort();
    expect(await codigoDe(pr)).toBe('disco.cancelado');
    for (let i = 0; i < 50 && vivo(pidHijo!); i++) await new Promise((x) => setTimeout(x, 100));
    expect(vivo(pidHijo!)).toBe(false);
  }, 20_000);
});

describe('textos de D51 en los cuatro idiomas', () => {
  it('existen en es, en, pt y fr, sin tuteo y con los mismos parámetros', () => {
    for (const [id, d] of Object.entries({ es, en, pt, fr })) {
      const t = d.herramientas.usoDisco;
      expect(t.explicacion, id).not.toBe('');
      expect(d.herramientas.lista.usoDisco.nombre, id).not.toBe('');
      expect(t.avisos.enlaces(1), id).toContain('1');
      expect(t.avisos.enlaces(2), id).not.toBe(t.avisos.enlaces(1));
      expect(d.errores.codigos['disco.plazo'], id).toContain('{minutos}');
      expect(d.errores.codigos['disco.memoria'], id).toContain('{maximo}');
    }
    // Sin tuteo ni «tu/tú» en es; «vous» en fr.
    const textoEs = JSON.stringify(es.herramientas.usoDisco) + es.herramientas.usoDisco.otros('1');
    expect(textoEs).not.toMatch(/\b(elige|usa|puedes|tu|tus)\b/i);
    expect(fr.herramientas.usoDisco.sinUnidades).toContain('Vous');
    expect(JSON.stringify(fr.herramientas.usoDisco)).not.toMatch(
      /\b(tu|ton|ta|tes|choisis|utilise)\b/i,
    );
  });
});

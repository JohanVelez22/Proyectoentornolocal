import { fork } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ejecutarEnProceso, esErrorWolf, type MensajeTrabajo } from '@pel/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEjecutorSupervisado, type ProcesoTrabajo } from '../src/main/conversorSupervisor';

const MSG = { op: 'zip', datos: new Uint8Array(1), partes: [] } as unknown as MensajeTrabajo;

async function codigoDe(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (esErrorWolf(e)) return e.codigo;
    throw e;
  }
  return 'sin-error';
}

/** Proceso falso: no corre nada; la prueba decide cuándo contesta. */
class Falso implements ProcesoTrabajo {
  pid = 4242;
  matado = false;
  recibido: unknown = null;
  private alMensaje: (m: unknown) => void = () => undefined;
  private alSalir: (c: number | null) => void = () => undefined;
  postMessage(m: unknown): void {
    this.recibido = m;
  }
  onMessage(cb: (m: unknown) => void): void {
    this.alMensaje = cb;
  }
  onExit(cb: (c: number | null) => void): void {
    this.alSalir = cb;
  }
  kill(): void {
    this.matado = true;
  }
  contestar(r: unknown): void {
    this.alMensaje(r);
  }
  salir(): void {
    this.alSalir(1);
  }
}

describe('supervisor del proceso de trabajo', () => {
  it('devuelve la respuesta del proceso y lo termina', async () => {
    const p = new Falso();
    const ejecutar = crearEjecutorSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const r = ejecutar(MSG, { plazoMs: 5000 });
    await new Promise((x) => setTimeout(x, 10)); // la cola arranca en el siguiente turno
    expect(p.recibido).toBe(MSG);
    p.contestar({ ok: true, texto: 'hola' });
    expect(await r).toEqual({ ok: true, texto: 'hola' });
    expect(p.matado).toBe(true);
  });

  it('solo corre una conversión a la vez (cola) y un fallo no frena a la siguiente', async () => {
    const procesos: Falso[] = [];
    const ejecutar = crearEjecutorSupervisado({
      lanzar: () => {
        const p = new Falso();
        procesos.push(p);
        return p;
      },
      memoriaDe: () => 1,
    });
    const a = ejecutar(MSG, { plazoMs: 5000 });
    const b = ejecutar(MSG, { plazoMs: 5000 });
    await new Promise((r) => setTimeout(r, 30));
    expect(procesos).toHaveLength(1); // la segunda espera
    procesos[0]!.salir(); // la primera muere sin contestar
    expect(await codigoDe(a)).toBe('conversor.archivo_invalido');
    await new Promise((r) => setTimeout(r, 30));
    expect(procesos).toHaveLength(2);
    procesos[1]!.contestar({ ok: true });
    expect(await b).toEqual({ ok: true });
  });

  it('valida la respuesta del proceso: forma incorrecta es fallo y lo mata', async () => {
    const malas: unknown[] = [
      null,
      'hola',
      { texto: 'x' },
      { ok: 'si' },
      { ok: true, texto: 5 },
      { ok: true, texto: 'x'.repeat(11) },
      { ok: true, datos: [1, 2] },
      { ok: false, codigo: 'no.existe' },
      { ok: false },
    ];
    const MSG_LIM = { ...MSG, lim: { salida: 10 } } as unknown as MensajeTrabajo;
    for (const mala of malas) {
      const p = new Falso();
      const ejecutar = crearEjecutorSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
      const r = ejecutar(MSG_LIM, { plazoMs: 5000 });
      await new Promise((x) => setTimeout(x, 10));
      p.contestar(mala);
      expect(await codigoDe(r), JSON.stringify(mala)).toBe('conversor.archivo_invalido');
      expect(p.matado).toBe(true);
    }
    const p = new Falso();
    const ejecutar = crearEjecutorSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    const r = ejecutar(MSG_LIM, { plazoMs: 5000 });
    await new Promise((x) => setTimeout(x, 10));
    p.contestar({ ok: false, codigo: 'conversor.plazo', datos: { segundos: 1 } });
    expect(await r).toEqual({ ok: false, codigo: 'conversor.plazo', datos: { segundos: 1 } });
  });

  it('la cola tiene tope: con uno en curso y uno esperando rechaza con conversor.ocupado', async () => {
    const procesos: Falso[] = [];
    const ejecutar = crearEjecutorSupervisado({
      lanzar: () => {
        const p = new Falso();
        procesos.push(p);
        return p;
      },
      memoriaDe: () => 1,
    });
    const a = ejecutar(MSG, { plazoMs: 5000 });
    const b = ejecutar(MSG, { plazoMs: 5000 });
    expect(await codigoDe(ejecutar(MSG, { plazoMs: 5000 }))).toBe('conversor.ocupado');
    await new Promise((x) => setTimeout(x, 20));
    procesos[0]!.contestar({ ok: true });
    await a;
    await new Promise((x) => setTimeout(x, 20));
    // ya hay hueco: se acepta otro
    const c = ejecutar(MSG, { plazoMs: 5000 });
    procesos[1]!.contestar({ ok: true });
    await b;
    await new Promise((x) => setTimeout(x, 20));
    procesos[2]!.contestar({ ok: true });
    await c;
  });

  it('plazo vencido: mata el proceso y devuelve conversor.plazo', async () => {
    const p = new Falso();
    const ejecutar = crearEjecutorSupervisado({ lanzar: () => p, memoriaDe: () => 1 });
    expect(await codigoDe(ejecutar(MSG, { plazoMs: 30 }))).toBe('conversor.plazo');
    expect(p.matado).toBe(true);
  });

  it('memoria del proceso por encima del tope: lo mata con su propio código', async () => {
    const p = new Falso();
    const ejecutar = crearEjecutorSupervisado({
      lanzar: () => p,
      memoriaDe: (pid) => (pid === 4242 ? 900 * 1024 * 1024 : null),
      intervaloMs: 10,
    });
    expect(await codigoDe(ejecutar(MSG, { plazoMs: 5000 }))).toBe('conversor.memoria');
    expect(p.matado).toBe(true);
  });

  it('una medición que falla (null) no mata nada', async () => {
    const p = new Falso();
    const ejecutar = crearEjecutorSupervisado({
      lanzar: () => p,
      memoriaDe: () => null,
      intervaloMs: 10,
    });
    const r = ejecutar(MSG, { plazoMs: 5000 });
    await new Promise((x) => setTimeout(x, 60));
    expect(p.matado).toBe(false);
    p.contestar({ ok: true });
    await r;
  });

  it('la señal cancela y mata el proceso; con la señal ya abortada ni se lanza', async () => {
    const p = new Falso();
    let lanzados = 0;
    const ejecutar = crearEjecutorSupervisado({
      lanzar: () => {
        lanzados++;
        return p;
      },
      memoriaDe: () => 1,
    });
    const ac = new AbortController();
    const r = ejecutar(MSG, { plazoMs: 5000, senal: ac.signal });
    await new Promise((x) => setTimeout(x, 10));
    ac.abort();
    expect(await codigoDe(r)).toBe('conversor.cancelado');
    expect(p.matado).toBe(true);
    expect(await codigoDe(ejecutar(MSG, { plazoMs: 5000, senal: ac.signal }))).toBe(
      'conversor.cancelado',
    );
    expect(lanzados).toBe(1);
  });

  it('el ejecutor sin aislamiento de las pruebas del núcleo cumple el mismo contrato', async () => {
    const r = await ejecutarEnProceso(
      {
        op: 'mdAHtml',
        datos: new TextEncoder().encode('# hola'),
        para: 'html',
        rutas: { mammoth: '', exceljs: '', pdflib: '', pdfjs: '' },
        lim: {} as never,
      },
      { plazoMs: 1000 },
    );
    expect(r.ok && r.texto).toContain('<h1>hola</h1>');
  });
});

describe('supervisor contra un proceso real', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'pel-sup-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** Lanza un proceso Node real; el script informa de su propia memoria (`{mem}`) cada 15 ms. */
  function realConScript(codigo: string): {
    lanzar: () => ProcesoTrabajo;
    ultima: () => number;
    pid: () => number | undefined;
  } {
    const script = path.join(dir, 'trabajo.cjs');
    writeFileSync(
      script,
      `setInterval(() => process.send({ mem: process.memoryUsage().rss }), 15);\n${codigo}`,
    );
    let mem = 0;
    let ultimoPid: number | undefined;
    return {
      ultima: () => mem,
      pid: () => ultimoPid,
      lanzar: () => {
        const hijo = fork(script, [], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
        ultimoPid = hijo.pid;
        return {
          get pid() {
            return hijo.pid;
          },
          postMessage: (m) => hijo.send(m as never),
          onMessage: (cb) => {
            hijo.on('message', (m: { mem?: number }) => {
              if (m && typeof m.mem === 'number') mem = m.mem;
              else cb(m);
            });
          },
          onExit: (cb) => {
            hijo.on('exit', cb);
          },
          kill: () => {
            hijo.kill();
          },
        };
      },
    };
  }

  const vivo = (pid: number): boolean => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };

  it('una bomba de memoria EXTERNA (Buffers fuera del montón) se corta y el proceso muere', async () => {
    const real = realConScript(`
      const guardados = [];
      process.on('message', () => {
        setInterval(() => guardados.push(Buffer.alloc(40 * 1024 * 1024, 1)), 20);
      });
    `);
    const ejecutar = crearEjecutorSupervisado({
      lanzar: real.lanzar,
      memoriaDe: () => real.ultima(),
      limiteMemoriaBytes: 300 * 1024 * 1024,
      intervaloMs: 20,
    });
    const t0 = Date.now();
    expect(await codigoDe(ejecutar(MSG, { plazoMs: 30_000 }))).toBe('conversor.memoria');
    expect(Date.now() - t0).toBeLessThan(15_000);
    // Se pasó del tope pero se cortó enseguida (no llegó al gigabyte) y el proceso ya no existe.
    expect(real.ultima()).toBeGreaterThan(300 * 1024 * 1024);
    expect(real.ultima()).toBeLessThan(1024 * 1024 * 1024);
    const pid = real.pid()!;
    for (let i = 0; i < 50 && vivo(pid); i++) await new Promise((r) => setTimeout(r, 100));
    expect(vivo(pid)).toBe(false);
  }, 30_000);

  it('un bucle infinito vence el plazo y el proceso muere', async () => {
    const real = realConScript(`process.on('message', () => { for (;;) {} });`);
    const ejecutar = crearEjecutorSupervisado({
      lanzar: real.lanzar,
      memoriaDe: () => 1,
    });
    expect(await codigoDe(ejecutar(MSG, { plazoMs: 400 }))).toBe('conversor.plazo');
    const pid = real.pid()!;
    for (let i = 0; i < 50 && vivo(pid); i++) await new Promise((r) => setTimeout(r, 100));
    expect(vivo(pid)).toBe(false);
  }, 20_000);
});

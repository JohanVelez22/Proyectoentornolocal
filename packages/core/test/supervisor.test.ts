import { EventEmitter } from 'node:events';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { Plataforma } from '../src/plataforma/tipos';
import { puertoResponde } from '../src/procesos/sonda';
import { ErrorDetenidoAlIniciar, Supervisor, type DefProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import type { EstadoServicio } from '../src/tipos';

class HijoFalso extends EventEmitter {
  constructor(readonly pid: number) {
    super();
  }
  unref = vi.fn();
}

let base: string;
let rutas: Rutas;
let vivos: Map<number, string>;
let hijos: HijoFalso[];
let sondaOk: boolean;
let siguientePid: number;
let matados: number[];
let eventos: Eventos<EventosNucleo>;
let emitidos: EstadoServicio[];

const plataforma = (): Plataforma =>
  ({
    procesoVivo: async (pid: number) =>
      vivos.has(pid) ? { vivo: true, ejecutable: vivos.get(pid) } : { vivo: false },
    matarArbol: async (pid: number) => {
      matados.push(pid);
      vivos.delete(pid);
    },
  }) as unknown as Plataforma;

const fakeSpawn = ((cmd: string) => {
  const h = new HijoFalso(siguientePid++);
  vivos.set(h.pid, path.basename(cmd));
  hijos.push(h);
  return h;
}) as never;

function def(extra: Partial<DefProceso> = {}): DefProceso {
  return {
    id: 'nginx',
    comando: 'C:/bin/nginx.exe',
    args: ['-p', 'x'],
    puerto: 80,
    log: path.join(base, 'logs', 'nginx.log'),
    reiniciar: true,
    ...extra,
  };
}

function registro(pid: number): string {
  return JSON.stringify([
    {
      id: 'nginx',
      pid,
      ejecutable: 'C:/bin/nginx.exe',
      args: [],
      puerto: 80,
      log: def().log,
      reiniciar: true,
    },
  ]);
}

function morir(h: HijoFalso): void {
  vivos.delete(h.pid);
  h.emit('exit', 1, null);
}

function crear(): Supervisor {
  return new Supervisor(rutas, plataforma(), eventos, {
    intervaloMs: 3000,
    spawn: fakeSpawn,
    sonda: async () => sondaOk,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-sup-'));
  mkdirSync(path.join(base, 'run'), { recursive: true });
  rutas = new Rutas(base);
  vivos = new Map();
  hijos = [];
  matados = [];
  sondaOk = true;
  siguientePid = 1000;
  eventos = new Eventos<EventosNucleo>();
  emitidos = [];
  eventos.on('servicio:estado', (e) => emitidos.push(e));
});

afterEach(() => {
  vi.useRealTimers();
  rmSync(base, { recursive: true, force: true });
});

describe('Supervisor', () => {
  it('iniciar → iniciando y luego encendido; guarda estado.json y log', async () => {
    const s = crear();
    await s.iniciar(def());
    expect(s.estado('nginx')).toBe('iniciando');
    expect(s.pid('nginx')).toBe(1000);
    await vi.advanceTimersByTimeAsync(3000);
    expect(s.estado('nginx')).toBe('encendido');
    const guardado = JSON.parse(readFileSync(rutas.estado(), 'utf8'));
    expect(guardado).toHaveLength(1);
    expect(guardado[0]).toMatchObject({
      id: 'nginx',
      pid: 1000,
      ejecutable: 'C:/bin/nginx.exe',
      args: ['-p', 'x'],
      puerto: 80,
    });
    expect(readFileSync(def().log, 'utf8')).toContain('iniciar nginx');
    expect(emitidos.map((e) => e.estado)).toEqual(['iniciando', 'encendido']);
    await s.cerrar();
  });

  it('sin puerto basta con que el PID viva', async () => {
    sondaOk = false;
    const s = crear();
    await s.iniciar(def({ id: 'tunel-a', puerto: undefined }));
    await vi.advanceTimersByTimeAsync(3000);
    expect(s.estado('tunel-a')).toBe('encendido');
    await s.cerrar();
  });

  it('iniciar sobre un id ya corriendo es no-op', async () => {
    const s = crear();
    await s.iniciar(def());
    await s.iniciar(def());
    expect(hijos).toHaveLength(1);
    await s.cerrar();
  });

  it('si el puerto no responde en 15 s queda en error con el final del log', async () => {
    sondaOk = false;
    const s = crear();
    await s.iniciar(def());
    writeFileSync(def().log, 'linea de error\n', { flag: 'a' });
    await vi.advanceTimersByTimeAsync(18000);
    expect(s.estado('nginx')).toBe('error');
    expect(emitidos.at(-1)?.mensaje).toContain('linea de error');
    await s.cerrar();
  });

  it('una muerte inesperada reinicia con espera de 1 s', async () => {
    const s = crear();
    await s.iniciar(def());
    await vi.advanceTimersByTimeAsync(3000);
    morir(hijos[0]!);
    expect(s.estado('nginx')).toBe('iniciando');
    await vi.advanceTimersByTimeAsync(500);
    expect(hijos).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(600);
    expect(hijos).toHaveLength(2);
    expect(s.pid('nginx')).toBe(1001);
    await s.cerrar();
  });

  it('tras 5 reinicios fallidos queda en error con las últimas 20 líneas', async () => {
    const s = crear();
    await s.iniciar(def());
    const lineas = Array.from({ length: 30 }, (_, i) => `l${i}`).join('\n') + '\n';
    writeFileSync(def().log, lineas, { flag: 'a' });
    for (const espera of [1000, 2000, 4000, 8000, 16000]) {
      morir(hijos.at(-1)!);
      await vi.advanceTimersByTimeAsync(espera);
    }
    expect(hijos).toHaveLength(6);
    expect(s.estado('nginx')).not.toBe('error');
    morir(hijos.at(-1)!);
    await vi.advanceTimersByTimeAsync(60000);
    expect(hijos).toHaveLength(6);
    expect(s.estado('nginx')).toBe('error');
    const msg = emitidos.at(-1)?.mensaje ?? '';
    expect(msg.split('\n')).toHaveLength(20);
    expect(msg).toContain('l29');
    expect(msg).not.toContain('l9\n');
    await s.cerrar();
  });

  it('60 s encendido seguidos reinician el contador de intentos', async () => {
    const s = crear();
    await s.iniciar(def());
    for (const espera of [1000, 2000, 4000, 8000]) {
      morir(hijos.at(-1)!);
      await vi.advanceTimersByTimeAsync(espera);
    }
    await vi.advanceTimersByTimeAsync(66000);
    expect(s.estado('nginx')).toBe('encendido');
    morir(hijos.at(-1)!);
    await vi.advanceTimersByTimeAsync(1100);
    expect(hijos).toHaveLength(6);
    expect(s.estado('nginx')).not.toBe('error');
    await s.cerrar();
  });

  it('detener usa matarArbol y no reinicia', async () => {
    const s = crear();
    await s.iniciar(def());
    await vi.advanceTimersByTimeAsync(3000);
    await s.detener('nginx');
    expect(matados).toEqual([1000]);
    morir(hijos[0]!);
    await vi.advanceTimersByTimeAsync(60000);
    expect(hijos).toHaveLength(1);
    expect(s.estado('nginx')).toBe('apagado');
    expect(s.pid('nginx')).toBeNull();
    expect(JSON.parse(readFileSync(rutas.estado(), 'utf8'))).toEqual([]);
    await s.cerrar();
  });

  it('tras marcarDeteniendo una salida limpia nunca relanza el proceso', async () => {
    const s = crear();
    await s.iniciar(def());
    await vi.advanceTimersByTimeAsync(3000);
    expect(s.estado('nginx')).toBe('encendido');
    s.marcarDeteniendo('nginx');
    morir(hijos[0]!); // p. ej. mysqladmin shutdown
    await vi.advanceTimersByTimeAsync(60000);
    expect(hijos).toHaveLength(1);
    expect(s.pid('nginx')).toBeNull();
    await s.detener('nginx');
    expect(matados).toEqual([]);
    expect(s.estado('nginx')).toBe('apagado');
    await vi.advanceTimersByTimeAsync(60000);
    expect(hijos).toHaveLength(1);
    await s.cerrar();
  });

  it('mensaje() expone la cola del log cuando el proceso queda en error', async () => {
    const s = crear();
    await s.iniciar(def({ reiniciar: false }));
    writeFileSync(def().log, 'linea 1\n[ERROR] puerto en uso\n');
    morir(hijos[0]!);
    expect(s.estado('nginx')).toBe('error');
    expect(s.mensaje('nginx')).toContain('[ERROR] puerto en uso');
    await s.cerrar();
  });

  it('alSalir se invoca con id y código en una muerte inesperada', async () => {
    const s = crear();
    const fn = vi.fn();
    s.alSalir(fn);
    await s.iniciar(def({ reiniciar: false }));
    morir(hijos[0]!);
    expect(fn).toHaveBeenCalledWith('nginx', 1);
    expect(s.estado('nginx')).toBe('error');
    await s.cerrar();
  });

  it('spawn fallido (pid undefined + error asíncrono) rechaza iniciar sin tumbar el proceso', async () => {
    const hijo = new HijoFalso(0) as unknown as EventEmitter & { pid: number | undefined };
    hijo.pid = undefined;
    const s = new Supervisor(rutas, plataforma(), eventos, {
      spawn: (() => {
        setTimeout(() => hijo.emit('error', new Error('spawn ENOENT')), 0);
        return hijo;
      }) as never,
      sonda: async () => true,
    });
    await expect(s.iniciar(def())).rejects.toThrow('No se pudo iniciar nginx');
    await vi.advanceTimersByTimeAsync(10);
    expect(s.estado('nginx')).toBe('error');
    expect(emitidos.at(-1)?.mensaje).toContain('No se pudo iniciar nginx');
    await s.cerrar();
  });

  it('timeout de 15 s mata el árbol y su salida posterior no reinicia', async () => {
    sondaOk = false;
    const s = crear();
    await s.iniciar(def());
    await vi.advanceTimersByTimeAsync(18000);
    expect(matados).toEqual([1000]);
    expect(s.estado('nginx')).toBe('error');
    morir(hijos[0]!);
    await vi.advanceTimersByTimeAsync(60000);
    expect(hijos).toHaveLength(1);
    await s.cerrar();
  });

  it('iniciar sobre una entrada en error con PID vivo mata el anterior', async () => {
    const s = crear();
    await s.iniciar(def({ reiniciar: false }));
    const internas = s as unknown as { entradas: Map<string, { estado: string }> };
    internas.entradas.get('nginx')!.estado = 'error';
    await s.iniciar(def());
    expect(matados).toEqual([1000]);
    morir(hijos[0]!);
    await vi.advanceTimersByTimeAsync(5000);
    expect(hijos).toHaveLength(2);
    expect(s.pid('nginx')).toBe(1001);
    await s.cerrar();
  });

  it('una salida tras cerrar() no reinicia', async () => {
    const s = crear();
    await s.iniciar(def());
    await s.cerrar();
    morir(hijos[0]!);
    await vi.advanceTimersByTimeAsync(60000);
    expect(hijos).toHaveLength(1);
  });

  it('detener limpia la entrada aunque matarArbol rechace', async () => {
    const s = crear();
    await s.iniciar(def());
    const p = plataforma();
    p.matarArbol = async () => {
      throw new Error('fallo');
    };
    (s as unknown as { plataforma: Plataforma }).plataforma = p;
    await expect(s.detener('nginx')).rejects.toThrow('fallo');
    expect(s.estado('nginx')).toBe('apagado');
    expect(JSON.parse(readFileSync(rutas.estado(), 'utf8'))).toEqual([]);
    await s.cerrar();
  });

  it('readoptar adopta un PID vivo con el mismo ejecutable sin lanzar otro', async () => {
    vivos.set(555, 'NGINX.exe');
    writeFileSync(rutas.estado(), registro(555));
    const s = crear();
    await s.readoptar();
    expect(hijos).toHaveLength(0);
    expect(s.pid('nginx')).toBe(555);
    expect(s.ids()).toEqual(['nginx']);
    await vi.advanceTimersByTimeAsync(3000);
    expect(s.estado('nginx')).toBe('encendido');
    await s.cerrar();
  });

  it('readoptar descarta un PID vivo que ahora es otro programa', async () => {
    vivos.set(555, 'chrome.exe');
    writeFileSync(rutas.estado(), registro(555));
    const s = crear();
    await s.readoptar();
    expect(s.pid('nginx')).toBeNull();
    expect(s.estado('nginx')).toBe('apagado');
    expect(matados).toEqual([]);
    expect(JSON.parse(readFileSync(rutas.estado(), 'utf8'))).toEqual([]);
    await s.cerrar();
  });

  it('readoptar tolera estado.json ausente o corrupto', async () => {
    const s = crear();
    await s.readoptar();
    writeFileSync(rutas.estado(), '{no json');
    await s.readoptar();
    expect(existsSync(rutas.estado())).toBe(true);
    await s.cerrar();
  });

  it('un proceso adoptado que muere se detecta por sondeo y se reinicia', async () => {
    vivos.set(555, 'nginx.exe');
    writeFileSync(rutas.estado(), registro(555));
    const s = crear();
    await s.readoptar();
    vivos.delete(555);
    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(1100);
    expect(hijos).toHaveLength(1);
    await s.cerrar();
  });
});

describe('puertoResponde', () => {
  it('true si hay un servidor y false si no', async () => {
    vi.useRealTimers();
    const srv = createServer();
    await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
    const puerto = (srv.address() as { port: number }).port;
    expect(await puertoResponde(puerto)).toBe(true);
    await new Promise<void>((r) => srv.close(() => r()));
    expect(await puertoResponde(puerto, '127.0.0.1', 300)).toBe(false);
  });
});

describe('detener a mitad de un arranque oculto', () => {
  it('iniciar() no informa éxito: rechaza con ErrorDetenidoAlIniciar y mata el PID', async () => {
    vi.useRealTimers();
    let soltar!: (pid: number) => void;
    const s = new Supervisor(rutas, plataforma(), eventos, {
      intervaloMs: 3000,
      sonda: async () => true,
      lanzarOculto: () => new Promise<number>((r) => (soltar = r)),
    });
    const inicio = s.iniciar(def());
    await vi.waitFor(() => expect(soltar).toBeTypeOf('function'));
    await s.detener('nginx');
    vivos.set(4321, 'nginx.exe');
    soltar(4321);
    const e = await inicio.catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErrorDetenidoAlIniciar);
    expect((e as Error).message).toMatch(/se detuvo mientras arrancaba/);
    expect(matados).toEqual([4321]);
    expect(s.estado('nginx')).toBe('apagado');
    await s.cerrar();
  });
});

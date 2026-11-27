import { EventEmitter } from 'node:events';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { Plataforma } from '../src/plataforma/tipos';
import { puertoResponde } from '../src/procesos/sonda';
import {
  ErrorDetenidoAlIniciar,
  MENSAJE_TERMINADO,
  Supervisor,
  type DefProceso,
} from '../src/procesos/supervisor';
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
/** Hora de creación (FILETIME en texto) de cada PID vivo. */
let creaciones: Map<number, string>;
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
    inicioProceso: async (pid: number) => creaciones.get(pid) ?? null,
  }) as unknown as Plataforma;

const fakeSpawn = ((cmd: string) => {
  const h = new HijoFalso(siguientePid++);
  vivos.set(h.pid, path.basename(cmd));
  creaciones.set(h.pid, `t${h.pid}`);
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

function morir(h: HijoFalso, codigo: number | null = 1): void {
  vivos.delete(h.pid);
  h.emit('exit', codigo, null);
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
  creaciones = new Map();
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

describe('Supervisor: envSecreto', () => {
  const CENTINELA = 'centinela-secreta-d';

  it('el proceso recibe envSecreto, pero estado.json no lo guarda', async () => {
    const entornos: Array<NodeJS.ProcessEnv | undefined> = [];
    const s = new Supervisor(rutas, plataforma(), eventos, {
      intervaloMs: 3000,
      spawn: ((cmd: string, _a: string[], o: { env?: NodeJS.ProcessEnv }) => {
        entornos.push(o.env);
        return (fakeSpawn as unknown as (c: string) => HijoFalso)(cmd);
      }) as never,
      sonda: async () => sondaOk,
      lanzarOculto: null,
    });
    await s.iniciar(
      def({
        id: 'tunel-x',
        env: { VISIBLE: '1' },
        envSecreto: { TUNNEL_CRED_CONTENTS: CENTINELA },
        quitarEntorno: ['TUNNEL_'],
      }),
    );
    expect(entornos[0]!['TUNNEL_CRED_CONTENTS']).toBe(CENTINELA);
    expect(entornos[0]!['VISIBLE']).toBe('1');
    const crudo = readFileSync(rutas.estado(), 'utf8');
    expect(crudo).toContain('VISIBLE');
    expect(crudo).not.toContain(CENTINELA);
    expect(crudo).not.toContain('TUNNEL_CRED_CONTENTS');
  });

  it('quitarEntorno saca un TUNNEL_TOKEN heredado del usuario antes de aplicar lo propio', async () => {
    process.env['TUNNEL_TOKEN'] = 'heredado-ajeno';
    try {
      const entornos: Array<NodeJS.ProcessEnv | undefined> = [];
      const s = new Supervisor(rutas, plataforma(), eventos, {
        intervaloMs: 3000,
        spawn: ((cmd: string, _a: string[], o: { env?: NodeJS.ProcessEnv }) => {
          entornos.push(o.env);
          return (fakeSpawn as unknown as (c: string) => HijoFalso)(cmd);
        }) as never,
        sonda: async () => sondaOk,
        lanzarOculto: null,
      });
      await s.iniciar(def({ id: 'tunel-y', quitarEntorno: ['TUNNEL_'] }));
      expect(entornos[0]!['TUNNEL_TOKEN']).toBeUndefined();
    } finally {
      delete process.env['TUNNEL_TOKEN'];
    }
  });

  it('con el lanzador oculto también llega el entorno calculado (sin lo quitado y con el secreto)', async () => {
    process.env['TUNNEL_TOKEN'] = 'heredado-ajeno';
    try {
      const vistos: Array<NodeJS.ProcessEnv | undefined> = [];
      const s = new Supervisor(rutas, plataforma(), eventos, {
        intervaloMs: 3000,
        spawn: fakeSpawn,
        sonda: async () => sondaOk,
        lanzarOculto: async (d) => {
          vistos.push(d.entorno);
          vivos.set(2000, 'cloudflared.exe');
          return 2000;
        },
      });
      await s.iniciar(
        def({
          id: 'tunel-z',
          envSecreto: { TUNNEL_CRED_CONTENTS: CENTINELA },
          quitarEntorno: ['TUNNEL_'],
        }),
      );
      expect(vistos[0]!['TUNNEL_CRED_CONTENTS']).toBe(CENTINELA);
      expect(vistos[0]!['TUNNEL_TOKEN']).toBeUndefined();
      expect(readFileSync(rutas.estado(), 'utf8')).not.toContain(CENTINELA);
    } finally {
      delete process.env['TUNNEL_TOKEN'];
    }
  });
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

  it('salida 0 sin reinicio queda apagado con el mensaje "terminado"', async () => {
    const s = crear();
    await s.iniciar(def({ reiniciar: false }));
    morir(hijos[0]!, 0);
    expect(s.estado('nginx')).toBe('apagado');
    expect(s.mensaje('nginx')).toBe(MENSAJE_TERMINADO);
    expect(emitidos.at(-1)).toMatchObject({ estado: 'apagado', mensaje: MENSAJE_TERMINADO });
    await s.cerrar();
  });

  it('salida 1 sin reinicio queda en error', async () => {
    const s = crear();
    await s.iniciar(def({ reiniciar: false }));
    morir(hijos[0]!, 1);
    expect(s.estado('nginx')).toBe('error');
    expect(s.mensaje('nginx')).not.toBe(MENSAJE_TERMINADO);
    await s.cerrar();
  });

  it('salida por señal sin reinicio queda en error', async () => {
    const s = crear();
    await s.iniciar(def({ reiniciar: false }));
    hijos[0]!.emit('exit', null, 'SIGKILL');
    expect(s.estado('nginx')).toBe('error');
    await s.cerrar();
  });

  it('un servicio (sin terminaSolo) que muere sin código sigue en error', async () => {
    const s = crear();
    await s.iniciar(def({ reiniciar: false }));
    morir(hijos[0]!, null);
    expect(s.estado('nginx')).toBe('error');
    await s.cerrar();
  });

  it('un proceso que puede terminar solo, sin código ni señal ni reinicio (lanzador oculto), queda apagado, no en error (D39)', async () => {
    const s = crear();
    const fn = vi.fn();
    s.alTerminar(fn);
    await s.iniciar(def({ reiniciar: false, terminaSolo: true }));
    morir(hijos[0]!, null);
    expect(s.estado('nginx')).toBe('apagado');
    expect(s.mensaje('nginx')).toBe(MENSAJE_TERMINADO);
    expect(fn).toHaveBeenCalledWith('nginx', null, true);
    await s.cerrar();
  });

  it('con reiniciar: true una salida sin código se reinicia como siempre', async () => {
    const s = crear();
    await s.iniciar(def({ reiniciar: true }));
    morir(hijos[0]!, null);
    expect(s.estado('nginx')).toBe('iniciando');
    await s.cerrar();
  });

  it('con reiniciar: true una salida 0 no cambia: se reinicia como siempre', async () => {
    const s = crear();
    await s.iniciar(def({ reiniciar: true }));
    morir(hijos[0]!, 0);
    expect(s.estado('nginx')).toBe('iniciando');
    expect(s.mensaje('nginx')).toMatch(/Reiniciando/);
    await s.cerrar();
  });

  it('alTerminar avisa solo de las salidas definitivas, con su código', async () => {
    const s = crear();
    const fn = vi.fn();
    s.alTerminar(fn);
    await s.iniciar(def({ reiniciar: true }));
    morir(hijos[0]!, 0); // se reinicia: no es definitiva
    expect(fn).not.toHaveBeenCalled();
    await s.cerrar();
    const s2 = crear();
    s2.alTerminar(fn);
    await s2.iniciar(def({ id: 'otro', reiniciar: false }));
    morir(hijos.at(-1)!, 0);
    expect(fn).toHaveBeenCalledWith('otro', 0, false);
    await s2.cerrar();
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

  describe('exigirInicio (procesos de proyecto: node.exe/python.exe son comunes)', () => {
    const defNode = (): DefProceso =>
      def({
        id: 'proy-demo-vite',
        comando: 'C:/n/node.exe',
        puerto: undefined,
        exigirInicio: true,
      });

    it('guarda la hora de creación y readopta si PID, exe y hora coinciden', async () => {
      const a = crear();
      await a.iniciar(defNode());
      const pid = a.pid('proy-demo-vite')!;
      const reg = JSON.parse(readFileSync(rutas.estado(), 'utf8'));
      expect(reg[0]).toMatchObject({ id: 'proy-demo-vite', exigirInicio: true, creado: `t${pid}` });
      await a.cerrar();
      const b = crear();
      await b.readoptar();
      expect(b.pid('proy-demo-vite')).toBe(pid);
      expect(hijos).toHaveLength(1);
      await b.cerrar();
    });

    it('un PID reutilizado por otro node.exe no se adopta ni se mata, y se olvida', async () => {
      const a = crear();
      await a.iniciar(defNode());
      const pid = a.pid('proy-demo-vite')!;
      await a.cerrar();
      creaciones.set(pid, 'otra-hora'); // murió y Windows dio el PID a otro node.exe
      const b = crear();
      await b.readoptar();
      expect(b.ids()).toEqual([]);
      expect(matados).toEqual([]);
      expect(JSON.parse(readFileSync(rutas.estado(), 'utf8'))).toEqual([]);
      await b.cerrar();
    });

    it('sin hora guardada o sin poder leerla no se adopta', async () => {
      vivos.set(777, 'node.exe');
      writeFileSync(
        rutas.estado(),
        JSON.stringify([
          {
            id: 'proy-a-x',
            pid: 777,
            ejecutable: 'C:/n/node.exe',
            args: [],
            log: def().log,
            reiniciar: false,
            exigirInicio: true,
          },
        ]),
      );
      const s = crear();
      await s.readoptar();
      expect(s.ids()).toEqual([]);
      expect(matados).toEqual([]);
      await s.cerrar();
    });

    it('si no pudo leer la hora al lanzar, la reintenta en el sondeo y la guarda', async () => {
      const s = crear();
      let leer = false;
      const plat = s['plataforma'] as Plataforma & {
        inicioProceso: (pid: number) => Promise<string | null>;
      };
      plat.inicioProceso = async (pid) => (leer ? (creaciones.get(pid) ?? null) : null);
      await s.iniciar(defNode());
      const pid = s.pid('proy-demo-vite')!;
      expect(JSON.parse(readFileSync(rutas.estado(), 'utf8'))[0].creado).toBeNull();
      leer = true;
      await vi.advanceTimersByTimeAsync(3000);
      expect(JSON.parse(readFileSync(rutas.estado(), 'utf8'))[0].creado).toBe(`t${pid}`);
      await s.cerrar();
    });

    it('puertoInformativo se emite en puertos pero no es sonda: no lo mata', async () => {
      sondaOk = false;
      const s = crear();
      await s.iniciar({ ...defNode(), puertoInformativo: 5173 });
      await vi.advanceTimersByTimeAsync(60_000);
      expect(s.estado('proy-demo-vite')).toBe('encendido');
      expect(matados).toEqual([]);
      expect(emitidos.at(-1)).toMatchObject({ id: 'proy-demo-vite', puertos: [5173] });
      expect(JSON.parse(readFileSync(rutas.estado(), 'utf8'))[0].puertoInformativo).toBe(5173);
      await s.cerrar();
    });

    it('pools de PHP (php-<rama>, php-sitio-*): sin hora guardada o con PID reutilizado no se adoptan ni se matan', async () => {
      vivos.set(801, 'php-cgi.exe');
      creaciones.set(801, 't801');
      vivos.set(802, 'php-cgi.exe');
      creaciones.set(802, 'otra-hora'); // el PID pasó a un php-cgi de Laragon/XAMPP
      vivos.set(803, 'php-cgi.exe');
      creaciones.set(803, 't803');
      const reg = (id: string, pid: number, creado?: string) => ({
        id,
        pid,
        ejecutable: 'C:/p/php-cgi.exe',
        args: [],
        puerto: 9840,
        log: def().log,
        reiniciar: true,
        ...(creado ? { creado } : {}),
      });
      writeFileSync(
        rutas.estado(),
        JSON.stringify([
          reg('php-8.4-0', 801), // registro viejo sin hora
          reg('php-sitio-tienda-0', 802, 't802'),
          reg('php-sitio-blog-0', 803, 't803'),
        ]),
      );
      const s = crear();
      await s.readoptar();
      expect(s.ids()).toEqual(['php-sitio-blog-0']);
      expect(matados).toEqual([]);
      await s.cerrar();
    });

    describe('huérfanos de una versión anterior (sin hora guardada)', () => {
      /** Ruta completa del ejecutable de cada PID vivo (la que da la plataforma). */
      let rutasProceso: Map<number, string>;
      /** Puerto → PID que lo escucha. */
      let duenos: Map<number, number>;
      let avisos: string[];
      const conRutas = (): Supervisor =>
        new Supervisor(
          rutas,
          {
            ...plataforma(),
            rutaProceso: async (pid: number) => rutasProceso.get(pid) ?? null,
            quienUsaPuerto: async (p: number) =>
              duenos.has(p) ? { pid: duenos.get(p)!, nombre: 'x.exe' } : null,
          } as unknown as Plataforma,
          eventos,
          { intervaloMs: 3000, spawn: fakeSpawn, sonda: async () => sondaOk },
        );
      const reg = (
        id: string,
        pid: number,
        ejecutable: string,
        creado?: string,
        puerto: number | undefined = 9840,
      ) => ({
        id,
        pid,
        ejecutable,
        args: [],
        puerto,
        log: def().log,
        reiniciar: true,
        ...(creado ? { creado } : {}),
      });
      beforeEach(() => {
        rutasProceso = new Map();
        duenos = new Map();
        avisos = [];
        vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
          avisos.push(a.map(String).join(' '));
        });
      });
      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('un php-cgi propio (dentro de bin/ de la carpeta de datos) se cierra y se avisa', async () => {
        const exe = path.join(base, 'bin', 'php', '8.4.13', 'php-cgi.exe');
        vivos.set(901, 'php-cgi.exe');
        creaciones.set(901, 't901');
        rutasProceso.set(901, exe);
        duenos.set(9840, 901);
        writeFileSync(rutas.estado(), JSON.stringify([reg('php-8.4-0', 901, exe)]));
        const s = conRutas();
        await s.readoptar();
        expect(s.ids()).toEqual([]);
        expect(matados).toEqual([901]);
        expect(avisos.join('\n')).toContain('php-8.4-0');
        expect(avisos.join('\n')).toContain('901');
        expect(avisos.join('\n')).toContain('9840');
        await s.cerrar();
      });

      it.skipIf(process.platform !== 'win32')(
        'mayúsculas distintas en Windows cuentan como la misma carpeta',
        async () => {
          const exe = path.join(base, 'BIN', 'php', '8.4.13', 'PHP-CGI.EXE').toUpperCase();
          vivos.set(902, 'php-cgi.exe');
          rutasProceso.set(902, exe);
          duenos.set(9840, 902);
          writeFileSync(rutas.estado(), JSON.stringify([reg('php-sitio-a-0', 902, exe)]));
          const s = conRutas();
          await s.readoptar();
          expect(matados).toEqual([902]);
          await s.cerrar();
        },
      );

      it('un php-cgi fuera de bin/ (Laragon, XAMPP, carpetas parecidas) nunca se toca', async () => {
        const fuera = [
          'C:/laragon/bin/php/php-8.3/php-cgi.exe',
          path.join(base, 'bin-otro', 'php-cgi.exe'),
          path.join(base, 'tools', 'php-cgi.exe'),
          `${path.join(base, 'bin')}${path.sep}..${path.sep}x${path.sep}php-cgi.exe`,
          `${base}x${path.sep}bin${path.sep}php-cgi.exe`,
        ];
        const registros = fuera.map((exe, i) => {
          vivos.set(910 + i, 'php-cgi.exe');
          rutasProceso.set(910 + i, exe);
          return reg(`php-8.${i}-0`, 910 + i, exe);
        });
        writeFileSync(rutas.estado(), JSON.stringify(registros));
        const s = conRutas();
        await s.readoptar();
        expect(matados).toEqual([]);
        await s.cerrar();
      });

      it('sin ruta legible, con otro ejecutable o con un id ajeno no se toca', async () => {
        const exe = path.join(base, 'bin', 'php', '8.4.13', 'php-cgi.exe');
        vivos.set(920, 'php-cgi.exe'); // sin ruta legible
        vivos.set(921, 'notepad.exe'); // el PID es de otro programa
        rutasProceso.set(921, path.join(base, 'bin', 'notepad.exe'));
        vivos.set(922, 'nginx.exe'); // no es pool de PHP ni proceso de proyecto
        rutasProceso.set(922, path.join(base, 'bin', 'nginx', '1.27', 'nginx.exe'));
        writeFileSync(
          rutas.estado(),
          JSON.stringify([
            reg('php-8.4-0', 920, exe),
            reg('php-8.4-1', 921, exe),
            { ...reg('tunel-x', 922, path.join(base, 'bin', 'nginx', '1.27', 'nginx.exe')) },
          ]),
        );
        const s = conRutas();
        await s.readoptar();
        expect(matados).toEqual([]);
        await s.cerrar();
      });

      it('un PID adoptado por otro registro no se cierra', async () => {
        const exe = path.join(base, 'bin', 'php', '8.4.13', 'php-cgi.exe');
        vivos.set(930, 'php-cgi.exe');
        creaciones.set(930, 't930');
        rutasProceso.set(930, exe);
        writeFileSync(
          rutas.estado(),
          JSON.stringify([reg('php-8.4-0', 930, exe), reg('php-sitio-b-0', 930, exe, 't930')]),
        );
        const s = conRutas();
        await s.readoptar();
        expect(s.ids()).toEqual(['php-sitio-b-0']);
        expect(matados).toEqual([]);
        await s.cerrar();
      });

      it('proy-: solo si el ejecutable está dentro de la carpeta de datos (runtimes)', async () => {
        const propio = path.join(base, 'bin', 'node', '22.11.0', 'node.exe');
        const ajeno = 'C:/Program Files/nodejs/node.exe';
        vivos.set(940, 'node.exe');
        rutasProceso.set(940, propio);
        duenos.set(9840, 940);
        vivos.set(941, 'node.exe');
        rutasProceso.set(941, ajeno);
        writeFileSync(
          rutas.estado(),
          JSON.stringify([reg('proy-a-vite', 940, propio), reg('proy-b-vite', 941, ajeno)]),
        );
        const s = conRutas();
        await s.readoptar();
        expect(matados).toEqual([940]);
        await s.cerrar();
      });

      it('solo si su puerto lo escucha ese mismo PID (sin puerto o con otro dueño no se toca)', async () => {
        const exe = path.join(base, 'bin', 'php', '8.4.13', 'php-cgi.exe');
        for (const pid of [950, 951, 952]) {
          vivos.set(pid, 'php-cgi.exe');
          rutasProceso.set(pid, exe);
        }
        duenos.set(9850, 777); // el puerto lo tiene otro proceso
        // 952 no escucha nada (puerto libre)
        writeFileSync(
          rutas.estado(),
          JSON.stringify([
            reg('php-8.4-0', 950, exe, undefined, undefined),
            reg('php-8.4-1', 951, exe, undefined, 9850),
            reg('php-8.4-2', 952, exe, undefined, 9852),
          ]),
        );
        const s = conRutas();
        await s.readoptar();
        expect(matados).toEqual([]);
        await s.cerrar();
      });
    });

    it('una entrada proy- de una versión previa: exige la hora y su puerto no es sonda', async () => {
      sondaOk = false;
      vivos.set(777, 'node.exe');
      creaciones.set(777, 't777');
      vivos.set(778, 'node.exe');
      creaciones.set(778, 't778');
      const viejo = (id: string, pid: number, creado?: string) => ({
        id,
        pid,
        ejecutable: 'C:/n/node.exe',
        args: [],
        puerto: 5173,
        log: def().log,
        reiniciar: false,
        ...(creado ? { creado } : {}),
      });
      writeFileSync(
        rutas.estado(),
        JSON.stringify([viejo('proy-a-sinhora', 777), viejo('proy-b-conhora', 778, 't778')]),
      );
      const s = crear();
      await s.readoptar();
      expect(s.ids()).toEqual(['proy-b-conhora']);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(s.estado('proy-b-conhora')).toBe('encendido');
      expect(matados).toEqual([]);
      expect(emitidos.at(-1)).toMatchObject({ id: 'proy-b-conhora', puertos: [5173] });
      const reg = JSON.parse(readFileSync(rutas.estado(), 'utf8'))[0];
      expect(reg).toMatchObject({ exigirInicio: true, creado: 't778', puertoInformativo: 5173 });
      expect(reg.puerto).toBeUndefined();
      await s.cerrar();
    });

    it('tras un reinicio guarda la hora del proceso nuevo', async () => {
      const s = crear();
      await s.iniciar({ ...defNode(), reiniciar: true });
      morir(hijos.at(-1)!);
      await vi.advanceTimersByTimeAsync(1000);
      const pid = s.pid('proy-demo-vite')!;
      expect(JSON.parse(readFileSync(rutas.estado(), 'utf8'))[0].creado).toBe(`t${pid}`);
      expect(s.reinicios('proy-demo-vite')).toBe(1);
      await s.cerrar();
    });
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

import { EventEmitter } from 'node:events';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { carpetaTemporal } from './temporales';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { Plataforma } from '../src/plataforma/tipos';
import { ErrorDetenidoAlIniciar, Supervisor, type DefProceso } from '../src/procesos/supervisor';
import {
  idSupervisor,
  ProcesosProyecto,
  separarIdSupervisor,
  type SupervisorProcesos,
} from '../src/proyectos/procesos';
import { Rutas } from '../src/rutas';
import { Servicios } from '../src/servicios/servicios';
import {
  ProcesoProyectoSchema,
  SitioSchema,
  type EstadoServicio,
  type ProcesoProyecto,
  type Sitio,
} from '../src/tipos';

/* ───────────── Armado ───────────── */

type EstadoSup = ReturnType<SupervisorProcesos['estado']>;

/** Supervisor falso: guarda las definiciones y los ids detenidos. */
class SupervisorFalso implements SupervisorProcesos {
  readonly iniciados: DefProceso[] = [];
  readonly detenidos: string[] = [];
  readonly estados = new Map<string, EstadoSup>();
  readonly mensajes = new Map<string, string>();
  alIniciar?: (def: DefProceso) => Promise<void>;

  async iniciar(def: DefProceso): Promise<void> {
    this.iniciados.push(def);
    this.estados.set(def.id, 'encendido');
    await this.alIniciar?.(def);
  }
  async detener(id: string): Promise<void> {
    this.detenidos.push(id);
    this.estados.delete(id);
  }
  estado(id: string): EstadoSup {
    return this.estados.get(id) ?? 'apagado';
  }
  pid(id: string): number | null {
    return this.estados.has(id) ? 4242 : null;
  }
  mensaje(id: string): string | undefined {
    return this.mensajes.get(id);
  }
  ids(): string[] {
    return [...this.estados.keys()];
  }
}

const proceso = (extra: Partial<ProcesoProyecto> & { id: string }): ProcesoProyecto =>
  ProcesoProyectoSchema.parse({ comando: ['npm', 'run', 'dev'], ...extra });

interface Armado {
  base: string;
  carpeta: string;
  rutas: Rutas;
  sitios: Sitio[];
  sup: SupervisorFalso;
  procesos: ProcesosProyecto;
  nodeDir: string;
  pythonDir: string;
  phpExe: string;
  phpIni: string;
}

interface OpcionesArmado {
  procesos?: ProcesoProyecto[];
  sitio?: Partial<Sitio>;
  avisos?: string[];
  sinNode?: boolean;
  supervisor?: SupervisorProcesos;
}

async function armar(o: OpcionesArmado = {}): Promise<Armado> {
  const base = await carpetaTemporal('pel-procs-base-');
  const carpeta = await carpetaTemporal('pel-procs-proy-');
  const rutas = new Rutas(base);
  const nodeDir = rutas.bin('node', '22.1.0');
  const pythonDir = rutas.bin('python', '3.12.10');
  const phpExe = join(base, 'bin', 'php', '8.4', 'php.exe');
  const phpIni = join(base, 'etc', 'php', '8.4', 'php.ini');
  const sitios: Sitio[] = [
    SitioSchema.parse({
      id: 'demo',
      nombre: 'Demo',
      dominio: 'demo.test',
      carpeta,
      tipo: 'node',
      procesos: o.procesos ?? [proceso({ id: 'vite', puerto: 5173 })],
      ...o.sitio,
    }),
  ];
  const sup = new SupervisorFalso();
  const procesos = new ProcesosProyecto({
    rutas,
    supervisor: o.supervisor ?? sup,
    leerSitios: async () => sitios,
    entorno: { Path: 'C:\\Windows\\system32', OTRA: 'secreto-del-usuario' },
    runtimes: {
      paraProyecto: async () => ({
        ...(o.sinNode ? {} : { node: '22.1.0' }),
        python: '3.12.10',
        avisos: o.avisos ?? [],
      }),
      carpetasPath: (v) => [
        ...(v.node
          ? [rutas.bin('node', v.node), join(rutas.bin('node', v.node), 'node_modules', '.bin')]
          : []),
        ...(v.python
          ? [rutas.bin('python', v.python), join(rutas.bin('python', v.python), 'Scripts')]
          : []),
      ],
      rutaBin: (tipo, version) => rutas.bin(tipo, version),
    },
    php: async () => ({ exe: phpExe, ini: phpIni }),
  });
  return { base, carpeta, rutas, sitios, sup, procesos, nodeDir, pythonDir, phpExe, phpIni };
}

const pathDe = (def: DefProceso): string[] => (def.env?.Path ?? '').split(';');

afterEach(() => {
  vi.useRealTimers();
});

/* ───────────── Ids ───────────── */

describe('ids de supervisor', () => {
  it('proy-<sitio>-<proceso>; el último guion separa (el sitio puede llevar guiones)', () => {
    expect(idSupervisor('demo', 'vite')).toBe('proy-demo-vite');
    expect(idSupervisor('mi-tienda-2', 'queue_work')).toBe('proy-mi-tienda-2-queue_work');
    expect(separarIdSupervisor('proy-mi-tienda-2-queue_work')).toEqual({
      sitioId: 'mi-tienda-2',
      procesoId: 'queue_work',
    });
    expect(separarIdSupervisor('nginx')).toBeNull();
    expect(separarIdSupervisor('proy-solo')).toBeNull();
    expect(separarIdSupervisor('tunel-demo')).toBeNull();
  });

  it('rechaza ids con separadores o caracteres de ruta', () => {
    expect(() => idSupervisor('demo', 'a-b')).toThrow(/Id de proceso no válido/);
    expect(() => idSupervisor('demo', '..')).toThrow(/Id de proceso no válido/);
    expect(() => idSupervisor('de/mo', 'vite')).toThrow(/Id de proyecto no válido/);
    expect(() => idSupervisor('..\\x', 'vite')).toThrow(/Id de proyecto no válido/);
    expect(() => idSupervisor('', 'vite')).toThrow(/Id de proyecto no válido/);
  });

  it('el esquema no acepta guiones en el id del proceso y `proxy` vale false por defecto', () => {
    expect(ProcesoProyectoSchema.safeParse({ id: 'npm-dev', comando: ['x'] }).success).toBe(false);
    expect(ProcesoProyectoSchema.parse({ id: 'npm_dev', comando: ['x'] }).proxy).toBe(false);
  });
});

/* ───────────── Iniciar ───────────── */

describe('iniciar', () => {
  it('lanza sin shell el npm del proyecto, en su carpeta, con log en logs/proyectos', async () => {
    const a = await armar();
    await a.procesos.iniciar('demo', 'vite');
    expect(a.sup.iniciados).toHaveLength(1);
    const def = a.sup.iniciados[0]!;
    expect(def.id).toBe('proy-demo-vite');
    expect(def.comando).toBe(join(a.nodeDir, 'node.exe'));
    expect(def.args).toEqual([
      join(a.nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      'run',
      'dev',
    ]);
    expect(def.cwd).toBe(a.carpeta);
    expect(def.puerto).toBe(5173);
    expect(def.reiniciar).toBe(false);
    expect(def.log).toBe(a.rutas.logs('proyectos', 'demo-vite.log'));
    expect(await readFile(def.log, 'utf8')).toMatch(/\[WolfCore Dev\] .* > npm run dev\n/);
  });

  it('PATH: Scripts del .venv antes que Node y Python del runtime, luego tools\\bin y el PATH', async () => {
    const a = await armar();
    await mkdir(join(a.carpeta, '.venv', 'Scripts'), { recursive: true });
    await a.procesos.iniciar('demo', 'vite');
    const def = a.sup.iniciados[0]!;
    expect(pathDe(def)).toEqual([
      join(a.carpeta, '.venv', 'Scripts'),
      a.nodeDir,
      join(a.nodeDir, 'node_modules', '.bin'),
      a.pythonDir,
      join(a.pythonDir, 'Scripts'),
      a.rutas.herramientas('bin'),
      'C:\\Windows\\system32',
    ]);
    expect(def.env?.VIRTUAL_ENV).toBe(join(a.carpeta, '.venv'));
    // Solo las variables que cambian: el resto del entorno no se copia (ni a estado.json).
    expect(def.env?.OTRA).toBeUndefined();
    expect(def.env?.PATH).toBeUndefined();
  });

  it('python usa el del .venv; php lleva su php.ini y PHPRC', async () => {
    const a = await armar({
      sitio: { tipo: 'laravel', php: '8.4' },
      procesos: [
        proceso({ id: 'api', comando: ['python', '-m', 'uvicorn', 'app:app'] }),
        proceso({ id: 'cola', comando: ['php', 'artisan', 'queue:work'] }),
      ],
    });
    await mkdir(join(a.carpeta, '.venv', 'Scripts'), { recursive: true });
    await writeFile(join(a.carpeta, '.venv', 'Scripts', 'python.exe'), '');
    await a.procesos.iniciar('demo', 'api');
    await a.procesos.iniciar('demo', 'cola');
    const [api, cola] = a.sup.iniciados;
    expect(api!.comando).toBe(join(a.carpeta, '.venv', 'Scripts', 'python.exe'));
    expect(api!.args).toEqual(['-m', 'uvicorn', 'app:app']);
    expect(cola!.comando).toBe(a.phpExe);
    expect(cola!.args).toEqual(['-c', a.phpIni, 'artisan', 'queue:work']);
    expect(cola!.env?.PHPRC).toBe(join(a.base, 'etc', 'php', '8.4'));
    expect(pathDe(cola!)[0]).toBe(join(a.base, 'bin', 'php', '8.4'));
  });

  it('cwd: una subcarpeta del proyecto sí; fuera del proyecto no', async () => {
    const a = await armar({
      procesos: [
        proceso({ id: 'front', cwd: 'frontend' }),
        proceso({ id: 'fuera', cwd: '..\\otro' }),
      ],
    });
    await mkdir(join(a.carpeta, 'frontend'));
    await a.procesos.iniciar('demo', 'front');
    expect(a.sup.iniciados[0]!.cwd).toBe(join(a.carpeta, 'frontend'));
    await expect(a.procesos.iniciar('demo', 'fuera')).rejects.toThrow(/dentro del proyecto/);
  });

  it('un programa relativo con carpetas se resuelve desde la carpeta del proceso', async () => {
    const a = await armar({ procesos: [proceso({ id: 'srv', comando: ['bin\\srv.exe', '-v'] })] });
    await a.procesos.iniciar('demo', 'srv');
    expect(a.sup.iniciados[0]!.comando).toBe(join(a.carpeta, 'bin', 'srv.exe'));
  });

  it('los avisos de los runtimes van saneados al principio del log y a estados()', async () => {
    const a = await armar({
      avisos: ['Node 18 no está instalado. Instálelo desde Servicios.', 'token ghp_abcDEF123456'],
    });
    await a.procesos.iniciar('demo', 'vite');
    const log = await readFile(a.procesos.rutaLog('demo', 'vite'), 'utf8');
    const lineas = log.trimEnd().split('\n');
    expect(lineas[0]).toMatch(/Aviso: Node 18 no está instalado/);
    expect(lineas[1]).toMatch(/Aviso: token ghp_\*\*\*$/);
    expect(lineas[2]).toMatch(/> npm run dev$/);
    expect(log).not.toContain('abcDEF123456');
    const [e] = await a.procesos.estados('demo');
    expect(e!.avisos).toEqual([
      'Node 18 no está instalado. Instálelo desde Servicios.',
      'token ghp_***',
    ]);
  });

  it('sin Node: no llega al supervisor, queda en error con el motivo en el log', async () => {
    const a = await armar({ sinNode: true });
    await expect(a.procesos.iniciar('demo', 'vite')).rejects.toThrow(/No hay Node instalado/);
    expect(a.sup.iniciados).toEqual([]);
    const [e] = await a.procesos.estados('demo');
    expect(e!.estado).toBe('error');
    expect(e!.mensaje).toMatch(/No hay Node instalado/);
    expect(await readFile(e!.log, 'utf8')).toMatch(/No se pudo iniciar: No hay Node instalado/);
    // detener limpia el error.
    await a.procesos.detener('demo', 'vite');
    expect((await a.procesos.estados('demo'))[0]!.estado).toBe('apagado');
  });

  it('rechaza .cmd y .bat (necesitan consola) y procesos o proyectos inexistentes', async () => {
    const a = await armar({ procesos: [proceso({ id: 'bat', comando: ['dev.cmd'] })] });
    await expect(a.procesos.iniciar('demo', 'bat')).rejects.toThrow(/\.cmd y \.bat/);
    await expect(a.procesos.iniciar('demo', 'nada')).rejects.toThrow(/no tiene el proceso nada/);
    await expect(a.procesos.iniciar('otro', 'vite')).rejects.toThrow(/No existe el proyecto otro/);
  });

  it('detenido mientras arrancaba: no es un error', async () => {
    const a = await armar();
    a.sup.alIniciar = async (def) => {
      throw new ErrorDetenidoAlIniciar(def.id);
    };
    await expect(a.procesos.iniciar('demo', 'vite')).resolves.toBeUndefined();
  });

  it('un detener durante la preparación impide que arranque', async () => {
    let soltar!: () => void;
    const espera = new Promise<void>((r) => (soltar = r));
    const a = await armar();
    const original = a.procesos['d'].runtimes.paraProyecto;
    a.procesos['d'].runtimes.paraProyecto = async (s) => {
      await espera;
      return original(s);
    };
    const inicio = a.procesos.iniciar('demo', 'vite');
    await a.procesos.detener('demo', 'vite');
    soltar();
    await inicio;
    expect(a.sup.iniciados).toEqual([]);
  });
});

/* ───────────── Estados, proxy y auto-inicio ───────────── */

describe('estados', () => {
  it('el proxy apunta al proceso marcado aunque otro con puerto vaya antes', async () => {
    const a = await armar({
      sitio: { tipo: 'fastapi' },
      procesos: [
        proceso({ id: 'vite', puerto: 5173 }),
        proceso({ id: 'uvicorn', comando: ['python', '-m', 'uvicorn'], puerto: 8001, proxy: true }),
      ],
    });
    const e = await a.procesos.estados('demo');
    expect(e.map((x) => [x.procesoId, x.proxy])).toEqual([
      ['vite', false],
      ['uvicorn', true],
    ]);
  });

  it('sin marca, el proxy es el primero con puerto; en un sitio estático nadie es proxy', async () => {
    const a = await armar({
      procesos: [proceso({ id: 'cola' }), proceso({ id: 'vite', puerto: 5173 })],
    });
    expect((await a.procesos.estados('demo')).map((x) => x.proxy)).toEqual([false, true]);
    a.sitios[0] = { ...a.sitios[0]!, tipo: 'estatico' };
    expect((await a.procesos.estados('demo')).map((x) => x.proxy)).toEqual([false, false]);
  });

  it('estadosServicio: categoría proyecto con el id del supervisor, PID y puerto', async () => {
    const a = await armar();
    await a.procesos.iniciar('demo', 'vite');
    expect(await a.procesos.estadosServicio()).toEqual<EstadoServicio[]>([
      {
        id: 'proy-demo-vite',
        nombre: 'vite (demo.test)',
        categoria: 'proyecto',
        version: null,
        estado: 'encendido',
        puertos: [5173],
        pid: 4242,
      },
    ]);
  });
});

describe('autoIniciar', () => {
  it('arranca solo los marcados y no relanza los que ya están en marcha', async () => {
    const a = await armar({
      procesos: [
        proceso({ id: 'vite', autoIniciar: true }),
        proceso({ id: 'cola' }),
        proceso({ id: 'api', autoIniciar: true, comando: ['node', 'server.js'] }),
      ],
    });
    a.sup.estados.set('proy-demo-api', 'encendido'); // readoptado
    expect(await a.procesos.autoIniciar()).toEqual([]);
    expect(a.sup.iniciados.map((d) => d.id)).toEqual(['proy-demo-vite']);
  });

  it('un fallo no impide arrancar el resto y vuelve en la lista de errores', async () => {
    const a = await armar({
      procesos: [
        proceso({ id: 'malo', autoIniciar: true, comando: ['x.bat'] }),
        proceso({ id: 'vite', autoIniciar: true }),
      ],
    });
    const errores = await a.procesos.autoIniciar();
    expect(errores).toHaveLength(1);
    expect(errores[0]).toMatch(/^demo\.test: No se pudo iniciar malo/);
    expect(a.sup.iniciados.map((d) => d.id)).toEqual(['proy-demo-vite']);
  });

  it('se corta si el núcleo se cierra', async () => {
    const a = await armar({ procesos: [proceso({ id: 'vite', autoIniciar: true })] });
    expect(await a.procesos.autoIniciar(() => false)).toEqual([]);
    expect(a.sup.iniciados).toEqual([]);
  });

  it('antes detiene los procesos que quedaron sin proyecto', async () => {
    const a = await armar({ procesos: [] });
    a.sup.estados.set('proy-viejo-vite', 'encendido');
    a.sup.estados.set('nginx', 'encendido');
    await a.procesos.autoIniciar();
    expect(a.sup.detenidos).toEqual(['proy-viejo-vite']);
  });
});

/* ───────────── Detener y borrado ───────────── */

describe('detener', () => {
  it('detenerSitio detiene solo los procesos de ese proyecto (no los de "demo-2")', async () => {
    const a = await armar({ procesos: [proceso({ id: 'vite' }), proceso({ id: 'cola' })] });
    a.sitios.push(SitioSchema.parse({ ...a.sitios[0]!, id: 'demo-2', dominio: 'demo-2.test' }));
    await a.procesos.iniciar('demo', 'vite');
    await a.procesos.iniciar('demo', 'cola');
    await a.procesos.iniciar('demo-2', 'vite');
    a.sup.estados.set('nginx', 'encendido');
    await a.procesos.detenerSitio('demo');
    expect(a.sup.detenidos.sort()).toEqual(['proy-demo-cola', 'proy-demo-vite']);
    expect(a.sup.ids().sort()).toEqual(['nginx', 'proy-demo-2-vite']);
  });

  it('detenerTodos detiene todos los procesos de proyecto y ningún servicio', async () => {
    const a = await armar();
    await a.procesos.iniciar('demo', 'vite');
    a.sup.estados.set('php-8.4-0', 'encendido');
    a.sup.estados.set('tunel-demo', 'encendido');
    expect(await a.procesos.detenerTodos()).toEqual([]);
    expect(a.sup.detenidos).toEqual(['proy-demo-vite']);
  });

  it('detenerHuerfanos detiene un proceso quitado del proyecto', async () => {
    const a = await armar({ procesos: [proceso({ id: 'vite' }), proceso({ id: 'cola' })] });
    await a.procesos.iniciar('demo', 'vite');
    await a.procesos.iniciar('demo', 'cola');
    a.sitios[0] = { ...a.sitios[0]!, procesos: [a.sitios[0]!.procesos[0]!] };
    await a.procesos.detenerHuerfanos();
    expect(a.sup.detenidos).toEqual(['proy-demo-cola']);
  });

  it('Servicios.detenerTodo detiene primero los procesos de proyecto y los muestra en estados', async () => {
    const orden: string[] = [];
    const base = await carpetaTemporal('pel-procs-serv-');
    const s = new Servicios({
      rutas: new Rutas(base),
      plataforma: {} as Plataforma,
      supervisor: {
        estado: () => 'apagado',
        pid: () => null,
        iniciar: async () => undefined,
        detener: async (id: string) => {
          orden.push(id);
        },
      } as never,
      instalador: { instalados: async () => [], instalado: async () => false } as never,
      leerConfig: async () => (await import('../src/tipos')).ConfigSchema.parse({}),
      modificarConfig: async () => undefined,
      definiciones: [],
      sonda: async () => false,
      procesosProyecto: {
        estadosServicio: async () => [
          {
            id: 'proy-demo-vite',
            nombre: 'vite (demo.test)',
            categoria: 'proyecto',
            version: null,
            estado: 'encendido',
            puertos: [5173],
            pid: 8,
          },
        ],
        detenerTodos: async () => {
          orden.push('procesos');
          return [];
        },
      },
    });
    await s.detenerTodo().catch(() => undefined);
    expect(orden[0]).toBe('procesos');
    expect((await s.estados()).map((e) => e.id)).toContain('proy-demo-vite');
  });
});

/* ───────────── Muerte en bucle (Review Focus 4) ───────────── */

class HijoFalso extends EventEmitter {
  constructor(readonly pid: number) {
    super();
  }
  unref = vi.fn();
}

describe('proceso que muere en bucle', () => {
  it('reintenta con espera creciente y termina en error con el final del log, sin más lanzamientos', async () => {
    const base = await carpetaTemporal('pel-procs-bucle-');
    const rutas = new Rutas(base);
    await mkdir(dirname(rutas.estado()), { recursive: true });
    const vivos = new Set<number>();
    const hijos: HijoFalso[] = [];
    let siguiente = 1000;
    const plataforma = {
      procesoVivo: async (pid: number) =>
        vivos.has(pid) ? { vivo: true, ejecutable: 'node.exe' } : { vivo: false },
      matarArbol: async (pid: number) => {
        vivos.delete(pid);
      },
    } as unknown as Plataforma;
    const spawn = (() => {
      const h = new HijoFalso(siguiente++);
      vivos.add(h.pid);
      hijos.push(h);
      return h;
    }) as never;
    const eventos = new Eventos<EventosNucleo>();
    const emitidos: EstadoServicio[] = [];
    eventos.on('servicio:estado', (e) => emitidos.push(e));
    vi.useFakeTimers();
    const supervisor = new Supervisor(rutas, plataforma, eventos, {
      spawn,
      lanzarOculto: null,
      sonda: async () => false,
    });
    const a = await armar({
      supervisor,
      procesos: [proceso({ id: 'vite', reiniciar: true })],
    });
    await a.procesos.iniciar('demo', 'vite');
    const log = a.procesos.rutaLog('demo', 'vite');
    // npm run dev sin dependencias: escribe el error y muere enseguida, cada vez.
    const morir = async (): Promise<void> => {
      await writeFile(log, "Error: Cannot find module 'vite'\n", { flag: 'a' });
      const h = hijos.at(-1)!;
      vivos.delete(h.pid);
      h.emit('exit', 1, null);
    };
    for (const espera of [1000, 2000, 4000, 8000, 16000]) {
      await morir();
      expect(supervisor.estado('proy-demo-vite')).toBe('iniciando');
      await vi.advanceTimersByTimeAsync(espera);
    }
    expect(hijos).toHaveLength(6);
    await morir();
    expect(supervisor.estado('proy-demo-vite')).toBe('error');
    // Ya no se relanza: ni temporizadores ni procesos nuevos.
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(hijos).toHaveLength(6);
    const [e] = await a.procesos.estados('demo');
    expect(e!.estado).toBe('error');
    expect(e!.mensaje).toContain("Cannot find module 'vite'");
    expect(emitidos.at(-1)?.estado).toBe('error');
    await supervisor.cerrar();
  });
});

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Ejecutor, Plataforma } from '../src/plataforma/tipos';
import type { DefProceso, EstadoProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import { DEFINICIONES, registrarDefinicion } from '../src/servicios/datos';
import { generarClave, type CtxServicio, type DefServicio } from '../src/servicios/definicion';
import { ErrorPuertoOcupado } from '../src/servicios/nginx';
import { Servicios } from '../src/servicios/servicios';
import { ConfigSchema, type Config } from '../src/tipos';

let base: string;
let rutas: Rutas;
let iniciados: DefProceso[];
let detenidos: string[];
let estados: Map<string, EstadoProceso>;
let pids: Map<string, number>;
let ocupados: Map<number, { pid: number; nombre: string }>;
let respuestas: Set<number>;
let instalados: Record<string, string[]>;
let cfg: Config;
let guardados: number;

const supervisor = () =>
  ({
    iniciar: async (d: DefProceso) => {
      iniciados.push(d);
      estados.set(d.id, 'iniciando');
      pids.set(d.id, 1000 + iniciados.length);
    },
    detener: async (id: string) => {
      detenidos.push(id);
      estados.delete(id);
      pids.delete(id);
    },
    estado: (id: string) => estados.get(id) ?? 'apagado',
    pid: (id: string) => pids.get(id) ?? null,
  }) as never;

const plataforma = (): Plataforma =>
  ({
    quienUsaPuerto: async (p: number) => ocupados.get(p) ?? null,
    procesoVivo: async () => ({ vivo: false }),
    ejecutable: (n: string) => `${n}.exe`,
  }) as unknown as Plataforma;

const exec: Ejecutor = async () => ({ codigo: 0, stdout: '', stderr: '' });

const instalador = () =>
  ({
    instalados: async (s: string) => instalados[s] ?? [],
    instalado: async (s: string, v: string) => (instalados[s] ?? []).includes(v),
  }) as never;

interface DefFalsa extends DefServicio {
  inits: CtxServicio[];
  procesos: CtxServicio[];
  limpios: CtxServicio[];
  fallar: boolean;
}

function defFalsa(o: Partial<DefServicio> = {}): DefFalsa {
  const d: DefFalsa = {
    id: 'mysql',
    nombre: 'MySQL',
    categoria: 'bd',
    puertoPorDefecto: 3306,
    puertoAlternativo: 3308,
    inits: [],
    procesos: [],
    limpios: [],
    fallar: false,
    async inicializar(ctx) {
      d.inits.push(ctx);
      mkdirSync(path.join(ctx.datos, 'sub'), { recursive: true });
      writeFileSync(path.join(ctx.datos, 'sub', 'ibdata1'), 'x');
      if (d.fallar) throw new Error('initdb falló');
    },
    async proceso(ctx) {
      d.procesos.push(ctx);
      return {
        id: 'mysql',
        comando: path.join(ctx.bin, 'bin', 'mysqld.exe'),
        args: [`--port=${ctx.puerto}`, `--datadir=${ctx.datos}`],
        puerto: ctx.puerto,
        log: ctx.rutas.logs('mysql.log'),
        reiniciar: true,
      };
    },
    ...o,
  };
  return d;
}

const crear = (defs: DefServicio[]) =>
  new Servicios({
    rutas,
    plataforma: plataforma(),
    supervisor: supervisor(),
    instalador: instalador(),
    leerConfig: async () => cfg,
    modificarConfig: async (fn) => {
      fn(cfg);
      cfg = ConfigSchema.parse(cfg);
      guardados += 1;
    },
    ramasEnUso: async () => [],
    sonda: async (p) => respuestas.has(p),
    exec,
    definiciones: defs,
  });

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-def-'));
  rutas = new Rutas(base);
  iniciados = [];
  detenidos = [];
  estados = new Map();
  pids = new Map();
  ocupados = new Map();
  respuestas = new Set();
  instalados = { mysql: ['8.4.13'] };
  cfg = ConfigSchema.parse({});
  guardados = 0;
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('Config de servicios de datos', () => {
  it('trae los puertos por defecto de las Global Constraints', () => {
    const c = ConfigSchema.parse({});
    expect(c.servicios.datos).toEqual({
      mysql: { version: null, puerto: 3306, autoIniciar: false },
      mariadb: { version: null, puerto: 3307, autoIniciar: false },
      postgresql: { version: null, puerto: 5432, autoIniciar: false },
      redis: { version: null, puerto: 6379, autoIniciar: false },
      mongodb: { version: null, puerto: 27017, autoIniciar: false },
      mailpit: { version: null, puerto: 1025, autoIniciar: false },
      ollama: { version: null, puerto: 11434, autoIniciar: false },
    });
    expect(c.credenciales).toEqual({});
  });

  it('conserva lo guardado y completa lo que falta', () => {
    const c = ConfigSchema.parse({ servicios: { datos: { mysql: { puerto: 3308 } } } });
    expect(c.servicios.datos.mysql).toEqual({ version: null, puerto: 3308, autoIniciar: false });
    expect(c.servicios.datos.redis.puerto).toBe(6379);
  });
});

describe('rutas.datos', () => {
  it('usa data/<servicio>/<mayor.menor>', () => {
    expect(rutas.datos('mysql', '8.4.13')).toBe(path.join(base, 'data', 'mysql', '8.4'));
    expect(rutas.datos('postgresql', '17.12')).toBe(path.join(base, 'data', 'postgresql', '17.12'));
  });
});

describe('generarClave', () => {
  it('da 20 caracteres de [A-Za-z0-9] y distintos cada vez', () => {
    const a = generarClave();
    expect(a).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(generarClave()).not.toBe(a);
  });
});

describe('registrarDefinicion', () => {
  it('agrega la definición al registro y reemplaza la del mismo id', () => {
    const antes = [...DEFINICIONES];
    try {
      const a = defFalsa();
      const b = defFalsa({ nombre: 'Otro' });
      registrarDefinicion(a);
      registrarDefinicion(b);
      expect(DEFINICIONES.filter((d) => d.id === 'mysql')).toEqual([b]);
    } finally {
      DEFINICIONES.splice(0, DEFINICIONES.length, ...antes);
    }
  });
});

describe('Servicios con definiciones', () => {
  it('inicializa una sola vez y arranca con su DefProceso', async () => {
    const d = defFalsa();
    const s = crear([d]);
    await s.iniciar('mysql');
    const ctx = d.inits[0]!;
    expect(ctx.bin).toBe(rutas.bin('mysql', '8.4.13'));
    expect(ctx.datos).toBe(rutas.datos('mysql', '8.4.13'));
    expect(ctx.puerto).toBe(3306);
    expect(ctx.version).toBe('8.4.13');
    expect(ctx.rutas).toBe(rutas);
    expect(ctx.exec).toBe(exec);
    expect(ctx.credenciales.usuario).toBe('root');
    expect(ctx.credenciales.clave).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(cfg.credenciales.mysql).toEqual(ctx.credenciales);
    expect(existsSync(path.join(ctx.datos, '.pel-inicializado'))).toBe(true);
    expect(iniciados).toHaveLength(1);
    expect(iniciados[0]).toMatchObject({
      id: 'mysql',
      comando: path.join(rutas.bin('mysql', '8.4.13'), 'bin', 'mysqld.exe'),
      args: ['--port=3306', `--datadir=${ctx.datos}`],
      puerto: 3306,
    });

    await s.detener('mysql');
    await s.iniciar('mysql');
    expect(d.inits).toHaveLength(1);
    expect(iniciados).toHaveLength(2);
    expect(d.procesos[1]!.credenciales.clave).toBe(ctx.credenciales.clave);
  });

  it('si inicializar falla borra los datos creados, no deja marca y no arranca', async () => {
    const d = defFalsa();
    d.fallar = true;
    const err = await crear([d])
      .iniciar('mysql')
      .catch((e: unknown) => e);
    expect((err as Error).message).toBe('No se pudo preparar MySQL: initdb falló');
    expect(existsSync(rutas.datos('mysql', '8.4.13'))).toBe(false);
    expect(iniciados).toHaveLength(0);
    // las credenciales quedan para el siguiente intento
    expect(cfg.credenciales.mysql?.clave).toMatch(/^[A-Za-z0-9]{20}$/);
  });

  it('si la carpeta de datos ya existía no la borra al fallar', async () => {
    const datos = rutas.datos('mysql', '8.4.13');
    mkdirSync(datos, { recursive: true });
    writeFileSync(path.join(datos, 'previo.txt'), 'no borrar');
    const d = defFalsa();
    d.fallar = true;
    await expect(crear([d]).iniciar('mysql')).rejects.toThrow(/No se pudo preparar MySQL/);
    expect(existsSync(path.join(datos, 'previo.txt'))).toBe(true);
    expect(existsSync(path.join(datos, '.pel-inicializado'))).toBe(false);
  });

  it('con el puerto ocupado lanza ErrorPuertoOcupado con alternativo 3308', async () => {
    ocupados.set(3306, { pid: 4321, nombre: 'mysqld.exe' });
    const d = defFalsa();
    const err = await crear([d])
      .iniciar('mysql')
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ErrorPuertoOcupado);
    expect(err).toMatchObject({ puerto: 3306, pid: 4321, nombre: 'mysqld.exe', alternativo: 3308 });
    expect((err as Error).message).toBe(
      'El puerto 3306 lo usa mysqld.exe (PID 4321). Use el puerto 3308.',
    );
    expect(d.inits).toHaveLength(0);
    expect(iniciados).toHaveLength(0);
  });

  it('no ofrece alternativo si también está ocupado o si ya se usa el alternativo', async () => {
    ocupados.set(3306, { pid: 1, nombre: 'a.exe' });
    ocupados.set(3308, { pid: 2, nombre: 'b.exe' });
    const err = await crear([defFalsa()])
      .iniciar('mysql')
      .catch((e: unknown) => e);
    expect((err as ErrorPuertoOcupado).alternativo).toBeUndefined();

    ocupados.delete(3306);
    cfg.servicios.datos.mysql.puerto = 3308;
    const err2 = await crear([defFalsa()])
      .iniciar('mysql')
      .catch((e: unknown) => e);
    expect(err2).toMatchObject({ puerto: 3308, alternativo: 3306 });
  });

  it('un puerto extra ocupado también impide arrancar', async () => {
    instalados = { mailpit: ['1.29.0'] };
    const d = defFalsa({
      id: 'mailpit',
      nombre: 'Mailpit',
      categoria: 'herramienta',
      puertoPorDefecto: 1025,
      puertoAlternativo: undefined,
      puertosExtra: [8025],
    });
    ocupados.set(8025, { pid: 9, nombre: 'otro.exe' });
    const err = await crear([d])
      .iniciar('mailpit')
      .catch((e: unknown) => e);
    expect(err).toMatchObject({ puerto: 8025, pid: 9 });
    expect((err as ErrorPuertoOcupado).alternativo).toBeUndefined();
    expect(iniciados).toHaveLength(0);
  });

  it('falla en español si no está instalado', async () => {
    instalados = {};
    await expect(crear([defFalsa()]).iniciar('mysql')).rejects.toThrow(
      'MySQL no está instalado. Instálelo desde Servicios.',
    );
  });

  it('usa la versión configurada si está instalada, si no la más reciente', async () => {
    instalados = { mysql: ['8.0.40', '8.4.13'] };
    cfg.servicios.datos.mysql.version = '8.0.40';
    const d = defFalsa();
    await crear([d]).iniciar('mysql');
    expect(d.procesos[0]!.version).toBe('8.0.40');
    expect(d.procesos[0]!.datos).toBe(path.join(base, 'data', 'mysql', '8.0'));

    estados.clear();
    cfg.servicios.datos.mysql.version = '9.9.9';
    await crear([d]).iniciar('mysql');
    expect(d.procesos[1]!.version).toBe('8.4.13');
  });

  it('detener usa detenerLimpio y luego libera en el supervisor', async () => {
    const limpios: string[] = [];
    const d = defFalsa({
      detenerLimpio: async (ctx) => {
        limpios.push(ctx.datos);
      },
    });
    const s = crear([d]);
    await s.iniciar('mysql');
    await s.detener('mysql');
    expect(limpios).toEqual([rutas.datos('mysql', '8.4.13')]);
    expect(detenidos).toEqual(['mysql']);
  });

  it('detener funciona aunque detenerLimpio falle', async () => {
    const d = defFalsa({
      detenerLimpio: async () => {
        throw new Error('mysqladmin falló');
      },
    });
    const s = crear([d]);
    await s.iniciar('mysql');
    await expect(s.detener('mysql')).resolves.toBeUndefined();
    expect(detenidos).toEqual(['mysql']);
  });

  it('iniciarTodo arranca los servicios con autoIniciar', async () => {
    instalados = { mysql: ['8.4.13'], redis: ['8.10.3'] };
    cfg.servicios.datos.redis.autoIniciar = true;
    const my = defFalsa();
    const redis = defFalsa({ id: 'redis', nombre: 'Redis', puertoPorDefecto: 6379 });
    const s = crear([my, redis]);
    // nginx no está instalado: su error se informa, pero no impide arrancar Redis
    await expect(s.iniciarTodo()).rejects.toThrow(/Nginx no está instalado/);
    expect(iniciados.map((x) => x.id)).toEqual(['redis']);
    await s.detenerTodo();
    expect(detenidos).toContain('redis');
  });
});

describe('estados() con definiciones', () => {
  it('incluye categoría, versión y puertos; las de nginx y PHP llevan la suya', async () => {
    instalados = { mysql: ['8.4.13'], php: ['8.4'], nginx: ['1.30.6'] };
    const mailpit = defFalsa({
      id: 'mailpit',
      nombre: 'Mailpit',
      categoria: 'herramienta',
      puertoPorDefecto: 1025,
      puertosExtra: [8025],
    });
    instalados.mailpit = ['1.29.0'];
    const e = await crear([defFalsa(), mailpit]).estados();
    expect(e.find((s) => s.id === 'nginx')!.categoria).toBe('web');
    expect(e.find((s) => s.id === 'php-8.4')!.categoria).toBe('php');
    expect(e.find((s) => s.id === 'mysql')).toEqual({
      id: 'mysql',
      nombre: 'MySQL',
      categoria: 'bd',
      version: '8.4.13',
      estado: 'apagado',
      puertos: [3306],
      pid: null,
    });
    expect(e.find((s) => s.id === 'mailpit')).toMatchObject({
      categoria: 'herramienta',
      puertos: [1025, 8025],
    });
  });

  it('no muestra un servicio definido que no está instalado', async () => {
    instalados = {};
    const e = await crear([defFalsa()]).estados();
    expect(e.find((s) => s.id === 'mysql')).toBeUndefined();
  });

  it('sin el servicio propio instalado se mantiene la entrada externa', async () => {
    instalados = {};
    respuestas.add(3306);
    const e = await crear([defFalsa()]).estados();
    expect(e.filter((s) => s.id === 'mysql')).toEqual([
      expect.objectContaining({ estado: 'externo', categoria: 'bd' }),
    ]);
  });

  it('con el propio instalado desaparece la externa y el puerto ajeno es conflicto', async () => {
    respuestas.add(3306);
    ocupados.set(3306, { pid: 777, nombre: 'FlyEnv.exe' });
    const e = await crear([defFalsa()]).estados();
    const my = e.filter((s) => s.id === 'mysql');
    expect(my).toHaveLength(1);
    expect(my[0]).toMatchObject({
      estado: 'apagado',
      mensaje: 'El puerto 3306 lo usa FlyEnv.exe (PID 777). Use el puerto 3308.',
    });
  });

  it('el conflicto omite la sugerencia si no hay alternativo', async () => {
    instalados = { ollama: ['0.13.5'] };
    respuestas.add(11434);
    ocupados.set(11434, { pid: 5, nombre: 'ollama.exe' });
    const d = defFalsa({
      id: 'ollama',
      nombre: 'Ollama',
      categoria: 'ia',
      puertoPorDefecto: 11434,
      puertoAlternativo: undefined,
    });
    const e = await crear([d]).estados();
    expect(e.find((s) => s.id === 'ollama')!.mensaje).toBe(
      'El puerto 11434 lo usa ollama.exe (PID 5).',
    );
  });

  it('no es conflicto si el puerto lo usa nuestro propio proceso', async () => {
    const s = crear([defFalsa()]);
    await s.iniciar('mysql');
    const pid = pids.get('mysql')!;
    respuestas.add(3306);
    ocupados.set(3306, { pid, nombre: 'mysqld.exe' });
    const my = (await s.estados()).find((x) => x.id === 'mysql')!;
    expect(my.mensaje).toBeUndefined();
    expect(my.pid).toBe(pid);
    expect(my.estado).toBe('iniciando');
  });
});

describe('cambiarPuerto', () => {
  it('rechaza puertos fuera de 1024–65535', async () => {
    const s = crear([defFalsa()]);
    await expect(s.cambiarPuerto('mysql', 80)).rejects.toThrow(
      'El puerto debe ser un número entre 1024 y 65535.',
    );
    await expect(s.cambiarPuerto('mysql', 70000)).rejects.toThrow(/entre 1024 y 65535/);
    await expect(s.cambiarPuerto('mysql', 3306.5)).rejects.toThrow(/entre 1024 y 65535/);
    expect(cfg.servicios.datos.mysql.puerto).toBe(3306);
  });

  it('rechaza un puerto ocupado', async () => {
    ocupados.set(3308, { pid: 12, nombre: 'FlyEnv.exe' });
    const s = crear([defFalsa()]);
    await expect(s.cambiarPuerto('mysql', 3308)).rejects.toBeInstanceOf(ErrorPuertoOcupado);
    expect(cfg.servicios.datos.mysql.puerto).toBe(3306);
  });

  it('rechaza el puerto de otro servicio propio', async () => {
    const s = crear([defFalsa()]);
    await expect(s.cambiarPuerto('mysql', 3307)).rejects.toThrow(
      'El puerto 3307 ya está asignado a MariaDB.',
    );
  });

  it('guarda sin arrancar si estaba apagado', async () => {
    const s = crear([defFalsa()]);
    await s.cambiarPuerto('mysql', 3308);
    expect(cfg.servicios.datos.mysql.puerto).toBe(3308);
    expect(guardados).toBe(1);
    expect(iniciados).toHaveLength(0);
  });

  it('guarda y reinicia si estaba encendido', async () => {
    const d = defFalsa();
    const s = crear([d]);
    await s.iniciar('mysql');
    await s.cambiarPuerto('mysql', 3308);
    expect(detenidos).toEqual(['mysql']);
    expect(iniciados.map((x) => x.puerto)).toEqual([3306, 3308]);
  });
});

describe('borrarDatos', () => {
  it('rechaza si la confirmación no es el id', async () => {
    const datos = rutas.datos('mysql', '8.4.13');
    mkdirSync(datos, { recursive: true });
    await expect(crear([defFalsa()]).borrarDatos('mysql', 'x')).rejects.toThrow(
      'Para borrar los datos de MySQL escriba "mysql".',
    );
    expect(existsSync(datos)).toBe(true);
  });

  it('detiene el servicio y borra su carpeta de datos', async () => {
    const s = crear([defFalsa()]);
    await s.iniciar('mysql');
    await s.borrarDatos('mysql', 'mysql');
    expect(detenidos).toEqual(['mysql']);
    expect(existsSync(path.join(base, 'data', 'mysql'))).toBe(false);
  });
});

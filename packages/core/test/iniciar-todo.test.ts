import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlmacenCredenciales } from '../src/almacen';
import type { Plataforma } from '../src/plataforma/tipos';
import {
  ErrorDetenidoAlIniciar,
  type DefProceso,
  type EstadoProceso,
} from '../src/procesos/supervisor';
import { claveMayor, Rutas } from '../src/rutas';
import { MARCA_INICIALIZADO, type DefServicio } from '../src/servicios/definicion';
import { Servicios, type DepsServicios } from '../src/servicios/servicios';
import { usosDeEnv, type UsoSitio } from '../src/servicios/usoBases';
import { leerVariablesEnv } from '../src/proyectos/detectar';
import { ConfigSchema, type Config } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let base: string;
let rutas: Rutas;
let cfg: Config;
let instalados: Record<string, string[]>;
let estados: Map<string, EstadoProceso>;
let puertos: Map<string, number>;
let orden: string[];
let ocupadosPorOtro: Set<number>;
let usos: UsoSitio[];

const def = (o: Partial<DefServicio> & Pick<DefServicio, 'id' | 'nombre'>): DefServicio => ({
  categoria: 'bd',
  puertoPorDefecto: 3306,
  async inicializar(c) {
    mkdirSync(c.datos, { recursive: true });
    writeFileSync(path.join(c.datos, 'ibdata1'), c.version);
  },
  async proceso(c) {
    return {
      id: o.id,
      comando: path.join(c.bin, 'servidor.exe'),
      args: [`--port=${c.puerto}`],
      puerto: c.puerto,
      log: c.rutas.logs(`${o.id}.log`),
      reiniciar: false,
      env: { VERSION: c.version },
    };
  },
  ...o,
});

const defs = (): DefServicio[] => [
  def({ id: 'mysql', nombre: 'MySQL', puertoPorDefecto: 3306 }),
  def({ id: 'mariadb', nombre: 'MariaDB', puertoPorDefecto: 3307 }),
  def({ id: 'postgresql', nombre: 'PostgreSQL', puertoPorDefecto: 5432, claveDatos: claveMayor }),
  def({
    id: 'mailpit',
    nombre: 'Mailpit',
    categoria: 'herramienta',
    puertoPorDefecto: 1025,
    claveDatos: () => 'actual',
    multiInstancia: false,
  }),
];

/** Procesos de proyecto falsos: registran cuándo arrancan y respetan el bloqueo. */
const procesos = (): NonNullable<DepsServicios['procesosProyecto']> => ({
  estadosServicio: async () => [],
  detenerTodos: async () => [],
  pendientesAutoIniciar: async () =>
    ['bot', 'web']
      .filter((id) => !orden.some((x) => x.startsWith(`proceso:${id}:`)))
      .map((id) => ({ id: `proceso-${id}`, nombre: `uvicorn (${id}.test)` })),
  autoIniciar: async (_seguir, bloqueo) => {
    const mensajes: string[] = [];
    for (const s of [
      { id: 'bot', dominio: 'bot.test' },
      { id: 'web', dominio: 'web.test' },
    ]) {
      const motivo = (await bloqueo?.(s.id)) ?? null;
      if (motivo) {
        mensajes.push(`${s.dominio}: uvicorn ${motivo}`);
        continue;
      }
      orden.push(`proceso:${s.id}:${[...estados.keys()].sort().join(',')}`);
    }
    return mensajes;
  },
});

function crear(extra: Partial<DepsServicios> = {}): Servicios {
  return new Servicios({
    rutas,
    plataforma: {
      quienUsaPuerto: async (p: number) =>
        ocupadosPorOtro.has(p) ? { pid: 4242, nombre: 'otro.exe' } : null,
      duenosDePuertos: async (ps: number[]) =>
        new Map(
          ps.filter((p) => ocupadosPorOtro.has(p)).map((p) => [p, { pid: 4242, nombre: 'otro' }]),
        ),
      rangosReservados: async () => [],
    } as unknown as Plataforma,
    supervisor: {
      iniciar: async (d: DefProceso) => {
        orden.push(`iniciar:${d.id}`);
        estados.set(d.id, 'encendido');
        if (d.puerto !== undefined) puertos.set(d.id, d.puerto);
      },
      detener: async (id: string) => {
        estados.delete(id);
      },
      estado: (id: string) => estados.get(id) ?? 'apagado',
      pid: (id: string) => (estados.has(id) ? 1000 : null),
      renombrarRegistro: () => undefined,
    } as never,
    instalador: {
      instalados: async (s: string) => instalados[s] ?? [],
      instalado: async (s: string, v: string) => (instalados[s] ?? []).includes(v),
    } as never,
    leerConfig: async () => cfg,
    modificarConfig: async (fn) => {
      const copia = structuredClone(cfg);
      fn(copia);
      cfg = ConfigSchema.parse(copia);
    },
    credenciales: new AlmacenCredenciales(rutas),
    // Responde un puerto de un proceso nuestro encendido (o de otro programa).
    sonda: async (p) =>
      ocupadosPorOtro.has(p) ||
      [...puertos].some(([id, q]) => q === p && estados.get(id) === 'encendido'),
    definiciones: defs(),
    existePid: () => false,
    plazoSaludMs: 1000,
    procesosProyecto: procesos(),
    usosDeSitios: async () => usos,
    ...extra,
  });
}

/**
 * "Iniciar todo" sin Nginx instalado (no hace falta para estas pruebas): su fallo se informa
 * junto con los demás. Devuelve los nombres que fallaron, sin Nginx.
 */
async function iniciarTodo(s: Servicios): Promise<{ nombres: string[]; mensaje: string }> {
  try {
    await s.iniciarTodo();
    return { nombres: [], mensaje: '' };
  } catch (e) {
    const x = e as Error & { codigo?: string; datos?: { nombres?: string } };
    expect(x.codigo).toBe('servicios.iniciar_todo_fallos');
    const nombres = (x.datos?.nombres ?? '').split(', ').filter((n) => n !== 'Nginx');
    return { nombres, mensaje: x.message };
  }
}

/** La forma que deja la migración a instancias (QA real): una instancia por base, sin autoIniciar. */
function configMigrada(): void {
  cfg.servicios.datos.mysql = {
    ...cfg.servicios.datos.mysql,
    version: '8.4.13',
    puerto: 3306,
    autoIniciar: false,
    predeterminada: '8.4',
    instancias: { '8.4': { version: '8.4.13', puerto: 3306, autoIniciar: false } },
  };
  cfg.servicios.datos.postgresql = {
    ...cfg.servicios.datos.postgresql,
    version: '17.12',
    puerto: 5432,
    autoIniciar: false,
    predeterminada: '17',
    instancias: { '17': { version: '17.12', puerto: 5432, autoIniciar: false } },
  };
}

beforeEach(async () => {
  base = await carpetaTemporal('pel-iniciar-todo-');
  rutas = new Rutas(base);
  cfg = ConfigSchema.parse({});
  instalados = { mysql: ['8.4.13'], postgresql: ['17.12'], mailpit: ['1.29.0'] };
  estados = new Map();
  puertos = new Map();
  orden = [];
  ocupadosPorOtro = new Set();
  usos = [
    { sitioId: 'bot', usos: [{ servicio: 'postgresql', puerto: 5432 }] },
    { sitioId: 'web', usos: [{ servicio: 'mysql', puerto: 3306 }] },
  ];
});

describe('Iniciar todo con la configuración migrada a instancias', () => {
  it('enciende mysql@8.4 y postgresql@17 aunque no tengan autoIniciar, y luego los procesos', async () => {
    configMigrada();
    expect((await iniciarTodo(crear())).nombres).toEqual([]);
    const bases = orden.filter((x) => x.startsWith('iniciar:'));
    expect(bases).toEqual(['iniciar:mysql@8.4', 'iniciar:postgresql@17']);
    // Mailpit (herramienta) sin autoIniciar no se enciende.
    expect(estados.has('mailpit')).toBe(false);
    // Los procesos arrancan después, con sus bases ya encendidas.
    expect(orden.slice(-2)).toEqual([
      'proceso:bot:mysql@8.4,postgresql@17',
      'proceso:web:mysql@8.4,postgresql@17',
    ]);
  });

  it('también con la forma de una sola instancia (implícita): enciende la predeterminada', async () => {
    expect((await iniciarTodo(crear())).nombres).toEqual([]);
    expect(orden.filter((x) => x.startsWith('iniciar:'))).toEqual([
      'iniciar:mysql',
      'iniciar:postgresql',
    ]);
  });

  it('enciende la instancia no predeterminada que usa un proyecto (por puerto)', async () => {
    configMigrada();
    instalados['mysql'] = ['8.0.44', '8.4.13'];
    cfg.servicios.datos.mysql.instancias!['8.0'] = {
      version: '8.0.44',
      puerto: 3310,
      autoIniciar: false,
    };
    usos = [{ sitioId: 'web', usos: [{ servicio: 'mysql', puerto: 3310 }] }];
    expect((await iniciarTodo(crear())).nombres).toEqual([]);
    expect(estados.get('mysql@8.0')).toBe('encendido');
    expect(estados.get('mysql@8.4')).toBe('encendido');
  });

  it('una base que no arranca se informa con su nombre y el resto sigue', async () => {
    configMigrada();
    ocupadosPorOtro.add(5432); // otro programa tiene el puerto de PostgreSQL
    const r = await iniciarTodo(crear());
    expect(r.nombres).toEqual(['PostgreSQL 17']);
    expect(r.mensaje).toMatch(/PostgreSQL 17: .*5432/);
    expect(estados.get('mysql@8.4')).toBe('encendido');
  });

  it('un proceso cuya base no responde no se arranca y queda en el error', async () => {
    configMigrada();
    instalados['postgresql'] = []; // sin binarios: no arranca y nada responde en 5432
    const r = await iniciarTodo(crear());
    expect(r.nombres).toEqual(['PostgreSQL 17', 'bot.test']);
    expect(r.mensaje).toMatch(/bot\.test: uvicorn no se inició porque PostgreSQL \(puerto 5432\)/);
    expect(orden.some((x) => x.startsWith('proceso:bot'))).toBe(false);
    expect(orden.some((x) => x.startsWith('proceso:web'))).toBe(true);
  });

  it('nunca abre túneles: no lanza ningún cloudflared', async () => {
    configMigrada();
    await iniciarTodo(crear());
    expect(orden.some((x) => x.includes('tunel'))).toBe(false);
  });
});

describe('Iniciar todo: orden de arranque y manejo de errores (D54d)', () => {
  /** PHP y Nginx falsos: registran su arranque sin necesitar binarios. */
  function conPhpYNginx(
    s: Servicios,
    fallos: { php?: Record<string, unknown>; nginx?: unknown } = {},
  ): void {
    vi.spyOn(s.php, 'iniciar').mockImplementation(async (rama: string) => {
      orden.push(`php:${rama}`);
      if (fallos.php?.[rama] !== undefined) throw fallos.php[rama];
    });
    vi.spyOn(s.nginx, 'iniciar').mockImplementation(async () => {
      orden.push('nginx');
      if (fallos.nginx !== undefined) throw fallos.nginx;
    });
  }

  it('arranca PHP (en el orden de las ramas, solo las instaladas), Nginx, las bases y los procesos', async () => {
    configMigrada();
    instalados['php'] = ['8.4', '8.3'];
    const s = crear({ ramasEnUso: async () => ['8.3', '7.4', '8.4'] });
    conPhpYNginx(s);
    await s.iniciarTodo();
    expect(orden).toEqual([
      'php:8.3',
      'php:8.4',
      'nginx',
      'iniciar:mysql@8.4',
      'iniciar:postgresql@17',
      'proceso:bot:mysql@8.4,postgresql@17',
      'proceso:web:mysql@8.4,postgresql@17',
    ]);
  });

  it('un fallo no corta el resto: se juntan en un solo error con el orden de arranque; una parada normal no cuenta', async () => {
    configMigrada();
    instalados['php'] = ['8.4', '8.3'];
    ocupadosPorOtro.add(5432);
    const s = crear({ ramasEnUso: async () => ['8.3', '8.4'] });
    conPhpYNginx(s, {
      php: { '8.3': new Error('no arranca') },
      nginx: new ErrorDetenidoAlIniciar('nginx'),
    });
    const e = await s.iniciarTodo().then(
      () => null,
      (x: unknown) => x as Error & { codigo?: string; datos?: { nombres?: string } },
    );
    expect(e?.codigo).toBe('servicios.iniciar_todo_fallos');
    // PHP 8.3 y PostgreSQL fallan; Nginx detenido a mano no cuenta; lo demás arranca.
    expect(e?.datos?.nombres).toBe('PHP 8.3, PostgreSQL 17');
    expect(orden.slice(0, 3)).toEqual(['php:8.3', 'php:8.4', 'nginx']);
    expect(estados.get('mysql@8.4')).toBe('encendido');
    expect(orden.some((x) => x.startsWith('proceso:web'))).toBe(true);
  });
});

describe('porArrancar: el mismo criterio que «Iniciar todo» (D54d)', () => {
  it('lista lo que Iniciar todo enciende y queda vacío cuando ya está todo encendido', async () => {
    configMigrada();
    instalados['php'] = ['8.4'];
    instalados['nginx'] = ['1.27.0'];
    const s = crear({ ramasEnUso: async () => ['8.4', '7.4'] });
    vi.spyOn(s.php, 'iniciar').mockImplementation(async (rama: string) => {
      orden.push(`php:${rama}`);
      for (let i = 0; i < cfg.servicios.php.trabajadores; i++)
        estados.set(s.php.idTrabajador(rama, i), 'encendido');
    });
    vi.spyOn(s.nginx, 'iniciar').mockImplementation(async () => {
      orden.push('nginx');
      estados.set('nginx', 'encendido');
    });
    const antes = await s.porArrancar();
    expect(antes.map((p) => `${p.tipo}:${p.id}`)).toEqual([
      'php:php-8.4',
      'nginx:nginx',
      'datos:mysql@8.4',
      'datos:postgresql@17',
      'proceso:proceso-bot',
      'proceso:proceso-web',
    ]);
    await s.iniciarTodo();
    // Lo que «Iniciar todo» encendió es lo que se anunciaba (mismo criterio).
    const encendido = orden
      .filter((x) => !x.startsWith('proceso:'))
      .map((x) => x.replace(/^iniciar:/, ''));
    expect(encendido).toEqual(['php:8.4', 'nginx', 'mysql@8.4', 'postgresql@17']);
    expect(orden.filter((x) => x.startsWith('proceso:')).length).toBe(2);
    expect(await s.porArrancar()).toEqual([]);
  });

  it('un servicio en error cuenta; uno encendido o la herramienta sin autoIniciar no', async () => {
    configMigrada();
    estados.set('mysql@8.4', 'encendido');
    estados.set('postgresql@17', 'error');
    const s = crear();
    const r = await s.porArrancar();
    expect(r.filter((p) => p.tipo === 'datos').map((p) => p.id)).toEqual(['postgresql@17']);
    expect(r.some((p) => p.id.includes('mailpit'))).toBe(false);
  });

  it('sin Nginx instalado no es un pendiente (Iniciar todo solo fallaría)', async () => {
    const r = await crear().porArrancar();
    expect(r.some((p) => p.tipo === 'nginx')).toBe(false);
  });
});

describe('usosDeEnv', () => {
  const usosDe = (texto: string) => usosDeEnv(leerVariablesEnv(texto));

  it('Laravel con DB_* y Redis', () => {
    expect(
      usosDe(
        'DB_CONNECTION=pgsql\nDB_HOST=127.0.0.1\nDB_PORT=5433\nDB_DATABASE=x\nREDIS_HOST=localhost\n',
      ),
    ).toEqual([
      { servicio: 'postgresql', puerto: 5433 },
      { servicio: 'redis', puerto: 6379 },
    ]);
  });

  it('puerto estándar si no se declara; una base remota no cuenta', () => {
    expect(usosDe('DB_CONNECTION=mysql\nDB_DATABASE=x\n')).toEqual([
      { servicio: 'mysql', puerto: 3306 },
    ]);
    expect(usosDe('DB_CONNECTION=mysql\nDB_HOST=db.ejemplo.com\nDB_DATABASE=x\n')).toEqual([]);
  });

  it('DATABASE_URL y CodeIgniter 4', () => {
    expect(usosDe('DATABASE_URL=postgresql+asyncpg://u:c@127.0.0.1:5432/bot\n')).toEqual([
      { servicio: 'postgresql', puerto: 5432 },
    ]);
    expect(
      usosDe(
        'database.default.hostname = localhost\ndatabase.default.DBDriver = MySQLi\ndatabase.default.port = 3307\n',
      ),
    ).toEqual([{ servicio: 'mysql', puerto: 3307 }]);
  });
});

describe('rama nueva o instalación en un servicio con instancia implícita', () => {
  beforeEach(() => {
    instalados = { mariadb: ['11.4.14'] };
  });

  /** Como el Instalador real: llama a prepararInstalacion antes de instalar (sin bloquearse). */
  const conInstalador = (): Servicios => {
    const s: Servicios = crear({
      instalarVersion: async (srv, v) => {
        await s.datos.prepararInstalacion(srv);
        instalados[srv] = [...(instalados[srv] ?? []), v];
      },
    });
    return s;
  };

  it('prepararInstalacion va en la cola del servicio (espera a la operación en curso)', async () => {
    const s = conInstalador();
    const orden: string[] = [];
    let soltar!: () => void;
    const puerta = new Promise<void>((r) => (soltar = r));
    const enCola = (
      s.datos as unknown as {
        enCola: (id: string, fn: () => Promise<void>) => Promise<void>;
      }
    ).enCola.bind(s.datos);
    const ocupada = enCola('mariadb', async () => {
      await puerta;
      orden.push('operación');
    });
    const preparar = s.datos.prepararInstalacion('mariadb').then(() => orden.push('preparar'));
    await new Promise((r) => setTimeout(r, 20));
    expect(orden).toEqual([]);
    soltar();
    await Promise.all([ocupada, preparar]);
    expect(orden).toEqual(['operación', 'preparar']);
    expect(cfg.servicios.datos.mariadb.instancias).toMatchObject({
      '11.4': { version: '11.4.14' },
    });
  });

  it('nuevaRama fija la implícita antes de instalar: no choca y la anterior sigue', async () => {
    const s = conInstalador();
    const r = await s.datos.nuevaRama('mariadb', '11.8.6');
    expect(r.id).toBe('mariadb@11.8');
    const m = cfg.servicios.datos.mariadb;
    expect(m.predeterminada).toBe('11.4');
    expect(m.instancias).toMatchObject({
      '11.4': { version: '11.4.14', puerto: 3307 },
      '11.8': { version: '11.8.6' },
    });
    expect(m.instancias!['11.8']!.puerto).not.toBe(3307);
  });

  it('prepararInstalacion (antes de un Instalar simple) fija la versión que usa el puerto', async () => {
    const s = conInstalador();
    await s.datos.prepararInstalacion('mariadb');
    instalados['mariadb']!.push('11.8.6');
    const lista = await s.datos.listaInstancias('mariadb');
    expect(lista.map((i) => [i.id, i.version, i.puerto])).toEqual([
      ['mariadb@11.4', '11.4.14', 3307],
    ]);
    // Y después la rama nueva se crea sin "Ya existe la instancia".
    await expect(s.datos.crearInstancia('mariadb', '11.8.6')).resolves.toBe('mariadb@11.8');
  });

  it('sin instancias y con dos ramas ya instaladas, la activa es la que tiene datos', async () => {
    instalados = { mariadb: ['11.4.14', '11.8.6'] };
    const carpeta = path.join(base, 'data', 'mariadb', '11.4');
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(path.join(carpeta, MARCA_INICIALIZADO), '');
    const s = conInstalador();
    const lista = await s.datos.listaInstancias('mariadb');
    expect(lista.map((i) => i.version)).toEqual(['11.4.14']);
    await expect(s.datos.nuevaRama('mariadb', '11.8.6')).resolves.toMatchObject({
      id: 'mariadb@11.8',
    });
  });
});

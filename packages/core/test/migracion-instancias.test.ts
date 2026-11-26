import { existsSync, readdirSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Almacen, AlmacenCredenciales } from '../src/almacen';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { migrarInstancias, type DepsMigracionInstancias } from '../src/migraciones/instancias';
import type { Plataforma } from '../src/plataforma/tipos';
import { Supervisor } from '../src/procesos/supervisor';
import { claveMayor, Rutas } from '../src/rutas';
import type { DefServicio } from '../src/servicios/definicion';
import { Servicios } from '../src/servicios/servicios';
import { carpetaTemporal } from './temporales';

/**
 * Forma de la carpeta de datos de una instalación anterior a las instancias (Etapa B/C hasta la
 * Task 17): config.json con un servicio por motor, credenciales por servicio, el registro del
 * supervisor con PostgreSQL encendido y sus carpetas de datos inicializadas. Todo en una carpeta
 * temporal: nunca la real.
 */
const CLAVE_PG = 'clave-falsa-postgres-0001';
const CLAVE_MY = 'clave-falsa-mysql-0002';
const CONFIG_VIEJO = {
  version: 1,
  sitios: [
    {
      id: 'tienda',
      nombre: 'Tienda',
      dominio: 'tienda.test',
      carpeta: 'C:/proyectos/tienda',
      tipo: 'laravel',
      php: '8.4',
    },
  ],
  https: { puerto: 443 },
  servicios: {
    nginx: { version: '1.30.6', puerto: 80 },
    php: { versiones: ['8.4'], trabajadores: 2 },
    datos: {
      mysql: { version: '8.4.13', puerto: 3306, autoIniciar: true, campoDelFuturo: 'x' },
      mariadb: { version: null, puerto: 3307, autoIniciar: false },
      postgresql: { version: '17.12', puerto: 5433, autoIniciar: true },
      redis: { version: null, puerto: 6379, autoIniciar: false },
      mongodb: { version: null, puerto: 27017, autoIniciar: false },
      mailpit: { version: '1.29.0', puerto: 1025, autoIniciar: true },
      ollama: { version: null, puerto: 11434, autoIniciar: false },
      meilisearch: { version: null, puerto: 7700, autoIniciar: false },
    },
  },
  /** Una versión futura de la app agrega campos que esta no conoce. */
  seccionDelFuturo: { activa: true, lista: [1, 2, 3] },
};

const defs: DefServicio[] = [
  {
    id: 'mysql',
    nombre: 'MySQL',
    categoria: 'bd',
    puertoPorDefecto: 3306,
    puertoAlternativo: 3308,
    inicializar: async () => undefined,
    proceso: async () => ({
      id: 'mysql',
      comando: 'mysqld.exe',
      args: [],
      log: 'x',
      reiniciar: false,
    }),
  },
  {
    id: 'postgresql',
    nombre: 'PostgreSQL',
    categoria: 'bd',
    puertoPorDefecto: 5432,
    claveDatos: claveMayor,
    inicializar: async () => undefined,
    proceso: async (c) => ({
      id: 'postgresql',
      comando: path.join(c.bin, 'pgsql', 'bin', 'postgres.exe'),
      args: ['-D', c.datos, '-p', String(c.puerto)],
      puerto: c.puerto,
      log: c.rutas.logs('postgresql.log'),
      reiniciar: false,
    }),
  },
  {
    id: 'mailpit',
    nombre: 'Mailpit',
    categoria: 'herramienta',
    puertoPorDefecto: 1025,
    claveDatos: () => 'actual',
    multiInstancia: false,
    inicializar: async () => undefined,
    proceso: async () => ({
      id: 'mailpit',
      comando: 'mailpit.exe',
      args: [],
      log: 'x',
      reiniciar: false,
    }),
  },
];

let base: string;
let rutas: Rutas;
let instalados: Record<string, string[]>;

const credencialesViejas = {
  mysql: { usuario: 'root', clave: CLAVE_MY },
  postgresql: { usuario: 'postgres', clave: CLAVE_PG },
  mcp: { usuario: 'mcp', clave: 'token-falso-mcp' },
  'ftp:tienda': { usuario: 'tienda', clave: 'clave-falsa-ftp' },
};

const estadoViejo = [
  {
    id: 'postgresql',
    pid: 4242,
    ejecutable: 'C:/WolfCoreDev/bin/postgresql/17.12/pgsql/bin/postgres.exe',
    args: ['-D', 'C:/WolfCoreDev/data/postgresql/17', '-p', '5433'],
    puerto: 5433,
    log: 'C:/WolfCoreDev/logs/postgresql.log',
    reiniciar: false,
  },
  { id: 'nginx', pid: 4343, ejecutable: 'nginx.exe', args: [], log: 'n', reiniciar: false },
];

async function datos(servicio: string, clave: string, contenido = 'datos reales'): Promise<string> {
  const dir = path.join(base, 'data', servicio, clave);
  await mkdir(path.join(dir, 'base'), { recursive: true });
  await writeFile(path.join(dir, '.pel-inicializado'), '2026-01-01');
  await writeFile(path.join(dir, 'base', 'tabla.dat'), contenido);
  return dir;
}

beforeEach(async () => {
  base = await carpetaTemporal('pel-mig-inst-');
  rutas = new Rutas(base);
  await rutas.asegurar();
  await writeFile(rutas.config(), JSON.stringify(CONFIG_VIEJO, null, 2));
  await writeFile(rutas.credenciales(), JSON.stringify(credencialesViejas, null, 2));
  await mkdir(path.dirname(rutas.estado()), { recursive: true });
  await writeFile(rutas.estado(), JSON.stringify(estadoViejo, null, 2));
  await datos('postgresql', '17');
  await datos('mysql', '8.4');
  // Rama vieja de MySQL que quedó en disco sin instancia (se instaló y luego se cambió).
  await datos('mysql', '8.0', 'datos de la 8.0');
  // Copias y carpetas que no son ramas: nunca se toman como instancias.
  await mkdir(path.join(base, 'data', 'mysql', '8.4.respaldo-20260101'), { recursive: true });
  await writeFile(
    path.join(base, 'data', 'mysql', '8.4.respaldo-20260101', '.pel-inicializado'),
    'x',
  );
  instalados = { mysql: ['8.0.44', '8.4.13'], postgresql: ['17.12'], mailpit: ['1.29.0'] };
  pidsVivos = new Set();
});

const plataforma = (vivos: Record<number, string>): Plataforma =>
  ({
    procesoVivo: async (pid: number) =>
      vivos[pid] ? { vivo: true, ejecutable: vivos[pid] } : { vivo: false },
  }) as unknown as Plataforma;

/** PIDs vivos para el supervisor de la migración (ninguno por defecto). */
let pidsVivos: Set<number>;

function deps(o: Partial<DepsMigracionInstancias> = {}): DepsMigracionInstancias & {
  renombrados: string[];
} {
  const renombrados: string[] = [];
  const supervisor = new Supervisor(rutas, plataforma({}), new Eventos<EventosNucleo>(), {
    spawn: (() => {
      throw new Error('no se lanza nada');
    }) as never,
    lanzarOculto: null,
    existePid: (pid) => pidsVivos.has(pid),
  });
  return {
    rutas,
    credenciales: new AlmacenCredenciales(rutas),
    supervisor: {
      renombrarRegistro: (a, b, opciones) => {
        renombrados.push(`${a}->${b}`);
        supervisor.renombrarRegistro(a, b, opciones);
      },
    },
    definiciones: () => defs,
    instalados: async (s) => instalados[s] ?? [],
    ahora: () => new Date('2026-11-23T10:00:00'),
    renombrados,
    ...o,
  };
}

const leerJson = async (p: string): Promise<unknown> => JSON.parse(await readFile(p, 'utf8'));

describe('migrarInstancias (Review Focus 7: los datos nunca se pierden)', () => {
  it('postgresql@17 usa la misma carpeta, el mismo puerto y las mismas credenciales', async () => {
    const d = deps();
    const r = await migrarInstancias(d);
    expect(r.migradas.sort()).toEqual(['mysql@8.0', 'mysql@8.4', 'postgresql@17']);
    const cfg = await new Almacen(rutas).leer();
    expect(cfg.servicios.datos.postgresql).toMatchObject({
      predeterminada: '17',
      instancias: { '17': { version: '17.12', puerto: 5433, autoIniciar: true } },
      // El reflejo de la predeterminada sigue igual.
      version: '17.12',
      puerto: 5433,
      autoIniciar: true,
    });
    expect(cfg.servicios.datos.mysql).toMatchObject({
      predeterminada: '8.4',
      instancias: {
        '8.4': { version: '8.4.13', puerto: 3306, autoIniciar: true },
        // La rama suelta queda apagada en un puerto libre (3307 es de MariaDB).
        '8.0': { version: '8.0.44', puerto: 3308, autoIniciar: false },
      },
    });
    // Mailpit no admite varias instancias: queda como estaba.
    expect(cfg.servicios.datos.mailpit.instancias).toBeUndefined();

    // Las credenciales viejas siguen; las instancias tienen una copia idéntica.
    const cred = (await leerJson(rutas.credenciales())) as Record<string, unknown>;
    expect(cred['postgresql']).toEqual(credencialesViejas.postgresql);
    expect(cred['postgresql@17']).toEqual(credencialesViejas.postgresql);
    expect(cred['mysql@8.4']).toEqual(credencialesViejas.mysql);
    expect(cred['mysql@8.0']).toEqual(credencialesViejas.mysql);
    expect(cred['mcp']).toEqual(credencialesViejas.mcp);
    expect(cred['ftp:tienda']).toEqual(credencialesViejas['ftp:tienda']);

    // Las carpetas de datos no se movieron.
    expect(
      await readFile(path.join(base, 'data', 'postgresql', '17', 'base', 'tabla.dat'), 'utf8'),
    ).toBe('datos reales');
    expect(readdirSync(path.join(base, 'data', 'mysql')).sort()).toEqual([
      '8.0',
      '8.4',
      '8.4.respaldo-20260101',
    ]);

    // ServiciosDatos arma el contexto de postgresql@17 con esa carpeta, ese puerto y esa clave.
    const procesos: { datos: string; puerto: number; clave: string; id: string }[] = [];
    const servicios = new Servicios({
      rutas,
      plataforma: {
        duenosDePuertos: async () => new Map(),
        quienUsaPuerto: async () => null,
      } as unknown as Plataforma,
      supervisor: {
        iniciar: async (p: { id: string }) => {
          procesos[procesos.length - 1]!.id = p.id;
        },
        detener: async () => undefined,
        estado: () => 'apagado',
        pid: () => null,
      } as never,
      instalador: {
        instalados: async (s: string) => instalados[s] ?? [],
        instalado: async () => true,
      } as never,
      leerConfig: () => new Almacen(rutas).leer(),
      modificarConfig: async () => undefined,
      definiciones: defs.map((x) => ({
        ...x,
        proceso: async (c) => {
          procesos.push({ datos: c.datos, puerto: c.puerto, clave: c.credenciales.clave, id: '' });
          return x.proceso(c);
        },
      })),
      sonda: async () => false,
    });
    await servicios.iniciar('postgresql');
    expect(procesos[0]).toEqual({
      datos: path.join(base, 'data', 'postgresql', '17'),
      puerto: 5433,
      clave: CLAVE_PG,
      id: 'postgresql@17',
    });
    await servicios.datos.iniciar('mysql@8.0');
    expect(procesos[1]).toMatchObject({
      datos: path.join(base, 'data', 'mysql', '8.0'),
      puerto: 3308,
      clave: CLAVE_MY,
    });
  });

  it('el supervisor readopta el PID vivo con el id de la instancia', async () => {
    const d = deps();
    await migrarInstancias(d);
    expect(d.renombrados).toEqual(['mysql->mysql@8.4', 'postgresql->postgresql@17']);
    const registros = (await leerJson(rutas.estado())) as { id: string; pid: number }[];
    expect(registros.map((r) => r.id).sort()).toEqual(['nginx', 'postgresql@17']);
    const sup = new Supervisor(
      rutas,
      plataforma({ 4242: 'postgres.exe', 4343: 'nginx.exe' }),
      new Eventos<EventosNucleo>(),
      { spawn: (() => undefined) as never, lanzarOculto: null, intervaloMs: 60_000 },
    );
    try {
      await sup.readoptar();
      expect(sup.pid('postgresql@17')).toBe(4242);
      expect(sup.pid('postgresql')).toBeNull();
    } finally {
      await sup.cerrar();
    }
  });

  it('segunda ejecución: sin cambios, sin copias nuevas', async () => {
    await migrarInstancias(deps());
    const config = await readFile(rutas.config(), 'utf8');
    const cred = await readFile(rutas.credenciales(), 'utf8');
    const respaldos = readdirSync(path.join(base, 'etc', 'respaldos'));
    expect(await migrarInstancias(deps({ ahora: () => new Date('2026-11-24T10:00:00') }))).toEqual({
      migradas: [],
    });
    expect(await readFile(rutas.config(), 'utf8')).toBe(config);
    expect(await readFile(rutas.credenciales(), 'utf8')).toBe(cred);
    expect(readdirSync(path.join(base, 'etc', 'respaldos'))).toEqual(respaldos);
  });

  it('copia config.json, credenciales.json y estado.json antes de escribir', async () => {
    const antes = {
      config: await readFile(rutas.config(), 'utf8'),
      cred: await readFile(rutas.credenciales(), 'utf8'),
      estado: await readFile(rutas.estado(), 'utf8'),
    };
    await migrarInstancias(deps());
    const carpetas = readdirSync(path.join(base, 'etc', 'respaldos'));
    expect(carpetas).toEqual(['pre-instancias-20261123-100000']);
    const c = path.join(base, 'etc', 'respaldos', carpetas[0]!);
    expect(await readFile(path.join(c, 'config.json'), 'utf8')).toBe(antes.config);
    expect(await readFile(path.join(c, 'credenciales.json'), 'utf8')).toBe(antes.cred);
    expect(await readFile(path.join(c, 'estado.json'), 'utf8')).toBe(antes.estado);
  });

  it('los campos de una versión futura no se pierden', async () => {
    await migrarInstancias(deps());
    const crudo = (await leerJson(rutas.config())) as typeof CONFIG_VIEJO;
    expect(crudo.seccionDelFuturo).toEqual(CONFIG_VIEJO.seccionDelFuturo);
    expect(crudo.servicios.datos.mysql.campoDelFuturo).toBe('x');
    expect(crudo.sitios).toEqual(CONFIG_VIEJO.sitios);
  });

  it('si falla al escribir, todo queda como estaba', async () => {
    const antes = {
      config: await readFile(rutas.config(), 'utf8'),
      cred: await readFile(rutas.credenciales(), 'utf8'),
      estado: await readFile(rutas.estado(), 'utf8'),
    };
    const real = new AlmacenCredenciales(rutas);
    const d = deps({
      credenciales: {
        todas: () => real.todas(),
        importar: async (x) => {
          await real.importar(x);
          throw new Error('disco lleno');
        },
      },
    });
    await expect(migrarInstancias(d)).rejects.toThrow(/se dejó todo como estaba/);
    expect(await readFile(rutas.config(), 'utf8')).toBe(antes.config);
    expect(await readFile(rutas.credenciales(), 'utf8')).toBe(antes.cred);
    expect(await readFile(rutas.estado(), 'utf8')).toBe(antes.estado);
    expect(d.renombrados).toEqual([]);
    // Al siguiente arranque se vuelve a intentar.
    expect((await migrarInstancias(deps())).migradas).toHaveLength(3);
  });

  it('un corte entre escribir config.json y renombrar el registro se repara en el siguiente arranque', async () => {
    // Primer arranque: config.json migrado, pero el proceso se corta antes de renombrar.
    await migrarInstancias(deps({ supervisor: { renombrarRegistro: () => undefined } }));
    let registros = (await leerJson(rutas.estado())) as { id: string }[];
    expect(registros.map((r) => r.id)).toContain('postgresql');
    // Siguiente arranque: no hay nada que migrar, pero el registro se renombra igual.
    const d = deps();
    expect((await migrarInstancias(d)).migradas).toEqual([]);
    registros = (await leerJson(rutas.estado())) as { id: string }[];
    expect(registros.map((r) => r.id).sort()).toEqual(['nginx', 'postgresql@17']);
    // Y es idempotente.
    await migrarInstancias(deps());
    registros = (await leerJson(rutas.estado())) as { id: string }[];
    expect(registros.map((r) => r.id).sort()).toEqual(['nginx', 'postgresql@17']);
  });

  it('tras volver a una versión vieja de la app, las ramas sueltas recuperan su puerto', async () => {
    // Al migrar, 3308 estaba reservado por el sistema: mysql@8.0 quedó en 3309.
    await migrarInstancias(deps({ rangosReservados: async () => [{ desde: 3308, hasta: 3308 }] }));
    expect(
      (await new Almacen(rutas).leer()).servicios.datos.mysql.instancias?.['8.0']?.puerto,
    ).toBe(3309);
    // Una versión anterior de la app reescribe config.json sin `instancias`.
    const crudo = (await leerJson(rutas.config())) as {
      servicios: { datos: Record<string, Record<string, unknown>> };
    };
    for (const s of Object.values(crudo.servicios.datos)) {
      delete s['instancias'];
      delete s['predeterminada'];
    }
    await writeFile(rutas.config(), JSON.stringify(crudo));
    // Al volver a la nueva, la rama suelta conserva el puerto que tenía (y no el primero libre).
    await migrarInstancias(deps({ ahora: () => new Date('2026-11-25T10:00:00') }));
    const cfg = await new Almacen(rutas).leer();
    expect(cfg.servicios.datos.mysql.instancias?.['8.0']?.puerto).toBe(3309);
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.puerto).toBe(3306);
  });

  it('un config ilegible o inexistente no se toca', async () => {
    await writeFile(rutas.config(), '{ roto');
    expect(await migrarInstancias(deps())).toEqual({ migradas: [] });
    expect(await readFile(rutas.config(), 'utf8')).toBe('{ roto');
    expect(existsSync(path.join(base, 'etc', 'respaldos'))).toBe(false);
  });

  it('un servicio sin nada instalado queda sin instancias y se migra cuando se instala', async () => {
    instalados = { postgresql: ['17.12'] };
    await migrarInstancias(deps());
    let cfg = await new Almacen(rutas).leer();
    // MySQL: sin binarios pero con carpetas inicializadas → instancias apagadas.
    // La versión elegida (8.4.13) conserva su puerto y sigue como predeterminada.
    expect(cfg.servicios.datos.mysql).toMatchObject({
      predeterminada: '8.4',
      instancias: {
        '8.4': { version: '8.4.13', puerto: 3306, autoIniciar: true },
        '8.0': { version: '8.0', puerto: 3308, autoIniciar: false },
      },
    });
    expect(cfg.servicios.datos.redis.instancias).toBeUndefined();
    expect(cfg.servicios.datos.redis.puerto).toBe(6379);
    instalados = { postgresql: ['17.12'], redis: ['8.2.1'] };
    // Redis no tiene definición en esta prueba: se agrega una.
    const redis: DefServicio = {
      id: 'redis',
      nombre: 'Redis',
      categoria: 'bd',
      puertoPorDefecto: 6379,
      claveDatos: claveMayor,
      inicializar: async () => undefined,
      proceso: async () => ({ id: 'redis', comando: 'r', args: [], log: 'x', reiniciar: false }),
    };
    const r = await migrarInstancias(deps({ definiciones: () => [...defs, redis] }));
    expect(r.migradas).toEqual(['redis@8']);
    cfg = await new Almacen(rutas).leer();
    expect(cfg.servicios.datos.redis).toMatchObject({
      predeterminada: '8',
      instancias: { '8': { version: '8.2.1', puerto: 6379 } },
    });
  });
});

describe('renombrar el registro pendiente solo si es de esa instancia (T18-N2)', () => {
  const registro = (
    id: string,
    pid: number,
    version: string,
    clave: string,
    servicio = 'mysql',
  ) => ({
    id,
    pid,
    ejecutable: `C:/WolfCoreDev/bin/${servicio}/${version}/bin/${servicio === 'mysql' ? 'mysqld' : 'postgres'}.exe`,
    args: [
      servicio === 'mysql' ? `--datadir=C:/WolfCoreDev/data/${servicio}/${clave}` : '-D',
      ...(servicio === 'mysql' ? [] : [`C:/WolfCoreDev/data/${servicio}/${clave}`]),
    ],
    log: 'x',
    reiniciar: false,
  });
  const ids = async (): Promise<string[]> =>
    ((await leerJson(rutas.estado())) as { id: string }[]).map((r) => r.id).sort();

  it('un `mysql` suelto con los binarios y datos de otra rama no pasa a la predeterminada', async () => {
    await writeFile(rutas.estado(), JSON.stringify([registro('mysql', 5151, '8.0.44', '8.0')]));
    await migrarInstancias(deps());
    expect(await ids()).toEqual(['mysql']);
  });

  it('coincide por la carpeta de datos aunque el ejecutable no diga la versión', async () => {
    const r = { ...registro('mysql', 5151, '8.4.13', '8.4'), ejecutable: 'mysqld.exe' };
    await writeFile(rutas.estado(), JSON.stringify([r]));
    await migrarInstancias(deps());
    expect(await ids()).toEqual(['mysql@8.4']);
    // `8.40` no es `8.4`.
    const otro = { ...registro('mysql', 5151, '8.4.13', '8.40'), ejecutable: 'mysqld.exe' };
    await writeFile(rutas.estado(), JSON.stringify([otro]));
    await migrarInstancias(deps());
    expect(await ids()).toEqual(['mysql']);
  });

  it('si el id nuevo ya existe con un PID muerto, se reemplaza; con uno vivo, no', async () => {
    const viejo = registro('postgresql', 4242, '17.12', '17', 'postgresql');
    const muerto = registro('postgresql@17', 999, '17.12', '17', 'postgresql');
    await writeFile(rutas.estado(), JSON.stringify([viejo, muerto]));
    await migrarInstancias(deps());
    let lista = (await leerJson(rutas.estado())) as { id: string; pid: number }[];
    expect(lista).toEqual([expect.objectContaining({ id: 'postgresql@17', pid: 4242 })]);

    pidsVivos = new Set([999]);
    await writeFile(rutas.estado(), JSON.stringify([viejo, muerto]));
    await migrarInstancias(deps());
    lista = (await leerJson(rutas.estado())) as { id: string; pid: number }[];
    expect(lista.map((r) => `${r.id}:${r.pid}`).sort()).toEqual([
      'postgresql:4242',
      'postgresql@17:999',
    ]);
  });
});

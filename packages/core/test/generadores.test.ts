import { mkdir, readdir, readFile, stat, symlink, writeFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { carpetaTemporal } from './temporales';
import { ErrorWolf } from '../src/errores';
import { Nucleo } from '../src/nucleo';
import type { Plataforma } from '../src/plataforma/tipos';
import {
  crearProyecto,
  validarCarpetaNueva,
  validarNombreProyecto,
  type DepsCrearProyecto,
} from '../src/proyectos/crear';
import {
  generador,
  TIPOS_GENERADOR,
  type PedidoProyecto,
  type TipoGenerador,
} from '../src/proyectos/generadores';
import type { PasoReceta } from '../src/proyectos/config';
import type { ResultadoReceta } from '../src/proyectos/recetas';
import type { Sitio } from '../src/tipos';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

const pedido = (tipo: TipoGenerador, extra: Partial<PedidoProyecto> = {}): PedidoProyecto => ({
  tipo,
  nombre: 'mi-tienda',
  carpeta: 'C:\\Proyectos\\mi-tienda',
  php: '8.4',
  base: { instancia: null, nombre: 'mi_tienda' },
  opciones: {},
  ...extra,
});

const tipos = (p: PasoReceta[]): string[] => p.map((x) => x.tipo);
const paso = (p: PasoReceta[], tipo: string): PasoReceta => p.find((x) => x.tipo === tipo)!;

describe('generadores: lista de pasos', () => {
  it('hay un generador por cada tipo y el dominio es <nombre>.test', () => {
    for (const t of TIPOS_GENERADOR)
      expect(generador(t).dominio('mi-tienda')).toBe('mi-tienda.test');
  });

  it('Laravel: composer, .env, clave, base, migraciones y sitio, en ese orden', () => {
    const p = generador('laravel').pasos(pedido('laravel'));
    expect(tipos(p)).toEqual([
      'crear-desde-composer',
      'env-crear',
      'key-generate',
      'bd-crear',
      'migrar',
      'sitio-crear',
    ]);
    expect(paso(p, 'crear-desde-composer').args).toEqual({ paquete: 'laravel/laravel' });
    expect(paso(p, 'bd-crear').args).toMatchObject({ motor: 'mysql', base: 'mi_tienda' });
    expect(paso(p, 'sitio-crear').args).toMatchObject({
      tipo: 'laravel',
      dominio: 'mi-tienda.test',
      php: '8.4',
      https: true,
    });
    expect(new Set(p.map((x) => x.id)).size).toBe(p.length);
  });

  it('Laravel con un starter kit cambia el paquete y compila los recursos', () => {
    const p = generador('laravel').pasos(pedido('laravel', { opciones: { starterKit: 'vue' } }));
    expect(paso(p, 'crear-desde-composer').args).toEqual({ paquete: 'laravel/vue-starter-kit' });
    expect(tipos(p)).toEqual([
      'crear-desde-composer',
      'env-crear',
      'key-generate',
      'bd-crear',
      'migrar',
      'npm-ci',
      'npm-build',
      'sitio-crear',
    ]);
    const ninguno = generador('laravel').pasos(
      pedido('laravel', { opciones: { starterKit: 'ninguno' } }),
    );
    expect(paso(ninguno, 'crear-desde-composer').args).toEqual({ paquete: 'laravel/laravel' });
  });

  it('con una instancia, los pasos de base apuntan a ella y no al motor', () => {
    const p = generador('laravel').pasos(
      pedido('laravel', { base: { instancia: 'mariadb@11.4', nombre: 'tienda' } }),
    );
    expect(paso(p, 'bd-crear').args).toEqual({ instancia: 'mariadb@11.4', base: 'tienda' });
    expect(paso(p, 'env-crear').args).toEqual({ instancia: 'mariadb@11.4', base: 'tienda' });
  });

  it('sin base no hay pasos de base ni migraciones', () => {
    const p = generador('laravel').pasos(pedido('laravel', { base: null }));
    expect(tipos(p)).toEqual(['crear-desde-composer', 'env-crear', 'key-generate', 'sitio-crear']);
  });

  it('CodeIgniter 4 usa appstarter y su .env; CodeIgniter 3 escribe database.php', () => {
    const ci4 = generador('codeigniter4').pasos(pedido('codeigniter4'));
    expect(paso(ci4, 'crear-desde-composer').args).toEqual({ paquete: 'codeigniter4/appstarter' });
    expect(tipos(ci4)).toEqual(['crear-desde-composer', 'env-crear', 'bd-crear', 'sitio-crear']);
    const ci3 = generador('codeigniter3').pasos(pedido('codeigniter3'));
    expect(paso(ci3, 'crear-desde-composer').args).toEqual({ paquete: 'codeigniter/framework' });
    expect(tipos(ci3)).toEqual([
      'crear-desde-composer',
      'bd-crear',
      'config-bd-crear',
      'sitio-crear',
    ]);
    expect(paso(ci3, 'config-bd-crear').args).toMatchObject({ marco: 'codeigniter3' });
    expect(paso(ci3, 'sitio-crear').args).toMatchObject({ tipo: 'codeigniter3' });
  });

  it('Symfony: la conexión va en .env.local y el webapp se pide aparte', () => {
    const p = generador('symfony').pasos(pedido('symfony', { opciones: { symfonyWebapp: true } }));
    expect(paso(p, 'crear-desde-composer').args).toEqual({
      paquete: 'symfony/skeleton',
      requerir: ['symfony/webapp-pack'],
    });
    expect(paso(p, 'env-crear').args).toMatchObject({ destino: '.env.local' });
    // Vhost de raíz public/ y solo index.php: el de tipo laravel.
    expect(paso(p, 'sitio-crear').args).toMatchObject({ tipo: 'laravel' });
    const sin = generador('symfony').pasos(pedido('symfony'));
    expect(paso(sin, 'crear-desde-composer').args).toEqual({ paquete: 'symfony/skeleton' });
  });

  it('FastAPI: plantilla, venv, pip, base y proceso uvicorn; pgvector agrega su paso', () => {
    const p = generador('fastapi').pasos(
      pedido('fastapi', {
        php: undefined,
        python: '3.12',
        opciones: { pgvector: true },
      }),
    );
    expect(tipos(p)).toEqual([
      'copiar-plantilla-interna',
      'python-venv',
      'pip-install',
      'env-crear',
      'bd-crear',
      'pgvector-activar',
      'sitio-crear',
    ]);
    expect(paso(p, 'bd-crear').args).toMatchObject({ motor: 'postgresql' });
    const procesos = paso(p, 'sitio-crear').args!.procesos as {
      comando: string[];
      proxy: boolean;
    }[];
    expect(procesos[0]!.comando).toContain('main:app');
    expect(procesos[0]!.proxy).toBe(true);
    const sinVector = generador('fastapi').pasos(pedido('fastapi', { php: undefined }));
    expect(tipos(sinVector)).not.toContain('pgvector-activar');
  });

  it('WordPress: descarga con la confirmación del pedido y crea wp-config', () => {
    const p = generador('wordpress').pasos(
      pedido('wordpress', { opciones: { confirmarHuellaDebil: true } }),
    );
    expect(tipos(p)).toEqual(['descargar-plantilla', 'bd-crear', 'config-bd-crear', 'sitio-crear']);
    expect(paso(p, 'descargar-plantilla').args).toMatchObject({
      servicio: 'wordpress',
      confirmarHuellaDebil: true,
    });
    const sin = generador('wordpress').pasos(pedido('wordpress'));
    expect(paso(sin, 'descargar-plantilla').args).not.toHaveProperty('confirmarHuellaDebil');
  });

  it('el sitio estático no crea base', () => {
    const p = generador('estatico').pasos(pedido('estatico', { php: undefined, base: null }));
    expect(tipos(p)).toEqual(['copiar-plantilla-interna', 'sitio-crear']);
  });
});

describe('validación del nombre', () => {
  it.each(['mi-tienda', 'a', 'demo2', 'a'.repeat(40)])('acepta %s', (n) => {
    expect(validarNombreProyecto(n)).toBe(n);
  });

  it.each([
    '',
    'Mi-Tienda',
    '-x',
    'x-',
    'a--b',
    '../x',
    'a/b',
    'a\\b',
    'a b',
    'con',
    'nul',
    'com1',
    'a.b',
    'a'.repeat(41),
    'ñandú',
  ])('rechaza "%s"', (n) => {
    expect(() => validarNombreProyecto(n)).toThrow(
      expect.objectContaining({ codigo: 'proyectos.nombre_invalido' }),
    );
  });

  it('rechaza lo que no es texto', () => {
    expect(() => validarNombreProyecto(undefined)).toThrow(ErrorWolf);
    expect(() => validarNombreProyecto({ toString: () => 'ok' })).toThrow(ErrorWolf);
  });
});

describe('validación de la carpeta', () => {
  let base: string;
  let datos: string;
  beforeEach(async () => {
    base = await carpetaTemporal('pel-gen-');
    datos = await carpetaTemporal('pel-gen-datos-');
  });

  it('una carpeta que no existe se crea; una vacía se usa tal cual', async () => {
    expect(await validarCarpetaNueva(path.join(base, 'p'), 'p', datos)).toEqual({ crear: true });
    await mkdir(path.join(base, 'vacia'));
    expect(await validarCarpetaNueva(path.join(base, 'vacia'), 'vacia', datos)).toEqual({
      crear: false,
    });
  });

  it('una carpeta con cualquier archivo da proyectos.carpeta_no_vacia', async () => {
    await mkdir(path.join(base, 'p'));
    await writeFile(path.join(base, 'p', '.gitkeep'), '');
    await expect(validarCarpetaNueva(path.join(base, 'p'), 'p', datos)).rejects.toMatchObject({
      codigo: 'proyectos.carpeta_no_vacia',
    });
  });

  it('rechaza rutas relativas, con .., de red, sin padre, un archivo o distinto nombre', async () => {
    const malo = { codigo: 'proyectos.carpeta_invalida' };
    await expect(validarCarpetaNueva('p', 'p', datos)).rejects.toMatchObject(malo);
    await expect(
      validarCarpetaNueva(`${base}${path.sep}..${path.sep}p`, 'p', datos),
    ).rejects.toMatchObject(malo);
    await expect(validarCarpetaNueva('\\\\servidor\\recurso\\p', 'p', datos)).rejects.toMatchObject(
      malo,
    );
    await expect(validarCarpetaNueva('//servidor/recurso/p', 'p', datos)).rejects.toMatchObject(
      malo,
    );
    await expect(
      validarCarpetaNueva(path.join(base, 'no', 'hay', 'p'), 'p', datos),
    ).rejects.toMatchObject(malo);
    await expect(validarCarpetaNueva(path.join(base, 'p'), 'otro', datos)).rejects.toMatchObject(
      malo,
    );
    await expect(validarCarpetaNueva(undefined, 'p', datos)).rejects.toMatchObject(malo);
    await expect(validarCarpetaNueva('', 'p', datos)).rejects.toMatchObject(malo);
    await writeFile(path.join(base, 'archivo'), 'x');
    await expect(
      validarCarpetaNueva(path.join(base, 'archivo'), 'archivo', datos),
    ).rejects.toMatchObject(malo);
  });

  it('nunca dentro de la carpeta de datos de WolfCore Dev', async () => {
    await expect(validarCarpetaNueva(path.join(datos, 'p'), 'p', datos)).rejects.toMatchObject({
      codigo: 'proyectos.carpeta_invalida',
    });
  });

  it('un enlace no sirve como carpeta del proyecto', async () => {
    const real = path.join(base, 'real');
    await mkdir(real);
    try {
      await symlink(real, path.join(base, 'enlace'), 'junction');
    } catch {
      return; // sin permiso para crear enlaces en este equipo
    }
    await expect(
      validarCarpetaNueva(path.join(base, 'enlace'), 'enlace', datos),
    ).rejects.toMatchObject({
      codigo: 'proyectos.carpeta_invalida',
    });
  });
});

describe('crearProyecto (sobre fakes: sin red, sin Composer, sin bases reales)', () => {
  let base: string;
  let datos: string;
  let creados: { datos: Omit<Sitio, 'id'>; receta: PasoReceta[] }[];
  let ejecutadas: { id: string; receta: PasoReceta[] }[];
  let pasosListos: string[];
  let resultado: ResultadoReceta;
  let bases: string[];
  let php: string[];
  let confiadas: string[];

  const deps = (extra: Partial<DepsCrearProyecto> = {}): DepsCrearProyecto => ({
    rutas: { base: datos },
    crearSitio: async (d, receta) => {
      creados.push({ datos: d, receta: [...receta] });
      return { sitio: { ...d, id: 'mi-tienda' } as Sitio };
    },
    ejecutarReceta: async (id, receta) => {
      ejecutadas.push({ id, receta });
      return resultado;
    },
    estadoReceta: () => ({ pasos: pasosListos.map((tipo) => ({ tipo, estado: 'listo' })) }),
    sitios: async () => [],
    basesDe: async () => bases,
    phpInstaladas: async () => php,
    confiar: async (id) => void confiadas.push(id),
    ...extra,
  });

  const nuevo = (extra: Partial<PedidoProyecto> = {}): PedidoProyecto =>
    pedido('laravel', { carpeta: path.join(base, 'mi-tienda'), ...extra });

  beforeEach(async () => {
    base = await carpetaTemporal('pel-gen-');
    datos = await carpetaTemporal('pel-gen-datos-');
    creados = [];
    ejecutadas = [];
    pasosListos = ['crear-desde-composer', 'env-crear', 'key-generate', 'bd-crear'];
    resultado = { estado: 'lista' };
    bases = [];
    php = ['8.3', '8.4'];
    confiadas = [];
  });

  it('crea la carpeta y el sitio confiado con HTTPS y corre la receta del generador', async () => {
    const r = await crearProyecto(deps(), nuevo());
    expect((await stat(path.join(base, 'mi-tienda'))).isDirectory()).toBe(true);
    expect(creados).toHaveLength(1);
    expect(creados[0]!.datos).toMatchObject({
      dominio: 'mi-tienda.test',
      tipo: 'laravel',
      php: '8.4',
      https: true,
      confiado: true,
      carpeta: path.join(base, 'mi-tienda'),
    });
    expect(ejecutadas[0]!.id).toBe('mi-tienda');
    expect(tipos(ejecutadas[0]!.receta)).toContain('crear-desde-composer');
    expect(r.receta.estado).toBe('lista');
    expect(r.creado).toEqual({ carpeta: true, base: 'mi_tienda', sitio: 'mi-tienda' });
    expect(confiadas).toEqual(['mi-tienda']);
  });

  it('sin PHP en el pedido usa la rama 8.x más nueva instalada', async () => {
    php = ['8.2', '8.4', '7.4'];
    await crearProyecto(deps(), nuevo({ php: undefined }));
    expect(creados[0]!.datos.php).toBe('8.4');
  });

  it('un PHP que no está instalado se rechaza antes de crear nada', async () => {
    await expect(crearProyecto(deps(), nuevo({ php: '8.1' }))).rejects.toThrow(
      /PHP 8\.1 no está instalado/,
    );
    await expect(readdir(base)).resolves.toEqual([]);
    expect(creados).toHaveLength(0);
  });

  it('una carpeta con archivos no se toca y no se crea nada', async () => {
    const carpeta = path.join(base, 'mi-tienda');
    await mkdir(carpeta);
    await writeFile(path.join(carpeta, 'importante.txt'), 'no me pises');
    await expect(crearProyecto(deps(), nuevo())).rejects.toMatchObject({
      codigo: 'proyectos.carpeta_no_vacia',
    });
    expect(await readFile(path.join(carpeta, 'importante.txt'), 'utf8')).toBe('no me pises');
    expect(await readdir(carpeta)).toEqual(['importante.txt']);
    expect(creados).toHaveLength(0);
    expect(ejecutadas).toHaveLength(0);
  });

  it('una carpeta vacía existente se usa y no se borra si algo falla', async () => {
    const carpeta = path.join(base, 'mi-tienda');
    await mkdir(carpeta);
    await expect(
      crearProyecto(
        deps({
          crearSitio: async () => {
            throw new Error('Nginx no responde');
          },
        }),
        nuevo(),
      ),
    ).rejects.toThrow('Nginx no responde');
    expect((await stat(carpeta)).isDirectory()).toBe(true);
  });

  it('si el sitio no se puede crear, quita la carpeta que creó (solo si sigue vacía)', async () => {
    await expect(
      crearProyecto(
        deps({
          crearSitio: async () => {
            throw new Error('El dominio debe terminar en .test');
          },
        }),
        nuevo(),
      ),
    ).rejects.toThrow('terminar en .test');
    await expect(stat(path.join(base, 'mi-tienda'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(ejecutadas).toHaveLength(0);
  });

  it('un paso que falla a mitad no borra la carpeta ni la base y el resultado lo dice', async () => {
    resultado = { estado: 'error', pasoId: 'migrar', mensaje: 'migración rota' };
    pasosListos = ['crear-desde-composer', 'env-crear', 'bd-crear'];
    const r = await crearProyecto(
      deps({
        ejecutarReceta: async (id, receta) => {
          // El paso de composer dejó archivos en la carpeta antes de fallar el siguiente.
          await writeFile(path.join(base, 'mi-tienda', 'composer.json'), '{}');
          ejecutadas.push({ id, receta });
          return resultado;
        },
      }),
      nuevo(),
    );
    expect(r.receta).toMatchObject({ estado: 'error', pasoId: 'migrar' });
    expect(r.creado).toEqual({ carpeta: true, base: 'mi_tienda', sitio: 'mi-tienda' });
    expect(await readdir(path.join(base, 'mi-tienda'))).toEqual(['composer.json']);
    // Con la receta fallida no se vuelve a tomar la huella.
    expect(confiadas).toEqual([]);
  });

  it('si el fallo fue antes de crear la base, creado.base es null', async () => {
    resultado = { estado: 'error', pasoId: 'crear-desde-composer', mensaje: 'sin red' };
    pasosListos = [];
    const r = await crearProyecto(deps(), nuevo());
    expect(r.creado.base).toBeNull();
  });

  it('si la receta lanza (no solo falla un paso) se informa como error', async () => {
    const r = await crearProyecto(
      deps({
        ejecutarReceta: async () => {
          throw new Error('Ya hay una receta en curso para este proyecto');
        },
      }),
      nuevo(),
    );
    expect(r.receta).toMatchObject({
      estado: 'error',
      mensaje: expect.stringContaining('en curso'),
    });
    expect(r.creado.sitio).toBe('mi-tienda');
  });

  it('una base que ya existe se rechaza antes de crear nada (nunca se reutiliza)', async () => {
    bases = ['mi_tienda'];
    await expect(crearProyecto(deps(), nuevo())).rejects.toMatchObject({
      codigo: 'proyectos.base_existe',
    });
    await expect(readdir(base)).resolves.toEqual([]);
  });

  it('con el motor apagado falla antes de crear nada', async () => {
    await expect(
      crearProyecto(
        deps({
          basesDe: async () => {
            throw new ErrorWolf('bd.encender_servicio', 'Encienda MySQL', { nombre: 'MySQL' });
          },
        }),
        nuevo(),
      ),
    ).rejects.toMatchObject({ codigo: 'bd.encender_servicio' });
    await expect(readdir(base)).resolves.toEqual([]);
  });

  it('un dominio que ya existe se rechaza antes de crear nada', async () => {
    await expect(
      crearProyecto(
        deps({
          sitios: async () => [{ dominio: 'mi-tienda.test', alias: [] } as unknown as Sitio],
        }),
        nuevo(),
      ),
    ).rejects.toThrow(/Ya existe un sitio/);
    await expect(readdir(base)).resolves.toEqual([]);
  });

  it.each([
    ['nombre con ..', { nombre: '../x' }],
    ['nombre con mayúsculas', { nombre: 'Mi-Tienda' }],
    ['tipo inventado', { tipo: 'django' as TipoGenerador }],
    ['nombre de base con comillas', { base: { instancia: null, nombre: "x'; DROP" } }],
    ['nombre de base con guion', { base: { instancia: null, nombre: 'mi-tienda' } }],
    ['instancia inventada', { base: { instancia: 'redis@7' as never, nombre: 'x' } }],
    ['pgvector sin PostgreSQL', { opciones: { pgvector: true } }],
    ['PHP con texto', { php: '8.4; calc' }],
    ['Python con texto', { python: '3.12 && x' }],
  ] as [string, Partial<PedidoProyecto>][])('rechaza %s sin crear nada', async (_c, extra) => {
    await expect(crearProyecto(deps(), nuevo(extra))).rejects.toThrow();
    await expect(readdir(base)).resolves.toEqual([]);
    expect(creados).toHaveLength(0);
  });

  it('WordPress solo con MySQL o MariaDB', async () => {
    await expect(
      crearProyecto(
        deps(),
        pedido('wordpress', {
          carpeta: path.join(base, 'mi-tienda'),
          base: { instancia: 'postgresql@17', nombre: 'wp' },
        }),
      ),
    ).rejects.toThrow(/MySQL o MariaDB/);
    await expect(readdir(base)).resolves.toEqual([]);
  });

  it('FastAPI con pgvector exige PostgreSQL y guarda Python en el sitio', async () => {
    await crearProyecto(
      deps(),
      pedido('fastapi', {
        carpeta: path.join(base, 'mi-tienda'),
        php: undefined,
        python: '3.12',
        opciones: { pgvector: true },
      }),
    );
    expect(creados[0]!.datos.runtimes).toEqual({ python: '3.12' });
    expect(creados[0]!.datos.php).toBeNull();
    expect(paso(ejecutadas[0]!.receta, 'bd-crear').args).toMatchObject({ motor: 'postgresql' });
  });

  it('el estático no crea base ni consulta el motor', async () => {
    const basesDe = vi.fn(async () => []);
    const r = await crearProyecto(
      deps({ basesDe }),
      pedido('estatico', { carpeta: path.join(base, 'mi-tienda'), php: undefined, base: null }),
    );
    expect(basesDe).not.toHaveBeenCalled();
    expect(r.creado.base).toBeNull();
    expect(tipos(ejecutadas[0]!.receta)).toEqual(['copiar-plantilla-interna', 'sitio-crear']);
  });
});

/* ───────────── Con el Nucleo de verdad (carpetas temporales, plataforma falsa) ───────────── */

describe('Nucleo.crearProyecto (estático, de punta a punta)', () => {
  let base: string;
  let proyectos: string;
  let hosts: string;
  let nucleos: Nucleo[];

  const plataforma = (): Plataforma => ({
    rutaHosts: () => hosts,
    escribirComoAdmin: async (destino, contenido) => {
      writeFileSync(destino, contenido);
      return { ok: true };
    },
    quienUsaPuerto: async () => null,
    duenosDePuertos: async () => new Map(),
    instalarCertificadoUsuario: async () => ({ ok: true as const }),
    quitarCertificadoUsuario: async () => ({ ok: true as const }),
    certificadoInstalado: async () => false,
    procesoVivo: async () => ({ vivo: false }),
    matarArbol: async () => undefined,
    abrirUrl: async () => undefined,
    ejecutable: (n) => `${n}.exe`,
    carpetaDocumentos: async () => hosts,
  });

  beforeEach(async () => {
    base = await carpetaTemporal('pel-gen-nucleo-');
    proyectos = await carpetaTemporal('pel-gen-proy-');
    hosts = path.join(base, 'hosts');
    writeFileSync(hosts, '127.0.0.1 localhost\r\n');
    nucleos = [];
  });
  afterEach(async () => {
    for (const n of nucleos) await n.cerrar({ detenerServicios: false });
  });

  const crear = async (): Promise<Nucleo> => {
    const n = await Nucleo.crear({
      base: path.join(base, 'datos'),
      plataforma: plataforma(),
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      lanzar: async () => {
        throw new Error('el estático no lanza procesos');
      },
    });
    nucleos.push(n);
    return n;
  };

  it('crea la carpeta con sus archivos, el sitio confiado y su dominio en hosts', async () => {
    const n = await crear();
    const carpeta = path.join(proyectos, 'mi-sitio');
    const r = await n.crearProyecto({
      tipo: 'estatico',
      nombre: 'mi-sitio',
      carpeta,
      base: null,
      opciones: {},
    });
    expect(r.receta.estado).toBe('lista');
    expect(r.creado).toEqual({ carpeta: true, base: null, sitio: r.sitio.id });
    expect(r.sitio).toMatchObject({ dominio: 'mi-sitio.test', tipo: 'estatico', confiado: true });
    expect(await readFile(path.join(carpeta, 'index.html'), 'utf8')).toContain('<h1>mi-sitio</h1>');
    expect(await readFile(hosts, 'utf8')).toContain('mi-sitio.test');
    expect((await n.config.leer()).sitios.map((s) => s.dominio)).toEqual(['mi-sitio.test']);
  });

  it('una segunda vez sobre la misma carpeta no pisa nada', async () => {
    const n = await crear();
    const carpeta = path.join(proyectos, 'mi-sitio');
    const pedirlo = (): ReturnType<Nucleo['crearProyecto']> =>
      n.crearProyecto({ tipo: 'estatico', nombre: 'mi-sitio', carpeta, base: null, opciones: {} });
    await pedirlo();
    await writeFile(path.join(carpeta, 'index.html'), 'MI TRABAJO');
    await expect(pedirlo()).rejects.toMatchObject({ codigo: 'proyectos.carpeta_no_vacia' });
    expect(await readFile(path.join(carpeta, 'index.html'), 'utf8')).toBe('MI TRABAJO');
  });

  it('rechaza una carpeta dentro de la carpeta de datos de la aplicación', async () => {
    const n = await crear();
    await expect(
      n.crearProyecto({
        tipo: 'estatico',
        nombre: 'dentro',
        carpeta: path.join(n.rutas.base, 'dentro'),
        base: null,
        opciones: {},
      }),
    ).rejects.toMatchObject({ codigo: 'proyectos.carpeta_invalida' });
  });
});

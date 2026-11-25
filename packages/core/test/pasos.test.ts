import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { ErrorWolf } from '../src/errores';
import { fetchFalso } from './catalogo-falso';
import { zip } from './zip-prueba';
import { lanzadorPorDefecto, matarArbol, rutaTaskkill } from '../src/plataforma/lanzar';
import type { Lanzador, OpcionesLanzar } from '../src/plataforma/tipos';
import { TIPOS_PASO, type PasoReceta, type TipoPaso } from '../src/proyectos/config';
import { RegistroPasos, type ContextoPaso } from '../src/proyectos/pasos';
import { registrarPasosReales, type DepsPasos } from '../src/proyectos/pasos/index';
import { leerHuellaWordpress } from '../src/proyectos/pasos/descargarPlantilla';
import { nombreBase } from '../src/proyectos/pasos/comun';
import { recetaEfectiva, recetaPorDefecto } from '../src/proyectos/recetas';
import { detectarProyecto } from '../src/proyectos/detectar';
import { leerVariablesEnv } from '../src/proyectos/detectar';
import { Rutas } from '../src/rutas';
import type { Sitio } from '../src/tipos';

/* ───────────── Armado ───────────── */

const CLAVE = 's3cr3t pa$$';

interface Llamada {
  cmd: string;
  args: string[];
  opts: OpcionesLanzar;
}

interface Armado {
  base: string;
  carpeta: string;
  rutas: Rutas;
  deps: DepsPasos;
  registro: RegistroPasos;
  llamadas: Llamada[];
  guardados: { datos: Omit<Sitio, 'id'>; id: string }[];
  creadas: { motor: string; nombre: string; opts: unknown }[];
  restauradas: { motor: string; archivo: string; base: string; opts: unknown }[];
  esquemas: { objetivo: string; archivo: string; base: string; origen: string }[];
  vectores: string[];
  sitio: Sitio;
  phpExe: string;
  phpIni: string;
  nodeDir: string;
  pythonDir: string;
}

interface OpcionesArmado {
  codigo?: number;
  salida?: string[];
  sitio?: Partial<Sitio>;
  mailpit?: boolean;
  basesExistentes?: string[];
  tablas?: boolean;
  avisos?: string[];
  sinNode?: boolean;
  activarVector?: () => Promise<void>;
  lanzar?: Lanzador;
}

async function armar(o: OpcionesArmado = {}): Promise<Armado> {
  const base = await carpetaTemporal('pel-pasos-base-');
  const carpeta = await carpetaTemporal('pel-pasos-proy-');
  const rutas = new Rutas(base);
  const llamadas: Llamada[] = [];
  const guardados: Armado['guardados'] = [];
  const creadas: Armado['creadas'] = [];
  const restauradas: Armado['restauradas'] = [];
  const esquemas: Armado['esquemas'] = [];
  const vectores: string[] = [];
  const phpExe = join(base, 'bin', 'php', '8.4', 'php.exe');
  const phpIni = join(base, 'etc', 'php', '8.4', 'php.ini');
  const nodeDir = rutas.bin('node', '22.1.0');
  const pythonDir = rutas.bin('python', '3.12.10');
  const lanzar: Lanzador =
    o.lanzar ??
    (async (cmd, args, opts = {}) => {
      llamadas.push({ cmd, args, opts });
      for (const l of o.salida ?? []) opts.alLinea?.(l, 'stdout');
      return { codigo: o.codigo ?? 0 };
    });
  const deps: DepsPasos = {
    rutas,
    lanzar,
    entorno: { Path: 'C:\\Windows\\system32', OTRA: 'x' },
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
    composerPhar: async () => join(base, 'bin', 'composer', '2.8.1', 'composer.phar'),
    bd: {
      conexion: async (motor) => ({
        host: '127.0.0.1',
        puerto: motor === 'postgresql' ? 5432 : 3306,
        usuario: motor === 'postgresql' ? 'postgres' : 'root',
        clave: CLAVE,
      }),
      listar: async () => (o.basesExistentes ?? []).map((nombre) => ({ nombre, tamanoBytes: 0 })),
      crear: async (motor, nombre, opts) => {
        creadas.push({ motor, nombre, opts });
        return { usuarioActualizado: false };
      },
      tieneTablas: async () => o.tablas ?? false,
      activarVector: async (b) => {
        vectores.push(b);
        await o.activarVector?.();
      },
    },
    restaurar: async (motor, archivo, b, opts) => {
      restauradas.push({ motor, archivo, base: b, opts });
      return { advertencias: ['aviso del respaldo'] };
    },
    mailpit: async () => (o.mailpit ? { puerto: 1025 } : null),
    guardarSitio: async (datos, id) => {
      guardados.push({ datos, id });
    },
    puertoLibre: async ({ reservados, preferido }) => {
      if (preferido) return preferido;
      let p = 8000;
      while (reservados.includes(p)) p++;
      return p;
    },
  };
  const sitio: Sitio = {
    id: 'tienda-test',
    nombre: 'Mi Tienda',
    dominio: 'tienda.test',
    alias: [],
    carpeta,
    tipo: 'laravel',
    php: '8.4',
    puertoProxy: null,
    reglasExtra: '',
    urlBaseVar: null,
    datosReales: false,
    https: false,
    redirigirHttps: false,
    confiado: true,
    git: null,
    procesos: [],
    runtimes: {},
    nota: '',
    ...o.sitio,
  };
  const registro = registrarPasosReales(new RegistroPasos(), deps);
  return {
    base,
    carpeta,
    rutas,
    deps,
    registro,
    llamadas,
    guardados,
    creadas,
    restauradas,
    esquemas,
    vectores,
    sitio,
    phpExe,
    phpIni,
    nodeDir,
    pythonDir,
  };
}

/** Corre un paso y devuelve sus líneas. */
/** Marcas que dejó el último paso corrido con `correr`. */
let marcasPaso: string[] = [];
/** Marcas de corridas anteriores que recibe el paso (se fijan antes de `correr`). */
let marcasPrevias: string[] = [];

async function correr(
  a: Armado,
  tipo: TipoPaso,
  args?: Record<string, unknown>,
  senal: AbortSignal = new AbortController().signal,
): Promise<string[]> {
  const lineas: string[] = [];
  marcasPaso = [];
  const previas = marcasPrevias;
  marcasPrevias = [];
  const paso: PasoReceta = { id: tipo, tipo, titulo: tipo, ...(args ? { args } : {}) };
  const ctx: ContextoPaso = {
    sitio: a.sitio,
    paso,
    carpeta: a.sitio.carpeta,
    linea: (t) => lineas.push(t),
    marcar: (m) => marcasPaso.push(m),
    marcas: previas,
    senal,
  };
  await a.registro.obtener(tipo)!(ctx);
  return lineas;
}

const escribir = async (carpeta: string, nombre: string, texto: string): Promise<void> => {
  const ruta = join(carpeta, nombre);
  await mkdir(join(ruta, '..'), { recursive: true });
  await writeFile(ruta, texto, 'utf8');
};
const leer = (carpeta: string, nombre: string): Promise<string> =>
  readFile(join(carpeta, nombre), 'utf8');
const pathDe = (l: Llamada): string[] => (l.opts.env?.Path ?? '').split(';');

/* ───────────── Registro ───────────── */

describe('registrarPasosReales', () => {
  it('registra una implementación para cada tipo de paso', async () => {
    const a = await armar();
    for (const t of TIPOS_PASO) expect(a.registro.tiene(t), t).toBe(true);
  });
});

/* ───────────── composer ───────────── */

describe('composer-install', () => {
  it('usa el PHP del sitio con su php.ini, en la carpeta del proyecto y con la señal', async () => {
    const a = await armar({ salida: ['Installing dependencies', 'password=hunter2'] });
    await escribir(a.carpeta, 'composer.json', '{}');
    const senal = new AbortController().signal;
    const lineas = await correr(a, 'composer-install', undefined, senal);
    expect(a.llamadas).toHaveLength(1);
    const l = a.llamadas[0]!;
    expect(l.cmd).toBe(a.phpExe);
    expect(l.args).toEqual([
      '-c',
      a.phpIni,
      join(a.base, 'bin', 'composer', '2.8.1', 'composer.phar'),
      'install',
      '--no-interaction',
      '--prefer-dist',
    ]);
    expect(l.opts.cwd).toBe(a.carpeta);
    expect(l.opts.senal).toBe(senal);
    expect(lineas).toContain('Installing dependencies');
    expect(lineas.join('\n')).not.toContain('hunter2');
  });

  it('antepone al PATH el PHP, Node y Python del proyecto y tools/bin; fija PHPRC', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'composer.json', '{}');
    await correr(a, 'composer-install');
    const env = a.llamadas[0]!.opts.env!;
    expect(pathDe(a.llamadas[0]!)).toEqual([
      join(a.base, 'bin', 'php', '8.4'),
      a.nodeDir,
      join(a.nodeDir, 'node_modules', '.bin'),
      a.pythonDir,
      join(a.pythonDir, 'Scripts'),
      a.rutas.herramientas('bin'),
      'C:\\Windows\\system32',
    ]);
    expect(env.PATH).toBeUndefined();
    expect(env.PHPRC).toBe(join(a.base, 'etc', 'php', '8.4'));
  });

  it('muestra los avisos de los runtimes como líneas', async () => {
    const a = await armar({ avisos: ['El proyecto pide Node 18, que no está instalado'] });
    await escribir(a.carpeta, 'composer.json', '{}');
    const lineas = await correr(a, 'composer-install');
    expect(lineas.some((l) => l.includes('Node 18'))).toBe(true);
  });

  it('sin composer.json no ejecuta nada', async () => {
    const a = await armar();
    const lineas = await correr(a, 'composer-install');
    expect(a.llamadas).toHaveLength(0);
    expect(lineas.join('\n')).toMatch(/composer\.json/);
  });

  it('falla con el código de salida', async () => {
    const a = await armar({ codigo: 2 });
    await escribir(a.carpeta, 'composer.json', '{}');
    await expect(correr(a, 'composer-install')).rejects.toThrow(/código 2/);
  });

  it('falla si Composer no está instalado', async () => {
    const a = await armar();
    a.deps.composerPhar = async () => null;
    a.registro = registrarPasosReales(new RegistroPasos(), a.deps);
    await escribir(a.carpeta, 'composer.json', '{}');
    await expect(correr(a, 'composer-install')).rejects.toThrow(/Composer/);
  });
});

/* ───────────── cancelación ───────────── */

describe('cancelación', () => {
  it('con la señal ya abortada no lanza nada', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'composer.json', '{}');
    const c = new AbortController();
    c.abort();
    await expect(correr(a, 'composer-install', undefined, c.signal)).rejects.toThrow(/Cancelado/);
    expect(a.llamadas).toHaveLength(0);
  });

  it('si se aborta mientras corre, el paso termina en error aunque el código sea 0', async () => {
    const c = new AbortController();
    const a = await armar({
      lanzar: async () => {
        c.abort();
        return { codigo: 0 };
      },
    });
    await escribir(a.carpeta, 'package.json', '{}');
    await expect(correr(a, 'npm-ci', undefined, c.signal)).rejects.toThrow(/Cancelado/);
  });

  it('lanzadorPorDefecto mata el proceso (y su árbol) al abortar', async () => {
    const c = new AbortController();
    const inicio = Date.now();
    const p = lanzadorPorDefecto(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      senal: c.signal,
    });
    setTimeout(() => c.abort(), 300);
    const r = await p;
    expect(r.codigo).not.toBe(0);
    expect(Date.now() - inicio).toBeLessThan(10_000);
  });

  it('lanzadorPorDefecto rechaza sin lanzar si la señal ya está abortada', async () => {
    const c = new AbortController();
    c.abort();
    await expect(
      lanzadorPorDefecto(process.execPath, ['-e', ''], { senal: c.signal }),
    ).rejects.toThrow(/Cancelado/);
  });
});

/* ───────────── env-crear ───────────── */

const EJEMPLO_LARAVEL = [
  'APP_NAME=Laravel',
  'APP_ENV=local',
  'APP_KEY=',
  'APP_DEBUG=true',
  'APP_URL=http://localhost',
  '',
  'DB_CONNECTION=mysql',
  '# DB_HOST=127.0.0.1',
  '# DB_PORT=3306',
  '# DB_DATABASE=laravel',
  '# DB_USERNAME=root',
  '# DB_PASSWORD=',
  '',
  'MAIL_MAILER=log',
  'MAIL_HOST=127.0.0.1',
  'MAIL_PORT=2525',
  '',
].join('\n');

describe('env-crear', () => {
  it('no toca un .env existente', async () => {
    const a = await armar();
    await escribir(a.carpeta, '.env', 'APP_KEY=base64:x\n');
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    const lineas = await correr(a, 'env-crear');
    expect(await leer(a.carpeta, '.env')).toBe('APP_KEY=base64:x\n');
    expect(lineas).toContain('Ya existe .env; no se modificó');
  });

  it('con sobrescribir guarda antes una copia en run/env-<id>.respaldo', async () => {
    const a = await armar();
    await escribir(a.carpeta, '.env', 'VIEJO=1\n');
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await correr(a, 'env-crear', { sobrescribir: true });
    const respaldos = (await readdir(join(a.base, 'run'))).filter((n) =>
      /^env-tienda-test-\d{8}-\d{6}-\d{3}\.respaldo$/.test(n),
    );
    expect(respaldos).toHaveLength(1);
    expect(await readFile(join(a.base, 'run', respaldos[0]!), 'utf8')).toBe('VIEJO=1\n');
    const nuevo = await leer(a.carpeta, '.env');
    expect(nuevo).not.toContain('VIEJO');
    expect(nuevo).toContain('APP_KEY=');
  });

  it('copia .env.example y rellena APP_*, la BD (también las líneas comentadas) y nada secreto en el registro', async () => {
    const a = await armar();
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await escribir(a.carpeta, 'artisan', '');
    const lineas = await correr(a, 'env-crear');
    const env = await leer(a.carpeta, '.env');
    const v = leerVariablesEnv(env);
    expect(env).toContain("APP_NAME='Mi Tienda'\n");
    expect(env).toContain('APP_URL=https://tienda.test\n');
    expect(env).toContain('DB_CONNECTION=mysql\n');
    expect(env).toContain('DB_HOST=127.0.0.1\n');
    expect(env).toContain('DB_PORT=3306\n');
    expect(env).toContain('DB_DATABASE=tienda\n');
    expect(env).toContain('DB_USERNAME=root\n');
    expect(env).toContain(`DB_PASSWORD='${CLAVE}'\n`);
    expect(env).not.toMatch(/#\s*DB_HOST/);
    expect(v.get('DB_PASSWORD')).toBe(CLAVE);
    // Mailpit no está instalado: el correo queda como estaba.
    expect(env).toContain('MAIL_MAILER=log\n');
    expect(env).toContain('MAIL_PORT=2525\n');
    expect(lineas.join('\n')).not.toContain('s3cr3t');
    expect(lineas.join('\n')).toMatch(/\.env\.example/);
  });

  it('configura Mailpit si está instalado', async () => {
    const a = await armar({ mailpit: true });
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await escribir(a.carpeta, 'artisan', '');
    await correr(a, 'env-crear');
    const env = await leer(a.carpeta, '.env');
    expect(env).toContain('MAIL_MAILER=smtp\n');
    expect(env).toContain('MAIL_HOST=127.0.0.1\n');
    expect(env).toContain('MAIL_PORT=1025\n');
  });

  it('sin .env.example crea un .env mínimo válido de Laravel (Review Focus 2)', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'artisan', '');
    const lineas = await correr(a, 'env-crear', { motor: 'mysql' });
    const env = await leer(a.carpeta, '.env');
    const v = leerVariablesEnv(env);
    expect(v.get('APP_NAME')).toBe('Mi Tienda');
    expect(v.get('APP_ENV')).toBe('local');
    expect(v.has('APP_KEY')).toBe(true);
    expect(v.get('APP_KEY')).toBe('');
    expect(v.get('APP_DEBUG')).toBe('true');
    expect(v.get('APP_URL')).toBe('https://tienda.test');
    expect(v.get('DB_CONNECTION')).toBe('mysql');
    expect(v.get('DB_DATABASE')).toBe('tienda');
    expect(v.get('DB_PASSWORD')).toBe(CLAVE);
    expect(v.get('SESSION_DRIVER')).toBe('file');
    expect(lineas.join('\n')).toMatch(/mínimo/);
  });

  it('respeta un .env.example con variables raras', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'artisan', '');
    await escribir(
      a.carpeta,
      '.env.example',
      [
        'SIN_IGUAL',
        'export EXPORTADA=1',
        'CON_COMENTARIO="a b" # nota',
        'APP_NAME="Viejo nombre" # nombre',
        'VACIA=',
        'DB_CONNECTION=mysql',
        '',
      ].join('\r\n'),
    );
    await correr(a, 'env-crear');
    const env = await leer(a.carpeta, '.env');
    expect(env).toContain('SIN_IGUAL\r\n');
    expect(env).toContain('export EXPORTADA=1\r\n');
    expect(env).toContain('CON_COMENTARIO="a b" # nota\r\n');
    expect(env).toContain("APP_NAME='Mi Tienda'\r\n");
    expect(env).toContain('DB_HOST=127.0.0.1\r\n');
    expect(env).not.toMatch(/[^\r]\n/);
  });

  it('agrega los valores extra de wolfcore.yml', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'artisan', '');
    await escribir(a.carpeta, 'wolfcore.yml', 'version: 1\nenv:\n  FEATURE_X: "on off"\n');
    await correr(a, 'env-crear');
    expect(await leer(a.carpeta, '.env')).toContain("FEATURE_X='on off'\n");
  });

  it('CodeIgniter 3: usa su lector literal (comillas simples, sin DB_CONNECTION si no lo usa)', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter3', urlBaseVar: 'APP_BASE_URL' } });
    await escribir(
      a.carpeta,
      '.env.example',
      'APP_BASE_URL=http://localhost/\nDB_HOST=localhost\nDB_DATABASE=x\nDB_USERNAME=u\nDB_PASSWORD=\n',
    );
    await correr(a, 'env-crear', { motor: 'mysql' });
    const env = await leer(a.carpeta, '.env');
    expect(env).toContain('APP_BASE_URL=https://tienda.test/\n');
    expect(env).toContain(`DB_PASSWORD='${CLAVE}'\n`);
    expect(env).not.toContain('DB_CONNECTION');
    expect(env).not.toContain('APP_NAME');
  });

  it('CodeIgniter 3: un valor que el lector literal no puede guardar hace fallar sin escribir', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter3', nombre: "'raro'" } });
    await escribir(a.carpeta, '.env.example', 'APP_NAME=x\n');
    await expect(correr(a, 'env-crear')).rejects.toThrow(/comillas/);
    await expect(leer(a.carpeta, '.env')).rejects.toThrow();
  });

  it('CodeIgniter 4: copia `env`, descomenta database.default.* y fija app.baseURL', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter4' } });
    await escribir(
      a.carpeta,
      'env',
      [
        '# CI_ENVIRONMENT = production',
        "# app.baseURL = ''",
        '# database.default.hostname = localhost',
        '# database.default.database = ci4',
        '# database.default.username = root',
        '# database.default.password = root',
        '# database.default.DBDriver = MySQLi',
        '# database.default.port = 3306',
        '',
      ].join('\n'),
    );
    await correr(a, 'env-crear', { motor: 'mysql' });
    const env = await leer(a.carpeta, '.env');
    expect(env).toContain('CI_ENVIRONMENT = development\n');
    expect(env).toContain('app.baseURL = https://tienda.test/\n');
    expect(env).toContain('database.default.hostname = 127.0.0.1\n');
    expect(env).toContain('database.default.database = tienda\n');
    expect(env).toContain(`database.default.password = '${CLAVE}'\n`);
    expect(env).toContain('database.default.DBDriver = MySQLi\n');
    expect(env).not.toContain('DB_CONNECTION');
  });

  it('FastAPI: escribe DATABASE_URL conservando el esquema del ejemplo', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi' } });
    await escribir(
      a.carpeta,
      '.env.example',
      'DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/db\nSECRET_KEY=cambiar\n',
    );
    await correr(a, 'env-crear');
    const v = leerVariablesEnv(await leer(a.carpeta, '.env'));
    expect(v.get('DATABASE_URL')).toBe(
      `postgresql+psycopg://postgres:${encodeURIComponent(CLAVE)}@127.0.0.1:5432/tienda`,
    );
    expect(v.get('SECRET_KEY')).toBe('cambiar');
    expect(v.has('DB_CONNECTION')).toBe(false);
  });

  it('falla sin escribir si el motor no responde (para reintentar luego)', async () => {
    const a = await armar();
    a.deps.bd.conexion = async () => {
      throw new Error('Encienda MySQL para administrar sus bases');
    };
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await expect(correr(a, 'env-crear')).rejects.toThrow(/Encienda MySQL/);
    await expect(leer(a.carpeta, '.env')).rejects.toThrow();
  });
});

/* ───────────── laravel ───────────── */

describe('key-generate, migrar y storage-link', () => {
  it('key-generate solo si APP_KEY está vacío', async () => {
    const a = await armar();
    await escribir(a.carpeta, '.env', 'APP_KEY=\n');
    await correr(a, 'key-generate');
    expect(a.llamadas.map((l) => [l.cmd, ...l.args])).toEqual([
      [a.phpExe, '-c', a.phpIni, 'artisan', 'key:generate', '--force'],
    ]);

    const b = await armar();
    await escribir(b.carpeta, '.env', 'APP_KEY="base64:abc"\n');
    const lineas = await correr(b, 'key-generate');
    expect(b.llamadas).toHaveLength(0);
    expect(lineas.join('\n')).toMatch(/APP_KEY/);
    expect(lineas.join('\n')).not.toContain('abc');
  });

  it('key-generate trata APP_KEY="" como vacío y falla sin .env', async () => {
    const a = await armar();
    await escribir(a.carpeta, '.env', 'APP_KEY=""\n');
    await correr(a, 'key-generate');
    expect(a.llamadas).toHaveLength(1);
    const b = await armar();
    await expect(correr(b, 'key-generate')).rejects.toThrow(/\.env/);
  });

  it('migrar en Laravel (con --seed si se pide) y en CI4 con spark', async () => {
    const a = await armar();
    await correr(a, 'migrar');
    await correr(a, 'migrar', { semilla: true });
    expect(a.llamadas.map((l) => l.args)).toEqual([
      ['-c', a.phpIni, 'artisan', 'migrate', '--force'],
      ['-c', a.phpIni, 'artisan', 'migrate', '--force', '--seed'],
    ]);
    const b = await armar({ sitio: { tipo: 'codeigniter4' } });
    await correr(b, 'migrar', { comando: ['php', 'spark', 'migrate'] });
    expect(b.llamadas.map((l) => [l.cmd, ...l.args])).toEqual([
      [b.phpExe, '-c', b.phpIni, 'spark', 'migrate'],
    ]);
  });

  it('storage-link es idempotente', async () => {
    const a = await armar();
    await correr(a, 'storage-link');
    expect(a.llamadas.map((l) => l.args)).toEqual([['-c', a.phpIni, 'artisan', 'storage:link']]);
    const b = await armar();
    await mkdir(join(b.carpeta, 'public', 'storage'), { recursive: true });
    const lineas = await correr(b, 'storage-link');
    expect(b.llamadas).toHaveLength(0);
    expect(lineas.join('\n')).toMatch(/ya existe/i);
  });
});

/* ───────────── node ───────────── */

describe('npm-ci y npm-build', () => {
  it('npm ci con lock y npm install sin él, con el node.exe del proyecto (sin shell)', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'package.json', '{}');
    await escribir(a.carpeta, 'package-lock.json', '{}');
    await correr(a, 'npm-ci');
    const npmCli = join(a.nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js');
    expect(a.llamadas.map((l) => [l.cmd, ...l.args])).toEqual([
      [join(a.nodeDir, 'node.exe'), npmCli, 'ci'],
    ]);
    const b = await armar();
    await escribir(b.carpeta, 'package.json', '{}');
    await correr(b, 'npm-ci');
    expect(b.llamadas[0]!.args).toEqual([
      join(b.nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      'install',
    ]);
  });

  it('sin Node instalado falla con un mensaje claro', async () => {
    const a = await armar({ sinNode: true });
    await escribir(a.carpeta, 'package.json', '{}');
    await expect(correr(a, 'npm-ci')).rejects.toThrow(/Node/);
    expect(a.llamadas).toHaveLength(0);
  });

  it('npm-build solo si existe el script build', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'package.json', JSON.stringify({ scripts: { build: 'vite build' } }));
    await correr(a, 'npm-build');
    expect(a.llamadas[0]!.args.slice(1)).toEqual(['run', 'build']);
    const b = await armar();
    await escribir(b.carpeta, 'package.json', JSON.stringify({ scripts: { dev: 'vite' } }));
    const lineas = await correr(b, 'npm-build');
    expect(b.llamadas).toHaveLength(0);
    expect(lineas.join('\n')).toMatch(/build/);
  });
});

/* ───────────── python ───────────── */

describe('python-venv y pip-install', () => {
  it('python -m venv .venv con el Python del proyecto', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi' } });
    await correr(a, 'python-venv');
    expect(a.llamadas.map((l) => [l.cmd, ...l.args])).toEqual([
      [join(a.pythonDir, 'python.exe'), '-m', 'venv', '.venv'],
    ]);
  });

  it('python-venv no rehace un .venv que ya existe', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi' } });
    await escribir(a.carpeta, '.venv/Scripts/python.exe', '');
    const lineas = await correr(a, 'python-venv');
    expect(a.llamadas).toHaveLength(0);
    expect(lineas.join('\n')).toMatch(/\.venv/);
  });

  it('pip -r requirements.txt con el Scripts del venv antes que el Python del runtime', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi' } });
    await escribir(a.carpeta, 'requirements.txt', 'fastapi\n');
    await escribir(a.carpeta, '.venv/Scripts/python.exe', '');
    await correr(a, 'pip-install');
    const l = a.llamadas[0]!;
    expect([l.cmd, ...l.args]).toEqual([
      join(a.carpeta, '.venv', 'Scripts', 'python.exe'),
      '-m',
      'pip',
      'install',
      '-r',
      'requirements.txt',
    ]);
    const p = pathDe(l);
    const venv = p.indexOf(join(a.carpeta, '.venv', 'Scripts'));
    expect(venv).toBeGreaterThanOrEqual(0);
    expect(venv).toBeLessThan(p.indexOf(a.pythonDir));
    expect(l.opts.env?.VIRTUAL_ENV).toBe(join(a.carpeta, '.venv'));
  });

  it('pip -e . si solo hay pyproject', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi' } });
    await escribir(a.carpeta, 'pyproject.toml', '[project]\nname="x"\n');
    await escribir(a.carpeta, '.venv/Scripts/python.exe', '');
    await correr(a, 'pip-install');
    expect(a.llamadas[0]!.args).toEqual(['-m', 'pip', 'install', '-e', '.']);
  });

  it('pip-install sin .venv pide crear el entorno', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi' } });
    await escribir(a.carpeta, 'requirements.txt', 'fastapi\n');
    await expect(correr(a, 'pip-install')).rejects.toThrow(/\.venv/);
  });
});

/* ───────────── bd ───────────── */

describe('bd-crear, bd-restaurar y pgvector-activar', () => {
  it('nombreBase sale del dominio y es válido en todos los motores', () => {
    expect(nombreBase({ dominio: 'mi-tienda.test' })).toBe('mi_tienda');
    expect(nombreBase({ dominio: '2024-app.test' })).toBe('bd_2024_app');
    expect(nombreBase({ dominio: 'x.test' }, { base: 'otra' })).toBe('otra');
  });

  it('bd-crear crea la base (y el usuario si se pide)', async () => {
    const a = await armar();
    await correr(a, 'bd-crear', { motor: 'mysql', usuario: 'tienda' });
    expect(a.creadas).toEqual([{ motor: 'mysql', nombre: 'tienda', opts: { usuario: 'tienda' } }]);
  });

  it('bd-crear no hace nada si la base ya existe', async () => {
    const a = await armar({ basesExistentes: ['tienda'] });
    const lineas = await correr(a, 'bd-crear', { motor: 'mysql' });
    expect(a.creadas).toHaveLength(0);
    expect(lineas.join('\n')).toMatch(/ya existe/);
  });

  it('bd-restaurar exige un archivo absoluto que exista', async () => {
    const a = await armar();
    await expect(correr(a, 'bd-restaurar', { motor: 'mysql' })).rejects.toThrow(/archivo/);
    await expect(
      correr(a, 'bd-restaurar', { motor: 'mysql', archivo: 'respaldo.sql' }),
    ).rejects.toThrow(/archivo/);
    await expect(
      correr(a, 'bd-restaurar', { motor: 'mysql', archivo: join(a.base, 'no.sql') }),
    ).rejects.toThrow(/No se encontró/);
    expect(a.restauradas).toHaveLength(0);
  });

  it('bd-restaurar sobre una base con tablas pide confirmación', async () => {
    const a = await armar({ tablas: true });
    const archivo = join(a.base, 'respaldo.sql');
    await writeFile(archivo, 'SELECT 1;');
    await expect(correr(a, 'bd-restaurar', { motor: 'mysql', archivo })).rejects.toThrow(
      /confirme/,
    );
    expect(a.restauradas).toHaveLength(0);
    const lineas = await correr(a, 'bd-restaurar', {
      motor: 'mysql',
      archivo,
      confirmarSobrescribir: true,
    });
    expect(a.restauradas).toEqual([
      { motor: 'mysql', archivo, base: 'tienda', opts: { confirmarSobrescribir: true } },
    ]);
    expect(lineas).toContain('aviso del respaldo');
  });

  it('pgvector-activar activa la extensión en la base del proyecto', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi' } });
    await correr(a, 'pgvector-activar');
    expect(a.vectores).toEqual(['tienda']);
  });

  it('pgvector-activar sin pgvector invita a instalarlo', async () => {
    const a = await armar({
      activarVector: async () => {
        throw new Error('pgvector no está instalado: use "Instalar pgvector" en Bases de datos.');
      },
    });
    await expect(correr(a, 'pgvector-activar')).rejects.toThrow(/Instalar pgvector/);
  });
});

/* ───────────── sitio ───────────── */

describe('sitio-crear', () => {
  it('en un sitio que ya existe no pisa tipo, PHP, dominio ni HTTPS (solo se aplican al crear)', async () => {
    const a = await armar({ sitio: { php: '8.4' } });
    await correr(a, 'sitio-crear', {
      tipo: 'codeigniter3',
      dominio: 'otro.test',
      php: '8.3',
      https: true,
    });
    expect(a.guardados).toHaveLength(1);
    const g = a.guardados[0]!;
    expect(g.id).toBe('tienda-test');
    expect(g.datos).toMatchObject({
      tipo: 'laravel',
      dominio: 'tienda.test',
      php: '8.4',
      https: false,
    });
    expect('id' in g.datos).toBe(false);
  });

  it('FastAPI: ruta absoluta del python del .venv, puerto libre y main:app si no hay app.py', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi', php: null } });
    await escribir(a.carpeta, 'main.py', '');
    const det = await detectarProyecto(a.carpeta);
    const receta = recetaPorDefecto({ ...det, tipo: 'fastapi' });
    const args = receta.find((p) => p.tipo === 'sitio-crear')!.args!;
    await correr(a, 'sitio-crear', args);
    const datos = a.guardados[0]!.datos;
    expect(datos.tipo).toBe('fastapi');
    expect(datos.procesos).toHaveLength(1);
    const p = datos.procesos[0]!;
    expect(p.comando).toEqual([
      join(a.carpeta, '.venv', 'Scripts', 'python.exe'),
      '-m',
      'uvicorn',
      'main:app',
      '--host',
      '127.0.0.1',
      '--port',
      '8000',
    ]);
    expect(p.puerto).toBe(8000);
    expect(datos.puertoProxy).toBe(8000);
  });

  it('FastAPI: app.py se queda con app:app; sin app.py ni main.py avisa', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi', php: null } });
    await escribir(a.carpeta, 'app.py', '');
    const args = {
      tipo: 'fastapi',
      procesos: [
        {
          id: 'uvicorn',
          comando: ['.venv\\Scripts\\python.exe', '-m', 'uvicorn', 'app:app', '--port', '{puerto}'],
        },
      ],
    };
    await correr(a, 'sitio-crear', args);
    expect(a.guardados[0]!.datos.procesos[0]!.comando[3]).toBe('app:app');

    const b = await armar({ sitio: { tipo: 'fastapi', php: null } });
    const lineas = await correr(b, 'sitio-crear', args);
    expect(b.guardados[0]!.datos.procesos[0]!.comando[3]).toBe('app:app');
    expect(lineas.join('\n')).toMatch(/app\.py/);
  });

  it('reutiliza el puerto anterior del mismo proceso y no repite puertos entre procesos', async () => {
    const a = await armar({
      sitio: {
        tipo: 'node',
        php: null,
        procesos: [
          {
            id: 'vite',
            nombre: 'vite',
            comando: ['npm', 'run', 'dev'],
            cwd: 'raiz',
            autoIniciar: true,
            reiniciar: true,
            puerto: 5174,
            proxy: false,
          },
        ],
      },
    });
    await correr(a, 'sitio-crear', {
      procesos: [
        { id: 'api', comando: ['x', '--port={puerto}'] },
        { id: 'vite', comando: ['npm', 'run', 'dev', '--', '--port', '{puerto}'] },
        { id: 'otro', comando: ['y', '{puerto}'] },
      ],
    });
    const procesos = a.guardados[0]!.datos.procesos;
    expect(procesos.map((p) => [p.id, p.puerto])).toEqual([
      ['vite', 5174],
      ['api', 8000],
      ['otro', 8001],
    ]);
    expect(procesos.find((p) => p.id === 'api')!.comando).toEqual(['x', '--port=8000']);
  });

  it('puertoProxy sale del proceso marcado con proxy aunque vite vaya antes', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi', php: null } });
    await correr(a, 'sitio-crear', {
      tipo: 'fastapi',
      procesos: [
        { id: 'vite', comando: ['npm', 'run', 'dev', '--', '--port', '{puerto}'] },
        { id: 'uvicorn', comando: ['uvicorn', 'app:app', '--port', '{puerto}'], proxy: true },
      ],
    });
    const datos = a.guardados[0]!.datos;
    expect(datos.procesos.map((p) => [p.id, p.puerto])).toEqual([
      ['vite', 8000],
      ['uvicorn', 8001],
    ]);
    expect(datos.puertoProxy).toBe(8001);
  });
});

/* ───────────── comando ───────────── */

describe('comando', () => {
  it('lanza el comando como arreglo, sin shell, en la carpeta del proyecto', async () => {
    const a = await armar();
    await correr(a, 'comando', { comando: ['git', 'status', '--short'] });
    const l = a.llamadas[0]!;
    expect([l.cmd, ...l.args]).toEqual(['git', 'status', '--short']);
    expect(l.opts.cwd).toBe(a.carpeta);
    expect(l.opts).not.toHaveProperty('shell');
  });

  it('php, npm y python usan los del proyecto', async () => {
    const a = await armar();
    await correr(a, 'comando', { comando: ['php', 'artisan', 'queue:restart'] });
    await correr(a, 'comando', { comando: ['npm', 'run', 'lint'] });
    await correr(a, 'comando', { comando: ['python', '-V'] });
    expect(a.llamadas.map((l) => [l.cmd, ...l.args])).toEqual([
      [a.phpExe, '-c', a.phpIni, 'artisan', 'queue:restart'],
      [
        join(a.nodeDir, 'node.exe'),
        join(a.nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
        'run',
        'lint',
      ],
      [join(a.pythonDir, 'python.exe'), '-V'],
    ]);
  });

  it('rechaza un comando vacío o que no es una lista de textos', async () => {
    const a = await armar();
    await expect(correr(a, 'comando', { comando: [] })).rejects.toThrow(/comando/);
    await expect(correr(a, 'comando', { comando: 'rm -rf /' })).rejects.toThrow(/comando/);
    await expect(correr(a, 'comando', { comando: ['build.cmd'] })).rejects.toThrow(/\.cmd/);
    expect(a.llamadas).toHaveLength(0);
  });
});

/* ───────────── Ronda de arreglos ───────────── */

describe('ronda de arreglos', () => {
  it('recetaEfectiva quita de wolfcore.yml las confirmaciones (sobrescribir, confirmarSobrescribir, archivo)', async () => {
    const carpeta = await carpetaTemporal('pel-pasos-yml-');
    await escribir(
      carpeta,
      'wolfcore.yml',
      [
        'version: 1',
        'receta:',
        '  - id: env',
        '    tipo: env-crear',
        '    titulo: Env',
        '    args: { sobrescribir: true, https: false }',
        '  - id: rest',
        '    tipo: bd-restaurar',
        '    titulo: Restaurar',
        '    args: { archivo: "C:/x.sql", confirmarSobrescribir: true, motor: mysql }',
        '',
      ].join('\n'),
    );
    const r = await recetaEfectiva(carpeta, await detectarProyecto(carpeta));
    expect(r.map((p) => p.args)).toEqual([{ https: false }, { motor: 'mysql' }]);
  });

  it('matarArbol no lanza taskkill si el proceso ya salió y usa la ruta absoluta', () => {
    const llamadas: { cmd: string; args: readonly string[] }[] = [];
    const lanzarFalso = ((cmd: string, args: readonly string[]) => {
      llamadas.push({ cmd, args });
      return { once: () => undefined };
    }) as unknown as NonNullable<Parameters<typeof matarArbol>[1]['lanzar']>;
    const hijo = { pid: 1234, kill: () => true };
    matarArbol(hijo, { salio: true, plataforma: 'win32', lanzar: lanzarFalso });
    expect(llamadas).toHaveLength(0);
    matarArbol(hijo, {
      salio: false,
      plataforma: 'win32',
      lanzar: lanzarFalso,
      env: { SystemRoot: 'D:\\Win' },
    });
    expect(llamadas).toEqual([
      { cmd: 'D:\\Win\\System32\\taskkill.exe', args: ['/PID', '1234', '/T', '/F'] },
    ]);
    expect(rutaTaskkill({})).toBe('C:\\Windows\\System32\\taskkill.exe');
  });

  it('env-crear con args.usuario sin args.clave falla sin escribir', async () => {
    const a = await armar();
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await expect(correr(a, 'env-crear', { usuario: 'tienda' })).rejects.toThrow(/clave/);
    await expect(leer(a.carpeta, '.env')).rejects.toThrow();
  });

  it('wolfcore.yml: valores con salto de línea fallan y las claves de la BD se ignoran con aviso', async () => {
    const a = await armar();
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await escribir(
      a.carpeta,
      'wolfcore.yml',
      'version: 1\nenv:\n  DB_PASSWORD: robada\n  DATABASE_URL: x\n  database.default.hostname: h\n  OK: si\n',
    );
    const lineas = await correr(a, 'env-crear');
    const env = await leer(a.carpeta, '.env');
    expect(env).toContain(`DB_PASSWORD='${CLAVE}'`);
    expect(env).not.toContain('robada');
    expect(env).not.toContain('DATABASE_URL');
    expect(env).not.toContain('database.default');
    expect(env).toContain('OK=si');
    expect(lineas.filter((l) => /Aviso/.test(l))).toHaveLength(3);

    const b = await armar();
    await escribir(b.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await escribir(b.carpeta, 'wolfcore.yml', 'version: 1\nenv:\n  X: "a\\nb"\n');
    await expect(correr(b, 'env-crear')).rejects.toThrow(/salto de línea/);
    await expect(leer(b.carpeta, '.env')).rejects.toThrow();
  });

  it('nombreBase valida args.base', () => {
    expect(() => nombreBase({ dominio: 'x.test' }, { base: 'a;DROP' })).toThrow(/no es válido/);
    expect(() => nombreBase({ dominio: 'x.test' }, { base: 'x'.repeat(65) })).toThrow();
  });

  it('migrar avisa que ignora args.comando', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter4' } });
    const lineas = await correr(a, 'migrar', { comando: ['rm', '-rf'] });
    expect(lineas.join('\n')).toMatch(/se ignora args\.comando/);
    expect(a.llamadas[0]!.args).toEqual(['-c', a.phpIni, 'spark', 'migrate']);
  });

  it('APP_URL usa el https real del sitio guardado', async () => {
    const a = await armar();
    a.deps.leerSitio = async () => ({ ...a.sitio, https: false });
    a.registro = registrarPasosReales(new RegistroPasos(), a.deps);
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await correr(a, 'env-crear', { https: true });
    expect(await leer(a.carpeta, '.env')).toContain('APP_URL=http://tienda.test\n');
  });

  it('dos sobrescrituras guardan dos respaldos distintos', async () => {
    const a = await armar();
    await escribir(a.carpeta, '.env.example', EJEMPLO_LARAVEL);
    await escribir(a.carpeta, '.env', 'UNO=1\n');
    await correr(a, 'env-crear', { sobrescribir: true });
    await new Promise((r) => setTimeout(r, 5));
    await correr(a, 'env-crear', { sobrescribir: true });
    const respaldos = (await readdir(join(a.base, 'run'))).filter((n) => n.endsWith('.respaldo'));
    expect(respaldos).toHaveLength(2);
  });

  it('storage-link recrea un enlace roto', async () => {
    const a = await armar();
    const destino = join(a.carpeta, 'storage', 'app', 'public');
    await mkdir(destino, { recursive: true });
    await mkdir(join(a.carpeta, 'public'), { recursive: true });
    const enlace = join(a.carpeta, 'public', 'storage');
    await symlink(destino, enlace, 'junction');
    await rm(destino, { recursive: true });
    await correr(a, 'storage-link');
    expect(a.llamadas.map((l) => l.args)).toEqual([['-c', a.phpIni, 'artisan', 'storage:link']]);
    await expect(readdir(join(a.carpeta, 'public'))).resolves.toEqual([]);
  });
});

describe('sitio-crear con FastAPI en subcarpeta (QA 2)', () => {
  it('el python del .venv y el módulo se buscan en el cwd del proceso', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi', php: null } });
    await escribir(
      a.carpeta,
      'admin/app/main.py',
      'from fastapi import FastAPI\napp = FastAPI()\n',
    );
    await correr(a, 'sitio-crear', {
      tipo: 'fastapi',
      procesos: [
        {
          id: 'uvicorn',
          cwd: 'admin',
          comando: ['.venv/Scripts/python.exe', '-m', 'uvicorn', 'app:app', '--port', '{puerto}'],
          proxy: true,
        },
      ],
    });
    const proc = a.guardados[0]!.datos.procesos[0]!;
    expect(proc.comando[3]).toBe('app.main:app');
    expect(proc.comando[0]!.startsWith(join(a.carpeta, 'admin', '.venv'))).toBe(true);
    expect(proc.cwd).toBe('admin');
  });
});

/* ───────────── Proyectos nuevos (D12) ───────────── */

describe('crear-desde-composer', () => {
  it('create-project con el PHP del sitio, sin shell, en la carpeta vacía y sin scripts', async () => {
    const a = await armar({ sitio: { tipo: 'laravel' } });
    const ac = new AbortController();
    await correr(a, 'crear-desde-composer', { paquete: 'laravel/laravel' }, ac.signal);
    expect(a.llamadas).toHaveLength(1);
    const l = a.llamadas[0]!;
    expect(l.cmd).toBe(a.phpExe);
    expect(l.args).toEqual([
      '-c',
      a.phpIni,
      join(a.base, 'bin', 'composer', '2.8.1', 'composer.phar'),
      'create-project',
      '--no-interaction',
      '--prefer-dist',
      '--no-scripts',
      'laravel/laravel',
      '.',
    ]);
    expect(l.opts.cwd).toBe(a.carpeta);
    expect(l.opts.senal).toBe(ac.signal);
    expect(l.opts.env?.COMPOSER_NO_INTERACTION).toBe('1');
  });

  it('con versión pedida la pasa a create-project y deja la marca composer-iniciado', async () => {
    const a = await armar();
    await correr(a, 'crear-desde-composer', { paquete: 'symfony/skeleton', version: '^7.2' });
    expect(a.llamadas).toHaveLength(1);
    expect(a.llamadas[0]!.args.slice(-3)).toEqual(['symfony/skeleton', '.', '^7.2']);
    expect(marcasPaso).toEqual(['composer-iniciado']);
  });

  it('composer-requerir es un paso propio: require de cada paquete, solo con composer.json', async () => {
    const a = await armar();
    await expect(
      correr(a, 'composer-requerir', { paquetes: ['symfony/webapp-pack'] }),
    ).rejects.toThrow('Falta composer.json');
    expect(a.llamadas).toHaveLength(0);
    await escribir(a.carpeta, 'composer.json', '{}');
    await correr(a, 'composer-requerir', { paquetes: ['symfony/webapp-pack'] });
    expect(a.llamadas).toHaveLength(1);
    expect(a.llamadas[0]!.args.slice(3)).toEqual([
      'require',
      '--no-interaction',
      'symfony/webapp-pack',
    ]);
    expect(a.llamadas[0]!.opts.cwd).toBe(a.carpeta);
    for (const paquetes of [['--dev'], 'x/y', [], ['a/b; calc'], ['a/b', 1]]) {
      await expect(correr(a, 'composer-requerir', { paquetes })).rejects.toThrow();
    }
    expect(a.llamadas).toHaveLength(1);
  });

  it('no pisa: con la carpeta con archivos falla con proyectos.carpeta_no_vacia y no lanza nada', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'mio.txt', 'mío');
    await expect(
      correr(a, 'crear-desde-composer', { paquete: 'laravel/laravel' }),
    ).rejects.toMatchObject({ codigo: 'proyectos.carpeta_no_vacia' });
    expect(a.llamadas).toHaveLength(0);
    expect(await leer(a.carpeta, 'mio.txt')).toBe('mío');
  });

  it('un composer.json de otro paquete tampoco se reanuda', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'composer.json', JSON.stringify({ name: 'otro/proyecto' }));
    await expect(
      correr(a, 'crear-desde-composer', { paquete: 'laravel/laravel' }),
    ).rejects.toMatchObject({ codigo: 'proyectos.carpeta_no_vacia' });
    expect(a.llamadas).toHaveLength(0);
  });

  it('reanuda solo con la marca composer-iniciado y un composer.json: composer install', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'composer.json', JSON.stringify({ name: 'laravel/laravel' }));
    // Sin la marca (otro paso u otra mano dejó el composer.json) no se reanuda, aunque el
    // nombre del paquete coincida.
    await expect(
      correr(a, 'crear-desde-composer', { paquete: 'laravel/laravel' }),
    ).rejects.toMatchObject({ codigo: 'proyectos.carpeta_no_vacia' });
    expect(a.llamadas).toHaveLength(0);
    marcasPrevias = ['composer-iniciado'];
    await correr(a, 'crear-desde-composer', { paquete: 'laravel/laravel' });
    expect(a.llamadas).toHaveLength(1);
    expect(a.llamadas[0]!.args.slice(3)).toEqual([
      'install',
      '--no-interaction',
      '--prefer-dist',
      '--no-scripts',
    ]);
  });

  it('con la marca pero sin composer.json no hay nada que reanudar: pide vaciar la carpeta', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'basura.tmp', 'x');
    marcasPrevias = ['composer-iniciado'];
    await expect(
      correr(a, 'crear-desde-composer', { paquete: 'laravel/laravel' }),
    ).rejects.toMatchObject({ codigo: 'proyectos.carpeta_no_vacia' });
    expect(a.llamadas).toHaveLength(0);
  });

  it('Symfony reanudado con el lock y sin vendor: composer update (Flex aplica las recetas)', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'composer.json', JSON.stringify({ name: 'symfony/skeleton' }));
    await escribir(a.carpeta, 'composer.lock', '{}');
    marcasPrevias = ['composer-iniciado'];
    await correr(a, 'crear-desde-composer', { paquete: 'symfony/skeleton', scripts: true });
    expect(a.llamadas.map((l) => l.args.slice(3))).toEqual([
      ['update', '--no-interaction', '--prefer-dist'],
    ]);
  });

  it('con args.scripts (Symfony) no pasa --no-scripts', async () => {
    const a = await armar();
    await correr(a, 'crear-desde-composer', { paquete: 'symfony/skeleton', scripts: true });
    expect(a.llamadas[0]!.args).not.toContain('--no-scripts');
    expect(a.llamadas[0]!.args).toContain('symfony/skeleton');
    const b = await armar();
    await correr(b, 'crear-desde-composer', { paquete: 'symfony/skeleton' });
    expect(b.llamadas[0]!.args).toContain('--no-scripts');
  });

  it('wolfcore.yml no puede traer pasos de generador ni args.scripts', async () => {
    const { ConfigProyectoSchema } = await import('../src/proyectos/config');
    const { PASOS_SOLO_GENERADOR } = await import('../src/proyectos/config');
    for (const tipo of PASOS_SOLO_GENERADOR) {
      const r = ConfigProyectoSchema.safeParse({ receta: [{ id: 'x', tipo, titulo: 't' }] });
      expect(r.success, tipo).toBe(false);
    }
    expect(
      ConfigProyectoSchema.safeParse({ receta: [{ id: 'x', tipo: 'migrar', titulo: 't' }] })
        .success,
    ).toBe(true);
    const { ARGS_SOLO_INTERFAZ } = await import('../src/proyectos/recetas');
    expect(ARGS_SOLO_INTERFAZ).toContain('scripts');
  });

  it.each([
    [{ paquete: '--version' }],
    [{ paquete: 'laravel/laravel; calc' }],
    [{ paquete: '../a/b' }],
    [{ paquete: 'sin-barra' }],
    [{ paquete: 'a/b', version: '-d' }],
    [{ paquete: 'a/b', version: '^1 && calc' }],
    [{}],
  ])('rechaza argumentos peligrosos %j sin lanzar nada', async (args) => {
    const a = await armar();
    await expect(correr(a, 'crear-desde-composer', args)).rejects.toThrow();
    expect(a.llamadas).toHaveLength(0);
  });

  it('sin Composer y con código de salida distinto de 0 falla con un mensaje claro', async () => {
    const sin = await armar();
    sin.deps.composerPhar = async () => null;
    await expect(correr(sin, 'crear-desde-composer', { paquete: 'a/b' })).rejects.toThrow(
      'Composer no está instalado',
    );
    const mal = await armar({ codigo: 2 });
    await expect(correr(mal, 'crear-desde-composer', { paquete: 'a/b' })).rejects.toThrow(
      'terminó con el código 2',
    );
  });
});

describe('descargar-plantilla (WordPress)', () => {
  const URL = 'https://wordpress.org/wordpress-7.1.5.zip';
  const sha1 = (b: Buffer | string): string => createHash('sha1').update(b).digest('hex');
  const wp = zip({
    'wordpress/index.php': '<?php // wp',
    'wordpress/wp-config-sample.php': "define( 'DB_NAME', 'database_name_here' );",
    'wordpress/wp-content/plugins/index.php': '<?php',
  });
  const args = (extra: Record<string, unknown> = {}) => ({
    servicio: 'wordpress',
    version: '7.1.5',
    confirmarHuellaDebil: true,
    ...extra,
  });

  it('sin confirmar la huella débil falla con catalogo.huella_debil y no pide nada', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    const red = fetchFalso({ [URL]: wp, [`${URL}.sha1`]: sha1(wp) });
    a.deps.fetch = red.f;
    await expect(
      correr(a, 'descargar-plantilla', { servicio: 'wordpress', version: '7.1.5' }),
    ).rejects.toMatchObject({ codigo: 'catalogo.huella_debil' });
    expect(red.pedidas).toEqual([]);
    expect(await readdir(a.carpeta)).toEqual([]);
  });

  it('confirmada: verifica el SHA-1 y deja el contenido de wordpress/ en la carpeta', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    const red = fetchFalso({ [URL]: wp, [`${URL}.sha1`]: `${sha1(wp)}  wordpress-7.1.5.zip\n` });
    a.deps.fetch = red.f;
    await correr(a, 'descargar-plantilla', args());
    expect(red.pedidas).toEqual([`${URL}.sha1`, URL]);
    expect(await leer(a.carpeta, 'index.php')).toBe('<?php // wp');
    expect(await readdir(a.carpeta)).not.toContain('wordpress');
    expect(await leer(a.carpeta, 'wp-content/plugins/index.php')).toBe('<?php');
    // Sin restos en la carpeta temporal.
    await expect(readdir(a.rutas.tmp())).resolves.toEqual([]);
  });

  it('una huella que no coincide no deja nada y limpia lo descargado', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    a.deps.fetch = fetchFalso({ [URL]: wp, [`${URL}.sha1`]: '0'.repeat(40) }).f;
    await expect(correr(a, 'descargar-plantilla', args())).rejects.toMatchObject({
      codigo: 'catalogo.huella_no_coincide',
    });
    expect(await readdir(a.carpeta)).toEqual([]);
    await expect(readdir(a.rutas.tmp())).resolves.toEqual([]);
  });

  it('una huella publicada mal formada se rechaza', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    a.deps.fetch = fetchFalso({ [URL]: wp, [`${URL}.sha1`]: '<html>error</html>' }).f;
    await expect(correr(a, 'descargar-plantilla', args())).rejects.toMatchObject({
      codigo: 'catalogo.huella_no_disponible',
    });
  });

  it('una redirección a otro host se corta antes de pedirlo', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    const red = fetchFalso({ [`${URL}.sha1`]: { ir: 'https://evil.example/wp.sha1' } });
    a.deps.fetch = red.f;
    await expect(correr(a, 'descargar-plantilla', args())).rejects.toMatchObject({
      codigo: 'catalogo.redireccion_ajena',
    });
    expect(red.pedidas).toEqual([`${URL}.sha1`]);
  });

  it('una respuesta enorme se corta por el tamaño anunciado', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    a.deps.fetch = fetchFalso({
      [`${URL}.sha1`]: sha1('x'),
      [URL]: { encabezados: { 'content-length': String(500 * 1024 * 1024) }, cuerpo: 'x' },
    }).f;
    await expect(correr(a, 'descargar-plantilla', args())).rejects.toMatchObject({
      codigo: 'catalogo.respuesta_grande',
    });
    expect(await readdir(a.carpeta)).toEqual([]);
  });

  it('un zip con una ruta fuera del destino (zip-slip) no escribe fuera', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    const malo = zip({ 'wordpress/index.php': 'x', 'wordpress/../../escape.txt': 'fuera' });
    a.deps.fetch = fetchFalso({ [URL]: malo, [`${URL}.sha1`]: sha1(malo) }).f;
    await expect(correr(a, 'descargar-plantilla', args())).rejects.toThrow(
      /invalid relative path|fuera del destino/,
    );
    expect(await readdir(a.carpeta)).toEqual([]);
    await expect(stat(join(a.base, 'escape.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('no pisa: con archivos en la carpeta falla con proyectos.carpeta_no_vacia y no pide nada', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    await escribir(a.carpeta, 'index.php', 'MÍO');
    const red = fetchFalso({});
    a.deps.fetch = red.f;
    await expect(correr(a, 'descargar-plantilla', args())).rejects.toMatchObject({
      codigo: 'proyectos.carpeta_no_vacia',
    });
    expect(red.pedidas).toEqual([]);
    expect(await leer(a.carpeta, 'index.php')).toBe('MÍO');
  });

  it('solo wordpress.org vale como destino, en cada salto', async () => {
    const { urlWordpress } = await import('../src/proyectos/pasos/descargarPlantilla');
    expect(urlWordpress('https://wordpress.org/wordpress-7.1.5.zip')).toBe(true);
    for (const mala of [
      'http://wordpress.org/x.zip',
      'https://downloads.wordpress.org/x.zip',
      'https://wordpress.org.evil.example/x.zip',
      'https://u:p@wordpress.org/x.zip',
      'https://wordpress.org:8443/x.zip',
      'https://github.com/x.zip',
      'no es url',
    ]) {
      expect(urlWordpress(mala), mala).toBe(false);
    }
    const { HOSTS_PERMITIDOS } = await import('../src/catalogo/comun');
    expect(HOSTS_PERMITIDOS).not.toContain('wordpress.org');
  });

  it('una redirección a downloads.wordpress.org también se corta', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    const red = fetchFalso({
      [`${URL}.sha1`]: { ir: 'https://downloads.wordpress.org/release/x.sha1' },
    });
    a.deps.fetch = red.f;
    await expect(correr(a, 'descargar-plantilla', args())).rejects.toMatchObject({
      codigo: 'catalogo.redireccion_ajena',
    });
  });

  it.each([
    [{ servicio: 'joomla', version: '5.0.0' }],
    [{ servicio: 'wordpress', version: '../../x' }],
    [{ servicio: 'wordpress', version: '7.1.5/../../x' }],
    [{ servicio: 'wordpress' }],
  ])('rechaza argumentos inválidos %j', async (a2) => {
    const a = await armar();
    const red = fetchFalso({});
    a.deps.fetch = red.f;
    await expect(
      correr(a, 'descargar-plantilla', { ...a2, confirmarHuellaDebil: true }),
    ).rejects.toThrow();
    expect(red.pedidas).toEqual([]);
  });

  it('un wolfcore.yml de un repositorio no puede traer la confirmación', async () => {
    const { ARGS_SOLO_INTERFAZ } = await import('../src/proyectos/recetas');
    expect(ARGS_SOLO_INTERFAZ).toContain('confirmarHuellaDebil');
  });
});

describe('copiar-plantilla-interna', () => {
  it('estático: index.html y estilos.css con el nombre escapado', async () => {
    const a = await armar({ sitio: { tipo: 'estatico' } });
    await correr(a, 'copiar-plantilla-interna', { plantilla: 'estatico', nombre: 'mi-sitio' });
    expect((await readdir(a.carpeta)).sort()).toEqual(['estilos.css', 'index.html']);
    expect(await leer(a.carpeta, 'index.html')).toContain('<title>mi-sitio</title>');
  });

  it('nunca sobrescribe un archivo que ya existe', async () => {
    const a = await armar({ sitio: { tipo: 'estatico' } });
    await escribir(a.carpeta, 'index.html', 'MI PÁGINA');
    const lineas = await correr(a, 'copiar-plantilla-interna', {
      plantilla: 'estatico',
      nombre: 'mi-sitio',
    });
    expect(await leer(a.carpeta, 'index.html')).toBe('MI PÁGINA');
    expect(lineas.join('\n')).toContain('index.html ya existe');
    expect(await readdir(a.carpeta)).toContain('estilos.css');
  });

  it('FastAPI: main.py, requirements según el motor y .gitignore sin el .env', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi', php: null } });
    await correr(a, 'copiar-plantilla-interna', {
      plantilla: 'fastapi',
      nombre: 'mi-api',
      motor: 'postgresql',
      pgvector: true,
    });
    const req = await leer(a.carpeta, 'requirements.txt');
    expect(req).toContain('fastapi');
    expect(req).toContain('uvicorn');
    expect(req).toContain('psycopg');
    expect(req).toContain('pgvector');
    expect(await leer(a.carpeta, 'main.py')).toContain('app = FastAPI(title="mi-api")');
    expect(await leer(a.carpeta, '.gitignore')).toMatch(/^\.env$/m);
    expect(await leer(a.carpeta, '.gitignore')).toMatch(/^\.venv\/$/m);
  });

  it('FastAPI sin base no pide SQLAlchemy', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi', php: null } });
    await correr(a, 'copiar-plantilla-interna', { plantilla: 'fastapi', nombre: 'mi-api' });
    expect(await leer(a.carpeta, 'requirements.txt')).not.toContain('sqlalchemy');
  });

  it.each([
    [{ plantilla: 'django', nombre: 'x' }],
    [{ plantilla: 'estatico', nombre: '../x' }],
    [{ plantilla: 'estatico', nombre: 'a"><script>' }],
    [{ plantilla: 'estatico' }],
  ])('rechaza %j', async (args) => {
    const a = await armar();
    await expect(correr(a, 'copiar-plantilla-interna', args)).rejects.toThrow();
    expect(await readdir(a.carpeta)).toEqual([]);
  });
});

describe('config-bd-crear', () => {
  const SAMPLE = [
    '<?php',
    "define( 'DB_NAME', 'database_name_here' );",
    "define( 'DB_USER', 'username_here' );",
    "define( 'DB_PASSWORD', 'password_here' );",
    "define( 'DB_HOST', 'localhost' );",
    "define( 'AUTH_KEY',         'put your unique phrase here' );",
    "define( 'SECURE_AUTH_KEY',  'put your unique phrase here' );",
    "define( 'LOGGED_IN_KEY',    'put your unique phrase here' );",
    "define( 'NONCE_KEY',        'put your unique phrase here' );",
    "define( 'AUTH_SALT',        'put your unique phrase here' );",
    "define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );",
    "define( 'LOGGED_IN_SALT',   'put your unique phrase here' );",
    "define( 'NONCE_SALT',       'put your unique phrase here' );",
    "$table_prefix = 'wp_';",
    '',
  ].join('\n');

  it('WordPress: wp-config.php con la conexión y sales nuevas; la clave no va al registro', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    await escribir(a.carpeta, 'wp-config-sample.php', SAMPLE);
    const lineas = await correr(a, 'config-bd-crear', {
      marco: 'wordpress',
      motor: 'mysql',
      base: 'mi_blog',
    });
    const t = await leer(a.carpeta, 'wp-config.php');
    expect(t).toContain("define( 'DB_NAME', 'mi_blog' );");
    expect(t).toContain("define( 'DB_USER', 'root' );");
    expect(t).toContain("define( 'DB_PASSWORD', 's3cr3t pa$$' );");
    expect(t).toContain("define( 'DB_HOST', '127.0.0.1:3306' );");
    expect(t).not.toContain('put your unique phrase here');
    expect(t).toContain("$table_prefix = 'wp_';");
    const sales = [...t.matchAll(/define\( '\w+_(?:KEY|SALT)',\s+'([^']+)'/g)].map((m) => m[1]);
    expect(sales).toHaveLength(8);
    expect(new Set(sales).size).toBe(8);
    expect(lineas.join('\n')).not.toContain('s3cr3t');
    // La plantilla original queda como estaba.
    expect(await leer(a.carpeta, 'wp-config-sample.php')).toBe(SAMPLE);
  });

  it('WordPress: una clave con comillas y barras se escapa para PHP', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    a.deps.bd.conexion = async () => ({
      host: '127.0.0.1',
      puerto: 3307,
      usuario: 'root',
      clave: "a'b\\c$d",
    });
    await escribir(a.carpeta, 'wp-config-sample.php', SAMPLE);
    await correr(a, 'config-bd-crear', { marco: 'wordpress', motor: 'mariadb', base: 'blog' });
    const t = await leer(a.carpeta, 'wp-config.php');
    expect(t).toContain("define( 'DB_PASSWORD', 'a\\'b\\\\c$d' );");
    expect(t).toContain("'127.0.0.1:3307'");
  });

  it('WordPress: no pisa un wp-config.php existente ni acepta PostgreSQL', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    await escribir(a.carpeta, 'wp-config-sample.php', SAMPLE);
    await escribir(a.carpeta, 'wp-config.php', 'MÍO');
    await correr(a, 'config-bd-crear', { marco: 'wordpress', motor: 'mysql', base: 'x' });
    expect(await leer(a.carpeta, 'wp-config.php')).toBe('MÍO');
    await rm(join(a.carpeta, 'wp-config.php'));
    await expect(
      correr(a, 'config-bd-crear', { marco: 'wordpress', motor: 'postgresql', base: 'x' }),
    ).rejects.toThrow('MySQL o MariaDB');
    await expect(readdir(a.carpeta)).resolves.not.toContain('wp-config.php');
  });

  it('WordPress sin la plantilla da un error claro', async () => {
    const a = await armar({ sitio: { tipo: 'wordpress' } });
    await expect(
      correr(a, 'config-bd-crear', { marco: 'wordpress', motor: 'mysql', base: 'x' }),
    ).rejects.toThrow('wp-config-sample.php');
  });

  it('CodeIgniter 3: database.php con cadenas PHP literales y el puerto', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter3' } });
    const db = [
      '<?php',
      "$db['default'] = array(",
      "\t'dsn'\t=> '',",
      "\t'hostname' => 'localhost',",
      "\t'username' => '',",
      "\t'password' => '',",
      "\t'database' => '',",
      "\t'dbdriver' => 'mysqli',",
      ');',
      '',
    ].join('\n');
    await escribir(a.carpeta, 'application/config/database.php', db);
    await correr(a, 'config-bd-crear', {
      marco: 'codeigniter3',
      motor: 'mysql',
      base: 'diamantes',
    });
    const t = await leer(a.carpeta, 'application/config/database.php');
    expect(t).toContain("'hostname' => '127.0.0.1',");
    expect(t).toContain("'port' => 3306,");
    expect(t).toContain("'username' => 'root'");
    expect(t).toContain("'password' => 's3cr3t pa$$'");
    expect(t).toContain("'database' => 'diamantes'");
    expect(t).toContain("'dbdriver' => 'mysqli'");
  });

  it('un marco desconocido se rechaza', async () => {
    const a = await armar();
    await expect(correr(a, 'config-bd-crear', { marco: 'joomla' })).rejects.toThrow('args.marco');
  });
});

describe('pasos de base con instancia y .env.local', () => {
  it('bd-crear y pgvector-activar apuntan a la instancia pedida', async () => {
    const a = await armar();
    const objetivos: string[] = [];
    a.deps.bd.listar = async (o) => {
      objetivos.push(`listar:${o}`);
      return [];
    };
    await correr(a, 'bd-crear', { instancia: 'mariadb@11.4', base: 'tienda' });
    expect(objetivos).toEqual(['listar:mariadb@11.4']);
    expect(a.creadas[0]).toMatchObject({ motor: 'mariadb@11.4', nombre: 'tienda' });
    let vector: unknown[] = [];
    a.deps.bd.activarVector = async (...x) => void (vector = x);
    await correr(a, 'pgvector-activar', { instancia: 'postgresql@17', base: 'api' });
    expect(vector).toEqual(['api', 'postgresql@17']);
  });

  it('una instancia mal formada o que no es del motor se rechaza', async () => {
    const a = await armar();
    await expect(correr(a, 'bd-crear', { instancia: 'redis@7', base: 'x' })).rejects.toThrow(
      'no válida',
    );
    await expect(correr(a, 'bd-crear', { instancia: 'mysql@8.4;', base: 'x' })).rejects.toThrow(
      'no válida',
    );
    await expect(
      correr(a, 'bd-crear', { instancia: 'mysql@8.4', motor: 'postgresql', base: 'x' }),
    ).rejects.toThrow('no coinciden');
    expect(a.creadas).toEqual([]);
  });

  it('env-crear con destino .env.local escribe solo DATABASE_URL (esquema PHP) y no toca .env', async () => {
    const a = await armar({ sitio: { tipo: 'laravel' } });
    await escribir(a.carpeta, '.env', 'APP_ENV=local\n');
    const lineas = await correr(a, 'env-crear', {
      destino: '.env.local',
      motor: 'mysql',
      base: 'sf_app',
    });
    expect(await leer(a.carpeta, '.env')).toBe('APP_ENV=local\n');
    expect(await leer(a.carpeta, '.env.local')).toBe(
      "DATABASE_URL='mysql://root:s3cr3t%20pa%24%24@127.0.0.1:3306/sf_app'\n",
    );
    expect(lineas.join('\n')).not.toContain('s3cr3t');
    // Una segunda vez no la pisa.
    await correr(a, 'env-crear', { destino: '.env.local', motor: 'mysql', base: 'otra' });
    expect(await leer(a.carpeta, '.env.local')).toContain('sf_app');
  });

  it('env-crear con instancia pide la conexión de esa instancia', async () => {
    const a = await armar({ sitio: { tipo: 'fastapi', php: null } });
    const pedidas: string[] = [];
    a.deps.bd.conexion = async (o) => {
      pedidas.push(o);
      return { host: '127.0.0.1', puerto: 5433, usuario: 'postgres', clave: 'x' };
    };
    await correr(a, 'env-crear', { instancia: 'postgresql@16', base: 'api' });
    expect(pedidas).toEqual(['postgresql@16']);
    expect(await leer(a.carpeta, '.env')).toContain('127.0.0.1:5433/api');
  });
});

describe('bd-crear de un proyecto nuevo (nueva: true)', () => {
  it('crea la base, la pide sin IF NOT EXISTS y deja la marca base-creada', async () => {
    const a = await armar();
    await correr(a, 'bd-crear', { motor: 'mysql', base: 'tienda', nueva: true });
    expect(a.creadas[0]).toMatchObject({ nombre: 'tienda', opts: { nueva: true } });
    expect(marcasPaso).toEqual(['base-creada']);
  });

  it('si la creó este mismo proyecto antes (marca previa) sigue con ella sin base_existe', async () => {
    const a = await armar({ basesExistentes: ['tienda'] });
    marcasPrevias = ['base-creada'];
    await correr(a, 'bd-crear', { motor: 'mysql', base: 'tienda', nueva: true });
    expect(a.creadas).toEqual([]);
    expect(marcasPaso).toEqual(['base-creada']);
    // Sin la marca, una base con ese nombre es de otro: se rechaza.
    const b = await armar({ basesExistentes: ['tienda'] });
    await expect(
      correr(b, 'bd-crear', { motor: 'mysql', base: 'tienda', nueva: true }),
    ).rejects.toMatchObject({ codigo: 'proyectos.base_existe' });
  });

  it('sin nueva, una base que ya existe no se toca ni deja marca', async () => {
    const a = await armar({ basesExistentes: ['tienda'] });
    await correr(a, 'bd-crear', { motor: 'mysql', base: 'tienda' });
    expect(a.creadas).toEqual([]);
    expect(marcasPaso).toEqual([]);
  });

  it('con nueva, MiApp existente frente a miapp falla en MySQL y MariaDB (sin distinguir mayúsculas)', async () => {
    for (const motor of ['mysql', 'mariadb']) {
      const a = await armar({ basesExistentes: ['MiApp'] });
      await expect(
        correr(a, 'bd-crear', { motor, base: 'miapp', nueva: true }),
      ).rejects.toMatchObject({ codigo: 'proyectos.base_existe' });
      expect(a.creadas).toEqual([]);
      expect(marcasPaso).toEqual([]);
    }
  });

  it('en PostgreSQL los nombres distinguen mayúsculas', async () => {
    const a = await armar({ basesExistentes: ['MiApp'] });
    await correr(a, 'bd-crear', { motor: 'postgresql', base: 'miapp', nueva: true });
    expect(a.creadas).toHaveLength(1);
  });

  it('dos creaciones simultáneas: la segunda falla y solo la primera deja marca', async () => {
    const a = await armar();
    let hay = false;
    // El motor la crea sin IF NOT EXISTS: la segunda orden da base_existe aunque ambas la
    // vieran libre en la lista.
    a.deps.bd.crear = async () => {
      await new Promise((r) => setTimeout(r, 5));
      if (hay) throw new ErrorWolf('proyectos.base_existe', 'ya existe', { nombre: 'x' });
      hay = true;
      return { usuarioActualizado: false };
    };
    const marcas: string[][] = [];
    const uno = async (): Promise<void> => {
      await correr(a, 'bd-crear', { motor: 'mysql', base: 'tienda', nueva: true });
      marcas.push(marcasPaso);
    };
    const r = await Promise.allSettled([uno(), uno()]);
    expect(r.map((x) => x.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect((r.find((x) => x.status === 'rejected') as PromiseRejectedResult).reason).toMatchObject({
      codigo: 'proyectos.base_existe',
    });
  });

  it('Reinstalar no repite nueva ni los pasos de generador', async () => {
    const { ARGS_SIN_REPETIR, PASOS_SOLO_CREACION } = await import('../src/proyectos/recetas');
    expect(ARGS_SIN_REPETIR).toContain('nueva');
    expect(PASOS_SOLO_CREACION).toContain('crear-desde-composer');
  });
});

describe('config-bd-crear: reemplazo en una pasada y CodeIgniter 3', () => {
  const DB = [
    '<?php',
    "$db['default'] = array(",
    "\t'dsn'\t=> '',",
    "\t'hostname' => 'localhost',",
    "\t'username' => '',",
    "\t'password' => '',",
    "\t'database' => '',",
    "\t'dbdriver' => 'mysqli',",
    ');',
    '',
  ].join('\n');

  it("una clave que contiene 'database' => 1 no desvía ningún reemplazo", async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter3' } });
    a.deps.bd.conexion = async () => ({
      host: '127.0.0.1',
      puerto: 3306,
      usuario: 'root',
      clave: `x" , "database" => 1, 'database' => 'robada`,
    });
    await escribir(a.carpeta, 'application/config/database.php', DB);
    await correr(a, 'config-bd-crear', {
      marco: 'codeigniter3',
      motor: 'mysql',
      base: 'diamantes',
    });
    const t = await leer(a.carpeta, 'application/config/database.php');
    const lineas = t.split('\n').filter((l) => /^\s*'database'/.test(l));
    expect(lineas).toEqual(["\t'database' => 'diamantes',"]);
    expect(t).toContain("'dbdriver' => 'mysqli'");
    expect(t).toContain("\\'robada");
  });

  it('con comillas dobles y números en la plantilla también la reconoce', async () => {
    const { reemplazarClavesPhp } = await import('../src/proyectos/pasos/configBd');
    const t = reemplazarClavesPhp(
      '<?php\n  "database" => "x",\n  \'port\' => 1,\n',
      { database: "'d'", port: '3307' },
      (k) => new RegExp(`^(\\s*['"]${k}['"]\\s*=>\\s*)(?:'[^']*'|"[^"]*"|\\d+)`),
    );
    expect(t).toBe("<?php\n  \"database\" => 'd',\n  'port' => 3307,\n");
    expect(() =>
      reemplazarClavesPhp('<?php\n', { falta: "'x'" }, (k) => new RegExp(`^(${k})`)),
    ).toThrow('no trae');
  });

  it('con una conexión ya configurada exige sobrescribir y guarda una copia', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter3' } });
    const propia = DB.replace("'username' => ''", "'username' => 'mio'");
    await escribir(a.carpeta, 'application/config/database.php', propia);
    await expect(
      correr(a, 'config-bd-crear', { marco: 'codeigniter3', motor: 'mysql', base: 'x' }),
    ).rejects.toThrow('sobrescribirla');
    expect(await leer(a.carpeta, 'application/config/database.php')).toBe(propia);
    await correr(a, 'config-bd-crear', {
      marco: 'codeigniter3',
      motor: 'mysql',
      base: 'x',
      sobrescribir: true,
    });
    expect(await leer(a.carpeta, 'application/config/database.php')).toContain("'database' => 'x'");
    const copias = (await readdir(join(a.base, 'run'))).filter((n) => n.endsWith('.respaldo'));
    expect(copias).toHaveLength(1);
    expect(await readFile(join(a.base, 'run', copias[0]!), 'utf8')).toBe(propia);
  });

  it('pone base_url con el dominio https y el entorno en production, solo si son los originales', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter3', dominio: 'diamantes.test' } });
    await escribir(a.carpeta, 'application/config/database.php', DB);
    await escribir(
      a.carpeta,
      'application/config/config.php',
      "<?php\n$config['base_url'] = '';\n",
    );
    await escribir(
      a.carpeta,
      'index.php',
      "<?php\ndefine('ENVIRONMENT', isset($_SERVER['CI_ENV']) ? $_SERVER['CI_ENV'] : 'development');\n",
    );
    await correr(a, 'config-bd-crear', { marco: 'codeigniter3', motor: 'mysql', base: 'x' });
    expect(await leer(a.carpeta, 'application/config/config.php')).toContain(
      "$config['base_url'] = 'https://diamantes.test/';",
    );
    expect(await leer(a.carpeta, 'index.php')).toContain(": 'production');");
    // Un base_url que ya tiene valor no se toca.
    const b = await armar({ sitio: { tipo: 'codeigniter3' } });
    await escribir(b.carpeta, 'application/config/database.php', DB);
    await escribir(
      b.carpeta,
      'application/config/config.php',
      "<?php\n$config['base_url'] = 'http://mio/';\n",
    );
    await correr(b, 'config-bd-crear', { marco: 'codeigniter3', motor: 'mysql', base: 'x' });
    expect(await leer(b.carpeta, 'application/config/config.php')).toContain("'http://mio/'");
  });
});

describe('env-crear con args.valores (Laravel sin base)', () => {
  it('pone la sesión y la caché en archivos y rechaza variables peligrosas', async () => {
    const a = await armar({ sitio: { tipo: 'laravel' } });
    await escribir(
      a.carpeta,
      '.env.example',
      'APP_NAME=Laravel\nSESSION_DRIVER=database\nCACHE_STORE=database\nDB_CONNECTION=sqlite\n',
    );
    await correr(a, 'env-crear', {
      valores: { SESSION_DRIVER: 'file', CACHE_STORE: 'file', QUEUE_CONNECTION: 'sync' },
    });
    const t = await leer(a.carpeta, '.env');
    expect(t).toContain('SESSION_DRIVER=file');
    expect(t).toContain('CACHE_STORE=file');
    expect(t).toContain('QUEUE_CONNECTION=sync');
    expect(t).toContain('DB_CONNECTION=sqlite');
    const b = await armar({ sitio: { tipo: 'laravel' } });
    for (const valores of [{ DB_PASSWORD: 'x' }, { 'A B': 'x' }, { A: 'x\ny' }, ['x'], { A: 1 }]) {
      await expect(correr(b, 'env-crear', { valores })).rejects.toThrow();
    }
    await expect(readdir(b.carpeta)).resolves.toEqual([]);
  });
});

describe('CodeIgniter 3 sin base y ajustes del sitio', () => {
  const CONFIG = "<?php\n$config['base_url'] = '';\n$config['log_threshold'] = 0;\n";
  const INDEX =
    "<?php\ndefine('ENVIRONMENT', isset($_SERVER['CI_ENV']) ? $_SERVER['CI_ENV'] : 'development');\n";

  it('sinBd: no necesita database.php y aun así pone base_url, log_threshold y production', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter3', dominio: 'dollar.test' } });
    await escribir(a.carpeta, 'application/config/config.php', CONFIG);
    await escribir(a.carpeta, 'index.php', INDEX);
    await correr(a, 'config-bd-crear', { marco: 'codeigniter3', sinBd: true });
    const c = await leer(a.carpeta, 'application/config/config.php');
    expect(c).toContain("$config['base_url'] = 'https://dollar.test/';");
    expect(c).toContain("$config['log_threshold'] = 1;");
    expect(await leer(a.carpeta, 'index.php')).toContain(": 'production');");
    expect(a.llamadas).toEqual([]);
  });

  it('el esquema sale del sitio guardado, no de un argumento', async () => {
    const a = await armar({ sitio: { tipo: 'codeigniter3', dominio: 'dollar.test' } });
    a.deps.leerSitio = async () => ({ ...a.sitio, https: false });
    await escribir(a.carpeta, 'application/config/config.php', CONFIG);
    await correr(a, 'config-bd-crear', { marco: 'codeigniter3', sinBd: true, https: true });
    expect(await leer(a.carpeta, 'application/config/config.php')).toContain(
      "'http://dollar.test/'",
    );
  });
});

describe('huella publicada de WordPress (para la confirmación de la interfaz)', () => {
  const URL = 'https://wordpress.org/wordpress-7.1.5.zip';
  it('lee solo el .sha1 (no baja el zip) y devuelve el valor normalizado', async () => {
    const huella = 'AB'.repeat(20);
    const red = fetchFalso({
      [`${URL}.sha1`]: `${huella}  wordpress-7.1.5.zip
`,
    });
    expect(await leerHuellaWordpress(red.f, '7.1.5')).toBe(huella.toLowerCase());
    expect(red.pedidas).toEqual([`${URL}.sha1`]);
  });
  it('una versión rara no pide nada y una respuesta inválida da catalogo.huella_no_disponible', async () => {
    const red = fetchFalso({ [`${URL}.sha1`]: '<html>error</html>' });
    await expect(leerHuellaWordpress(red.f, '../x')).rejects.toThrow();
    expect(red.pedidas).toEqual([]);
    await expect(leerHuellaWordpress(red.f, '7.1.5')).rejects.toMatchObject({
      codigo: 'catalogo.huella_no_disponible',
    });
  });
  it('no sigue una redirección fuera de wordpress.org', async () => {
    const red = fetchFalso({ [`${URL}.sha1`]: { ir: 'https://evil.example/wp.sha1' } });
    await expect(leerHuellaWordpress(red.f, '7.1.5')).rejects.toThrow();
    expect(red.pedidas).toEqual([`${URL}.sha1`]);
  });
});

describe('pasos de plantilla de proyecto (D14)', () => {
  const conPlantillas = async (
    o: OpcionesArmado = {},
    esquemaDe: 'mysql' | 'postgresql' = 'mysql',
    origen: 'propia' | 'importada' = 'propia',
  ): Promise<{ a: Armado; copias: { id: string; destino: string }[] }> => {
    const a = await armar(o);
    const copias: { id: string; destino: string }[] = [];
    a.deps.restaurarEsquema = async (objetivo, archivo, base, opts) => {
      a.esquemas.push({ objetivo, archivo, base, origen: opts.origen });
      return { advertencias: [] };
    };
    a.deps.plantillas = {
      restaurarArchivos: async (id, destino) => {
        copias.push({ id, destino });
        return { archivos: 3 };
      },
      rutaEsquema: async () => ({ ruta: join(a.base, 'esquema.sql'), motor: esquemaDe, origen }),
    };
    a.registro = registrarPasosReales(new RegistroPasos(), a.deps);
    return { a, copias };
  };

  it('restaurar-plantilla-archivos copia a la carpeta vacía del proyecto', async () => {
    const { a, copias } = await conPlantillas();
    const lineas = await correr(a, 'restaurar-plantilla-archivos', { plantilla: 'mi-base-a1b2c3' });
    expect(copias).toEqual([{ id: 'mi-base-a1b2c3', destino: a.carpeta }]);
    expect(lineas.join('\n')).toMatch(/3 archivos/);
  });

  it('no copia sobre una carpeta con archivos y rechaza un id con ..', async () => {
    const { a, copias } = await conPlantillas();
    await escribir(a.carpeta, 'mio.txt', 'MIO');
    await expect(
      correr(a, 'restaurar-plantilla-archivos', { plantilla: 'mi-base-a1b2c3' }),
    ).rejects.toMatchObject({ codigo: 'proyectos.carpeta_no_vacia' });
    await rm(join(a.carpeta, 'mio.txt'));
    await expect(
      correr(a, 'restaurar-plantilla-archivos', { plantilla: '../../x' }),
    ).rejects.toMatchObject({ codigo: 'plantillas.id_invalido' });
    expect(copias).toEqual([]);
  });

  it('restaurar-esquema-plantilla restaura en la base nueva sin confirmar sobrescritura', async () => {
    const { a } = await conPlantillas();
    await correr(a, 'restaurar-esquema-plantilla', {
      plantilla: 'mi-base-a1b2c3',
      motor: 'mysql',
      base: 'tienda',
    });
    expect(a.esquemas).toEqual([
      { objetivo: 'mysql', archivo: join(a.base, 'esquema.sql'), base: 'tienda', origen: 'propia' },
    ]);
    expect(a.restauradas).toEqual([]);
  });

  it('nunca restaura el esquema sobre una base con tablas ni en otro motor', async () => {
    const { a } = await conPlantillas({ tablas: true });
    await expect(
      correr(a, 'restaurar-esquema-plantilla', {
        plantilla: 'mi-base-a1b2c3',
        motor: 'mysql',
        base: 'tienda',
      }),
    ).rejects.toMatchObject({ codigo: 'proyectos.base_existe' });
    const otro = await conPlantillas({}, 'postgresql');
    await expect(
      correr(otro.a, 'restaurar-esquema-plantilla', {
        plantilla: 'mi-base-a1b2c3',
        motor: 'mysql',
        base: 'tienda',
      }),
    ).rejects.toMatchObject({ codigo: 'proyectos.argumento_invalido' });
    expect(a.esquemas).toEqual([]);
    expect(otro.a.esquemas).toEqual([]);
  });

  it('el origen lo dice Plantillas: un arg origen=propia no lo cambia', async () => {
    const { a } = await conPlantillas({}, 'mysql', 'importada');
    await correr(a, 'restaurar-esquema-plantilla', {
      plantilla: 'mi-base-a1b2c3',
      motor: 'mysql',
      base: 'tienda',
      origen: 'propia',
    });
    expect(a.esquemas[0]!.origen).toBe('importada');
  });

  it('un wolfcore.yml no puede traer estos pasos', async () => {
    const { PASOS_SOLO_GENERADOR } = await import('../src/proyectos/config');
    expect(PASOS_SOLO_GENERADOR).toContain('restaurar-plantilla-archivos');
    expect(PASOS_SOLO_GENERADOR).toContain('restaurar-esquema-plantilla');
  });
});

describe('plantilla importada: sin scripts de terceros', () => {
  it('composer install con --no-scripts --no-plugins', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'composer.json', '{}');
    await correr(a, 'composer-install', { sinScripts: true });
    expect(a.llamadas[0]!.args).toEqual(expect.arrayContaining(['--no-scripts', '--no-plugins']));
    await correr(a, 'composer-install');
    expect(a.llamadas[1]!.args).not.toContain('--no-scripts');
  });

  it('npm con --ignore-scripts', async () => {
    const a = await armar();
    await escribir(a.carpeta, 'package.json', '{}');
    await correr(a, 'npm-ci', { sinScripts: true });
    expect(a.llamadas[0]!.args).toContain('--ignore-scripts');
  });

  it('pip solo con ruedas y un requirements.txt simple; pyproject.toml y opciones se rechazan', async () => {
    const a = await armar();
    await escribir(a.carpeta, join('.venv', 'Scripts', 'python.exe'), '');
    await escribir(a.carpeta, 'requirements.txt', 'fastapi==0.115.0\n');
    await correr(a, 'pip-install', { sinScripts: true });
    expect(a.llamadas[0]!.args).toEqual(
      expect.arrayContaining(['--only-binary=:all:', '-r', 'requirements.txt']),
    );
    await escribir(a.carpeta, 'requirements.txt', 'fastapi==0.115.0\n-e .\n');
    await expect(correr(a, 'pip-install', { sinScripts: true })).rejects.toThrow(
      /requisitos simples/,
    );
    await rm(join(a.carpeta, 'requirements.txt'));
    await escribir(a.carpeta, 'pyproject.toml', '[project]\nname="x"\n');
    await expect(correr(a, 'pip-install', { sinScripts: true })).rejects.toThrow(/pyproject/);
    expect(a.llamadas).toHaveLength(1);
  });
});

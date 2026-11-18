import { mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { lanzadorPorDefecto, matarArbol, rutaTaskkill } from '../src/plataforma/lanzar';
import type { Lanzador, OpcionesLanzar } from '../src/plataforma/tipos';
import { TIPOS_PASO, type PasoReceta, type TipoPaso } from '../src/proyectos/config';
import { RegistroPasos, type ContextoPaso } from '../src/proyectos/pasos';
import { registrarPasosReales, type DepsPasos } from '../src/proyectos/pasos/index';
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
    vectores,
    sitio,
    phpExe,
    phpIni,
    nodeDir,
    pythonDir,
  };
}

/** Corre un paso y devuelve sus líneas. */
async function correr(
  a: Armado,
  tipo: TipoPaso,
  args?: Record<string, unknown>,
  senal: AbortSignal = new AbortController().signal,
): Promise<string[]> {
  const lineas: string[] = [];
  const paso: PasoReceta = { id: tipo, tipo, titulo: tipo, ...(args ? { args } : {}) };
  const ctx: ContextoPaso = {
    sitio: a.sitio,
    paso,
    carpeta: a.sitio.carpeta,
    linea: (t) => lineas.push(t),
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
  it('guarda el sitio con tipo, PHP, dominio y HTTPS', async () => {
    const a = await armar({ sitio: { php: null } });
    await correr(a, 'sitio-crear', {
      tipo: 'laravel',
      dominio: 'tienda.test',
      php: '8.3',
      https: true,
    });
    expect(a.guardados).toHaveLength(1);
    const g = a.guardados[0]!;
    expect(g.id).toBe('tienda-test');
    expect(g.datos).toMatchObject({
      tipo: 'laravel',
      dominio: 'tienda.test',
      php: '8.3',
      https: true,
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

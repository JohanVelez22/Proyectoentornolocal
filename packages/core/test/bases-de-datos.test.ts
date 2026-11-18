import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BasesDeDatos, type MotorBd } from '../src/bd/basesDeDatos';
import { valorEnv } from '../src/bd/env';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import type { EstadoServicio } from '../src/tipos';

const CLAVE = 'ClaveSecreta123';
let base: string;
let sql: { motor: string; sql: string; params?: unknown[] }[];
let cierres: number;
let ejecuciones: { cmd: string; args: string[] }[];
let salidaMongo: { codigo: number; stdout: string; stderr: string };

const estado = (id: string, puerto: number, e: EstadoServicio['estado'] = 'encendido') =>
  ({ id, nombre: id, version: '1', estado: e, puertos: [puerto], pid: 1 }) as EstadoServicio;

function armar(estados: EstadoServicio[]): BasesDeDatos {
  const exec: Ejecutor = async (cmd, args) => {
    ejecuciones.push({ cmd, args });
    return salidaMongo;
  };
  const falsa = (motor: string) => async () => ({
    query: async (s: string, params?: unknown[]) => {
      sql.push({ motor, sql: s, params });
      return motor === 'pg' ? { rows: [] } : [[{ nombre: 'b', tam: 0, n: 0 }]];
    },
    end: async () => {
      cierres++;
    },
  });
  return new BasesDeDatos({
    servicios: { estados: async () => estados },
    credenciales: { leer: async () => ({ usuario: 'x', clave: CLAVE }) },
    rutas: new Rutas(base),
    exec,
    fabricas: { mysql: falsa('mysql') as never, postgres: falsa('pg') as never },
  });
}

const todos = (): EstadoServicio[] => [
  estado('mysql', 3306),
  estado('mariadb', 3307),
  estado('postgresql', 5432),
  estado('mongodb', 27017),
];

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'bdd-'));
  sql = [];
  cierres = 0;
  ejecuciones = [];
  salidaMongo = { codigo: 0, stdout: '[]', stderr: '' };
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

function instalarMongosh(): string {
  const dir = path.join(base, 'bin', 'mongosh', '2.3.0', 'bin');
  mkdirSync(dir, { recursive: true });
  const exe = path.join(dir, 'mongosh.exe');
  writeFileSync(exe, '');
  return exe;
}

describe('conexion', () => {
  it('da host, puerto, usuario y clave por motor', async () => {
    const b = armar(todos());
    expect(await b.conexion('mysql')).toEqual({
      host: '127.0.0.1',
      puerto: 3306,
      usuario: 'root',
      clave: CLAVE,
    });
    expect((await b.conexion('mariadb')).puerto).toBe(3307);
    expect((await b.conexion('postgresql')).usuario).toBe('postgres');
    expect((await b.conexion('mongodb')).clave).toBeNull();
  });
});

describe('servicio apagado', () => {
  it.each([
    ['mysql', 'MySQL'],
    ['mariadb', 'MariaDB'],
    ['postgresql', 'PostgreSQL'],
    ['mongodb', 'MongoDB'],
  ] as [MotorBd, string][])('%s: pide encenderlo', async (motor, nombre) => {
    const b = armar([estado(motor, 1, 'apagado')]);
    const msg = `Encienda ${nombre} para administrar sus bases`;
    await expect(b.listar(motor)).rejects.toThrow(msg);
    await expect(b.crear(motor, 'ok')).rejects.toThrow(msg);
    await expect(b.borrar(motor, 'ok', 'ok')).rejects.toThrow(msg);
    await expect(b.conexion(motor)).rejects.toThrow(msg);
  });

  it('un motor sin instalar también pide encenderlo', async () => {
    await expect(armar([]).listar('mysql')).rejects.toThrow('Encienda MySQL');
  });
});

describe('bloqueEnv', () => {
  it('Laravel con MySQL: texto exacto', async () => {
    const t = await armar(todos()).bloqueEnv('mysql', 'tienda', 'laravel');
    expect(t).toBe(
      [
        'DB_CONNECTION=mysql',
        'DB_HOST=127.0.0.1',
        'DB_PORT=3306',
        'DB_DATABASE=tienda',
        'DB_USERNAME=root',
        `DB_PASSWORD=${CLAVE}`,
        '',
      ].join('\n'),
    );
  });

  it('Laravel con MariaDB y PostgreSQL', async () => {
    const b = armar(todos());
    expect(await b.bloqueEnv('mariadb', 'a', 'laravel')).toContain('DB_CONNECTION=mariadb\n');
    const pg = await b.bloqueEnv('postgresql', 'a', 'laravel');
    expect(pg).toContain('DB_CONNECTION=pgsql\n');
    expect(pg).toContain('DB_PORT=5432\n');
    expect(pg).toContain('DB_USERNAME=postgres\n');
  });

  it('un proyecto genérico usa el formato de Laravel', async () => {
    const t = await armar(todos()).bloqueEnv('mysql', 'x', 'generico');
    expect(t.startsWith('DB_CONNECTION=mysql\n')).toBe(true);
  });

  it('CodeIgniter con database.default.* usa esas claves', async () => {
    const env = '# database.default.hostname = localhost\ndatabase.default.database = old\n';
    const t = await armar(todos()).bloqueEnv('mysql', 'tienda', 'codeigniter3', env);
    expect(t).toBe(
      [
        'database.default.hostname = 127.0.0.1',
        'database.default.database = tienda',
        'database.default.username = root',
        `database.default.password = ${CLAVE}`,
        'database.default.DBDriver = MySQLi',
        'database.default.port = 3306',
        '',
      ].join('\n'),
    );
    const pg = await armar(todos()).bloqueEnv('postgresql', 'p', 'codeigniter3', env);
    expect(pg).toContain('database.default.DBDriver = Postgre\n');
  });

  it('CodeIgniter con variables DB_ conserva esos nombres (sin DB_CONNECTION si no la usa)', async () => {
    const t = await armar(todos()).bloqueEnv('mysql', 'x', 'codeigniter3', 'DB_HOST=localhost\n');
    expect(t).not.toContain('DB_CONNECTION');
    expect(t).toContain('DB_HOST=127.0.0.1\n');
    const con = await armar(todos()).bloqueEnv(
      'mysql',
      'x',
      'codeigniter3',
      'DB_CONNECTION=mysql\n',
    );
    expect(con).toContain('DB_CONNECTION=mysql\n');
  });

  it('CodeIgniter sin variables de base usa el formato de Laravel', async () => {
    const t = await armar(todos()).bloqueEnv('mysql', 'x', 'codeigniter3', 'CI_ENVIRONMENT=dev\n');
    expect(t.startsWith('DB_CONNECTION=mysql\n')).toBe(true);
  });

  it('MongoDB: MONGODB_URI sin clave', async () => {
    expect(await armar(todos()).bloqueEnv('mongodb', 'logs', 'laravel')).toBe(
      'MONGODB_URI=mongodb://127.0.0.1:27017/logs\n',
    );
  });
});

describe('mysql, mariadb y postgresql', () => {
  it('listar ordena por nombre y no pierde la conexión', async () => {
    const b = armar(todos());
    expect(Array.isArray(await b.listar('mysql'))).toBe(true);
    await b.listar('postgresql');
    expect(sql.map((s) => s.motor)).toEqual(['mysql', 'pg']);
    expect(cierres).toBe(2);
  });

  it('borrar exige que la confirmación sea el nombre y no ejecuta nada si no', async () => {
    const b = armar(todos());
    await expect(b.borrar('mysql', 'tienda', 'otra')).rejects.toThrow(/escriba su nombre/);
    expect(sql).toEqual([]);
    await b.borrar('mysql', 'tienda', 'tienda');
    expect(sql.at(-1)!.sql).toBe('DROP DATABASE `tienda`');
    await b.borrar('postgresql', 'tienda', 'tienda');
    expect(sql.at(-1)!.sql).toBe('DROP DATABASE "tienda"');
  });

  it('crear delega en el cliente (que valida el nombre y protege el sistema)', async () => {
    const b = armar(todos());
    await b.crear('mysql', 'nueva');
    expect(sql.some((s) => s.sql.startsWith('CREATE DATABASE'))).toBe(true);
    await expect(b.crear('mysql', 'mysql')).rejects.toThrow(/base del sistema/);
    await expect(b.crear('postgresql', 'Mala-Base')).rejects.toThrow(/no es válido/);
  });
});

describe('valores del .env', () => {
  const RARA = 'p#a ss"x$y';
  const con = (clave: string) =>
    new BasesDeDatos({
      servicios: { estados: async () => todos() },
      credenciales: { leer: async () => ({ usuario: 'x', clave }) },
      rutas: new Rutas(base),
      exec: async () => salidaMongo,
    });

  it('prefiere comillas simples (literales) si el valor no tiene comilla simple', async () => {
    const t = await con(RARA).bloqueEnv('mysql', 'tienda', 'laravel');
    expect(t).toContain(`DB_PASSWORD='p#a ss"x$y'\n`);
    expect(t).toContain('DB_DATABASE=tienda\n');
    const ci = await con(RARA).bloqueEnv(
      'mysql',
      'tienda',
      'codeigniter3',
      'database.default.port = 1\n',
    );
    expect(ci).toContain(`database.default.password = 'p#a ss"x$y'\n`);
  });

  it('una ruta de Windows va entre comillas simples, sin escapes (phpdotenv)', () => {
    expect(valorEnv('C:\\Program Files\\nodejs\\npm.cmd')).toBe(
      "'C:\\Program Files\\nodejs\\npm.cmd'",
    );
  });

  it('con comilla simple usa dobles escapadas según el lector', () => {
    const v = `a\\b"c'd$e#f g=h`;
    expect(valorEnv(v)).toBe(`"a\\\\b\\"c'd\\$e#f g=h"`);
    expect(valorEnv(v, 'ci4')).toBe(`"a\\\\b\\"c'd$e#f g=h"`);
    expect(valorEnv(v, 'literal')).toBe(`"a\\b"c'd$e#f g=h"`);
    expect(valorEnv("O'Brien")).toBe(`"O'Brien"`);
  });

  it('CodeIgniter 4 duplica las barras también entre comillas simples', () => {
    expect(valorEnv('C:\\x y', 'ci4')).toBe("'C:\\\\x y'");
  });

  it('CodeIgniter 4 rechaza ${…} (lo expandiría aunque vaya entre comillas)', () => {
    expect(() => valorEnv('clave${APP_NAME}', 'ci4')).toThrow(/CodeIgniter 4/);
    expect(() => valorEnv("a'${X.y}", 'ci4')).toThrow(/CodeIgniter 4/);
    // Un $ suelto o en otros lectores no es problema.
    expect(valorEnv('$HOME y $', 'ci4')).toBe("'$HOME y $'");
    expect(valorEnv('clave${APP_NAME}')).toBe("'clave${APP_NAME}'");
  });

  it('CodeIgniter 3 (lector propio) no escapa y rechaza comillas en los extremos', async () => {
    const env = 'DB_HOST=localhost\n';
    const t = await con('a\\b c$').bloqueEnv('mysql', 'x', 'codeigniter3', env);
    expect(t).toContain(`DB_PASSWORD='a\\b c$'\n`);
    const dobles = await con(`a'b\\c`).bloqueEnv('mysql', 'x', 'codeigniter3', env);
    expect(dobles).toContain(`DB_PASSWORD="a'b\\c"\n`);
    await expect(con(`"abc`).bloqueEnv('mysql', 'x', 'codeigniter3', env)).rejects.toThrow(
      /empieza o termina con comillas/,
    );
    // En Laravel el mismo valor sí se puede escribir.
    expect(await con(`"abc`).bloqueEnv('mysql', 'x', 'laravel')).toContain(`DB_PASSWORD='"abc'\n`);
  });

  it('rechaza saltos de línea en base, usuario o clave', async () => {
    await expect(con('a\nDB_HOST=evil').bloqueEnv('mysql', 'x', 'laravel')).rejects.toThrow(
      'Valor no válido para .env',
    );
    await expect(con('a\rb').bloqueEnv('mysql', 'x', 'laravel')).rejects.toThrow(
      'Valor no válido para .env',
    );
    await expect(con('ok').bloqueEnv('mysql', 'x\ny', 'laravel')).rejects.toThrow(
      'Valor no válido para .env',
    );
  });
});

describe('MongoDB', () => {
  it('sin mongosh instalado explica qué falta', async () => {
    await expect(armar(todos()).listar('mongodb')).rejects.toThrow(/Falta mongosh/);
  });

  it('listar usa mongosh, oculta las bases del sistema y ordena', async () => {
    const exe = instalarMongosh();
    salidaMongo = {
      codigo: 0,
      stdout: JSON.stringify([
        { nombre: 'zeta', tamanoBytes: 10 },
        { nombre: 'admin', tamanoBytes: 5 },
        { nombre: 'alfa', tamanoBytes: 20 },
        { nombre: 'local', tamanoBytes: 1 },
        { nombre: 'config', tamanoBytes: 1 },
      ]),
      stderr: '',
    };
    const r = await armar(todos()).listar('mongodb');
    expect(r).toEqual([
      { nombre: 'alfa', tamanoBytes: 20 },
      { nombre: 'zeta', tamanoBytes: 10 },
    ]);
    expect(ejecuciones[0]!.cmd).toBe(exe);
    expect(ejecuciones[0]!.args).toEqual(expect.arrayContaining(['--port', '27017', '--quiet']));
  });

  it('una respuesta no JSON, un banner o algo que no es lista se rechaza', async () => {
    instalarMongosh();
    for (const stdout of ['Current Mongosh Log ID: abc\n', '{"nombre":"a"}', 'null']) {
      salidaMongo = { codigo: 0, stdout, stderr: '' };
      await expect(armar(todos()).listar('mongodb')).rejects.toThrow(/no se entiende/);
    }
  });

  it('listar descarta entradas sin nombre', async () => {
    instalarMongosh();
    salidaMongo = {
      codigo: 0,
      stdout: JSON.stringify([
        { nombre: '', tamanoBytes: 1 },
        null,
        { tamanoBytes: 2 },
        { nombre: 'ok' },
      ]),
      stderr: '',
    };
    expect(await armar(todos()).listar('mongodb')).toEqual([{ nombre: 'ok', tamanoBytes: 0 }]);
  });

  it('crear y borrar arman el JS solo con nombres validados', async () => {
    instalarMongosh();
    const b = armar(todos());
    await b.crear('mongodb', 'mi-base_1');
    expect(ejecuciones[0]!.args.at(-1)).toContain("getSiblingDB('mi-base_1').createCollection");
    await b.borrar('mongodb', 'mi-base_1', 'mi-base_1');
    expect(ejecuciones[1]!.args.at(-1)).toContain("getSiblingDB('mi-base_1').dropDatabase()");
    const antes = ejecuciones.length;
    for (const malo of ["x');db.dropDatabase();('", 'a b', '', 'x'.repeat(64)]) {
      await expect(b.crear('mongodb', malo)).rejects.toThrow(/no es válido/);
      await expect(b.borrar('mongodb', malo, malo)).rejects.toThrow(/no es válido/);
    }
    for (const sis of ['admin', 'local', 'config']) {
      await expect(b.crear('mongodb', sis)).rejects.toThrow(/base del sistema/);
      await expect(b.borrar('mongodb', sis, sis)).rejects.toThrow(/base del sistema/);
    }
    expect(ejecuciones.length).toBe(antes);
  });

  it('un fallo de mongosh no filtra su salida', async () => {
    instalarMongosh();
    salidaMongo = { codigo: 1, stdout: '', stderr: 'detalle interno MongoServerError' };
    await expect(armar(todos()).crear('mongodb', 'ok')).rejects.toThrow(
      'MongoDB rechazó la operación.',
    );
  });
});

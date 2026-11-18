import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { createGunzip, crc32, deflateRawSync, gzipSync } from 'node:zlib';
import { beforeEach, describe, expect, it } from 'vitest';
import { detectarFormato } from '../src/bd/formato';
import {
  encadenar,
  mariadbConSandbox,
  psqlConRestrict,
  Respaldos,
  type DepsRespaldos,
} from '../src/bd/respaldos';
import type { MotorBd } from '../src/bd/env';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { lanzadorPorDefecto } from '../src/plataforma/lanzar';
import type { Ejecutor, Lanzador } from '../src/plataforma/tipos';
import { PlataformaWindows } from '../src/plataforma/win';
import { Rutas } from '../src/rutas';
import type { EstadoServicio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const CLAVE = 'ClaveLocal#987';
const CLAVE_ORIGEN = 'ClaveOrigen$123';
const PGDMP = Buffer.concat([Buffer.from('PGDMP'), Buffer.from([1, 16, 0, 4, 8, 1, 1, 1])]);
const TAR = path.win32.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');

/** Zip mínimo (deflate) para los fixtures. */
function zip(archivos: Record<string, Buffer | string>): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const n = Buffer.from(nombre);
    const d = Buffer.isBuffer(contenido) ? contenido : Buffer.from(contenido);
    const c0 = deflateRawSync(d);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0);
    l.writeUInt16LE(20, 4);
    l.writeUInt16LE(8, 8);
    l.writeUInt32LE(crc32(d), 14);
    l.writeUInt32LE(c0.length, 18);
    l.writeUInt32LE(d.length, 22);
    l.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(8, 10);
    c.writeUInt32LE(crc32(d), 16);
    c.writeUInt32LE(c0.length, 20);
    c.writeUInt32LE(d.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    locales.push(l, n, c0);
    centrales.push(c, n);
    offset += 30 + n.length + c0.length;
  }
  const cd = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  const total = Object.keys(archivos).length;
  fin.writeUInt16LE(total, 8);
  fin.writeUInt16LE(total, 10);
  fin.writeUInt32LE(cd.length, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, cd, fin]);
}

async function leerTodo(s: Readable): Promise<Buffer> {
  const partes: Buffer[] = [];
  for await (const p of s) partes.push(Buffer.from(p as Buffer));
  return Buffer.concat(partes);
}

interface Lanzado {
  cmd: string;
  args: string[];
  env: Record<string, string>;
  /** Clave del `
estrict` que abría la entrada (se quita de `entrada`). */
  restrict: string | null;
  entrada: string | null;
  /** Lo que había en el archivo pasado por -f / último argumento al momento de lanzar. */
  archivo: Buffer | null;
}

let dir: string;
let rutas: Rutas;
let lanzados: Lanzado[];
let ejecutados: { cmd: string; args: string[]; env?: Record<string, string> }[];
let creadas: { motor: MotorBd; base: string }[];
let conTablas: boolean;
/** Dueño que devuelve el PostgreSQL local falso (null: la base no existe). */
let duenoLocal: string | null;
let respuestaLanzar: (l: Lanzado) => { codigo: number; lineas?: string[] };
let respuestaTar: (args: string[]) => { codigo: number };
let documentos: string;
let consultasOrigen: string[];
let consultasLocal: string[];
let orden: string[];
let secuenciaTablas: boolean[];
let versionOrigen: string;
let versionPsql: string;
let progreso: EventosNucleo['bd:progreso'][];
let reloj: number;

const estado = (id: string, version: string, puerto: number): EstadoServicio =>
  ({ id, nombre: id, version, estado: 'encendido', puertos: [puerto], pid: 1 }) as EstadoServicio;

function exes(): void {
  const crear = (rel: string): void => {
    const p = path.join(rutas.base, rel);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, '');
  };
  for (const n of ['mysql.exe', 'mysqldump.exe']) crear(`bin/mysql/8.4.3/bin/${n}`);
  for (const n of ['mariadb.exe', 'mariadb-dump.exe']) crear(`bin/mariadb/11.4.4/bin/${n}`);
  for (const n of ['psql.exe', 'pg_dump.exe', 'pg_restore.exe'])
    crear(`bin/postgresql/17.2/pgsql/bin/${n}`);
}

function armar(extra: Partial<DepsRespaldos> = {}): Respaldos {
  const eventos = new Eventos<EventosNucleo>();
  eventos.on('bd:progreso', (p) => progreso.push(p));
  const exec: Ejecutor = async (cmd, args, opts) => {
    ejecutados.push({ cmd, args, env: opts?.env });
    if (cmd.toLowerCase().endsWith('tar.exe'))
      return { ...respuestaTar(args), stdout: '', stderr: 'tar: error' };
    if (args.includes('--version')) {
      const b = path.basename(cmd);
      const salida =
        b.startsWith('pg_') || b.startsWith('psql')
          ? `${b.replace('.exe', '')} (PostgreSQL) ${versionPsql}`
          : b.startsWith('mariadb')
            ? 'mariadb-dump from 11.4.4-MariaDB, client 10.19 for Win64 (AMD64)'
            : 'mysqldump  Ver 8.4.3 for Win64 on x86_64 (MySQL Community Server - GPL)';
      return { codigo: 0, stdout: salida, stderr: '' };
    }
    return { codigo: 0, stdout: '', stderr: '' };
  };
  const lanzar: Lanzador = async (cmd, args, opts) => {
    let entrada = opts?.entrada
      ? (await leerTodo(opts.entrada as Readable)).toString('utf8')
      : null;
    const m = entrada ? /^\\restrict ([^\n]*)\n/.exec(entrada) : null;
    if (m) entrada = entrada!.slice(m[0].length);
    const f = args.indexOf('-f');
    const ruta = f >= 0 ? args[f + 1] : args.at(-1);
    const archivo = ruta && ruta !== '-' && existsSync(ruta) ? readFileSync(ruta) : null;
    const l: Lanzado = {
      cmd,
      args,
      env: opts?.env ?? {},
      entrada,
      archivo,
      restrict: m ? m[1]! : null,
    };
    lanzados.push(l);
    orden.push(path.basename(cmd));
    const r = respuestaLanzar(l);
    for (const linea of r.lineas ?? []) opts?.alLinea?.(linea, 'stderr');
    return { codigo: r.codigo };
  };
  const LOCALES = [5432, 3306, 3307];
  const fabricaOrigen = (tipo: 'mysql' | 'pg') => async (c: { puerto: number }) => ({
    query: async (s: string) => {
      if (LOCALES.includes(c.puerto)) {
        consultasLocal.push(s);
        orden.push(`sql: ${s}`);
        const filas = s.startsWith('SELECT version()')
          ? [{ version: 'PostgreSQL 17.2' }]
          : s.includes('pg_get_userbyid(datdba)')
            ? duenoLocal === null
              ? []
              : [{ dueno: duenoLocal }]
            : s.startsWith('SELECT format(')
              ? [{ s: `ORDEN(${s.includes('ALTER DATABASE') ? 'base' : 'objetos'})` }]
              : [];
        return tipo === 'pg' ? { rows: filas } : [filas];
      }
      consultasOrigen.push(s);
      const filas = [{ v: versionOrigen, version: versionOrigen }];
      return tipo === 'pg' ? { rows: filas } : [filas];
    },
    end: async () => undefined,
  });
  const deps: DepsRespaldos = {
    bd: {
      conexion: async (motor: MotorBd) => ({
        host: '127.0.0.1' as const,
        puerto: motor === 'postgresql' ? 5432 : motor === 'mariadb' ? 3307 : 3306,
        usuario: motor === 'postgresql' ? 'postgres' : 'root',
        clave: CLAVE,
      }),
      crear: async (motor: MotorBd, base: string) => {
        creadas.push({ motor, base });
        orden.push('crear');
        return { usuarioActualizado: false };
      },
      tieneTablas: async () => secuenciaTablas.shift() ?? conTablas,
    },
    servicios: {
      estados: async () => [
        estado('mysql', '8.4.3', 3306),
        estado('mariadb', '11.4.4', 3307),
        estado('postgresql', '17.2', 5432),
      ],
    },
    rutas,
    exec,
    lanzar,
    eventos,
    plataforma: { carpetaDocumentos: async () => documentos },
    fabricas: { mysql: fabricaOrigen('mysql') as never, postgres: fabricaOrigen('pg') as never },
    reloj: () => new Date(reloj),
    rutaTar: TAR,
    ...extra,
  };
  return new Respaldos(deps);
}

/** Simula pg_dump/mysqldump: escribe el archivo de salida indicado en args. */
function volcadoFalso(l: Lanzado): void {
  const f = l.args.indexOf('-f');
  const r = l.args.find((a) => a.startsWith('--result-file='));
  const destino = f >= 0 ? l.args[f + 1]! : r!.slice('--result-file='.length);
  writeFileSync(
    destino,
    l.cmd.includes('pg_dump') ? PGDMP : '-- MySQL dump\nCREATE TABLE t (id int);\n',
  );
}

beforeEach(async () => {
  dir = await carpetaTemporal('pel-resp-');
  rutas = new Rutas(path.join(dir, 'base'));
  exes();
  documentos = path.join(dir, 'Documentos');
  lanzados = [];
  ejecutados = [];
  creadas = [];
  conTablas = false;
  duenoLocal = null;
  respuestaLanzar = (l) => {
    if (l.cmd.includes('dump')) volcadoFalso(l);
    return { codigo: 0 };
  };
  respuestaTar = () => ({ codigo: 0 });
  consultasOrigen = [];
  consultasLocal = [];
  orden = [];
  secuenciaTablas = [];
  versionOrigen = '17.2';
  versionPsql = '17.12';
  progreso = [];
  reloj = Date.UTC(2026, 10, 18, 14, 30);
});

function fixture(nombre: string, contenido: Buffer | string): string {
  const p = path.join(dir, nombre);
  writeFileSync(p, contenido);
  return p;
}

const sinClaves = (l: Lanzado): void => {
  for (const a of l.args) {
    expect(a).not.toContain(CLAVE);
    expect(a).not.toContain(CLAVE_ORIGEN);
  }
};

describe('detectarFormato', () => {
  it('detecta por bytes mágicos y no por extensión', async () => {
    expect(await detectarFormato(fixture('plano.sql', 'CREATE TABLE t (id int);\n'))).toBe('sql');
    expect(await detectarFormato(fixture('diamantes.sql', PGDMP))).toBe('pgdump');
    expect(await detectarFormato(fixture('a.sql.gz', gzipSync('SELECT 1;')))).toBe('gz');
    expect(await detectarFormato(fixture('a.zip', zip({ 'a.sql': 'SELECT 1;' })))).toBe('zip');
    expect(
      await detectarFormato(fixture('a.rar', Buffer.from('Rar!\x1a\x07\x01\x00', 'latin1'))),
    ).toBe('rar');
    expect(
      await detectarFormato(
        fixture('a.7z', Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c, 0, 4])),
      ),
    ).toBe('7z');
    expect(await detectarFormato(fixture('raro.sql', Buffer.from([0, 1, 2, 3, 0, 0, 9])))).toBe(
      'desconocido',
    );
    expect(await detectarFormato(fixture('vacio.sql', ''))).toBe('desconocido');
    // mysqldump redirigido en PowerShell 5.1 queda en UTF-16LE con BOM.
    const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('SELECT 1;\n', 'utf16le')]);
    expect(await detectarFormato(fixture('ps.sql', utf16))).toBe('sql');
  });
});

describe('restaurar', () => {
  it('rechaza una base con tablas sin confirmación y no ejecuta nada', async () => {
    conTablas = true;
    const r = armar();
    await expect(r.restaurar('postgresql', fixture('d.sql', PGDMP), 'diamantes')).rejects.toThrow(
      'La base diamantes ya tiene tablas',
    );
    expect(lanzados).toEqual([]);
    expect(ejecutados).toEqual([]);
    expect(creadas).toEqual([]);
  });

  it('pg_dump custom (aunque se llame .sql) va a pg_restore sin dueño ni privilegios', async () => {
    const archivo = fixture('diamantes.sql', PGDMP);
    const res = await armar().restaurar('postgresql', archivo, 'diamantes');
    expect(res).toEqual({ advertencias: [] });
    expect(creadas).toEqual([{ motor: 'postgresql', base: 'diamantes' }]);
    const l = lanzados[0]!;
    expect(l.cmd).toBe(
      path.join(rutas.bin('postgresql', '17.2'), 'pgsql', 'bin', 'pg_restore.exe'),
    );
    expect(l.args).toEqual([
      '--no-owner',
      '--no-privileges',
      '--verbose',
      '--no-password',
      '-h',
      '127.0.0.1',
      '-p',
      '5432',
      '-U',
      'postgres',
      '-d',
      'diamantes',
      archivo,
    ]);
    expect(l.env.PGPASSWORD).toBe(CLAVE);
    sinClaves(l);
  });

  it('sobrescribir confirmado: respaldo previo, borra y crea la base, y luego restaura', async () => {
    conTablas = true;
    reloj = new Date(2026, 10, 18, 9, 5).getTime();
    const r = await armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes', {
      confirmarSobrescribir: true,
    });
    const previo = path.join(
      documentos,
      'WolfCore Dev',
      'Respaldos',
      'diamantes-antes-de-sobrescribir-20261118-0905.dump',
    );
    expect(r).toEqual({ advertencias: [], respaldoPrevio: previo });
    expect(existsSync(previo)).toBe(true);
    expect(orden).toEqual([
      'pg_dump.exe',
      expect.stringMatching(/^sql: SELECT pg_get_userbyid\(datdba\)/),
      expect.stringMatching(/^sql: SELECT pg_terminate_backend\(pid\).*pid <> pg_backend_pid\(\)/),
      'sql: SELECT version() AS version',
      'sql: DROP DATABASE "diamantes" WITH (FORCE)',
      'crear',
      'pg_restore.exe',
    ]);
    expect(lanzados[0]!.args.at(-1)).toBe('diamantes');
    expect(lanzados[1]!.args).not.toContain('--clean');
    for (const l of lanzados) sinClaves(l);
  });

  it('PostgreSQL: sobrescribir conserva el dueño original y le devuelve los objetos restaurados', async () => {
    conTablas = true;
    duenoLocal = 'app_tienda';
    await armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes', {
      confirmarSobrescribir: true,
    });
    const i = orden.indexOf('pg_restore.exe');
    expect(
      orden.indexOf(
        'sql: SELECT pg_get_userbyid(datdba) AS dueno FROM pg_database WHERE datname = $1',
      ),
    ).toBeLessThan(orden.indexOf('sql: DROP DATABASE "diamantes" WITH (FORCE)'));
    expect(orden.slice(i + 1)).toEqual([
      expect.stringMatching(/^sql: SELECT format\('ALTER DATABASE "diamantes" OWNER TO %I'/),
      'sql: ORDEN(base)',
      'sql: SELECT format($1, $2::text) AS s',
      'sql: ORDEN(objetos)',
    ]);
  });

  it('PostgreSQL: restaurar en una base vacía de un usuario le devuelve los objetos', async () => {
    duenoLocal = 'app_tienda';
    await armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes');
    expect(orden.slice(orden.indexOf('pg_restore.exe') + 1)).toContain('sql: ORDEN(objetos)');
  });

  it('PostgreSQL: si el dueño ya es el superusuario o no hay base, no reasigna nada', async () => {
    duenoLocal = 'postgres';
    await armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes');
    duenoLocal = null;
    await armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes');
    expect(orden.filter((o) => o.includes('format('))).toEqual([]);
  });

  it('PostgreSQL: si la restauración falla tras reemplazar, igual devuelve la base a su dueño', async () => {
    conTablas = true;
    duenoLocal = 'app_tienda';
    respuestaLanzar = (l) => {
      if (l.cmd.includes('pg_dump')) {
        volcadoFalso(l);
        return { codigo: 0 };
      }
      return { codigo: 2, lineas: ['pg_restore: error: algo'] };
    };
    await expect(
      armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes', {
        confirmarSobrescribir: true,
      }),
    ).rejects.toThrow(/La base original se reemplazó/);
    expect(orden.slice(orden.indexOf('pg_restore.exe') + 1)).toContain('sql: ORDEN(base)');
  });

  it('en MySQL sobrescribir también borra y crea la base', async () => {
    conTablas = true;
    const r = await armar().restaurar('mysql', fixture('m.sql', 'SELECT 1;\n'), 'tienda', {
      confirmarSobrescribir: true,
    });
    expect(path.basename(r.respaldoPrevio!)).toMatch(
      /^tienda-antes-de-sobrescribir-\d{8}-\d{4}\.sql$/,
    );
    expect(orden).toEqual(['mysqldump.exe', 'sql: DROP DATABASE `tienda`', 'crear', 'mysql.exe']);
  });

  it('si el respaldo previo falla, no borra ni restaura nada', async () => {
    conTablas = true;
    respuestaLanzar = () => ({ codigo: 1, lineas: ['pg_dump: error: disco lleno'] });
    await expect(
      armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes', {
        confirmarSobrescribir: true,
      }),
    ).rejects.toThrow(/respaldo previo y no se tocó nada/);
    expect(orden).toEqual(['pg_dump.exe']);
    expect(consultasLocal).toEqual([]);
    expect(creadas).toEqual([]);
    expect(readdirSync(path.join(documentos, 'WolfCore Dev', 'Respaldos'))).toEqual([]);
  });

  it('si aparecen tablas mientras se prepara el archivo, se detiene', async () => {
    secuenciaTablas = [false, true];
    await expect(
      armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes'),
    ).rejects.toThrow('La base diamantes ya tiene tablas');
    expect(lanzados).toEqual([]);
    expect(creadas).toEqual([]);
  });

  it('el filtro solo deja pasar lo que está seguro dentro de textos o cuerpos $$', async () => {
    const sql =
      "INSERT INTO t VALUES ('linea 1\nDROP DATABASE x;\nUSE otra;');\n" +
      'CREATE FUNCTION f() RETURNS void AS $cuerpo$\nDROP DATABASE y;\n$cuerpo$ LANGUAGE sql;\n' +
      'SELECT 1\nDROP DATABASE z;\n' +
      '\\set x 1\nDROP DATABASE w;\n';
    await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
    // Fuera de un texto se filtra aunque no sea inicio de sentencia (a prueba de fallos).
    expect(lanzados[0]!.entrada).toBe(
      sql
        .replace('DROP DATABASE z;', '-- DROP DATABASE z;')
        .replace('DROP DATABASE w;', '-- DROP DATABASE w;'),
    );
  });

  it('el filtro de MySQL sigue DELIMITER', async () => {
    const sql =
      "INSERT INTO t VALUES ('O''Brien'),('x');\n" +
      'DELIMITER ;;\nCREATE PROCEDURE p() BEGIN SELECT 1; END;;\nUSE otra3;\n';
    await armar().restaurar('mysql', fixture('m.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(sql.replace('USE otra3;', '-- USE otra3;'));
  });

  // --- Filtro: una lectura fiable por motor (ronda 4) ---

  const NO_NEUTRALIZABLE =
    'El respaldo contiene instrucciones de cambio de base que no se pueden neutralizar con seguridad; no se restauró.';

  it.each([
    ["MySQL: 'O\\'Brien' y '\\r '", "INSERT INTO t VALUES ('O\\'Brien','x\\r y');\n"],
    ["MySQL: 'O\\'Brien' y '\\u '", "INSERT INTO t VALUES ('O\\'Brien','x\\u y');\n"],
    [
      'MySQL: \\u dentro de una sentencia (--binary-mode lo manda al servidor)',
      'SELECT 1\n\\u other\n;\n',
    ],
  ])('MySQL deja intactos los datos (%s)', async (_n, sql) => {
    const r = await armar().restaurar('mysql', fixture('m.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(sql);
    expect(lanzados[0]!.args).toContain('--binary-mode');
    expect(r.advertencias).toEqual([]);
  });

  it('MariaDB: el aviso de --ssl-verify-server-cert del cliente no es una advertencia', async () => {
    respuestaLanzar = () => ({
      codigo: 0,
      lineas: [
        'WARNING: option --ssl-verify-server-cert is disabled, because of an insecure passwordless login.',
      ],
    });
    const r = await armar().restaurar('mariadb', fixture('m.sql', 'SELECT 1;\n'), 'tienda');
    expect(r.advertencias).toEqual([]);
  });

  it("MySQL: tras 'O\\'Brien', un USE posterior se comenta sin abortar", async () => {
    const datos = "INSERT INTO t VALUES ('O\\'Brien'),('x');\nINSERT INTO t VALUES (2);\n";
    const r = await armar().restaurar('mysql', fixture('m.sql', `${datos}USE otra;\n`), 'tienda');
    expect(lanzados[0]!.entrada).toBe(`${datos}-- USE otra;\n`);
    expect(r.advertencias.join('\n')).toContain('USE otra;');
  });

  it("MySQL: mysqldump con datos O\\'Brien y --routines restaura y comenta los ALTER DATABASE", async () => {
    const sql =
      '-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)\n' +
      '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n' +
      "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;\n" +
      'DROP TABLE IF EXISTS `clientes`;\n' +
      'CREATE TABLE `clientes` (\n  `id` int NOT NULL,\n  `nombre` varchar(80) DEFAULT NULL\n) ENGINE=InnoDB;\n' +
      'LOCK TABLES `clientes` WRITE;\n' +
      "INSERT INTO `clientes` VALUES (1,'O\\'Brien'),(2,'C:\\\\ruta\\\\'),(3,'dice \\\"hola\\\"');\n" +
      'UNLOCK TABLES;\n' +
      '/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;\n' +
      "/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES' */ ;\n" +
      'DELIMITER ;;\n' +
      '/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `t1` BEFORE INSERT ON `clientes` FOR EACH ROW BEGIN\n' +
      "  SET NEW.nombre = CONCAT(NEW.nombre, '\\'');\n" +
      'END */;;\n' +
      'DELIMITER ;\n' +
      '/*!50003 SET sql_mode              = @saved_sql_mode */ ;\n' +
      'ALTER DATABASE `tienda` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;\n' +
      'DELIMITER ;;\n' +
      "CREATE DEFINER=`root`@`localhost` PROCEDURE `p`()\nBEGIN\n  SELECT 'it\\'s';\nEND ;;\n" +
      'DELIMITER ;\n' +
      'ALTER DATABASE `tienda` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;\n' +
      '/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;\n';
    const r = await armar().restaurar('mysql', fixture('m.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(
      sql
        .replace(
          'ALTER DATABASE `tienda` CHARACTER SET latin1',
          '-- ALTER DATABASE `tienda` CHARACTER SET latin1',
        )
        .replace(
          'ALTER DATABASE `tienda` CHARACTER SET utf8mb4',
          '-- ALTER DATABASE `tienda` CHARACTER SET utf8mb4',
        ),
    );
    expect(r.advertencias).toHaveLength(2);
  });

  it.each([
    [
      'NO_BACKSLASH_ESCAPES declarado',
      "SET sql_mode='NO_BACKSLASH_ESCAPES';\nSELECT 'a\\';\nUSE other;\n",
      true,
    ],
    [
      'sin NO_BACKSLASH_ESCAPES el USE cae dentro del texto',
      "INSERT INTO t VALUES ('a\\';\nUSE other;\n');\n",
      false,
    ],
    [
      'un sql_mode no literal desconocido mantiene el modo anterior',
      "SET sql_mode='NO_BACKSLASH_ESCAPES';\nSET sql_mode=@desconocida;\nSELECT 'a\\';\nUSE other;\n",
      true,
    ],
    [
      'SET sql_mode = @saved_sql_mode vuelve al modo guardado',
      "/*!50003 SET @saved_sql_mode = @@sql_mode */ ;\n/*!50003 SET sql_mode = 'NO_BACKSLASH_ESCAPES' */ ;\n" +
        "/*!50003 SET sql_mode = @saved_sql_mode */ ;\nINSERT INTO t VALUES ('O\\'Brien');\nUSE other;\n",
      true,
    ],
    [
      'ANSI_QUOTES: "…" es un identificador',
      'SET SESSION sql_mode=\'ANSI_QUOTES\';\nSELECT "a\\";\nUSE other;\n',
      true,
    ],
    [
      'sin ANSI_QUOTES: "…" es un texto con escapes',
      'INSERT INTO t VALUES ("a\\";\nUSE other;\n");\n',
      false,
    ],
    [
      'SET GLOBAL sql_mode no cambia la sesión',
      "SET GLOBAL sql_mode='NO_BACKSLASH_ESCAPES';\nINSERT INTO t VALUES ('a\\';\nUSE other;\n');\n",
      false,
    ],
  ])('MySQL sigue el sql_mode declarado (%s)', async (_n, sql, comenta) => {
    await armar().restaurar('mysql', fixture('m.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(comenta ? sql.replace('USE other;', '-- USE other;') : sql);
  });

  it.each([
    ['MySQL: USE dentro de /*! … */', 'mysql', '/*!40101 SET x=1\nUSE otra2 */;\n', '17.12'],
    ['MySQL: CREATE DATABASE tras /* sin cerrar', 'mysql', '/* x\nCREATE DATABASE y;\n', '17.12'],
    [
      'PG: DROP DATABASE dentro de un comentario de bloque',
      'postgresql',
      '/* x\nDROP DATABASE y;\n*/\n',
      '17.12',
    ],
    [
      'PG estricto: \\connect tras cerrar un comentario de bloque',
      'postgresql',
      '/* x\n*/ \\connect postgres\n',
      '17.2',
    ],
    [
      'PG estricto: standard_conforming_strings = off',
      'postgresql',
      "SET standard_conforming_strings = off;\nSELECT 'a\\'b';\n\\connect postgres\n",
      '17.2',
    ],
    [
      "PG estricto: \\connect tras 'a\\'b' (modo por defecto)",
      'postgresql',
      "SELECT 'a\\'b';\n\\connect postgres\n",
      '17.2',
    ],
    [
      "PG estricto: ('C:\\', 'b\\c') se lee distinto en cada modo",
      'postgresql',
      "INSERT INTO t VALUES ('C:\\', 'b\\c');\n",
      '17.2',
    ],
    [
      'PG estricto: un COPY que solo una lectura ve empezar',
      'postgresql',
      "COMMENT ON TABLE t IS 'ruta C:\\';\nCOPY t (a) FROM stdin;\n1\t\\N\n\\.\n",
      '17.2',
    ],
    [
      'PG estricto: \\connect en la parte larga de una línea ya enviada',
      'postgresql',
      `INSERT INTO t VALUES (1);${' '.repeat(5000)}\\connect postgres\nSELECT 1;\n`,
      '17.2',
    ],
  ])('aborta si no puede neutralizar con seguridad (%s)', async (_n, motor, sql, psql) => {
    versionPsql = psql;
    const e = (await armar()
      .restaurar(motor as MotorBd, fixture('s.sql', sql), 'tienda')
      .catch((x: unknown) => x)) as Error;
    expect(e).toBeInstanceOf(Error);
    expect(e.message.startsWith(NO_NEUTRALIZABLE)).toBe(true);
    if (motor === 'postgresql' && psql === '17.2')
      expect(e.message).toMatch(/Actualice PostgreSQL/);
  });

  it('PG con \\restrict: una lectura con el modo declarado (sin abortar)', async () => {
    // Lo que con psql sin \restrict aborta, aquí se resuelve con el modo declarado.
    const casos: [string, string][] = [
      [
        "SET standard_conforming_strings = off;\nSELECT 'a\\'b';\n\\connect postgres\n",
        "SET standard_conforming_strings = off;\nSELECT 'a\\'b';\n-- \\connect postgres\n",
      ],
      // Fuera de SQL normal o a mitad de línea: pasa tal cual y psql (restringido) lo rechaza.
      ['/* x\n*/ \\connect postgres\n', '/* x\n*/ \\connect postgres\n'],
      ['SELECT 1; \\c postgres\n', 'SELECT 1; \\c postgres\n'],
      [
        `INSERT INTO t VALUES (1);${' '.repeat(5000)}\\connect postgres\n`,
        `INSERT INTO t VALUES (1);${' '.repeat(5000)}\\connect postgres\n`,
      ],
    ];
    for (const [sql, esperado] of casos) {
      lanzados = [];
      await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
      expect(lanzados[0]!.restrict).toMatch(/^[0-9a-f]{32}$/);
      expect(lanzados[0]!.entrada).toBe(esperado);
    }
  });

  it("PG con \\restrict: ('C:\\', 'b\\c') con scs=on y luego el \\unrestrict del archivo", async () => {
    const insert = "INSERT INTO t VALUES ('C:\\', 'b\\c');\n";
    const sql =
      '\\restrict ABC123\nSET standard_conforming_strings = on;\n' +
      insert +
      '\\unrestrict ABC123\n';
    const r = await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(`SET standard_conforming_strings = on;\n${insert}`);
    expect(r.advertencias.join('\n')).toContain('\\unrestrict ABC123');
    expect(r.advertencias.join('\n')).not.toContain('INSERT');
  });

  it("PG con \\restrict: COMMENT 'ruta C:\\' y luego un COPY con \\N se reconoce", async () => {
    const copia =
      'COPY public.t (a, b) FROM stdin;\n1\t\\N\n2\tC:\\\\x\n\\connect otra\nDROP DATABASE x;\n\\.\n';
    const sql =
      "\\restrict K1\nCOMMENT ON TABLE public.t IS 'ruta C:\\';\n" + copia + '\\unrestrict K1\n';
    await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(`COMMENT ON TABLE public.t IS 'ruta C:\\';\n${copia}`);
  });

  it('PG con \\restrict: un \\unrestrict que no empieza en SQL normal pasa tal cual', async () => {
    const sql = '/* comentario\n\\unrestrict K2\n*/\nSELECT 1;\n';
    await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(sql);
  });

  it('PG: COPY a mitad de línea y comentarios anidados', async () => {
    const sql =
      'SET x = 1; COPY t (a) FROM stdin;\n\\connect dato\n\\.\n' +
      "/* a /* b */ 'no es texto */\n\\connect postgres\n";
    for (const v of ['17.12', '17.2']) {
      versionPsql = v;
      lanzados = [];
      await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
      expect(lanzados[0]!.entrada).toBe(sql.replace('\\connect postgres', '-- \\connect postgres'));
    }
  });

  it('el modo de escapes declarado se sigue: sin dudas, se comenta', async () => {
    // Con escapes desactivados, 'a\' cierra el texto: el USE queda fuera y en SQL normal.
    const sql = "SET sql_mode='NO_BACKSLASH_ESCAPES';\nSELECT 'a\\b';\nUSE other;\n";
    await armar().restaurar('mysql', fixture('s.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(sql.replace('USE other;', '-- USE other;'));
  });

  it('psql 17.6+: la entrada empieza por \\restrict y se quitan los del archivo', async () => {
    const sql = '\\restrict abc123\nCREATE TABLE t (a int);\n\\unrestrict abc123\n';
    const r = await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
    const l = lanzados[0]!;
    expect(l.restrict).toMatch(/^[0-9a-f]{32}$/);
    expect(l.restrict).not.toBe('abc123');
    expect(l.entrada).toBe('CREATE TABLE t (a int);\n');
    expect(r.advertencias.join('\n')).toContain('\\unrestrict abc123');
    expect(
      ejecutados.some((e) => path.basename(e.cmd) === 'psql.exe' && e.args.includes('--version')),
    ).toBe(true);
  });

  it('psql sin \\restrict: se neutraliza cualquier meta-comando', async () => {
    versionPsql = '17.2';
    const sql = "SELECT '\\! en texto';\n\\! del x\n\\o archivo\nSELECT 1; \\g |cmd\n";
    await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
    const l = lanzados[0]!;
    expect(l.restrict).toBeNull();
    expect(l.entrada).toBe(
      "SELECT '\\! en texto';\n-- \\! del x\n-- \\o archivo\n-- SELECT 1; \\g |cmd\n",
    );
  });

  it('versiones con \\restrict y con --sandbox', () => {
    expect(psqlConRestrict('psql (PostgreSQL) 17.12')).toBe(true);
    expect(psqlConRestrict('psql (PostgreSQL) 17.5')).toBe(false);
    expect(psqlConRestrict('psql (PostgreSQL) 16.10')).toBe(true);
    expect(psqlConRestrict('psql (PostgreSQL) 18.1')).toBe(true);
    expect(psqlConRestrict('otra cosa')).toBe(false);
    expect(mariadbConSandbox('11.4.14')).toBe(true);
    expect(mariadbConSandbox('11.4.1')).toBe(false);
    expect(mariadbConSandbox('10.11.8')).toBe(true);
    expect(mariadbConSandbox('10.6.17')).toBe(false);
    expect(mariadbConSandbox('11.8.2')).toBe(true);
    // 11.3 no consta: sin --sandbox.
    expect(mariadbConSandbox('11.3.2')).toBe(false);
  });

  it.each([
    [
      'PG: \\connect tras una sentencia sin terminar',
      'postgresql',
      'CREATE TABLE t (a int)\n\\connect postgres\nDROP TABLE x;\n',
      '\\connect postgres',
    ],
    [
      "PG: \\connect tras E'it\\'s'",
      'postgresql',
      "SELECT E'it\\'s';\nSELECT 1;\n\\connect postgres\n",
      '\\connect postgres',
    ],
    [
      'PG: $ dentro de un nombre no abre un cuerpo $$',
      'postgresql',
      'SELECT a$b$ FROM t;\n\\c postgres\n',
      '\\c postgres',
    ],
    [
      'MySQL: "-- " es comentario y no abre comillas',
      'mysql',
      "SELECT 1 -- 'abc\nUSE otra;\n",
      'USE otra;',
    ],
  ])('filtra el cambio de base (%s)', async (_n, motor, sql, linea) => {
    for (const v of ['17.12', '17.2']) {
      versionPsql = v;
      lanzados = [];
      const r = await armar().restaurar(motor as MotorBd, fixture('s.sql', sql), 'tienda');
      expect(lanzados[0]!.entrada).toBe(sql.replace(linea, `-- ${linea}`));
      expect(r.advertencias.join('\n')).toContain(linea);
    }
  });

  it('PG sin \\restrict: \\c a mitad de línea se comenta', async () => {
    versionPsql = '17.2';
    const sql = 'SELECT 1; \\c postgres\n';
    await armar().restaurar('postgresql', fixture('s.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe('-- SELECT 1; \\c postgres\n');
  });

  /** Las líneas de datos (INSERT y filas de COPY) salen idénticas, nunca comentadas. */
  function datosIntactos(entrada: string, datos: string[]): void {
    const salida = entrada.split('\n');
    for (const d of datos) {
      expect(salida).toContain(d);
      expect(salida).not.toContain(`-- ${d}`);
    }
  }

  it('ninguna línea de datos se altera en MySQL', async () => {
    const datos = [
      "INSERT INTO `t` VALUES (1,'O\\'Brien','x\\r y','C:\\\\'),(2,'\\u otra','\\\\'),(3,'a\\nb');",
      "INSERT INTO `t` VALUES (4,'USE otra; -- \\'x'),(5,'#'),(6,'/*'),(7,'\\\\connect x');",
      "INSERT INTO `t` VALUES (8,'línea 1",
      'USE otra;',
      'DROP DATABASE tienda;',
      "\\u otra');",
      "INSERT INTO `t` VALUES (9,\"comillas \\\" dobles\"),(10,'it''s');",
    ];
    const sql =
      "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;\n" +
      `${datos.join('\n')}\nUSE \`otra\`;\nINSERT INTO t VALUES (11);\n`;
    const r = await armar().restaurar('mysql', fixture('m.sql', sql), 'tienda');
    const entrada = lanzados[0]!.entrada!;
    datosIntactos(entrada, [...datos, 'INSERT INTO t VALUES (11);']);
    expect(entrada).toContain('\n-- USE `otra`;\n');
    expect(r.advertencias).toHaveLength(1);
  });

  for (const [modo, v] of [
    ['con \\restrict', '17.12'],
    ['sin \\restrict', '17.2'],
  ] as const) {
    it(`ninguna línea de datos se altera en PostgreSQL ${modo}`, async () => {
      versionPsql = v;
      const filas = [
        '1\t\\N\tC:\\\\ruta\\\\',
        '2\t\\connect otra\t\\\\!',
        '\\connect otra',
        'DROP DATABASE tienda;',
        "3\tO'Brien\t\\t\\n",
      ];
      const inserts = [
        "INSERT INTO public.t VALUES (4, E'it\\'s', 'O''Brien', E'C:\\\\');",
        "INSERT INTO public.t VALUES (5, 'línea 1",
        '\\connect otra',
        "DROP DATABASE tienda;');",
        'INSERT INTO public.t VALUES (6, $x$ \\! cmd $x$, $$',
        'CREATE DATABASE y;',
        '$$);',
      ];
      const sql =
        "SET standard_conforming_strings = on;\nSELECT pg_catalog.set_config('search_path', '', false);\n" +
        'CREATE TABLE public.t (a int, b text, c text);\n' +
        `COPY public.t (a, b, c) FROM stdin;\n${filas.join('\n')}\n\\.\n` +
        `${inserts.join('\n')}\n\\connect postgres\nCREATE DATABASE otra;\n`;
      await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
      const entrada = lanzados[0]!.entrada!;
      datosIntactos(entrada, [...filas, ...inserts]);
      expect(entrada.endsWith('-- \\connect postgres\n-- CREATE DATABASE otra;\n')).toBe(true);
    });
  }

  it('un respaldo previo vacío detiene todo antes de borrar', async () => {
    conTablas = true;
    respuestaLanzar = (l) => {
      if (l.cmd.includes('pg_dump')) writeFileSync(l.args[l.args.indexOf('-f') + 1]!, '');
      return { codigo: 0 };
    };
    await expect(
      armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes', {
        confirmarSobrescribir: true,
      }),
    ).rejects.toThrow(
      'No se sobrescribió la base diamantes: su respaldo previo quedó vacío o incompleto; no se tocó nada.',
    );
    expect(orden).toEqual(['pg_dump.exe']);
    expect(consultasLocal).toEqual([]);
    expect(creadas).toEqual([]);
  });

  it('un respaldo previo SQL sin sentencias tampoco sirve', async () => {
    conTablas = true;
    respuestaLanzar = (l) => {
      const r = l.args.find((a) => a.startsWith('--result-file='));
      if (r) writeFileSync(r.slice('--result-file='.length), '-- MySQL dump\n-- nada\n');
      return { codigo: 0 };
    };
    await expect(
      armar().restaurar('mysql', fixture('m.sql', 'SELECT 1;\n'), 'tienda', {
        confirmarSobrescribir: true,
      }),
    ).rejects.toThrow(/vacío o incompleto/);
    expect(consultasLocal).toEqual([]);
  });

  it('si falla después de borrar, avisa dónde quedó el respaldo previo', async () => {
    conTablas = true;
    respuestaLanzar = (l) => {
      if (l.cmd.includes('dump')) {
        volcadoFalso(l);
        return { codigo: 0 };
      }
      return { codigo: 1, lineas: ['pg_restore: error: fatal'] };
    };
    const p = armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes', {
      confirmarSobrescribir: true,
    });
    const error = (await p.catch((e: unknown) => e)) as Error & {
      respaldoPrevio?: string;
      codigo?: string;
    };
    expect(error.codigo).toBe('tras-reemplazo');
    expect(error.respaldoPrevio).toMatch(/diamantes-antes-de-sobrescribir-\d{8}-\d{4}\.dump$/);
    expect(error.message).toBe(
      `No se pudo completar la restauración de diamantes. La base original se reemplazó; su copia de seguridad está en ${error.respaldoPrevio}. Puede restaurarla desde Bases de datos.`,
    );
    expect(existsSync(error.respaldoPrevio!)).toBe(true);
  });

  it('un INSERT de varias líneas cuya 2.ª empieza por DROP DATABASE queda intacto', async () => {
    const sql = "INSERT INTO t VALUES ('hola,\nDROP DATABASE tienda;\n');\n";
    const r = await armar().restaurar('mysql', fixture('m.sql', sql), 'tienda');
    expect(lanzados[0]!.entrada).toBe(sql);
    expect(r.advertencias).toEqual([]);
  });

  it('un .sql en UTF-16BE se convierte a UTF-8', async () => {
    const le = Buffer.from('SELECT "ñ";\n', 'utf16le');
    const be = Buffer.from(le).swap16();
    await armar().restaurar(
      'mysql',
      fixture('be.sql', Buffer.concat([Buffer.from([0xfe, 0xff]), be])),
      'tienda',
    );
    expect(lanzados[0]!.entrada).toBe('SELECT "ñ";\n');
  });

  it('al elegir dentro del archivo ignora __MACOSX/ y ._*', async () => {
    respuestaTar = (args) => {
      const destino = args[args.indexOf('-C') + 1]!;
      mkdirSync(path.join(destino, '__MACOSX', 'r'), { recursive: true });
      mkdirSync(path.join(destino, 'r'), { recursive: true });
      writeFileSync(path.join(destino, '__MACOSX', 'r', '._Diamantes.sql'), 'basura');
      writeFileSync(path.join(destino, 'r', '._Diamantes.sql'), 'basura');
      writeFileSync(path.join(destino, 'r', 'Diamantes.sql'), PGDMP);
      return { codigo: 0 };
    };
    await armar().restaurar('postgresql', fixture('d.zip', zip({ 'x.sql': '1' })), 'diamantes');
    expect(path.basename(lanzados[0]!.args.at(-1)!)).toBe('Diamantes.sql');
  });

  it('rechaza nombres con URL de conexión', async () => {
    const r = armar();
    await expect(
      r.restaurar('postgresql', fixture('d.dump', PGDMP), 'postgresql://x@h/db'),
    ).rejects.toThrow(/URL/);
    await expect(
      r.importar(
        'postgresql',
        { host: 'h', puerto: 5432, usuario: 'u', clave: 'c', base: 'postgres://h/db' },
        'dollar',
      ),
    ).rejects.toThrow(/no es válido/);
    await expect(
      r.importar(
        'mysql',
        { host: 'h', puerto: 3306, usuario: 'u', clave: 'c', base: 'a://b' },
        'x',
      ),
    ).rejects.toThrow(/no es válido/);
    expect(lanzados).toEqual([]);
    expect(consultasOrigen).toEqual([]);
  });

  it('sql plano en PostgreSQL va por psql con ON_ERROR_STOP=0 sin salir de la base', async () => {
    const sql =
      'CREATE DATABASE otra;\n\\connect otra\nCREATE TABLE t (id int);\n' +
      'COPY t (id) FROM stdin;\n\\connect dato\n\\.\n';
    await armar().restaurar('postgresql', fixture('p.sql', sql), 'tienda');
    const l = lanzados[0]!;
    expect(path.basename(l.cmd)).toBe('psql.exe');
    expect(l.args).toEqual([
      '-X',
      '-q',
      '--no-password',
      '-v',
      'ON_ERROR_STOP=0',
      '-h',
      '127.0.0.1',
      '-p',
      '5432',
      '-U',
      'postgres',
      '-d',
      'tienda',
      '-f',
      '-',
    ]);
    expect(l.env.PGPASSWORD).toBe(CLAVE);
    // Los cambios de base se comentan; los datos de COPY no se tocan.
    expect(l.entrada).toBe(
      '-- CREATE DATABASE otra;\n-- \\connect otra\nCREATE TABLE t (id int);\n' +
        'COPY t (id) FROM stdin;\n\\connect dato\n\\.\n',
    );
    sinClaves(l);
  });

  it('sql en MySQL va por stdin a mysql <base> y no cambia de base', async () => {
    const sql = '-- MySQL dump\nCREATE DATABASE `otra`;\nUSE `otra`;\nINSERT INTO t VALUES (1);\n';
    const res = await armar().restaurar('mysql', fixture('m.sql', sql), 'tienda');
    const l = lanzados[0]!;
    expect(l.cmd).toBe(path.join(rutas.bin('mysql', '8.4.3'), 'bin', 'mysql.exe'));
    expect(l.args).toEqual([
      '--host=127.0.0.1',
      '--port=3306',
      '--user=root',
      '--default-character-set=utf8mb4',
      '--binary-mode',
      '--force',
      'tienda',
    ]);
    expect(l.env.MYSQL_PWD).toBe(CLAVE);
    expect(l.entrada).toBe(
      '-- MySQL dump\n-- CREATE DATABASE `otra`;\n-- USE `otra`;\nINSERT INTO t VALUES (1);\n',
    );
    expect(res.advertencias.join('\n')).toContain('USE `otra`');
    sinClaves(l);
  });

  it('MariaDB usa mariadb.exe', async () => {
    await armar().restaurar('mariadb', fixture('m.sql', 'SELECT 1;\n'), 'tienda');
    expect(lanzados[0]!.cmd).toBe(path.join(rutas.bin('mariadb', '11.4.4'), 'bin', 'mariadb.exe'));
    expect(lanzados[0]!.args).toEqual(expect.arrayContaining(['--binary-mode', '--sandbox']));
    expect(lanzados[0]!.args).toContain('--port=3307');
  });

  it('un .sql en UTF-16 se convierte a UTF-8', async () => {
    const utf16 = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from('SELECT "ñ";\n', 'utf16le'),
    ]);
    await armar().restaurar('mysql', fixture('ps.sql', utf16), 'tienda');
    expect(lanzados[0]!.entrada).toBe('SELECT "ñ";\n');
  });

  it('un .gz de sql se descomprime en streaming hacia mysql', async () => {
    await armar().restaurar(
      'mysql',
      fixture('m.sql.gz', gzipSync('INSERT INTO t VALUES (2);\n')),
      'tienda',
    );
    expect(lanzados[0]!.entrada).toBe('INSERT INTO t VALUES (2);\n');
  });

  it('un .gz de pg_dump se descomprime a un temporal que luego se borra', async () => {
    const archivo = fixture('d.dump.gz', gzipSync(PGDMP));
    await armar().restaurar('postgresql', archivo, 'diamantes');
    const l = lanzados[0]!;
    const ruta = l.args.at(-1)!;
    expect(ruta).not.toBe(archivo);
    expect(ruta.startsWith(rutas.tmp())).toBe(true);
    expect(l.archivo?.subarray(0, 5).toString()).toBe('PGDMP');
    expect(existsSync(ruta)).toBe(false);
    expect(readFileSync(archivo)).toEqual(gzipSync(PGDMP));
  });

  it('un .zip/.rar se extrae con el tar de System32 y se elige el único respaldo', async () => {
    respuestaTar = (args) => {
      const destino = args[args.indexOf('-C') + 1]!;
      mkdirSync(path.join(destino, 'carpeta'), { recursive: true });
      writeFileSync(path.join(destino, 'carpeta', 'Diamantes.sql'), PGDMP);
      writeFileSync(path.join(destino, 'leame.txt'), 'hola');
      return { codigo: 0 };
    };
    const archivo = fixture('Diamantes.rar', Buffer.from('Rar!\x1a\x07\x01\x00', 'latin1'));
    await armar().restaurar('postgresql', archivo, 'diamantes');
    const tar = ejecutados.find((e) => e.cmd === TAR)!;
    expect(tar.args.slice(0, 2)).toEqual(['-xf', archivo]);
    expect(tar.args[2]).toBe('-C');
    expect(tar.args[3]!.startsWith(rutas.tmp())).toBe(true);
    const l = lanzados[0]!;
    expect(path.basename(l.cmd)).toBe('pg_restore.exe');
    expect(path.basename(l.args.at(-1)!)).toBe('Diamantes.sql');
    expect(readdirSync(rutas.tmp())).toEqual([]);
  });

  it('si tar falla, pide descomprimir a mano y no restaura ni crea la base', async () => {
    respuestaTar = () => ({ codigo: 1 });
    const archivo = fixture('Diamantes.rar', Buffer.from('Rar!\x1a\x07\x01\x00', 'latin1'));
    await expect(armar().restaurar('postgresql', archivo, 'diamantes')).rejects.toThrow(
      'Descomprima el archivo y elija el .sql o .dump que contiene',
    );
    expect(lanzados).toEqual([]);
    expect(creadas).toEqual([]);
    expect(readdirSync(rutas.tmp())).toEqual([]);
  });

  it('si hay varios respaldos dentro, pide elegir uno', async () => {
    respuestaTar = (args) => {
      const destino = args[args.indexOf('-C') + 1]!;
      writeFileSync(path.join(destino, 'a.sql'), 'SELECT 1;');
      writeFileSync(path.join(destino, 'b.dump'), PGDMP);
      return { codigo: 0 };
    };
    await expect(
      armar().restaurar('postgresql', fixture('x.zip', zip({ 'a.sql': '1' })), 'tienda'),
    ).rejects.toThrow('Hay varios respaldos dentro; descomprima y elija uno');
    expect(lanzados).toEqual([]);
  });

  it.runIf(process.platform === 'win32' && existsSync(TAR))(
    'el tar real de Windows extrae un .zip con un pg_dump llamado .sql',
    async () => {
      respuestaTar = undefined as never;
      const real: Ejecutor = async (cmd, args, opts) => {
        const { ejecutorPorDefecto } = await import('../src/plataforma/win');
        return ejecutorPorDefecto(cmd, args, opts);
      };
      const archivo = fixture('d.zip', zip({ 'respaldo/Diamantes.sql': PGDMP }));
      await armar({ exec: real }).restaurar('postgresql', archivo, 'diamantes');
      expect(path.basename(lanzados[0]!.args.at(-1)!)).toBe('Diamantes.sql');
      expect(lanzados[0]!.archivo?.subarray(0, 5).toString()).toBe('PGDMP');
    },
  );

  it('no restaura un pg_dump en MySQL', async () => {
    await expect(armar().restaurar('mysql', fixture('d.sql', PGDMP), 'tienda')).rejects.toThrow(
      /PostgreSQL/,
    );
    expect(lanzados).toEqual([]);
    expect(creadas).toEqual([]);
  });

  it('pg_restore con errores ignorados devuelve advertencias', async () => {
    respuestaLanzar = () => ({
      codigo: 1,
      lineas: [
        'pg_restore: processing data for table "public.clientes"',
        'pg_restore: error: could not execute query: ERROR:  role "diamantes_app" does not exist',
        'pg_restore: warning: errors ignored on restore: 1',
      ],
    });
    const r = await armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes');
    expect(r.advertencias).toEqual([
      'pg_restore: error: could not execute query: ERROR:  role "diamantes_app" does not exist',
      'pg_restore: warning: errors ignored on restore: 1',
    ]);
  });

  it('un fallo real se informa sin la clave', async () => {
    respuestaLanzar = () => ({
      codigo: 1,
      lineas: [`pg_restore: error: connection failed: password "${CLAVE}" rejected`],
    });
    const p = armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes');
    await expect(p).rejects.toThrow(/No se pudo restaurar la base diamantes/);
    await expect(p).rejects.not.toThrow(CLAVE);
  });

  it('emite bd:progreso sin claves y como mucho 10 por segundo', async () => {
    respuestaLanzar = () => ({
      codigo: 0,
      lineas: [
        ...Array.from({ length: 20 }, (_, i) => `pg_restore: processing item ${i}`),
        `pg_restore: clave ${CLAVE}`,
      ],
    });
    await armar().restaurar('postgresql', fixture('d.dump', PGDMP), 'diamantes');
    expect(progreso.length).toBeGreaterThan(0);
    expect(progreso.length).toBeLessThanOrEqual(2); // reloj detenido: la primera y la última
    expect(progreso[0]).toEqual({
      operacion: 'restaurar',
      motor: 'postgresql',
      base: 'diamantes',
      linea: expect.any(String),
    });
    expect(progreso.at(-1)!.linea).toBe('pg_restore: clave ***');
  });

  it('valida el nombre y las bases del sistema antes de tocar nada', async () => {
    const r = armar();
    await expect(r.restaurar('postgresql', fixture('d.dump', PGDMP), 'Mala-Base')).rejects.toThrow(
      /no es válido/,
    );
    await expect(r.restaurar('mysql', fixture('m.sql', 'SELECT 1;'), 'mysql')).rejects.toThrow(
      /sistema/,
    );
    await expect(r.restaurar('mongodb', fixture('m.sql', 'x'), 'tienda')).rejects.toThrow(
      /MongoDB/,
    );
    expect(lanzados).toEqual([]);
  });
});

describe('respaldar', () => {
  it('pg_dump -Fc a Documentos\\WolfCore Dev\\Respaldos con fecha', async () => {
    reloj = new Date(2026, 10, 18, 9, 5).getTime();
    const r = await armar().respaldar('postgresql', 'diamantes');
    const esperado = path.join(
      documentos,
      'WolfCore Dev',
      'Respaldos',
      'diamantes-20261118-0905.dump',
    );
    expect(r).toEqual({ archivo: esperado });
    expect(readFileSync(esperado).subarray(0, 5).toString()).toBe('PGDMP');
    const l = lanzados[0]!;
    expect(path.basename(l.cmd)).toBe('pg_dump.exe');
    expect(l.args.slice(0, 2)).toEqual(['-Fc', '--verbose']);
    expect(l.args).toEqual(
      expect.arrayContaining(['-h', '127.0.0.1', '-p', '5432', '-U', 'postgres']),
    );
    expect(l.args.at(-1)).toBe('diamantes');
    expect(l.env.PGPASSWORD).toBe(CLAVE);
    sinClaves(l);
    expect(readdirSync(path.dirname(esperado))).toEqual(['diamantes-20261118-0905.dump']);
  });

  it('mysqldump con transacción única, rutinas y triggers a la carpeta elegida', async () => {
    reloj = new Date(2026, 0, 2, 23, 59).getTime();
    const carpeta = path.join(dir, 'elegida');
    const r = await armar().respaldar('mysql', 'tienda', carpeta);
    expect(r.archivo).toBe(path.join(carpeta, 'tienda-20260102-2359.sql'));
    const l = lanzados[0]!;
    expect(path.basename(l.cmd)).toBe('mysqldump.exe');
    expect(l.args).toEqual(
      expect.arrayContaining(['--single-transaction', '--routines', '--triggers']),
    );
    expect(l.args.some((a) => a.startsWith('--result-file='))).toBe(true);
    expect(l.args.at(-1)).toBe('tienda');
    expect(l.env.MYSQL_PWD).toBe(CLAVE);
    sinClaves(l);
  });

  it('no pisa un respaldo del mismo minuto', async () => {
    const r = armar();
    const a = await r.respaldar('mysql', 'tienda', dir);
    const b = await r.respaldar('mysql', 'tienda', dir);
    expect(b.archivo).not.toBe(a.archivo);
  });

  it('si falla, borra el archivo a medias', async () => {
    respuestaLanzar = (l) => {
      volcadoFalso(l);
      return { codigo: 2, lineas: ['mysqldump: Got error: 1049: Unknown database'] };
    };
    const carpeta = path.join(dir, 'fallo');
    await expect(armar().respaldar('mysql', 'tienda', carpeta)).rejects.toThrow(
      /No se pudo respaldar la base tienda/,
    );
    expect(readdirSync(carpeta)).toEqual([]);
  });
});

describe('importar', () => {
  const origenPg = {
    host: '127.0.0.1',
    puerto: 5433,
    usuario: 'flyenv',
    clave: CLAVE_ORIGEN,
    base: 'dollar',
  };
  const origenMy = { ...origenPg, puerto: 3308, base: 'dollar' };

  it('vuelca el origen (solo lectura) y restaura en la base local', async () => {
    versionOrigen = 'PostgreSQL 16.4, compiled by Visual C++ build 1940, 64-bit';
    const r = await armar().importar('postgresql', origenPg, 'dollar');
    expect(r.advertencias).toEqual([]);
    expect(consultasOrigen).toEqual(['SELECT version() AS version']);
    const [volcado, restauracion] = lanzados;
    expect(path.basename(volcado!.cmd)).toBe('pg_dump.exe');
    expect(volcado!.args).toEqual(
      expect.arrayContaining(['-Fc', '-h', '127.0.0.1', '-p', '5433', '-U', 'flyenv']),
    );
    expect(volcado!.args.at(-1)).toBe('dollar');
    expect(volcado!.env.PGPASSWORD).toBe(CLAVE_ORIGEN);
    expect(path.basename(restauracion!.cmd)).toBe('pg_restore.exe');
    expect(restauracion!.args).toEqual(expect.arrayContaining(['-p', '5432', '-d', 'dollar']));
    expect(restauracion!.env.PGPASSWORD).toBe(CLAVE);
    for (const l of lanzados) sinClaves(l);
    expect(readdirSync(rutas.tmp())).toEqual([]);
  });

  it('si el origen PostgreSQL es más nuevo, dice qué versión instalar', async () => {
    versionOrigen = 'PostgreSQL 18.1 on x86_64-pc-linux-gnu';
    await expect(armar().importar('postgresql', origenPg, 'dollar')).rejects.toThrow(
      /PostgreSQL 18/,
    );
    expect(lanzados).toEqual([]);
  });

  it('MySQL compara mayor y menor', async () => {
    versionOrigen = '9.1.0';
    await expect(armar().importar('mysql', origenMy, 'dollar')).rejects.toThrow(/MySQL 9\.1/);
    expect(lanzados).toEqual([]);
    versionOrigen = '8.0.36-log';
    await armar().importar('mysql', origenMy, 'dollar');
    const v = lanzados[0]!;
    expect(path.basename(v.cmd)).toBe('mysqldump.exe');
    expect(v.args).toEqual(expect.arrayContaining(['--single-transaction', '--port=3308']));
    expect(v.env.MYSQL_PWD).toBe(CLAVE_ORIGEN);
    for (const l of lanzados) sinClaves(l);
  });

  it('un origen MariaDB no se importa en MySQL', async () => {
    versionOrigen = '10.11.6-MariaDB';
    await expect(armar().importar('mysql', origenMy, 'dollar')).rejects.toThrow(/MariaDB/);
  });

  it('borra el temporal aunque la restauración falle', async () => {
    versionOrigen = 'PostgreSQL 17.0';
    respuestaLanzar = (l) => {
      if (l.cmd.includes('pg_dump')) {
        volcadoFalso(l);
        return { codigo: 0 };
      }
      return { codigo: 1, lineas: ['pg_restore: error: fatal'] };
    };
    await expect(armar().importar('postgresql', origenPg, 'dollar')).rejects.toThrow();
    expect(lanzados).toHaveLength(2);
    expect(readdirSync(rutas.tmp())).toEqual([]);
  });

  it('borra el temporal aunque el volcado falle, sin mostrar la clave', async () => {
    versionOrigen = 'PostgreSQL 17.0';
    respuestaLanzar = (l) => {
      volcadoFalso(l);
      return { codigo: 1, lineas: [`pg_dump: error: password ${CLAVE_ORIGEN} failed`] };
    };
    const p = armar().importar('postgresql', origenPg, 'dollar');
    await expect(p).rejects.toThrow(/origen/);
    await expect(p).rejects.not.toThrow(CLAVE_ORIGEN);
    expect(readdirSync(rutas.tmp())).toEqual([]);
  });

  it('rechaza un destino con tablas antes de contactar al origen', async () => {
    conTablas = true;
    await expect(armar().importar('postgresql', origenPg, 'dollar')).rejects.toThrow(
      'La base dollar ya tiene tablas',
    );
    expect(consultasOrigen).toEqual([]);
    expect(lanzados).toEqual([]);
  });

  it('no importa una base sobre sí misma', async () => {
    await expect(
      armar().importar('postgresql', { ...origenPg, puerto: 5432 }, 'dollar'),
    ).rejects.toThrow(/misma base/);
  });
});

describe('encadenar', () => {
  it('si el proceso sale antes de leer todo, cierra el archivo y todas las etapas', async () => {
    const { PassThrough } = await import('node:stream');
    const archivo = fixture('grande.sql.gz', gzipSync(Buffer.alloc(8 * 1024 * 1024, 'x')));
    const lector = createReadStream(archivo, { highWaterMark: 1024 });
    const gz = createGunzip();
    const paso = new PassThrough();
    const final = encadenar(lector, gz, paso);
    const cerrado = new Promise<void>((r) => lector.on('close', () => r()));
    const r = await lanzadorPorDefecto(process.execPath, ['-e', 'process.exit(0)'], {
      entrada: final,
    });
    expect(r.codigo).toBe(0);
    await cerrado;
    expect(lector.destroyed).toBe(true);
    expect(gz.destroyed).toBe(true);
    expect(paso.destroyed).toBe(true);
  });
});

describe('lanzadorPorDefecto', () => {
  it('pasa un flujo grande por stdin con contrapresión y lee líneas', async () => {
    const { Readable } = await import('node:stream');
    const lineas: string[] = [];
    const datos = Buffer.alloc(4 * 1024 * 1024, 'a');
    const r = await lanzadorPorDefecto(
      process.execPath,
      [
        '-e',
        "let n=0;process.stdin.on('data',d=>n+=d.length).on('end',()=>console.log('total '+n))",
      ],
      { entrada: Readable.from([datos]), alLinea: (l) => lineas.push(l) },
    );
    expect(r.codigo).toBe(0);
    expect(lineas).toEqual([`total ${datos.length}`]);
  });

  it('si el proceso sale sin leer stdin, no revienta con EPIPE', async () => {
    const { Readable } = await import('node:stream');
    const datos = Buffer.alloc(8 * 1024 * 1024, 'b');
    const r = await lanzadorPorDefecto(process.execPath, ['-e', 'process.exit(3)'], {
      entrada: Readable.from([datos]),
    });
    expect(r.codigo).toBe(3);
  });

  it('pasa las variables de entorno', async () => {
    const lineas: string[] = [];
    await lanzadorPorDefecto(process.execPath, ['-e', 'console.log(process.env.PEL_X)'], {
      env: { PEL_X: 'hola' },
      alLinea: (l) => lineas.push(l),
    });
    expect(lineas).toEqual(['hola']);
  });
});

describe('carpetaDocumentos', () => {
  it('usa la carpeta Mis documentos de Windows y, si falla, %USERPROFILE%\\Documents', async () => {
    const ok = new PlataformaWindows(async () => ({
      codigo: 0,
      stdout: 'D:\\Docs\r\n',
      stderr: '',
    }));
    expect(await ok.carpetaDocumentos()).toBe('D:\\Docs');
    const mal = new PlataformaWindows(async () => ({ codigo: 1, stdout: '', stderr: 'x' }));
    const perfil = process.env.USERPROFILE;
    process.env.USERPROFILE = 'C:\\Users\\prueba';
    try {
      expect(await mal.carpetaDocumentos()).toBe('C:\\Users\\prueba\\Documents');
    } finally {
      if (perfil === undefined) delete process.env.USERPROFILE;
      else process.env.USERPROFILE = perfil;
    }
  });
});

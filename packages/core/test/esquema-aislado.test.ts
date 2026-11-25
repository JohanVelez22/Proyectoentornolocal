import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  dividirSentencias,
  quitarAutoIncrement,
  quitarDefiner,
  quitarRestrict,
  revisarSql,
} from '../src/bd/sqlPermitido';
import { Respaldos, type DepsRespaldos } from '../src/bd/respaldos';
import type { Ejecutor, Lanzador } from '../src/plataforma/tipos';
import { nombreEjecutable } from '../src/plataforma/sistema';
import { Rutas } from '../src/rutas';
import type { EstadoServicio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const MALAS_MYSQL: [string, string][] = [
  ['DROP DATABASE otra', 'DROP DATABASE otra;'],
  ['CREATE USER', "CREATE USER 'x'@'%' IDENTIFIED BY 'y';"],
  ['GRANT', "GRANT ALL ON *.* TO 'x'@'%';"],
  ['INTO OUTFILE', "CREATE TABLE t (a int);\nSELECT 'x' INTO OUTFILE 'C:/x.txt';"],
  ['OUTFILE en comentario condicional', '/*!50000 SELECT 1 INTO OUTFILE "x" */;'],
  ['DROP DATABASE condicional', '/*!50000 DROP DATABASE otra */;'],
  ['LOAD DATA', "LOAD DATA INFILE 'x' INTO TABLE t;"],
  ['SET GLOBAL', 'SET GLOBAL local_infile = 1;'],
  ['SET PERSIST', 'SET PERSIST max_connections = 1;'],
  ['USE otra', 'USE otra;'],
  ['INSERT suelto', "INSERT INTO t VALUES ('x');"],
  ['ALTER USER', "ALTER USER 'root'@'localhost' IDENTIFIED BY 'x';"],
  ['CREATE DATABASE', 'CREATE DATABASE otra;'],
  ['SELECT suelto', 'SELECT LOAD_FILE("C:/x");'],
  ['SLEEP', 'CREATE TABLE t AS SELECT SLEEP(1000);'],
  ['DELIMITER raro', 'DELIMITER ;; x\nCREATE TABLE t (a int);;'],
];

const MALAS_PG: [string, string][] = [
  ['COPY FROM PROGRAM', "COPY t FROM PROGRAM 'calc.exe';"],
  ['COPY datos', 'COPY t (a) FROM stdin;\n1\n\\.\n'],
  ['ALTER SYSTEM', "ALTER SYSTEM SET archive_command = 'x';"],
  ['CREATE ROLE', "CREATE ROLE x SUPERUSER LOGIN PASSWORD 'y';"],
  ['GRANT', 'GRANT pg_execute_server_program TO x;'],
  ['DROP DATABASE', 'DROP DATABASE otra;'],
  ['CREATE EXTENSION', 'CREATE EXTENSION file_fdw;'],
  ['DO', 'DO $$ BEGIN PERFORM pg_sleep(1); END $$;'],
  ['SET ROLE', 'SET ROLE postgres;'],
  ['SET SESSION AUTHORIZATION', 'SET SESSION AUTHORIZATION postgres;'],
  ['meta-comando', '\\! calc.exe'],
  ['LANGUAGE C', "CREATE FUNCTION f() RETURNS int AS '/x.so', 'f' LANGUAGE C;"],
  [
    'lo_export',
    "CREATE FUNCTION f() RETURNS void AS $$ SELECT lo_export(1, '/x') $$ LANGUAGE sql;",
  ],
];

describe('sqlPermitido: lista de sentencias permitidas', () => {
  it('acepta un volcado de mysqldump con DELIMITER, comentarios condicionales y DEFINER', () => {
    const sql = [
      '-- MySQL dump 10.13',
      '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;',
      '/*!50503 SET NAMES utf8mb4 */;',
      'DROP TABLE IF EXISTS `usuarios`;',
      "CREATE TABLE `usuarios` (`id` int NOT NULL, `nombre` varchar(10) DEFAULT 'a;b', PRIMARY KEY (`id`));",
      '/*!50003 SET @saved_cs_client = @@character_set_client */ ;;',
      'DELIMITER ;;',
      '/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `t1` BEFORE INSERT ON `usuarios` FOR EACH ROW BEGIN SET NEW.id = 1; INSERT INTO log VALUES (1); END */;;',
      'DELIMITER ;',
      'CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v` AS select 1;',
    ].join('\n');
    const s = revisarSql(sql, 'mysql');
    const textos = s.map((x) => x.texto);
    expect(textos.some((t) => /DEFINER=/i.test(t.replace(/SQL SECURITY DEFINER/gi, '')))).toBe(
      false,
    );
    const trigger = s.find((x) => x.clase === 'disparador')!;
    expect(trigger.objeto).toBe('t1');
    expect(trigger.texto).toContain('INSERT INTO log VALUES (1); END');
    expect(s.find((x) => x.clase === 'vista')!.objeto).toBe('v');
    expect(textos.find((t) => t.startsWith('CREATE TABLE'))).toContain("'a;b'");
  });

  it.each(MALAS_MYSQL)('MySQL rechaza %s', (_n, sql) => {
    expect(() => revisarSql(`CREATE TABLE t (a int);\n${sql}`, 'mysql')).toThrowError(
      expect.objectContaining({ codigo: 'bd.sql_no_permitido' }),
    );
  });

  it.each(MALAS_PG)('PostgreSQL rechaza %s', (_n, sql) => {
    expect(() =>
      revisarSql(`SET statement_timeout = 0;\nCREATE TABLE t (a int);\n${sql}`, 'postgresql'),
    ).toThrowError(expect.objectContaining({ codigo: 'bd.sql_no_permitido' }));
  });

  it('un comentario no es una sentencia, pero un ; dentro de una cadena tampoco divide', () => {
    expect(
      dividirSentencias(
        "-- DROP DATABASE x;\nCREATE TABLE t (a text DEFAULT 'a;b'); # GRANT",
        'mysql',
      ),
    ).toEqual(["CREATE TABLE t (a text DEFAULT 'a;b')"]);
  });

  it('importada: las vistas pasan a INVOKER en MySQL y SECURITY DEFINER se rechaza en PostgreSQL', () => {
    const v = revisarSql('CREATE SQL SECURITY DEFINER VIEW v AS select 1;', 'mysql', {
      origen: 'importada',
    });
    expect(v[0]!.texto).toContain('SQL SECURITY INVOKER');
    const pg = 'CREATE FUNCTION f() RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;';
    expect(() => revisarSql(pg, 'postgresql', { origen: 'importada' })).toThrow();
    expect(revisarSql(pg, 'postgresql', { origen: 'propia' })).toHaveLength(1);
  });

  it('el cuerpo con dólares de PostgreSQL no se parte por sus ;', () => {
    const s = revisarSql(
      'CREATE FUNCTION f() RETURNS int LANGUAGE plpgsql AS $f$ BEGIN RETURN 1; END; $f$;',
      'postgresql',
    );
    expect(s).toHaveLength(1);
  });
});

/* ───────────── Restauración con privilegios mínimos ───────────── */

let dir: string;
let rutas: Rutas;
interface Consulta {
  usuario: string;
  sql: string;
}
let consultas: Consulta[];
let eventos: string[];
let ejecutados: { cmd: string; args: string[] }[];
let lanzados: { args: string[]; env: Record<string, string>; lista: string | null }[];
let falloEn: string | null;
let tablas: boolean;
let listaPg: string;
let sqlPg: string;
let codigoPg: number;

const estado = (id: string, version: string): EstadoServicio =>
  ({ id, nombre: id, version, estado: 'encendido', puertos: [1], pid: 1 }) as EstadoServicio;

function crearArchivo(rel: string): void {
  const p = path.join(rutas.base, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, '');
}

function armar(): Respaldos {
  const exec: Ejecutor = async (cmd, args) => {
    ejecutados.push({ cmd, args });
    if (args.includes('-l')) return { codigo: 0, stdout: listaPg, stderr: '' };
    if (args.includes('-f')) return { codigo: 0, stdout: sqlPg, stderr: '' };
    return { codigo: 0, stdout: '', stderr: '' };
  };
  const lanzar: Lanzador = async (_cmd, args, opts) => {
    const i = args.indexOf('-L');
    lanzados.push({
      args,
      env: (opts?.env ?? {}) as Record<string, string>,
      lista: i >= 0 ? readFileSync(args[i + 1]!, 'utf8') : null,
    });
    eventos.push('pg_restore');
    if (codigoPg !== 0) opts?.alLinea?.('pg_restore: error: could not execute query', 'stderr');
    return { codigo: codigoPg };
  };
  const deps: DepsRespaldos = {
    bd: {
      conexion: async (m: string) => ({
        host: '127.0.0.1',
        puerto: m === 'postgresql' ? 5432 : 3306,
        usuario: m === 'postgresql' ? 'postgres' : 'root',
        clave: 'ClaveAdmin#1',
      }),
      crear: async () => ({ usuarioActualizado: false }),
      tieneTablas: async () => tablas,
      usuarioTemporal: async (_o: string, base: string) => {
        eventos.push(`crear-usuario:${base}`);
        return {
          usuario: 'wolf_tmp_0123456789abcdef',
          clave: 'ClaveTmp#2',
          retirar: async () => void eventos.push('retirar-usuario'),
        };
      },
      reiniciarBase: async () => void eventos.push('reiniciar-base'),
      crearExtension: async (_b: string, nombre: string) =>
        void eventos.push(`extension:${nombre}`),
    } as never,
    servicios: {
      estados: async () => [estado('mysql', '8.4.3'), estado('postgresql', '17.2')],
    },
    rutas,
    exec,
    lanzar,
    plataforma: { carpetaDocumentos: async () => dir },
    fabricas: {
      mysql: (async (c: { usuario: string }) => ({
        query: async (sql: string) => {
          consultas.push({ usuario: c.usuario, sql });
          if (falloEn && sql.includes(falloEn)) throw new Error('ERROR 1142 permiso denegado');
          return [[]];
        },
        end: async () => undefined,
      })) as never,
    },
  };
  return new Respaldos(deps);
}

function archivo(nombre: string, contenido: string | Buffer): string {
  const p = path.join(dir, nombre);
  writeFileSync(p, contenido);
  return p;
}

const PGDMP = Buffer.concat([Buffer.from('PGDMP'), Buffer.from([1, 16, 0, 4, 8, 1, 1, 1])]);
const ESQUEMA_MYSQL = [
  '-- MySQL dump 10.13',
  'CREATE TABLE `usuarios` (`id` int NOT NULL);',
  'DELIMITER ;;',
  '/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg` BEFORE INSERT ON `usuarios` FOR EACH ROW BEGIN SET NEW.id = 1; END */;;',
  'DELIMITER ;',
].join('\n');

beforeEach(async () => {
  dir = await carpetaTemporal('pel-esq-');
  rutas = new Rutas(path.join(dir, 'base'));
  crearArchivo(`bin/mysql/8.4.3/bin/${nombreEjecutable('mysql')}`);
  crearArchivo(`bin/postgresql/17.2/pgsql/bin/${nombreEjecutable('pg_restore')}`);
  consultas = [];
  eventos = [];
  ejecutados = [];
  lanzados = [];
  falloEn = null;
  tablas = false;
  codigoPg = 0;
  listaPg = [
    ';',
    '; Archive created',
    '3079; 3079 16385 EXTENSION - pgcrypto',
    '4165; 0 0 COMMENT - EXTENSION pgcrypto',
    '3079; 3079 11 EXTENSION - plpgsql',
    '215; 1259 16400 TABLE public extension postgres',
    '216; 1259 16401 TABLE public usuarios postgres',
  ].join('\n');
  sqlPg = 'SET statement_timeout = 0;\nCREATE TABLE public.usuarios (id integer NOT NULL);\n';
});

describe('Respaldos.restaurarEsquema: MySQL y MariaDB', () => {
  it('ejecuta cada sentencia como el usuario temporal, sin DEFINER, y lo borra al terminar', async () => {
    const a = archivo('e.sql', ESQUEMA_MYSQL);
    const r = await armar().restaurarEsquema('mysql', a, 'tienda');
    expect(r.advertencias).toEqual([]);
    const limitado = consultas.filter((c) => c.usuario === 'wolf_tmp_0123456789abcdef');
    expect(limitado[0]!.sql).toBe('USE `tienda`');
    expect(limitado.map((c) => c.sql).join('\n')).not.toMatch(/DEFINER=/);
    expect(limitado.some((c) => c.sql.includes('TRIGGER `trg`'))).toBe(true);
    expect(consultas.every((c) => c.usuario !== 'root' || !c.sql.includes('CREATE TABLE'))).toBe(
      true,
    );
    expect(eventos).toEqual(['crear-usuario:tienda', 'retirar-usuario']);
  });

  it('propia: los disparadores se vuelven a crear como administrador (el definer temporal ya no existe)', async () => {
    await armar().restaurarEsquema('mysql', archivo('e.sql', ESQUEMA_MYSQL), 'tienda', {
      origen: 'propia',
    });
    const admin = consultas.filter((c) => c.usuario === 'root').map((c) => c.sql);
    expect(admin).toContain('DROP TRIGGER IF EXISTS `trg`');
    expect(admin.some((s) => s.startsWith('CREATE') && s.includes('TRIGGER `trg`'))).toBe(true);
  });

  it('importada con un disparador: se rechaza antes de crear el usuario (corre con privilegios ajenos)', async () => {
    await expect(
      armar().restaurarEsquema('mysql', archivo('e.sql', ESQUEMA_MYSQL), 'tienda', {
        origen: 'importada',
      }),
    ).rejects.toMatchObject({ codigo: 'bd.sql_no_permitido' });
    expect(eventos).toEqual([]);
    expect(consultas).toEqual([]);
  });

  it.each(MALAS_MYSQL)(
    '%s: se rechaza antes de crear el usuario y sin ninguna consulta',
    async (_n, sql) => {
      const a = archivo('malo.sql', `CREATE TABLE t (a int);\n${sql}`);
      await expect(armar().restaurarEsquema('mysql', a, 'tienda')).rejects.toMatchObject({
        codigo: 'bd.sql_no_permitido',
      });
      expect(eventos).toEqual([]);
      expect(consultas).toEqual([]);
    },
  );

  it('todo o nada: ante el primer error la base queda vacía, el usuario se borra y no sigue', async () => {
    falloEn = 'CREATE TABLE `b`';
    const a = archivo(
      'e.sql',
      'CREATE TABLE `a` (x int);\nCREATE TABLE `b` (x int);\nCREATE TABLE `c` (x int);',
    );
    await expect(armar().restaurarEsquema('mysql', a, 'tienda')).rejects.toMatchObject({
      codigo: 'bd.esquema_fallo',
    });
    expect(consultas.some((c) => c.sql.includes('`c`'))).toBe(false);
    expect(eventos).toEqual(['crear-usuario:tienda', 'reiniciar-base', 'retirar-usuario']);
  });

  it('una base con tablas no se toca', async () => {
    tablas = true;
    await expect(
      armar().restaurarEsquema('mysql', archivo('e.sql', ESQUEMA_MYSQL), 'tienda'),
    ).rejects.toThrow(/ya tiene tablas/);
    expect(eventos).toEqual([]);
    expect(consultas).toEqual([]);
  });

  it('un respaldo de PostgreSQL no entra en MySQL', async () => {
    await expect(
      armar().restaurarEsquema('mysql', archivo('e.dump', PGDMP), 'tienda'),
    ).rejects.toThrow(/PostgreSQL/);
    expect(eventos).toEqual([]);
  });
});

describe('Respaldos.restaurarEsquema: PostgreSQL', () => {
  it('pg_restore como el rol temporal, en una transacción, sin --role y sin las entradas EXTENSION', async () => {
    const r = await armar().restaurarEsquema('postgresql', archivo('e.dump', PGDMP), 'api');
    expect(r.advertencias).toEqual([]);
    const l = lanzados[0]!;
    expect(l.args).toEqual(
      expect.arrayContaining([
        '--exit-on-error',
        '--single-transaction',
        '--no-owner',
        '--no-privileges',
      ]),
    );
    expect(l.args.some((x) => x === '--role' || x.startsWith('--role='))).toBe(false);
    expect(l.args).not.toContain('--force');
    expect(l.args[l.args.indexOf('-U') + 1]).toBe('wolf_tmp_0123456789abcdef');
    expect(l.env.PGPASSWORD).toBe('ClaveTmp#2');
    expect(l.lista).not.toMatch(/EXTENSION/);
    expect(l.lista).toContain('TABLE public usuarios');
    // La tabla llamada "extension" no se confunde con una extensión.
    expect(l.lista).toContain('TABLE public extension');
    expect(eventos).toEqual([
      'extension:pgcrypto',
      'crear-usuario:api',
      'pg_restore',
      'retirar-usuario',
    ]);
  });

  it('pg_restore reciente: las líneas \\restrict y \\unrestrict con la misma clave no estorban', async () => {
    const clave = 'AbCdEf0123456789';
    const base = sqlPg;
    sqlPg = ['\\restrict ' + clave, base, '\\unrestrict ' + clave, ''].join('\n');
    await armar().restaurarEsquema('postgresql', archivo('e.dump', PGDMP), 'api');
    expect(lanzados).toHaveLength(1);
    sqlPg = ['\\restrict ' + clave, base, '\\! calc.exe', ''].join('\n');
    await expect(
      armar().restaurarEsquema('postgresql', archivo('f.dump', PGDMP), 'api'),
    ).rejects.toMatchObject({ codigo: 'bd.sql_no_permitido' });
  });

  it('una extensión fuera de la lista permitida no restaura nada', async () => {
    listaPg += '\n3080; 3080 16500 EXTENSION - file_fdw';
    await expect(
      armar().restaurarEsquema('postgresql', archivo('e.dump', PGDMP), 'api'),
    ).rejects.toMatchObject({ codigo: 'bd.extension_no_permitida', datos: { nombre: 'file_fdw' } });
    expect(eventos).toEqual([]);
    expect(lanzados).toEqual([]);
  });

  it.each(MALAS_PG)(
    '%s en el SQL del respaldo: se rechaza sin crear el rol ni restaurar',
    async (_n, sql) => {
      sqlPg += sql;
      await expect(
        armar().restaurarEsquema('postgresql', archivo('e.dump', PGDMP), 'api'),
      ).rejects.toMatchObject({ codigo: 'bd.sql_no_permitido' });
      expect(eventos).toEqual([]);
      expect(lanzados).toEqual([]);
    },
  );

  it('si pg_restore falla, el rol se borra y el error dice que no quedó nada a medias', async () => {
    codigoPg = 1;
    await expect(
      armar().restaurarEsquema('postgresql', archivo('e.dump', PGDMP), 'api'),
    ).rejects.toMatchObject({ codigo: 'bd.esquema_fallo' });
    expect(eventos).toEqual([
      'extension:pgcrypto',
      'crear-usuario:api',
      'pg_restore',
      'retirar-usuario',
    ]);
  });

  it('un .sql de MySQL no entra en PostgreSQL y un texto plano de PostgreSQL pide un .dump', async () => {
    await expect(
      armar().restaurarEsquema(
        'postgresql',
        archivo('e.sql', '-- MySQL dump 10.13\nCREATE TABLE t (a int);'),
        'api',
      ),
    ).rejects.toThrow(/MySQL/);
    await expect(
      armar().restaurarEsquema(
        'postgresql',
        archivo('p.sql', '-- PostgreSQL database dump\nSELECT 1;'),
        'api',
      ),
    ).rejects.toMatchObject({ codigo: 'bd.esquema_fallo' });
  });
});

describe('R3: el lector de SQL', () => {
  it('a$q$ es parte de un identificador: no abre una cadena que esconda SECURITY/**/DEFINER', () => {
    const sql =
      'CREATE TABLE a$q$ (x int);\n' +
      'CREATE FUNCTION f() RETURNS int LANGUAGE sql SECURITY/**/DEFINER AS $$ select 1 $$;\n' +
      'CREATE TABLE b$q$ (y int);';
    expect(() => revisarSql(sql, 'postgresql', { origen: 'importada' })).toThrowError(
      expect.objectContaining({ codigo: 'bd.sql_no_permitido' }),
    );
    // Sin el truco, un $$ de verdad sigue abriendo una cadena.
    expect(
      revisarSql('CREATE FUNCTION f() RETURNS int LANGUAGE sql AS $$ select 1; $$;', 'postgresql'),
    ).toHaveLength(1);
  });

  it('quita exactamente \\restrict y \\unrestrict con la misma clave; otro meta-comando sigue rechazado', () => {
    const clave = 'AbCdEf0123456789';
    const sql = `\\restrict ${clave}\nSET statement_timeout = 0;\nCREATE TABLE t (a int);\n\\unrestrict ${clave}\n`;
    expect(revisarSql(quitarRestrict(sql), 'postgresql')).toHaveLength(2);
    expect(() => revisarSql(sql, 'postgresql')).toThrow();
    const otro = `\\restrict ${clave}\nCREATE TABLE t (a int);\n\\unrestrict OtraClave99999\n`;
    expect(() => revisarSql(quitarRestrict(otro), 'postgresql')).toThrow();
    const extra = `\\restrict ${clave}\n\\! calc.exe\nCREATE TABLE t (a int);\n\\unrestrict ${clave}\n`;
    expect(() => revisarSql(quitarRestrict(extra), 'postgresql')).toThrow();
  });

  it('DEFINER, AUTO_INCREMENT y /*! se tratan fuera de las comillas: las cadenas quedan intactas', () => {
    const sql =
      "CREATE TABLE t (c varchar(60) DEFAULT 'DEFINER=x@y AUTO_INCREMENT=5 /*!50000 DROP DATABASE z */', d text COMMENT 'a   b') ENGINE=InnoDB AUTO_INCREMENT=77;";
    const [s] = revisarSql(sql, 'mysql');
    expect(s!.texto).toContain("'DEFINER=x@y AUTO_INCREMENT=5 /*!50000 DROP DATABASE z */'");
    expect(s!.texto).toContain("'a   b'");
    expect(quitarAutoIncrement(sql)).not.toMatch(/=77/);
    expect(quitarAutoIncrement(sql)).toContain('AUTO_INCREMENT=5');
    expect(quitarDefiner('CREATE DEFINER=`root`@`localhost` PROCEDURE p() BEGIN END')).not.toMatch(
      /DEFINER/,
    );
    expect(
      quitarDefiner("-- DEFINER=a@b\nCREATE TABLE t (c text DEFAULT 'DEFINER=q@w');"),
    ).toContain("'DEFINER=q@w'");
  });

  it('un comentario condicional peligroso se desenvuelve y se rechaza, uno en una cadena no', () => {
    expect(() => revisarSql('/*!50000 DROP DATABASE otra */;', 'mysql')).toThrow();
    expect(() =>
      revisarSql('CREATE TABLE t (a int) /*!50100 PARTITION BY HASH (a) */;', 'mysql'),
    ).not.toThrow();
  });

  it('PostgreSQL acepta CREATE STATISTICS y CREATE TEXT SEARCH', () => {
    const sql =
      'CREATE STATISTICS s1 (dependencies) ON a, b FROM t;\n' +
      'CREATE TEXT SEARCH CONFIGURATION public.es (COPY = pg_catalog.spanish);\n' +
      'ALTER TEXT SEARCH CONFIGURATION public.es ALTER MAPPING FOR word WITH simple;';
    expect(revisarSql(sql, 'postgresql')).toHaveLength(3);
  });

  it('MySQL importada: vistas y rutinas pasan a INVOKER y un disparador no se acepta', () => {
    const v = revisarSql('CREATE VIEW v AS select 1;', 'mysql', { origen: 'importada' });
    expect(v[0]!.texto).toMatch(/SQL SECURITY INVOKER VIEW/);
    const f = revisarSql('CREATE FUNCTION f(a int) RETURNS int DETERMINISTIC RETURN a;', 'mysql', {
      origen: 'importada',
    });
    expect(f[0]!.texto).toMatch(/RETURNS int SQL SECURITY INVOKER DETERMINISTIC/);
    const rutina = [
      'DELIMITER ;;',
      'CREATE PROCEDURE p(IN a int) BEGIN SELECT a; END;;',
      'DELIMITER ;',
    ].join('\n');
    const p = revisarSql(rutina, 'mysql', {
      origen: 'importada',
    });
    expect(p[0]!.texto).toMatch(/\) SQL SECURITY INVOKER BEGIN/);
    expect(() =>
      revisarSql('CREATE TRIGGER t BEFORE INSERT ON x FOR EACH ROW SET NEW.a = 1;', 'mysql', {
        origen: 'importada',
      }),
    ).toThrow();
    expect(() =>
      revisarSql('CREATE TRIGGER t BEFORE INSERT ON x FOR EACH ROW SET NEW.a = 1;', 'mysql'),
    ).not.toThrow();
  });
});

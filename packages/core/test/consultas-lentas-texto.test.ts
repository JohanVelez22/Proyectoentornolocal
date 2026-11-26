import { describe, expect, it } from 'vitest';
import { normalizarSql, MAX_SQL_NORMALIZADO } from '../src/bd/consultasLentas/normalizar';
import { parsearMysql, parsearPostgres } from '../src/bd/consultasLentas/parseo';

describe('normalizarSql', () => {
  it('cambia cadenas y números por ?', () => {
    const r = normalizarSql(
      "SELECT * FROM clientes WHERE correo = 'ficticio@ejemplo.invalid' AND edad > 30 AND t = 1.5e3",
      'mysql',
    );
    expect(r).toBe('SELECT * FROM clientes WHERE correo = ? AND edad > ? AND t = ?');
  });

  it('entiende comillas dobladas y escapes con barra en MySQL', () => {
    expect(normalizarSql("SELECT 'it''s', 'a\\'b' FROM t", 'mysql')).toBe('SELECT ? FROM t');
  });

  it('en PostgreSQL la comilla doble es un identificador y la barra no escapa', () => {
    expect(
      normalizarSql('SELECT "Nombre" FROM "Clientes" WHERE a = \'x\\\' AND b = 2', 'postgresql'),
    ).toBe('SELECT "Nombre" FROM "Clientes" WHERE a = ? AND b = ?');
  });

  it('en MySQL la comilla doble es una cadena y la comilla inversa un identificador', () => {
    expect(normalizarSql('SELECT `a b` FROM t WHERE c = "secreto"', 'mysql')).toBe(
      'SELECT `a b` FROM t WHERE c = ?',
    );
  });

  it('no toca identificadores con cifras ni parámetros $1', () => {
    expect(normalizarSql('SELECT col2 FROM t1 WHERE id = $1 AND x = 42', 'postgresql')).toBe(
      'SELECT col2 FROM t1 WHERE id = $1 AND x = ?',
    );
  });

  it('cadenas con dólares de PostgreSQL y comentarios', () => {
    expect(
      normalizarSql(
        "SELECT $q$ dato 'x' $q$, 1 -- nota con datos\n FROM t /* otro dato */",
        'postgresql',
      ),
    ).toBe('SELECT ? FROM t');
  });

  it('hexadecimales y listas IN se reducen', () => {
    expect(normalizarSql('SELECT * FROM t WHERE a IN (1, 2, 3) AND b = 0xFF', 'mysql')).toBe(
      'SELECT * FROM t WHERE a IN (?) AND b = ?',
    );
  });

  it('una cadena sin cerrar (log cortado) se sustituye entera', () => {
    expect(normalizarSql("SELECT * FROM t WHERE a = 'dato sin cerrar", 'mysql')).toBe(
      'SELECT * FROM t WHERE a = ?',
    );
  });

  it('no deja pasar ningún literal y no se cuelga con entradas hostiles', () => {
    const t0 = Date.now();
    const r = normalizarSql("'" + "''".repeat(50_000) + ' ' + '?, '.repeat(20_000) + '?', 'mysql');
    expect(Date.now() - t0).toBeLessThan(2000);
    expect(r.length).toBeLessThanOrEqual(MAX_SQL_NORMALIZADO + 1);
  });
});

const SLOW_MYSQL = [
  'C:\\falso\\mysqld.exe, Version: 8.4.0 (MySQL). started with:',
  'Tcp port: 3306  Unix socket: (null)',
  'Time                 Id Command    Argument',
  '# Time: 2026-11-26T10:00:00.123456Z',
  '# User@Host: root[root] @ localhost [127.0.0.1]  Id:     8',
  '# Query_time: 2.500000  Lock_time: 0.000100 Rows_sent: 1  Rows_examined: 123456',
  'use tienda_falsa;',
  'SET timestamp=1790000000;',
  "SELECT * FROM pedidos WHERE cliente = 'cliente-falso';",
  '# Time: 2026-11-26T10:00:05.000000Z',
  '# User@Host: root[root] @ localhost [127.0.0.1]  Id:     9',
  '# Query_time: 0.300000  Lock_time: 0.000000 Rows_sent: 0  Rows_examined: 10',
  'SET timestamp=1790000005;',
  'SELECT 1',
  'FROM dual;',
].join('\n');

describe('parsearMysql', () => {
  it('lee duración, filas, base, fecha y SQL (la base se hereda del último use)', () => {
    const r = parsearMysql(SLOW_MYSQL);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({
      duracionMs: 2500,
      filasExaminadas: 123456,
      base: 'tienda_falsa',
      fecha: '2026-11-26T10:00:00.123456Z',
      sql: "SELECT * FROM pedidos WHERE cliente = 'cliente-falso'",
    });
    expect(r[1]).toMatchObject({
      duracionMs: 300,
      base: 'tienda_falsa',
      sql: 'SELECT 1\nFROM dual',
    });
  });

  it('una entrada sin base conocida queda con base null (cola de un archivo cortado)', () => {
    const r = parsearMysql(SLOW_MYSQL.split('\n').slice(9).join('\n'));
    expect(r).toHaveLength(1);
    expect(r[0]!.base).toBeNull();
  });

  it('formato de MariaDB: Schema y hora corta', () => {
    const r = parsearMysql(
      [
        '# Time: 261126 10:00:00',
        '# User@Host: root[root] @ localhost [127.0.0.1]',
        '# Thread_id: 5  Schema: otra_falsa  QC_hit: No',
        '# Query_time: 1.250000  Lock_time: 0.000000  Rows_sent: 1  Rows_examined: 5',
        'SET timestamp=1790000000;',
        'SELECT SLEEP(1);',
      ].join('\n'),
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({
      base: 'otra_falsa',
      fecha: '2026-11-26 10:00:00',
      duracionMs: 1250,
    });
  });
});

describe('parsearPostgres', () => {
  const log = [
    '2026-11-26 10:00:00.123 CST [4321] db=tienda_falsa LOG:  duration: 1500.250 ms  statement: SELECT *',
    '\tFROM pedidos',
    "\tWHERE cliente = 'cliente-falso'",
    '2026-11-26 10:00:01.000 CST [4321] db=tienda_falsa LOG:  checkpoint starting: time',
    '2026-11-26 10:00:02.000 CST [4322] db=[unknown] LOG:  duration: 300.000 ms  execute <unnamed>: SELECT 2',
    "2026-11-26 10:00:02.000 CST [4322] db=[unknown] DETAIL:  parameters: $1 = 'dato-falso'",
    '2026-11-26 10:00:03.000 CST [4323] LOG:  duration: 12.000 ms  statement: SELECT 3 -- db=intruso',
  ].join('\n');

  it('lee duración, base y fecha; une las líneas de continuación y no toca otras líneas', () => {
    const r = parsearPostgres(log);
    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({
      duracionMs: 1500.25,
      base: 'tienda_falsa',
      fecha: '2026-11-26 10:00:00.123',
      filasExaminadas: null,
      sql: "SELECT *\nFROM pedidos\nWHERE cliente = 'cliente-falso'",
    });
    expect(r[1]!.base).toBeNull();
  });

  it('el texto de la consulta no puede falsificar la base', () => {
    expect(parsearPostgres(log)[2]!.base).toBeNull();
  });
});

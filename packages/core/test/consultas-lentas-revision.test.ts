import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { rutaLogLento } from '../src/bd/consultasLentas/ajustes';
import { ConsultasLentas } from '../src/bd/consultasLentas/consultasLentas';
import { normalizarSql } from '../src/bd/consultasLentas/normalizar';
import { parsearMysql, parsearPostgres } from '../src/bd/consultasLentas/parseo';
import { ErrorWolf } from '../src/errores';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

// Correcciones de la revisión de seguridad de D45b: política «ante la duda, ocultar».
// Todos los valores son falsos a propósito.

const estricto = { estricto: true };

describe('normalizarSql: casos concretos (todos los servidores)', () => {
  it('E-strings de PostgreSQL con escapes: el literal entero pasa a ?', () => {
    expect(normalizarSql("UPDATE u SET n = E'linea\\'s X_REAL' WHERE id = 1", 'postgresql')).toBe(
      'UPDATE u SET n = ? WHERE id = ?',
    );
    expect(normalizarSql("SELECT e'a\\'b X_REAL'", 'postgresql')).toBe('SELECT ?');
  });

  it('0b, 0o, 0x y 1_000 pasan a ?', () => {
    expect(normalizarSql('SELECT 0b1011, 0o17, 1_000_000, 0xFF FROM t', 'postgresql')).toBe(
      'SELECT ? FROM t',
    );
    expect(normalizarSql('SELECT * FROM t WHERE f = 0b1011 AND g = 0xFF', 'mysql')).toBe(
      'SELECT * FROM t WHERE f = ? AND g = ?',
    );
    expect(normalizarSql('SELECT 1_000_000 + 2', 'mysql')).toBe('SELECT ? + ?');
  });

  it('PostgreSQL anida /* */: nada del comentario sobrevive', () => {
    expect(normalizarSql('SELECT /* a /* b */ X_REAL */ 1', 'postgresql')).toBe('SELECT ?');
  });

  it('un identificador sin cerrar no se copia: se trata como fallo (null)', () => {
    expect(normalizarSql("SELECT `a FROM t WHERE p='X_REAL'", 'mysql')).toBeNull();
    expect(normalizarSql("SELECT \"a FROM t WHERE p='X_REAL'", 'postgresql')).toBeNull();
  });

  it('sigue normalizando lo normal', () => {
    expect(normalizarSql("SELECT `a b` FROM t WHERE c = 'x' AND d IN (1,2)", 'mysql')).toBe(
      'SELECT `a b` FROM t WHERE c = ? AND d IN (?)',
    );
  });
});

describe('normalizarSql: modo estricto (servidor con datosReales)', () => {
  const nulos: [string, 'mysql' | 'postgresql'][] = [
    ["SELECT 'abc X_REAL", 'mysql'], // cadena sin cerrar
    ['SELECT `abc X_REAL', 'mysql'], // identificador sin cerrar
    ['SELECT 1 /* abc X_REAL', 'mysql'], // comentario sin cerrar
    ["SELECT 1 FROM t WHERE x = 'C:\\' , 'X_REAL' --", 'mysql'], // NO_BACKSLASH_ESCAPES
    ["SELECT 'a\\'b X_REAL'", 'mysql'], // \ delante de una comilla
    ["SELECT 'a\\'b X_REAL'", 'postgresql'],
    ["SELECT E'a\\'b X_REAL'", 'postgresql'], // prefijo E
    ["SELECT e'abc'", 'postgresql'],
    ["SELECT X'41'", 'mysql'], // prefijo X
    ["SELECT B'101'", 'postgresql'], // prefijo B
    ["SELECT N'abc'", 'mysql'], // prefijo N
    ['SELECT $tag$X_REAL$tag$', 'postgresql'], // cadena con dólares
    ['SELECT $$X_REAL$$', 'postgresql'],
    ['SELECT 12abc FROM t', 'mysql'], // dígitos seguidos de letras
    ['SELECT 1_x FROM t', 'postgresql'], // dígitos seguidos de _
    ['SELECT /* a /* b */ X_REAL */ 1', 'postgresql'], // comentario anidado
  ];
  for (const [sql, d] of nulos) {
    it(`${d}: ${sql} -> null`, () => {
      expect(normalizarSql(sql, d, estricto)).toBeNull();
    });
  }

  it('una consulta limpia sale igual que en el modo normal', () => {
    const q = 'SELECT a, "b" FROM t WHERE c = \'x\' AND d = 4 -- nota';
    expect(normalizarSql(q, 'postgresql', estricto)).toBe(
      'SELECT a, "b" FROM t WHERE c = ? AND d = ?',
    );
    expect(normalizarSql('SELECT * FROM t WHERE c = "x" # n', 'mysql', estricto)).toBe(
      'SELECT * FROM t WHERE c = ?',
    );
  });
});

const CAB = (extra: string[] = []): string[] => [
  '# Time: 2026-11-26T10:00:00.000000Z',
  '# User@Host: root[root] @ localhost [127.0.0.1]  Id: 8',
  '# Query_time: 2.000000  Lock_time: 0.000000 Rows_sent: 0  Rows_examined: 0',
  ...extra,
];

describe('parsearMysql: metadatos solo en la cabecera', () => {
  it('un INSERT cuyo texto contiene «# Schema:» no cambia la base', () => {
    const r = parsearMysql(
      [
        ...CAB(['use base_a;', 'SET timestamp=1790000000;']),
        "INSERT INTO n (t) VALUES ('linea1",
        '# Schema: pruebas',
        "dato falso');",
      ].join('\n'),
    );
    expect(r).toHaveLength(1);
    expect(r[0]!.base).toBe('base_a');
    expect(r[0]!.sql).toContain('# Schema: pruebas');
  });

  it('use y SET timestamp dentro del SQL son SQL, no metadatos', () => {
    const r = parsearMysql(
      [
        ...CAB(['use base_a;']),
        "SELECT 'x",
        'use base_b;',
        'SET timestamp=1;',
        "y';",
        ...CAB(),
        'SELECT 2;',
      ].join('\n'),
    );
    expect(r[0]!.base).toBe('base_a');
    expect(r[0]!.sql).toContain('use base_b;');
    expect(r[0]!.sql).toContain('SET timestamp=1;');
  });

  it('una cadena con «# User@Host:» y «# Query_time:» no parte la entrada: ambas quedan dudosas', () => {
    const r = parsearMysql(
      [
        ...CAB(['use base_a;']),
        "INSERT INTO n (t) VALUES ('hola",
        '# User@Host: x[x] @ localhost []  Id: 9',
        '# Query_time: 9.000000  Lock_time: 0.000000 Rows_sent: 0  Rows_examined: 0',
        "dato falso 4111');",
      ].join('\n'),
    );
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((e) => e.dudosa === true)).toBe(true);
  });

  it('una entrada limpia no es dudosa y la siguiente tampoco', () => {
    const r = parsearMysql([...CAB(['use a;']), 'SELECT 1;', ...CAB(), 'SELECT 2;'].join('\n'));
    expect(r.map((e) => e.dudosa)).toEqual([false, false]);
  });

  it('una entrada que termina con una cadena sin cerrar y la siguiente: dudosas; la tercera no', () => {
    const r = parsearMysql(
      [...CAB(['use a;']), "SELECT 'sin cerrar", ...CAB(), 'SELECT 2;', ...CAB(), 'SELECT 3;'].join(
        '\n',
      ),
    );
    expect(r.map((e) => e.dudosa)).toEqual([true, true, false]);
  });
});

describe('parsearPostgres: sigue sin dudosas', () => {
  it('marca dudosa=false', () => {
    const r = parsearPostgres(
      '2026-11-26 10:00:00.000 CET [1] db=a LOG:  duration: 2000.1 ms  statement: SELECT 1',
    );
    expect(r[0]!.dudosa).toBe(false);
  });
});

// ---- ConsultasLentas: «Ver literal» se decide por servidor ----

let dir: string;
let rutas: Rutas;

beforeEach(async () => {
  dir = await carpetaTemporal('pel-lentas-rev-');
  rutas = new Rutas(dir);
  mkdirSync(rutas.logs(), { recursive: true });
});

function slow(base: string | null, sql: string, seg = '2'): string {
  return [
    ...CAB().map((l) => l.replace('2.000000', `${seg}.000000`)),
    ...(base ? [`use ${base};`] : []),
    'SET timestamp=1790000000;',
    sql + ';',
  ].join('\n');
}

function armar(o: {
  motor?: 'mysql' | 'postgresql';
  datosReales?: string[];
  bases?: string[];
  texto: string;
  listarFalla?: boolean;
}) {
  const motor = o.motor ?? 'mysql';
  const restringidas: string[] = [];
  const c = new ConsultasLentas({
    rutas,
    bd: {
      lentasEstado: async () => ({ activo: false, segundos: 1 }),
      lentasAplicar: async () => undefined,
      listar: async () => {
        if (o.listarFalla) throw new Error('apagado');
        return (o.bases ?? ['tienda_falsa', 'real_falsa', 'tienda real']).map((nombre) => ({
          nombre,
        }));
      },
    },
    ubicacion: async () => ({ servicio: motor, claveDatos: '8.4', log: rutas.logs('pg.log') }),
    esDatosReales: async (_o, base) => (o.datosReales ?? []).includes(base),
    restringir: async (ruta) => {
      restringidas.push(ruta);
      return true;
    },
    leerCola: async () => ({ texto: o.texto, recortado: false }),
  });
  return { c, restringidas };
}

describe('P1: el literal se decide por servidor', () => {
  it('ninguna base con datosReales: el literal se permite aunque la entrada no tenga base', async () => {
    const a = armar({ texto: slow(null, "SELECT 'valor-falso'") });
    const e = (await a.c.leer('mysql')).entradas[0]!;
    expect(e.literalPermitido).toBe(true);
    expect(await a.c.literal('mysql', e.id)).toBe("SELECT 'valor-falso'");
    const b = armar({ texto: slow('tienda_falsa', "SELECT 'valor-falso'") });
    expect((await b.c.leer('mysql')).entradas[0]!.literalPermitido).toBe(true);
  });

  it('con una base real en el servidor ninguna entrada ofrece literal, sea cual sea su atribución', async () => {
    const textos = [
      slow('tienda_falsa', "SELECT 'valor-falso-a'"), // base sin datos reales según `use`
      slow('tienda_falsa', "SELECT * FROM real_falsa.clientes WHERE e = 'valor-falso-b'"), // calificado
      slow(null, "SELECT 'valor-falso-c'"), // sin use
      slow('tienda real', "SELECT 'valor-falso-d'"), // nombre con espacios
      slow('no_existe', "SELECT 'valor-falso-e'"),
    ].join('\n');
    const a = armar({ texto: textos, datosReales: ['real_falsa'] });
    const r = await a.c.leer('mysql');
    expect(r.entradas).toHaveLength(5);
    for (const e of r.entradas) {
      expect(e.literalPermitido).toBe(false);
      await expect(a.c.literal('mysql', e.id)).rejects.toMatchObject({
        codigo: 'bd.lentas_literal_no_permitido',
      });
    }
    // la atribución sigue visible (informativa)
    const bases = r.entradas.map((e) => e.base);
    expect(bases).toContain('tienda_falsa');
    expect(bases).toContain('no_existe');
  });

  it('si no se puede listar las bases del servidor, se oculta', async () => {
    const a = armar({ texto: slow('tienda_falsa', "SELECT 'valor-falso'"), listarFalla: true });
    const e = (await a.c.leer('mysql')).entradas[0]!;
    expect(e.literalPermitido).toBe(false);
    await expect(a.c.literal('mysql', e.id)).rejects.toBeInstanceOf(ErrorWolf);
  });

  it('el mismo caso en PostgreSQL (db= del prefijo no decide nada)', async () => {
    const texto =
      "2026-11-26 10:00:00.000 CET [1] db=tienda_falsa LOG:  duration: 2000.1 ms  statement: SELECT * FROM real_falsa.c WHERE a = 'valor-falso'";
    const a = armar({ motor: 'postgresql', texto, datosReales: ['real_falsa'] });
    const e = (await a.c.leer('postgresql')).entradas[0]!;
    expect(e.literalPermitido).toBe(false);
    await expect(a.c.literal('postgresql', e.id)).rejects.toMatchObject({
      codigo: 'bd.lentas_literal_no_permitido',
    });
  });
});

describe('P2: modo estricto en el servidor con datosReales', () => {
  it('una anomalía deja sqlNormalizado en null y sin ningún literal', async () => {
    // La anómala va al final del archivo: la siguiente entrada a una dudosa también lo es.
    const a = armar({
      texto: [
        slow('tienda_falsa', 'SELECT 0b1011 FROM t', '3'),
        slow('tienda_falsa', 'SELECT 1 FROM t', '2'),
        slow('tienda_falsa', String.raw`SELECT 1 FROM t WHERE x = 'C:\' , 'X_REAL' --`, '1'),
      ].join('\n'),
      datosReales: ['real_falsa'],
    });
    const r = await a.c.leer('mysql');
    expect(JSON.stringify(r)).not.toContain('X_REAL');
    expect(r.entradas.map((e) => e.sqlNormalizado)).toEqual([
      'SELECT ? FROM t',
      'SELECT ? FROM t',
      null,
    ]);
  });

  it('una entrada dudosa del parser queda sin SQL (null) en modo estricto, con una cadena partida', async () => {
    const texto = [
      ...CAB(['use tienda_falsa;']),
      "INSERT INTO n (t) VALUES ('hola",
      '# User@Host: x[x] @ localhost []  Id: 9',
      '# Query_time: 9.000000  Lock_time: 0.000000 Rows_sent: 0  Rows_examined: 0',
      "Tarjeta 4111 1111 1111 1111 X_REAL');",
    ].join('\n');
    const a = armar({ texto, datosReales: ['real_falsa'] });
    const r = await a.c.leer('mysql');
    expect(r.entradas.length).toBeGreaterThan(0);
    expect(r.entradas.every((e) => e.sqlNormalizado === null)).toBe(true);
    expect(JSON.stringify(r)).not.toContain('X_REAL');
  });

  it('sin datos reales una entrada limpia se normaliza como siempre', async () => {
    const a = armar({ texto: slow('tienda_falsa', "SELECT * FROM t WHERE a = 'x'") });
    expect((await a.c.leer('mysql')).entradas[0]!.sqlNormalizado).toBe(
      'SELECT * FROM t WHERE a = ?',
    );
  });
});

describe('P4: el slow log queda fuera de logs/ y restringido', () => {
  it('rutaLogLento está en logs/lentas/ (no la recorre el visor de registros)', () => {
    const r = rutaLogLento(rutas, 'mysql', '8.4');
    expect(path.dirname(r)).toBe(path.resolve(rutas.logs('lentas')));
    expect(path.basename(r)).toMatch(/^mysql-8\.4\.log$/);
  });

  it('al activar se crea la carpeta restringida y se borra el archivo antiguo logs/lentas-*.log', async () => {
    const antiguo = rutas.logs('lentas-mysql-8.4.log');
    writeFileSync(antiguo, 'SQL antiguo falso');
    const a = armar({ texto: '' });
    await a.c.cambiar('mysql', { activo: true, confirmado: true });
    expect(existsSync(antiguo)).toBe(false);
    expect(a.restringidas).toContain(rutas.logs('lentas'));
    expect(existsSync(rutas.logs('lentas'))).toBe(true);
    // al desactivar también se limpia
    writeFileSync(antiguo, 'otra vez');
    await a.c.cambiar('mysql', { activo: false, confirmado: true });
    expect(existsSync(antiguo)).toBe(false);
  });
});

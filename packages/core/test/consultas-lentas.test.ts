import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { BasesDeDatos } from '../src/bd/basesDeDatos';
import { rutaAjuste, rutaLogLento } from '../src/bd/consultasLentas/ajustes';
import { ConsultasLentas } from '../src/bd/consultasLentas/consultasLentas';
import { ErrorWolf } from '../src/errores';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { contenidoIni } from '../src/servicios/bd/mysql';
import type { EstadoServicio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let dir: string;
let rutas: Rutas;

beforeEach(async () => {
  dir = await carpetaTemporal('pel-lentas-');
  rutas = new Rutas(dir);
  mkdirSync(rutas.logs(), { recursive: true });
});

const SLOW = (base: string | null, seg: string | number, sql: string, extra = ''): string =>
  [
    '# Time: 2026-11-26T10:00:00.000000Z',
    '# User@Host: root[root] @ localhost [127.0.0.1]  Id: 8',
    `# Query_time: ${seg}  Lock_time: 0.000000 Rows_sent: 1  Rows_examined: 99`,
    ...(base ? [`use ${base};`] : []),
    'SET timestamp=1790000000;',
    sql + ';',
    extra,
  ]
    .filter((x) => x !== '')
    .join('\n');

interface Llamada {
  activo: boolean;
  segundos: number;
  archivo: string;
}

function armar(opts: {
  motor?: 'mysql' | 'postgresql';
  gestionada?: boolean;
  datosReales?: string[];
  bases?: string[];
  texto?: string | null;
}) {
  const motor = opts.motor ?? 'mysql';
  const aplicadas: Llamada[] = [];
  const log = rutas.logs(motor === 'mysql' ? 'mysql.log' : 'postgresql.log');
  const estadoServidor = { activo: false, segundos: 1 as number | null };
  const c = new ConsultasLentas({
    rutas,
    bd: {
      lentasEstado: async () => ({ ...estadoServidor }),
      lentasAplicar: async (_o, a) => {
        aplicadas.push(a);
        estadoServidor.activo = a.activo;
        estadoServidor.segundos = a.segundos;
      },
      listar: async () =>
        (opts.bases ?? ['tienda_falsa', 'otra_falsa']).map((nombre) => ({ nombre })),
    },
    ubicacion: async () => {
      if (opts.gestionada === false)
        throw new ErrorWolf('servicios.no_instalado', 'no', { nombre: 'x' });
      return { servicio: motor, claveDatos: '8.4', log };
    },
    esDatosReales: async (_o, base) => (opts.datosReales ?? []).includes(base),
    restringir: async () => true,
    leerCola: async () =>
      opts.texto === null || opts.texto === undefined
        ? null
        : { texto: opts.texto, recortado: false },
  });
  return { c, aplicadas };
}

describe('activar y desactivar (cambio global)', () => {
  it('sin confirmado === true no toca nada', async () => {
    const { c, aplicadas } = armar({});
    for (const confirmado of [false, undefined, 'true', 1] as unknown[]) {
      await expect(
        c.cambiar('mysql', { activo: true, confirmado: confirmado as boolean }),
      ).rejects.toMatchObject({ codigo: 'bd.lentas_confirmar' });
    }
    expect(aplicadas).toHaveLength(0);
  });

  it('el umbral va de 0,1 a 60 s', async () => {
    const { c, aplicadas } = armar({});
    for (const segundos of [0.05, 61, Number.NaN, '1' as unknown as number]) {
      await expect(
        c.cambiar('mysql', { activo: true, segundos, confirmado: true }),
      ).rejects.toMatchObject({
        codigo: 'bd.lentas_umbral_invalido',
      });
    }
    expect(aplicadas).toHaveLength(0);
    await c.cambiar('mysql', { activo: true, segundos: 0.1, confirmado: true });
    await c.cambiar('mysql', { activo: true, segundos: 60, confirmado: true });
    expect(aplicadas.map((a) => a.segundos)).toEqual([0.1, 60]);
  });

  it('1 s por defecto, archivo en la carpeta de registros y ajuste persistente (MySQL)', async () => {
    const { c, aplicadas } = armar({});
    const e = await c.cambiar('mysql', { activo: true, confirmado: true });
    expect(aplicadas[0]).toEqual({
      activo: true,
      segundos: 1,
      archivo: rutaLogLento(rutas, 'mysql', '8.4'),
    });
    expect(path.dirname(aplicadas[0]!.archivo)).toBe(path.resolve(rutas.logs('lentas')));
    expect(JSON.parse(readFileSync(rutaAjuste(rutas, 'mysql', '8.4'), 'utf8'))).toEqual({
      activo: true,
      segundos: 1,
    });
    expect(e).toMatchObject({ gestionada: true, activo: true });
    await c.cambiar('mysql', { activo: false, confirmado: true });
    expect(JSON.parse(readFileSync(rutaAjuste(rutas, 'mysql', '8.4'), 'utf8')).activo).toBe(false);
  });

  it('solo en instancias gestionadas por WolfCore: un motor externo se rechaza', async () => {
    const { c, aplicadas } = armar({ gestionada: false });
    await expect(c.cambiar('mysql', { activo: true, confirmado: true })).rejects.toBeInstanceOf(
      ErrorWolf,
    );
    expect(aplicadas).toHaveLength(0);
    expect(await c.estado('mysql')).toMatchObject({ gestionada: false, activo: false });
  });

  it('MongoDB no tiene consultas lentas', async () => {
    const { c } = armar({});
    await expect(c.cambiar('mongodb', { activo: true, confirmado: true })).rejects.toMatchObject({
      codigo: 'bd.lentas_motor_no_soportado',
    });
    await expect(c.leer('mongodb')).rejects.toMatchObject({
      codigo: 'bd.lentas_motor_no_soportado',
    });
  });

  it('PostgreSQL no escribe archivo propio ni ajuste: ALTER SYSTEM ya persiste', async () => {
    const { c, aplicadas } = armar({ motor: 'postgresql' });
    await c.cambiar('postgresql', { activo: true, segundos: 2.5, confirmado: true });
    expect(aplicadas).toHaveLength(1);
    expect(() => readFileSync(rutaAjuste(rutas, 'postgresql', '8.4'))).toThrow();
  });
});

describe('leer', () => {
  it('ordena de la más lenta a la más rápida y entrega el SQL normalizado', async () => {
    const texto = [
      SLOW('tienda_falsa', '0.5', "SELECT * FROM a WHERE x = 'dato-falso-1'"),
      SLOW('tienda_falsa', '3.0', "SELECT * FROM b WHERE y = 'dato-falso-2'"),
      SLOW('tienda_falsa', '1.2', 'SELECT * FROM c WHERE z = 77'),
    ].join('\n');
    const { c } = armar({ texto });
    const r = await c.leer('mysql');
    expect(r.entradas.map((e) => e.duracionMs)).toEqual([3000, 1200, 500]);
    expect(r.entradas[0]).toMatchObject({
      sqlNormalizado: 'SELECT * FROM b WHERE y = ?',
      base: 'tienda_falsa',
      filasExaminadas: 99,
      literalPermitido: true,
    });
    expect(JSON.stringify(r)).not.toContain('dato-falso');
  });

  it('sin archivo dice sinArchivo', async () => {
    const { c } = armar({ texto: null });
    expect(await c.leer('mysql')).toEqual({ entradas: [], truncado: false, sinArchivo: true });
  });

  it('como mucho 500 entradas, marcando el recorte', async () => {
    const texto = Array.from({ length: 520 }, (_v, i) =>
      SLOW('tienda_falsa', String(1 + i / 1000), `SELECT ${i}`),
    ).join('\n');
    const { c } = armar({ texto });
    const r = await c.leer('mysql');
    expect(r.entradas).toHaveLength(500);
    expect(r.truncado).toBe(true);
  });

  it('lee la cola de PostgreSQL (líneas duration:)', async () => {
    const texto =
      "2026-11-26 10:00:00.000 CST [1] db=tienda_falsa LOG:  duration: 800.5 ms  statement: SELECT * FROM t WHERE a = 'dato-falso'\n";
    const { c } = armar({ motor: 'postgresql', texto });
    const r = await c.leer('postgresql');
    expect(r.entradas[0]).toMatchObject({
      duracionMs: 800.5,
      filasExaminadas: null,
      sqlNormalizado: 'SELECT * FROM t WHERE a = ?',
    });
  });
});

describe('«Ver literal» y datos reales', () => {
  const texto = [
    SLOW('tienda_falsa', '2', "SELECT * FROM a WHERE x = 'valor-falso-a'"),
    SLOW('otra_falsa', '3', "SELECT * FROM b WHERE y = 'valor-falso-b'"),
    SLOW('no_existe_falsa', '4', "SELECT * FROM c WHERE z = 'valor-falso-c'"),
  ].join('\n');

  it('un servidor sin bases de sitios con datosReales entrega el literal', async () => {
    const { c } = armar({ texto });
    const r = await c.leer('mysql');
    const ok = r.entradas.find((e) => e.base === 'tienda_falsa')!;
    expect(ok.literalPermitido).toBe(true);
    expect(await c.literal('mysql', ok.id)).toBe("SELECT * FROM a WHERE x = 'valor-falso-a'");
  });

  it('con una base de un sitio con datosReales en el servidor, ninguna entrada ofrece literal y el núcleo rechaza con un error del catálogo', async () => {
    const { c } = armar({ texto, datosReales: ['otra_falsa'] });
    const r = await c.leer('mysql');
    for (const e of r.entradas) {
      expect(e.literalPermitido).toBe(false);
      await expect(c.literal('mysql', e.id)).rejects.toMatchObject({
        codigo: 'bd.lentas_literal_no_permitido',
      });
    }
    // el SQL sigue saliendo normalizado
    expect(r.entradas.find((e) => e.base === 'otra_falsa')!.sqlNormalizado).toBe(
      'SELECT * FROM b WHERE y = ?',
    );
  });

  it('la atribución de la entrada es informativa: sin base o con una base desconocida no cambia el permiso', async () => {
    const { c } = armar({ texto });
    const r = await c.leer('mysql');
    const rara = r.entradas.find((e) => e.base === 'no_existe_falsa')!;
    expect(rara.literalPermitido).toBe(true);
    const sinBase = armar({ texto: SLOW(null, '2', "SELECT 'valor-falso-d'") });
    const e = (await sinBase.c.leer('mysql')).entradas[0]!;
    expect(e.base).toBeNull();
    expect(e.literalPermitido).toBe(true);
  });

  it('si no se puede saber si la base tiene datos reales, se rechaza', async () => {
    const { c } = armar({ texto: SLOW('tienda_falsa', '2', "SELECT 'valor-falso-e'") });
    (c as unknown as { d: { esDatosReales: () => Promise<boolean> } }).d.esDatosReales =
      async () => {
        throw new Error('ilegible');
      };
    const e = (await c.leer('mysql')).entradas[0]!;
    expect(e.literalPermitido).toBe(false);
  });

  it('un id que no existe da un error del catálogo', async () => {
    const { c } = armar({ texto });
    await expect(c.literal('mysql', 'ffffffffffffffff')).rejects.toMatchObject({
      codigo: 'bd.lentas_entrada_no_existe',
    });
  });
});

describe('configuración persistente de MySQL y MariaDB', () => {
  it('el my.ini lleva las tres variables solo cuando están activadas', () => {
    const apagado = contenidoIni('mysql', 'C:\\falso\\datos', 3306);
    expect(apagado).not.toContain('slow_query_log');
    const encendido = contenidoIni('mariadb', 'C:\\falso\\datos', 3307, {
      segundos: 0.5,
      archivo: 'C:\\falso\\logs\\lentas-mariadb-10.11.log',
    });
    expect(encendido).toContain('slow_query_log=1');
    expect(encendido).toContain('long_query_time=0.5');
    expect(encendido).toContain('slow_query_log_file="C:/falso/logs/lentas-mariadb-10.11.log"');
  });

  it('el ajuste se lee del archivo que escribe `cambiar`', async () => {
    const { c } = armar({});
    await c.cambiar('mysql', { activo: true, segundos: 2, confirmado: true });
    const t = JSON.parse(readFileSync(rutaAjuste(rutas, 'mysql', '8.4'), 'utf8'));
    expect(t).toEqual({ activo: true, segundos: 2 });
    writeFileSync(rutaAjuste(rutas, 'mysql', '8.4'), 'no es json');
  });
});

// ---- Los SQL que se mandan al servidor (clientes falsos) ----

const estado = (id: string, puerto: number): EstadoServicio =>
  ({
    id,
    nombre: id,
    version: '1',
    estado: 'encendido',
    puertos: [puerto],
    pid: 1,
  }) as EstadoServicio;

function bdFalsa(respuestas: (motor: string, sql: string) => unknown) {
  const sql: { motor: string; sql: string; params?: unknown[] }[] = [];
  const falsa = (motor: string) => async () => ({
    query: async (s: string, params?: unknown[]) => {
      sql.push({ motor, sql: s, params });
      const r = respuestas(motor, s);
      return motor === 'pg' ? { rows: r } : [r];
    },
    end: async () => undefined,
  });
  const exec: Ejecutor = async () => ({ codigo: 0, stdout: '', stderr: '' });
  const bd = new BasesDeDatos({
    servicios: { estados: async () => [estado('mysql', 3306), estado('postgresql', 5432)] },
    credenciales: { leer: async () => ({ usuario: 'x', clave: 'ClaveFalsa123' }) },
    rutas,
    exec,
    fabricas: { mysql: falsa('mysql') as never, postgres: falsa('pg') as never },
  });
  return { bd, sql };
}

describe('SQL de activación', () => {
  it('MySQL: SET GLOBAL con parámetros, en orden, y apagar solo apaga', async () => {
    const { bd, sql } = bdFalsa(() => []);
    await bd.lentasAplicar('mysql', {
      activo: true,
      segundos: 0.5,
      archivo: 'C:\\falso\\logs\\l.log',
    });
    const sets = sql.filter((s) => s.sql.startsWith('SET GLOBAL'));
    expect(sets.map((s) => s.sql)).toEqual([
      'SET GLOBAL slow_query_log_file = ?',
      'SET GLOBAL long_query_time = ?',
      'SET GLOBAL slow_query_log = 1',
    ]);
    expect(sets[0]!.params).toEqual(['C:/falso/logs/l.log']);
    expect(sets[1]!.params).toEqual([0.5]);
    sql.length = 0;
    await bd.lentasAplicar('mysql', { activo: false, segundos: 1, archivo: 'x' });
    expect(sql.map((s) => s.sql)).toEqual(['SET GLOBAL slow_query_log = 0']);
  });

  it('PostgreSQL: ALTER SYSTEM con un entero de milisegundos y pg_reload_conf; nunca otro ALTER', async () => {
    const { bd, sql } = bdFalsa(() => []);
    await bd.lentasAplicar('postgresql', { activo: true, segundos: 1.5, archivo: '' });
    expect(sql.map((s) => s.sql)).toEqual([
      'ALTER SYSTEM SET log_min_duration_statement = 1500',
      "ALTER SYSTEM SET log_line_prefix = '%m [%p] db=%d '",
      'SELECT pg_catalog.pg_reload_conf()',
    ]);
    sql.length = 0;
    await bd.lentasAplicar('postgresql', { activo: false, segundos: 1, archivo: '' });
    expect(sql[0]!.sql).toBe('ALTER SYSTEM RESET log_min_duration_statement');
  });

  it('leer el estado no cambia nada (solo SELECT)', async () => {
    const { bd, sql } = bdFalsa((_m, s) =>
      s.includes('pg_settings') ? [{ setting: '2500' }] : [{ activo: 1, segundos: '0.5' }],
    );
    expect(await bd.lentasEstado('postgresql')).toEqual({ activo: true, segundos: 2.5 });
    expect(await bd.lentasEstado('mysql')).toEqual({ activo: true, segundos: 0.5 });
    expect(sql.every((s) => s.sql.startsWith('SELECT'))).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BasesDeDatos } from '../src/bd/basesDeDatos';
import { MAX_TABLAS_ESQUEMA } from '../src/bd/esquema';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import type { EstadoServicio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let rutas: Rutas;
beforeEach(async () => {
  rutas = new Rutas(await carpetaTemporal('pel-esq2-'));
});

const estado = (id: string, puerto: number): EstadoServicio =>
  ({
    id,
    nombre: id,
    version: '1',
    estado: 'encendido',
    puertos: [puerto],
    pid: 1,
  }) as EstadoServicio;

interface Reg {
  motor: string;
  sql: string;
  params?: unknown[];
}

function armar(
  filas: (
    motor: string,
    sql: string,
  ) => Record<string, unknown>[] | Promise<Record<string, unknown>[]>,
  bases = ['tienda_falsa'],
) {
  const reg: Reg[] = [];
  const conectadas: unknown[] = [];
  const falsa = (motor: string) => async (c: unknown) => {
    conectadas.push({ motor, c });
    return {
      query: async (s: string, params?: unknown[]) => {
        reg.push({ motor, sql: s, params });
        let r: Record<string, unknown>[];
        if (s.includes('pg_database') || s.includes('information_schema.schemata')) {
          r = bases.map((nombre) => ({ nombre, tam: 0 }));
        } else r = await filas(motor, s);
        return motor === 'pg' ? { rows: r } : [r];
      },
      end: async () => undefined,
    };
  };
  const exec: Ejecutor = async () => ({ codigo: 0, stdout: '', stderr: '' });
  const bd = new BasesDeDatos({
    servicios: {
      estados: async () => [
        estado('mysql', 3306),
        estado('postgresql', 5432),
        estado('mongodb', 27017),
      ],
    },
    credenciales: { leer: async () => ({ usuario: 'x', clave: 'ClaveFalsa123' }) },
    rutas,
    exec,
    fabricas: { mysql: falsa('mysql') as never, postgres: falsa('pg') as never },
  });
  return { bd, reg, conectadas };
}

const mysqlFilas = (_m: string, s: string): Record<string, unknown>[] => {
  if (s.includes('information_schema.TABLES') && !s.includes('schema_name'))
    return [
      { nombre: 'pedidos', tipo: 'BASE TABLE' },
      { nombre: 'clientes', tipo: 'BASE TABLE' },
      { nombre: 'v_resumen', tipo: 'VIEW' },
    ];
  if (s.includes('information_schema.COLUMNS'))
    return [
      { tabla: 'clientes', nombre: 'id', tipo: 'bigint unsigned', nulo: 'NO', defecto: null },
      { tabla: 'clientes', nombre: 'estado', tipo: 'varchar(10)', nulo: 'YES', defecto: 'activo' },
      { tabla: 'pedidos', nombre: 'id', tipo: 'int', nulo: 'NO', defecto: null },
      {
        tabla: 'pedidos',
        nombre: 'cliente_id',
        tipo: 'bigint unsigned',
        nulo: 'NO',
        defecto: null,
      },
    ];
  if (s.includes('information_schema.STATISTICS'))
    return [
      { tabla: 'clientes', nombre: 'PRIMARY', no_unico: 0, columna: 'id' },
      { tabla: 'pedidos', nombre: 'PRIMARY', no_unico: 0, columna: 'id' },
      { tabla: 'pedidos', nombre: 'idx_cliente', no_unico: 1, columna: 'cliente_id' },
    ];
  if (s.includes('KEY_COLUMN_USAGE'))
    return [
      {
        tabla: 'pedidos',
        nombre: 'fk_cliente',
        columna: 'cliente_id',
        esquema_ref: 'tienda_falsa',
        tabla_ref: 'clientes',
        columna_ref: 'id',
        al_borrar: 'CASCADE',
        al_actualizar: 'RESTRICT',
      },
    ];
  return [];
};

describe('visor de esquema: MySQL y MariaDB', () => {
  it('arma tablas, columnas, PK, índices y relaciones entrantes y salientes', async () => {
    const { bd } = armar(mysqlFilas);
    const e = await bd.esquema('mysql', 'tienda_falsa');
    expect(e.truncado).toBe(false);
    expect(e.tablas.map((t) => t.nombre)).toEqual(['clientes', 'pedidos', 'v_resumen']);
    const clientes = e.tablas[0]!;
    expect(clientes.columnas).toEqual([
      { nombre: 'id', tipo: 'bigint unsigned', nulo: false, porDefecto: null, primaria: true },
      { nombre: 'estado', tipo: 'varchar(10)', nulo: true, porDefecto: 'activo', primaria: false },
    ]);
    expect(e.tablas[2]!.tipo).toBe('vista');
    const pedidos = e.tablas[1]!;
    expect(pedidos.indices.map((i) => [i.nombre, i.primario, i.unico])).toEqual([
      ['PRIMARY', true, true],
      ['idx_cliente', false, false],
    ]);
    expect(pedidos.clavesForaneas[0]).toMatchObject({
      nombre: 'fk_cliente',
      columnas: ['cliente_id'],
      destino: { esquema: 'tienda_falsa', tabla: 'clientes' },
      columnasDestino: ['id'],
      alBorrar: 'CASCADE',
    });
    expect(clientes.clavesEntrantes[0]).toMatchObject({
      origen: { tabla: 'pedidos' },
      columnasOrigen: ['cliente_id'],
      columnas: ['id'],
    });
  });

  it('solo metadatos: el nombre va como parámetro, nada de texto libre en el SQL, sesión en solo lectura', async () => {
    const { bd, reg } = armar(mysqlFilas);
    await bd.esquema('mysql', 'tienda_falsa');
    const propias = reg.filter((r) => !/schemata|schema_name/i.test(r.sql));
    expect(propias[0]!.sql).toBe('SET SESSION TRANSACTION READ ONLY');
    for (const r of propias) {
      expect(r.sql).not.toContain('tienda_falsa');
      expect(/^(SELECT|SET SESSION TRANSACTION READ ONLY)/.test(r.sql)).toBe(true);
      if (r.sql.startsWith('SELECT')) {
        expect(r.sql).toContain('information_schema.');
        expect(r.sql).toContain('= ?');
        expect(r.params![0]).toBe('tienda_falsa');
      }
    }
    // Ninguna consulta toca tablas de usuario.
    expect(reg.some((r) => /\bFROM\s+`?(pedidos|clientes)/i.test(r.sql))).toBe(false);
  });

  it('el nombre se valida contra la lista real de bases', async () => {
    const { bd, reg } = armar(mysqlFilas);
    for (const malo of ["x'; DROP TABLE y; --", 'otra_base', '', 'mysql']) {
      await expect(bd.esquema('mysql', malo)).rejects.toMatchObject({
        codigo: 'bd.esquema_base_no_existe',
      });
    }
    expect(reg.some((r) => r.sql.includes('information_schema.COLUMNS'))).toBe(false);
  });

  it('con más de 2000 tablas se recorta y se marca', async () => {
    const muchas = Array.from({ length: MAX_TABLAS_ESQUEMA + 1 }, (_v, i) => ({
      nombre: `t${i}`,
      tipo: 'BASE TABLE',
    }));
    const { bd } = armar((m, s) =>
      s.includes('information_schema.TABLES') && !s.includes('schema_name')
        ? muchas
        : mysqlFilas(m, s),
    );
    const e = await bd.esquema('mysql', 'tienda_falsa');
    expect(e.tablas).toHaveLength(MAX_TABLAS_ESQUEMA);
    expect(e.truncado).toBe(true);
  });

  it('MongoDB no tiene visor de esquema', async () => {
    const { bd } = armar(mysqlFilas);
    await expect(bd.esquema('mongodb', 'x')).rejects.toMatchObject({
      codigo: 'bd.esquema_motor_no_soportado',
    });
  });

  it('un fallo del servidor no filtra el SQL ni la clave', async () => {
    const { bd } = armar(() => {
      throw new Error("falló SELECT ... 'ClaveFalsa123'");
    });
    const e = await bd.esquema('mysql', 'tienda_falsa').catch((x: Error) => x);
    expect(e).toMatchObject({ codigo: 'bd.esquema_lectura_fallo' });
    expect((e as Error).message).not.toContain('ClaveFalsa123');
  });
});

const pgFilas = (_m: string, s: string): Record<string, unknown>[] => {
  if (s.includes('pg_class c JOIN') && s.includes('relkind::pg_catalog.text AS tipo'))
    return [
      { esquema: 'public', nombre: 'pedidos', tipo: 'r' },
      { esquema: 'public', nombre: 'clientes', tipo: 'r' },
      { esquema: 'extra', nombre: 'v_resumen', tipo: 'v' },
    ];
  if (s.includes('FROM pg_catalog.pg_attribute a'))
    return [
      {
        esquema: 'public',
        tabla: 'clientes',
        nombre: 'id',
        tipo: 'bigint',
        nulo: false,
        defecto: "nextval('clientes_id_seq'::regclass)",
      },
      {
        esquema: 'public',
        tabla: 'pedidos',
        nombre: 'cliente_id',
        tipo: 'bigint',
        nulo: false,
        defecto: null,
      },
    ];
  if (s.includes('pg_index i'))
    return [
      {
        esquema: 'public',
        tabla: 'clientes',
        nombre: 'clientes_pkey',
        unico: true,
        primario: true,
        columnas: ['id'],
      },
    ];
  if (s.includes('pg_constraint c'))
    return [
      {
        esquema: 'public',
        tabla: 'pedidos',
        nombre: 'pedidos_cliente_fk',
        columnas: ['cliente_id'],
        esquema_ref: 'public',
        tabla_ref: 'clientes',
        columnas_ref: ['id'],
        al_borrar: 'c',
        al_actualizar: 'a',
      },
    ];
  return [];
};

describe('visor de esquema: PostgreSQL', () => {
  it('lee el catálogo con nombres calificados, en solo lectura y con plazo', async () => {
    const { bd, reg, conectadas } = armar(pgFilas);
    const e = await bd.esquema('postgresql', 'tienda_falsa');
    expect(e.tablas.map((t) => `${t.esquema}.${t.nombre}`)).toEqual([
      'extra.v_resumen',
      'public.clientes',
      'public.pedidos',
    ]);
    const clientes = e.tablas[1]!;
    expect(clientes.columnas[0]).toMatchObject({
      primaria: true,
      porDefecto: "nextval('clientes_id_seq'::regclass)",
    });
    expect(e.tablas[2]!.clavesForaneas[0]).toMatchObject({
      alBorrar: 'CASCADE',
      alActualizar: 'NO ACTION',
    });
    expect(clientes.clavesEntrantes[0]).toMatchObject({
      origen: { esquema: 'public', tabla: 'pedidos' },
    });

    const propias = reg.filter((r) => !r.sql.includes('pg_database'));
    expect(propias.slice(0, 3).map((r) => r.sql)).toEqual([
      'SET search_path = pg_catalog, pg_temp',
      'SET default_transaction_read_only = on',
      'SET statement_timeout = 15000',
    ]);
    for (const r of propias.slice(3)) {
      expect(r.sql.startsWith('SELECT')).toBe(true);
      expect(r.sql).not.toContain('tienda_falsa');
      expect(r.sql).toContain('pg_catalog.');
    }
    // Se conectó a la base elegida (la lista de bases se pidió a la de mantenimiento).
    expect(conectadas.some((x) => (x as { c: { base?: string } }).c.base === 'tienda_falsa')).toBe(
      true,
    );
  });

  it('valida el nombre contra la lista real', async () => {
    const { bd } = armar(pgFilas);
    await expect(bd.esquema('postgresql', 'inventada')).rejects.toMatchObject({
      codigo: 'bd.esquema_base_no_existe',
    });
  });
});

describe('visor de esquema: plazo total', () => {
  afterEach(() => vi.useRealTimers());

  it('MySQL: si el servidor no responde, el error es bd.esquema_lectura_fallo y no «importar.cancelado»', async () => {
    vi.useFakeTimers();
    const { bd } = armar((m, sql) =>
      sql.includes('information_schema.TABLES')
        ? new Promise<Record<string, unknown>[]>(() => undefined)
        : mysqlFilas(m, sql),
    );
    const r = bd.esquema('mysql', 'tienda_falsa');
    const visto = r.then(
      () => null,
      (e: unknown) => e,
    );
    await vi.advanceTimersByTimeAsync(16_000);
    expect(await visto).toMatchObject({ codigo: 'bd.esquema_lectura_fallo' });
  });
});

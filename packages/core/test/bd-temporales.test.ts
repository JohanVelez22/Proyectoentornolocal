import { createHash, createHmac, pbkdf2Sync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ClienteMysql } from '../src/bd/clienteMysql';
import { ClientePostgres } from '../src/bd/clientePostgres';
import {
  hashScramSha256,
  nombreTemporal,
  NOMBRE_TEMPORAL,
  rolDuenoDe,
  temporalVencido,
  VIDA_TEMPORAL_MS,
} from '../src/bd/temporales';

describe('usuarios y roles temporales', () => {
  it('el nombre lleva la hora y se reconoce vencido pasada una hora', () => {
    const ahora = Date.UTC(2026, 10, 24, 12, 0, 0);
    const n = nombreTemporal(ahora);
    expect(n).toMatch(NOMBRE_TEMPORAL);
    expect(temporalVencido(n, ahora + 1000)).toBe(false);
    expect(temporalVencido(n, ahora + VIDA_TEMPORAL_MS + 5000)).toBe(true);
    expect(temporalVencido('postgres', ahora + 1e12)).toBe(false);
    expect(temporalVencido('wolf_tmp_zzzz', ahora + 1e12)).toBe(false);
  });

  it('el verificador SCRAM-SHA-256 se puede comprobar con la clave y no la contiene', () => {
    const sal = Buffer.from('0123456789abcdef');
    const h = hashScramSha256('ClaveTmp#2', sal);
    const m = /^SCRAM-SHA-256\$(\d+):([^$]+)\$([^:]+):(.+)$/.exec(h)!;
    expect(m).not.toBeNull();
    expect(h).not.toContain('ClaveTmp#2');
    const salada = pbkdf2Sync('ClaveTmp#2', sal, Number(m[1]), 32, 'sha256');
    const cliente = createHmac('sha256', salada).update('Client Key').digest();
    expect(m[3]).toBe(createHash('sha256').update(cliente).digest('base64'));
    expect(m[4]).toBe(createHmac('sha256', salada).update('Server Key').digest('base64'));
    expect(hashScramSha256('ClaveTmp#2')).not.toBe(h);
  });

  it('el rol dueño es por base, sin login, y su nombre es válido en PostgreSQL', () => {
    expect(rolDuenoDe('mi_tienda')).toMatch(/^wolf_dueno_mi_tienda_[0-9a-f]{6}$/);
    expect(rolDuenoDe('x'.repeat(63)).length).toBeLessThanOrEqual(63);
    expect(rolDuenoDe('a')).not.toBe(rolDuenoDe('b'));
  });
});

function pgFalso(
  respuestas: (sql: string, params?: unknown[]) => Record<string, unknown>[] = () => [],
) {
  const consultas: { sql: string; params?: unknown[]; base: string }[] = [];
  const cliente = new ClientePostgres((async (c: { base?: string }) => ({
    query: async (sql: string, params?: unknown[]) => {
      consultas.push({ sql, ...(params ? { params } : {}), base: c.base ?? 'postgres' });
      if (sql.startsWith("SELECT format('CREATE ROLE")) {
        return { rows: [{ s: `CREATE ROLE (${String(params?.[0])})` }] };
      }
      return { rows: respuestas(sql, params) };
    },
    end: async () => undefined,
  })) as never);
  return { cliente, consultas };
}

describe('ClientePostgres: rol temporal', () => {
  it('se crea sin privilegios, con VALID UNTIL y la clave ya hasheada (SCRAM)', async () => {
    const { cliente, consultas } = pgFalso();
    await cliente.conectar({ host: '127.0.0.1', puerto: 5432, usuario: 'postgres', clave: 'x' });
    const r = await cliente.crearRolTemporal('mi_base');
    expect(r.usuario).toMatch(NOMBRE_TEMPORAL);
    const crear = consultas.find((c) => c.sql.startsWith("SELECT format('CREATE ROLE"))!;
    expect(crear.sql).toMatch(
      /LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L VALID UNTIL %L/,
    );
    expect(String(crear.params![1])).toMatch(/^SCRAM-SHA-256\$4096:/);
    expect(JSON.stringify(consultas)).not.toContain(r.clave);
    expect(new Date(String(crear.params![2])).getTime()).toBeGreaterThan(Date.now());
    expect(
      consultas.some((c) => c.sql === `ALTER DATABASE "mi_base" OWNER TO "${r.usuario}"`),
    ).toBe(true);
  });

  it('al retirarlo, la base pasa a un rol sin login por base y nunca al administrador', async () => {
    const { cliente, consultas } = pgFalso();
    await cliente.conectar({ host: '127.0.0.1', puerto: 5432, usuario: 'postgres', clave: 'x' });
    const usuario = nombreTemporal();
    await cliente.retirarRolTemporal(usuario, 'mi_base');
    const dueno = rolDuenoDe('mi_base');
    const sql = consultas.map((c) => c.sql);
    expect(sql).toContain(
      `CREATE ROLE "${dueno}" NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
    );
    expect(sql).toContain(`REASSIGN OWNED BY "${usuario}" TO "${dueno}"`);
    expect(sql.some((s) => s.includes('TO "postgres"'))).toBe(false);
    expect(sql).toContain(`DROP ROLE IF EXISTS "${usuario}"`);
    await expect(cliente.retirarRolTemporal('postgres', 'mi_base')).rejects.toThrow(/temporales/);
  });

  it('auditarCatalogo informa disparadores de evento, extensiones, lenguajes y SECURITY DEFINER', async () => {
    const { cliente } = pgFalso((sql) => {
      if (sql.includes('pg_event_trigger')) return [{ evtname: 'ddl_hook' }];
      if (sql.includes('pg_extension')) return [{ extname: 'file_fdw' }];
      if (sql.includes('pg_language')) return [{ lanname: 'plpython3u' }];
      if (sql.includes('prosecdef')) return [{ proname: 'f' }];
      return [];
    });
    await cliente.conectar({ host: '127.0.0.1', puerto: 5432, usuario: 'postgres', clave: 'x' });
    const permitidas = ['plpgsql', 'pgcrypto'];
    const importada = await cliente.auditarCatalogo('mi_base', { permitidas, importada: true });
    expect(importada).toEqual([
      'disparador de evento ddl_hook',
      'extensión file_fdw',
      'lenguaje plpython3u',
      'función SECURITY DEFINER f',
    ]);
    const propia = await cliente.auditarCatalogo('mi_base', { permitidas, importada: false });
    expect(propia.some((p) => p.includes('SECURITY DEFINER'))).toBe(false);
    const limpio = pgFalso();
    await limpio.cliente.conectar({ host: 'h', puerto: 1, usuario: 'postgres', clave: 'x' });
    expect(await limpio.cliente.auditarCatalogo('b', { permitidas, importada: true })).toEqual([]);
  });

  it('limpiarTemporales borra solo los vencidos, con la propiedad devuelta al administrador', async () => {
    const viejo = nombreTemporal(Date.now() - 3 * VIDA_TEMPORAL_MS);
    const reciente = nombreTemporal();
    const { cliente, consultas } = pgFalso((sql) => {
      if (sql.includes('FROM pg_roles WHERE rolname LIKE')) {
        return [{ rolname: viejo }, { rolname: reciente }, { rolname: 'wolf_tmp_ajeno' }];
      }
      if (sql.includes('datdba')) return [{ datname: 'huerfana' }];
      if (sql.includes('NOT datistemplate')) return [{ datname: 'huerfana' }];
      return [];
    });
    await cliente.conectar({ host: 'h', puerto: 1, usuario: 'postgres', clave: 'x' });
    expect(await cliente.limpiarTemporales()).toBe(1);
    const sql = consultas.map((c) => c.sql);
    expect(sql).toContain(`ALTER DATABASE "huerfana" OWNER TO "postgres"`);
    expect(sql).toContain(`DROP ROLE IF EXISTS "${viejo}"`);
    expect(sql.some((s) => s.includes(reciente))).toBe(false);
  });

  it('reiniciarBase borra y vuelve a crear la base', async () => {
    const { cliente, consultas } = pgFalso();
    await cliente.conectar({ host: 'h', puerto: 1, usuario: 'postgres', clave: 'x' });
    await cliente.reiniciarBase('mi_base');
    expect(consultas.map((c) => c.sql)).toEqual([
      'DROP DATABASE IF EXISTS "mi_base" WITH (FORCE)',
      `CREATE DATABASE "mi_base" ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`,
    ]);
  });
});

describe('ClienteMysql: usuario temporal', () => {
  it('el nombre lleva la hora, los permisos son solo de la base (con _ escapado) y limpia los vencidos', async () => {
    const viejo = nombreTemporal(Date.now() - 3 * VIDA_TEMPORAL_MS);
    const consultas: string[] = [];
    const cliente = new ClienteMysql((async () => ({
      query: async (sql: string) => {
        consultas.push(sql);
        if (sql.includes('FROM mysql.user')) return [[{ usuario: viejo }, { usuario: 'otro' }]];
        return [[]];
      },
      end: async () => undefined,
    })) as never);
    await cliente.conectar({ host: 'h', puerto: 1, usuario: 'root', clave: 'x' });
    const r = await cliente.crearUsuarioTemporal('mi_base');
    expect(r.usuario).toMatch(NOMBRE_TEMPORAL);
    expect(consultas.some((s) => s === "DROP USER IF EXISTS ?@'localhost'")).toBe(true);
    const grants = consultas.filter((s) => s.startsWith('GRANT'));
    expect(grants).toHaveLength(2);
    for (const g of grants) {
      expect(g).toContain('`mi\\_base`.*');
      expect(g).not.toMatch(/\*\.\*|FILE|SUPER|GRANT OPTION/);
    }
  });
});

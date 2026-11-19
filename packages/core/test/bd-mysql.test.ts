import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ClienteMysql, validarNombreBd } from '../src/bd/clienteMysql';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { DEFINICIONES } from '../src/servicios/datos';
import type { CtxServicio } from '../src/servicios/definicion';
import { contenidoIni, defMysql } from '../src/servicios/bd/mysql';

let base: string;
let llamadas: {
  cmd: string;
  args: string[];
  sql?: string;
  entrada?: string;
  env?: Record<string, string>;
}[];
const primera = <T = (typeof llamadas)[number]>(l?: T[]): T => {
  const x = (l ?? (llamadas as unknown as T[]))[0];
  if (x === undefined) throw new Error('sin datos');
  return x;
};
const CLAVE = 'Secr3toSuperClave99';

const ctx = (v: 'mysql' | 'mariadb', exec: Ejecutor): CtxServicio => {
  const rutas = new Rutas(base);
  const version = v === 'mysql' ? '8.4.13' : '11.4.14';
  return {
    rutas,
    bin: rutas.bin(v, version),
    datos: rutas.datos(v, version),
    puerto: v === 'mysql' ? 3306 : 3307,
    version,
    credenciales: { usuario: 'root', clave: CLAVE },
    exec,
  };
};

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-mysql-'));
  llamadas = [];
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

const ejecutorFalso =
  (codigo = 0, stderr = ''): Ejecutor =>
  async (cmd, args, opts) => {
    const init = args.find((a) => a.startsWith('--init-file='));
    const sql = init ? readFileSync(init.slice('--init-file='.length), 'utf8') : undefined;
    llamadas.push({ cmd, args, sql, entrada: opts?.entrada, env: opts?.env });
    return { codigo, stdout: '', stderr };
  };

describe('my.ini', () => {
  it('MySQL', () => {
    expect(contenidoIni('mysql', 'C:\\x\\data', 3306)).toBe(
      [
        '[mysqld]',
        'datadir="C:/x/data"',
        'port=3306',
        'bind-address=127.0.0.1',
        'character-set-server=utf8mb4',
        'mysqlx=OFF',
        '',
      ].join('\n'),
    );
  });
  it('MariaDB sin mysqlx', () => {
    const t = contenidoIni('mariadb', 'C:\\x\\data', 3307);
    expect(t).toContain('port=3307');
    expect(t).not.toContain('mysqlx');
  });
});

describe('defMysql', () => {
  it('datos del servicio y registro', () => {
    expect(defMysql('mysql')).toMatchObject({
      id: 'mysql',
      puertoPorDefecto: 3306,
      puertoAlternativo: 3308,
    });
    expect(defMysql('mariadb')).toMatchObject({
      id: 'mariadb',
      puertoPorDefecto: 3307,
      puertoAlternativo: 3309,
    });
    expect(DEFINICIONES.map((d) => d.id)).toEqual(expect.arrayContaining(['mysql', 'mariadb']));
  });

  it('MySQL: initialize-insecure con init-file temporal que se borra', async () => {
    const c = ctx('mysql', ejecutorFalso());
    await defMysql('mysql').inicializar(c);
    expect(llamadas).toHaveLength(1);
    expect(primera().cmd).toBe(path.join(c.bin, 'bin', 'mysqld.exe'));
    expect(primera().args[0]).toMatch(/^--defaults-file=.*my\.ini$/);
    expect(primera().args).toContain('--initialize-insecure');
    const sql = primera().sql ?? '';
    expect(sql).toContain(`ALTER USER 'root'@'localhost' IDENTIFIED BY '${CLAVE}';`);
    expect(sql).toContain("CREATE USER IF NOT EXISTS 'root'@'127.0.0.1'");
    expect(sql).toContain("GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;");
    expect(JSON.stringify(primera().args)).not.toContain(CLAVE);
    const tmp = path.join(base, 'tmp');
    expect(existsSync(tmp) ? readdirSync(tmp) : []).toEqual([]);
  });

  it('MariaDB: install-db sin clave y clave por entrada estándar', async () => {
    const c = ctx('mariadb', ejecutorFalso());
    await defMysql('mariadb').inicializar(c);
    expect(llamadas).toHaveLength(2);
    expect(llamadas[0]?.cmd).toBe(path.join(c.bin, 'bin', 'mariadb-install-db.exe'));
    expect(llamadas[0]?.args).toEqual([`--datadir=${c.datos}`]);
    expect(llamadas[1]?.cmd).toBe(path.join(c.bin, 'bin', 'mariadbd.exe'));
    expect(llamadas[1]?.args).toContain('--bootstrap');
    expect(llamadas[1]?.entrada).toContain(CLAVE);
    expect(llamadas[1]?.entrada).toContain("'root'@'127.0.0.1'");
    expect(JSON.stringify(llamadas.map((l) => l.args))).not.toContain(CLAVE);
  });

  it('MariaDB usa mysql_install_db.exe solo si no existe el mariadb-*', async () => {
    const c = ctx('mariadb', ejecutorFalso());
    mkdirSync(path.join(c.bin, 'bin'), { recursive: true });
    writeFileSync(path.join(c.bin, 'bin', 'mysql_install_db.exe'), '');
    await defMysql('mariadb').inicializar(c);
    expect(llamadas[0]?.cmd).toBe(path.join(c.bin, 'bin', 'mysql_install_db.exe'));
    writeFileSync(path.join(c.bin, 'bin', 'mariadb-install-db.exe'), '');
    llamadas.length = 0;
    await defMysql('mariadb').inicializar(c);
    expect(llamadas[0]?.cmd).toBe(path.join(c.bin, 'bin', 'mariadb-install-db.exe'));
  });

  it('el fallo no filtra la clave', async () => {
    const c = ctx('mysql', ejecutorFalso(1, `error con ${CLAVE}`));
    const e = await defMysql('mysql')
      .inicializar(c)
      .catch((x: Error) => x);
    expect((e as Error).message).not.toContain(CLAVE);
    expect((e as Error).message).toMatch(/MySQL/);
    const c2 = ctx('mariadb', ejecutorFalso(1, `error con ${CLAVE}`));
    const e2 = await defMysql('mariadb')
      .inicializar(c2)
      .catch((x: Error) => x);
    expect((e2 as Error).message).not.toContain(CLAVE);
  });

  it('proceso aplica el puerto actual en cada arranque y no lleva la clave', async () => {
    const c = ctx('mysql', ejecutorFalso());
    const def = defMysql('mysql');
    const p1 = await def.proceso(c);
    const ini = (p1.args[0] ?? '').replace('--defaults-file=', '');
    expect(readFileSync(ini, 'utf8')).toContain('port=3306');
    const p2 = await def.proceso({ ...c, puerto: 3308 });
    expect(readFileSync(ini, 'utf8')).toContain('port=3308');
    expect(p2.comando).toBe(path.join(c.bin, 'bin', 'mysqld.exe'));
    expect(p2.puerto).toBe(3308);
    expect(JSON.stringify(p2)).not.toContain(CLAVE);
  });

  it('detenerLimpio usa mysqladmin shutdown con la clave solo en el entorno', async () => {
    const c = ctx('mysql', ejecutorFalso());
    await defMysql('mysql').detenerLimpio!(c);
    expect(primera().cmd).toBe(path.join(c.bin, 'bin', 'mysqladmin.exe'));
    expect(primera().env).toEqual({ MYSQL_PWD: CLAVE });
    expect(primera().args).toContain('shutdown');
    expect(primera().args).toContain('--port=3306');
    expect(JSON.stringify(primera().args)).not.toContain(CLAVE);
  });
});

describe('nombres', () => {
  it('valida', () => {
    expect(() => validarNombreBd('mi_bd1')).not.toThrow();
    expect(() => validarNombreBd('a;drop')).toThrow();
    expect(() => validarNombreBd('a`b')).toThrow();
    expect(() => validarNombreBd('')).toThrow();
    expect(() => validarNombreBd('x'.repeat(65))).toThrow();
  });
});

describe('ClienteMysql', () => {
  const montar = (filas: unknown[] = []) => {
    const consultas: { sql: string; params?: unknown[] }[] = [];
    let cerrada = false;
    const cliente = new ClienteMysql(async () => ({
      query: async (sql: string, params?: unknown[]) => {
        consultas.push({ sql, params });
        return [filas] as never;
      },
      end: async () => {
        cerrada = true;
      },
    }));
    return { cliente, consultas, cerrada: () => cerrada };
  };
  const cx = { host: '127.0.0.1', puerto: 3306, usuario: 'root', clave: CLAVE };

  it('crearBase escapa identificadores', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await cliente.crearBase('mi_bd', { usuario: 'app', clave: 'x' });
    expect(
      consultas.some(
        (q) => q.sql === 'CREATE DATABASE IF NOT EXISTS `mi_bd` CHARACTER SET utf8mb4',
      ),
    ).toBe(true);
    expect(consultas.some((q) => q.sql.includes('GRANT ALL PRIVILEGES ON `mi_bd`.*'))).toBe(true);
    expect(consultas.some((q) => q.sql.includes('CREATE USER') && q.params?.includes('x'))).toBe(
      true,
    );
  });

  it('rechaza nombres peligrosos sin consultar', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await expect(cliente.crearBase('a;drop', {})).rejects.toThrow();
    await expect(cliente.borrarBase('a`b')).rejects.toThrow();
    await expect(cliente.tieneTablas('a b')).rejects.toThrow();
    await expect(cliente.crearBase('ok', { usuario: 'u`x', clave: 'c' })).rejects.toThrow();
    expect(consultas).toHaveLength(0);
  });

  it('no toca esquemas del sistema (sin distinguir mayúsculas)', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    for (const n of ['mysql', 'SYS', 'Performance_Schema', 'information_schema']) {
      await expect(cliente.borrarBase(n)).rejects.toThrow(/No se puede borrar la base del sistema/);
      await expect(cliente.crearBase(n)).rejects.toThrow(/No se puede crear la base del sistema/);
    }
    expect(consultas).toHaveLength(0);
  });

  it('rechaza usuarios reservados', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    for (const u of ['root', 'ROOT']) {
      await expect(cliente.crearBase('ok', { usuario: u, clave: 'x' })).rejects.toThrow(
        /reservado/,
      );
    }
    expect(consultas).toHaveLength(0);
  });

  it('usuario existente: ALTER USER y aviso', async () => {
    const { cliente, consultas } = montar([{ host: 'localhost' }, { host: '127.0.0.1' }]);
    await cliente.conectar(cx);
    const r = await cliente.crearBase('mi_bd', {
      usuario: 'app',
      clave: 'nueva',
      cambiarClave: true,
    });
    expect(r.usuarioActualizado).toBe(true);
    expect(r.aviso).toMatch(/ya existía/);
    expect(consultas.filter((q) => q.sql.startsWith('ALTER USER'))).toHaveLength(2);
  });

  it('usuario existente: la clave se cambia al final, tras los GRANT', async () => {
    const { cliente, consultas } = montar([{ host: 'localhost' }, { host: '127.0.0.1' }]);
    await cliente.conectar(cx);
    await cliente.crearBase('mi_bd', { usuario: 'app', clave: 'nueva', cambiarClave: true });
    const sqls = consultas.map((q) => q.sql);
    const ultimoGrant = sqls.map((x) => x.startsWith('GRANT')).lastIndexOf(true);
    const primerAlter = sqls.findIndex((x) => x.startsWith('ALTER USER'));
    expect(primerAlter).toBeGreaterThan(ultimoGrant);
  });

  it('usuario existente: si un GRANT falla, la clave no se cambia', async () => {
    const consultas: string[] = [];
    const cliente = new ClienteMysql(async () => ({
      query: async (sql: string) => {
        consultas.push(sql);
        if (sql.startsWith('GRANT')) throw Object.assign(new Error('x'), { code: 'ER_X' });
        return [[{ host: 'localhost' }, { host: '127.0.0.1' }]] as never;
      },
      end: async () => undefined,
    }));
    await cliente.conectar(cx);
    const e = await cliente
      .crearBase('mi_bd', { usuario: 'app', clave: 'nueva', cambiarClave: true })
      .catch((x: Error) => x);
    expect((e as Error).message).not.toMatch(/clave/);
    expect(consultas.some((x) => x.startsWith('ALTER USER'))).toBe(false);
  });

  it('usuario existente: si falla tras cambiar la clave, el error lo dice', async () => {
    let alters = 0;
    const cliente = new ClienteMysql(async () => ({
      query: async (sql: string) => {
        if (sql.startsWith('ALTER USER') && ++alters === 2) {
          throw Object.assign(new Error('x'), { code: 'ER_X' });
        }
        return [[{ host: 'localhost' }, { host: '127.0.0.1' }]] as never;
      },
      end: async () => undefined,
    }));
    await cliente.conectar(cx);
    await expect(
      cliente.crearBase('mi_bd', { usuario: 'app', clave: 'nueva', cambiarClave: true }),
    ).rejects.toThrow(/La clave del usuario app ya se cambió/);
  });

  it('usuario nuevo: sin ALTER USER', async () => {
    const { cliente, consultas } = montar([]);
    await cliente.conectar(cx);
    const r = await cliente.crearBase('mi_bd', {
      usuario: 'app',
      clave: 'nueva',
      cambiarClave: true,
    });
    expect(r.usuarioActualizado).toBe(false);
    expect(consultas.some((q) => q.sql.startsWith('ALTER USER'))).toBe(false);
  });

  it('errores de mysql2 salen en español sin SQL ni claves', async () => {
    const cliente = new ClienteMysql(async () => ({
      query: async () => {
        throw Object.assign(new Error("You have an error near 'IDENTIFIED BY SECRETA'"), {
          code: 'ER_DB_CREATE_EXISTS',
          sql: 'CREATE DATABASE x',
        });
      },
      end: async () => undefined,
    }));
    await cliente.conectar(cx);
    const e = await cliente
      .crearBase('x', { usuario: 'u', clave: 'SECRETA' })
      .catch((x: Error) => x);
    expect((e as Error).message).toBe(
      'No se pudo crear la base x: la base ya existe (ER_DB_CREATE_EXISTS).',
    );
    const e2 = await cliente.borrarBase('x').catch((x: Error) => x);
    expect((e2 as Error).message).not.toMatch(/DROP|SECRETA|You have/);
  });

  it('borrarBase', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await cliente.borrarBase('mi_bd');
    expect(primera<{ sql: string; params?: unknown[] }>(consultas).sql).toBe(
      'DROP DATABASE `mi_bd`',
    );
  });

  it('listarBases excluye las del sistema', async () => {
    const { cliente, consultas } = montar([{ nombre: 'a', tam: '2048' }]);
    await cliente.conectar(cx);
    expect(await cliente.listarBases()).toEqual([{ nombre: 'a', tamanoBytes: 2048 }]);
    expect(primera<{ sql: string; params?: unknown[] }>(consultas).params).toEqual([
      'mysql',
      'information_schema',
      'performance_schema',
      'sys',
    ]);
  });

  it('tieneTablas', async () => {
    const { cliente } = montar([{ n: 3 }]);
    await cliente.conectar(cx);
    expect(await cliente.tieneTablas('x')).toBe(true);
  });

  it('sin conexión falla claro y cerrar libera', async () => {
    const { cliente, cerrada } = montar();
    await expect(cliente.listarBases()).rejects.toThrow(/conect/i);
    await cliente.conectar(cx);
    await cliente.cerrar();
    expect(cerrada()).toBe(true);
  });
});

describe('ClienteMysql: usuario existente no cambia de clave (QA bd)', () => {
  const cx = { host: '127.0.0.1', puerto: 3306, usuario: 'root', clave: CLAVE };
  /** Servidor falso: `app` ya existe con la clave `x`. */
  const montar = () => {
    const consultas: { sql: string; params?: unknown[] }[] = [];
    const intentos: { usuario: string; clave: string }[] = [];
    const cliente = new ClienteMysql(async (c) => {
      intentos.push({ usuario: c.usuario, clave: c.clave });
      if (c.usuario === 'app' && c.clave !== 'x') {
        throw Object.assign(new Error('Access denied'), { code: 'ER_ACCESS_DENIED_ERROR' });
      }
      return {
        query: async (sql: string, params?: unknown[]) => {
          consultas.push({ sql, params });
          return [sql.includes('mysql.user') ? [{ host: '%' }] : []] as never;
        },
        end: async () => undefined,
      };
    });
    return { cliente, consultas, intentos };
  };

  it('misma clave: solo crea la base y da permisos, sin ALTER USER', async () => {
    const { cliente, consultas, intentos } = montar();
    await cliente.conectar(cx);
    const r = await cliente.crearBase('b', { usuario: 'app', clave: 'x' });
    expect(r.usuarioActualizado).toBe(false);
    expect(intentos.some((i) => i.usuario === 'app')).toBe(true);
    expect(consultas.some((q) => q.sql.startsWith('ALTER USER'))).toBe(false);
    expect(consultas.some((q) => q.sql.includes('GRANT ALL PRIVILEGES ON `b`.*'))).toBe(true);
  });

  it('otra clave: error con código y no toca nada', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    const e = await cliente
      .crearBase('b', { usuario: 'app', clave: 'claveOtra77' })
      .catch((x: unknown) => x);
    expect(e).toMatchObject({ codigo: 'bd.usuario_clave_distinta', datos: { usuario: 'app' } });
    expect(String((e as Error).message)).not.toContain('claveOtra77');
    expect(consultas.some((q) => /^(ALTER|CREATE|GRANT)/.test(q.sql))).toBe(false);
  });
});

describe('ClienteMysql: cuentas existentes y códigos (ronda de seguridad)', () => {
  const cx = { host: '127.0.0.1', puerto: 3306, usuario: 'admin_wc', clave: CLAVE };
  const montar = (hosts: string[], errorConexion?: string) => {
    const consultas: { sql: string; params?: unknown[] }[] = [];
    const cliente = new ClienteMysql(async (c) => {
      if (c.usuario === 'app' && errorConexion) {
        throw Object.assign(new Error('x'), { code: errorConexion });
      }
      return {
        query: async (sql: string, params?: unknown[]) => {
          consultas.push({ sql, params });
          return [sql.includes('mysql.user') ? hosts.map((host) => ({ host })) : []] as never;
        },
        end: async () => undefined,
      };
    });
    return { cliente, consultas };
  };

  it("'app'@'%' existente: GRANT a esa cuenta y ningún CREATE USER nuevo", async () => {
    const { cliente, consultas } = montar(['%']);
    await cliente.conectar(cx);
    await cliente.crearBase('b', { usuario: 'app', clave: 'x' });
    expect(consultas.some((q) => q.sql.startsWith('CREATE USER'))).toBe(false);
    const grants = consultas.filter((q) => q.sql.startsWith('GRANT'));
    expect(grants.map((q) => q.params)).toEqual([['app', '%']]);
  });

  it('cambiarClave: ALTER USER solo en las cuentas existentes', async () => {
    const { cliente, consultas } = montar(['%']);
    await cliente.conectar(cx);
    await cliente.crearBase('b', { usuario: 'app', clave: 'nueva', cambiarClave: true });
    const alters = consultas.filter((q) => q.sql.startsWith('ALTER USER'));
    expect(alters.map((q) => q.params)).toEqual([['app', '%', 'nueva']]);
  });

  it('códigos raros al comprobar la clave no cuentan como clave distinta', async () => {
    for (const codigo of ['ER_DBACCESS_DENIED_ERROR', 'ER_ACCOUNT_HAS_BEEN_LOCKED', 'ECONNRESET']) {
      const { cliente, consultas } = montar(['%'], codigo);
      await cliente.conectar(cx);
      const e = await cliente
        .crearBase('b', { usuario: 'app', clave: 'x' })
        .catch((x: unknown) => x);
      expect((e as { codigo?: string }).codigo).toBeUndefined();
      expect((e as Error).message).toMatch(/No se pudo comprobar la clave/);
      expect(consultas.some((q) => /^(CREATE|GRANT|ALTER)/.test(q.sql))).toBe(false);
    }
    const { cliente } = montar(['%'], 'ER_ACCESS_DENIED_ERROR');
    await cliente.conectar(cx);
    await expect(cliente.crearBase('b', { usuario: 'app', clave: 'x' })).rejects.toMatchObject({
      codigo: 'bd.usuario_clave_distinta',
    });
  });

  it('rechaza el propio usuario administrador', async () => {
    const { cliente, consultas } = montar([]);
    await cliente.conectar(cx);
    await expect(cliente.crearBase('b', { usuario: 'admin_wc', clave: 'x' })).rejects.toMatchObject(
      { codigo: 'bd.usuario_privilegiado' },
    );
    expect(consultas).toHaveLength(0);
  });
});

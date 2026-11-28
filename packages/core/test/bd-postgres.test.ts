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
import { EventEmitter } from 'node:events';
import {
  ClientePostgres,
  SQL_ASIGNAR_DUENO,
  abrirCliente,
  validarNombrePg,
  type ClientePg,
} from '../src/bd/clientePostgres';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { DEFINICIONES } from '../src/servicios/datos';
import type { CtxServicio } from '../src/servicios/definicion';
import { defPostgresql } from '../src/servicios/bd/postgresql';

let base: string;
let llamadas: { cmd: string; args: string[]; pwfile?: string; env?: Record<string, string> }[];
const CLAVE = 'Secr3toSuperClave99';

const ctx = (exec: Ejecutor, puerto = 5432): CtxServicio => {
  const rutas = new Rutas(base);
  return {
    rutas,
    bin: rutas.bin('postgresql', '17.12'),
    datos: rutas.datos('postgresql', '17.12', (v) => v.split('.')[0]!),
    puerto,
    version: '17.12',
    credenciales: { usuario: 'postgres', clave: CLAVE },
    exec,
  };
};

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-pg-'));
  llamadas = [];
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

/** Imita a initdb: lee el pwfile y crea la carpeta de datos con sus archivos de configuración. */
const ejecutorFalso =
  (codigo = 0, stderr = ''): Ejecutor =>
  async (cmd, args, opts) => {
    const pw = args.find((a) => a.startsWith('--pwfile='))?.slice('--pwfile='.length);
    const d = args[args.indexOf('-D') + 1];
    llamadas.push({
      cmd,
      args,
      pwfile: pw ? readFileSync(pw, 'utf8') : undefined,
      env: opts?.env,
    });
    if (d && codigo === 0 && cmd.endsWith('initdb.exe')) {
      mkdirSync(d, { recursive: true });
      writeFileSync(path.join(d, 'postgresql.conf'), '#port = 5432\n');
      writeFileSync(path.join(d, 'pg_hba.conf'), 'local all all trust\n');
    }
    return { codigo, stdout: '', stderr };
  };

describe('defPostgresql', () => {
  it('datos del servicio y registro', () => {
    const def = defPostgresql();
    expect(def).toMatchObject({
      id: 'postgresql',
      puertoPorDefecto: 5432,
      puertoAlternativo: 5433,
    });
    expect(def.claveDatos!('17.12')).toBe('17');
    expect(DEFINICIONES.map((d) => d.id)).toContain('postgresql');
  });

  it('initdb con los argumentos esperados y pwfile temporal borrado', async () => {
    const c = ctx(ejecutorFalso());
    await defPostgresql().inicializar(c);
    const l = llamadas[0]!;
    expect(l.cmd).toBe(path.join(c.bin, 'pgsql', 'bin', 'initdb.exe'));
    expect(l.args.slice(0, 6)).toEqual(['-D', c.datos, '-U', 'postgres', '-E', 'UTF8']);
    expect(l.args).toEqual(
      expect.arrayContaining([
        '--locale=C',
        '--auth-local=scram-sha-256',
        '--auth-host=scram-sha-256',
      ]),
    );
    expect(l.pwfile?.trim()).toBe(CLAVE);
    expect(JSON.stringify(l.args)).not.toContain(CLAVE);
    const tmp = path.join(base, 'tmp');
    expect(existsSync(tmp) ? readdirSync(tmp) : []).toEqual([]);
  });

  it('parchea postgresql.conf y deja pg_hba.conf solo con scram en loopback', async () => {
    const c = ctx(ejecutorFalso(), 5433);
    await defPostgresql().inicializar(c);
    const conf = readFileSync(path.join(c.datos, 'postgresql.conf'), 'utf8');
    expect(conf).toContain('port = 5433');
    expect(conf).toContain("listen_addresses = '127.0.0.1'");
    expect(conf).toContain("unix_socket_directories = ''");
    const hba = readFileSync(path.join(c.datos, 'pg_hba.conf'), 'utf8');
    expect(hba).toContain('host all all 127.0.0.1/32 scram-sha-256');
    expect(hba).toContain('host all all ::1/128 scram-sha-256');
    expect(hba).not.toMatch(/trust|local/);
  });

  it('el pwfile se borra aunque initdb falle y el error no filtra la clave', async () => {
    const c = ctx(ejecutorFalso(1, `fallo con ${CLAVE}`));
    const e = await defPostgresql()
      .inicializar(c)
      .catch((x: Error) => x);
    expect((e as Error).message).toMatch(/PostgreSQL/);
    expect((e as Error).message).not.toContain(CLAVE);
    const tmp = path.join(base, 'tmp');
    expect(existsSync(tmp) ? readdirSync(tmp) : []).toEqual([]);
  });

  it('proceso aplica el puerto en cada arranque y no lleva la clave', async () => {
    const c = ctx(ejecutorFalso(), 5433);
    const p = await defPostgresql().proceso(c);
    expect(p.comando).toBe(path.join(c.bin, 'pgsql', 'bin', 'postgres.exe'));
    expect(p.args).toEqual(['-D', c.datos, '-p', '5433', '-c', 'listen_addresses=127.0.0.1']);
    expect(p.puerto).toBe(5433);
    expect(JSON.stringify(p)).not.toContain(CLAVE);
  });

  it('detenerLimpio usa pg_ctl stop -m fast', async () => {
    const c = ctx(ejecutorFalso());
    await defPostgresql().detenerLimpio!(c);
    const l = llamadas[0]!;
    expect(l.cmd).toBe(path.join(c.bin, 'pgsql', 'bin', 'pg_ctl.exe'));
    expect(l.args).toEqual(['stop', '-D', c.datos, '-m', 'fast', '-w', '-t', '15']);
    expect(JSON.stringify(l)).not.toContain(CLAVE);
  });

  it('detenerLimpio falla en claro', async () => {
    await expect(
      defPostgresql().detenerLimpio!(ctx(ejecutorFalso(1, 'pg_ctl: no responde'))),
    ).rejects.toThrow(/PostgreSQL.*no responde/);
  });
});

describe('nombres', () => {
  it('valida', () => {
    expect(() => validarNombrePg('mi_bd1')).not.toThrow();
    expect(() => validarNombrePg('_x')).not.toThrow();
    for (const n of ['1a', 'A', 'a-b', 'a"b', '', 'x'.repeat(64), 'a;drop']) {
      expect(() => validarNombrePg(n)).toThrow();
    }
  });
});

describe('ClientePostgres', () => {
  const montar = (respuestas: (sql: string) => unknown[] = () => []) => {
    const consultas: { sql: string; params?: unknown[] }[] = [];
    const conexiones: { base?: string; cerrada: boolean }[] = [];
    const cliente = new ClientePostgres(async (c) => {
      const reg: { base?: string; cerrada: boolean } = { base: c.base, cerrada: false };
      conexiones.push(reg);
      return {
        query: async (sql: string, params?: unknown[]) => {
          consultas.push({ sql, params });
          return { rows: respuestas(sql) };
        },
        end: async () => {
          reg.cerrada = true;
        },
      };
    });
    return { cliente, consultas, conexiones };
  };
  const cx = { host: '127.0.0.1', puerto: 5432, usuario: 'postgres', clave: CLAVE };

  it('rechaza nombres peligrosos y de sistema sin consultar', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await expect(cliente.crearBase('a;drop')).rejects.toThrow();
    await expect(cliente.borrarBase('a"b')).rejects.toThrow();
    await expect(cliente.tieneTablas('A b')).rejects.toThrow();
    for (const n of ['postgres', 'template0', 'template1']) {
      await expect(cliente.borrarBase(n)).rejects.toThrow(/No se puede borrar la base del sistema/);
      await expect(cliente.crearBase(n)).rejects.toThrow(/No se puede crear la base del sistema/);
    }
    await expect(cliente.crearBase('ok', { usuario: 'postgres', clave: 'x' })).rejects.toThrow(
      /reservado/,
    );
    await expect(cliente.crearBase('ok', { usuario: 'u', clave: '' })).rejects.toThrow(/clave/);
    expect(consultas).toHaveLength(0);
  });

  it('crearBase crea primero el rol y la base con ese dueño', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    const r = await cliente.crearBase('mi_bd', { usuario: 'app', clave: 'x' });
    expect(r.usuarioActualizado).toBe(false);
    const sqls = consultas.map((q) => q.sql);
    const iRol = sqls.findIndex((s) => s.includes("'CREATE ROLE"));
    const iBd = sqls.indexOf(
      "CREATE DATABASE \"mi_bd\" OWNER \"app\" ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'",
    );
    expect(iRol).toBeGreaterThanOrEqual(0);
    expect(iBd).toBeGreaterThan(iRol);
    expect(consultas.some((q) => q.sql.includes('format(') && q.params?.includes('x'))).toBe(true);
  });

  it('nueva: si la base ya existe falla antes de crear el rol', async () => {
    const { cliente, consultas } = montar((sql) =>
      sql.includes('FROM pg_database') ? [{ n: 1 }] : [],
    );
    await cliente.conectar(cx);
    await expect(
      cliente.crearBase('mi_bd', { usuario: 'app', clave: 'x', nueva: true }),
    ).rejects.toMatchObject({ codigo: 'proyectos.base_existe' });
    expect(consultas.some((q) => q.sql.includes('CREATE ROLE') || q.sql.includes('format('))).toBe(
      false,
    );
    expect(consultas.some((q) => q.sql.startsWith('CREATE DATABASE'))).toBe(false);
  });

  it('base existente con usuario: cambia el dueño', async () => {
    const { cliente, consultas } = montar((sql) =>
      sql.includes('FROM pg_database') ? [{ n: 1 }] : [],
    );
    await cliente.conectar(cx);
    await cliente.crearBase('mi_bd', { usuario: 'app', clave: 'x' });
    expect(consultas.some((q) => q.sql === 'ALTER DATABASE "mi_bd" OWNER TO "app"')).toBe(true);
    // Una base que ya existía no se cierra a PUBLIC (otros pueden usarla)…
    expect(consultas.some((q) => q.sql.startsWith('REVOKE CONNECT'))).toBe(false);
  });

  it('base existente con aislar (la creó este proyecto en un intento anterior): sí se cierra', async () => {
    const { cliente, consultas } = montar((sql) =>
      sql.includes('FROM pg_database') ? [{ n: 1 }] : [],
    );
    await cliente.conectar(cx);
    await cliente.crearBase('mi_bd', { usuario: 'app', clave: 'x', aislar: true });
    expect(consultas.map((q) => q.sql)).toContain(
      'REVOKE CONNECT, TEMPORARY ON DATABASE "mi_bd" FROM PUBLIC',
    );
  });

  it('crearExtension la instala en public (no en pg_catalog del search_path seguro)', async () => {
    const { cliente, consultas, conexiones } = montar();
    await cliente.conectar(cx);
    await cliente.crearExtension('mi_bd', 'pgcrypto');
    const enLaBase = consultas.slice(-2).map((q) => q.sql);
    expect(enLaBase).toEqual([
      'SET search_path = pg_catalog, pg_temp',
      'CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public',
    ]);
    expect(conexiones.at(-1)!.base).toBe('mi_bd');
  });

  it('no recrea una base existente', async () => {
    const { cliente, consultas } = montar((sql) =>
      sql.includes('FROM pg_database') ? [{ n: 1 }] : [],
    );
    await cliente.conectar(cx);
    await cliente.crearBase('mi_bd');
    expect(consultas.some((q) => q.sql.startsWith('CREATE DATABASE'))).toBe(false);
  });

  it('rol existente: se actualiza y se avisa', async () => {
    const { cliente, consultas } = montar((sql) =>
      sql.includes('FROM pg_roles') ? [{ n: 1 }] : [],
    );
    await cliente.conectar(cx);
    const r = await cliente.crearBase('mi_bd', {
      usuario: 'app',
      clave: 'nueva',
      cambiarClave: true,
    });
    expect(r.usuarioActualizado).toBe(true);
    expect(r.aviso).toMatch(/ya existía/);
    expect(consultas.some((q) => q.sql.includes("'ALTER ROLE"))).toBe(true);
  });

  it('rol existente: la clave se cambia DESPUÉS de crear la base', async () => {
    const { cliente, consultas } = montar((sql) =>
      sql.includes('FROM pg_roles') ? [{ n: 1 }] : sql.includes('format(') ? [{ s: 'ORDEN' }] : [],
    );
    await cliente.conectar(cx);
    await cliente.crearBase('mi_bd', { usuario: 'app', clave: 'nueva', cambiarClave: true });
    const sqls = consultas.map((q) => q.sql);
    const iBd = sqls.findIndex((x) => x.startsWith('CREATE DATABASE'));
    const iClave = sqls.findIndex((x) => x.includes("'ALTER ROLE"));
    expect(iBd).toBeGreaterThanOrEqual(0);
    expect(iClave).toBeGreaterThan(iBd);
    expect(sqls.some((x) => x.includes("'CREATE ROLE"))).toBe(false);
  });

  it('rol existente: si crear la base falla, la clave NO se cambia', async () => {
    const consultas: string[] = [];
    const cliente = new ClientePostgres(async () => ({
      query: async (sql: string) => {
        consultas.push(sql);
        if (sql.startsWith('CREATE DATABASE'))
          throw Object.assign(new Error('x'), { code: '42501' });
        return { rows: sql.includes('FROM pg_roles') ? [{ n: 1 }] : [] };
      },
      end: async () => undefined,
    }));
    await cliente.conectar(cx);
    await expect(
      cliente.crearBase('mi_bd', { usuario: 'app', clave: 'nueva', cambiarClave: true }),
    ).rejects.toThrow(/permiso denegado/);
    expect(consultas.some((x) => x.includes('ALTER ROLE'))).toBe(false);
  });

  it('duenoBase lee pg_database.datdba (null si no existe)', async () => {
    const { cliente, consultas } = montar((sql) =>
      sql.includes('datdba') ? [{ dueno: 'app' }] : [],
    );
    await cliente.conectar(cx);
    expect(await cliente.duenoBase('mi_bd')).toBe('app');
    expect(consultas[0]!.params).toEqual(['mi_bd']);
    const vacio = montar(() => []);
    await vacio.cliente.conectar(cx);
    expect(await vacio.cliente.duenoBase('mi_bd')).toBeNull();
  });

  it('asignarDueno: ALTER DATABASE y el bloque DO dentro de la base, con el rol citado por el servidor', async () => {
    const { cliente, consultas, conexiones } = montar((sql) =>
      sql.startsWith('SELECT format(') ? [{ s: `ORDEN ${consultas.length}` }] : [],
    );
    await cliente.conectar(cx);
    await cliente.asignarDueno('mi_bd', 'App"Rol');
    expect(consultas[0]).toEqual({
      sql: `SELECT format('ALTER DATABASE "mi_bd" OWNER TO %I', $1::text) AS s`,
      params: ['App"Rol'],
    });
    expect(consultas[1]!.sql).toBe('ORDEN 1');
    expect(consultas[2]!.params).toEqual([SQL_ASIGNAR_DUENO, 'App"Rol']);
    // Dentro de la base, el administrador fija search_path: un esquema ajeno no tapa pg_catalog.
    expect(consultas[3]!.sql).toBe('SET search_path = pg_catalog, pg_temp');
    expect(consultas[4]!.sql).toBe('ORDEN 3');
    // el DO corre conectado a la base restaurada
    expect(conexiones.at(-1)!.base).toBe('mi_bd');
    expect(conexiones.at(-1)!.cerrada).toBe(true);
  });

  it('el bloque DO solo tiene un %L y el resto de % escapados para format()', () => {
    expect(SQL_ASIGNAR_DUENO.match(/(?<!%)%[A-Za-z]/g)).toEqual(['%L']);
    for (const t of [
      'TABLE',
      'VIEW',
      'MATERIALIZED VIEW',
      'SEQUENCE',
      'FUNCTION',
      'PROCEDURE',
      'DOMAIN',
      'TYPE',
    ]) {
      expect(SQL_ASIGNAR_DUENO).toContain(`'${t}'`);
    }
    expect(SQL_ASIGNAR_DUENO).toContain('ALTER SCHEMA %%I OWNER TO %%I');
    // Agregados sin argumentos: f(*), no f().
    expect(SQL_ASIGNAR_DUENO).toContain('p.pronargs');
    expect(SQL_ASIGNAR_DUENO).toContain("r.oid::regproc::text || '(*)'");
    expect(SQL_ASIGNAR_DUENO).toContain("deptype = 'e'");
  });

  it('errores de pg salen en español sin SQL ni claves', async () => {
    const cliente = new ClientePostgres(async () => ({
      query: async () => {
        throw Object.assign(new Error('syntax error near PASSWORD SECRETA'), {
          code: '42P04',
          query: 'CREATE DATABASE x',
        });
      },
      end: async () => undefined,
    }));
    await cliente.conectar(cx);
    const e = await cliente
      .crearBase('x', { usuario: 'u', clave: 'SECRETA' })
      .catch((x: Error) => x);
    expect((e as Error).message).toBe('No se pudo crear la base x: la base ya existe (42P04).');
    const e2 = await cliente.borrarBase('x').catch((x: Error) => x);
    expect((e2 as Error).message).not.toMatch(/DROP|SECRETA|syntax/);
  });

  it('borrarBase', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await cliente.borrarBase('mi_bd');
    expect(consultas[0]!.sql).toBe('DROP DATABASE "mi_bd"');
  });

  it('listarBases excluye plantillas y postgres', async () => {
    const { cliente, consultas } = montar(() => [{ nombre: 'a', tam: '2048' }]);
    await cliente.conectar(cx);
    expect(await cliente.listarBases()).toEqual([{ nombre: 'a', tamanoBytes: 2048 }]);
    expect(consultas[0]!.params).toEqual([['postgres', 'template0', 'template1']]);
  });

  it('tieneTablas se conecta a esa base y la cierra', async () => {
    const { cliente, conexiones } = montar(() => [{ n: 3 }]);
    await cliente.conectar(cx);
    expect(await cliente.tieneTablas('x')).toBe(true);
    expect(conexiones.map((c) => c.base)).toEqual(['postgres', 'x']);
    expect(conexiones[1]!.cerrada).toBe(true);
  });

  it('activarVector se conecta a la base y crea la extensión', async () => {
    const { cliente, consultas, conexiones } = montar();
    await cliente.conectar(cx);
    await cliente.activarVector('mi_bd');
    // Con search_path = pg_catalog, pg_temp la extensión iría a pg_catalog: el esquema va explícito.
    expect(consultas.at(-1)!.sql).toBe('CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA public');
    expect(conexiones.at(-1)!.base).toBe('mi_bd');
    expect(conexiones.at(-1)!.cerrada).toBe(true);
  });

  it('vectorActivo consulta pg_extension con el nombre como parámetro y se conecta a esa base', async () => {
    const { cliente, consultas, conexiones } = montar(() => [{ n: 1 }]);
    await cliente.conectar(cx);
    expect(await cliente.vectorActivo('template1')).toBe(true);
    const q = consultas.at(-1)!;
    expect(q.sql).toContain('pg_catalog.pg_extension');
    expect(q.params).toEqual(['vector']);
    expect(conexiones.at(-1)!.base).toBe('template1');
    expect(conexiones.at(-1)!.cerrada).toBe(true);
    await expect(cliente.vectorActivo('a"; DROP DATABASE x; --')).rejects.toThrow('no es válido');
  });

  it('quitarVector no usa CASCADE y un error sale traducido, sin SQL', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await cliente.quitarVectorPlantilla();
    expect(consultas.at(-1)!.sql).toBe('DROP EXTENSION IF EXISTS "vector"');
    expect(consultas.at(-1)!.sql).not.toMatch(/cascade/i);
    const malo = new ClientePostgres(async () => ({
      query: async () => {
        throw Object.assign(new Error('cannot drop extension vector: SECRETO'), { code: '2BP01' });
      },
      end: async () => undefined,
    }));
    await malo.conectar(cx);
    const e = await malo.quitarVector('x').catch((x: Error) => x);
    expect((e as Error).message).toContain('No se pudo quitar pgvector de x');
    expect((e as Error).message).not.toContain('SECRETO');
  });

  it('activarVector y quitarVector rechazan las bases del sistema; solo la plantilla escribe en template1', async () => {
    const { cliente, consultas, conexiones } = montar();
    await cliente.conectar(cx);
    for (const n of ['postgres', 'template0', 'template1']) {
      await expect(cliente.activarVector(n)).rejects.toThrow('base del sistema');
      await expect(cliente.quitarVector(n)).rejects.toThrow('base del sistema');
    }
    expect(consultas).toEqual([]);
    await cliente.activarVectorPlantilla();
    expect(conexiones.at(-1)!.base).toBe('template1');
    expect(consultas.at(-1)!.sql).toBe('CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA public');
  });

  it('una carrera en CREATE EXTENSION (23505 o 42710) cuenta como que ya estaba; 2BP01 habla de objetos que la usan', async () => {
    for (const code of ['23505', '42710']) {
      const c = new ClientePostgres(async () => ({
        query: async (sql: string) => {
          if (sql.startsWith('CREATE EXTENSION')) throw Object.assign(new Error('x'), { code });
          return { rows: [] };
        },
        end: async () => undefined,
      }));
      await c.conectar(cx);
      expect(await c.activarVector('a')).toBe(false);
    }
    const d = new ClientePostgres(async () => ({
      query: async (sql: string) => {
        if (sql.startsWith('DROP EXTENSION'))
          throw Object.assign(new Error('SECRETO'), { code: '2BP01' });
        return { rows: [] };
      },
      end: async () => undefined,
    }));
    await d.conectar(cx);
    const e = (await d.quitarVector('a').catch((x: Error) => x)) as Error;
    expect(e.message).toContain('(2BP01)');
    expect(e.message).toContain('hay objetos que usan la extensión');
    expect(e.message).not.toContain('SECRETO');
  });

  describe('las bases que crea WolfCore heredan pgvector de template1 (nacen de template0)', () => {
    /** template1 lleva pgvector; `extras` decide otras respuestas. */
    const conPlantilla = (plantilla: boolean, baseConVector = false, falla = false) => {
      const sqls: string[] = [];
      const bases: string[] = [];
      const c = new ClientePostgres(async (x) => {
        if (x.base) bases.push(x.base);
        return {
          query: async (sql: string, params?: unknown[]) => {
            sqls.push(sql);
            if (sql.includes('pg_extension')) {
              const n = x.base === 'template1' ? (plantilla ? 1 : 0) : baseConVector ? 1 : 0;
              return { rows: [{ n }] };
            }
            if (falla && sql.startsWith('CREATE EXTENSION')) {
              throw Object.assign(new Error('boom'), { code: '58P01' });
            }
            if (sql.includes('FROM pg_database')) return { rows: [{ n: 0 }] };
            void params;
            return { rows: [] };
          },
          end: async () => undefined,
        };
      });
      return { c, sqls, bases };
    };

    it('crearBase activa pgvector en la nueva si template1 lo lleva, y no si no', async () => {
      const si = conPlantilla(true);
      await si.c.conectar(cx);
      await si.c.crearBase('nueva');
      expect(si.bases).toContain('nueva');
      expect(si.sqls.filter((q) => q.startsWith('CREATE EXTENSION'))).toHaveLength(1);
      const no = conPlantilla(false);
      await no.c.conectar(cx);
      await no.c.crearBase('nueva');
      expect(no.sqls.some((q) => q.startsWith('CREATE EXTENSION'))).toBe(false);
    });

    it('si activarlo falla, la creación no falla y se avisa', async () => {
      const x = conPlantilla(true, false, true);
      await x.c.conectar(cx);
      const r = await x.c.crearBase('nueva');
      expect(r.aviso).toContain('se creó, pero no se pudo activar pgvector');
    });

    it('crearBaseConLocale hereda igual', async () => {
      const x = conPlantilla(true);
      await x.c.conectar(cx);
      await x.c.crearBaseConLocale('nueva', 'UTF8|C|C').catch(() => undefined);
      // El formato del orden lo arma el servidor; aquí solo importa que se pida la extensión.
      expect(x.sqls.filter((q) => q.startsWith('CREATE EXTENSION'))).toHaveLength(1);
    });

    it('reiniciarBase vuelve a activarlo si la base lo tenía, aunque template1 no', async () => {
      const x = conPlantilla(false, true);
      await x.c.conectar(cx);
      await x.c.reiniciarBase('mi_base');
      const orden = x.sqls.filter((q) =>
        /^(DROP DATABASE|CREATE DATABASE|CREATE EXTENSION)/.test(q),
      );
      expect(orden.map((q) => q.split(' ').slice(0, 2).join(' '))).toEqual([
        'DROP DATABASE',
        'CREATE DATABASE',
        'CREATE EXTENSION',
      ]);
      const sin = conPlantilla(false, false);
      await sin.c.conectar(cx);
      await sin.c.reiniciarBase('mi_base');
      expect(sin.sqls.some((q) => q.startsWith('CREATE EXTENSION'))).toBe(false);
    });
  });

  it('tieneVector consulta pg_available_extensions', async () => {
    const a = montar(() => [{ n: 1 }]);
    await a.cliente.conectar(cx);
    expect(await a.cliente.tieneVector()).toBe(true);
    expect(a.consultas[0]!.sql).toContain('pg_available_extensions');
    const b = montar(() => [{ n: 0 }]);
    await b.cliente.conectar(cx);
    expect(await b.cliente.tieneVector()).toBe(false);
  });

  it('un error asíncrono de la conexión no revienta y la siguiente llamada reconecta', async () => {
    const manejadores: ((e: unknown) => void)[] = [];
    let n = 0;
    const cliente = new ClientePostgres(async () => {
      n++;
      return {
        query: async () => ({ rows: [] }),
        end: async () => undefined,
        on: (_e, fn) => {
          manejadores.push(fn);
        },
      };
    });
    await cliente.conectar(cx);
    expect(() => manejadores[0]!(new Error('terminating connection (57P01)'))).not.toThrow();
    await cliente.listarBases();
    expect(n).toBe(2);
  });

  it('abrirCliente escucha "error" antes de conectar', async () => {
    const em = new EventEmitter();
    let escuchando = -1;
    const falso = Object.assign(em, {
      connect: async () => {
        escuchando = em.listenerCount('error');
      },
      query: async () => ({ rows: [] }),
      end: async () => undefined,
    }) as unknown as ClientePg;
    const con = await abrirCliente(falso);
    expect(escuchando).toBe(1);
    let avisado = false;
    con.on!('error', () => {
      avisado = true;
    });
    expect(() => em.emit('error', new Error('boom'))).not.toThrow();
    expect(avisado).toBe(true);
  });

  it('activarVector sin pgvector da un mensaje claro', async () => {
    const cliente = new ClientePostgres(async () => ({
      query: async () => {
        throw Object.assign(new Error('extension "vector" is not available'), { code: '0A000' });
      },
      end: async () => undefined,
    }));
    await cliente.conectar(cx);
    await expect(cliente.activarVector('x')).rejects.toThrow(
      'pgvector no está instalado: use "Instalar pgvector" en Bases de datos.',
    );
  });

  it('conectar con clave vacía no rompe el filtro del mensaje', async () => {
    const cliente = new ClientePostgres(async () => {
      throw new Error('boom');
    });
    await expect(cliente.conectar({ ...cx, clave: '' })).rejects.toThrow(/boom/);
  });

  it('sin conexión falla claro y cerrar libera', async () => {
    const { cliente, conexiones } = montar();
    await expect(cliente.listarBases()).rejects.toThrow(/conect/i);
    await cliente.conectar(cx);
    await cliente.cerrar();
    expect(conexiones[0]!.cerrada).toBe(true);
  });
});

describe('ClientePostgres: rol existente no cambia de clave (QA bd)', () => {
  const cx = { host: '127.0.0.1', puerto: 5432, usuario: 'postgres', clave: CLAVE };
  const montar = () => {
    const consultas: string[] = [];
    const cliente = new ClientePostgres(async (c) => {
      if (c.usuario === 'app' && c.clave !== 'x') {
        throw Object.assign(new Error('password authentication failed'), { code: '28P01' });
      }
      return {
        query: async (sql: string) => {
          consultas.push(sql);
          return { rows: sql.includes('FROM pg_roles') ? [{ n: 1 }] : [] };
        },
        end: async () => undefined,
      };
    });
    return { cliente, consultas };
  };

  it('misma clave: crea la base con ese dueño sin ALTER ROLE', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    const r = await cliente.crearBase('b', { usuario: 'app', clave: 'x' });
    expect(r.usuarioActualizado).toBe(false);
    expect(consultas.some((s) => s.includes("'ALTER ROLE"))).toBe(false);
    expect(consultas.some((s) => s.startsWith('CREATE DATABASE "b" OWNER "app"'))).toBe(true);
  });

  it('otra clave: error con código y no crea nada', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await expect(
      cliente.crearBase('b', { usuario: 'app', clave: 'claveOtra77' }),
    ).rejects.toMatchObject({
      codigo: 'bd.usuario_clave_distinta',
    });
    expect(consultas.some((s) => /^(CREATE|ALTER)/.test(s) || s.includes("'ALTER ROLE"))).toBe(
      false,
    );
  });
});

describe('ClientePostgres: roles privilegiados y sin login (ronda de seguridad)', () => {
  const cx = { host: '127.0.0.1', puerto: 5432, usuario: 'postgres', clave: CLAVE };
  const montar = (rol: { login?: boolean; super?: boolean } | null, errorConexion?: string) => {
    const consultas: string[] = [];
    const cliente = new ClientePostgres(async (c) => {
      if (c.usuario === 'app' && errorConexion) {
        throw Object.assign(new Error('x'), { code: errorConexion });
      }
      return {
        query: async (sql: string) => {
          consultas.push(sql);
          if (sql.includes('FROM pg_roles')) {
            return {
              rows: rol
                ? [{ n: 1, login: rol.login ?? true, super: rol.super ?? false }]
                : [{ n: 0 }],
            };
          }
          return { rows: [] };
        },
        end: async () => undefined,
      };
    });
    return { cliente, consultas };
  };
  const sinCambios = (consultas: string[]) =>
    expect(consultas.some((s) => /^(CREATE|ALTER)/.test(s) || s.includes("'ALTER ROLE"))).toBe(
      false,
    );

  it('rol NOLOGIN: error propio y nunca ALTER ROLE … LOGIN, ni con cambiarClave', async () => {
    for (const cambiarClave of [false, true]) {
      const { cliente, consultas } = montar({ login: false });
      await cliente.conectar(cx);
      await expect(
        cliente.crearBase('b', { usuario: 'app', clave: 'x', cambiarClave }),
      ).rejects.toMatchObject({ codigo: 'bd.rol_sin_login' });
      sinCambios(consultas);
    }
  });

  it('superusuario: rechazado', async () => {
    const { cliente, consultas } = montar({ super: true });
    await cliente.conectar(cx);
    await expect(
      cliente.crearBase('b', { usuario: 'app', clave: 'x', cambiarClave: true }),
    ).rejects.toMatchObject({ codigo: 'bd.usuario_privilegiado' });
    sinCambios(consultas);
  });

  it('28000 al comprobar la clave es "sin login", no "clave distinta"', async () => {
    const { cliente, consultas } = montar({}, '28000');
    await cliente.conectar(cx);
    await expect(cliente.crearBase('b', { usuario: 'app', clave: 'x' })).rejects.toMatchObject({
      codigo: 'bd.rol_sin_login',
    });
    sinCambios(consultas);
  });

  it('roles pg_* y el propio administrador se rechazan sin consultar', async () => {
    const { cliente, consultas } = montar(null);
    await cliente.conectar({ ...cx, usuario: 'admin_pg' });
    for (const u of ['pg_read_all_data', 'admin_pg']) {
      await expect(cliente.crearBase('b', { usuario: u, clave: 'x' })).rejects.toMatchObject({
        codigo: 'bd.usuario_privilegiado',
      });
    }
    expect(consultas).toHaveLength(0);
  });
});

describe('ClientePostgres: usuario de proyecto wolf_u_ (revisión de D16)', () => {
  const cx = { host: '127.0.0.1', puerto: 5432, usuario: 'postgres', clave: CLAVE };
  type Rol = { priv?: boolean; miembro?: number };
  const montar = (rol: Rol | null = null, fallaGrant = false) => {
    const consultas: { sql: string; params?: unknown[]; base?: string }[] = [];
    const alCrear: number[] = [];
    const cliente = new ClientePostgres(async (c) => ({
      query: async (sql: string, params?: unknown[]) => {
        consultas.push({ sql, params, base: c.base });
        if (sql.includes('FROM pg_roles')) {
          return {
            rows: rol
              ? [
                  {
                    n: 1,
                    login: true,
                    super: false,
                    priv: rol.priv ?? false,
                    miembro: rol.miembro ?? 0,
                  },
                ]
              : [{ n: 0 }],
          };
        }
        if (sql.startsWith('SELECT format(')) return { rows: [{ s: `ORDEN ${consultas.length}` }] };
        if (fallaGrant && sql.startsWith('GRANT CONNECT')) throw new Error('sin permiso');
        return { rows: [] };
      },
      end: async () => undefined,
    }));
    return { cliente, consultas, alCrear };
  };

  it('I6: con usuario, la base queda cerrada a PUBLIC y abierta solo a su usuario', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await cliente.crearBase('tienda', { usuario: 'wolf_u_tienda', clave: 'clave-prueba-falsa' });
    const sqls = consultas.map((q) => q.sql);
    const iBd = sqls.findIndex((s) => s.startsWith('CREATE DATABASE "tienda"'));
    const iRevoke = sqls.indexOf('REVOKE CONNECT, TEMPORARY ON DATABASE "tienda" FROM PUBLIC');
    const iGrant = sqls.indexOf('GRANT CONNECT, TEMPORARY ON DATABASE "tienda" TO "wolf_u_tienda"');
    expect(iBd).toBeGreaterThanOrEqual(0);
    expect(iRevoke).toBeGreaterThan(iBd);
    expect(iGrant).toBeGreaterThan(iRevoke);
  });

  it('I6: entregarBase también cierra la base a PUBLIC', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await cliente.entregarBase('tienda', 'wolf_u_tienda');
    const sqls = consultas.map((q) => q.sql);
    expect(sqls).toContain('REVOKE CONNECT, TEMPORARY ON DATABASE "tienda" FROM PUBLIC');
    expect(sqls).toContain('GRANT CONNECT, TEMPORARY ON DATABASE "tienda" TO "wolf_u_tienda"');
  });

  it('I6: las conexiones del administrador a otra base fijan search_path = pg_catalog, pg_temp', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await cliente.tieneTablas('tienda').catch(() => undefined);
    const enLaBase = consultas.filter((q) => q.base === 'tienda');
    expect(enLaBase[0]?.sql).toBe('SET search_path = pg_catalog, pg_temp');
  });

  it('menor 2: la clave de un wolf_u_ viaja como verificador SCRAM, nunca en claro', async () => {
    const { cliente, consultas } = montar();
    await cliente.conectar(cx);
    await cliente.crearBase('tienda', { usuario: 'wolf_u_tienda', clave: 'centinela-secreta-d' });
    const format = consultas.find((q) => q.sql.includes("'CREATE ROLE"));
    expect(String(format?.params?.[1])).toMatch(/^SCRAM-SHA-256\$4096:/);
    expect(JSON.stringify(consultas)).not.toContain('centinela-secreta-d');
  });

  it('menor 1: un wolf_u_ existente con CREATEROLE/CREATEDB/BYPASSRLS/REPLICATION o miembro de un rol se rechaza', async () => {
    for (const rol of [{ priv: true }, { miembro: 1 }]) {
      for (const cambiarClave of [false, true]) {
        const { cliente, consultas } = montar(rol);
        await cliente.conectar(cx);
        await expect(
          cliente.crearBase('tienda', {
            usuario: 'wolf_u_tienda',
            clave: 'clave-prueba-falsa',
            cambiarClave,
          }),
        ).rejects.toMatchObject({ codigo: 'bd.usuario_privilegiado' });
        expect(
          consultas.some(
            (q) => /^(CREATE|ALTER|GRANT|REVOKE)/.test(q.sql) || q.sql.includes("'ALTER ROLE"),
          ),
        ).toBe(false);
      }
    }
  });

  it('I4: alCrearBase se llama tras CREATE DATABASE aunque luego falle el permiso', async () => {
    const { cliente, consultas } = montar(null, true);
    await cliente.conectar(cx);
    const marcas: string[] = [];
    await expect(
      cliente.crearBase('tienda', {
        usuario: 'wolf_u_tienda',
        clave: 'clave-prueba-falsa',
        nueva: true,
        alCrearBase: () => marcas.push(consultas.at(-1)!.sql),
      }),
    ).rejects.toThrow();
    expect(marcas).toHaveLength(1);
    expect(marcas[0]).toMatch(/^CREATE DATABASE "tienda"/);
    // Nunca se deshace borrando la base: el reintento la retoma con la marca.
    expect(consultas.some((q) => q.sql.startsWith('DROP'))).toBe(false);
  });
});

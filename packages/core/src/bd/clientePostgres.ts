import pg from 'pg';
import { ErrorWolf } from '../errores';
import {
  errorClaveDistinta,
  errorRolSinLogin,
  errorUsuarioPrivilegiado,
  type OpcionesCrearBaseMotor,
} from './clienteMysql';

export interface ConexionPostgres {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  /** Base a la que conectar; por defecto "postgres". */
  base?: string;
}

export interface BasePostgres {
  nombre: string;
  tamanoBytes: number;
}

/** Lo mínimo que se usa de un cliente `pg` (permite inyectar uno falso en pruebas). */
export interface ConexionBajaPg {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
  /** Avisa de errores asíncronos de la conexión (cierre por el administrador, red caída). */
  on?(evento: 'error', fn: (e: unknown) => void): void;
}

export type FabricaConexionPg = (c: ConexionPostgres) => Promise<ConexionBajaPg>;

/** Nombres de base y de rol válidos en PostgreSQL. */
export const NOMBRE_BD_PG = /^[a-z_][a-z0-9_]{0,62}$/;
const NOMBRE = NOMBRE_BD_PG;
const SISTEMA = ['postgres', 'template0', 'template1'];
const ROLES_RESERVADOS = ['postgres'];

export function validarNombrePg(nombre: string): void {
  if (!NOMBRE.test(nombre)) {
    throw new Error(
      `El nombre "${nombre}" no es válido: use minúsculas, números y guion bajo, sin empezar por número (hasta 63 caracteres).`,
    );
  }
}

const id = (nombre: string): string => {
  validarNombrePg(nombre);
  return `"${nombre}"`;
};

function noSistema(nombre: string, verbo: 'borrar' | 'crear'): void {
  if (SISTEMA.includes(nombre)) {
    throw new Error(`No se puede ${verbo} la base del sistema ${nombre}.`);
  }
}

/** Mensaje claro, sin el SQL ni claves, para un error de pg. */
function traducir(e: unknown, accion: string): Error {
  const codigo = (e as { code?: unknown } | null)?.code;
  const c = typeof codigo === 'string' ? codigo : '';
  let motivo = 'el servidor rechazó la operación';
  if (c === '42P04') motivo = 'la base ya existe';
  else if (c === '3D000') motivo = 'la base no existe';
  else if (c === '42501' || c === '28000' || c === '28P01') motivo = 'permiso denegado';
  else if (c === '55006') motivo = 'la base está en uso';
  else if (c === 'ECONNREFUSED' || c === 'ECONNRESET' || c.startsWith('08'))
    motivo = 'se perdió la conexión con el servidor';
  return new Error(`No se pudo ${accion}: ${motivo}${c ? ` (${c})` : ''}.`);
}

/** Lo mínimo de pg.Client que usa `abrirCliente` (permite probar con un falso). */
export interface ClientePg extends ConexionBajaPg {
  connect(): Promise<unknown>;
  on(evento: 'error', fn: (e: unknown) => void): unknown;
}

/**
 * Conecta un cliente. El escuchador de 'error' va ANTES de connect(): sin él, un apagado del
 * servidor (57P01) o un reinicio de la conexión sería una excepción sin capturar en el proceso.
 */
export async function abrirCliente(cliente: ClientePg): Promise<ConexionBajaPg> {
  const avisos: ((e: unknown) => void)[] = [];
  cliente.on('error', (e) => {
    for (const f of avisos) f(e);
  });
  await cliente.connect();
  return {
    query: (sql, params) => cliente.query(sql, params),
    end: () => cliente.end(),
    on: (_evento, fn) => {
      avisos.push(fn);
    },
  };
}

const fabricaReal: FabricaConexionPg = (c) =>
  abrirCliente(
    new pg.Client({
      host: c.host,
      port: c.puerto,
      user: c.usuario,
      password: c.clave,
      database: c.base ?? 'postgres',
      connectionTimeoutMillis: 10_000,
    }) as unknown as ClientePg,
  );

export interface ResultadoCrearBasePg {
  /** true si el rol ya existía y su clave se cambió a la indicada. */
  usuarioActualizado: boolean;
  aviso?: string;
}

/**
 * Bloque DO que pasa a un rol (%L, lo completa format() en el servidor) los objetos que no son
 * del sistema ni de una extensión. Tablas antes que secuencias: las de una columna serial o
 * identity cambian con su tabla (cambiarlas aparte da error).
 */
export const SQL_ASIGNAR_DUENO = `DO $wolfcore$
DECLARE
  dueno text := %L;
  rol oid := (SELECT oid FROM pg_roles WHERE rolname = dueno);
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname FROM pg_namespace n
    WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
      AND n.nspowner <> rol
      AND n.nspowner IS DISTINCT FROM to_regrole('pg_database_owner')::oid
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_namespace'::regclass
                      AND d.objid = n.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER SCHEMA %%I OWNER TO %%I', r.nspname, dueno);
  END LOOP;
  FOR r IN
    SELECT c.oid, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
      AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_class'::regclass
                      AND d.objid = c.oid AND d.deptype = 'e')
    ORDER BY c.relkind = 'S', c.oid
  LOOP
    CONTINUE WHEN (SELECT relowner FROM pg_class WHERE oid = r.oid) = rol;
    EXECUTE format('ALTER %%s %%s OWNER TO %%I',
      CASE r.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW'
        WHEN 'f' THEN 'FOREIGN TABLE' WHEN 'S' THEN 'SEQUENCE' ELSE 'TABLE' END,
      r.oid::regclass, dueno);
  END LOOP;
  FOR r IN
    SELECT p.oid, p.prokind, p.pronargs FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema' AND p.proowner <> rol
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass
                      AND d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER %%s %%s OWNER TO %%I',
      CASE r.prokind WHEN 'a' THEN 'AGGREGATE' WHEN 'p' THEN 'PROCEDURE' ELSE 'FUNCTION' END,
      -- Un agregado sin argumentos se escribe f(*), no f().
      CASE WHEN r.prokind = 'a' AND r.pronargs = 0 THEN r.oid::regproc::text || '(*)'
        ELSE r.oid::regprocedure::text END, dueno);
  END LOOP;
  FOR r IN
    SELECT t.oid, t.typtype FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typtype IN ('e', 'd', 'r') AND t.typowner <> rol
      AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_type'::regclass
                      AND d.objid = t.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER %%s %%s OWNER TO %%I',
      CASE r.typtype WHEN 'd' THEN 'DOMAIN' ELSE 'TYPE' END, r.oid::regtype, dueno);
  END LOOP;
END
$wolfcore$`;

/** Administración básica de bases en PostgreSQL. */
export class ClientePostgres {
  private con: ConexionBajaPg | null = null;
  private datos: ConexionPostgres | null = null;

  constructor(private readonly fabrica: FabricaConexionPg = fabricaReal) {}

  async conectar(c: ConexionPostgres): Promise<void> {
    await this.cerrar();
    try {
      this.con = await this.abrir(c);
      this.datos = c;
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      throw new Error(
        `No se pudo conectar al servidor en el puerto ${c.puerto}: ${c.clave ? m.split(c.clave).join('***') : m}`,
      );
    }
  }

  /** Abre una conexión; si el servidor la cierra, se descarta y se reabre al usarla. */
  private async abrir(c: ConexionPostgres): Promise<ConexionBajaPg> {
    const con = await this.fabrica({ ...c, base: c.base ?? 'postgres' });
    con.on?.('error', () => {
      if (this.con === con) this.con = null;
    });
    return con;
  }

  async cerrar(): Promise<void> {
    const c = this.con;
    this.con = null;
    this.datos = null;
    if (c) await c.end().catch(() => undefined);
  }

  private async conexion(): Promise<ConexionBajaPg> {
    if (!this.datos) throw new Error('No hay conexión: conecte con el servidor primero.');
    if (!this.con) {
      try {
        this.con = await this.abrir(this.datos);
      } catch {
        throw new Error('Se perdió la conexión con el servidor y no se pudo restablecer.');
      }
    }
    return this.con;
  }

  private async filas(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
    return (await (await this.conexion()).query(sql, params)).rows as Record<string, unknown>[];
  }

  /** Abre una conexión breve a otra base con las mismas credenciales. */
  private async enBase<T>(base: string, fn: (q: ConexionBajaPg) => Promise<T>): Promise<T> {
    await this.conexion();
    const c = await this.fabrica({ ...this.datos!, base });
    try {
      return await fn(c);
    } finally {
      await c.end().catch(() => undefined);
    }
  }

  async listarBases(): Promise<BasePostgres[]> {
    const filas = await this.filas(
      'SELECT datname AS nombre, pg_database_size(datname) AS tam FROM pg_database ' +
        'WHERE NOT datistemplate AND datname <> ALL($1::text[]) ORDER BY datname',
      [SISTEMA],
    );
    return filas.map((f) => ({ nombre: String(f.nombre), tamanoBytes: Number(f.tam) }));
  }

  /** Como en MySQL: una conexión breve con el rol; contraseña rechazada = clave distinta. */
  private async comprobarClave(usuario: string, clave: string): Promise<void> {
    if (!this.datos) throw new Error('No hay conexión: conecte con el servidor primero.');
    let c: ConexionBajaPg;
    try {
      c = await this.fabrica({ ...this.datos, usuario, clave, base: 'postgres' });
    } catch (e) {
      const codigo = String((e as { code?: unknown } | null)?.code ?? '');
      if (codigo === '28P01') throw errorClaveDistinta(usuario);
      // 28000: el servidor no deja entrar al rol (NOLOGIN o pg_hba), no es la clave.
      if (codigo === '28000') throw errorRolSinLogin(usuario);
      throw new Error(
        `No se pudo comprobar la clave del usuario ${usuario}${codigo ? ` (${codigo})` : ''}; no se cambió nada.`,
      );
    }
    await c.end().catch(() => undefined);
  }

  async crearBase(
    nombre: string,
    opts: OpcionesCrearBaseMotor = {},
  ): Promise<ResultadoCrearBasePg> {
    const bd = id(nombre);
    noSistema(nombre, 'crear');
    const { usuario, clave } = opts;
    let rol = '';
    if (usuario !== undefined) {
      rol = id(usuario);
      if (ROLES_RESERVADOS.includes(usuario)) {
        throw new Error(`El usuario "${usuario}" está reservado: elija otro nombre.`);
      }
      if (!clave) throw new Error('Indique una clave para el usuario de la base.');
      if (/^pg_/i.test(usuario) || (this.datos && usuario === this.datos.usuario)) {
        throw errorUsuarioPrivilegiado(usuario);
      }
    }
    let claveCambiada = false;
    try {
      let existia = false;
      // El propio servidor arma la sentencia con la clave entre comillas (%L).
      const rolConClave = async (verbo: 'CREATE ROLE' | 'ALTER ROLE'): Promise<void> => {
        const [orden] = await this.filas(
          `SELECT format('${verbo} %I LOGIN PASSWORD %L', $1::text, $2::text) AS s`,
          [usuario, clave],
        );
        await this.filas(String(orden?.s ?? ''));
      };
      if (usuario !== undefined) {
        const r = await this.filas(
          'SELECT COUNT(*) AS n, bool_and(rolcanlogin) AS login, bool_or(rolsuper) AS super ' +
            'FROM pg_roles WHERE rolname = $1',
          [usuario],
        );
        existia = Number(r[0]?.n ?? 0) > 0;
        // Un superusuario o un rol NOLOGIN nunca se usan ni se tocan (ni con cambiarClave):
        // nunca se hace ALTER ROLE … LOGIN sobre un rol que no podía entrar.
        if (existia && r[0]?.super === true) throw errorUsuarioPrivilegiado(usuario);
        if (existia && r[0]?.login === false) throw errorRolSinLogin(usuario);
        // Rol existente: su clave no se toca salvo pedido explícito; antes de crear nada se
        // comprueba que la indicada sea la suya.
        if (existia && !opts.cambiarClave) await this.comprobarClave(usuario, clave!);
        if (!existia) await rolConClave('CREATE ROLE');
      }
      const hay = await this.filas('SELECT COUNT(*) AS n FROM pg_database WHERE datname = $1', [
        nombre,
      ]);
      if (Number(hay[0]?.n ?? 0) === 0) {
        // El dueño de la base lo es también del esquema public (PG15+): puede crear tablas.
        const dueno = usuario === undefined ? '' : ` OWNER ${rol}`;
        await this.filas(
          `CREATE DATABASE ${bd}${dueno} ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`,
        );
      } else if (usuario !== undefined) {
        await this.filas(`ALTER DATABASE ${bd} OWNER TO ${rol}`);
      }
      if (usuario === undefined) return { usuarioActualizado: false };
      if (!existia) return { usuarioActualizado: false };
      if (!opts.cambiarClave) {
        return {
          usuarioActualizado: false,
          aviso: `El usuario ${usuario} ya existía: se usó su clave actual y es el dueño de la base ${nombre}.`,
        };
      }
      // La clave de un rol existente se cambia al FINAL: si algo anterior falla, queda como estaba.
      await rolConClave('ALTER ROLE');
      claveCambiada = true;
      return {
        usuarioActualizado: true,
        aviso: `El usuario ${usuario} ya existía: su clave se cambió a la nueva.`,
      };
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      const err = traducir(e, `crear la base ${nombre}`);
      if (claveCambiada) err.message += ` La clave del usuario ${usuario} ya se cambió a la nueva.`;
      throw err;
    }
  }

  /** Dueño actual de la base (null si no existe). */
  async duenoBase(nombre: string): Promise<string | null> {
    validarNombrePg(nombre);
    try {
      const f = await this.filas(
        'SELECT pg_get_userbyid(datdba) AS dueno FROM pg_database WHERE datname = $1',
        [nombre],
      );
      return f[0] ? String(f[0].dueno) : null;
    } catch (e) {
      throw traducir(e, `leer el dueño de la base ${nombre}`);
    }
  }

  /**
   * Devuelve la base y sus objetos a `dueno`: la base, los esquemas que no son del sistema, las
   * tablas, vistas, secuencias, tablas foráneas, funciones, procedimientos, tipos y dominios.
   * Tras restaurar como superusuario (pg_restore --no-owner o psql) todo quedaría a nombre de
   * este y el usuario del proyecto no podría leer sus propias tablas. Se omiten los objetos de
   * extensiones y el esquema public cuando es de pg_database_owner (PG15+).
   */
  async asignarDueno(nombre: string, dueno: string): Promise<void> {
    const bd = id(nombre);
    noSistema(nombre, 'crear');
    try {
      const [orden] = await this.filas(
        `SELECT format('ALTER DATABASE ${bd} OWNER TO %I', $1::text) AS s`,
        [dueno],
      );
      await this.filas(String(orden?.s ?? ''));
      const [bloque] = await this.filas('SELECT format($1, $2::text) AS s', [
        SQL_ASIGNAR_DUENO,
        dueno,
      ]);
      await this.enBase(nombre, (q) => q.query(String(bloque?.s ?? '')));
    } catch (e) {
      throw traducir(e, `asignar el dueño ${dueno} a la base ${nombre}`);
    }
  }

  /** Cierra las demás conexiones a `nombre` (no la propia), para poder borrarla. */
  async terminarConexiones(nombre: string): Promise<void> {
    validarNombrePg(nombre);
    try {
      await this.filas(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
        [nombre],
      );
    } catch (e) {
      throw traducir(e, `cerrar las conexiones a ${nombre}`);
    }
  }

  /** `forzar` (PostgreSQL 13+) agrega WITH (FORCE): cierra las conexiones que queden abiertas. */
  async borrarBase(nombre: string, opts: { forzar?: boolean } = {}): Promise<void> {
    const bd = id(nombre);
    noSistema(nombre, 'borrar');
    try {
      await this.filas(`DROP DATABASE ${bd}${opts.forzar ? ' WITH (FORCE)' : ''}`);
    } catch (e) {
      throw traducir(e, `borrar la base ${nombre}`);
    }
  }

  /** Texto de `SELECT version()` (p. ej. "PostgreSQL 17.2, compiled by…"); solo lectura. */
  async version(): Promise<string> {
    const f = await this.filas('SELECT version() AS version');
    return String(f[0]?.version ?? '');
  }

  async tieneTablas(nombre: string): Promise<boolean> {
    validarNombrePg(nombre);
    try {
      return await this.enBase(nombre, async (q) => {
        const { rows } = await q.query(
          "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema')",
        );
        return Number((rows[0] as { n?: unknown } | undefined)?.n ?? 0) > 0;
      });
    } catch (e) {
      throw traducir(e, `revisar la base ${nombre}`);
    }
  }

  /** Activa pgvector en `base` (la extensión es por base). */
  async activarVector(base: string): Promise<void> {
    validarNombrePg(base);
    try {
      await this.enBase(base, (q) => q.query('CREATE EXTENSION IF NOT EXISTS vector'));
    } catch (e) {
      const c = (e as { code?: unknown } | null)?.code;
      const m = e instanceof Error ? e.message : '';
      if (c === '0A000' || c === '58P01' || /is not available|extension control file/.test(m)) {
        throw new Error('pgvector no está instalado: use "Instalar pgvector" en Bases de datos.');
      }
      throw traducir(e, `activar pgvector en ${base}`);
    }
  }

  /** true si el servidor trae la extensión vector (pgvector compilada e instalada). */
  async tieneVector(): Promise<boolean> {
    const f = await this.filas(
      "SELECT COUNT(*) AS n FROM pg_available_extensions WHERE name = 'vector'",
    );
    return Number(f[0]?.n ?? 0) > 0;
  }
}

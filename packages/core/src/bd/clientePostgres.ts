import { randomBytes } from 'node:crypto';
import pg from 'pg';
import {
  hashScramSha256,
  nombreTemporal,
  NOMBRE_TEMPORAL,
  rolDuenoDe,
  temporalVencido,
  VIDA_TEMPORAL_MS,
} from './temporales';
import { ErrorWolf } from '../errores';
import { esUsuarioDeProyecto } from './usuarioProyecto';
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

function noSistemaVector(nombre: string): void {
  if (SISTEMA.includes(nombre)) {
    throw new Error(`No se puede tocar pgvector en la base del sistema ${nombre}.`);
  }
}

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
  else if (c === '2BP01') motivo = 'hay objetos que usan la extensión';
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

  /**
   * Una consulta con parámetros y sus filas (D20). Quien la llama arma el SQL solo con nombres que
   * ya comprobó contra el catálogo; los valores van siempre en `params`.
   */
  async consultar(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    return this.filas(sql, params);
  }

  /** Abre una conexión breve a otra base con las mismas credenciales. */
  private async enBase<T>(base: string, fn: (q: ConexionBajaPg) => Promise<T>): Promise<T> {
    await this.conexion();
    const c = await this.fabrica({ ...this.datos!, base });
    try {
      // Un esquema de la base (de un tercero) no puede tapar funciones del catálogo del administrador.
      await c.query('SET search_path = pg_catalog, pg_temp');
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
    let avisoVector: string | null = null;
    const salida = (r: ResultadoCrearBasePg): ResultadoCrearBasePg =>
      avisoVector ? { ...r, aviso: [r.aviso, avisoVector].filter(Boolean).join(' ') } : r;
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
    let creada = false;
    try {
      let existia = false;
      // El propio servidor arma la sentencia con la clave entre comillas (%L).
      const rolConClave = async (verbo: 'CREATE ROLE' | 'ALTER ROLE'): Promise<void> => {
        const [orden] = await this.filas(
          `SELECT format('${verbo} %I LOGIN PASSWORD %L', $1::text, $2::text) AS s`,
          [usuario, esUsuarioDeProyecto(usuario!) ? hashScramSha256(clave!) : clave],
        );
        await this.filas(String(orden?.s ?? ''));
      };
      const hay = await this.filas('SELECT COUNT(*) AS n FROM pg_database WHERE datname = $1', [
        nombre,
      ]);
      // Una base que debe ser nueva se comprueba antes de crear el rol: si ya existe, no queda
      // un rol suelto.
      if (opts.nueva && Number(hay[0]?.n ?? 0) > 0) {
        throw new ErrorWolf('proyectos.base_existe', `La base ${nombre} ya existe.`, { nombre });
      }
      if (usuario !== undefined) {
        const r = await this.filas(
          'SELECT COUNT(*) AS n, bool_and(rolcanlogin) AS login, bool_or(rolsuper) AS super, ' +
            'bool_or(rolcreaterole OR rolcreatedb OR rolbypassrls OR rolreplication) AS priv, ' +
            '(SELECT COUNT(*) FROM pg_auth_members m JOIN pg_roles q ON q.oid = m.member WHERE q.rolname = $1) AS miembro ' +
            'FROM pg_roles WHERE rolname = $1',
          [usuario],
        );
        existia = Number(r[0]?.n ?? 0) > 0;
        // Un superusuario o un rol NOLOGIN nunca se usan ni se tocan (ni con cambiarClave):
        // nunca se hace ALTER ROLE … LOGIN sobre un rol que no podía entrar.
        if (existia && r[0]?.super === true) throw errorUsuarioPrivilegiado(usuario);
        // Un wolf_u_ existente solo se reutiliza si no tiene nada más que su base.
        if (
          existia &&
          esUsuarioDeProyecto(usuario) &&
          (r[0]?.priv === true || Number(r[0]?.miembro ?? 0) > 0)
        ) {
          throw errorUsuarioPrivilegiado(usuario);
        }
        if (existia && r[0]?.login === false) throw errorRolSinLogin(usuario);
        // Rol existente: su clave no se toca salvo pedido explícito; antes de crear nada se
        // comprueba que la indicada sea la suya.
        if (existia && !opts.cambiarClave) await this.comprobarClave(usuario, clave!);
        if (!existia) await rolConClave('CREATE ROLE');
      }
      if (Number(hay[0]?.n ?? 0) === 0) {
        // El dueño de la base lo es también del esquema public (PG15+): puede crear tablas.
        const dueno = usuario === undefined ? '' : ` OWNER ${rol}`;
        await this.filas(
          `CREATE DATABASE ${bd}${dueno} ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`,
        );
        // Desde aquí la base es de esta creación: un reintento tras un fallo posterior la retoma.
        creada = true;
        opts.alCrearBase?.();
        avisoVector = await this.heredarVector(nombre);
      } else if (usuario !== undefined) {
        await this.filas(`ALTER DATABASE ${bd} OWNER TO ${rol}`);
      }
      // Solo una base que nace aquí (o que el proyecto ya creó: `aislar`) se cierra a PUBLIC; una
      // que ya existía puede tener otros usuarios.
      if (usuario !== undefined && (creada || opts.aislar)) await this.aislarBase(nombre, usuario);
      if (usuario === undefined) return salida({ usuarioActualizado: false });
      if (!existia) return salida({ usuarioActualizado: false });
      if (!opts.cambiarClave) {
        return salida({
          usuarioActualizado: false,
          aviso: `El usuario ${usuario} ya existía: se usó su clave actual y es el dueño de la base ${nombre}.`,
        });
      }
      // La clave de un rol existente se cambia al FINAL: si algo anterior falla, queda como estaba.
      await rolConClave('ALTER ROLE');
      claveCambiada = true;
      return salida({
        usuarioActualizado: true,
        aviso: `El usuario ${usuario} ya existía: su clave se cambió a la nueva.`,
      });
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      const err = traducir(e, `crear la base ${nombre}`);
      if (claveCambiada) err.message += ` La clave del usuario ${usuario} ya se cambió a la nueva.`;
      throw err;
    }
  }

  /**
   * Solo el dueño entra a su base: quita CONNECT y TEMPORARY a PUBLIC y se los da al usuario
   * (el administrador conserva su acceso por ser superusuario).
   */
  private async aislarBase(base: string, usuario: string): Promise<void> {
    await this.filas(`REVOKE CONNECT, TEMPORARY ON DATABASE ${id(base)} FROM PUBLIC`);
    await this.filas(`GRANT CONNECT, TEMPORARY ON DATABASE ${id(base)} TO ${id(usuario)}`);
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

  /**
   * Rol temporal sin privilegios (LOGIN, NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION
   * NOBYPASSRLS, sin ningún rol pg_*) que pasa a ser el dueño de `base`: puede crear sus objetos y
   * nada más. Vence en una hora (VALID UNTIL) y su clave viaja ya hasheada (SCRAM-SHA-256). Se
   * retira con `retirarRolTemporal`.
   */
  async crearRolTemporal(base: string): Promise<{ usuario: string; clave: string }> {
    const bd = id(base);
    noSistema(base, 'crear');
    await this.limpiarTemporales().catch(() => undefined);
    const usuario = nombreTemporal();
    const clave = randomBytes(18).toString('hex');
    const vence = new Date(Date.now() + VIDA_TEMPORAL_MS).toISOString();
    try {
      const [orden] = await this.filas(
        "SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L VALID UNTIL %L', $1::text, $2::text, $3::text) AS s",
        [usuario, hashScramSha256(clave), vence],
      );
      await this.filas(String(orden?.s ?? ''));
      await this.filas(`ALTER DATABASE ${bd} OWNER TO ${id(usuario)}`);
    } catch (e) {
      await this.filas(`DROP ROLE IF EXISTS ${id(usuario)}`).catch(() => undefined);
      throw traducir(e, `crear un rol temporal para ${base}`);
    }
    return { usuario, clave };
  }

  /**
   * Pasa la base y sus objetos a un rol por base sin login ni privilegios (`wolf_dueno_…`), no al
   * administrador: una función SECURITY DEFINER del esquema nunca corre como superusuario. Luego
   * borra el rol temporal.
   */
  async retirarRolTemporal(usuario: string, base: string): Promise<void> {
    if (!NOMBRE_TEMPORAL.test(usuario)) {
      throw new Error('Solo se borran los roles temporales de WolfCore Dev.');
    }
    const rol = id(usuario);
    validarNombrePg(base);
    const dueno = rolDuenoDe(base);
    const hay = await this.filas('SELECT 1 AS n FROM pg_roles WHERE rolname = $1', [dueno]);
    if (hay.length === 0) {
      await this.filas(
        `CREATE ROLE ${id(dueno)} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
      );
    }
    await this.enBase(base, async (q) => {
      await q.query(`REASSIGN OWNED BY ${rol} TO ${id(dueno)}`);
      await q.query(`DROP OWNED BY ${rol}`);
    });
    await this.filas(`DROP ROLE IF EXISTS ${rol}`);
  }

  /**
   * Pasa la base y los objetos que restauró un esquema (hoy del rol sin login `wolf_dueno_…`) al
   * usuario propio del proyecto, que no es superusuario ni tiene roles `pg_*`: así el proyecto
   * puede usar las tablas que trajo la plantilla.
   */
  async entregarBase(base: string, usuario: string): Promise<void> {
    validarNombrePg(base);
    if (ROLES_RESERVADOS.includes(usuario) || /^pg_/i.test(usuario)) {
      throw errorUsuarioPrivilegiado(usuario);
    }
    const dueno = rolDuenoDe(base);
    const rol = id(usuario);
    const hay = await this.filas('SELECT 1 AS n FROM pg_roles WHERE rolname = $1', [dueno]);
    await this.filas(`ALTER DATABASE ${id(base)} OWNER TO ${rol}`);
    await this.aislarBase(base, usuario);
    if (hay.length === 0) return;
    await this.enBase(base, async (q) => {
      await q.query(`REASSIGN OWNED BY ${id(dueno)} TO ${rol}`);
    });
  }

  /**
   * Revisa el catálogo de `base` después de restaurar: disparadores de evento, funciones
   * SECURITY DEFINER (solo en importadas), extensiones fuera de `permitidas`, foráneos y
   * lenguajes que no sean SQL ni plpgsql. Devuelve lo que encontró (vacío si está limpio).
   */
  async auditarCatalogo(
    base: string,
    o: { permitidas: readonly string[]; importada: boolean },
  ): Promise<string[]> {
    validarNombrePg(base);
    const problemas: string[] = [];
    await this.enBase(base, async (q) => {
      const fila = async (sql: string, p: unknown[] = []): Promise<Record<string, unknown>[]> =>
        (await q.query(sql, p)).rows as Record<string, unknown>[];
      for (const f of await fila('SELECT evtname FROM pg_event_trigger')) {
        problemas.push(`disparador de evento ${String(f.evtname)}`);
      }
      for (const f of await fila(
        'SELECT extname FROM pg_extension WHERE extname <> ALL($1::text[])',
        [[...o.permitidas]],
      )) {
        problemas.push(`extensión ${String(f.extname)}`);
      }
      for (const f of await fila('SELECT srvname FROM pg_foreign_server')) {
        problemas.push(`servidor foráneo ${String(f.srvname)}`);
      }
      const propias =
        "n.nspname !~ '^pg_' AND n.nspname <> 'information_schema' AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')";
      for (const f of await fila(
        `SELECT DISTINCT l.lanname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang WHERE ${propias} AND l.lanname NOT IN ('sql', 'plpgsql')`,
      )) {
        problemas.push(`lenguaje ${String(f.lanname)}`);
      }
      if (o.importada) {
        for (const f of await fila(
          `SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.prosecdef AND ${propias}`,
        )) {
          problemas.push(`función SECURITY DEFINER ${String(f.proname)}`);
        }
      }
    });
    return problemas;
  }

  /** Deja la base vacía (la borra y la vuelve a crear a nombre del administrador). */
  async reiniciarBase(nombre: string): Promise<string | null> {
    const bd = id(nombre);
    noSistema(nombre, 'borrar');
    // Si la base llevaba pgvector, la vacía lo conserva (aunque template1 no lo tenga).
    const tenia = await this.vectorActivo(nombre).catch(() => false);
    await this.filas(`DROP DATABASE IF EXISTS ${bd} WITH (FORCE)`);
    await this.filas(
      `CREATE DATABASE ${bd} ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`,
    );
    return this.heredarVector(nombre, tenia);
  }

  /**
   * Rol temporal de la auditoría de contraseñas (D20): LOGIN sin ningún privilegio de
   * administración, que no hereda nada y que no es dueño de nada. Solo puede conectarse a esta
   * base, usar el esquema y leer la tabla (y, para restablecer, cambiar la columna del hash). Los
   * disparadores de la tabla corren con sus permisos, no con los del administrador. Vence en una
   * hora (VALID UNTIL) y su clave viaja ya hasheada (SCRAM-SHA-256). Se quita con
   * `retirarRolAuditoria`; `limpiarTemporales` recoge el que quede.
   */
  async crearRolAuditoria(o: {
    base: string;
    esquema: string;
    tabla: string;
    columnaHash: string;
    escritura: boolean;
  }): Promise<{ usuario: string; clave: string }> {
    validarNombrePg(o.base);
    const usuario = nombreTemporal();
    const clave = randomBytes(18).toString('hex');
    const vence = new Date(Date.now() + VIDA_TEMPORAL_MS).toISOString();
    const q = (n: string): string => `"${n.replace(/"/g, '""')}"`;
    const rol = q(usuario);
    const tabla = `${q(o.esquema)}.${q(o.tabla)}`;
    try {
      await this.filas(
        `CREATE ROLE ${rol} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS ` +
          `PASSWORD '${hashScramSha256(clave)}' VALID UNTIL '${vence}'`,
      );
      await this.filas(`GRANT CONNECT ON DATABASE ${q(o.base)} TO ${rol}`);
      await this.filas(`GRANT USAGE ON SCHEMA ${q(o.esquema)} TO ${rol}`);
      await this.filas(`GRANT SELECT ON TABLE ${tabla} TO ${rol}`);
      if (o.escritura) {
        await this.filas(`GRANT UPDATE (${q(o.columnaHash)}) ON TABLE ${tabla} TO ${rol}`);
      }
    } catch (e) {
      await this.retirarRolAuditoria({ ...o, usuario }).catch(() => undefined);
      throw traducir(e, `crear un rol temporal de lectura para ${o.base}`);
    }
    return { usuario, clave };
  }

  /** Quita los permisos del rol de auditoría, sus restos en esta base y el rol mismo. */
  async retirarRolAuditoria(o: {
    usuario: string;
    base: string;
    esquema: string;
    tabla: string;
  }): Promise<void> {
    if (!NOMBRE_TEMPORAL.test(o.usuario)) {
      throw new Error('Solo se borran los roles temporales de WolfCore Dev.');
    }
    validarNombrePg(o.base);
    const q = (n: string): string => `"${n.replace(/"/g, '""')}"`;
    const rol = q(o.usuario);
    const pasos = [
      `REVOKE ALL ON TABLE ${q(o.esquema)}.${q(o.tabla)} FROM ${rol}`,
      `REVOKE ALL ON SCHEMA ${q(o.esquema)} FROM ${rol}`,
      `REVOKE ALL ON DATABASE ${q(o.base)} FROM ${rol}`,
      `DROP OWNED BY ${rol}`,
      `DROP ROLE IF EXISTS ${rol}`,
    ];
    let fallo: unknown;
    for (const p of pasos) {
      try {
        await this.filas(p);
      } catch (e) {
        fallo ??= e;
      }
    }
    if (fallo) throw fallo;
  }

  /** Borra los roles `wolf_tmp_*` vencidos que dejó una restauración interrumpida. */
  async limpiarTemporales(): Promise<number> {
    const admin = this.datos?.usuario;
    if (!admin) return 0;
    const roles = await this.filas(
      "SELECT rolname FROM pg_roles WHERE rolname LIKE 'wolf\\_tmp\\_%'",
    );
    let n = 0;
    for (const r of roles) {
      const rol = String(r.rolname);
      if (!temporalVencido(rol)) continue;
      try {
        const bases = await this.filas(
          'SELECT datname FROM pg_database WHERE datdba = (SELECT oid FROM pg_roles WHERE rolname = $1)',
          [rol],
        );
        for (const b of bases) {
          await this.filas(`ALTER DATABASE ${id(String(b.datname))} OWNER TO ${id(admin)}`);
        }
        const todas = await this.filas('SELECT datname FROM pg_database WHERE NOT datistemplate');
        for (const b of todas) {
          await this.enBase(String(b.datname), async (q) => {
            await q.query(`REASSIGN OWNED BY ${id(rol)} TO ${id(admin)}`);
            await q.query(`DROP OWNED BY ${id(rol)}`);
          }).catch(() => undefined);
        }
        await this.filas(`DROP ROLE IF EXISTS ${id(rol)}`);
        n++;
      } catch {
        // Otro intento lo limpiará.
      }
    }
    return n;
  }

  /** Crea una extensión en la base (lo hace el administrador, desde una lista permitida). */
  async crearExtension(base: string, nombre: string): Promise<void> {
    validarNombrePg(base);
    if (!/^[a-z][a-z0-9_-]{0,62}$/.test(nombre)) throw new Error('Nombre de extensión no válido.');
    try {
      await this.enBase(base, (q) =>
        q.query(`CREATE EXTENSION IF NOT EXISTS "${nombre}" SCHEMA public`),
      );
    } catch (e) {
      throw traducir(e, `activar la extensión ${nombre} en ${base}`);
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

  /** Codificación, LC_COLLATE y LC_CTYPE de la base (`UTF8|es_AR.UTF-8|es_AR.UTF-8`), o null. */
  async localeBase(nombre: string): Promise<string | null> {
    validarNombrePg(nombre);
    const f = await this.filas(
      'SELECT pg_encoding_to_char(encoding) AS e, datcollate AS c, datctype AS t FROM pg_database WHERE datname = $1',
      [nombre],
    );
    const { e, c, t } = (f[0] ?? {}) as { e?: unknown; c?: unknown; t?: unknown };
    const ok = (v: unknown): v is string =>
      typeof v === 'string' && /^[A-Za-z0-9_.@-]{1,64}$/.test(v);
    return ok(e) && ok(c) && ok(t) ? `${e}|${c}|${t}` : null;
  }

  /** Crea la base con la codificación y las reglas regionales de `locale` (de `localeBase`). */
  async crearBaseConLocale(nombre: string, locale: string): Promise<string | null> {
    const bd = id(nombre);
    noSistema(nombre, 'crear');
    const partes = locale.split('|');
    if (partes.length !== 3 || !partes.every((p) => /^[A-Za-z0-9_.@-]{1,64}$/.test(p))) {
      throw new Error('Configuración regional no válida.');
    }
    try {
      const [orden] = await this.filas(
        "SELECT format('CREATE DATABASE %s TEMPLATE template0 ENCODING %L LC_COLLATE %L LC_CTYPE %L', $1::text, $2::text, $3::text, $4::text) AS s",
        [bd, partes[0], partes[1], partes[2]],
      );
      await this.filas(String(orden?.s ?? ''));
    } catch (e) {
      throw traducir(e, `crear la base ${nombre}`);
    }
    return this.heredarVector(nombre);
  }

  /** Tablas de la base, sin las del sistema ni las vistas. */
  async contarTablas(nombre: string): Promise<number> {
    validarNombrePg(nombre);
    try {
      return await this.enBase(nombre, async (q) => {
        const { rows } = await q.query(
          "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema')",
        );
        return Number((rows[0] as { n?: unknown } | undefined)?.n ?? 0);
      });
    } catch (e) {
      throw traducir(e, `revisar la base ${nombre}`);
    }
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

  /**
   * Activa pgvector en `base` (la extensión es por base). Devuelve false si ya existía (otra
   * conexión la creó a la vez: 23505 o 42710). Las bases del sistema solo las toca
   * `activarVectorPlantilla`, para `template1`.
   */
  async activarVector(base: string): Promise<boolean> {
    validarNombrePg(base);
    noSistemaVector(base);
    return this.crearVector(base);
  }

  private async crearVector(base: string): Promise<boolean> {
    try {
      await this.enBase(base, (q) =>
        q.query('CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA public'),
      );
      return true;
    } catch (e) {
      const c = (e as { code?: unknown } | null)?.code;
      const m = e instanceof Error ? e.message : '';
      if (c === '23505' || c === '42710') return false;
      if (c === '0A000' || c === '58P01' || /is not available|extension control file/.test(m)) {
        throw new Error('pgvector no está instalado: use "Instalar pgvector" en Bases de datos.');
      }
      throw traducir(e, `activar pgvector en ${base}`);
    }
  }

  /** Crea pgvector en `template1`: las bases que se creen después la tendrán. */
  async activarVectorPlantilla(): Promise<boolean> {
    return this.crearVector('template1');
  }

  /** Quita pgvector de `template1` (sin CASCADE). */
  async quitarVectorPlantilla(): Promise<void> {
    await this.borrarVector('template1');
  }

  /** ¿La extensión vector está creada en `base` (también `template1`)? Sin interpolar nada. */
  async vectorActivo(base: string): Promise<boolean> {
    validarNombrePg(base);
    try {
      return await this.enBase(base, async (q) => {
        const { rows } = await q.query(
          'SELECT COUNT(*) AS n FROM pg_catalog.pg_extension WHERE extname = $1',
          ['vector'],
        );
        return Number((rows[0] as { n?: unknown } | undefined)?.n ?? 0) > 0;
      });
    } catch (e) {
      throw traducir(e, `revisar pgvector en ${base}`);
    }
  }

  /** Quita pgvector de `base` sin CASCADE: si hay columnas que lo usan, falla y no borra nada. */
  async quitarVector(base: string): Promise<void> {
    validarNombrePg(base);
    noSistemaVector(base);
    await this.borrarVector(base);
  }

  private async borrarVector(base: string): Promise<void> {
    try {
      await this.enBase(base, (q) => q.query('DROP EXTENSION IF EXISTS "vector"'));
    } catch (e) {
      throw traducir(e, `quitar pgvector de ${base}`);
    }
  }

  /**
   * Las bases nuevas nacen de template0 (para fijar la codificación), no de template1: si
   * template1 lleva pgvector, se hereda a mano. Un fallo no deshace la creación: se avisa.
   */
  private async heredarVector(nombre: string, forzar = false): Promise<string | null> {
    try {
      if (!forzar && !(await this.vectorActivo('template1'))) return null;
      await this.crearVector(nombre);
      return null;
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      return `La base ${nombre} se creó, pero no se pudo activar pgvector en ella: ${m}`;
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

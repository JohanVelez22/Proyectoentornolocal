import pg from 'pg';

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

const NOMBRE = /^[a-z_][a-z0-9_]{0,62}$/;
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

  async crearBase(
    nombre: string,
    opts: { usuario?: string; clave?: string } = {},
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
    }
    try {
      let existia = false;
      if (usuario !== undefined) {
        const r = await this.filas('SELECT COUNT(*) AS n FROM pg_roles WHERE rolname = $1', [
          usuario,
        ]);
        existia = Number(r[0]?.n ?? 0) > 0;
        // El propio servidor arma la sentencia con la clave entre comillas (%L).
        const verbo = existia ? 'ALTER ROLE' : 'CREATE ROLE';
        const [orden] = await this.filas(
          `SELECT format('${verbo} %I LOGIN PASSWORD %L', $1::text, $2::text) AS s`,
          [usuario, clave],
        );
        await this.filas(String(orden?.s ?? ''));
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
      return existia
        ? {
            usuarioActualizado: true,
            aviso: `El usuario ${usuario} ya existía: su clave se cambió a la nueva.`,
          }
        : { usuarioActualizado: false };
    } catch (e) {
      throw traducir(e, `crear la base ${nombre}`);
    }
  }

  async borrarBase(nombre: string): Promise<void> {
    const bd = id(nombre);
    noSistema(nombre, 'borrar');
    try {
      await this.filas(`DROP DATABASE ${bd}`);
    } catch (e) {
      throw traducir(e, `borrar la base ${nombre}`);
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

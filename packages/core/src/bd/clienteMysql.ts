import { createConnection } from 'mysql2/promise';

export interface ConexionMysql {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
}

export interface BaseMysql {
  nombre: string;
  tamanoBytes: number;
}

/** Lo mínimo que se usa de una conexión mysql2 (permite inyectar una falsa en pruebas). */
export interface ConexionBaja {
  query(sql: string, params?: unknown[]): Promise<[unknown, ...unknown[]]>;
  end(): Promise<void>;
}

export type FabricaConexion = (c: ConexionMysql) => Promise<ConexionBaja>;

const NOMBRE = /^[A-Za-z0-9_]{1,64}$/;
const SISTEMA = ['mysql', 'information_schema', 'performance_schema', 'sys'];
const USUARIOS_RESERVADOS = [
  'root',
  'mysql.sys',
  'mysql.session',
  'mysql.infoschema',
  'mariadb.sys',
];

function noSistema(nombre: string, verbo: 'borrar' | 'crear'): void {
  if (SISTEMA.includes(nombre.toLowerCase())) {
    throw new Error(`No se puede ${verbo} la base del sistema ${nombre}.`);
  }
}

/** Mensaje claro, sin el SQL ni claves, para un error de mysql2. */
function traducir(e: unknown, accion: string): Error {
  const codigo = (e as { code?: unknown } | null)?.code;
  const c = typeof codigo === 'string' ? codigo : '';
  let motivo = 'el servidor rechazó la operación';
  if (c === 'ER_DB_CREATE_EXISTS') motivo = 'la base ya existe';
  else if (c === 'ER_DB_DROP_EXISTS') motivo = 'la base no existe';
  else if (c.includes('ACCESS_DENIED') || c.includes('DBACCESS_DENIED'))
    motivo = 'permiso denegado';
  else if (c === 'ECONNREFUSED' || c === 'PROTOCOL_CONNECTION_LOST')
    motivo = 'se perdió la conexión con el servidor';
  return new Error(`No se pudo ${accion}: ${motivo}${c ? ` (${c})` : ''}.`);
}

export interface ResultadoCrearBase {
  /** true si el usuario ya existía y su clave se cambió a la indicada. */
  usuarioActualizado: boolean;
  aviso?: string;
}

export function validarNombreBd(nombre: string): void {
  if (!NOMBRE.test(nombre)) {
    throw new Error(
      `El nombre "${nombre}" no es válido: use solo letras, números y guion bajo (hasta 64 caracteres).`,
    );
  }
}

const id = (nombre: string): string => {
  validarNombreBd(nombre);
  return `\`${nombre}\``;
};

const fabricaReal: FabricaConexion = async (c) =>
  (await createConnection({
    host: c.host,
    port: c.puerto,
    user: c.usuario,
    password: c.clave,
    connectTimeout: 10_000,
  })) as unknown as ConexionBaja;

/** Administración básica de bases en MySQL o MariaDB. */
export class ClienteMysql {
  private con: ConexionBaja | null = null;

  constructor(private readonly fabrica: FabricaConexion = fabricaReal) {}

  async conectar(c: ConexionMysql): Promise<void> {
    await this.cerrar();
    try {
      this.con = await this.fabrica(c);
    } catch (e) {
      // el mensaje de mysql2 no incluye la clave, pero se filtra por si acaso
      const m = e instanceof Error ? e.message : String(e);
      throw new Error(
        `No se pudo conectar al servidor en el puerto ${c.puerto}: ${m.split(c.clave).join('***')}`,
      );
    }
  }

  async cerrar(): Promise<void> {
    const c = this.con;
    this.con = null;
    if (c) await c.end().catch(() => undefined);
  }

  private conexion(): ConexionBaja {
    if (!this.con) throw new Error('No hay conexión: conecte con el servidor primero.');
    return this.con;
  }

  private async filas(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
    const [r] = await this.conexion().query(sql, params);
    return Array.isArray(r) ? (r as Record<string, unknown>[]) : [];
  }

  async listarBases(): Promise<BaseMysql[]> {
    const marcas = SISTEMA.map(() => '?').join(',');
    const filas = await this.filas(
      'SELECT s.schema_name AS nombre, COALESCE(SUM(t.data_length + t.index_length), 0) AS tam ' +
        'FROM information_schema.schemata s ' +
        'LEFT JOIN information_schema.tables t ON t.table_schema = s.schema_name ' +
        `WHERE s.schema_name NOT IN (${marcas}) GROUP BY s.schema_name ORDER BY s.schema_name`,
      SISTEMA,
    );
    return filas.map((f) => ({ nombre: String(f.nombre), tamanoBytes: Number(f.tam) }));
  }

  async crearBase(
    nombre: string,
    opts: { usuario?: string; clave?: string } = {},
  ): Promise<ResultadoCrearBase> {
    const bd = id(nombre);
    noSistema(nombre, 'crear');
    const { usuario, clave } = opts;
    if (usuario !== undefined) {
      validarNombreBd(usuario);
      if (USUARIOS_RESERVADOS.includes(usuario.toLowerCase())) {
        throw new Error(`El usuario "${usuario}" está reservado: elija otro nombre.`);
      }
      if (!clave) throw new Error('Indique una clave para el usuario de la base.');
    }
    try {
      await this.filas(`CREATE DATABASE IF NOT EXISTS ${bd} CHARACTER SET utf8mb4`);
      if (usuario === undefined) return { usuarioActualizado: false };
      const f = await this.filas('SELECT COUNT(*) AS n FROM mysql.user WHERE User = ?', [usuario]);
      const existia = Number(f[0]?.n ?? 0) > 0;
      for (const host of ['localhost', '127.0.0.1']) {
        await this.filas(`CREATE USER IF NOT EXISTS ?@'${host}' IDENTIFIED BY ?`, [usuario, clave]);
        if (existia) await this.filas(`ALTER USER ?@'${host}' IDENTIFIED BY ?`, [usuario, clave]);
        await this.filas(`GRANT ALL PRIVILEGES ON ${bd}.* TO ?@'${host}'`, [usuario]);
      }
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
    validarNombreBd(nombre);
    const f = await this.filas(
      'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ?',
      [nombre],
    );
    return Number(f[0]?.n ?? 0) > 0;
  }
}

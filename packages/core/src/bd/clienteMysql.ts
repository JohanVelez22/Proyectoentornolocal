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

  async crearBase(nombre: string, opts: { usuario?: string; clave?: string } = {}): Promise<void> {
    const bd = id(nombre);
    const { usuario, clave } = opts;
    if (usuario !== undefined) {
      validarNombreBd(usuario);
      if (!clave) throw new Error('Indique una clave para el usuario de la base.');
    }
    await this.filas(`CREATE DATABASE IF NOT EXISTS ${bd} CHARACTER SET utf8mb4`);
    if (usuario === undefined) return;
    for (const host of ['localhost', '127.0.0.1']) {
      await this.filas("CREATE USER IF NOT EXISTS ?@'" + host + "' IDENTIFIED BY ?", [
        usuario,
        clave,
      ]);
      await this.filas(`GRANT ALL PRIVILEGES ON ${bd}.* TO ?@'${host}'`, [usuario]);
    }
  }

  async borrarBase(nombre: string): Promise<void> {
    await this.filas(`DROP DATABASE ${id(nombre)}`);
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

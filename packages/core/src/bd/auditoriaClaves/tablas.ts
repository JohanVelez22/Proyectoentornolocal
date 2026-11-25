import { ErrorWolf } from '../../errores';

/**
 * Acceso mínimo a la tabla de usuarios que elige quien audita (D20). Los nombres de tabla y de
 * columna que llegan de la interfaz NUNCA se pegan en el SQL tal cual: primero se buscan en el
 * catálogo del servidor (`information_schema`, con parámetros) y solo se usa el nombre que ese
 * catálogo devuelve, citado y con las comillas duplicadas. Los valores van siempre como parámetros.
 */

/** Una conexión ya abierta (en MySQL, con un usuario temporal solo de lectura). */
export interface ConsultaSql {
  motor: 'mysql' | 'mariadb' | 'postgresql';
  consultar(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  cerrar(): Promise<void>;
}

/** Nombres a los que se les busca coincidencia en el catálogo: texto corto, sin controles. */
const MAX_NOMBRE = 128;
// eslint-disable-next-line no-control-regex
const CONTROLES = /[\u0000-\u001f\u007f]/;

function nombreAcotado(
  v: unknown,
  codigo: 'auditoria.tabla_invalida' | 'auditoria.columna_invalida',
): string {
  if (typeof v !== 'string' || v === '' || v.length > MAX_NOMBRE || CONTROLES.test(v)) {
    throw new ErrorWolf(
      codigo,
      codigo === 'auditoria.tabla_invalida'
        ? 'La tabla no existe en esa base.'
        : 'La columna no existe en esa tabla.',
    );
  }
  return v;
}

/** `valor` como identificador del motor (comillas dobladas). */
export function citar(motor: ConsultaSql['motor'], nombre: string): string {
  return motor === 'postgresql'
    ? `"${nombre.replace(/"/g, '""')}"`
    : `\`${nombre.replace(/`/g, '``')}\``;
}

const texto = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (Buffer.isBuffer(v)) return v.toString('utf8');
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean') return String(v);
  return null;
};

export interface TablaResuelta {
  /** Nombre de la tabla y de las columnas tal como las tiene el servidor. */
  tabla: string;
  usuario: string;
  hash: string;
  /** `` `base`.`tabla` `` (o `"public"."tabla"`) ya citado. */
  completa: string;
  cu: string;
  ch: string;
}

export interface FilaUsuario {
  usuario: string;
  hash: string | null;
}

export class TablasSql {
  constructor(
    private readonly q: ConsultaSql,
    private readonly base: string,
  ) {}

  private marca(n: number): string {
    return this.q.motor === 'postgresql' ? `$${n}` : '?';
  }

  /** Esquema donde se busca: la base en MySQL y MariaDB; `public` en PostgreSQL. */
  private get esquema(): string {
    return this.q.motor === 'postgresql' ? 'public' : this.base;
  }

  /**
   * Comprueba tabla y columnas contra el catálogo y devuelve los nombres canónicos ya citados.
   * Si algo no existe falla con código, sin haber leído ninguna fila de la tabla.
   */
  async resolver(
    tabla: string,
    columnaUsuario: string,
    columnaHash: string,
  ): Promise<TablaResuelta> {
    const t = nombreAcotado(tabla, 'auditoria.tabla_invalida');
    const cu = nombreAcotado(columnaUsuario, 'auditoria.columna_invalida');
    const ch = nombreAcotado(columnaHash, 'auditoria.columna_invalida');
    if (cu === ch) {
      throw new ErrorWolf(
        'auditoria.columna_invalida',
        'La columna del usuario y la del hash deben ser distintas.',
      );
    }
    const tablas = await this.q.consultar(
      `SELECT table_name AS t FROM information_schema.tables ` +
        `WHERE table_schema = ${this.marca(1)} AND table_name = ${this.marca(2)} ` +
        `AND table_type = 'BASE TABLE'`,
      [this.esquema, t],
    );
    const real = texto(tablas[0]?.['t']);
    if (real === null) {
      throw new ErrorWolf('auditoria.tabla_invalida', 'La tabla no existe en esa base.');
    }
    const columnas = (
      await this.q.consultar(
        `SELECT column_name AS c FROM information_schema.columns ` +
          `WHERE table_schema = ${this.marca(1)} AND table_name = ${this.marca(2)}`,
        [this.esquema, real],
      )
    )
      .map((f) => texto(f['c']))
      .filter((c): c is string => c !== null);
    // Mismo nombre, mayúsculas aparte: MySQL y PostgreSQL no distinguen igual; se toma el del servidor.
    const buscar = (n: string): string => {
      const exacto = columnas.find((c) => c === n);
      if (exacto !== undefined) return exacto;
      const parecidas =
        this.q.motor === 'postgresql'
          ? []
          : columnas.filter((c) => c.toLowerCase() === n.toLowerCase());
      if (parecidas.length === 1) return parecidas[0]!;
      throw new ErrorWolf('auditoria.columna_invalida', 'La columna no existe en esa tabla.');
    };
    const usuario = buscar(cu);
    const hash = buscar(ch);
    const citado = (n: string): string => citar(this.q.motor, n);
    return {
      tabla: real,
      usuario,
      hash,
      completa: `${citado(this.esquema)}.${citado(real)}`,
      cu: citado(usuario),
      ch: citado(hash),
    };
  }

  /** Hasta `limite + 1` filas (la de más avisa de que había más); solo `SELECT`. */
  async leer(r: TablaResuelta, limite: number): Promise<FilaUsuario[]> {
    const n = Math.max(1, Math.floor(limite)) + 1;
    const filas = await this.q.consultar(
      `SELECT ${r.cu} AS u, ${r.ch} AS h FROM ${r.completa} LIMIT ${n}`,
    );
    return filas.map((f) => ({ usuario: texto(f['u']) ?? '', hash: texto(f['h']) }));
  }

  /** La fila entera de un usuario (hasta 2: basta para saber si es única). */
  async filasDe(r: TablaResuelta, usuario: string): Promise<Record<string, unknown>[]> {
    return this.q.consultar(
      `SELECT * FROM ${r.completa} WHERE ${r.cu} = ${this.marca(1)} LIMIT 2`,
      [usuario],
    );
  }

  /** `UPDATE` de una sola fila; la vista previa lo muestra con `?` en lugar de los valores. */
  sentencia(r: TablaResuelta, marcas: 'signo' | 'motor' = 'motor'): string {
    const m = (n: number): string => (marcas === 'signo' ? '?' : this.marca(n));
    return `UPDATE ${r.completa} SET ${r.ch} = ${m(1)} WHERE ${r.cu} = ${m(2)}`;
  }

  /**
   * Cambia el hash de UNA fila: dentro de una transacción bloquea las filas del usuario, y si no
   * hay exactamente una, no escribe. Devuelve cuántas filas había (1 = se cambió).
   */
  async reemplazar(r: TablaResuelta, usuario: string, hashNuevo: string): Promise<number> {
    await this.q.consultar(this.q.motor === 'postgresql' ? 'BEGIN' : 'START TRANSACTION');
    try {
      const bloqueadas = await this.q.consultar(
        `SELECT 1 AS n FROM ${r.completa} WHERE ${r.cu} = ${this.marca(1)} LIMIT 3 FOR UPDATE`,
        [usuario],
      );
      if (bloqueadas.length !== 1) {
        await this.q.consultar('ROLLBACK');
        return bloqueadas.length;
      }
      if (this.q.motor === 'postgresql') {
        const hechas = await this.q.consultar(`${this.sentencia(r)} RETURNING 1 AS n`, [
          hashNuevo,
          usuario,
        ]);
        if (hechas.length !== 1) {
          await this.q.consultar('ROLLBACK');
          return hechas.length;
        }
      } else {
        await this.q.consultar(`${this.sentencia(r)} LIMIT 1`, [hashNuevo, usuario]);
      }
      await this.q.consultar('COMMIT');
      return 1;
    } catch (e) {
      await this.q.consultar('ROLLBACK').catch(() => undefined);
      throw e;
    }
  }
}

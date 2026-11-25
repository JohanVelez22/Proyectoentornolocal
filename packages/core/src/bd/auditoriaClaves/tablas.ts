import { ErrorWolf } from '../../errores';

/**
 * Acceso mínimo a la tabla de usuarios que elige quien audita (D20). Los nombres de tabla y de
 * columna que llegan de la interfaz NUNCA se pegan en el SQL tal cual: primero se buscan en el
 * catálogo del servidor (`information_schema`, con parámetros) y solo se usa el nombre que ese
 * catálogo devuelve, citado y con las comillas duplicadas. Los valores van siempre como parámetros.
 *
 * En PostgreSQL toda consulta va con `search_path = pg_catalog, pg_temp` (lo fija quien abre la
 * conexión) y con los operadores y tipos calificados (`OPERATOR(pg_catalog.=)`,
 * `pg_catalog.text`): un esquema ajeno no puede tapar un operador ni un tipo del catálogo.
 */

/** Una conexión ya abierta (en MySQL, con un usuario temporal; en PostgreSQL, con un rol temporal). */
export interface ConsultaSql {
  motor: 'mysql' | 'mariadb' | 'postgresql';
  consultar(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  cerrar(): Promise<void>;
  /**
   * PostgreSQL: crea el rol temporal con permisos solo sobre esta tabla (SELECT y, al restablecer,
   * UPDATE de la columna del hash) y pasa a usarlo. Sin esto, las consultas van con el
   * administrador (solo lo necesitan las consultas al catálogo, que vienen antes).
   */
  limitar?(o: { esquema: string; tabla: string; columnaHash: string }): Promise<void>;
}

/** Nombres a los que se les busca coincidencia en el catálogo: texto corto, sin controles. */
const MAX_NOMBRE = 128;
// eslint-disable-next-line no-control-regex
const CONTROLES = /[\u0000-\u001f\u007f]/;

type CodigoNombre =
  'auditoria.tabla_invalida' | 'auditoria.columna_invalida' | 'auditoria.esquema_invalido';

const MENSAJE: Record<CodigoNombre, string> = {
  'auditoria.tabla_invalida': 'La tabla no existe en esa base.',
  'auditoria.columna_invalida': 'La columna no existe en esa tabla.',
  'auditoria.esquema_invalido': 'El esquema no existe en esa base.',
};

function nombreAcotado(v: unknown, codigo: CodigoNombre): string {
  if (typeof v !== 'string' || v === '' || v.length > MAX_NOMBRE || CONTROLES.test(v)) {
    throw new ErrorWolf(codigo, MENSAJE[codigo]);
  }
  return v;
}

/** Bases de los motores que nunca se auditan. */
const BASES_SISTEMA: Record<ConsultaSql['motor'], readonly string[]> = {
  mysql: ['mysql', 'sys', 'performance_schema', 'information_schema'],
  mariadb: ['mysql', 'sys', 'performance_schema', 'information_schema'],
  postgresql: ['postgres', 'template0', 'template1'],
};

export function esBaseDelSistema(motor: ConsultaSql['motor'], base: string): boolean {
  return BASES_SISTEMA[motor].includes(base.toLowerCase());
}

/** `valor` como identificador del motor (comillas dobladas). */
export function citar(motor: ConsultaSql['motor'], nombre: string): string {
  return motor === 'postgresql'
    ? `"${nombre.replace(/"/g, '""')}"`
    : `\`${nombre.replace(/`/g, '``')}\``;
}

export const texto = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (Buffer.isBuffer(v)) return v.toString('utf8');
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean') return String(v);
  return null;
};

export interface TablaResuelta {
  /** Nombre de la tabla y de las columnas tal como las tiene el servidor. */
  tabla: string;
  esquema: string;
  usuario: string;
  hash: string;
  /** `` `base`.`tabla` `` (o `"esquema"."tabla"`) ya citado. */
  completa: string;
  cu: string;
  ch: string;
  /** Largo máximo de la columna del hash (caracteres), o null si no tiene tope. */
  largoHash: number | null;
  /** Columnas de la clave primaria (vacío si no hay). */
  pk: string[];
  /** PostgreSQL: la tabla tiene seguridad por filas (RLS) activa: el rol limitado puede ver menos filas. */
  rls: boolean;
}

export interface FilaUsuario {
  usuario: string;
  hash: string | null;
}

export class TablasSql {
  constructor(
    private readonly q: ConsultaSql,
    private readonly base: string,
    private readonly esquemaPg: string = 'public',
  ) {}

  private get pg(): boolean {
    return this.q.motor === 'postgresql';
  }

  /** Marca de parámetro; en PostgreSQL de texto, con el tipo del catálogo. */
  private marca(n: number, deTexto = false): string {
    if (!this.pg) return '?';
    return deTexto ? `$${n}::pg_catalog.text` : `$${n}`;
  }

  /** `a = b` (en PostgreSQL con el operador calificado). */
  private igual(a: string, b: string): string {
    return this.pg ? `${a} OPERATOR(pg_catalog.=) ${b}` : `${a} = ${b}`;
  }

  /**
   * Comprueba esquema, tabla y columnas contra el catálogo y devuelve los nombres canónicos ya
   * citados. Si algo no existe falla con código, sin haber leído ninguna fila de la tabla.
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
    let esquema = this.base;
    if (this.pg) {
      const e = nombreAcotado(this.esquemaPg, 'auditoria.esquema_invalido');
      const filas = await this.q.consultar(
        `SELECT schema_name AS s FROM information_schema.schemata ` +
          `WHERE ${this.igual('schema_name', this.marca(1, true))}`,
        [e],
      );
      const real = texto(filas[0]?.['s']);
      if (real === null || real.startsWith('pg_') || real === 'information_schema') {
        throw new ErrorWolf('auditoria.esquema_invalido', MENSAJE['auditoria.esquema_invalido']);
      }
      esquema = real;
    }
    const tablas = await this.q.consultar(
      `SELECT table_name AS t FROM information_schema.tables ` +
        `WHERE ${this.igual('table_schema', this.marca(1, true))} AND ` +
        `${this.igual('table_name', this.marca(2, true))} AND ` +
        `${this.igual('table_type', `'BASE TABLE'`)}`,
      [esquema, t],
    );
    const real = texto(tablas[0]?.['t']);
    if (real === null) {
      throw new ErrorWolf('auditoria.tabla_invalida', MENSAJE['auditoria.tabla_invalida']);
    }
    const filasColumnas = await this.q.consultar(
      `SELECT column_name AS c, character_maximum_length AS l FROM information_schema.columns ` +
        `WHERE ${this.igual('table_schema', this.marca(1, true))} AND ` +
        `${this.igual('table_name', this.marca(2, true))}`,
      [esquema, real],
    );
    const columnas = filasColumnas
      .map((f) => ({ c: texto(f['c']), l: f['l'] }))
      .filter((f): f is { c: string; l: unknown } => f.c !== null);
    // Mismo nombre, mayúsculas aparte: MySQL y PostgreSQL no distinguen igual; se toma el del servidor.
    const buscar = (n: string): { c: string; l: unknown } => {
      const exacto = columnas.find((f) => f.c === n);
      if (exacto !== undefined) return exacto;
      const parecidas = this.pg
        ? []
        : columnas.filter((f) => f.c.toLowerCase() === n.toLowerCase());
      if (parecidas.length === 1) return parecidas[0]!;
      throw new ErrorWolf('auditoria.columna_invalida', MENSAJE['auditoria.columna_invalida']);
    };
    const usuario = buscar(cu);
    const hash = buscar(ch);
    const largo = Number(hash.l);
    const pk = await this.clavePrimaria(esquema, real);
    const citado = (n: string): string => citar(this.q.motor, n);
    const r: TablaResuelta = {
      tabla: real,
      esquema,
      usuario: usuario.c,
      hash: hash.c,
      completa: `${citado(esquema)}.${citado(real)}`,
      cu: citado(usuario.c),
      ch: citado(hash.c),
      largoHash: hash.l !== null && hash.l !== undefined && Number.isFinite(largo) ? largo : null,
      pk,
      rls: await this.seguridadPorFilas(esquema, real),
    };
    await this.q.limitar?.({ esquema, tabla: real, columnaHash: hash.c });
    return r;
  }

  /** ¿La tabla tiene RLS activa? Solo existe en PostgreSQL. */
  private async seguridadPorFilas(esquema: string, tabla: string): Promise<boolean> {
    if (!this.pg) return false;
    const filas = await this.q.consultar(
      `SELECT c.relrowsecurity AS rls FROM pg_catalog.pg_class c ` +
        `JOIN pg_catalog.pg_namespace n ON ${this.igual('n.oid', 'c.relnamespace')} ` +
        `WHERE ${this.igual('n.nspname', this.marca(1, true))} AND ` +
        `${this.igual('c.relname', this.marca(2, true))}`,
      [esquema, tabla],
    );
    return filas[0]?.['rls'] === true;
  }

  private async clavePrimaria(esquema: string, tabla: string): Promise<string[]> {
    const sql = this.pg
      ? `SELECT kcu.column_name AS c FROM information_schema.table_constraints tc ` +
        `JOIN information_schema.key_column_usage kcu ON ` +
        `${this.igual('kcu.constraint_name', 'tc.constraint_name')} AND ` +
        `${this.igual('kcu.constraint_schema', 'tc.constraint_schema')} AND ` +
        `${this.igual('kcu.table_name', 'tc.table_name')} ` +
        `WHERE ${this.igual('tc.constraint_type', `'PRIMARY KEY'`)} AND ` +
        `${this.igual('tc.table_schema', this.marca(1, true))} AND ` +
        `${this.igual('tc.table_name', this.marca(2, true))} ORDER BY kcu.ordinal_position`
      : `SELECT column_name AS c FROM information_schema.key_column_usage ` +
        `WHERE table_schema = ? AND table_name = ? AND constraint_name = 'PRIMARY' ` +
        `ORDER BY ordinal_position`;
    const filas = await this.q.consultar(sql, [esquema, tabla]);
    return filas.map((f) => texto(f['c'])).filter((c): c is string => c !== null);
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
      `SELECT * FROM ${r.completa} WHERE ${this.igual(r.cu, this.marca(1))} LIMIT 2`,
      [usuario],
    );
  }

  /** `UPDATE` de una sola fila; la vista previa lo muestra con `?` en lugar de los valores. */
  sentencia(r: TablaResuelta, marcas: 'signo' | 'motor' = 'motor'): string {
    const m = (n: number): string => (marcas === 'signo' ? '?' : this.marca(n));
    const donde =
      marcas === 'signo'
        ? `${r.cu} = ? AND ${r.ch} = ?`
        : `${this.igual(r.cu, m(2))} AND ${this.igual(r.ch, m(3))}`;
    return `UPDATE ${r.completa} SET ${r.ch} = ${m(1)} WHERE ${donde}`;
  }

  /**
   * Cambia el hash de UNA fila dentro de una transacción: bloquea las filas del usuario; si no hay
   * exactamente una, o su hash ya no es el que se copió, no escribe. Antes del COMMIT vuelve a
   * leer la fila y comprueba que quedó el hash nuevo; si no, ROLLBACK.
   */
  async reemplazar(
    r: TablaResuelta,
    usuario: string,
    hashViejo: string,
    hashNuevo: string,
  ): Promise<void> {
    await this.q.consultar(this.pg ? 'BEGIN' : 'START TRANSACTION');
    try {
      const bloqueadas = await this.q.consultar(
        `SELECT ${r.ch} AS h FROM ${r.completa} WHERE ${this.igual(r.cu, this.marca(1))} ` +
          `LIMIT 3 FOR UPDATE`,
        [usuario],
      );
      if (bloqueadas.length === 0) {
        throw new ErrorWolf(
          'auditoria.usuario_no_encontrado',
          'No hay ninguna cuenta con ese usuario.',
        );
      }
      if (bloqueadas.length > 1) {
        throw new ErrorWolf(
          'auditoria.usuario_repetido',
          'Hay más de una cuenta con ese usuario: no se restablece, para no tocar la que no es.',
        );
      }
      if (texto(bloqueadas[0]!['h']) !== hashViejo) {
        throw new ErrorWolf(
          'auditoria.fila_cambio',
          'La cuenta cambió mientras tanto: no se restableció. Vuelva a intentarlo.',
        );
      }
      if (this.pg) {
        const hechas = await this.q.consultar(`${this.sentencia(r)} RETURNING 1 AS n`, [
          hashNuevo,
          usuario,
          hashViejo,
        ]);
        if (hechas.length !== 1) {
          throw new ErrorWolf(
            'auditoria.fila_cambio',
            'La cuenta cambió mientras tanto: no se restableció. Vuelva a intentarlo.',
          );
        }
      } else {
        await this.q.consultar(`${this.sentencia(r)} LIMIT 1`, [hashNuevo, usuario, hashViejo]);
      }
      const despues = await this.q.consultar(
        `SELECT ${r.ch} AS h FROM ${r.completa} WHERE ${this.igual(r.cu, this.marca(1))} LIMIT 2`,
        [usuario],
      );
      if (despues.length !== 1 || texto(despues[0]!['h']) !== hashNuevo) {
        throw new ErrorWolf(
          'auditoria.verificacion_fallo',
          'La base no guardó la contraseña tal como se esperaba: se deshizo el cambio.',
        );
      }
      await this.q.consultar('COMMIT');
    } catch (e) {
      await this.q.consultar('ROLLBACK').catch(() => undefined);
      throw e;
    }
  }
}

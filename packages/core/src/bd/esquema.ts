/**
 * Visor de esquema (D45d): solo METADATOS de una base (tablas, columnas, claves, índices y claves
 * foráneas). Nunca se leen filas de datos de usuario. Todo va con parámetros (el nombre de la base
 * o del esquema nunca se pega en el SQL) y las consultas son de solo `SELECT` sobre
 * `information_schema` (MySQL, MariaDB) o `pg_catalog` (PostgreSQL, con los nombres calificados).
 */

export interface ColumnaEsquema {
  nombre: string;
  tipo: string;
  nulo: boolean;
  /** Valor por defecto: es parte del esquema, no una fila (puede ser null). */
  porDefecto: string | null;
  primaria: boolean;
}

export interface IndiceEsquema {
  nombre: string;
  unico: boolean;
  primario: boolean;
  columnas: string[];
}

export interface RefTabla {
  esquema: string;
  tabla: string;
}

export interface ClaveForaneaEsquema {
  nombre: string;
  columnas: string[];
  destino: RefTabla;
  columnasDestino: string[];
  alBorrar: string | null;
  alActualizar: string | null;
}

export interface ClaveEntranteEsquema {
  nombre: string;
  origen: RefTabla;
  columnasOrigen: string[];
  columnas: string[];
}

export interface TablaEsquema {
  esquema: string;
  nombre: string;
  tipo: 'tabla' | 'vista';
  columnas: ColumnaEsquema[];
  indices: IndiceEsquema[];
  clavesForaneas: ClaveForaneaEsquema[];
  clavesEntrantes: ClaveEntranteEsquema[];
}

export interface EsquemaBase {
  motor: 'mysql' | 'mariadb' | 'postgresql';
  base: string;
  tablas: TablaEsquema[];
  /** Había más tablas (o columnas) que el límite: la lista está recortada. */
  truncado: boolean;
}

export const MAX_TABLAS_ESQUEMA = 2000;
export const MAX_FILAS_COLUMNAS = 100_000;
export const MAX_FILAS_INDICES = 50_000;
export const PLAZO_ESQUEMA_MS = 15_000;
const MAX_DEFECTO = 200;

export type Consultar = (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

const txt = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const clave = (e: string, t: string): string => `${e}\u0000${t}`;
const defecto = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = txt(v);
  return s.length > MAX_DEFECTO ? s.slice(0, MAX_DEFECTO) + '…' : s;
};
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.map(txt) : []);

/** Los datos crudos ya en forma común; arma las tablas, las claves primarias y las entrantes. */
interface Crudo {
  tablas: { esquema: string; nombre: string; tipo: 'tabla' | 'vista' }[];
  columnas: {
    esquema: string;
    tabla: string;
    nombre: string;
    tipo: string;
    nulo: boolean;
    porDefecto: string | null;
  }[];
  indices: {
    esquema: string;
    tabla: string;
    nombre: string;
    unico: boolean;
    primario: boolean;
    columnas: string[];
  }[];
  fks: {
    esquema: string;
    tabla: string;
    nombre: string;
    columnas: string[];
    destino: RefTabla;
    columnasDestino: string[];
    alBorrar: string | null;
    alActualizar: string | null;
  }[];
}

function armar(
  motor: EsquemaBase['motor'],
  base: string,
  c: Crudo,
  truncado: boolean,
): EsquemaBase {
  const tablas = new Map<string, TablaEsquema>();
  for (const t of c.tablas) {
    tablas.set(clave(t.esquema, t.nombre), {
      esquema: t.esquema,
      nombre: t.nombre,
      tipo: t.tipo,
      columnas: [],
      indices: [],
      clavesForaneas: [],
      clavesEntrantes: [],
    });
  }
  const primarias = new Map<string, Set<string>>();
  for (const i of c.indices) {
    const t = tablas.get(clave(i.esquema, i.tabla));
    if (!t) continue;
    t.indices.push({
      nombre: i.nombre,
      unico: i.unico,
      primario: i.primario,
      columnas: i.columnas,
    });
    if (i.primario) primarias.set(clave(i.esquema, i.tabla), new Set(i.columnas));
  }
  for (const col of c.columnas) {
    const k = clave(col.esquema, col.tabla);
    const t = tablas.get(k);
    if (!t) continue;
    t.columnas.push({
      nombre: col.nombre,
      tipo: col.tipo,
      nulo: col.nulo,
      porDefecto: col.porDefecto,
      primaria: primarias.get(k)?.has(col.nombre) ?? false,
    });
  }
  for (const f of c.fks) {
    const t = tablas.get(clave(f.esquema, f.tabla));
    if (!t) continue;
    t.clavesForaneas.push({
      nombre: f.nombre,
      columnas: f.columnas,
      destino: f.destino,
      columnasDestino: f.columnasDestino,
      alBorrar: f.alBorrar,
      alActualizar: f.alActualizar,
    });
    const d = tablas.get(clave(f.destino.esquema, f.destino.tabla));
    d?.clavesEntrantes.push({
      nombre: f.nombre,
      origen: { esquema: f.esquema, tabla: f.tabla },
      columnasOrigen: f.columnas,
      columnas: f.columnasDestino,
    });
  }
  const orden = [...tablas.values()].sort(
    (a, b) => a.esquema.localeCompare(b.esquema) || a.nombre.localeCompare(b.nombre),
  );
  return { motor, base, tablas: orden, truncado };
}

/** Agrupa filas de columnas de índice o de clave foránea por (tabla, nombre) en orden. */
function agrupar<T extends { esquema: string; tabla: string; nombre: string }>(filas: T[]): T[][] {
  const m = new Map<string, T[]>();
  for (const f of filas) {
    const k = `${clave(f.esquema, f.tabla)}\u0000${f.nombre}`;
    const g = m.get(k);
    if (g) g.push(f);
    else m.set(k, [f]);
  }
  return [...m.values()];
}

// ---- MySQL y MariaDB: information_schema, siempre con TABLE_SCHEMA = ? ----

export async function leerEsquemaMysql(
  consultar: Consultar,
  motor: 'mysql' | 'mariadb',
  base: string,
): Promise<EsquemaBase> {
  const tabs = await consultar(
    'SELECT TABLE_NAME AS nombre, TABLE_TYPE AS tipo FROM information_schema.TABLES ' +
      'WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME LIMIT ?',
    [base, MAX_TABLAS_ESQUEMA + 1],
  );
  let truncado = tabs.length > MAX_TABLAS_ESQUEMA;
  const tablas = tabs.slice(0, MAX_TABLAS_ESQUEMA).map((t) => ({
    esquema: base,
    nombre: txt(t['nombre']),
    tipo: (/VIEW/i.test(txt(t['tipo'])) ? 'vista' : 'tabla') as 'tabla' | 'vista',
  }));
  const cols = await consultar(
    'SELECT TABLE_NAME AS tabla, COLUMN_NAME AS nombre, COLUMN_TYPE AS tipo, ' +
      'IS_NULLABLE AS nulo, COLUMN_DEFAULT AS defecto FROM information_schema.COLUMNS ' +
      'WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME, ORDINAL_POSITION LIMIT ?',
    [base, MAX_FILAS_COLUMNAS],
  );
  if (cols.length >= MAX_FILAS_COLUMNAS) truncado = true;
  const stats = await consultar(
    'SELECT TABLE_NAME AS tabla, INDEX_NAME AS nombre, NON_UNIQUE AS no_unico, ' +
      'COLUMN_NAME AS columna FROM information_schema.STATISTICS ' +
      'WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX LIMIT ?',
    [base, MAX_FILAS_INDICES],
  );
  if (stats.length >= MAX_FILAS_INDICES) truncado = true;
  const claves = await consultar(
    'SELECT k.TABLE_NAME AS tabla, k.CONSTRAINT_NAME AS nombre, k.COLUMN_NAME AS columna, ' +
      'k.REFERENCED_TABLE_SCHEMA AS esquema_ref, k.REFERENCED_TABLE_NAME AS tabla_ref, ' +
      'k.REFERENCED_COLUMN_NAME AS columna_ref, r.DELETE_RULE AS al_borrar, ' +
      'r.UPDATE_RULE AS al_actualizar FROM information_schema.KEY_COLUMN_USAGE k ' +
      'JOIN information_schema.REFERENTIAL_CONSTRAINTS r ' +
      'ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME ' +
      'AND r.TABLE_NAME = k.TABLE_NAME ' +
      'WHERE k.TABLE_SCHEMA = ? AND k.REFERENCED_TABLE_NAME IS NOT NULL ' +
      'ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION LIMIT ?',
    [base, MAX_FILAS_INDICES],
  );
  const indices = agrupar(
    stats.map((s) => ({
      esquema: base,
      tabla: txt(s['tabla']),
      nombre: txt(s['nombre']),
      unico: Number(s['no_unico']) === 0,
      columna: txt(s['columna']),
    })),
  ).map((g) => ({
    esquema: base,
    tabla: g[0]!.tabla,
    nombre: g[0]!.nombre,
    unico: g[0]!.unico,
    primario: g[0]!.nombre === 'PRIMARY',
    columnas: g.map((x) => x.columna).filter((x) => x !== ''),
  }));
  const fks = agrupar(
    claves.map((f) => ({
      esquema: base,
      tabla: txt(f['tabla']),
      nombre: txt(f['nombre']),
      columna: txt(f['columna']),
      esquemaRef: txt(f['esquema_ref']),
      tablaRef: txt(f['tabla_ref']),
      columnaRef: txt(f['columna_ref']),
      alBorrar: txt(f['al_borrar']),
      alActualizar: txt(f['al_actualizar']),
    })),
  ).map((g) => ({
    esquema: base,
    tabla: g[0]!.tabla,
    nombre: g[0]!.nombre,
    columnas: g.map((x) => x.columna),
    destino: { esquema: g[0]!.esquemaRef, tabla: g[0]!.tablaRef },
    columnasDestino: g.map((x) => x.columnaRef),
    alBorrar: g[0]!.alBorrar || null,
    alActualizar: g[0]!.alActualizar || null,
  }));
  return armar(
    motor,
    base,
    {
      tablas,
      columnas: cols.map((c) => ({
        esquema: base,
        tabla: txt(c['tabla']),
        nombre: txt(c['nombre']),
        tipo: txt(c['tipo']),
        nulo: txt(c['nulo']).toUpperCase() === 'YES',
        porDefecto: defecto(c['defecto']),
      })),
      indices,
      fks,
    },
    truncado,
  );
}

// ---- PostgreSQL: pg_catalog con nombres calificados; un esquema ajeno nunca tapa nada ----

const SISTEMA_PG = ['information_schema'];
const FILTRO_PG =
  "n.nspname <> ALL($1::pg_catalog.text[]) AND n.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'";
const ACCION_PG: Record<string, string> = {
  a: 'NO ACTION',
  r: 'RESTRICT',
  c: 'CASCADE',
  n: 'SET NULL',
  d: 'SET DEFAULT',
};

export async function leerEsquemaPostgres(
  consultar: Consultar,
  base: string,
): Promise<EsquemaBase> {
  const tabs = await consultar(
    'SELECT n.nspname AS esquema, c.relname AS nombre, c.relkind::pg_catalog.text AS tipo ' +
      'FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace ' +
      `WHERE c.relkind IN ('r','p','v','m','f') AND ${FILTRO_PG} ` +
      'ORDER BY n.nspname, c.relname LIMIT $2',
    [SISTEMA_PG, MAX_TABLAS_ESQUEMA + 1],
  );
  let truncado = tabs.length > MAX_TABLAS_ESQUEMA;
  const tablas = tabs.slice(0, MAX_TABLAS_ESQUEMA).map((t) => ({
    esquema: txt(t['esquema']),
    nombre: txt(t['nombre']),
    tipo: (['v', 'm'].includes(txt(t['tipo'])) ? 'vista' : 'tabla') as 'tabla' | 'vista',
  }));
  const cols = await consultar(
    'SELECT n.nspname AS esquema, c.relname AS tabla, a.attname AS nombre, ' +
      'pg_catalog.format_type(a.atttypid, a.atttypmod) AS tipo, NOT a.attnotnull AS nulo, ' +
      'pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS defecto ' +
      'FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid = a.attrelid ' +
      'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace ' +
      'LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum ' +
      `WHERE c.relkind IN ('r','p','v','m','f') AND a.attnum > 0 AND NOT a.attisdropped AND ${FILTRO_PG} ` +
      'ORDER BY n.nspname, c.relname, a.attnum LIMIT $2',
    [SISTEMA_PG, MAX_FILAS_COLUMNAS],
  );
  if (cols.length >= MAX_FILAS_COLUMNAS) truncado = true;
  const idx = await consultar(
    'SELECT n.nspname AS esquema, t.relname AS tabla, ic.relname AS nombre, ' +
      'i.indisunique AS unico, i.indisprimary AS primario, ' +
      'ARRAY(SELECT pg_catalog.pg_get_indexdef(i.indexrelid, k + 1, true) ' +
      'FROM pg_catalog.generate_series(0, i.indnkeyatts - 1) AS k ORDER BY k) AS columnas ' +
      'FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class t ON t.oid = i.indrelid ' +
      'JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid ' +
      'JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace ' +
      `WHERE t.relkind IN ('r','p','m') AND ${FILTRO_PG} ORDER BY n.nspname, t.relname, ic.relname LIMIT $2`,
    [SISTEMA_PG, MAX_FILAS_INDICES],
  );
  if (idx.length >= MAX_FILAS_INDICES) truncado = true;
  const fk = await consultar(
    'SELECT n.nspname AS esquema, t.relname AS tabla, c.conname AS nombre, ' +
      'ARRAY(SELECT a.attname FROM pg_catalog.unnest(c.conkey) WITH ORDINALITY AS k(num, ord) ' +
      'JOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.num ORDER BY k.ord) AS columnas, ' +
      'rn.nspname AS esquema_ref, rt.relname AS tabla_ref, ' +
      'ARRAY(SELECT a.attname FROM pg_catalog.unnest(c.confkey) WITH ORDINALITY AS k(num, ord) ' +
      'JOIN pg_catalog.pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.num ORDER BY k.ord) AS columnas_ref, ' +
      'c.confdeltype::pg_catalog.text AS al_borrar, c.confupdtype::pg_catalog.text AS al_actualizar ' +
      'FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class t ON t.oid = c.conrelid ' +
      'JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace ' +
      'JOIN pg_catalog.pg_class rt ON rt.oid = c.confrelid ' +
      'JOIN pg_catalog.pg_namespace rn ON rn.oid = rt.relnamespace ' +
      `WHERE c.contype = 'f' AND ${FILTRO_PG} ORDER BY n.nspname, t.relname, c.conname LIMIT $2`,
    [SISTEMA_PG, MAX_FILAS_INDICES],
  );
  return armar(
    'postgresql',
    base,
    {
      tablas,
      columnas: cols.map((c) => ({
        esquema: txt(c['esquema']),
        tabla: txt(c['tabla']),
        nombre: txt(c['nombre']),
        tipo: txt(c['tipo']),
        nulo: c['nulo'] === true,
        porDefecto: defecto(c['defecto']),
      })),
      indices: idx.map((i) => ({
        esquema: txt(i['esquema']),
        tabla: txt(i['tabla']),
        nombre: txt(i['nombre']),
        unico: i['unico'] === true,
        primario: i['primario'] === true,
        columnas: lista(i['columnas']),
      })),
      fks: fk.map((f) => ({
        esquema: txt(f['esquema']),
        tabla: txt(f['tabla']),
        nombre: txt(f['nombre']),
        columnas: lista(f['columnas']),
        destino: { esquema: txt(f['esquema_ref']), tabla: txt(f['tabla_ref']) },
        columnasDestino: lista(f['columnas_ref']),
        alBorrar: ACCION_PG[txt(f['al_borrar'])] ?? null,
        alActualizar: ACCION_PG[txt(f['al_actualizar'])] ?? null,
      })),
    },
    truncado,
  );
}

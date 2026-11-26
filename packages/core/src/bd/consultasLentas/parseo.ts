/**
 * Interpreta el texto de un registro de consultas lentas (el *slow query log* de MySQL y MariaDB, y
 * las líneas `duration:` de PostgreSQL). Solo lee texto: no ejecuta nada. El SQL se entrega crudo
 * (con sus literales); quien lo muestra lo normaliza o exige el permiso de verlo.
 */

export interface EntradaLentaCruda {
  duracionMs: number;
  filasExaminadas: number | null;
  /** Base a la que se atribuye la consulta, o null si el registro no lo dice. */
  base: string | null;
  fecha: string | null;
  sql: string;
}

/** Fecha de MariaDB (`251126 10:00:00`) a `2025-11-26 10:00:00`; la ISO de MySQL se deja igual. */
function fechaMysql(t: string): string | null {
  const v = t.trim();
  const m = /^(\d{2})(\d{2})(\d{2})\s+(\d{1,2}:\d{2}:\d{2})$/.exec(v);
  if (m) return `20${m[1]}-${m[2]}-${m[3]} ${m[4]!.padStart(8, '0')}`;
  return v === '' ? null : v.slice(0, 40);
}

export function parsearMysql(texto: string): EntradaLentaCruda[] {
  const salida: EntradaLentaCruda[] = [];
  let actual: (EntradaLentaCruda & { lineas: string[]; visto: boolean }) | null = null;
  let hora: string | null = null;
  let dbActual: string | null = null;
  const cerrar = (): void => {
    if (actual?.visto) {
      const sql = actual.lineas.join('\n').trim().replace(/;$/, '').trim();
      if (sql !== '') {
        salida.push({
          duracionMs: actual.duracionMs,
          filasExaminadas: actual.filasExaminadas,
          base: actual.base,
          fecha: actual.fecha,
          sql,
        });
      }
    }
    actual = null;
  };
  for (const crudo of texto.split('\n')) {
    const linea = crudo.endsWith('\r') ? crudo.slice(0, -1) : crudo;
    if (linea.startsWith('# Time:')) {
      cerrar();
      hora = fechaMysql(linea.slice(7));
      continue;
    }
    if (linea.startsWith('# User@Host:')) {
      cerrar();
      actual = {
        duracionMs: 0,
        filasExaminadas: null,
        base: dbActual,
        fecha: hora,
        sql: '',
        lineas: [],
        visto: false,
      };
      continue;
    }
    if (!actual) continue;
    if (linea.startsWith('# Query_time:')) {
      const t = /Query_time:\s*([0-9.]+)/.exec(linea);
      const f = /Rows_examined:\s*(\d+)/.exec(linea);
      if (t) {
        actual.duracionMs = Math.round(Number(t[1]) * 1000 * 1000) / 1000;
        actual.visto = true;
      }
      if (f) actual.filasExaminadas = Number(f[1]);
      continue;
    }
    if (linea.startsWith('#') && linea.includes('Schema:')) {
      const m = /Schema:\s*(\S+)/.exec(linea);
      if (m) {
        actual.base = m[1]!;
        dbActual = m[1]!;
      }
      continue;
    }
    if (linea.startsWith('#')) continue;
    const u = /^use\s+`?([^`;\s]+)`?\s*;\s*$/i.exec(linea);
    if (u && actual.lineas.length === 0) {
      actual.base = u[1]!;
      dbActual = u[1]!;
      continue;
    }
    const ts = /^SET timestamp=(\d+);\s*$/i.exec(linea);
    if (ts && actual.lineas.length === 0) {
      if (actual.fecha === null) {
        const d = new Date(Number(ts[1]) * 1000);
        if (!Number.isNaN(d.getTime())) actual.fecha = d.toISOString();
      }
      continue;
    }
    actual.lineas.push(linea);
  }
  cerrar();
  return salida;
}

const DURACION_PG =
  /LOG:\s+duration:\s*([0-9.]+)\s*ms\s+(?:statement|execute [^:]*|parse [^:]*|bind [^:]*):\s?(.*)$/;

export function parsearPostgres(texto: string): EntradaLentaCruda[] {
  const salida: EntradaLentaCruda[] = [];
  let actual: EntradaLentaCruda | null = null;
  const cerrar = (): void => {
    if (actual) {
      actual.sql = actual.sql.trim();
      if (actual.sql !== '') salida.push(actual);
    }
    actual = null;
  };
  for (const crudo of texto.split('\n')) {
    const linea = crudo.endsWith('\r') ? crudo.slice(0, -1) : crudo;
    if (linea === '') continue;
    if (/^\s/.test(linea)) {
      // Continuación de la sentencia anterior (PostgreSQL sangra con un tabulador).
      if (actual) actual.sql += '\n' + linea.replace(/^\t/, '');
      continue;
    }
    cerrar();
    const m = DURACION_PG.exec(linea);
    if (!m) continue;
    // Fecha y base se leen solo del prefijo: el texto de la consulta no puede falsificarlas.
    const prefijo = linea.slice(0, m.index);
    const f = /^(\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d(?:\.\d+)?)/.exec(prefijo);
    const b = /\bdb=(\S*)/.exec(prefijo);
    const base = b && b[1] !== '' && b[1] !== '[unknown]' ? b[1]! : null;
    actual = {
      duracionMs: Number(m[1]),
      filasExaminadas: null,
      base,
      fecha: f ? f[1]! : null,
      sql: m[2] ?? '',
    };
  }
  cerrar();
  return salida;
}

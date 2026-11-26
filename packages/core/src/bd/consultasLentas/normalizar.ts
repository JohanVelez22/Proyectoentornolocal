/**
 * Normaliza una sentencia SQL para mostrarla sin datos: los literales (cadenas, números, hexadecimales,
 * cadenas con dólares de PostgreSQL) pasan a `?` y los comentarios se quitan. Es un recorrido de un
 * solo paso, sin expresiones regulares con retroceso, y NO ejecuta nada. Una cadena sin cerrar (el
 * log la cortó) también se sustituye.
 */

export type DialectoSql = 'mysql' | 'postgresql';

/** Largo máximo del SQL normalizado que se entrega. */
export const MAX_SQL_NORMALIZADO = 4000;

const esDigito = (c: string): boolean => c >= '0' && c <= '9';
const esInicioId = (c: string): boolean => /[A-Za-z_$\u0080-￿]/.test(c);
const esParteId = (c: string): boolean => /[A-Za-z0-9_$\u0080-￿]/.test(c);

/** Etiqueta de una cadena con dólares ($$ o $tag$) que empieza en `i`, o null. */
function etiquetaDolar(s: string, i: number): string | null {
  if (s[i] !== '$') return null;
  let j = i + 1;
  while (j < s.length && esParteId(s[j]!) && s[j] !== '$') j++;
  if (s[j] !== '$') return null;
  const tag = s.slice(i, j + 1);
  // $1, $2… son parámetros, no cadenas.
  return /^\$\d+\$$/.test(tag) || /^\$\d/.test(tag) ? null : tag;
}

export function normalizarSql(sql: string, dialecto: DialectoSql): string {
  const pg = dialecto === 'postgresql';
  let r = '';
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i]!;
    const sig = sql[i + 1];
    // Comentarios: se quitan (pueden llevar datos).
    if (
      c === '-' &&
      sig === '-' &&
      (pg || sql[i + 2] === ' ' || sql[i + 2] === '\t' || i + 2 >= n)
    ) {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '#' && !pg) {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && sig === '*') {
      const fin = sql.indexOf('*/', i + 2);
      i = fin < 0 ? n : fin + 2;
      r += ' ';
      continue;
    }
    // Cadenas con comilla simple (y, en MySQL, doble).
    if (c === "'" || (!pg && c === '"')) {
      const q = c;
      i++;
      while (i < n) {
        if (sql[i] === '\\' && !pg) {
          i += 2;
          continue;
        }
        if (sql[i] === q) {
          if (sql[i + 1] === q) {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      r += '?';
      continue;
    }
    // Identificadores entre comillas: se conservan tal cual.
    if (c === '`' || (pg && c === '"')) {
      const q = c;
      let j = i + 1;
      while (j < n) {
        if (sql[j] === q) {
          if (sql[j + 1] === q) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      r += sql.slice(i, Math.min(j + 1, n));
      i = j + 1;
      continue;
    }
    if (pg && c === '$') {
      const tag = etiquetaDolar(sql, i);
      if (tag) {
        const fin = sql.indexOf(tag, i + tag.length);
        i = fin < 0 ? n : fin + tag.length;
        r += '?';
        continue;
      }
    }
    // Palabras: las que llevan cifras (t1, col2) no son números; E'..'/N'..'/X'..' se tratan como
    // cadenas (el prefijo se descarta).
    if (esInicioId(c)) {
      let j = i + 1;
      while (j < n && esParteId(sql[j]!)) j++;
      const palabra = sql.slice(i, j);
      if (sql[j] === "'" && /^(?:[ENXBnxb])$/.test(palabra)) {
        i = j;
        continue;
      }
      if (!pg && /^0x[0-9a-fA-F]+$/.test(palabra)) {
        r += '?';
      } else {
        r += palabra;
      }
      i = j;
      continue;
    }
    // Números (con parte decimal y exponente).
    if (esDigito(c) || (c === '.' && sig !== undefined && esDigito(sig))) {
      const anterior = r.at(-1);
      // `tabla.1` no existe; un punto tras un identificador es un calificador.
      if (!(c === '.' && anterior !== undefined && /[A-Za-z0-9_`"]/.test(anterior))) {
        let j = i;
        if (c === '0' && (sig === 'x' || sig === 'X') && /[0-9a-fA-F]/.test(sql[i + 2] ?? '')) {
          j = i + 2;
          while (j < n && /[0-9a-fA-F]/.test(sql[j]!)) j++;
          r += '?';
          i = j;
          continue;
        }
        while (j < n && esDigito(sql[j]!)) j++;
        if (sql[j] === '.' && j + 1 <= n) {
          j++;
          while (j < n && esDigito(sql[j]!)) j++;
        }
        if ((sql[j] === 'e' || sql[j] === 'E') && /[0-9+-]/.test(sql[j + 1] ?? '')) {
          j += 2;
          while (j < n && esDigito(sql[j]!)) j++;
        }
        if (j < n && esParteId(sql[j]!)) {
          // Algo como 1abc: un identificador raro; se conserva.
          while (j < n && esParteId(sql[j]!)) j++;
          r += sql.slice(i, j);
        } else {
          r += '?';
        }
        i = j;
        continue;
      }
    }
    r += c;
    i++;
  }
  // Espacios: uno solo; las listas de `?` (IN (1,2,3)) se reducen a un solo `?`.
  let t = r.replace(/\s+/g, ' ').trim();
  t = t.replace(/\?(?:\s*,\s*\?)+/g, '?');
  return t.length > MAX_SQL_NORMALIZADO ? t.slice(0, MAX_SQL_NORMALIZADO) + '…' : t;
}

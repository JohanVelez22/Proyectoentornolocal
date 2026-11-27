/**
 * Normaliza una sentencia SQL para mostrarla sin datos: los literales (cadenas, números, hexadecimales,
 * cadenas con dólares de PostgreSQL) pasan a `?` y los comentarios se quitan. Es un recorrido de un
 * solo paso, sin expresiones regulares con retroceso, y NO ejecuta nada.
 *
 * Política «ante la duda, ocultar». En modo estricto (el servidor tiene bases con `datosReales`)
 * cualquier anomalía devuelve `null`: cadena, identificador o comentario sin cerrar, `\` delante de
 * una comilla (con NO_BACKSLASH_ESCAPES no se sabe dónde acaba la cadena), prefijos E/X/B/N o
 * `$tag$` en una cadena, cifras pegadas a letras o `_` y comentarios anidados. Fuera del modo
 * estricto una cadena sin cerrar (el log la cortó) se sustituye por `?`; un identificador sin
 * cerrar nunca se copia: es un fallo (`null`) en todos los modos.
 */

export type DialectoSql = 'mysql' | 'postgresql';

export interface OpcionesNormalizar {
  /** Cualquier anomalía devuelve null (servidor con datos reales). */
  estricto?: boolean;
}

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

interface Cadena {
  fin: number;
  cerrada: boolean;
  /** Hubo una `\` delante de una comilla. */
  barraComilla: boolean;
}

/** Recorre una cadena que abre en `i` (con la comilla `q`); `fin` queda tras la comilla de cierre. */
function leerCadena(sql: string, i: number, q: string, escapa: boolean): Cadena {
  const n = sql.length;
  let barraComilla = false;
  let j = i + 1;
  while (j < n) {
    const c = sql[j]!;
    if (c === '\\') {
      const s = sql[j + 1];
      if (s === "'" || s === '"') barraComilla = true;
      j += escapa ? 2 : 1;
      continue;
    }
    if (c === q) {
      if (sql[j + 1] === q) {
        j += 2;
        continue;
      }
      return { fin: j + 1, cerrada: true, barraComilla };
    }
    j++;
  }
  return { fin: n, cerrada: false, barraComilla };
}

interface Recorrido {
  texto: string | null;
  /** Terminó con una cadena, identificador o comentario sin cerrar. */
  sinCerrar: boolean;
}

function recorrer(sql: string, dialecto: DialectoSql, estricto: boolean): Recorrido {
  const pg = dialecto === 'postgresql';
  let r = '';
  let i = 0;
  let sinCerrar = false;
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
      // PostgreSQL anida los comentarios; MySQL cierra en el primer */.
      let prof = 1;
      let j = i + 2;
      while (j < n && prof > 0) {
        if (sql[j] === '*' && sql[j + 1] === '/') {
          prof--;
          j += 2;
          continue;
        }
        if (sql[j] === '/' && sql[j + 1] === '*') {
          if (estricto) return { texto: null, sinCerrar };
          if (pg) {
            prof++;
            j += 2;
            continue;
          }
        }
        j++;
      }
      if (prof > 0) {
        sinCerrar = true;
        if (estricto) return { texto: null, sinCerrar };
      }
      i = j;
      r += ' ';
      continue;
    }
    // Cadenas con comilla simple (y, en MySQL, doble).
    if (c === "'" || (!pg && c === '"')) {
      const s = leerCadena(sql, i, c, !pg);
      if (!s.cerrada) sinCerrar = true;
      if (estricto && (!s.cerrada || s.barraComilla)) return { texto: null, sinCerrar };
      r += '?';
      i = s.fin;
      continue;
    }
    // Identificadores entre comillas: se conservan tal cual; uno sin cerrar es un fallo.
    if (c === '`' || (pg && c === '"')) {
      const q = c;
      let j = i + 1;
      let cerrado = false;
      while (j < n) {
        if (sql[j] === q) {
          if (sql[j + 1] === q) {
            j += 2;
            continue;
          }
          cerrado = true;
          break;
        }
        j++;
      }
      if (!cerrado) return { texto: null, sinCerrar: true };
      r += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (pg && c === '$') {
      const tag = etiquetaDolar(sql, i);
      if (tag) {
        if (estricto) return { texto: null, sinCerrar };
        const fin = sql.indexOf(tag, i + tag.length);
        if (fin < 0) sinCerrar = true;
        i = fin < 0 ? n : fin + tag.length;
        r += '?';
        continue;
      }
    }
    // Palabras: las que llevan cifras (t1, col2) no son números; E'..'/N'..'/X'..' se tratan como
    // cadenas (el prefijo se descarta; en modo estricto son una anomalía).
    if (esInicioId(c)) {
      let j = i + 1;
      while (j < n && esParteId(sql[j]!)) j++;
      const palabra = sql.slice(i, j);
      if (sql[j] === "'" && /^(?:[EeNnXxBb])$/.test(palabra)) {
        if (estricto) return { texto: null, sinCerrar };
        // En PostgreSQL solo E'..' escapa con barra; en MySQL todas las cadenas lo hacen.
        const s = leerCadena(sql, j, "'", !pg || palabra === 'E' || palabra === 'e');
        if (!s.cerrada) sinCerrar = true;
        r += '?';
        i = s.fin;
        continue;
      }
      r += palabra;
      i = j;
      continue;
    }
    // Números (con parte decimal, exponente, 0x/0b/0o y separadores `_`).
    if (esDigito(c) || (c === '.' && sig !== undefined && esDigito(sig))) {
      const anterior = r.at(-1);
      // `tabla.1` no existe; un punto tras un identificador es un calificador.
      if (!(c === '.' && anterior !== undefined && /[A-Za-z0-9_`"]/.test(anterior))) {
        let j = i;
        const pref = (sql[i + 1] ?? '').toLowerCase();
        const dig =
          pref === 'x' ? /[0-9a-fA-F_]/ : pref === 'b' ? /[01_]/ : pref === 'o' ? /[0-7_]/ : null;
        let k = i + 2;
        if (c === '0' && dig) while (k < n && dig.test(sql[k]!)) k++;
        if (c === '0' && dig && k > i + 2) {
          j = k;
        } else {
          const cifras = (): void => {
            while (
              j < n &&
              (esDigito(sql[j]!) ||
                (sql[j] === '_' && j > i && esDigito(sql[j - 1]!) && esDigito(sql[j + 1] ?? '')))
            ) {
              j++;
            }
          };
          cifras();
          if (sql[j] === '.') {
            j++;
            cifras();
          }
          if ((sql[j] === 'e' || sql[j] === 'E') && /[0-9+-]/.test(sql[j + 1] ?? '')) {
            j += 2;
            cifras();
          }
        }
        if (j < n && esParteId(sql[j]!)) {
          // Algo como 1abc: un identificador raro; se conserva (en modo estricto, anomalía).
          if (estricto) return { texto: null, sinCerrar };
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
  return {
    texto: t.length > MAX_SQL_NORMALIZADO ? t.slice(0, MAX_SQL_NORMALIZADO) + '…' : t,
    sinCerrar,
  };
}

/**
 * SQL sin literales, o `null` si no se puede garantizar: un identificador sin cerrar y, en modo
 * estricto, cualquier anomalía.
 */
export function normalizarSql(
  sql: string,
  dialecto: DialectoSql,
  opciones: OpcionesNormalizar = {},
): string | null {
  return recorrer(sql, dialecto, opciones.estricto === true).texto;
}

/** ¿El SQL acaba con una cadena, un identificador o un comentario sin cerrar? */
export function sqlSinCerrar(sql: string, dialecto: DialectoSql): boolean {
  return recorrer(sql, dialecto, false).sinCerrar;
}

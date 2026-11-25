import { createHash } from 'node:crypto';
import { ErrorWolf } from '../errores';

/**
 * Segunda capa de defensa al restaurar un esquema (plantillas de proyecto, importaciones): una
 * lista de sentencias permitidas. La primera capa es el usuario limitado que ejecuta el SQL; esta
 * rechaza ANTES de tocar nada cualquier sentencia que no sea estructura (DROP DATABASE, CREATE
 * USER, GRANT, INTO OUTFILE, COPY, ALTER SYSTEM…).
 */

export type DialectoSql = 'mysql' | 'postgresql';

export interface SentenciaSql {
  /** Texto listo para ejecutar (sin comentarios y sin DEFINER). */
  texto: string;
  /** `tabla`, `vista`, `indice`, `disparador`, `funcion`, `procedimiento`, `alter`, `set`, `otra`. */
  clase: 'tabla' | 'vista' | 'indice' | 'disparador' | 'funcion' | 'procedimiento' | 'otra';
  /** Nombre del objeto creado (para volver a crearlo con otro definer). */
  objeto: string | null;
}

export interface OpcionesRevisarSql {
  /** `importada`: lo que trae un tercero. Sin SECURITY DEFINER ni funciones con privilegios. */
  origen?: 'propia' | 'importada';
  /** Tope de sentencias (una plantilla de esquema no tiene decenas de miles). */
  maxSentencias?: number;
  /**
   * MySQL: cuenta (`usuario`@`host`, ya entrecomillada) que figura como DEFINER de las vistas,
   * rutinas y disparadores. Nunca el administrador: una cuenta bloqueada con permisos solo sobre
   * la base (ver `nombreDuenoMysql`).
   */
  definer?: string;
}

const MAX_SENTENCIAS = 20_000;

/** Lo que nunca debe aparecer, ni dentro del cuerpo de una rutina. */
const PELIGROSO = new RegExp(
  [
    String.raw`\bINTO\s+(?:OUT|DUMP)FILE\b`,
    String.raw`\bLOAD_FILE\s*\(`,
    String.raw`\bLOAD\s+(?:DATA|XML)\b`,
    String.raw`\b(?:FROM|TO)\s+PROGRAM\b`,
    String.raw`\bPG_READ_(?:SERVER_)?FILES?\b`,
    String.raw`\bPG_LS_DIR\b`,
    String.raw`\bPG_STAT_FILE\b`,
    String.raw`\bLO_(?:IMPORT|EXPORT)\b`,
    String.raw`\bDBLINK\b`,
    String.raw`\bSLEEP\s*\(`,
    String.raw`\bBENCHMARK\s*\(`,
    String.raw`\bPG_SLEEP\b`,
    String.raw`\bALTER\s+SYSTEM\b`,
    String.raw`\bSET\s+(?:GLOBAL|PERSIST|PERSIST_ONLY)\b`,
    String.raw`@@(?:GLOBAL|PERSIST)\b`,
    String.raw`\bSONAME\b`,
  ].join('|'),
  'i',
);

/** Tope de tamaño de un esquema (solo estructura): el mismo al guardarlo y al restaurarlo. */
export const MAX_BYTES_ESQUEMA = 64 * 1024 * 1024;

/**
 * Definer en cualquiera de sus formas: DEFINER=`u`@`h`, DEFINER = CURRENT_USER(), … Se aplica
 * sobre texto con las cadenas enmascaradas (`\uE000N\uE000`), nunca sobre cadenas reales.
 */
const DEFINER =
  /\bDEFINER\s*=\s*(?:CURRENT_USER(?:\s*\(\s*\))?|(?:`[^`]*`|\uE000\d+\uE000|[\w$.-]+)(?:\s*@\s*(?:`[^`]*`|\uE000\d+\uE000|[\w$.%-]+))?)\s*/gi;

const erroneo = (sentencia: string, motivo: string): ErrorWolf =>
  new ErrorWolf(
    'bd.sql_no_permitido',
    `El SQL trae una sentencia que no es de estructura (${motivo}): ${sentencia.replace(/\s+/g, ' ').slice(0, 60)}`,
    { sentencia: sentencia.replace(/\s+/g, ' ').slice(0, 60) },
  );

/* ───────────── Lector: cadenas, comentarios y código ───────────── */

/**
 * Aplica `fn` solo al código SQL de MySQL: las cadenas ('…', "…") y los comentarios (`-- `, `#`,
 * barra-asterisco) se enmascaran antes y se devuelven intactos después. Los comentarios
 * condicionales (barra-asterisco-admiración) cuentan como código: el servidor los ejecuta.
 */
export function sobreCodigoMysql(texto: string, fn: (codigo: string) => string): string {
  const piezas: string[] = [];
  const guardar = (p: string): string => `\uE000${piezas.push(p) - 1}\uE000`;
  let salida = '';
  let i = 0;
  const n = texto.length;
  while (i < n) {
    const c = texto[i]!;
    if (c === '`') {
      // Un identificador entre comillas se deja como está sin leer lo de adentro: una comilla o un
      // `--` dentro de `a'` no abre una cadena ni un comentario.
      let j = i + 1;
      while (j < n) {
        if (texto[j] === '`') {
          if (texto[j + 1] === '`') {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      salida += texto.slice(i, Math.min(j + 1, n));
      i = j + 1;
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n) {
        if (texto[j] === '\\') {
          j += 2;
          continue;
        }
        if (texto[j] === c) {
          if (texto[j + 1] === c) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      salida += guardar(texto.slice(i, Math.min(j + 1, n)));
      i = j + 1;
      continue;
    }
    const condicional = /^\/\*M?!\d*/.exec(texto.slice(i, i + 12));
    if (condicional) {
      // El abridor y su cierre `*/` quedan como están (el cierre se enmascara abajo).
      salida += guardar(condicional[0]);
      i += condicional[0].length;
      continue;
    }
    if (
      (c === '-' && texto[i + 1] === '-' && (i + 2 >= n || texto.charCodeAt(i + 2) <= 0x20)) ||
      c === '#'
    ) {
      const fin = texto.indexOf('\n', i);
      const hasta = fin === -1 ? n : fin;
      salida += guardar(texto.slice(i, hasta));
      i = hasta;
      continue;
    }
    if (c === '/' && texto[i + 1] === '*') {
      const fin = texto.indexOf('*/', i + 2);
      const hasta = fin === -1 ? n : fin + 2;
      salida += guardar(texto.slice(i, hasta));
      i = hasta;
      continue;
    }
    if (c === '*' && texto[i + 1] === '/') {
      // Cierre de un comentario condicional.
      salida += guardar('*/');
      i += 2;
      continue;
    }
    salida += c;
    i++;
  }
  return fn(salida).replace(/\uE000(\d+)\uE000/g, (_m, k: string) => piezas[Number(k)] ?? '');
}

/** Quita los DEFINER de un volcado de MySQL o MariaDB (fuera de cadenas y comentarios). */
export const quitarDefiner = (texto: string): string =>
  sobreCodigoMysql(texto, (c) => c.replace(DEFINER, ' '));

/** Quita los contadores `AUTO_INCREMENT=n` (insinúan cuántas filas hubo), fuera de cadenas. */
export const quitarAutoIncrement = (texto: string): string =>
  sobreCodigoMysql(texto, (c) => c.replace(/\s+AUTO_INCREMENT\s*=\s*\d+/gi, ''));

/**
 * Quita de la salida de `pg_restore -f -` exactamente las líneas `\restrict <clave>` y
 * `\unrestrict <clave>` (con la misma clave) que agregan las versiones recientes: ningún otro
 * meta-comando se perdona.
 */
export function quitarRestrict(texto: string): string {
  const m = /^\\restrict ([A-Za-z0-9]{8,})[ \t]*\r?$/m.exec(texto);
  if (!m) return texto;
  const abre = `\\restrict ${m[1]}`;
  const cierra = `\\unrestrict ${m[1]}`;
  return texto
    .split('\n')
    .filter((l) => {
      const t = l.replace(/\r$/, '').trimEnd();
      return t !== abre && t !== cierra;
    })
    .join('\n');
}

/** ¿El carácter puede formar parte de un identificador de PostgreSQL? */
const esDeIdentificador = (c: string | undefined): boolean =>
  c !== undefined && /[\w$\u0080-￿]/.test(c);

/**
 * Divide el texto en sentencias respetando comillas, comentarios, `DELIMITER` (MySQL) y
 * comillas con dólar (PostgreSQL: `$tag$` solo abre una cadena si el carácter anterior no forma
 * parte de un identificador, como en `a$q$`). Los comentarios se quitan; los condicionales de
 * MySQL se desenvuelven (el servidor los ejecuta) sin tocar lo que hay dentro de las comillas.
 */
export function dividirSentencias(texto: string, dialecto: DialectoSql): string[] {
  const t = texto;
  const sentencias: string[] = [];
  let delimitador = ';';
  let actual = '';
  let condicional = 0;
  let i = 0;
  const n = t.length;
  const cierra = (): void => {
    const s = actual.trim();
    if (s !== '') sentencias.push(s);
    actual = '';
  };
  while (i < n) {
    const c = t[i]!;
    const resto = t.slice(i, i + delimitador.length);
    // DELIMITER x (solo al empezar una sentencia, en su propia línea)
    if (
      dialecto === 'mysql' &&
      actual.trim() === '' &&
      /^delimiter[ \t]/i.test(t.slice(i, i + 10))
    ) {
      const fin = t.indexOf('\n', i);
      const linea = t.slice(i + 9, fin === -1 ? n : fin).trim();
      if (linea === '' || /\s/.test(linea)) {
        throw erroneo(`DELIMITER ${linea}`, 'delimitador no válido');
      }
      delimitador = linea;
      i = fin === -1 ? n : fin + 1;
      continue;
    }
    if (c === "'" || c === '"' || (c === '`' && dialecto === 'mysql')) {
      let j = i + 1;
      while (j < n) {
        if (t[j] === '\\' && dialecto === 'mysql' && c !== '`') {
          j += 2;
          continue;
        }
        if (t[j] === c) {
          if (t[j + 1] === c) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      actual += t.slice(i, Math.min(j + 1, n));
      i = j + 1;
      continue;
    }
    if (
      (c === '-' &&
        t[i + 1] === '-' &&
        (dialecto === 'postgresql' || t[i + 2] === undefined || t[i + 2]!.charCodeAt(0) <= 0x20)) ||
      (c === '#' && dialecto === 'mysql')
    ) {
      const fin = t.indexOf('\n', i);
      i = fin === -1 ? n : fin;
      actual += ' ';
      continue;
    }
    if (c === '/' && t[i + 1] === '*') {
      const cond = dialecto === 'mysql' ? /^\/\*M?!\d*/.exec(t.slice(i, i + 12)) : null;
      // `/*M!999999\- … */` (modo sandbox de MariaDB) lleva una versión que ningún servidor alcanza.
      if (cond && !/^\/\*M?!999999/.test(cond[0])) {
        // Comentario condicional: el servidor ejecuta lo de adentro.
        condicional++;
        actual += ' ';
        i += cond[0].length;
        continue;
      }
      const fin = t.indexOf('*/', i + 2);
      i = fin === -1 ? n : fin + 2;
      actual += ' ';
      continue;
    }
    if (c === '*' && t[i + 1] === '/' && condicional > 0) {
      condicional--;
      actual += ' ';
      i += 2;
      continue;
    }
    if (dialecto === 'postgresql' && c === '$' && !esDeIdentificador(t[i - 1])) {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(t.slice(i, i + 80));
      if (m) {
        const fin = t.indexOf(m[0], i + m[0].length);
        const hasta = fin === -1 ? n : fin + m[0].length;
        actual += t.slice(i, hasta);
        i = hasta;
        continue;
      }
    }
    if (resto === delimitador) {
      cierra();
      i += delimitador.length;
      continue;
    }
    actual += c;
    i++;
  }
  cierra();
  return sentencias;
}

/* ───────────── Lista de sentencias permitidas ───────────── */

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim().toUpperCase();

const SET_MYSQL = /^SET (?!GLOBAL|PERSIST|PASSWORD|ROLE|DEFAULT|RESOURCE|TRANSACTION|SQL_LOG_BIN)/;

const PERMITIDAS_MYSQL: { re: RegExp; clase: SentenciaSql['clase'] }[] = [
  { re: /^CREATE (TEMPORARY )?TABLE /, clase: 'tabla' },
  { re: /^CREATE (OR REPLACE )?(ALGORITHM ?= ?\w+ )?(SQL SECURITY \w+ )?VIEW /, clase: 'vista' },
  { re: /^CREATE (UNIQUE |FULLTEXT |SPATIAL )?INDEX /, clase: 'indice' },
  { re: /^CREATE (OR REPLACE )?TRIGGER /, clase: 'disparador' },
  { re: /^CREATE (OR REPLACE )?FUNCTION /, clase: 'funcion' },
  { re: /^CREATE (OR REPLACE )?PROCEDURE /, clase: 'procedimiento' },
  { re: /^ALTER TABLE /, clase: 'otra' },
  { re: /^DROP (TEMPORARY )?(TABLE|VIEW|TRIGGER|FUNCTION|PROCEDURE) IF EXISTS /, clase: 'otra' },
  { re: /^(START TRANSACTION|COMMIT|BEGIN)$/, clase: 'otra' },
];

const PERMITIDAS_PG: { re: RegExp; clase: SentenciaSql['clase'] }[] = [
  { re: /^SELECT PG_CATALOG\.SET_CONFIG\('SEARCH_PATH', '', FALSE\)$/, clase: 'otra' },
  { re: /^SET (?!ROLE|SESSION AUTHORIZATION|LOCAL ROLE)/, clase: 'otra' },
  { re: /^CREATE (UNLOGGED )?TABLE /, clase: 'tabla' },
  { re: /^CREATE (OR REPLACE )?(MATERIALIZED )?VIEW /, clase: 'vista' },
  { re: /^CREATE (UNIQUE )?INDEX /, clase: 'indice' },
  { re: /^CREATE (OR REPLACE )?TRIGGER /, clase: 'disparador' },
  { re: /^CREATE (OR REPLACE )?FUNCTION /, clase: 'funcion' },
  { re: /^CREATE (OR REPLACE )?PROCEDURE /, clase: 'procedimiento' },
  {
    re: /^CREATE (SEQUENCE|SCHEMA|TYPE|DOMAIN|AGGREGATE|POLICY|RULE|COLLATION|STATISTICS|TEXT SEARCH (CONFIGURATION|DICTIONARY|PARSER|TEMPLATE)) /,
    clase: 'otra',
  },
  {
    re: /^ALTER (TABLE|SEQUENCE|SCHEMA|VIEW|MATERIALIZED VIEW|TYPE|DOMAIN|INDEX|STATISTICS|TEXT SEARCH (CONFIGURATION|DICTIONARY|PARSER|TEMPLATE)) /,
    clase: 'otra',
  },
  { re: /^COMMENT ON (?!EXTENSION)/, clase: 'otra' },
];

/** Nombre del objeto de un CREATE (sin esquema ni comillas). */
function nombreDeObjeto(sentencia: string): string | null {
  const m =
    /^CREATE\s+(?:OR\s+REPLACE\s+)?(?:ALGORITHM\s*=\s*\w+\s+)?(?:SQL\s+SECURITY\s+\w+\s+)?(?:TRIGGER|FUNCTION|PROCEDURE|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:`[^`]+`|[\w$]+)(?:\.(?:`[^`]+`|[\w$]+))?)/i.exec(
      sentencia,
    );
  if (!m) return null;
  return m[1]!.split('.').at(-1)!.replace(/`/g, '');
}

/** Cuenta bloqueada que figura como DEFINER de los objetos de una base importada (MySQL/MariaDB). */
export function nombreDuenoMysql(base: string): string {
  // El nombre completo no cabe (hasta 32 caracteres en MySQL): se abrevia con una huella de la base.
  return `wolf_dueno_${createHash('sha256').update(base.toLowerCase()).digest('hex').slice(0, 12)}`;
}

/** Texto `usuario`@`localhost` (entrecomillado) listo para `DEFINER = …`. */
export const definerMysql = (usuario: string): string => `\`${usuario}\`@\`localhost\``;

const MASCARA = String.raw`\d+`;
/** Espacios y comentarios (enmascarados) entre las palabras de una cabecera. */
const SP = String.raw`(?:\s|${MASCARA})+`;
const SPO = String.raw`(?:\s|${MASCARA})*`;
const NOMBRE_OBJ = String.raw`(` + '`(?:[^`]|``)+`' + String.raw`|[\w$]+)`;

/** Rechaza un nombre con base delante (`otra.v`): el objeto se crearía fuera de la base. */
function sinCalificar(codigo: string, tras: number, sentencia: string): void {
  if (new RegExp(String.raw`^${SPO}\.`).test(codigo.slice(tras))) {
    throw erroneo(sentencia, 'nombre con base delante');
  }
}

/**
 * Reescribe la cabecera de una vista, rutina o disparador, solo sobre el código (cadenas y
 * comentarios enmascarados, así que una frase dentro de una cadena o un alias no cuenta):
 * - ningún nombre lleva base delante (ni el objeto ni la tabla de un disparador);
 * - DEFINER es `definer` (nunca el administrador);
 * - `importada`: vistas y rutinas con SQL SECURITY INVOKER (se inserta o se sustituye);
 * - las vistas se crean con OR REPLACE (mysqldump las crea dos veces).
 * Si la cabecera no se reconoce, la sentencia se rechaza.
 */
function reescribirCabecera(
  cruda: string,
  clase: 'vista' | 'funcion' | 'procedimiento' | 'disparador',
  importada: boolean,
  definer: string | undefined,
): string {
  const def = definer ? `DEFINER = ${definer} ` : '';
  return sobreCodigoMysql(cruda, (c) => {
    if (clase === 'vista') {
      const m = new RegExp(
        String.raw`^${SPO}CREATE${SP}(?:OR${SP}REPLACE${SP})?(?:ALGORITHM${SPO}=${SPO}(\w+)${SP})?` +
          String.raw`(?:SQL${SP}SECURITY${SP}(DEFINER|INVOKER)${SP})?VIEW${SP}${NOMBRE_OBJ}`,
        'i',
      ).exec(c);
      if (!m) throw erroneo(cruda, 'cabecera de vista no reconocida');
      sinCalificar(c, m[0].length, cruda);
      const seguridad = importada ? 'INVOKER' : m[2]?.toUpperCase();
      return (
        `CREATE OR REPLACE ${m[1] ? `ALGORITHM = ${m[1]} ` : ''}${def}` +
        `${seguridad ? `SQL SECURITY ${seguridad} ` : ''}VIEW ${m[3]}${c.slice(m[0].length)}`
      );
    }
    if (clase === 'disparador') {
      const m = new RegExp(
        String.raw`^${SPO}CREATE${SP}(?:OR${SP}REPLACE${SP})?TRIGGER${SP}(?:IF${SP}NOT${SP}EXISTS${SP})?` +
          String.raw`${NOMBRE_OBJ}${SP}(?:BEFORE|AFTER)${SP}(?:INSERT|UPDATE|DELETE)${SP}ON${SP}${NOMBRE_OBJ}`,
        'i',
      ).exec(c);
      if (!m) throw erroneo(cruda, 'cabecera de disparador no reconocida');
      // Ni el nombre del disparador ni la tabla llevan base delante.
      const nombre = new RegExp(
        String.raw`TRIGGER${SP}(?:IF${SP}NOT${SP}EXISTS${SP})?${NOMBRE_OBJ}`,
        'i',
      ).exec(m[0])!;
      sinCalificar(c, nombre.index + nombre[0].length, cruda);
      sinCalificar(c, m[0].length, cruda);
      return `CREATE ${def}${c.slice(c.search(/TRIGGER/i))}`;
    }
    const m = new RegExp(
      String.raw`^${SPO}CREATE${SP}(?:OR${SP}REPLACE${SP})?(?:AGGREGATE${SP})?(FUNCTION|PROCEDURE)${SP}` +
        String.raw`(?:IF${SP}NOT${SP}EXISTS${SP})?${NOMBRE_OBJ}`,
      'i',
    ).exec(c);
    if (!m) throw erroneo(cruda, 'cabecera de rutina no reconocida');
    sinCalificar(c, m[0].length, cruda);
    let resto = c.slice(c.search(/FUNCTION|PROCEDURE/i));
    if (importada) {
      // SQL SECURITY solo cuenta entre los `)` de los parámetros (y el RETURNS) y el cuerpo: las
      // características de la rutina. Lo que haya en el cuerpo no se toca ni se tiene en cuenta.
      const h = new RegExp(
        String.raw`^(?:FUNCTION|PROCEDURE)${SP}(?:IF${SP}NOT${SP}EXISTS${SP})?${NOMBRE_OBJ}${SPO}` +
          String.raw`\((?:[^()]|\([^()]*\))*\)` +
          String.raw`(?:${SP}RETURNS${SP}[A-Za-z]+(?:${SPO}\(${SPO}\d+(?:${SPO},${SPO}\d+)?${SPO}\))?` +
          String.raw`(?:${SP}UNSIGNED)?(?:${SP}(?:CHARSET|CHARACTER${SP}SET)${SP}\w+)?(?:${SP}COLLATE${SP}\w+)?)?`,
        'i',
      ).exec(resto);
      if (!h) throw erroneo(cruda, 'no se pudo dejar con SQL SECURITY INVOKER');
      const cola = resto.slice(h[0].length);
      const caracteristicas = new RegExp(
        String.raw`^(?:${SP}(?:LANGUAGE${SP}SQL|NOT${SP}DETERMINISTIC|DETERMINISTIC|CONTAINS${SP}SQL|NO${SP}SQL|` +
          String.raw`READS${SP}SQL${SP}DATA|MODIFIES${SP}SQL${SP}DATA|SQL${SP}SECURITY${SP}(?:DEFINER|INVOKER)|COMMENT${SP}${MASCARA}))*`,
        'i',
      ).exec(cola)![0];
      const seg = new RegExp(String.raw`SQL${SP}SECURITY${SP}(?:DEFINER|INVOKER)`, 'i').exec(
        caracteristicas,
      );
      resto =
        seg === null
          ? `${h[0]} SQL SECURITY INVOKER${cola}`
          : h[0] +
            caracteristicas.slice(0, seg.index) +
            'SQL SECURITY INVOKER' +
            caracteristicas.slice(seg.index + seg[0].length) +
            cola.slice(caracteristicas.length);
    }
    return `CREATE ${def}${resto}`;
  });
}

/**
 * Revisa todo el texto y devuelve las sentencias listas para ejecutar. Lanza `bd.sql_no_permitido`
 * con la primera que no esté en la lista; no ejecuta nada. En MySQL quita `DEFINER=`; con origen
 * `importada` las vistas y rutinas pasan a `SQL SECURITY INVOKER`, los disparadores (que siempre
 * corren con los privilegios de su definer) no se aceptan y en PostgreSQL tampoco
 * `SECURITY DEFINER`.
 */
export function revisarSql(
  texto: string,
  dialecto: DialectoSql,
  opciones: OpcionesRevisarSql = {},
): SentenciaSql[] {
  const importada = opciones.origen === 'importada';
  const tope = opciones.maxSentencias ?? MAX_SENTENCIAS;
  const lista = dialecto === 'mysql' ? PERMITIDAS_MYSQL : PERMITIDAS_PG;
  const crudas = dividirSentencias(texto, dialecto);
  if (crudas.length > tope) throw erroneo(`${crudas.length} sentencias`, 'demasiadas');
  const salida: SentenciaSql[] = [];
  for (const cruda of crudas) {
    // Solo se normaliza para clasificar: lo que se ejecuta conserva sus cadenas tal cual.
    let s = dialecto === 'mysql' ? quitarDefiner(cruda).trim() : cruda;
    const n = norm(s);
    if (/^\\/.test(s)) throw erroneo(cruda, 'meta-comando');
    if (PELIGROSO.test(s)) throw erroneo(cruda, 'operación peligrosa');
    let clase: SentenciaSql['clase'] | null = null;
    if (dialecto === 'mysql' && SET_MYSQL.test(n)) clase = 'otra';
    for (const p of lista) {
      if (clase === null && p.re.test(n)) clase = p.clase;
    }
    if (clase === null) throw erroneo(cruda, 'no está permitida');
    if (/\bLANGUAGE\s+(C|INTERNAL|PLPYTHON3?U|PLPERLU|PLTCLU|PLPYTHONU)\b/i.test(s)) {
      throw erroneo(cruda, 'lenguaje no permitido');
    }
    if (dialecto === 'postgresql' && importada && /\bSECURITY\s+DEFINER\b/i.test(s)) {
      throw erroneo(cruda, 'SECURITY DEFINER');
    }
    if (dialecto === 'mysql' && importada && clase === 'disparador') {
      throw erroneo(cruda, 'un disparador corre con privilegios ajenos');
    }
    if (
      dialecto === 'mysql' &&
      (clase === 'vista' ||
        clase === 'funcion' ||
        clase === 'procedimiento' ||
        clase === 'disparador')
    ) {
      s = reescribirCabecera(s, clase, importada, opciones.definer);
    }
    salida.push({ texto: s, clase, objeto: nombreDeObjeto(s) });
  }
  return salida;
}

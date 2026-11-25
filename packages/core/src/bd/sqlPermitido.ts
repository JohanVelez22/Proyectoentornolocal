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

/** Definer en cualquiera de sus formas: DEFINER=`u`@`h`, DEFINER = CURRENT_USER(), … */
const DEFINER =
  /\bDEFINER\s*=\s*(?:CURRENT_USER(?:\s*\(\s*\))?|(?:`[^`]*`|'[^']*'|"[^"]*"|[\w$.-]+)(?:\s*@\s*(?:`[^`]*`|'[^']*'|"[^"]*"|[\w$.%-]+))?)\s*/gi;

const erroneo = (sentencia: string, motivo: string): ErrorWolf =>
  new ErrorWolf(
    'bd.sql_no_permitido',
    `El SQL trae una sentencia que no es de estructura (${motivo}): ${sentencia.replace(/\s+/g, ' ').slice(0, 60)}`,
    { sentencia: sentencia.replace(/\s+/g, ' ').slice(0, 60) },
  );

/* ───────────── División en sentencias ───────────── */

/** Desenvuelve los comentarios condicionales de MySQL (barra-asterisco-admiración): el servidor los ejecuta. */
function desenvolverCondicionales(texto: string): string {
  return texto.replace(/\/\*M?!\d*([\s\S]*?)\*\//g, ' $1 ');
}

/**
 * Divide el texto en sentencias respetando comillas, comentarios, `DELIMITER` (MySQL) y
 * comillas con dólar (PostgreSQL). Los comentarios se quitan.
 */
export function dividirSentencias(texto: string, dialecto: DialectoSql): string[] {
  const t = dialecto === 'mysql' ? desenvolverCondicionales(texto) : texto;
  const sentencias: string[] = [];
  let delimitador = ';';
  let actual = '';
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
      const fin = t.indexOf('*/', i + 2);
      i = fin === -1 ? n : fin + 2;
      actual += ' ';
      continue;
    }
    if (dialecto === 'postgresql' && c === '$') {
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
  { re: /^DROP (TABLE|VIEW|TRIGGER|FUNCTION|PROCEDURE) IF EXISTS /, clase: 'otra' },
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
  { re: /^CREATE (SEQUENCE|SCHEMA|TYPE|DOMAIN|AGGREGATE|POLICY|RULE|COLLATION) /, clase: 'otra' },
  { re: /^ALTER (TABLE|SEQUENCE|SCHEMA|VIEW|MATERIALIZED VIEW|TYPE|DOMAIN|INDEX) /, clase: 'otra' },
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

/**
 * Revisa todo el texto y devuelve las sentencias listas para ejecutar. Lanza `bd.sql_no_permitido`
 * con la primera que no esté en la lista; no ejecuta nada. En MySQL quita `DEFINER=`; con origen
 * `importada` las vistas pasan a `SQL SECURITY INVOKER` y en PostgreSQL no se aceptan
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
    let s = dialecto === 'mysql' ? cruda.replace(DEFINER, ' ').replace(/\s+/g, ' ').trim() : cruda;
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
    if (dialecto === 'mysql' && importada)
      s = s.replace(/\bSQL SECURITY DEFINER\b/gi, 'SQL SECURITY INVOKER');
    salida.push({ texto: s, clase, objeto: nombreDeObjeto(s) });
  }
  return salida;
}

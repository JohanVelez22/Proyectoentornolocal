import { Transform, type TransformCallback } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import { ErrorWolf } from '../errores';
import { sobreCodigoMysql } from './sqlPermitido';

/**
 * Datos de un volcado de otro programa (Laragon, XAMPP, Herd). El texto es de un tercero: aquí se
 * parte en sentencias y se valida cada una contra una lista cerrada ANTES de mandarla al servidor.
 * La defensa de fondo no es este código sino el servidor: cada sentencia viaja sola (el driver no
 * admite varias a la vez), con un usuario que solo puede INSERT en la base, así que un error de
 * lectura aquí da un error del servidor y no una segunda sentencia.
 */

/** Una sentencia de datos pasa de este tamaño: no es un volcado normal. */
export const MAX_BYTES_SENTENCIA = 64 * 1024 * 1024;

export const rechazoDatos = (motivo: string, trozo = ''): ErrorWolf =>
  new ErrorWolf(
    'bd.datos_no_permitidos',
    `El volcado de datos trae algo que no son datos (${motivo})${trozo ? `: ${trozo.replace(/\s+/g, ' ').slice(0, 60)}` : ''}; no se importó.`,
  );

/**
 * Parte el texto en sentencias por los `;` que están fuera de cadenas, de identificadores entre
 * comillas, de comentarios y de comentarios ejecutables (`/*! … *\/`, que se conservan enteros).
 * Los comentarios `-- `, `#` y `/* … *\/` se descartan. Lee con escapes de barra invertida: la
 * conexión de importación fija un `sql_mode` sin NO_BACKSLASH_ESCAPES y los `SET` que lo cambiarían
 * se rechazan, así que esta lectura coincide con la del servidor.
 */
export class DivisorSentencias extends Transform {
  private readonly dec = new StringDecoder('utf8');
  private actual = '';
  private resto = '';
  private modo: 'normal' | 'comilla' | 'linea' | 'bloque' | 'ejecutable' = 'normal';
  private comilla = '';

  constructor() {
    super({ readableObjectMode: true });
  }

  private cierra(): void {
    const t = this.actual.trim();
    this.actual = '';
    if (t !== '') this.push(t);
  }

  private procesar(texto: string, final: boolean): boolean {
    const t = this.resto + texto;
    this.resto = '';
    const n = t.length;
    for (let i = 0; i < n; i++) {
      const c = t[i]!;
      const sig = t[i + 1];
      switch (this.modo) {
        case 'comilla':
          if (sig === undefined && !final) {
            // Una barra o una comilla al final del trozo: se decide con el siguiente.
            if (c === '\\' || c === this.comilla) {
              this.resto = c;
              return true;
            }
          }
          this.actual += c;
          if (c === '\\' && this.comilla !== '`') {
            if (sig !== undefined) {
              this.actual += sig;
              i++;
            }
          } else if (c === this.comilla) {
            if (sig === this.comilla) {
              this.actual += sig;
              i++;
            } else this.modo = 'normal';
          }
          continue;
        case 'linea':
          if (c === '\n') this.modo = 'normal';
          continue;
        case 'bloque':
          if (c === '*' && sig === '/') {
            this.modo = 'normal';
            i++;
          } else if (c === '*' && sig === undefined && !final) {
            this.resto = '*';
            return true;
          }
          continue;
        case 'ejecutable':
          this.actual += c;
          if (c === '*' && sig === '/') {
            this.actual += '/';
            this.modo = 'normal';
            i++;
          } else if (c === '*' && sig === undefined && !final) {
            this.actual = this.actual.slice(0, -1);
            this.resto = '*';
            return true;
          }
          continue;
        default:
          break;
      }
      if ((c === '/' || c === '-') && sig === undefined && !final) {
        // Puede ser el inicio de un comentario que se completa en el próximo trozo.
        this.resto = c;
        return true;
      }
      if (c === "'" || c === '"' || c === '`') {
        this.modo = 'comilla';
        this.comilla = c;
        this.actual += c;
      } else if (c === '#') {
        this.modo = 'linea';
      } else if (c === '-' && sig === '-') {
        const tercero = t[i + 2];
        if (tercero === undefined && !final) {
          this.resto = t.slice(i);
          return true;
        }
        if (tercero === undefined || tercero.charCodeAt(0) <= 0x20) {
          this.modo = 'linea';
          i++;
        } else this.actual += c;
      } else if (c === '/' && sig === '*') {
        const cuatro = t.slice(i, i + 3);
        // Para distinguir `/*M!999999` de otro comentario hacen falta 11 caracteres.
        if (t.length - i < 11 && !final) {
          this.resto = t.slice(i);
          return true;
        }
        const largo = t.slice(i, i + 11);
        if (/^\/\*M!999999/.test(largo)) {
          this.modo = 'bloque';
          i++;
        } else if (/^\/\*[!M]/.test(cuatro)) {
          this.modo = 'ejecutable';
          this.actual += '/*';
          i++;
        } else {
          this.modo = 'bloque';
          i++;
        }
      } else if (c === ';') {
        this.cierra();
      } else {
        this.actual += c;
      }
      if (this.actual.length > MAX_BYTES_SENTENCIA) {
        throw rechazoDatos('una sentencia es demasiado grande');
      }
    }
    return true;
  }

  override _transform(trozo: Buffer, _cod: BufferEncoding, cb: TransformCallback): void {
    try {
      this.procesar(this.dec.write(trozo), false);
      cb();
    } catch (e) {
      cb(e as Error);
    }
  }

  override _flush(cb: TransformCallback): void {
    try {
      this.procesar(this.dec.end(), true);
      if (this.modo === 'comilla' || this.modo === 'ejecutable') {
        throw rechazoDatos('el volcado termina dentro de una cadena o un comentario');
      }
      this.cierra();
      cb();
    } catch (e) {
      cb(e as Error);
    }
  }
}

/* ───────────── Lista cerrada ───────────── */

/** Modos de SQL que cambian cómo se leen las comillas: se rechazan. */
const MODOS_PROHIBIDOS = new Set([
  'NO_BACKSLASH_ESCAPES',
  'ANSI_QUOTES',
  'ANSI',
  'DB2',
  'MAXDB',
  'MSSQL',
  'ORACLE',
  'POSTGRESQL',
  'MYSQL323',
  'MYSQL40',
  'TRADITIONAL',
]);

/** Variables que `mysqldump` guarda en `@OLD_x` y restaura con `x=@OLD_x`. */
const RESTAURABLES = new Set([
  'CHARACTER_SET_CLIENT',
  'CHARACTER_SET_RESULTS',
  'COLLATION_CONNECTION',
  'TIME_ZONE',
  'SQL_MODE',
  'FOREIGN_KEY_CHECKS',
  'UNIQUE_CHECKS',
  'SQL_NOTES',
]);

/** Parte `a=b, c=d` por las comas fuera de paréntesis y de cadenas (ya enmascaradas). */
function asignaciones(cuerpo: string): string[] {
  const partes: string[] = [];
  let nivel = 0;
  let ini = 0;
  for (let i = 0; i < cuerpo.length; i++) {
    const c = cuerpo[i];
    if (c === '(') nivel++;
    else if (c === ')') nivel--;
    else if (c === ',' && nivel === 0) {
      partes.push(cuerpo.slice(ini, i));
      ini = i + 1;
    }
  }
  partes.push(cuerpo.slice(ini));
  return partes.map((p) => p.trim());
}

function validarSet(cuerpoCrudo: string, original: string): void {
  // Las cadenas se leen aparte: solo se aceptan literales simples.
  const literales: string[] = [];
  const cuerpo = cuerpoCrudo.replace(/'((?:[^'\\]|\\.|'')*)'/g, (_m, x: string) => {
    literales.push(x);
    return `'#${literales.length - 1}'`;
  });
  if (/["`;'\\]/.test(cuerpo.replace(/'#\d+'/g, '')))
    throw rechazoDatos('SET no permitido', original);
  if (/^NAMES\s/i.test(cuerpo)) {
    if (!/^NAMES\s+utf8mb4(?:\s+COLLATE\s+utf8mb4_\w+)?$/i.test(cuerpo)) {
      throw rechazoDatos('SET NAMES distinto de utf8mb4', original);
    }
    return;
  }
  for (const a of asignaciones(cuerpo)) {
    let m = /^@OLD_(\w+)\s*=\s*@@(\w+)$/i.exec(a);
    if (m) {
      if (m[1]!.toUpperCase() !== m[2]!.toUpperCase() || !RESTAURABLES.has(m[1]!.toUpperCase())) {
        throw rechazoDatos('SET no permitido', original);
      }
      continue;
    }
    m = /^(\w+)\s*=\s*@OLD_(\w+)$/i.exec(a);
    if (m) {
      if (m[1]!.toUpperCase() !== m[2]!.toUpperCase() || !RESTAURABLES.has(m[1]!.toUpperCase())) {
        throw rechazoDatos('SET no permitido', original);
      }
      continue;
    }
    m = /^(FOREIGN_KEY_CHECKS|UNIQUE_CHECKS|SQL_NOTES)\s*=\s*[01]$/i.exec(a);
    if (m) continue;
    m = /^TIME_ZONE\s*=\s*'#(\d+)'$/i.exec(a);
    if (m) {
      if (!/^(?:[+-]\d{1,2}:\d{2}|UTC|SYSTEM)$/i.test(literales[Number(m[1])] ?? '')) {
        throw rechazoDatos('SET TIME_ZONE no permitido', original);
      }
      continue;
    }
    m = /^SQL_MODE\s*=\s*'#(\d+)'$/i.exec(a);
    if (m) {
      const modos = (literales[Number(m[1])] ?? '').toUpperCase().split(',');
      if (modos.some((x) => !/^[A-Z_]*$/.test(x) || MODOS_PROHIBIDOS.has(x))) {
        throw rechazoDatos('SET sql_mode cambia cómo se leen las comillas', original);
      }
      continue;
    }
    throw rechazoDatos('SET no permitido', original);
  }
}

/** Funciones que ocupan o bloquean el servidor, o leen archivos: ni dentro de un INSERT. */
const PELIGROSAS =
  /\b(?:SLEEP|BENCHMARK|GET_LOCK|RELEASE_LOCK|LOAD_FILE|WAIT_FOR_EXECUTED_GTID_SET)\s*\(|\bSELECT\b|\bINTO\s+(?:OUT|DUMP)FILE\b/i;

/**
 * Una sentencia de un volcado de solo datos: `INSERT INTO`, o un `SET` de la lista cerrada de
 * `mysqldump` (con o sin la envoltura `/*!NNNNN … *\/`). Todo lo demás se rechaza: LOCK TABLES y
 * ALTER TABLE (el usuario de datos no los tiene), REPLACE, SET STATEMENT, autocommit, comandos del
 * cliente, DELIMITER, CREATE, DROP, USE…
 */
export function validarSentenciaDatos(sentencia: string): void {
  const s = sentencia.trim();
  // MariaDB 11.4 (y 10.11.8 o posteriores) abre y cierra el volcado con NOTE_VERBOSITY, dentro de un
  // comentario ejecutable propio (`/*M!`): solo esas dos sentencias exactas, y nada más con `/*M!`.
  if (
    /^\/\*M!\d+\s+SET\s+(?:@OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY,\s*NOTE_VERBOSITY=0|NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY)\s*\*\/$/.test(
      s,
    )
  ) {
    return;
  }
  // MariaDB 13.1 envuelve los INSERT en una transacción con estas tres sentencias exactas; ninguna
  // otra forma de COMMIT ni de AUTOCOMMIT se acepta (siguen rechazadas más abajo).
  if (
    /^COMMIT$/i.test(s) ||
    /^SET\s+@OLD_AUTOCOMMIT\s*=\s*@@AUTOCOMMIT\s*,\s*@@AUTOCOMMIT\s*=\s*0$/i.test(s) ||
    /^SET\s+AUTOCOMMIT\s*=\s*@OLD_AUTOCOMMIT$/i.test(s)
  ) {
    return;
  }
  const envuelta = /^\/\*!\d*\s+([^]*?)\s*\*\/$/.exec(s);
  const interior = envuelta ? envuelta[1]! : s;
  if (envuelta && /\/\*|\*\//.test(interior)) throw rechazoDatos('comentario anidado', s);
  if (/^\\/.test(interior)) throw rechazoDatos('comando del cliente', s);
  const set = /^SET\s+([^]*)$/i.exec(interior);
  if (set) {
    if (/^(?:STATEMENT|GLOBAL|PERSIST|PASSWORD|ROLE|TRANSACTION|DEFAULT)\b/i.test(set[1]!)) {
      throw rechazoDatos('SET no permitido', s);
    }
    if (/\b(?:AUTOCOMMIT|SQL_LOG_BIN|GLOBAL|PERSIST)\b|@@\s*(?:GLOBAL|PERSIST)/i.test(set[1]!)) {
      throw rechazoDatos('SET no permitido', s);
    }
    validarSet(set[1]!.trim(), s);
    return;
  }
  if (envuelta) throw rechazoDatos('comentario ejecutable que no es un SET', s);
  if (!/^INSERT\s+(?:(?:LOW_PRIORITY|DELAYED|HIGH_PRIORITY|IGNORE)\s+)*INTO\s/i.test(s)) {
    throw rechazoDatos('solo se aceptan INSERT y SET', s);
  }
  // Sobre el código sin cadenas ni comentarios (enmascarados) ni identificadores entre comillas
  // (en blanco): la cabecera es `INSERT … INTO tabla [(columnas)] VALUES` sin base delante y lo que
  // sigue son solo valores literales (lo que emite mysqldump) o una lista blanca corta de funciones.
  sobreCodigoMysql(s, (codigo) => {
    const limpio = codigo.replace(/`(?:[^`]|``)*`/g, '`x`');
    if (PELIGROSAS.test(limpio)) throw rechazoDatos('una función que ocupa el servidor', s);
    const cab = new RegExp(
      String.raw`^INSERT\s+(?:(?:LOW_PRIORITY|DELAYED|HIGH_PRIORITY|IGNORE)\s+)*INTO\s+(?:\x60x\x60|\w+)` +
        String.raw`(\s*\((?:\s*(?:\x60x\x60|\w+)\s*,?)+\))?\s*VALUES?\b`,
      'i',
    ).exec(limpio);
    if (!cab) throw rechazoDatos('la cabecera del INSERT no es la de mysqldump', s);
    if (/^\s*\./.test(limpio.slice(cab.index + cab[0].length - 0)) || /^[^(]*\./.test(cab[0])) {
      throw rechazoDatos('nombre con base delante', s);
    }
    let resto = limpio.slice(cab[0].length);
    // `_binary 'x'`, `x'ab'`, `b'01'` y `0x…` (los valores de mysqldump), los números, NULL y las
    // funciones de la lista blanca; los textos ya están enmascarados.
    const mascara = String.raw`\d+`;
    const token = new RegExp(
      String.raw`^(?:\s+|[(),]|NULL\b|TRUE\b|FALSE\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|0x[0-9a-fA-F]+\b|` +
        String.raw`_(?:binary|utf8mb4|utf8mb3|utf8|latin1)\b|[xXbB](?=${mascara})|${mascara}|` +
        String.raw`(?:ST_GEOMFROMTEXT|UNHEX|FROM_BASE64)(?=\s*\())`,
      'i',
    );
    while (resto.length > 0) {
      const m = token.exec(resto);
      if (!m || m[0].length === 0) {
        throw rechazoDatos('un valor que no es un literal', s);
      }
      resto = resto.slice(m[0].length);
    }
    return codigo;
  });
}

import { randomBytes, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  statfs,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import { Transform, type Readable, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import type { Eventos, EventosNucleo, ProgresoBd } from '../eventos';
import { lanzadorPorDefecto } from '../plataforma/lanzar';
import type { Ejecutor, Lanzador, Plataforma } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { NOMBRE_SERVICIO } from '../servicios/definicion';
import { esIdInstancia } from '../servicios/instancias';
import type { EstadoInstancia, EstadoServicio } from '../tipos';
import { motorDe, type BasesDeDatos, type ObjetivoBd } from './basesDeDatos';
import { DivisorSentencias, rechazoDatos, validarSentenciaDatos } from './datosAjenos';
import { ClienteMysql, validarNombreBd, type FabricaConexion } from './clienteMysql';
import {
  definerMysql,
  MAX_BYTES_ESQUEMA,
  nombreDuenoMysql,
  quitarRestrict,
  revisarSql,
} from './sqlPermitido';
import { ErrorWolf } from '../errores';
import { ClientePostgres, validarNombrePg, type FabricaConexionPg } from './clientePostgres';
import type { DatosConexion, MotorBd } from './env';
import {
  esTar,
  formatoDeCabeza,
  LARGO_CABEZA,
  leerCabeza,
  ordenUtf16,
  textoCabeza,
} from './formato';
import { nombreEjecutable } from '../plataforma/sistema';
import { rutaTarSistema } from '../plataforma/win';

type MotorSql = Exclude<MotorBd, 'mongodb'>;
type Operacion = ProgresoBd['operacion'];

export interface OpcionesRestaurar {
  /** Obligatorio si la base destino ya tiene tablas. */
  confirmarSobrescribir?: boolean;
}

export interface ResultadoRestaurar {
  advertencias: string[];
  /** Si se sobrescribió una base con tablas: respaldo automático hecho antes de borrarla. */
  respaldoPrevio?: string;
}

export interface OpcionesRespaldar {
  /** Solo la estructura (CREATE TABLE…), sin ninguna fila: lo que guarda una plantilla. */
  soloEsquema?: boolean;
}

export interface OpcionesRestaurarEsquema {
  /** `importada`: la plantilla viene de un tercero (sin SECURITY DEFINER ni vistas con definer). */
  origen?: 'propia' | 'importada';
}

/** Extensiones de PostgreSQL que el administrador crea antes si el esquema las pide. */
export const EXTENSIONES_PERMITIDAS = [
  'plpgsql',
  'pgcrypto',
  'uuid-ossp',
  'citext',
  'hstore',
  'vector',
  'pg_trgm',
  'unaccent',
  'btree_gin',
  'btree_gist',
  'ltree',
  'fuzzystrmatch',
  'tablefunc',
];

export interface OpcionesImportarAjeno extends OpcionesRestaurar {
  /**
   * La base de destino no existía: si la importación falla se borra (no queda una base vacía con
   * el nombre del origen). Sin esto, ante un fallo la base vuelve a quedar vacía como estaba.
   */
  baseNueva?: boolean;
  /** La base ya existe en el destino (aunque no tenga tablas): se respalda siempre antes de reemplazarla. */
  baseExistente?: boolean;
  /** Cancela la importación: mata solo el volcado que lanzó y deja todo como estaba. */
  senal?: AbortSignal;
}

/** Tope por omisión del volcado de datos de un programa ajeno. */
export const MAX_BYTES_DATOS_AJENOS = 4 * 1024 * 1024 * 1024;

export interface OrigenImportar {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  base: string;
}

export interface DepsRespaldos {
  bd: Pick<BasesDeDatos, 'conexion' | 'crear' | 'tieneTablas'> &
    Partial<
      Pick<BasesDeDatos, 'usuarioTemporal' | 'reiniciarBase' | 'crearExtension' | 'auditarEsquema'>
    >;
  servicios: {
    estados(): Promise<EstadoServicio[]>;
    /** Instancias de un motor (para respaldar o restaurar una instancia concreta). */
    instancias?(servicio: MotorBd): Promise<EstadoInstancia[]>;
  };
  rutas: Rutas;
  exec: Ejecutor;
  /** Procesos largos en streaming (por defecto `spawn`). */
  lanzar?: Lanzador;
  eventos?: Eventos<EventosNucleo>;
  plataforma: Pick<Plataforma, 'carpetaDocumentos'>;
  /** Conexiones al origen de `importar` y al servidor local al reemplazar (para pruebas). */
  fabricas?: { mysql?: FabricaConexion; postgres?: FabricaConexionPg };
  reloj?: () => Date;
  /** Por defecto %SystemRoot%\System32\tar.exe (bsdtar de Windows, no el de Git). */
  rutaTar?: string;
  /** Tope del volcado de datos de un programa ajeno (por defecto 4 GiB; pruebas). */
  maxBytesDatosAjenos?: number;
  /** Vigilancia del volcado del origen (por omisión cada 2 s, corte a los 120 s sin avance). */
  vigilancia?: { intervaloMs: number; estancamientoMs: number };
  /** Bytes libres de la unidad de `ruta` (por omisión `statfs`; pruebas). */
  espacioLibre?: (ruta: string) => Promise<number>;
}

export const MENSAJE_DESCOMPRIMA = 'Descomprima el archivo y elija el .sql o .dump que contiene';
export const MENSAJE_VARIOS = 'Hay varios respaldos dentro; descomprima y elija uno';

const SISTEMA: Record<MotorSql, string[]> = {
  mysql: ['mysql', 'information_schema', 'performance_schema', 'sys'],
  mariadb: ['mysql', 'information_schema', 'performance_schema', 'sys'],
  postgresql: ['postgres', 'template0', 'template1'],
};
/**
 * Aviso del cliente de MariaDB 11.4 en cada conexión cuando la clave va por MYSQL_PWD (la cree
 * "sin clave"): no dice nada del respaldo y saldría como advertencia en cada restauración.
 */
const RUIDO_CLIENTE = /option --ssl-verify-server-cert is disabled/i;
const RESPALDO_DENTRO = /\.(sql|dump|backup)(\.gz)?$/i;
const MAX_ADVERTENCIAS = 200;
const INTERVALO_PROGRESO_MS = 100;
const OPCIONES_BORRADO = { recursive: true, force: true, maxRetries: 10, retryDelay: 200 };
/** Mensajes de las herramientas de PostgreSQL en inglés (se interpretan) y texto en UTF-8. */
const ENV_PG = { LC_MESSAGES: 'C', PGCLIENTENCODING: 'UTF8' };

const enmascarar = (texto: string, claves: string[]): string =>
  claves.reduce((t, c) => (c ? t.split(c).join('***') : t), texto);

function motorSql(motor: MotorBd, accion: string): MotorSql {
  if (motor === 'mongodb') {
    throw new Error(
      `${accion} solo está disponible para MySQL, MariaDB y PostgreSQL, no para MongoDB.`,
    );
  }
  return motor;
}

function validarBase(motor: MotorSql, base: string): void {
  if (/^postgres(ql)?:\/\//i.test(base) || base.includes('://')) {
    throw new Error(`El nombre de la base "${base}" no es válido: no use una URL de conexión.`);
  }
  if (motor === 'postgresql') validarNombrePg(base);
  else validarNombreBd(base);
  if (SISTEMA[motor].includes(base.toLowerCase())) {
    throw new Error(`No se puede restaurar sobre la base del sistema ${base}.`);
  }
}

const tieneControl = (t: string): boolean => [...t].some((c) => c.charCodeAt(0) < 0x20);

function validarOrigen(o: OrigenImportar): void {
  if (!/^[A-Za-z0-9._:[\]-]{1,253}$/.test(o.host) || o.host.startsWith('-')) {
    throw new Error('Indique un servidor de origen válido (nombre o dirección IP).');
  }
  if (!Number.isInteger(o.puerto) || o.puerto < 1 || o.puerto > 65535) {
    throw new Error('El puerto de origen debe ser un número entre 1 y 65535.');
  }
  if (!o.usuario || tieneControl(o.usuario)) {
    throw new Error('Indique el usuario del servidor de origen.');
  }
  // Ni opciones ("-x") ni cadenas de conexión ("host=…") disfrazadas de nombre de base.
  if (!/^[^\s=-][^=]{0,63}$/.test(o.base) || tieneControl(o.base) || o.base.includes('://')) {
    throw new Error(`El nombre de la base de origen "${o.base}" no es válido.`);
  }
}

const errorConTablas = (base: string): Error =>
  new Error(
    `La base ${base} ya tiene tablas: confirme que quiere sobrescribirla o elija una base nueva.`,
  );

const esLocal = (host: string): boolean =>
  ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host.toLowerCase());

/** AAAAMMDD-HHmm en hora local. */
function sello(d: Date): string {
  const dos = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}-${dos(d.getHours())}${dos(d.getMinutes())}`;
}

interface Version {
  mayor: number;
  menor: number;
}

const leerVersion = (texto: string, patron: RegExp): Version | null => {
  const m = patron.exec(texto);
  return m ? { mayor: Number(m[1]), menor: Number(m[2] ?? 0) } : null;
};

/** Salida de una herramienta: progreso limitado, advertencias y últimas líneas, sin claves. */
class Salida {
  readonly advertencias: string[] = [];
  private omitidas = 0;
  private readonly ultimas: string[] = [];
  private ultimoEnvio = Number.NEGATIVE_INFINITY;
  private pendiente: string | null = null;

  constructor(
    private readonly emitir: (linea: string) => void,
    private readonly claves: string[],
    private readonly ahora: () => number,
    private readonly esAdvertencia: (linea: string) => boolean,
  ) {}

  linea(cruda: string): void {
    const l = enmascarar(cruda, this.claves);
    if (!l.trim()) return;
    this.ultimas.push(l);
    if (this.ultimas.length > 5) this.ultimas.shift();
    if (this.esAdvertencia(l)) this.agregar(l);
    this.progreso(l);
  }

  aviso(texto: string): void {
    const l = enmascarar(texto, this.claves);
    this.agregar(l);
    this.progreso(l);
  }

  private agregar(l: string): void {
    if (this.advertencias.length < MAX_ADVERTENCIAS) this.advertencias.push(l);
    else this.omitidas++;
  }

  /** Como mucho una línea cada 100 ms; la última retenida sale en `fin`. */
  progreso(l: string): void {
    const t = this.ahora();
    if (t - this.ultimoEnvio >= INTERVALO_PROGRESO_MS) {
      this.ultimoEnvio = t;
      this.pendiente = null;
      this.emitir(enmascarar(l, this.claves));
    } else {
      this.pendiente = l;
    }
  }

  fin(): void {
    if (this.pendiente !== null) this.emitir(enmascarar(this.pendiente, this.claves));
    this.pendiente = null;
  }

  vio(patron: RegExp): boolean {
    return (
      this.ultimas.some((l) => patron.test(l)) || this.advertencias.some((l) => patron.test(l))
    );
  }

  lista(): string[] {
    return this.omitidas > 0
      ? [...this.advertencias, `… y ${this.omitidas} advertencias más.`]
      : [...this.advertencias];
  }

  /** La línea que mejor explica un fallo. */
  detalle(): string {
    const errores = this.ultimas.filter((l) => /error|fatal|denied|denegad/i.test(l));
    return (errores.at(-1) ?? this.ultimas.at(-1) ?? '').trim();
  }
}

/**
 * Sentencias SQL que cambiarían de base (o la crearían o borrarían) durante un restore. Se
 * comentan cuando la línea empieza en SQL normal (fuera de textos, comentarios y cuerpos $tag$);
 * si la lectura no está en SQL normal y la línea no cae dentro de un texto, se aborta.
 * El BOM se quita antes de probar.
 */
const CAMBIO_BASE: Record<'pg' | 'mysql', RegExp> = {
  pg: /^\s*(?:CREATE|DROP|ALTER)\s+DATABASE\b/i,
  mysql: /^\s*(?:\/\*M?!\d*\s*)?(?:USE(?:[\s`;]|$)|(?:CREATE|DROP|ALTER)\s+(?:DATABASE|SCHEMA)\b)/i,
};
/** `\c` / `\connect` de psql al principio de la línea. */
const CONECTAR_PSQL = /^\s*\\c(?:onnect)?(?:\s|$)/;
/** Líneas \restrict / \unrestrict propias del archivo (pg_dump 17.6+). */
const RESTRICT = /^\s*\\(?:un)?restrict\b/;
/** Solo se mira el principio de cada línea (un INSERT puede medir megas). */
const MAX_CABEZA_LINEA = 4096;
/** BOM de UTF-8 leído en latin1 (0xEF 0xBB 0xBF), escrito con códigos para que no se pierda. */
const BOM_LATIN1 = String.fromCharCode(0xef, 0xbb, 0xbf);
const ETIQUETA_DOLAR = /\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/y;
/** Comentario ejecutable de MySQL/MariaDB: `/*!40101 …` o `/*M!100316 …`. */
const COMENTARIO_EJECUTABLE = /\/\*M?!\d*/y;
const ESPACIO = /\s/;
const esIdentificador = (c: string): boolean => /[A-Za-z0-9_$]/.test(c) || c.charCodeAt(0) >= 0x80;

export const MENSAJE_NO_NEUTRALIZABLE =
  'El respaldo contiene instrucciones de cambio de base que no se pueden neutralizar con seguridad; no se restauró.';
/** Igual, con el psql sin `\restrict`: un psql actualizado sí podría restaurarlo. */
const MENSAJE_NO_NEUTRALIZABLE_PSQL = `${MENSAJE_NO_NEUTRALIZABLE} Actualice PostgreSQL desde Servicios (versiones 13.22, 14.19, 15.14, 16.10, 17.6 o posteriores) y vuelva a intentarlo.`;

interface EstadoLexico {
  modo: 'normal' | 'comilla' | 'dolar' | 'bloque' | 'linea';
  comilla: string;
  /** El texto abierto acepta \ como escape. */
  escapes: boolean;
  etiqueta: string;
  /** PostgreSQL anida los comentarios de bloque. */
  profundidad: number;
  /** MySQL: dentro de un comentario ejecutable `/*! … *\/` (su contenido es SQL). */
  ejecutable: boolean;
  resto: string;
  inicio: boolean;
  /** Aún no hubo nada significativo en la sentencia en curso. */
  vacia: boolean;
  delimitador: string;
  cola: string;
  ant: string;
  ant2: string;
  /** '…' (y "…" en MySQL sin ANSI_QUOTES) acepta \ como escape. */
  escapesTexto: boolean;
  /** MySQL con ANSI_QUOTES: "…" es un identificador. */
  ansi: boolean;
  palabra: string;
  palabraAnt: string;
  primera: boolean;
  copy: boolean;
  stdin: boolean;
  /** Terminó un `COPY … FROM stdin`: los datos empiezan en la línea siguiente. */
  copyPendiente: boolean;
  /** Terminadores de sentencia vistos hasta ahora (para contar los de cada línea). */
  sentencias: number;
}

/**
 * Una lectura de la sintaxis SQL bajo un modo de escapes: comillas ('…', "…", `…`, E'…' de
 * PostgreSQL), cuerpos $tag$, comentarios (anidados en PostgreSQL; `/*! *\/` ejecutable en
 * MySQL), delimitador y `COPY … FROM stdin`. Trabaja en latin1 (los bytes ≥ 0x80 de UTF-8
 * nunca son sintaxis) y por trozos. Con `estricto` (psql sin `\restrict`) marca cualquier \
 * en SQL normal como meta-comando.
 */
class Hipotesis {
  e: EstadoLexico;
  meta = false;

  constructor(
    private readonly mysql: boolean,
    private readonly estricto: boolean,
    escapesTexto: boolean,
  ) {
    this.e = {
      modo: 'normal',
      comilla: '',
      escapes: false,
      etiqueta: '',
      profundidad: 0,
      ejecutable: false,
      resto: '',
      inicio: true,
      vacia: true,
      delimitador: ';',
      cola: '',
      ant: '\n',
      ant2: '\n',
      escapesTexto,
      ansi: false,
      palabra: '',
      palabraAnt: '',
      primera: false,
      copy: false,
      stdin: false,
      copyPendiente: false,
      sentencias: 0,
    };
  }

  /** En SQL normal, sin nada pendiente: una línea así se puede comentar entera. */
  limpio(): boolean {
    const e = this.e;
    return e.modo === 'normal' && e.resto === '' && !e.ejecutable;
  }

  /** Dentro de un texto o de un cuerpo $tag$. */
  enTexto(): boolean {
    const e = this.e;
    return (e.modo === 'comilla' || e.modo === 'dolar') && e.resto === '';
  }

  private finPalabra(): void {
    const e = this.e;
    if (!e.palabra) return;
    const p = e.palabra.toUpperCase();
    if (e.primera) e.copy = !this.mysql && p === 'COPY';
    if (e.copy && e.palabraAnt === 'FROM' && p === 'STDIN') e.stdin = true;
    e.palabraAnt = p;
    e.palabra = '';
  }

  private significativo(c: string): void {
    const e = this.e;
    e.cola = (e.cola + c).slice(-8);
    e.vacia = false;
    e.inicio = e.cola.endsWith(e.delimitador);
    if (e.inicio) {
      e.sentencias++;
      // Fin de sentencia: un COPY … FROM stdin deja los datos para la línea siguiente.
      if (e.copy && e.stdin) e.copyPendiente = true;
      e.copy = false;
      e.stdin = false;
      e.palabraAnt = '';
      e.vacia = true;
    }
  }

  private anterior(c: string): void {
    this.e.ant2 = this.e.ant;
    this.e.ant = c;
  }

  avanzar(trozo: string): void {
    const e = this.e;
    const t = e.resto + trozo;
    e.resto = '';
    const n = t.length;
    for (let i = 0; i < n; i++) {
      const c = t[i]!;
      switch (e.modo) {
        case 'linea':
          if (c === '\n') e.modo = 'normal';
          this.anterior(c);
          continue;
        case 'bloque': {
          const abre = !this.mysql && c === '/';
          if ((c === '*' || abre) && i + 1 >= n) {
            e.resto = c;
            return;
          }
          if (c === '*' && t[i + 1] === '/') {
            i++;
            e.profundidad--;
            if (e.profundidad <= 0) e.modo = 'normal';
          } else if (abre && t[i + 1] === '*') {
            i++;
            e.profundidad++;
          }
          this.anterior(c);
          continue;
        }
        case 'comilla':
          if (c === '\\' && e.escapes) {
            if (i + 1 >= n) {
              e.resto = '\\';
              return;
            }
            i++;
          } else if (c === e.comilla) {
            e.modo = 'normal';
          }
          this.anterior(c);
          continue;
        case 'dolar':
          if (c === '$') {
            if (n - i < e.etiqueta.length && e.etiqueta.startsWith(t.slice(i))) {
              e.resto = t.slice(i);
              return;
            }
            if (t.startsWith(e.etiqueta, i)) {
              e.modo = 'normal';
              i += e.etiqueta.length - 1;
              this.significativo('$');
            }
          }
          this.anterior(c);
          continue;
        default:
          break;
      }
      // SQL normal.
      const abreDolar = c === '$' && !this.mysql && !esIdentificador(e.ant);
      if (esIdentificador(c) && !abreDolar) {
        if (!e.palabra) e.primera = e.vacia;
        if (e.palabra.length < 16) e.palabra += c;
        this.significativo(c);
        this.anterior(c);
        continue;
      }
      this.finPalabra();
      if (c === '\\' && this.estricto) {
        // psql ejecuta los meta-comandos en cualquier punto fuera de textos y comentarios.
        this.meta = true;
      }
      if (ESPACIO.test(c)) {
        this.anterior(c);
        continue;
      }
      const sig = t[i + 1];
      if ((c === '-' || c === '/' || (c === '*' && e.ejecutable)) && sig === undefined) {
        e.resto = c;
        return;
      }
      if (c === '-' && sig === '-') {
        // En MySQL "--" es comentario solo si le sigue un espacio, un control o el fin.
        const tercero = t[i + 2];
        if (this.mysql && tercero === undefined) {
          e.resto = t.slice(i);
          return;
        }
        if (!this.mysql || tercero!.charCodeAt(0) <= 0x20) {
          e.modo = 'linea';
          i++;
          this.anterior('-');
          continue;
        }
        this.significativo(c);
      } else if (c === '#' && this.mysql) {
        e.modo = 'linea';
      } else if (c === '/' && sig === '*') {
        if (this.mysql) {
          const tercero = t[i + 2];
          if (tercero === undefined || (tercero === 'M' && t[i + 3] === undefined)) {
            e.resto = t.slice(i);
            return;
          }
          COMENTARIO_EJECUTABLE.lastIndex = i;
          const m = COMENTARIO_EJECUTABLE.exec(t);
          if (m) {
            // MySQL ejecuta lo que hay dentro: se lee como SQL hasta el */.
            e.ejecutable = true;
            i += m[0].length - 1;
            this.anterior(' ');
            continue;
          }
        }
        e.modo = 'bloque';
        e.profundidad = 1;
        i++;
      } else if (c === '*' && sig === '/' && e.ejecutable) {
        e.ejecutable = false;
        i++;
        this.anterior(' ');
        continue;
      } else if (c === "'" || c === '"' || c === '`') {
        e.comilla = c;
        e.modo = 'comilla';
        const textoE = (e.ant === 'E' || e.ant === 'e') && !esIdentificador(e.ant2);
        e.escapes = this.mysql
          ? c === "'" || (c === '"' && !e.ansi)
            ? e.escapesTexto
            : false
          : c === "'" && (textoE || e.escapesTexto);
        this.significativo(c);
      } else if (abreDolar) {
        ETIQUETA_DOLAR.lastIndex = i;
        const m = ETIQUETA_DOLAR.exec(t);
        if (m) {
          e.etiqueta = m[0];
          e.modo = 'dolar';
          i += m[0].length - 1;
          this.significativo('$');
        } else if (n - i < 64 && !t.includes('\n', i)) {
          // Puede ser una etiqueta partida entre trozos: se decide con el siguiente.
          e.resto = t.slice(i);
          return;
        } else {
          this.significativo(c);
        }
      } else {
        this.significativo(c);
      }
      this.anterior(t[i]!);
    }
  }
}

/**
 * Lecturas de la sintaxis del archivo. MySQL/MariaDB y PostgreSQL con `\restrict`: UNA, con el
 * modo declarado por el archivo. PostgreSQL sin `\restrict` (el léxico es la única barrera):
 * dos, con el modo de escapes declarado y con el contrario; solo se actúa si coinciden.
 */
class Lexico {
  readonly h: Hipotesis[];

  constructor(mysql: boolean, estricto: boolean) {
    const porDefecto = mysql; // MySQL: \ escapa; PostgreSQL: standard_conforming_strings = on
    this.h = [new Hipotesis(mysql, estricto, porDefecto)];
    if (estricto) this.h.push(new Hipotesis(mysql, estricto, !porDefecto));
  }

  guardar(): EstadoLexico[] {
    return this.h.map((x) => ({ ...x.e }));
  }

  volver(s: EstadoLexico[]): void {
    this.h.forEach((x, k) => {
      x.e = { ...s[k]! };
    });
  }

  /** Tras DELIMITER o un COPY: estado limpio al principio de sentencia. */
  reiniciar(delimitador?: string): void {
    for (const x of this.h) {
      const e = x.e;
      e.modo = 'normal';
      e.resto = '';
      e.inicio = true;
      e.vacia = true;
      e.cola = '';
      e.ejecutable = false;
      e.profundidad = 0;
      e.palabra = '';
      e.palabraAnt = '';
      e.copy = false;
      e.stdin = false;
      e.copyPendiente = false;
      if (delimitador !== undefined) e.delimitador = delimitador;
    }
  }

  /** El archivo declaró su modo (SET standard_conforming_strings / sql_mode). */
  fijarModo(escapes: boolean, ansi = false): void {
    this.h.forEach((x, k) => {
      x.e.escapesTexto = k === 0 ? escapes : !escapes;
      x.e.ansi = ansi;
    });
  }

  /** Lee el texto; devuelve qué lecturas vieron un meta-comando. */
  avanzar(texto: string): boolean[] {
    return this.h.map((x) => {
      x.meta = false;
      x.avanzar(texto);
      return x.meta;
    });
  }
}

/** Modo de escapes que declara una línea de PostgreSQL (true = \ escapa), o null. */
function escapesPg(linea: string): boolean | null {
  if (/^\s*RESET\s+(?:ALL|standard_conforming_strings)\b/i.test(linea)) return false;
  if (!/^\s*(?:SET|SELECT)\b/i.test(linea)) return null;
  const m =
    /\bstandard_conforming_strings\b\s*(?:=|\bTO\b)\s*'?(on|off)\b/i.exec(linea) ??
    /set_config\(\s*'standard_conforming_strings'\s*,\s*'(on|off)'/i.exec(linea);
  return m ? m[1]!.toLowerCase() === 'off' : null;
}

interface ModoMysql {
  escapes: boolean;
  ansi: boolean;
}

const VAR_SQL_MODE = '@@(?:(?:session|local|global)\\.)?sql_mode\\b';
const ASIGNACION_MYSQL = new RegExp(
  `(?<![\\w@.$])(${VAR_SQL_MODE}|sql_mode\\b|@[\\w.$]+)\\s*:?=\\s*` +
    `('(?:[^'\\\\]|\\\\.|'')*'|"(?:[^"\\\\]|\\\\.|"")*"|${VAR_SQL_MODE}|@[\\w.$]+)`,
  'gi',
);

const modoDeTexto = (valor: string): ModoMysql => ({
  escapes: !/NO_BACKSLASH_ESCAPES/i.test(valor),
  ansi: /\b(?:ANSI|ANSI_QUOTES|DB2|MAXDB|MSSQL|ORACLE|POSTGRESQL)\b/i.test(valor),
});

export interface OpcionesFiltro {
  /** PostgreSQL: clave para `\restrict` (psql 17.6+): se envía como primera línea. */
  claveRestrict?: string;
  /** PostgreSQL sin `\restrict`: cualquier meta-comando fuera de comillas se neutraliza. */
  estricto?: boolean;
  /**
   * MySQL/MariaDB, volcado de solo datos de un tercero: solo pasan INSERT, LOCK/UNLOCK TABLES,
   * SET (sin GLOBAL ni registro binario) y comentarios, una sentencia por vez; todo lo demás
   * corta el flujo con `MENSAJE_DATOS_NO_PERMITIDOS`.
   */
  soloDatos?: boolean;
}

export const MENSAJE_DATOS_NO_PERMITIDOS =
  'El volcado de datos trae algo que no son datos (solo se aceptan INSERT, LOCK TABLES y SET); no se importó.';

/** Líneas con las que puede empezar una sentencia de un volcado de solo datos (`soloDatos`). */
const SET_PELIGROSO = /SQL_LOG_BIN|@@\s*(?:GLOBAL|PERSIST)|\b(?:GLOBAL|PERSIST|PASSWORD|ROLE)\b/i;
function lineaDeDatos(texto: string): boolean {
  const l = texto.trim();
  if (l === '' || /^--(?:\s|$)/.test(l) || l.startsWith('#')) return true;
  // Comentario de bloque que ocupa toda la línea (nunca el condicional `/*!…`).
  if (/^\/\*(?!!|M!)(?:(?!\*\/)[^])*\*\/$/.test(l)) return true;
  // Primera línea de un volcado de MariaDB reciente (modo sandbox): solo un comentario.
  if (/^\/\*M!999999\\-[^]*\*\/\s*;?$/.test(l)) return true;
  if (
    /^(?:INSERT|REPLACE)\s+(?:(?:LOW_PRIORITY|DELAYED|HIGH_PRIORITY|IGNORE)\s+)*INTO\s/i.test(l)
  ) {
    return true;
  }
  if (/^(?:LOCK|UNLOCK)\s+TABLES\b/i.test(l)) return true;
  if (
    /^(?:\/\*!\d+\s+)?ALTER\s+TABLE\s+\S+\s+(?:DISABLE|ENABLE)\s+KEYS\s*(?:\*\/)?\s*;$/i.test(l)
  ) {
    return true;
  }
  const set = /^(?:\/\*!\d+\s+)?SET\s[^;]*?(?:\*\/)?\s*;$/i.exec(l);
  return set !== null && !SET_PELIGROSO.test(l);
}

type Omitida = 'base' | 'psql';

/**
 * Comenta (`-- `) las líneas que harían salir de la base destino: `USE otra`, `\connect otra`,
 * `CREATE/DROP/ALTER DATABASE`. Una línea solo se comenta si empieza en SQL normal según la
 * lectura del léxico (las dos en PostgreSQL sin `\restrict`, y deben coincidir); si hay que
 * neutralizarla y no se puede con seguridad, corta el flujo con `MENSAJE_NO_NEUTRALIZABLE`.
 * Los textos, cuerpos $tag$ y datos de `COPY … FROM stdin` nunca se tocan.
 *
 * - MySQL/MariaDB: el cliente va con `--binary-mode` (sin comandos del cliente), así que solo
 *   se vigila el SQL. Se sigue `sql_mode` (NO_BACKSLASH_ESCAPES, ANSI_QUOTES) y DELIMITER.
 * - PostgreSQL con `\restrict`: psql rechaza todo meta-comando; se quitan los `\restrict` /
 *   `\unrestrict` del archivo cuando empiezan en SQL normal (si no, pasan y psql los rechaza).
 * - PostgreSQL sin `\restrict` (`estricto`): cualquier \ en SQL normal es un meta-comando.
 */
export class FiltroCambioDeBase extends Transform {
  private cabeza: Buffer[] = [];
  private largo = 0;
  private enCabeza = true;
  private enCopy = false;
  /** La línea en curso no pasa por el léxico (comentada, quitada, meta-comando, DELIMITER). */
  private saltarLinea = false;
  /** La línea en curso se quitó: tampoco se envía el resto. */
  private quitarLinea = false;
  private delimitadorAlTerminar: string | undefined;
  private escapesAlTerminar: boolean | null = null;
  private modoAlTerminar: ModoMysql | null = null;
  private modoMysql: ModoMysql = { escapes: true, ansi: false };
  /** `SET @x = @@sql_mode`: el modo guardado en cada variable. */
  private readonly guardados = new Map<string, ModoMysql>();
  private prefijoEnviado = false;
  private readonly lexico: Lexico;
  private readonly estricto: boolean;
  private readonly restringido: boolean;
  private readonly mensaje: string;
  /** `soloDatos`: terminadores de sentencia que llevaba el léxico al empezar la línea en curso. */
  private sentenciasAlEmpezar = 0;
  private datosRechazados = false;

  constructor(
    private readonly tipo: 'pg' | 'mysql',
    private readonly alOmitir: (linea: string, motivo: Omitida) => void,
    private readonly opciones: OpcionesFiltro = {},
  ) {
    super();
    this.restringido = tipo === 'pg' && !!opciones.claveRestrict;
    this.estricto = tipo === 'pg' && !this.restringido;
    this.mensaje = this.estricto ? MENSAJE_NO_NEUTRALIZABLE_PSQL : MENSAJE_NO_NEUTRALIZABLE;
    this.lexico = new Lexico(tipo === 'mysql', this.estricto);
  }

  private prefijo(): void {
    if (this.prefijoEnviado) return;
    this.prefijoEnviado = true;
    if (this.opciones.claveRestrict) {
      this.push(Buffer.from(`\\restrict ${this.opciones.claveRestrict}\n`));
    }
  }

  private fallo(): Error {
    return new Error(this.datosRechazados ? MENSAJE_DATOS_NO_PERMITIDOS : this.mensaje);
  }

  override _transform(trozo: Buffer, _cod: BufferEncoding, cb: TransformCallback): void {
    this.prefijo();
    let i = 0;
    while (i < trozo.length) {
      const j = trozo.indexOf(0x0a, i);
      if (!this.enCabeza) {
        const fin = j === -1 ? trozo.length : j + 1;
        if (!this.cuerpo(trozo.subarray(i, fin))) {
          cb(this.fallo());
          return;
        }
        i = fin;
        if (j !== -1 && !this.finDeLinea()) {
          cb(this.fallo());
          return;
        }
        continue;
      }
      const finLinea = j === -1 ? trozo.length : j + 1;
      const corte = Math.min(finLinea, i + (MAX_CABEZA_LINEA - this.largo));
      this.cabeza.push(trozo.subarray(i, corte));
      this.largo += corte - i;
      const completa = j !== -1 && corte === finLinea;
      i = corte;
      if (completa || this.largo >= MAX_CABEZA_LINEA) {
        if (!this.soltar()) {
          cb(this.fallo());
          return;
        }
        if (!completa) this.enCabeza = false;
        else if (!this.finDeLinea()) {
          cb(this.fallo());
          return;
        }
      }
    }
    cb();
  }

  override _flush(cb: TransformCallback): void {
    this.prefijo();
    if (this.largo > 0 && !this.soltar()) {
      cb(this.fallo());
      return;
    }
    cb();
  }

  /** Resto de una línea larga: pasa tal cual, pero el léxico lo sigue leyendo. */
  private cuerpo(b: Buffer): boolean {
    if (this.quitarLinea) return true;
    if (!this.enCopy && !this.saltarLinea) {
      // Un meta-comando en la parte ya enviada de la línea no se puede comentar.
      if (this.lexico.avanzar(b.toString('latin1')).some(Boolean)) return false;
      if (this.opciones.soloDatos && this.tipo === 'mysql') {
        // El resto de una línea larga: ni una sentencia más, ni nada tras la que cierra.
        const e = this.lexico.h[0]!.e;
        const n = e.sentencias - this.sentenciasAlEmpezar;
        if (n > 1 || (n === 1 && !e.inicio)) {
          this.datosRechazados = true;
          return false;
        }
      }
    }
    this.push(b);
    return true;
  }

  /** false si las lecturas no coinciden en si empiezan datos de COPY. */
  private finDeLinea(): boolean {
    this.enCabeza = true;
    const copia = this.lexico.h.map((x) => x.e.copyPendiente);
    const copy = !this.enCopy && copia.some(Boolean);
    if (copy && !copia.every(Boolean)) return false;
    if (copy || this.delimitadorAlTerminar !== undefined) {
      this.lexico.reiniciar(this.delimitadorAlTerminar);
    }
    if (this.escapesAlTerminar !== null) this.lexico.fijarModo(this.escapesAlTerminar);
    if (this.modoAlTerminar !== null) {
      this.modoMysql = this.modoAlTerminar;
      this.lexico.fijarModo(this.modoMysql.escapes, this.modoMysql.ansi);
    }
    this.saltarLinea = false;
    this.quitarLinea = false;
    this.delimitadorAlTerminar = undefined;
    this.escapesAlTerminar = null;
    this.modoAlTerminar = null;
    if (copy) this.enCopy = true;
    return true;
  }

  /** `SET … sql_mode = '…'` (literal) y `SET @x = @@sql_mode` / `sql_mode = @x`. */
  private modoMysqlDeclarado(linea: string): ModoMysql | null {
    if (!/^\s*(?:\/\*M?!\d*\s*)?SET\b/i.test(linea)) return null;
    let actual = this.modoMysql;
    let cambio = false;
    ASIGNACION_MYSQL.lastIndex = 0;
    for (let m = ASIGNACION_MYSQL.exec(linea); m; m = ASIGNACION_MYSQL.exec(linea)) {
      const izq = m[1]!.toLowerCase();
      const der = m[2]!;
      const global = izq.startsWith('@@global.') || /\bGLOBAL\s+$/i.test(linea.slice(0, m.index));
      if (global) continue;
      const derVar = der.startsWith('@') && !der.startsWith('@@') ? der.toLowerCase() : null;
      if (izq.startsWith('@') && !izq.startsWith('@@')) {
        // Variable de usuario: guarda el modo actual (o el de otra variable).
        const valor = der.startsWith('@@')
          ? actual
          : derVar !== null
            ? this.guardados.get(derVar)
            : undefined;
        if (valor) this.guardados.set(izq, valor);
        else this.guardados.delete(izq);
        continue;
      }
      if (der.startsWith("'") || der.startsWith('"')) {
        actual = modoDeTexto(der);
        cambio = true;
      } else if (derVar !== null && this.guardados.has(derVar)) {
        actual = this.guardados.get(derVar)!;
        cambio = true;
      }
      // Otro valor no literal (@x desconocida): se mantiene el modo anterior.
    }
    return cambio ? actual : null;
  }

  /** false si la línea no se puede neutralizar con seguridad. */
  private soltar(): boolean {
    const b = Buffer.concat(this.cabeza);
    this.cabeza = [];
    this.largo = 0;
    const texto = b.toString('latin1');
    if (this.enCopy) {
      // Datos de COPY: hasta la línea "\.". No se tocan.
      if (/^\\\.\r?\n?$/.test(texto)) this.enCopy = false;
      this.push(b);
      return true;
    }
    const h = this.lexico.h;
    const enTexto = h.map((x) => x.enTexto());
    const limpio = h.map((x) => x.limpio());
    const todasLimpias = limpio.every(Boolean);
    const inicio = todasLimpias && h.every((x) => x.e.inicio);
    const sinBom = texto.startsWith(BOM_LATIN1) ? texto.slice(3) : texto;
    const mostrar = (): string => b.toString('utf8').trim().slice(0, 200);

    if (this.tipo === 'pg' && todasLimpias && RESTRICT.test(sinBom)) {
      // \restrict / \unrestrict del archivo: fuera (manda el nuestro). Si la línea no empieza
      // en SQL normal, pasa como está: psql, restringido con nuestra clave, la rechaza.
      this.alOmitir(mostrar(), 'psql');
      this.saltarLinea = true;
      this.quitarLinea = true;
      return true;
    }

    const antes = this.lexico.guardar();
    const meta = this.lexico.avanzar(texto);
    const cambio = CAMBIO_BASE[this.tipo].test(sinBom);
    const conectar = this.tipo === 'pg' && CONECTAR_PSQL.test(sinBom);
    const neutralizar = h.map(
      (_x, k) =>
        meta[k]! || (!enTexto[k] && cambio) || (this.restringido && limpio[k]! && conectar),
    );
    if (neutralizar.some(Boolean)) {
      // Solo se comenta si todas las lecturas lo piden y la línea empieza en SQL normal.
      if (!neutralizar.every(Boolean) || !todasLimpias) return false;
      // La línea entera pasa a ser un comentario: el léxico sigue como antes de ella.
      this.lexico.volver(antes);
      this.alOmitir(mostrar(), cambio || conectar ? 'base' : 'psql');
      this.push(Buffer.from('-- '));
      this.push(b);
      this.saltarLinea = true;
      return true;
    }
    if (this.opciones.soloDatos && this.tipo === 'mysql') {
      // Volcado de solo datos de un tercero: cada sentencia empieza con una línea de la lista, y
      // la línea trae a lo sumo una sentencia completa (nada antes ni después de su `;`).
      const e = h[0]!.e;
      const previo = antes[0]!;
      const n = e.sentencias - previo.sentencias;
      this.sentenciasAlEmpezar = previo.sentencias;
      if ((previo.inicio && !lineaDeDatos(sinBom)) || n > 1 || (n === 1 && !e.inicio)) {
        this.datosRechazados = true;
        return false;
      }
    }
    if (inicio) {
      if (this.tipo === 'pg') this.escapesAlTerminar = escapesPg(sinBom);
      else this.modoAlTerminar = this.modoMysqlDeclarado(sinBom);
    }
    if (this.restringido && todasLimpias && /^\s*\\/.test(sinBom)) {
      // Otro meta-comando de psql (\set, \encoding…): con \restrict, psql lo rechaza. No es SQL.
      this.lexico.volver(antes);
      this.push(b);
      this.saltarLinea = true;
      return true;
    }
    const delim = this.tipo === 'mysql' && inicio ? /^\s*DELIMITER\s+(\S+)/i.exec(sinBom) : null;
    if (delim) {
      this.saltarLinea = true;
      this.delimitadorAlTerminar = delim[1];
    }
    this.push(b);
    return true;
  }
}

/** UTF-16 (LE o BE, con BOM) a UTF-8. */
class DeUtf16 extends Transform {
  private readonly dec: TextDecoder;
  constructor(orden: 'le' | 'be') {
    super();
    this.dec = new TextDecoder(orden === 'le' ? 'utf-16le' : 'utf-16be');
  }
  override _transform(trozo: Buffer, _c: BufferEncoding, cb: TransformCallback): void {
    cb(null, Buffer.from(this.dec.decode(trozo, { stream: true }), 'utf8'));
  }
  override _flush(cb: TransformCallback): void {
    cb(null, Buffer.from(this.dec.decode(), 'utf8'));
  }
}

/**
 * Encadena flujos con `pipe`. Un error en cualquier etapa llega al último (lo recibe el
 * lanzador) y, cuando el último se cierra (el proceso terminó o falló), se destruyen todas las
 * etapas: no queda ningún archivo abierto.
 */
export function encadenar(primero: Readable, ...resto: Transform[]): Readable {
  const etapas: (Readable | Transform)[] = [primero, ...resto];
  const ultimo = etapas.at(-1)!;
  let actual: Readable = primero;
  for (const t of resto) {
    actual.on('error', (e) => ultimo.destroy(e));
    actual = actual.pipe(t);
  }
  ultimo.on('close', () => {
    for (const e of etapas) if (!e.destroyed) e.destroy();
  });
  return ultimo;
}

/** Cuenta los bytes leídos del archivo para el progreso. */
class Contador extends Transform {
  leidos = 0;
  constructor(private readonly alAvanzar: (leidos: number) => void) {
    super();
  }
  override _transform(trozo: Buffer, _c: BufferEncoding, cb: TransformCallback): void {
    this.leidos += trozo.length;
    this.alAvanzar(this.leidos);
    cb(null, trozo);
  }
}

const MB = 1024 * 1024;

/** Primeros bytes ya descomprimidos de un .gz. */
async function cabezaGz(ruta: string): Promise<Buffer> {
  const lector = createReadStream(ruta);
  const gz = createGunzip();
  lector.on('error', (e) => gz.destroy(e));
  lector.pipe(gz);
  const partes: Buffer[] = [];
  let n = 0;
  try {
    for await (const p of gz) {
      partes.push(p as Buffer);
      n += (p as Buffer).length;
      if (n >= LARGO_CABEZA) break;
    }
  } catch {
    if (n === 0) throw new Error('El archivo .gz está dañado o incompleto.');
  } finally {
    lector.destroy();
    gz.destroy();
  }
  return Buffer.concat(partes).subarray(0, LARGO_CABEZA);
}

type Fuente =
  | { tipo: 'pgdump'; ruta: string }
  | { tipo: 'sql'; ruta: string; gz: boolean; utf16: 'le' | 'be' | null; cabeza: Buffer };

const NO_RECONOCIDO =
  'No se reconoce el formato del archivo: use un .sql, un respaldo de pg_dump, .gz, .zip, .rar o .7z.';

/** Respaldar, restaurar e importar bases de MySQL, MariaDB y PostgreSQL. */
export class Respaldos {
  constructor(private readonly d: DepsRespaldos) {}

  /**
   * Para una instancia concreta (`mysql@8.0`), unos `Respaldos` cuyas conexiones y binarios son
   * los de esa instancia; para un motor, este mismo (su predeterminada).
   */
  private async para(objetivo: ObjetivoBd): Promise<{ r: Respaldos; motor: MotorBd }> {
    const motor = motorDe(objetivo);
    if (!esIdInstancia(objetivo)) return { r: this, motor };
    const version = (await this.d.servicios.instancias?.(motor))?.find(
      (i) => i.id === objetivo,
    )?.version;
    const r = new Respaldos({
      ...this.d,
      bd: {
        conexion: () => this.d.bd.conexion(objetivo),
        crear: (_m, nombre, o) => this.d.bd.crear(objetivo, nombre, o),
        tieneTablas: (_m, base) => this.d.bd.tieneTablas(objetivo, base),
        // Lo de la restauración de esquemas siempre va a esta instancia.
        ...(this.d.bd.usuarioTemporal
          ? {
              usuarioTemporal: (_o: ObjetivoBd, base: string, privilegios?: 'todos' | 'datos') =>
                this.d.bd.usuarioTemporal!(objetivo, base, privilegios),
            }
          : {}),
        ...(this.d.bd.reiniciarBase
          ? {
              reiniciarBase: (_o: ObjetivoBd, base: string) =>
                this.d.bd.reiniciarBase!(objetivo, base),
            }
          : {}),
        ...(this.d.bd.auditarEsquema
          ? {
              auditarEsquema: (_o: ObjetivoBd, base: string, o: never) =>
                this.d.bd.auditarEsquema!(objetivo, base, o),
            }
          : {}),
        ...(this.d.bd.crearExtension
          ? {
              crearExtension: (base: string, nombre: string) =>
                this.d.bd.crearExtension!(base, nombre, objetivo),
            }
          : {}),
      },
      servicios: {
        estados: async () =>
          (await this.d.servicios.estados()).map((e) =>
            e.id === motor && version ? { ...e, version } : e,
          ),
      },
    });
    return { r, motor };
  }

  /**
   * Carpeta por defecto de los respaldos (también la de las copias de seguridad automáticas):
   * `<Documentos>\WolfCore Dev\Respaldos`, con la carpeta Documentos real (OneDrive, redirigida).
   */
  async carpetaRespaldos(): Promise<string> {
    return path.join(await this.d.plataforma.carpetaDocumentos(), 'WolfCore Dev', 'Respaldos');
  }

  private get lanzar(): Lanzador {
    return this.d.lanzar ?? lanzadorPorDefecto;
  }

  private ahora(): Date {
    return this.d.reloj?.() ?? new Date();
  }

  private tar(): string {
    return this.d.rutaTar ?? rutaTarSistema();
  }

  private salida(
    operacion: Operacion,
    motor: MotorSql,
    base: string,
    claves: string[],
    esAdvertencia: (l: string) => boolean,
  ): Salida {
    return new Salida(
      (linea) => this.d.eventos?.emit('bd:progreso', { operacion, motor, base, linea }),
      claves,
      () => this.ahora().getTime(),
      esAdvertencia,
    );
  }

  /** Ejecutable de cliente de la versión instalada del servidor local. */
  private async herramienta(
    motor: MotorSql,
    cual: 'cliente' | 'volcado' | 'restaurar',
  ): Promise<{ exe: string; version: string }> {
    const e = (await this.d.servicios.estados()).find((x) => x.id === motor);
    const nombre = NOMBRE_SERVICIO[motor];
    if (!e?.version) throw new Error(`${nombre} no está instalado. Instálelo desde Servicios.`);
    const version = e.version;
    const bin = this.d.rutas.bin(motor, version);
    let carpeta: string;
    let candidatos: string[];
    if (motor === 'postgresql') {
      carpeta = path.join(bin, 'pgsql', 'bin');
      candidatos = [
        cual === 'cliente'
          ? nombreEjecutable('psql')
          : cual === 'volcado'
            ? nombreEjecutable('pg_dump')
            : nombreEjecutable('pg_restore'),
      ];
    } else {
      carpeta = path.join(bin, 'bin');
      const volcado = cual === 'volcado';
      candidatos =
        motor === 'mariadb'
          ? volcado
            ? [nombreEjecutable('mariadb-dump'), nombreEjecutable('mysqldump')]
            : [nombreEjecutable('mariadb'), nombreEjecutable('mysql')]
          : [volcado ? nombreEjecutable('mysqldump') : nombreEjecutable('mysql')];
    }
    const encontrado = candidatos.map((n) => path.join(carpeta, n)).find((p) => existsSync(p));
    if (!encontrado) {
      throw new Error(
        `No se encontró ${candidatos[0]} en ${nombre} ${version}: reinstálelo desde Servicios.`,
      );
    }
    return { exe: encontrado, version };
  }

  private async comprobarDestino(
    motor: MotorSql,
    base: string,
    confirmar: boolean | undefined,
  ): Promise<{ con: DatosConexion; tablas: boolean }> {
    const con = await this.d.bd.conexion(motor);
    const tablas = await this.d.bd.tieneTablas(motor, base);
    if (tablas && confirmar !== true) throw errorConTablas(base);
    return { con, tablas };
  }

  /** Respaldo automático de la base que se va a reemplazar; si falla, no se toca nada. */
  private async respaldoDeSeguridad(
    motor: MotorSql,
    base: string,
    permitirVacio = false,
  ): Promise<string> {
    let archivo: string;
    try {
      ({ archivo } = await this.respaldarComo(
        motor,
        base,
        undefined,
        `${base}-antes-de-sobrescribir`,
      ));
    } catch (e) {
      const detalle = e instanceof Error ? e.message : String(e);
      throw new Error(
        `No se sobrescribió la base ${base}: falló su respaldo previo y no se tocó nada. ${detalle}`,
      );
    }
    if (!(permitirVacio ? (await stat(archivo)).size > 0 : await respaldoValido(archivo, motor))) {
      await rm(archivo, { force: true }).catch(() => undefined);
      throw new Error(
        `No se sobrescribió la base ${base}: su respaldo previo quedó vacío o incompleto; no se tocó nada.`,
      );
    }
    return archivo;
  }

  /** Con una conexión breve de administración a PostgreSQL. */
  private async conPg<T>(con: DatosConexion, fn: (c: ClientePostgres) => Promise<T>): Promise<T> {
    const c = new ClientePostgres(this.d.fabricas?.postgres);
    await c.conectar({
      host: con.host,
      puerto: con.puerto,
      usuario: con.usuario,
      clave: con.clave ?? '',
    });
    try {
      return await fn(c);
    } finally {
      await c.cerrar();
    }
  }

  private duenoPg(base: string, con: DatosConexion): Promise<string | null> {
    return this.conPg(con, (c) => c.duenoBase(base));
  }

  private asignarDuenoPg(base: string, dueno: string, con: DatosConexion): Promise<void> {
    return this.conPg(con, (c) => c.asignarDueno(base, dueno));
  }

  /** Borra la base destino (PostgreSQL: antes cierra las demás conexiones a ella). */
  private async borrarParaReemplazar(motor: MotorSql, base: string): Promise<void> {
    const con = await this.d.bd.conexion(motor);
    const datos = {
      host: con.host,
      puerto: con.puerto,
      usuario: con.usuario,
      clave: con.clave ?? '',
    };
    if (motor === 'postgresql') {
      const c = new ClientePostgres(this.d.fabricas?.postgres);
      await c.conectar(datos);
      try {
        await c.terminarConexiones(base);
        // Desde PostgreSQL 13, WITH (FORCE) cierra también las conexiones que entren entretanto.
        const v = leerVersion(await c.version(), /PostgreSQL\s+(\d+)(?:\.(\d+))?/);
        await c.borrarBase(base, { forzar: (v?.mayor ?? 0) >= 13 });
      } finally {
        await c.cerrar();
      }
      return;
    }
    const c = new ClienteMysql(this.d.fabricas?.mysql);
    await c.conectar(datos);
    try {
      await c.borrarBase(base);
    } finally {
      await c.cerrar();
    }
  }

  async restaurar(
    objetivo: ObjetivoBd,
    archivo: string,
    base: string,
    opts: OpcionesRestaurar = {},
  ): Promise<ResultadoRestaurar> {
    const { r, motor } = await this.para(objetivo);
    return r.restaurarInterno('restaurar', motor, archivo, base, opts, []);
  }

  private async restaurarInterno(
    operacion: Operacion,
    motor: MotorBd,
    archivo: string,
    base: string,
    opts: OpcionesRestaurar,
    clavesExtra: string[],
  ): Promise<ResultadoRestaurar> {
    const m = motorSql(motor, 'Restaurar');
    validarBase(m, base);
    const ruta = path.resolve(archivo);
    let info;
    try {
      info = await stat(ruta);
    } catch {
      throw new Error(`No se encontró el archivo ${ruta}.`);
    }
    if (!info.isFile()) throw new Error('Elija un archivo de respaldo, no una carpeta.');

    // Antes de descomprimir o ejecutar nada (Review Focus 3).
    const { con, tablas } = await this.comprobarDestino(m, base, opts.confirmarSobrescribir);

    await mkdir(this.d.rutas.tmp(), { recursive: true });
    const tmp = path.join(this.d.rutas.tmp(), `restaurar-${randomUUID()}`);
    await mkdir(tmp, { recursive: true });
    try {
      const fuente = await this.preparar(ruta, tmp, 0);
      this.revisarFamilia(m, fuente);
      const claves = [con.clave ?? '', ...clavesExtra];
      // PostgreSQL: se restaura como superusuario; el dueño de la base (el usuario del proyecto)
      // se lee ANTES de borrarla o crearla y al final se le devuelven la base y sus objetos.
      let dueno: string | null = null;
      const leerDueno = async (): Promise<void> => {
        if (m === 'postgresql') dueno = await this.duenoPg(base, con);
      };
      // Devuelve una advertencia si no pudo: los datos ya están restaurados, no es un fallo.
      const devolverDueno = async (): Promise<string | null> => {
        if (!dueno || dueno === con.usuario) return null;
        try {
          await this.asignarDuenoPg(base, dueno, con);
          return null;
        } catch (e) {
          return `Los datos se restauraron, pero no se pudo devolver la propiedad al usuario ${dueno}: ${e instanceof Error ? e.message : String(e)}`;
        }
      };
      if (!tablas) {
        if (await this.d.bd.tieneTablas(m, base)) {
          // Aparecieron tablas mientras se preparaba el archivo: no se toca nada.
          throw errorConTablas(base);
        }
        await leerDueno();
        await this.d.bd.crear(m, base);
        const r = await this.ejecutarRestauracion(operacion, m, fuente, base, con, claves);
        const aviso = await devolverDueno();
        return aviso ? { ...r, advertencias: [...r.advertencias, aviso] } : r;
      }
      // Sobrescribir = reemplazar: respaldo de seguridad verificado, base nueva y restauración.
      const respaldoPrevio = await this.respaldoDeSeguridad(m, base);
      await leerDueno();
      await this.borrarParaReemplazar(m, base);
      try {
        await this.d.bd.crear(m, base);
        let r: ResultadoRestaurar;
        try {
          r = await this.ejecutarRestauracion(operacion, m, fuente, base, con, claves);
        } catch (e) {
          // La base nueva no se queda a nombre del superusuario aunque la restauración falle.
          await devolverDueno().catch(() => undefined);
          throw e;
        }
        const aviso = await devolverDueno();
        return {
          ...r,
          ...(aviso ? { advertencias: [...r.advertencias, aviso] } : {}),
          respaldoPrevio,
        };
      } catch (e) {
        throw new ErrorTrasReemplazo(base, respaldoPrevio, e);
      }
    } finally {
      await rm(tmp, OPCIONES_BORRADO).catch(() => undefined);
    }
  }

  /** Deja el respaldo listo: un pg_dump en disco o un SQL que se lee en streaming. */
  private async preparar(archivo: string, tmp: string, nivel: number): Promise<Fuente> {
    const cabeza = await leerCabeza(archivo);
    const formato = formatoDeCabeza(cabeza);
    switch (formato) {
      case 'pgdump':
        return { tipo: 'pgdump', ruta: archivo };
      case 'sql':
        return { tipo: 'sql', ruta: archivo, gz: false, utf16: ordenUtf16(cabeza), cabeza };
      case 'gz': {
        const dentro = await cabezaGz(archivo);
        if (esTar(dentro)) return this.extraer(archivo, tmp, nivel);
        const interno = formatoDeCabeza(dentro);
        if (interno === 'pgdump') {
          // pg_restore necesita un archivo: se descomprime a tmp/ (en streaming).
          const destino = path.join(tmp, `${randomUUID()}.dump`);
          try {
            await pipeline(createReadStream(archivo), createGunzip(), createWriteStream(destino));
          } catch {
            throw new Error('El archivo .gz está dañado o incompleto.');
          }
          return { tipo: 'pgdump', ruta: destino };
        }
        if (interno === 'sql') {
          return {
            tipo: 'sql',
            ruta: archivo,
            gz: true,
            utf16: ordenUtf16(dentro),
            cabeza: dentro,
          };
        }
        throw new Error(NO_RECONOCIDO);
      }
      case 'zip':
      case 'rar':
      case '7z':
        return this.extraer(archivo, tmp, nivel);
      default:
        throw new Error(NO_RECONOCIDO);
    }
  }

  /** Extrae con el tar.exe de Windows en tmp/ y elige el único .sql/.dump de adentro. */
  private async extraer(archivo: string, tmp: string, nivel: number): Promise<Fuente> {
    if (nivel > 0) throw new Error(MENSAJE_DESCOMPRIMA);
    const destino = path.join(tmp, 'extraido');
    await mkdir(destino, { recursive: true });
    let codigo: number;
    try {
      ({ codigo } = await this.d.exec(this.tar(), ['-xf', archivo, '-C', destino], {
        timeoutMs: 2 * 60 * 60 * 1000,
      }));
    } catch {
      codigo = 1;
    }
    if (codigo !== 0) throw new Error(MENSAJE_DESCOMPRIMA);
    const candidatos: string[] = [];
    for (const rel of await readdir(destino, { recursive: true })) {
      const p = path.join(destino, String(rel));
      // Sin los metadatos que agrega macOS (__MACOSX/, ._archivo).
      const partes = String(rel).split(/[\\/]/);
      if (partes.includes('__MACOSX') || partes.at(-1)!.startsWith('._')) continue;
      // Solo archivos normales (un enlace podría apuntar fuera de la carpeta).
      if (RESPALDO_DENTRO.test(p) && (await lstat(p)).isFile()) candidatos.push(p);
    }
    if (candidatos.length === 0) {
      throw new Error('No hay ningún .sql o .dump dentro del archivo comprimido.');
    }
    if (candidatos.length > 1) throw new Error(MENSAJE_VARIOS);
    return this.preparar(candidatos[0]!, tmp, nivel + 1);
  }

  /** Un respaldo de un motor no se restaura en el otro. */
  private revisarFamilia(motor: MotorSql, fuente: Fuente): void {
    if (fuente.tipo === 'pgdump') {
      if (motor !== 'postgresql') {
        throw new Error('Este respaldo es de PostgreSQL (pg_dump): restáurelo en PostgreSQL.');
      }
      return;
    }
    const texto = textoCabeza(fuente.cabeza);
    if (motor === 'postgresql' && /^--\s*(MySQL|MariaDB) dump/im.test(texto)) {
      throw new Error('Este respaldo es de MySQL o MariaDB: restáurelo en MySQL o MariaDB.');
    }
    if (motor !== 'postgresql' && /PostgreSQL database dump/i.test(texto)) {
      throw new Error('Este respaldo es de PostgreSQL: restáurelo en PostgreSQL.');
    }
  }

  /** SQL del archivo en streaming: descomprimido, en UTF-8 y sin cambios de base. */
  private flujoSql(
    fuente: Extract<Fuente, { tipo: 'sql' }>,
    tipo: 'pg' | 'mysql',
    s: Salida,
    total: number,
    opciones: OpcionesFiltro = {},
  ): Readable {
    let ultimoMb = -1;
    const contador = new Contador((leidos) => {
      const mb = Math.floor(leidos / MB);
      if (mb === ultimoMb) return;
      ultimoMb = mb;
      const pct = total > 0 ? ` (${Math.min(100, Math.floor((leidos / total) * 100))} %)` : '';
      s.progreso(`Leídos ${mb} de ${Math.ceil(total / MB)} MB${pct}`);
    });
    const pasos: Transform[] = [contador];
    if (fuente.gz) pasos.push(createGunzip());
    if (fuente.utf16) pasos.push(new DeUtf16(fuente.utf16));
    pasos.push(
      new FiltroCambioDeBase(
        tipo,
        (l, motivo) =>
          s.aviso(
            motivo === 'base'
              ? `Se omitió una línea que cambiaba de base: ${l}`
              : `Se omitió un comando de psql: ${l}`,
          ),
        opciones,
      ),
    );
    return encadenar(createReadStream(fuente.ruta), ...pasos);
  }

  private async ejecutarRestauracion(
    operacion: Operacion,
    motor: MotorSql,
    fuente: Fuente,
    base: string,
    con: DatosConexion,
    claves: string[],
  ): Promise<ResultadoRestaurar> {
    const clave = con.clave ?? '';
    const total = (await stat(fuente.ruta)).size;
    let exe: string;
    let args: string[];
    let env: Record<string, string>;
    let s: Salida;
    let entrada: Readable | undefined;
    let correcto: (codigo: number) => boolean;
    if (motor === 'postgresql') {
      env = { ...ENV_PG, PGPASSWORD: clave };
      const conexion = ['-h', con.host, '-p', String(con.puerto), '-U', con.usuario, '-d', base];
      if (fuente.tipo === 'pgdump') {
        exe = (await this.herramienta(motor, 'restaurar')).exe;
        args = [
          '--no-owner',
          '--no-privileges',
          '--verbose',
          '--no-password',
          ...conexion,
          fuente.ruta,
        ];
        s = this.salida(operacion, motor, base, claves, (l) =>
          /^pg_restore: (error|warning|advertencia|aviso)/i.test(l),
        );
        // Con errores no fatales (roles inexistentes, etc.) sale con 1 y lo resume al final.
        correcto = (c) => c === 0 || s.vio(/errors ignored on restore|errores ignorados/i);
      } else {
        exe = (await this.herramienta(motor, 'cliente')).exe;
        args = ['-X', '-q', '--no-password', '-v', 'ON_ERROR_STOP=0', ...conexion, '-f', '-'];
        // Con \restrict, psql rechaza cualquier meta-comando posterior (\!, \o, \i, \connect…).
        // Un psql sin \restrict: se neutraliza todo meta-comando fuera de comillas.
        const filtro: OpcionesFiltro = (await this.psqlRestringe(exe))
          ? { claveRestrict: randomBytes(16).toString('hex') }
          : { estricto: true };
        s = this.salida(operacion, motor, base, claves, (l) =>
          /\b(ERROR|FATAL|WARNING|ADVERTENCIA):/.test(l),
        );
        entrada = this.flujoSql(fuente, 'pg', s, total, filtro);
        correcto = (c) => c === 0;
      }
    } else {
      if (fuente.tipo !== 'sql') throw new Error('Este respaldo es de PostgreSQL.');
      const cliente = await this.herramienta(motor, 'cliente');
      exe = cliente.exe;
      env = { MYSQL_PWD: clave };
      args = [
        `--host=${con.host}`,
        `--port=${con.puerto}`,
        `--user=${con.usuario}`,
        '--default-character-set=utf8mb4',
        // Sin comandos del cliente (\!, source, tee, \u…) salvo \C y DELIMITER.
        '--binary-mode',
        // MariaDB reciente: además, nada que toque archivos ni ejecute programas.
        ...(motor === 'mariadb' && mariadbConSandbox(cliente.version) ? ['--sandbox'] : []),
        '--force',
        base,
      ];
      s = this.salida(
        operacion,
        motor,
        base,
        claves,
        (l) => /^(ERROR|Warning)\b/i.test(l) && !RUIDO_CLIENTE.test(l),
      );
      entrada = this.flujoSql(fuente, 'mysql', s, total);
      // Con --force sigue tras un error de una sentencia y sale con 1: eso es una advertencia.
      // Perder la conexión (2006/2013) o no poder entrar sí es un fallo.
      correcto = (c) =>
        c === 0 || (s.vio(/^ERROR \d+ \([^)]*\) at line \d+/) && !s.vio(/^ERROR (2006|2013)\b/));
    }

    let codigo: number;
    try {
      ({ codigo } = await this.lanzar(exe, args, {
        env,
        ...(entrada ? { entrada } : {}),
        alLinea: (l) => s.linea(l),
      }));
    } catch (e) {
      s.fin();
      const z = (e as { code?: unknown } | null)?.code;
      if (typeof z === 'string' && z.startsWith('Z_')) {
        throw new Error('El archivo .gz está dañado o incompleto: la restauración quedó a medias.');
      }
      if (e instanceof Error && e.message.startsWith(MENSAJE_NO_NEUTRALIZABLE)) {
        throw new Error(e.message);
      }
      throw new Error(
        `No se pudo restaurar la base ${base}: ${enmascarar(e instanceof Error ? e.message : String(e), claves)}`,
      );
    }
    s.fin();
    if (!correcto(codigo)) {
      const detalle = s.detalle();
      throw new Error(`No se pudo restaurar la base ${base}${detalle ? `: ${detalle}` : '.'}`);
    }
    return { advertencias: s.lista() };
  }

  /** pg_dump -Fc o mysqldump hacia `destino`. */
  private async volcar(
    operacion: Operacion,
    motor: MotorSql,
    etiqueta: string,
    origen: { host: string; puerto: number; usuario: string; clave: string; base: string },
    destino: string,
    claves: string[],
    soloEsquema = false,
    /** Solo MySQL y MariaDB: sin CREATE (tablas, vistas, rutinas ni disparadores): solo filas. */
    soloDatos = false,
    senal?: AbortSignal,
  ): Promise<Salida> {
    // Windows pasa MYSQL_PWD en la página de códigos local: una clave con acentos llegaría cambiada.
    if (motor !== 'postgresql' && [...origen.clave].some((ch) => ch.charCodeAt(0) > 0x7e)) {
      throw new ErrorWolf(
        'importar.clave_no_ascii',
        'La clave tiene caracteres que no son ASCII y no se puede pasar al volcado: use una sin acentos ni símbolos especiales.',
      );
    }
    const { exe } = await this.herramienta(motor, 'volcado');
    let args: string[];
    let env: Record<string, string>;
    if (motor === 'postgresql') {
      env = { ...ENV_PG, PGPASSWORD: origen.clave };
      args = [
        '-Fc',
        '--verbose',
        // Solo estructura: ni una fila (plantillas de proyecto).
        ...(soloEsquema ? ['--schema-only', '--no-subscriptions', '--no-publications'] : []),
        '--no-password',
        '-h',
        origen.host,
        '-p',
        String(origen.puerto),
        '-U',
        origen.usuario,
        '-f',
        destino,
        origen.base,
      ];
    } else {
      env = { MYSQL_PWD: origen.clave };
      args = [
        `--host=${origen.host}`,
        `--port=${origen.puerto}`,
        `--user=${origen.usuario}`,
        // Una transacción de solo lectura con instantánea: sin bloquear ni escribir.
        '--single-transaction',
        ...(soloDatos ? ['--skip-triggers'] : ['--routines', '--triggers']),
        '--no-tablespaces',
        '--default-character-set=utf8mb4',
        // Solo estructura: ni una fila (plantillas de proyecto).
        ...(soloEsquema ? ['--no-data'] : []),
        // Solo filas, con los binarios en hexadecimal (texto plano que el filtro puede leer).
        ...(soloDatos
          ? ['--no-create-info', '--hex-blob', '--skip-add-locks', '--skip-disable-keys']
          : []),
        ...(motor === 'mysql' ? ['--set-gtid-purged=OFF'] : []),
        '--verbose',
        `--result-file=${destino}`,
        origen.base,
      ];
    }
    const s = this.salida(
      operacion,
      motor,
      etiqueta,
      claves,
      (l) => /warning|advertencia/i.test(l) && !RUIDO_CLIENTE.test(l),
    );
    let codigo: number;
    try {
      ({ codigo } = await this.lanzar(exe, args, {
        env,
        alLinea: (l) => s.linea(l),
        ...(senal ? { senal } : {}),
      }));
    } catch {
      codigo = -1;
    }
    s.fin();
    if (senal?.aborted) throw razonDe(senal);
    if (codigo !== 0) throw new ErrorVolcado(s.detalle());
    return s;
  }

  /**
   * El esquema de un respaldo como texto SQL (para revisarlo): un .sql tal cual; un respaldo de
   * pg_dump pasa por `pg_restore -f -` (no conecta a ninguna base).
   */
  async esquemaComoTexto(objetivo: ObjetivoBd, archivo: string): Promise<string> {
    const { r, motor } = await this.para(objetivo);
    const m = motorSql(motor, 'Leer el esquema');
    const ruta = path.resolve(archivo);
    if (m !== 'postgresql') return (await readFile(ruta)).toString('utf8');
    const { exe } = await r.herramienta('postgresql', 'restaurar');
    const sql = await this.d.exec(exe, ['--no-owner', '--no-privileges', '-f', '-', ruta], {
      timeoutMs: 2 * 60 * 1000,
    });
    if (sql.codigo !== 0) {
      throw new ErrorWolf('bd.esquema_fallo', 'No se pudo leer el esquema del respaldo.');
    }
    return quitarRestrict(sql.stdout);
  }

  /**
   * Restaura un esquema (solo estructura) con los privilegios mínimos, todo o nada:
   * - se revisa TODO el SQL contra una lista de sentencias permitidas antes de tocar nada;
   * - se ejecuta como un usuario (MySQL, MariaDB) o rol (PostgreSQL) temporal que solo puede
   *   trabajar en `base` (nunca FILE, SUPER ni CREATE USER) y que se borra al terminar;
   * - PostgreSQL: `pg_restore --exit-on-error --single-transaction`, sin las entradas EXTENSION
   *   (las crea antes el administrador desde `EXTENSIONES_PERMITIDAS`);
   * - MySQL y MariaDB: sin DEFINER, una sentencia a la vez y, ante el primer error, la base queda
   *   vacía como estaba.
   * La base debe existir y no tener tablas.
   */
  async restaurarEsquema(
    objetivo: ObjetivoBd,
    archivo: string,
    base: string,
    opts: OpcionesRestaurarEsquema = {},
  ): Promise<ResultadoRestaurar> {
    const { r, motor } = await this.para(objetivo);
    const m = motorSql(motor, 'Restaurar');
    validarBase(m, base);
    const bd = r.d.bd;
    if (!bd.usuarioTemporal) throw new Error('Esta restauración no está disponible aquí.');
    const ruta = path.resolve(archivo);
    let info;
    try {
      info = await stat(ruta);
    } catch {
      throw new Error(`No se encontró el archivo ${ruta}.`);
    }
    if (!info.isFile()) throw new Error('Elija un archivo de respaldo, no una carpeta.');
    if (info.size > MAX_BYTES_ESQUEMA) {
      throw new ErrorWolf('bd.esquema_fallo', 'El esquema es demasiado grande para restaurarlo.');
    }
    if (await bd.tieneTablas(m, base)) throw errorConTablas(base);
    await mkdir(this.d.rutas.tmp(), { recursive: true });
    const tmp = path.join(this.d.rutas.tmp(), `esquema-${randomUUID()}`);
    await mkdir(tmp, { recursive: true });
    try {
      const fuente = await r.preparar(ruta, tmp, 0);
      r.revisarFamilia(m, fuente);
      return m === 'postgresql'
        ? await r.esquemaPostgres(fuente, base, tmp, opts)
        : await r.esquemaMysql(m, fuente, base, opts);
    } finally {
      await rm(tmp, OPCIONES_BORRADO).catch(() => undefined);
    }
  }

  private async esquemaMysql(
    motor: MotorSql,
    fuente: Fuente,
    base: string,
    opts: OpcionesRestaurarEsquema,
  ): Promise<ResultadoRestaurar> {
    if (fuente.tipo !== 'sql' || fuente.gz) throw new Error(NO_RECONOCIDO);
    const bruto = await readFile(fuente.ruta);
    const texto = fuente.utf16
      ? new TextDecoder(fuente.utf16 === 'le' ? 'utf-16le' : 'utf-16be').decode(bruto)
      : bruto.toString('utf8').replace(/^\uFEFF/, '');
    // Antes de tocar nada: todo el SQL contra la lista de sentencias permitidas.
    // Vistas, rutinas y disparadores llevan como DEFINER una cuenta bloqueada con permisos solo
    // sobre esta base (nunca el administrador): así nada de lo que traiga puede salirse de ella.
    const definer = definerMysql(nombreDuenoMysql(base));
    const sentencias = revisarSql(texto, 'mysql', { origen: opts.origen ?? 'propia', definer });
    // Con el binlog activo, MySQL 8 no deja a un usuario sin SUPER crear disparadores, rutinas ni
    // vistas con otro definer: el usuario limitado solo crea tablas, índices y ALTER; lo demás lo
    // crea el administrador después, con el DEFINER de arriba (ya reescrito en la cabecera).
    const conDefiner = new Set(['vista', 'disparador', 'funcion', 'procedimiento']);
    const fase1 = sentencias.filter((x) => !conDefiner.has(x.clase)).map((x) => x.texto);
    const fase2 = sentencias.filter((x) => conDefiner.has(x.clase)).map((x) => x.texto);
    const bd = this.d.bd;
    const con = await bd.conexion(motor);
    const claves = [con.clave ?? ''];
    const advertencias: string[] = [];
    const usuario = await bd.usuarioTemporal!(motor, base);
    claves.push(usuario.clave);
    const conectar = async (cliente: ClienteMysql, u: string, k: string): Promise<void> =>
      cliente.conectar({ host: con.host, puerto: con.puerto, usuario: u, clave: k });
    let fallo: unknown = null;
    const limitado = new ClienteMysql(this.d.fabricas?.mysql);
    try {
      await conectar(limitado, usuario.usuario, usuario.clave);
      await limitado.ejecutarSentencias(base, fase1);
    } catch (e) {
      fallo = e;
    } finally {
      await limitado.cerrar();
    }
    if (!fallo && fase2.length > 0) {
      const admin = new ClienteMysql(this.d.fabricas?.mysql);
      try {
        await conectar(admin, con.usuario, con.clave ?? '');
        await admin.crearDuenoObjetos(base);
        await admin.ejecutarSentencias(base, fase2);
      } catch (e) {
        fallo = e;
      } finally {
        await admin.cerrar();
      }
    }
    if (fallo) {
      // Todo o nada: la base vuelve a quedar vacía.
      await bd.reiniciarBase?.(motor, base).catch(() => undefined);
      await usuario.retirar().catch(() => undefined);
      const detalle = enmascarar(fallo instanceof Error ? fallo.message : String(fallo), claves);
      throw new ErrorWolf(
        'bd.esquema_fallo',
        `No se pudo restaurar el esquema completo: ${detalle}`.slice(0, 400),
      );
    }
    try {
      await usuario.retirar();
    } catch {
      advertencias.push('No se pudo borrar el usuario temporal de la restauración.');
    }
    return { advertencias };
  }

  private async esquemaPostgres(
    fuente: Fuente,
    base: string,
    tmp: string,
    opts: OpcionesRestaurarEsquema,
  ): Promise<ResultadoRestaurar> {
    if (fuente.tipo !== 'pgdump') {
      throw new ErrorWolf(
        'bd.esquema_fallo',
        'El esquema de PostgreSQL debe ser un respaldo de pg_dump (.dump).',
      );
    }
    const bd = this.d.bd;
    const con = await bd.conexion('postgresql');
    const { exe } = await this.herramienta('postgresql', 'restaurar');
    const falla = (detalle: string): ErrorWolf =>
      new ErrorWolf(
        'bd.esquema_fallo',
        `No se pudo restaurar el esquema completo: ${detalle}`.slice(0, 400),
      );
    // Lista del contenido sin las entradas EXTENSION (las crea antes el administrador).
    const lista = await this.d.exec(exe, ['-l', fuente.ruta], { timeoutMs: 2 * 60 * 1000 });
    if (lista.codigo !== 0) throw falla('el respaldo no se puede leer');
    const extensiones: string[] = [];
    const filtradas = lista.stdout.split(/\r?\n/).filter((l) => {
      const e = /^\d+; \d+ \d+ EXTENSION - (\S+)/.exec(l);
      if (e) {
        extensiones.push(e[1]!);
        return false;
      }
      return !/^\d+; \d+ \d+ COMMENT - EXTENSION /.test(l);
    });
    for (const nombre of extensiones) {
      if (!EXTENSIONES_PERMITIDAS.includes(nombre)) {
        throw new ErrorWolf(
          'bd.extension_no_permitida',
          `El esquema pide la extensión ${nombre}, que no está permitida.`,
          { nombre },
        );
      }
    }
    const archivoLista = path.join(tmp, 'lista.txt');
    await writeFile(archivoLista, `${filtradas.join('\n')}\n`, 'utf8');
    // Segunda capa: el SQL que produciría, contra la lista de sentencias permitidas.
    const sql = await this.d.exec(
      exe,
      ['-L', archivoLista, '--no-owner', '--no-privileges', '-f', '-', fuente.ruta],
      { timeoutMs: 2 * 60 * 1000 },
    );
    if (sql.codigo !== 0) throw falla('el respaldo no se puede leer');
    revisarSql(quitarRestrict(sql.stdout), 'postgresql', { origen: opts.origen ?? 'propia' });
    for (const nombre of extensiones) {
      if (nombre !== 'plpgsql') await bd.crearExtension?.(base, nombre);
    }
    const usuario = await bd.usuarioTemporal!('postgresql', base);
    const claves = [con.clave ?? '', usuario.clave];
    let resultado: ResultadoRestaurar | null = null;
    let fallo: Error | null = null;
    try {
      const s = this.salida('restaurar', 'postgresql', base, claves, (l) =>
        /^pg_restore: (error|warning)/i.test(l),
      );
      let codigo: number;
      try {
        // Sin --role (el respaldo podría hacer RESET ROLE): se conecta ya como el rol limitado.
        ({ codigo } = await this.lanzar(
          exe,
          [
            '--exit-on-error',
            '--single-transaction',
            '--no-owner',
            '--no-privileges',
            '--no-password',
            '--verbose',
            '-L',
            archivoLista,
            '-h',
            con.host,
            '-p',
            String(con.puerto),
            '-U',
            usuario.usuario,
            '-d',
            base,
            fuente.ruta,
          ],
          { env: { ...ENV_PG, PGPASSWORD: usuario.clave }, alLinea: (l) => s.linea(l) },
        ));
      } catch (e) {
        s.fin();
        throw e;
      }
      s.fin();
      if (codigo !== 0) throw falla(s.detalle() || `código ${codigo}`);
      resultado = { advertencias: s.lista() };
      // Después de restaurar se revisa el catálogo: si aparece algo que la lista de sentencias no
      // debía dejar pasar, se revierte (la base vuelve a quedar vacía).
      const problemas =
        (await bd.auditarEsquema?.('postgresql', base, {
          permitidas: EXTENSIONES_PERMITIDAS,
          importada: opts.origen === 'importada',
        })) ?? [];
      if (problemas.length > 0) {
        await bd.reiniciarBase?.('postgresql', base).catch(() => undefined);
        throw falla(`el catálogo trae ${problemas.join(', ')}`);
      }
    } catch (e) {
      fallo =
        e instanceof ErrorWolf
          ? e
          : falla(enmascarar(e instanceof Error ? e.message : String(e), claves));
    }
    try {
      await usuario.retirar();
    } catch {
      if (!fallo)
        resultado!.advertencias.push('No se pudo borrar el rol temporal de la restauración.');
    }
    if (fallo) throw fallo;
    return resultado!;
  }

  async respaldar(
    objetivo: ObjetivoBd,
    base: string,
    carpetaDestino?: string,
    opciones: OpcionesRespaldar = {},
  ): Promise<{ archivo: string }> {
    const { r, motor } = await this.para(objetivo);
    const m = motorSql(motor, 'Respaldar');
    if (m === 'postgresql') validarNombrePg(base);
    else validarNombreBd(base);
    return r.respaldarComo(m, base, carpetaDestino, base, opciones.soloEsquema === true);
  }

  /** Respalda `base` en `<carpeta>\<prefijo>-<AAAAMMDD-HHmm>.dump|.sql`. */
  private async respaldarComo(
    m: MotorSql,
    base: string,
    carpetaDestino: string | undefined,
    prefijo: string,
    soloEsquema = false,
  ): Promise<{ archivo: string }> {
    const con = await this.d.bd.conexion(m);
    const carpeta = carpetaDestino ? path.resolve(carpetaDestino) : await this.carpetaRespaldos();
    await mkdir(carpeta, { recursive: true });
    const ext = m === 'postgresql' ? '.dump' : '.sql';
    const raiz = path.join(carpeta, `${prefijo}-${sello(this.ahora())}`);
    let final = `${raiz}${ext}`;
    for (let n = 2; existsSync(final) || existsSync(`${final}.parcial`); n++) {
      final = `${raiz}-${n}${ext}`;
    }
    const parcial = `${final}.parcial`;
    const clave = con.clave ?? '';
    try {
      await this.volcar(
        'respaldar',
        m,
        base,
        { host: con.host, puerto: con.puerto, usuario: con.usuario, clave, base },
        parcial,
        [clave],
        soloEsquema,
      );
      await rename(parcial, final);
    } catch (e) {
      await rm(parcial, { force: true }).catch(() => undefined);
      const detalle = e instanceof ErrorVolcado ? e.detalle : e instanceof Error ? e.message : '';
      throw new Error(
        `No se pudo respaldar la base ${base}${detalle ? `: ${enmascarar(detalle, [clave])}` : '.'}`,
      );
    }
    return { archivo: final };
  }

  /** true si el psql local acepta `\restrict` (si no se sabe, false: modo estricto). */
  private async psqlRestringe(exe: string): Promise<boolean> {
    try {
      return psqlConRestrict((await this.d.exec(exe, ['--version'], { timeoutMs: 15_000 })).stdout);
    } catch {
      return false;
    }
  }

  /** Versión del cliente local (`--version`); si no se entiende, la del servidor instalado. */
  private async versionLocal(motor: MotorSql): Promise<Version> {
    const { exe, version } = await this.herramienta(motor, 'volcado');
    let texto = '';
    try {
      texto = (await this.d.exec(exe, ['--version'], { timeoutMs: 15_000 })).stdout;
    } catch {
      // se usa la versión instalada
    }
    const patron =
      motor === 'postgresql'
        ? /\(PostgreSQL\)\s+(\d+)(?:\.(\d+))?/
        : motor === 'mariadb'
          ? /(\d+)\.(\d+)\.\d+-MariaDB/
          : /Ver\s+(\d+)\.(\d+)/;
    return (
      leerVersion(texto, patron) ??
      leerVersion(version, /^(\d+)(?:\.(\d+))?/) ?? { mayor: 0, menor: 0 }
    );
  }

  /** `SELECT version()` en el origen (solo lectura) contra el cliente local. */
  private async comprobarVersionOrigen(motor: MotorSql, o: OrigenImportar): Promise<string[]> {
    let texto: string;
    try {
      if (motor === 'postgresql') {
        const c = new ClientePostgres(this.d.fabricas?.postgres);
        await c.conectar({
          host: o.host,
          puerto: o.puerto,
          usuario: o.usuario,
          clave: o.clave,
          base: o.base,
        });
        try {
          texto = await c.version();
        } finally {
          await c.cerrar();
        }
      } else {
        const c = new ClienteMysql(this.d.fabricas?.mysql);
        await c.conectar({ host: o.host, puerto: o.puerto, usuario: o.usuario, clave: o.clave });
        try {
          texto = await c.version();
        } finally {
          await c.cerrar();
        }
      }
    } catch (e) {
      const m = enmascarar(e instanceof Error ? e.message : String(e), [o.clave]);
      throw new Error(`No se pudo consultar el servidor de origen ${o.host}:${o.puerto}. ${m}`);
    }
    const local = await this.versionLocal(motor);
    const nombre = NOMBRE_SERVICIO[motor];
    if (motor === 'postgresql') {
      const v = leerVersion(texto, /PostgreSQL\s+(\d+)(?:\.(\d+))?/);
      if (!v) return ['No se pudo leer la versión del servidor de origen.'];
      if (v.mayor > local.mayor) {
        throw new Error(
          `El servidor de origen es PostgreSQL ${v.mayor}; instale PostgreSQL ${v.mayor} en WolfCore Dev para importarlo (la versión local es ${local.mayor}).`,
        );
      }
      return [];
    }
    const limpio = texto.replace(/^5\.5\.5-/, '');
    const v = leerVersion(limpio, /^(\d+)\.(\d+)/);
    const esMaria = /mariadb/i.test(limpio);
    if (!v) return ['No se pudo leer la versión del servidor de origen.'];
    const vt = `${v.mayor}.${v.menor}`;
    if (motor === 'mysql' && esMaria) {
      throw new Error(`El servidor de origen es MariaDB ${vt}: impórtelo en MariaDB.`);
    }
    if (motor === 'mariadb' && !esMaria) {
      return [`El origen es MySQL ${vt} y el destino MariaDB: revise las advertencias.`];
    }
    if (v.mayor > local.mayor || (v.mayor === local.mayor && v.menor > local.menor)) {
      throw new Error(
        `El servidor de origen es ${nombre} ${vt}; instale ${nombre} ${vt} o más reciente para importarlo (la versión local es ${local.mayor}.${local.menor}).`,
      );
    }
    return [];
  }

  /**
   * Copia una base de otro servidor (p. ej. el de FlyEnv) a una base local nueva o vacía.
   * En el origen solo se consulta la versión y se vuelca (pg_dump / mysqldump
   * --single-transaction): nunca se escribe en él.
   */
  async importar(
    objetivo: ObjetivoBd,
    origen: OrigenImportar,
    destinoBase: string,
    opts: OpcionesRestaurar = {},
  ): Promise<ResultadoRestaurar> {
    const { r, motor } = await this.para(objetivo);
    if (r !== this) return r.importar(motor, origen, destinoBase, opts);
    const m = motorSql(motor, 'Importar');
    validarBase(m, destinoBase);
    validarOrigen(origen);
    const local = await this.d.bd.conexion(m);
    const misma =
      m === 'postgresql'
        ? origen.base === destinoBase
        : origen.base.toLowerCase() === destinoBase.toLowerCase();
    if (esLocal(origen.host) && origen.puerto === local.puerto && misma) {
      throw new Error('El origen y el destino son la misma base.');
    }
    await this.comprobarDestino(m, destinoBase, opts.confirmarSobrescribir);
    const avisos = await this.comprobarVersionOrigen(m, origen);

    await mkdir(this.d.rutas.tmp(), { recursive: true });
    const tmp = path.join(this.d.rutas.tmp(), `importar-${randomUUID()}`);
    await mkdir(tmp, { recursive: true });
    const claves = [origen.clave, local.clave ?? ''];
    try {
      const archivo = path.join(tmp, m === 'postgresql' ? 'origen.dump' : 'origen.sql');
      try {
        await this.volcar('importar', m, destinoBase, origen, archivo, claves);
      } catch (e) {
        throw errorOrigen(e, origen, claves);
      }
      const r = await this.restaurarInterno('importar', m, archivo, destinoBase, opts, [
        origen.clave,
      ]);
      return { ...r, advertencias: [...avisos, ...r.advertencias] };
    } finally {
      await rm(tmp, OPCIONES_BORRADO).catch(() => undefined);
    }
  }

  /** Versión del servidor de origen; sus fallos llevan código (apagado, rechazado, más nuevo). */
  private async versionOrigenAjeno(motor: MotorSql, o: OrigenImportar): Promise<string[]> {
    try {
      return await this.comprobarVersionOrigen(motor, o);
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : String(e);
      if (!mensaje.startsWith('No se pudo consultar el servidor de origen')) {
        throw new ErrorWolf('importar.origen_version', mensaje.slice(0, 300));
      }
      const rechazado = /access denied|1045|authentication|autentificaci/i.test(mensaje);
      throw new ErrorWolf(
        rechazado ? 'importar.origen_rechazado' : 'importar.origen_apagado',
        rechazado
          ? 'El servidor de origen rechazó el usuario o la clave.'
          : `No se pudo conectar al servidor de origen ${o.host}:${o.puerto}: enciéndalo desde su programa e inténtelo de nuevo.`,
      );
    }
  }

  /** Tamaño aproximado de la base en el origen (datos más índices); 0 si no se pudo saber. */
  private async tamanoOrigen(o: OrigenImportar): Promise<number> {
    const c = new ClienteMysql(this.d.fabricas?.mysql);
    try {
      await c.conectar({ host: o.host, puerto: o.puerto, usuario: o.usuario, clave: o.clave });
      return await c.tamanoBase(o.base);
    } catch {
      return 0;
    } finally {
      await c.cerrar();
    }
  }

  private async espacioLibre(ruta: string): Promise<number | null> {
    try {
      if (this.d.espacioLibre) return await this.d.espacioLibre(ruta);
      const s = await statfs(ruta);
      return Number(s.bavail) * Number(s.bsize);
    } catch {
      return null;
    }
  }

  /**
   * Un volcado del origen con vigilancia: se corta si el archivo pasa de `tope` bytes, si deja de
   * crecer durante `estancamientoMs` (el servidor no responde) o si el usuario cancela. El proceso
   * que se mata es solo el que lanzó esta importación (por su PID, con su árbol).
   */
  private async volcarVigilado(
    motor: MotorSql,
    origen: OrigenImportar,
    destino: string,
    claves: string[],
    o: { esquema: boolean; datos: boolean; tope: number; senal?: AbortSignal },
  ): Promise<void> {
    const ac = new AbortController();
    const alCancelar = (): void => ac.abort(razonDe(o.senal));
    if (o.senal?.aborted) alCancelar();
    else o.senal?.addEventListener('abort', alCancelar, { once: true });
    const v = this.d.vigilancia ?? { intervaloMs: 2_000, estancamientoMs: 120_000 };
    let ultimo = -1;
    let desde = Date.now();
    const reloj = setInterval(() => {
      void (async () => {
        try {
          const tam = (await stat(destino)).size;
          if (tam > o.tope) {
            ac.abort(
              new ErrorWolf(
                'importar.volcado_enorme',
                `La base ${origen.base} pesa más de lo que se importa de una vez.`,
                { maximo: Math.floor(o.tope / (1024 * 1024)) },
              ),
            );
          }
          if (tam !== ultimo) {
            ultimo = tam;
            desde = Date.now();
          }
        } catch {
          // el archivo aún no existe
        }
        if (Date.now() - desde > v.estancamientoMs) {
          ac.abort(
            new ErrorWolf(
              'importar.origen_estancado',
              `El servidor de origen ${origen.host}:${origen.puerto} dejó de responder durante el volcado.`,
            ),
          );
        }
      })();
    }, v.intervaloMs);
    try {
      await this.volcar(
        'importar',
        motor,
        origen.base,
        origen,
        destino,
        claves,
        o.esquema,
        o.datos,
        ac.signal,
      );
    } finally {
      clearInterval(reloj);
      o.senal?.removeEventListener('abort', alCancelar);
    }
  }

  /**
   * Recorre los datos (ya con el filtro de texto) sentencia por sentencia: cada una se valida y, si
   * hay `ejecutar`, se manda sola al servidor. Cualquier problema corta con su código.
   */
  private async recorrerDatos(
    fuente: Extract<Fuente, { tipo: 'sql' }>,
    claves: string[],
    senal: AbortSignal | undefined,
    ejecutar?: (sentencia: string) => Promise<void>,
  ): Promise<string[]> {
    const s = this.salida('importar', 'mysql', '', claves, () => false);
    const total = (await stat(fuente.ruta)).size;
    const divisor = new DivisorSentencias();
    const entrada = this.flujoSql(fuente, 'mysql', s, total, { soloDatos: true });
    pipeline(entrada, divisor).catch(() => undefined);
    try {
      for await (const sentencia of divisor as AsyncIterable<string>) {
        if (senal?.aborted) throw razonDe(senal);
        validarSentenciaDatos(sentencia);
        if (ejecutar) await ejecutar(sentencia);
      }
    } catch (e) {
      divisor.destroy();
      if (e instanceof ErrorWolf) throw e;
      const texto = e instanceof Error ? e.message : String(e);
      if (texto.startsWith(MENSAJE_DATOS_NO_PERMITIDOS)) throw rechazoDatos('no son datos');
      throw new ErrorWolf(
        'bd.datos_fallo',
        `No se pudieron importar los datos: ${enmascarar(texto, claves)}`.slice(0, 400),
      );
    } finally {
      s.fin();
    }
    return s.lista();
  }

  /**
   * Copia a una base local la base de un programa ajeno (Laragon, XAMPP, Herd), cuyo servidor
   * enciende el usuario. Solo MySQL y MariaDB. El contenido del origen es de un tercero, así que
   * cada parte entra por su propia puerta, con los privilegios mínimos y todo o nada:
   *
   * - **Estructura** (volcado `--no-data`): se revisa entera contra la lista de sentencias
   *   permitidas de las plantillas (origen `importada`: sin disparadores, vistas y rutinas con
   *   `SQL SECURITY INVOKER` y DEFINER una cuenta bloqueada de la base) ANTES de crear o reemplazar
   *   nada, y se restaura con `restaurarEsquema`.
   * - **Datos** (volcado `--no-create-info --skip-triggers --skip-add-locks --skip-disable-keys`):
   *   una base real no cabe en la lista de estructura (tope de 64 MiB y 20 000 sentencias). El
   *   volcado se pide solo de filas; un filtro de texto neutraliza los cambios de base; después se
   *   parte en sentencias y CADA UNA se valida contra una lista cerrada (INSERT y un SET de la lista
   *   de `mysqldump`) y se manda sola, con el driver (sin varias sentencias por consulta), con un
   *   usuario temporal que solo puede INSERT en la base, utf8mb4 y un `sql_mode` fijo. Así, si la
   *   lectura del texto se equivocara, el servidor daría un error y no ejecutaría otra sentencia.
   *   Todo el archivo se valida ANTES de respaldar o borrar nada.
   * - Si la base existe (con o sin tablas) se respalda antes de reemplazarla; si algo falla después,
   *   se restaura ese respaldo solo (`ErrorTrasReemplazo.restaurada`).
   * - Vigilancia: tope de tamaño durante el volcado y espacio libre antes, corte si el origen deja
   *   de responder y cancelación (`senal`), que mata solo el proceso lanzado por esta importación.
   * - La clave del origen solo vive en memoria y se enmascara en todo mensaje.
   */
  async importarAjeno(
    objetivo: ObjetivoBd,
    origen: OrigenImportar,
    destinoBase: string,
    opts: OpcionesImportarAjeno = {},
  ): Promise<ResultadoRestaurar> {
    const { r, motor } = await this.para(objetivo);
    if (r !== this) return r.importarAjeno(motor, origen, destinoBase, opts);
    const m = motorSql(motor, 'Importar');
    if (m === 'postgresql') {
      throw new ErrorWolf(
        'importar.motor_no_soportado',
        'Solo se importan bases de MySQL y MariaDB desde otros programas.',
      );
    }
    validarBase(m, destinoBase);
    validarOrigen(origen);
    if (!esLocal(origen.host)) {
      throw new ErrorWolf(
        'importar.origen_no_local',
        'El servidor de origen debe estar en este equipo (127.0.0.1).',
      );
    }
    const local = await this.d.bd.conexion(m);
    if (
      esLocal(origen.host) &&
      origen.puerto === local.puerto &&
      origen.base.toLowerCase() === destinoBase.toLowerCase()
    ) {
      throw new Error('El origen y el destino son la misma base.');
    }
    const bd = this.d.bd;
    if (!bd.usuarioTemporal) throw new Error('Esta importación no está disponible aquí.');
    const { tablas } = await this.comprobarDestino(m, destinoBase, opts.confirmarSobrescribir);
    if (opts.baseExistente && opts.confirmarSobrescribir !== true)
      throw errorConTablas(destinoBase);
    const reemplaza = tablas || opts.baseExistente === true;
    const avisos = await this.versionOrigenAjeno(m, origen);
    const tope = this.d.maxBytesDatosAjenos ?? MAX_BYTES_DATOS_AJENOS;
    const estimado = await this.tamanoOrigen(origen);
    if (estimado > tope) {
      throw new ErrorWolf(
        'importar.volcado_enorme',
        `La base ${origen.base} pesa más de lo que se importa de una vez.`,
        { maximo: Math.floor(tope / (1024 * 1024)) },
      );
    }

    await mkdir(this.d.rutas.tmp(), { recursive: true });
    // Un volcado ocupa lo de la base y, con el respaldo previo, otro tanto: se comprueba antes.
    const libre = await this.espacioLibre(this.d.rutas.tmp());
    const necesario = Math.ceil(estimado * (reemplaza ? 2.4 : 1.2)) + 64 * 1024 * 1024;
    if (libre !== null && estimado > 0 && libre < necesario) {
      throw new ErrorWolf(
        'importar.sin_espacio',
        'No hay espacio libre suficiente para el volcado de la base.',
        {
          necesarios: Math.ceil(necesario / (1024 * 1024)),
          libres: Math.floor(libre / (1024 * 1024)),
        },
      );
    }
    const tmp = path.join(this.d.rutas.tmp(), `importar-ajeno-${randomUUID()}`);
    await mkdir(tmp, { recursive: true });
    const claves = [origen.clave, local.clave ?? ''];
    try {
      const archivoEsquema = path.join(tmp, 'esquema.sql');
      const archivoDatos = path.join(tmp, 'datos.sql');
      try {
        await this.volcarVigilado(m, origen, archivoEsquema, claves, {
          esquema: true,
          datos: false,
          tope: MAX_BYTES_ESQUEMA,
          ...(opts.senal ? { senal: opts.senal } : {}),
        });
        await this.volcarVigilado(m, origen, archivoDatos, claves, {
          esquema: false,
          datos: true,
          tope,
          ...(opts.senal ? { senal: opts.senal } : {}),
        });
      } catch (e) {
        throw e instanceof ErrorWolf ? e : errorOrigen(e, origen, claves);
      }
      if ((await stat(archivoDatos)).size > tope) {
        throw new ErrorWolf(
          'importar.volcado_enorme',
          `Los datos de la base ${origen.base} pesan más de lo que se importa de una vez.`,
          { maximo: Math.floor(tope / (1024 * 1024)) },
        );
      }
      // Todo se revisa antes de tocar nada (ni respaldo, ni borrado, ni base nueva).
      if ((await stat(archivoEsquema)).size > MAX_BYTES_ESQUEMA) {
        throw new ErrorWolf('bd.esquema_fallo', 'La estructura de la base es demasiado grande.');
      }
      revisarSql(
        (await readFile(archivoEsquema)).toString('utf8').replace(/^\uFEFF/, ''),
        'mysql',
        {
          origen: 'importada',
        },
      );
      const fuente = await this.preparar(archivoDatos, tmp, 0);
      if (fuente.tipo !== 'sql' || fuente.gz) throw new Error(NO_RECONOCIDO);
      await this.recorrerDatos(fuente, claves, opts.senal);

      let respaldoPrevio: string | undefined;
      if (reemplaza) {
        respaldoPrevio = await this.respaldoDeSeguridad(m, destinoBase, !tablas);
        await this.borrarParaReemplazar(m, destinoBase);
      }
      await bd.crear(m, destinoBase);
      try {
        await this.restaurarEsquema(m, archivoEsquema, destinoBase, { origen: 'importada' });
        const adv = await this.cargarDatos(m, fuente, destinoBase, claves, opts.senal);
        return {
          advertencias: [...avisos, ...adv],
          ...(respaldoPrevio ? { respaldoPrevio } : {}),
        };
      } catch (e) {
        // Todo o nada: ni estructura a medias ni datos a medias.
        if (opts.baseNueva) await this.borrarParaReemplazar(m, destinoBase).catch(() => undefined);
        else await bd.reiniciarBase?.(m, destinoBase).catch(() => undefined);
        if (!respaldoPrevio) throw e;
        // La base original ya no está: se vuelve a poner desde su respaldo.
        let restaurada = false;
        try {
          await this.restaurarInterno(
            'importar',
            m,
            respaldoPrevio,
            destinoBase,
            { confirmarSobrescribir: true },
            [],
          );
          restaurada = true;
        } catch {
          // el error nombra el respaldo para restaurarlo a mano
        }
        throw new ErrorTrasReemplazo(destinoBase, respaldoPrevio, e, restaurada);
      }
    } finally {
      await rm(tmp, OPCIONES_BORRADO).catch(() => undefined);
    }
  }

  /** Datos de un tercero con un usuario que solo puede INSERT, sentencia por sentencia. */
  private async cargarDatos(
    motor: MotorSql,
    fuente: Extract<Fuente, { tipo: 'sql' }>,
    base: string,
    clavesBase: string[],
    senal: AbortSignal | undefined,
  ): Promise<string[]> {
    const bd = this.d.bd;
    const con = await bd.conexion(motor);
    const usuario = await bd.usuarioTemporal!(motor, base, 'datos');
    const claves = [...clavesBase, usuario.clave];
    const cliente = new ClienteMysql(this.d.fabricas?.mysql);
    try {
      await cliente.conectar({
        host: con.host,
        puerto: con.puerto,
        usuario: usuario.usuario,
        clave: usuario.clave,
        charset: 'utf8mb4',
      });
      await cliente.prepararDatos(base);
      return await this.recorrerDatos(fuente, claves, senal, (sentencia) =>
        cliente.ejecutarUna(sentencia),
      );
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      throw new ErrorWolf(
        'bd.datos_fallo',
        `No se pudieron importar los datos: ${enmascarar(e instanceof Error ? e.message : String(e), claves)}`.slice(
          0,
          400,
        ),
      );
    } finally {
      await cliente.cerrar();
      await usuario.retirar().catch(() => undefined);
    }
  }
}

/** psql con \restrict (CVE-2025-8714): 13.22, 14.19, 15.14, 16.10, 17.6 o posterior. */
export function psqlConRestrict(texto: string): boolean {
  const v = leerVersion(texto, /\(PostgreSQL\)\s+(\d+)(?:\.(\d+))?/);
  if (!v) return false;
  if (v.mayor >= 18) return true;
  const minimo: Record<number, number> = { 13: 22, 14: 19, 15: 14, 16: 10, 17: 6 };
  const m = minimo[v.mayor];
  return m !== undefined && v.menor >= m;
}

/** mariadb --sandbox: 10.5.25, 10.6.18, 10.11.8, 11.0.6, 11.1.5, 11.2.4, 11.4.2 o posterior (11.3 no consta). */
export function mariadbConSandbox(version: string): boolean {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!m) return false;
  const [mayor, menor, parche] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mayor > 11 || (mayor === 11 && menor > 4)) return true;
  const minimo: Record<string, number> = {
    '10.5': 25,
    '10.6': 18,
    '10.11': 8,
    '11.0': 6,
    '11.1': 5,
    '11.2': 4,
    '11.4': 2,
  };
  const p = minimo[`${mayor}.${menor}`];
  return p !== undefined && parche >= p;
}

/** Falló la restauración después de borrar la base original (queda su respaldo previo). */
export class ErrorTrasReemplazo extends Error {
  /** El IPC lo reenvía: la interfaz lo muestra destacado (el mensaje nombra el respaldo previo). */
  readonly codigo = 'tras-reemplazo';

  constructor(
    base: string,
    readonly respaldoPrevio: string,
    causa: unknown,
    /** La base original ya se volvió a poner desde su respaldo. */
    readonly restaurada = false,
  ) {
    super(
      restaurada
        ? `No se pudo importar ${base}; la base original se restauró desde su copia de seguridad (${respaldoPrevio}).`
        : `No se pudo completar la restauración de ${base}. La base original se reemplazó; su copia de seguridad está en ${respaldoPrevio}. Puede restaurarla desde Bases de datos.`,
      { cause: causa },
    );
  }
}

/**
 * El respaldo previo sirve: existe, no está vacío y, si es de PostgreSQL, empieza por PGDMP;
 * si es SQL, trae al menos un CREATE, INSERT o COPY.
 */
async function respaldoValido(ruta: string, motor: MotorSql): Promise<boolean> {
  let tam: number;
  try {
    tam = (await stat(ruta)).size;
  } catch {
    return false;
  }
  if (tam === 0) return false;
  if (motor === 'postgresql') {
    return (await leerCabeza(ruta, 5)).toString('latin1') === 'PGDMP';
  }
  const patron = /\b(CREATE|INSERT|COPY)\s/i;
  let cola = '';
  for await (const trozo of createReadStream(ruta)) {
    const t = cola + (trozo as Buffer).toString('latin1');
    if (patron.test(t)) return true;
    cola = t.slice(-16);
  }
  return false;
}

/** El error de una señal abortada: el que se pasó a `abort(…)` si es de WolfCore, si no "cancelado". */
function razonDe(senal: AbortSignal | undefined): ErrorWolf {
  return senal?.reason instanceof ErrorWolf
    ? senal.reason
    : new ErrorWolf('importar.cancelado', 'Importación cancelada.');
}

class ErrorVolcado extends Error {
  constructor(readonly detalle: string) {
    super(detalle || 'El volcado falló.');
  }
}

function errorOrigen(e: unknown, o: OrigenImportar, claves: string[]): ErrorWolf {
  const detalle = enmascarar(e instanceof ErrorVolcado ? e.detalle : String(e), claves);
  if (/access denied|password authentication failed|autentificaci[oó]n/i.test(detalle)) {
    return new ErrorWolf(
      'importar.origen_rechazado',
      'El servidor de origen rechazó el usuario o la clave.',
    );
  }
  if (
    /can't connect|could not connect|connection refused|unknown (mysql )?server host|could not translate host/i.test(
      detalle,
    )
  ) {
    return new ErrorWolf(
      'importar.origen_apagado',
      `No se pudo conectar al servidor de origen ${o.host}:${o.puerto}.`,
    );
  }
  return new ErrorWolf(
    'importar.origen_fallo',
    `No se pudo volcar la base ${o.base} del origen${detalle ? `: ${detalle}` : '.'}`.slice(0, 400),
  );
}

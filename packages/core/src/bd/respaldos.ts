import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { lstat, mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Transform, type Readable, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import type { Eventos, EventosNucleo, ProgresoBd } from '../eventos';
import { lanzadorPorDefecto } from '../plataforma/lanzar';
import type { Ejecutor, Lanzador, Plataforma } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { NOMBRE_SERVICIO } from '../servicios/definicion';
import type { EstadoServicio } from '../tipos';
import type { BasesDeDatos } from './basesDeDatos';
import { ClienteMysql, validarNombreBd, type FabricaConexion } from './clienteMysql';
import { ClientePostgres, validarNombrePg, type FabricaConexionPg } from './clientePostgres';
import type { DatosConexion, MotorBd } from './env';
import { esTar, esUtf16le, formatoDeCabeza, LARGO_CABEZA, leerCabeza } from './formato';

type MotorSql = Exclude<MotorBd, 'mongodb'>;
type Operacion = ProgresoBd['operacion'];

export interface OpcionesRestaurar {
  /** Obligatorio si la base destino ya tiene tablas. */
  confirmarSobrescribir?: boolean;
}

export interface ResultadoRestaurar {
  advertencias: string[];
}

export interface OrigenImportar {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  base: string;
}

export interface DepsRespaldos {
  bd: Pick<BasesDeDatos, 'conexion' | 'crear' | 'tieneTablas'>;
  servicios: { estados(): Promise<EstadoServicio[]> };
  rutas: Rutas;
  exec: Ejecutor;
  /** Procesos largos en streaming (por defecto `spawn`). */
  lanzar?: Lanzador;
  eventos?: Eventos<EventosNucleo>;
  plataforma: Pick<Plataforma, 'carpetaDocumentos'>;
  /** Conexiones al servidor de origen de `importar` (para pruebas). */
  fabricas?: { mysql?: FabricaConexion; postgres?: FabricaConexionPg };
  reloj?: () => Date;
  /** Por defecto %SystemRoot%\System32\tar.exe (bsdtar de Windows, no el de Git). */
  rutaTar?: string;
}

export const MENSAJE_DESCOMPRIMA = 'Descomprima el archivo y elija el .sql o .dump que contiene';
export const MENSAJE_VARIOS = 'Hay varios respaldos dentro; descomprima y elija uno';

const SISTEMA: Record<MotorSql, string[]> = {
  mysql: ['mysql', 'information_schema', 'performance_schema', 'sys'],
  mariadb: ['mysql', 'information_schema', 'performance_schema', 'sys'],
  postgresql: ['postgres', 'template0', 'template1'],
};
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
  if (!/^[^\s=-][^=]{0,63}$/.test(o.base) || tieneControl(o.base)) {
    throw new Error(`El nombre de la base de origen "${o.base}" no es válido.`);
  }
}

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

/** Patrones de líneas que cambiarían de base (o la crearían o borrarían) durante un restore. */
const CAMBIO_BASE: Record<'pg' | 'mysql', RegExp> = {
  pg: /^(?:\u00ef\u00bb\u00bf)?\s*(?:\\c(?:onnect)?(?:\s|$)|(?:CREATE|DROP|ALTER)\s+DATABASE\b)/i,
  mysql:
    /^(?:\u00ef\u00bb\u00bf)?\s*(?:\/\*!\d*\s*)?(?:USE[\s`]|\\u\s|CONNECT\s|\\r\s|(?:CREATE|DROP|ALTER)\s+(?:DATABASE|SCHEMA)\b)/i,
};
/** Solo se mira el principio de cada línea (un INSERT puede medir megas). */
const MAX_CABEZA_LINEA = 4096;

/**
 * Comenta (`-- `) las líneas que harían salir de la base destino: `USE otra`, `\connect otra`,
 * `CREATE/DROP DATABASE`. Así nada del respaldo cae en otra base. En PostgreSQL no toca los
 * datos de los bloques `COPY … FROM stdin`.
 */
export class FiltroCambioDeBase extends Transform {
  private cabeza: Buffer[] = [];
  private largo = 0;
  private enCabeza = true;
  private enCopy = false;

  constructor(
    private readonly tipo: 'pg' | 'mysql',
    private readonly alOmitir: (linea: string) => void,
  ) {
    super();
  }

  override _transform(trozo: Buffer, _cod: BufferEncoding, cb: TransformCallback): void {
    let i = 0;
    while (i < trozo.length) {
      const j = trozo.indexOf(0x0a, i);
      if (!this.enCabeza) {
        if (j === -1) {
          this.push(trozo.subarray(i));
          break;
        }
        this.push(trozo.subarray(i, j + 1));
        i = j + 1;
        this.enCabeza = true;
        continue;
      }
      const finLinea = j === -1 ? trozo.length : j + 1;
      const corte = Math.min(finLinea, i + (MAX_CABEZA_LINEA - this.largo));
      this.cabeza.push(trozo.subarray(i, corte));
      this.largo += corte - i;
      const completa = j !== -1 && corte === finLinea;
      i = corte;
      if (completa || this.largo >= MAX_CABEZA_LINEA) {
        this.soltar(completa);
        this.enCabeza = completa;
      }
    }
    cb();
  }

  override _flush(cb: TransformCallback): void {
    if (this.largo > 0) this.soltar(true);
    cb();
  }

  private soltar(completa: boolean): void {
    const b = Buffer.concat(this.cabeza);
    this.cabeza = [];
    this.largo = 0;
    const texto = b.toString('latin1');
    if (this.tipo === 'pg') {
      if (this.enCopy) {
        if (/^\\\.\r?\n?$/.test(texto)) this.enCopy = false;
        this.push(b);
        return;
      }
      if (/^\s*COPY\s/i.test(texto) && (/FROM\s+stdin\s*;/i.test(texto) || !completa)) {
        this.enCopy = true;
        this.push(b);
        return;
      }
    }
    if (CAMBIO_BASE[this.tipo].test(texto)) {
      this.alOmitir(b.toString('utf8').trim().slice(0, 200));
      this.push(Buffer.from('-- '));
    }
    this.push(b);
  }
}

/** UTF-16LE (con BOM) a UTF-8. */
class DeUtf16 extends Transform {
  private readonly dec = new TextDecoder('utf-16le');
  override _transform(trozo: Buffer, _c: BufferEncoding, cb: TransformCallback): void {
    cb(null, Buffer.from(this.dec.decode(trozo, { stream: true }), 'utf8'));
  }
  override _flush(cb: TransformCallback): void {
    cb(null, Buffer.from(this.dec.decode(), 'utf8'));
  }
}

/** Encadena flujos con `pipe` y lleva cualquier error al último (lo recibe el lanzador). */
function encadenar(primero: Readable, ...resto: Transform[]): Readable {
  let actual: Readable = primero;
  const ultimo = resto.at(-1) ?? primero;
  for (const t of resto) {
    actual.on('error', (e) => ultimo.destroy(e));
    actual = actual.pipe(t);
  }
  return actual;
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
  | { tipo: 'sql'; ruta: string; gz: boolean; utf16: boolean; cabeza: Buffer };

const NO_RECONOCIDO =
  'No se reconoce el formato del archivo: use un .sql, un respaldo de pg_dump, .gz, .zip, .rar o .7z.';

/** Respaldar, restaurar e importar bases de MySQL, MariaDB y PostgreSQL. */
export class Respaldos {
  constructor(private readonly d: DepsRespaldos) {}

  private get lanzar(): Lanzador {
    return this.d.lanzar ?? lanzadorPorDefecto;
  }

  private ahora(): Date {
    return this.d.reloj?.() ?? new Date();
  }

  private tar(): string {
    return (
      this.d.rutaTar ??
      path.win32.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe')
    );
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
        cual === 'cliente' ? 'psql.exe' : cual === 'volcado' ? 'pg_dump.exe' : 'pg_restore.exe',
      ];
    } else {
      carpeta = path.join(bin, 'bin');
      const volcado = cual === 'volcado';
      candidatos =
        motor === 'mariadb'
          ? volcado
            ? ['mariadb-dump.exe', 'mysqldump.exe']
            : ['mariadb.exe', 'mysql.exe']
          : [volcado ? 'mysqldump.exe' : 'mysql.exe'];
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
    if (tablas && confirmar !== true) {
      throw new Error(
        `La base ${base} ya tiene tablas: confirme que quiere sobrescribirla o elija una base nueva.`,
      );
    }
    return { con, tablas };
  }

  async restaurar(
    motor: MotorBd,
    archivo: string,
    base: string,
    opts: OpcionesRestaurar = {},
  ): Promise<ResultadoRestaurar> {
    return this.restaurarInterno('restaurar', motor, archivo, base, opts, []);
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
      await this.d.bd.crear(m, base);
      const claves = [con.clave ?? '', ...clavesExtra];
      return await this.ejecutarRestauracion(operacion, m, fuente, base, con, tablas, claves);
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
        return { tipo: 'sql', ruta: archivo, gz: false, utf16: esUtf16le(cabeza), cabeza };
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
          return { tipo: 'sql', ruta: archivo, gz: true, utf16: esUtf16le(dentro), cabeza: dentro };
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
    const texto = fuente.cabeza.toString(fuente.utf16 ? 'utf16le' : 'utf8');
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
    if (fuente.utf16) pasos.push(new DeUtf16());
    pasos.push(
      new FiltroCambioDeBase(tipo, (l) =>
        s.aviso(`Se omitió una línea que cambiaba de base: ${l}`),
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
    tablas: boolean,
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
        // Sobrescribir confirmado: se borran antes los objetos que trae el respaldo.
        const limpiar = tablas ? ['--clean', '--if-exists'] : [];
        args = [
          '--no-owner',
          '--no-privileges',
          ...limpiar,
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
        s = this.salida(operacion, motor, base, claves, (l) =>
          /\b(ERROR|FATAL|WARNING|ADVERTENCIA):/.test(l),
        );
        entrada = this.flujoSql(fuente, 'pg', s, total);
        correcto = (c) => c === 0;
      }
    } else {
      if (fuente.tipo !== 'sql') throw new Error('Este respaldo es de PostgreSQL.');
      exe = (await this.herramienta(motor, 'cliente')).exe;
      env = { MYSQL_PWD: clave };
      args = [
        `--host=${con.host}`,
        `--port=${con.puerto}`,
        `--user=${con.usuario}`,
        '--default-character-set=utf8mb4',
        '--force',
        base,
      ];
      s = this.salida(operacion, motor, base, claves, (l) => /^(ERROR|Warning)\b/i.test(l));
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
  ): Promise<Salida> {
    const { exe } = await this.herramienta(motor, 'volcado');
    let args: string[];
    let env: Record<string, string>;
    if (motor === 'postgresql') {
      env = { ...ENV_PG, PGPASSWORD: origen.clave };
      args = [
        '-Fc',
        '--verbose',
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
        '--routines',
        '--triggers',
        '--no-tablespaces',
        '--default-character-set=utf8mb4',
        ...(motor === 'mysql' ? ['--set-gtid-purged=OFF'] : []),
        '--verbose',
        `--result-file=${destino}`,
        origen.base,
      ];
    }
    const s = this.salida(operacion, motor, etiqueta, claves, (l) =>
      /warning|advertencia/i.test(l),
    );
    let codigo: number;
    try {
      ({ codigo } = await this.lanzar(exe, args, { env, alLinea: (l) => s.linea(l) }));
    } catch {
      codigo = -1;
    }
    s.fin();
    if (codigo !== 0) throw new ErrorVolcado(s.detalle());
    return s;
  }

  async respaldar(
    motor: MotorBd,
    base: string,
    carpetaDestino?: string,
  ): Promise<{ archivo: string }> {
    const m = motorSql(motor, 'Respaldar');
    if (m === 'postgresql') validarNombrePg(base);
    else validarNombreBd(base);
    const con = await this.d.bd.conexion(m);
    const carpeta = carpetaDestino
      ? path.resolve(carpetaDestino)
      : path.join(await this.d.plataforma.carpetaDocumentos(), 'WolfCore Dev', 'Respaldos');
    await mkdir(carpeta, { recursive: true });
    const ext = m === 'postgresql' ? '.dump' : '.sql';
    const raiz = path.join(carpeta, `${base}-${sello(this.ahora())}`);
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
    motor: MotorBd,
    origen: OrigenImportar,
    destinoBase: string,
    opts: OpcionesRestaurar = {},
  ): Promise<ResultadoRestaurar> {
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
      return { advertencias: [...avisos, ...r.advertencias] };
    } finally {
      await rm(tmp, OPCIONES_BORRADO).catch(() => undefined);
    }
  }
}

class ErrorVolcado extends Error {
  constructor(readonly detalle: string) {
    super(detalle || 'El volcado falló.');
  }
}

function errorOrigen(e: unknown, o: OrigenImportar, claves: string[]): Error {
  const detalle = enmascarar(e instanceof ErrorVolcado ? e.detalle : String(e), claves);
  if (/access denied|password authentication failed|autentificaci[oó]n/i.test(detalle)) {
    return new Error('El servidor de origen rechazó el usuario o la clave.');
  }
  if (
    /can't connect|could not connect|connection refused|unknown (mysql )?server host|could not translate host/i.test(
      detalle,
    )
  ) {
    return new Error(`No se pudo conectar al servidor de origen ${o.host}:${o.puerto}.`);
  }
  return new Error(
    `No se pudo volcar la base ${o.base} del origen${detalle ? `: ${detalle}` : '.'}`,
  );
}

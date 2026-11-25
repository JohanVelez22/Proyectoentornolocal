import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  copyFile,
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';
import yazl from 'yazl';
import { z } from 'zod';
import { leerBaseDelProyecto, type BaseProyecto } from '../bd/baseProyecto';
import type { ObjetivoBd } from '../bd/basesDeDatos';
import type { MotorBd } from '../bd/env';
import { quitarAutoIncrement, quitarDefiner } from '../bd/sqlPermitido';
import { extraerZip } from '../catalogo/zip';
import { ErrorWolf } from '../errores';
import { enmascararSecretos } from '../patronesSecretos';
import type { Rutas } from '../rutas';
import { SitioSchema, TIPOS_SITIO, type Sitio } from '../tipos';
import { MOTORES_BD, PASOS_SOLO_GENERADOR, PasoRecetaSchema, type PasoReceta } from './config';

/**
 * Plantillas de proyecto: la receta, los ajustes y el esquema de la base **sin datos** de un
 * proyecto, y opcionalmente sus archivos, guardados en `<datos>/plantillas/<id>/`. Nunca llevan
 * secretos, filas ni nada que el usuario no haya visto en la vista previa.
 */

/**
 * Lo que una plantilla nunca lleva en `archivos.zip`. Son obligatorias: el usuario solo puede
 * sumar (`excluirExtra`), nunca quitar. Un patrón sin `/` se compara con el nombre de cada
 * archivo o carpeta a cualquier profundidad (`*` = cualquier cosa dentro del nombre); uno con `/`
 * es una ruta desde la raíz del proyecto (y todo lo que cuelga de ella).
 */
export const EXCLUSIONES_PLANTILLA: readonly string[] = [
  // Variables de entorno y dependencias que se reinstalan
  '.env',
  '.env.*',
  'vendor',
  'node_modules',
  '.git',
  '.venv',
  'venv',
  '__pycache__',
  // Cachés, sesiones y archivos de la aplicación (pueden traer configuración cacheada o datos)
  'bootstrap/cache',
  'storage/framework',
  'storage/app',
  'writable',
  'var',
  'wp-content/uploads',
  // Credenciales de herramientas
  '.aws',
  '.ssh',
  '.docker',
  'app/etc/env.php',
  'settings.php',
  'settings.local.php',
  '*.decrypt.private.php',
  '.envrc',
  '.pgpass',
  '.my.cnf',
  '.git-credentials',
  'sftp.json',
  '.yarnrc.yml',
  '*.kdbx',
  // Registros
  'storage/logs',
  'storage/framework/cache',
  'writable/logs',
  '*.log',
  // Datos: volcados, respaldos y bases de archivo
  '*.sql',
  '*.dump',
  '*.bak',
  '*.sqlite',
  '*.sqlite3',
  '*.db',
  // Claves, certificados y credenciales
  '*.pem',
  '*.key',
  '*.crt',
  '*.cer',
  '*.p12',
  '*.pfx',
  '*.jks',
  '*.keystore',
  'id_rsa*',
  'id_ed25519*',
  'id_ecdsa*',
  '.htpasswd',
  '.npmrc',
  '.pypirc',
  '.netrc',
  'auth.json',
  // Configuración que lleva la clave de la base o las sales (se regenera al crear el proyecto)
  'wp-config.php',
  'application/config/database.php',
  // La receta ya va (sin secretos) en plantilla.json; su bloque `env` puede traer valores
  'wolfcore.yml',
];

/** Topes por defecto (se pueden bajar en las pruebas). */
export const LIMITES_PLANTILLA = {
  /** Archivos que entran en `archivos.zip`. */
  maxArchivos: 10_000,
  /** Suma de los tamaños de esos archivos. */
  maxBytes: 100 * 1024 * 1024,
  /** Un archivo más grande se deja fuera (y se lista en la vista previa). */
  maxBytesArchivo: 5 * 1024 * 1024,
  /** Profundidad máxima de carpetas. */
  maxProfundidad: 30,
  /** Tamaño de plantilla.json y del esquema que se aceptan al leer. */
  maxBytesJson: 512 * 1024,
  maxBytesEsquema: 256 * 1024 * 1024,
};
export type LimitesPlantilla = typeof LIMITES_PLANTILLA;

/** Cuántos nombres excluidos devuelve la vista previa (el total va aparte). */
const MAX_EXCLUIDOS_LISTA = 200;
const MAX_EXCLUSIONES_EXTRA = 50;

const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
/** Nombres de dispositivo de Windows (CON, NUL, COM1…) y tramos que terminan en punto o espacio. */
const NOMBRE_RESERVADO = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$|[. ]$/i;
const HEX64 = /^[0-9a-f]{64}$/;

/** Pasos de una plantilla que se vuelven a correr al crear un proyecto (lista cerrada). */
export const PASOS_PERMITIDOS_PLANTILLA: readonly string[] = [
  'composer-install',
  'env-crear',
  'key-generate',
  'migrar',
  'storage-link',
  'npm-ci',
  'npm-build',
  'python-venv',
  'pip-install',
  'pgvector-activar',
];

const PlantillaSchema = z
  .object({
    id: z.string().regex(ID),
    nombre: z.string().min(1).max(60),
    creada: z.string().max(40),
    tipo: z.enum(TIPOS_SITIO),
    receta: z.array(PasoRecetaSchema).max(40),
    php: z
      .string()
      .regex(/^\d{1,2}\.\d{1,2}$/)
      .nullable(),
    phpIni: z.record(z.string().max(100), z.string().max(500)),
    extensiones: z.array(z.string().regex(/^[a-z0-9_]{1,40}$/)).max(300),
    runtimes: SitioSchema.shape.runtimes,
    reglasNginx: z
      .string()
      .max(64 * 1024)
      .nullable(),
    motorBase: z.enum(MOTORES_BD).nullable(),
    /** Módulo ASGI (`main:app`) del uvicorn de un FastAPI; los demás procesos no se guardan. */
    /** `propia`: la guardó este usuario; `importada`: viene de un tercero (sin scripts ni confianza). */
    // Se ignora: el origen no sale de plantilla.json (se puede falsificar), sale del registro.
    origen: z.unknown().optional(),
    moduloAsgi: z
      .string()
      .regex(/^[A-Za-z0-9_.]{1,80}:[A-Za-z0-9_]{1,80}$/)
      .nullable(),
    conArchivos: z.boolean(),
    archivoEsquema: z.enum(['esquema.sql', 'esquema.dump']).nullable(),
    sha256: z.object({
      archivos: z.string().regex(HEX64).nullable(),
      esquema: z.string().regex(HEX64).nullable(),
    }),
  })
  .strict();

export interface Plantilla {
  id: string;
  nombre: string;
  /** ISO 8601. */
  creada: string;
  tipo: Sitio['tipo'];
  /** Receta del proyecto sin secretos, sin los pasos de base ni `sitio-crear`. */
  receta: PasoReceta[];
  php: string | null;
  phpIni: Record<string, string>;
  /** Extensiones de PHP activas en la rama del proyecto (para avisar si faltan). */
  extensiones: string[];
  runtimes: Sitio['runtimes'];
  reglasNginx: string | null;
  motorBase: MotorBd | null;
  /** `importada`: no corre scripts de Composer ni de npm y nunca queda confiada sola. */
  origen: 'propia' | 'importada';
  moduloAsgi: string | null;
  conArchivos: boolean;
  /** `esquema.sql` (MySQL, MariaDB) o `esquema.dump` (PostgreSQL); null = sin base. */
  archivoEsquema: 'esquema.sql' | 'esquema.dump' | null;
  /** Huellas de los archivos guardados: detectan una plantilla dañada o manipulada. */
  sha256: { archivos: string | null; esquema: string | null };
}

export interface OpcionesPlantilla {
  nombre: string;
  conArchivos: boolean;
  /** Patrones que se suman a `EXCLUSIONES_PLANTILLA` (nunca la reducen). */
  excluirExtra: string[];
}

export interface VistaPreviaPlantilla {
  archivos: number;
  bytes: number;
  /** Rutas relativas dejadas fuera (hasta 200). */
  excluidos: string[];
  /** Cuántas se dejaron fuera en total. */
  totalExcluidos: number;
  /** Base y servidor de los que se volcaría el esquema; null si el proyecto no declara una. */
  base: { nombre: string; motor: MotorBd; servidor: ObjetivoBd } | null;
  /** Por qué no se pudo resolver la base (servidor remoto, instancia que no existe…). */
  errorBase: string | null;
  /** El proyecto usa MongoDB: su esquema (colecciones e índices) no se guarda. */
  avisoMongodb: boolean;
}

export interface DepsPlantillas {
  rutas: Pick<Rutas, 'plantillas' | 'plantillasPropias' | 'tmp'>;
  /** El sitio por id; lanza si no existe. */
  sitio: (id: string) => Promise<Sitio>;
  /** Receta efectiva del proyecto (sin argumentos de interfaz). */
  receta: (sitio: Sitio) => Promise<PasoReceta[]>;
  /** Respalda una base en `carpeta`. Plantillas siempre pide `{soloEsquema: true}`. */
  respaldar: (
    objetivo: ObjetivoBd,
    base: string,
    carpeta: string,
    opciones: { soloEsquema: true },
  ) => Promise<{ archivo: string }>;
  /** Extensiones de PHP activas en una rama (opcional). */
  extensionesActivas?: (rama: string) => Promise<string[]>;
  /** Base declarada en `.env.local`/`.env` del proyecto (por defecto, la lee de la carpeta). */
  baseDe?: (
    carpeta: string,
  ) => Promise<(BaseProyecto & { host?: string | null; puerto?: number | null }) | null>;
  /**
   * Instancia (o motor predeterminado) que escucha en ese puerto; null si ninguna. Sin esta
   * función se usa el motor predeterminado.
   */
  resolverObjetivo?: (motor: MotorBd, puerto: number | null) => Promise<ObjetivoBd | null>;
  /** El esquema guardado como texto SQL, para revisarlo (en PostgreSQL pasa por pg_restore -f -). */
  leerEsquema?: (servidor: ObjetivoBd, archivo: string) => Promise<string>;
  /** El proyecto usa MongoDB (para avisar que su esquema no se guarda). */
  usaMongodb?: (sitio: Sitio) => Promise<boolean>;
  limites?: Partial<LimitesPlantilla>;
  reloj?: () => Date;
}

const HOST_LOCAL = /^(127\.0\.0\.1|localhost|\[?::1\]?)$/i;

const danada = (detalle: string): ErrorWolf =>
  new ErrorWolf('plantillas.danada', `La plantilla está dañada o fue modificada: ${detalle}`);

/** Valida un id de plantilla (nunca una ruta). */
export function validarIdPlantilla(id: unknown): string {
  if (typeof id !== 'string' || !ID.test(id)) {
    throw new ErrorWolf('plantillas.id_invalido', 'El identificador de la plantilla no es válido.');
  }
  return id;
}

/* ───────────── Exclusiones ───────────── */

type Coincide = (rel: string, nombre: string) => boolean;

/** Comodines (`*`) que admite un patrón: más no tiene sentido y encarece la comparación. */
const MAX_COMODINES = 5;

/**
 * ¿`texto` coincide con `patron`, donde `*` es cualquier cosa (dentro del mismo tramo)? Sin
 * expresiones regulares: el recorrido con retroceso de un solo `*` es lineal en la práctica y no
 * hay explosión con `a*a*a*…`.
 */
function globCoincide(patron: string, texto: string): boolean {
  let p = 0;
  let t = 0;
  let estrella = -1;
  let marca = 0;
  while (t < texto.length) {
    if (p < patron.length && patron[p] === '*') {
      estrella = p++;
      marca = t;
    } else if (p < patron.length && patron[p] === texto[t]) {
      p++;
      t++;
    } else if (estrella >= 0) {
      p = estrella + 1;
      t = ++marca;
    } else {
      return false;
    }
  }
  while (p < patron.length && patron[p] === '*') p++;
  return p === patron.length;
}

/** Junta los `*` repetidos (`a***b` → `a*b`): significan lo mismo y evitan trabajo de más. */
const juntarComodines = (p: string): string => p.replace(/\*{2,}/g, '*');

function compilarPatron(patron: string): Coincide {
  const p = juntarComodines(
    patron
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase(),
  );
  if (p.includes('/')) {
    // Ruta desde la raíz del proyecto: cada tramo admite `*` y vale también todo lo que cuelga.
    const tramos = p.split('/');
    return (rel) => {
      const partes = rel.split('/');
      return partes.length >= tramos.length && tramos.every((t, i) => globCoincide(t, partes[i]!));
    };
  }
  return (_rel, nombre) => globCoincide(p, nombre.toLowerCase());
}

/** Valida y compila las exclusiones que suma el usuario; las obligatorias van siempre. */
export function compilarExclusiones(extra: unknown): Coincide[] {
  const malo = (): ErrorWolf =>
    new ErrorWolf('plantillas.exclusion_invalida', 'Una de las exclusiones no es válida.');
  if (extra !== undefined && !Array.isArray(extra)) throw malo();
  const lista: unknown[] = extra ?? [];
  if (lista.length > MAX_EXCLUSIONES_EXTRA) throw malo();
  const extras: string[] = [];
  for (const x of lista) {
    if (typeof x !== 'string') throw malo();
    const t = x.trim();
    if (
      t === '' ||
      t.length > 120 ||
      t.startsWith('!') || // las obligatorias no se pueden quitar
      /[\0:]/.test(t) ||
      [...t].some((c) => c.charCodeAt(0) < 0x20) ||
      path.isAbsolute(t) ||
      t.split(/[\\/]+/).includes('..')
    ) {
      throw malo();
    }
    // Demasiados comodines: no es un patrón razonable (y cuesta compararlo con cada archivo).
    if ((juntarComodines(t).match(/\*/g) ?? []).length > MAX_COMODINES) throw malo();
    extras.push(t);
  }
  return [...EXCLUSIONES_PLANTILLA, ...extras].map(compilarPatron);
}

/** Nombres de variable, clave o campo que suelen guardar un secreto (sin distinguir mayúsculas). */
const NOMBRE_SECRETO = String.raw`(?:pass(?:word|wd)|pwd|_pw|secret|token|api[_-]?key|app_?key|(?<!primary|foreign|public|sort|cache)_key|dsn|default_pw|credential|private_key)`;

/**
 * Valor literal: no vacío y que no sea una referencia (`env(...)`, `getenv(...)`, `$VAR`, `${VAR}`,
 * `%VAR%`) ni un valor sin secreto (`null`, `true`, `false`).
 */
const VALOR_LITERAL = String.raw`["']?(?!env\(|getenv\(|\$|%|null\b|true\b|false\b)[^\s"'#,;)<>]{3,}`;

/** ¿Alguno de los tramos de la ruta (o su prefijo) coincide con una exclusión? */
function enExcluidos(coincidencias: readonly Coincide[], ruta: string): boolean {
  const tramos = ruta.split('/').filter(Boolean);
  let rel = '';
  for (const t of tramos) {
    rel = rel ? `${rel}/${t}` : t;
    const minus = rel.toLowerCase();
    if (coincidencias.some((c) => c(minus, t))) return true;
  }
  return false;
}

/** Textos que delatan un secreto dentro de un archivo (el archivo se deja fuera). */
const SECRETO_EN_ARCHIVO: readonly RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  // NOMBRE=valor, 'nombre' => 'valor', "nombre": "valor", nombre: valor
  new RegExp(
    String.raw`(?<![\w.-])["']?[\w.-]*${NOMBRE_SECRETO}[\w.-]*["']?[ \t]*(?:=>|=|:)[ \t]*${VALOR_LITERAL}`,
    'im',
  ),
  // <env name="DB_PASSWORD" value="valor"/> (phpunit.xml, Symfony, Docker…)
  new RegExp(
    String.raw`name[ \t]*=[ \t]*["'][\w.-]*${NOMBRE_SECRETO}[\w.-]*["'][ \t]+value[ \t]*=[ \t]*${VALOR_LITERAL}`,
    'i',
  ),
  /\bsk-[A-Za-z0-9_-]{8,}/,
  /\bgithub_pat_[A-Za-z0-9_]{8,}/,
  /\bgh[pousr]_[A-Za-z0-9]{8,}/,
  /\bAIza[0-9A-Za-z_-]{20,}/,
  /:\/\/[^\s/@:]+:[^\s/@]+@/,
];

/** Texto de un archivo para escanearlo: UTF-16 (con BOM) se decodifica; lo demás va como latin1. */
function textoParaEscanear(buf: Buffer): string {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.subarray(2).toString('utf16le');
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    const b = Buffer.from(buf.subarray(2));
    if (b.length % 2 === 1)
      return b
        .subarray(0, b.length - 1)
        .swap16()
        .toString('utf16le');
    return b.swap16().toString('utf16le');
  }
  return buf.toString('latin1');
}

/** ¿El contenido (texto o bytes) lleva algo que parece una clave o una contraseña? */
export function llevaSecreto(contenido: string | Buffer): boolean {
  const texto = typeof contenido === 'string' ? contenido : textoParaEscanear(contenido);
  return SECRETO_EN_ARCHIVO.some((r) => r.test(texto));
}

/* ───────────── Datos sin secretos ───────────── */

/**
 * Nombres de clave o de variable con secreto: la misma regla que el escaneo de archivos (`_KEY`,
 * `APP_KEY`, `_PWD`, `_PW`, `DSN`, `mysqli.default_pw`…) más lo que en español llama "clave".
 */
const CLAVE_SECRETA = new RegExp(`${NOMBRE_SECRETO}|pass(?:phrase)?|clave|private|salt`, 'i');

/** Copia un valor quitando las claves con nombre de secreto y enmascarando lo que lo parezca. */
export function sinSecretosPlantilla<T>(valor: T): T {
  if (typeof valor === 'string') return enmascararSecretos(valor) as T;
  if (Array.isArray(valor)) return valor.map((v) => sinSecretosPlantilla(v)) as T;
  if (valor && typeof valor === 'object') {
    const salida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (CLAVE_SECRETA.test(k)) continue;
      salida[k] = sinSecretosPlantilla(v);
    }
    return salida as T;
  }
  return valor;
}

/**
 * Argumentos que admite cada tipo de paso de una plantilla (lista cerrada). Todo lo demás se
 * descarta al guardar y otra vez al crear: una plantilla manipulada no puede mandar una
 * instancia, un usuario, una clave, `sobrescribir` ni `semilla` a un paso.
 */
const ARGS_PERMITIDOS: Record<string, readonly string[]> = {
  'composer-install': [],
  'env-crear': ['valores'],
  'key-generate': [],
  migrar: [],
  'storage-link': [],
  'npm-ci': [],
  'npm-build': [],
  'python-venv': [],
  'pip-install': [],
  'pgvector-activar': [],
};

/** Argumentos de la base que SIEMPRE los pone el generador (nunca vienen de la plantilla). */
const ARGS_DE_BASE = ['base', 'motor', 'instancia', 'usuario', 'clave', 'sobrescribir', 'semilla'];

/**
 * Argumentos de un paso de plantilla ya filtrados: solo los de la lista del tipo y, en `valores`,
 * nombres de variable válidos con valores de texto, número o booleano cortos. Nunca los de
 * `ARGS_DE_BASE`.
 */
export function argsPermitidos(tipo: string, args: unknown): Record<string, unknown> {
  const salida: Record<string, unknown> = {};
  if (!args || typeof args !== 'object' || Array.isArray(args)) return salida;
  const origen = args as Record<string, unknown>;
  for (const k of ARGS_PERMITIDOS[tipo] ?? []) {
    if (ARGS_DE_BASE.includes(k) || !(k in origen)) continue;
    if (k === 'valores') {
      const v = origen[k];
      if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
      const limpio: Record<string, string | number | boolean> = {};
      for (const [n, x] of Object.entries(v)) {
        if (!/^[A-Za-z_][A-Za-z0-9_.]{0,63}$/.test(n)) continue;
        if (typeof x === 'string' && x.length <= 500 && !/[\r\n\0]/.test(x)) limpio[n] = x;
        else if (typeof x === 'number' || typeof x === 'boolean') limpio[n] = x;
      }
      if (Object.keys(limpio).length > 0) salida[k] = limpio;
    }
  }
  return salida;
}

/** Pasos que no entran en la plantilla: los de base y el sitio los pone el generador. */
const PASOS_FUERA = new Set<string>([
  'sitio-crear',
  'bd-crear',
  'bd-restaurar',
  'config-bd-crear',
  ...PASOS_SOLO_GENERADOR,
]);

function recetaDePlantilla(receta: readonly PasoReceta[]): PasoReceta[] {
  return receta
    .filter((p) => !PASOS_FUERA.has(p.tipo))
    .filter((p) => p.tipo in ARGS_PERMITIDOS)
    .map((p) => {
      const args = argsPermitidos(p.tipo, p.args);
      return sinSecretosPlantilla({
        id: p.id,
        tipo: p.tipo,
        titulo: p.titulo,
        ...(Object.keys(args).length > 0 ? { args } : {}),
        ...(p.opcional ? { opcional: true } : {}),
      });
    });
}

/** `main:app` del proceso uvicorn guardado en el sitio. */
function moduloAsgiDe(sitio: Sitio): string | null {
  if (sitio.tipo !== 'fastapi') return null;
  for (const proceso of sitio.procesos) {
    const i = proceso.comando.indexOf('uvicorn');
    const modulo = i >= 0 ? proceso.comando[i + 1] : undefined;
    if (modulo && /^[A-Za-z0-9_.]{1,80}:[A-Za-z0-9_]{1,80}$/.test(modulo)) return modulo;
  }
  return null;
}

/* ───────────── Archivos ───────────── */

interface ArchivoPlantilla {
  rel: string;
  abs: string;
  tamano: number;
  /** Contenido ya leído (los pequeños); si no, se lee al armar el zip. */
  contenido?: Buffer;
}

interface Recopilado {
  archivos: ArchivoPlantilla[];
  bytes: number;
  excluidos: string[];
  totalExcluidos: number;
}

/**
 * Recorre la carpeta del proyecto sin seguir enlaces ni uniones. Lo excluido ni se abre; un
 * archivo con un secreto adentro se deja fuera. Pasarse de los topes de archivos o de bytes es un
 * error (`plantillas.demasiado_grande`): nunca se guarda una plantilla recortada sin avisar.
 */
async function recopilar(
  carpeta: string,
  coincidencias: readonly Coincide[],
  limites: LimitesPlantilla,
): Promise<Recopilado> {
  const r: Recopilado = { archivos: [], bytes: 0, excluidos: [], totalExcluidos: 0 };
  const dejar = (rel: string, motivo?: string): void => {
    r.totalExcluidos++;
    if (r.excluidos.length < MAX_EXCLUIDOS_LISTA)
      r.excluidos.push(motivo ? `${rel} (${motivo})` : rel);
  };
  const demasiados = (): ErrorWolf =>
    new ErrorWolf(
      'plantillas.demasiado_grande',
      'El proyecto tiene demasiados archivos para guardarlo como plantilla.',
      { maximo: limites.maxArchivos },
    );
  const pesa = (): ErrorWolf =>
    new ErrorWolf(
      'plantillas.demasiado_pesada',
      'El proyecto pesa demasiado para guardarlo como plantilla.',
      {
        maximo: Math.floor(limites.maxBytes / (1024 * 1024)),
      },
    );
  const raiz = await lstat(carpeta);
  if (!raiz.isDirectory() || raiz.isSymbolicLink()) {
    throw new ErrorWolf('proyectos.carpeta_invalida', 'La carpeta del proyecto no es válida.');
  }
  const pila: { abs: string; rel: string; nivel: number }[] = [{ abs: carpeta, rel: '', nivel: 0 }];
  while (pila.length > 0) {
    const { abs, rel, nivel } = pila.pop()!;
    const hijos = (await readdir(abs, { withFileTypes: true })).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    );
    for (const h of hijos) {
      const relH = rel ? `${rel}/${h.name}` : h.name;
      const minus = relH.toLowerCase();
      if (coincidencias.some((c) => c(minus, h.name))) {
        dejar(relH);
        continue;
      }
      // Un nombre que no se puede crear en Windows (CON, NUL, "a:b", "x.") rompería la plantilla
      // al abrirla en otro equipo.
      if (NOMBRE_RESERVADO.test(h.name) || /[:<>"|?*\0]/.test(h.name)) {
        dejar(relH, 'nombre no portable');
        continue;
      }
      // Ni enlaces simbólicos ni uniones: no se sale de la carpeta del proyecto.
      if (h.isSymbolicLink()) {
        dejar(relH, 'enlace');
        continue;
      }
      const absH = path.join(abs, h.name);
      if (h.isDirectory()) {
        if (nivel + 1 > limites.maxProfundidad) {
          dejar(relH, 'demasiado profunda');
          continue;
        }
        pila.push({ abs: absH, rel: relH, nivel: nivel + 1 });
        continue;
      }
      if (!h.isFile()) {
        dejar(relH, 'no es un archivo');
        continue;
      }
      const info = await lstat(absH);
      if (info.isSymbolicLink() || !info.isFile()) {
        dejar(relH, 'enlace');
        continue;
      }
      if (info.size > limites.maxBytesArchivo) {
        dejar(relH, 'muy grande');
        continue;
      }
      const buf = await readFile(absH);
      if (llevaSecreto(buf)) {
        dejar(relH, 'secreto');
        continue;
      }
      if (r.archivos.length + 1 > limites.maxArchivos) throw demasiados();
      if (r.bytes + info.size > limites.maxBytes) throw pesa();
      r.archivos.push({
        rel: relH,
        abs: absH,
        tamano: info.size,
        ...(info.size <= 1024 * 1024 ? { contenido: buf } : {}),
      });
      r.bytes += info.size;
    }
  }
  return r;
}

async function escribirZip(destino: string, archivos: readonly ArchivoPlantilla[]): Promise<void> {
  const zip = new yazl.ZipFile();
  const fin = pipeline(zip.outputStream, createWriteStream(destino));
  for (const a of archivos) {
    if (a.contenido) zip.addBuffer(a.contenido, a.rel);
    else zip.addFile(a.abs, a.rel);
  }
  zip.end();
  await fin;
}

/** El json no lleva el origen (sale del registro del equipo). */
const sinOrigen = (p: Plantilla): Omit<Plantilla, 'origen'> => {
  const { origen, ...resto } = p;
  void origen;
  return resto;
};
const sha256Texto = (t: string): string => createHash('sha256').update(t, 'utf8').digest('hex');

async function sha256De(archivo: string): Promise<string> {
  const h = createHash('sha256');
  await pipeline(createReadStream(archivo), h);
  return h.digest('hex');
}

/**
 * Recorre las entradas de un zip sin extraer nada y rechaza lo que no debe existir: rutas
 * absolutas, con `..`, con `:` (unidades y flujos alternos) o con caracteres de control, y más
 * entradas o bytes de los topes. Un zip ilegible también es "dañado".
 */
async function revisarZip(archivo: string, limites: LimitesPlantilla): Promise<void> {
  const obligatorias = compilarExclusiones([]);
  const zip = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.open(archivo, { lazyEntries: true, autoClose: false }, (e, z) =>
      e || !z ? reject(e ?? new Error('zip ilegible')) : resolve(z),
    );
  }).catch(() => {
    throw danada('el archivo comprimido no se puede leer');
  });
  try {
    await new Promise<void>((resolve, reject) => {
      let entradas = 0;
      let bytes = 0;
      zip.on('error', reject);
      zip.on('end', resolve);
      zip.on('entry', (e: yauzl.Entry) => {
        entradas++;
        bytes += e.uncompressedSize;
        const nombre = e.fileName.replace(/\\/g, '/');
        if (
          // Lo que una plantilla nunca lleva tampoco puede venir en el zip (un zip manipulado
          // podría traer un wolfcore.yml, un .env o un vendor/ con código propio).
          enExcluidos(obligatorias, nombre) ||
          entradas > limites.maxArchivos * 2 + 1000 ||
          bytes > limites.maxBytes * 2 ||
          nombre.startsWith('/') ||
          /[:\0]/.test(nombre) ||
          [...nombre].some((c) => c.charCodeAt(0) < 0x20) ||
          nombre.split('/').some((t) => t === '..' || NOMBRE_RESERVADO.test(t))
        ) {
          reject(danada('trae una ruta o un tamaño que no corresponde'));
          return;
        }
        zip.readEntry();
      });
      zip.readEntry();
    });
  } catch (e) {
    if (e instanceof ErrorWolf) throw e;
    throw danada('el archivo comprimido no es válido');
  } finally {
    zip.close();
  }
}

/* ───────────── Plantillas ───────────── */

const sello = (d: Date): string => d.toISOString();

export class Plantillas {
  constructor(private readonly d: DepsPlantillas) {}

  private get limites(): LimitesPlantilla {
    return { ...LIMITES_PLANTILLA, ...this.d.limites };
  }

  private carpeta(id: string): string {
    return path.join(this.d.rutas.plantillas(), validarIdPlantilla(id));
  }

  /**
   * Quita las carpetas `.tmp-*` que dejó un guardado interrumpido (más de 10 minutos): no hay un
   * guardado vivo que dure tanto y no se borra el de otra ventana que está en curso.
   */
  private async limpiarParciales(): Promise<void> {
    const raiz = this.d.rutas.plantillas();
    const limite = (this.d.reloj?.() ?? new Date()).getTime() - 10 * 60 * 1000;
    let nombres: string[];
    try {
      nombres = await readdir(raiz);
    } catch {
      return;
    }
    for (const n of nombres) {
      if (!n.startsWith('.tmp-')) continue;
      const ruta = path.join(raiz, n);
      try {
        const info = await lstat(ruta);
        if (info.isSymbolicLink() || info.mtimeMs > limite) continue;
        await rm(ruta, { recursive: true, force: true });
      } catch {
        // Otro proceso la está usando o ya no está.
      }
    }
  }

  /**
   * Revisa el esquema recién volcado antes de guardarlo: sin DEFINER ni contadores
   * AUTO_INCREMENT (MySQL, MariaDB) y sin nada que parezca una clave o una contraseña.
   */
  private async depurarEsquema(
    servidor: ObjetivoBd,
    archivo: string,
    nombre: 'esquema.sql' | 'esquema.dump',
  ): Promise<void> {
    const rechazar = (texto: string): ErrorWolf =>
      new ErrorWolf('plantillas.esquema_fallo', `No se pudo leer el esquema de la base: ${texto}`);
    const info = await stat(archivo);
    if (info.size > this.limites.maxBytesEsquema) throw rechazar('es demasiado grande.');
    let texto: string | null = null;
    if (nombre === 'esquema.sql') {
      const original = await readFile(archivo, 'utf8');
      texto = quitarAutoIncrement(quitarDefiner(original));
      if (texto !== original) await writeFile(archivo, texto, 'utf8');
    } else if (this.d.leerEsquema) {
      texto = await this.d.leerEsquema(servidor, archivo);
    }
    if (texto !== null && llevaSecreto(texto)) {
      throw rechazar('trae algo que parece una clave o una contraseña, así que no se guarda.');
    }
  }

  /**
   * Copia a `tmp` los archivos y el esquema de la plantilla, calcula las huellas sobre esas copias
   * y las revisa; de ahí salen luego la extracción y la restauración. Se llama antes de crear nada:
   * lo que se verificó es lo mismo que se usa (no se puede cambiar entre una cosa y la otra).
   */
  async preparar(id: string): Promise<void> {
    const p = await this.cargar(id);
    await this.liberar(id);
    const tmp = this.d.rutas.tmp();
    await mkdir(tmp, { recursive: true });
    const dir = path.join(tmp, `plantilla-uso-${randomBytes(6).toString('hex')}`);
    await mkdir(dir);
    try {
      const copiar = async (origen: string, destino: string, huella: string, tope: number) => {
        const info = await lstat(origen).catch(() => null);
        if (!info?.isFile() || info.size > tope) throw danada('falta un archivo o no es válido');
        await copyFile(origen, destino);
        if ((await sha256De(destino)) !== huella) throw danada('un archivo cambió');
      };
      let zip: string | null = null;
      let esquema: string | null = null;
      if (p.conArchivos && p.sha256.archivos) {
        zip = path.join(dir, 'archivos.zip');
        await copiar(
          path.join(this.carpeta(id), 'archivos.zip'),
          zip,
          p.sha256.archivos,
          this.limites.maxBytes * 2,
        );
        await revisarZip(zip, this.limites);
      }
      if (p.archivoEsquema && p.sha256.esquema) {
        esquema = path.join(dir, p.archivoEsquema);
        await copiar(
          path.join(this.carpeta(id), p.archivoEsquema),
          esquema,
          p.sha256.esquema,
          this.limites.maxBytesEsquema,
        );
      }
      this.preparadas.set(id, { dir, zip, esquema });
    } catch (e) {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
      throw e;
    }
  }

  /** Borra la copia de trabajo de `preparar`. */
  async liberar(id: string): Promise<void> {
    const x = this.preparadas.get(validarIdPlantilla(id));
    this.preparadas.delete(id);
    if (x) await rm(x.dir, { recursive: true, force: true }).catch(() => undefined);
  }

  private readonly preparadas = new Map<
    string,
    { dir: string; zip: string | null; esquema: string | null }
  >();

  /** Plantillas válidas, de la más nueva a la más vieja. Las dañadas no salen en la lista. */
  async lista(): Promise<Plantilla[]> {
    await this.limpiarParciales();
    let nombres: string[];
    try {
      nombres = await readdir(this.d.rutas.plantillas());
    } catch {
      return [];
    }
    const res: Plantilla[] = [];
    for (const n of nombres) {
      if (!ID.test(n)) continue;
      try {
        res.push(await this.cargar(n));
      } catch {
        // Dañada: no se ofrece (se puede borrar por id).
      }
    }
    return res.sort((a, b) => (a.creada < b.creada ? 1 : a.creada > b.creada ? -1 : 0));
  }

  /** Lee y valida `plantilla.json`. Errores con código: `no_existe`, `danada`, `id_invalido`. */
  async cargar(id: string): Promise<Plantilla> {
    const dir = this.carpeta(id);
    let info;
    try {
      info = await lstat(dir);
    } catch {
      throw new ErrorWolf('plantillas.no_existe', 'La plantilla no existe.');
    }
    if (info.isSymbolicLink() || !info.isDirectory()) throw danada('no es una carpeta');
    let texto: string;
    try {
      const json = path.join(dir, 'plantilla.json');
      const i = await lstat(json);
      if (!i.isFile() || i.size > this.limites.maxBytesJson) throw new Error('tamaño');
      texto = await readFile(json, 'utf8');
    } catch {
      throw danada('falta plantilla.json o es demasiado grande');
    }
    let bruto: unknown;
    try {
      bruto = JSON.parse(texto);
    } catch {
      throw danada('plantilla.json no es válido');
    }
    const r = PlantillaSchema.safeParse(bruto);
    if (!r.success || r.data.id !== id) throw danada('plantilla.json no es válido');
    const p = r.data as Plantilla;
    // El origen: propia solo si este equipo la guardó y su plantilla.json no cambió desde entonces.
    // Lo que diga el json no cuenta; por defecto, importada.
    const registro = await this.leerRegistro();
    p.origen = registro[id] === sha256Texto(texto) ? 'propia' : 'importada';
    // Coherencia: las huellas existen justo cuando existe el archivo.
    if ((p.sha256.archivos !== null) !== p.conArchivos) throw danada('las huellas no coinciden');
    if ((p.sha256.esquema !== null) !== (p.archivoEsquema !== null)) {
      throw danada('las huellas no coinciden');
    }
    return p;
  }

  private async leerRegistro(): Promise<Record<string, string>> {
    try {
      const j: unknown = JSON.parse(await readFile(this.d.rutas.plantillasPropias(), 'utf8'));
      if (!j || typeof j !== 'object' || Array.isArray(j)) return {};
      const salida: Record<string, string> = {};
      for (const [k, v] of Object.entries(j)) if (typeof v === 'string') salida[k] = v;
      return salida;
    } catch {
      return {};
    }
  }

  /** Anota (huella) o quita (null) una plantilla del registro, con escritura atómica. */
  private async anotarRegistro(id: string, huella: string | null): Promise<void> {
    const registro = await this.leerRegistro();
    if (huella === null) delete registro[id];
    else registro[id] = huella;
    const destino = this.d.rutas.plantillasPropias();
    await mkdir(path.dirname(destino), { recursive: true });
    const tmp = `${destino}.${randomBytes(4).toString('hex')}.tmp`;
    await writeFile(tmp, JSON.stringify(registro, null, 2), 'utf8');
    await rename(tmp, destino);
  }

  /**
   * Base de la que se volcaría el esquema, con el servidor correcto (instancia por puerto). Una
   * base en otro equipo o en un puerto que ninguna instancia local usa no se adivina: error.
   */
  private async baseDeOrigen(
    sitio: Sitio,
  ): Promise<{ nombre: string; motor: MotorBd; servidor: ObjetivoBd } | null> {
    const b = await (this.d.baseDe ?? leerBaseDelProyecto)(sitio.carpeta).catch(() => null);
    if (!b) return null;
    const noResuelta = (): ErrorWolf =>
      new ErrorWolf(
        'plantillas.base_no_resuelta',
        'No se pudo saber de qué servidor local es la base del proyecto.',
      );
    if (b.host && !HOST_LOCAL.test(b.host)) throw noResuelta();
    const servidor = this.d.resolverObjetivo
      ? await this.d.resolverObjetivo(b.motor, b.puerto ?? null)
      : b.motor;
    if (!servidor) throw noResuelta();
    return { nombre: b.base, motor: b.motor, servidor };
  }

  async vistaPrevia(
    sitioId: string,
    o: Partial<OpcionesPlantilla> = {},
  ): Promise<VistaPreviaPlantilla> {
    const sitio = await this.d.sitio(sitioId);
    const coincidencias = compilarExclusiones(o.excluirExtra);
    const r = await recopilar(sitio.carpeta, coincidencias, this.limites);
    let base: VistaPreviaPlantilla['base'] = null;
    let errorBase: string | null = null;
    try {
      base = await this.baseDeOrigen(sitio);
    } catch (e) {
      errorBase = e instanceof Error ? e.message : String(e);
    }
    return {
      archivos: r.archivos.length,
      bytes: r.bytes,
      excluidos: r.excluidos,
      totalExcluidos: r.totalExcluidos,
      base,
      errorBase,
      avisoMongodb: (await this.d.usaMongodb?.(sitio).catch(() => false)) === true,
    };
  }

  /**
   * Guarda el proyecto como plantilla. Se arma en una carpeta temporal y se renombra al final: o
   * queda entera o no queda.
   */
  async guardar(sitioId: string, o: OpcionesPlantilla): Promise<Plantilla> {
    await this.limpiarParciales();
    const nombre = typeof o?.nombre === 'string' ? o.nombre.trim() : '';
    if (nombre === '' || nombre.length > 60 || [...nombre].some((c) => c.charCodeAt(0) < 0x20)) {
      throw new ErrorWolf('plantillas.nombre_invalido', 'El nombre de la plantilla no es válido.');
    }
    const coincidencias = compilarExclusiones(o.excluirExtra);
    const sitio = await this.d.sitio(sitioId);
    const limites = this.limites;
    const base = await this.baseDeOrigen(sitio);
    const recopilado =
      o.conArchivos === true ? await recopilar(sitio.carpeta, coincidencias, limites) : null;

    const raiz = this.d.rutas.plantillas();
    await mkdir(raiz, { recursive: true });
    const slug =
      nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40)
        .replace(/-+$/, '') || 'plantilla';
    const id = `${slug}-${randomBytes(3).toString('hex')}`;
    const parcial = path.join(raiz, `.tmp-${randomBytes(6).toString('hex')}`);
    await mkdir(parcial);
    try {
      let archivoEsquema: Plantilla['archivoEsquema'] = null;
      let shaEsquema: string | null = null;
      if (base) {
        const tmp = path.join(parcial, 'volcado');
        await mkdir(tmp);
        let archivo: string;
        try {
          ({ archivo } = await this.d.respaldar(base.servidor, base.nombre, tmp, {
            soloEsquema: true,
          }));
        } catch (e) {
          throw new ErrorWolf(
            'plantillas.esquema_fallo',
            `No se pudo leer el esquema de la base: ${e instanceof Error ? enmascararSecretos(e.message) : ''}`,
          );
        }
        archivoEsquema = base.motor === 'postgresql' ? 'esquema.dump' : 'esquema.sql';
        await rename(archivo, path.join(parcial, archivoEsquema));
        await rm(tmp, { recursive: true, force: true });
        await this.depurarEsquema(
          base.servidor,
          path.join(parcial, archivoEsquema),
          archivoEsquema,
        );
        shaEsquema = await sha256De(path.join(parcial, archivoEsquema));
      }
      let shaArchivos: string | null = null;
      if (recopilado) {
        const zip = path.join(parcial, 'archivos.zip');
        await escribirZip(zip, recopilado.archivos);
        shaArchivos = await sha256De(zip);
      }
      let extensiones: string[] = [];
      if (sitio.php && this.d.extensionesActivas) {
        extensiones = (await this.d.extensionesActivas(sitio.php).catch(() => [] as string[]))
          .filter((x) => /^[a-z0-9_]{1,40}$/.test(x))
          .sort()
          .slice(0, 300);
      }
      const plantilla: Plantilla = {
        id,
        nombre,
        creada: sello(this.d.reloj?.() ?? new Date()),
        tipo: sitio.tipo,
        receta: recetaDePlantilla(await this.d.receta(sitio)),
        php: sitio.php,
        phpIni: sinSecretosPlantilla(sitio.phpIni ?? {}),
        extensiones,
        runtimes: { ...sitio.runtimes },
        reglasNginx:
          sitio.reglasExtra.trim() === '' ? null : sinSecretosPlantilla(sitio.reglasExtra),
        motorBase: base ? base.motor : null,
        origen: 'propia',
        moduloAsgi: moduloAsgiDe(sitio),
        conArchivos: recopilado !== null,
        archivoEsquema,
        sha256: { archivos: shaArchivos, esquema: shaEsquema },
      };
      // Lo que se escribe debe pasar el mismo esquema con el que se lee después.
      const valida = PlantillaSchema.safeParse(plantilla);
      if (!valida.success) {
        throw new ErrorWolf('plantillas.danada', 'La plantilla resultante no es válida.');
      }
      await writeFile(
        path.join(parcial, 'plantilla.json'),
        JSON.stringify(sinOrigen(plantilla), null, 2),
        'utf8',
      );
      await rename(parcial, path.join(raiz, id));
      // Lo guardó este equipo: queda registrada con la huella de su plantilla.json.
      await this.anotarRegistro(
        id,
        sha256Texto(await readFile(path.join(raiz, id, 'plantilla.json'), 'utf8')),
      );
      return plantilla;
    } catch (e) {
      await rm(parcial, { recursive: true, force: true }).catch(() => undefined);
      throw e;
    }
  }

  /** Borra la carpeta de la plantilla (y solo esa). Una dañada también se puede borrar. */
  async borrar(id: string): Promise<void> {
    const dir = this.carpeta(id);
    let info;
    try {
      info = await lstat(dir);
    } catch {
      throw new ErrorWolf('plantillas.no_existe', 'La plantilla no existe.');
    }
    // Un enlace se quita sin entrar en él.
    if (info.isSymbolicLink()) await rm(dir, { force: true });
    else await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    await this.anotarRegistro(id, null).catch(() => undefined);
  }

  /** Ruta del esquema, ya comprobada contra su huella. */
  async rutaEsquema(
    id: string,
  ): Promise<{ ruta: string; motor: MotorBd; origen: 'propia' | 'importada' }> {
    const p = await this.cargar(id);
    if (!p.archivoEsquema || !p.motorBase || !p.sha256.esquema) {
      throw new ErrorWolf('plantillas.sin_esquema', 'La plantilla no trae el esquema de una base.');
    }
    const preparada = this.preparadas.get(id)?.esquema;
    if (preparada) return { ruta: preparada, motor: p.motorBase, origen: p.origen };
    const ruta = path.join(this.carpeta(id), p.archivoEsquema);
    let info;
    try {
      info = await lstat(ruta);
    } catch {
      throw danada('falta el esquema');
    }
    if (!info.isFile() || info.size > this.limites.maxBytesEsquema)
      throw danada('el esquema no es válido');
    if ((await sha256De(ruta)) !== p.sha256.esquema) throw danada('el esquema cambió');
    return { ruta, motor: p.motorBase, origen: p.origen };
  }

  /**
   * Pone los archivos de la plantilla en `destino`, que debe existir y estar vacía. Se extraen
   * primero a una carpeta temporal (nada queda a medias en el proyecto) y se copian sin pisar.
   * Una plantilla con rutas que salen de la carpeta o con otra huella da `plantillas.danada` y no
   * escribe nada.
   */
  async restaurarArchivos(id: string, destino: string): Promise<{ archivos: number }> {
    const p = await this.cargar(id);
    if (!p.conArchivos || !p.sha256.archivos) return { archivos: 0 };
    const limites = this.limites;
    // Con `preparar` ya hecho se usa la copia verificada; si no, se verifica el original ahora.
    let zip = this.preparadas.get(id)?.zip ?? null;
    if (!zip) {
      zip = path.join(this.carpeta(id), 'archivos.zip');
      let info;
      try {
        info = await lstat(zip);
      } catch {
        throw danada('faltan los archivos');
      }
      if (!info.isFile()) throw danada('los archivos no son válidos');
      if ((await sha256De(zip)) !== p.sha256.archivos) throw danada('los archivos cambiaron');
      await revisarZip(zip, limites);
    }

    const d = await lstat(destino).catch(() => null);
    if (!d || d.isSymbolicLink() || !d.isDirectory()) {
      throw new ErrorWolf('proyectos.carpeta_invalida', 'La carpeta del proyecto no es válida.');
    }
    if ((await readdir(destino)).length > 0) {
      throw new ErrorWolf(
        'proyectos.carpeta_no_vacia',
        'La carpeta ya tiene archivos: no se copia la plantilla encima.',
      );
    }
    const tmp = this.d.rutas.tmp();
    await mkdir(tmp, { recursive: true });
    const stage = path.join(tmp, `plantilla-${randomBytes(6).toString('hex')}`);
    try {
      try {
        await extraerZip(zip, stage, {
          maxEntradas: limites.maxArchivos * 2 + 1000,
          maxBytes: limites.maxBytes * 2,
        });
      } catch (e) {
        throw e instanceof ErrorWolf && e.codigo === 'plantillas.danada'
          ? e
          : danada('no se pudieron extraer los archivos');
      }
      let n = 0;
      const contar = async (dir: string): Promise<void> => {
        for (const h of await readdir(dir, { withFileTypes: true })) {
          if (h.isDirectory()) await contar(path.join(dir, h.name));
          else n++;
        }
      };
      await contar(stage);
      for (const hijo of await readdir(stage)) {
        await cp(path.join(stage, hijo), path.join(destino, hijo), {
          recursive: true,
          force: false,
          errorOnExist: true,
          dereference: false,
        });
      }
      return { archivos: n };
    } finally {
      await rm(stage, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

import * as crypto from 'node:crypto';
import { setImmediate as ceder } from 'node:timers/promises';
import { compare as compararBcrypt, hash as hashearBcrypt } from 'bcryptjs';
import { ErrorWolf } from '../../errores';
import type { PoolBcrypt } from './poolBcrypt';

/**
 * Formatos de hash que la auditoría reconoce (D20). Cualquier otro es "desconocido": no se revisa.
 * Nada aquí escribe en logs ni devuelve la contraseña con la que se probó.
 */
export type FormatoHash =
  'bcrypt' | 'django-pbkdf2' | 'phpass' | 'md5' | 'sha1' | 'argon2' | 'desconocido';

/** Costo de bcrypt que se acepta (4 a 14: arriba, una sola comparación tardaría demasiado). */
const COSTO_MIN = 4;
const COSTO_MAX = 14;
/** Iteraciones máximas de PBKDF2 que se aceptan y largo máximo de su derivada. */
const ITERACIONES_MAX = 5_000_000;
const DERIVADA_MAX = 64;
/** Argon2: memoria (KiB), pasadas y paralelismo máximos que se aceptan. */
const ARGON_MEMORIA_MAX = 256 * 1024;
const ARGON_PASADAS_MAX = 10;
const ARGON_PARALELISMO_MAX = 16;
/** phpass: 2^n vueltas de MD5; WordPress usa 2^13. */
const PHPASS_LOG2_MIN = 4;
const PHPASS_LOG2_MAX = 16;
/** Largo máximo de un hash que se examina (descarta basura enorme sin recorrerla). */
const MAX_HASH = 512;
/** bcrypt solo mira los primeros 72 bytes de la clave. */
const MAX_BYTES_BCRYPT = 72;

const ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// `$2x$` (con el fallo histórico de crypt_blowfish) no se trata como bcrypt: su resultado no coincide.
const RE_BCRYPT = /^\$(2[aby])\$(\d{2})\$[./A-Za-z0-9]{53}$/;
const RE_DJANGO = /^pbkdf2_(sha256|sha1)\$(\d{1,9})\$([^$]{1,128})\$([A-Za-z0-9+/]+={0,2})$/;
const RE_ARGON =
  /^\$argon2(id|i|d)\$v=19\$m=(\d{1,9}),t=(\d{1,3}),p=(\d{1,3})\$([A-Za-z0-9+/]{8,})\$([A-Za-z0-9+/]{16,})$/;
const RE_PHPASS = /^\$([PH])\$([./0-9A-Za-z])([./0-9A-Za-z]{8})([./0-9A-Za-z]{22})$/;
const RE_MD5 = /^[0-9a-fA-F]{32}$/;
const RE_SHA1 = /^[0-9a-fA-F]{40}$/;

type Argon2 = (
  algoritmo: string,
  parametros: Record<string, unknown>,
  cb: (e: Error | null, derivada: Buffer) => void,
) => void;

/** `crypto.argon2` solo existe desde Node 24.7: se pide por nombre para no fallar al cargar. */
function argon2Nativo(): Argon2 | null {
  const f = (crypto as unknown as { argon2?: unknown }).argon2;
  return typeof f === 'function' ? (f as Argon2) : null;
}

interface ParamsArgon {
  algoritmo: 'argon2id' | 'argon2i' | 'argon2d';
  memoria: number;
  pasadas: number;
  paralelismo: number;
  sal: Buffer;
  etiqueta: Buffer;
}

function parsearArgon(hash: string): ParamsArgon | null {
  const m = RE_ARGON.exec(hash);
  if (!m) return null;
  const memoria = Number(m[2]);
  const pasadas = Number(m[3]);
  const paralelismo = Number(m[4]);
  if (
    memoria < 8 * paralelismo ||
    memoria > ARGON_MEMORIA_MAX ||
    pasadas < 1 ||
    pasadas > ARGON_PASADAS_MAX ||
    paralelismo < 1 ||
    paralelismo > ARGON_PARALELISMO_MAX
  ) {
    return null;
  }
  return {
    algoritmo: `argon2${m[1]}` as ParamsArgon['algoritmo'],
    memoria,
    pasadas,
    paralelismo,
    sal: Buffer.from(m[5]!, 'base64'),
    etiqueta: Buffer.from(m[6]!, 'base64'),
  };
}

function costoBcrypt(hash: string): number | null {
  const m = RE_BCRYPT.exec(hash);
  if (!m) return null;
  const c = Number(m[2]);
  return c >= COSTO_MIN && c <= COSTO_MAX ? c : null;
}

interface ParamsDjango {
  digest: 'sha256' | 'sha1';
  iteraciones: number;
  sal: string;
  derivada: Buffer;
}

function parsearDjango(hash: string): ParamsDjango | null {
  const m = RE_DJANGO.exec(hash);
  if (!m) return null;
  const iteraciones = Number(m[2]);
  if (iteraciones < 1 || iteraciones > ITERACIONES_MAX) return null;
  const derivada = Buffer.from(m[4]!, 'base64');
  if (derivada.length < 1 || derivada.length > DERIVADA_MAX) return null;
  return { digest: m[1] as ParamsDjango['digest'], iteraciones, sal: m[3]!, derivada };
}

interface ParamsPhpass {
  prefijo: 'P' | 'H';
  log2: number;
  sal: string;
}

function parsearPhpass(hash: string): ParamsPhpass | null {
  const m = RE_PHPASS.exec(hash);
  if (!m) return null;
  const log2 = ITOA64.indexOf(m[2]!);
  if (log2 < PHPASS_LOG2_MIN || log2 > PHPASS_LOG2_MAX) return null;
  return { prefijo: m[1] as 'P' | 'H', log2, sal: m[3]! };
}

/** Formato de un hash, solo por su forma (no lo prueba contra nada). */
export function formatoDe(hash: string): FormatoHash {
  if (typeof hash !== 'string' || hash.length === 0 || hash.length > MAX_HASH) return 'desconocido';
  if (costoBcrypt(hash) !== null) return 'bcrypt';
  if (parsearDjango(hash)) return 'django-pbkdf2';
  if (parsearPhpass(hash)) return 'phpass';
  if (parsearArgon(hash)) return argon2Nativo() ? 'argon2' : 'desconocido';
  if (RE_MD5.test(hash)) return 'md5';
  if (RE_SHA1.test(hash)) return 'sha1';
  return 'desconocido';
}

/**
 * Nombre del tipo de un hash que no se revisa, para decírselo al usuario (nunca el hash mismo).
 */
export function tipoNoRevisable(hash: string | null): string {
  if (hash === null || hash === '') return 'vacio';
  if (hash.startsWith('$1$')) return 'md5crypt';
  if (hash.startsWith('$5$')) return 'sha256crypt';
  if (hash.startsWith('$6$')) return 'sha512crypt';
  if (hash.startsWith('$7$')) return 'scrypt';
  if (hash.startsWith('$argon2')) return 'argon2';
  if (/^\$2[a-z]?\$/.test(hash)) return 'bcrypt_otro';
  if (hash.startsWith('pbkdf2_')) return 'pbkdf2_otro';
  if (/^\{[A-Za-z0-9-]+\}/.test(hash)) return 'ldap';
  return 'otro';
}

/** MD5 y SHA-1 sin sal: legado, se marcan como formato débil aunque la clave no sea común. */
export const esFormatoDebil = (f: FormatoHash): boolean => f === 'md5' || f === 'sha1';

const iguales = (a: Buffer, b: Buffer): boolean =>
  a.length === b.length && crypto.timingSafeEqual(a, b);

function pbkdf2(
  clave: string,
  sal: string,
  iteraciones: number,
  largo: number,
  digest: string,
): Promise<Buffer> {
  return new Promise((ok, mal) =>
    crypto.pbkdf2(clave, sal, iteraciones, largo, digest, (e, k) => (e ? mal(e) : ok(k))),
  );
}

function argon2(clave: string, p: ParamsArgon, largo: number, sal: Buffer): Promise<Buffer> {
  const f = argon2Nativo();
  if (!f) return Promise.reject(new Error('argon2 no disponible'));
  return new Promise((ok, mal) =>
    f(
      p.algoritmo,
      {
        message: Buffer.from(clave, 'utf8'),
        nonce: sal,
        parallelism: p.paralelismo,
        tagLength: largo,
        memory: p.memoria,
        passes: p.pasadas,
      },
      (e, k) => (e ? mal(e) : ok(k)),
    ),
  );
}

const resumen = (alg: 'md5' | 'sha1', clave: string): Buffer =>
  crypto.createHash(alg).update(clave, 'utf8').digest();

/** Codificación base64 propia de phpass. */
function codificarPhpass(entrada: Buffer): string {
  let salida = '';
  let i = 0;
  const n = entrada.length;
  do {
    let v = entrada[i++]!;
    salida += ITOA64[v & 0x3f];
    if (i < n) v |= entrada[i]! << 8;
    salida += ITOA64[(v >> 6) & 0x3f];
    if (i++ >= n) break;
    if (i < n) v |= entrada[i]! << 16;
    salida += ITOA64[(v >> 12) & 0x3f];
    if (i++ >= n) break;
    salida += ITOA64[(v >> 18) & 0x3f];
  } while (i < n);
  return salida;
}

function phpass(clave: string, p: ParamsPhpass, sal: string = p.sal): string {
  const pw = Buffer.from(clave, 'utf8');
  let h = crypto
    .createHash('md5')
    .update(Buffer.concat([Buffer.from(sal, 'latin1'), pw]))
    .digest();
  for (let n = 2 ** p.log2; n > 0; n--) {
    h = crypto
      .createHash('md5')
      .update(Buffer.concat([h, pw]))
      .digest();
  }
  return `$${p.prefijo}$${ITOA64[p.log2]}${sal}${codificarPhpass(h)}`;
}

/**
 * ¿El hash corresponde a esta clave? Falso si el formato no se reconoce o se pasa de los topes.
 * bcrypt va por el camino asíncrono de bcryptjs (cede el control cada ~100 ms), PBKDF2 y Argon2
 * por el hilo de trabajo de libuv.
 */
export async function coincide(hash: string, clave: string): Promise<boolean> {
  switch (formatoDe(hash)) {
    case 'bcrypt':
      return compararBcrypt(clave, hash).catch(() => false);
    case 'django-pbkdf2': {
      const p = parsearDjango(hash)!;
      const k = await pbkdf2(clave, p.sal, p.iteraciones, p.derivada.length, p.digest);
      return iguales(k, p.derivada);
    }
    case 'phpass': {
      const p = parsearPhpass(hash)!;
      return iguales(Buffer.from(phpass(clave, p)), Buffer.from(hash));
    }
    case 'argon2': {
      const p = parsearArgon(hash)!;
      const k = await argon2(clave, p, p.etiqueta.length, p.sal).catch(() => null);
      return k !== null && iguales(k, p.etiqueta);
    }
    case 'md5':
      return iguales(resumen('md5', clave), Buffer.from(hash, 'hex'));
    case 'sha1':
      return iguales(resumen('sha1', clave), Buffer.from(hash, 'hex'));
    default:
      return false;
  }
}

/** Mezcla Fisher-Yates con `crypto.randomInt`: el orden de las pruebas no es predecible. */
export function barajar<T>(lista: readonly T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export interface OpcionesCoincide {
  /** Hilos de trabajo para bcrypt; sin él, bcryptjs asíncrono en este hilo. */
  pool?: PoolBcrypt | null;
  /** Corta antes de la siguiente prueba (plazo vencido o cancelado). */
  corte?: () => boolean;
}

/**
 * ¿Alguna de las claves coincide con el hash? Solo devuelve sí o no, nunca cuál. Cede el control
 * al menos cada 20 ms; con `corte` verdadero deja de probar y lanza.
 */
export async function coincideAlguna(
  hash: string,
  claves: readonly string[],
  o: OpcionesCoincide = {},
): Promise<boolean> {
  if (formatoDe(hash) === 'bcrypt' && o.pool) {
    try {
      return await o.pool.comparar(hash, claves);
    } catch {
      if (o.corte?.()) throw new ErrorWolf('auditoria.cancelada', 'Auditoría cancelada.');
      // El hilo de trabajo falló: se sigue en este hilo.
    }
  }
  let ultimo = Date.now();
  for (const c of claves) {
    if (o.corte?.()) throw new ErrorWolf('auditoria.cancelada', 'Auditoría cancelada.');
    if (await coincide(hash, c)) return true;
    if (Date.now() - ultimo > 20) {
      await ceder();
      ultimo = Date.now();
    }
  }
  return false;
}

export interface HashNuevo {
  hash: string;
  formato: FormatoHash;
  /** El formato del hash nuevo no es el del anterior (md5 o sha1 que pasan a bcrypt). */
  cambiaFormato: boolean;
}

/** Costo de bcrypt cuando un hash de md5 o sha1 pasa a bcrypt. */
export const COSTO_BCRYPT_POR_OMISION = 10;

/**
 * Hash de una clave nueva con el mismo formato y costo que `anterior`. md5 y sha1 sin sal
 * conservan su formato (y las mayúsculas del hex) salvo que se pida `aBcrypt`.
 */
export async function hashearNueva(
  anterior: string,
  clave: string,
  opciones: { aBcrypt?: boolean } = {},
): Promise<HashNuevo> {
  const formato = formatoDe(anterior);
  if (formato === 'desconocido') {
    throw new ErrorWolf(
      'auditoria.formato_no_soportado',
      'El formato del hash actual no se puede reproducir: no se restablece.',
    );
  }
  const bcrypt = async (costo: number, prefijo: string): Promise<string> => {
    if (Buffer.byteLength(clave, 'utf8') > MAX_BYTES_BCRYPT) {
      throw new ErrorWolf(
        'auditoria.clave_larga',
        'bcrypt solo usa los primeros 72 bytes de la contraseña: elija una más corta.',
      );
    }
    const h = await hashearBcrypt(clave, costo);
    return prefijo === '2b' ? h : `$${prefijo}$${h.slice(4)}`;
  };
  switch (formato) {
    case 'bcrypt': {
      const m = RE_BCRYPT.exec(anterior)!;
      return { hash: await bcrypt(Number(m[2]), m[1]!), formato, cambiaFormato: false };
    }
    case 'django-pbkdf2': {
      const p = parsearDjango(anterior)!;
      // Como Django: 22 caracteres alfanuméricos.
      const sal = salAlfanumerica(22);
      const k = await pbkdf2(clave, sal, p.iteraciones, p.derivada.length, p.digest);
      return {
        hash: `pbkdf2_${p.digest}$${p.iteraciones}$${sal}$${k.toString('base64')}`,
        formato,
        cambiaFormato: false,
      };
    }
    case 'phpass': {
      const p = parsearPhpass(anterior)!;
      let sal = '';
      while (sal.length < 8) sal += ITOA64[crypto.randomInt(ITOA64.length)];
      return { hash: phpass(clave, p, sal), formato, cambiaFormato: false };
    }
    case 'argon2': {
      const p = parsearArgon(anterior)!;
      const sal = crypto.randomBytes(16);
      const k = await argon2(clave, p, p.etiqueta.length, sal);
      const b64 = (b: Buffer): string => b.toString('base64').replace(/=+$/, '');
      return {
        hash: `$${p.algoritmo}$v=19$m=${p.memoria},t=${p.pasadas},p=${p.paralelismo}$${b64(sal)}$${b64(k)}`,
        formato,
        cambiaFormato: false,
      };
    }
    default: {
      // md5 o sha1
      if (opciones.aBcrypt === true) {
        return {
          hash: await bcrypt(COSTO_BCRYPT_POR_OMISION, '2b'),
          formato: 'bcrypt',
          cambiaFormato: true,
        };
      }
      const hex = resumen(formato === 'md5' ? 'md5' : 'sha1', clave).toString('hex');
      // Si el hex original estaba en mayúsculas (sin una sola minúscula), se conserva así.
      const mayusculas = /[A-F]/.test(anterior) && !/[a-f]/.test(anterior);
      return { hash: mayusculas ? hex.toUpperCase() : hex, formato, cambiaFormato: false };
    }
  }
}

function salAlfanumerica(n: number): string {
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  while (s.length < n) s += a[crypto.randomInt(a.length)];
  return s;
}

import * as crypto from 'node:crypto';
import { compare as compararBcrypt, hash as hashearBcrypt } from 'bcryptjs';
import { ErrorWolf } from '../../errores';

/**
 * Formatos de hash que la auditoría reconoce (D20). Cualquier otro es "desconocido": no se revisa.
 * Nada aquí escribe en logs ni devuelve la contraseña con la que se probó.
 */
export type FormatoHash = 'bcrypt' | 'django-pbkdf2' | 'md5' | 'sha1' | 'argon2' | 'desconocido';

/** Costo de bcrypt que se acepta (4 a 14: arriba, una sola comparación tardaría demasiado). */
const COSTO_MIN = 4;
const COSTO_MAX = 14;
/** Iteraciones máximas de PBKDF2 que se aceptan. */
const ITERACIONES_MAX = 5_000_000;
/** Argon2: memoria (KiB), pasadas y paralelismo máximos que se aceptan. */
const ARGON_MEMORIA_MAX = 256 * 1024;
const ARGON_PASADAS_MAX = 10;
const ARGON_PARALELISMO_MAX = 16;
/** Largo máximo de un hash que se examina (descarta basura enorme sin recorrerla). */
const MAX_HASH = 512;
/** bcrypt solo mira los primeros 72 bytes de la clave. */
const MAX_BYTES_BCRYPT = 72;

const RE_BCRYPT = /^\$(2[abxy])\$(\d{2})\$[./A-Za-z0-9]{53}$/;
const RE_DJANGO = /^pbkdf2_(sha256|sha1)\$(\d{1,9})\$([^$]{1,128})\$([A-Za-z0-9+/]+={0,2})$/;
const RE_ARGON =
  /^\$argon2(id|i|d)\$v=19\$m=(\d{1,9}),t=(\d{1,3}),p=(\d{1,3})\$([A-Za-z0-9+/]{8,})\$([A-Za-z0-9+/]{16,})$/;
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
  return {
    digest: m[1] as ParamsDjango['digest'],
    iteraciones,
    sal: m[3]!,
    derivada: Buffer.from(m[4]!, 'base64'),
  };
}

/** Formato de un hash, solo por su forma (no lo prueba contra nada). */
export function formatoDe(hash: string): FormatoHash {
  if (typeof hash !== 'string' || hash.length === 0 || hash.length > MAX_HASH) return 'desconocido';
  if (costoBcrypt(hash) !== null) return 'bcrypt';
  if (parsearDjango(hash)) return 'django-pbkdf2';
  if (parsearArgon(hash)) return argon2Nativo() ? 'argon2' : 'desconocido';
  if (RE_MD5.test(hash)) return 'md5';
  if (RE_SHA1.test(hash)) return 'sha1';
  return 'desconocido';
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

const hex = (alg: 'md5' | 'sha1', clave: string): string =>
  crypto.createHash(alg).update(clave, 'utf8').digest('hex');

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
      if (p.derivada.length === 0) return false;
      const k = await pbkdf2(clave, p.sal, p.iteraciones, p.derivada.length, p.digest);
      return iguales(k, p.derivada);
    }
    case 'argon2': {
      const p = parsearArgon(hash)!;
      const k = await argon2(clave, p, p.etiqueta.length, p.sal).catch(() => null);
      return k !== null && iguales(k, p.etiqueta);
    }
    case 'md5':
      return hex('md5', clave) === hash.toLowerCase();
    case 'sha1':
      return hex('sha1', clave) === hash.toLowerCase();
    default:
      return false;
  }
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
 * pasan a bcrypt (la aplicación debe aceptarlo) salvo que se pida `mantenerFormato`.
 */
export async function hashearNueva(
  anterior: string,
  clave: string,
  opciones: { mantenerFormato?: boolean } = {},
): Promise<HashNuevo> {
  const formato = formatoDe(anterior);
  const sinSoporte = (): ErrorWolf =>
    new ErrorWolf(
      'auditoria.formato_no_soportado',
      'El formato del hash actual no se puede reproducir: no se restablece.',
    );
  if (formato === 'desconocido') throw sinSoporte();
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
      return {
        hash: await bcrypt(Number(m[2]), m[1]!),
        formato,
        cambiaFormato: false,
      };
    }
    case 'django-pbkdf2': {
      const p = parsearDjango(anterior)!;
      const sal = crypto
        .randomBytes(16)
        .toString('base64')
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 12);
      const k = await pbkdf2(clave, sal, p.iteraciones, p.derivada.length, p.digest);
      return {
        hash: `pbkdf2_${p.digest}$${p.iteraciones}$${sal}$${k.toString('base64')}`,
        formato,
        cambiaFormato: false,
      };
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
      if (opciones.mantenerFormato === true) {
        const alg = formato === 'md5' ? 'md5' : 'sha1';
        return { hash: hex(alg, clave), formato, cambiaFormato: false };
      }
      return {
        hash: await bcrypt(COSTO_BCRYPT_POR_OMISION, '2b'),
        formato: 'bcrypt',
        cambiaFormato: true,
      };
    }
  }
}

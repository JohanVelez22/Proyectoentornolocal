import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCb } from 'node:crypto';
import { ErrorWolf } from '../errores';

/**
 * Cifrado de la CA (y, si se incluyen, de los certificados de los sitios) dentro de un perfil
 * (D26): la clave sale de una frase que elige el usuario con **scrypt** y cifra con
 * **AES-256-GCM** (`node:crypto`, sin bibliotecas).
 *
 * Parámetros (documentados en el propio archivo, que los lleva en claro y autenticados):
 * - scrypt: N = 2^17, r = 8, p = 1, sal de 16 bytes al azar, clave de 32 bytes. Son los valores
 *   que recomienda OWASP para scrypt (memoria ≈ 128 MiB por intento: caro de probar a fuerza bruta).
 * - AES-256-GCM: IV de 12 bytes al azar, etiqueta de 16 bytes. La cabecera (formato, versión y
 *   parámetros) va como datos adicionales autenticados: cambiar un parámetro rompe la etiqueta.
 *
 * Al leer, los parámetros se acotan (N entre 2^15 y 2^20, r = 8, p = 1): un perfil manipulado no
 * puede pedir una derivación enorme para colgar la app.
 */
export const PARAMETROS_CIFRADO = {
  N: 2 ** 17,
  r: 8,
  p: 1,
  largoSal: 16,
  largoClave: 32,
  largoIv: 12,
} as const;

/** Frase mínima: sin esto una CA "cifrada" se abriría en segundos. */
export const LARGO_MINIMO_FRASE = 10;
const LARGO_MAXIMO_FRASE = 1024;

interface CabeceraCifrado {
  formato: 'wolfcore-cifrado';
  version: 1;
  kdf: { nombre: 'scrypt'; N: number; r: number; p: number; sal: string };
  cifra: { nombre: 'aes-256-gcm'; iv: string };
}

function derivar(frase: string, sal: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // maxmem: 128 * N * r bytes más un margen (el valor por omisión de Node es 32 MiB).
    scryptCb(
      frase.normalize('NFKC'),
      sal,
      PARAMETROS_CIFRADO.largoClave,
      { N, r, p, maxmem: 256 * N * r + 1024 * 1024 },
      (e, clave) => (e ? reject(e) : resolve(clave)),
    );
  });
}

export function validarFrase(frase: unknown): string {
  if (
    typeof frase !== 'string' ||
    [...frase].length < LARGO_MINIMO_FRASE ||
    frase.length > LARGO_MAXIMO_FRASE
  ) {
    throw new ErrorWolf(
      'perfiles.frase_debil',
      `La frase debe tener al menos ${LARGO_MINIMO_FRASE} caracteres.`,
      { minimo: LARGO_MINIMO_FRASE },
    );
  }
  return frase;
}

const aad = (c: CabeceraCifrado): Buffer => Buffer.from(JSON.stringify(c), 'utf8');

/** Cifra `datos` con la frase. Devuelve un JSON (cabecera + texto cifrado + etiqueta, en base64). */
export async function cifrarConFrase(datos: Buffer, frase: string): Promise<Buffer> {
  validarFrase(frase);
  const { N, r, p } = PARAMETROS_CIFRADO;
  const sal = randomBytes(PARAMETROS_CIFRADO.largoSal);
  const iv = randomBytes(PARAMETROS_CIFRADO.largoIv);
  const cabecera: CabeceraCifrado = {
    formato: 'wolfcore-cifrado',
    version: 1,
    kdf: { nombre: 'scrypt', N, r, p, sal: sal.toString('base64') },
    cifra: { nombre: 'aes-256-gcm', iv: iv.toString('base64') },
  };
  const clave = await derivar(frase, sal, N, r, p);
  const c = createCipheriv('aes-256-gcm', clave, iv);
  c.setAAD(aad(cabecera));
  const cifrado = Buffer.concat([c.update(datos), c.final()]);
  const etiqueta = c.getAuthTag();
  clave.fill(0);
  return Buffer.from(
    JSON.stringify({
      cabecera,
      datos: cifrado.toString('base64'),
      etiqueta: etiqueta.toString('base64'),
    }),
    'utf8',
  );
}

const danado = (): ErrorWolf =>
  new ErrorWolf('perfiles.danado', 'El perfil está dañado o fue modificado.');

/**
 * Descifra lo que hizo `cifrarConFrase`. Una frase equivocada (o un archivo cambiado: GCM no
 * distingue) da `perfiles.frase_incorrecta`; un archivo que ni siquiera tiene la forma, `danado`.
 */
export async function descifrarConFrase(archivo: Buffer, frase: string): Promise<Buffer> {
  if (typeof frase !== 'string' || frase.length === 0 || frase.length > LARGO_MAXIMO_FRASE) {
    throw new ErrorWolf('perfiles.frase_incorrecta', 'La frase no es correcta.');
  }
  if (archivo.length > 16 * 1024 * 1024) throw danado();
  let j: unknown;
  try {
    j = JSON.parse(archivo.toString('utf8'));
  } catch {
    throw danado();
  }
  const o = j as { cabecera?: CabeceraCifrado; datos?: unknown; etiqueta?: unknown };
  const c = o?.cabecera;
  const b64 = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9+/=]*$/.test(v);
  if (
    !c ||
    c.formato !== 'wolfcore-cifrado' ||
    c.version !== 1 ||
    c.kdf?.nombre !== 'scrypt' ||
    c.cifra?.nombre !== 'aes-256-gcm' ||
    !Number.isInteger(c.kdf.N) ||
    c.kdf.N < 2 ** 15 ||
    c.kdf.N > 2 ** 20 ||
    (c.kdf.N & (c.kdf.N - 1)) !== 0 ||
    c.kdf.r !== 8 ||
    c.kdf.p !== 1 ||
    !b64(c.kdf.sal) ||
    !b64(c.cifra.iv) ||
    !b64(o.datos) ||
    !b64(o.etiqueta)
  ) {
    throw danado();
  }
  const sal = Buffer.from(c.kdf.sal, 'base64');
  const iv = Buffer.from(c.cifra.iv, 'base64');
  const etiqueta = Buffer.from(o.etiqueta, 'base64');
  if (sal.length < 16 || iv.length !== 12 || etiqueta.length !== 16) throw danado();
  // La cabecera se vuelve a armar con solo los campos conocidos (los que se autenticaron).
  const cabecera: CabeceraCifrado = {
    formato: 'wolfcore-cifrado',
    version: 1,
    kdf: { nombre: 'scrypt', N: c.kdf.N, r: c.kdf.r, p: c.kdf.p, sal: c.kdf.sal },
    cifra: { nombre: 'aes-256-gcm', iv: c.cifra.iv },
  };
  const clave = await derivar(frase, sal, c.kdf.N, c.kdf.r, c.kdf.p);
  try {
    const d = createDecipheriv('aes-256-gcm', clave, iv);
    d.setAAD(aad(cabecera));
    d.setAuthTag(etiqueta);
    return Buffer.concat([d.update(Buffer.from(o.datos, 'base64')), d.final()]);
  } catch {
    throw new ErrorWolf('perfiles.frase_incorrecta', 'La frase no es correcta.');
  } finally {
    clave.fill(0);
  }
}

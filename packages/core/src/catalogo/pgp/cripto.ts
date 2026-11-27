import {
  constants,
  createHash,
  createPublicKey,
  publicDecrypt,
  timingSafeEqual,
  verify as verificarEd,
  type KeyObject,
} from 'node:crypto';
import { ALG_EDDSA, ALG_RSA, trailerV4, type ClaveV4, type FirmaV4 } from './paquetes';

/**
 * La parte criptográfica común a las firmas de datos y a las autofirmas del anillo: el hash v4
 * (lo firmado, la parte con hash y el trailer), los 16 bits izquierdos y la comprobación RSA
 * PKCS#1 v1.5 o Ed25519 sobre el digest.
 */

/** Algoritmos de hash de OpenPGP que se saben calcular (la política de cuáles se aceptan va aparte). */
export const NOMBRE_HASH: Readonly<Record<number, string>> = {
  2: 'sha1',
  8: 'sha256',
  9: 'sha384',
  10: 'sha512',
  11: 'sha224',
};

/** Prefijo DER de `DigestInfo` (RFC 8017 §9.2, nota 1) por algoritmo. */
const DIGEST_INFO: Readonly<Record<string, Buffer>> = {
  sha1: Buffer.from('3021300906052b0e03021a05000414', 'hex'),
  sha224: Buffer.from('302d300d06096086480165030402040500041c', 'hex'),
  sha256: Buffer.from('3031300d060960864801650304020105000420', 'hex'),
  sha384: Buffer.from('3041300d060960864801650304020205000430', 'hex'),
  sha512: Buffer.from('3051300d060960864801650304020305000440', 'hex'),
};

/** Digest v4 de una firma sobre `partes` (null si el algoritmo de hash no se conoce). */
export function digestDe(f: FirmaV4, partes: readonly Uint8Array[]): Buffer | null {
  const nombre = NOMBRE_HASH[f.algoritmoHash];
  if (!nombre) return null;
  const h = createHash(nombre);
  for (const p of partes) h.update(p);
  h.update(f.parteConHash);
  h.update(trailerV4(f.parteConHash));
  return h.digest();
}

const b64url = (b: Uint8Array): string => Buffer.from(b).toString('base64url');

export function claveNode(c: ClaveV4): KeyObject {
  const m = c.material;
  return m.tipo === 'rsa'
    ? createPublicKey({ key: { kty: 'RSA', n: b64url(m.n), e: b64url(m.e) }, format: 'jwk' })
    : createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: b64url(m.x) }, format: 'jwk' });
}

/** Rellena con ceros a la izquierda hasta `largo` (null si no cabe). */
function aLargo(v: Uint8Array, largo: number): Buffer | null {
  if (v.length > largo) return null;
  return Buffer.concat([Buffer.alloc(largo - v.length), v]);
}

/** ¿Los 16 bits izquierdos de la firma son los del digest? */
export function izquierdaCoincide(f: FirmaV4, digest: Uint8Array): boolean {
  return digest[0] === f.izquierda16[0] && digest[1] === f.izquierda16[1];
}

/**
 * ¿`f` es una firma de `clave` sobre `digest`? RSA: se recupera el bloque con la clave pública
 * (OpenSSL comprueba el relleno de tipo 1) y se compara entero con el `DigestInfo` esperado
 * (codificar y comparar, sin analizar el ASN.1 recibido). Ed25519: el digest es el mensaje.
 * Nunca lanza.
 */
export function firmaCuadra(f: FirmaV4, clave: ClaveV4, digest: Buffer): boolean {
  try {
    if (!izquierdaCoincide(f, digest) || f.algoritmoClave !== clave.algoritmo) return false;
    const nombre = NOMBRE_HASH[f.algoritmoHash];
    if (!nombre) return false;
    const m = clave.material;
    if (clave.algoritmo === ALG_RSA && m.tipo === 'rsa') {
      const s = aLargo(f.mpis[0]!, m.n.length);
      if (!s) return false;
      const recuperado = publicDecrypt(
        { key: claveNode(clave), padding: constants.RSA_PKCS1_PADDING },
        s,
      );
      const esperado = Buffer.concat([DIGEST_INFO[nombre]!, digest]);
      return recuperado.length === esperado.length && timingSafeEqual(recuperado, esperado);
    }
    if (clave.algoritmo === ALG_EDDSA && m.tipo === 'ed25519') {
      const r = aLargo(f.mpis[0]!, 32);
      const s = aLargo(f.mpis[1]!, 32);
      if (!r || !s) return false;
      return verificarEd(null, digest, claveNode(clave), Buffer.concat([r, s]));
    }
    return false;
  } catch {
    return false;
  }
}

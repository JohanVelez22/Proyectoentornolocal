import {
  createHash,
  createPublicKey,
  createVerify,
  verify as verificarEd,
  type Hash,
  type KeyObject,
  type Verify,
} from 'node:crypto';
import { esErrorWolf } from '../../errores';
import {
  ALG_EDDSA,
  ALG_RSA,
  HASH_SHA256,
  HASH_SHA512,
  leerFirma,
  leerPaquetes,
  trailerV4,
  type ClavePublica,
  type FirmaV4,
} from './paquetes';

export type CodigoFirma =
  | 'catalogo.firma_invalida'
  | 'catalogo.firma_no_soportada'
  | 'catalogo.clave_desconocida'
  | 'catalogo.firma_vencida';

export type ResultadoFirma = { ok: true; huellaClave: string; huellaPrimaria: string } | FalloFirma;

export interface FalloFirma {
  ok: false;
  codigo: CodigoFirma;
  detalle: string;
}

/** Verificación de una firma separada mientras llegan los datos firmados. */
export interface VerificacionEnCurso {
  actualizar(trozo: Uint8Array): void;
  terminar(): ResultadoFirma;
}

/** Margen para el reloj del equipo: una firma "del futuro" más allá de esto es inválida. */
export const TOLERANCIA_RELOJ_S = 24 * 60 * 60;

const NOMBRE_HASH: Readonly<Record<number, 'sha256' | 'sha512'>> = {
  [HASH_SHA256]: 'sha256',
  [HASH_SHA512]: 'sha512',
};

const fallo = (codigo: CodigoFirma, detalle: string): FalloFirma => ({
  ok: false,
  codigo,
  detalle,
});

/** Cualquier excepción del análisis o de `node:crypto` se vuelve un resultado con código. */
function comoFallo(e: unknown): FalloFirma {
  if (esErrorWolf(e) && e.codigo === 'catalogo.firma_no_soportada') {
    return fallo('catalogo.firma_no_soportada', e.message);
  }
  return fallo('catalogo.firma_invalida', e instanceof Error ? e.message : 'Firma inválida');
}

const b64url = (b: Uint8Array): string => Buffer.from(b).toString('base64url');

function claveNode(c: ClavePublica): KeyObject {
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

/**
 * Pasa los datos a texto canónico (tipo 0x01): cada LF sin CR delante se vuelve CRLF. Guarda si
 * el trozo anterior terminó en CR.
 */
function canonizador(): (t: Uint8Array) => Uint8Array {
  let crPrevio = false;
  return (t) => {
    const out = Buffer.allocUnsafe(t.length * 2);
    let n = 0;
    for (let i = 0; i < t.length; i++) {
      const b = t[i]!;
      const previo = i === 0 ? crPrevio : t[i - 1] === 0x0d;
      if (b === 0x0a && !previo) out[n++] = 0x0d;
      out[n++] = b;
    }
    if (t.length > 0) crPrevio = t[t.length - 1] === 0x0d;
    return out.subarray(0, n);
  };
}

/** Claves del anillo que corresponden al emisor de la firma. */
function candidatas(f: FirmaV4, anillo: readonly ClavePublica[]): ClavePublica[] {
  return anillo.filter((c) =>
    f.emisorHuella ? c.huella === f.emisorHuella : c.idClave === f.emisorId,
  );
}

/**
 * Empieza a verificar una firma separada OpenPGP v4 (RFC 4880/9580) contra un anillo fijado. Lo
 * que se puede decidir sin los datos (formato, versión, tipo, algoritmos, emisor) se decide aquí:
 * un fallo se devuelve sin pedir los datos. Solo:
 * - firmas v4 de documento binario (0x00) o texto canónico (0x01);
 * - hash SHA-256 o SHA-512 (SHA-1, MD5 y el resto → `firma_no_soportada`);
 * - RSA PKCS#1 v1.5 (algoritmo 1) o EdDSA Ed25519 legacy (22);
 * - un solo paquete, que sea de firma.
 */
export function iniciarVerificacion(o: {
  firma: Uint8Array;
  anillo: readonly ClavePublica[];
  ahora: Date;
}): VerificacionEnCurso | FalloFirma {
  try {
    const paquetes = leerPaquetes(o.firma);
    if (paquetes.some((p) => p.tag !== 2)) {
      return fallo('catalogo.firma_no_soportada', 'La firma trae paquetes que no son de firma');
    }
    if (paquetes.length !== 1) {
      return fallo('catalogo.firma_no_soportada', 'Se esperaba una sola firma');
    }
    const f = leerFirma(paquetes[0]!.cuerpo);
    if (f.tipo !== 0x00 && f.tipo !== 0x01) {
      return fallo('catalogo.firma_no_soportada', `Tipo de firma 0x${f.tipo.toString(16)}`);
    }
    const nombre = NOMBRE_HASH[f.algoritmoHash];
    if (!nombre) {
      return fallo('catalogo.firma_no_soportada', `Algoritmo de hash ${f.algoritmoHash}`);
    }
    if (!f.emisorId) return fallo('catalogo.clave_desconocida', 'La firma no dice su emisor');
    const delEmisor = candidatas(f, o.anillo);
    if (delEmisor.length === 0) {
      return fallo('catalogo.clave_desconocida', `Clave ${f.emisorId} fuera del anillo`);
    }
    const claves = delEmisor.filter((c) => c.firma);
    if (claves.length === 0) {
      return fallo('catalogo.clave_desconocida', 'La clave del emisor no firma datos');
    }
    if (claves.every((c) => c.algoritmo !== f.algoritmoClave)) {
      return fallo('catalogo.firma_invalida', 'El algoritmo de la firma no es el de la clave');
    }

    const hash: Hash = createHash(nombre);
    // RSA: `createVerify` aplica EMSA-PKCS1-v1_5 sobre los mismos bytes.
    const verificadores: Verify[] = claves
      .filter((c) => c.algoritmo === ALG_RSA)
      .map(() => createVerify(nombre));
    const canonizar = f.tipo === 0x01 ? canonizador() : null;
    const alimentar = (b: Uint8Array): void => {
      hash.update(b);
      for (const v of verificadores) v.update(b);
    };
    let terminada = false;
    return {
      actualizar(trozo) {
        if (terminada) throw new Error('Verificación ya terminada');
        alimentar(canonizar ? canonizar(trozo) : trozo);
      },
      terminar() {
        if (terminada) throw new Error('Verificación ya terminada');
        terminada = true;
        try {
          alimentar(f.parteConHash);
          alimentar(trailerV4(f.parteConHash));
          const digest = hash.digest();
          if (digest[0] !== f.izquierda16[0] || digest[1] !== f.izquierda16[1]) {
            return fallo('catalogo.firma_invalida', 'Los 16 bits del hash no coinciden');
          }
          let rsa = 0;
          let valida: ClavePublica | null = null;
          for (const c of claves) {
            if (c.algoritmo !== f.algoritmoClave) continue;
            const clave = claveNode(c);
            let ok = false;
            if (c.algoritmo === ALG_RSA && c.material.tipo === 'rsa') {
              const v = verificadores[rsa++]!;
              const s = aLargo(f.mpis[0]!, c.material.n.length);
              ok = s !== null && v.verify(clave, s);
            } else if (c.algoritmo === ALG_EDDSA) {
              const r = aLargo(f.mpis[0]!, 32);
              const s = aLargo(f.mpis[1]!, 32);
              ok =
                r !== null && s !== null && verificarEd(null, digest, clave, Buffer.concat([r, s]));
            }
            if (ok) {
              valida = c;
              break;
            }
          }
          if (!valida)
            return fallo('catalogo.firma_invalida', 'La firma no corresponde a los datos');
          return vigencia(f, valida, o.ahora);
        } catch (e) {
          return comoFallo(e);
        }
      },
    };
  } catch (e) {
    return comoFallo(e);
  }
}

/** Fechas de una firma que ya se comprobó criptográficamente. */
function vigencia(f: FirmaV4, c: ClavePublica, ahora: Date): ResultadoFirma {
  const ahoraS = Math.floor(ahora.getTime() / 1000);
  if (c.revocada) return fallo('catalogo.firma_invalida', `La clave ${c.huella} está revocada`);
  if (f.creacion < c.creacion) {
    return fallo('catalogo.firma_invalida', 'La firma es anterior a la clave');
  }
  if (f.creacion > ahoraS + TOLERANCIA_RELOJ_S) {
    return fallo('catalogo.firma_invalida', 'La firma tiene fecha futura');
  }
  if (f.vigencia !== null && f.creacion + f.vigencia <= ahoraS) {
    return fallo('catalogo.firma_vencida', 'La firma venció');
  }
  // Decisión: la clave debe estar vigente al firmar **y** hoy (falla cerrado; se renueva con el
  // script de actualización de claves cuando su dueño extiende el vencimiento).
  if (c.expiracion !== null && (c.expiracion <= ahoraS || c.expiracion <= f.creacion)) {
    return fallo('catalogo.firma_vencida', `La clave ${c.huella} venció`);
  }
  return { ok: true, huellaClave: c.huella, huellaPrimaria: c.huellaPrimaria };
}

/** ¿Es un resultado (fallo) y no una verificación en curso? */
export function esResultado(x: VerificacionEnCurso | FalloFirma): x is FalloFirma {
  return 'ok' in x;
}

/** Verifica una firma separada sobre datos en memoria. Nunca lanza: devuelve un código. */
export function verificarFirmaSeparada(o: {
  datos: Uint8Array;
  firma: Uint8Array;
  anillo: readonly ClavePublica[];
  ahora: Date;
}): ResultadoFirma {
  const v = iniciarVerificacion(o);
  if (esResultado(v)) return v;
  try {
    v.actualizar(o.datos);
  } catch (e) {
    return comoFallo(e);
  }
  return v.terminar();
}

import { createHash, type Hash } from 'node:crypto';
import { esErrorWolf } from '../../errores';
import { firmaCuadra, izquierdaCoincide, NOMBRE_HASH } from './cripto';
import {
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
  | 'catalogo.firma_vencida'
  | 'catalogo.reloj_atrasado';

export interface FalloFirma {
  ok: false;
  codigo: CodigoFirma;
  detalle: string;
}

export type ResultadoFirma = { ok: true; huellaClave: string; huellaPrimaria: string } | FalloFirma;

/** Verificación de una firma separada mientras llegan los datos firmados. */
export interface VerificacionEnCurso {
  actualizar(trozo: Uint8Array): void;
  terminar(): ResultadoFirma;
}

/** Opciones de una verificación. */
export interface OpcionesVerificacion {
  firma: Uint8Array;
  anillo: readonly ClavePublica[];
  ahora: Date;
  /**
   * Tipos de firma admitidos. Por defecto solo el binario (0x00): un zip o un phar nunca se
   * firman como texto. `SHASUMS256.txt` admite también texto canónico (0x01).
   */
  tipos?: readonly number[];
  /**
   * Cota contra firmas con fecha atrasada: la publicación de la versión menos un margen (si la
   * fuente la da). Una firma anterior → `firma_invalida`.
   */
  noAntesDe?: Date;
}

/** Margen para el reloj del equipo: una firma "del futuro" más allá de esto → reloj atrasado. */
export const TOLERANCIA_RELOJ_S = 24 * 60 * 60;
/** Margen entre la fecha de publicación de una versión y la de su firma. */
export const MARGEN_PUBLICACION_MS = 48 * 60 * 60 * 1000;

/** Hashes admitidos en una firma de datos: solo SHA-256 y SHA-512. */
const HASHES_DATOS = new Set([HASH_SHA256, HASH_SHA512]);

const fallo = (codigo: CodigoFirma, detalle: string): FalloFirma => ({
  ok: false,
  codigo,
  detalle,
});

/** Cualquier excepción del análisis se vuelve un resultado con código. */
function comoFallo(e: unknown): FalloFirma {
  if (esErrorWolf(e) && e.codigo === 'catalogo.firma_no_soportada') {
    return fallo('catalogo.firma_no_soportada', e.message);
  }
  return fallo('catalogo.firma_invalida', e instanceof Error ? e.message : 'Firma inválida');
}

/**
 * Texto canónico (tipo 0x01, RFC 9580 §5.2.1.2): todo fin de línea (CRLF, LF o CR suelto) pasa
 * a CRLF. Recuerda si el trozo anterior terminó en CR (ya convertido) para no duplicar el LF.
 */
function canonizador(): (t: Uint8Array) => Uint8Array {
  let crPrevio = false;
  return (t) => {
    const out = Buffer.allocUnsafe(t.length * 2);
    let n = 0;
    for (const b of t) {
      if (b === 0x0d) {
        out[n++] = 0x0d;
        out[n++] = 0x0a;
        crPrevio = true;
      } else if (b === 0x0a) {
        if (!crPrevio) {
          out[n++] = 0x0d;
          out[n++] = 0x0a;
        }
        crPrevio = false;
      } else {
        out[n++] = b;
        crPrevio = false;
      }
    }
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
 * - firmas v4 de los tipos admitidos (`tipos`, por defecto binario 0x00);
 * - hash SHA-256 o SHA-512 (SHA-1, MD5 y el resto → `firma_no_soportada`);
 * - RSA PKCS#1 v1.5 (algoritmo 1) o EdDSA Ed25519 legacy (22);
 * - un solo paquete, que sea de firma.
 */
export function iniciarVerificacion(o: OpcionesVerificacion): VerificacionEnCurso | FalloFirma {
  try {
    const tipos = o.tipos ?? [0x00];
    const paquetes = leerPaquetes(o.firma);
    if (paquetes.some((p) => p.tag !== 2)) {
      return fallo('catalogo.firma_no_soportada', 'La firma trae paquetes que no son de firma');
    }
    if (paquetes.length !== 1) {
      return fallo('catalogo.firma_no_soportada', 'Se esperaba una sola firma');
    }
    const f = leerFirma(paquetes[0]!.cuerpo);
    if (!tipos.includes(f.tipo) || (f.tipo !== 0x00 && f.tipo !== 0x01)) {
      return fallo('catalogo.firma_no_soportada', `Tipo de firma 0x${f.tipo.toString(16)}`);
    }
    const nombre = NOMBRE_HASH[f.algoritmoHash];
    if (!HASHES_DATOS.has(f.algoritmoHash) || !nombre) {
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
    const canonizar = f.tipo === 0x01 ? canonizador() : null;
    let terminada = false;
    return {
      actualizar(trozo) {
        if (terminada) throw new Error('Verificación ya terminada');
        hash.update(canonizar ? canonizar(trozo) : trozo);
      },
      terminar() {
        if (terminada) throw new Error('Verificación ya terminada');
        terminada = true;
        try {
          hash.update(f.parteConHash);
          hash.update(trailerV4(f.parteConHash));
          const digest = hash.digest();
          if (!izquierdaCoincide(f, digest)) {
            return fallo('catalogo.firma_invalida', 'Los 16 bits del hash no coinciden');
          }
          const valida = claves.find((c) => firmaCuadra(f, c, digest));
          if (!valida)
            return fallo('catalogo.firma_invalida', 'La firma no corresponde a los datos');
          return vigencia(f, valida, o.ahora, o.noAntesDe);
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
function vigencia(
  f: FirmaV4,
  c: ClavePublica,
  ahora: Date,
  noAntesDe: Date | undefined,
): ResultadoFirma {
  const ahoraS = Math.floor(ahora.getTime() / 1000);
  // La revocación es absoluta: invalida también las firmas anteriores a ella.
  if (c.revocada) return fallo('catalogo.firma_invalida', `La clave ${c.huella} está revocada`);
  if (f.creacion < c.creacion) {
    return fallo('catalogo.firma_invalida', 'La firma es anterior a la clave');
  }
  if (f.creacion > ahoraS + TOLERANCIA_RELOJ_S) {
    return fallo(
      'catalogo.reloj_atrasado',
      'La firma tiene fecha futura: revise la fecha y hora del equipo',
    );
  }
  if (noAntesDe && f.creacion * 1000 < noAntesDe.getTime()) {
    return fallo('catalogo.firma_invalida', 'La firma es anterior a la publicación de la versión');
  }
  if (f.vigencia !== null && f.creacion + f.vigencia <= ahoraS) {
    return fallo('catalogo.firma_vencida', 'La firma venció');
  }
  // Como GnuPG: basta con que la clave estuviera vigente al firmar.
  if (c.expiracion !== null && f.creacion >= c.expiracion) {
    return fallo('catalogo.firma_vencida', `La clave ${c.huella} estaba vencida al firmar`);
  }
  return { ok: true, huellaClave: c.huella, huellaPrimaria: c.huellaPrimaria };
}

/** ¿Es un fallo y no una verificación en curso? */
export function esResultado(x: VerificacionEnCurso | FalloFirma): x is FalloFirma {
  return 'ok' in x;
}

/** Verifica una firma separada sobre datos en memoria. Nunca lanza: devuelve un código. */
export function verificarFirmaSeparada(
  o: OpcionesVerificacion & { datos: Uint8Array },
): ResultadoFirma {
  const v = iniciarVerificacion(o);
  if (esResultado(v)) return v;
  try {
    v.actualizar(o.datos);
  } catch (e) {
    return comoFallo(e);
  }
  return v.terminar();
}

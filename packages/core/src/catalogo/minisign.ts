import { createHash, createPublicKey, verify as verificarEd25519 } from 'node:crypto';

/**
 * Verificación de firmas minisign (Ed25519 sobre el BLAKE2b-512 del archivo, modo "ED"), el
 * formato en que Zig firma sus descargas (`<zip>.minisig`). Solo el modo con prehash: el modo
 * antiguo ("Ed") firma el archivo entero y obligaría a tenerlo en memoria.
 *
 * Clave pública de Zig: publicada en https://ziglang.org/download/ ("Files are signed with
 * minisign using this public key").
 */
export const CLAVE_MINISIGN_ZIG = 'RWSGOq2NVecA2UPNdBUZykf1CCb147pkmdtYxgb3Ti+JO/wCYvhbAb/U';

/** Tamaño máximo de un `.minisig` (uno real pesa unos 300 bytes). */
export const MAX_MINISIG_BYTES = 4096;
const MAX_COMENTARIO = 1024;

export interface FirmaMinisign {
  idClave: Buffer;
  firma: Buffer;
  comentarioConfiable: string;
  firmaGlobal: Buffer;
}

export type FalloMinisign = { ok: false; detalle: string };
export type ResultadoMinisign = { ok: true } | FalloMinisign;

const falla = (detalle: string): FalloMinisign => ({ ok: false, detalle });

/** Base64 estricto de un largo exacto de bytes, o null. */
function base64Exacto(texto: string, bytes: number): Buffer | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(texto) || texto.length > 200) return null;
  const b = Buffer.from(texto, 'base64');
  // Una cadena no canónica (bits de relleno sin cero) no vuelve igual: se rechaza.
  return b.length === bytes && b.toString('base64') === texto ? b : null;
}

/** Interpreta el texto de un `.minisig` (cuatro líneas). */
export function leerMinisig(bytes: Uint8Array): FirmaMinisign | FalloMinisign {
  if (bytes.length > MAX_MINISIG_BYTES) return falla('La firma minisign es demasiado grande');
  const texto = Buffer.from(bytes).toString('utf8');
  const lineas = texto.split(/\r?\n/);
  while (lineas.length > 0 && lineas[lineas.length - 1] === '') lineas.pop();
  if (lineas.length !== 4) return falla('La firma minisign no tiene el formato esperado');
  const [comentario, firma, confiable, global] = lineas as [string, string, string, string];
  if (!comentario.startsWith('untrusted comment:') || comentario.length > MAX_COMENTARIO) {
    return falla('La firma minisign no tiene el formato esperado');
  }
  const PREFIJO = 'trusted comment: ';
  if (!confiable.startsWith(PREFIJO) || confiable.length > MAX_COMENTARIO) {
    return falla('La firma minisign no tiene el formato esperado');
  }
  const f = base64Exacto(firma, 74);
  const g = base64Exacto(global, 64);
  if (!f || !g) return falla('La firma minisign está mal formada');
  const algoritmo = f.subarray(0, 2).toString('latin1');
  if (algoritmo === 'Ed') return falla('Firma minisign sin prehash: no soportada');
  if (algoritmo !== 'ED') return falla('Algoritmo de firma minisign desconocido');
  return {
    idClave: f.subarray(2, 10),
    firma: f.subarray(10, 74),
    comentarioConfiable: confiable.slice(PREFIJO.length),
    firmaGlobal: g,
  };
}

/** Prefijo DER de una clave pública Ed25519 (SubjectPublicKeyInfo) de 32 bytes. */
const DER_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');

function claveEd25519(
  clave: string,
): { id: Buffer; llave: ReturnType<typeof createPublicKey> } | null {
  const b = base64Exacto(clave, 42);
  if (!b || b.subarray(0, 2).toString('latin1') !== 'Ed') return null;
  return {
    id: b.subarray(2, 10),
    llave: createPublicKey({
      key: Buffer.concat([DER_ED25519, b.subarray(10, 42)]),
      format: 'der',
      type: 'spki',
    }),
  };
}

/** BLAKE2b-512 en curso del archivo que se descarga (se alimenta por trozos). */
export function hashMinisign(): ReturnType<typeof createHash> {
  return createHash('blake2b512');
}

/** Nombre del archivo que dice el comentario confiable (`file:<nombre>` entre tabulaciones). */
export function archivoDelComentario(comentario: string): string | null {
  for (const parte of comentario.split('\t')) {
    if (parte.startsWith('file:')) return parte.slice(5);
  }
  return null;
}

/**
 * Comprueba una firma minisign del archivo cuyo BLAKE2b-512 es `digest`:
 * 1. la clave de la firma es la fijada;
 * 2. la firma del digest es válida (Ed25519);
 * 3. la firma global (firma + comentario confiable) también, de modo que el comentario no se
 *    puede cambiar;
 * 4. el comentario confiable nombra el archivo que se pidió (`nombreArchivo`).
 */
export function verificarMinisign(o: {
  clave: string;
  firma: FirmaMinisign;
  digest: Uint8Array;
  nombreArchivo: string;
}): ResultadoMinisign {
  const k = claveEd25519(o.clave);
  if (!k) return falla('La clave minisign fijada no es válida');
  if (!k.id.equals(o.firma.idClave)) return falla('La firma es de otra clave');
  if (o.digest.length !== 64) return falla('Resumen BLAKE2b-512 inválido');
  const buena = verificarEd25519(null, o.digest, k.llave, o.firma.firma);
  if (!buena) return falla('La firma no corresponde al archivo');
  const global = verificarEd25519(
    null,
    Buffer.concat([o.firma.firma, Buffer.from(o.firma.comentarioConfiable, 'utf8')]),
    k.llave,
    o.firma.firmaGlobal,
  );
  if (!global) return falla('La firma global de minisign no es válida');
  if (archivoDelComentario(o.firma.comentarioConfiable) !== o.nombreArchivo) {
    return falla('La firma es de otro archivo');
  }
  return { ok: true };
}

/** Fuentes cuyo zip trae una firma minisign (`<url>.minisig`) con su clave fijada. */
export function claveMinisignDe(v: { servicio: string }): string | null {
  return v.servicio === 'zig' ? CLAVE_MINISIGN_ZIG : null;
}

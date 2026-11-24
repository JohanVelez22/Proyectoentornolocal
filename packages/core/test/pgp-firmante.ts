import { createHash, generateKeyPairSync, sign, type KeyObject } from 'node:crypto';

/**
 * Firmante OpenPGP v4 mínimo, solo para pruebas: genera claves RSA y Ed25519 con `node:crypto`,
 * arma sus paquetes (clave, usuario y autofirma) y firma datos con opciones para fabricar casos
 * raros (otra versión, otro hash, sin fecha, vencida…). Nada de esto se usa fuera de las pruebas.
 */

export type TipoClave = 'rsa' | 'ed25519';

export interface ClavePrueba {
  tipo: TipoClave;
  privada: KeyObject;
  cuerpo: Buffer;
  huella: string;
  id: string;
  creacion: number;
}

const OID_ED25519 = Buffer.from('2b06010401da470f01', 'hex');
const HASHES: Record<number, string> = {
  1: 'md5',
  2: 'sha1',
  8: 'sha256',
  9: 'sha384',
  10: 'sha512',
};

export const be16 = (n: number): Buffer => Buffer.from([(n >> 8) & 0xff, n & 0xff]);
export const be32 = (n: number): Buffer => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
};

export function mpi(valor: Buffer): Buffer {
  let i = 0;
  while (i < valor.length && valor[i] === 0) i++;
  const v = valor.subarray(i);
  const bits = v.length === 0 ? 0 : (v.length - 1) * 8 + (32 - Math.clz32(v[0]!));
  return Buffer.concat([be16(bits), v]);
}

/** Paquete con cabecera nueva (longitud de 1, 2 o 5 bytes) o vieja. */
export function paquete(
  tag: number,
  cuerpo: Buffer,
  formato: 'nuevo' | 'viejo' | 'nuevo5' = 'nuevo',
): Buffer {
  const n = cuerpo.length;
  if (formato === 'viejo') {
    if (n < 256) return Buffer.concat([Buffer.from([0x80 | (tag << 2), n]), cuerpo]);
    if (n < 65536) return Buffer.concat([Buffer.from([0x80 | (tag << 2) | 1]), be16(n), cuerpo]);
    return Buffer.concat([Buffer.from([0x80 | (tag << 2) | 2]), be32(n), cuerpo]);
  }
  const ctb = Buffer.from([0xc0 | tag]);
  if (formato === 'nuevo5') return Buffer.concat([ctb, Buffer.from([255]), be32(n), cuerpo]);
  if (n < 192) return Buffer.concat([ctb, Buffer.from([n]), cuerpo]);
  if (n < 8384) {
    const m = n - 192;
    return Buffer.concat([ctb, Buffer.from([(m >> 8) + 192, m & 0xff]), cuerpo]);
  }
  return Buffer.concat([ctb, Buffer.from([255]), be32(n), cuerpo]);
}

export function subpaquete(tipo: number, datos: Buffer, critico = false): Buffer {
  const largo = datos.length + 1;
  const cab =
    largo < 192
      ? Buffer.from([largo])
      : Buffer.from([((largo - 192) >> 8) + 192, (largo - 192) & 0xff]);
  return Buffer.concat([cab, Buffer.from([tipo | (critico ? 0x80 : 0)]), datos]);
}

const deB64 = (s: string | undefined): Buffer => Buffer.from(s ?? '', 'base64url');

export function nuevaClave(tipo: TipoClave, creacion = 1_700_000_000): ClavePrueba {
  let privada: KeyObject;
  let material: Buffer;
  let algoritmo: number;
  if (tipo === 'rsa') {
    const par = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = par.publicKey.export({ format: 'jwk' });
    privada = par.privateKey;
    material = Buffer.concat([mpi(deB64(jwk.n)), mpi(deB64(jwk.e))]);
    algoritmo = 1;
  } else {
    const par = generateKeyPairSync('ed25519');
    const jwk = par.publicKey.export({ format: 'jwk' });
    privada = par.privateKey;
    material = Buffer.concat([
      Buffer.from([OID_ED25519.length]),
      OID_ED25519,
      mpi(Buffer.concat([Buffer.from([0x40]), deB64(jwk.x)])),
    ]);
    algoritmo = 22;
  }
  const cuerpo = Buffer.concat([
    Buffer.from([4]),
    be32(creacion),
    Buffer.from([algoritmo]),
    material,
  ]);
  const huella = createHash('sha1')
    .update(Buffer.concat([Buffer.from([0x99]), be16(cuerpo.length), cuerpo]))
    .digest('hex')
    .toUpperCase();
  return { tipo, privada, cuerpo, huella, id: huella.slice(-16), creacion };
}

export interface OpcionesFirma {
  version?: number;
  tipoFirma?: number;
  hash?: number;
  algoritmo?: number;
  /** null = sin subpaquete de creación. */
  creacion?: number | null;
  /** Subpaquete 3 (segundos desde la creación). */
  vigencia?: number;
  emisor?: 'huella' | 'id' | 'ambos' | 'ninguno';
  /** Id de emisor sin hash distinto del real. */
  idFalso?: string;
  conHash?: Buffer[];
  sinHash?: Buffer[];
  alterarIzquierda?: boolean;
  /** Para autofirmas: lo que va antes de los datos en el hash. */
  prefijo?: Buffer;
}

function canonico(d: Buffer): Buffer {
  return Buffer.from(d.toString('latin1').replace(/\r?\n/g, '\r\n'), 'latin1');
}

/** Cuerpo de un paquete de firma v4 de `clave` sobre `datos`. */
export function cuerpoFirma(clave: ClavePrueba, datos: Buffer, o: OpcionesFirma = {}): Buffer {
  const tipo = o.tipoFirma ?? 0x00;
  const hash = o.hash ?? 8;
  const algoritmo = o.algoritmo ?? (clave.tipo === 'rsa' ? 1 : 22);
  const emisor = o.emisor ?? 'ambos';
  const creacion = o.creacion === undefined ? clave.creacion + 60 : o.creacion;
  const conHash = [
    ...(creacion === null ? [] : [subpaquete(2, be32(creacion))]),
    ...(o.vigencia !== undefined ? [subpaquete(3, be32(o.vigencia))] : []),
    ...(emisor === 'huella' || emisor === 'ambos'
      ? [subpaquete(33, Buffer.concat([Buffer.from([4]), Buffer.from(clave.huella, 'hex')]))]
      : []),
    ...(o.conHash ?? []),
  ];
  const sinHash = [
    ...(emisor === 'id' || emisor === 'ambos'
      ? [subpaquete(16, Buffer.from(o.idFalso ?? clave.id, 'hex'))]
      : []),
    ...(o.sinHash ?? []),
  ];
  const ch = Buffer.concat(conHash);
  const sh = Buffer.concat(sinHash);
  const cabeza = Buffer.concat([
    Buffer.from([o.version ?? 4, tipo, algoritmo, hash]),
    be16(ch.length),
    ch,
  ]);
  const trailer = Buffer.concat([Buffer.from([0x04, 0xff]), be32(cabeza.length)]);
  const firmados = Buffer.concat([
    o.prefijo ?? Buffer.alloc(0),
    tipo === 0x01 ? canonico(datos) : datos,
    cabeza,
    trailer,
  ]);
  const nombre = HASHES[hash] ?? 'sha256';
  const digest = createHash(nombre).update(firmados).digest();
  let mpis: Buffer;
  if (clave.tipo === 'rsa') {
    mpis = mpi(sign(nombre, firmados, clave.privada));
  } else {
    const s = sign(null, digest, clave.privada);
    mpis = Buffer.concat([mpi(s.subarray(0, 32)), mpi(s.subarray(32))]);
  }
  const izquierda = Buffer.from(digest.subarray(0, 2));
  if (o.alterarIzquierda) izquierda[0] = izquierda[0]! ^ 0xff;
  return Buffer.concat([cabeza, be16(sh.length), sh, izquierda, mpis]);
}

export function firmar(clave: ClavePrueba, datos: Buffer, o: OpcionesFirma = {}): Buffer {
  return paquete(2, cuerpoFirma(clave, datos, o));
}

const conLargo = (cuerpo: Buffer): Buffer =>
  Buffer.concat([Buffer.from([0x99]), be16(cuerpo.length), cuerpo]);

/** Paquetes de una clave pública: clave, usuario y autofirma (con vencimiento e indicadores). */
export function clavePublica(
  clave: ClavePrueba,
  o: {
    usuario?: string;
    vigenciaClave?: number;
    indicadores?: number | null;
    revocada?: boolean;
    subclaves?: { clave: ClavePrueba; indicadores?: number | null; vigencia?: number }[];
  } = {},
): Buffer {
  const usuario = Buffer.from(o.usuario ?? 'Prueba <prueba@example.invalid>');
  const extra = [
    ...(o.vigenciaClave !== undefined ? [subpaquete(9, be32(o.vigenciaClave))] : []),
    ...(o.indicadores === null ? [] : [subpaquete(27, Buffer.from([o.indicadores ?? 0x03]))]),
  ];
  const prefijoUid = Buffer.concat([
    conLargo(clave.cuerpo),
    Buffer.from([0xb4]),
    be32(usuario.length),
    usuario,
  ]);
  const partes = [paquete(6, clave.cuerpo)];
  if (o.revocada) {
    partes.push(
      firmar(clave, Buffer.alloc(0), { tipoFirma: 0x20, prefijo: conLargo(clave.cuerpo) }),
    );
  }
  partes.push(
    paquete(13, usuario),
    firmar(clave, Buffer.alloc(0), { tipoFirma: 0x13, conHash: extra, prefijo: prefijoUid }),
  );
  for (const s of o.subclaves ?? []) {
    const ex = [
      ...(s.vigencia !== undefined ? [subpaquete(9, be32(s.vigencia))] : []),
      ...(s.indicadores === null ? [] : [subpaquete(27, Buffer.from([s.indicadores ?? 0x02]))]),
    ];
    partes.push(
      paquete(14, s.clave.cuerpo),
      firmar(clave, Buffer.alloc(0), {
        tipoFirma: 0x18,
        conHash: ex,
        prefijo: Buffer.concat([conLargo(clave.cuerpo), conLargo(s.clave.cuerpo)]),
      }),
    );
  }
  return Buffer.concat(partes);
}

/** CRC-24 (independiente del de producción, para fabricar armaduras). */
function crc24(b: Buffer): number {
  let crc = 0xb704ce;
  for (const x of b) {
    crc ^= x << 16;
    for (let i = 0; i < 8; i++) {
      crc <<= 1;
      if (crc & 0x1000000) crc ^= 0x1864cfb;
    }
  }
  return crc & 0xffffff;
}

export function armar(
  datos: Buffer,
  tipo: 'SIGNATURE' | 'PUBLIC KEY BLOCK' = 'SIGNATURE',
  crc: 'bien' | 'mal' | 'sin' = 'bien',
): string {
  const b64 = datos.toString('base64').match(/.{1,64}/g) ?? [];
  const c = crc24(datos) ^ (crc === 'mal' ? 1 : 0);
  const linCrc =
    crc === 'sin'
      ? []
      : [`=${Buffer.from([c >> 16, (c >> 8) & 0xff, c & 0xff]).toString('base64')}`];
  return [
    `-----BEGIN PGP ${tipo}-----`,
    'Comment: prueba',
    '',
    ...b64,
    ...linCrc,
    `-----END PGP ${tipo}-----`,
    '',
  ].join('\n');
}

/** Generador pseudoaleatorio con semilla (mulberry32) para el fuzz. */
export function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import { createHash } from 'node:crypto';
import { ErrorWolf } from '../../errores';

/**
 * Analizador mínimo de OpenPGP (RFC 4880 y RFC 9580, solo lo que usa una firma separada v4):
 * armadura ASCII con CRC24, cabeceras de paquete nuevas y viejas, paquetes de firma v4 con sus
 * subpaquetes, y claves públicas v4 RSA y EdDSA (Ed25519, forma "legacy" del algoritmo 22).
 *
 * Todo dato viene de fuera (la firma) o de un archivo fijado (los anillos): cada longitud se
 * compara con lo que queda del búfer antes de leer, y cualquier cosa rara lanza un `ErrorWolf`
 * con código (`catalogo.firma_invalida` o `catalogo.firma_no_soportada`), nunca otra excepción.
 */

/** Tamaño máximo de una entrada (una firma pesa < 1 KB; el anillo de Node, ~125 KB). */
export const MAX_ENTRADA_PGP = 4 * 1024 * 1024;
/** Paquetes máximos en una entrada. */
export const MAX_PAQUETES = 10_000;
/** Bits máximos de un MPI (RSA de 16384 bits). */
const MAX_BITS_MPI = 16_384;

export const ALG_RSA = 1;
export const ALG_EDDSA = 22;
export const HASH_SHA256 = 8;
export const HASH_SHA512 = 10;

/** OID de Ed25519 en la forma legacy (1.3.6.1.4.1.11591.15.1). */
const OID_ED25519 = Uint8Array.from([0x2b, 0x06, 0x01, 0x04, 0x01, 0xda, 0x47, 0x0f, 0x01]);

export type CodigoPgp = 'catalogo.firma_invalida' | 'catalogo.firma_no_soportada';

export function errorPgp(codigo: CodigoPgp, mensaje: string): ErrorWolf {
  return new ErrorWolf(codigo, mensaje);
}
const invalida = (m: string): ErrorWolf => errorPgp('catalogo.firma_invalida', m);
const noSoportada = (m: string): ErrorWolf => errorPgp('catalogo.firma_no_soportada', m);

export interface PaqueteOpenPgp {
  tag: number;
  cuerpo: Uint8Array;
}

const hex = (b: Uint8Array): string => Buffer.from(b).toString('hex').toUpperCase();
const be16 = (b: Uint8Array, i: number): number => (b[i]! << 8) | b[i + 1]!;
const be32 = (b: Uint8Array, i: number): number =>
  ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;

// ---------------------------------------------------------------- armadura ASCII

/** CRC-24 de la armadura (RFC 4880 §6.1). */
export function crc24(datos: Uint8Array): number {
  let crc = 0xb704ce;
  for (const byte of datos) {
    crc ^= byte << 16;
    for (let i = 0; i < 8; i++) {
      crc <<= 1;
      if (crc & 0x1000000) crc ^= 0x1864cfb;
    }
  }
  return crc & 0xffffff;
}

const INICIO = /^-----BEGIN PGP (SIGNATURE|PUBLIC KEY BLOCK)-----$/;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
const CABECERA = /^[A-Za-z][\w-]*: /;

/**
 * Quita la armadura ASCII de uno o más bloques (`SIGNATURE` o `PUBLIC KEY BLOCK`) y devuelve sus
 * bytes concatenados. El CRC24 es opcional (RFC 9580 §6.1), pero si está, debe coincidir.
 */
export function desarmar(texto: string): Uint8Array {
  const lineas = texto.split(/\r?\n/).map((l) => l.replace(/[ \t]+$/, ''));
  const partes: Uint8Array[] = [];
  let i = 0;
  while (i < lineas.length) {
    const inicio = INICIO.exec(lineas[i]!);
    i++;
    if (!inicio) continue;
    const fin = `-----END PGP ${inicio[1]}-----`;
    // Cabeceras "Clave: valor" hasta una línea vacía (puede no haber ninguna).
    while (i < lineas.length && CABECERA.test(lineas[i]!)) i++;
    if (i < lineas.length && lineas[i] === '') i++;
    let cuerpo = '';
    let crc: string | null = null;
    for (;;) {
      if (i >= lineas.length) throw invalida('Armadura sin final');
      const l = lineas[i]!;
      i++;
      if (l === fin) break;
      if (crc !== null) throw invalida('Datos después del CRC de la armadura');
      if (/^=[A-Za-z0-9+/]{4}$/.test(l)) {
        crc = l.slice(1);
        continue;
      }
      if (!BASE64.test(l)) throw invalida('Armadura con caracteres que no son base64');
      cuerpo += l;
    }
    if (cuerpo.length === 0 || cuerpo.length % 4 !== 0 || !BASE64.test(cuerpo)) {
      throw invalida('Base64 de la armadura mal formado');
    }
    const bytes = Uint8Array.from(Buffer.from(cuerpo, 'base64'));
    if (crc !== null) {
      const esperado = Buffer.from(crc, 'base64');
      const valor = (esperado[0]! << 16) | (esperado[1]! << 8) | esperado[2]!;
      if (valor !== crc24(bytes)) throw invalida('El CRC24 de la armadura no coincide');
    }
    partes.push(bytes);
  }
  if (partes.length === 0) throw invalida('No hay datos OpenPGP');
  return Uint8Array.from(Buffer.concat(partes));
}

/** Bytes binarios de una entrada que puede venir con armadura. */
export function binarioDe(datos: Uint8Array): Uint8Array {
  if (datos.length === 0) throw invalida('Firma vacía');
  if (datos.length > MAX_ENTRADA_PGP) throw invalida('Datos OpenPGP demasiado grandes');
  // Un paquete binario siempre empieza con el bit 7 en 1; la armadura es texto.
  if (datos[0]! & 0x80) return datos;
  return desarmar(Buffer.from(datos).toString('latin1'));
}

// ---------------------------------------------------------------- paquetes

/**
 * Paquetes de una entrada (binaria o con armadura). Formato nuevo (longitud de 1, 2 o 5 bytes) y
 * viejo (1, 2 o 4 bytes). Las longitudes parciales y la indeterminada no se usan en firmas ni en
 * claves: `firma_no_soportada`.
 */
export function leerPaquetes(entrada: Uint8Array): PaqueteOpenPgp[] {
  const datos = binarioDe(entrada);
  const paquetes: PaqueteOpenPgp[] = [];
  let p = 0;
  while (p < datos.length) {
    if (paquetes.length >= MAX_PAQUETES) throw invalida('Demasiados paquetes OpenPGP');
    const ctb = datos[p]!;
    if (!(ctb & 0x80)) throw invalida('Cabecera de paquete no válida');
    let tag: number;
    let largo: number;
    let cabecera: number;
    const queda = datos.length - p;
    if (ctb & 0x40) {
      tag = ctb & 0x3f;
      if (queda < 2) throw invalida('Paquete truncado');
      const o1 = datos[p + 1]!;
      if (o1 < 192) {
        largo = o1;
        cabecera = 2;
      } else if (o1 < 224) {
        if (queda < 3) throw invalida('Paquete truncado');
        largo = ((o1 - 192) << 8) + datos[p + 2]! + 192;
        cabecera = 3;
      } else if (o1 === 255) {
        if (queda < 6) throw invalida('Paquete truncado');
        largo = be32(datos, p + 2);
        cabecera = 6;
      } else {
        throw noSoportada('Longitud parcial de paquete');
      }
    } else {
      tag = (ctb >> 2) & 0x0f;
      const tipo = ctb & 0x03;
      if (tipo === 3) throw noSoportada('Paquete de longitud indeterminada');
      const n = tipo === 0 ? 1 : tipo === 1 ? 2 : 4;
      if (queda < 1 + n) throw invalida('Paquete truncado');
      largo = n === 1 ? datos[p + 1]! : n === 2 ? be16(datos, p + 1) : be32(datos, p + 1);
      cabecera = 1 + n;
    }
    if (tag === 0) throw invalida('Etiqueta de paquete reservada');
    if (largo > queda - cabecera) throw invalida('El paquete se sale de los datos');
    paquetes.push({ tag, cuerpo: datos.subarray(p + cabecera, p + cabecera + largo) });
    p += cabecera + largo;
  }
  if (paquetes.length === 0) throw invalida('No hay paquetes OpenPGP');
  return paquetes;
}

/** Lector con límites: cada lectura comprueba que queden bytes. */
class Lector {
  pos: number;
  constructor(
    readonly b: Uint8Array,
    desde = 0,
    readonly fin = b.length,
  ) {
    this.pos = desde;
  }
  get resto(): number {
    return this.fin - this.pos;
  }
  bytes(n: number): Uint8Array {
    if (n < 0 || n > this.resto) throw invalida('Datos truncados');
    const r = this.b.subarray(this.pos, this.pos + n);
    this.pos += n;
    return r;
  }
  u8(): number {
    return this.bytes(1)[0]!;
  }
  u16(): number {
    const b = this.bytes(2);
    return be16(b, 0);
  }
  u32(): number {
    const b = this.bytes(4);
    return be32(b, 0);
  }
  /** MPI canónico: el número de bits debe ser exactamente el del valor. */
  mpi(): Uint8Array {
    const bits = this.u16();
    if (bits > MAX_BITS_MPI) throw invalida('MPI demasiado grande');
    const v = this.bytes((bits + 7) >> 3);
    const real = v.length === 0 ? 0 : (v.length - 1) * 8 + (32 - Math.clz32(v[0]!));
    if (real !== bits) throw invalida('MPI no canónico');
    return v;
  }
}

// ---------------------------------------------------------------- firmas

export interface Subpaquete {
  tipo: number;
  critico: boolean;
  conHash: boolean;
  datos: Uint8Array;
}

/** Firma v4 analizada. Los tiempos son segundos Unix. */
export interface FirmaV4 {
  tipo: number;
  algoritmoClave: number;
  algoritmoHash: number;
  /** Versión, tipo, algoritmos y subpaquetes con hash: lo que entra en el hash con el trailer. */
  parteConHash: Uint8Array;
  subpaquetes: Subpaquete[];
  izquierda16: Uint8Array;
  /** RSA: [s]; EdDSA: [r, s]. */
  mpis: Uint8Array[];
  /** Subpaquete 2 (obligatorio y en el área con hash). */
  creacion: number;
  /** Segundos de validez desde la creación (subpaquete 3; null o 0 = no vence). */
  vigencia: number | null;
  /** Id de clave del emisor (16 hex en mayúsculas), del subpaquete 16 o de la huella. */
  emisorId: string | null;
  /** Huella v4 del emisor (subpaquete 33). */
  emisorHuella: string | null;
  /** Vencimiento de la clave en segundos desde su creación (subpaquete 9, con hash). */
  vigenciaClave: number | null;
  /** Indicadores de uso de la clave (subpaquete 27, con hash). */
  indicadores: number | null;
}

/**
 * Subpaquetes que se entienden. Uno crítico fuera de esta lista invalida la firma (RFC 9580
 * §5.2.3.7). Las notaciones (20) no están: una notación crítica no se puede interpretar.
 */
const SUBPAQUETES_CONOCIDOS = new Set([
  2, 3, 4, 5, 7, 9, 11, 12, 16, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38, 39,
]);

function leerSubpaquetes(l: Lector, fin: number, conHash: boolean, salida: Subpaquete[]): void {
  while (l.pos < fin) {
    const o1 = l.u8();
    let largo: number;
    if (o1 < 192) largo = o1;
    else if (o1 < 255) largo = ((o1 - 192) << 8) + l.u8() + 192;
    else largo = l.u32();
    if (largo < 1) throw invalida('Subpaquete vacío');
    if (largo > fin - l.pos) throw invalida('El subpaquete se sale del área');
    const tipoCrudo = l.u8();
    const datos = l.bytes(largo - 1);
    const tipo = tipoCrudo & 0x7f;
    const critico = (tipoCrudo & 0x80) !== 0;
    if (critico && !SUBPAQUETES_CONOCIDOS.has(tipo)) {
      throw noSoportada(`Subpaquete crítico desconocido (${tipo})`);
    }
    salida.push({ tipo, critico, conHash, datos });
  }
  if (l.pos !== fin) throw invalida('Área de subpaquetes mal formada');
}

function unico(subs: Subpaquete[], tipo: number, soloConHash: boolean): Uint8Array | null {
  const hallados = subs.filter((s) => s.tipo === tipo && (!soloConHash || s.conHash));
  if (hallados.length > 1) throw invalida(`Subpaquete ${tipo} repetido`);
  return hallados[0]?.datos ?? null;
}

function entero32(d: Uint8Array | null, nombre: string): number | null {
  if (d === null) return null;
  if (d.length !== 4) throw invalida(`Subpaquete ${nombre} de largo incorrecto`);
  return be32(d, 0);
}

/**
 * Paquete de firma (etiqueta 2). Solo v4; v3, v5 y v6 → `firma_no_soportada`. Solo se leen los
 * MPI de RSA (1) y EdDSA (22); otro algoritmo → `firma_no_soportada`.
 */
export function leerFirma(cuerpo: Uint8Array): FirmaV4 {
  const l = new Lector(cuerpo);
  const version = l.u8();
  if (version !== 4) throw noSoportada(`Firma v${version}`);
  const tipo = l.u8();
  const algoritmoClave = l.u8();
  const algoritmoHash = l.u8();
  const largoConHash = l.u16();
  if (largoConHash > l.resto) throw invalida('El área con hash se sale de la firma');
  const subpaquetes: Subpaquete[] = [];
  leerSubpaquetes(l, l.pos + largoConHash, true, subpaquetes);
  const parteConHash = cuerpo.subarray(0, l.pos);
  const largoSinHash = l.u16();
  if (largoSinHash > l.resto) throw invalida('El área sin hash se sale de la firma');
  leerSubpaquetes(l, l.pos + largoSinHash, false, subpaquetes);
  const izquierda16 = l.bytes(2);
  let mpis: Uint8Array[];
  if (algoritmoClave === ALG_RSA) mpis = [l.mpi()];
  else if (algoritmoClave === ALG_EDDSA) mpis = [l.mpi(), l.mpi()];
  else throw noSoportada(`Algoritmo de firma ${algoritmoClave}`);
  if (l.resto !== 0) throw invalida('Bytes de más al final de la firma');

  const creacion = entero32(unico(subpaquetes, 2, true), 'de creación');
  if (creacion === null) {
    if (subpaquetes.some((s) => s.tipo === 2)) throw invalida('Fecha de creación sin hash');
    throw invalida('La firma no tiene fecha de creación');
  }
  const vigencia = entero32(unico(subpaquetes, 3, true), 'de vencimiento');
  const vigenciaClave = entero32(unico(subpaquetes, 9, true), 'de vencimiento de clave');
  const flags = unico(subpaquetes, 27, true);
  const indicadores = flags === null ? null : (flags[0] ?? 0);

  // Emisor: el id (16) y la huella (33) pueden estar en cualquier área; si hay varios, coinciden.
  const ids = new Set<string>();
  const huellas = new Set<string>();
  for (const s of subpaquetes) {
    if (s.tipo === 16) {
      if (s.datos.length !== 8) throw invalida('Id de emisor de largo incorrecto');
      ids.add(hex(s.datos));
    } else if (s.tipo === 33) {
      if (s.datos.length < 1) throw invalida('Huella de emisor vacía');
      if (s.datos[0] !== 4) continue; // huella de otra versión de clave: no sirve para v4
      if (s.datos.length !== 21) throw invalida('Huella de emisor de largo incorrecto');
      huellas.add(hex(s.datos.subarray(1)));
    }
  }
  if (huellas.size > 1) throw invalida('Huellas de emisor distintas');
  const emisorHuella = [...huellas][0] ?? null;
  if (emisorHuella) ids.add(emisorHuella.slice(-16));
  if (ids.size > 1) throw invalida('El id y la huella del emisor no coinciden');
  return {
    tipo,
    algoritmoClave,
    algoritmoHash,
    parteConHash,
    subpaquetes,
    izquierda16,
    mpis,
    creacion,
    vigencia: vigencia === 0 ? null : vigencia,
    emisorId: [...ids][0] ?? null,
    emisorHuella,
    vigenciaClave: vigenciaClave === 0 ? null : vigenciaClave,
    indicadores,
  };
}

/** Trailer v4: 0x04, 0xFF y el largo de la parte con hash (RFC 4880 §5.2.4). */
export function trailerV4(parteConHash: Uint8Array): Uint8Array {
  const t = new Uint8Array(6);
  t[0] = 0x04;
  t[1] = 0xff;
  new DataView(t.buffer).setUint32(2, parteConHash.length >>> 0);
  return t;
}

// ---------------------------------------------------------------- claves

export type MaterialClave =
  { tipo: 'rsa'; n: Uint8Array; e: Uint8Array } | { tipo: 'ed25519'; x: Uint8Array };

export interface ClaveV4 {
  /** Huella v4: SHA-1 de 0x99, el largo y el cuerpo (40 hex en mayúsculas). */
  huella: string;
  idClave: string;
  creacion: number;
  algoritmo: number;
  material: MaterialClave;
  /** Cuerpo del paquete (para el hash de autofirmas y vinculaciones). */
  cuerpo: Uint8Array;
}

/** Bits mínimos de una clave RSA que se acepta. */
export const MIN_BITS_RSA = 2048;

/**
 * Clave pública o subclave v4 (etiquetas 6 y 14) RSA o EdDSA Ed25519. Otra versión, otro
 * algoritmo, otra curva o RSA de menos de 2048 bits → `firma_no_soportada`.
 */
export function leerClave(cuerpo: Uint8Array): ClaveV4 {
  const l = new Lector(cuerpo);
  const version = l.u8();
  if (version !== 4) throw noSoportada(`Clave v${version}`);
  const creacion = l.u32();
  const algoritmo = l.u8();
  let material: MaterialClave;
  if (algoritmo === ALG_RSA) {
    const n = l.mpi();
    const e = l.mpi();
    if (n.length * 8 < MIN_BITS_RSA) throw noSoportada('Clave RSA demasiado corta');
    if (e.length === 0 || e.length > 4) throw invalida('Exponente RSA fuera de rango');
    // e impar y >= 3; n impar (un módulo par no es producto de dos primos impares).
    if ((e[e.length - 1]! & 1) === 0 || (e.length === 1 && e[0]! < 3)) {
      throw invalida('Exponente RSA no válido');
    }
    if ((n[n.length - 1]! & 1) === 0) throw invalida('Módulo RSA par');
    material = { tipo: 'rsa', n, e };
  } else if (algoritmo === ALG_EDDSA) {
    const largoOid = l.u8();
    if (largoOid === 0 || largoOid === 0xff) throw invalida('OID reservado');
    const oid = l.bytes(largoOid);
    if (Buffer.compare(oid, OID_ED25519) !== 0) throw noSoportada('Curva EdDSA no soportada');
    const q = l.mpi();
    if (q.length !== 33 || q[0] !== 0x40) throw invalida('Punto Ed25519 mal formado');
    material = { tipo: 'ed25519', x: q.subarray(1) };
  } else {
    throw noSoportada(`Algoritmo de clave ${algoritmo}`);
  }
  if (l.resto !== 0) throw invalida('Bytes de más al final de la clave');
  if (cuerpo.length > 0xffff) throw invalida('Clave demasiado grande');
  const huella = createHash('sha1')
    .update(Uint8Array.from([0x99, cuerpo.length >> 8, cuerpo.length & 0xff]))
    .update(cuerpo)
    .digest('hex')
    .toUpperCase();
  return { huella, idClave: huella.slice(-16), creacion, algoritmo, material, cuerpo };
}

/**
 * Clave pública del anillo lista para verificar. La confianza viene de estar fijada en la app
 * (`claves/<fuente>.asc`), no de las autofirmas, que solo se leen (ver `anillos.ts`).
 */
export interface ClavePublica extends ClaveV4 {
  /** Huella de la clave primaria (igual a `huella` si es primaria). */
  huellaPrimaria: string;
  /** Vencimiento absoluto (segundos Unix) o null si no vence. */
  expiracion: number | null;
  /** Se puede usar para firmar datos. */
  firma: boolean;
  /** Tiene (ella o su primaria) una firma de revocación de su primaria. */
  revocada: boolean;
  /** Ids de usuario de la primaria (para el script de actualización). */
  usuarios: string[];
}

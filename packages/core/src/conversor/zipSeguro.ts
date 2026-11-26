import JSZip from 'jszip';
import { ErrorWolf } from '../errores';

/**
 * Revisión de un ZIP no confiable (docx, xlsx, pptx y odt lo son) ANTES de entregárselo a la
 * biblioteca que lo abre. Se revisa con JSZip, el MISMO analizador que usan mammoth y exceljs, y
 * sobre los mismos bytes: dos analizadores distintos pueden ver ZIP distintos en un mismo archivo
 * (JSZip salta `extraBytes` al principio y yauzl no), y entonces lo revisado no es lo que se
 * convierte. Además se rechaza todo ZIP no canónico, así hay un solo ZIP posible:
 *
 * - `PK\3\4` en la posición 0, EOCD justo al final (el largo del comentario cuadra),
 *   `cdOffset + cdSize === posEOCD`, un solo disco, sin ZIP64;
 * - tantos registros del directorio central como dice `entryCount`, y nada sobra;
 * - cada cabecera local con el mismo nombre que el directorio central, dentro de `[0, cdOffset)`
 *   y sin solaparse con otra; sin nombres repetidos, con `..`, absolutos ni cifrados;
 * - lo que declara cada entrada es verdad: se descomprime TODO con JSZip (también CRC32) con un
 *   contador de bytes reales y tope, que corta cuando se pasa;
 * - ninguna entrada trae `<!DOCTYPE` ni `<!ENTITY` (ningún documento de Office legítimo los usa y
 *   son la puerta de XXE y de la expansión de entidades), sea cual sea su extensión.
 */

export interface LimitesZipConversor {
  entradas: number;
  bytesDescomprimidos: number;
  /** Máximo de descomprimido/comprimido, solo cuando lo descomprimido pasa de `UMBRAL_PROPORCION`. */
  proporcion: number;
}

/** Por debajo de este tamaño descomprimido la proporción no se mira (un XML corto comprime mucho). */
const UMBRAL_PROPORCION = 20 * 1024 * 1024;

const peligroso = (): ErrorWolf =>
  new ErrorWolf(
    'conversor.archivo_peligroso',
    'El archivo parece un ZIP bomba o está manipulado y no se abre.',
  );

const invalido = (): ErrorWolf =>
  new ErrorWolf('conversor.archivo_invalido', 'El archivo está dañado o no es del tipo indicado.');

const ES_XML = /\.(xml|rels|vml|rdf|xsl|xslt|dtd)$/i;

/** Lo mínimo de `StreamHelper` de JSZip que se usa. */
interface FlujoJsZip {
  on(e: 'data', f: (c: Uint8Array) => void): FlujoJsZip;
  on(e: 'error', f: () => void): FlujoJsZip;
  on(e: 'end', f: () => void): FlujoJsZip;
  pause(): FlujoJsZip;
  resume(): FlujoJsZip;
}

interface Registro {
  nombre: string;
  nombreBytes: Buffer;
  comprimido: number;
  descomprimido: number;
  desplazamiento: number;
}

/** Estructura canónica del ZIP; lanza si hay algo raro. Devuelve los registros del directorio central. */
export function leerEstructura(b: Buffer, lim: LimitesZipConversor): Registro[] {
  if (b.length < 22 || b.readUInt32LE(0) !== 0x04034b50) throw invalido();
  // Se busca el EOCD igual que JSZip: la última firma desde el final.
  const desde = Math.max(0, b.length - 22 - 0xffff);
  let eocd = -1;
  for (let i = b.length - 22; i >= desde; i--) {
    if (b.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw invalido();
  const comentario = b.readUInt16LE(eocd + 20);
  if (eocd + 22 + comentario !== b.length) throw peligroso();
  const disco = b.readUInt16LE(eocd + 4);
  const discoCd = b.readUInt16LE(eocd + 6);
  const enDisco = b.readUInt16LE(eocd + 8);
  const total = b.readUInt16LE(eocd + 10);
  const cdTam = b.readUInt32LE(eocd + 12);
  const cdPos = b.readUInt32LE(eocd + 16);
  if (disco !== 0 || discoCd !== 0 || enDisco !== total) throw peligroso();
  // ZIP64: ni sus marcas ni su localizador.
  if (total === 0xffff || cdTam === 0xffffffff || cdPos === 0xffffffff) throw peligroso();
  if (eocd >= 20 && b.readUInt32LE(eocd - 20) === 0x07064b50) throw peligroso();
  if (cdPos + cdTam !== eocd) throw peligroso();
  if (total === 0 || total > lim.entradas) throw peligroso();

  const registros: Registro[] = [];
  const nombres = new Set<string>();
  let p = cdPos;
  for (let i = 0; i < total; i++) {
    if (p + 46 > eocd || b.readUInt32LE(p) !== 0x02014b50) throw peligroso();
    const flags = b.readUInt16LE(p + 8);
    const metodo = b.readUInt16LE(p + 10);
    const comprimido = b.readUInt32LE(p + 20);
    const descomprimido = b.readUInt32LE(p + 24);
    const ln = b.readUInt16LE(p + 28);
    const le = b.readUInt16LE(p + 30);
    const lc = b.readUInt16LE(p + 32);
    const discoEntrada = b.readUInt16LE(p + 34);
    const desplazamiento = b.readUInt32LE(p + 42);
    if (p + 46 + ln + le + lc > eocd) throw peligroso();
    if (
      (flags & 1) !== 0 ||
      (metodo !== 0 && metodo !== 8) ||
      discoEntrada !== 0 ||
      comprimido === 0xffffffff ||
      descomprimido === 0xffffffff ||
      desplazamiento === 0xffffffff ||
      (metodo === 0 && comprimido !== descomprimido)
    ) {
      throw peligroso();
    }
    const nombreBytes = b.subarray(p + 46, p + 46 + ln);
    const nombre = nombreBytes.toString('utf8');
    if (
      nombre === '' ||
      nombre.includes('\0') ||
      nombre.includes('\\') ||
      nombre.startsWith('/') ||
      /^[a-zA-Z]:/.test(nombre) ||
      nombre.split('/').includes('..') ||
      nombres.has(nombre)
    ) {
      throw peligroso();
    }
    nombres.add(nombre);
    registros.push({ nombre, nombreBytes, comprimido, descomprimido, desplazamiento });
    p += 46 + ln + le + lc;
  }
  if (p !== eocd) throw peligroso();

  // Cabeceras locales: mismo nombre, dentro de [0, cdPos) y sin solaparse.
  const rangos: [number, number][] = [];
  for (const r of registros) {
    const o = r.desplazamiento;
    if (o + 30 > cdPos || b.readUInt32LE(o) !== 0x04034b50) throw peligroso();
    const ln = b.readUInt16LE(o + 26);
    const le = b.readUInt16LE(o + 28);
    const inicio = o + 30 + ln + le;
    const fin = inicio + r.comprimido;
    if (inicio > cdPos || fin > cdPos) throw peligroso();
    if (!b.subarray(o + 30, o + 30 + ln).equals(r.nombreBytes)) throw peligroso();
    rangos.push([o, fin]);
  }
  rangos.sort((x, y) => x[0] - y[0]);
  if (rangos[0]![0] !== 0) throw peligroso();
  for (let i = 1; i < rangos.length; i++) {
    if (rangos[i]![0] < rangos[i - 1]![1]) throw peligroso();
  }
  return registros;
}

/** Busca `<!doctype` o `<!entity` en un flujo, sin depender del tamaño de los trozos. */
function detectorDtd(): (c: Uint8Array) => boolean {
  let cola = '';
  return (c) => {
    const texto =
      cola + Buffer.from(c.buffer, c.byteOffset, c.byteLength).toString('latin1').toLowerCase();
    cola = texto.slice(-9);
    return texto.includes('<!doctype') || texto.includes('<!entity');
  };
}

/** Descomprime una entrada con JSZip contando los bytes reales. Devuelve cuántos produjo. */
function vaciar(zip: JSZip, nombre: string, tope: number, esperado: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const archivo = zip.files[nombre];
    if (!archivo) {
      reject(peligroso());
      return;
    }
    const alerta = detectorDtd();
    const xml = ES_XML.test(nombre);
    let total = 0;
    let primero = true;
    let cerrado = false;
    const flujo = (
      archivo as unknown as { internalStream(t: 'uint8array'): FlujoJsZip }
    ).internalStream('uint8array');
    const fallar = (): void => {
      if (cerrado) return;
      cerrado = true;
      flujo.pause();
      reject(peligroso());
    };
    flujo
      .on('data', (c: Uint8Array) => {
        if (cerrado) return;
        total += c.length;
        if (total > tope || total > esperado) return fallar();
        if (xml && primero && c.length >= 2) {
          // XML en UTF-16: ningún Office lo escribe y el detector no lo vería.
          const b0 = c[0]!;
          const b1 = c[1]!;
          if ((b0 === 0xff && b1 === 0xfe) || (b0 === 0xfe && b1 === 0xff)) return fallar();
        }
        primero = false;
        if (alerta(c)) fallar();
      })
      .on('error', fallar)
      .on('end', () => {
        if (cerrado) return;
        cerrado = true;
        if (total !== esperado) reject(peligroso());
        else resolve(total);
      })
      .resume();
  });
}

/**
 * Revisa el ZIP y comprueba que trae las partes `requeridas` (si no, no es un documento de ese
 * tipo: `conversor.archivo_invalido`).
 */
export async function inspeccionarZip(
  datos: Uint8Array,
  lim: LimitesZipConversor,
  requeridas: readonly string[],
): Promise<void> {
  const b = Buffer.from(datos.buffer, datos.byteOffset, datos.byteLength);
  const registros = leerEstructura(b, lim);

  let declarados = 0;
  for (const r of registros) {
    declarados += r.descomprimido;
    if (declarados > lim.bytesDescomprimidos) throw peligroso();
    if (
      r.descomprimido > UMBRAL_PROPORCION &&
      r.descomprimido / Math.max(1, r.comprimido) > lim.proporcion
    ) {
      throw peligroso();
    }
  }
  if (declarados > UMBRAL_PROPORCION && declarados / Math.max(1, b.length) > lim.proporcion) {
    throw peligroso();
  }

  // La estructura ya es canónica: si JSZip aun así se queja (CRC, tamaños), está manipulado.
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(b, { checkCRC32: true });
  } catch {
    throw peligroso();
  }
  // JSZip tiene que ver exactamente las mismas entradas que el directorio central.
  const vistos = Object.keys(zip.files);
  if (vistos.length !== registros.length || !registros.every((r) => zip.files[r.nombre])) {
    throw peligroso();
  }

  let reales = 0;
  for (const r of registros) {
    if (r.nombre.endsWith('/')) continue;
    reales += await vaciar(zip, r.nombre, lim.bytesDescomprimidos - reales, r.descomprimido);
  }
  for (const req of requeridas) if (!zip.files[req]) throw invalido();
}

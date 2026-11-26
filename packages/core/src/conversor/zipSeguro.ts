import type { Readable } from 'node:stream';
import yauzl from 'yauzl';
import { ErrorWolf } from '../errores';

/**
 * Revisión de un ZIP no confiable (docx, xlsx, pptx y odt lo son) ANTES de entregárselo a la
 * biblioteca que lo abre. Las bibliotecas descomprimen todo en memoria, así que un ZIP bomba las
 * tumbaría. Aquí se comprueba, sobre los bytes que luego se convertirán (no se vuelve a leer el
 * archivo, así no hay carrera):
 *
 * - número de entradas y suma de los tamaños DECLARADOS (barato, falla enseguida);
 * - proporción de compresión sospechosa;
 * - que lo declarado sea verdad: cada entrada se descomprime en flujo hacia la nada con un
 *   contador (yauzl corta si produce más o menos de lo que declara), con tope total;
 * - nombres de entrada con `..` o rutas absolutas (yauzl los rechaza);
 * - XML con `<!DOCTYPE` o `<!ENTITY`: ningún documento de Office legítimo los usa y son la
 *   puerta de las entidades externas (XXE) y de la expansión de entidades. Se rechazan sin
 *   fiarse de cómo cada biblioteca los trate.
 */

export interface LimitesZipConversor {
  entradas: number;
  bytesDescomprimidos: number;
  /** Máximo de descomprimido/comprimido, solo cuando lo descomprimido pasa de `umbralProporcion`. */
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

/** Busca `<!doctype` o `<!entity` en un flujo, sin depender del tamaño de los trozos. */
function detectorDtd(): { alimentar(c: Buffer): boolean } {
  let cola = '';
  return {
    alimentar(c: Buffer): boolean {
      const texto = cola + c.toString('latin1').toLowerCase();
      cola = texto.slice(-9);
      return texto.includes('<!doctype') || texto.includes('<!entity');
    },
  };
}

function abrir(datos: Buffer): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(
      datos,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (err, zip) => (err || !zip ? reject(invalido()) : resolve(zip)),
    );
  });
}

/** Descomprime una entrada a la nada. Devuelve cuántos bytes produjo. */
function vaciar(
  zip: yauzl.ZipFile,
  entry: yauzl.Entry,
  tope: number,
  xml: boolean,
): Promise<number> {
  return new Promise((resolve, reject) => {
    zip.openReadStream(entry, (err, flujo) => {
      if (err || !flujo) return reject(peligroso());
      const s = flujo as Readable;
      const dtd = xml ? detectorDtd() : null;
      let total = 0;
      let primero = true;
      s.on('data', (c: Buffer) => {
        total += c.length;
        if (total > tope) {
          s.destroy();
          reject(peligroso());
          return;
        }
        if (dtd) {
          // XML en UTF-16: ningún Office lo escribe y el detector no lo vería.
          const bom =
            primero &&
            c.length >= 2 &&
            (c.readUInt16BE(0) === 0xfffe || c.readUInt16BE(0) === 0xfeff);
          primero = false;
          if (bom || dtd.alimentar(c)) {
            s.destroy();
            reject(peligroso());
          }
        }
      });
      s.on('error', () => reject(peligroso()));
      s.on('end', () => resolve(total));
    });
  });
}

/**
 * Revisa el ZIP y comprueba que trae las partes `requeridas` (si no, no es un documento de ese
 * tipo: `conversor.archivo_invalido`).
 */
export async function inspeccionarZip(
  datos: Buffer,
  lim: LimitesZipConversor,
  requeridas: readonly string[],
): Promise<void> {
  const zip = await abrir(datos);
  const vistas = new Set<string>();
  try {
    await new Promise<void>((resolve, reject) => {
      let entradas = 0;
      let declarados = 0;
      let reales = 0;
      zip.on('error', () => reject(peligroso()));
      zip.on('end', () => resolve());
      zip.on('entry', (entry: yauzl.Entry) => {
        void (async () => {
          try {
            entradas++;
            if (entradas > lim.entradas) throw peligroso();
            declarados += entry.uncompressedSize;
            if (declarados > lim.bytesDescomprimidos) throw peligroso();
            if (
              entry.uncompressedSize > UMBRAL_PROPORCION &&
              entry.uncompressedSize / Math.max(1, entry.compressedSize) > lim.proporcion
            ) {
              throw peligroso();
            }
            vistas.add(entry.fileName);
            if (!entry.fileName.endsWith('/')) {
              reales += await vaciar(
                zip,
                entry,
                lim.bytesDescomprimidos - reales,
                ES_XML.test(entry.fileName),
              );
            }
            zip.readEntry();
          } catch (e) {
            reject(e);
          }
        })();
      });
      zip.readEntry();
    });
  } finally {
    zip.close();
  }
  for (const r of requeridas) if (!vistas.has(r)) throw invalido();
}

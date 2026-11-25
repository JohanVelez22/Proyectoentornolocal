import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCb } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { open, rm, writeFile } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
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
 * Al leer, los parámetros se acotan (N entre 2^15 y 2^18, r = 8, p = 1): un perfil manipulado no
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

const b64 = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9+/=]*$/.test(v);

/**
 * Valida una cabecera leída de un archivo (parámetros acotados) y la vuelve a armar con solo los
 * campos conocidos, que son los que se autentican.
 */
function validarCabecera(bruta: unknown): { cabecera: CabeceraCifrado; sal: Buffer; iv: Buffer } {
  const c = bruta as CabeceraCifrado | null;
  if (
    !c ||
    c.formato !== 'wolfcore-cifrado' ||
    c.version !== 1 ||
    c.kdf?.nombre !== 'scrypt' ||
    c.cifra?.nombre !== 'aes-256-gcm' ||
    !Number.isInteger(c.kdf.N) ||
    c.kdf.N < 2 ** 15 ||
    c.kdf.N > 2 ** 18 ||
    (c.kdf.N & (c.kdf.N - 1)) !== 0 ||
    c.kdf.r !== 8 ||
    c.kdf.p !== 1 ||
    !b64(c.kdf.sal) ||
    !b64(c.cifra.iv)
  ) {
    throw danado();
  }
  const sal = Buffer.from(c.kdf.sal, 'base64');
  const iv = Buffer.from(c.cifra.iv, 'base64');
  if (sal.length < 16 || sal.length > 64 || iv.length !== 12) throw danado();
  return {
    cabecera: {
      formato: 'wolfcore-cifrado',
      version: 1,
      kdf: { nombre: 'scrypt', N: c.kdf.N, r: c.kdf.r, p: c.kdf.p, sal: c.kdf.sal },
      cifra: { nombre: 'aes-256-gcm', iv: c.cifra.iv },
    },
    sal,
    iv,
  };
}

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
  const o = j as { cabecera?: unknown; datos?: unknown; etiqueta?: unknown };
  if (!b64(o?.datos) || !b64(o?.etiqueta)) throw danado();
  const { cabecera, sal, iv } = validarCabecera(o.cabecera);
  const c = cabecera;
  const etiqueta = Buffer.from(o.etiqueta, 'base64');
  if (etiqueta.length !== 16) throw danado();
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

/* ───────────── Archivos grandes, en flujo (volcados de bases) ───────────── */

/** Primera línea de un archivo cifrado en flujo. */
const MAGIA = 'WOLFCORE-CIFRADO-1';
const MAX_CABECERA = 4096;

/**
 * Cifra y descifra archivos grandes en flujo con la misma frase (los volcados de las bases de un
 * perfil): `MAGIA\n<cabecera JSON>\n<texto cifrado><etiqueta GCM de 16 bytes>`. La clave se deriva
 * una vez por sal (scrypt es caro a propósito) y cada archivo lleva su IV; la cabecera de cada
 * archivo va como datos autenticados.
 */
export class LlaveFrase {
  private readonly claves = new Map<string, Buffer>();
  private sal: Buffer | null = null;

  constructor(private readonly frase: string) {}

  private async clave(sal: Buffer, N: number, r: number, p: number): Promise<Buffer> {
    const id = `${N}:${r}:${p}:${sal.toString('base64')}`;
    let c = this.claves.get(id);
    if (!c) {
      c = await derivar(this.frase, sal, N, r, p);
      this.claves.set(id, c);
    }
    return c;
  }

  /** Cifra `origen` en `destino` (nuevo). */
  async cifrarArchivo(origen: string, destino: string): Promise<void> {
    validarFrase(this.frase);
    const { N, r, p } = PARAMETROS_CIFRADO;
    this.sal ??= randomBytes(PARAMETROS_CIFRADO.largoSal);
    const iv = randomBytes(PARAMETROS_CIFRADO.largoIv);
    const cabecera: CabeceraCifrado = {
      formato: 'wolfcore-cifrado',
      version: 1,
      kdf: { nombre: 'scrypt', N, r, p, sal: this.sal.toString('base64') },
      cifra: { nombre: 'aes-256-gcm', iv: iv.toString('base64') },
    };
    const cifra = createCipheriv('aes-256-gcm', await this.clave(this.sal, N, r, p), iv);
    cifra.setAAD(aad(cabecera));
    const salida = createWriteStream(destino, { flags: 'wx' });
    salida.write(`${MAGIA}\n${JSON.stringify(cabecera)}\n`);
    await pipeline(createReadStream(origen), cifra, salida, { end: false });
    await new Promise<void>((resolve, reject) =>
      salida.end(cifra.getAuthTag(), (e?: Error | null) => (e ? reject(e) : resolve())),
    );
  }

  /**
   * Descifra `origen` en `destino` sin pasar de `maxBytes`. Si la etiqueta no coincide (frase
   * equivocada o archivo cambiado) borra lo escrito y lanza `perfiles.frase_incorrecta`.
   */
  async descifrarArchivo(origen: string, destino: string, maxBytes: number): Promise<void> {
    const h = await open(origen, 'r');
    let inicio: number;
    let tam: number;
    let etiqueta: Buffer;
    let cabecera: CabeceraCifrado;
    let sal: Buffer;
    let iv: Buffer;
    try {
      tam = (await h.stat()).size;
      const cab = Buffer.alloc(Math.min(MAX_CABECERA, tam));
      await h.read(cab, 0, cab.length, 0);
      const fin1 = cab.indexOf(0x0a);
      const fin2 = fin1 < 0 ? -1 : cab.indexOf(0x0a, fin1 + 1);
      if (fin2 < 0 || cab.subarray(0, fin1).toString('utf8') !== MAGIA) throw danado();
      let bruta: unknown;
      try {
        bruta = JSON.parse(cab.subarray(fin1 + 1, fin2).toString('utf8'));
      } catch {
        throw danado();
      }
      ({ cabecera, sal, iv } = validarCabecera(bruta));
      inicio = fin2 + 1;
      if (tam - inicio < 16) throw danado();
      etiqueta = Buffer.alloc(16);
      await h.read(etiqueta, 0, 16, tam - 16);
    } finally {
      await h.close();
    }
    const d = createDecipheriv(
      'aes-256-gcm',
      await this.clave(sal, cabecera.kdf.N, cabecera.kdf.r, cabecera.kdf.p),
      iv,
    );
    d.setAAD(aad(cabecera));
    d.setAuthTag(etiqueta);
    let n = 0;
    const tope = new Transform({
      transform(trozo: Buffer, _c, cb) {
        n += trozo.length;
        if (n > maxBytes) cb(danado());
        else cb(null, trozo);
      },
    });
    try {
      if (tam - 16 > inicio) {
        await pipeline(
          createReadStream(origen, { start: inicio, end: tam - 17 }),
          d,
          tope,
          createWriteStream(destino, { flags: 'wx' }),
        );
      } else {
        d.final();
        await writeFile(destino, '', { flag: 'wx' });
      }
    } catch (e) {
      await rm(destino, { force: true }).catch(() => undefined);
      if (e instanceof ErrorWolf && e.codigo === 'perfiles.danado') throw e;
      throw new ErrorWolf('perfiles.frase_incorrecta', 'La frase no es correcta.');
    }
  }

  /** Borra las claves derivadas de la memoria. */
  olvidar(): void {
    for (const c of this.claves.values()) c.fill(0);
    this.claves.clear();
  }
}

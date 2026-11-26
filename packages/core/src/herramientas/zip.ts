import { lstat, open, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import yazl from 'yazl';
import { ErrorWolf } from '../errores';
import { abrirParcial, publicarSinPisar } from './salidaNueva';

/**
 * Comprimir archivos y carpetas a un `.zip` nuevo (D33).
 *
 * Los orígenes son una entrada no confiable: pueden ser árboles enormes, con enlaces en bucle o
 * hacia fuera de la carpeta. Por eso: no se sigue ningún enlace ni unión (se omiten y se cuentan),
 * hay topes de archivos, carpetas, bytes y profundidad, los nombres dentro del ZIP salen solo de
 * los nombres de la lista de carpeta (nunca llevan `..`, rutas absolutas ni `\`) y la escritura es
 * por flujo, sin cargar nada en memoria. Cada archivo se abre justo antes de leerlo y se comprueba
 * con `fstat` que sigue siendo el mismo (dispositivo, inodo y tamaño que vio `lstat`): si lo
 * cambiaron por un enlace u otro archivo entre medias, se aborta. El ZIP se escribe en un
 * `.parcial` y se publica al final sin pisar nada (`salidaNueva`).
 */

export const LIMITES_ZIP = {
  archivos: 20_000,
  carpetas: 5_000,
  bytes: 2 * 1024 * 1024 * 1024,
  profundidad: 30,
} as const;

export type LimitesZip = { -readonly [K in keyof typeof LIMITES_ZIP]: number };

export interface OpcionesZip {
  /** Archivos y carpetas elegidos en diálogos (`RutasElegidas`). */
  origenes: string[];
  /** Ruta de un diálogo "Guardar como"; si ya existe se usa `nombre (1).zip`. */
  destino: string;
  limites?: Partial<LimitesZip>;
  /** Solo pruebas: se llama justo antes de abrir cada archivo para leerlo. */
  antesDeAbrir?: (ruta: string) => Promise<void>;
}

export interface ResultadoZip {
  /** Peso de lo que se comprimió. */
  antes: number;
  /** Peso del ZIP. */
  despues: number;
  archivo: string;
  archivos: number;
  /** Enlaces, uniones, carpetas ilegibles, archivos especiales y nombres no válidos que se saltaron. */
  omitidos: number;
}

interface Entrada {
  abs: string;
  nombre: string;
  tam: number;
  dev: bigint;
  ino: bigint;
}

const enMb = (n: number): string => `${Math.round(n / (1024 * 1024))} MB`;

/** `n.txt` → `n (2).txt` cuando dos orígenes se llaman igual. */
function nombreUnico(nombre: string, usados: Set<string>): string {
  const { name, ext } = path.parse(nombre);
  let candidato = nombre;
  for (let n = 2; usados.has(candidato.toLowerCase()); n++) candidato = `${name} (${n})${ext}`;
  usados.add(candidato.toLowerCase());
  return candidato;
}

/**
 * Un nombre con `\` es un separador para quien abra el ZIP en Windows (en POSIX sí es un nombre
 * válido): no entra, para que no salga de su carpeta al descomprimir.
 */
const nombreValido = (n: string): boolean =>
  n !== '' && n !== '.' && n !== '..' && !n.includes('\\');

async function reunir(
  origenes: string[],
  destino: string,
  lim: LimitesZip,
): Promise<{ entradas: Entrada[]; omitidos: number }> {
  const entradas: Entrada[] = [];
  const usados = new Set<string>();
  let omitidos = 0;
  let bytes = 0;
  let carpetas = 0;
  const destinoAbs = path.resolve(destino);

  const agregar = (abs: string, nombre: string, st: { size: bigint; dev: bigint; ino: bigint }) => {
    if (path.resolve(abs) === destinoAbs) {
      omitidos++;
      return;
    }
    if (entradas.length >= lim.archivos) {
      throw new ErrorWolf(
        'herramientas.zip_demasiados',
        'Hay demasiados archivos para comprimir.',
        {
          maximo: lim.archivos,
        },
      );
    }
    const tam = Number(st.size);
    bytes += tam;
    if (bytes > lim.bytes) {
      throw new ErrorWolf('herramientas.zip_grande', 'Lo que se quiere comprimir pesa demasiado.', {
        maximo: enMb(lim.bytes),
      });
    }
    entradas.push({ abs, nombre, tam, dev: st.dev, ino: st.ino });
  };

  const recorrer = async (carpeta: string, prefijo: string, nivel: number): Promise<void> => {
    if (nivel > lim.profundidad) {
      omitidos++;
      return;
    }
    if (++carpetas > lim.carpetas) {
      throw new ErrorWolf(
        'herramientas.zip_demasiados',
        'Hay demasiadas carpetas para comprimir.',
        {
          maximo: lim.carpetas,
        },
      );
    }
    let hijos;
    try {
      hijos = await readdir(carpeta, { withFileTypes: true });
    } catch {
      omitidos++;
      return;
    }
    for (const h of hijos) {
      if (!nombreValido(h.name)) {
        omitidos++;
        continue;
      }
      const abs = path.join(carpeta, h.name);
      if (h.isSymbolicLink()) {
        omitidos++;
      } else if (h.isDirectory()) {
        await recorrer(abs, `${prefijo}/${h.name}`, nivel + 1);
      } else if (h.isFile()) {
        let st;
        try {
          st = await lstat(abs, { bigint: true });
        } catch {
          omitidos++;
          continue;
        }
        if (!st.isFile()) {
          omitidos++;
          continue;
        }
        agregar(abs, `${prefijo}/${h.name}`, st);
      } else {
        omitidos++;
      }
    }
  };

  for (const origen of origenes) {
    let st;
    try {
      st = await lstat(origen, { bigint: true });
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) {
      omitidos++;
      continue;
    }
    const base = path.basename(origen);
    if (!nombreValido(base)) {
      omitidos++;
      continue;
    }
    if (st.isFile()) {
      agregar(origen, nombreUnico(base, usados), st);
    } else if (st.isDirectory()) {
      await recorrer(origen, nombreUnico(base, usados), 1);
    } else {
      omitidos++;
    }
  }
  return { entradas, omitidos };
}

/**
 * Flujo perezoso del archivo: se abre al llegar su turno (no se mantienen miles de descriptores) y
 * se comprueba que es el mismo que vio el recorrido.
 */
function lectura(e: Entrada, antes?: (ruta: string) => Promise<void>): Readable {
  async function* leer(): AsyncGenerator<Buffer> {
    await antes?.(e.abs);
    const f = await open(e.abs, 'r');
    try {
      const st = await f.stat({ bigint: true });
      if (!st.isFile() || st.size !== BigInt(e.tam) || st.ino !== e.ino || st.dev !== e.dev) {
        throw new ErrorWolf(
          'herramientas.zip_cambio',
          'Un archivo cambió mientras se comprimía; vuelva a intentarlo.',
        );
      }
      if (e.tam === 0) return;
      for await (const trozo of f.createReadStream({
        autoClose: false,
        start: 0,
        end: e.tam - 1,
      })) {
        yield trozo as Buffer;
      }
    } finally {
      await f.close().catch(() => undefined);
    }
  }
  return Readable.from(leer());
}

export async function comprimirZip(o: OpcionesZip): Promise<ResultadoZip> {
  const lim: LimitesZip = { ...LIMITES_ZIP, ...o.limites };
  const { entradas, omitidos } = await reunir(o.origenes, o.destino, lim);
  if (entradas.length === 0) {
    throw new ErrorWolf('herramientas.zip_sin_archivos', 'No hay archivos para comprimir.');
  }

  const zip = new yazl.ZipFile();
  // Un archivo que cambió o dejó de leerse a mitad: el error del ZipFile corta el flujo de salida
  // y `pipeline` lo recibe (si no, quedaría esperando para siempre).
  zip.on('error', (e: Error) => (zip.outputStream as unknown as Readable).destroy(e));
  for (const e of entradas) {
    const entrada = lectura(e, o.antesDeAbrir);
    entrada.on('error', (err: Error) => zip.emit('error', err));
    zip.addReadStream(entrada, e.nombre, { size: e.tam });
  }
  zip.end();

  const { parcial, handle } = await abrirParcial(o.destino);
  let ruta: string;
  try {
    await pipeline(zip.outputStream, handle.createWriteStream());
    ruta = await publicarSinPisar(parcial, o.destino);
  } catch (e) {
    await handle.close().catch(() => undefined);
    await rm(parcial, { force: true }).catch(() => undefined);
    throw e;
  }
  return {
    antes: entradas.reduce((s, e) => s + e.tam, 0),
    despues: (await stat(ruta)).size,
    archivo: ruta,
    archivos: entradas.length,
    omitidos,
  };
}

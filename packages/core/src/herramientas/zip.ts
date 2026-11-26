import { readdir, lstat, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import yazl from 'yazl';
import { ErrorWolf } from '../errores';
import { abrirNuevo } from './salidaNueva';

/**
 * Comprimir archivos y carpetas a un `.zip` nuevo (D33).
 *
 * Los orígenes son una entrada no confiable: pueden ser árboles enormes, con enlaces en bucle o
 * hacia fuera de la carpeta. Por eso: no se sigue ningún enlace ni unión (se omiten y se cuentan),
 * hay topes de archivos, de bytes y de profundidad, los nombres dentro del ZIP salen solo de los
 * nombres de la lista de carpeta (nunca llevan `..` ni rutas absolutas) y la escritura es por
 * flujo, sin cargar nada en memoria. El destino nunca se pisa (`salidaNueva`).
 */

export const LIMITES_ZIP = {
  archivos: 20_000,
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
}

export interface ResultadoZip {
  /** Peso de lo que se comprimió. */
  antes: number;
  /** Peso del ZIP. */
  despues: number;
  archivo: string;
  archivos: number;
  /** Enlaces, uniones y archivos especiales que se saltaron. */
  omitidos: number;
}

interface Entrada {
  abs: string;
  nombre: string;
  tam: number;
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

async function reunir(
  origenes: string[],
  destino: string,
  lim: LimitesZip,
): Promise<{ entradas: Entrada[]; omitidos: number }> {
  const entradas: Entrada[] = [];
  const usados = new Set<string>();
  let omitidos = 0;
  let bytes = 0;
  const destinoAbs = path.resolve(destino);

  const agregar = (abs: string, nombre: string, tam: number): void => {
    if (path.resolve(abs) === destinoAbs) return;
    if (entradas.length >= lim.archivos) {
      throw new ErrorWolf(
        'herramientas.zip_demasiados',
        'Hay demasiados archivos para comprimir.',
        {
          maximo: lim.archivos,
        },
      );
    }
    bytes += tam;
    if (bytes > lim.bytes) {
      throw new ErrorWolf('herramientas.zip_grande', 'Lo que se quiere comprimir pesa demasiado.', {
        maximo: enMb(lim.bytes),
      });
    }
    entradas.push({ abs, nombre, tam });
  };

  const recorrer = async (carpeta: string, prefijo: string, nivel: number): Promise<void> => {
    if (nivel > lim.profundidad) {
      omitidos++;
      return;
    }
    let hijos;
    try {
      hijos = await readdir(carpeta, { withFileTypes: true });
    } catch {
      omitidos++;
      return;
    }
    for (const h of hijos) {
      const abs = path.join(carpeta, h.name);
      if (h.isSymbolicLink()) {
        omitidos++;
      } else if (h.isDirectory()) {
        await recorrer(abs, `${prefijo}/${h.name}`, nivel + 1);
      } else if (h.isFile()) {
        let tam: number;
        try {
          tam = (await lstat(abs)).size;
        } catch {
          omitidos++;
          continue;
        }
        agregar(abs, `${prefijo}/${h.name}`, tam);
      } else {
        omitidos++;
      }
    }
  };

  for (const origen of origenes) {
    let st;
    try {
      st = await lstat(origen);
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) {
      omitidos++;
      continue;
    }
    const base = path.basename(origen);
    if (!base) continue;
    if (st.isFile()) {
      agregar(origen, nombreUnico(base, usados), st.size);
    } else if (st.isDirectory()) {
      await recorrer(origen, nombreUnico(base, usados), 1);
    } else {
      omitidos++;
    }
  }
  return { entradas, omitidos };
}

export async function comprimirZip(o: OpcionesZip): Promise<ResultadoZip> {
  const lim: LimitesZip = { ...LIMITES_ZIP, ...o.limites };
  const { entradas, omitidos } = await reunir(o.origenes, o.destino, lim);
  if (entradas.length === 0) {
    throw new ErrorWolf('herramientas.zip_sin_archivos', 'No hay archivos para comprimir.');
  }

  const zip = new yazl.ZipFile();
  // Un archivo que se borró o dejó de leerse a mitad: el error del ZipFile corta el flujo de
  // salida y `pipeline` lo recibe (si no, quedaría esperando para siempre).
  zip.on('error', (e: Error) => (zip.outputStream as unknown as Readable).destroy(e));
  for (const e of entradas) zip.addFile(e.abs, e.nombre);
  zip.end();

  const { ruta, handle } = await abrirNuevo(o.destino);
  try {
    await pipeline(zip.outputStream, handle.createWriteStream());
  } catch (e) {
    await handle.close().catch(() => undefined);
    await rm(ruta, { force: true }).catch(() => undefined);
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

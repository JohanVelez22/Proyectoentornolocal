import { existsSync } from 'node:fs';
import { cp, lstat, readdir, rename, statfs } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { IdInstancia } from '../tipos';

/**
 * Respaldo lógico de las bases de una instancia (MySQL, MariaDB y PostgreSQL, con
 * `Respaldos`). Lo arma el núcleo; en las pruebas, uno falso.
 */
export interface OperacionesRespaldo {
  /** Bases de la instancia (encendida), sin las del sistema. */
  listarBases(id: IdInstancia): Promise<string[]>;
  /** Vuelca `base` en `carpeta`; devuelve el archivo. */
  respaldar(id: IdInstancia, base: string, carpeta: string): Promise<string>;
  /** Restaura `archivo` en la base `base` (vacía) de la instancia. */
  restaurar(id: IdInstancia, archivo: string, base: string): Promise<void>;
}

/** Motores con volcado lógico (`Respaldos`); el resto solo tiene la copia en frío. */
export const CON_VOLCADO = ['mysql', 'mariadb', 'postgresql'] as const;

/** Margen libre que se deja en el disco además de lo que ocupa la copia. */
export const MARGEN_LIBRE_BYTES = 256 * 1024 * 1024;

/** Sello de fecha para nombres de carpeta (sin `:`), p. ej. 20261123-175400. */
export function selloFecha(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Bytes y archivos de una carpeta (sin seguir enlaces). */
export async function medirCarpeta(carpeta: string): Promise<{ bytes: number; archivos: number }> {
  let bytes = 0;
  let archivos = 0;
  const pendientes = [carpeta];
  while (pendientes.length > 0) {
    const actual = pendientes.pop()!;
    for (const e of await readdir(actual, { withFileTypes: true })) {
      const ruta = path.join(actual, e.name);
      if (e.isDirectory()) pendientes.push(ruta);
      else if (e.isFile()) {
        bytes += (await lstat(ruta)).size;
        archivos += 1;
      }
    }
  }
  return { bytes, archivos };
}

export interface FsCopia {
  espacioLibre(carpeta: string): Promise<number>;
  copiar(de: string, a: string): Promise<void>;
}

export const fsCopiaReal: FsCopia = {
  async espacioLibre(carpeta) {
    const s = await statfs(carpeta);
    return Number(s.bavail) * Number(s.bsize);
  },
  copiar: (de, a) => cp(de, a, { recursive: true, errorOnExist: true, force: false }),
};

/**
 * Copia en frío de `origen` (el servicio ya está detenido) en `destino`, que no debe existir.
 * Antes mide la carpeta y comprueba el espacio libre; después compara tamaño y número de
 * archivos. Si algo falla lanza sin tocar `origen` (una copia a medias queda para revisarla a
 * mano: nunca se borra nada de `data/`).
 */
export async function copiaEnFrio(
  origen: string,
  destino: string,
  fs: FsCopia = fsCopiaReal,
): Promise<{ bytes: number; archivos: number }> {
  if (existsSync(destino)) {
    throw new ErrorWolf(
      'servicios.respaldo_fallo',
      `Ya existe la carpeta de respaldo ${destino}.`,
      {
        nombre: path.basename(destino),
      },
    );
  }
  const medida = await medirCarpeta(origen);
  const libre = await fs.espacioLibre(path.dirname(destino));
  if (libre < medida.bytes + MARGEN_LIBRE_BYTES) {
    throw new ErrorWolf(
      'servicios.espacio_insuficiente',
      `No hay espacio para copiar los datos: hacen falta ${Math.ceil((medida.bytes + MARGEN_LIBRE_BYTES) / 1048576)} MB y quedan ${Math.floor(libre / 1048576)} MB libres.`,
      {
        necesarios: Math.ceil((medida.bytes + MARGEN_LIBRE_BYTES) / 1048576),
        libres: Math.floor(libre / 1048576),
      },
    );
  }
  await fs.copiar(origen, destino);
  const copia = await medirCarpeta(destino);
  if (copia.bytes !== medida.bytes || copia.archivos !== medida.archivos) {
    throw new ErrorWolf(
      'servicios.respaldo_fallo',
      `La copia de los datos quedó incompleta (${copia.archivos}/${medida.archivos} archivos).`,
      { nombre: path.basename(origen) },
    );
  }
  return medida;
}

/**
 * Vuelta atrás de los datos tras un arranque fallido: la carpeta que tocó la versión nueva se
 * aparta (`<clave>.fallida-<fecha>`, nunca se borra) y la copia en frío se copia de nuevo en
 * su sitio (la copia queda intacta).
 */
export async function devolverCopia(
  carpeta: string,
  copia: string,
  sello: string,
  fs: FsCopia = fsCopiaReal,
): Promise<string | null> {
  let apartada: string | null = null;
  if (existsSync(carpeta)) {
    apartada = `${carpeta}.fallida-${sello}`;
    await rename(carpeta, apartada);
  }
  await fs.copiar(copia, carpeta);
  return apartada;
}

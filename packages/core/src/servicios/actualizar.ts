import { createReadStream, existsSync } from 'node:fs';
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
  /** Restaura `archivo` en la base `base` (vacía) de la instancia; devuelve sus advertencias. */
  restaurar(id: IdInstancia, archivo: string, base: string): Promise<string[] | void>;
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

/** La devolución de la copia no se pudo completar: no se debe arrancar nada encima. */
export class ErrorDevolucion extends Error {
  constructor(
    mensaje: string,
    /** Dónde quedaron los datos que tocó la versión nueva (apartados o aún en su sitio). */
    readonly fallida: string,
  ) {
    super(mensaje);
  }
}

/**
 * Vuelta atrás de los datos tras un arranque fallido, sin dejar nunca la carpeta a medias:
 * 1. copia el respaldo en `<clave>.restaurando-<fecha>` y lo verifica (tamaño y archivos);
 * 2. solo entonces aparta la carpeta que tocó la versión nueva (`<clave>.fallida-<fecha>`,
 *    nunca se borra) y pone la copia en su sitio con un `rename`.
 * Si algo falla lanza `ErrorDevolucion` con la ruta de los datos tocados. El respaldo queda
 * intacto. Devuelve la carpeta apartada (null si no había).
 */
export async function devolverCopia(
  carpeta: string,
  copia: string,
  sello: string,
  fs: FsCopia = fsCopiaReal,
): Promise<string | null> {
  const temporal = `${carpeta}.restaurando-${sello}`;
  const apartada = `${carpeta}.fallida-${sello}`;
  try {
    const esperado = await medirCarpeta(copia);
    await fs.copiar(copia, temporal);
    const copiado = await medirCarpeta(temporal);
    if (copiado.bytes !== esperado.bytes || copiado.archivos !== esperado.archivos) {
      throw new Error(
        `la copia quedó incompleta (${copiado.archivos}/${esperado.archivos} archivos)`,
      );
    }
  } catch (e) {
    throw new ErrorDevolucion(e instanceof Error ? e.message : String(e), carpeta);
  }
  let movida = false;
  try {
    if (existsSync(carpeta)) {
      await rename(carpeta, apartada);
      movida = true;
    }
    await rename(temporal, carpeta);
  } catch (e) {
    throw new ErrorDevolucion(
      e instanceof Error ? e.message : String(e),
      movida ? apartada : carpeta,
    );
  }
  return movida ? apartada : null;
}

/** ¿El volcado de MySQL/MariaDB trae objetos con DEFINER? (se lee en flujo, sin cargarlo). */
export async function conDefiner(archivo: string): Promise<boolean> {
  let cola = '';
  for await (const trozo of createReadStream(archivo, { encoding: 'utf8' })) {
    const texto = cola + (trozo as string);
    if (/DEFINER\s*=/i.test(texto)) return true;
    cola = texto.slice(-32);
  }
  return false;
}

/** Copias que deja la actualización junto a las carpetas de datos. */
export type TipoRespaldoDatos = 'respaldo' | 'volcados' | 'fallida' | 'restaurando' | 'copia';

export interface RespaldoDatos {
  servicio: string;
  clave: string;
  tipo: TipoRespaldoDatos;
  /** Sello de fecha de la carpeta (AAAAMMDD-HHmmss). */
  sello: string;
  carpeta: string;
  bytes: number;
  archivos: number;
}

const RE_RESPALDO_DATOS =
  /^([0-9a-z][0-9a-z.]{0,15}?)\.(respaldo|fallida|restaurando|copia)-(\d{8}-\d{6})(\.volcados)?$/;

/** Respaldos, volcados y carpetas fallidas de `data/<servicio>/` (con su tamaño). */
export async function listarRespaldosDatos(
  base: string,
  servicios: readonly string[],
): Promise<RespaldoDatos[]> {
  const res: RespaldoDatos[] = [];
  for (const servicio of servicios) {
    const dir = path.join(base, 'data', servicio);
    let nombres: string[];
    try {
      nombres = (await readdir(dir, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      continue;
    }
    for (const nombre of nombres) {
      const m = RE_RESPALDO_DATOS.exec(nombre);
      if (!m || m[1]!.includes('..')) continue;
      const tipo: TipoRespaldoDatos = m[4] ? 'volcados' : (m[2] as TipoRespaldoDatos);
      const carpeta = path.join(dir, nombre);
      const medida = await medirCarpeta(carpeta);
      res.push({ servicio, clave: m[1]!, tipo, sello: m[3]!, carpeta, ...medida });
    }
  }
  return res.sort(
    (a, b) =>
      a.servicio.localeCompare(b.servicio) ||
      a.clave.localeCompare(b.clave) ||
      a.tipo.localeCompare(b.tipo) ||
      a.sello.localeCompare(b.sello),
  );
}

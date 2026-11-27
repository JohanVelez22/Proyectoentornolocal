import { lstat, opendir } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf, type DatosErrorWolf } from '../errores';

/**
 * Uso del disco (D51), parte que corre en el proceso de trabajo (un `utilityProcess` en la
 * aplicación). SOLO LEE: recorre con `opendir` y `lstat` (nunca abre un archivo, así que no ve su
 * contenido: solo nombres y tamaños) y no importa ninguna función de escritura del sistema de
 * archivos (lo vigila una prueba).
 *
 * - No sigue enlaces simbólicos ni uniones de Windows (el `lstat` y el `Dirent` los dan como
 *   enlaces): pesan 0 y se marcan. Tampoco sale de la carpeta elegida.
 * - Un enlace duro (`nlink > 1`) se cuenta una sola vez, con un `Set` de `dev:ino` que solo recibe
 *   esos archivos y tiene tope (`enlacesDurosMax`); si se llena, sigue y avisa de que puede contar
 *   de más.
 * - Carpetas o archivos sin permiso (o que cambian durante el recorrido) suman a `denegados` y el
 *   recorrido sigue.
 * - Memoria acotada: no guarda un nodo por archivo. Agrega por carpeta, guarda solo los N mayores
 *   archivos y carpetas (inserción acotada) y poda el árbol sobre la marcha (lo que no llega al
 *   0,5 % de lo contado, o pasa de los N hijos por carpeta, se resume en «otros»), de modo que
 *   lo que viaja al proceso principal son unos miles de nodos como máximo, no millones.
 * - El tamaño es el lógico (`st_size`), no el ocupado en disco (clústeres, compresión, archivos
 *   de OneDrive solo en línea).
 */

export interface LimitesUsoDisco {
  /** Niveles bajo la raíz que se recorren; lo más hondo se omite y marca el resultado como truncado. */
  profundidad: number;
  archivosTop: number;
  carpetasTop: number;
  extensionesTop: number;
  /** Extensiones distintas que se cuentan por separado; las demás van a «otros». */
  extensionesMax: number;
  /** Carpetas sin permiso que se conservan en el árbol (el resto se resume en «otros»). */
  denegadosMax: number;
  /** Hijos que se guardan por carpeta en el árbol. */
  hijosPorNivel: number;
  /** Fracción del total bajo la cual un nodo se resume en «otros» (0,005 = 0,5 %). */
  umbralNodo: number;
  /** Tope del registro de enlaces duros (`dev:ino`). */
  enlacesDurosMax: number;
  /** Rutas de enlaces no seguidos que se guardan para mostrarlas. */
  enlacesListados: number;
  /** `lstat` simultáneos dentro de una carpeta. */
  paralelo: number;
  /** Plazo total (lo aplica el supervisor; la parte que lee también lo mira). */
  plazoMs: number;
  /** Cada cuánto se avisa del progreso. */
  intervaloProgresoMs: number;
}

export const LIMITES_USO_DISCO: Readonly<LimitesUsoDisco> = {
  profundidad: 64,
  archivosTop: 50,
  carpetasTop: 50,
  extensionesTop: 20,
  extensionesMax: 5_000,
  denegadosMax: 200,
  hijosPorNivel: 100,
  umbralNodo: 0.005,
  enlacesDurosMax: 1_000_000,
  enlacesListados: 50,
  paralelo: 32,
  plazoMs: 30 * 60 * 1000,
  intervaloProgresoMs: 250,
};

/** Un nodo del árbol podado: nombres y tamaños, nunca contenido. */
export interface NodoUso {
  nombre: string;
  /** `otros`: lo que se podó de esa carpeta (sin nombre); `archivos` es cuántos archivos reúne. */
  tipo: 'carpeta' | 'archivo' | 'otros';
  /** Bytes (lógicos) de todo lo que contiene. */
  tamano: number;
  /** En carpetas y «otros»: archivos que contienen (en todos los niveles). */
  archivos?: number;
  /** En «otros»: carpetas sin permiso que se resumieron ahí. */
  denegados?: number;
  /** Ordenados por tamaño; «otros» va al final. */
  hijos?: NodoUso[];
  /** La carpeta no se pudo leer. */
  denegado?: true;
}

export interface ArchivoTop {
  ruta: string;
  tamano: number;
}

export interface CarpetaTop {
  ruta: string;
  /** Lo que pesan los archivos que tiene directamente, sin contar sus subcarpetas. */
  tamano: number;
  /** Cuántos archivos tiene directamente. */
  archivos: number;
}

export interface ExtensionUso {
  /** En minúsculas y sin el punto; `''` = sin extensión. */
  ext: string;
  bytes: number;
  archivos: number;
}

export interface OmitidosUso {
  /** Enlaces simbólicos y uniones: no se siguen. */
  enlaces: number;
  /** Carpetas y archivos que no se pudieron leer (sin permiso o cambiaron durante el recorrido). */
  denegados: number;
  /** Sockets, tuberías y dispositivos. */
  especiales: number;
  /** Nombres extra de un archivo que ya estaba contado: no suman bytes. */
  enlacesDuros: number;
}

export interface ResultadoUsoDisco {
  raiz: string;
  /** Bytes contados (sin enlaces ni nombres duplicados de enlaces duros). */
  total: number;
  archivos: number;
  /** Carpetas recorridas, sin contar la raíz. */
  carpetas: number;
  omitidos: OmitidosUso;
  /** Primeros enlaces no seguidos (rutas). */
  enlaces: string[];
  /** Se llenó el registro de enlaces duros: puede haber contado de más. */
  enlacesDurosIncompleto: boolean;
  /** Se cortó por la profundidad: hay carpetas sin contar. */
  truncado: boolean;
  arbol: NodoUso;
  carpetasTop: CarpetaTop[];
  archivosTop: ArchivoTop[];
  extensiones: { lista: ExtensionUso[]; otros: { bytes: number; archivos: number } };
  duracionMs: number;
}

export interface ProgresoUsoDisco {
  archivos: number;
  carpetas: number;
  bytes: number;
  /** Carpeta que se está leyendo (solo su nombre de ruta). */
  actual: string;
}

export type MensajeUsoDisco = { op: 'escanear'; raiz: string; lim: LimitesUsoDisco };

export type RespuestaUsoDisco =
  { ok: true; datos: ResultadoUsoDisco } | { ok: false; codigo: string; datos?: DatosErrorWolf };

/** Lo que el proceso de trabajo manda mientras recorre (progreso) y al terminar (fin). */
export type SalidaUsoDisco =
  ({ tipo: 'progreso' } & ProgresoUsoDisco) | ({ tipo: 'fin' } & RespuestaUsoDisco);

export interface OpcionesEjecucionUsoDisco {
  plazoMs: number;
  senal?: AbortSignal;
  alProgreso?: (p: ProgresoUsoDisco) => void;
}

/** Quien ejecuta el escaneo en el proceso de trabajo (se inyecta). */
export type EjecutorUsoDisco = (
  m: MensajeUsoDisco,
  o: OpcionesEjecucionUsoDisco,
) => Promise<RespuestaUsoDisco>;

/** Para pruebas: sustitutos de las lecturas (p. ej. para simular un acceso denegado). */
export interface DepsLecturaUsoDisco {
  opendir?: typeof opendir;
  lstat?: typeof lstat;
}

export interface OpcionesEscaneo {
  alProgreso?: (p: ProgresoUsoDisco) => void;
  senal?: AbortSignal;
  ahora?: () => number;
  deps?: DepsLecturaUsoDisco;
}

/** Inserta en una lista ordenada de mayor a menor y la mantiene en `max` elementos. */
function insertarTop<T extends { tamano: number }>(lista: T[], item: T, max: number): void {
  let i = lista.length;
  while (i > 0 && lista[i - 1]!.tamano < item.tamano) i--;
  lista.splice(i, 0, item);
  if (lista.length > max) lista.pop();
}

const cabeEnTop = (lista: { tamano: number }[], max: number, tamano: number): boolean =>
  max > 0 && (lista.length < max || tamano > lista[lista.length - 1]!.tamano);

const archivosDe = (n: NodoUso): number => (n.tipo === 'archivo' ? 1 : (n.archivos ?? 0));

/**
 * Poda los hijos de `n` (y, hacia abajo, los de sus hijos): se quedan los que llegan al umbral
 * (o no se pudieron leer), hasta `cap`, de mayor a menor; el resto se suma en «otros», que va al
 * final. Devuelve ese nodo «otros» (o null si no hay).
 */
function podar(n: NodoUso, umbral: number, cap: number): NodoUso | null {
  if (!n.hijos) return null;
  let otros = n.hijos.find((h) => h.tipo === 'otros') ?? null;
  const ordenados = n.hijos.filter((h) => h.tipo !== 'otros').sort((a, b) => b.tamano - a.tamano);
  const quedan: NodoUso[] = [];
  for (const h of ordenados) {
    if (quedan.length < cap && (h.denegado === true || (h.tamano > 0 && h.tamano >= umbral))) {
      podar(h, umbral, cap);
      quedan.push(h);
    } else if (h.tamano > 0 || h.tipo === 'carpeta') {
      otros ??= { nombre: '', tipo: 'otros', tamano: 0, archivos: 0 };
      otros.tamano += h.tamano;
      otros.archivos = (otros.archivos ?? 0) + archivosDe(h);
      if (h.denegado) otros.denegados = (otros.denegados ?? 0) + 1;
    }
  }
  if (otros && otros.tamano === 0 && (otros.archivos ?? 0) === 0 && !otros.denegados) otros = null;
  if (otros) quedan.push(otros);
  if (quedan.length > 0) n.hijos = quedan;
  else delete n.hijos;
  return otros;
}

interface Marco {
  nodo: NodoUso;
  /** El «otros» de esta carpeta, si ya existe (es el mismo objeto que está en `nodo.hijos`). */
  otros: NodoUso | null;
  /** Bytes y archivos de los archivos que tiene directamente. */
  propio: number;
  propios: number;
}

export async function escanearUsoDisco(
  m: MensajeUsoDisco,
  o: OpcionesEscaneo = {},
): Promise<ResultadoUsoDisco> {
  const lim = m.lim;
  const ahora = o.ahora ?? Date.now;
  const abrir = o.deps?.opendir ?? opendir;
  const leer = o.deps?.lstat ?? lstat;
  const inicio = ahora();
  let ultimoAviso = inicio;

  const est = {
    bytes: 0,
    archivos: 0,
    carpetas: 0,
    actual: m.raiz,
    truncado: false,
    enlacesDurosIncompleto: false,
    denegadosGuardados: 0,
  };
  const omitidos: OmitidosUso = { enlaces: 0, denegados: 0, especiales: 0, enlacesDuros: 0 };
  const enlaces: string[] = [];
  const duros = new Set<string>();
  const archivosTop: ArchivoTop[] = [];
  const carpetasTop: CarpetaTop[] = [];
  const porExtension = new Map<string, { bytes: number; archivos: number }>();
  const sobrantes = { bytes: 0, archivos: 0 };

  const aviso = (): void => {
    o.alProgreso?.({
      archivos: est.archivos,
      carpetas: est.carpetas,
      bytes: est.bytes,
      actual: est.actual.length > 300 ? `…${est.actual.slice(-299)}` : est.actual,
    });
  };

  /** Cancelación, plazo y aviso de progreso: se llama en cada carpeta y en cada tanda de archivos. */
  const revisar = (): void => {
    if (o.senal?.aborted) throw new ErrorWolf('disco.cancelado', 'Análisis cancelado.');
    const t = ahora();
    if (t - inicio > lim.plazoMs) {
      throw new ErrorWolf('disco.plazo', 'El análisis tardó demasiado y se canceló.', {
        minutos: Math.max(1, Math.round(lim.plazoMs / 60_000)),
      });
    }
    if (t - ultimoAviso >= lim.intervaloProgresoMs) {
      ultimoAviso = t;
      aviso();
    }
  };

  const umbralActual = (): number => lim.umbralNodo * est.bytes;
  /** Los nodos sin permiso se conservan hasta `denegadosMax` en total; el resto va a «otros». */
  const cumple = (h: NodoUso): boolean => {
    if (h.denegado === true) return est.denegadosGuardados++ < lim.denegadosMax;
    return h.tamano > 0 && h.tamano >= umbralActual();
  };

  /** Suma un hijo terminado a su carpeta, o lo resume en «otros» si no llega al umbral. */
  const agregar = (marco: Marco, h: NodoUso): void => {
    if (cumple(h)) {
      podar(h, umbralActual(), lim.hijosPorNivel);
      (marco.nodo.hijos ??= []).push(h);
      if (marco.nodo.hijos.length > lim.hijosPorNivel * 2) {
        marco.otros = podar(marco.nodo, umbralActual(), lim.hijosPorNivel);
      }
    } else if (h.tamano > 0 || h.tipo === 'carpeta') {
      if (!marco.otros) {
        marco.otros = { nombre: '', tipo: 'otros', tamano: 0, archivos: 0 };
        (marco.nodo.hijos ??= []).push(marco.otros);
      }
      marco.otros.tamano += h.tamano;
      marco.otros.archivos = (marco.otros.archivos ?? 0) + archivosDe(h);
      if (h.denegado) marco.otros.denegados = (marco.otros.denegados ?? 0) + 1;
    }
  };

  const anotarEnlace = (ruta: string): void => {
    omitidos.enlaces++;
    if (enlaces.length < lim.enlacesListados) enlaces.push(ruta);
  };

  const anotarArchivo = (marco: Marco, dir: string, nombre: string, tamano: number): void => {
    est.archivos++;
    est.bytes += tamano;
    marco.propio += tamano;
    marco.propios++;
    marco.nodo.tamano += tamano;
    marco.nodo.archivos = (marco.nodo.archivos ?? 0) + 1;
    const ext = path.extname(nombre).slice(1).toLowerCase();
    let e = porExtension.get(ext);
    if (!e && porExtension.size < lim.extensionesMax) {
      e = { bytes: 0, archivos: 0 };
      porExtension.set(ext, e);
    }
    const destino = e ?? sobrantes;
    destino.bytes += tamano;
    destino.archivos++;
    if (cabeEnTop(archivosTop, lim.archivosTop, tamano)) {
      insertarTop(archivosTop, { ruta: path.join(dir, nombre), tamano }, lim.archivosTop);
    }
    agregar(marco, { nombre, tipo: 'archivo', tamano });
  };

  /** `lstat` de una tanda de archivos: tamaño, enlaces duros y lo que no es un archivo normal. */
  const procesarTanda = async (
    marco: Marco,
    dir: string,
    nombres: string[],
    subcarpetas: string[],
  ): Promise<void> => {
    const infos = await Promise.all(
      nombres.map((n) => leer(path.join(dir, n), { bigint: true }).catch(() => null)),
    );
    infos.forEach((info, i) => {
      const nombre = nombres[i]!;
      if (info === null) {
        omitidos.denegados++;
      } else if (info.isSymbolicLink()) {
        anotarEnlace(path.join(dir, nombre));
      } else if (info.isDirectory()) {
        subcarpetas.push(nombre);
      } else if (!info.isFile()) {
        omitidos.especiales++;
      } else {
        let tamano = Number(info.size);
        if (info.nlink > 1n) {
          const clave = `${info.dev.toString()}:${info.ino.toString()}`;
          if (duros.has(clave)) {
            omitidos.enlacesDuros++;
            tamano = 0;
          } else if (duros.size < lim.enlacesDurosMax) {
            duros.add(clave);
          } else {
            est.enlacesDurosIncompleto = true;
          }
        }
        anotarArchivo(marco, dir, nombre, tamano);
      }
    });
  };

  const recorrer = async (dir: string, nombre: string, nivel: number): Promise<NodoUso> => {
    revisar();
    est.actual = dir;
    const marco: Marco = {
      nodo: { nombre, tipo: 'carpeta', tamano: 0, archivos: 0 },
      otros: null,
      propio: 0,
      propios: 0,
    };
    const subcarpetas: string[] = [];
    try {
      const d = await abrir(dir);
      let tanda: string[] = [];
      for await (const ent of d) {
        if (ent.isDirectory()) subcarpetas.push(ent.name);
        else if (ent.isSymbolicLink()) anotarEnlace(path.join(dir, ent.name));
        else if (
          ent.isFile() ||
          (!ent.isFIFO() && !ent.isSocket() && !ent.isCharacterDevice() && !ent.isBlockDevice())
        ) {
          // Los de tipo desconocido se resuelven con `lstat` (puede ser una carpeta).
          tanda.push(ent.name);
          if (tanda.length >= lim.paralelo) {
            await procesarTanda(marco, dir, tanda, subcarpetas);
            tanda = [];
            revisar();
          }
        } else omitidos.especiales++;
      }
      if (tanda.length > 0) await procesarTanda(marco, dir, tanda, subcarpetas);
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      omitidos.denegados++;
      marco.nodo.denegado = true;
    }
    if (marco.propios > 0) {
      if (cabeEnTop(carpetasTop, lim.carpetasTop, marco.propio)) {
        insertarTop(
          carpetasTop,
          { ruta: dir, tamano: marco.propio, archivos: marco.propios },
          lim.carpetasTop,
        );
      }
    }
    for (const sub of subcarpetas) {
      if (nivel >= lim.profundidad) {
        est.truncado = true;
        break;
      }
      est.carpetas++;
      const hijo = await recorrer(path.join(dir, sub), sub, nivel + 1);
      marco.nodo.tamano += hijo.tamano;
      marco.nodo.archivos = (marco.nodo.archivos ?? 0) + (hijo.archivos ?? 0);
      agregar(marco, hijo);
    }
    return marco.nodo;
  };

  revisar();
  // La raíz tiene que poder leerse: si no, no hay nada que mostrar.
  try {
    await (await abrir(m.raiz)).close();
  } catch {
    throw new ErrorWolf(
      'disco.raiz_invalida',
      'Elija una carpeta o unidad que exista y se pueda leer.',
    );
  }
  const arbol = await recorrer(m.raiz, m.raiz, 0);
  podar(arbol, lim.umbralNodo * arbol.tamano, lim.hijosPorNivel);
  aviso();

  const ordenadas = [...porExtension.entries()]
    .map(([ext, v]) => ({ ext, bytes: v.bytes, archivos: v.archivos }))
    .sort((a, b) => b.bytes - a.bytes || (a.ext < b.ext ? -1 : 1));
  const lista = ordenadas.slice(0, lim.extensionesTop);
  const resto = ordenadas.slice(lim.extensionesTop);
  return {
    raiz: m.raiz,
    total: arbol.tamano,
    archivos: est.archivos,
    carpetas: est.carpetas,
    omitidos,
    enlaces,
    enlacesDurosIncompleto: est.enlacesDurosIncompleto,
    truncado: est.truncado,
    arbol,
    carpetasTop,
    archivosTop,
    extensiones: {
      lista,
      otros: {
        bytes: resto.reduce((s, x) => s + x.bytes, 0) + sobrantes.bytes,
        archivos: resto.reduce((s, x) => s + x.archivos, 0) + sobrantes.archivos,
      },
    },
    duracionMs: ahora() - inicio,
  };
}

/** Para el proceso de trabajo y para pruebas: contesta con la forma `RespuestaUsoDisco`. */
export async function operarUsoDisco(
  m: MensajeUsoDisco,
  o: OpcionesEscaneo = {},
): Promise<RespuestaUsoDisco> {
  try {
    return { ok: true, datos: await escanearUsoDisco(m, o) };
  } catch (e) {
    if (e instanceof ErrorWolf) {
      return { ok: false, codigo: e.codigo, ...(e.datos ? { datos: e.datos } : {}) };
    }
    return { ok: false, codigo: 'disco.fallo' };
  }
}

/** Sin proceso aparte (solo para pruebas y como respaldo): el mismo código en este proceso. */
export const ejecutarUsoDiscoEnProceso: EjecutorUsoDisco = (m, o) =>
  operarUsoDisco(m, {
    ...(o.senal ? { senal: o.senal } : {}),
    ...(o.alProgreso ? { alProgreso: o.alProgreso } : {}),
  });

import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf, esErrorWolf, type CodigoError } from '../errores';
import type { UnidadDisco } from '../plataforma/tipos';
import {
  LIMITES_USO_DISCO,
  type EjecutorUsoDisco,
  type NodoUso,
  type OmitidosUso,
  type ProgresoUsoDisco,
  type ResultadoUsoDisco,
  type ExtensionUso,
} from './usoDisco';

/**
 * Servicio de «Uso del disco» (D51), en el proceso principal. No lee carpetas: valida la raíz,
 * manda el trabajo al proceso de trabajo (`EjecutorUsoDisco`) y guarda lo que contestó, con un id
 * y una caducidad. La ventana nunca aporta una ruta para abrir: pide «abrir la fila 12 del análisis
 * d3» y la ruta sale de lo guardado aquí.
 *
 * - Solo se analiza lo que el usuario eligió con el diálogo nativo (el proceso principal lo
 *   comprueba antes de llamar aquí) o una unidad de la lista de unidades. Nunca texto libre.
 * - Solo una a la vez; se puede cancelar (mata el proceso de trabajo).
 * - Solo lectura: no hay ninguna acción que borre, mueva o eleve. La carpeta de datos de WolfCore
 *   SÍ se puede analizar (es solo tamaño), a diferencia de Buscar y del diff.
 */

export const CADUCIDAD_USO_DISCO_MS = 30 * 60 * 1000;
const MAX_ANALISIS_GUARDADOS = 2;

/** Un nodo tal como lo ve la ventana: con su número y su ruta (solo para mostrar y copiar). */
export interface NodoUsoUi {
  id: number;
  nombre: string;
  ruta: string;
  tipo: NodoUso['tipo'];
  tamano: number;
  archivos?: number;
  hijos?: NodoUsoUi[];
  denegado?: true;
}

export interface ArchivoTopUi {
  id: number;
  ruta: string;
  tamano: number;
}

export interface CarpetaTopUi {
  id: number;
  ruta: string;
  tamano: number;
  archivos: number;
}

export interface AnalisisDisco {
  /** Id del análisis (para abrir una fila en el Explorador). */
  id: string;
  raiz: string;
  total: number;
  archivos: number;
  carpetas: number;
  omitidos: OmitidosUso;
  enlaces: string[];
  enlacesDurosIncompleto: boolean;
  truncado: boolean;
  arbol: NodoUsoUi;
  carpetasTop: CarpetaTopUi[];
  archivosTop: ArchivoTopUi[];
  extensiones: { lista: ExtensionUso[]; otros: { bytes: number; archivos: number } };
  duracionMs: number;
  /** Espacio de la unidad, si lo que se analizó fue una unidad de la lista. */
  unidad: { total: number | null; libre: number | null } | null;
}

interface Guardado {
  filas: Map<number, { ruta: string; tipo: NodoUso['tipo'] }>;
  expira: number;
}

export interface DepsUsoDisco {
  ejecutor: EjecutorUsoDisco;
  /** Unidades que se pueden analizar (la plataforma). */
  unidades: () => Promise<readonly UnidadDisco[]>;
  /** Progreso del análisis en curso (en la aplicación, el evento `disco:progreso`). */
  progreso: (p: ProgresoUsoDisco) => void;
  ahora?: () => number;
}

const esUnc = (r: string): boolean => /^[\\/]{2}/.test(r);
const mismaRuta = (a: string, b: string): boolean =>
  path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

export class UsoDisco {
  private readonly guardados = new Map<string, Guardado>();
  private contador = 0;
  private enCurso: AbortController | null = null;

  constructor(private readonly deps: DepsUsoDisco) {}

  private ahora(): number {
    return (this.deps.ahora ?? Date.now)();
  }

  /** Unidades que se ofrecen (discos fijos y extraíbles). */
  async unidades(): Promise<UnidadDisco[]> {
    return (await this.deps.unidades()).map((u) => ({ ...u }));
  }

  /** Cancela el análisis en curso. `false` si no había. */
  cancelar(): boolean {
    if (!this.enCurso) return false;
    this.enCurso.abort();
    return true;
  }

  private async raizValida(ruta: unknown): Promise<string> {
    const invalida = (): ErrorWolf =>
      new ErrorWolf(
        'disco.raiz_invalida',
        'Elija una carpeta o unidad que exista y se pueda leer.',
      );
    if (
      typeof ruta !== 'string' ||
      ruta.length < 3 ||
      ruta.length > 1024 ||
      !path.isAbsolute(ruta) ||
      esUnc(ruta) ||
      [...ruta].some((c) => c.charCodeAt(0) < 0x20)
    ) {
      throw invalida();
    }
    try {
      const info = await lstat(ruta);
      if (info.isSymbolicLink() || !info.isDirectory()) throw invalida();
      const real = await realpath(ruta);
      if (esUnc(real)) throw invalida();
      return path.resolve(ruta);
    } catch (e) {
      if (esErrorWolf(e)) throw e;
      throw invalida();
    }
  }

  /** Analiza una carpeta elegida con el diálogo nativo (el proceso principal ya lo comprobó). */
  analizar(ruta: string): Promise<AnalisisDisco> {
    return this.ejecutar(ruta, null);
  }

  /** Analiza una unidad: solo las de la lista de unidades. */
  async analizarUnidad(ruta: string): Promise<AnalisisDisco> {
    const lista = await this.deps.unidades();
    const unidad =
      typeof ruta === 'string' ? lista.find((u) => mismaRuta(u.ruta, ruta)) : undefined;
    if (!unidad) {
      throw new ErrorWolf('disco.raiz_invalida', 'Esa unidad no está en la lista de unidades.');
    }
    return this.ejecutar(unidad.ruta, { total: unidad.total, libre: unidad.libre });
  }

  private async ejecutar(ruta: unknown, unidad: AnalisisDisco['unidad']): Promise<AnalisisDisco> {
    const raiz = await this.raizValida(ruta);
    if (this.enCurso) {
      throw new ErrorWolf('disco.ocupado', 'Ya hay un análisis en curso: cancélelo o espere.');
    }
    const control = new AbortController();
    this.enCurso = control;
    try {
      let r;
      try {
        r = await this.deps.ejecutor(
          { op: 'escanear', raiz, lim: { ...LIMITES_USO_DISCO } },
          {
            plazoMs: LIMITES_USO_DISCO.plazoMs,
            senal: control.signal,
            alProgreso: (p) => this.deps.progreso(p),
          },
        );
      } catch (e) {
        if (control.signal.aborted) {
          throw new ErrorWolf('disco.cancelado', 'Análisis cancelado.');
        }
        throw e;
      }
      if (!r.ok) {
        throw new ErrorWolf(
          (r.codigo.startsWith('disco.') ? r.codigo : 'disco.fallo') as CodigoError,
          'El análisis falló.',
          r.datos,
        );
      }
      return this.guardar(r.datos, unidad);
    } finally {
      if (this.enCurso === control) this.enCurso = null;
    }
  }

  private guardar(d: ResultadoUsoDisco, unidad: AnalisisDisco['unidad']): AnalisisDisco {
    const id = `d${this.ahora().toString(36)}${(++this.contador).toString(36)}`;
    const filas: Guardado['filas'] = new Map();
    let n = 0;
    const numerar = (ruta: string, tipo: NodoUso['tipo']): number => {
      const idFila = ++n;
      filas.set(idFila, { ruta, tipo });
      return idFila;
    };
    const nodo = (x: NodoUso, ruta: string): NodoUsoUi => {
      // «otros» no es un lugar: sus acciones llevan a la carpeta que lo contiene (`ruta`).
      return {
        id: numerar(ruta, x.tipo === 'otros' ? 'carpeta' : x.tipo),
        nombre: x.nombre,
        ruta,
        tipo: x.tipo,
        tamano: x.tamano,
        ...(x.archivos !== undefined ? { archivos: x.archivos } : {}),
        ...(x.denegado ? { denegado: true as const } : {}),
        ...(x.hijos
          ? {
              hijos: x.hijos.map((h) =>
                nodo(h, h.tipo === 'otros' ? ruta : path.join(ruta, h.nombre)),
              ),
            }
          : {}),
      };
    };
    const salida: AnalisisDisco = {
      id,
      raiz: d.raiz,
      total: d.total,
      archivos: d.archivos,
      carpetas: d.carpetas,
      omitidos: d.omitidos,
      enlaces: d.enlaces,
      enlacesDurosIncompleto: d.enlacesDurosIncompleto,
      truncado: d.truncado,
      arbol: nodo(d.arbol, d.raiz),
      archivosTop: d.archivosTop.map((a) => ({
        id: numerar(a.ruta, 'archivo'),
        ruta: a.ruta,
        tamano: a.tamano,
      })),
      carpetasTop: d.carpetasTop.map((c) => ({
        id: numerar(c.ruta, 'carpeta'),
        ruta: c.ruta,
        tamano: c.tamano,
        archivos: c.archivos,
      })),
      extensiones: d.extensiones,
      duracionMs: d.duracionMs,
      unidad,
    };
    this.guardados.set(id, { filas, expira: this.ahora() + CADUCIDAD_USO_DISCO_MS });
    while (this.guardados.size > MAX_ANALISIS_GUARDADOS) {
      this.guardados.delete(this.guardados.keys().next().value as string);
    }
    return salida;
  }

  /**
   * Carpeta que se abre en el Explorador para una fila del análisis: la carpeta misma, o la que
   * contiene al archivo. Solo de lo que guardó el servicio, y solo si sigue siendo una carpeta
   * normal (no un enlace). Nunca abre ni cambia nada: solo devuelve la ruta.
   */
  async carpetaDe(idAnalisis: string, idFila: number): Promise<string> {
    const g = typeof idAnalisis === 'string' ? this.guardados.get(idAnalisis) : undefined;
    if (!g || g.expira < this.ahora()) {
      if (g) this.guardados.delete(idAnalisis);
      throw new ErrorWolf(
        'disco.caducado',
        'Ese análisis ya no está disponible: vuelva a analizar.',
      );
    }
    const fila = Number.isInteger(idFila) ? g.filas.get(idFila) : undefined;
    if (!fila) throw new ErrorWolf('disco.entrada_invalida', 'Esa fila ya no se puede abrir.');
    const carpeta = fila.tipo === 'archivo' ? path.dirname(fila.ruta) : fila.ruta;
    try {
      const info = await lstat(carpeta);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('no es carpeta');
    } catch {
      throw new ErrorWolf(
        'disco.entrada_invalida',
        'Esa carpeta ya no existe o cambió: vuelva a analizar.',
      );
    }
    return carpeta;
  }
}

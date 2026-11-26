import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf, esErrorWolf, type CodigoError } from '../errores';
import { rutaDentroDe } from '../plataforma/sistema';
import {
  LIMITES_DIFF,
  resolverSeguro,
  type EjecutorDiff,
  type EntradaDiff,
  type ResultadoArchivoDiff,
  type ResultadoCarpetas,
  type ResumenCarpetas,
} from './diffCarpetas';

/**
 * Servicio del diff de carpetas (D44), en el proceso principal. No lee carpetas: valida las dos
 * raíces, manda el trabajo al proceso de trabajo (`EjecutorDiff`) y guarda lo que contestó, con
 * un id y una caducidad. La ventana nunca aporta una ruta: pide «el archivo 12 de la comparación
 * c3» y la ruta sale de lo guardado aquí.
 *
 * - Solo una operación a la vez (comparar o diff de un archivo); se puede cancelar.
 * - Las raíces no pueden ser rutas UNC, enlaces, uniones ni estar dentro de la carpeta de datos de
 *   WolfCore (ni contenerla sin que se salte: el proceso de trabajo se salta la carpeta).
 * - Solo lectura: nada de lo comparado se escribe, y la ruta que se entrega al editor se valida
 *   de nuevo (archivo normal, sin enlaces en el camino).
 */

export const CADUCIDAD_DIFF_MS = 15 * 60 * 1000;
const MAX_COMPARACIONES_GUARDADAS = 3;

export type GrupoDiff = 'soloA' | 'soloB' | 'distintos';

/** Una entrada tal como la ve la ventana: con su número y sin rutas absolutas. */
export interface EntradaDiffUi extends EntradaDiff {
  id: number;
}

export interface ComparacionCarpetas {
  /** Id de la comparación (para pedir el diff de un archivo o abrirlo en el editor). */
  id: string;
  soloA: EntradaDiffUi[];
  soloB: EntradaDiffUi[];
  distintos: EntradaDiffUi[];
  resumen: ResumenCarpetas;
}

interface Guardada {
  a: string;
  b: string;
  entradas: Map<number, { grupo: GrupoDiff; entrada: EntradaDiff }>;
  expira: number;
}

export interface DepsDiffCarpetas {
  ejecutor: EjecutorDiff;
  /** Carpetas de datos de WolfCore: no se comparan. */
  carpetasPropias: () => readonly string[];
  ahora?: () => number;
}

const esUnc = (r: string): boolean => /^[\\/]{2}/.test(r);

export class DiffCarpetas {
  private readonly guardadas = new Map<string, Guardada>();
  private contador = 0;
  private enCurso: AbortController | null = null;

  constructor(private readonly deps: DepsDiffCarpetas) {}

  private ahora(): number {
    return (this.deps.ahora ?? Date.now)();
  }

  /** Cancela la operación en curso (comparar o diff de un archivo). `false` si no había. */
  cancelar(): boolean {
    if (!this.enCurso) return false;
    this.enCurso.abort();
    return true;
  }

  private async raizValida(ruta: string): Promise<string> {
    const invalida = (): ErrorWolf =>
      new ErrorWolf('diff.raiz_invalida', 'Elija dos carpetas que existan y que no sean enlaces.');
    if (
      typeof ruta !== 'string' ||
      ruta === '' ||
      ruta.length > 1024 ||
      !path.isAbsolute(ruta) ||
      esUnc(ruta) ||
      [...ruta].some((c) => c.charCodeAt(0) < 0x20)
    ) {
      throw invalida();
    }
    let real: string;
    try {
      const info = await lstat(ruta);
      if (info.isSymbolicLink() || !info.isDirectory()) throw invalida();
      real = await realpath(ruta);
    } catch (e) {
      if (esErrorWolf(e)) throw e;
      throw invalida();
    }
    if (esUnc(real)) throw invalida();
    for (const propia of this.deps.carpetasPropias()) {
      const propias = [path.resolve(propia), await realpath(propia).catch(() => path.resolve(propia))];
      if (propias.some((p) => rutaDentroDe(p, real) || rutaDentroDe(p, path.resolve(ruta)))) {
        throw new ErrorWolf(
          'diff.ruta_vetada',
          'Esa carpeta es de datos de WolfCore Dev: no se compara.',
        );
      }
    }
    return real;
  }

  private tomarTurno(): AbortController {
    if (this.enCurso) {
      throw new ErrorWolf('diff.ocupado', 'Ya hay una comparación en curso: cancélela o espere.');
    }
    const c = new AbortController();
    this.enCurso = c;
    return c;
  }

  private soltarTurno(c: AbortController): void {
    if (this.enCurso === c) this.enCurso = null;
  }

  /** Compara dos carpetas (ya elegidas en un diálogo por el proceso principal). */
  async comparar(rutaA: string, rutaB: string): Promise<ComparacionCarpetas> {
    const a = await this.raizValida(rutaA);
    const b = await this.raizValida(rutaB);
    const control = this.tomarTurno();
    try {
      const r = await this.ejecutar(
        {
          op: 'carpetas',
          a,
          b,
          vetadas: [...this.deps.carpetasPropias()],
          lim: { ...LIMITES_DIFF },
        },
        control,
      );
      const datos = r as ResultadoCarpetas;
      const id = `c${this.ahora().toString(36)}${(++this.contador).toString(36)}`;
      const entradas: Guardada['entradas'] = new Map();
      let n = 0;
      const numerar = (grupo: GrupoDiff, lista: EntradaDiff[]): EntradaDiffUi[] =>
        lista.map((entrada) => {
          const idEntrada = ++n;
          entradas.set(idEntrada, { grupo, entrada });
          return { ...entrada, id: idEntrada };
        });
      const salida: ComparacionCarpetas = {
        id,
        soloA: numerar('soloA', datos.soloA),
        soloB: numerar('soloB', datos.soloB),
        distintos: numerar('distintos', datos.distintos),
        resumen: datos.resumen,
      };
      this.guardadas.set(id, {
        a,
        b,
        entradas,
        expira: this.ahora() + CADUCIDAD_DIFF_MS,
      });
      while (this.guardadas.size > MAX_COMPARACIONES_GUARDADAS) {
        this.guardadas.delete(this.guardadas.keys().next().value as string);
      }
      return salida;
    } finally {
      this.soltarTurno(control);
    }
  }

  private guardada(id: string): Guardada {
    const g = typeof id === 'string' ? this.guardadas.get(id) : undefined;
    if (!g || g.expira < this.ahora()) {
      if (g) this.guardadas.delete(id);
      throw new ErrorWolf('diff.caducado', 'Esa comparación ya no está disponible: vuelva a comparar.');
    }
    return g;
  }

  private entrada(g: Guardada, idEntrada: number): { grupo: GrupoDiff; entrada: EntradaDiff } {
    const e = Number.isInteger(idEntrada) ? g.entradas.get(idEntrada) : undefined;
    if (!e) throw new ErrorWolf('diff.archivo_invalido', 'Ese archivo ya no se puede comparar.');
    return e;
  }

  /** Diff de texto de un archivo del grupo «distintos». */
  async archivo(idComparacion: string, idEntrada: number): Promise<ResultadoArchivoDiff> {
    const g = this.guardada(idComparacion);
    const { grupo, entrada } = this.entrada(g, idEntrada);
    if (grupo !== 'distintos') {
      throw new ErrorWolf('diff.archivo_invalido', 'Ese archivo ya no se puede comparar.');
    }
    const control = this.tomarTurno();
    try {
      const r = await this.ejecutar(
        { op: 'archivo', a: g.a, b: g.b, rel: entrada.ruta, lim: { ...LIMITES_DIFF } },
        control,
      );
      return r as ResultadoArchivoDiff;
    } finally {
      this.soltarTurno(control);
    }
  }

  /**
   * Ruta absoluta de un archivo de la comparación para abrirlo en el editor: solo de lo que guardó
   * el servicio, en el lado donde existe, y solo si sigue siendo un archivo normal sin enlaces.
   */
  async rutaParaEditor(idComparacion: string, idEntrada: number, lado: 'a' | 'b'): Promise<string> {
    const g = this.guardada(idComparacion);
    const { grupo, entrada } = this.entrada(g, idEntrada);
    if ((lado !== 'a' && lado !== 'b') || (lado === 'a' ? grupo === 'soloB' : grupo === 'soloA')) {
      throw new ErrorWolf('diff.archivo_invalido', 'Ese archivo no existe en ese lado.');
    }
    try {
      return (await resolverSeguro(lado === 'a' ? g.a : g.b, entrada.ruta)).ruta;
    } catch {
      throw new ErrorWolf('diff.archivo_invalido', 'Ese archivo ya no se puede abrir: cambió o desapareció.');
    }
  }

  private async ejecutar(
    m: Parameters<EjecutorDiff>[0],
    control: AbortController,
  ): Promise<ResultadoCarpetas | ResultadoArchivoDiff> {
    const r = await this.deps.ejecutor(m, { plazoMs: LIMITES_DIFF.plazoMs, senal: control.signal });
    if (!r.ok) {
      throw new ErrorWolf(
        (r.codigo.startsWith('diff.') ? r.codigo : 'diff.fallo') as CodigoError,
        'La comparación falló.',
        r.datos,
      );
    }
    return r.datos;
  }
}

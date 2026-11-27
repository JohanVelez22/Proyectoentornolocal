import { equipoDesconocido, type InfoEquipo } from './tipos';

const TTL_POR_OMISION_MS = 30_000;
const PLAZO_POR_OMISION_MS = 35_000;
/** Un fallo se recuerda poco: la próxima petición vuelve a intentarlo. */
const TTL_FALLO_MS = 5_000;

export interface OpcionesDetector {
  /** Lectura real (la de la `Plataforma`). */
  leer: () => Promise<InfoEquipo>;
  /** Cuánto vale una lectura buena (la RAM libre cambia, el resto no). */
  ttlMs?: number;
  /** Plazo máximo de una lectura; pasado, el equipo queda «desconocido». */
  plazoMs?: number;
  ahora?: () => number;
}

const copiar = (e: InfoEquipo): InfoEquipo => structuredClone(e);

/**
 * Lee el equipo una vez y lo guarda (D55). Nunca lanza ni bloquea más allá del plazo: si la
 * lectura falla o se cuelga, devuelve un equipo con todos los campos «desconocidos». Las
 * peticiones simultáneas comparten una sola lectura.
 */
export class DetectorEquipo {
  private cache: { equipo: InfoEquipo; hasta: number } | null = null;
  private enCurso: Promise<InfoEquipo> | null = null;
  private readonly ahora: () => number;

  constructor(private readonly op: OpcionesDetector) {
    this.ahora = op.ahora ?? Date.now;
  }

  async obtener(forzar = false): Promise<InfoEquipo> {
    if (!forzar && this.cache && this.ahora() < this.cache.hasta) return copiar(this.cache.equipo);
    this.enCurso ??= this.leer().finally(() => {
      this.enCurso = null;
    });
    return copiar(await this.enCurso);
  }

  private async leer(): Promise<InfoEquipo> {
    const plazo = this.op.plazoMs ?? PLAZO_POR_OMISION_MS;
    let t: ReturnType<typeof setTimeout> | undefined;
    try {
      const e = await Promise.race([
        this.op.leer(),
        new Promise<never>((_, rechazar) => {
          t = setTimeout(() => rechazar(new Error('tiempo')), plazo);
        }),
      ]);
      this.cache = { equipo: e, hasta: this.ahora() + (this.op.ttlMs ?? TTL_POR_OMISION_MS) };
      return e;
    } catch {
      const e = equipoDesconocido();
      this.cache = { equipo: e, hasta: this.ahora() + TTL_FALLO_MS };
      return e;
    } finally {
      clearTimeout(t);
    }
  }
}

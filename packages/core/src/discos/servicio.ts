import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { EntradaAviso } from '../avisos/avisos';
import { ErrorWolf } from '../errores';
import type { PlataformaCompleta } from '../plataforma/tipos';
import {
  decidirAlertas,
  estadoSaludVacio,
  leerEstadoGuardado,
  type EstadoSaludGuardado,
} from './alertas';
import type { DiscoLeido, DiscoSalud, EventoDisco, LecturaDiscos, ResultadoSalud } from './tipos';
import { evaluarDisco } from './veredicto';

/** Primera revisión tras arrancar (diferida: nunca frena el inicio) y cada cuánto se repite. */
export const RETRASO_PRIMERA_REVISION_MS = 90_000;
export const INTERVALO_REVISION_MS = 30 * 60 * 1000;

export interface DepsSaludDiscos {
  plataforma: Pick<PlataformaCompleta, 'saludDiscos' | 'saludDiscosAdmin' | 'eventosDisco'>;
  /** `run/salud-discos.json`. */
  archivoEstado: string;
  /** Carpeta de datos de WolfCore Dev (su unidad se destaca). */
  carpetaDatos: () => string;
  /** Carpetas de los proyectos (las unidades donde están se destacan). */
  carpetasProyectos: () => Promise<string[]>;
  publicar: (a: EntradaAviso) => unknown;
  /** ¿Están activados los avisos de salud del disco (Ajustes)? */
  avisosActivados: () => Promise<boolean>;
  ahora?: () => number;
}

/** Letra de unidad de una ruta de Windows (`D:\proyectos` → `D:`); null si no la tiene. */
export function unidadDeRuta(ruta: string): string | null {
  const m = /^([A-Za-z]):(?:[\\/]|$)/.exec(ruta.trim());
  return m ? `${m[1]!.toUpperCase()}:` : null;
}

/** Clave de un disco entre lecturas: modelo, tamaño y número. No es un número de serie. */
export const claveDisco = (d: Pick<DiscoLeido, 'modelo' | 'tamanoBytes' | 'numero'>): string =>
  `${d.modelo ?? 'disco'}|${d.tamanoBytes ?? 0}|${d.numero}`;

export class SaludDiscos {
  private estado: EstadoSaludGuardado | null = null;
  private enCurso: Promise<ResultadoSalud> | null = null;
  /** Una sola escritura del estado a la vez. */
  private cola: Promise<void> = Promise.resolve();
  private temporizador: ReturnType<typeof setInterval> | null = null;
  private espera: ReturnType<typeof setTimeout> | null = null;
  private cerrado = false;

  constructor(private readonly d: DepsSaludDiscos) {}

  private get ahora(): number {
    return (this.d.ahora ?? Date.now)();
  }

  private async cargarEstado(): Promise<EstadoSaludGuardado> {
    if (this.estado) return this.estado;
    try {
      this.estado = leerEstadoGuardado(JSON.parse(await readFile(this.d.archivoEstado, 'utf8')));
    } catch {
      this.estado = estadoSaludVacio();
    }
    return this.estado;
  }

  private guardarEstado(e: EstadoSaludGuardado): void {
    this.estado = e;
    this.cola = this.cola
      .then(async () => {
        await mkdir(path.dirname(this.d.archivoEstado), { recursive: true });
        const tmp = `${this.d.archivoEstado}.tmp`;
        await writeFile(tmp, JSON.stringify(e), 'utf8');
        await rename(tmp, this.d.archivoEstado);
      })
      .catch(() => undefined);
  }

  /** Espera a que el estado esté escrito (al cerrar y en las pruebas). */
  guardado(): Promise<void> {
    return this.cola;
  }

  /** Une la lectura con las letras destacadas y el veredicto de cada disco. */
  private async armar(
    lectura: LecturaDiscos,
    conAdmin: boolean,
  ): Promise<{ resultado: ResultadoSalud; estado: EstadoSaludGuardado }> {
    const previo = await this.cargarEstado();
    const datos = unidadDeRuta(this.d.carpetaDatos());
    const proyectos = new Set<string>();
    for (const r of await this.d.carpetasProyectos().catch(() => [] as string[])) {
      const u = unidadDeRuta(r);
      if (u) proyectos.add(u);
    }
    const discos: DiscoSalud[] = lectura.discos.map((l) => {
      const clave = claveDisco(l);
      const { veredicto, motivos } = evaluarDisco(l, previo.discos[clave]?.corregidos ?? null);
      return {
        ...l,
        clave,
        veredicto,
        motivos,
        contieneDatos: datos !== null && l.unidades.includes(datos),
        contieneProyectos: l.unidades.some((u) => proyectos.has(u)),
      };
    });
    const resultado: ResultadoSalud = {
      discos,
      prediccion: lectura.prediccion,
      conAdmin,
      leidoEn: new Date(this.ahora).toISOString(),
    };
    return { resultado, estado: previo };
  }

  /** Alertas por transición: publica solo lo que pasó a peor y guarda el estado nuevo. */
  private async alertar(discos: DiscoSalud[]): Promise<void> {
    const previo = await this.cargarEstado();
    const { avisos, estado } = decidirAlertas(discos, previo, this.ahora);
    this.guardarEstado(estado);
    if (avisos.length === 0 || !(await this.d.avisosActivados().catch(() => false))) return;
    for (const a of avisos) {
      this.d.publicar({
        nivel: a.veredicto === 'critico' ? 'error' : 'aviso',
        tipo: 'salud-disco',
        codigo: 'avisos.disco_salud',
        datos: {
          estado: a.veredicto,
          disco: a.numero,
          ...(a.modelo ? { modelo: a.modelo } : {}),
          // Un aviso por disco (el centro agrupa por tipo y fuente).
          fuente: `disco:${a.numero}`,
        },
        // «Hacer respaldo ahora» lleva a los respaldos y las instantáneas de las bases de datos.
        accion: { ruta: 'basesDeDatos' },
      });
    }
  }

  /**
   * Lee la salud de los discos. Sin `admin` es solo consulta (sin UAC). Con `admin` pide el UAC:
   * solo lo llama quien tiene el clic de la persona. Lanza un error del catálogo si no hay lectura.
   */
  async leer(o: { admin?: boolean } = {}): Promise<ResultadoSalud> {
    if (o.admin) return this.leerConAdmin();
    this.enCurso ??= this.leerSinAdmin().finally(() => {
      this.enCurso = null;
    });
    return structuredClone(await this.enCurso);
  }

  private async leerSinAdmin(): Promise<ResultadoSalud> {
    const lectura = await this.d.plataforma.saludDiscos();
    if (!lectura)
      throw new ErrorWolf('discos.sin_lectura', 'No se pudo leer la salud de los discos.');
    const { resultado } = await this.armar(lectura, false);
    await this.alertar(resultado.discos);
    return resultado;
  }

  private async leerConAdmin(): Promise<ResultadoSalud> {
    const r = await this.d.plataforma.saludDiscosAdmin();
    if (!r.ok) {
      if (r.motivo === 'cancelado') {
        throw new ErrorWolf('discos.admin_cancelado', 'Se canceló el permiso de administrador.');
      }
      throw new ErrorWolf(
        'discos.admin_fallo',
        'No se pudo leer la salud de los discos como administrador.',
      );
    }
    const { resultado } = await this.armar(r.lectura, true);
    await this.alertar(resultado.discos);
    return resultado;
  }

  /** Eventos del disco de los últimos 30 días (solo lectura). */
  async eventos(): Promise<EventoDisco[]> {
    const r = await this.d.plataforma.eventosDisco();
    if (!r) throw new ErrorWolf('discos.sin_eventos', 'No se pudieron leer los eventos del disco.');
    return r;
  }

  /**
   * Revisión ligera en segundo plano: SIN administrador (nunca abre un UAC) y sin lanzar. Si los
   * avisos están desactivados no lee nada.
   */
  async revisar(): Promise<void> {
    if (this.cerrado) return;
    try {
      if (!(await this.d.avisosActivados())) return;
      await this.leer();
    } catch {
      // Sin lectura no hay nada que avisar; la próxima revisión lo reintenta.
    }
  }

  /** Primera revisión tras `retrasoMs` (no frena el arranque) y luego cada 30 minutos. */
  iniciar(
    retrasoMs: number = RETRASO_PRIMERA_REVISION_MS,
    cadaMs: number = INTERVALO_REVISION_MS,
  ): void {
    if (this.espera || this.temporizador) return;
    const volver = (): void => void this.revisar();
    this.espera = setTimeout(volver, retrasoMs);
    this.espera.unref?.();
    this.temporizador = setInterval(volver, cadaMs);
    this.temporizador.unref?.();
  }

  async cerrar(): Promise<void> {
    this.cerrado = true;
    if (this.espera) clearTimeout(this.espera);
    if (this.temporizador) clearInterval(this.temporizador);
    this.espera = null;
    this.temporizador = null;
    await this.guardado();
  }
}

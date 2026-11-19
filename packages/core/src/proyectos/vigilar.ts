import { watch } from 'node:fs';
import { readdir, realpath, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Eventos, EventosNucleo } from '../eventos';
import type { Config } from '../tipos';
import { detectarProyecto, type Deteccion } from './detectar';

export interface SugerenciaProyecto {
  carpeta: string;
  deteccion: Deteccion;
}

export interface DepsVigilante {
  leerConfig: () => Promise<Config>;
  eventos: Eventos<EventosNucleo>;
  /** Espera tras el último cambio antes de recalcular (1 s por defecto). */
  esperaMs?: number;
  /**
   * Revisión periódica además de la vigilancia del sistema (30 s por defecto): `fs.watch` puede
   * perder o demorar eventos (FSEvents en macOS, carpetas de red, rutas con enlaces).
   */
  revisionMs?: number;
  /** Vigilancia del sistema (`fs.watch` por defecto; las pruebas la sustituyen). */
  crearVigia?: (carpeta: string, alCambiar: () => void) => VigiaCarpeta;
}

/** Lo que se usa de un `FSWatcher`. */
export interface VigiaCarpeta {
  close(): void;
  on(evento: 'error', fn: () => void): unknown;
}

const vigiaFs = (carpeta: string, alCambiar: () => void): VigiaCarpeta =>
  watch(carpeta, { persistent: false }, alCambiar);

const IGNORADAS = new Set(['node_modules', 'vendor']);
/** Detección sin parecer proyecto: carpeta vacía o sin marcas conocidas. */
const GENERICOS: readonly string[] = ['estatico', 'personalizado'];

/** Ruta comparable: normalizada, sin barra final y sin distinguir mayúsculas (Windows). */
function clave(ruta: string): string {
  return resolve(ruta)
    .replace(/[\\/]+$/, '')
    .toLowerCase();
}

/**
 * Vigila una carpeta de proyectos (primer nivel, sin recursión) y avisa con
 * 'proyectos:sugerencias' cuando cambia la lista de subcarpetas que parecen un proyecto y aún
 * no son un sitio.
 */
export class VigilanteProyectos {
  private vigia: VigiaCarpeta | null = null;
  private revision: NodeJS.Timeout | null = null;
  private carpeta: string | null = null;
  private temporizador: NodeJS.Timeout | null = null;
  private ultima: string | null = null;
  /** Cada cambio de vigilancia invalida los cálculos que estaban en curso. */
  private generacion = 0;
  /** Número del último refresco lanzado: un resultado que no es el último se descarta. */
  private secuencia = 0;
  /** Se llamó a vigilar(): manda sobre la carpeta de la config (aunque sea null). */
  private fijada = false;
  private primerEvento = 0;

  constructor(private readonly d: DepsVigilante) {}

  /** Sugerencias de la carpeta vigilada en la configuración (vacío si no hay o no existe). */
  async sugerencias(): Promise<SugerenciaProyecto[]> {
    const cfg = await this.d.leerConfig();
    const carpeta = this.fijada ? this.carpeta : cfg.proyectos.carpetaVigilada;
    return this.calcular(carpeta, cfg);
  }

  private async calcular(carpeta: string | null, cfg: Config): Promise<SugerenciaProyecto[]> {
    if (!carpeta) return [];
    let nombres: string[];
    try {
      nombres = (await readdir(carpeta, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((n) => !n.startsWith('_') && !n.startsWith('.') && !IGNORADAS.has(n.toLowerCase()))
        .sort((a, b) => a.localeCompare(b));
    } catch {
      return [];
    }
    const montadas = new Set(cfg.sitios.map((s) => clave(s.carpeta)));
    const salida: SugerenciaProyecto[] = [];
    for (const n of nombres) {
      const ruta = join(carpeta, n);
      if (montadas.has(clave(ruta))) continue;
      try {
        const deteccion = await detectarProyecto(ruta, { pgvector: false });
        if (!GENERICOS.includes(deteccion.tipo)) salida.push({ carpeta: ruta, deteccion });
      } catch {
        // carpeta ilegible o borrada a medias: no es sugerencia
      }
    }
    return salida;
  }

  /** Cambia la carpeta vigilada (o la deja de vigilar con null). Nunca lanza. */
  async vigilar(carpeta: string | null): Promise<void> {
    this.detener();
    const gen = this.generacion;
    this.carpeta = carpeta;
    this.fijada = true;
    this.ultima = null;
    if (!carpeta) return;
    // FSEvents (macOS) no siempre avisa si la ruta pasa por un enlace (/var → /private/var):
    // se vigila la ruta real. Las sugerencias siguen usando la ruta pedida.
    const real = await realpath(carpeta).catch(() => carpeta);
    if (gen !== this.generacion) return;
    try {
      this.vigia = (this.d.crearVigia ?? vigiaFs)(real, () => this.programar());
      // Si la carpeta desaparece o falla la vigilancia: se detiene y se recalcula una vez.
      this.vigia.on('error', () => {
        this.vigia?.close();
        this.vigia = null;
        this.programar();
      });
    } catch {
      this.vigia = null;
    }
    // Línea base: lo que ya había no se anuncia hasta que cambie.
    try {
      const cfg = await this.d.leerConfig();
      const lista = await this.calcular(carpeta, cfg);
      if (gen === this.generacion && this.ultima === null) {
        this.ultima = JSON.stringify(lista.map((s) => s.carpeta));
      }
    } catch {
      // sin línea base: el primer cambio emite
    }
    // Respaldo de la vigilancia del sistema: una revisión cada tanto, después de la línea base
    // (solo emite si la lista cambió).
    if (gen !== this.generacion) return;
    this.revision = setInterval(() => {
      if (!this.temporizador) void this.refrescar(gen);
    }, this.d.revisionMs ?? 30_000);
    this.revision.unref();
  }

  private programar(): void {
    const espera = this.d.esperaMs ?? 1000;
    const ahora = Date.now();
    if (this.temporizador) {
      // Al borrar la carpeta Windows lanza eventos sin parar: tope de espera para no postergar siempre.
      if (ahora - this.primerEvento >= espera * 5) return;
      clearTimeout(this.temporizador);
    } else {
      this.primerEvento = ahora;
    }
    const gen = this.generacion;
    this.temporizador = setTimeout(() => {
      this.temporizador = null;
      void this.refrescar(gen);
    }, espera);
    this.temporizador.unref();
  }

  private async refrescar(gen: number): Promise<void> {
    const mia = ++this.secuencia;
    try {
      const cfg = await this.d.leerConfig();
      const lista = await this.calcular(this.carpeta, cfg);
      if (gen !== this.generacion || mia !== this.secuencia) return;
      if (
        this.carpeta &&
        !(await stat(this.carpeta).then(
          (e) => e.isDirectory(),
          () => false,
        ))
      ) {
        // La carpeta ya no existe: se deja de vigilar (los eventos no paran) y se avisa una vez.
        this.cerrarVigia();
        this.pararRevision();
        if (gen !== this.generacion || mia !== this.secuencia) return;
      }
      const firma = JSON.stringify(lista.map((s) => s.carpeta));
      if (firma === this.ultima) return;
      this.ultima = firma;
      this.d.eventos.emit('proyectos:sugerencias', lista);
    } catch {
      // se reintenta con el siguiente cambio
    }
  }

  private detener(): void {
    this.generacion++;
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = null;
    this.cerrarVigia();
    this.pararRevision();
  }

  private pararRevision(): void {
    if (this.revision) clearInterval(this.revision);
    this.revision = null;
  }

  private cerrarVigia(): void {
    try {
      this.vigia?.close();
    } catch {
      // ya cerrada
    }
    this.vigia = null;
  }

  dispose(): void {
    this.detener();
    this.carpeta = null;
    this.fijada = true;
  }
}

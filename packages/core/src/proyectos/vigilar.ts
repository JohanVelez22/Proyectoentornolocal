import { watch, type FSWatcher } from 'node:fs';
import { readdir } from 'node:fs/promises';
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
}

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
  private vigia: FSWatcher | null = null;
  private carpeta: string | null = null;
  private temporizador: NodeJS.Timeout | null = null;
  private ultima: string | null = null;
  /** Cada cambio de vigilancia invalida los cálculos que estaban en curso. */
  private generacion = 0;

  constructor(private readonly d: DepsVigilante) {}

  /** Sugerencias de la carpeta vigilada en la configuración (vacío si no hay o no existe). */
  async sugerencias(): Promise<SugerenciaProyecto[]> {
    const cfg = await this.d.leerConfig();
    return this.calcular(this.carpeta ?? cfg.proyectos.carpetaVigilada, cfg);
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
    this.ultima = null;
    if (!carpeta) return;
    try {
      this.vigia = watch(carpeta, { persistent: false }, () => this.programar());
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
      if (gen === this.generacion) this.ultima = JSON.stringify(lista.map((s) => s.carpeta));
    } catch {
      // sin línea base: el primer cambio emite
    }
  }

  private programar(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    const gen = this.generacion;
    this.temporizador = setTimeout(() => {
      this.temporizador = null;
      void this.refrescar(gen);
    }, this.d.esperaMs ?? 1000);
    this.temporizador.unref();
  }

  private async refrescar(gen: number): Promise<void> {
    try {
      const cfg = await this.d.leerConfig();
      const lista = await this.calcular(this.carpeta, cfg);
      if (gen !== this.generacion) return;
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
  }
}

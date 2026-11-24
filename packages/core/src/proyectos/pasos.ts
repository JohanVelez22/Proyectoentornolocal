import type { Sitio } from '../tipos';
import type { PasoReceta, TipoPaso } from './config';

/** Lo que recibe la implementación de un paso de receta. */
export interface ContextoPaso {
  sitio: Sitio;
  paso: PasoReceta;
  /** Carpeta del proyecto: el cwd de los comandos del paso. */
  carpeta: string;
  /** Agrega una línea al registro en vivo del paso (nunca claves ni tokens). */
  linea: (texto: string) => void;
  /** Deja una marca en el estado del paso (qué hizo de verdad, p. ej. `base-creada`). */
  marcar?: (marca: string) => void;
  /** Se aborta al cancelar la receta: la implementación debe detener lo que esté corriendo. */
  senal: AbortSignal;
}

/** Ejecuta un paso. Termina bien si el paso quedó listo; lanza un Error (en español) si falló. */
export type ImplementacionPaso = (ctx: ContextoPaso) => Promise<void>;

/** Registro de tipos de paso → implementación. Las implementaciones reales llegan en la Task 4. */
export class RegistroPasos {
  private readonly impl = new Map<TipoPaso, ImplementacionPaso>();

  constructor(inicial: Partial<Record<TipoPaso, ImplementacionPaso>> = {}) {
    for (const [tipo, fn] of Object.entries(inicial) as [TipoPaso, ImplementacionPaso][]) {
      this.registrar(tipo, fn);
    }
  }

  registrar(tipo: TipoPaso, fn: ImplementacionPaso): this {
    this.impl.set(tipo, fn);
    return this;
  }

  obtener(tipo: TipoPaso): ImplementacionPaso | undefined {
    return this.impl.get(tipo);
  }

  tiene(tipo: TipoPaso): boolean {
    return this.impl.has(tipo);
  }
}

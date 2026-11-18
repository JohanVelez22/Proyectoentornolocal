import type { MotorBd } from './bd/env';
import type { EstadoHosts, EstadoServicio, EstadoTunel, ProgresoInstalacion, Sitio } from './tipos';

export interface ProgresoBd {
  operacion: 'restaurar' | 'respaldar' | 'importar';
  motor: MotorBd;
  base: string;
  /** Una línea de la salida de la herramienta (sin claves). */
  linea: string;
}

export interface ProgresoIa {
  modelo: string;
  estado: string;
  completado: number;
  total: number;
}

export type EventosNucleo = {
  'servicio:estado': EstadoServicio;
  'sitio:cambio': Sitio[];
  'tunel:estado': EstadoTunel;
  'instalacion:progreso': ProgresoInstalacion;
  'hosts:estado': EstadoHosts;
  'bd:progreso': ProgresoBd;
  'ia:progreso': ProgresoIa;
};

export class Eventos<M extends Record<string, unknown>> {
  private oyentes = new Map<keyof M, Set<(dato: never) => void>>();

  on<K extends keyof M>(evento: K, fn: (dato: M[K]) => void): () => void {
    let set = this.oyentes.get(evento);
    if (!set) {
      set = new Set();
      this.oyentes.set(evento, set);
    }
    set.add(fn as (dato: never) => void);
    return () => {
      set.delete(fn as (dato: never) => void);
    };
  }

  emit<K extends keyof M>(evento: K, dato: M[K]): void {
    for (const fn of [...(this.oyentes.get(evento) ?? [])]) {
      try {
        (fn as (d: M[K]) => void)(dato);
      } catch (e) {
        console.error(`Error en oyente de "${String(evento)}":`, e);
      }
    }
  }
}

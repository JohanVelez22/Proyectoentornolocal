import type { Aviso } from './avisos/avisos';
import type { MotorBd } from './bd/env';
import type { CierreConfirmacion, SolicitudConfirmacion } from './mcp/servidor';
import type { MuestraSistema } from './monitor/metricas';
import type { SugerenciaProyecto } from './proyectos/vigilar';
import type { EstadoHosts, EstadoServicio, EstadoTunel, ProgresoInstalacion, Sitio } from './tipos';

export interface ProgresoBd {
  operacion: 'restaurar' | 'respaldar' | 'importar';
  motor: MotorBd;
  base: string;
  /** Una línea de la salida de la herramienta (sin claves). */
  linea: string;
}

/** Estado de un paso de receta (Task 3). */
export type EstadoPasoReceta = 'pendiente' | 'corriendo' | 'listo' | 'error' | 'omitido';

export interface ProgresoReceta {
  sitioId: string;
  pasoId: string;
  estado: EstadoPasoReceta;
  /** Una línea del registro en vivo del paso (o el mensaje del error). */
  linea?: string;
  /** Es de una corrida suelta (p. ej. tras traer cambios): no cambia la receta guardada. */
  suelta?: boolean;
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
  'receta:progreso': ProgresoReceta;
  /** Una línea de progreso (saneada, sin tokens) del clon de `destino`. */
  'git:progreso': { destino: string; linea: string };
  /** Cambió la lista de carpetas nuevas que parecen un proyecto (carpeta vigilada). */
  'proyectos:sugerencias': SugerenciaProyecto[];
  /** Hay un aviso de inicio nuevo (p. ej. servicios que no encendieron); se lee con tomarAvisoInicio. */
  'aviso:inicio': string;
  /** Un aviso nuevo en el centro de avisos (ya con id, fecha y sin leer). */
  'aviso:nuevo': Aviso;
  /** El usuario hizo clic en la notificación nativa de este aviso: la interfaz navega a su acción. */
  'aviso:abrir': Aviso;
  /** Una muestra de rendimiento (solo mientras las métricas están iniciadas). */
  'metricas:muestra': MuestraSistema;
  /** Líneas nuevas (saneadas) de una fuente de registro que se está siguiendo. */
  'registro:lineas': { id: string; lineas: string[] };
  /** Un cliente MCP pide una acción destructiva: la ventana responde con responderConfirmacionMcp. */
  'mcp:confirmar': SolicitudConfirmacion;
  /** Esa confirmación ya no está pendiente (aprobada, rechazada, vencida, cancelada o detenido). */
  'mcp:confirmacion-cerrada': CierreConfirmacion;
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

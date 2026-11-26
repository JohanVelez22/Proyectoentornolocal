import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { EstadoProceso } from '../procesos/supervisor';
import { validarComandoTarea } from '../tareas/comando';
import type { ProcesoProyecto, Sitio } from '../tipos';
import { existe } from './archivos';

/** Id del proceso de Reverb dentro del sitio (`proy-<sitio>-reverb`). */
export const ID_PROCESO_REVERB = 'reverb';
/** Puerto que se prefiere (el de Reverb por defecto); si está tomado se asigna otro libre. */
export const PUERTO_REVERB_PREFERIDO = 8080;
/** Solo bucle local, puesto de forma explícita: nunca depende del valor por defecto de Reverb. */
export const DIRECCION_REVERB = '127.0.0.1';

/**
 * Comando de Reverb: `php artisan reverb:start --host=127.0.0.1 --port=<puerto>`. Tiene la forma
 * de la lista cerrada de D29 (`php <archivo> [args]`, sin shell ni código en la línea) y se
 * valida con ella.
 */
export function comandoReverb(puerto: number): string[] {
  const c = [
    'php',
    'artisan',
    'reverb:start',
    `--host=${DIRECCION_REVERB}`,
    `--port=${String(puerto)}`,
  ];
  validarComandoTarea(c);
  return c;
}

/** Proceso de proyecto de Reverb: no arranca solo y se reinicia si cae. */
export function procesoReverb(puerto: number): ProcesoProyecto {
  return {
    id: ID_PROCESO_REVERB,
    nombre: 'Laravel Reverb',
    comando: comandoReverb(puerto),
    cwd: 'raiz',
    autoIniciar: false,
    reiniciar: true,
    puerto,
    proxy: false,
  };
}

/**
 * Variables `REVERB_*` que el sitio necesita para hablar con este proceso. Solo las del
 * servidor y el cliente local, nunca el id, la clave ni el secreto de la aplicación (esos los
 * crea `php artisan reverb:install`). No se escriben aquí: la interfaz las pasa al gestor de
 * `.env` (D16), que enseña la vista previa y pide confirmación.
 */
export function variablesReverb(puerto: number): Record<string, string> {
  return {
    BROADCAST_CONNECTION: 'reverb',
    REVERB_SERVER_HOST: DIRECCION_REVERB,
    REVERB_SERVER_PORT: String(puerto),
    REVERB_HOST: DIRECCION_REVERB,
    REVERB_PORT: String(puerto),
    REVERB_SCHEME: 'http',
  };
}

export type MotivoSinReverb = 'reverb.no_laravel' | 'reverb.no_confiado' | 'reverb.sin_paquete';

export interface EstadoReverb {
  /** El sitio admite Reverb (Laravel, de confianza y con `laravel/reverb` instalado). */
  disponible: boolean;
  motivo: MotivoSinReverb | null;
  /** El proceso está dado de alta en el sitio. */
  activo: boolean;
  puerto: number | null;
  estado: EstadoProceso;
}

export interface DepsReverb {
  sitio(id: string): Promise<Sitio | undefined>;
  /** Cambia solo los procesos del sitio (por `guardarSitio`, que conserva el resto). */
  guardarProcesos(sitio: Sitio, procesos: ProcesoProyecto[]): Promise<void>;
  puertoLibre(o: { reservados: number[]; preferido: number; sitioId: string }): Promise<number>;
  iniciar(sitioId: string, procesoId: string): Promise<void>;
  detener(sitioId: string, procesoId: string): Promise<void>;
  estado(sitioId: string, procesoId: string): EstadoProceso;
}

/**
 * Reverb como proceso por sitio. Solo en sitios Laravel marcados como de confianza y con el
 * paquete `laravel/reverb` en `vendor`: el comando sale de código del propio proyecto.
 */
export class ReverbSitio {
  constructor(private readonly d: DepsReverb) {}

  private async existente(sitioId: string): Promise<Sitio> {
    const s = await this.d.sitio(sitioId);
    if (!s) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${sitioId}`);
    return s;
  }

  private async motivo(s: Sitio): Promise<MotivoSinReverb | null> {
    if (s.tipo !== 'laravel') return 'reverb.no_laravel';
    if (s.confiado !== true || s.pendiente) return 'reverb.no_confiado';
    const paquete = path.join(s.carpeta, 'vendor', 'laravel', 'reverb', 'composer.json');
    return (await existe(paquete)) ? null : 'reverb.sin_paquete';
  }

  async estado(sitioId: string): Promise<EstadoReverb> {
    const s = await this.existente(sitioId);
    const motivo = await this.motivo(s);
    const p = s.procesos.find((x) => x.id === ID_PROCESO_REVERB);
    return {
      disponible: motivo === null,
      motivo,
      activo: p !== undefined,
      puerto: p?.puerto ?? null,
      estado: this.d.estado(sitioId, ID_PROCESO_REVERB),
    };
  }

  /** Da de alta el proceso con un puerto libre y lo enciende. Exige `confirmado === true`. */
  async activar(sitioId: string, confirmado: boolean): Promise<{ puerto: number }> {
    if (confirmado !== true) {
      throw new ErrorWolf('reverb.sin_confirmar', 'Confirme que quiere encender Reverb.');
    }
    const s = await this.existente(sitioId);
    const motivo = await this.motivo(s);
    if (motivo !== null) throw new ErrorWolf(motivo, 'Este proyecto no admite Reverb.');
    const previo = s.procesos.find((x) => x.id === ID_PROCESO_REVERB);
    let puerto = previo?.puerto ?? null;
    if (puerto === null) {
      puerto = await this.d.puertoLibre({
        reservados: s.procesos.filter((x) => x.puerto !== null).map((x) => x.puerto!),
        preferido: PUERTO_REVERB_PREFERIDO,
        sitioId,
      });
    }
    // Siempre el comando propio: un proceso `reverb` editado a mano no se conserva.
    const proceso = procesoReverb(puerto);
    const resto = s.procesos.filter((x) => x.id !== ID_PROCESO_REVERB);
    await this.d.guardarProcesos(s, [...resto, proceso]);
    await this.d.iniciar(sitioId, ID_PROCESO_REVERB);
    return { puerto };
  }

  /** Detiene el proceso y lo quita del sitio. */
  async desactivar(sitioId: string): Promise<void> {
    const s = await this.existente(sitioId);
    await this.d.detener(sitioId, ID_PROCESO_REVERB);
    if (s.procesos.some((x) => x.id === ID_PROCESO_REVERB)) {
      await this.d.guardarProcesos(
        s,
        s.procesos.filter((x) => x.id !== ID_PROCESO_REVERB),
      );
    }
  }

  /** Las variables que propone para el `.env` (nunca las escribe). */
  async variables(sitioId: string): Promise<Record<string, string>> {
    const e = await this.estado(sitioId);
    if (!e.activo || e.puerto === null) {
      throw new ErrorWolf('reverb.sin_activar', 'Encienda Reverb en el proyecto primero.');
    }
    return variablesReverb(e.puerto);
  }
}

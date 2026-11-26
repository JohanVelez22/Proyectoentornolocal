import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { EstadoProceso } from '../procesos/supervisor';
import { validarComandoTarea } from '../tareas/comando';
import type { ProcesoProyecto, Sitio } from '../tipos';

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

/** ¿El proceso es exactamente el comando propio de Reverb para su puerto? */
export function esComandoPropio(p: ProcesoProyecto): boolean {
  if (p.puerto === null) return false;
  const propio = comandoReverb(p.puerto);
  return p.comando.length === propio.length && p.comando.every((a, i) => a === propio[i]);
}

/**
 * `vendor/laravel/reverb` existe y es una carpeta de verdad (no un enlace ni una unión que lleve
 * fuera del proyecto) con su `composer.json` como archivo normal.
 */
export async function hayPaqueteReverb(carpeta: string): Promise<boolean> {
  const dir = path.join(carpeta, 'vendor', 'laravel', 'reverb');
  try {
    const d = await lstat(dir);
    if (d.isSymbolicLink() || !d.isDirectory()) return false;
    const c = await lstat(path.join(dir, 'composer.json'));
    return c.isFile() && !c.isSymbolicLink();
  } catch {
    return false;
  }
}

export type MotivoSinReverb = 'reverb.no_laravel' | 'reverb.no_confiado' | 'reverb.sin_paquete';

export interface EstadoReverb {
  /** El sitio admite Reverb (Laravel, de confianza y con `laravel/reverb` instalado). */
  disponible: boolean;
  motivo: MotivoSinReverb | null;
  /** El proceso está dado de alta en el sitio. */
  activo: boolean;
  /**
   * El proceso `reverb` del sitio no tiene el comando propio (otro host, otro programa, otro
   * puerto…): alguien lo cambió. «Encender» lo reemplaza por el comando propio.
   */
  modificado: boolean;
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
    return (await hayPaqueteReverb(s.carpeta)) ? null : 'reverb.sin_paquete';
  }

  async estado(sitioId: string): Promise<EstadoReverb> {
    const s = await this.existente(sitioId);
    const motivo = await this.motivo(s);
    const p = s.procesos.find((x) => x.id === ID_PROCESO_REVERB);
    return {
      disponible: motivo === null,
      motivo,
      activo: p !== undefined,
      modificado: p !== undefined && !esComandoPropio(p),
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
    // Un proceso `reverb` que ya existe no se toma por bueno: puede estar vivo con otro comando
    // (otro host, otro programa). Antes de cambiar nada se detiene por su PID (el supervisor).
    if (previo !== undefined || this.d.estado(sitioId, ID_PROCESO_REVERB) !== 'apagado') {
      await this.d.detener(sitioId, ID_PROCESO_REVERB);
    }
    // Siempre un puerto que el núcleo da por libre (respeta los reservados, los pools de PHP y el
    // mínimo de 1024); el del proceso anterior solo es la preferencia.
    const puerto = await this.d.puertoLibre({
      reservados: s.procesos
        .filter((x) => x.id !== ID_PROCESO_REVERB && x.puerto !== null)
        .map((x) => x.puerto!),
      preferido: previo?.puerto ?? PUERTO_REVERB_PREFERIDO,
      sitioId,
    });
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

import type { DatosError } from './api';

/**
 * Errores a través del puente del preload (I4). `contextBridge` solo deja pasar el `message` y la
 * traza de un `Error`: se pierden `codigo` y `datos`. Por eso el preload rechaza con un objeto
 * plano (que se clona entero) y la ventana lo vuelve a convertir en un `Error` con su código, en
 * un solo punto (`renderer/api.ts`).
 */
export interface RechazoIpc {
  /** Marca para reconocerlo al rehidratar. */
  __errorIpc: true;
  name: 'ErrorIpc';
  message: string;
  mensaje: string;
  codigo?: string;
  datos?: DatosError;
}

/** El objeto plano con el que el preload rechaza una llamada fallida. */
export function rechazoDe(error: {
  mensaje: string;
  codigo?: string;
  datos?: DatosError;
}): RechazoIpc {
  return {
    __errorIpc: true,
    name: 'ErrorIpc',
    message: error.mensaje,
    mensaje: error.mensaje,
    ...(error.codigo ? { codigo: error.codigo } : {}),
    ...(error.datos ? { datos: error.datos } : {}),
  };
}

/** El `Error` que ve la interfaz: conserva `instanceof Error`, `message`, `codigo` y `datos`. */
export class ErrorIpc extends Error {
  readonly codigo?: string;
  readonly datos?: DatosError;
  /** Alias en español (los textos de `traducirError` lo aceptan). */
  readonly mensaje: string;

  constructor(r: Pick<RechazoIpc, 'mensaje' | 'codigo' | 'datos'>) {
    super(r.mensaje);
    this.name = 'ErrorIpc';
    this.mensaje = r.mensaje;
    if (r.codigo !== undefined) this.codigo = r.codigo;
    if (r.datos !== undefined) this.datos = r.datos;
  }
}

const esRechazo = (e: unknown): e is RechazoIpc =>
  e !== null && typeof e === 'object' && (e as { __errorIpc?: unknown }).__errorIpc === true;

/** Convierte un rechazo plano en `ErrorIpc`; cualquier otra cosa se deja tal cual. */
export function rehidratar(e: unknown): unknown {
  if (!esRechazo(e)) return e;
  const mensaje = typeof e.mensaje === 'string' ? e.mensaje : String(e.message);
  return new ErrorIpc({
    mensaje,
    ...(typeof e.codigo === 'string' ? { codigo: e.codigo } : {}),
    ...(e.datos && typeof e.datos === 'object' ? { datos: e.datos } : {}),
  });
}

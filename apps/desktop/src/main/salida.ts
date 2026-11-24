/**
 * "Salir" (bandeja): pregunta si se apagan los servicios con un diálogo MODAL de la ventana, que
 * se trae al frente, encima de todo y con el foco. En 0.1.0 el diálogo iba sin padre con la
 * ventana oculta y podía quedar detrás de otra ventana: la app seguía abierta y un segundo
 * "Salir" no hacía nada. Ahora un segundo "Salir" vuelve a traer el diálogo al frente.
 */

/** Lo que se usa de la BrowserWindow (así se prueba sin Electron). */
export interface VentanaSalida {
  isDestroyed(): boolean;
  isMinimized(): boolean;
  restore(): void;
  show(): void;
  focus(): void;
  moveTop(): void;
  setAlwaysOnTop(flag: boolean): void;
}

/** Respuestas del diálogo, en el orden de sus botones. */
export const SALIDA_APAGAR = 0;
export const SALIDA_SIN_APAGAR = 1;
export const SALIDA_CANCELAR = 2;

export interface DepsSalida {
  ventana: () => VentanaSalida | null;
  /** ¿Ya se está cerrando la app (por otra vía)? */
  saliendo: () => boolean;
  /** Muestra el diálogo modal de `padre` y devuelve el botón elegido. */
  preguntar: (padre: VentanaSalida) => Promise<number>;
  /** Cierra el núcleo (apagando o no los servicios) y sale de la app. */
  terminar: (detenerServicios: boolean) => Promise<void>;
}

function alFrente(v: VentanaSalida): void {
  if (v.isMinimized()) v.restore();
  v.show();
  v.setAlwaysOnTop(true);
  v.moveTop();
  v.focus();
}

export function crearSalida(d: DepsSalida): { salir(): Promise<void>; preguntando(): boolean } {
  let abierta: VentanaSalida | null = null;
  let preguntando = false;

  async function salir(): Promise<void> {
    if (d.saliendo()) return;
    if (preguntando) {
      // El diálogo ya está abierto (quizá tapado): se trae al frente otra vez.
      if (abierta && !abierta.isDestroyed()) alFrente(abierta);
      return;
    }
    const v = d.ventana();
    if (!v || v.isDestroyed()) {
      // Sin ventana a la que anclar el diálogo: la salida segura apaga todo.
      await d.terminar(true);
      return;
    }
    preguntando = true;
    abierta = v;
    let r: number;
    try {
      alFrente(v);
      r = await d.preguntar(v);
    } catch (e) {
      console.error('No se pudo mostrar el diálogo de salida:', e);
      return;
    } finally {
      preguntando = false;
      abierta = null;
      if (!v.isDestroyed()) v.setAlwaysOnTop(false);
    }
    if (r === SALIDA_CANCELAR) return;
    await d.terminar(r === SALIDA_APAGAR);
  }

  return { salir, preguntando: () => preguntando };
}

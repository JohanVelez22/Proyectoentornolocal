import type { ResultadoConfirmacionCli, SolicitudCli } from './ordenes';

/** Plazo para que alguien conteste en la ventana de la app. */
export const PLAZO_CONFIRMACION_CLI_MS = 45_000;
/** Diálogos pendientes a la vez como mucho (cuenta hasta que se responden de verdad). */
export const MAX_CONFIRMACIONES_CLI = 3;
/** Diálogos que se pueden abrir por minuto como mucho: una terminal que insiste no acosa al usuario. */
export const MAX_DIALOGOS_POR_MINUTO = 5;
const VENTANA_DIALOGOS_MS = 60_000;

export interface DepsConfirmadorCli {
  /** La ventana de la app (diálogo nativo): true solo si el usuario aprobó. Sin esto nada se aprueba. */
  preguntar?: (s: SolicitudCli) => Promise<boolean>;
  plazoMs?: () => number | undefined;
  maximo?: number;
  /** Pruebas: diálogos por minuto y reloj. */
  porMinuto?: number;
  ahora?: () => number;
}

/**
 * Confirmaciones de la CLI en la ventana de la app: publicar un sitio o cambiar el PHP de todas las
 * terminales no lo decide la línea de órdenes. Mismo criterio que las confirmaciones del MCP:
 * plazo y máximo de pendientes. Un diálogo que venció sigue ocupando su lugar hasta que se cierre.
 */
export class ConfirmadorCli {
  private pendientes = 0;
  /** Cuándo se abrió cada diálogo reciente (límite de frecuencia). */
  private abiertos: number[] = [];

  constructor(private readonly d: DepsConfirmadorCli) {}

  async pedir(s: SolicitudCli): Promise<ResultadoConfirmacionCli> {
    const preguntar = this.d.preguntar;
    if (!preguntar) return 'rechazada';
    if (this.pendientes >= (this.d.maximo ?? MAX_CONFIRMACIONES_CLI)) return 'ocupado';
    const ahora = (this.d.ahora ?? Date.now)();
    this.abiertos = this.abiertos.filter((t) => ahora - t < VENTANA_DIALOGOS_MS);
    if (this.abiertos.length >= (this.d.porMinuto ?? MAX_DIALOGOS_POR_MINUTO)) return 'ocupado';
    this.abiertos.push(ahora);
    this.pendientes++;
    const respuesta = preguntar(s).then(
      (ok) => ok === true,
      () => false,
    );
    void respuesta.finally(() => {
      this.pendientes--;
    });
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const vencida = new Promise<'vencida'>((resolve) => {
      temporizador = setTimeout(
        () => resolve('vencida'),
        this.d.plazoMs?.() ?? PLAZO_CONFIRMACION_CLI_MS,
      );
    });
    try {
      const r = await Promise.race([respuesta, vencida]);
      return r === 'vencida' ? 'vencida' : r ? 'aprobada' : 'rechazada';
    } finally {
      clearTimeout(temporizador);
    }
  }
}

import {
  CODIGOS_ERROR,
  ErrorWolf,
  type EjecutorDiff,
  type MensajeDiff,
  type OpcionesEjecucionDiff,
  type RespuestaDiff,
} from '@pel/core';
import type { ProcesoTrabajo } from './conversorSupervisor';

/**
 * Supervisor del proceso de trabajo del diff de carpetas (D44). Igual que el del conversor (D34):
 * no importa Electron, así se prueba con procesos reales.
 *
 * - Un proceso nuevo por operación: lo que leyó muere con él, y ninguna operación bloquea el
 *   proceso principal (la ventana sigue respondiendo mientras se recorren las carpetas).
 * - Solo corre una a la vez (el servicio ya lo exige; aquí también, por si acaso).
 * - Plazo y cancelación: al vencer o al cancelar se mata el proceso, por su PID propio.
 * - Memoria: se mide la del PROCESO DE TRABAJO y se mata si pasa del tope.
 * - No se confía en lo que contesta: la forma y el código se validan.
 */

export interface OpcionesSupervisorDiff {
  lanzar(): ProcesoTrabajo;
  /** Memoria (bytes) del proceso con ese PID; null si no se pudo medir. */
  memoriaDe(pid: number): number | null;
  limiteMemoriaBytes?: number;
  intervaloMs?: number;
}

export const LIMITE_MEMORIA_DIFF = 512 * 1024 * 1024;
const MB = 1024 * 1024;
const CODIGOS_CONOCIDOS: ReadonlySet<string> = new Set(CODIGOS_ERROR);

/** Valida lo que contesta el proceso de trabajo. */
function respuestaValida(r: unknown): r is RespuestaDiff {
  if (typeof r !== 'object' || r === null) return false;
  const o = r as Record<string, unknown>;
  if (o.ok === true) return typeof o.datos === 'object' && o.datos !== null;
  if (o.ok !== false) return false;
  if (typeof o.codigo !== 'string' || !CODIGOS_CONOCIDOS.has(o.codigo)) return false;
  return o.datos === undefined || (typeof o.datos === 'object' && o.datos !== null);
}

export function crearEjecutorDiffSupervisado(o: OpcionesSupervisorDiff): EjecutorDiff {
  const limite = o.limiteMemoriaBytes ?? LIMITE_MEMORIA_DIFF;
  const intervalo = o.intervaloMs ?? 75;
  let ocupado = false;

  return (m: MensajeDiff, op: OpcionesEjecucionDiff): Promise<RespuestaDiff> => {
    if (ocupado) {
      return Promise.reject(
        new ErrorWolf('diff.ocupado', 'Ya hay una comparación en curso: cancélela o espere.'),
      );
    }
    if (op.senal?.aborted) {
      return Promise.reject(new ErrorWolf('diff.cancelado', 'Comparación cancelada.'));
    }
    ocupado = true;
    return new Promise<RespuestaDiff>((resolve, reject) => {
      let proceso: ProcesoTrabajo;
      try {
        proceso = o.lanzar();
      } catch {
        ocupado = false;
        reject(new ErrorWolf('diff.fallo', 'No se pudo iniciar el proceso de trabajo.'));
        return;
      }
      let cerrado = false;
      const cerrar = (accion: () => void): void => {
        if (cerrado) return;
        cerrado = true;
        ocupado = false;
        clearTimeout(reloj);
        clearInterval(vigia);
        op.senal?.removeEventListener('abort', alAbortar);
        try {
          proceso.kill();
        } catch {
          // ya salió
        }
        accion();
      };
      const reloj = setTimeout(
        () =>
          cerrar(() =>
            reject(
              new ErrorWolf('diff.plazo', 'La comparación tardó demasiado y se canceló.', {
                segundos: Math.max(1, Math.round(op.plazoMs / 1000)),
              }),
            ),
          ),
        op.plazoMs,
      );
      const vigia = setInterval(() => {
        const pid = proceso.pid;
        if (pid === undefined) return;
        const memoria = o.memoriaDe(pid);
        if (memoria !== null && memoria > limite) {
          cerrar(() =>
            reject(
              new ErrorWolf('diff.memoria', 'La comparación necesita demasiada memoria.', {
                maximo: `${Math.round(limite / MB)} MB`,
              }),
            ),
          );
        }
      }, intervalo);
      const alAbortar = (): void =>
        cerrar(() => reject(new ErrorWolf('diff.cancelado', 'Comparación cancelada.')));
      op.senal?.addEventListener('abort', alAbortar, { once: true });

      proceso.onMessage((r) =>
        cerrar(() => {
          if (respuestaValida(r)) resolve(r);
          else reject(new ErrorWolf('diff.fallo', 'Respuesta no válida del proceso.'));
        }),
      );
      proceso.onExit(() =>
        cerrar(() =>
          reject(new ErrorWolf('diff.fallo', 'El proceso de trabajo terminó sin responder.')),
        ),
      );
      try {
        proceso.postMessage(m);
      } catch {
        cerrar(() => reject(new ErrorWolf('diff.fallo', 'No se pudo enviar el trabajo.')));
      }
    });
  };
}

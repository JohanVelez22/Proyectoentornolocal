import {
  CODIGOS_ERROR,
  ErrorWolf,
  type EjecutorTrabajo,
  type MensajeTrabajo,
  type OpcionesEjecucion,
  type RespuestaTrabajo,
} from '@pel/core';

/**
 * Supervisor del proceso de trabajo del conversor y de la optimización de PDF (D34). No importa
 * Electron: quien lo usa le da cómo lanzar el proceso (`utilityProcess` en la aplicación) y cómo
 * medir la memoria de ESE proceso (`app.getAppMetrics()`), así se puede probar con procesos
 * reales sin Electron.
 *
 * - Un proceso nuevo por trabajo: lo que el documento dejó en memoria muere con él.
 * - Solo corre un trabajo a la vez (cola): una conversión enorme no compite con otra.
 * - Plazo: al vencer se mata el proceso y el error trae un código.
 * - Memoria: se mide cada pocos milisegundos la del PROCESO DE TRABAJO (también la externa:
 *   `Buffer`/`ArrayBuffer`, que `--max-old-space-size` no limita) y se mata si pasa del tope.
 * - Se mata por el proceso propio (su PID), nunca por nombre de imagen.
 */

/** Lo mínimo de un proceso de trabajo (un `UtilityProcess` de Electron lo cumple con un adaptador). */
export interface ProcesoTrabajo {
  readonly pid: number | undefined;
  postMessage(m: unknown): void;
  onMessage(cb: (m: unknown) => void): void;
  onExit(cb: (codigo: number | null) => void): void;
  kill(): void;
}

export interface OpcionesSupervisor {
  lanzar(): ProcesoTrabajo;
  /** Memoria (bytes) del proceso con ese PID; null si no se pudo medir. */
  memoriaDe(pid: number): number | null;
  /** Tope de memoria del proceso de trabajo. Por omisión, 768 MB. */
  limiteMemoriaBytes?: number;
  /** Cada cuánto se mide la memoria. Por omisión, 75 ms. */
  intervaloMs?: number;
}

export const LIMITE_MEMORIA_TRABAJO = 768 * 1024 * 1024;

const MB = 1024 * 1024;

/** Máximo de trabajos a la vez: uno en ejecución y uno esperando (cada uno retiene hasta 50 MB). */
const MAX_PENDIENTES = 2;

const CODIGOS_CONOCIDOS: ReadonlySet<string> = new Set(CODIGOS_ERROR);

/** Valida lo que contesta el proceso de trabajo (no se confía en su forma). */
function respuestaValida(r: unknown, topeTexto: number | undefined): r is RespuestaTrabajo {
  if (typeof r !== 'object' || r === null) return false;
  const o = r as Record<string, unknown>;
  if (typeof o.ok !== 'boolean') return false;
  if (o.texto !== undefined) {
    if (typeof o.texto !== 'string') return false;
    if (topeTexto !== undefined && o.texto.length > topeTexto) return false;
  }
  if (o.ok) return o.datos === undefined || o.datos instanceof Uint8Array;
  // Error: `datos` son los parámetros del mensaje (objeto plano), no bytes.
  if (typeof o.codigo !== 'string' || !CODIGOS_CONOCIDOS.has(o.codigo)) return false;
  return o.datos === undefined || (typeof o.datos === 'object' && o.datos !== null);
}

export function crearEjecutorSupervisado(o: OpcionesSupervisor): EjecutorTrabajo {
  const limite = o.limiteMemoriaBytes ?? LIMITE_MEMORIA_TRABAJO;
  const intervalo = o.intervaloMs ?? 75;
  let cola: Promise<unknown> = Promise.resolve();
  /** Trabajos en ejecución o esperando (tope: uno corriendo y uno esperando). */
  let pendientes = 0;

  const ejecutar = (m: MensajeTrabajo, op: OpcionesEjecucion): Promise<RespuestaTrabajo> =>
    new Promise((resolve, reject) => {
      if (op.senal?.aborted) {
        reject(new ErrorWolf('conversor.cancelado', 'Conversión cancelada.'));
        return;
      }
      let proceso: ProcesoTrabajo;
      try {
        proceso = o.lanzar();
      } catch {
        reject(
          new ErrorWolf('conversor.archivo_invalido', 'No se pudo iniciar el proceso de trabajo.'),
        );
        return;
      }
      let cerrado = false;
      const cerrar = (accion: () => void): void => {
        if (cerrado) return;
        cerrado = true;
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
              new ErrorWolf('conversor.plazo', 'La conversión tardó demasiado y se canceló.', {
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
              new ErrorWolf(
                'conversor.memoria',
                'El archivo necesita demasiada memoria y se canceló.',
                { maximo: `${Math.round(limite / MB)} MB` },
              ),
            ),
          );
        }
      }, intervalo);
      const alAbortar = (): void =>
        cerrar(() => reject(new ErrorWolf('conversor.cancelado', 'Conversión cancelada.')));
      op.senal?.addEventListener('abort', alAbortar, { once: true });

      proceso.onMessage((r) =>
        cerrar(() => {
          if (respuestaValida(r, m.lim?.salida)) resolve(r);
          else
            reject(new ErrorWolf('conversor.archivo_invalido', 'Respuesta no válida del proceso.'));
        }),
      );
      proceso.onExit(() =>
        cerrar(() =>
          reject(
            new ErrorWolf(
              'conversor.archivo_invalido',
              'El archivo está dañado o no es del tipo indicado.',
            ),
          ),
        ),
      );
      try {
        proceso.postMessage(m);
      } catch {
        cerrar(() =>
          reject(
            new ErrorWolf(
              'conversor.archivo_invalido',
              'El archivo está dañado o no es del tipo indicado.',
            ),
          ),
        );
      }
    });

  return (m, op) => {
    if (pendientes >= MAX_PENDIENTES) {
      return Promise.reject(
        new ErrorWolf('conversor.ocupado', 'Ya hay una conversión en curso y otra en espera.'),
      );
    }
    pendientes++;
    // Una sola conversión a la vez; un fallo de la anterior no frena a la siguiente.
    const siguiente = cola.then(
      () => ejecutar(m, op),
      () => ejecutar(m, op),
    );
    cola = siguiente.then(
      () => {
        pendientes--;
      },
      () => {
        pendientes--;
      },
    );
    return siguiente;
  };
}

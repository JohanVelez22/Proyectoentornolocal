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

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const numeroONulo = (v: unknown): boolean =>
  v === null || (typeof v === 'number' && Number.isFinite(v));
const MAX_ENTRADAS = 5_000;
const MAX_FILAS = 5_000;

function entradaValida(e: unknown): boolean {
  if (!esObjeto(e)) return false;
  return (
    typeof e.ruta === 'string' &&
    e.ruta.length > 0 &&
    e.ruta.length <= 4096 &&
    numeroONulo(e.tamanoA) &&
    numeroONulo(e.tamanoB) &&
    (e.motivo === undefined || e.motivo === 'tamano' || e.motivo === 'contenido')
  );
}

function carpetasValidas(d: Record<string, unknown>): boolean {
  for (const g of ['soloA', 'soloB', 'distintos']) {
    const lista = d[g];
    if (!Array.isArray(lista) || lista.length > MAX_ENTRADAS || !lista.every(entradaValida)) {
      return false;
    }
  }
  const r = d.resumen;
  if (!esObjeto(r)) return false;
  const numeros = [
    'archivosA',
    'archivosB',
    'iguales',
    'sinComparar',
    'omitidos',
    'totalSoloA',
    'totalSoloB',
    'totalDistintos',
  ];
  return (
    numeros.every((k) => typeof r[k] === 'number' && Number.isFinite(r[k])) &&
    typeof r.truncado === 'boolean' &&
    typeof r.recortado === 'boolean'
  );
}

const SALTOS = ['lf', 'crlf', 'mixto', 'ninguno'];
const TIPOS_FILA = ['igual', 'quitada', 'agregada', 'salto'];

function archivoValido(d: Record<string, unknown>): boolean {
  switch (d.tipo) {
    case 'binario':
    case 'sensible':
    case 'demasiado-distinto':
      return true;
    case 'tope':
      return typeof d.bytesA === 'number' && typeof d.bytesB === 'number';
    case 'texto':
      return (
        Array.isArray(d.filas) &&
        d.filas.length <= MAX_FILAS &&
        d.filas.every(
          (f) =>
            esObjeto(f) &&
            TIPOS_FILA.includes(f.tipo as string) &&
            numeroONulo(f.numA) &&
            numeroONulo(f.numB) &&
            typeof f.texto === 'string' &&
            f.texto.length <= 1000,
        ) &&
        typeof d.agregadas === 'number' &&
        typeof d.quitadas === 'number' &&
        typeof d.truncado === 'boolean' &&
        typeof d.soloSaltos === 'boolean' &&
        SALTOS.includes(d.saltosA as string) &&
        SALTOS.includes(d.saltosB as string)
      );
    default:
      return false;
  }
}

/** Valida lo que contesta el proceso de trabajo, según lo que se le pidió (no se confía en su forma). */
function respuestaValida(r: unknown, op: MensajeDiff['op']): r is RespuestaDiff {
  if (!esObjeto(r)) return false;
  if (r.ok === true) {
    return (
      esObjeto(r.datos) && (op === 'carpetas' ? carpetasValidas(r.datos) : archivoValido(r.datos))
    );
  }
  if (r.ok !== false) return false;
  if (typeof r.codigo !== 'string' || !CODIGOS_CONOCIDOS.has(r.codigo)) return false;
  return r.datos === undefined || esObjeto(r.datos);
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
          if (respuestaValida(r, m.op)) resolve(r);
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

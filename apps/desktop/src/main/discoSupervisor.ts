import {
  CODIGOS_ERROR,
  ErrorWolf,
  type EjecutorUsoDisco,
  type MensajeUsoDisco,
  type OpcionesEjecucionUsoDisco,
  type ProgresoUsoDisco,
  type RespuestaUsoDisco,
} from '@pel/core';
import type { ProcesoTrabajo } from './conversorSupervisor';

/**
 * Supervisor del proceso de trabajo de «Uso del disco» (D51). Igual que el del diff de carpetas
 * (D44): no importa Electron, así se prueba con procesos reales.
 *
 * - Un proceso nuevo por análisis: lo que leyó muere con él, y el recorrido nunca bloquea el
 *   proceso principal (la ventana sigue respondiendo mientras se recorre el disco).
 * - Solo corre uno a la vez (el servicio ya lo exige; aquí también, por si acaso).
 * - Cancelar, plazo y memoria: se mata el proceso por su PID propio.
 * - El proceso manda avisos de progreso y, al final, el resultado; ni el uno ni el otro se
 *   toman por buenos: la forma, los tipos y el tamaño del árbol se validan antes de pasarlos.
 */

export interface OpcionesSupervisorDisco {
  lanzar(): ProcesoTrabajo;
  /** Memoria (bytes) del proceso con ese PID; null si no se pudo medir. */
  memoriaDe(pid: number): number | null;
  limiteMemoriaBytes?: number;
  intervaloMs?: number;
}

export const LIMITE_MEMORIA_DISCO = 512 * 1024 * 1024;
const MB = 1024 * 1024;
const CODIGOS_CONOCIDOS: ReadonlySet<string> = new Set(CODIGOS_ERROR);

/** Lo que el árbol puede traer como máximo: un árbol podado son unos miles de nodos. */
const MAX_NODOS = 30_000;
const MAX_PROFUNDIDAD = 100;
/** Una ruta de Windows puede llegar a 32 767 caracteres (rutas largas). */
const MAX_TEXTO = 32_767;

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const esTexto = (v: unknown, max = MAX_TEXTO): v is string =>
  typeof v === 'string' && v.length <= max;

function progresoValido(
  m: Record<string, unknown>,
): m is Record<string, unknown> & ProgresoUsoDisco {
  return (
    esNumero(m.archivos) && esNumero(m.carpetas) && esNumero(m.bytes) && esTexto(m.actual, 1024)
  );
}

function arbolValido(raiz: unknown): boolean {
  let nodos = 0;
  const ir = (n: unknown, nivel: number): boolean => {
    if (!esObjeto(n) || nivel > MAX_PROFUNDIDAD || ++nodos > MAX_NODOS) return false;
    if (!esTexto(n.nombre, 1024) || !esNumero(n.tamano)) return false;
    if (n.tipo !== 'carpeta' && n.tipo !== 'archivo' && n.tipo !== 'otros') return false;
    if (n.archivos !== undefined && !esNumero(n.archivos)) return false;
    if (n.denegados !== undefined && !esNumero(n.denegados)) return false;
    if (n.denegado !== undefined && n.denegado !== true) return false;
    if (n.hijos === undefined) return true;
    return Array.isArray(n.hijos) && n.hijos.every((h) => ir(h, nivel + 1));
  };
  return ir(raiz, 0);
}

const listaDe = (v: unknown, max: number, cada: (x: unknown) => boolean): boolean =>
  Array.isArray(v) && v.length <= max && v.every(cada);

function resultadoValido(d: unknown): boolean {
  if (!esObjeto(d)) return false;
  const o = d.omitidos;
  const e = d.extensiones;
  return (
    esTexto(d.raiz) &&
    esNumero(d.total) &&
    esNumero(d.archivos) &&
    esNumero(d.carpetas) &&
    esNumero(d.duracionMs) &&
    typeof d.truncado === 'boolean' &&
    typeof d.enlacesDurosIncompleto === 'boolean' &&
    esObjeto(o) &&
    ['enlaces', 'denegados', 'especiales', 'enlacesDuros'].every((k) => esNumero(o[k])) &&
    listaDe(d.enlaces, 200, (x) => esTexto(x)) &&
    arbolValido(d.arbol) &&
    listaDe(d.archivosTop, 200, (x) => esObjeto(x) && esTexto(x.ruta) && esNumero(x.tamano)) &&
    listaDe(
      d.carpetasTop,
      200,
      (x) => esObjeto(x) && esTexto(x.ruta) && esNumero(x.tamano) && esNumero(x.archivos),
    ) &&
    esObjeto(e) &&
    listaDe(
      e.lista,
      200,
      (x) => esObjeto(x) && esTexto(x.ext, 256) && esNumero(x.bytes) && esNumero(x.archivos),
    ) &&
    esObjeto(e.otros) &&
    esNumero(e.otros.bytes) &&
    esNumero(e.otros.archivos)
  );
}

/** Valida la respuesta final del proceso de trabajo (no se confía en su forma). */
function respuestaValida(
  r: Record<string, unknown>,
): r is Record<string, unknown> & RespuestaUsoDisco {
  if (r.ok === true) return resultadoValido(r.datos);
  if (r.ok !== false) return false;
  if (typeof r.codigo !== 'string' || !CODIGOS_CONOCIDOS.has(r.codigo)) return false;
  return r.datos === undefined || esObjeto(r.datos);
}

export function crearEjecutorUsoDiscoSupervisado(o: OpcionesSupervisorDisco): EjecutorUsoDisco {
  const limite = o.limiteMemoriaBytes ?? LIMITE_MEMORIA_DISCO;
  const intervalo = o.intervaloMs ?? 75;
  let ocupado = false;

  return (m: MensajeUsoDisco, op: OpcionesEjecucionUsoDisco): Promise<RespuestaUsoDisco> => {
    if (ocupado) {
      return Promise.reject(
        new ErrorWolf('disco.ocupado', 'Ya hay un análisis en curso: cancélelo o espere.'),
      );
    }
    if (op.senal?.aborted) {
      return Promise.reject(new ErrorWolf('disco.cancelado', 'Análisis cancelado.'));
    }
    ocupado = true;
    return new Promise<RespuestaUsoDisco>((resolve, reject) => {
      let proceso: ProcesoTrabajo;
      try {
        proceso = o.lanzar();
      } catch {
        ocupado = false;
        reject(new ErrorWolf('disco.fallo', 'No se pudo iniciar el proceso de trabajo.'));
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
              new ErrorWolf('disco.plazo', 'El análisis tardó demasiado y se canceló.', {
                minutos: Math.max(1, Math.round(op.plazoMs / 60_000)),
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
              new ErrorWolf('disco.memoria', 'El análisis necesita demasiada memoria.', {
                maximo: `${Math.round(limite / MB)} MB`,
              }),
            ),
          );
        }
      }, intervalo);
      const alAbortar = (): void =>
        cerrar(() => reject(new ErrorWolf('disco.cancelado', 'Análisis cancelado.')));
      op.senal?.addEventListener('abort', alAbortar, { once: true });

      proceso.onMessage((x) => {
        if (cerrado) return;
        const s = x as Record<string, unknown> | null;
        if (esObjeto(s) && s.tipo === 'progreso' && progresoValido(s)) {
          op.alProgreso?.({
            archivos: s.archivos,
            carpetas: s.carpetas,
            bytes: s.bytes,
            actual: s.actual,
          });
          return;
        }
        cerrar(() => {
          if (esObjeto(s) && s.tipo === 'fin' && respuestaValida(s)) {
            resolve(
              (s.ok === true
                ? { ok: true, datos: s.datos }
                : {
                    ok: false,
                    codigo: s.codigo,
                    ...(s.datos ? { datos: s.datos } : {}),
                  }) as RespuestaUsoDisco,
            );
          } else {
            reject(new ErrorWolf('disco.fallo', 'Respuesta no válida del proceso.'));
          }
        });
      });
      proceso.onExit(() =>
        cerrar(() =>
          reject(new ErrorWolf('disco.fallo', 'El proceso de trabajo terminó sin responder.')),
        ),
      );
      try {
        proceso.postMessage(m);
      } catch {
        cerrar(() => reject(new ErrorWolf('disco.fallo', 'No se pudo enviar el trabajo.')));
      }
    });
  };
}

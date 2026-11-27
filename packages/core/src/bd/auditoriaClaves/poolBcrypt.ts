import { createRequire } from 'node:module';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { ErrorWolf } from '../../errores';

/**
 * Hilos de trabajo para comparar bcrypt fuera del proceso principal (D20). bcrypt en JavaScript
 * es lento a propósito: aun cediendo el control cada ~100 ms, 200 pruebas por cuenta ocuparían el
 * proceso principal durante minutos. El hilo recibe el hash y la lista ya mezclada y responde solo
 * sí o no: nunca cuál clave coincidió.
 *
 * El código del hilo va en una cadena (`eval`) y carga `bcryptjs` por su ruta absoluta: así no hace
 * falta un segundo punto de entrada en el empaquetado. Si el hilo no se puede crear, `crearPool`
 * devuelve null y la auditoría sigue con bcryptjs asíncrono en el hilo principal.
 */

export interface PoolBcrypt {
  readonly tamano: number;
  /** ¿Alguna de las claves coincide con el hash? Rechaza si el pool se cierra. */
  comparar(hash: string, claves: readonly string[]): Promise<boolean>;
  /** Detiene los hilos; las comparaciones pendientes se rechazan. */
  cerrar(): Promise<void>;
}

const CODIGO_HILO = `
const { parentPort, workerData } = require('node:worker_threads');
const b = require(workerData.modulo);
// Prueba de vida: sin esto el hilo no cuenta (el módulo cargó y bcrypt funciona).
parentPort.postMessage({ listo: b.compareSync('x', b.hashSync('x', 4)) === true });
parentPort.on('message', (m) => {
  let ok = false;
  try {
    for (const c of m.claves) {
      if (b.compareSync(c, m.hash)) { ok = true; break; }
    }
  } catch {
    ok = false;
  }
  parentPort.postMessage({ id: m.id, ok });
});
`;

/** Ruta de `bcryptjs` (CommonJS) tal como la resuelve este módulo, o null. */
function rutaBcrypt(): string | null {
  try {
    const req: NodeRequire =
      typeof require === 'function' ? require : createRequire(import.meta.url);
    return req.resolve('bcryptjs');
  } catch {
    return null;
  }
}

interface Tarea {
  id: number;
  hash: string;
  claves: readonly string[];
  ok: (v: boolean) => void;
  mal: (e: Error) => void;
}

/** Hilos por omisión: núcleos − 1 (al menos 1, como mucho 8). */
export const hilosPorOmision = (): number =>
  Math.max(1, Math.min(8, (os.availableParallelism?.() ?? os.cpus().length) - 1));

export interface OpcionesPool {
  /** Ruta del módulo bcrypt que carga cada hilo (pruebas); por omisión, la de `bcryptjs`. */
  modulo?: string;
  /** Cuánto se espera a que un hilo diga que está listo. */
  esperaMs?: number;
}

/**
 * Crea el pool y espera a que cada hilo responda que cargó bcrypt y pasó una comparación de
 * prueba. Los que no responden se descartan; si ninguno responde, devuelve null (la auditoría
 * sigue en el hilo principal). Si todos los hilos mueren después, las tareas en cola se rechazan
 * para que caigan al mismo respaldo.
 */
export async function crearPool(
  hilos: number = hilosPorOmision(),
  o: OpcionesPool = {},
): Promise<PoolBcrypt | null> {
  const modulo = o.modulo ?? rutaBcrypt();
  if (modulo === null) return null;
  const n = Math.max(1, Math.floor(hilos));
  const vivos = new Set<Worker>();
  const libres: Worker[] = [];
  const enCurso = new Map<Worker, Tarea>();
  const cola: Tarea[] = [];
  let cerrado = false;
  let id = 0;

  const cerradaErr = (): ErrorWolf => new ErrorWolf('auditoria.cancelada', 'Auditoría cancelada.');

  function despachar(): void {
    while (cola.length > 0 && libres.length > 0) {
      const w = libres.pop()!;
      const t = cola.shift()!;
      enCurso.set(w, t);
      w.postMessage({ id: t.id, hash: t.hash, claves: t.claves });
    }
  }

  /** Un hilo murió o falló: su tarea y, si era el último, toda la cola se rechazan. */
  function caer(w: Worker, e: Error): void {
    if (!vivos.delete(w)) return;
    const t = enCurso.get(w);
    enCurso.delete(w);
    const k = libres.indexOf(w);
    if (k >= 0) libres.splice(k, 1);
    t?.mal(e);
    if (vivos.size === 0) for (const p of cola.splice(0)) p.mal(e);
  }

  const listos = await Promise.all(
    Array.from({ length: n }, () => {
      let w: Worker;
      try {
        w = new Worker(CODIGO_HILO, { eval: true, workerData: { modulo } });
      } catch {
        return Promise.resolve(null);
      }
      return new Promise<Worker | null>((ok) => {
        const plazo = setTimeout(() => {
          void w.terminate();
          ok(null);
        }, o.esperaMs ?? 5000);
        const fallo = (): void => {
          clearTimeout(plazo);
          ok(null);
        };
        w.once('error', fallo);
        w.once('exit', fallo);
        w.on('message', (m: { listo?: boolean; id?: number; ok?: boolean }) => {
          if (m.listo !== undefined) {
            clearTimeout(plazo);
            w.off('error', fallo);
            w.off('exit', fallo);
            if (m.listo) ok(w);
            else {
              void w.terminate();
              ok(null);
            }
            return;
          }
          const t = enCurso.get(w);
          if (!t || t.id !== m.id) return;
          enCurso.delete(w);
          libres.push(w);
          t.ok(m.ok === true);
          despachar();
        });
      });
    }),
  );
  for (const w of listos) {
    if (!w) continue;
    w.unref();
    w.on('error', (e) => caer(w, e instanceof Error ? e : new Error(String(e))));
    w.on('exit', () => caer(w, new Error('El hilo de bcrypt terminó.')));
    vivos.add(w);
    libres.push(w);
  }
  if (vivos.size === 0) return null;

  return {
    tamano: vivos.size,
    comparar(hash, claves) {
      if (cerrado) return Promise.reject(cerradaErr());
      if (vivos.size === 0) return Promise.reject(new Error('Sin hilos de bcrypt.'));
      return new Promise<boolean>((ok, mal) => {
        cola.push({ id: ++id, hash, claves, ok, mal });
        despachar();
      });
    },
    async cerrar() {
      if (cerrado) return;
      cerrado = true;
      for (const t of [...cola.splice(0), ...enCurso.values()]) t.mal(cerradaErr());
      enCurso.clear();
      const todos = [...vivos];
      vivos.clear();
      await Promise.all(todos.map((w) => w.terminate().catch(() => 0)));
    },
  };
}

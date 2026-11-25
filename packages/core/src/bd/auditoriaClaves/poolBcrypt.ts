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

export function crearPool(hilos: number = hilosPorOmision()): PoolBcrypt | null {
  const modulo = rutaBcrypt();
  if (modulo === null) return null;
  const n = Math.max(1, Math.floor(hilos));
  const libres: Worker[] = [];
  const todos: Worker[] = [];
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

  try {
    for (let i = 0; i < n; i++) {
      const w = new Worker(CODIGO_HILO, { eval: true, workerData: { modulo } });
      w.on('message', (m: { id: number; ok: boolean }) => {
        const t = enCurso.get(w);
        if (!t || t.id !== m.id) return;
        enCurso.delete(w);
        libres.push(w);
        t.ok(m.ok === true);
        despachar();
      });
      w.on('error', (e) => {
        const t = enCurso.get(w);
        enCurso.delete(w);
        const k = libres.indexOf(w);
        if (k >= 0) libres.splice(k, 1);
        t?.mal(e instanceof Error ? e : new Error(String(e)));
      });
      w.unref();
      todos.push(w);
      libres.push(w);
    }
  } catch {
    for (const w of todos) void w.terminate();
    return null;
  }

  return {
    tamano: n,
    comparar(hash, claves) {
      if (cerrado) return Promise.reject(cerradaErr());
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
      await Promise.all(todos.map((w) => w.terminate().catch(() => 0)));
    },
  };
}

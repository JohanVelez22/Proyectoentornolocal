import type { ApiEntorno } from '../shared/api';
import { rehidratar } from '../shared/errorIpc';

export { ErrorIpc } from '../shared/errorIpc';

const envueltos = new WeakMap<object, unknown>();

const esPromesa = (v: unknown): v is PromiseLike<unknown> =>
  v !== null && typeof v === 'object' && typeof (v as { then?: unknown }).then === 'function';

/**
 * Envuelve el puente del preload para que toda llamada que falle rechace con un `ErrorIpc` (con su
 * `codigo` y `datos`) en lugar del objeto plano con el que cruza el puente. Un solo punto: nadie
 * más tiene que saber cómo viaja el error.
 */
function envolver<T>(objeto: T): T {
  if (objeto === null || (typeof objeto !== 'object' && typeof objeto !== 'function'))
    return objeto;
  const previo = envueltos.get(objeto as object);
  if (previo) return previo as T;
  // El destino del proxy es un objeto vacío: el puente expone propiedades de solo lectura y no
  // configurables, y un proxy sobre ellas tendría que devolver exactamente el mismo valor.
  const origen = objeto as object;
  const proxy = new Proxy(
    {},
    {
      get(_destino, clave) {
        const v: unknown = Reflect.get(origen, clave);
        if (typeof v === 'function') {
          return (...args: unknown[]): unknown => {
            const r: unknown = (v as (...a: unknown[]) => unknown).apply(origen, args);
            return esPromesa(r)
              ? Promise.resolve(r).catch((e: unknown) => {
                  throw rehidratar(e);
                })
              : r;
          };
        }
        return v !== null && typeof v === 'object' ? envolver(v) : v;
      },
    },
  );
  envueltos.set(objeto as object, proxy);
  return proxy as T;
}

/** Puente expuesto por el preload. Se lee en cada llamada para que las pruebas puedan sustituirlo. */
export function api(): ApiEntorno {
  return envolver(window.entorno);
}

/** Copia sin proxies reactivos: el IPC de Electron no puede clonar objetos `reactive`. */
export function plano<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

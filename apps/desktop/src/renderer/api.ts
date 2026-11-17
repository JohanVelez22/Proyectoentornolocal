import type { ApiEntorno } from '../shared/api';

/** Puente expuesto por el preload. Se lee en cada llamada para que las pruebas puedan sustituirlo. */
export function api(): ApiEntorno {
  return window.entorno;
}

/** Copia sin proxies reactivos: el IPC de Electron no puede clonar objetos `reactive`. */
export function plano<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

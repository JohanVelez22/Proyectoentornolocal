import { createConnection } from 'node:net';

/** Comprueba por TCP si algo acepta conexiones en host:puerto. Nunca lanza. */
export function puertoResponde(puerto: number, host = '127.0.0.1', ms = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port: puerto, host });
    let resuelto = false;
    const fin = (ok: boolean): void => {
      if (resuelto) return;
      resuelto = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(ms);
    socket.once('connect', () => fin(true));
    socket.once('timeout', () => fin(false));
    socket.once('error', () => fin(false));
  });
}

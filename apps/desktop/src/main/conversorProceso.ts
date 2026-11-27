import { app, utilityProcess } from 'electron';
import type { EjecutorTrabajo } from '@pel/core';
import { crearEjecutorSupervisado, type ProcesoTrabajo } from './conversorSupervisor';

/**
 * Proceso de trabajo del conversor (D34) como `utilityProcess` de Electron: sin ventana, sin
 * acceso a la interfaz, con su propio límite de montón y la vigilancia de su memoria por PID
 * (`app.getAppMetrics()`, que mide el proceso entero, memoria externa incluida). Hace también la
 * optimización de PDF de D33. `rutaScript` es el `conversorTrabajo.js` que arma electron-vite.
 */

/** Montón de V8 del proceso de trabajo (los búferes quedan fuera: los mide el supervisor). */
const MONTON_MB = 512;

export function crearEjecutorUtilityProcess(rutaScript: string): EjecutorTrabajo {
  return crearEjecutorSupervisado({
    lanzar: (): ProcesoTrabajo => {
      const p = utilityProcess.fork(rutaScript, [], {
        serviceName: 'wolfcore-conversor',
        execArgv: [`--max-old-space-size=${MONTON_MB}`],
        stdio: 'ignore',
      });
      return {
        get pid() {
          return p.pid;
        },
        postMessage: (m) => p.postMessage(m),
        onMessage: (cb) => {
          p.on('message', cb);
        },
        onExit: (cb) => {
          p.on('exit', cb);
        },
        kill: () => {
          p.kill();
        },
      };
    },
    memoriaDe: (pid) => {
      const m = app.getAppMetrics().find((x) => x.pid === pid)?.memory;
      // Las cifras vienen en KB.
      return m ? Math.max(m.workingSetSize, m.privateBytes ?? 0) * 1024 : null;
    },
  });
}

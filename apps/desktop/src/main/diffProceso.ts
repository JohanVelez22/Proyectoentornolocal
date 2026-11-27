import { app, utilityProcess } from 'electron';
import type { EjecutorDiff } from '@pel/core';
import type { ProcesoTrabajo } from './conversorSupervisor';
import { crearEjecutorDiffSupervisado } from './diffSupervisor';

/**
 * Proceso de trabajo del diff de carpetas (D44) como `utilityProcess` de Electron: sin ventana ni
 * acceso a la interfaz, con su propio límite de montón y la vigilancia de su memoria por PID.
 * `rutaScript` es el `diffTrabajo.js` que arma electron-vite.
 */
const MONTON_MB = 384;

export function crearEjecutorDiffUtilityProcess(rutaScript: string): EjecutorDiff {
  return crearEjecutorDiffSupervisado({
    lanzar: (): ProcesoTrabajo => {
      const p = utilityProcess.fork(rutaScript, [], {
        serviceName: 'wolfcore-diff',
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

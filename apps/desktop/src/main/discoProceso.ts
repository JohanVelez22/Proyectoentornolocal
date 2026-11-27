import { app, utilityProcess } from 'electron';
import type { EjecutorUsoDisco } from '@pel/core';
import type { ProcesoTrabajo } from './conversorSupervisor';
import { crearEjecutorUsoDiscoSupervisado } from './discoSupervisor';

/**
 * Proceso de trabajo de «Uso del disco» (D51) como `utilityProcess` de Electron: sin ventana ni
 * acceso a la interfaz, con su propio límite de montón y la vigilancia de su memoria por PID.
 * `rutaScript` es el `discoTrabajo.js` que arma electron-vite.
 */
const MONTON_MB = 384;

export function crearEjecutorDiscoUtilityProcess(rutaScript: string): EjecutorUsoDisco {
  return crearEjecutorUsoDiscoSupervisado({
    lanzar: (): ProcesoTrabajo => {
      const p = utilityProcess.fork(rutaScript, [], {
        serviceName: 'wolfcore-disco',
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

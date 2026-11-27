import { operarUsoDisco } from '../../../../packages/core/src/herramientas/usoDisco';
import type {
  MensajeUsoDisco,
  SalidaUsoDisco,
} from '../../../../packages/core/src/herramientas/usoDisco';

/**
 * Entrada del proceso de trabajo de «Uso del disco» (`utilityProcess`, D51): recibe UN mensaje del
 * proceso principal, recorre (solo lectura) mandando el progreso y contesta al final. Nada de red
 * ni de escritura. Cancelar es matar este proceso (lo hace el supervisor).
 */
const puerto = process.parentPort;
puerto.once('message', (e) => {
  const m = e.data as MensajeUsoDisco;
  void operarUsoDisco(m, {
    alProgreso: (p) => {
      const s: SalidaUsoDisco = { tipo: 'progreso', ...p };
      puerto.postMessage(s);
    },
  }).then((r) => {
    const s: SalidaUsoDisco = { tipo: 'fin', ...r };
    puerto.postMessage(s);
  });
});

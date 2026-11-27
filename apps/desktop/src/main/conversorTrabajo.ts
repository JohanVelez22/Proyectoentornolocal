import { operar } from '../../../../packages/core/src/conversor/operaciones';
import type { MensajeTrabajo } from '../../../../packages/core/src/conversor/protocolo';

/**
 * Entrada del proceso de trabajo (`utilityProcess`, D34): recibe UN mensaje del proceso
 * principal, ejecuta la operación y contesta. Nada de red: solo bytes y texto.
 */
const puerto = process.parentPort;
puerto.once('message', (e) => {
  void operar(e.data as MensajeTrabajo).then((r) => {
    puerto.postMessage(r);
  });
});

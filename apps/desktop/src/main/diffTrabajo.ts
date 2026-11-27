import { operarDiff } from '../../../../packages/core/src/herramientas/diffCarpetas';
import type { MensajeDiff } from '../../../../packages/core/src/herramientas/diffCarpetas';

/**
 * Entrada del proceso de trabajo del diff de carpetas (`utilityProcess`, D44): recibe UN mensaje
 * del proceso principal, lo ejecuta (solo lectura) y contesta. Nada de red ni de escritura.
 */
const puerto = process.parentPort;
puerto.once('message', (e) => {
  void operarDiff(e.data as MensajeDiff).then((r) => {
    puerto.postMessage(r);
  });
});

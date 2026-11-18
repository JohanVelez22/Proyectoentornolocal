import type { Plataforma } from './tipos';
import { PlataformaWindows } from './win';

export type {
  Plataforma,
  Ejecutor,
  Lanzador,
  OpcionesLanzar,
  ResultadoEscritura,
  MuestraPlataforma,
  UsoProceso,
} from './tipos';
export { lanzadorPorDefecto } from './lanzar';
export {
  PlataformaWindows,
  interpretarNetstat,
  interpretarNetstatVarios,
  interpretarTasklist,
  interpretarTasklistTodos,
  interpretarMuestraWindows,
  muestraSistemaWindows,
  scriptMuestraWindows,
} from './win';

export function crearPlataforma(): Plataforma {
  if (process.platform === 'win32') return new PlataformaWindows();
  throw new Error('Plataforma aún no soportada (fase 4)');
}

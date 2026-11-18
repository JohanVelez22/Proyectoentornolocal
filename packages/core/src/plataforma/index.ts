import type { Plataforma } from './tipos';
import { PlataformaWindows } from './win';

export type { Plataforma, Ejecutor, ResultadoEscritura } from './tipos';
export {
  PlataformaWindows,
  interpretarNetstat,
  interpretarNetstatVarios,
  interpretarTasklist,
  interpretarTasklistTodos,
} from './win';

export function crearPlataforma(): Plataforma {
  if (process.platform === 'win32') return new PlataformaWindows();
  throw new Error('Plataforma aún no soportada (fase 4)');
}

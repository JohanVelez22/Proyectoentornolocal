import { ErrorWolf } from '../errores';
import { PATRON_VARIABLE } from './sensibles';

/**
 * Sustitución literal de `{{nombre}}`. No se evalúa nada: el valor se inserta tal cual y una sola
 * vez (si contiene `{{otra}}`, queda como texto). Una variable sin definir es un error claro.
 */
export function sustituir(texto: string, valores: ReadonlyMap<string, string>): string {
  if (!texto.includes('{{')) return texto;
  return texto.replace(PATRON_VARIABLE, (_m, nombre: string) => {
    const v = valores.get(nombre);
    if (v === undefined) {
      throw new ErrorWolf(
        'clientehttp.variable_sin_definir',
        `La variable {{${nombre}}} no está definida en el entorno activo.`,
        { nombre },
      );
    }
    return v;
  });
}

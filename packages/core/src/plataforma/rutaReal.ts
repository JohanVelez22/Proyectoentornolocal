import { realpath } from 'node:fs/promises';
import path from 'node:path';

/**
 * Ruta real: uniones y enlaces resueltos (y nombres 8.3 expandidos donde existen) de lo que
 * exista; lo que falte al final se añade tal cual. null si no se puede resolver; una ruta que
 * este sistema no considera absoluta (rutas de otro sistema en las pruebas) no tiene nada que
 * resolver y se devuelve igual.
 */
export async function resolverReal(ruta: string): Promise<string | null> {
  if (!path.isAbsolute(ruta)) return ruta;
  let actual = ruta;
  const resto: string[] = [];
  for (;;) {
    try {
      return path.join(await realpath(actual), ...resto);
    } catch (e) {
      const codigo = (e as NodeJS.ErrnoException).code;
      if (codigo !== 'ENOENT' && codigo !== 'ENOTDIR') return null;
      const padre = path.dirname(actual);
      if (padre === actual) return null;
      resto.unshift(path.basename(actual));
      actual = padre;
    }
  }
}

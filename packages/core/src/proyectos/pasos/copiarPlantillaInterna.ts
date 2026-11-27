import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { archivosEstatico } from '../generadores/plantillas/estatico';
import { archivosFastapi } from '../generadores/plantillas/fastapi';
import type { ImplementacionPaso } from '../pasos';
import { motorDe } from '../../bd/basesDeDatos';
import { argsDe, comprobarSenal, objetivoDe, type DepsPasos } from './comun';

/** Nombre del proyecto: el mismo patrón que valida `Nucleo.crearProyecto`. */
const NOMBRE = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * Copia los archivos de una plantilla interna (`fastapi` o `estatico`) a la carpeta del proyecto.
 * Nunca sobrescribe: un archivo que ya existe se deja como está y se avisa.
 */
export function pasoCopiarPlantillaInterna(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const nombre = args.nombre;
    if (typeof nombre !== 'string' || !NOMBRE.test(nombre)) {
      throw new Error('El nombre del proyecto no es válido para la plantilla.');
    }
    let archivos: Record<string, string>;
    switch (args.plantilla) {
      case 'fastapi': {
        const objetivo = await objetivoDe(ctx, d).catch(() => null);
        archivos = archivosFastapi({
          nombre,
          motor: objetivo ? motorDe(objetivo) : null,
          pgvector: args.pgvector === true,
        });
        break;
      }
      case 'estatico':
        archivos = archivosEstatico({ nombre });
        break;
      default:
        throw new Error(`Plantilla interna desconocida: ${String(args.plantilla).slice(0, 40)}`);
    }
    for (const [relativo, contenido] of Object.entries(archivos)) {
      const destino = path.resolve(ctx.carpeta, relativo);
      // Las rutas son constantes del programa; esto es solo el cinturón.
      if (path.relative(ctx.carpeta, destino).startsWith('..')) continue;
      await mkdir(path.dirname(destino), { recursive: true });
      try {
        await writeFile(destino, contenido, { encoding: 'utf8', flag: 'wx' });
        ctx.linea(`Se creó ${relativo}.`);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
        ctx.linea(`${relativo} ya existe; no se modificó.`);
      }
    }
  };
}

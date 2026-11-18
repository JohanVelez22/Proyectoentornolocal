import path from 'node:path';
import { existe } from '../archivos';
import type { ImplementacionPaso } from '../pasos';
import { herramientas, lanzar, pythonExe, pythonVenv, type DepsPasos } from './comun';

/** `python -m venv .venv` con el Python del proyecto; si el .venv ya existe, no hace nada. */
export function pasoPythonVenv(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    if (await existe(pythonVenv(ctx.carpeta))) {
      ctx.linea('El entorno virtual .venv ya existe; no se modificó.');
      return;
    }
    const h = await herramientas(ctx, d);
    await lanzar(ctx, d, h, pythonExe(d, h), ['-m', 'venv', '.venv'], 'python -m venv .venv');
  };
}

/**
 * `.venv\Scripts\python -m pip install -r requirements.txt`; si no hay requirements.txt pero sí
 * pyproject.toml, `-e .`. El Scripts del .venv va en el PATH antes que el Python del runtime.
 */
export function pasoPipInstall(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    const py = pythonVenv(ctx.carpeta);
    if (!(await existe(py))) {
      throw new Error('Falta el entorno virtual .venv: ejecute antes "Crear el entorno virtual".');
    }
    let destino: string[];
    if (await existe(path.join(ctx.carpeta, 'requirements.txt'))) {
      destino = ['-r', 'requirements.txt'];
    } else if (await existe(path.join(ctx.carpeta, 'pyproject.toml'))) {
      destino = ['-e', '.'];
    } else {
      ctx.linea('No hay requirements.txt ni pyproject.toml; no hay dependencias que instalar.');
      return;
    }
    const h = await herramientas(ctx, d);
    await lanzar(
      ctx,
      d,
      h,
      py,
      ['-m', 'pip', 'install', ...destino],
      ['python -m pip install', ...destino].join(' '),
    );
  };
}

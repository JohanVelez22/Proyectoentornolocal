import { readFile } from 'node:fs/promises';
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
    await lanzar(
      ctx,
      d,
      h,
      pythonExe(d, h),
      ['-I', '-m', 'venv', '.venv'],
      'python -I -m venv .venv',
    );
  };
}

/**
 * `.venv\Scripts\python -m pip install -r requirements.txt`; si no hay requirements.txt pero sí
 * pyproject.toml, `-e .`. El Scripts del .venv va en el PATH antes que el Python del runtime.
 */
/** Requisito de pip sin opciones, sin URLs y sin rutas: `nombre[extras] ==1.0, <2` (+ marcador). */
const REQUISITO =
  /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\[[A-Za-z0-9,._-]+\])?(?:\s*(?:===|==|~=|!=|<=|>=|<|>)\s*[A-Za-z0-9.*+!_-]+\s*,?)*$/;

/** Rechaza un requirements.txt con opciones (-e, -r, --index-url…), URLs, rutas o `nombre @ url`. */
export async function revisarRequirements(archivo: string): Promise<void> {
  const texto = await readFile(archivo, 'utf8');
  if (texto.length > 256 * 1024) throw new Error('El requirements.txt es demasiado grande.');
  for (const cruda of texto.split(/\r?\n/)) {
    const linea = (cruda.split(' #')[0] ?? '').trim();
    if (linea === '' || linea.startsWith('#')) continue;
    const requisito = (linea.split(';')[0] ?? '').trim();
    if (!REQUISITO.test(requisito)) {
      throw new Error(
        `Una plantilla importada solo admite requisitos simples en requirements.txt: ${linea.slice(0, 60)}`,
      );
    }
  }
}

export function pasoPipInstall(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    const py = pythonVenv(ctx.carpeta);
    if (!(await existe(py))) {
      throw new Error('Falta el entorno virtual .venv: ejecute antes "Crear el entorno virtual".');
    }
    // Código de un tercero (plantilla importada): solo ruedas ya construidas y un requirements.txt
    // sin opciones, -e ni rutas; un pyproject.toml correría el sistema de construcción del proyecto.
    const sinScripts = ctx.paso.args?.sinScripts === true;
    let destino: string[];
    if (await existe(path.join(ctx.carpeta, 'requirements.txt'))) {
      if (sinScripts) await revisarRequirements(path.join(ctx.carpeta, 'requirements.txt'));
      destino = ['-r', 'requirements.txt'];
    } else if (sinScripts && (await existe(path.join(ctx.carpeta, 'pyproject.toml')))) {
      throw new Error(
        'Una plantilla importada no instala un proyecto con pyproject.toml (correría su código de construcción).',
      );
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
      ['-I', '-m', 'pip', 'install', ...(sinScripts ? ['--only-binary=:all:'] : []), ...destino],
      ['python -I -m pip install', ...(sinScripts ? ['--only-binary=:all:'] : []), ...destino].join(
        ' ',
      ),
    );
  };
}

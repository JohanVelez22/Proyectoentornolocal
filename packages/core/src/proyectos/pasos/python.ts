import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../../errores';
import { existe } from '../archivos';
import type { ContextoPaso, ImplementacionPaso } from '../pasos';
import { herramientas, lanzar, pythonExe, pythonVenv, type DepsPasos } from './comun';

/* ───────────── Entornos virtuales propios ───────────── */

/**
 * Los `.venv` que creó WolfCore Dev, anotados fuera del proyecto (en la carpeta de datos). Un
 * `.venv` que viene en un repositorio ajeno trae su propio `python`: ejecutarlo es ejecutar el
 * código del repositorio, así que solo se usan los que están aquí.
 */
const rutaRegistro = (d: Pick<DepsPasos, 'rutas'>): string =>
  path.join(d.rutas.base, 'etc', 'venvs-propios.json');
const claveVenv = (carpeta: string): string =>
  path.resolve(carpeta).replace(/\\/g, '/').toLowerCase();

async function leerRegistro(d: Pick<DepsPasos, 'rutas'>): Promise<string[]> {
  try {
    const j: unknown = JSON.parse(await readFile(rutaRegistro(d), 'utf8'));
    return Array.isArray(j) ? j.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function esVenvPropio(d: Pick<DepsPasos, 'rutas'>, carpeta: string): Promise<boolean> {
  return (await leerRegistro(d)).includes(claveVenv(carpeta));
}

export async function registrarVenvPropio(
  d: Pick<DepsPasos, 'rutas'>,
  carpeta: string,
): Promise<void> {
  const lista = new Set(await leerRegistro(d));
  lista.add(claveVenv(carpeta));
  await mkdir(path.dirname(rutaRegistro(d)), { recursive: true });
  await writeFile(rutaRegistro(d), JSON.stringify([...lista].sort(), null, 2), 'utf8');
}

const venvAjeno = (): ErrorWolf =>
  new ErrorWolf(
    'proyectos.venv_ajeno',
    'El proyecto trae su propio .venv y WolfCore Dev no ejecuta el Python de un repositorio. Bórrelo y vuelva a crear el entorno.',
  );

/**
 * Un `.venv` sin registrar: lo acepta un sitio que el usuario ya confió (ya ejecuta su código, así
 * que su `.venv` no añade riesgo; queda registrado la primera vez) salvo en una plantilla importada
 * (`sinScripts`). Cualquier otro caso (repositorio sin confiar) se rechaza. Los procesos del sitio
 * (uvicorn desde `.venv`) no dependen de este registro.
 */
async function exigirVenvAceptable(d: DepsPasos, ctx: ContextoPaso): Promise<void> {
  if (await esVenvPropio(d, ctx.carpeta)) return;
  if (ctx.sitio.confiado === true && ctx.paso.args?.sinScripts !== true) {
    await registrarVenvPropio(d, ctx.carpeta);
    return;
  }
  throw venvAjeno();
}

/** Opciones de Python para código ajeno: aislado (-I) y UTF-8 (requirements con acentos). */
const AISLADO = ['-I', '-X', 'utf8'];

/**
 * Crea `.venv` con el Python del proyecto, desde fuera de la carpeta del proyecto y sin pip
 * (`--without-pip`); luego instala pip con `ensurepip`, también desde fuera. Un `venv.py`, un
 * `ensurepip.py` o un `pip.py` en el proyecto no se importan. Si el `.venv` ya existe: uno propio
 * no se toca; uno que no creó WolfCore Dev se rechaza (`proyectos.venv_ajeno`).
 */
export function pasoPythonVenv(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    const venv = path.join(ctx.carpeta, '.venv');
    if (await existe(venv)) {
      await exigirVenvAceptable(d, ctx);
      ctx.linea('El entorno virtual .venv ya existe; no se modificó.');
      return;
    }
    const h = await herramientas(ctx, d);
    const fuera = d.rutas.tmp();
    await mkdir(fuera, { recursive: true });
    await lanzar(
      ctx,
      d,
      h,
      pythonExe(d, h),
      [...AISLADO, '-m', 'venv', '--without-pip', venv],
      'python -I -X utf8 -m venv --without-pip .venv',
      fuera,
    );
    await lanzar(
      ctx,
      d,
      h,
      pythonVenv(ctx.carpeta),
      [...AISLADO, '-m', 'ensurepip', '--default-pip'],
      'python -I -X utf8 -m ensurepip',
      fuera,
    );
    await registrarVenvPropio(d, ctx.carpeta);
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
    // Solo el .venv que creó WolfCore Dev: el de un repositorio ajeno trae su propio python.
    if (await existe(path.join(ctx.carpeta, '.venv'))) await exigirVenvAceptable(d, ctx);
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
      [
        ...AISLADO,
        '-m',
        'pip',
        'install',
        ...(sinScripts ? ['--only-binary=:all:'] : []),
        ...destino,
      ],
      [
        'python -I -X utf8 -m pip install',
        ...(sinScripts ? ['--only-binary=:all:'] : []),
        ...destino,
      ].join(' '),
    );
  };
}

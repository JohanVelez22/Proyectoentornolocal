import { readdir } from 'node:fs/promises';
import type { ImplementacionPaso } from '../pasos';
import { argsDe, comprobarSenal, herramientas, lanzar, type DepsPasos } from './comun';

/** `vendor/paquete` según Packagist: minúsculas, dígitos y `.`, `_`, `-` entre ellos. */
const PAQUETE = /^[a-z0-9]([_.-]?[a-z0-9]+)*\/[a-z0-9](([_.]|-{1,2})?[a-z0-9]+)*$/;
/** Restricción de versión de Composer (`^11.0`, `~7.2`, `dev-main`): nunca empieza por `-`. */
const VERSION = /^[0-9A-Za-z^~*<>=|,. @][0-9A-Za-z^~*<>=|,. @-]{0,39}$/;

/** Carpeta sin ningún archivo ni subcarpeta (o que no existe). */
export async function carpetaVacia(ruta: string): Promise<boolean> {
  try {
    return (await readdir(ruta)).length === 0;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return true;
    throw e;
  }
}

function paquete(v: unknown, campo: string): string {
  if (typeof v !== 'string' || !PAQUETE.test(v) || v.length > 100) {
    throw new Error(`El paquete de Composer no es válido (${campo}): ${String(v).slice(0, 60)}`);
  }
  return v;
}

/**
 * `composer create-project --no-interaction --prefer-dist --no-scripts <paquete> . [versión]` en
 * la carpeta del proyecto, con el PHP del sitio y sin shell (`windowsHide` en el lanzador). Solo
 * si la carpeta está vacía: nunca pisa un proyecto. Sin `--no-scripts` los paquetes corren
 * código propio (Laravel migra una base SQLite y genera la clave) antes de que WolfCore Dev
 * ponga la conexión; esos pasos ya están en la receta. `args.requerir` (lista de paquetes) corre
 * después `composer require` (Symfony `webapp`).
 */
export function pasoCrearDesdeComposer(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const nombre = paquete(args.paquete, 'paquete');
    const version = args.version;
    if (version !== undefined && (typeof version !== 'string' || !VERSION.test(version))) {
      throw new Error(`La versión del paquete no es válida: ${String(version).slice(0, 60)}`);
    }
    const requerir = args.requerir ?? [];
    if (!Array.isArray(requerir) || requerir.length > 5) {
      throw new Error('args.requerir debe ser una lista corta de paquetes.');
    }
    const extra = requerir.map((p) => paquete(p, 'requerir'));
    if (!(await carpetaVacia(ctx.carpeta))) {
      ctx.linea('La carpeta ya tiene archivos; no se creó el proyecto de nuevo.');
      return;
    }
    const phar = await d.composerPhar();
    if (!phar) throw new Error('Composer no está instalado: instálelo desde Herramientas.');
    const h = await herramientas(ctx, d, { php: true });
    h.env.COMPOSER_NO_INTERACTION = '1';
    const php = h.php!;
    await lanzar(
      ctx,
      d,
      h,
      php.exe,
      [
        '-c',
        php.ini,
        phar,
        'create-project',
        '--no-interaction',
        '--prefer-dist',
        '--no-scripts',
        nombre,
        '.',
        ...(version ? [version] : []),
      ],
      `composer create-project ${nombre}${version ? ` ${version}` : ''}`,
    );
    for (const p of extra) {
      await lanzar(
        ctx,
        d,
        h,
        php.exe,
        ['-c', php.ini, phar, 'require', '--no-interaction', p],
        `composer require ${p}`,
      );
    }
  };
}

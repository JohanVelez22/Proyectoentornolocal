import path from 'node:path';
import { existe } from '../archivos';
import type { ImplementacionPaso } from '../pasos';
import { herramientas, lanzar, type DepsPasos } from './comun';

/** `php -c <ini> composer.phar install --no-interaction --prefer-dist` con el PHP del sitio. */
export function pasoComposerInstall(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    if (!(await existe(path.join(ctx.carpeta, 'composer.json')))) {
      ctx.linea('No hay composer.json; no hay dependencias de PHP que instalar.');
      return;
    }
    const phar = await d.composerPhar();
    if (!phar) throw new Error('Composer no está instalado: instálelo desde Herramientas.');
    const h = await herramientas(ctx, d, { php: true });
    h.env.COMPOSER_NO_INTERACTION = '1';
    // Código de un tercero (plantilla importada): ni scripts ni plugins de Composer.
    const sinScripts = ctx.paso.args?.sinScripts === true;
    const extra = sinScripts ? ['--no-scripts', '--no-plugins'] : [];
    await lanzar(
      ctx,
      d,
      h,
      h.php!.exe,
      ['-c', h.php!.ini, phar, 'install', '--no-interaction', '--prefer-dist', ...extra],
      `composer install --no-interaction --prefer-dist${extra.length ? ` ${extra.join(' ')}` : ''}`,
    );
  };
}

import { lstat, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { existe, leerTexto } from '../archivos';
import { leerVariablesEnv } from '../detectar';
import type { ImplementacionPaso } from '../pasos';
import { argsDe, herramientas, lanzar, type DepsPasos } from './comun';

/** `php artisan key:generate --force`, solo si APP_KEY está vacío. */
export function pasoKeyGenerate(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    const env = await leerTexto(path.join(ctx.carpeta, '.env'));
    if (env === null) {
      throw new Error('Falta el archivo .env: ejecute antes el paso "Crear el archivo .env".');
    }
    if ((leerVariablesEnv(env).get('APP_KEY') ?? '') !== '') {
      ctx.linea('APP_KEY ya tiene valor; no se generó una clave nueva.');
      return;
    }
    const h = await herramientas(ctx, d, { php: true });
    await lanzar(
      ctx,
      d,
      h,
      h.php!.exe,
      ['-c', h.php!.ini, 'artisan', 'key:generate', '--force'],
      'php artisan key:generate --force',
    );
  };
}

/** Laravel: `php artisan migrate --force` (`--seed` con args.semilla). CI4: `php spark migrate`. */
export function pasoMigrar(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    if (argsDe(ctx).comando !== undefined) {
      ctx.linea(
        'Aviso: se ignora args.comando; migrar elige el comando según el tipo del proyecto.',
      );
    }
    const ci4 =
      ctx.sitio.tipo === 'codeigniter4' ||
      (!(await existe(path.join(ctx.carpeta, 'artisan'))) &&
        (await existe(path.join(ctx.carpeta, 'spark'))));
    const h = await herramientas(ctx, d, { php: true });
    const { exe, ini } = h.php!;
    if (ci4) {
      await lanzar(ctx, d, h, exe, ['-c', ini, 'spark', 'migrate'], 'php spark migrate');
      return;
    }
    const extra = argsDe(ctx).semilla === true ? ['--seed'] : [];
    await lanzar(
      ctx,
      d,
      h,
      exe,
      ['-c', ini, 'artisan', 'migrate', '--force', ...extra],
      ['php artisan migrate --force', ...extra].join(' '),
    );
  };
}

/** `php artisan storage:link`; si public/storage ya existe, no hace nada. */
export function pasoStorageLink(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    const enlace = path.join(ctx.carpeta, 'public', 'storage');
    let hay = true;
    try {
      await lstat(enlace);
    } catch {
      hay = false;
    }
    if (hay) {
      // stat sigue el enlace: falla si su destino ya no existe (access no lo nota en Windows).
      if (
        await stat(enlace).then(
          () => true,
          () => false,
        )
      ) {
        ctx.linea('El enlace public/storage ya existe; no se modificó.');
        return;
      }
      // Enlace roto (apunta a una carpeta que ya no existe): se quita solo el enlace y se rehace.
      ctx.linea('El enlace public/storage está roto: se vuelve a crear.');
      await rm(enlace, { force: true });
    }
    const h = await herramientas(ctx, d, { php: true });
    await lanzar(
      ctx,
      d,
      h,
      h.php!.exe,
      ['-c', h.php!.ini, 'artisan', 'storage:link'],
      'php artisan storage:link',
    );
  };
}

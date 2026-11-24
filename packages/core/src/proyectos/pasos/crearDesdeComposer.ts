import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../../errores';
import { existe } from '../archivos';
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
 * la carpeta del proyecto, con el PHP del sitio y sin shell (`windowsHide` en el lanzador).
 * Solo en una carpeta vacía: con archivos falla con `proyectos.carpeta_no_vacia` (nunca pisa un
 * proyecto).
 *
 * Antes de lanzar Composer deja la marca `composer-iniciado`: solo con esa marca (la dejó este
 * mismo paso en un intento cortado) y con un composer.json se reanuda, con `composer install`.
 * Con `args.scripts` (Symfony) Flex aplica sus recetas solo en `POST_UPDATE_CMD`, que un
 * `install` desde un lock no dispara: la reanudación es `composer update`. Sin composer.json no
 * hay nada que reanudar: se pide vaciar la carpeta.
 *
 * Sin `--no-scripts` los paquetes corren código propio (Laravel migra una base SQLite y genera
 * la clave) antes de que WolfCore Dev ponga la conexión; esos pasos ya están en la receta.
 * Symfony sí los necesita: su generador pone `args.scripts: true`.
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
    const scripts = args.scripts === true;
    let reanudar = false;
    if (!(await carpetaVacia(ctx.carpeta))) {
      if (
        !ctx.marcas?.includes('composer-iniciado') ||
        !(await existe(path.join(ctx.carpeta, 'composer.json')))
      ) {
        throw new ErrorWolf(
          'proyectos.carpeta_no_vacia',
          'La carpeta ya tiene archivos: vacíela para crear el proyecto de nuevo.',
        );
      }
      reanudar = true;
    }
    const phar = await d.composerPhar();
    if (!phar) throw new Error('Composer no está instalado: instálelo desde Herramientas.');
    const h = await herramientas(ctx, d, { php: true });
    h.env.COMPOSER_NO_INTERACTION = '1';
    const php = h.php!;
    const sinScripts = scripts ? [] : ['--no-scripts'];
    const base = ['-c', php.ini, phar];
    ctx.marcar?.('composer-iniciado');
    if (reanudar) {
      const resolver = [...base, '--no-interaction', '--prefer-dist'];
      if (!scripts) {
        ctx.linea('Faltan cosas de un intento anterior: se continúa con composer install.');
        await lanzar(
          ctx,
          d,
          h,
          php.exe,
          [...resolver.slice(0, 3), 'install', ...resolver.slice(3), '--no-scripts'],
          'composer install',
        );
      } else {
        // Flex solo aplica las recetas (y los scripts de Symfony dependen de ellas) al
        // actualizar: un `install` desde el lock deja la aplicación sin `bin/console` y sus
        // scripts fallan, y `recipes:install` sobre un intento cortado se probó con Composer
        // real y no es fiable (error interno de Flex). `update` en un proyecto recién creado
        // solo toma las últimas versiones que ya permitía composer.json.
        ctx.linea('Faltan cosas de un intento anterior: se continúa con composer update.');
        await lanzar(
          ctx,
          d,
          h,
          php.exe,
          [...resolver.slice(0, 3), 'update', ...resolver.slice(3)],
          'composer update',
        );
      }
    } else {
      await lanzar(
        ctx,
        d,
        h,
        php.exe,
        [
          ...base,
          'create-project',
          '--no-interaction',
          '--prefer-dist',
          ...sinScripts,
          nombre,
          '.',
          ...(version ? [version] : []),
        ],
        `composer create-project ${nombre}${version ? ` ${version}` : ''}`,
      );
    }
  };
}

/**
 * `composer require` de `args.paquetes` en el proyecto (Symfony `webapp-pack`). Es un paso propio:
 * si falla se reintenta solo, sin tocar lo que ya dejó `crear-desde-composer`. Volver a pedir un
 * paquete que ya está no cambia nada.
 */
export function pasoComposerRequerir(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const paquetes = argsDe(ctx).paquetes;
    if (!Array.isArray(paquetes) || paquetes.length === 0 || paquetes.length > 5) {
      throw new Error('args.paquetes debe ser una lista corta de paquetes.');
    }
    const lista = paquetes.map((p) => paquete(p, 'paquetes'));
    if (!(await existe(path.join(ctx.carpeta, 'composer.json')))) {
      throw new Error('Falta composer.json: ejecute antes la creación del proyecto.');
    }
    const phar = await d.composerPhar();
    if (!phar) throw new Error('Composer no está instalado: instálelo desde Herramientas.');
    const h = await herramientas(ctx, d, { php: true });
    h.env.COMPOSER_NO_INTERACTION = '1';
    const php = h.php!;
    for (const p of lista) {
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

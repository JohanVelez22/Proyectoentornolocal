import type { ImplementacionPaso } from '../pasos';
import { existe } from '../archivos';
import {
  argsDe,
  cliNpm,
  herramientas,
  lanzar,
  nodeExe,
  pythonExe,
  pythonVenv,
  type DepsPasos,
} from './comun';

function comandoDe(v: unknown): string[] {
  if (
    !Array.isArray(v) ||
    v.length === 0 ||
    v.some((x) => typeof x !== 'string' || x === '' || /[\0\r\n]/.test(x))
  ) {
    throw new Error('El paso necesita args.comando: una lista de textos (programa y argumentos).');
  }
  return v as string[];
}

/**
 * Ejecuta `args.comando` (programa y argumentos) sin shell, en la carpeta del proyecto. `php`,
 * `node`, `npm`, `npx` y `python` se resuelven a los del proyecto (python: el del .venv si hay).
 */
export function pasoComando(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    const [programa, ...resto] = comandoDe(argsDe(ctx).comando);
    if (/\.(cmd|bat)$/i.test(programa!)) {
      throw new Error(
        'Los archivos .cmd y .bat necesitan una consola y los pasos no usan shell: use el programa directamente.',
      );
    }
    const nombre = programa!.toLowerCase().replace(/\.exe$/, '');
    const h = await herramientas(ctx, d, { php: nombre === 'php' });
    let cmd = programa!;
    let args = resto;
    switch (nombre) {
      case 'php':
        cmd = h.php!.exe;
        args = ['-c', h.php!.ini, ...resto];
        break;
      case 'node':
        cmd = nodeExe(d, h);
        break;
      case 'npm':
      case 'npx':
        cmd = nodeExe(d, h);
        args = [cliNpm(d, h, nombre), ...resto];
        break;
      case 'python':
        cmd = (await existe(pythonVenv(ctx.carpeta))) ? pythonVenv(ctx.carpeta) : pythonExe(d, h);
        break;
    }
    await lanzar(ctx, d, h, cmd, args, [programa, ...resto].join(' '));
  };
}

import type { ImplementacionPaso } from '../pasos';
import { argsDe, herramientas, lanzar, resolverPrograma, usaPhp, type DepsPasos } from './comun';

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
    const comando = comandoDe(argsDe(ctx).comando);
    if (/\.(cmd|bat)$/i.test(comando[0]!)) {
      throw new Error(
        'Los archivos .cmd y .bat necesitan una consola y los pasos no usan shell: use el programa directamente.',
      );
    }
    const h = await herramientas(ctx, d, { php: usaPhp(comando[0]!) });
    const { cmd, args } = await resolverPrograma(comando, ctx.carpeta, d, h);
    await lanzar(ctx, d, h, cmd, args, comando.join(' '));
  };
}

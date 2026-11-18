import path from 'node:path';
import { existe, leerTexto } from '../archivos';
import type { ImplementacionPaso } from '../pasos';
import { cliNpm, herramientas, lanzar, nodeExe, type DepsPasos } from './comun';

/** `npm ci` si hay lock (package-lock.json o npm-shrinkwrap.json); si no, `npm install`. */
export function pasoNpmCi(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    const hayLock =
      (await existe(path.join(ctx.carpeta, 'package-lock.json'))) ||
      (await existe(path.join(ctx.carpeta, 'npm-shrinkwrap.json')));
    const sub = hayLock ? 'ci' : 'install';
    const h = await herramientas(ctx, d);
    const node = nodeExe(d, h);
    if (!hayLock) ctx.linea('No hay package-lock.json: se usa npm install.');
    await lanzar(ctx, d, h, node, [cliNpm(d, h, 'npm'), sub], `npm ${sub}`);
  };
}

async function scripts(carpeta: string): Promise<Record<string, unknown>> {
  const t = await leerTexto(path.join(carpeta, 'package.json'));
  if (t === null) return {};
  let j: unknown;
  try {
    j = JSON.parse(t);
  } catch {
    throw new Error('package.json no es un JSON válido.');
  }
  const s = (j as { scripts?: unknown } | null)?.scripts;
  return s && typeof s === 'object' && !Array.isArray(s) ? (s as Record<string, unknown>) : {};
}

/** `npm run build`, solo si package.json tiene el script `build`. */
export function pasoNpmBuild(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    if (typeof (await scripts(ctx.carpeta)).build !== 'string') {
      ctx.linea('package.json no tiene el script "build"; no hay nada que compilar.');
      return;
    }
    const h = await herramientas(ctx, d);
    const node = nodeExe(d, h);
    await lanzar(ctx, d, h, node, [cliNpm(d, h, 'npm'), 'run', 'build'], 'npm run build');
  };
}

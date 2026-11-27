import { readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  archivosConf,
  candidatosDeCarpetas,
  candidatosDeVhosts,
  leerConfigAnotando,
  leerIni,
  unirPorCarpeta,
  versionPhpDeTexto,
  type CandidatoImportar,
  type ContextoDetectar,
  type VhostConOrigen,
} from './comun';
import { leerVhostsApache, leerVhostsNginx } from './vhostsApache';

/** Versión de PHP activa: `usr/laragon.ini` (`[php] Version=php-8.2.20-…`) o la más nueva de `bin/php`. */
async function phpDeLaragon(ctx: ContextoDetectar, ini: string | null): Promise<string | null> {
  const deIni = ini === null ? null : versionPhpDeTexto(leerIni(ini).php?.version);
  if (deIni) return deIni;
  try {
    const versiones = (await readdir(path.join(ctx.raiz, 'bin', 'php'), { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .slice(0, 100)
      .map((e) => versionPhpDeTexto(e.name))
      .filter((v): v is string => v !== null)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return versiones.at(-1) ?? null;
  } catch {
    return null;
  }
}

/**
 * Laragon: vhosts de Nginx (`etc/nginx/sites-enabled`) y de Apache (`etc/apache2/sites-enabled`),
 * y las carpetas de `www` que no tienen vhost (se importan sin dominio: WolfCore Dev propone uno).
 */
export async function detectarLaragon(ctx: ContextoDetectar): Promise<CandidatoImportar[]> {
  const ini = await leerConfigAnotando(ctx, path.join(ctx.raiz, 'usr', 'laragon.ini'));
  const www = path.resolve(
    ctx.raiz,
    (ini === null ? null : leerIni(ini).laragon?.documentroot) ?? 'www',
  );
  const php = await phpDeLaragon(ctx, ini);
  const vhosts: VhostConOrigen[] = [];
  for (const [tipo, carpeta] of [
    ['nginx', path.join(ctx.raiz, 'etc', 'nginx', 'sites-enabled')],
    ['apache', path.join(ctx.raiz, 'etc', 'apache2', 'sites-enabled')],
  ] as const) {
    for (const archivo of await archivosConf(ctx, carpeta)) {
      const texto = await leerConfigAnotando(ctx, archivo);
      if (texto === null) continue;
      const leidos =
        tipo === 'nginx'
          ? leerVhostsNginx(texto)
          : leerVhostsApache(texto, { SRVROOT: ctx.raiz.replace(/\\/g, '/') });
      for (const v of leidos) {
        vhosts.push({ nombre: v.nombre, documentRoot: v.documentRoot, archivo });
      }
    }
  }
  const o = { php, motorPorDefecto: 'mysql' as const };
  const conVhost = await candidatosDeVhosts(ctx, vhosts, { carpetasDeSitios: [www], ...o });
  const carpetas = await candidatosDeCarpetas(ctx, www, {
    ...o,
    dominio: () => null,
    avisos: ['sin_vhost'],
  });
  return unirPorCarpeta([...conVhost, ...carpetas]);
}

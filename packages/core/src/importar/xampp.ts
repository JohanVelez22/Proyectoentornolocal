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
import { leerVhostsApache } from './vhostsApache';

/**
 * XAMPP: `apache/conf/extra/httpd-vhosts.conf` (y `apache/conf/sites-enabled/*.conf` si el usuario
 * los agregó) y las carpetas de `htdocs`. La versión de PHP sale de `properties.ini`. El servidor
 * de bases de XAMPP es MariaDB.
 */
export async function detectarXampp(ctx: ContextoDetectar): Promise<CandidatoImportar[]> {
  const htdocs = path.join(ctx.raiz, 'htdocs');
  const props = await leerConfigAnotando(ctx, path.join(ctx.raiz, 'properties.ini'));
  const php =
    props === null ? null : versionPhpDeTexto(Object.values(leerIni(props))[0]?.php_version);
  const archivos = [
    path.join(ctx.raiz, 'apache', 'conf', 'extra', 'httpd-vhosts.conf'),
    ...(await archivosConf(ctx, path.join(ctx.raiz, 'apache', 'conf', 'sites-enabled'))),
  ];
  const vhosts: VhostConOrigen[] = [];
  for (const archivo of archivos) {
    const texto = await leerConfigAnotando(ctx, archivo);
    if (texto === null) continue;
    // En XAMPP, SRVROOT de Apache es <instalación>/apache (no la instalación).
    const srvroot = path.join(ctx.raiz, 'apache').replace(/\\/g, '/');
    for (const v of leerVhostsApache(texto, { SRVROOT: srvroot })) {
      vhosts.push({ nombre: v.nombre, documentRoot: v.documentRoot, archivo });
    }
  }
  const o = { php, motorPorDefecto: 'mariadb' as const };
  const conVhost = await candidatosDeVhosts(ctx, vhosts, { carpetasDeSitios: [htdocs], ...o });
  const carpetas = await candidatosDeCarpetas(ctx, htdocs, {
    ...o,
    dominio: () => null,
    avisos: ['sin_vhost'],
  });
  return unirPorCarpeta([...conVhost, ...carpetas]);
}

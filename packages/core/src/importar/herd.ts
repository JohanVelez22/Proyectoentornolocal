import path from 'node:path';
import { ErrorWolf } from '../errores';
import {
  anotar,
  armarCandidato,
  esRutaLocalAbsoluta,
  leerConfigAjena,
  leerConfigAnotando,
  subcarpetas,
  unirPorCarpeta,
  validarCarpetaAjena,
  versionPhpDeTexto,
  type CandidatoImportar,
  type ContextoDetectar,
} from './comun';

/** `config/valet/config.json` de Herd/Valet: `tld` y `paths` (carpetas de sitios). */
function leerConfigValet(texto: string): { tld: string; paths: string[] } {
  try {
    const j: unknown = JSON.parse(texto);
    if (j === null || typeof j !== 'object') return { tld: 'test', paths: [] };
    const o = j as Record<string, unknown>;
    const tld =
      typeof o.tld === 'string' && /^[a-z]{2,24}$/i.test(o.tld) ? o.tld.toLowerCase() : 'test';
    const paths = Array.isArray(o.paths)
      ? o.paths.filter((p): p is string => typeof p === 'string').slice(0, 50)
      : [];
    return { tld, paths };
  } catch {
    return { tld: 'test', paths: [] };
  }
}

/** PHP aislado de un sitio: comentario `isolated PHP version` del vhost de Valet o `.valetphprc`. */
async function phpDelSitio(
  ctx: ContextoDetectar,
  carpeta: string,
  dominio: string,
): Promise<string | null> {
  const nginx = await leerConfigAnotando(
    ctx,
    path.join(ctx.raiz, 'config', 'valet', 'Nginx', dominio),
  );
  const deNginx = nginx === null ? null : /isolated PHP version\s*:\s*(\S+)/i.exec(nginx)?.[1];
  if (deNginx) return versionPhpDeTexto(deNginx);
  const rc = path.join(carpeta, '.valetphprc');
  try {
    return versionPhpDeTexto(await leerConfigAjena(rc, carpeta));
  } catch (e) {
    if (e instanceof ErrorWolf) anotar(ctx, e.codigo, rc);
    return null;
  }
}

/**
 * Herd (Valet): con la carpeta de configuración (`config/valet/config.json`) se toman sus `paths`;
 * con la carpeta de sitios sola (`~/Herd`) se toman sus carpetas. Cada carpeta de sitios da un
 * sitio por subcarpeta, con dominio `<carpeta>.<tld>` (así los sirve Herd).
 */
export async function detectarHerd(ctx: ContextoDetectar): Promise<CandidatoImportar[]> {
  const archivoConfig = path.join(ctx.raiz, 'config', 'valet', 'config.json');
  const config = await leerConfigAnotando(ctx, archivoConfig);
  // La carpeta de configuración sin su config.json no es una carpeta de sitios.
  if (config === null && /[\\/]\.config[\\/]herd$/i.test(ctx.raiz)) return [];
  const { tld, paths } = config === null ? { tld: 'test', paths: [] } : leerConfigValet(config);
  const carpetasDeSitios = config === null ? [ctx.raiz] : paths.filter(esRutaLocalAbsoluta);
  if (carpetasDeSitios.length < paths.length) anotar(ctx, 'importar.ruta_fuera', archivoConfig);
  const lista: CandidatoImportar[] = [];
  for (const carpetaSitios of carpetasDeSitios) {
    const real = await validarCarpetaAjena(ctx, carpetaSitios, carpetaSitios);
    if (real === null) continue;
    for (const sub of await subcarpetas(ctx, carpetaSitios)) {
      const carpeta = await validarCarpetaAjena(ctx, sub, sub);
      if (carpeta === null) continue;
      const nombre = path.basename(carpeta).toLowerCase();
      const dominio = /^[a-z0-9][a-z0-9-]*$/.test(nombre) ? `${nombre}.${tld}` : null;
      lista.push(
        await armarCandidato(ctx, carpeta, {
          dominio,
          dominioCrudo: dominio === null ? nombre : null,
          php: dominio === null ? null : await phpDelSitio(ctx, carpeta, dominio),
          motorPorDefecto: 'mysql',
        }),
      );
    }
  }
  return unirPorCarpeta(lista);
}

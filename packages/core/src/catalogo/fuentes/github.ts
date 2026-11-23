import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type {
  FormatoPaquete,
  ServicioInstalable,
  SoporteVersion,
  VersionDisponible,
} from '../catalogo';
import { claveValida, compararVersionesDesc, urlOficial } from '../comun';
import type { Huella } from '../huellas';
import { leerAcotado, pedirConSaltos } from '../red';
import {
  IndiceMalformado,
  leerIndiceJson,
  PLAZO_INDICE_MS,
  ramaMayorMenor,
  sumaDe,
  type ContextoFuente,
  type FuenteVersiones,
} from './tipos';

const Asset = z.object({
  name: z.string(),
  browser_download_url: z.string(),
  digest: z.string().nullable().optional(),
});
const Release = z.object({
  tag_name: z.string(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  assets: z.array(Asset),
});
const Releases = z.array(Release);

export interface OpcionesGithub {
  servicio: ServicioInstalable;
  dueno: string;
  repo: string;
  /** Nombre del asset de Windows x64 para esa versión. */
  asset: (version: string) => string;
  formato: FormatoPaquete;
  subcarpeta?: (version: string) => string;
  ejecutable: string;
}

/** Archivos de sumas que publican algunas releases junto a los binarios. */
const SUMAS = /^(sha256sums?|checksums?|sha256)(\.txt)?$|\.sha256(sum)?$/i;

async function sumaPublicada(
  ctx: ContextoFuente,
  url: string,
  archivo: string,
): Promise<Huella | null> {
  // Es una descarga de GitHub (redirige a release-assets): cada salto contra HOSTS_PERMITIDOS.
  const senales = [AbortSignal.timeout(PLAZO_INDICE_MS), ...(ctx.senal ? [ctx.senal] : [])];
  const res = await pedirConSaltos(ctx.f, url, { signal: AbortSignal.any(senales) }, urlOficial);
  if (!res.ok) {
    // La release publica sumas y no se pudieron leer: el índice falla (caché o lista fija) en vez
    // de ofrecer la versión "sin huella".
    await res.body?.cancel().catch(() => undefined);
    throw new Error(`HTTP ${res.status} al leer las sumas de ${archivo}`);
  }
  const valor = sumaDe(await leerAcotado(res, 1024 * 1024), archivo);
  return valor ? { algoritmo: 'sha256', valor } : null;
}

/**
 * ¿La URL es un asset de `https://github.com/<dueño>/<repo>/releases/download/`? Se interpreta con
 * `URL` (protocolo, host, sin usuario ni puerto) y se compara la ruta ya normalizada; además se
 * rechaza todo texto con `..` o `%2e`, que podría salir del repositorio tras normalizar.
 */
export function assetDelRepo(texto: string, dueno: string, repo: string): boolean {
  if (texto.includes('..') || /%2e/i.test(texto) || texto.includes('\\')) return false;
  let u: URL;
  try {
    u = new URL(texto);
  } catch {
    return false;
  }
  const prefijo = `/${dueno}/${repo}/releases/download/`.toLowerCase();
  return (
    u.protocol === 'https:' &&
    u.hostname === 'github.com' &&
    u.port === '' &&
    u.username === '' &&
    u.password === '' &&
    u.pathname.toLowerCase().startsWith(prefijo) &&
    u.pathname.length > prefijo.length
  );
}

/**
 * Fuente de GitHub Releases (`api.github.com/repos/<dueño>/<repo>/releases`): huella del campo
 * `digest` del asset (`sha256:…`) o, si falta, del archivo de sumas de la misma release. El
 * `browser_download_url` debe ser del repositorio esperado; si no, el índice se descarta entero.
 */
export function fuenteGithub(o: OpcionesGithub): FuenteVersiones {
  return {
    servicio: o.servicio,
    hostsIndice: ['api.github.com'],
    async listar(ctx) {
      if (ctx.idCatalogo !== 'win-x64') return [];
      const crudo = Releases.safeParse(
        await leerIndiceJson(
          ctx,
          `https://api.github.com/repos/${o.dueno}/${o.repo}/releases?per_page=30`,
          {
            encabezados: {
              accept: 'application/vnd.github+json',
              'x-github-api-version': '2022-11-28',
            },
          },
        ),
      );
      if (!crudo.success) throw new IndiceMalformado(`Releases de ${o.repo} con forma rara`);
      const salida: VersionDisponible[] = [];
      for (const r of crudo.data) {
        if (r.draft) continue;
        const version = r.tag_name.replace(/^v/, '');
        // Etiquetas que no son versiones ("nightly", "latest") no se ofrecen.
        if (!claveValida(version)) continue;
        // Todo asset que apunte fuera del repositorio esperado delata un índice manipulado.
        for (const a of r.assets) {
          if (!assetDelRepo(a.browser_download_url, o.dueno, o.repo)) {
            throw new IndiceMalformado(`Asset de ${o.repo} fuera del repositorio esperado`);
          }
        }
        const asset = r.assets.find((a) => a.name === o.asset(version));
        if (!asset) continue;
        let huella: Huella | null = null;
        if (asset.digest) {
          const m = /^(sha256|sha512):(.*)$/i.exec(asset.digest);
          if (!m) throw new IndiceMalformado(`Digest raro en ${asset.name}`);
          // Se deja tal cual: la validación rechaza una huella mal formada.
          huella = { algoritmo: m[1]!.toLowerCase() as 'sha256' | 'sha512', valor: m[2]! };
        } else {
          const sumas = r.assets.find((a) => SUMAS.test(a.name));
          if (sumas) huella = await sumaPublicada(ctx, sumas.browser_download_url, asset.name);
        }
        salida.push({
          servicio: o.servicio,
          version,
          rama: ramaMayorMenor(version) ?? version,
          url: asset.browser_download_url,
          sha256: huella?.algoritmo === 'sha256' ? huella.valor : null,
          huella,
          formato: o.formato,
          ...(o.subcarpeta ? { subcarpeta: o.subcarpeta(version) } : {}),
          ejecutable: o.ejecutable,
          soporte: r.prerelease ? 'preview' : 'actual',
          finSoporte: null,
          origen: 'vivo',
        });
      }
      // La rama de la última estable es la actual; las anteriores quedan como "fin".
      const ultima = salida
        .filter((v) => v.soporte !== 'preview')
        .sort((a, b) => compararVersionesDesc(a.version, b.version))[0];
      for (const v of salida) {
        if (v.soporte === 'preview' || !ultima) continue;
        const s: SoporteVersion = v.rama === ultima.rama ? 'actual' : 'fin';
        v.soporte = s;
      }
      return salida;
    },
  };
}

export const fuenteMailpit = fuenteGithub({
  servicio: 'mailpit',
  dueno: 'axllent',
  repo: 'mailpit',
  asset: () => 'mailpit-windows-amd64.zip',
  formato: 'zip',
  ejecutable: nombreEjecutable('mailpit'),
});

export const fuenteOllama = fuenteGithub({
  servicio: 'ollama',
  dueno: 'ollama',
  repo: 'ollama',
  asset: () => 'ollama-windows-amd64.zip',
  formato: 'zip',
  ejecutable: nombreEjecutable('ollama'),
});

export const fuenteCloudflared = fuenteGithub({
  servicio: 'cloudflared',
  dueno: 'cloudflare',
  repo: 'cloudflared',
  asset: () => nombreEjecutable('cloudflared-windows-amd64'),
  formato: 'exe',
  ejecutable: nombreEjecutable('cloudflared'),
});

export const fuenteRedis = fuenteGithub({
  servicio: 'redis',
  dueno: 'redis-windows',
  repo: 'redis-windows',
  asset: (v) => `Redis-${v}-Windows-x64-msys2.zip`,
  formato: 'zip',
  subcarpeta: (v) => `Redis-${v}-Windows-x64-msys2`,
  ejecutable: nombreEjecutable('redis-server'),
});

export const fuenteMongosh = fuenteGithub({
  servicio: 'mongosh',
  dueno: 'mongodb-js',
  repo: 'mongosh',
  asset: (v) => `mongosh-${v}-win32-x64.zip`,
  formato: 'zip',
  subcarpeta: (v) => `mongosh-${v}-win32-x64`,
  ejecutable: `bin/${nombreEjecutable('mongosh')}`,
});

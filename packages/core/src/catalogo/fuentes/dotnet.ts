import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { claveValida } from '../comun';
import { normalizarHuella } from '../huellas';
import { IndiceMalformado, leerIndiceJson, type FuenteVersiones } from './tipos';

const INDICE = 'https://builds.dotnet.microsoft.com/dotnet/release-metadata/releases-index.json';
const PREFIJO_CANAL = 'https://builds.dotnet.microsoft.com/dotnet/release-metadata/';
/** Canales más nuevos que se consultan (cada `releases.json` pesa más de 1 MB). */
const MAX_CANALES = 4;
/** El SDK 8 es el canal más viejo que se ofrece. */
const CANAL_MINIMO = 8;

const Indice = z.object({
  'releases-index': z.array(
    z.object({
      'channel-version': z.string(),
      'latest-sdk': z.string(),
      'support-phase': z.string(),
      'release-type': z.string().optional(),
      'eol-date': z.string().nullable().optional(),
      'releases.json': z.string(),
    }),
  ),
});

const Fichero = z.object({ name: z.string(), url: z.string(), hash: z.string().optional() });
const Sdk = z.object({ version: z.string(), files: z.array(Fichero) });
const Canal = z.object({
  releases: z.array(z.object({ sdk: Sdk.optional(), sdks: z.array(Sdk).optional() })),
});

const ZIP = 'dotnet-sdk-win-x64.zip';
const PREFIJO_SDK = 'https://builds.dotnet.microsoft.com/dotnet/Sdk/';

const mayorDe = (canal: string): number => Number(canal.split('.')[0]);

function soporteDe(fase: string, tipo: string | undefined): SoporteVersion {
  if (fase === 'eol') return 'fin';
  if (['preview', 'go-live', 'rc'].includes(fase)) return 'preview';
  return tipo === 'lts' ? 'lts' : 'actual';
}

/**
 * .NET SDK: `releases-index.json` de `builds.dotnet.microsoft.com` y, de cada canal, su
 * `releases.json`. De cada canal se ofrece el último SDK (`latest-sdk`) en zip de Windows x64 con
 * el SHA-512 que publica el índice.
 */
export const fuenteDotnet: FuenteVersiones = {
  servicio: 'dotnet',
  hostsIndice: ['builds.dotnet.microsoft.com'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const idx = Indice.safeParse(await leerIndiceJson(ctx, INDICE));
    if (!idx.success) throw new IndiceMalformado('releases-index de .NET con forma rara');
    const canales = idx.data['releases-index']
      .filter((c) => /^\d+\.\d+$/.test(c['channel-version']))
      .filter((c) => mayorDe(c['channel-version']) >= CANAL_MINIMO)
      .sort((a, b) => mayorDe(b['channel-version']) - mayorDe(a['channel-version']))
      .slice(0, MAX_CANALES);
    const salida: VersionDisponible[] = [];
    for (const c of canales) {
      if (!c['releases.json'].startsWith(PREFIJO_CANAL)) {
        throw new IndiceMalformado('releases.json de .NET fuera del host esperado');
      }
      const crudo = Canal.safeParse(await leerIndiceJson(ctx, c['releases.json']));
      if (!crudo.success) throw new IndiceMalformado('releases.json de .NET con forma rara');
      const sdks = crudo.data.releases.flatMap((r) => [
        ...(r.sdk ? [r.sdk] : []),
        ...(r.sdks ?? []),
      ]);
      const sdk = sdks.find((s) => s.version === c['latest-sdk']);
      const fichero = sdk?.files.find((f) => f.name === ZIP);
      if (!sdk || !fichero) continue;
      if (!claveValida(sdk.version)) throw new IndiceMalformado('Versión de .NET no válida');
      // La URL debe ser del SDK de esa versión: …/dotnet/Sdk/<versión>/dotnet-sdk-<versión>-win-x64.zip.
      if (
        !fichero.url.startsWith(`${PREFIJO_SDK}${sdk.version}/`) ||
        !fichero.url.endsWith(`/dotnet-sdk-${sdk.version}-win-x64.zip`)
      ) {
        throw new IndiceMalformado('URL del SDK de .NET fuera de su carpeta de versión');
      }
      // Una huella mal formada no se descarta: llega cruda y la validación del índice la rechaza.
      const huella = normalizarHuella('sha512', fichero.hash ?? '') ?? {
        algoritmo: 'sha512' as const,
        valor: fichero.hash ?? '',
      };
      const fin = c['eol-date'] ?? null;
      salida.push({
        servicio: 'dotnet',
        version: sdk.version,
        rama: c['channel-version'],
        url: fichero.url,
        sha256: null,
        huella,
        formato: 'zip',
        ejecutable: nombreEjecutable('dotnet'),
        soporte: soporteDe(c['support-phase'], c['release-type']),
        finSoporte: fin && /^\d{4}-\d{2}-\d{2}$/.test(fin) ? fin : null,
        origen: 'vivo',
      });
    }
    return salida;
  },
};

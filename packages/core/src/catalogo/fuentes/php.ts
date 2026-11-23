import { z } from 'zod';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { urlOficial } from '../comun';
import { normalizarHuella } from '../huellas';
import { IndiceMalformado, leerIndiceJson, type FuenteVersiones } from './tipos';

export const PHP_RELEASES_URL = 'https://windows.php.net/downloads/releases/releases.json';
const PHP_BASE = 'https://windows.php.net/downloads/releases/';
const VARIANTES_PHP = ['nts-vs17-x64', 'nts-vs16-x64'] as const;

const ZipPhpSchema = z.object({ zip: z.object({ path: z.string(), sha256: z.string() }) });

function ramaValida(rama: string): boolean {
  const m = /^(\d+)\.(\d+)$/.exec(rama);
  if (!m) return false;
  const mayor = Number(m[1]);
  const menor = Number(m[2]);
  return mayor > 8 || (mayor === 8 && menor >= 1);
}

function comparar(a: string, b: string): number {
  const [am = 0, an = 0] = a.split('.').map(Number);
  const [bm = 0, bn = 0] = b.split('.').map(Number);
  return bm - am || bn - an;
}

/**
 * Ramas 8.1+ de `releases.json` con su zip NTS x64 (prefiere VS17) y su SHA-256. Es la lógica de
 * siempre de `listarVersiones('php')`.
 */
export function versionesDeReleasesPhp(
  json: unknown,
): { version: string; rama: string; url: string; sha256: string }[] {
  const datos = z.record(z.string(), z.record(z.string(), z.unknown())).parse(json);
  const salida: { version: string; rama: string; url: string; sha256: string }[] = [];
  for (const rama of Object.keys(datos).filter(ramaValida).sort(comparar)) {
    const entrada = datos[rama];
    if (!entrada || typeof entrada.version !== 'string') continue;
    for (const variante of VARIANTES_PHP) {
      const zip = ZipPhpSchema.safeParse(entrada[variante]);
      if (!zip.success) continue;
      const url = PHP_BASE + zip.data.zip.path;
      if (!urlOficial(url)) continue;
      salida.push({ version: entrada.version, rama, url, sha256: zip.data.zip.sha256 });
      break;
    }
  }
  return salida;
}

/**
 * Fin del soporte de seguridad de una rama 8.x: desde 8.1, el 31 de diciembre del cuarto año
 * (8.1 → 2025, 8.4 → 2028). Para otras ramas no se sabe.
 */
export function finSoportePhp(rama: string): string | null {
  const m = /^8\.(\d+)$/.exec(rama);
  return m ? `${2024 + Number(m[1])}-12-31` : null;
}

export const fuentePhp: FuenteVersiones = {
  servicio: 'php',
  hostsIndice: ['windows.php.net', 'downloads.php.net'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    let crudas: ReturnType<typeof versionesDeReleasesPhp>;
    try {
      crudas = versionesDeReleasesPhp(await leerIndiceJson(ctx, PHP_RELEASES_URL));
    } catch (e) {
      if (e instanceof z.ZodError) throw new IndiceMalformado('releases.json con forma rara');
      throw e;
    }
    const hoy = (ctx.ahora ?? new Date()).toISOString().slice(0, 10);
    return crudas.map((v): VersionDisponible => {
      const fin = finSoportePhp(v.rama);
      const soporte: SoporteVersion = fin !== null && fin < hoy ? 'fin' : 'actual';
      // La huella se valida después (validarIndice): una mal formada descarta el índice.
      const huella = normalizarHuella('sha256', v.sha256) ?? {
        algoritmo: 'sha256',
        valor: v.sha256,
      };
      return {
        servicio: 'php',
        version: v.version,
        rama: v.rama,
        url: v.url,
        sha256: huella.valor,
        huella,
        formato: 'zip',
        soporte,
        finSoporte: fin,
        origen: 'vivo',
      };
    });
  },
};

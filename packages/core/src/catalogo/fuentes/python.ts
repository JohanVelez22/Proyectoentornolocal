import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { claveValida, compararVersionesDesc } from '../comun';
import { normalizarHuella, type Huella } from '../huellas';
import { huellasDeUltimas } from './node';
import {
  IndiceMalformado,
  leerIndiceJson,
  ramaMayorMenor,
  type ContextoFuente,
  type FuenteVersiones,
} from './tipos';

const FLAT = 'https://api.nuget.org/v3-flatcontainer/python/';
const REGISTRO = 'https://api.nuget.org/v3/registration5-gz-semver2/python/';

const IndiceNuget = z.object({ versions: z.array(z.string()) });
const HojaRegistro = z.object({ catalogEntry: z.string() });
const HojaCatalogo = z.object({
  id: z.string(),
  version: z.string(),
  packageHash: z.string(),
  packageHashAlgorithm: z.string(),
});

/**
 * Fin de soporte de una rama 3.x: cinco años tras su salida en octubre (3.10 → 2026-10,
 * 3.13 → 2029-10).
 */
export function finSoportePython(rama: string): string | null {
  const m = /^3\.(\d+)$/.exec(rama);
  return m ? `${2016 + Number(m[1])}-10-31` : null;
}

/** SHA-512 (base64 en NuGet) de la hoja del catálogo de esa versión. */
async function huellaPython(version: string, ctx: ContextoFuente): Promise<Huella | null> {
  const v = version.toLowerCase();
  const hoja = HojaRegistro.safeParse(await leerIndiceJson(ctx, `${REGISTRO}${v}.json`));
  if (!hoja.success) throw new IndiceMalformado('Hoja de registro de NuGet con forma rara');
  // La URL del catálogo pasa por la lista de índices en `leerIndice` (y cada salto también).
  const cat = HojaCatalogo.safeParse(await leerIndiceJson(ctx, hoja.data.catalogEntry));
  if (!cat.success) throw new IndiceMalformado('Hoja del catálogo de NuGet con forma rara');
  if (cat.data.id.toLowerCase() !== 'python' || cat.data.version.toLowerCase() !== v) {
    throw new IndiceMalformado('La hoja del catálogo de NuGet es de otro paquete');
  }
  if (cat.data.packageHashAlgorithm.toUpperCase() !== 'SHA512') return null;
  // Una huella mal formada no se descarta en silencio: llega cruda y la validación la rechaza.
  return (
    normalizarHuella('sha512', cat.data.packageHash) ?? {
      algoritmo: 'sha512',
      valor: cat.data.packageHash,
    }
  );
}

/**
 * Python: el paquete `python` de NuGet (el que ya se usa: `tools/python.exe`). Versiones de
 * `v3-flatcontainer/python/index.json`; huella SHA-512 de la hoja del catálogo (`packageHash`),
 * pedida al listar solo para la última versión de cada rama con soporte.
 */
export const fuentePython: FuenteVersiones = {
  servicio: 'python',
  hostsIndice: ['api.nuget.org'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const crudo = IndiceNuget.safeParse(await leerIndiceJson(ctx, `${FLAT}index.json`));
    if (!crudo.success) throw new IndiceMalformado('index.json de NuGet con forma rara');
    const hoy = (ctx.ahora ?? new Date()).toISOString().slice(0, 10);
    const lista = crudo.data.versions.map((x) => x.toLowerCase()).filter(claveValida);
    const ultimaEstable = lista.filter((x) => !x.includes('-')).sort(compararVersionesDesc)[0];
    const ramaEstable = ultimaEstable ? ramaMayorMenor(ultimaEstable) : null;
    const versiones: VersionDisponible[] = [];
    for (const version of lista) {
      const rama = ramaMayorMenor(version);
      if (!rama) continue;
      const fin = finSoportePython(rama);
      // Prerelease, o una rama más nueva que la última estable (solo tiene alfas/betas).
      const preview =
        version.includes('-') ||
        (ramaEstable !== null && compararVersionesDesc(rama, ramaEstable) < 0);
      const soporte: SoporteVersion = preview
        ? 'preview'
        : fin !== null && fin < hoy
          ? 'fin'
          : 'actual';
      versiones.push({
        servicio: 'python',
        version,
        rama,
        url: `${FLAT}${version}/python.${version}.nupkg`,
        sha256: null,
        huella: null,
        huellaDiferida: true,
        formato: 'zip',
        subcarpeta: 'tools',
        ejecutable: nombreEjecutable('python'),
        soporte,
        finSoporte: fin,
        origen: 'vivo',
      });
    }
    await huellasDeUltimas(
      versiones,
      (v) => v.soporte === 'actual',
      (v) => huellaPython(v.version, ctx),
    );
    return versiones;
  },
  completar(v, ctx) {
    return huellaPython(v.version, ctx);
  },
};

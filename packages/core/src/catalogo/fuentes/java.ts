import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { claveValida } from '../comun';
import { normalizarHuella } from '../huellas';
import { assetDelRepo } from './github';
import { IndiceMalformado, leerIndiceJson, type FuenteVersiones } from './tipos';

const API = 'https://api.adoptium.net/v3';

const Disponibles = z.object({
  available_lts_releases: z.array(z.number().int().positive()),
  most_recent_feature_release: z.number().int().positive(),
});

const Activo = z.object({
  binary: z.object({
    package: z.object({
      checksum: z.string(),
      link: z.string(),
      name: z.string(),
    }),
  }),
  release_name: z.string(),
  version: z.object({
    major: z.number().int().nonnegative(),
    minor: z.number().int().nonnegative(),
    security: z.number().int().nonnegative(),
    patch: z.number().int().nonnegative().optional(),
  }),
});
const Activos = z.array(Activo);

/** "21.0.13" o, con parche, "21.0.13.1": la clave de carpeta de una versión de Temurin. */
function versionTemurin(v: z.infer<typeof Activo>['version']): string {
  const base = `${v.major}.${v.minor}.${v.security}`;
  return v.patch ? `${base}.${v.patch}` : base;
}

/**
 * Java (Eclipse Temurin): `api.adoptium.net/v3`. Las versiones LTS vigentes y la última versión
 * de características; de cada una, el JDK de Windows x64 más reciente con su SHA-256 (el índice
 * lo publica) y el enlace de GitHub Releases del repositorio `adoptium/temurin<N>-binaries`.
 */
export const fuenteJava: FuenteVersiones = {
  servicio: 'java',
  hostsIndice: ['api.adoptium.net'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const d = Disponibles.safeParse(await leerIndiceJson(ctx, `${API}/info/available_releases`));
    if (!d.success) throw new IndiceMalformado('available_releases de Adoptium con forma rara');
    const lts = new Set(d.data.available_lts_releases);
    const majores = [...new Set([...lts, d.data.most_recent_feature_release])].sort(
      (a, b) => b - a,
    );
    const salida: VersionDisponible[] = [];
    for (const major of majores) {
      const crudo = Activos.safeParse(
        await leerIndiceJson(
          ctx,
          `${API}/assets/latest/${major}/hotspot?architecture=x64&image_type=jdk&os=windows`,
        ),
      );
      if (!crudo.success) throw new IndiceMalformado(`Activos de Temurin ${major} con forma rara`);
      const a = crudo.data[0];
      if (!a) continue;
      const version = versionTemurin(a.version);
      if (a.version.major !== major || !claveValida(version)) {
        throw new IndiceMalformado(`Versión de Temurin ${major} no válida`);
      }
      // El enlace debe ser de los binarios de esa versión de Temurin; si no, índice manipulado.
      if (!assetDelRepo(a.binary.package.link, 'adoptium', `temurin${major}-binaries`)) {
        throw new IndiceMalformado(`Enlace de Temurin ${major} fuera del repositorio esperado`);
      }
      // Una huella mal formada no se descarta: llega cruda y la validación del índice la rechaza.
      const huella = normalizarHuella('sha256', a.binary.package.checksum) ?? {
        algoritmo: 'sha256' as const,
        valor: a.binary.package.checksum,
      };
      const soporte: SoporteVersion = lts.has(major) ? 'lts' : 'actual';
      salida.push({
        servicio: 'java',
        version,
        rama: String(major),
        url: a.binary.package.link,
        sha256: huella.valor,
        huella,
        formato: 'zip',
        // El zip trae una carpeta "jdk-21.0.13.1+2" (en Java 8, "jdk8u472-b08").
        subcarpeta: a.release_name,
        ejecutable: `bin/${nombreEjecutable('java')}`,
        soporte,
        finSoporte: null,
        origen: 'vivo',
      });
    }
    return salida;
  },
};

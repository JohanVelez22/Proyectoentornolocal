import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import { catalogo, type VersionDisponible } from '../catalogo';
import { claveValida, compararVersionesDesc } from '../comun';
import { IndiceMalformado, leerIndiceJson, sondear, type FuenteVersiones } from './tipos';

export const VERSIONS_POSTGRESQL = 'https://www.postgresql.org/versions.json';
const EDB = 'https://get.enterprisedb.com/postgresql/';

/** Sufijos de compilación de EDB que se sondean (`-1`, `-2`, `-3`). */
export const MAX_SUFIJO_EDB = 3;
/** Ramas ya sin soporte que se siguen ofreciendo (como "fin", visibles con "Mostrar todas"). */
export const RAMAS_SIN_SOPORTE_POSTGRESQL = 2;

const Versiones = z.array(
  z.object({
    major: z.string(),
    latestMinor: z.string(),
    supported: z.boolean(),
    eolDate: z.string().nullable().optional(),
  }),
);

const urlEdb = (version: string, n: number): string =>
  `${EDB}postgresql-${version}-${n}-windows-x64-binaries.zip`;

/**
 * PostgreSQL: `www.postgresql.org/versions.json` (rama, último parche, soportada, fin) y los
 * binarios de EDB (`get.enterprisedb.com/postgresql/postgresql-<v>-<n>-windows-x64-binaries.zip`)
 * con `<n>` sondeado con `HEAD` (1 a 3). Si la lista fija tiene esa versión y su sufijo existe,
 * se usa ese (así vale su SHA-256); si no, la compilación más nueva. EDB no publica huellas: sin
 * la lista fija, la versión queda sin huella (el instalador pide confirmar).
 */
export const fuentePostgresql: FuenteVersiones = {
  servicio: 'postgresql',
  hostsIndice: ['www.postgresql.org', 'get.enterprisedb.com'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const crudo = Versiones.safeParse(await leerIndiceJson(ctx, VERSIONS_POSTGRESQL));
    if (!crudo.success) throw new IndiceMalformado('versions.json de PostgreSQL con forma rara');
    // Desde la 10 la rama es un número solo; las anteriores ("9.6") ya no se ofrecen.
    const ramas = crudo.data
      .filter((r) => /^\d{2,4}$/.test(r.major) && /^\d{1,4}$/.test(r.latestMinor))
      .sort((a, b) => Number(b.major) - Number(a.major));
    const sinSoporte = ramas
      .filter((r) => !r.supported)
      .slice(0, RAMAS_SIN_SOPORTE_POSTGRESQL)
      .map((r) => r.major);
    const salida: VersionDisponible[] = [];
    for (const r of ramas) {
      if (!r.supported && !sinSoporte.includes(r.major)) continue;
      const version = `${r.major}.${r.latestMinor}`;
      if (!claveValida(version)) continue;
      const fija = catalogo.postgresql.find((e) => e.version === version)?.url ?? null;
      let elegida: string | null = null;
      for (let n = 1; n <= MAX_SUFIJO_EDB; n++) {
        const url = urlEdb(version, n);
        if (!(await sondear(ctx, url))) break;
        elegida = url;
        if (url === fija) break;
      }
      // EDB todavía no publicó los binarios de ese parche: no se ofrece.
      if (!elegida) continue;
      const fin = r.eolDate && /^\d{4}-\d{2}-\d{2}$/.test(r.eolDate) ? r.eolDate : null;
      salida.push({
        servicio: 'postgresql',
        version,
        rama: r.major,
        url: elegida,
        sha256: null,
        huella: null,
        formato: 'zip',
        ejecutable: `pgsql/bin/${nombreEjecutable('postgres')}`,
        soporte: r.supported ? 'actual' : 'fin',
        finSoporte: fin,
        origen: 'vivo',
      });
    }
    return salida.sort((a, b) => compararVersionesDesc(a.version, b.version));
  },
};

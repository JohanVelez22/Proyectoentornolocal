import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { claveValida, compararVersionesDesc, RAMA_VALIDA } from '../comun';
import { normalizarHuella, type Huella } from '../huellas';
import {
  IndiceMalformado,
  leerIndice,
  leerIndiceJson,
  sumaDe,
  type ContextoFuente,
  type FuenteVersiones,
} from './tipos';

const REST = 'https://downloads.mariadb.org/rest-api/mariadb/';
const ARCHIVO = 'https://archive.mariadb.org/';

const Ramas = z.object({
  major_releases: z.array(
    z.object({
      release_id: z.string(),
      release_status: z.string(),
      release_support_type: z.string().nullable(),
      release_eol_date: z.string().nullable(),
    }),
  ),
});

const Archivo = z.object({
  file_name: z.string(),
  checksum: z.object({ sha256sum: z.string().nullable().optional() }).nullable().optional(),
});
const Rama = z.object({
  releases: z.record(z.string(), z.object({ files: z.array(Archivo) })),
});

const nombreZip = (v: string): string => `mariadb-${v}-winx64`;
const urlZip = (v: string): string => `${ARCHIVO}mariadb-${v}/winx64-packages/${nombreZip(v)}.zip`;
const urlSumas = (v: string): string => `${ARCHIVO}mariadb-${v}/winx64-packages/sha256sums.txt`;

/** SHA-256 del zip de Windows de cada parche de una rama según la REST (sin zip: no aparece). */
async function parchesDeRama(ctx: ContextoFuente, rama: string): Promise<Map<string, string>> {
  const r = Rama.safeParse(await leerIndiceJson(ctx, `${REST}${rama}/`));
  if (!r.success) throw new IndiceMalformado(`Serie ${rama} de MariaDB con forma rara`);
  const res = new Map<string, string>();
  for (const [version, rel] of Object.entries(r.data.releases)) {
    if (!claveValida(version) || !version.startsWith(`${rama}.`)) continue;
    const zip = rel.files.find((f) => f.file_name === `${nombreZip(version)}.zip`);
    const suma = zip?.checksum?.sha256sum;
    if (!zip || !suma) continue;
    // Una suma mal formada no se descarta en silencio: llega cruda y la validación la rechaza.
    res.set(version, normalizarHuella('sha256', suma)?.valor ?? suma);
  }
  return res;
}

/**
 * Huella de la REST contrastada con `sha256sums.txt` del archivo: si no coinciden (o el archivo
 * no la trae), el índice no es de fiar y se descarta entero.
 */
async function contrastar(ctx: ContextoFuente, version: string, suma: string): Promise<Huella> {
  const texto = await leerIndice(ctx, urlSumas(version), { maxBytes: 64 * 1024 });
  const archivo = sumaDe(texto, `${nombreZip(version)}.zip`);
  if (archivo === null || archivo !== suma.toLowerCase()) {
    throw new IndiceMalformado(`La suma de MariaDB ${version} no coincide con la del archivo`);
  }
  return { algoritmo: 'sha256', valor: archivo };
}

function soporteDe(
  r: z.infer<typeof Ramas>['major_releases'][number],
  hoy: string,
): SoporteVersion {
  if (r.release_status !== 'Stable') return 'preview';
  if (r.release_eol_date !== null && r.release_eol_date < hoy) return 'fin';
  return r.release_support_type === 'Long Term Support' ? 'lts' : 'actual';
}

/**
 * MariaDB: ramas de `downloads.mariadb.org/rest-api/mariadb/` (estado y tipo de soporte) y
 * parches de `/rest-api/mariadb/<rama>/` con el SHA-256 de `mariadb-<v>-winx64.zip`. Al listar se
 * contrasta solo la última de cada rama con `archive.mariadb.org/…/sha256sums.txt` (si no
 * coincide, índice inválido); las demás quedan diferidas y se contrastan al instalar. La descarga
 * sigue en `archive.mariadb.org`.
 */
export const fuenteMariadb: FuenteVersiones = {
  servicio: 'mariadb',
  hostsIndice: ['downloads.mariadb.org', 'archive.mariadb.org'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const ramas = Ramas.safeParse(await leerIndiceJson(ctx, REST));
    if (!ramas.success) throw new IndiceMalformado('Series de MariaDB con forma rara');
    const hoy = (ctx.ahora ?? new Date()).toISOString().slice(0, 10);
    const salida: VersionDisponible[] = [];
    for (const r of ramas.data.major_releases) {
      if (!RAMA_VALIDA.test(r.release_id) || !r.release_id.includes('.')) {
        throw new IndiceMalformado(`Serie rara en MariaDB: ${r.release_id.slice(0, 20)}`);
      }
      const fin =
        r.release_eol_date && /^\d{4}-\d{2}-\d{2}$/.test(r.release_eol_date)
          ? r.release_eol_date
          : null;
      const parches = await parchesDeRama(ctx, r.release_id);
      const orden = [...parches.keys()].sort(compararVersionesDesc);
      for (const [i, version] of orden.entries()) {
        const huella = i === 0 ? await contrastar(ctx, version, parches.get(version)!) : null;
        salida.push({
          servicio: 'mariadb',
          version,
          rama: r.release_id,
          url: urlZip(version),
          sha256: huella?.valor ?? null,
          huella,
          ...(huella ? {} : { huellaDiferida: true }),
          formato: 'zip',
          subcarpeta: nombreZip(version),
          ejecutable: `bin/${nombreEjecutable('mariadbd')}`,
          soporte: soporteDe(r, hoy),
          finSoporte: fin,
          origen: 'vivo',
        });
      }
    }
    return salida;
  },
  async completar(v, ctx) {
    const rama = v.rama ?? '';
    if (!RAMA_VALIDA.test(rama)) throw new IndiceMalformado('Serie de MariaDB no válida');
    const suma = (await parchesDeRama(ctx, rama)).get(v.version);
    // La REST ya no la trae: no hay huella publicada para esa versión.
    if (!suma) return null;
    return contrastar(ctx, v.version, suma);
  },
};

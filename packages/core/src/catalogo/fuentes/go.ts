import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { VersionDisponible } from '../catalogo';
import { claveValida } from '../comun';
import { normalizarHuella } from '../huellas';
import { IndiceMalformado, leerIndiceJson, ramaMayorMenor, type FuenteVersiones } from './tipos';

const INDICE = 'https://go.dev/dl/?mode=json&include=all';
/** Ramas "1.N" que se ofrecen (la última versión de cada una). */
const MAX_RAMAS = 6;

const Indice = z.array(
  z.object({
    version: z.string(),
    stable: z.boolean(),
    files: z.array(
      z.object({
        filename: z.string(),
        os: z.string(),
        arch: z.string(),
        sha256: z.string(),
        kind: z.string(),
      }),
    ),
  }),
);

/** "go1.27.4" → "1.27.4"; "go1.20" → "1.20"; los rc/beta y lo raro → null. */
export function versionDeGo(etiqueta: string): string | null {
  const m = /^go(\d+\.\d+(?:\.\d+)?)$/.exec(etiqueta);
  return m ? m[1]! : null;
}

/**
 * Go: `go.dev/dl/?mode=json&include=all` (SHA-256 de cada archivo). Se ofrece la última versión
 * de cada una de las ramas más nuevas; las dos más nuevas son las que Go mantiene. El zip se baja
 * de `go.dev/dl/…`, que redirige a `dl.google.com`.
 */
export const fuenteGo: FuenteVersiones = {
  servicio: 'go',
  hostsIndice: ['go.dev'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const crudo = Indice.safeParse(await leerIndiceJson(ctx, INDICE));
    if (!crudo.success) throw new IndiceMalformado('Índice de Go con forma rara');
    const porRama = new Map<string, VersionDisponible>();
    for (const r of crudo.data) {
      if (!r.stable) continue;
      const version = versionDeGo(r.version);
      if (!version || !claveValida(version)) continue;
      const rama = ramaMayorMenor(version);
      if (!rama) continue;
      // El índice viene de la más nueva a la más vieja: la primera de cada rama es su última.
      if (porRama.has(rama)) continue;
      const f = r.files.find(
        (x) => x.os === 'windows' && x.arch === 'amd64' && x.kind === 'archive',
      );
      if (!f) continue;
      if (f.filename !== `go${version}.windows-amd64.zip`) {
        throw new IndiceMalformado(`Archivo de Go inesperado: ${f.filename.slice(0, 60)}`);
      }
      const huella = normalizarHuella('sha256', f.sha256) ?? {
        algoritmo: 'sha256' as const,
        valor: f.sha256,
      };
      porRama.set(rama, {
        servicio: 'go',
        version,
        rama,
        url: `https://go.dev/dl/${f.filename}`,
        sha256: huella.valor,
        huella,
        formato: 'zip',
        subcarpeta: 'go',
        ejecutable: `bin/${nombreEjecutable('go')}`,
        soporte: 'fin',
        finSoporte: null,
        origen: 'vivo',
      });
      if (porRama.size >= MAX_RAMAS) break;
    }
    // Go solo mantiene las dos ramas más nuevas.
    for (const v of [...porRama.values()].slice(0, 2)) v.soporte = 'actual';
    return [...porRama.values()];
  },
};

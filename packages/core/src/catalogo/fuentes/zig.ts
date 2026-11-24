import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { VersionDisponible } from '../catalogo';
import { compararVersionesDesc } from '../comun';
import { normalizarHuella } from '../huellas';
import { IndiceMalformado, leerIndiceJson, ramaMayorMenor, type FuenteVersiones } from './tipos';

const INDICE = 'https://ziglang.org/download/index.json';
const BASE = 'https://ziglang.org/download/';
/** Versiones menores "0.N" que se ofrecen (la última versión de cada una). */
const MAX_RAMAS = 5;

const Plataforma = z.object({ tarball: z.string(), shasum: z.string() }).passthrough();
const Indice = z.record(z.string(), z.record(z.string(), z.unknown()));

/** "0.14.1" (solo estables numéricas: `master` y las de desarrollo no entran). */
const VERSION_ZIG = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/**
 * Nombre del zip de Windows x64: hasta 0.14.0 era `zig-windows-x86_64-<v>`, desde 0.14.1
 * `zig-x86_64-windows-<v>`. Cualquier otro nombre delata un índice raro.
 */
export function nombreZipZig(version: string): string[] {
  return [`zig-x86_64-windows-${version}`, `zig-windows-x86_64-${version}`];
}

/**
 * Zig: `ziglang.org/download/index.json` (SHA-256 en `shasum`). Se ofrece la última versión de cada
 * una de las ramas "0.N" más nuevas (Zig aún rompe compatibilidad entre ramas, así que todas se
 * consideran vigentes). La firma minisign (`<zip>.minisig`) se verifica al instalar.
 */
export const fuenteZig: FuenteVersiones = {
  servicio: 'zig',
  hostsIndice: ['ziglang.org'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const crudo = Indice.safeParse(await leerIndiceJson(ctx, INDICE));
    if (!crudo.success) throw new IndiceMalformado('Índice de Zig con forma rara');
    const porRama = new Map<string, VersionDisponible>();
    const versiones = Object.keys(crudo.data)
      .filter((k) => VERSION_ZIG.test(k))
      .sort(compararVersionesDesc);
    for (const version of versiones) {
      const rama = ramaMayorMenor(version);
      if (!rama || porRama.has(rama)) continue;
      const bruto = crudo.data[version]?.['x86_64-windows'];
      if (bruto === undefined) continue;
      const p = Plataforma.safeParse(bruto);
      if (!p.success) throw new IndiceMalformado(`Entrada de Zig ${version} con forma rara`);
      const nombre = nombreZipZig(version).find(
        (n) => p.data.tarball === `${BASE}${version}/${n}.zip`,
      );
      if (!nombre)
        throw new IndiceMalformado(`Archivo de Zig inesperado: ${p.data.tarball.slice(0, 80)}`);
      const huella = normalizarHuella('sha256', p.data.shasum) ?? {
        algoritmo: 'sha256' as const,
        valor: p.data.shasum,
      };
      porRama.set(rama, {
        servicio: 'zig',
        version,
        rama,
        url: p.data.tarball,
        sha256: huella.valor,
        huella,
        formato: 'zip',
        subcarpeta: nombre,
        ejecutable: nombreEjecutable('zig'),
        soporte: 'actual',
        finSoporte: null,
        origen: 'vivo',
      });
      if (porRama.size >= MAX_RAMAS) break;
    }
    return [...porRama.values()];
  },
};

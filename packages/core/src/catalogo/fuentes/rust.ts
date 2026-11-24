import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { VersionDisponible } from '../catalogo';
import { claveValida, compararVersionesDesc } from '../comun';
import type { Huella } from '../huellas';
import {
  IndiceMalformado,
  leerIndice,
  leerIndiceJson,
  ramaMayorMenor,
  sumaDe,
  type ContextoFuente,
  type FuenteVersiones,
} from './tipos';

const RELEASES = 'https://api.github.com/repos/rust-lang/rust/releases?per_page=30';
/** Versiones menores "1.N" que se ofrecen (la última versión de cada una). */
const MAX_RAMAS = 6;

/** Instalador de rustup para Windows x64 (MSVC) y su suma SHA-256. */
export const HOST_RUSTUP = 'static.rust-lang.org';
export const URL_RUSTUP_INIT = `https://${HOST_RUSTUP}/rustup/dist/x86_64-pc-windows-msvc/${nombreEjecutable('rustup-init')}`;
export const URL_RUSTUP_INIT_SHA256 = `${URL_RUSTUP_INIT}.sha256`;

const Releases = z.array(
  z.object({ tag_name: z.string(), draft: z.boolean(), prerelease: z.boolean() }),
);

/**
 * Suma SHA-256 publicada junto a `rustup-init`: una línea con el hash (y, a veces, el nombre).
 * Null si el archivo no trae una suma legible.
 */
export function sumaRustup(texto: string): Huella | null {
  const valor = sumaDe(texto, null);
  return valor ? { algoritmo: 'sha256', valor } : null;
}

/** Lee la suma de `rustup-init` (host de índice `static.rust-lang.org`). */
export async function huellaRustup(ctx: ContextoFuente): Promise<Huella | null> {
  return sumaRustup(await leerIndice(ctx, URL_RUSTUP_INIT_SHA256, { maxBytes: 4096 }));
}

/**
 * Rust: las versiones estables salen de las releases de `rust-lang/rust` (API de GitHub; solo se
 * toma la etiqueta). Todas se instalan con el mismo `rustup-init`: su SHA-256 es la de
 * `static.rust-lang.org` y se pide al instalar (`huellaDiferida`), porque rustup cambia más
 * seguido que las versiones del lenguaje. rustup verifica cada componente con el manifiesto del
 * canal.
 */
export const fuenteRust: FuenteVersiones = {
  servicio: 'rust',
  hostsIndice: ['api.github.com', HOST_RUSTUP],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const crudo = Releases.safeParse(
      await leerIndiceJson(ctx, RELEASES, {
        encabezados: {
          accept: 'application/vnd.github+json',
          'x-github-api-version': '2022-11-28',
        },
      }),
    );
    if (!crudo.success) throw new IndiceMalformado('Releases de rust-lang/rust con forma rara');
    const estables = crudo.data
      .filter((r) => !r.draft && !r.prerelease && /^\d+\.\d+\.\d+$/.test(r.tag_name))
      .map((r) => r.tag_name)
      .filter(claveValida)
      .sort(compararVersionesDesc);
    const porRama = new Map<string, VersionDisponible>();
    for (const version of estables) {
      const rama = ramaMayorMenor(version);
      if (!rama || porRama.has(rama)) continue;
      porRama.set(rama, {
        servicio: 'rust',
        version,
        rama,
        url: URL_RUSTUP_INIT,
        sha256: null,
        huella: null,
        huellaDiferida: true,
        formato: 'exe',
        ejecutable: nombreEjecutable('rustup-init'),
        // Rust solo mantiene la última estable.
        soporte: porRama.size === 0 ? 'actual' : 'fin',
        finSoporte: null,
        origen: 'vivo',
      });
      if (porRama.size >= MAX_RAMAS) break;
    }
    return [...porRama.values()];
  },
  completar(_v, ctx) {
    return huellaRustup(ctx);
  },
};

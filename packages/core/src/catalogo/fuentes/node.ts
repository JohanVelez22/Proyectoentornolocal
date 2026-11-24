import { z } from 'zod';
import { nombreEjecutable } from '../../plataforma/sistema';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { claveValida, compararVersionesDesc } from '../comun';
import type { Huella } from '../huellas';
import {
  IndiceMalformado,
  leerIndice,
  leerIndiceJson,
  sumaDe,
  type ContextoFuente,
  type FuenteVersiones,
} from './tipos';

const BASE = 'https://nodejs.org/dist/';

const IndiceNode = z.array(
  z.object({
    version: z.string(),
    files: z.array(z.string()),
    lts: z.union([z.string(), z.literal(false)]),
  }),
);

/** Fin de una rama LTS (par): 30 de abril, tres años después de su salida (18 → 2025, 22 → 2027). */
export function finSoporteNode(rama: string): string | null {
  const n = Number(rama);
  return Number.isInteger(n) && n % 2 === 0 && n >= 4 ? `${2016 + n / 2}-04-30` : null;
}

const nombreZip = (version: string): string => `node-v${version}-win-x64`;

async function huellaNode(version: string, ctx: ContextoFuente): Promise<Huella | null> {
  const texto = await leerIndice(ctx, `${BASE}v${version}/SHASUMS256.txt`, {
    maxBytes: 256 * 1024,
  });
  const valor = sumaDe(texto, `${nombreZip(version)}.zip`);
  return valor ? { algoritmo: 'sha256', valor } : null;
}

/** Marca la huella de la última versión de cada rama elegida; el resto queda diferida. */
export async function huellasDeUltimas(
  versiones: VersionDisponible[],
  elegir: (v: VersionDisponible) => boolean,
  huella: (v: VersionDisponible) => Promise<Huella | null>,
): Promise<void> {
  const ultimas = new Map<string, VersionDisponible>();
  for (const v of [...versiones].sort((a, b) => compararVersionesDesc(a.version, b.version))) {
    if (!elegir(v) || ultimas.has(v.rama ?? '')) continue;
    ultimas.set(v.rama ?? '', v);
  }
  for (const v of ultimas.values()) {
    const h = await huella(v);
    if (!h) continue;
    v.huella = h;
    v.sha256 = h.algoritmo === 'sha256' ? h.valor : null;
    delete v.huellaDiferida;
  }
}

/**
 * Node: `nodejs.org/dist/index.json` (rama = mayor; `lts` marca las LTS) y la huella (sin firmar,
 * solo para mostrar; al instalar se vuelve a leer de `SHASUMS256.txt` con su firma, D10) de
 * `SHASUMS256.txt` de cada versión. Al listar se pide solo la de la última versión de cada rama
 * con soporte; el resto queda con `huellaDiferida` y se pide al instalar.
 */
export const fuenteNode: FuenteVersiones = {
  servicio: 'node',
  hostsIndice: ['nodejs.org'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const crudo = IndiceNode.safeParse(await leerIndiceJson(ctx, `${BASE}index.json`));
    if (!crudo.success) throw new IndiceMalformado('index.json de Node con forma rara');
    const entradas = crudo.data
      .filter((e) => e.files.includes('win-x64-zip'))
      .map((e) => ({ version: e.version.replace(/^v/, ''), lts: e.lts }))
      .filter((e) => claveValida(e.version));
    const estables = entradas.filter((e) => !e.version.includes('-'));
    const mayorActual = Math.max(0, ...estables.map((e) => Number(e.version.split('.')[0])));
    // Una rama es LTS si alguna de sus versiones lo es (las primeras salen antes de serlo).
    const ramasLts = new Set(
      entradas.filter((e) => e.lts !== false).map((e) => String(Number(e.version.split('.')[0]))),
    );
    const hoy = (ctx.ahora ?? new Date()).toISOString().slice(0, 10);
    const versiones = entradas.map((e): VersionDisponible => {
      const rama = String(Number(e.version.split('.')[0]));
      const fin = ramasLts.has(rama) ? finSoporteNode(rama) : null;
      const soporte: SoporteVersion = e.version.includes('-')
        ? 'preview'
        : ramasLts.has(rama)
          ? fin !== null && fin < hoy
            ? 'fin'
            : 'lts'
          : Number(rama) === mayorActual
            ? 'actual'
            : 'fin';
      return {
        servicio: 'node',
        version: e.version,
        rama,
        url: `${BASE}v${e.version}/${nombreZip(e.version)}.zip`,
        sha256: null,
        huella: null,
        huellaDiferida: true,
        formato: 'zip',
        subcarpeta: nombreZip(e.version),
        ejecutable: nombreEjecutable('node'),
        soporte,
        finSoporte: fin,
        origen: 'vivo',
      };
    });
    await huellasDeUltimas(
      versiones,
      (v) => v.soporte === 'lts' || v.soporte === 'actual',
      (v) => huellaNode(v.version, ctx),
    );
    return versiones;
  },
  completar(v, ctx) {
    return huellaNode(v.version, ctx);
  },
};

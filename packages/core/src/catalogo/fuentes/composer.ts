import { z } from 'zod';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { claveValida, compararVersionesDesc } from '../comun';
import {
  IndiceMalformado,
  leerIndice,
  leerIndiceJson,
  ramaMayorMenor,
  sumaDe,
  type FuenteVersiones,
} from './tipos';

const BASE = 'https://getcomposer.org';

const Entrada = z.object({
  path: z.string(),
  version: z.string(),
  lts: z.boolean().optional(),
  'maintenance-until': z.string().nullable().optional(),
});
const IndiceComposer = z.record(z.string(), z.array(Entrada));

/**
 * Composer: `getcomposer.org/versions` (estable, preview, 2.2 LTS, 1.x) y la huella de
 * `composer.phar.sha256sum` de cada versión listada (son pocas). Se ignoran los snapshots. Desde
 * 2.1, el instalador además verifica `composer.phar.asc` con el anillo fijado (D10).
 */
export const fuenteComposer: FuenteVersiones = {
  servicio: 'composer',
  hostsIndice: ['getcomposer.org'],
  async listar(ctx) {
    const crudo = IndiceComposer.safeParse(await leerIndiceJson(ctx, `${BASE}/versions`));
    if (!crudo.success) throw new IndiceMalformado('versions de Composer con forma rara');
    const hoy = (ctx.ahora ?? new Date()).toISOString().slice(0, 10);
    const estables = new Set(
      Object.entries(crudo.data)
        .filter(([k]) => k !== 'preview' && k !== 'snapshot')
        .flatMap(([, v]) => v.map((e) => e.version)),
    );
    const vistas = new Map<string, VersionDisponible>();
    for (const [canal, entradas] of Object.entries(crudo.data)) {
      if (canal === 'snapshot') continue;
      for (const e of entradas) {
        if (!claveValida(e.version) || vistas.has(e.version)) continue;
        // La ruta debe ser la del phar de esa misma versión: otra forma descarta el índice.
        if (e.path !== `/download/${e.version}/composer.phar`) {
          throw new IndiceMalformado(`Ruta inesperada en el índice de Composer: ${e.path}`);
        }
        const fin = e['maintenance-until'] ?? null;
        const soporte: SoporteVersion = !estables.has(e.version)
          ? 'preview'
          : fin !== null && fin < hoy
            ? 'fin'
            : e.lts
              ? 'lts'
              : 'actual';
        vistas.set(e.version, {
          servicio: 'composer',
          version: e.version,
          rama: ramaMayorMenor(e.version) ?? e.version,
          url: `${BASE}${e.path}`,
          sha256: null,
          huella: null,
          formato: 'archivo',
          ejecutable: 'composer.phar',
          soporte,
          finSoporte: fin,
          origen: 'vivo',
        });
      }
    }
    for (const v of vistas.values()) {
      const texto = await leerIndice(ctx, `${v.url}.sha256sum`, { maxBytes: 4096 });
      const valor = sumaDe(texto, 'composer.phar');
      if (!valor) throw new IndiceMalformado(`Suma de Composer ${v.version} mal formada`);
      v.huella = { algoritmo: 'sha256', valor };
      v.sha256 = valor;
    }
    return [...vistas.values()].sort((a, b) => compararVersionesDesc(a.version, b.version));
  },
};

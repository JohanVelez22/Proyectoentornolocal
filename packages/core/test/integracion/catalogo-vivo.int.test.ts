import { describe, expect, it } from 'vitest';
import type { ServicioInstalable } from '../../src/catalogo/catalogo';
import { huellaFuerte } from '../../src/catalogo/huellas';
import { FUENTES_VERSIONES, validarIndice } from '../../src/catalogo/vivo';

const SIN_HUELLA_PUBLICADA = new Set(['mysql', 'postgresql', 'nginx']);

/**
 * Lee los índices oficiales reales (solo lectura: nunca descarga binarios). Va aparte porque
 * necesita red y la API de GitHub sin token permite 60 consultas por hora: solo corre con
 * `PEL_INT_RED=1` (p. ej. `PEL_INT_RED=1 npm run test:win`).
 */
describe.skipIf(process.env.PEL_INT_RED !== '1')(
  'catálogo en vivo: índices oficiales reales',
  () => {
    for (const [servicio, fuente] of Object.entries(FUENTES_VERSIONES)) {
      it(`${servicio}: el índice real pasa la validación y la última tiene huella fuerte`, async () => {
        const crudas = await fuente!.listar({ f: fetch, idCatalogo: 'win-x64' });
        const versiones = validarIndice(servicio as ServicioInstalable, crudas);
        expect(versiones.length).toBeGreaterThan(0);
        const conSoporte = versiones.filter((v) => v.soporte !== 'preview' && v.soporte !== 'fin');
        expect(conSoporte.length).toBeGreaterThan(0);
        // MySQL, PostgreSQL (EDB) y Nginx no publican sumas: sin huella salvo la lista fija.
        if (!SIN_HUELLA_PUBLICADA.has(servicio)) {
          expect(conSoporte.some((v) => huellaFuerte(v.huella))).toBe(true);
        }
      }, 120_000);
    }
  },
);

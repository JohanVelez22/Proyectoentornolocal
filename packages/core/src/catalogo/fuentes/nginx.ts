import { nombreEjecutable } from '../../plataforma/sistema';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { compararVersionesDesc } from '../comun';
import { IndiceMalformado, leerIndice, ramaMayorMenor, type FuenteVersiones } from './tipos';

export const DESCARGAS_NGINX = 'https://nginx.org/en/download.html';
const BASE = 'https://nginx.org/download/';

/** Secciones de la página y el soporte que se les da. */
const SECCIONES: readonly { titulo: RegExp; soporte: SoporteVersion }[] = [
  { titulo: /<h4>\s*Mainline version\s*<\/h4>/i, soporte: 'actual' },
  { titulo: /<h4>\s*Stable version\s*<\/h4>/i, soporte: 'lts' },
  { titulo: /<h4>\s*Legacy versions\s*<\/h4>/i, soporte: 'fin' },
];

/**
 * Versiones de Windows de la página de descargas: mainline (`actual`), stable (`lts`) y legacy
 * (`fin`). Cada sección es el tramo hasta el siguiente título; dentro se toman los enlaces
 * `/download/nginx-<v>.zip`. Si falta mainline o stable, la página cambió de forma: índice
 * inválido.
 */
export function versionesDeNginx(html: string): { version: string; soporte: SoporteVersion }[] {
  const posiciones = SECCIONES.map((s) => {
    const m = s.titulo.exec(html);
    return { ...s, desde: m ? m.index + m[0].length : -1 };
  });
  if (posiciones[0]!.desde < 0 || posiciones[1]!.desde < 0) {
    throw new IndiceMalformado('La página de descargas de Nginx cambió de forma');
  }
  const res: { version: string; soporte: SoporteVersion }[] = [];
  const vistas = new Set<string>();
  for (const s of posiciones) {
    if (s.desde < 0) continue;
    const siguientes = posiciones.map((p) => p.desde).filter((d) => d > s.desde);
    const hasta = siguientes.length > 0 ? Math.min(...siguientes) : html.length;
    const tramo = html.slice(s.desde, hasta);
    for (const m of tramo.matchAll(/href="\/download\/nginx-(\d{1,3}\.\d{1,3}\.\d{1,3})\.zip"/g)) {
      const version = m[1]!;
      if (vistas.has(version)) continue;
      vistas.add(version);
      res.push({ version, soporte: s.soporte });
    }
  }
  if (!res.some((v) => v.soporte === 'actual') || !res.some((v) => v.soporte === 'lts')) {
    throw new IndiceMalformado('La página de descargas de Nginx no trae mainline y stable');
  }
  return res;
}

/**
 * Nginx: `nginx.org/en/download.html` (mainline, stable y legacy) → `nginx.org/download/
 * nginx-<v>.zip`. nginx.org solo publica firmas PGP, no sumas: la versión se lista sin huella y
 * el instalador verifica `nginx-<v>.zip.asc` con el anillo fijado (D10) antes de extraer; sin
 * firma válida no se instala.
 */
export const fuenteNginx: FuenteVersiones = {
  servicio: 'nginx',
  hostsIndice: ['nginx.org'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const html = await leerIndice(ctx, DESCARGAS_NGINX, { maxBytes: 1024 * 1024 });
    return versionesDeNginx(html)
      .map(({ version, soporte }): VersionDisponible => ({
        servicio: 'nginx',
        version,
        rama: ramaMayorMenor(version) ?? version,
        url: `${BASE}nginx-${version}.zip`,
        sha256: null,
        huella: null,
        formato: 'zip',
        subcarpeta: `nginx-${version}`,
        ejecutable: nombreEjecutable('nginx'),
        soporte,
        finSoporte: null,
        origen: 'vivo',
      }))
      .sort((a, b) => compararVersionesDesc(a.version, b.version));
  },
};

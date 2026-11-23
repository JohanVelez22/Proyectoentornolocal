import { nombreEjecutable } from '../../plataforma/sistema';
import type { SoporteVersion, VersionDisponible } from '../catalogo';
import { catalogo } from '../catalogo';
import { claveValida, compararVersionesDesc, urlIndice } from '../comun';
import type { Huella } from '../huellas';
import { leerAcotado, pedirConSaltos } from '../red';
import {
  PLAZO_INDICE_MS,
  ramaMayorMenor,
  sondear,
  type ContextoFuente,
  type FuenteVersiones,
} from './tipos';

const CDN = 'https://cdn.mysql.com/Downloads/';
export const PAGINA_MYSQL = 'https://dev.mysql.com/downloads/mysql/';

/** Sondeos `HEAD` como mucho por rama (incluido el de la última versión conocida). */
export const MAX_SONDEOS_MYSQL = 10;

interface RamaMysql {
  rama: string;
  /** Último parche conocido al armar el catálogo: de aquí se sondea si no hay otro más nuevo. */
  base: string;
  lts: boolean;
  /** Fin de soporte (AAAA-MM-DD) publicado por Oracle. */
  fin: string | null;
}

/**
 * Ramas que se sondean. MySQL no publica un índice legible por máquina (la página de descargas
 * responde "Technical Difficulties" a clientes automáticos), así que una rama nueva (p. ej. 9.x
 * LTS) solo entra por aquí o por la lista fija de `catalogo.json`.
 */
export const RAMAS_MYSQL: readonly RamaMysql[] = [
  { rama: '8.0', base: '8.0.44', lts: false, fin: '2026-04-30' },
  { rama: '8.4', base: '8.4.13', lts: true, fin: '2032-04-30' },
];

const nombreZip = (version: string): string => `mysql-${version}-winx64`;
const urlZip = (rama: string, version: string): string =>
  `${CDN}MySQL-${rama}/${nombreZip(version)}.zip`;

/** Siguiente parche ("8.4.13" → "8.4.14"); null si la versión no es `mayor.menor.parche`. */
function siguiente(version: string): string | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : null;
}

/**
 * MD5 del zip de Windows de esa versión en la página de descargas, solo si la página tiene la
 * forma esperada: el nombre exacto del zip y, cerca, `MD5: <code class="md5">…</code>` con 32
 * hex. Una sola huella distinta para ese archivo; cualquier otra cosa da null.
 */
export function md5DePaginaMysql(html: string, version: string): string | null {
  if (!claveValida(version)) return null;
  const archivo = `${nombreZip(version)}.zip`;
  const vistas = new Set<string>();
  let desde = 0;
  for (;;) {
    const i = html.indexOf(archivo, desde);
    if (i < 0) break;
    desde = i + archivo.length;
    const tramo = html.slice(desde, desde + 1500);
    const m = /MD5:\s*<code class="md5">([0-9a-f]{32})<\/code>/.exec(tramo);
    if (m) vistas.add(m[1]!);
  }
  return vistas.size === 1 ? [...vistas][0]! : null;
}

/** Página de descargas de MySQL; null si no responde o es la de "Technical Difficulties". */
async function paginaMysql(ctx: ContextoFuente): Promise<string | null> {
  try {
    const senales = [AbortSignal.timeout(PLAZO_INDICE_MS), ...(ctx.senal ? [ctx.senal] : [])];
    const res = await pedirConSaltos(
      ctx.f,
      PAGINA_MYSQL,
      { signal: AbortSignal.any(senales), headers: { 'user-agent': 'WolfCoreDev' } },
      urlIndice,
    );
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      return null;
    }
    const html = await leerAcotado(res, 2 * 1024 * 1024);
    return /Technical Difficulties/i.test(html) ? null : html;
  } catch {
    return null;
  }
}

function soporteDe(r: RamaMysql, hoy: string): SoporteVersion {
  if (r.fin !== null && r.fin < hoy) return 'fin';
  return r.lts ? 'lts' : 'actual';
}

/** Versiones de MySQL ya vistas en un sondeo anterior (caché), sin las de la lista fija. */
function conocidasDe(ctx: ContextoFuente): string[] {
  return [
    ...new Set(
      (ctx.previas ?? [])
        .filter((v) => v.servicio === 'mysql' && v.origen !== 'fija')
        .map((v) => v.version)
        .filter((v) => /^\d+\.\d+\.\d+$/.test(v)),
    ),
  ];
}

/** Ramas a sondear: las conocidas más las de la lista fija y la caché (la más nueva es la base). */
function ramas(ctx: ContextoFuente): RamaMysql[] {
  const res = new Map<string, RamaMysql>(RAMAS_MYSQL.map((r) => [r.rama, { ...r }]));
  const conocidas = [...catalogo.mysql.map((e) => e.version), ...conocidasDe(ctx)];
  for (const version of conocidas) {
    const rama = ramaMayorMenor(version);
    if (!rama || !/^\d+\.\d+\.\d+$/.test(version)) continue;
    const r = res.get(rama) ?? { rama, base: version, lts: false, fin: null };
    if (compararVersionesDesc(version, r.base) < 0) r.base = version;
    res.set(rama, r);
  }
  return [...res.values()];
}

/**
 * MySQL: por rama, `HEAD` del zip de Windows desde el último parche conocido (lista fija, caché o
 * `RAMAS_MYSQL`) hasta el primer 404, con un máximo de 10 sondeos. Huella: el MD5 de la página de
 * descargas si responde y tiene la forma esperada (débil); si no, ninguna (la lista fija aporta
 * su SHA-256 cuando tiene esa versión).
 */
export const fuenteMysql: FuenteVersiones = {
  servicio: 'mysql',
  hostsIndice: ['cdn.mysql.com', 'dev.mysql.com'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    const hoy = (ctx.ahora ?? new Date()).toISOString().slice(0, 10);
    const encontradas: { r: RamaMysql; version: string }[] = [];
    const conocidas = conocidasDe(ctx);
    for (const r of ramas(ctx)) {
      // Las anteriores a la base ya se vieron en un sondeo previo: no se vuelven a pedir.
      for (const v of conocidas) {
        if (ramaMayorMenor(v) === r.rama && compararVersionesDesc(v, r.base) > 0) {
          encontradas.push({ r, version: v });
        }
      }
      let version: string | null = r.base;
      for (let n = 0; version && n < MAX_SONDEOS_MYSQL; n++) {
        if (!(await sondear(ctx, urlZip(r.rama, version)))) break;
        encontradas.push({ r, version });
        version = siguiente(version);
      }
    }
    const pagina = encontradas.length > 0 ? await paginaMysql(ctx) : null;
    return encontradas
      .map(({ r, version }): VersionDisponible => {
        const md5 = pagina ? md5DePaginaMysql(pagina, version) : null;
        const huella: Huella | null = md5 ? { algoritmo: 'md5', valor: md5 } : null;
        return {
          servicio: 'mysql',
          version,
          rama: r.rama,
          url: urlZip(r.rama, version),
          sha256: null,
          huella,
          formato: 'zip',
          subcarpeta: nombreZip(version),
          ejecutable: `bin/${nombreEjecutable('mysqld')}`,
          soporte: soporteDe(r, hoy),
          finSoporte: r.fin,
          origen: 'vivo',
        };
      })
      .sort((a, b) => compararVersionesDesc(a.version, b.version));
  },
};

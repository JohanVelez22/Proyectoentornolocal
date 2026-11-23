import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/** Fixtures reales recortados de cada índice oficial. */
export function fixture(nombre: string): string {
  return readFileSync(path.join(AQUI, 'fixtures', 'catalogo', nombre), 'utf8');
}

export type Ruta =
  | string
  | Buffer
  | { estado?: number; cuerpo?: string | Buffer; ir?: string; encabezados?: Record<string, string> }
  | (() => Response | Promise<Response>);

export interface FetchFalso {
  f: typeof fetch;
  /** URLs pedidas, en orden. */
  pedidas: string[];
  /** `init` de cada pedido. */
  inits: (RequestInit | undefined)[];
}

/**
 * Servidor HTTP falso: cada URL exacta responde lo que diga `rutas`; el resto, 404. `ir`
 * responde una redirección 302 a esa URL. Sin red.
 */
export function fetchFalso(rutas: Record<string, Ruta>, sinRed = false): FetchFalso {
  const pedidas: string[] = [];
  const inits: (RequestInit | undefined)[] = [];
  const f = (async (entrada: string | URL, init?: RequestInit) => {
    const url = String(entrada);
    pedidas.push(url);
    inits.push(init);
    if (sinRed) throw new TypeError('fetch failed');
    const r = rutas[url];
    if (r === undefined) return new Response('no existe', { status: 404 });
    if (typeof r === 'function') return r();
    if (typeof r === 'string' || Buffer.isBuffer(r)) return new Response(r);
    if (r.ir) {
      return new Response(null, { status: r.estado ?? 302, headers: { location: r.ir } });
    }
    return new Response(r.cuerpo ?? '', {
      status: r.estado ?? 200,
      ...(r.encabezados ? { headers: r.encabezados } : {}),
    });
  }) as unknown as typeof fetch;
  return { f, pedidas, inits };
}

/** Rutas de todos los índices oficiales con sus fixtures. */
export function rutasOficiales(): Record<string, Ruta> {
  const rutas: Record<string, Ruta> = {
    // windows.php.net redirige su índice a downloads.php.net (como hoy).
    'https://windows.php.net/downloads/releases/releases.json': {
      ir: 'https://downloads.php.net/~windows/releases/releases.json',
    },
    'https://downloads.php.net/~windows/releases/releases.json': fixture('php-releases.json'),
    'https://nodejs.org/dist/index.json': fixture('node-index.json'),
    'https://api.nuget.org/v3-flatcontainer/python/index.json': fixture('nuget-index.json'),
    'https://getcomposer.org/versions': fixture('composer-versions.json'),
    'https://api.github.com/repos/axllent/mailpit/releases?per_page=10':
      fixture('github-mailpit.json'),
    'https://api.github.com/repos/redis-windows/redis-windows/releases?per_page=10':
      fixture('github-redis.json'),
  };
  for (const v of ['26.13.1', '24.22.3', '22.23.5', '20.20.2']) {
    rutas[`https://nodejs.org/dist/v${v}/SHASUMS256.txt`] = fixture(`node-shasums-${v}.txt`);
  }
  for (const v of ['3.12.10', '3.13.1', '3.14.10']) {
    const registro = fixture(`nuget-registro-${v}.json`);
    rutas[`https://api.nuget.org/v3/registration5-gz-semver2/python/${v}.json`] = registro;
    rutas[(JSON.parse(registro) as { catalogEntry: string }).catalogEntry] = fixture(
      `nuget-catalogo-${v}.json`,
    );
  }
  for (const v of ['2.11.2', '2.2.32', '1.10.28']) {
    rutas[`https://getcomposer.org/download/${v}/composer.phar.sha256sum`] = fixture(
      `composer-${v}.sha256sum`,
    );
  }
  return rutas;
}

/** Fecha fija de las pruebas (las ramas con fin de soporte se deciden con ella). */
export const HOY = new Date('2026-11-23T12:00:00Z');

import { readFileSync } from 'node:fs';
import { crc32 } from 'node:zlib';
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

/** Rutas de las fuentes de bases de datos y Nginx (Task 17) con sus fixtures. */
export function rutasBd(): Record<string, Ruta> {
  const rutas: Record<string, Ruta> = {};
  const existe = { estado: 200, cuerpo: '' };
  // MySQL: el CDN tiene hasta 8.4.15 y 8.0.46; la página de descargas no responde a clientes.
  for (const v of ['8.4.13', '8.4.14', '8.4.15', '8.0.44', '8.0.45', '8.0.46']) {
    const rama = v.split('.').slice(0, 2).join('.');
    rutas[`https://cdn.mysql.com/Downloads/MySQL-${rama}/mysql-${v}-winx64.zip`] = existe;
  }
  rutas['https://dev.mysql.com/downloads/mysql/'] = {
    estado: 403,
    cuerpo: fixture('mysql-dificultades.html'),
  };
  // MariaDB: ramas recortadas a 13.2 (Preview), 13.1 (RC), 12.3 y 11.4 (LTS).
  rutas['https://downloads.mariadb.org/rest-api/mariadb/'] = fixture('mariadb-ramas.json');
  for (const r of ['11.4', '12.3', '13.1', '13.2']) {
    rutas[`https://downloads.mariadb.org/rest-api/mariadb/${r}/`] = fixture(`mariadb-${r}.json`);
  }
  for (const v of ['11.4.14', '12.3.4', '13.1.1']) {
    rutas[`https://archive.mariadb.org/mariadb-${v}/winx64-packages/sha256sums.txt`] = fixture(
      `mariadb-sumas-${v}.txt`,
    );
  }
  // PostgreSQL: versions.json real y los sufijos de EDB que existen.
  rutas['https://www.postgresql.org/versions.json'] = fixture('postgresql-versions.json');
  for (const v of [
    '19.0-1',
    '18.7-1',
    '18.7-2',
    '17.12-1',
    '17.12-2',
    '16.16-1',
    '15.20-1',
    '14.25-1',
  ]) {
    rutas[`https://get.enterprisedb.com/postgresql/postgresql-${v}-windows-x64-binaries.zip`] =
      existe;
  }
  rutas['https://downloads.mongodb.org/full.json'] = fixture('mongodb-full.json');
  rutas['https://nginx.org/en/download.html'] = fixture('nginx-download.html');
  return rutas;
}

/** Zip mínimo (sin compresión) con los archivos dados, para probar instalaciones sin red. */
export function zipDe(archivos: Record<string, string>): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const n = Buffer.from(nombre);
    const d = Buffer.from(contenido);
    const crc = crc32(d);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0);
    l.writeUInt16LE(20, 4);
    l.writeUInt32LE(crc, 14);
    l.writeUInt32LE(d.length, 18);
    l.writeUInt32LE(d.length, 22);
    l.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(d.length, 20);
    c.writeUInt32LE(d.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    locales.push(l, n, d);
    centrales.push(c, n);
    offset += 30 + n.length + d.length;
  }
  const cd = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  const total = Object.keys(archivos).length;
  fin.writeUInt16LE(total, 8);
  fin.writeUInt16LE(total, 10);
  fin.writeUInt32LE(cd.length, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, cd, fin]);
}

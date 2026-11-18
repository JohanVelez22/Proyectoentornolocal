import { z } from 'zod';
import catalogoCrudo from './catalogo.json' with { type: 'json' };

export type ServicioInstalable =
  | 'nginx'
  | 'php'
  | 'cloudflared'
  | 'mysql'
  | 'mariadb'
  | 'postgresql'
  | 'redis'
  | 'mongodb'
  | 'mongosh'
  | 'mailpit'
  | 'ollama'
  | 'composer'
  | 'adminer'
  | 'pgvector-src'
  | 'node'
  | 'python';

/** Con 'archivo' la descarga se copia tal cual con el nombre de `ejecutable`. */
export type FormatoPaquete = 'zip' | 'exe' | 'archivo';

/** Ruta relativa, dentro del paquete, del binario principal que confirma la instalación. */
export const EJECUTABLE_POR_SERVICIO: Record<ServicioInstalable, string> = {
  nginx: 'nginx.exe',
  php: 'php-cgi.exe',
  cloudflared: 'cloudflared.exe',
  mysql: 'bin/mysqld.exe',
  mariadb: 'bin/mariadbd.exe',
  postgresql: 'pgsql/bin/postgres.exe',
  redis: 'redis-server.exe',
  mongodb: 'bin/mongod.exe',
  mongosh: 'bin/mongosh.exe',
  mailpit: 'mailpit.exe',
  ollama: 'ollama.exe',
  composer: 'composer.phar',
  adminer: 'adminer.php',
  'pgvector-src': 'Makefile.win',
  node: 'node.exe',
  python: 'python.exe',
};

export function ejecutableDe(servicio: string): string | undefined {
  return Object.hasOwn(EJECUTABLE_POR_SERVICIO, servicio)
    ? EJECUTABLE_POR_SERVICIO[servicio as ServicioInstalable]
    : undefined;
}

export interface VersionDisponible {
  servicio: ServicioInstalable;
  /** Versión completa (en PHP, el parche, p. ej. "8.4.27-1"). */
  version: string;
  /** Solo PHP: rama "mayor.menor" usada como clave de servicio y carpeta. */
  rama?: string;
  url: string;
  sha256: string | null;
  formato: FormatoPaquete;
  subcarpeta?: string;
  /** Binario principal relativo al paquete; si falta se usa el del servicio. */
  ejecutable?: string;
}

const HOSTS_PERMITIDOS = [
  'nginx.org',
  'github.com',
  'windows.php.net',
  'downloads.php.net',
  'dev.mysql.com',
  'cdn.mysql.com',
  'archive.mariadb.org',
  'get.enterprisedb.com',
  'fastdl.mongodb.org',
  'downloads.mongodb.com',
  'getcomposer.org',
  'nodejs.org',
  'api.nuget.org',
];

export function urlOficial(texto: string): boolean {
  try {
    const u = new URL(texto);
    return u.protocol === 'https:' && HOSTS_PERMITIDOS.includes(u.hostname);
  } catch {
    return false;
  }
}

const EntradaSchema = z.object({
  version: z.string().min(1),
  url: z.string().refine(urlOficial, 'La URL debe ser https y de un host oficial'),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  formato: z.enum(['zip', 'exe', 'archivo']),
  subcarpeta: z.string().optional(),
  ejecutable: z.string().min(1),
});

const Lista = z.array(EntradaSchema).default([]);

export const CatalogoSchema = z.object({
  nginx: z.array(EntradaSchema),
  cloudflared: z.array(EntradaSchema),
  mysql: Lista,
  mariadb: Lista,
  postgresql: Lista,
  redis: Lista,
  mongodb: Lista,
  mongosh: Lista,
  mailpit: Lista,
  ollama: Lista,
  composer: Lista,
  adminer: Lista,
  'pgvector-src': Lista,
  node: Lista,
  python: Lista,
});

export const catalogo = CatalogoSchema.parse(catalogoCrudo);

export const PHP_RELEASES_URL = 'https://windows.php.net/downloads/releases/releases.json';
const PHP_BASE = 'https://windows.php.net/downloads/releases/';
const VARIANTES_PHP = ['nts-vs17-x64', 'nts-vs16-x64'] as const;

const ZipPhpSchema = z.object({ zip: z.object({ path: z.string(), sha256: z.string() }) });

function ramaValida(rama: string): boolean {
  const m = /^(\d+)\.(\d+)$/.exec(rama);
  if (!m) return false;
  const mayor = Number(m[1]);
  const menor = Number(m[2]);
  return mayor > 8 || (mayor === 8 && menor >= 1);
}

function comparar(a: string, b: string): number {
  const [am = 0, an = 0] = a.split('.').map(Number);
  const [bm = 0, bn = 0] = b.split('.').map(Number);
  return bm - am || bn - an;
}

async function versionesPhp(f: typeof fetch): Promise<VersionDisponible[]> {
  const res = await f(PHP_RELEASES_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  const datos = z.record(z.string(), z.record(z.string(), z.unknown())).parse(json);
  const salida: VersionDisponible[] = [];
  for (const rama of Object.keys(datos).filter(ramaValida).sort(comparar)) {
    const entrada = datos[rama];
    if (!entrada || typeof entrada.version !== 'string') continue;
    for (const variante of VARIANTES_PHP) {
      const zip = ZipPhpSchema.safeParse(entrada[variante]);
      if (!zip.success) continue;
      const url = PHP_BASE + zip.data.zip.path;
      if (!urlOficial(url)) continue;
      salida.push({
        servicio: 'php',
        version: entrada.version,
        rama,
        url,
        sha256: zip.data.zip.sha256,
        formato: 'zip',
      });
      break;
    }
  }
  return salida;
}

export async function listarVersiones(
  servicio: ServicioInstalable,
  f: typeof fetch = fetch,
): Promise<VersionDisponible[]> {
  if (servicio === 'php') {
    try {
      return await versionesPhp(f);
    } catch (e) {
      const detalle = e instanceof Error ? e.message : String(e);
      throw new Error(`No se pudo consultar las versiones de ${servicio}: ${detalle}`);
    }
  }
  return catalogo[servicio].map((e) => ({ servicio, ...e }));
}

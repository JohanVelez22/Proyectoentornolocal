import { z } from 'zod';
import { nombreEjecutable } from '../plataforma/sistema';
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
  nginx: nombreEjecutable('nginx'),
  php: nombreEjecutable('php-cgi'),
  cloudflared: nombreEjecutable('cloudflared'),
  mysql: `bin/${nombreEjecutable('mysqld')}`,
  mariadb: `bin/${nombreEjecutable('mariadbd')}`,
  postgresql: `pgsql/bin/${nombreEjecutable('postgres')}`,
  redis: nombreEjecutable('redis-server'),
  mongodb: `bin/${nombreEjecutable('mongod')}`,
  mongosh: `bin/${nombreEjecutable('mongosh')}`,
  mailpit: nombreEjecutable('mailpit'),
  ollama: nombreEjecutable('ollama'),
  composer: 'composer.phar',
  adminer: 'adminer.php',
  'pgvector-src': 'Makefile.win',
  node: nombreEjecutable('node'),
  python: nombreEjecutable('python'),
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
  // Xdebug: DLL oficiales por rama y variante (catálogo de extensiones de PHP).
  'xdebug.org',
];

/**
 * Registro de npm para instalar agentes (`npm install -g` de su paquete oficial). Va aparte de
 * `HOSTS_PERMITIDOS`: el catálogo de binarios nunca descarga de él.
 */
export const HOST_REGISTRO_NPM = 'registry.npmjs.org';
export const REGISTRO_NPM_AGENTES = `https://${HOST_REGISTRO_NPM}/`;

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

/** Compilaciones de PHP para Windows: hilos (NTS/TS), Visual Studio (VS16/VS17) y arquitectura. */
export const VARIANTES_EXTENSION_PHP = [
  'nts-vs16-x64',
  'nts-vs17-x64',
  'ts-vs16-x64',
  'ts-vs17-x64',
] as const;
export type VarianteExtensionPhp = (typeof VARIANTES_EXTENSION_PHP)[number];

/** Nombre de una extensión de PHP (`xdebug`, `redis`…): minúsculas, dígitos y `_`. */
export const NOMBRE_EXTENSION_PHP = /^[a-z][a-z0-9_]{0,39}$/;

/**
 * Extensión de terceros para una rama y variante concretas: solo se instala desde aquí, de un
 * host permitido y con su SHA-256 fijado. `formato: 'archivo'` es la DLL tal cual; con `zip`,
 * `archivo` es la DLL dentro del paquete.
 */
export const ExtensionPhpSchema = z
  .object({
    nombre: z.string().regex(NOMBRE_EXTENSION_PHP),
    version: z.string().min(1),
    rama: z.string().regex(/^\d+\.\d+$/),
    variante: z.enum(VARIANTES_EXTENSION_PHP),
    url: z.string().refine(urlOficial, 'La URL debe ser https y de un host oficial'),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    formato: z.enum(['zip', 'archivo']),
    archivo: z
      .string()
      .regex(/^[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)*$/)
      .refine((a) => !a.split('/').includes('..'), 'Ruta no válida')
      .optional(),
    /** Se carga con `zend_extension` (Xdebug, OPcache). */
    zend: z.boolean().default(false),
  })
  .refine((e) => e.formato === 'archivo' || e.archivo !== undefined, {
    message: 'Un zip necesita la ruta de la DLL',
  });

export type ExtensionPhpCatalogo = z.infer<typeof ExtensionPhpSchema>;

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
  extensionesPhp: z.array(ExtensionPhpSchema).default([]),
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

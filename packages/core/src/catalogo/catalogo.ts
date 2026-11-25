import { z } from 'zod';
import { nombreEjecutable } from '../plataforma/sistema';
import catalogoCrudo from './catalogo.json' with { type: 'json' };
import { urlOficial } from './comun';
import { PHP_RELEASES_URL, versionesDeReleasesPhp } from './fuentes/php';
import type { Huella } from './huellas';

export { HOSTS_INDICE, HOSTS_PERMITIDOS, urlIndice, urlOficial } from './comun';
export type { AlgoritmoHuella, Huella } from './huellas';
export { PHP_RELEASES_URL } from './fuentes/php';

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
  | 'phpmyadmin'
  | 'pgvector-src'
  | 'node'
  | 'python'
  | 'java'
  | 'dotnet'
  | 'go'
  | 'rust'
  | 'bun'
  | 'deno'
  | 'zig'
  | 'kotlin'
  | 'dart';

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
  phpmyadmin: 'index.php',
  'pgvector-src': 'Makefile.win',
  node: nombreEjecutable('node'),
  python: nombreEjecutable('python'),
  java: `bin/${nombreEjecutable('java')}`,
  dotnet: nombreEjecutable('dotnet'),
  go: `bin/${nombreEjecutable('go')}`,
  // rustup-init: lo que se descarga; el resultado (toolchains) lo instala `InstaladorRust`.
  rust: nombreEjecutable('rustup-init'),
  bun: nombreEjecutable('bun'),
  deno: nombreEjecutable('deno'),
  zig: nombreEjecutable('zig'),
  // El compilador de Kotlin es un script `.bat` dentro de `kotlinc/bin`.
  kotlin: 'bin/kotlinc.bat',
  dart: `bin/${nombreEjecutable('dart')}`,
};

export function ejecutableDe(servicio: string): string | undefined {
  return Object.hasOwn(EJECUTABLE_POR_SERVICIO, servicio)
    ? EJECUTABLE_POR_SERVICIO[servicio as ServicioInstalable]
    : undefined;
}

/** Soporte de la rama según su fuente: las previews y las ramas sin soporte se ocultan por defecto. */
export type SoporteVersion = 'lts' | 'actual' | 'fin' | 'preview';
/** De dónde salió la versión: índice consultado ahora, caché de un índice o lista fija. */
export type OrigenCatalogo = 'vivo' | 'cache' | 'fija';

export interface VersionDisponible {
  servicio: ServicioInstalable;
  /** Versión completa (en PHP, el parche, p. ej. "8.4.27-1"). */
  version: string;
  /**
   * Rama ("8.4", "22", "3.13"). En PHP además es la clave de servicio y la carpeta; el catálogo
   * en vivo la da en todos los servicios.
   */
  rama?: string;
  url: string;
  /** Igual a `huella.valor` cuando la huella es SHA-256 (compatibilidad). */
  sha256: string | null;
  formato: FormatoPaquete;
  subcarpeta?: string;
  /** Binario principal relativo al paquete; si falta se usa el del servicio. */
  ejecutable?: string;
  /** Huella publicada por la fuente (si falta, cuenta `sha256`). */
  huella?: Huella | null;
  soporte?: SoporteVersion;
  /** Fin de soporte de la rama (AAAA-MM-DD) si la fuente lo publica. */
  finSoporte?: string | null;
  origen?: OrigenCatalogo;
  /** La huella no vino en el listado: se pide a la fuente al instalar (`CatalogoVivo.buscar`). */
  huellaDiferida?: boolean;
  /**
   * Fecha de publicación (AAAA-MM-DD) si la fuente la da (Node). Acota la fecha de la firma PGP:
   * una firma muy anterior a la publicación delata una fecha atrasada.
   */
  publicacion?: string;
}

/**
 * Registro de npm para instalar agentes (`npm install -g` de su paquete oficial). Va aparte de
 * `HOSTS_PERMITIDOS`: el catálogo de binarios nunca descarga de él.
 */
export const HOST_REGISTRO_NPM = 'registry.npmjs.org';
export const REGISTRO_NPM_AGENTES = `https://${HOST_REGISTRO_NPM}/`;

const EntradaSchema = z.object({
  version: z.string().min(1),
  url: z.string().refine(urlOficial, 'La URL debe ser https y de un host oficial'),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  formato: z.enum(['zip', 'exe', 'archivo']),
  subcarpeta: z.string().optional(),
  ejecutable: z.string().min(1),
});

const Lista = z.array(EntradaSchema).default([]);

/**
 * Entrada con huella SHA-256 o SHA-512 (una sola): .NET solo publica SHA-512. Es la forma de la
 * lista fija de Java, .NET y Go.
 */
const EntradaFuerteSchema = EntradaSchema.omit({ sha256: true })
  .extend({
    sha256: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .optional(),
    sha512: z
      .string()
      .regex(/^[0-9a-f]{128}$/)
      .optional(),
  })
  .refine((e) => (e.sha256 === undefined) !== (e.sha512 === undefined), {
    message: 'La entrada necesita una sola huella (sha256 o sha512)',
  });
const ListaFuerte = z.array(EntradaFuerteSchema).default([]);

/** Huella fuerte de una entrada de la lista fija. */
export function huellaDeEntrada(e: { sha256?: string; sha512?: string }): Huella {
  return e.sha512 !== undefined
    ? { algoritmo: 'sha512', valor: e.sha512 }
    : { algoritmo: 'sha256', valor: e.sha256 ?? '' };
}

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
  phpmyadmin: Lista,
  'pgvector-src': Lista,
  node: Lista,
  python: Lista,
  java: ListaFuerte,
  dotnet: ListaFuerte,
  go: ListaFuerte,
  rust: Lista,
  bun: ListaFuerte,
  deno: ListaFuerte,
  zig: ListaFuerte,
  kotlin: ListaFuerte,
  dart: ListaFuerte,
  extensionesPhp: z.array(ExtensionPhpSchema).default([]),
});

export const catalogo = CatalogoSchema.parse(catalogoCrudo);

async function versionesPhp(f: typeof fetch): Promise<VersionDisponible[]> {
  const res = await f(PHP_RELEASES_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  return versionesDeReleasesPhp(json).map((v) => ({
    servicio: 'php',
    version: v.version,
    rama: v.rama,
    url: v.url,
    sha256: v.sha256,
    formato: 'zip',
  }));
}

/**
 * Versiones de un servicio como en la Etapa B: PHP en línea (sin caché) y el resto de la lista
 * fija. El núcleo usa `CatalogoVivo`; esta función queda por compatibilidad.
 */
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
  const entradas = catalogo[servicio] as (Omit<VersionDisponible, 'servicio' | 'sha256'> & {
    sha256?: string;
    sha512?: string;
  })[];
  return entradas.map((e) => {
    const { sha256, sha512, ...resto } = e;
    return {
      servicio,
      ...resto,
      sha256: sha256 ?? null,
      ...(sha512 ? { huella: huellaDeEntrada(e) } : {}),
    };
  });
}

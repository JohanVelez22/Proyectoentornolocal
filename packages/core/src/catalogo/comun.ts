/**
 * Orígenes permitidos del catálogo: de dónde se leen índices y de dónde se descarga. Listas
 * explícitas, sin comodines ni subdominios: un host que no está aquí no se usa, ni siquiera como
 * salto de una redirección.
 */

/** Descargas de binarios (cada salto de una redirección también se revisa contra esta lista). */
export const HOSTS_PERMITIDOS: readonly string[] = [
  'nginx.org',
  'github.com',
  // Destinos de las redirecciones de las descargas de GitHub Releases.
  'release-assets.githubusercontent.com',
  'objects.githubusercontent.com',
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
  // Java (Temurin) baja de GitHub Releases (ya permitido); .NET, Go y Rust de sus sitios oficiales.
  'builds.dotnet.microsoft.com',
  'go.dev',
  // go.dev/dl/… redirige aquí.
  'dl.google.com',
  'static.rust-lang.org',
  // Zig (zip y firma) y Dart (bucket `dart-archive` de Google Cloud Storage; solo esa ruta).
  'ziglang.org',
  'storage.googleapis.com',
  // Xdebug: DLL oficiales por rama y variante (catálogo de extensiones de PHP).
  'xdebug.org',
];

/**
 * Índices de versiones (catálogo en vivo). `downloads.php.net` está porque `windows.php.net`
 * redirige ahí su `releases.json`. Los sondeos `HEAD` (MySQL, PostgreSQL) también van contra esta
 * lista.
 */
export const HOSTS_INDICE: readonly string[] = [
  'windows.php.net',
  'downloads.php.net',
  'nodejs.org',
  'api.nuget.org',
  'getcomposer.org',
  'api.github.com',
  // MySQL: sin índice; sondeo `HEAD` en el CDN y la página de descargas (MD5) si responde.
  'dev.mysql.com',
  'cdn.mysql.com',
  // MariaDB: REST de versiones y sumas del archivo.
  'downloads.mariadb.org',
  'archive.mariadb.org',
  // PostgreSQL: versions.json y sondeo `HEAD` de los binarios de EDB.
  'www.postgresql.org',
  'get.enterprisedb.com',
  'downloads.mongodb.org',
  'nginx.org',
  // Java (Temurin), .NET, Go y Rust: índices y sumas.
  'api.adoptium.net',
  'builds.dotnet.microsoft.com',
  'go.dev',
  'static.rust-lang.org',
  // Zig: index.json; Dart: listado JSON del bucket y sumas (solo las rutas de `RUTAS_ACOTADAS`).
  'ziglang.org',
  'storage.googleapis.com',
];

/**
 * Hosts compartidos por muchos dueños (un bucket cualquiera de Google Cloud Storage cuelga del
 * mismo host): además del host se exige que la ruta empiece por uno de estos prefijos. Se aplica
 * a cada salto de una redirección.
 */
export const RUTAS_ACOTADAS: Readonly<Record<string, readonly string[]>> = {
  'storage.googleapis.com': [
    '/dart-archive/channels/stable/release/',
    '/storage/v1/b/dart-archive/o',
  ],
};

/** Con `/` final, prefijo; sin él, la ruta exacta o una subruta (`/o` y `/o/…`, nunca `/otro`). */
function rutaDentro(ruta: string, prefijo: string): boolean {
  return prefijo.endsWith('/')
    ? ruta.startsWith(prefijo)
    : ruta === prefijo || ruta.startsWith(`${prefijo}/`);
}

function urlEn(texto: string, hosts: readonly string[]): boolean {
  try {
    const u = new URL(texto);
    const prefijos = Object.hasOwn(RUTAS_ACOTADAS, u.hostname)
      ? RUTAS_ACOTADAS[u.hostname]
      : undefined;
    // En un host compartido, nada de barras codificadas ni parámetros de ruta (`;`).
    if (prefijos !== undefined && /%2f|%5c|;/i.test(u.pathname)) return false;
    return (
      u.protocol === 'https:' &&
      hosts.includes(u.hostname) &&
      u.username === '' &&
      u.password === '' &&
      u.port === '' &&
      (prefijos === undefined || prefijos.some((p) => rutaDentro(u.pathname, p)))
    );
  } catch {
    return false;
  }
}

/** URL https de un host de descarga permitido. */
export function urlOficial(texto: string): boolean {
  return urlEn(texto, HOSTS_PERMITIDOS);
}

/** URL https de un host de índice permitido. */
export function urlIndice(texto: string): boolean {
  return urlEn(texto, HOSTS_INDICE);
}

/** Clave de carpeta: "8.4", "1.28.0", "2026.10.1"… nunca separadores ni "..". */
export const CLAVE_VALIDA = /^\d+\.\d+(\.[\w.-]+)?$/;

export function claveValida(c: unknown): c is string {
  return typeof c === 'string' && CLAVE_VALIDA.test(c) && !c.includes('..');
}

/** Rama de un servicio: "22" (Node), "8.4" (PHP), "3.13" (Python). */
export const RAMA_VALIDA = /^\d{1,4}(\.\d{1,4})?$/;

/** Ruta relativa sin unidad, raíz ni "..". */
export function rutaRelativaSegura(r: unknown): r is string {
  if (typeof r !== 'string' || r === '' || r.includes('\0')) return false;
  if (/^([a-zA-Z]:|[\\/])/.test(r)) return false;
  return !r.split(/[\\/]/).some((p) => p === '..' || p === '');
}

/** Orden de versiones de mayor a menor por sus números ("8.10.3" > "8.8.3"; previas al final). */
export function compararVersionesDesc(a: string, b: string): number {
  const partes = (v: string): number[] =>
    v
      .split(/[.-]/)
      .map((x) => (/^\d+$/.test(x) ? Number(x) : -1))
      .slice(0, 6);
  const pa = partes(a);
  const pb = partes(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    // Sin componente cuenta como estable: "1.2.0" va antes que "1.2.0-rc1".
    const x = pa[i] ?? Number.MAX_SAFE_INTEGER;
    const y = pb[i] ?? Number.MAX_SAFE_INTEGER;
    if (x !== y) return y - x;
  }
  return 0;
}

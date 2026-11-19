import type { Dirent } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pistasArchivos } from '../runtimes/runtimes';
import { TIPOS_CON_PHP, type TipoSitio } from '../tipos';
import { existe, leerTexto } from './archivos';
import { motorBdDe, type ServicioProyecto } from './config';

/** Lo que se sabe de una carpeta de proyecto; la receta por defecto (Task 3) parte de aquí. */
export interface Deteccion {
  tipo: TipoSitio;
  /** Rama de PHP de composer.json ("8.3"); null si no aplica o no se sabe. */
  php: string | null;
  /** Pista de Node tal cual (.nvmrc, .node-version o engines.node); null si no hay. */
  node: string | null;
  /** Pista de Python tal cual (.python-version o requires-python); null si no hay. */
  python: string | null;
  /** Bases de datos y servicios que pide `.env.example` (sin repetir, el motor primero). */
  servicios: ServicioProyecto[];
  /** El código usa pgvector (extensión `vector` de PostgreSQL). */
  pgvector: boolean;
  tieneComposer: boolean;
  tienePackageJson: boolean;
  /** Nombres de `scripts` de package.json, en su orden. */
  scriptsNpm: string[];
  tieneRequirements: boolean;
  tienePyproject: boolean;
  dominioSugerido: string;
  /** Variable del .env con la URL base del sitio (APP_URL, APP_BASE_URL) o null. */
  urlBaseVar: string | null;
  /**
   * Subcarpeta (relativa, con /) donde vive la aplicación cuando no está en la raíz (p. ej.
   * FastAPI en `admin/`); null si está en la raíz. Opcional para las detecciones guardadas.
   */
  subcarpeta?: string | null;
  /** Módulo ASGI para uvicorn (`app.main:app`, `main:app`…); null si no se encontró. */
  moduloAsgi?: string | null;
}

async function leerJson(ruta: string): Promise<Record<string, unknown> | null> {
  const t = await leerTexto(ruta);
  if (t === null) return null;
  try {
    const j: unknown = JSON.parse(t);
    return j !== null && typeof j === 'object' && !Array.isArray(j)
      ? (j as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Nombres de carpeta que no dicen de qué proyecto se trata: el dominio sale de la de arriba. */
const CARPETAS_GENERICAS = new Set([
  'admin',
  'api',
  'app',
  'backend',
  'server',
  'servidor',
  'src',
  'web',
  'www',
  'public',
  'frontend',
]);

export function sugerirDominio(carpeta: string): string {
  const tramos = carpeta.replace(/[\\/]+$/, '').split(/[\\/]/);
  let nombre = tramos.pop() ?? '';
  const arriba = tramos.at(-1);
  if (CARPETAS_GENERICAS.has(nombre.toLowerCase()) && arriba && !/^[a-z]:$/i.test(arriba)) {
    nombre = arriba;
  }
  const limpio = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${limpio || 'sitio'}.test`;
}

function versionPhp(composer: Record<string, unknown> | null): string | null {
  const req = (composer?.require as { php?: unknown } | undefined)?.php;
  const m = typeof req === 'string' ? /(\d+)\.(\d+)/.exec(req) : null;
  return m ? `${m[1]}.${m[2]}` : null;
}

const rama = (v: unknown): string | null => {
  const m = typeof v === 'string' ? /^\s*v?(\d+)\.(\d+)/.exec(v) : null;
  return m ? `${m[1]}.${m[2]}` : null;
};

/**
 * PHP de un proyecto sin una versión útil en `require.php` (CI3 trae el mínimo `>=5.3.7`):
 * `config.platform.php` de composer.json o el archivo `.php-version`.
 */
async function pistaPhp(
  carpeta: string,
  composer: Record<string, unknown> | null,
): Promise<string | null> {
  const plataforma = (composer?.config as { platform?: { php?: unknown } } | undefined)?.platform;
  return rama(plataforma?.php) ?? rama(await leerTexto(join(carpeta, '.php-version')));
}

const compararRamas = (a: string, b: string): number => {
  const [a1 = 0, a2 = 0] = a.split('.').map(Number);
  const [b1 = 0, b2 = 0] = b.split('.').map(Number);
  return a1 - b1 || a2 - b2;
};

/**
 * PHP que se propone: la pista del proyecto si hay; si no, en los tipos con PHP, la rama 8.x más
 * nueva entre las instaladas (null si no hay ninguna 8.x).
 */
export function phpPorDefecto(
  tipo: TipoSitio,
  pista: string | null,
  instaladas: readonly string[],
): string | null {
  if (pista) return pista;
  if (!TIPOS_CON_PHP.includes(tipo)) return null;
  const ochos = instaladas.filter((v) => /^8\.\d+$/.test(v)).sort(compararRamas);
  return ochos.at(-1) ?? null;
}

/* ───────────── .env.example ───────────── */

/** KEY=VALOR de un .env (sin comillas ni comentarios). Las claves de CI4 llevan puntos. */
export function leerVariablesEnv(texto: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const linea of texto.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*)$/.exec(linea);
    if (!m) continue;
    let v = m[2]!.trim();
    const q = v[0];
    if ((q === '"' || q === "'") && v.indexOf(q, 1) > 0) v = v.slice(1, v.indexOf(q, 1));
    else v = v.replace(/\s+#.*$/, '').trim();
    if (!vars.has(m[1]!)) vars.set(m[1]!, v);
  }
  return vars;
}

function motorDeTexto(v: string): ServicioProyecto | null {
  const t = v.trim().toLowerCase();
  if (/^(mysql|mysqli)$/.test(t)) return 'mysql';
  if (t === 'mariadb') return 'mariadb';
  if (/^(pgsql|postgres|postgresql|postgre)$/.test(t)) return 'postgresql';
  if (/^(mongodb|mongo)$/.test(t)) return 'mongodb';
  return null;
}

/** Motor del esquema de una URL de conexión (postgresql+psycopg://, mysql+pymysql://…). */
function motorDeUrl(url: string): ServicioProyecto | null {
  const m = /^([a-z][a-z0-9]*)(?:\+[a-z0-9]+)?(?:\+srv)?:\/\//i.exec(url.trim());
  return m ? motorDeTexto(m[1]!) : null;
}

/**
 * Sin driver declarado (CI3 con DB_HOST/DB_PORT/DB_NAME), el puerto estándar del .env decide.
 * Solo si hay alguna otra clave de base de datos (DB_HOST o DB_NAME/DB_DATABASE).
 */
function motorDePuerto(vars: Map<string, string>): ServicioProyecto | null {
  if (!['DB_HOST', 'DB_NAME', 'DB_DATABASE'].some((k) => vars.has(k))) return null;
  const puerto = (vars.get('DB_PORT') ?? '').trim();
  if (puerto === '5432') return 'postgresql';
  if (puerto === '3306') return 'mysql';
  if (puerto === '27017') return 'mongodb';
  return null;
}

/**
 * Driver de `application/config/database.php` de CodeIgniter 3:
 * `'dbdriver' => 'postgre'` o `$db['default']['dbdriver'] = getenv('DB_DRIVER') ?: 'mysqli';`.
 * Toma el primer nombre de motor entre comillas del valor.
 */
export function motorDeDatabasePhp(texto: string): ServicioProyecto | null {
  const sinComentarios = texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(\/\/|#).*$/gm, '');
  const asignacion = /['"]dbdriver['"]\s*\]?\s*(?:=>|=)\s*([^,;\n]+)/gi;
  for (let m = asignacion.exec(sinComentarios); m; m = asignacion.exec(sinComentarios)) {
    for (const q of m[1]!.matchAll(/['"]([a-z0-9_]+)['"]/gi)) {
      const motor = motorDeTexto(q[1]!);
      if (motor) return motor;
    }
  }
  return null;
}

const CLAVES_DRIVER = [
  'CACHE_STORE',
  'CACHE_DRIVER',
  'QUEUE_CONNECTION',
  'SESSION_DRIVER',
  'BROADCAST_CONNECTION',
  'BROADCAST_DRIVER',
];

/**
 * Servicios que pide el .env de ejemplo:
 * - base: DB_CONNECTION (Laravel), database.default.DBDriver (CI4) o el esquema de DATABASE_URL;
 * - redis: REDIS_HOST, si algún driver (caché, colas, sesión) usa redis o no se declara ninguno;
 * - mailpit: MAIL_HOST, si el correo sale por SMTP (MAIL_MAILER/MAIL_DRIVER smtp o sin declarar).
 */
export function serviciosDeEnv(vars: Map<string, string>): ServicioProyecto[] {
  const salida: ServicioProyecto[] = [];
  const motor =
    motorDeTexto(vars.get('DB_CONNECTION') ?? '') ??
    motorDeTexto(vars.get('database.default.DBDriver') ?? '') ??
    motorDeTexto(vars.get('DB_DRIVER') ?? '') ??
    motorDeTexto(vars.get('DB_DBDRIVER') ?? '') ??
    motorDeUrl(vars.get('DATABASE_URL') ?? '') ??
    motorDePuerto(vars);
  if (motor) salida.push(motor);

  if (vars.has('REDIS_HOST') || vars.has('REDIS_URL')) {
    const drivers = CLAVES_DRIVER.filter((k) => vars.has(k)).map((k) => vars.get(k)!.toLowerCase());
    if (drivers.length === 0 || drivers.includes('redis')) salida.push('redis');
  }
  if (vars.has('MAIL_HOST')) {
    const mailer = (vars.get('MAIL_MAILER') ?? vars.get('MAIL_DRIVER') ?? 'smtp').toLowerCase();
    if (mailer === 'smtp') salida.push('mailpit');
  }
  return salida;
}

/**
 * Variables de los archivos de ejemplo (CI4 trae `env`, con todo comentado) y del .env, en ese
 * orden de prioridad: cada clave la decide el primer archivo que la define.
 */
async function variablesEnv(carpeta: string): Promise<Map<string, string>> {
  const vars = new Map<string, string>();
  for (const n of ['.env.example', '.env.sample', '.env.dist', 'env', '.env']) {
    const t = await leerTexto(join(carpeta, n));
    if (t === null) continue;
    for (const [k, v] of leerVariablesEnv(t)) if (!vars.has(k)) vars.set(k, v);
  }
  return vars;
}

/* ───────────── pgvector ───────────── */

const OMITIR = new Set([
  'node_modules',
  'vendor',
  '.git',
  '.venv',
  'venv',
  'storage',
  '__pycache__',
  '.idea',
  '.vscode',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
]);
/** Rutas relativas (con /) que tampoco se recorren: compilados del proyecto. */
const OMITIR_RUTAS = new Set(['public/build']);
/** Niveles de carpetas bajo la raíz que se recorren (la raíz es el nivel 0). */
export const MAX_PROFUNDIDAD_ESCANEO = 6;
const EXTENSIONES_TEXTO =
  /\.(php|py|sql|js|mjs|cjs|ts|txt|toml|json|lock|ya?ml|cfg|ini|prisma|rb|go|env|example)$/i;
export const MAX_ARCHIVOS_ESCANEO = 2000;
const MAX_BYTES = 1024 * 1024;

const PATRONES_PGVECTOR = [
  /pgvector/i,
  /create\s+extension\s+(?:if\s+not\s+exists\s+)?["'`]?vector\b/i,
  /\bvector\s*\(\s*\d+\s*\)/i, // columna SQL: embedding vector(1536)
  /->\s*vector\s*\(/, // migración de Laravel: $table->vector('embedding', 1536)
];

/**
 * Busca pgvector en los archivos de texto del proyecto (≤ 1 MB), a lo ancho, sin entrar en
 * dependencias ni carpetas de datos y con un tope de archivos para no recorrer repos enormes.
 */
export async function usaPgvector(
  carpeta: string,
  maxArchivos = MAX_ARCHIVOS_ESCANEO,
): Promise<boolean> {
  const cola: { dir: string; rel: string; nivel: number }[] = [{ dir: carpeta, rel: '', nivel: 0 }];
  let vistos = 0;
  while (cola.length > 0) {
    const { dir, rel, nivel } = cola.shift()!;
    let entradas: Dirent[];
    try {
      entradas = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entradas) {
      const ruta = join(dir, e.name);
      if (e.isDirectory()) {
        const nombre = e.name.toLowerCase();
        const relHijo = rel ? `${rel}/${nombre}` : nombre;
        if (nivel < MAX_PROFUNDIDAD_ESCANEO && !OMITIR.has(nombre) && !OMITIR_RUTAS.has(relHijo)) {
          cola.push({ dir: ruta, rel: relHijo, nivel: nivel + 1 });
        }
        continue;
      }
      if (!e.isFile() || !EXTENSIONES_TEXTO.test(e.name)) continue;
      if (++vistos > maxArchivos) return false;
      try {
        if ((await stat(ruta)).size > MAX_BYTES) continue;
      } catch {
        continue;
      }
      const t = await leerTexto(ruta);
      if (t !== null && PATRONES_PGVECTOR.some((p) => p.test(t))) return true;
    }
  }
  return false;
}

/* ───────────── Detección ───────────── */

function dependencias(pkg: Record<string, unknown> | null): Set<string> {
  const salida = new Set<string>();
  for (const campo of ['dependencies', 'devDependencies']) {
    const d = pkg?.[campo];
    if (d && typeof d === 'object') for (const k of Object.keys(d)) salida.add(k);
  }
  return salida;
}

const FASTAPI = /(^|[^a-z0-9_-])fastapi([^a-z0-9_-]|$)/im;

/** ¿Pide FastAPI el requirements.txt o el pyproject.toml de la carpeta? */
async function pideFastapi(carpeta: string): Promise<boolean> {
  for (const n of ['requirements.txt', 'pyproject.toml']) {
    const t = await leerTexto(join(carpeta, n));
    if (t !== null && FASTAPI.test(t)) return true;
  }
  return false;
}

/** Archivos donde suele estar la aplicación ASGI, en orden de preferencia. */
const CANDIDATOS_ASGI = [
  'app/main.py',
  'main.py',
  'app.py',
  'src/main.py',
  'app/app.py',
  'api/main.py',
  'src/app/main.py',
];

/** `app = FastAPI(` o `api: FastAPI = fastapi.FastAPI(` al inicio de una línea. */
const VARIABLE_ASGI =
  /^([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[A-Za-z_][\w.]*\s*)?=\s*(?:[A-Za-z_][\w]*\.)*(?:FastAPI|Starlette)\s*\(/m;

/**
 * Módulo ASGI para uvicorn (`app.main:app`): el primer candidato que crea `FastAPI(...)`, con el
 * nombre de su variable; si ninguno la crea, el primero que exista con `:app`. null si no hay.
 */
export async function moduloAsgi(carpeta: string): Promise<string | null> {
  let primero: string | null = null;
  for (const rel of CANDIDATOS_ASGI) {
    const t = await leerTexto(join(carpeta, ...rel.split('/')));
    if (t === null) continue;
    const modulo = rel.replace(/\.py$/, '').split('/').join('.');
    const m = VARIABLE_ASGI.exec(t);
    if (m) return `${modulo}:${m[1]}`;
    primero ??= `${modulo}:app`;
  }
  return primero;
}

/** Subcarpetas (un nivel) que se miran cuando la raíz no dice qué es; tope para repos grandes. */
const MAX_SUBCARPETAS = 40;

/** Primera subcarpeta directa con un FastAPI (`admin/requirements.txt` con fastapi), o null. */
async function subcarpetaFastapi(carpeta: string): Promise<string | null> {
  let entradas: Dirent[];
  try {
    entradas = await readdir(carpeta, { withFileTypes: true });
  } catch {
    return null;
  }
  const dirs = entradas
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !OMITIR.has(e.name.toLowerCase()))
    .map((e) => e.name)
    .sort()
    .slice(0, MAX_SUBCARPETAS);
  for (const n of dirs) if (await pideFastapi(join(carpeta, n))) return n;
  return null;
}

interface TipoDetectado {
  tipo: TipoSitio;
  urlBaseVar: string | null;
  php: string | null;
  /** Motor de la base leído de la configuración del framework (CI3: database.php). */
  motor?: ServicioProyecto | null;
  subcarpeta?: string | null;
}

async function tipoDe(
  carpeta: string,
  composer: Record<string, unknown> | null,
  pkg: Record<string, unknown> | null,
): Promise<TipoDetectado> {
  const hay = (...p: string[]): Promise<boolean> => existe(join(carpeta, ...p));
  if (await hay('artisan'))
    return { tipo: 'laravel', urlBaseVar: 'APP_URL', php: versionPhp(composer) };
  if ((await hay('spark')) && (await hay('app', 'Config'))) {
    return { tipo: 'codeigniter4', urlBaseVar: null, php: versionPhp(composer) };
  }
  if ((await hay('application')) && (await hay('system', 'core', 'CodeIgniter.php'))) {
    const env = await leerTexto(join(carpeta, '.env'));
    const tiene = env !== null && /^\s*APP_BASE_URL\s*=/m.test(env);
    const database = await leerTexto(join(carpeta, 'application', 'config', 'database.php'));
    // composer.json de CI3 trae el mínimo (>=5.3.7), no la versión a usar: solo pistas explícitas.
    return {
      tipo: 'codeigniter3',
      urlBaseVar: tiene ? 'APP_BASE_URL' : null,
      php: await pistaPhp(carpeta, composer),
      motor: database === null ? null : motorDeDatabasePhp(database),
    };
  }
  if ((await hay('wp-config-sample.php')) || (await hay('wp-includes'))) {
    return { tipo: 'wordpress', urlBaseVar: null, php: null };
  }
  if (await pideFastapi(carpeta)) return { tipo: 'fastapi', urlBaseVar: null, php: null };
  const indexPhp = await hay('index.php');
  const deps = dependencias(pkg);
  if (
    !indexPhp &&
    !(await hay('composer.json')) &&
    ['vite', 'next', 'nuxt'].some((d) => deps.has(d))
  ) {
    return { tipo: 'node', urlBaseVar: null, php: null };
  }
  if (!indexPhp && !pkg) {
    // Repositorio con la app en una subcarpeta (p. ej. el FastAPI en admin/).
    const sub = await subcarpetaFastapi(carpeta);
    if (sub) return { tipo: 'fastapi', urlBaseVar: null, php: null, subcarpeta: sub };
  }
  return { tipo: indexPhp ? 'personalizado' : 'estatico', urlBaseVar: null, php: null };
}

/**
 * Detecta el tipo de proyecto, sus versiones, servicios y lo que necesita su receta.
 * `opciones.pgvector: false` se salta el escaneo del código (más barato, sin la pista de pgvector).
 * Si la aplicación está en una subcarpeta (`subcarpeta`), las pistas de Python, el .env y los
 * archivos de dependencias se leen de ahí.
 */
export async function detectarProyecto(
  carpeta: string,
  opciones: { pgvector?: boolean } = {},
): Promise<Deteccion> {
  const composer = await leerJson(join(carpeta, 'composer.json'));
  const pkg = await leerJson(join(carpeta, 'package.json'));
  const { tipo, urlBaseVar, php, motor, subcarpeta = null } = await tipoDe(carpeta, composer, pkg);
  const app = subcarpeta ? join(carpeta, subcarpeta) : carpeta;
  const pistas = await pistasArchivos(app);
  const servicios = serviciosDeEnv(await variablesEnv(app));
  if (motor && motorBdDe(servicios) === null) servicios.unshift(motor);
  // Escanear el código es lo caro: las sugerencias de la carpeta vigilada lo omiten.
  const pgvector = opciones.pgvector === false ? false : await usaPgvector(carpeta);
  if (pgvector && motorBdDe(servicios) === null) servicios.unshift('postgresql');
  const scripts = pkg?.scripts;
  return {
    tipo,
    php,
    node: pistas.node[0]?.valor ?? null,
    python: pistas.python[0]?.valor ?? null,
    servicios,
    pgvector,
    tieneComposer: await existe(join(carpeta, 'composer.json')),
    tienePackageJson: await existe(join(carpeta, 'package.json')),
    scriptsNpm: scripts && typeof scripts === 'object' ? Object.keys(scripts) : [],
    tieneRequirements: await existe(join(app, 'requirements.txt')),
    tienePyproject: await existe(join(app, 'pyproject.toml')),
    dominioSugerido: sugerirDominio(carpeta),
    urlBaseVar,
    subcarpeta,
    moduloAsgi: tipo === 'fastapi' ? await moduloAsgi(app) : null,
  };
}

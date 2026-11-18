import type { Dirent } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pistasArchivos } from '../runtimes/runtimes';
import type { TipoSitio } from '../tipos';
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

export function sugerirDominio(carpeta: string): string {
  const nombre =
    carpeta
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() ?? '';
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
    motorDeUrl(vars.get('DATABASE_URL') ?? '');
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

async function tipoDe(
  carpeta: string,
  composer: Record<string, unknown> | null,
  pkg: Record<string, unknown> | null,
): Promise<{ tipo: TipoSitio; urlBaseVar: string | null; php: string | null }> {
  const hay = (...p: string[]): Promise<boolean> => existe(join(carpeta, ...p));
  if (await hay('artisan'))
    return { tipo: 'laravel', urlBaseVar: 'APP_URL', php: versionPhp(composer) };
  if ((await hay('spark')) && (await hay('app', 'Config'))) {
    return { tipo: 'codeigniter4', urlBaseVar: null, php: versionPhp(composer) };
  }
  if ((await hay('application')) && (await hay('system', 'core', 'CodeIgniter.php'))) {
    const env = await leerTexto(join(carpeta, '.env'));
    const tiene = env !== null && /^\s*APP_BASE_URL\s*=/m.test(env);
    // composer.json de CI3 trae el mínimo (>=5.3.7), no la versión a usar
    return { tipo: 'codeigniter3', urlBaseVar: tiene ? 'APP_BASE_URL' : null, php: null };
  }
  if ((await hay('wp-config-sample.php')) || (await hay('wp-includes'))) {
    return { tipo: 'wordpress', urlBaseVar: null, php: null };
  }
  const req = await leerTexto(join(carpeta, 'requirements.txt'));
  const pyproject = await leerTexto(join(carpeta, 'pyproject.toml'));
  if ((req !== null && FASTAPI.test(req)) || (pyproject !== null && FASTAPI.test(pyproject))) {
    return { tipo: 'fastapi', urlBaseVar: null, php: null };
  }
  const indexPhp = await hay('index.php');
  const deps = dependencias(pkg);
  if (
    !indexPhp &&
    !(await hay('composer.json')) &&
    ['vite', 'next', 'nuxt'].some((d) => deps.has(d))
  ) {
    return { tipo: 'node', urlBaseVar: null, php: null };
  }
  return { tipo: indexPhp ? 'personalizado' : 'estatico', urlBaseVar: null, php: null };
}

/**
 * Detecta el tipo de proyecto, sus versiones, servicios y lo que necesita su receta.
 * `opciones.pgvector: false` se salta el escaneo del código (más barato, sin la pista de pgvector).
 */
export async function detectarProyecto(
  carpeta: string,
  opciones: { pgvector?: boolean } = {},
): Promise<Deteccion> {
  const composer = await leerJson(join(carpeta, 'composer.json'));
  const pkg = await leerJson(join(carpeta, 'package.json'));
  const { tipo, urlBaseVar, php } = await tipoDe(carpeta, composer, pkg);
  const pistas = await pistasArchivos(carpeta);
  const servicios = serviciosDeEnv(await variablesEnv(carpeta));
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
    tieneRequirements: await existe(join(carpeta, 'requirements.txt')),
    tienePyproject: await existe(join(carpeta, 'pyproject.toml')),
    dominioSugerido: sugerirDominio(carpeta),
    urlBaseVar,
  };
}

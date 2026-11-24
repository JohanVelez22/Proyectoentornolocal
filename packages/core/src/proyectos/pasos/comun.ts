import path from 'node:path';
import type { BasesDeDatos, DatosConexion, MotorBd } from '../../bd/basesDeDatos';
import { validarNombreBd } from '../../bd/clienteMysql';
import type { OpcionesRestaurar, ResultadoRestaurar } from '../../bd/respaldos';
import { MENSAJE_CANCELADO } from '../../plataforma/lanzar';
import type { Lanzador } from '../../plataforma/tipos';
import type { Rutas } from '../../rutas';
import { TIPOS_RUNTIME, type Runtimes, type VersionesRuntime } from '../../runtimes/runtimes';
import type { Sitio } from '../../tipos';
import { existe } from '../archivos';
import { motorBdDe, MOTORES_BD } from '../config';
import { detectarProyecto, type Deteccion } from '../detectar';
import type { ContextoPaso } from '../pasos';
import { sanear } from '../recetas';
import { nombreEjecutable } from '../../plataforma/sistema';

/** Lo que necesitan los pasos reales. Todo se inyecta para poder probarlos sin procesos reales. */
export interface DepsPasos {
  rutas: Rutas;
  /** Lanza los comandos de los pasos (sin shell, en streaming y con `senal`). */
  lanzar: Lanzador;
  /** Node y Python del proyecto. */
  runtimes: Pick<Runtimes, 'paraProyecto' | 'carpetasPath' | 'rutaBin'> &
    Partial<Pick<Runtimes, 'variables'>>;
  /**
   * php.exe y php.ini de la rama pedida (la del sitio). Con null, o si esa rama no está
   * instalada, los del PHP por defecto. Lanza un error en español si no hay PHP.
   */
  php: (rama: string | null) => Promise<{ exe: string; ini: string }>;
  /** composer.phar instalado, o null. */
  composerPhar: () => Promise<string | null>;
  bd: Pick<BasesDeDatos, 'conexion' | 'listar' | 'crear' | 'tieneTablas' | 'activarVector'>;
  /** `Respaldos.restaurar`. */
  restaurar: (
    motor: MotorBd,
    archivo: string,
    base: string,
    opts?: OpcionesRestaurar,
  ) => Promise<ResultadoRestaurar>;
  /** Puerto SMTP de Mailpit si está instalado; null si no. */
  mailpit: () => Promise<{ puerto: number } | null>;
  /** `Nucleo.guardarSitio` (edita el sitio `id` y aplica). */
  guardarSitio: (datos: Omit<Sitio, 'id'>, id: string) => Promise<unknown>;
  /** El sitio tal como está guardado ahora (si falta, se usa el del contexto). */
  leerSitio?: (id: string) => Promise<Sitio | undefined>;
  /**
   * Un puerto libre que no esté en `reservados` (los de los servicios y los de otros procesos).
   * Si `preferido` sigue libre, ese.
   */
  puertoLibre: (o: {
    reservados: number[];
    preferido?: number | null;
    /** Sitio que pide el puerto: sus propios puertos no cuentan como de otro proyecto. */
    sitioId?: string;
  }) => Promise<number>;
  /** Detección de la carpeta (por defecto `detectarProyecto`). */
  detectar?: (carpeta: string) => Promise<Deteccion>;
  /** Entorno base de los procesos (por defecto `process.env`). */
  entorno?: NodeJS.ProcessEnv;
}

/** Lanza "Cancelado" si la receta se canceló. */
export function comprobarSenal(ctx: ContextoPaso): void {
  if (ctx.senal.aborted) throw new Error(MENSAJE_CANCELADO);
}

/** Argumentos del paso (nunca undefined). */
export const argsDe = (ctx: ContextoPaso): Record<string, unknown> => ctx.paso.args ?? {};

export const texto = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v : undefined;

/**
 * Nombre de la base del proyecto: `args.base` o el dominio sin `.test`, en minúsculas y con `_`
 * (válido en MySQL, MariaDB, PostgreSQL y MongoDB). Si empieza por un número, lleva `bd_`.
 */
export function nombreBase(
  sitio: Pick<Sitio, 'dominio'>,
  args: Record<string, unknown> = {},
): string {
  const dado = texto(args.base);
  if (dado) {
    validarNombreBd(dado);
    return dado;
  }
  let n = sitio.dominio
    .toLowerCase()
    .replace(/\.test$/, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (n === '') n = 'proyecto';
  if (/^\d/.test(n)) n = `bd_${n}`;
  return n.slice(0, 63);
}

/** Motor de `args.motor` o, si no, el que pide el proyecto según su detección. */
export async function motorDe(
  ctx: ContextoPaso,
  d: DepsPasos,
  det?: Deteccion,
): Promise<MotorBd | null> {
  const dado = argsDe(ctx).motor;
  if (dado !== undefined) {
    if (typeof dado !== 'string' || !(MOTORES_BD as readonly string[]).includes(dado)) {
      throw new Error(`Motor de base de datos no válido: ${String(dado)}`);
    }
    return dado as MotorBd;
  }
  const deteccion = det ?? (await (d.detectar ?? detectarProyecto)(ctx.carpeta));
  return motorBdDe(deteccion.servicios);
}

export type { DatosConexion, MotorBd };

/* ───────────── Entorno y lanzamiento ───────────── */

export interface Herramientas {
  env: Record<string, string>;
  versiones: VersionesRuntime;
  php?: { exe: string; ini: string };
}

const venvScripts = (carpeta: string): string => path.join(carpeta, '.venv', 'Scripts');
export const pythonVenv = (carpeta: string): string =>
  path.join(venvScripts(carpeta), nombreEjecutable('python'));

/** Lo que hace falta para armar el entorno de un proyecto (pasos de receta y procesos). */
export type DepsEntorno = Pick<DepsPasos, 'rutas' | 'runtimes' | 'php' | 'entorno'>;

export interface EntornoProyecto extends Herramientas {
  /** Solo las variables que se agregan o cambian respecto del entorno base (PATH, PHPRC…). */
  cambios: Record<string, string>;
  /** Avisos de los runtimes (versiones pedidas que no están instaladas, rangos…), sin sanear. */
  avisos: string[];
}

/**
 * Entorno de un proyecto: PATH = [PHP] + [.venv\Scripts] + [Node, node_modules\.bin, Python,
 * Scripts] + tools\bin + PATH actual (respeta el nombre `Path`). El Scripts del .venv va antes
 * que el Python del runtime. Lo usan los pasos de receta y los procesos supervisados.
 */
export async function entornoProyecto(
  sitio: Sitio,
  carpeta: string,
  d: DepsEntorno,
  o: { php?: boolean; carpetaVenv?: string } = {},
): Promise<EntornoProyecto> {
  const base = d.entorno ?? process.env;
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) if (v !== undefined) env[k] = v;
  const clave = Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'Path';
  const cambios: Record<string, string> = {};
  const nuevo: string[] = [];
  let php: Herramientas['php'];
  if (o.php) {
    php = await d.php(sitio.php ?? null);
    nuevo.push(path.dirname(php.exe));
    cambios.PHPRC = path.dirname(php.ini);
    cambios.WOLFCORE_PHP = php.exe;
    cambios.WOLFCORE_PHPINI = php.ini;
  }
  // El .venv puede estar en la carpeta de trabajo del proceso (FastAPI en admin/).
  let conVenv = false;
  for (const dir of [...new Set([o.carpetaVenv ?? carpeta, carpeta])]) {
    if (await existe(venvScripts(dir))) {
      nuevo.push(venvScripts(dir));
      cambios.VIRTUAL_ENV = path.join(dir, '.venv');
      conVenv = true;
      break;
    }
  }
  const rt = await d.runtimes.paraProyecto(sitio);
  if (conVenv || rt.python || sitio.tipo === 'fastapi') {
    // Python en Windows escribe en la página ANSI (cp1252) si no se le pide UTF-8: el log
    // mostraría "migraci\uFFFDn". Con esto stdout/stderr salen en UTF-8.
    cambios.PYTHONUTF8 = '1';
    cambios.PYTHONIOENCODING = 'utf-8';
  }
  const versiones: VersionesRuntime = {};
  for (const tipo of TIPOS_RUNTIME) {
    const v = rt[tipo];
    if (v) versiones[tipo] = v;
  }
  nuevo.push(...d.runtimes.carpetasPath(versiones));
  // JAVA_HOME, DOTNET_ROOT, GOROOT/GOPATH, RUSTUP_HOME/CARGO_HOME de lo que usa el proyecto.
  Object.assign(cambios, d.runtimes.variables?.(versiones) ?? {});
  nuevo.push(d.rutas.herramientas('bin'));
  if (env[clave]) nuevo.push(env[clave]);
  cambios[clave] = nuevo.join(';');
  Object.assign(env, cambios);
  return { env, cambios, versiones, avisos: [...rt.avisos], ...(php ? { php } : {}) };
}

/** Entorno de un paso (ver `entornoProyecto`). Los avisos de los runtimes salen como líneas. */
export async function herramientas(
  ctx: ContextoPaso,
  d: DepsPasos,
  o: { php?: boolean } = {},
): Promise<Herramientas> {
  const r = await entornoProyecto(ctx.sitio, ctx.carpeta, d, o);
  for (const a of r.avisos) ctx.linea(sanear(`Aviso: ${a}`));
  return { env: r.env, versiones: r.versiones, ...(r.php ? { php: r.php } : {}) };
}

/** node.exe del proyecto; error claro si no hay Node. */
export function nodeExe(d: Pick<DepsPasos, 'runtimes'>, h: Herramientas): string {
  if (!h.versiones.node) {
    throw new Error('No hay Node instalado para este proyecto: instálelo desde Servicios.');
  }
  return path.join(d.runtimes.rutaBin('node', h.versiones.node), nombreEjecutable('node'));
}

/** Script de npm (o npx) del Node del proyecto: se lanza con node.exe, sin shell. */
export function cliNpm(
  d: Pick<DepsPasos, 'runtimes'>,
  h: Herramientas,
  cual: 'npm' | 'npx',
): string {
  return path.join(
    d.runtimes.rutaBin('node', h.versiones.node!),
    'node_modules',
    'npm',
    'bin',
    `${cual}-cli.js`,
  );
}

/** python.exe del runtime del proyecto; error claro si no hay Python. */
export function pythonExe(d: Pick<DepsPasos, 'runtimes'>, h: Herramientas): string {
  if (!h.versiones.python) {
    throw new Error('No hay Python instalado para este proyecto: instálelo desde Servicios.');
  }
  return path.join(d.runtimes.rutaBin('python', h.versiones.python), nombreEjecutable('python'));
}

/** Nombre de un programa para resolverlo: en minúsculas y sin `.exe`. */
export const nombrePrograma = (programa: string): string =>
  programa.toLowerCase().replace(/\.exe$/, '');

/** ¿El programa necesita el PHP del proyecto en el entorno? */
export const usaPhp = (programa: string): boolean => nombrePrograma(programa) === 'php';

/**
 * Resuelve el programa de un comando (sin shell): `php`, `node`, `npm`, `npx` y `python` pasan a
 * los del proyecto (python: el del .venv si hay). Rechaza .cmd y .bat, que necesitan una consola.
 * `h` debe traer PHP si `usaPhp(programa)`.
 */
export async function resolverPrograma(
  comando: string[],
  carpeta: string,
  d: Pick<DepsPasos, 'runtimes'>,
  h: Herramientas,
): Promise<{ cmd: string; args: string[] }> {
  const [programa, ...resto] = comando;
  if (/\.(cmd|bat)$/i.test(programa!)) {
    throw new Error(
      'Los archivos .cmd y .bat necesitan una consola y aquí no se usa shell: use el programa directamente.',
    );
  }
  const nombre = nombrePrograma(programa!);
  switch (nombre) {
    case 'php':
      return { cmd: h.php!.exe, args: ['-c', h.php!.ini, ...resto] };
    case 'node':
      return { cmd: nodeExe(d, h), args: resto };
    case 'npm':
    case 'npx':
      return { cmd: nodeExe(d, h), args: [cliNpm(d, h, nombre), ...resto] };
    case 'python':
      return {
        cmd: (await existe(pythonVenv(carpeta))) ? pythonVenv(carpeta) : pythonExe(d, h),
        args: resto,
      };
    default:
      return { cmd: programa!, args: resto };
  }
}

/**
 * Lanza un comando del paso sin shell, en la carpeta del proyecto y con la señal de la receta.
 * Cada línea de salida va (saneada) al registro. Falla si se canceló o si el código no es 0.
 */
export async function lanzar(
  ctx: ContextoPaso,
  d: DepsPasos,
  h: Herramientas,
  cmd: string,
  args: string[],
  descripcion: string,
): Promise<void> {
  comprobarSenal(ctx);
  ctx.linea(sanear(`> ${descripcion}`));
  const r = await d.lanzar(cmd, args, {
    cwd: ctx.carpeta,
    env: h.env,
    senal: ctx.senal,
    alLinea: (l) => ctx.linea(sanear(l)),
  });
  comprobarSenal(ctx);
  if (r.codigo !== 0) throw new Error(`${descripcion} terminó con el código ${r.codigo}`);
}

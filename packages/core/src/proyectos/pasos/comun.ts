import path from 'node:path';
import type { BasesDeDatos, DatosConexion, MotorBd } from '../../bd/basesDeDatos';
import { validarNombreBd } from '../../bd/clienteMysql';
import type { OpcionesRestaurar, ResultadoRestaurar } from '../../bd/respaldos';
import { MENSAJE_CANCELADO } from '../../plataforma/lanzar';
import type { Lanzador } from '../../plataforma/tipos';
import type { Rutas } from '../../rutas';
import type { Runtimes, VersionesRuntime } from '../../runtimes/runtimes';
import type { Sitio } from '../../tipos';
import { existe } from '../archivos';
import { motorBdDe, MOTORES_BD } from '../config';
import { detectarProyecto, type Deteccion } from '../detectar';
import type { ContextoPaso } from '../pasos';
import { sanear } from '../recetas';

/** Lo que necesitan los pasos reales. Todo se inyecta para poder probarlos sin procesos reales. */
export interface DepsPasos {
  rutas: Rutas;
  /** Lanza los comandos de los pasos (sin shell, en streaming y con `senal`). */
  lanzar: Lanzador;
  /** Node y Python del proyecto. */
  runtimes: Pick<Runtimes, 'paraProyecto' | 'carpetasPath' | 'rutaBin'>;
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
  puertoLibre: (o: { reservados: number[]; preferido?: number | null }) => Promise<number>;
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
  path.join(venvScripts(carpeta), 'python.exe');

/**
 * Entorno de un paso: PATH = [PHP] + [.venv\Scripts] + [Node, node_modules\.bin, Python,
 * Scripts] + tools\bin + PATH actual (respeta el nombre `Path`). El Scripts del .venv va antes
 * que el Python del runtime. Los avisos de los runtimes salen como líneas del paso.
 */
export async function herramientas(
  ctx: ContextoPaso,
  d: DepsPasos,
  o: { php?: boolean } = {},
): Promise<Herramientas> {
  const base = d.entorno ?? process.env;
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) if (v !== undefined) env[k] = v;
  const clave = Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'Path';
  const nuevo: string[] = [];
  let php: Herramientas['php'];
  if (o.php) {
    php = await d.php(ctx.sitio.php ?? null);
    nuevo.push(path.dirname(php.exe));
    env.PHPRC = path.dirname(php.ini);
    env.WOLFCORE_PHP = php.exe;
    env.WOLFCORE_PHPINI = php.ini;
  }
  if (await existe(venvScripts(ctx.carpeta))) {
    nuevo.push(venvScripts(ctx.carpeta));
    env.VIRTUAL_ENV = path.join(ctx.carpeta, '.venv');
  }
  const rt = await d.runtimes.paraProyecto(ctx.sitio);
  for (const a of rt.avisos) ctx.linea(sanear(`Aviso: ${a}`));
  const versiones: VersionesRuntime = {};
  if (rt.node) versiones.node = rt.node;
  if (rt.python) versiones.python = rt.python;
  nuevo.push(...d.runtimes.carpetasPath(versiones));
  nuevo.push(d.rutas.herramientas('bin'));
  if (env[clave]) nuevo.push(env[clave]);
  env[clave] = nuevo.join(';');
  return { env, versiones, ...(php ? { php } : {}) };
}

/** node.exe del proyecto; error claro si no hay Node. */
export function nodeExe(d: DepsPasos, h: Herramientas): string {
  if (!h.versiones.node) {
    throw new Error('No hay Node instalado para este proyecto: instálelo desde Servicios.');
  }
  return path.join(d.runtimes.rutaBin('node', h.versiones.node), 'node.exe');
}

/** Script de npm (o npx) del Node del proyecto: se lanza con node.exe, sin shell. */
export function cliNpm(d: DepsPasos, h: Herramientas, cual: 'npm' | 'npx'): string {
  return path.join(
    d.runtimes.rutaBin('node', h.versiones.node!),
    'node_modules',
    'npm',
    'bin',
    `${cual}-cli.js`,
  );
}

/** python.exe del runtime del proyecto; error claro si no hay Python. */
export function pythonExe(d: DepsPasos, h: Herramientas): string {
  if (!h.versiones.python) {
    throw new Error('No hay Python instalado para este proyecto: instálelo desde Servicios.');
  }
  return path.join(d.runtimes.rutaBin('python', h.versiones.python), 'python.exe');
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

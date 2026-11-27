import type { IdInstancia, TipoSitio } from '../tipos';

export type MotorBd = 'mysql' | 'mariadb' | 'postgresql' | 'mongodb';

export interface DatosConexion {
  host: '127.0.0.1';
  puerto: number;
  usuario: string;
  /** null si el motor no tiene autenticación (MongoDB). */
  clave: string | null;
  /** Instancia a la que apunta (solo con instancias configuradas). */
  instancia?: IdInstancia;
}

/**
 * Lo que la interfaz recibe de los datos de conexión: todo menos la clave. La clave solo sale por
 * las rutas «revelar» (un clic en «Mostrar» o «Copiar»), igual que el valor de una variable .env.
 */
export type DatosConexionVista = Omit<DatosConexion, 'clave'> & { tieneClave: boolean };

export function vistaConexion(d: DatosConexion): DatosConexionVista {
  const { clave, ...resto } = d;
  return { ...resto, tieneClave: clave !== null };
}

/** En lugar de la clave en el bloque `.env` que ve la interfaz (el bloque completo se pide aparte). */
export const MASCARA_CLAVE = '************';

const CI4 = /^\s*#?\s*database\.default\.\w+\s*=/m;
const DB_LARAVEL = /^[ \t]*DB_[A-Z_]+[ \t]*=/m;
const CON_LARAVEL = /^[ \t]*DB_CONNECTION[ \t]*=/m;

const SIMPLE = /^[A-Za-z0-9_.:/@-]*$/;

/**
 * Cómo lee el proyecto los valores entre comillas:
 * - `dotenv`: vlucas/phpdotenv (Laravel y genérico). Comillas simples = literal; dentro de
 *   comillas dobles decodifica escapes y rechaza los que no conoce (p. ej. `\P`).
 * - `ci4`: DotEnv de CodeIgniter 4. En ambas comillas decodifica `\\` y la comilla escapada.
 * - `literal`: lector propio de CodeIgniter 3 (index.php de los proyectos WolfCore): quita las
 *   comillas de los extremos con `trim($v, "\"'")` y no decodifica ningún escape.
 * - `python`: python-dotenv (FastAPI, Django). No conoce `\$`: entre comillas dobles lo deja tal
 *   cual. Se escribe entre comillas simples (literal, sin interpolar `${…}`) y, si el valor trae
 *   `'`, entre dobles escapando solo `\\` y `"`.
 */
export type EstiloEnv = 'dotenv' | 'ci4' | 'literal' | 'python';

const COMILLA_EN_EXTREMO = /^["']|["']$/;

/**
 * Valor listo para un .env: tal cual si es simple; si no, entre comillas SIMPLES y sin
 * escapes (una ruta como `C:\Program Files\x` se lee igual en todos los lectores). Solo si el
 * valor contiene `'` van comillas dobles, escapadas según el lector del proyecto.
 */
export function valorEnv(v: string, estilo: EstiloEnv = 'dotenv'): string {
  if (SIMPLE.test(v)) return v;
  if (estilo === 'literal' && COMILLA_EN_EXTREMO.test(v)) {
    // trim($v, "\"'") se comería esas comillas: no hay forma de escribirlo sin perderlas.
    throw new Error(
      'El valor empieza o termina con comillas y el .env de este proyecto no puede guardarlo así.',
    );
  }
  if (estilo === 'ci4' && /\$\{[A-Za-z0-9_.]+\}/.test(v)) {
    // DotEnv de CodeIgniter 4 reemplaza ${NOMBRE} por otra variable incluso entre comillas
    // simples y no tiene escape para evitarlo.
    throw new Error(
      'El valor contiene ${…} y el .env de CodeIgniter 4 lo reemplazaría por otra variable.',
    );
  }
  if (estilo === 'ci4') {
    // CodeIgniter 4 decodifica \\ también entre comillas simples: se duplican siempre.
    if (!v.includes("'")) return `'${v.replace(/\\/g, '\\\\')}'`;
    return `"${v.replace(/[\\"]/g, '\\$&')}"`;
  }
  if (!v.includes("'")) return `'${v}'`;
  if (estilo === 'literal') return `"${v}"`;
  if (estilo === 'python') return `"${v.replace(/[\\"]/g, '\\$&')}"`;
  return `"${v.replace(/[\\"$]/g, '\\$&')}"`;
}

/**
 * Bloque de variables de conexión para el .env de un proyecto (saltos LF, termina en salto).
 * Es texto puro: no toca ningún archivo.
 */
export function bloqueEnv(
  motor: MotorBd,
  base: string,
  tipo: TipoSitio | 'generico',
  datos: DatosConexion,
  envActual = '',
  /** La clave sale como `MASCARA_CLAVE`: para mostrar el bloque sin pasar el secreto. */
  enmascarar = false,
): string {
  for (const v of [base, datos.usuario, datos.clave ?? '']) {
    if (/[\r\n]/.test(v)) throw new Error('Valor no válido para .env');
  }
  if (motor === 'mongodb') {
    return `MONGODB_URI=${valorEnv(`mongodb://${datos.host}:${datos.puerto}/${base}`)}\n`;
  }
  // CodeIgniter 4 siempre usa database.default.*; un CodeIgniter 3 solo si ya trae ese formato.
  const ci4 = tipo === 'codeigniter4' || (tipo === 'codeigniter3' && CI4.test(envActual));
  // CodeIgniter 3 sin el formato de CI4: el lector propio de index.php (sin escapes).
  const estilo: EstiloEnv = ci4 ? 'ci4' : tipo === 'codeigniter3' ? 'literal' : 'dotenv';
  const clave = enmascarar ? MASCARA_CLAVE : valorEnv(datos.clave ?? '', estilo);
  const usuario = valorEnv(datos.usuario, estilo);
  const bd = valorEnv(base, estilo);
  if (ci4) {
    const driver = motor === 'postgresql' ? 'Postgre' : 'MySQLi';
    return [
      `database.default.hostname = ${datos.host}`,
      `database.default.database = ${bd}`,
      `database.default.username = ${usuario}`,
      `database.default.password = ${clave}`,
      `database.default.DBDriver = ${driver}`,
      `database.default.port = ${datos.puerto}`,
      '',
    ].join('\n');
  }
  const conexion = motor === 'postgresql' ? 'pgsql' : motor;
  // CodeIgniter con variables DB_: se conservan sus nombres (DB_CONNECTION solo si ya lo usa).
  const sinConexion =
    tipo === 'codeigniter3' && DB_LARAVEL.test(envActual) && !CON_LARAVEL.test(envActual);
  return [
    ...(sinConexion ? [] : [`DB_CONNECTION=${conexion}`]),
    `DB_HOST=${datos.host}`,
    `DB_PORT=${datos.puerto}`,
    `DB_DATABASE=${bd}`,
    `DB_USERNAME=${usuario}`,
    `DB_PASSWORD=${clave}`,
    '',
  ].join('\n');
}

import type { TipoSitio } from '../tipos';

export type MotorBd = 'mysql' | 'mariadb' | 'postgresql' | 'mongodb';

export interface DatosConexion {
  host: '127.0.0.1';
  puerto: number;
  usuario: string;
  /** null si el motor no tiene autenticación (MongoDB). */
  clave: string | null;
}

const CI4 = /^\s*#?\s*database\.default\.\w+\s*=/m;
const DB_LARAVEL = /^[ \t]*DB_[A-Z_]+[ \t]*=/m;
const CON_LARAVEL = /^[ \t]*DB_CONNECTION[ \t]*=/m;

const SIMPLE = /^[A-Za-z0-9_.:/@-]*$/;

/** Valor listo para un .env: tal cual si es simple; si no, entre comillas dobles y escapado. */
export function valorEnv(v: string): string {
  if (SIMPLE.test(v)) return v;
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
): string {
  for (const v of [base, datos.usuario, datos.clave ?? '']) {
    if (/[\r\n]/.test(v)) throw new Error('Valor no válido para .env');
  }
  if (motor === 'mongodb') {
    return `MONGODB_URI=${valorEnv(`mongodb://${datos.host}:${datos.puerto}/${base}`)}\n`;
  }
  const clave = valorEnv(datos.clave ?? '');
  const usuario = valorEnv(datos.usuario);
  const bd = valorEnv(base);
  if (tipo === 'codeigniter3' && CI4.test(envActual)) {
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

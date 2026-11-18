import type { TipoSitio } from '../tipos';

export type MotorBd = 'mysql' | 'mariadb' | 'postgresql' | 'mongodb';

export interface DatosConexion {
  host: '127.0.0.1';
  puerto: number;
  usuario: string;
  /** null si el motor no tiene autenticación (MongoDB). */
  clave: string | null;
}

const CI4 = /^[ \t]*#?[ \t]*database\.default\.hostname[ \t]*=/m;
const DB_LARAVEL = /^[ \t]*DB_[A-Z_]+[ \t]*=/m;
const CON_LARAVEL = /^[ \t]*DB_CONNECTION[ \t]*=/m;

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
  if (motor === 'mongodb') return `MONGODB_URI=mongodb://${datos.host}:${datos.puerto}/${base}\n`;
  const clave = datos.clave ?? '';
  if (tipo === 'codeigniter3' && CI4.test(envActual)) {
    const driver = motor === 'postgresql' ? 'Postgre' : 'MySQLi';
    return [
      `database.default.hostname = ${datos.host}`,
      `database.default.database = ${base}`,
      `database.default.username = ${datos.usuario}`,
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
    `DB_DATABASE=${base}`,
    `DB_USERNAME=${datos.usuario}`,
    `DB_PASSWORD=${clave}`,
    '',
  ].join('\n');
}

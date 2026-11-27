import { createHash, createHmac, pbkdf2Sync, randomBytes } from 'node:crypto';

/**
 * Usuarios y roles temporales de las restauraciones de esquema: `wolf_tmp_` + 8 hex con la hora
 * (segundos desde 1970) + 8 hex al azar. La hora dentro del nombre permite limpiar los que quedaron
 * de una ejecución interrumpida sin depender de columnas que no existen en todos los servidores.
 */
export const NOMBRE_TEMPORAL = /^wolf_tmp_[0-9a-f]{16}$/;

/** Cuánto vive un usuario o rol temporal como máximo. */
export const VIDA_TEMPORAL_MS = 60 * 60 * 1000;

export function nombreTemporal(ahora: number = Date.now()): string {
  const segundos = Math.floor(ahora / 1000)
    .toString(16)
    .padStart(8, '0');
  return `wolf_tmp_${segundos}${randomBytes(4).toString('hex')}`;
}

/** ¿Pasó más de `VIDA_TEMPORAL_MS` desde la hora que lleva el nombre? */
export function temporalVencido(nombre: string, ahora: number = Date.now()): boolean {
  if (!NOMBRE_TEMPORAL.test(nombre)) return false;
  const creado = Number.parseInt(nombre.slice(9, 17), 16) * 1000;
  return ahora - creado > VIDA_TEMPORAL_MS;
}

/**
 * Verificador SCRAM-SHA-256 de PostgreSQL para una clave: así el servidor nunca recibe la clave
 * en claro en `CREATE ROLE … PASSWORD` (no queda en el registro de sentencias ni en pg_stat).
 */
export function hashScramSha256(
  clave: string,
  sal: Buffer = randomBytes(16),
  iteraciones = 4096,
): string {
  const salada = pbkdf2Sync(clave.normalize('NFKC'), sal, iteraciones, 32, 'sha256');
  const claveCliente = createHmac('sha256', salada).update('Client Key').digest();
  const guardada = createHash('sha256').update(claveCliente).digest();
  const claveServidor = createHmac('sha256', salada).update('Server Key').digest();
  return `SCRAM-SHA-256$${iteraciones}:${sal.toString('base64')}$${guardada.toString('base64')}:${claveServidor.toString('base64')}`;
}

/** Rol sin login, sin privilegios, que queda como dueño de lo que restaura un esquema. */
export function rolDuenoDe(base: string): string {
  const resumen = createHash('sha1').update(base).digest('hex').slice(0, 6);
  return `wolf_dueno_${base.slice(0, 40)}_${resumen}`;
}

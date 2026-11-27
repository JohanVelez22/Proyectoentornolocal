import { createHash, randomBytes } from 'node:crypto';

/**
 * Prefijo de los usuarios de base que crea WolfCore Dev para cada proyecto. No lo comparten los
 * usuarios temporales (`wolf_tmp_`) ni los dueños bloqueados (`wolf_dueno_`).
 */
export const PREFIJO_USUARIO_PROYECTO = 'wolf_u_';

/** Largo máximo de un usuario de MySQL (el límite más estricto de los motores). */
const MAX_USUARIO = 32;

/**
 * Nombre del usuario propio de un proyecto, derivado de su base: `wolf_u_<base>`. Si no cabe en
 * 32 caracteres, se abrevia con una huella de la base (dos bases distintas nunca comparten usuario).
 */
export function usuarioDeProyecto(base: string): string {
  const limpio = base
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const sitio = MAX_USUARIO - PREFIJO_USUARIO_PROYECTO.length;
  if (limpio !== '' && limpio === base.toLowerCase() && limpio.length <= sitio) {
    return `${PREFIJO_USUARIO_PROYECTO}${limpio}`;
  }
  const huella = createHash('sha256').update(base.toLowerCase()).digest('hex').slice(0, 8);
  const cabeza = limpio.slice(0, sitio - huella.length - 1);
  return `${PREFIJO_USUARIO_PROYECTO}${cabeza ? `${cabeza}_` : ''}${huella}`;
}

/** ¿Es un usuario de los que crea WolfCore Dev para un proyecto? */
export const esUsuarioDeProyecto = (usuario: string): boolean =>
  usuario.startsWith(PREFIJO_USUARIO_PROYECTO) && usuario.length > PREFIJO_USUARIO_PROYECTO.length;

/**
 * Clave aleatoria para el usuario de un proyecto: 32 caracteres de `A-Za-z0-9_-`. Sin símbolos
 * que haya que escapar en un `.env` ni en un archivo PHP. La guarda quien la pide (el proceso
 * principal, en `AlmacenSecretos`); el núcleo nunca la guarda.
 */
export function generarClaveBd(): string {
  return randomBytes(24).toString('base64url');
}

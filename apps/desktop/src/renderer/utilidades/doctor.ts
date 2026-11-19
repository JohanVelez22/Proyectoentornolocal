import { textos } from '../i18n';

/**
 * Texto de lo que hará una reparación, a partir de su código del núcleo
 * (`doctor.reparaciones.<clave>`). Un código desconocido da '' (no se inventa nada).
 */
export function textoReparacion(codigo: string | undefined): string {
  const prefijo = 'doctor.reparaciones.';
  if (!codigo?.startsWith(prefijo)) return '';
  const clave = codigo.slice(prefijo.length);
  const tabla = textos.doctor.reparaciones as Record<string, string>;
  return Object.hasOwn(tabla, clave) ? tabla[clave]! : '';
}

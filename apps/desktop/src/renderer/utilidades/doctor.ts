import type { RouteLocationRaw } from 'vue-router';
import { textos } from '../i18n';
import { destinoServicio, destinoSitio } from './foco';

/**
 * A dónde lleva "Ver" un hallazgo del Doctor: la tarjeta del servicio (revisión `servicios`) o la
 * del proyecto (`certificados`). Los demás hallazgos no tienen tarjeta propia: null.
 */
export function destinoHallazgo(h: { id: string; revision: string }): RouteLocationRaw | null {
  const clave = /^[^:]+:(.+)$/.exec(h.id)?.[1];
  if (!clave) return null;
  if (h.revision === 'servicios') return destinoServicio(clave);
  if (h.revision === 'certificados') return destinoSitio(clave);
  return null;
}

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

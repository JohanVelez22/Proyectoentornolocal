import type { RouteLocationRaw } from 'vue-router';
import { textos, type Textos } from '../i18n';
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

/** Lo que el Doctor vio: código estable del núcleo + datos (nunca una frase). */
export interface EvidenciaVista {
  codigo: string;
  datos: Record<string, string | number>;
  lineas?: EvidenciaVista[];
}

/**
 * Texto de la evidencia en el idioma activo: la plantilla `doctor.evidencias.<codigo>` con los
 * `{datos}` rellenos y, debajo, sus líneas (reglas, perfiles…). Un código desconocido muestra
 * solo el dato `texto`, si lo trae: no se inventa una frase.
 */
export function textoEvidencia(e: EvidenciaVista, t: Textos = textos): string {
  const tabla = t.doctor.evidencias as Record<string, string>;
  const plantilla = Object.hasOwn(tabla, e.codigo) ? tabla[e.codigo]! : '{texto}';
  const cabeza = plantilla.replace(/\{(\w+)\}/g, (_m, k: string) => String(e.datos[k] ?? ''));
  return [cabeza, ...(e.lineas ?? []).map((l) => textoEvidencia(l, t))]
    .filter((x) => x !== '')
    .join('\n');
}

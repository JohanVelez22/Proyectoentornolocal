import type { RouteLocationRaw } from 'vue-router';
import { destinoIa, type SeccionNav } from './rutas';

/**
 * Barra lateral agrupada: Trabajo, Entorno y Utilidades; Ajustes va aparte, al final.
 * PHP vive dentro de Servicios y Agentes dentro de IA (ver `ACCESOS_NAV`).
 */
export const GRUPOS_NAV = [
  { grupo: 'trabajo', secciones: ['inicio', 'proyectos'] },
  {
    grupo: 'entorno',
    secciones: ['servicios', 'basesDeDatos', 'correo', 'ia', 'tuneles', 'contenedores'],
  },
  { grupo: 'utilidades', secciones: ['herramientas', 'depuracion', 'doctor', 'registros'] },
] as const satisfies readonly { grupo: string; secciones: readonly SeccionNav[] }[];

export type GrupoNav = (typeof GRUPOS_NAV)[number]['grupo'];

/** Pantallas que la barra lateral solo muestra con «Mostrar secciones avanzadas». */
export const SECCIONES_AVANZADAS: readonly SeccionNav[] = ['contenedores'];

/** Grupos de la barra lateral según el ajuste de secciones avanzadas (sin grupos vacíos). */
export function gruposVisibles(avanzadas: boolean): { grupo: GrupoNav; secciones: SeccionNav[] }[] {
  return GRUPOS_NAV.map((g) => ({
    grupo: g.grupo,
    secciones: (g.secciones as readonly SeccionNav[]).filter(
      (s) => avanzadas || !SECCIONES_AVANZADAS.includes(s),
    ),
  })).filter((g) => g.secciones.length > 0);
}

/** Todas las pantallas en el orden de la barra lateral (la paleta Ctrl+K llega a todas). */
export const SECCIONES_NAV: readonly SeccionNav[] = [
  ...GRUPOS_NAV.flatMap((g) => g.secciones),
  'ajustes',
];

/**
 * Pestañas que antes eran pantalla: no están en la barra lateral, pero la paleta sigue
 * llevando a ellas con el nombre de siempre.
 */
export const ACCESOS_NAV: readonly { id: SeccionNav; destino: RouteLocationRaw }[] = [
  { id: 'php', destino: { name: 'servicios.php' } },
  { id: 'agentes', destino: destinoIa('agentes') },
];

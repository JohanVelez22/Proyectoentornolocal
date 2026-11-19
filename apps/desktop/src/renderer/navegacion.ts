import type { SeccionNav } from './router';

/** Barra lateral agrupada: Trabajo, Entorno y Utilidades; Ajustes va aparte, al final. */
export const GRUPOS_NAV = [
  { grupo: 'trabajo', secciones: ['inicio', 'proyectos', 'agentes'] },
  { grupo: 'entorno', secciones: ['servicios', 'basesDeDatos', 'correo', 'ia', 'tuneles'] },
  { grupo: 'utilidades', secciones: ['herramientas', 'doctor', 'registros'] },
] as const satisfies readonly { grupo: string; secciones: readonly SeccionNav[] }[];

export type GrupoNav = (typeof GRUPOS_NAV)[number]['grupo'];

/** Todas las pantallas en el orden de la barra lateral. */
export const SECCIONES_NAV: readonly SeccionNav[] = [
  ...GRUPOS_NAV.flatMap((g) => g.secciones),
  'ajustes',
];

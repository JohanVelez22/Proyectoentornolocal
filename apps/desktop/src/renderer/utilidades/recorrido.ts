import type { SeccionNav } from '../rutas';

/** Los 7 pasos del recorrido de bienvenida. `zona` es la entrada de la barra lateral que se resalta. */
export interface PasoRecorrido {
  id: 'bienvenida' | 'servicios' | 'proyectos' | 'bases' | 'herramientas' | 'doctor' | 'listo';
  /** Sección de la barra lateral que se resalta; sin ella, el paso va centrado. */
  zona?: SeccionNav;
  /** Pantalla a la que el botón «Ir a…» lleva (y cierra el recorrido). */
  irA?: SeccionNav;
}

export const PASOS_RECORRIDO: readonly PasoRecorrido[] = [
  { id: 'bienvenida' },
  { id: 'servicios', zona: 'servicios', irA: 'servicios' },
  { id: 'proyectos', zona: 'proyectos', irA: 'proyectos' },
  { id: 'bases', zona: 'basesDeDatos', irA: 'basesDeDatos' },
  { id: 'herramientas', zona: 'herramientas', irA: 'herramientas' },
  { id: 'doctor', zona: 'doctor', irA: 'doctor' },
  { id: 'listo' },
];

export interface RectaZona {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Rectángulo en pantalla de una entrada de la barra lateral (`data-nav`), o null si no está. */
export function rectaDeZona(zona: SeccionNav | undefined): RectaZona | null {
  if (!zona || typeof document === 'undefined') return null;
  const el = document.querySelector<HTMLElement>(`[data-nav="${zona}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { x: r.left, y: r.top, ancho: r.width, alto: r.height };
}

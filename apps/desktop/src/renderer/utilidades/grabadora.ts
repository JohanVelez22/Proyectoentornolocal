/** Sistemas para los que «Grabar pantalla» tiene guía. */
export type SistemaGrabacion = 'windows' | 'macos' | 'linux';

/**
 * Sistema de la ventana según `navigator.platform` (lo mismo que ya muestra la herramienta
 * Entorno). Lo que no es Windows ni macOS recibe la guía genérica de Linux.
 */
export function sistemaDe(plataforma: string): SistemaGrabacion {
  if (/^win/i.test(plataforma)) return 'windows';
  if (/^mac/i.test(plataforma)) return 'macos';
  return 'linux';
}

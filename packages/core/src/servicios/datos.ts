import type { DefServicio } from './definicion';

/**
 * Registro de los servicios no web (bases de datos, herramientas e IA). Cada servicio agrega
 * aquí su `DefServicio` con `registrarDefinicion`; `Servicios` lo consulta en cada llamada.
 */
export const DEFINICIONES: DefServicio[] = [];

/** Agrega una definición o reemplaza la que tenga el mismo id. */
export function registrarDefinicion(def: DefServicio): void {
  const i = DEFINICIONES.findIndex((d) => d.id === def.id);
  if (i >= 0) DEFINICIONES[i] = def;
  else DEFINICIONES.push(def);
}

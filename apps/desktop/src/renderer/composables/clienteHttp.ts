import type { PeticionHttp } from '@pel/core';
import { solicitudes } from './solicitudes';

/**
 * Abre el cliente HTTP de Herramientas con una petición precargada (la usa la guía HTTP, D49).
 * Solo datos, nunca secretos: la petición no se envía hasta que el usuario pulse Enviar. Lo que
 * falte (nombre, autenticación, plazo…) toma los valores por defecto del cliente.
 */
export function abrirConPeticion(p: Partial<PeticionHttp>): void {
  solicitudes.peticionHttp = p;
  solicitudes.herramienta = 'clienteHttp';
}

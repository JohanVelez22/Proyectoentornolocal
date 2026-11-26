import type { Sitio } from '../tipos';

/**
 * ¿Se puede publicar este sitio (túnel)? Un sitio que llegó de un perfil importado (D26) no es de
 * confianza hasta que el usuario marca «Confío en este repositorio», y uno con la carpeta
 * pendiente todavía no existe en este equipo: ninguno de los dos se expone a internet.
 * Misma regla que usa `ProcesosProyecto` para no correr comandos de un sitio ajeno.
 */
export function sitioPublicable(s: Pick<Sitio, 'origen' | 'confiado' | 'pendiente'>): boolean {
  if (s.pendiente) return false;
  return !(s.origen === 'perfil' && s.confiado !== true);
}

import { textos } from '../i18n';

/**
 * El núcleo nombra los servicios externos «MySQL (externo)» en español; en pantalla el sufijo
 * sale en el idioma elegido («MySQL (external)», «MySQL (externe)»…).
 */
export function nombreServicio(nombre: string): string {
  const m = /^(.*) \(externo\)$/.exec(nombre);
  return m ? `${m[1]} (${textos.estado.externo.toLowerCase()})` : nombre;
}

import { es } from '../i18n/es';

/** Texto y tono de la píldora global de la cabecera (lógica pura, para poder probarla). */
export interface DatosPastilla {
  cargado: boolean;
  /** La carga inicial falló (no hay conexión con el núcleo). */
  fallo: boolean;
  encendidos: number;
  tuneles: number;
  hayError: boolean;
}

export function resumenPastilla(d: DatosPastilla): {
  texto: string;
  tono: 'neutro' | 'viva' | 'alerta';
} {
  if (d.fallo) return { texto: es.resumenGlobal.sinConexion, tono: 'alerta' };
  if (!d.cargado) return { texto: es.resumenGlobal.cargando, tono: 'neutro' };
  const partes = [es.resumenGlobal.servicios(d.encendidos), es.resumenGlobal.tuneles(d.tuneles)];
  // El error también se dice con texto: el color solo no basta.
  if (d.hayError) partes.push(es.resumenGlobal.conErrores);
  return {
    texto: partes.join(' · '),
    tono: d.hayError ? 'alerta' : d.encendidos > 0 ? 'viva' : 'neutro',
  };
}

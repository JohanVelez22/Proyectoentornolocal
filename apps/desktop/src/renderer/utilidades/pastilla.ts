import { textos } from '../i18n';

/** Texto y tono de la píldora global de la cabecera (lógica pura, para poder probarla). */
export interface DatosPastilla {
  cargado: boolean;
  /** La carga inicial falló (no hay conexión con el núcleo). */
  fallo: boolean;
  encendidos: number;
  tuneles: number;
  hayError: boolean;
  /** Servicios en error (para el texto corto; si falta, se cuenta 1 cuando `hayError`). */
  conError?: number;
}

export function resumenPastilla(d: DatosPastilla): {
  /** Texto completo (va en el `title` y en el lector de pantalla). */
  texto: string;
  /** Texto corto, siempre visible a cualquier ancho (máx. 14 caracteres). */
  corto: string;
  tono: 'neutro' | 'viva' | 'alerta';
} {
  const g = textos.resumenGlobal;
  if (d.fallo) return { texto: g.sinConexion, corto: g.cortoSinConexion, tono: 'alerta' };
  if (!d.cargado) return { texto: g.cargando, corto: g.cortoCargando, tono: 'neutro' };
  const partes = [g.servicios(d.encendidos), g.tuneles(d.tuneles)];
  // El error también se dice con texto: el color solo no basta.
  if (d.hayError) partes.push(g.conErrores);
  // El error manda sobre lo encendido; sin nada encendido se dice que todo está apagado.
  const corto = d.hayError
    ? g.cortoErrores(Math.max(1, d.conError ?? 1))
    : d.encendidos > 0
      ? g.cortoEncendidos(d.encendidos)
      : g.cortoApagado;
  return {
    texto: partes.join(' · '),
    corto,
    tono: d.hayError ? 'alerta' : d.encendidos > 0 ? 'viva' : 'neutro',
  };
}

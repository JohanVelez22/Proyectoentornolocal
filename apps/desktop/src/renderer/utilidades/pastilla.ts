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
  /** Los servicios en error (con su motivo, si lo hay): nombran al servicio cuando es uno solo. */
  errores?: { id: string; nombre: string; mensaje?: string }[];
  /** Problemas detectados que se ven en Inicio (la misma cuenta que la campana). */
  problemas?: number;
}

export function resumenPastilla(d: DatosPastilla): {
  /** Texto completo (va en el `title` y en el lector de pantalla). */
  texto: string;
  /** Texto corto, siempre visible a cualquier ancho (máx. 14 caracteres). */
  corto: string;
  /** Texto visible en ancho normal: con un solo error nombra el servicio; con varios, cuántos. */
  largo: string;
  /** Globo de la pastilla: resumen, motivo del error, adónde lleva y problemas de Inicio. */
  title: string;
  /** Servicio al que lleva con foco al pulsarla (el primero en error); null si no hay error. */
  destinoId: string | null;
  tono: 'neutro' | 'viva' | 'alerta';
} {
  const g = textos.resumenGlobal;
  if (d.fallo) {
    const t = g.sinConexion;
    return {
      texto: t,
      corto: g.cortoSinConexion,
      largo: g.cortoSinConexion,
      title: t,
      destinoId: null,
      tono: 'alerta',
    };
  }
  if (!d.cargado) {
    return {
      texto: g.cargando,
      corto: g.cortoCargando,
      largo: g.cortoCargando,
      title: g.cargando,
      destinoId: null,
      tono: 'neutro',
    };
  }
  const errores = d.errores ?? [];
  const unico = d.hayError && errores.length === 1 ? errores[0]! : null;
  const partes = [g.servicios(d.encendidos), g.tuneles(d.tuneles)];
  // El error también se dice con texto: el color solo no basta.
  if (d.hayError) partes.push(g.conErrores);
  // El error manda sobre lo encendido; sin nada encendido se dice que todo está apagado.
  const corto = d.hayError
    ? g.cortoErrores(Math.max(1, d.conError ?? 1))
    : d.encendidos > 0
      ? g.cortoEncendidos(d.encendidos)
      : g.cortoApagado;
  const largo = unico
    ? g.errorServicio(unico.nombre)
    : d.hayError && errores.length > 1
      ? g.variosErrores(errores.length)
      : corto;
  // El title dice el motivo y adónde lleva; con un solo error, directo a su tarjeta.
  const title = [
    ...(unico
      ? [
          ...partes.slice(0, -1),
          `${unico.nombre}: ${unico.mensaje ?? g.errorServicio(unico.nombre)}`,
        ]
      : partes),
    unico ? g.irAlServicio : g.irAServicios,
    ...((d.problemas ?? 0) > 0 ? [g.problemasInicio(d.problemas!)] : []),
  ].join(' · ');
  return {
    texto: partes.join(' · '),
    corto,
    largo,
    title,
    destinoId: d.hayError ? (errores[0]?.id ?? null) : null,
    tono: d.hayError ? 'alerta' : d.encendidos > 0 ? 'viva' : 'neutro',
  };
}

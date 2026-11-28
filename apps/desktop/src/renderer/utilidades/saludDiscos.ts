/**
 * Textos y filas de «Salud de los discos» y «Eventos del disco» (D57). Funciones puras: el núcleo
 * da los datos (`DiscoSalud`, `EventoDisco`) y aquí se vuelven frases en el idioma de la interfaz.
 * Lo que falta nunca se rellena con un 0: sale «No disponible» con su motivo. Nada de lo que se
 * muestra o se copia lleva números de serie ni identificadores únicos (el núcleo no los lee).
 */
import {
  DIAS_EVENTOS_DISCO,
  MAX_EVENTOS_DISCO,
  limiteTemperatura,
  UMBRALES_DISCO,
  type DiscoSalud,
  type EstadoPrediccion,
  type EventoDisco,
  type MotivoVeredicto,
  type Veredicto,
} from '@pel/core';
import type { Textos } from '../i18n';
import { formatearTamano } from './bd';
import { rellenar } from './equipo';

export type TextosDiscos = Textos['herramientas']['entorno']['discos'];
export type TextosEventosDisco = Textos['herramientas']['entorno']['eventosDisco'];

export type TonoVeredicto = 'success' | 'warning' | 'error' | 'default';

export const TONO_VEREDICTO: Record<Veredicto, TonoVeredicto> = {
  bien: 'success',
  atencion: 'warning',
  critico: 'error',
  no_disponible: 'default',
};

const NOMBRE_BUS: Record<string, string> = {
  nvme: 'NVMe',
  sata: 'SATA',
  ata: 'ATA',
  sas: 'SAS',
  scsi: 'SCSI',
  usb: 'USB',
  raid: 'RAID',
};

/** Tipo y conexión del disco como etiquetas cortas (SSD, NVMe…). */
export function etiquetasDisco(d: DiscoSalud, t: TextosDiscos): string[] {
  const r: string[] = [];
  if (d.medio === 'ssd') r.push('SSD');
  else if (d.medio === 'hdd') r.push('HDD');
  if (d.bus && NOMBRE_BUS[d.bus]) r.push(NOMBRE_BUS[d.bus]!);
  if (r.length === 0) r.push(t.tipoDesconocido);
  if (d.tamanoBytes !== null) r.push(formatearTamano(d.tamanoBytes));
  return r;
}

export const nombreDisco = (d: DiscoSalud, t: TextosDiscos): string =>
  d.modelo ?? rellenar(t.numeroDisco, { n: d.numero });

export const textoUnidades = (d: DiscoSalud, t: TextosDiscos): string =>
  d.unidades.length > 0 ? rellenar(t.unidades, { u: d.unidades.join(' ') }) : t.sinUnidades;

/** El desgaste de un NVMe puede pasar de 100: de ahí en adelante se muestra «≥ 100 %». */
export const textoDesgaste = (n: number): string => (n >= 100 ? '≥ 100 %' : `${n} %`);

/**
 * Frase de un motivo del veredicto, con los números que lo explican. Si falta un dato NO se
 * rellena con un 0: sale «No disponible» (nunca un número inventado).
 */
export function textoMotivo(d: DiscoSalud, m: MotivoVeredicto, t: TextosDiscos): string {
  // Un veredicto conservado de una lectura anterior usa los números de aquella lectura.
  const c = d.contadores ?? d.datoConservado?.contadores ?? null;
  const dato = (v: number | null | undefined, formato: (n: number) => string = String): string =>
    v === null || v === undefined ? t.noDisponible : formato(v);
  return rellenar(t.motivos[m], {
    estado: d.operacional.length > 0 ? d.operacional.join(', ') : t.noDisponible,
    lectura: dato(c?.erroresLecturaNoCorregidos),
    escritura: dato(c?.erroresEscrituraNoCorregidos),
    // La plantilla trae «{desgaste} %»: con el tope («≥ 100») el signo va aquí y no se repite.
    desgaste: dato(c?.desgastePct, (n) => (n >= 100 ? '≥ 100' : String(n))),
    umbral: UMBRALES_DISCO.desgasteAtencion,
    temperatura: dato(c?.temperaturaC),
    limite:
      limiteTemperatura({ medio: d.medio, bus: d.bus, contadores: c })?.valor ?? t.noDisponible,
    cantidad: dato(c?.erroresLecturaCorregidos),
  });
}

/** Texto de la etiqueta del veredicto: «Bien» sin contadores se matiza. */
export function textoVeredicto(d: DiscoSalud, t: TextosDiscos): string {
  return d.veredicto === 'bien' && d.contadores === null
    ? t.bienSoloEstado
    : t.veredictos[d.veredicto];
}

/** «Último dato con permisos de administrador: <fecha>» si el veredicto viene de una lectura anterior. */
export function textoDatoConservado(
  d: DiscoSalud,
  t: TextosDiscos,
  fecha: (iso: string) => string,
): string | null {
  const c = d.datoConservado;
  if (!c) return null;
  return rellenar(c.origen === 'admin' ? t.ultimoDatoAdmin : t.ultimoDatoContadores, {
    fecha: fecha(c.en),
  });
}

/** ¿Merece la acción «Hacer respaldo ahora»? Solo Atención y Crítico. */
export const pideRespaldo = (d: Pick<DiscoSalud, 'veredicto'>): boolean =>
  d.veredicto === 'atencion' || d.veredicto === 'critico';

export interface FilaContador {
  clave: string;
  etiqueta: string;
  valor: string;
  /** Sin dato: se muestra «No disponible» con su motivo, nunca un 0. */
  disponible: boolean;
}

/** Las filas de contadores de un disco; lo que falta, «No disponible» con el motivo. */
export function filasContadores(
  d: DiscoSalud,
  prediccion: EstadoPrediccion,
  t: TextosDiscos,
): FilaContador[] {
  const c = d.contadores;
  const sin = (motivo: string | null): { valor: string; disponible: false } => ({
    valor: motivo ? rellenar(t.noDisponibleMotivo, { motivo }) : t.noDisponible,
    disponible: false,
  });
  const motivoContadores = d.motivoSinContadores ? t.motivoSin[d.motivoSinContadores] : null;
  const num = (
    clave: string,
    etiqueta: string,
    v: number | null | undefined,
    formato: (n: number) => string = String,
  ): FilaContador =>
    v === null || v === undefined
      ? { clave, etiqueta, ...sin(motivoContadores) }
      : { clave, etiqueta, valor: formato(v), disponible: true };
  const c2 = t.contadores;
  const filas: FilaContador[] = [
    num('temperatura', c2.temperatura, c?.temperaturaC, (n) => `${n} °C`),
    // En un HDD no hay desgaste que medir: no es «No disponible», es que no aplica.
    d.medio === 'hdd' && (c?.desgastePct ?? null) === null
      ? { clave: 'desgaste', etiqueta: c2.desgaste, valor: t.noAplicaHdd, disponible: false }
      : num('desgaste', c2.desgaste, c?.desgastePct, textoDesgaste),
    num('lecturaCorregidos', c2.lecturaCorregidos, c?.erroresLecturaCorregidos),
    num('lecturaNoCorregidos', c2.lecturaNoCorregidos, c?.erroresLecturaNoCorregidos),
    num('escrituraCorregidos', c2.escrituraCorregidos, c?.erroresEscrituraCorregidos),
    num('escrituraNoCorregidos', c2.escrituraNoCorregidos, c?.erroresEscrituraNoCorregidos),
    num('horas', c2.horas, c?.horasEncendido, (n) => rellenar(t.horasValor, { n })),
  ];
  filas.push(
    d.prediccionFallo === null
      ? {
          clave: 'prediccion',
          etiqueta: c2.prediccion,
          ...sin(t.prediccionSin[prediccion === 'sin_acceso' ? 'sin_acceso' : 'no_disponible']),
        }
      : {
          clave: 'prediccion',
          etiqueta: c2.prediccion,
          valor: d.prediccionFallo ? t.prediccionFallo : t.prediccionSinFallo,
          disponible: true,
        },
  );
  return filas;
}

/** ¿Algún disco tiene datos que solo da el administrador? (para ofrecer el botón). */
export const hayDatosDeAdministrador = (discos: readonly DiscoSalud[]): boolean =>
  discos.some((d) => d.motivoSinContadores === 'admin');

/** Explicación sencilla del evento (de `e.explicaciones.disco_<id>`), o el identificador. */
export function explicacionEvento(e: EventoDisco, t: TextosEventosDisco): string {
  return (t.explicaciones as Record<string, string>)[e.codigo] ?? `ID ${e.id}`;
}

export function textoDiscoEvento(e: EventoDisco, t: TextosEventosDisco): string {
  if (!e.disco) return t.sinDisco;
  return e.disco.tipo === 'disco'
    ? rellenar(t.disco, { n: e.disco.valor })
    : rellenar(t.unidad, { u: e.disco.valor });
}

/**
 * Texto plano de los eventos para pegar en un informe: fecha, disco, explicación y el texto del
 * sistema ya saneado por el núcleo (sin rutas de usuario completas ni identificadores).
 */
export function textoCopiaEventos(
  eventos: readonly EventoDisco[],
  t: TextosEventosDisco,
  fecha: (iso: string) => string,
): string {
  const cab = rellenar(t.cabeceraCopia, { dias: DIAS_EVENTOS_DISCO });
  const filas = eventos.map(
    (e) =>
      `${fecha(e.fecha)} · ${textoDiscoEvento(e, t)} · ${e.proveedor} ${e.id} · ${t.gravedad[e.gravedad]} · ${explicacionEvento(e, t)}` +
      (e.detalle ? `\n  ${e.detalle}` : ''),
  );
  return [cab, ...filas].join('\n');
}

export const TOPE_EVENTOS = MAX_EVENTOS_DISCO;
export const DIAS_EVENTOS = DIAS_EVENTOS_DISCO;

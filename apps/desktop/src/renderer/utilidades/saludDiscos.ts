/**
 * Textos y filas de «Salud de los discos» y «Eventos del disco» (D57). Funciones puras: el núcleo
 * da los datos (`DiscoSalud`, `EventoDisco`) y aquí se vuelven frases en el idioma de la interfaz.
 * Lo que falta nunca se rellena con un 0: sale «No disponible» con su motivo. Nada de lo que se
 * muestra o se copia lleva números de serie ni identificadores únicos (el núcleo no los lee).
 */
import {
  DIAS_EVENTOS_DISCO,
  MAX_EVENTOS_DISCO,
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

/** Frase de un motivo del veredicto, con los números que lo explican. */
export function textoMotivo(d: DiscoSalud, m: MotivoVeredicto, t: TextosDiscos): string {
  const c = d.contadores;
  return rellenar(t.motivos[m], {
    estado: d.operacional.join(', '),
    lectura: c?.erroresLecturaNoCorregidos ?? 0,
    escritura: c?.erroresEscrituraNoCorregidos ?? 0,
    desgaste: c?.desgastePct ?? 0,
    umbral: UMBRALES_DISCO.desgasteAtencion,
    temperatura: c?.temperaturaC ?? 0,
    limite: limiteMostrado(d),
    cantidad: c?.erroresLecturaCorregidos ?? 0,
  });
}

function limiteMostrado(d: DiscoSalud): number {
  const max = d.contadores?.temperaturaMaxC ?? null;
  if (max !== null && max >= UMBRALES_DISCO.temperaturaMinCreible) return max;
  return d.medio === 'hdd'
    ? UMBRALES_DISCO.temperaturaHddAtencion
    : UMBRALES_DISCO.temperaturaSsdAtencion;
}

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
    num('desgaste', c2.desgaste, c?.desgastePct, (n) => `${n} %`),
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

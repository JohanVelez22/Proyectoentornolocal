import type {
  BusDisco,
  ContadoresDisco,
  MedioDisco,
  MotivoVeredicto,
  SaludReportada,
  Veredicto,
} from './tipos';

/**
 * Umbrales del veredicto (D57). Están aquí, en constantes, y la interfaz los explica con estos
 * mismos números (`textos.herramientas.entorno.discos.criterios`).
 */
export const UMBRALES_DISCO = {
  /** Desgaste (%) a partir del cual un SSD pide atención. */
  desgasteAtencion: 80,
  /** Temperatura (°C) de un SSD o NVMe si el fabricante no declara `TemperatureMax`. */
  temperaturaSsdAtencion: 60,
  /** Temperatura (°C) de un HDD si el fabricante no declara `TemperatureMax`. */
  temperaturaHddAtencion: 50,
  /** Fuera de este rango un valor de temperatura no es creíble (p. ej. 0 de un controlador mudo). */
  temperaturaMinCreible: 1,
  temperaturaMaxCreible: 150,
} as const;

/** `OperationalStatus` que equivalen a un fallo del disco. */
export const ESTADOS_OPERACIONALES_CRITICOS: readonly string[] = [
  'failed',
  'io error',
  'lost communication',
  'no contact',
  'predictive failure',
];

export interface EntradaVeredicto {
  salud: SaludReportada | null;
  operacional: readonly string[];
  medio: MedioDisco | null;
  bus: BusDisco | null;
  contadores: ContadoresDisco | null;
  prediccionFallo: boolean | null;
}

export interface ResultadoVeredicto {
  veredicto: Veredicto;
  motivos: MotivoVeredicto[];
}

const positivo = (n: number | null | undefined): boolean => n != null && n > 0;

/** Temperatura creíble (°C) o null. */
export function temperaturaCreible(n: number | null): number | null {
  return n !== null &&
    n >= UMBRALES_DISCO.temperaturaMinCreible &&
    n <= UMBRALES_DISCO.temperaturaMaxCreible
    ? n
    : null;
}

/**
 * Límite de temperatura de un disco: el máximo que declara el fabricante y, si no lo da, el
 * umbral por tipo (60 °C en SSD/NVMe, 50 °C en HDD). Sin tipo conocido y sin máximo, null: no se
 * adivina. Con el máximo del fabricante «supera» es estrictamente mayor; con el umbral por tipo,
 * mayor o igual.
 */
export function limiteTemperatura(
  e: Pick<EntradaVeredicto, 'medio' | 'bus' | 'contadores'>,
): { valor: number; origen: 'fabricante' | 'tipo'; estricto: boolean } | null {
  const max = temperaturaCreible(e.contadores?.temperaturaMaxC ?? null);
  if (max !== null) return { valor: max, origen: 'fabricante', estricto: true };
  if (e.medio === 'ssd' || e.bus === 'nvme') {
    return { valor: UMBRALES_DISCO.temperaturaSsdAtencion, origen: 'tipo', estricto: false };
  }
  if (e.medio === 'hdd') {
    return { valor: UMBRALES_DISCO.temperaturaHddAtencion, origen: 'tipo', estricto: false };
  }
  return null;
}

/** ¿Hay algún valor real en los contadores? */
export const tieneContadores = (c: ContadoresDisco | null): boolean =>
  c !== null && Object.values(c).some((v) => v !== null);

/**
 * Veredicto de un disco, con los motivos:
 *
 * - **Crítico**: estado Warning o Unhealthy, un estado operacional de fallo, errores sin corregir
 *   (de lectura o de escritura) o predicción de fallo.
 * - **Atención**: desgaste ≥ 80 %, temperatura por encima del máximo del fabricante (o, sin él,
 *   ≥ 60 °C en SSD/NVMe y ≥ 50 °C en HDD) o errores de lectura corregidos que SUBEN respecto de la
 *   lectura anterior guardada (`corregidosPrevios`).
 * - **Bien**: estado Healthy y nada de lo anterior.
 * - **No disponible**: ni estado ni contadores ni predicción (datos insuficientes).
 */
export function evaluarDisco(
  e: EntradaVeredicto,
  corregidosPrevios: number | null = null,
): ResultadoVeredicto {
  const c = e.contadores;
  if (e.salud === null && !tieneContadores(c) && e.prediccionFallo === null) {
    return { veredicto: 'no_disponible', motivos: [] };
  }
  const criticos: MotivoVeredicto[] = [];
  if (e.salud === 'unhealthy') criticos.push('estado_unhealthy');
  if (e.salud === 'warning') criticos.push('estado_warning');
  if (e.operacional.some((o) => ESTADOS_OPERACIONALES_CRITICOS.includes(o.trim().toLowerCase()))) {
    criticos.push('estado_operacional');
  }
  if (positivo(c?.erroresLecturaNoCorregidos) || positivo(c?.erroresEscrituraNoCorregidos)) {
    criticos.push('errores_sin_corregir');
  }
  if (e.prediccionFallo === true) criticos.push('prediccion_fallo');
  if (criticos.length > 0) return { veredicto: 'critico', motivos: criticos };

  const atencion: MotivoVeredicto[] = [];
  if (c?.desgastePct != null && c.desgastePct >= UMBRALES_DISCO.desgasteAtencion) {
    atencion.push('desgaste');
  }
  const temp = temperaturaCreible(c?.temperaturaC ?? null);
  const limite = limiteTemperatura(e);
  if (
    temp !== null &&
    limite !== null &&
    (limite.estricto ? temp > limite.valor : temp >= limite.valor)
  ) {
    atencion.push('temperatura');
  }
  const corregidos = c?.erroresLecturaCorregidos ?? null;
  if (corregidos !== null && corregidosPrevios !== null && corregidos > corregidosPrevios) {
    atencion.push('errores_corregidos_suben');
  }
  if (atencion.length > 0) return { veredicto: 'atencion', motivos: atencion };
  return { veredicto: 'bien', motivos: [] };
}

/** Orden de gravedad para comparar veredictos (no disponible no cuenta como peor ni mejor). */
export const GRAVEDAD_VEREDICTO: Record<Veredicto, number> = {
  no_disponible: -1,
  bien: 0,
  atencion: 1,
  critico: 2,
};

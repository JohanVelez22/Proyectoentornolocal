import type { Evidencia } from '../src/doctor/tipos';

/** Aplana una evidencia (código, datos y líneas) en un texto solo para comparar en las pruebas. */
export function evidenciaPlana(e: Evidencia): string {
  return [
    e.codigo,
    ...Object.values(e.datos).map(String),
    ...(e.lineas ?? []).map(evidenciaPlana),
  ].join('\n');
}

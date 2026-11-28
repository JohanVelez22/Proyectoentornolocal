import { textos } from '../i18n';
import type { AlertaPanel } from './metricas';

/** Un problema detectado en el equipo (lo que Inicio llama «Problemas detectados»). */
export interface Problema {
  clave: string;
  texto: string;
  tipo: 'error' | 'info';
  alerta?: AlertaPanel;
}

/**
 * Los problemas de Inicio, en un solo sitio (D54c): la memoria alta no entra (es una insignia de su
 * tarjeta); el error de muestreo y los puertos ocupados sí. La pastilla, la campana y el bloque de
 * Inicio leen esta misma lista, así que nunca discrepan.
 */
export function calcularProblemas(d: {
  errorMuestreo: string | null;
  errorPuertos: boolean;
  alertas: readonly AlertaPanel[];
}): Problema[] {
  const t = textos.panel;
  return [
    ...(d.errorMuestreo
      ? [{ clave: 'muestreo', texto: t.errorMuestreo(d.errorMuestreo), tipo: 'error' as const }]
      : []),
    ...d.alertas
      .filter((a) => a.tipo !== 'ramAlta')
      .map((a) => ({ clave: a.clave, texto: a.texto, tipo: 'error' as const, alerta: a })),
    ...(d.errorPuertos
      ? [{ clave: 'puertos', texto: t.alertas.errorPuertos, tipo: 'info' as const }]
      : []),
  ];
}

/** Número de la insignia de la campana: avisos sin leer más problemas detectados. */
export function cuentaCampana(noLeidos: number, problemas: number): number {
  return noLeidos + problemas;
}

import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as comun from '@zxcvbn-ts/language-common';

/** Tramo máximo que se evalúa: zxcvbn es cuadrático y una clave real no pasa de aquí. */
const MAX_EVALUADO = 128;

export interface Fortaleza {
  puntaje: 0 | 1 | 2 | 3 | 4;
  /** Códigos de aviso y sugerencia de zxcvbn (la interfaz los traduce); nunca la clave. */
  avisos: string[];
}

let motor: ZxcvbnFactory | null = null;

/** Se arma al primer uso: el diccionario pesa y la herramienta puede no abrirse nunca. */
function obtener(): ZxcvbnFactory {
  motor ??= new ZxcvbnFactory({
    dictionary: { ...comun.dictionary },
    graphs: comun.adjacencyGraphs,
  });
  return motor;
}

/**
 * Fortaleza de una contraseña escrita, calculada aquí mismo (zxcvbn-ts): nada sale del equipo.
 * Es una estimación, no una garantía.
 */
export function evaluarFortaleza(clave: string): Fortaleza {
  if (clave === '') return { puntaje: 0, avisos: [] };
  const r = obtener().check(clave.slice(0, MAX_EVALUADO));
  const avisos = [...(r.feedback.warning ? [r.feedback.warning] : []), ...r.feedback.suggestions];
  return { puntaje: r.score, avisos: [...new Set(avisos)] };
}

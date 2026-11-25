import { escribirEnv, leerEnv, type LineaEnv } from './leer';

export interface DiffEnv {
  /** Claves del ejemplo que el `.env` no tiene. */
  faltan: string[];
  /** Claves del `.env` que el ejemplo no tiene. */
  sobran: string[];
  /** Claves en las dos con valores distintos (solo los nombres: nunca los valores). */
  distintas: string[];
}

const variables = (lineas: readonly LineaEnv[]): Map<string, string> => {
  const m = new Map<string, string>();
  for (const l of lineas) if (l.tipo === 'variable' && !m.has(l.clave!)) m.set(l.clave!, l.valor!);
  return m;
};

/**
 * Compara un `.env` con su ejemplo. Devuelve solo nombres de variable: lo que haya en los valores
 * (secretos incluidos) no sale de aquí.
 */
export function diffEnv(env: string, ejemplo: string): DiffEnv {
  const a = variables(leerEnv(env));
  const b = variables(leerEnv(ejemplo));
  const faltan = [...b.keys()].filter((k) => !a.has(k));
  const sobran = [...a.keys()].filter((k) => !b.has(k));
  const distintas = [...a.keys()].filter((k) => b.has(k) && a.get(k) !== b.get(k));
  return { faltan, sobran, distintas };
}

export { escribirEnv };

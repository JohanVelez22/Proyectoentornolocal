/** Lo que decide el entorno de un proceso hijo. */
export interface DefEntorno {
  env?: Record<string, string> | undefined;
  /** Valores secretos solo para este proceso: nunca se persisten ni se muestran. */
  envSecreto?: Record<string, string> | undefined;
  quitarEntorno?: readonly string[] | undefined;
  conservarEntorno?: readonly string[] | undefined;
}

/**
 * Entorno de un hijo: el heredado sin lo que `quitarEntorno` excluye (salvo `conservarEntorno`),
 * más `env` y `envSecreto`.
 */
export function entornoDelHijo(heredado: NodeJS.ProcessEnv, def: DefEntorno): NodeJS.ProcessEnv {
  const prefijos = (def.quitarEntorno ?? []).map((p) => p.toUpperCase());
  const conservar = (def.conservarEntorno ?? []).map((p) => p.toUpperCase());
  const base: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(heredado)) {
    const K = k.toUpperCase();
    if (prefijos.some((p) => K.startsWith(p)) && !conservar.some((p) => K.startsWith(p))) continue;
    base[k] = v;
  }
  return { ...base, ...def.env, ...def.envSecreto };
}

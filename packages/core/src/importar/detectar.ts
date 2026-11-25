import { stat } from 'node:fs/promises';
import {
  contexto,
  type CandidatoImportar,
  type ProgramaAjeno,
  type ResultadoDetectar,
} from './comun';
import { detectarHerd } from './herd';
import { detectarLaragon } from './laragon';
import { detectarXampp } from './xampp';

export type {
  AvisoImportar,
  CandidatoImportar,
  ProblemaImportar,
  ProgramaAjeno,
  ResultadoDetectar,
} from './comun';
export { PROGRAMAS_AJENOS } from './comun';

/**
 * Lo que se puede importar de una instalación de Laragon, XAMPP o Herd (`raiz`): sus sitios con
 * dominio, PHP y base, y los problemas que hubo al leerla (archivos enormes o ilegibles, carpetas
 * fuera de la instalación o que ya no existen), cada uno con su código. Solo lee: nunca modifica
 * nada ni arranca nada, y un archivo raro no detiene el resto. `prohibidas` son carpetas que
 * nunca se vinculan (la de datos de WolfCore Dev).
 */
export async function detectarConProblemas(
  raiz: string,
  programa: ProgramaAjeno,
  prohibidas: readonly string[] = [],
): Promise<ResultadoDetectar> {
  const ctx = contexto(raiz, programa, prohibidas);
  try {
    if (!(await stat(ctx.raiz)).isDirectory()) return { candidatos: [], problemas: [] };
  } catch {
    return { candidatos: [], problemas: [] };
  }
  const candidatos =
    programa === 'laragon'
      ? await detectarLaragon(ctx)
      : programa === 'xampp'
        ? await detectarXampp(ctx)
        : await detectarHerd(ctx);
  return { candidatos, problemas: ctx.problemas };
}

/** Los candidatos de `detectarConProblemas`, sin los problemas. */
export async function detectarImportables(
  raiz: string,
  programa: ProgramaAjeno,
  prohibidas: readonly string[] = [],
): Promise<CandidatoImportar[]> {
  return (await detectarConProblemas(raiz, programa, prohibidas)).candidatos;
}

import { valorEnv, type EstiloEnv } from '../../bd/env';
import { ErrorWolf } from '../../errores';
import { enmascarar, esSecreta, leerEnv, escribirEnv, type LineaEnv } from './leer';

/** `clave → valor nuevo`; `null` quita la variable. */
export type CambiosEnv = Record<string, string | null>;

export const CLAVE_ENV_VALIDA = /^[A-Za-z_][A-Za-z0-9_.]{0,127}$/;
export const MAX_VALOR_ENV = 4096;
export const MAX_CAMBIOS_ENV = 200;

/** Valida los cambios pedidos (nombres, valores de una línea y cantidad). Nunca repite un valor. */
export function validarCambios(cambios: unknown): CambiosEnv {
  const invalido = (clave?: string): ErrorWolf =>
    new ErrorWolf('env.cambio_invalido', 'Un cambio del .env no es válido.', {
      ...(clave ? { clave: clave.slice(0, 40) } : {}),
    });
  if (typeof cambios !== 'object' || cambios === null || Array.isArray(cambios)) throw invalido();
  const salida: CambiosEnv = {};
  const entradas = Object.entries(cambios as Record<string, unknown>);
  if (entradas.length > MAX_CAMBIOS_ENV) throw invalido();
  for (const [clave, valor] of entradas) {
    if (!CLAVE_ENV_VALIDA.test(clave)) throw invalido(clave);
    if (valor === null) {
      salida[clave] = null;
      continue;
    }
    if (typeof valor !== 'string' || valor.length > MAX_VALOR_ENV || /[\r\n\0]/.test(valor)) {
      throw invalido(clave);
    }
    salida[clave] = valor;
  }
  return salida;
}

/** Valor listo para escribir respetando las comillas que la variable ya usaba. */
function formatear(valor: string, previas: '"' | "'" | null, estilo: EstiloEnv): string {
  try {
    if (previas === '"' && estilo !== 'literal') {
      const escapado = valor.replace(/[\\"]/g, '\\$&');
      return `"${estilo === 'dotenv' ? escapado.replace(/\$/g, '\\$') : escapado}"`;
    }
    if (previas === "'" && !valor.includes("'") && estilo === 'dotenv') return `'${valor}'`;
    return valorEnv(valor, estilo);
  } catch {
    throw new ErrorWolf('env.cambio_invalido', 'Un valor no se puede escribir en este .env.');
  }
}

/**
 * Aplica los cambios a las líneas: una variable existente cambia SOLO su valor (conserva
 * `export`, espacios, comillas y comentario de la línea), una nueva va al final y `null` quita
 * todas las definiciones activas. Lo demás (comentarios, orden, vacías, fin de línea) no se toca.
 */
export function aplicarCambios(
  lineas: readonly LineaEnv[],
  cambios: CambiosEnv,
  estiloDe: (clave: string) => EstiloEnv,
): LineaEnv[] {
  let salida = lineas.map((l) => ({ ...l }));
  const eol = lineas.some((l) => l.crudo.endsWith('\r\n')) ? '\r\n' : '\n';
  for (const [clave, valor] of Object.entries(cambios)) {
    if (valor === null) {
      salida = salida.filter((l) => !(l.tipo === 'variable' && l.clave === clave));
      continue;
    }
    const i = salida.findIndex((l) => l.tipo === 'variable' && l.clave === clave);
    const estilo = estiloDe(clave);
    if (i >= 0) {
      const l = salida[i]!;
      const fin = /\r?\n$/.exec(l.crudo)?.[0] ?? '';
      const bom = l.crudo.startsWith('﻿') ? '﻿' : '';
      const nuevo = formatear(valor, l.comillas ?? null, estilo);
      salida[i] = {
        ...l,
        valor,
        crudo: `${bom}${l.prefijo}${clave}${l.igual}${nuevo}${l.resto ?? ''}${fin}`,
      };
      continue;
    }
    const ultimo = salida.length - 1;
    if (ultimo >= 0 && !/\n$/.test(salida[ultimo]!.crudo)) {
      salida[ultimo] = { ...salida[ultimo]!, crudo: salida[ultimo]!.crudo + eol };
    }
    const igual = /\./.test(clave) && estilo === 'ci4' ? ' = ' : '=';
    salida.push({
      tipo: 'variable',
      clave,
      valor,
      comillas: null,
      resto: '',
      prefijo: '',
      igual,
      crudo: `${clave}${igual}${formatear(valor, null, estilo)}${eol}`,
    });
  }
  return salida;
}

/** `CLAVE=valor` para el diff, con el valor enmascarado si es secreto. */
function lineaDiff(clave: string, valor: string): string {
  return `${clave}=${esSecreta(clave, valor) ? enmascarar(valor) : valor}`;
}

/**
 * Diff de lo que cambiaría, con los secretos enmascarados (`••••<4 últimos>`): solo las variables
 * tocadas, en el formato que muestra `VistaDiff` (`@@`, `-`, `+`). Sin cambios, vacío.
 */
export function diffTexto(antes: readonly LineaEnv[], despues: readonly LineaEnv[]): string {
  const valores = (ls: readonly LineaEnv[]): Map<string, string> => {
    const m = new Map<string, string>();
    for (const l of ls) if (l.tipo === 'variable' && !m.has(l.clave!)) m.set(l.clave!, l.valor!);
    return m;
  };
  const a = valores(antes);
  const b = valores(despues);
  const salida: string[] = [];
  for (const clave of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(clave);
    const y = b.get(clave);
    if (x === y) continue;
    if (x !== undefined) salida.push(`-${lineaDiff(clave, x)}`);
    if (y !== undefined) salida.push(`+${lineaDiff(clave, y)}`);
  }
  return salida.length === 0 ? '' : ['@@ .env @@', ...salida].join('\n');
}

export { escribirEnv, leerEnv };

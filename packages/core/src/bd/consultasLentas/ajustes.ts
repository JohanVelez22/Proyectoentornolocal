import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../../errores';
import type { Rutas } from '../../rutas';

/** Umbral de «lenta» (s): entre 0,1 y 60, con 1 por defecto. */
export const SEGUNDOS_MIN = 0.1;
export const SEGUNDOS_MAX = 60;
export const SEGUNDOS_DEFECTO = 1;

export interface AjusteLentas {
  activo: boolean;
  segundos: number;
}

/** Un umbral válido (décimas de segundo) o el error del catálogo. */
export function validarSegundos(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < SEGUNDOS_MIN || v > SEGUNDOS_MAX) {
    throw new ErrorWolf(
      'bd.lentas_umbral_invalido',
      'El tiempo debe estar entre 0,1 y 60 segundos.',
    );
  }
  return Math.round(v * 10) / 10;
}

/**
 * Carpeta del slow log de MySQL/MariaDB: `logs/lentas/`. El visor de registros y el MCP solo
 * recorren los `.log` de `logs/` (no sus subcarpetas), así que este archivo, que lleva SQL con sus
 * literales, nunca es una fuente de registro.
 */
export function carpetaLogLento(rutas: Rutas): string {
  return rutas.logs('lentas');
}

/** Archivo del slow log de MySQL/MariaDB de una instancia (dentro de `logs/lentas/`). */
export function rutaLogLento(rutas: Rutas, servicio: string, claveDatos: string): string {
  return rutas.logs('lentas', `${servicio}-${claveDatos}.log`);
}

/** Ubicación antigua (`logs/lentas-<servicio>-<clave>.log`), que sí era visible como fuente. */
export function rutaLogLentoAntigua(rutas: Rutas, servicio: string, claveDatos: string): string {
  return rutas.logs(`lentas-${servicio}-${claveDatos}.log`);
}

/**
 * Ajuste persistente de MySQL/MariaDB: va junto al my.ini de la instancia, que WolfCore regenera en
 * cada arranque y lee este archivo para escribir `slow_query_log`, `long_query_time` y
 * `slow_query_log_file`.
 */
export function rutaAjuste(rutas: Rutas, servicio: string, claveDatos: string): string {
  return path.join(rutas.base, 'etc', servicio, claveDatos, 'consultas-lentas.json');
}

export async function leerAjuste(ruta: string): Promise<AjusteLentas | null> {
  try {
    const x = JSON.parse(await readFile(ruta, 'utf8')) as Partial<AjusteLentas>;
    if (typeof x.activo !== 'boolean') return null;
    return { activo: x.activo, segundos: validarSegundos(x.segundos ?? SEGUNDOS_DEFECTO) };
  } catch {
    return null;
  }
}

export async function guardarAjuste(ruta: string, a: AjusteLentas): Promise<void> {
  await mkdir(path.dirname(ruta), { recursive: true });
  // Nombre único: dos cambios a la vez (o dos procesos) no pisan el temporal del otro.
  const tmp = `${ruta}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(a), 'utf8');
    await rename(tmp, ruta);
  } catch (e) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
}

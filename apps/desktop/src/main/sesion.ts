import { join } from 'node:path';
import {
  restaurarUrlBaseSincrono,
  validarCarpetaDatos,
  VARIABLE_DATOS,
  type Rutas,
} from '@pel/core';

/** Fin de sesión o apagado de Windows: el sistema no espera mucho más. */
export const TOPE_CIERRE_FIN_SESION_MS = 5_000;
/**
 * Salida pedida (before-quit) sin fin de sesión: hay tiempo para el apagado limpio de las bases
 * (cada una espera hasta 10 s a que su proceso termine; ahora en paralelo) más nginx y PHP.
 */
export const TOPE_CIERRE_SALIDA_MS = 20_000;

/** Margen para apagar los servicios al cerrar sin diálogo. */
export function topeCierre(finDeSesion: boolean): number {
  return finDeSesion ? TOPE_CIERRE_FIN_SESION_MS : TOPE_CIERRE_SALIDA_MS;
}

export interface EmisorSesion {
  on(evento: 'query-session-end' | 'session-end', fn: () => void): unknown;
}

/**
 * Cierre de sesión o apagado de Windows: no hay garantía de que las promesas terminen, así que
 * primero se devuelven los .env de forma SÍNCRONA (lo crítico: son configuraciones reales de
 * clientes) y solo después se intenta, con lo que dé tiempo, cerrar los procesos.
 *
 * - `query-session-end`: Windows pregunta si puede cerrar; se restauran los .env ya.
 * - `session-end`: la sesión termina; se restaura lo que quede y se apagan los procesos.
 */
export function registrarFinDeSesion(
  ventana: EmisorSesion,
  rutas: () => Rutas,
  apagar: () => void,
  restaurar: (r: Rutas) => string[] = restaurarUrlBaseSincrono,
): void {
  const devolverEnv = (): void => {
    try {
      for (const aviso of restaurar(rutas())) console.warn(aviso);
    } catch (e) {
      console.error('No se pudieron restaurar los .env al cerrar sesión:', e);
    }
  };
  ventana.on('query-session-end', devolverEnv);
  ventana.on('session-end', () => {
    devolverEnv();
    apagar();
  });
}

/**
 * Carpeta de datos de `WOLFCORE_DATOS` (D26: "PC nuevo" y pruebas manuales), ya validada contra la
 * carpeta real (`real`): absoluta, no del sistema y nunca la real ni una que la contenga. null sin
 * la variable. Lanza `perfiles.carpeta_datos_invalida` si no sirve: la app no arranca con ella.
 */
export function carpetaDatosDeEntorno(env: NodeJS.ProcessEnv, real: string): string | null {
  const v = env[VARIABLE_DATOS];
  if (v === undefined || v.trim() === '') return null;
  return validarCarpetaDatos(v, real);
}

export interface AppConRutas {
  setPath(nombre: 'userData', ruta: string): void;
}

/**
 * Con otra carpeta de datos, Electron también guarda lo suyo (caché, almacenamiento de la ventana,
 * el candado de instancia única) en `<base>/electron`: se llama antes de
 * `requestSingleInstanceLock`, así una app de prueba no choca con la real ni toca su `userData`.
 */
export function usarCarpetaDatos(app: AppConRutas, base: string): string {
  const userData = join(base, 'electron');
  app.setPath('userData', userData);
  return userData;
}

import { restaurarUrlBaseSincrono, type Rutas } from '@pel/core';

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

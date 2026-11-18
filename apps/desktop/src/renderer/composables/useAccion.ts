import { useMessage, useNotification } from 'naive-ui';
import { reactive } from 'vue';
import { es } from '../i18n/es';

export function mensajeDeError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'string' && e) return e;
  return es.errores.desconocido;
}

interface OpcionesAccion {
  /** Mensaje breve si sale bien. */
  exito?: string;
  /** Título de la notificación si falla. */
  tituloError?: string;
}

/**
 * Envuelve una llamada al núcleo: marca la clave como ocupada y, si falla, muestra el mensaje
 * claro del núcleo en una notificación (nunca una traza).
 */
export function useAccion() {
  const notification = useNotification();
  const message = useMessage();
  const ocupadas = reactive(new Set<string>());

  async function ejecutar<T>(
    clave: string,
    fn: () => Promise<T>,
    opciones: OpcionesAccion = {},
  ): Promise<T | undefined> {
    ocupadas.add(clave);
    try {
      const r = await fn();
      if (opciones.exito) message.success(opciones.exito);
      return r;
    } catch (e) {
      // Detenido a propósito mientras arrancaba: es una parada normal, no un error.
      if ((e as { codigo?: unknown } | null)?.codigo === 'detenido-al-iniciar') return undefined;
      notification.error({
        title: opciones.tituloError ?? es.errores.titulo,
        content: mensajeDeError(e),
        duration: 10000,
        keepAliveOnHover: true,
      });
      return undefined;
    } finally {
      ocupadas.delete(clave);
    }
  }

  const ocupado = (clave: string): boolean => ocupadas.has(clave);

  return { ejecutar, ocupado };
}

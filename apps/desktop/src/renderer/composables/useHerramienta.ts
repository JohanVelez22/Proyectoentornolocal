import { useMessage } from 'naive-ui';
import type { TrabajadorHerramienta } from '../utilidades/herramientas';
import { api } from '../api';
import { es } from '../i18n/es';

/** Worker nuevo por operación: si se cuelga, se termina sin afectar a las siguientes. */
export function crearTrabajador(): TrabajadorHerramienta {
  return new Worker(new URL('../utilidades/herramientas.worker.ts', import.meta.url), {
    type: 'module',
  }) as unknown as TrabajadorHerramienta;
}

/** Copiar al portapapeles con aviso breve. */
export function useCopiar() {
  const message = useMessage();
  return async (texto: string): Promise<void> => {
    try {
      await api().sistema.copiar(texto);
      message.success(es.herramientas.copiado);
    } catch (e) {
      message.error((e as Error).message || es.errores.desconocido);
    }
  };
}

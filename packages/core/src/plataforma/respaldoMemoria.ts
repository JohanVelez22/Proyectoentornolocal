import { ErrorWolf } from '../errores';
import type { CapacidadesPlataforma } from './tipos';

/**
 * Respaldo neutro de las capacidades del optimizador de RAM (D36) para sistemas que aún no las
 * tienen (todo lo que no sea Windows): no hay procesos que listar, no se cierra nada y la
 * identidad no se puede dar, con un error del catálogo (nunca un `Error` crudo).
 */
const noDisponible = (): ErrorWolf =>
  new ErrorWolf('memoria.no_disponible', 'El optimizador de memoria no está disponible aquí.');

export const RESPALDO_MEMORIA_NEUTRO: Pick<
  CapacidadesPlataforma,
  | 'procesosDelUsuario'
  | 'cerrarVentanaPrincipal'
  | 'identidadActual'
  | 'rutasProtegidas'
  | 'conexionesActivas'
  | 'rutasLimpieza'
  | 'navegadoresAbiertos'
  | 'esAdministrador'
  | 'aPapelera'
  | 'registrarPapelera'
> = {
  procesosDelUsuario: async () => [],
  cerrarVentanaPrincipal: async () => 'no-se-pudo',
  identidadActual: async () => {
    throw noDisponible();
  },
  rutasProtegidas: () => [],
  // Sin poder leer las conexiones no se sabe si algo está en uso: quien llama no actúa.
  conexionesActivas: async () => {
    throw noDisponible();
  },
  // Limpieza de disco (D37): fuera de Windows aún no hay rutas conocidas, así que no hay nada.
  rutasLimpieza: async () => [],
  navegadoresAbiertos: async () => [],
  esAdministrador: async () => false,
  aPapelera: async () => false,
  registrarPapelera: () => undefined,
};

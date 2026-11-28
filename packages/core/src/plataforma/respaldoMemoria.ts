import { equipoDesconocido } from '../equipo/tipos';
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
  | 'inicioDeProceso'
  | 'inicioAnteriorA'
  | 'identidadActual'
  | 'rutasProtegidas'
  | 'conexionesActivas'
  | 'memoriaDelSistema'
  | 'vaciarWorkingSets'
  | 'purgarListaEspera'
  | 'estadoPantalla'
  | 'rutasLimpieza'
  | 'navegadoresAbiertos'
  | 'esAdministrador'
  | 'unidadesLocales'
  | 'infoEquipo'
  | 'saludDiscos'
  | 'saludDiscosAdmin'
  | 'eventosDisco'
  | 'aPapelera'
  | 'registrarPapelera'
  | 'carpetasCompartidas'
  | 'dejarDeCompartir'
  | 'adaptadoresRed'
  | 'vecinosRed'
  | 'pingEquipo'
  | 'recursosDeEquipo'
> = {
  procesosDelUsuario: async () => [],
  cerrarVentanaPrincipal: async () => 'no-se-pudo',
  inicioDeProceso: async () => {
    throw noDisponible();
  },
  inicioAnteriorA: () => false,
  identidadActual: async () => {
    throw noDisponible();
  },
  rutasProtegidas: () => [],
  // Sin poder leer las conexiones no se sabe si algo está en uso: quien llama no actúa.
  conexionesActivas: async () => {
    throw noDisponible();
  },
  // Liberar memoria (D54b): fuera de Windows aún no hay lectura ni vaciado (Etapa E).
  memoriaDelSistema: async () => null,
  vaciarWorkingSets: async () => [],
  purgarListaEspera: async () => ({
    ok: false,
    motivo: 'error',
    detalle: 'no disponible en este sistema',
  }),
  estadoPantalla: async () => null,
  // Limpieza de disco (D37): fuera de Windows aún no hay rutas conocidas, así que no hay nada.
  rutasLimpieza: async () => [],
  navegadoresAbiertos: async () => [],
  esAdministrador: async () => false,
  unidadesLocales: async () => [],
  infoEquipo: async () => equipoDesconocido(),
  // Salud de los discos (D57): fuera de Windows aún no hay lectura (Etapa E).
  saludDiscos: async () => null,
  saludDiscosAdmin: async () => ({
    ok: false,
    motivo: 'error',
    detalle: 'La salud de los discos no está disponible en este sistema',
  }),
  eventosDisco: async () => null,
  aPapelera: async () => false,
  registrarPapelera: () => undefined,
  // «Mi red» (D53): fuera de Windows aún no hay lectura de la red ni se cambia nada.
  carpetasCompartidas: async () => null,
  dejarDeCompartir: async () => ({
    ok: false,
    motivo: 'error',
    detalle: 'Mi red no está disponible en este sistema',
  }),
  adaptadoresRed: async () => null,
  vecinosRed: async () => null,
  pingEquipo: async (_ip, o) => ({
    enviados: o.intentos,
    recibidos: 0,
    tiemposMs: [],
    cancelado: false,
  }),
  recursosDeEquipo: async () => ({ ok: false, motivo: 'error' }),
};

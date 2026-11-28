/**
 * Lo que el renderer usa de `@pel/core` en tiempo de ejecución (sus tipos salen del índice). La
 * ventana no puede cargar el índice entero: arrastra el cliente de MySQL, el cifrado de Node y `Buffer`, que no
 * existen en una página, y la dejaba en blanco. Solo funciones y constantes puras.
 */
export { fuenteFirmaDe } from './catalogo/huellas';
export {
  alcanceDe,
  dominioPublicoValido,
  modoTailscaleDe,
  nombreTunelValido,
  tokenTunelValido,
} from './tuneles/proveedor';
export {
  ATAJO_CAPTURA_POR_DEFECTO,
  BYTES_TEXTO_DIFF,
  IDIOMAS_UI,
  MAX_BYTES_EDITOR,
} from './constantesUi';
export {
  MAX_COLECCION_HTTP,
  MAX_CURL,
  MAX_HISTORIAL_HTTP,
  METODOS_HTTP,
  PLAZO_HTTP_DEFECTO_SEG,
  PLAZO_HTTP_MAX_SEG,
} from './clientehttp/tipos';
export { esNombreSecreto, esSoloVariables } from './clientehttp/sensibles';
export { nombreDeRuta, segmentosDeRuta } from './rutas/nombreDeRuta';
export { PLAN_VELOCIDAD } from './miRed/velocidad';

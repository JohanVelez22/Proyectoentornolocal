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
export { ATAJO_CAPTURA_POR_DEFECTO, IDIOMAS_UI } from './tipos';

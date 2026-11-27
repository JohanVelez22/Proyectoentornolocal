/// <reference types="vite/client" />
import type { ApiEntorno } from '../shared/api';
import type { ApiVentanaCaptura } from '../shared/captura';

declare global {
  interface Window {
    entorno: ApiEntorno;
    /** Solo existe en la ventana de captura (D35). */
    captura: ApiVentanaCaptura;
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const componente: DefineComponent<object, object, unknown>;
  export default componente;
}

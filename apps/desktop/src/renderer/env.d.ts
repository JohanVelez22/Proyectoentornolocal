/// <reference types="vite/client" />
import type { ApiEntorno } from '../shared/api';

declare global {
  interface Window {
    entorno: ApiEntorno;
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const componente: DefineComponent<object, object, unknown>;
  export default componente;
}

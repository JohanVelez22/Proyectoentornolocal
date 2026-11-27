import { contextBridge, ipcRenderer } from 'electron';
import { CANALES_CAPTURA, type ApiVentanaCaptura } from '../shared/captura';

/**
 * Puente de la ventana de captura (D35): solo lo que el editor necesita, por canales propios que
 * el proceso principal atiende únicamente para esa ventana. Sin Node, sin red.
 */
const api: ApiVentanaCaptura = {
  datos: () => ipcRenderer.invoke(CANALES_CAPTURA.datos),
  ventana: (id) => ipcRenderer.invoke(CANALES_CAPTURA.ventana, id),
  copiar: (bytes) => ipcRenderer.invoke(CANALES_CAPTURA.copiar, bytes),
  guardar: (bytes, formato) => ipcRenderer.invoke(CANALES_CAPTURA.guardar, bytes, formato),
  alConversor: (bytes) => ipcRenderer.invoke(CANALES_CAPTURA.alConversor, bytes),
  cerrar: () => ipcRenderer.invoke(CANALES_CAPTURA.cerrar),
};

contextBridge.exposeInMainWorld('captura', api);

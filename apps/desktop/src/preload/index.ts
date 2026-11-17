import { contextBridge, ipcRenderer } from 'electron';
import {
  CANAL_EVENTO,
  EVENTOS_IPC,
  PREFIJO_CANAL,
  type ApiEntorno,
  type ResultadoIpc,
  type RutaIpc,
} from '../shared/api';

async function invocar<T>(ruta: RutaIpc, ...args: unknown[]): Promise<T> {
  const r = (await ipcRenderer.invoke(`${PREFIJO_CANAL}${ruta}`, ...args)) as ResultadoIpc<T>;
  if (!r.ok) {
    const e = new Error(r.error.mensaje) as Error & { codigo?: string };
    if (r.error.codigo) e.codigo = r.error.codigo;
    throw e;
  }
  return r.valor;
}

const api: ApiEntorno = {
  estadoGeneral: () => invocar('estadoGeneral'),
  carpetaDatos: () => invocar('carpetaDatos'),
  sitios: {
    listar: () => invocar('sitios.listar'),
    guardar: (datos, id) => invocar('sitios.guardar', datos, id),
    borrar: (id) => invocar('sitios.borrar', id),
    aplicar: () => invocar('sitios.aplicar'),
  },
  servicios: {
    estados: () => invocar('servicios.estados'),
    iniciar: (id) => invocar('servicios.iniciar', id),
    detener: (id) => invocar('servicios.detener', id),
    iniciarTodo: () => invocar('servicios.iniciarTodo'),
    detenerTodo: () => invocar('servicios.detenerTodo'),
  },
  instalador: {
    listarVersiones: (s) => invocar('instalador.listarVersiones', s),
    instalar: (v) => invocar('instalador.instalar', v),
    instalados: (s) => invocar('instalador.instalados', s),
  },
  tuneles: {
    abrir: (id) => invocar('tuneles.abrir', id),
    cerrar: (id) => invocar('tuneles.cerrar', id),
    renovar: (id) => invocar('tuneles.renovar', id),
    estados: () => invocar('tuneles.estados'),
  },
  hosts: { sincronizar: () => invocar('hosts.sincronizar') },
  detectarProyecto: (carpeta) => invocar('detectarProyecto', carpeta),
  config: {
    leer: () => invocar('config.leer'),
    guardar: (c) => invocar('config.guardar', c),
  },
  sistema: {
    elegirCarpeta: () => invocar('sistema.elegirCarpeta'),
    abrirUrl: (url) => invocar('sistema.abrirUrl', url),
    abrirCarpeta: (ruta) => invocar('sistema.abrirCarpeta', ruta),
    copiar: (texto) => invocar('sistema.copiar', texto),
    version: () => invocar('sistema.version'),
  },
  on(nombre, fn) {
    if (!(EVENTOS_IPC as readonly string[]).includes(nombre)) return () => undefined;
    const oyente = (_e: unknown, m: { nombre: string; dato: never }): void => {
      if (m.nombre === nombre) fn(m.dato);
    };
    ipcRenderer.on(CANAL_EVENTO, oyente);
    return () => {
      ipcRenderer.removeListener(CANAL_EVENTO, oyente);
    };
  },
};

contextBridge.exposeInMainWorld('entorno', api);

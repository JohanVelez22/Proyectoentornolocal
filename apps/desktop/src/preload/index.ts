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
    cambiarPuerto: (id, puerto) => invocar('servicios.cambiarPuerto', id, puerto),
    borrarDatos: (id, confirmacion) => invocar('servicios.borrarDatos', id, confirmacion),
    autoIniciar: (id, valor) => invocar('servicios.autoIniciar', id, valor),
  },
  bd: {
    listar: (motor) => invocar('bd.listar', motor),
    crear: (motor, nombre, opciones) => invocar('bd.crear', motor, nombre, opciones),
    borrar: (motor, nombre, confirmacion) => invocar('bd.borrar', motor, nombre, confirmacion),
    conexion: (motor) => invocar('bd.conexion', motor),
    bloqueEnv: (motor, base, tipo, envActual) =>
      invocar('bd.bloqueEnv', motor, base, tipo, envActual),
    tieneTablas: (motor, base) => invocar('bd.tieneTablas', motor, base),
    formato: (archivo) => invocar('bd.formato', archivo),
    restaurar: (motor, archivo, base, opciones) =>
      invocar('bd.restaurar', motor, archivo, base, opciones),
    respaldar: (motor, base, carpeta) => invocar('bd.respaldar', motor, base, carpeta),
    importar: (motor, origen, destino, opciones) =>
      invocar('bd.importar', motor, origen, destino, opciones),
  },
  pgvector: {
    estado: () => invocar('pgvector.estado'),
    instalarBuildTools: () => invocar('pgvector.instalarBuildTools'),
    compilarEInstalar: () => invocar('pgvector.compilarEInstalar'),
    activar: (base) => invocar('pgvector.activar', base),
  },
  https: {
    estado: () => invocar('https.estado'),
    instalarCA: () => invocar('https.instalarCA'),
    quitarCA: () => invocar('https.quitarCA'),
    cambiarPuerto: (puerto) => invocar('https.cambiarPuerto', puerto),
  },
  composer: {
    version: () => invocar('composer.version'),
    instalar: () => invocar('composer.instalar'),
    actualizar: () => invocar('composer.actualizar'),
    cambiarPhpPorDefecto: (rama) => invocar('composer.cambiarPhpPorDefecto', rama),
  },
  terminal: { abrir: (id) => invocar('terminal.abrir', id) },
  path: {
    estado: () => invocar('path.estado'),
    cambiar: (activar) => invocar('path.cambiar', activar),
  },
  adminer: {
    instalar: () => invocar('adminer.instalar'),
    disponibilidad: () => invocar('adminer.disponibilidad'),
    url: (motor, usuario) => invocar('adminer.url', motor, usuario),
  },
  ftp: {
    activar: (id) => invocar('ftp.activar', id),
    desactivar: (id) => invocar('ftp.desactivar', id),
    regenerarClave: (id) => invocar('ftp.regenerarClave', id),
    soloLectura: (id, valor) => invocar('ftp.soloLectura', id, valor),
    credenciales: (id) => invocar('ftp.credenciales', id),
    redLocal: (valor) => invocar('ftp.redLocal', valor),
  },
  ia: {
    modelos: () => invocar('ia.modelos'),
    descargar: (nombre) => invocar('ia.descargar', nombre),
    cancelar: (nombre) => invocar('ia.cancelar', nombre),
    borrar: (nombre) => invocar('ia.borrar', nombre),
    probar: (nombre, texto) => invocar('ia.probar', nombre, texto),
    espacioUsado: () => invocar('ia.espacioUsado'),
    bloqueEnv: () => invocar('ia.bloqueEnv'),
    sugeridos: () => invocar('ia.sugeridos'),
  },
  mailpit: { noLeidos: () => invocar('mailpit.noLeidos') },
  avisoInicio: () => invocar('avisoInicio'),
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
  },
  ajustes: {
    guardar: (a) => invocar('ajustes.guardar', a),
  },
  sistema: {
    elegirCarpeta: () => invocar('sistema.elegirCarpeta'),
    elegirArchivo: () => invocar('sistema.elegirArchivo'),
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

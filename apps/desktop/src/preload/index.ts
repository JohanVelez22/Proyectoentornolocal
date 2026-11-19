import { contextBridge, ipcRenderer } from 'electron';
import {
  CANAL_EVENTO,
  EVENTOS_IPC,
  PREFIJO_CANAL,
  type ApiEntorno,
  type DatosError,
  type ResultadoIpc,
  type RutaIpc,
} from '../shared/api';
import { crearBusEventos } from './eventos';

const bus = crearBusEventos(ipcRenderer, CANAL_EVENTO, EVENTOS_IPC);

async function invocar<T>(ruta: RutaIpc, ...args: unknown[]): Promise<T> {
  const r = (await ipcRenderer.invoke(`${PREFIJO_CANAL}${ruta}`, ...args)) as ResultadoIpc<T>;
  if (!r.ok) {
    const e = new Error(r.error.mensaje) as Error & { codigo?: string; datos?: DatosError };
    if (r.error.codigo) e.codigo = r.error.codigo;
    if (r.error.datos) e.datos = r.error.datos;
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
    bloqueEnvSitio: (sitioId, motor, base) => invocar('bd.bloqueEnvSitio', sitioId, motor, base),
    carpetaRespaldos: () => invocar('bd.carpetaRespaldos'),
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
  avisos: {
    lista: () => invocar('avisos.lista'),
    marcarLeidos: (ids) => invocar('avisos.marcarLeidos', ids),
    limpiar: () => invocar('avisos.limpiar'),
  },
  sistema: {
    elegirCarpeta: () => invocar('sistema.elegirCarpeta'),
    elegirArchivo: () => invocar('sistema.elegirArchivo'),
    abrirUrl: (url) => invocar('sistema.abrirUrl', url),
    abrirCarpeta: (ruta) => invocar('sistema.abrirCarpeta', ruta),
    copiar: (texto) => invocar('sistema.copiar', texto),
    version: () => invocar('sistema.version'),
    guardarArchivo: (nombre) => invocar('sistema.guardarArchivo', nombre),
    elegirArchivos: () => invocar('sistema.elegirArchivos'),
    abrirEditor: (sitioId) => invocar('sistema.abrirEditor', sitioId),
  },
  proyectos: {
    detectar: (carpeta) => invocar('proyectos.detectar', carpeta),
    configLeer: (carpeta) => invocar('proyectos.configLeer', carpeta),
    configGuardar: (sitioId, config) => invocar('proyectos.configGuardar', sitioId, config),
    recetaPorDefecto: (carpeta) => invocar('proyectos.recetaPorDefecto', carpeta),
    ejecutarReceta: (sitioId, opciones) => invocar('proyectos.ejecutarReceta', sitioId, opciones),
    omitirPaso: (sitioId, pasoId) => invocar('proyectos.omitirPaso', sitioId, pasoId),
    estadoReceta: (sitioId) => invocar('proyectos.estadoReceta', sitioId),
    cancelarReceta: (sitioId) => invocar('proyectos.cancelarReceta', sitioId),
    resumenReceta: (sitioId) => invocar('proyectos.resumenReceta', sitioId),
    crearSitio: (datos, receta) => invocar('proyectos.crearSitio', datos, receta),
    confiar: (sitioId) => invocar('proyectos.confiar', sitioId),
  },
  git: {
    disponible: () => invocar('git.disponible'),
    clonar: (url, destino) => invocar('git.clonar', url, destino),
    estado: (sitioId) => invocar('git.estado', sitioId),
    traerCambios: (sitioId) => invocar('git.traerCambios', sitioId),
  },
  github: {
    repos: (opciones) => invocar('github.repos', opciones),
    guardarToken: (token) => invocar('github.guardarToken', token),
    borrarToken: () => invocar('github.borrarToken'),
    hayToken: () => invocar('github.hayToken'),
    instalarGh: () => invocar('github.instalarGh'),
    iniciarSesionGh: () => invocar('github.iniciarSesionGh'),
  },
  runtimes: {
    instalados: (tipo) => invocar('runtimes.instalados', tipo),
    proyecto: (sitioId) => invocar('runtimes.proyecto', sitioId),
  },
  procesos: {
    iniciar: (sitioId, procesoId) => invocar('procesos.iniciar', sitioId, procesoId),
    detener: (sitioId, procesoId) => invocar('procesos.detener', sitioId, procesoId),
    estados: (sitioId) => invocar('procesos.estados', sitioId),
  },
  preferencias: {
    leer: () => invocar('preferencias.leer'),
    guardar: (cambios) => invocar('preferencias.guardar', cambios),
  },
  vigilar: {
    sugerencias: () => invocar('vigilar.sugerencias'),
    cambiarCarpeta: (carpeta) => invocar('vigilar.cambiarCarpeta', carpeta),
  },
  metricas: {
    iniciar: () => invocar('metricas.iniciar'),
    pausar: () => invocar('metricas.pausar'),
    ultimos: (min) => invocar('metricas.ultimos', min),
  },
  registros: {
    fuentes: () => invocar('registros.fuentes'),
    seguir: (id) => invocar('registros.seguir', id),
    dejar: (id) => invocar('registros.dejar', id),
    leerFinal: (id, lineas) => invocar('registros.leerFinal', id, lineas),
    abrirCarpeta: (id) => invocar('registros.abrirCarpeta', id),
  },
  herramientas: {
    puertos: () => invocar('herramientas.puertos'),
    finalizarProceso: (pid, confirmacion, opciones) =>
      invocar('herramientas.finalizarProceso', pid, confirmacion, opciones),
    limpiarBom: (rutas, simular) => invocar('herramientas.limpiarBom', rutas, simular),
    emitirCertificado: (dominios, destino) =>
      invocar('herramientas.emitirCertificado', dominios, destino),
    entorno: () => invocar('herramientas.entorno'),
  },
  mcp: {
    estado: () => invocar('mcp.estado'),
    iniciar: () => invocar('mcp.iniciar'),
    detener: () => invocar('mcp.detener'),
    cambiarPuerto: (puerto) => invocar('mcp.cambiarPuerto', puerto),
    configuracion: () => invocar('mcp.configuracion'),
    regenerarToken: () => invocar('mcp.regenerarToken'),
    responderConfirmacion: (id, aprobado) => invocar('mcp.responderConfirmacion', id, aprobado),
  },
  on: (nombre, fn) => bus.on(nombre, fn as (dato: never) => void),
};

contextBridge.exposeInMainWorld('entorno', api);

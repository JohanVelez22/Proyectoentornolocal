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
    phpSitio: (id) => invocar('sitios.phpSitio', id),
    guardarPhpIni: (id, valores) => invocar('sitios.guardarPhpIni', id, valores),
    xdebug: (id, x) => invocar('sitios.xdebug', id, x),
    launchJsonVista: (id) => invocar('sitios.launchJsonVista', id),
    launchJson: (id) => invocar('sitios.launchJson', id),
  },
  nginx: {
    vista: (id) => invocar('nginx.vista', id),
    aplicar: (id, cambio) => invocar('nginx.aplicar', id, cambio),
    historial: (id) => invocar('nginx.historial', id),
    restaurar: (id, version) => invocar('nginx.restaurar', id, version),
    snippets: () => invocar('nginx.snippets'),
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
    planActualizar: (id) => invocar('servicios.planActualizar', id),
    actualizar: (id, v, o) => invocar('servicios.actualizar', id, v, o),
    nuevaRama: (s, v, o) => invocar('servicios.nuevaRama', s, v, o),
    predeterminada: (s, v) => invocar('servicios.predeterminada', s, v),
    respaldosDatos: (s) => invocar('servicios.respaldosDatos', s),
    borrarRespaldoDatos: (r, c) => invocar('servicios.borrarRespaldoDatos', r, c),
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
  terminal: {
    abrir: (id, terminal) => invocar('terminal.abrir', id, terminal ?? null),
    disponibles: () => invocar('terminal.disponibles'),
    cambiarPorDefecto: (terminal) => invocar('terminal.cambiarPorDefecto', terminal),
  },
  path: {
    estado: () => invocar('path.estado'),
    cambiar: (activar) => invocar('path.cambiar', activar),
  },
  adminer: {
    instalar: () => invocar('adminer.instalar'),
    disponibilidad: () => invocar('adminer.disponibilidad'),
    url: (motor, usuario) => invocar('adminer.url', motor, usuario),
    proyecto: (id) => invocar('adminer.proyecto', id),
  },
  ftp: {
    activar: (id) => invocar('ftp.activar', id),
    desactivar: (id) => invocar('ftp.desactivar', id),
    regenerarClave: (id) => invocar('ftp.regenerarClave', id),
    soloLectura: (id, valor) => invocar('ftp.soloLectura', id, valor),
    credenciales: (id) => invocar('ftp.credenciales', id),
    url: (id) => invocar('ftp.url', id),
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
    proveedores: () => invocar('ia.proveedores'),
    guardarProveedor: (proveedor, confirmarCambioUrl) =>
      invocar('ia.guardarProveedor', proveedor, confirmarCambioUrl),
    borrarProveedor: (id, opciones) => invocar('ia.borrarProveedor', id, opciones),
    guardarClave: (id, clave) => invocar('ia.guardarClave', id, clave),
    borrarClave: (id, opciones) => invocar('ia.borrarClave', id, opciones),
    estadoClave: (id) => invocar('ia.estadoClave', id),
    respaldosClave: (id) => invocar('ia.respaldosClave', id),
    probarConexion: (id) => invocar('ia.probarConexion', id),
    probarMensaje: (id, modelo, confirmacion) =>
      invocar('ia.probarMensaje', id, modelo, confirmacion),
    previsualizarEnv: (sitioId, proveedorId, modelo) =>
      invocar('ia.previsualizarEnv', sitioId, proveedorId, modelo),
    escribirEnv: (sitioId, proveedorId, opciones) =>
      invocar('ia.escribirEnv', sitioId, proveedorId, opciones),
  },
  mailpit: { noLeidos: () => invocar('mailpit.noLeidos') },
  avisoInicio: () => invocar('avisoInicio'),
  instalador: {
    listarVersiones: (s, filtro) => invocar('instalador.listarVersiones', s, filtro),
    instalar: (v) => invocar('instalador.instalar', v),
    instalados: (s) => invocar('instalador.instalados', s),
    desinstalar: (s, v) => invocar('instalador.desinstalar', s, v),
  },
  catalogo: {
    versiones: (s, filtro) => invocar('catalogo.versiones', s, filtro),
    silenciar: (s, v) => invocar('catalogo.silenciar', s, v),
  },
  instancias: {
    lista: (s) => invocar('instancias.lista', s),
    crear: (s, v) => invocar('instancias.crear', s, v),
    iniciar: (id) => invocar('instancias.iniciar', id),
    detener: (id) => invocar('instancias.detener', id),
    puerto: (id, p) => invocar('instancias.puerto', id, p),
    predeterminar: (id) => invocar('instancias.predeterminar', id),
    quitar: (id) => invocar('instancias.quitar', id),
    borrarDatos: (id, c) => invocar('instancias.borrarDatos', id, c),
    desbloquear: (id, o) => invocar('instancias.desbloquear', id, o),
  },
  tuneles: {
    abrir: (id, confirmado) => invocar('tuneles.abrir', id, confirmado === true),
    cerrar: (id) => invocar('tuneles.cerrar', id),
    renovar: (id, confirmado) => invocar('tuneles.renovar', id, confirmado === true),
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
  depuracion: {
    estado: () => invocar('depuracion.estado'),
    activar: (activa) => invocar('depuracion.activar', activa),
    captura: (sitioId, activa, confirmacion) =>
      invocar('depuracion.captura', sitioId, activa, confirmacion),
    lista: (filtro) => invocar('depuracion.lista', filtro),
    leer: (id) => invocar('depuracion.leer', id),
    limpiar: () => invocar('depuracion.limpiar'),
    copiar: (id) => invocar('depuracion.copiar', id),
  },
  errores: {
    lista: (filtro) => invocar('errores.lista', filtro),
    leer: (huella) => invocar('errores.leer', huella),
  },
  editor: {
    abrirEn: (sitioId, archivo, linea) => invocar('editor.abrirEn', sitioId, archivo, linea),
  },
  contenedores: {
    motores: () => invocar('contenedores.motores'),
    lista: (motor) => invocar('contenedores.lista', motor),
    accion: (motor, id, accion, confirmacion) =>
      invocar('contenedores.accion', motor, id, accion, confirmacion),
    seguir: (motor, id) => invocar('contenedores.seguir', motor, id),
    dejar: (motor, id) => invocar('contenedores.dejar', motor, id),
  },
  avisos: {
    lista: () => invocar('avisos.lista'),
    marcarLeidos: (ids) => invocar('avisos.marcarLeidos', ids),
    limpiar: () => invocar('avisos.limpiar'),
    configurar: (cambios) => invocar('avisos.configurar', cambios),
  },
  doctor: {
    revisar: (ids) => invocar('doctor.revisar', ids),
    reparar: (id, confirmacion, reparacionId) =>
      invocar('doctor.reparar', id, confirmacion, reparacionId),
    ultimo: () => invocar('doctor.ultimo'),
  },
  confianza: {
    estado: () => invocar('confianza.estado'),
    nodeGlobal: (activar, confirmacion) => invocar('confianza.nodeGlobal', activar, confirmacion),
    firefox: (activar, confirmacion, confirmacionFuera) =>
      invocar('confianza.firefox', activar, confirmacion, confirmacionFuera),
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
  agentes: {
    estado: () => invocar('agentes.estado'),
    version: (id) => invocar('agentes.version', id),
    instalar: (id, confirmado) => invocar('agentes.instalar', id, confirmado),
    registrarMcp: (id, confirmado) => invocar('agentes.registrarMcp', id, confirmado),
    quitarMcp: (id, confirmado) => invocar('agentes.quitarMcp', id, confirmado),
    abrir: (id, sitioId, proveedorId) => invocar('agentes.abrir', id, sitioId, proveedorId),
  },
  php: {
    iniLeer: (rama) => invocar('php.iniLeer', rama),
    iniValores: (rama) => invocar('php.iniValores', rama),
    iniConValores: (rama, valores, base) => invocar('php.iniConValores', rama, valores, base),
    iniDiff: (rama, nuevo) => invocar('php.iniDiff', rama, nuevo),
    iniGuardar: (rama, nuevo) => invocar('php.iniGuardar', rama, nuevo),
    iniRespaldos: (rama) => invocar('php.iniRespaldos', rama),
    iniRestaurar: (rama, respaldo) => invocar('php.iniRestaurar', rama, respaldo),
    extensiones: (rama) => invocar('php.extensiones', rama),
    extensionActivar: (rama, nombre, activa) =>
      invocar('php.extensionActivar', rama, nombre, activa),
    extensionInstalar: (rama, nombre) => invocar('php.extensionInstalar', rama, nombre),
  },
  git: {
    disponible: () => invocar('git.disponible'),
    clonar: (url, destino) => invocar('git.clonar', url, destino),
    estado: (sitioId) => invocar('git.estado', sitioId),
    traerCambios: (sitioId) => invocar('git.traerCambios', sitioId),
    sugerirCommit: (sitioId, proveedorId, modelo) =>
      invocar('git.sugerirCommit', sitioId, proveedorId, modelo),
    commitPreparado: (sitioId, mensaje) => invocar('git.commitPreparado', sitioId, mensaje),
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

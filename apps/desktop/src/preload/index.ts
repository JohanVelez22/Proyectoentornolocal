import { contextBridge, ipcRenderer } from 'electron';
import {
  CANAL_EVENTO,
  EVENTOS_IPC,
  PREFIJO_CANAL,
  type ApiEntorno,
  type ResultadoIpc,
  type RutaIpc,
} from '../shared/api';
import { rechazoDe } from '../shared/errorIpc';
import { crearBusEventos } from './eventos';

const bus = crearBusEventos(ipcRenderer, CANAL_EVENTO, EVENTOS_IPC);

async function invocar<T>(ruta: RutaIpc, ...args: unknown[]): Promise<T> {
  const r = (await ipcRenderer.invoke(`${PREFIJO_CANAL}${ruta}`, ...args)) as ResultadoIpc<T>;
  if (!r.ok) {
    // Objeto plano: el puente descartaría `codigo` y `datos` de un Error (ver shared/errorIpc.ts).
    throw rechazoDe(r.error);
  }
  return r.valor;
}

const api: ApiEntorno = {
  estadoGeneral: () => invocar('estadoGeneral'),
  carpetaDatos: () => invocar('carpetaDatos'),
  perfiles: {
    entorno: () => invocar('perfiles.entorno'),
    exportar: (o) => invocar('perfiles.exportar', o),
    vistaPrevia: (archivo, o) => invocar('perfiles.vistaPrevia', archivo, o),
    importar: (archivo, o) => invocar('perfiles.importar', archivo, o),
    quitarCaAnterior: (huella) => invocar('perfiles.quitarCaAnterior', huella),
    instantaneas: () => invocar('perfiles.instantaneas'),
    instantanea: () => invocar('perfiles.instantanea'),
  },
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
  tareas: {
    lista: (sitioId) => invocar('tareas.lista', sitioId),
    estado: () => invocar('tareas.estado'),
    proximas: (cron) => invocar('tareas.proximas', cron),
    permitirAislado: () => invocar('tareas.permitirAislado'),
    guardar: (sitioId, t) => invocar('tareas.guardar', sitioId, t),
    activar: (sitioId, tareaId, activa) => invocar('tareas.activar', sitioId, tareaId, activa),
    confirmar: (sitioId, tareaId, huella) => invocar('tareas.confirmar', sitioId, tareaId, huella),
    borrar: (sitioId, tareaId) => invocar('tareas.borrar', sitioId, tareaId),
    ejecutarAhora: (sitioId, tareaId) => invocar('tareas.ejecutarAhora', sitioId, tareaId),
    historial: (sitioId, tareaId) => invocar('tareas.historial', sitioId, tareaId),
    log: (sitioId, tareaId) => invocar('tareas.log', sitioId, tareaId),
    propuestas: (sitioId) => invocar('tareas.propuestas', sitioId),
    adoptar: (sitioId, id, huella, activar) =>
      invocar('tareas.adoptar', sitioId, id, huella, activar),
    aWolfcoreYml: (sitioId, tareaId) => invocar('tareas.aWolfcoreYml', sitioId, tareaId),
  },
  workspaces: {
    lista: () => invocar('workspaces.lista'),
    estados: () => invocar('workspaces.estados'),
    guardar: (w) => invocar('workspaces.guardar', w),
    borrar: (id) => invocar('workspaces.borrar', id),
    iniciar: (id) => invocar('workspaces.iniciar', id),
    detener: (id) => invocar('workspaces.detener', id),
  },
  servicios: {
    estados: () => invocar('servicios.estados'),
    iniciar: (id) => invocar('servicios.iniciar', id),
    detener: (id) => invocar('servicios.detener', id),
    iniciarTodo: () => invocar('servicios.iniciarTodo'),
    detenerTodo: () => invocar('servicios.detenerTodo'),
    conexion: (ref) => invocar('servicios.conexion', ref),
    revelarSecreto: (ref) => invocar('servicios.revelarSecreto', ref),
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
    revelar: (motor) => invocar('bd.revelar', motor),
    revelarBloqueEnv: (motor, base, sitioId) =>
      invocar('bd.revelarBloqueEnv', motor, base, sitioId),
    bloqueEnv: (motor, base, tipo, envActual) =>
      invocar('bd.bloqueEnv', motor, base, tipo, envActual),
    bloqueEnvSitio: (sitioId, motor, base) => invocar('bd.bloqueEnvSitio', sitioId, motor, base),
    lentasEstado: (motor) => invocar('bd.lentasEstado', motor),
    lentasCambiar: (motor, pedido) => invocar('bd.lentasCambiar', motor, pedido),
    lentasLeer: (motor) => invocar('bd.lentasLeer', motor),
    lentasLiteral: (motor, id) => invocar('bd.lentasLiteral', motor, id),
    esquema: (motor, base) => invocar('bd.esquema', motor, base),
    carpetaRespaldos: () => invocar('bd.carpetaRespaldos'),
    tieneTablas: (motor, base) => invocar('bd.tieneTablas', motor, base),
    formato: (archivo) => invocar('bd.formato', archivo),
    restaurar: (motor, archivo, base, opciones) =>
      invocar('bd.restaurar', motor, archivo, base, opciones),
    respaldar: (motor, base, carpeta) => invocar('bd.respaldar', motor, base, carpeta),
    importar: (motor, origen, destino, opciones) =>
      invocar('bd.importar', motor, origen, destino, opciones),
  },
  instantaneas: {
    lista: (motor, base) => invocar('instantaneas.lista', motor, base),
    tomar: (motor, base, nota) => invocar('instantaneas.tomar', motor, base, nota),
    vistaPrevia: (motor, base, id) => invocar('instantaneas.vistaPrevia', motor, base, id),
    volver: (motor, base, id, nombreEscrito, opciones) =>
      invocar('instantaneas.volver', motor, base, id, nombreEscrito, opciones),
    listaInstancia: (motor) => invocar('instantaneas.listaInstancia', motor),
    papelera: (motor, base) => invocar('instantaneas.papelera', motor, base),
    recuperar: (motor, base, id) => invocar('instantaneas.recuperar', motor, base, id),
    borrar: (motor, base, id) => invocar('instantaneas.borrar', motor, base, id),
  },
  auditoriaClaves: {
    auditar: (motor, base, seleccion) => invocar('auditoriaClaves.auditar', motor, base, seleccion),
    progreso: () => invocar('auditoriaClaves.progreso'),
    cancelar: () => invocar('auditoriaClaves.cancelar'),
    vistaPrevia: (motor, base, seleccion, usuario, aBcrypt) =>
      invocar('auditoriaClaves.vistaPrevia', motor, base, seleccion, usuario, aBcrypt),
    restablecer: (
      motor,
      base,
      seleccion,
      usuario,
      claveNueva,
      usuarioEscrito,
      aBcrypt,
      confirmarDatosReales,
    ) =>
      invocar(
        'auditoriaClaves.restablecer',
        motor,
        base,
        seleccion,
        usuario,
        claveNueva,
        usuarioEscrito,
        aBcrypt,
        confirmarDatosReales,
      ),
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
  cli: {
    estado: () => invocar('cli.estado'),
    cambiarPath: (agregar) => invocar('cli.cambiarPath', agregar),
  },
  adminer: {
    instalar: () => invocar('adminer.instalar'),
    disponibilidad: () => invocar('adminer.disponibilidad'),
    url: (motor, usuario) => invocar('adminer.url', motor, usuario),
    proyecto: (id) => invocar('adminer.proyecto', id),
  },
  phpmyadmin: {
    instalar: () => invocar('phpmyadmin.instalar'),
    disponibilidad: () => invocar('phpmyadmin.disponibilidad'),
  },
  accesoBd: {
    abrir: (sitioId, herramienta) => invocar('accesoBd.abrir', sitioId, herramienta),
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
  lan: {
    estado: () => invocar('lan.estado'),
    activar: (id, confirmacion) => invocar('lan.activar', id, confirmacion),
    desactivar: (id) => invocar('lan.desactivar', id),
    comandoFirewall: (puerto, para) => invocar('lan.comandoFirewall', puerto, para),
    abrirCaMovil: (ip) => invocar('lan.abrirCaMovil', ip),
    cerrarCaMovil: () => invocar('lan.cerrarCaMovil'),
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
  correo: {
    captadores: () => invocar('correo.captadores'),
    elegir: (id) => invocar('correo.elegir', id),
    presets: () => invocar('correo.presets'),
    proveedores: () => invocar('correo.proveedores'),
    guardarProveedor: (p, o) => invocar('correo.guardarProveedor', p, o),
    borrarProveedor: (id) => invocar('correo.borrarProveedor', id),
    guardarClave: (id, clave) => invocar('correo.guardarClave', id, clave),
    borrarClave: (id) => invocar('correo.borrarClave', id),
    probarEnvio: (id, para) => invocar('correo.probarEnvio', id, para),
    usarEnSitio: (sitioId, modo) => invocar('correo.usarEnSitio', sitioId, modo),
    vistaPreviaEnv: (sitioId, id, incluir) =>
      invocar('correo.vistaPreviaEnv', sitioId, id, incluir),
    escribirEnv: (sitioId, id, o) => invocar('correo.escribirEnv', sitioId, id, o),
  },
  avisoInicio: () => invocar('avisoInicio'),
  instalador: {
    listarVersiones: (s, filtro) => invocar('instalador.listarVersiones', s, filtro),
    instalar: (v) => invocar('instalador.instalar', v),
    instalados: (s) => invocar('instalador.instalados', s),
    desinstalar: (s, v) => invocar('instalador.desinstalar', s, v),
  },
  limpiezaVersiones: {
    sinUso: () => invocar('limpiezaVersiones.sinUso'),
    papelera: () => invocar('limpiezaVersiones.papelera'),
    recuperar: (id) => invocar('limpiezaVersiones.recuperar', id),
    limpiar: (sel, confirmado, destino) =>
      invocar('limpiezaVersiones.limpiar', sel, confirmado, destino),
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
    abrir: (id, confirmado, tunel) => invocar('tuneles.abrir', id, confirmado === true, tunel),
    cerrar: (id) => invocar('tuneles.cerrar', id),
    renovar: (id, confirmado, tunel) => invocar('tuneles.renovar', id, confirmado === true, tunel),
    estados: () => invocar('tuneles.estados'),
    cuentaCloudflare: () => invocar('tuneles.cuentaCloudflare'),
    conectarCloudflare: () => invocar('tuneles.conectarCloudflare'),
    cancelarConexionCloudflare: () => invocar('tuneles.cancelarConexionCloudflare'),
    desconectarCloudflare: () => invocar('tuneles.desconectarCloudflare'),
    olvidarCloudflare: (nombre, confirmado, borrarEnCloudflare) =>
      invocar(
        'tuneles.olvidarCloudflare',
        nombre,
        confirmado === true,
        borrarEnCloudflare !== false,
      ),
    recrearCloudflare: (nombre, confirmado) =>
      invocar('tuneles.recrearCloudflare', nombre, confirmado === true),
    configurarCloudflare: (id, nombre, dominio) =>
      invocar('tuneles.configurarCloudflare', id, nombre, dominio),
    usarTunelRapido: (id) => invocar('tuneles.usarTunelRapido', id),
    usarProveedor: (id, proveedor, modo) => invocar('tuneles.usarProveedor', id, proveedor, modo),
    estadoToken: (proveedor) => invocar('tuneles.estadoToken', proveedor),
    guardarToken: (proveedor, token) => invocar('tuneles.guardarToken', proveedor, token),
    borrarToken: (proveedor) => invocar('tuneles.borrarToken', proveedor),
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
    abrirEn: (sitioId, archivo, linea, editor) =>
      invocar('editor.abrirEn', sitioId, archivo, linea, editor ?? null),
    disponibles: () => invocar('editor.disponibles'),
    cambiarPorDefecto: (editor) => invocar('editor.cambiarPorDefecto', editor),
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
    reparar: (id, confirmacion, reparacionId, seleccion) =>
      seleccion === undefined
        ? invocar('doctor.reparar', id, confirmacion, reparacionId)
        : invocar('doctor.reparar', id, confirmacion, reparacionId, seleccion),
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
    abrirGrabadora: () => invocar('sistema.abrirGrabadora'),
    abrirCarpeta: (ruta) => invocar('sistema.abrirCarpeta', ruta),
    copiar: (texto) => invocar('sistema.copiar', texto),
    version: () => invocar('sistema.version'),
    guardarArchivo: (nombre) => invocar('sistema.guardarArchivo', nombre),
    elegirArchivos: () => invocar('sistema.elegirArchivos'),
    abrirEditor: (sitioId, editor) => invocar('sistema.abrirEditor', sitioId, editor ?? null),
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
    crear: (pedido) => invocar('proyectos.crear', pedido),
    huellaWordpress: (version) => invocar('proyectos.huellaWordpress', version),
    confiar: (sitioId) => invocar('proyectos.confiar', sitioId),
  },
  plantillas: {
    lista: () => invocar('plantillas.lista'),
    vistaPrevia: (sitioId, opciones) => invocar('plantillas.vistaPrevia', sitioId, opciones),
    guardar: (sitioId, opciones) => invocar('plantillas.guardar', sitioId, opciones),
    borrar: (id) => invocar('plantillas.borrar', id),
  },
  env: {
    ver: (sitioId) => invocar('env.ver', sitioId),
    revelar: (sitioId, clave) => invocar('env.revelar', sitioId, clave),
    vistaPrevia: (sitioId, pedido) => invocar('env.vistaPrevia', sitioId, pedido),
    guardar: (sitioId, pedido, opciones) => invocar('env.guardar', sitioId, pedido, opciones),
    copias: (sitioId) => invocar('env.copias', sitioId),
    restaurarCopia: (sitioId, nombre, opciones) =>
      invocar('env.restaurarCopia', sitioId, nombre, opciones),
    usarUsuarioPropio: (sitioId, opciones) => invocar('env.usarUsuarioPropio', sitioId, opciones),
  },
  importar: {
    vistaPrevia: (instancia) => invocar('importar.vistaPrevia', instancia),
    ejecutar: (seleccion, opciones) => invocar('importar.ejecutar', seleccion, opciones),
    cancelar: () => invocar('importar.cancelar'),
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
  reverb: {
    estado: (sitioId) => invocar('reverb.estado', sitioId),
    activar: (sitioId, confirmado) => invocar('reverb.activar', sitioId, confirmado),
    desactivar: (sitioId) => invocar('reverb.desactivar', sitioId),
    variables: (sitioId) => invocar('reverb.variables', sitioId),
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
    leerImagen: (ruta) => invocar('herramientas.leerImagen', ruta),
    guardarImagen: (destino, datos) => invocar('herramientas.guardarImagen', destino, datos),
    comprimirZip: (origenes, destino) => invocar('herramientas.comprimirZip', origenes, destino),
    optimizarPdf: (origen, destino) => invocar('herramientas.optimizarPdf', origen, destino),
    conversionesDocumento: () => invocar('herramientas.conversionesDocumento'),
    convertirDocumento: (origen, a, destino) =>
      invocar('herramientas.convertirDocumento', origen, a, destino),
  },
  clienteHttp: {
    estado: () => invocar('clienteHttp.estado'),
    enviar: (p, o) => invocar('clienteHttp.enviar', p, o),
    cancelar: (id) => invocar('clienteHttp.cancelar', id),
    guardarPeticion: (p) => invocar('clienteHttp.guardarPeticion', p),
    borrarPeticion: (id) => invocar('clienteHttp.borrarPeticion', id),
    guardarEntorno: (e) => invocar('clienteHttp.guardarEntorno', e),
    borrarEntorno: (id) => invocar('clienteHttp.borrarEntorno', id),
    activarEntorno: (id) => invocar('clienteHttp.activarEntorno', id),
    limpiarHistorial: () => invocar('clienteHttp.limpiarHistorial'),
    revelar: (ref) => invocar('clienteHttp.revelar', ref),
    copiarComoCurl: (p, e, i) => invocar('clienteHttp.copiarComoCurl', p, e, i),
    importarCurl: (t) => invocar('clienteHttp.importarCurl', t),
  },
  ejemploHttp: {
    iniciar: () => invocar('ejemploHttp.iniciar'),
    detener: () => invocar('ejemploHttp.detener'),
  },
  laboratorioGit: {
    estado: () => invocar('laboratorioGit.estado'),
    ejecutar: (o) => invocar('laboratorioGit.ejecutar', o),
    escribirArchivo: (id, c) => invocar('laboratorioGit.escribirArchivo', id, c),
    reiniciar: () => invocar('laboratorioGit.reiniciar'),
  },
  memoria: {
    plan: (modo) => invocar('memoria.plan', modo),
    aplicar: (planId, ids, confirmado) => invocar('memoria.aplicar', planId, ids, confirmado),
  },
  limpiezaDisco: {
    analizar: (categorias) => invocar('limpiezaDisco.analizar', categorias),
    limpiar: (categorias, confirmado) => invocar('limpiezaDisco.limpiar', categorias, confirmado),
    cancelar: () => invocar('limpiezaDisco.cancelar'),
    abrirRegistros: () => invocar('limpiezaDisco.abrirRegistros'),
  },
  editorCodigo: {
    elegir: () => invocar('editorCodigo.elegir'),
    abrir: (ruta, opciones) => invocar('editorCodigo.abrir', ruta, opciones),
    guardar: (ruta, opciones) => invocar('editorCodigo.guardar', ruta, opciones),
    avisarCambios: (sinGuardar) => invocar('editorCodigo.avisarCambios', sinGuardar),
  },
  diffCarpetas: {
    comparar: (a, b) => invocar('diffCarpetas.comparar', a, b),
    cancelar: () => invocar('diffCarpetas.cancelar'),
    archivo: (idComparacion, idEntrada) =>
      invocar('diffCarpetas.archivo', idComparacion, idEntrada),
    prepararEditor: (idComparacion, idEntrada, lado) =>
      invocar('diffCarpetas.prepararEditor', idComparacion, idEntrada, lado),
  },
  discoUso: {
    unidades: () => invocar('discoUso.unidades'),
    analizar: (carpeta) => invocar('discoUso.analizar', carpeta),
    analizarUnidad: (ruta) => invocar('discoUso.analizarUnidad', ruta),
    cancelar: () => invocar('discoUso.cancelar'),
    abrirCarpeta: (idAnalisis, idFila) => invocar('discoUso.abrirCarpeta', idAnalisis, idFila),
  },
  compartir: {
    elegir: (tipo) => invocar('compartir.elegir', tipo),
    estado: () => invocar('compartir.estado'),
    accesos: () => invocar('compartir.accesos'),
    iniciar: (ruta, duracion, proveedor, confirmado) =>
      invocar('compartir.iniciar', ruta, duracion, proveedor, confirmado),
    detener: () => invocar('compartir.detener'),
  },
  captura: {
    leer: () => invocar('captura.leer'),
    guardarConfig: (cambios) => invocar('captura.guardarConfig', cambios),
    iniciar: (modo) => invocar('captura.iniciar', modo),
    tomarPendiente: () => invocar('captura.tomarPendiente'),
  },
  buscar: {
    iniciar: (opciones) => invocar('buscar.iniciar', opciones),
    cancelar: (id) => invocar('buscar.cancelar', id),
    prepararEditor: (idBusqueda, idResultado) =>
      invocar('buscar.prepararEditor', idBusqueda, idResultado),
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

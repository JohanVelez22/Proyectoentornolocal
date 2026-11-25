/**
 * Errores del núcleo con código estable. El `message` sigue siendo el texto en español de
 * siempre (respaldo y registros); la interfaz traduce por `codigo` y rellena con `datos`.
 *
 * `PARAMETROS_ERROR` es la lista blanca: cada código declara qué parámetros puede llevar. El
 * proceso principal solo deja pasar al renderer esos nombres (nunca rutas, claves ni trazas
 * que no se hayan declarado aquí a propósito).
 */
export const PARAMETROS_ERROR = {
  // git y GitHub
  'git.cambios_locales': [],
  'git.divergencia': [],
  'git.sin_upstream': [],
  'git.sin_rama': [],
  'git.no_repositorio': [],
  'git.destino_no_vacio': [],
  'git.destino_es_archivo': [],
  'git.no_encontrado': [],
  'git.gh_no_encontrado': [],
  'git.plazo': ['minutos'],
  'git.token_invalido': [],
  'git.url_con_credenciales': [],
  // servicios
  'servicios.desconocido': ['id'],
  'servicios.no_instalado': ['nombre'],
  'servicios.puerto_invalido': [],
  'servicios.puerto_asignado': ['puerto', 'otro'],
  'servicios.puerto_ocupado': ['puerto', 'pid', 'nombre', 'alternativo'],
  'servicios.confirmacion_borrado': ['nombre', 'id'],
  'servicios.ftp_no_disponible': [],
  'sistema.sin_cliente_ftp': [],
  'servicios.mailpit_no_responde': [],
  'servicios.respaldo_fallo': ['nombre'],
  'servicios.iniciar_todo_fallos': ['nombres'],
  'servicios.espacio_insuficiente': ['necesarios', 'libres'],
  'servicios.actualizacion_revertida': ['nombre', 'version', 'anterior'],
  'servicios.restauracion_fallo': ['nombre', 'fallida', 'respaldo'],
  'servicios.otra_rama': ['nombre', 'version'],
  'servicios.misma_version': ['id', 'version'],
  'servicios.instancia_bloqueada': ['nombre', 'fallida', 'respaldo'],
  'servicios.datos_apartados': ['nombre'],
  'servicios.puerto_reservado': ['puerto', 'desde', 'hasta'],
  'servicios.borrado_con_bloqueo': ['nombre'],
  'servicios.config_no_revertida': ['nombre', 'version', 'anterior'],
  'servicios.puerto_revertido_apagada': ['nombre', 'anterior'],
  'servicios.puerto_no_revertido': ['nombre', 'nuevo', 'anterior'],
  // instancias de los servicios de datos
  'instancias.id_invalido': [],
  'instancias.no_existe': ['id'],
  'instancias.existe': ['id'],
  'instancias.una_sola': ['nombre'],
  'instancias.ultima': ['id'],
  'instancias.sin_puerto_libre': [],
  'instancias.confirmacion': ['id'],
  'instancias.sin_datos': ['id'],
  'instancias.respaldo_no_existe': ['id'],
  'instancias.respaldo_en_uso': ['id'],
  'instancias.version_requerida': ['id'],
  'instalador.version_en_uso': ['servicio', 'version', 'instancia'],
  // bases de datos
  'bd.encender_servicio': ['nombre'],
  'bd.sin_credenciales': ['nombre'],
  'bd.confirmacion_borrado': ['nombre'],
  'bd.mongosh_faltante': [],
  'bd.usuario_clave_distinta': ['usuario'],
  'bd.usuario_privilegiado': ['usuario'],
  'bd.rol_sin_login': ['usuario'],
  // túneles, hosts y HTTPS
  'tuneles.sitio_no_encontrado': [],
  'tuneles.cloudflared_no_instalado': [],
  'tuneles.confirmacion_requerida': ['dominio'],
  'hosts.dominio_invalido': [],
  'hosts.tiempo_agotado': ['segundos'],
  'https.sin_dominio': [],
  'https.sin_autoridad': [],
  // herramientas
  'herramientas.pid_invalido': [],
  'herramientas.pid_sistema': ['pid'],
  'herramientas.proceso_propio': [],
  'herramientas.proceso_inexistente': ['pid'],
  'herramientas.sin_vscode': [],
  'herramientas.carpeta_sitio_inexistente': [],
  'herramientas.ruta_no_absoluta': [],
  'herramientas.sin_seleccion': [],
  'herramientas.dominio_invalido': [],
  'herramientas.demasiados_dominios': ['maximo'],
  // búsqueda
  'buscar.consulta_invalida': [],
  'buscar.raiz_invalida': [],
  'buscar.regex_invalida': [],
  'buscar.regex_lenta': [],
  'buscar.demasiadas': ['maximo'],
  // terminal
  'terminal.no_abrio': [],
  'terminal.no_instalada': ['nombre'],
  'terminal.invalida': [],
  'terminal.powershell_restringido': [],
  // proyectos
  'proyectos.no_existe': [],
  'proyectos.no_confiado': [],
  'proyectos.receta_en_curso': [],
  'proyectos.paso_no_omitible': [],
  // proyectos nuevos (D12)
  'proyectos.carpeta_no_vacia': [],
  // plantillas de proyecto (D14)
  'plantillas.id_invalido': [],
  'plantillas.no_existe': [],
  'plantillas.danada': [],
  'plantillas.demasiado_grande': ['maximo'],
  'plantillas.exclusion_invalida': [],
  'plantillas.nombre_invalido': [],
  'plantillas.esquema_fallo': [],
  'plantillas.base_no_resuelta': [],
  'plantillas.sin_esquema': [],
  'proyectos.carpeta_invalida': [],
  'proyectos.nombre_invalido': ['campo'],
  'proyectos.argumento_invalido': ['campo'],
  'proyectos.base_existe': ['nombre'],
  'proyectos.dominio_existe': ['dominio'],
  'proyectos.carpeta_de_otro_sitio': ['dominio'],
  'proyectos.sin_python': [],
  'proyectos.paso_base_no_omitible': [],
  'proyectos.sin_php': [],
  'proyectos.php_no_instalado': ['version'],
  'proyectos.python_no_instalado': ['version'],
  // servidor MCP
  'mcp.token_invalido': [],
  'mcp.solicitud_cancelada': [],
  // Doctor (hallazgos y reparaciones)
  'doctor.puerto_ocupado': ['puerto', 'servicio', 'proceso', 'alternativo'],
  'doctor.puerto_iis': ['puerto', 'servicio', 'programa'],
  'doctor.puerto_http_sys': ['puerto', 'servicio', 'programa', 'alternativo'],
  'doctor.puerto_flyenv': ['puerto', 'servicio', 'programa', 'alternativo'],
  'doctor.puerto_xampp': ['puerto', 'servicio', 'programa', 'alternativo'],
  'doctor.puerto_skype': ['puerto', 'servicio', 'programa', 'alternativo'],
  'doctor.puerto_reservado': ['puerto', 'servicio', 'desde', 'hasta', 'alternativo'],
  'doctor.ca_por_vencer': ['dias'],
  'doctor.ca_vencida': [],
  'doctor.certificado_por_vencer': ['dominio', 'dias'],
  'doctor.certificado_vencido': ['dominio'],
  'doctor.hosts_ilegible': [],
  'doctor.hosts_utf16': [],
  'doctor.hosts_bloque_duplicado': ['bloques'],
  'doctor.hosts_bloque_sin_cierre': [],
  'doctor.hosts_dominios_faltantes': ['cantidad'],
  'doctor.hosts_solo_lectura': [],
  'doctor.path_duplicados': ['cantidad'],
  'doctor.path_ajeno_delante': ['programa', 'origen'],
  'doctor.vcredist_ausente': [],
  'doctor.enlazador_msvc_ausente': [],
  'doctor.antivirus_sin_exclusion': [],
  'doctor.servicio_en_error': ['servicio', 'id'],
  'doctor.revision_fallida': ['revision'],
  'doctor.confirmacion_requerida': [],
  'doctor.hallazgo_desconocido': [],
  'doctor.solo_informa': [],
  'doctor.reparacion_fallida': [],
  'doctor.reparacion_cancelada': [],
  'doctor.reparacion_denegada': [],
  'doctor.sin_puerto_libre': [],
  'doctor.ya_resuelto': [],
  'doctor.ca_vieja_sin_quitar': [],
  'doctor.ca_vuelta_atras_incompleta': [],
  'doctor.firefox_sin_confianza': ['cantidad'],
  // Confianza de la CA fuera del almacén de Windows
  'confianza.sin_ca': [],
  'confianza.sin_raices': [],
  'confianza.node_variable_ajena': [],
  'confianza.variable_fallida': [],
  'firefox.abierto': [],
  'firefox.error': [],
  'firefox.fuera': [],
  'confianza.node_variable_cambiada': [],
  // IA en la nube (nunca llevan la clave: `detalle` sale de sinSecretosIa)
  'ia.clave_invalida': [],
  'ia.sin_saldo': [],
  'ia.limite': [],
  'ia.region': [],
  'ia.sin_red': [],
  'ia.url_invalida': [],
  'ia.plazo': ['segundos'],
  'ia.respuesta_rara': ['estado', 'detalle'],
  'ia.cancelado': [],
  'ia.sin_clave': [],
  'ia.clave_mal_formada': [],
  'ia.modelo_invalido': [],
  'ia.modelo_no_disponible': [],
  'ia.proveedor_invalido': [],
  'ia.env_conflicto': ['claves'],
  'ia.env_sin_confirmar': [],
  'ia.env_versionado': [],
  'ia.env_versionado_desconocido': [],
  'ia.proveedor_no_existe': [],
  'ia.url_cambia_con_clave': [],
  'ia.mensaje_sin_confirmar': [],
  'ia.clave_ilegible': [],
  'ia.argumento_invalido': ['campo'],
  // agentes
  'agentes.no_existe': [],
  'agentes.sin_confirmar': [],
  'agentes.no_instalable': ['guia'],
  'agentes.sin_node': [],
  'agentes.node_antiguo': ['agente', 'requerida', 'actual'],
  'agentes.node_version_desconocida': ['agente', 'requerida'],
  'instalador.zip_demasiado_grande': [],
  'rust.rustup_init_fallo': ['codigo', 'detalle'],
  'rust.toolchain_fallo': ['version', 'codigo', 'detalle'],
  'rust.desinstalar_fallo': ['version', 'detalle'],
  'rust.descarga_fallo': ['estado'],
  'agentes.instalacion_fallo': ['detalle'],
  'agentes.no_instalado': ['agente'],
  'agentes.mcp_no_soportado': ['agente'],
  'agentes.config_ilegible': ['archivo'],
  'agentes.config_en_uso': ['archivo'],
  'agentes.proveedor_incompatible': ['agente'],
  'agentes.sin_cambios_preparados': [],
  'agentes.argumento_invalido': ['campo'],
  'git.commit_fallo': ['detalle'],
  'git.mensaje_invalido': [],
  // PHP: php.ini por rama y extensiones (`salida` va recortada a 200 caracteres)
  'php.rama_no_instalada': ['rama'],
  'php.argumento_invalido': ['campo'],
  'php.valor_invalido': ['clave'],
  'php.ini_invalido': ['salida'],
  'php.no_arranco': ['rama'],
  'php.caido_tras_restaurar': ['rama'],
  'php.respaldo_no_existe': [],
  'php.extension_no_existe': ['nombre'],
  'php.extension_no_catalogo': ['nombre'],
  'php.variante_desconocida': [],
  'php.sin_variante': ['nombre', 'variante'],
  'php.huella_distinta': [],
  'php.descarga_fallida': ['detalle'],
  'php.extension_en_uso': ['nombre', 'rama'],
  'php.extension_sin_dll': ['nombre', 'rama'],
  // Ini por sitio y Xdebug (Task 11)
  'php.sitio_sin_php': [],
  'php.sitio_no_arranco': ['sitio'],
  'php.sin_puertos_sitio': [],
  'xdebug.launch_invalido': [],
  'xdebug.launch_no_seguro': [],
  'xdebug.sin_configurar': [],
  // Editor de vhost de Nginx (Task 12)
  'nginx.sitio_no_existe': [],
  'nginx.texto_invalido': [],
  'nginx.sintaxis': ['linea', 'detalle'],
  'nginx.directiva_prohibida': ['directiva', 'linea'],
  'nginx.ruta_fuera': ['directiva', 'linea'],
  'nginx.fuera_de_server': ['directiva', 'linea'],
  'nginx.dominio_ajeno': ['nombre', 'linea'],
  'nginx.puerto_ajeno': ['linea'],
  'nginx.version_no_existe': [],
  'nginx.destino_interno': ['directiva', 'linea'],
  'nginx.caido_tras_restaurar': ['salida'],
  'nginx.argumento_invalido': ['campo'],
  // Captura de dump() (Task 13)
  'depuracion.puerto_ocupado': ['puerto'],
  'depuracion.no_iniciado': [],
  'depuracion.tipo_no_soportado': [],
  'depuracion.confirmacion': [],
  'depuracion.argumento_invalido': ['campo'],
  'depuracion.archivo_fuera_del_sitio': [],
  // Contenedores Docker/Podman (Task 15)
  'contenedores.motor_invalido': [],
  'contenedores.id_invalido': [],
  'contenedores.argumento_invalido': ['campo'],
  'contenedores.sin_motor': ['motor'],
  'contenedores.no_responde': ['motor'],
  'contenedores.remoto': ['motor'],
  'contenedores.no_existe': [],
  'contenedores.accion_fallo': ['detalle'],
  'contenedores.demasiados_registros': ['maximo'],
  'contenedores.sin_confirmar': [],
  // Catálogo en vivo e instalador (Task 16)
  'catalogo.indice_invalido': ['servicio'],
  'catalogo.sin_huella': ['servicio', 'version'],
  'catalogo.huella_debil': ['servicio', 'version'],
  'catalogo.huella_no_coincide': [],
  'catalogo.redireccion_ajena': ['host'],
  'catalogo.demasiadas_redirecciones': ['maximo'],
  'catalogo.respuesta_grande': ['maximo'],
  'catalogo.version_no_encontrada': ['servicio', 'version'],
  'catalogo.huella_no_disponible': ['servicio', 'version'],
  // Firmas PGP de las descargas (D10)
  'catalogo.firma_invalida': ['servicio', 'version'],
  'catalogo.firma_no_soportada': ['servicio', 'version'],
  'catalogo.clave_desconocida': ['servicio', 'version'],
  'catalogo.firma_vencida': ['servicio', 'version'],
  'catalogo.reloj_atrasado': ['servicio', 'version'],
} as const satisfies Record<string, readonly string[]>;

export type CodigoError = keyof typeof PARAMETROS_ERROR;

export const CODIGOS_ERROR = Object.keys(PARAMETROS_ERROR) as readonly CodigoError[];

export type DatosErrorWolf = Record<string, string | number>;

export class ErrorWolf extends Error {
  readonly datos?: DatosErrorWolf;

  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
    datos?: DatosErrorWolf,
    opciones?: ErrorOptions,
  ) {
    super(mensaje, opciones);
    this.name = 'ErrorWolf';
    if (datos) this.datos = datos;
  }
}

export function esErrorWolf(e: unknown): e is ErrorWolf {
  return e instanceof ErrorWolf;
}

/**
 * Datos de un error listos para salir del proceso principal: solo los parámetros que el código
 * declara, y solo textos cortos o números finitos.
 */
export function datosPermitidos(codigo: string, datos: unknown): DatosErrorWolf | undefined {
  const permitidos = (PARAMETROS_ERROR as Record<string, readonly string[]>)[codigo];
  if (!permitidos || datos === null || typeof datos !== 'object') return undefined;
  const salida: DatosErrorWolf = {};
  for (const k of permitidos) {
    const v = (datos as Record<string, unknown>)[k];
    if (typeof v === 'number' && Number.isFinite(v)) salida[k] = v;
    else if (typeof v === 'string' && v.length <= 200) salida[k] = v;
  }
  return Object.keys(salida).length > 0 ? salida : undefined;
}

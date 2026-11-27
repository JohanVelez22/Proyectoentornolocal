import type {
  AccionContenedor,
  AvisoCurl,
  EntornoHttp,
  EstadoClienteHttp,
  PeticionHttp,
  RespuestaHttp,
  Contenedor,
  EstadoMotor,
  LineasContenedor,
  MotorContenedores,
  Dump,
  EstadoReceptor,
  ErrorAgrupado,
  FiltroDumps,
  FiltroErrores,
  ResumenDump,
  ResumenError,
  EstadoPhpSitio,
  ResultadoPhpSitio,
  XdebugSitio,
  Aviso,
  ClaveRapida,
  ExtensionPhp,
  RespaldoIni,
  BaseProyecto,
  IdTerminal,
  TerminalDisponible,
  EditorDisponible,
  IdEditor,
  ResultadoAbrirEditor,
  CambiosPreferenciasUi,
  PreferenciasUi,
  CierreConfirmacion,
  ConfigProyecto,
  Deteccion,
  DisponibilidadGit,
  EstadoGit,
  EntornoSistema,
  EstadoMcp,
  EstadoProcesoPublico,
  EstadoReverb,
  EstadoReceta,
  FuenteRegistroPublica,
  MuestraSistema,
  OpcionesReceta,
  PasoReceta,
  ProgresoReceta,
  PuertoEnUso,
  RecetaPropuesta,
  RepoGithub,
  ResultadoBom,
  ImagenLeida,
  ResultadoPdf,
  ResultadoZip,
  Conversion,
  Formato,
  ResultadoBusqueda,
  ResumenBusqueda,
  OpcionesBusqueda,
  LoteBusqueda,
  FinBusqueda,
  ResultadoReceta,
  PedidoProyecto,
  Plantilla,
  OpcionesPlantilla,
  VistaPreviaPlantilla,
  VistaEnv,
  PedidoEnv,
  FilaImportar,
  VistaPreviaImportar,
  Instantanea,
  InstantaneaBorrada,
  ResultadoAuditoria,
  EstadoConsultasLentas,
  ConsultasLentasLeidas,
  EsquemaBase,
  ProgresoAuditoria,
  VistaPreviaRestablecer,
  ResultadoRestablecer,
  OpcionesImportar,
  ResultadoImportar,
  ProblemaImportar,
  AvisoImportar,
  ProgramaAjeno,
  ResultadoCrearProyecto,
  TipoGenerador,
  ResultadoTraer,
  ResumenReceta,
  RuntimesProyecto,
  SolicitudConfirmacion,
  SugerenciaProyecto,
  TipoRuntime,
  AjustesServicios,
  BaseListada,
  Config,
  Credenciales,
  DatosConexion,
  DatosConexionVista,
  DisponibilidadAdminer,
  DisponibilidadPhpMyAdmin,
  HerramientaBd,
  EstadoGeneral,
  EstadoHosts,
  EstadoHttps,
  EstadoCaptador,
  EstadoServicio,
  EstadoTunel,
  EventosNucleo,
  FormatoRespaldo,
  IdCaptador,
  IdServicioDatos,
  ModeloOllama,
  MotorBd,
  OpcionesCrearBase,
  OpcionesRestaurar,
  OrigenImportar,
  ProgresoBd,
  ProgresoIa,
  ProgresoInstalacion,
  ProyectoDetectado,
  ResultadoAjustes,
  ResultadoAplicar,
  ResultadoBuildTools,
  ResultadoCA,
  ResultadoCrear,
  ResultadoRestaurar,
  ResultadoSync,
  Sitio,
  TipoSitio,
  VersionDisponible,
  EstadoConfianza,
  Hallazgo,
  IdRevision,
  Reparacion,
  ResultadoFirefox,
  ResultadoReparacion,
  ConfigProveedorIa,
  PresetSmtp,
  ProveedorSmtp,
  ResultadoEnvio,
  ModeloIa,
  OpcionesEnvIa,
  ResultadoEnvIa,
  ResultadoMensajeIa,
  ResultadoPruebaIa,
  TipoProveedorIa,
  VistaPreviaEnvIa,
  EstadoAgente,
  IdAgente,
  OrigenAgente,
  ResultadoRegistroMcp,
  AvisoVhost,
  CambioVhost,
  ResultadoEditorVhost,
  SnippetNginx,
  VersionVhost,
  VistaVhost,
  FiltroVersiones,
  ListadoVersiones,
  RamaCatalogo,
  OrigenCatalogo,
  SoporteVersion,
  Huella,
  EstadoInstancia,
  IdInstancia,
  PlanActualizar,
  RespaldoDatos,
  ResultadoNuevaRama,
  ServicioVersiones,
  TablaVersiones,
  TipoRespaldoDatos,
  InstantaneaEntorno,
  OpcionesExportarPerfil,
  OpcionesImportarPerfil,
  PrefijoRuta,
  ProgresoPerfil,
  ResultadoExportarPerfil,
  ResultadoImportarPerfil,
  VistaPreviaPerfil,
  AvisoPerfil,
  Workspace,
  ElementoWorkspace,
  EstadoWorkspace,
  ResultadoWorkspace,
  TareaSitio,
  VistaTarea,
  EjecucionTarea,
  EstadoPlanificador,
  PropuestaTarea,
  EntradaTarea,
  VersionSinUso,
  ResultadoLimpieza,
  DestinoLimpieza,
  SeleccionLimpieza,
  VersionEnPapelera,
  CambiosCaptura,
  CapturaConfig,
  AccionMemoria,
  ModoMemoria,
  PlanMemoria,
  ResultadoAccionMemoria,
  ResultadoMemoria,
  CategoriaLimpieza,
  ResumenCategoria,
  ResultadoLimpiezaDisco,
  ResultadoCategoriaLimpieza,
  OpcionesAbrirArchivo,
  OpcionesGuardarArchivo,
  ResultadoAbrirArchivo,
  ResultadoGuardarArchivo,
  ComparacionCarpetas,
  EntradaDiffUi,
  ResultadoArchivoDiff,
  ResumenCarpetas,
  FilaDiffTexto,
  GrupoDiff,
  ArchivoEditor,
  RiesgoEditor,
  HuellaArchivo,
} from '@pel/core';
import type {
  EstadoCapturaUi,
  ImagenPendiente,
  ModoCaptura,
  ResultadoAtajo,
  ResultadoIniciarCaptura,
} from './captura';

export type {
  AccionContenedor,
  Contenedor,
  EstadoMotor,
  LineasContenedor,
  MotorContenedores,
  Dump,
  EstadoReceptor,
  ErrorAgrupado,
  FiltroDumps,
  FiltroErrores,
  ResumenDump,
  ResumenError,
  AvisoVhost,
  CambioVhost,
  ResultadoEditorVhost,
  SnippetNginx,
  VersionVhost,
  VistaVhost,
  EstadoPhpSitio,
  ResultadoPhpSitio,
  XdebugSitio,
  ClaveRapida,
  ExtensionPhp,
  RespaldoIni,
  EstadoAgente,
  IdAgente,
  OrigenAgente,
  ResultadoRegistroMcp,
  ConfigProveedorIa,
  PresetSmtp,
  ProveedorSmtp,
  ResultadoEnvio,
  ModeloIa,
  OpcionesEnvIa,
  ResultadoEnvIa,
  ResultadoMensajeIa,
  ResultadoPruebaIa,
  TipoProveedorIa,
  VistaPreviaEnvIa,
  EstadoConfianza,
  Hallazgo,
  Reparacion,
  IdRevision,
  ResultadoFirefox,
  ResultadoReparacion,
  Aviso,
  CierreConfirmacion,
  ConfigProyecto,
  Deteccion,
  DisponibilidadGit,
  EstadoGit,
  EntornoSistema,
  EstadoMcp,
  EstadoProcesoPublico,
  EstadoReverb,
  EstadoReceta,
  FuenteRegistroPublica,
  MuestraSistema,
  OpcionesReceta,
  PasoReceta,
  ProgresoReceta,
  PuertoEnUso,
  RecetaPropuesta,
  RepoGithub,
  ResultadoBom,
  ImagenLeida,
  ResultadoPdf,
  ResultadoZip,
  Conversion,
  Formato,
  ResultadoBusqueda,
  ResumenBusqueda,
  OpcionesBusqueda,
  LoteBusqueda,
  FinBusqueda,
  ResultadoReceta,
  PedidoProyecto,
  Plantilla,
  OpcionesPlantilla,
  VistaPreviaPlantilla,
  VistaEnv,
  PedidoEnv,
  FilaImportar,
  VistaPreviaImportar,
  OpcionesImportar,
  ResultadoImportar,
  ProblemaImportar,
  AvisoImportar,
  ProgramaAjeno,
  ResultadoCrearProyecto,
  TipoGenerador,
  ResultadoTraer,
  ResumenReceta,
  RuntimesProyecto,
  SolicitudConfirmacion,
  SugerenciaProyecto,
  TipoRuntime,
  AjustesServicios,
  BaseListada,
  Config,
  Credenciales,
  DatosConexion,
  DatosConexionVista,
  DisponibilidadAdminer,
  DisponibilidadPhpMyAdmin,
  HerramientaBd,
  BaseProyecto,
  IdTerminal,
  TerminalDisponible,
  EditorDisponible,
  IdEditor,
  ResultadoAbrirEditor,
  EstadoGeneral,
  EstadoHosts,
  EstadoHttps,
  EstadoCaptador,
  EstadoServicio,
  EstadoTunel,
  EventosNucleo,
  FormatoRespaldo,
  IdCaptador,
  IdServicioDatos,
  ModeloOllama,
  MotorBd,
  OpcionesCrearBase,
  OpcionesRestaurar,
  OrigenImportar,
  ProgresoBd,
  ProgresoIa,
  ProgresoInstalacion,
  ProyectoDetectado,
  ResultadoAjustes,
  ResultadoAplicar,
  ResultadoBuildTools,
  ResultadoCA,
  ResultadoCrear,
  ResultadoRestaurar,
  ResultadoSync,
  Sitio,
  TipoSitio,
  VersionDisponible,
};

export type MotorSql = Exclude<MotorBd, 'mongodb'>;
/** Motor (su instancia predeterminada) o una instancia del motor (`mysql@8.0`). */
export type ObjetivoBdIpc = MotorBd | IdInstancia;
/** Tabla y columnas de la auditoría de contraseñas: el núcleo las valida contra el catálogo. */
export interface SeleccionAuditoria {
  tabla: string;
  columnaUsuario: string;
  columnaHash: string;
  /** PostgreSQL: esquema de la tabla (por omisión `public`). */
  esquema?: string;
}

export type ObjetivoSqlIpc = MotorSql | IdInstancia;
export type {
  ProgresoPerfil,
  InstantaneaEntorno,
  OpcionesExportarPerfil,
  OpcionesImportarPerfil,
  PrefijoRuta,
  ResultadoExportarPerfil,
  ResultadoImportarPerfil,
  VistaPreviaPerfil,
  AvisoPerfil,
  Workspace,
  ElementoWorkspace,
  EstadoWorkspace,
  ResultadoWorkspace,
  TareaSitio,
  VistaTarea,
  EjecucionTarea,
  EstadoPlanificador,
  PropuestaTarea,
  EntradaTarea,
  VersionSinUso,
  ResultadoLimpieza,
  DestinoLimpieza,
  SeleccionLimpieza,
  VersionEnPapelera,
  CambiosCaptura,
  CapturaConfig,
  ModoMemoria,
  PlanMemoria,
  ResultadoMemoria,
  AccionMemoria,
  ResultadoAccionMemoria,
  CategoriaLimpieza,
  ResumenCategoria,
  ResultadoLimpiezaDisco,
  ResultadoCategoriaLimpieza,
  ArchivoEditor,
  RiesgoEditor,
  HuellaArchivo,
  OpcionesAbrirArchivo,
  OpcionesGuardarArchivo,
  ResultadoAbrirArchivo,
  ResultadoGuardarArchivo,
  ComparacionCarpetas,
  EntradaDiffUi,
  ResultadoArchivoDiff,
  ResumenCarpetas,
  FilaDiffTexto,
  GrupoDiff,
  EstadoInstancia,
  IdInstancia,
  PlanActualizar,
  RespaldoDatos,
  ResultadoNuevaRama,
  ServicioVersiones,
  TablaVersiones,
  TipoRespaldoDatos,
};
/** Resultado de guardar en el editor de código (D43): lo que la ventana sabe resolver va tipado. */
export type ResultadoGuardarEditor =
  | ({ estado: 'guardado' } & ResultadoGuardarArchivo)
  | { estado: 'cambiado' }
  | { estado: 'reforzar'; riesgos: RiesgoEditor[] }
  | { estado: 'normalizar' };
/** Una copia de `data/<servicio>/` por sus ids (nunca por su ruta). */
export interface RefRespaldoDatos {
  servicio: IdServicioDatos;
  clave: string;
  tipo: TipoRespaldoDatos;
  sello: string;
}

/** Lo que se confirmó al publicar un túnel (el núcleo lo compara con el sitio al abrir). */
export interface TunelConfirmado {
  proveedor: 'cloudflare-rapido' | 'cloudflare-nombre' | 'ngrok' | 'expose' | 'tailscale';
  nombre?: string;
  dominio?: string;
  modo?: 'serve' | 'funnel';
}

/** Un sitio compartido en la red local (D25). */
export interface SitioCompartidoLan {
  sitioId: string;
  url: string;
  ip: string;
  puerto: number;
  https: boolean;
}

/** IP de la red local disponibles y sitios compartidos ahora. */
export interface EstadoLan {
  ips: string[];
  sitios: SitioCompartidoLan[];
  /** Perfil de cada red según Windows (`null`: no se pudo leer). Una red pública merece un aviso. */
  perfiles: Record<string, 'privado' | 'publico' | 'dominio' | null>;
  /** Dominios que se dejaron de compartir en esta consulta porque la IP ya no es de este equipo. */
  redCambio: string[];
}

/** Lo que el usuario confirmó al compartir: el núcleo comprueba que la IP siga siendo suya. */
export interface ConfirmacionLan {
  ip: string;
  https: boolean;
  /** Solo lo envía el botón "Compartir" del diálogo: sin `true` el núcleo no abre nada. */
  confirmado: boolean;
}

/** Servidor temporal de `ca.crt` para el móvil. */
export interface CaMovilAbierta {
  url: string;
  ip: string;
  /** Marca de tiempo (ms) en que se cierra solo. */
  expira: number;
  /** Puerto en el que escucha (el del comando del cortafuegos). */
  puerto: number;
  /** Huellas del `ca.crt`, para compararlas en el móvil antes de confiar. */
  huellas: { sha256: string; sha1: string };
}

/** Lo único que la interfaz ve de una clave de IA: si hay una y sus 4 últimos caracteres. */
export interface EstadoClaveIa {
  configurada: boolean;
  final: string | null;
}

/** Proveedor de IA en la nube tal como lo ve la interfaz (sin la clave). */
export interface ProveedorIaPublico extends ConfigProveedorIa {
  clave: EstadoClaveIa;
}

/** Proveedor SMTP remoto tal como lo ve la interfaz (sin la clave). */
export interface ProveedorSmtpPublico extends ProveedorSmtp {
  clave: EstadoClaveIa;
}

/** Puerto fijo de Adminer (igual que `PUERTO_ADMINER` del núcleo; solo se muestra). */
export const PUERTO_ADMINER = 8090;
/** Puerto fijo de phpMyAdmin (igual que `PUERTO_PHPMYADMIN` del núcleo; solo se muestra). */
export const PUERTO_PHPMYADMIN = 8091;

export interface EstadoPgvector {
  buildTools: boolean;
  instalado: boolean;
  version: string | null;
}

/**
 * Lo único que el renderer elige al instalar: el proceso principal re-resuelve la URL y la huella.
 * `confirmarSinHuella` solo sale de un diálogo que explica el riesgo (versión sin huella fuerte).
 */
export type SeleccionVersion = Pick<VersionDisponible, 'servicio' | 'version'> & {
  confirmarSinHuella?: true;
};

export type {
  FiltroVersiones,
  Huella,
  ListadoVersiones,
  OrigenCatalogo,
  RamaCatalogo,
  SoporteVersion,
};

export type DatosSitio = Omit<Sitio, 'id'>;

/** El cliente `wolf` (D32): su carpeta en el PATH, si está copiado y si el servidor de órdenes escucha. */
export interface EstadoCliPath {
  enPath: boolean;
  instalado: boolean;
  /** El servidor de órdenes escucha ahora. */
  activo: boolean;
  /** El ajuste `cli.activo`. */
  ajuste: boolean;
  /** Carpeta de datos de prueba (`WOLFCORE_DATOS`): el PATH no se toca. */
  aislado: boolean;
}

/** Resultado de abrir la grabadora de pantalla nativa (D38a). */
export interface ResultadoGrabadora {
  /** true si el sistema aceptó abrir Recortes; false = la ventana muestra la guía de atajos. */
  abierta: boolean;
}

export interface ApiSistema {
  /** Abre el selector de carpetas; devuelve null si se cancela. */
  elegirCarpeta(): Promise<string | null>;
  /** Abre el selector de archivos (p. ej. un respaldo); devuelve null si se cancela. */
  elegirArchivo(): Promise<string | null>;
  /** Solo http/https. */
  abrirUrl(url: string): Promise<void>;
  /**
   * Abre la grabadora de pantalla nativa: en Windows, Recortes en modo grabación (URI fijo, solo
   * desde el proceso principal); en otros sistemas no hace nada (`abierta: false`, hay guía).
   */
  abrirGrabadora(): Promise<ResultadoGrabadora>;
  abrirCarpeta(ruta: string): Promise<void>;
  copiar(texto: string): Promise<void>;
  version(): Promise<string>;
  /**
   * Diálogo "Guardar como" (p. ej. un certificado); la ruta elegida queda registrada solo como
   * destino de escritura (no sirve para rutas que leen, como restaurar o quitar el BOM). null si
   * se cancela.
   */
  guardarArchivo(nombreSugerido?: string): Promise<string | null>;
  /** Selector de varios archivos (p. ej. para quitar el BOM); [] si se cancela. */
  elegirArchivos(): Promise<string[]>;
}

/** Accesos del sistema que pasan por el núcleo (la ruta sale de la configuración del sitio). */
export interface ApiSistemaNucleo {
  /**
   * Abre la carpeta del proyecto en el editor elegido o, sin él, en el predeterminado de Ajustes
   * (si ese ya no está instalado, en el primero detectado: `sustituyo` lo dice).
   */
  abrirEditor(sitioId: string, editor?: IdEditor | null): Promise<ResultadoAbrirEditor>;
}

/** Lo que se puede pedir al ejecutar una receta desde la interfaz. */
export interface OpcionesRecetaIpc {
  /** Corre desde este paso hasta el final. */
  desde?: string;
  /** Corre solo este paso (Reintentar). */
  soloPaso?: string;
  /**
   * La receta editada en el asistente (como mucho 50 pasos). El archivo de `bd-restaurar`
   * (`args.archivo`) debe venir de `sistema.elegirArchivo`.
   */
  receta?: PasoReceta[];
  /**
   * "Reinstalar dependencias": repite la receta guardada (sin restaurar respaldos ni
   * sobrescribir); sin receta guardada usa la del proyecto.
   */
  guardada?: boolean;
  /**
   * Corrida suelta (pasos sugeridos tras traer cambios): corre `receta` sin reemplazar la receta
   * guardada; sus eventos llevan `suelta: true`.
   */
  suelta?: boolean;
}

/** Rutas escritas al emitir un certificado libre (el .key va junto al .crt elegido). */
export interface CertificadoGuardado {
  certificado: string;
  clave: string;
}

export interface ApiEntorno {
  estadoGeneral(): Promise<EstadoGeneral>;
  /** Carpeta de datos del programa (solo lectura). */
  carpetaDatos(): Promise<string>;
  /**
   * Perfiles del entorno (D27). Las rutas (el archivo del perfil, el destino y las carpetas de los
   * sitios) salen de diálogos (`sistema.elegirArchivo`, `guardarArchivo`, `elegirCarpeta`). La
   * frase nunca se guarda: viaja en la llamada y se borra al terminar.
   */
  perfiles: {
    /** `aislado`: la app corre con `WOLFCORE_DATOS` (carpeta de prueba). */
    entorno(): Promise<{ aislado: boolean; carpeta: string }>;
    exportar(o: OpcionesExportarPerfil): Promise<ResultadoExportarPerfil>;
    vistaPrevia(
      archivo: string,
      o?: { rutas: Record<string, string>; prefijos?: PrefijoRuta[] },
    ): Promise<VistaPreviaPerfil>;
    /** Exige `confirmado: true` y la huella de la última vista previa. */
    importar(archivo: string, o: OpcionesImportarPerfil): Promise<ResultadoImportarPerfil>;
    /** Quita de la confianza del sistema la CA que reemplazó un perfil (por su huella SHA-1). */
    quitarCaAnterior(huella: string): Promise<ResultadoCA>;
    /** Las instantáneas automáticas del entorno (10 últimas), de la más nueva a la más vieja. */
    instantaneas(): Promise<InstantaneaEntorno[]>;
    /** Toma una a mano; devuelve su carpeta (`''` si no había nada que copiar). */
    instantanea(): Promise<string>;
  };
  sitios: {
    listar(): Promise<Sitio[]>;
    guardar(datos: DatosSitio, id?: string): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }>;
    borrar(id: string): Promise<ResultadoAplicar>;
    aplicar(): Promise<ResultadoAplicar>;
    /** PHP del sitio: ajustes propios, Xdebug, su pool y la configuración de PhpStorm. */
    phpSitio(id: string): Promise<EstadoPhpSitio>;
    /** Ajustes de php.ini propios (pool propio; prueba con php -v y vuelta atrás). */
    guardarPhpIni(id: string, valores: Record<string, string>): Promise<ResultadoPhpSitio>;
    /**
     * Xdebug del sitio (null = quitarlo); nunca se activa en el ini de la rama. `avisoPuerto`:
     * el puerto elegido ya lo usa un PHP u otro servicio.
     */
    xdebug(id: string, x: XdebugSitio | null): Promise<ResultadoPhpSitio>;
    /** Lo que se escribiría en .vscode/launch.json (para confirmarlo). */
    launchJsonVista(id: string): Promise<{ existe: boolean; contenido: string; diff: string }>;
    /** Escribe .vscode/launch.json (fusiona; copia previa fuera del proyecto). */
    launchJson(id: string): Promise<{ creado: boolean; respaldo: string | null }>;
  };
  /**
   * Workspaces de arranque (D28): conjuntos con nombre de instancias, servicios y procesos que se
   * encienden y apagan juntos. Guardan solo referencias. Encender y apagar devuelven qué quedó
   * encendido y qué no; nunca abren túneles ni comparten en la red local.
   */
  workspaces: {
    lista(): Promise<Workspace[]>;
    estados(): Promise<Record<string, EstadoWorkspace>>;
    guardar(w: Workspace): Promise<Workspace>;
    borrar(id: string): Promise<void>;
    iniciar(id: string): Promise<ResultadoWorkspace[]>;
    detener(id: string): Promise<ResultadoWorkspace[]>;
  };
  /**
   * Tareas programadas por sitio (D29): un comando del proyecto (lista cerrada de programas, sin
   * shell) con una expresión cron. Solo corren con la app abierta, en proyectos de confianza y
   * con el comando confirmado por el usuario. Guardar o adoptar una tarea la confirma; una que
   * llega de otra fuente no corre hasta `confirmar`.
   */
  tareas: {
    lista(sitioId: string): Promise<VistaTarea[]>;
    estado(): Promise<EstadoPlanificador>;
    /** Las 3 próximas ejecuciones de una expresión cron (ISO); error `tareas.cron_invalida` si no vale. */
    proximas(cron: string): Promise<string[]>;
    /** En carpeta de datos de prueba (WOLFCORE_DATOS): permite las tareas en esta sesión. */
    permitirAislado(): Promise<void>;
    guardar(sitioId: string, tarea: EntradaTarea): Promise<TareaSitio>;
    activar(sitioId: string, tareaId: string, activa: boolean): Promise<TareaSitio>;
    confirmar(sitioId: string, tareaId: string, huella: string): Promise<TareaSitio>;
    borrar(sitioId: string, tareaId: string): Promise<void>;
    ejecutarAhora(sitioId: string, tareaId: string): Promise<EjecucionTarea>;
    historial(sitioId: string, tareaId: string): Promise<EjecucionTarea[]>;
    log(sitioId: string, tareaId: string): Promise<string[]>;
    propuestas(sitioId: string): Promise<PropuestaTarea[]>;
    adoptar(sitioId: string, id: string, huella: string, activar: boolean): Promise<TareaSitio>;
    aWolfcoreYml(sitioId: string, tareaId: string): Promise<void>;
  };
  servicios: {
    estados(): Promise<EstadoServicio[]>;
    iniciar(id: string): Promise<void>;
    detener(id: string): Promise<void>;
    iniciarTodo(): Promise<void>;
    /** Cierra primero los túneles (devolviendo los .env) y luego detiene los servicios. */
    detenerTodo(): Promise<void>;
    /** Host y puerto de Meilisearch (o de una de sus instancias), para «Datos de conexión»: sin la master key. */
    conexion(ref: 'meilisearch' | IdInstancia): Promise<DatosConexionVista>;
    /**
     * La master key, solo al pulsar «Mostrar» o «Copiar» (como `env.revelar`): no se registra ni
     * emite eventos. null si no hay.
     */
    revelarSecreto(ref: 'meilisearch' | IdInstancia): Promise<string | null>;
    /** 1024–65535 y libre; reinicia el servicio si estaba encendido. */
    /** Devuelve los proyectos cuyo .env todavía usa el puerto anterior (no se tocan). */
    cambiarPuerto(id: IdServicioDatos, puerto: number): Promise<{ proyectos: string[] }>;
    /** `confirmacion` debe ser el id del servicio. */
    borrarDatos(id: IdServicioDatos, confirmacion: string): Promise<void>;
    /** Encender (o no) el servicio al iniciar WolfCore Dev; no lo enciende ahora. */
    autoIniciar(id: IdServicioDatos, valor: boolean): Promise<void>;
    /** Lo que hará la actualización (tamaño de los datos, espacio libre, volcados). */
    planActualizar(id: IdInstancia): Promise<PlanActualizar>;
    /** Parche de la misma rama con respaldo previo; solo desde `DialogoActualizar`. */
    actualizar(
      id: IdInstancia,
      version: string,
      opciones?: { confirmarSinHuella?: true },
    ): Promise<{ anterior: string; respaldo: { carpeta: string; volcados: string[] } }>;
    /** Rama nueva = instancia nueva (con copia opcional de las bases de otra). */
    nuevaRama(
      servicio: IdServicioDatos,
      version: string,
      opciones?: { copiarDesde?: IdInstancia; confirmarSinHuella?: true },
    ): Promise<ResultadoNuevaRama>;
    /** Versión para proyectos nuevos (PHP, Nginx, Node, Python, Composer, cloudflared…). */
    predeterminada(servicio: ServicioVersiones, version: string): Promise<void>;
    /** Respaldos, volcados y carpetas apartadas de las actualizaciones (con su tamaño). */
    respaldosDatos(servicio?: IdServicioDatos): Promise<RespaldoDatos[]>;
    /** Borra una de esas copias (nunca la carpeta de datos actual); `confirmar` exacto. */
    borrarRespaldoDatos(ref: RefRespaldoDatos, confirmar: true): Promise<void>;
  };
  catalogo: {
    /** Pestaña "Versiones": catálogo + instalado, por rama, con sus marcas. */
    versiones(servicio: ServicioVersiones, filtro?: FiltroVersiones): Promise<TablaVersiones>;
    /** Silencia (o no) los avisos de versiones nuevas de un servicio; devuelve los silenciados. */
    silenciar(servicio: ServicioVersiones, silenciar: boolean): Promise<string[]>;
  };
  instancias: {
    lista(servicio?: IdServicioDatos): Promise<EstadoInstancia[]>;
    crear(servicio: IdServicioDatos, version: string): Promise<IdInstancia>;
    iniciar(id: IdInstancia): Promise<void>;
    detener(id: IdInstancia): Promise<void>;
    /** Devuelve los proyectos cuyo .env todavía usa el puerto anterior (no se tocan). */
    puerto(id: IdInstancia, puerto: number): Promise<{ proyectos: string[] }>;
    predeterminar(id: IdInstancia): Promise<void>;
    /** La saca de la lista (detenida); sus datos quedan en disco. */
    quitar(id: IdInstancia): Promise<void>;
    /** Borra solo data/<servicio>/<clave>; `confirmacion` debe ser el id de la instancia. */
    borrarDatos(id: IdInstancia, confirmacion: string): Promise<void>;
    /** Resuelve el bloqueo tras una devolución fallida (confirmación escrita). */
    desbloquear(
      id: IdInstancia,
      opciones: { confirmacion: string; respaldo?: string; version?: string },
    ): Promise<void>;
  };
  bd: {
    listar(motor: ObjetivoBdIpc): Promise<BaseListada[]>;
    crear(
      motor: ObjetivoBdIpc,
      nombre: string,
      opciones?: OpcionesCrearBase,
    ): Promise<ResultadoCrear>;
    /** `confirmacion` debe ser el nombre exacto de la base. */
    borrar(motor: ObjetivoBdIpc, nombre: string, confirmacion: string): Promise<void>;
    /** Datos de conexión SIN la clave (solo `tieneClave`): para el diálogo "Datos de conexión". */
    conexion(motor: ObjetivoBdIpc): Promise<DatosConexionVista>;
    /** La clave del motor, solo al pulsar «Mostrar» o «Copiar» (como `env.revelar`). null si no usa clave. */
    revelar(motor: ObjetivoBdIpc): Promise<string | null>;
    /**
     * El bloque .env completo, con la clave: solo para «Copiar .env». `sitioId` null = bloque
     * genérico. `bloqueEnv` y `bloqueEnvSitio` lo devuelven con la clave enmascarada.
     */
    revelarBloqueEnv(motor: ObjetivoBdIpc, base: string, sitioId: string | null): Promise<string>;
    bloqueEnv(
      motor: ObjetivoBdIpc,
      base: string,
      tipoProyecto: TipoSitio | 'generico',
      envActual?: string,
    ): Promise<string>;
    /**
     * Bloque .env para el proyecto de un sitio: el núcleo lee el .env del sitio (para respetar
     * sus variables) y devuelve solo el bloque generado.
     */
    bloqueEnvSitio(sitioId: string, motor: ObjetivoBdIpc, base: string): Promise<string>;
    /** Consultas lentas (D45b): estado global del servidor (sin SQL). */
    lentasEstado(motor: ObjetivoSqlIpc): Promise<EstadoConsultasLentas>;
    /** Cambio global del servidor: exige `confirmado: true` (solo instancias de WolfCore). */
    lentasCambiar(
      motor: ObjetivoSqlIpc,
      pedido: { activo: boolean; segundos?: number; confirmado: boolean },
    ): Promise<EstadoConsultasLentas>;
    /** Las más lentas primero, con el SQL normalizado (sin literales). */
    lentasLeer(motor: ObjetivoSqlIpc): Promise<ConsultasLentasLeidas>;
    /** El SQL tal cual de una entrada; el núcleo lo rechaza si alguna base del servidor tiene datos reales. */
    lentasLiteral(motor: ObjetivoSqlIpc, id: string): Promise<string>;
    /** Esquema (solo metadatos) de una base: tablas, columnas, claves, índices y relaciones. */
    esquema(motor: ObjetivoSqlIpc, base: string): Promise<EsquemaBase>;
    /** Carpeta real de respaldos y copias de seguridad automáticas (Documentos\WolfCore Dev\Respaldos). */
    carpetaRespaldos(): Promise<string>;
    tieneTablas(motor: ObjetivoSqlIpc, base: string): Promise<boolean>;
    formato(archivo: string): Promise<FormatoRespaldo>;
    restaurar(
      motor: ObjetivoSqlIpc,
      archivo: string,
      base: string,
      opciones?: OpcionesRestaurar,
    ): Promise<ResultadoRestaurar>;
    respaldar(
      motor: ObjetivoSqlIpc,
      base: string,
      carpetaDestino?: string,
    ): Promise<{ archivo: string }>;
    /** Solo se lee el servidor de origen. */
    importar(
      motor: ObjetivoSqlIpc,
      origen: OrigenImportar,
      destinoBase: string,
      opciones?: OpcionesRestaurar,
    ): Promise<ResultadoRestaurar>;
  };
  /**
   * Instantáneas de base (D19). `volver` exige `confirmado: true`: antes guarda el estado actual
   * y, si falla, la base vuelve sola a él.
   */
  instantaneas: {
    lista(motor: ObjetivoSqlIpc, base: string): Promise<Instantanea[]>;
    tomar(motor: ObjetivoSqlIpc, base: string, nota: string): Promise<Instantanea>;
    vistaPrevia(
      motor: ObjetivoSqlIpc,
      base: string,
      id: string,
    ): Promise<{ instantanea: Instantanea; estadoActual: { tablas: number; bytes: number } }>;
    /**
     * `nombreEscrito` debe ser el nombre exacto de la base (lo comprueba el proceso principal).
     * `sinGuardarEstado` solo con el `vale` que da el error `instantaneas.respaldo_previo_fallo`
     * (un uso, 10 minutos) y `confirmacion` (el nombre de la base escrito de nuevo).
     */
    volver(
      motor: ObjetivoSqlIpc,
      base: string,
      id: string,
      nombreEscrito: string,
      opciones?: { sinGuardarEstado?: boolean; vale?: string; confirmacion?: string },
    ): Promise<{ respaldoPrevio: Instantanea | null; advertencias: string[] }>;
    /** A la papelera de WolfCore Dev: se puede recuperar 7 días. */
    borrar(motor: ObjetivoSqlIpc, base: string, id: string): Promise<void>;
    /** Las de las bases de una instancia, también las de bases que ya no existen. */
    listaInstancia(motor: ObjetivoSqlIpc): Promise<Instantanea[]>;
    papelera(motor: ObjetivoSqlIpc, base: string): Promise<InstantaneaBorrada[]>;
    recuperar(motor: ObjetivoSqlIpc, base: string, id: string): Promise<Instantanea>;
  };
  /**
   * Auditoría de contraseñas de las bases propias (D20). Solo dice "débil o no": nunca cuál de las
   * contraseñas comunes coincidió. `restablecer` pide escribir el usuario exacto; antes toma una
   * instantánea y copia la fila.
   */
  auditoriaClaves: {
    auditar(
      motor: ObjetivoSqlIpc,
      base: string,
      seleccion: SeleccionAuditoria,
    ): Promise<ResultadoAuditoria>;
    /** Avance de la auditoría en curso (null si no hay). Solo corre una a la vez. */
    progreso(): Promise<ProgresoAuditoria | null>;
    /** Cancela la auditoría en curso; false si no había ninguna. */
    cancelar(): Promise<boolean>;
    vistaPrevia(
      motor: ObjetivoSqlIpc,
      base: string,
      seleccion: SeleccionAuditoria,
      usuario: string,
      aBcrypt?: boolean,
    ): Promise<VistaPreviaRestablecer>;
    restablecer(
      motor: ObjetivoSqlIpc,
      base: string,
      seleccion: SeleccionAuditoria,
      usuario: string,
      claveNueva: string,
      usuarioEscrito: string,
      aBcrypt?: boolean,
      confirmarDatosReales?: boolean,
    ): Promise<ResultadoRestablecer>;
  };
  pgvector: {
    estado(): Promise<EstadoPgvector>;
    instalarBuildTools(): Promise<ResultadoBuildTools>;
    compilarEInstalar(): Promise<{ version: string }>;
    activar(base: string): Promise<void>;
  };
  https: {
    /** Autoridad local, puerto HTTPS y el programa ajeno que lo ocupa (si lo hay). */
    estado(): Promise<EstadoHttps>;
    instalarCA(): Promise<ResultadoCA>;
    quitarCA(): Promise<ResultadoCA>;
    cambiarPuerto(puerto: number): Promise<ResultadoAplicar>;
  };
  composer: {
    version(): Promise<string | null>;
    instalar(): Promise<void>;
    actualizar(): Promise<string>;
    /** Rama de PHP de la terminal y los shims (null = la más reciente instalada). */
    cambiarPhpPorDefecto(rama: string | null): Promise<void>;
  };
  terminal: {
    /** Abre la terminal del sitio: la elegida o, sin ella, la predeterminada de Ajustes. */
    abrir(sitioId: string, terminal?: IdTerminal | null): Promise<void>;
    /** Terminales instaladas y la predeterminada (null = la del sistema). */
    disponibles(): Promise<{ disponibles: TerminalDisponible[]; porDefecto: IdTerminal | null }>;
    cambiarPorDefecto(terminal: IdTerminal | null): Promise<void>;
  };
  path: {
    estado(): Promise<boolean>;
    cambiar(activar: boolean): Promise<{ aviso: string }>;
  };
  /** El cliente `wolf` de la terminal (D32): su entrada en el PATH y el servidor de órdenes. */
  cli: {
    estado(): Promise<EstadoCliPath>;
    cambiarPath(agregar: boolean): Promise<{ aviso: string }>;
  };
  adminer: {
    instalar(): Promise<void>;
    disponibilidad(): Promise<DisponibilidadAdminer>;
    /** URL sin clave; null si Adminer no soporta el motor. */
    url(motor: MotorBd, usuario: string): Promise<string | null>;
    /** Base del proyecto (según su .env) y su URL de Adminer, sin clave; url null si no hay. */
    proyecto(sitioId: string): Promise<{ base: BaseProyecto | null; url: string | null }>;
  };
  phpmyadmin: {
    instalar(): Promise<void>;
    disponibilidad(): Promise<DisponibilidadPhpMyAdmin>;
  };
  accesoBd: {
    /**
     * Abre la base del proyecto en Adminer o phpMyAdmin ya autenticada. El proceso principal abre
     * el navegador con un token de un solo uso: la interfaz solo recibe con qué usuario entró
     * (`propio` false = el administrador del servidor, porque el proyecto usa root u otro usuario).
     */
    abrir(
      sitioId: string,
      herramienta: HerramientaBd,
    ): Promise<{
      usuario: string;
      propio: boolean;
      /** Por qué entró como administrador (solo con `propio` false). */
      motivo?: 'sin_usuario_propio' | 'sin_clave';
    }>;
  };
  ftp: {
    activar(sitioId: string): Promise<Credenciales>;
    desactivar(sitioId: string): Promise<void>;
    regenerarClave(sitioId: string): Promise<string>;
    soloLectura(sitioId: string, valor: boolean): Promise<void>;
    credenciales(sitioId: string): Promise<Credenciales | null>;
    /** `ftp://usuario@host:puerto/`, sin la clave. */
    url(sitioId: string): Promise<string>;
    redLocal(valor: boolean): Promise<void>;
  };
  /** Compartir sitios en la red local y entregar la CA al móvil (D25). */
  lan: {
    estado(): Promise<EstadoLan>;
    /** Expone el sitio a la red local: exige la confirmación del diálogo. */
    activar(
      sitioId: string,
      confirmacion: ConfirmacionLan,
    ): Promise<{ url: string; ip: string; puerto: number }>;
    desactivar(sitioId: string): Promise<void>;
    /** Comando de PowerShell (administrador) para la regla del cortafuegos; no se ejecuta solo. */
    comandoFirewall(puerto: number, para?: 'sitio' | 'ca'): Promise<string>;
    /** Abre el servidor temporal de `ca.crt` (solo ese archivo, 10 minutos como máximo). */
    abrirCaMovil(ip?: string): Promise<CaMovilAbierta>;
    cerrarCaMovil(): Promise<void>;
  };
  ia: {
    modelos(): Promise<ModeloOllama[]>;
    /** El avance llega por el evento `ia:progreso`. */
    descargar(nombre: string): Promise<void>;
    cancelar(nombre: string): Promise<boolean>;
    borrar(nombre: string): Promise<void>;
    probar(nombre: string, texto: string): Promise<string>;
    espacioUsado(): Promise<number>;
    bloqueEnv(): Promise<string>;
    sugeridos(): Promise<string[]>;
    /* ── IA en la nube (la clave nunca vuelve a la interfaz) ── */
    proveedores(): Promise<ProveedorIaPublico[]>;
    /**
     * Crea o actualiza un proveedor. Si ya tiene clave y cambia la URL efectiva, falla con
     * `ia.url_cambia_con_clave` salvo con `confirmarCambioUrl` (diálogo aparte).
     */
    guardarProveedor(
      proveedor: ConfigProveedorIa,
      confirmarCambioUrl?: true,
    ): Promise<ProveedorIaPublico[]>;
    /** Borra el proveedor y su clave (y, con `limpiarRespaldos`, las copias del .env con ella). */
    borrarProveedor(id: string, opciones?: { limpiarRespaldos?: boolean }): Promise<void>;
    /** Va directo al almacén cifrado del proceso principal; solo devuelve el estado. */
    guardarClave(id: string, clave: string): Promise<EstadoClaveIa>;
    borrarClave(
      id: string,
      opciones?: { limpiarRespaldos?: boolean },
    ): Promise<{ sitiosLimpios: number }>;
    estadoClave(id: string): Promise<EstadoClaveIa>;
    /** Sitios con copias del .env que contienen la clave del proveedor. */
    respaldosClave(id: string): Promise<{ sitios: string[] }>;
    /** Lista los modelos (no gasta tokens). Nunca falla por el proveedor: mire `ok`/`error`. */
    probarConexion(id: string): Promise<ResultadoPruebaIa>;
    /** Mensaje fijo con respuesta de 16 tokens como mucho; exige la confirmación del diálogo. */
    probarMensaje(id: string, modelo: string, confirmacion: true): Promise<ResultadoMensajeIa>;
    /** Bloque .env con la clave enmascarada y el estado de .gitignore y git del proyecto. */
    previsualizarEnv(
      sitioId: string,
      proveedorId: string,
      modelo?: string,
    ): Promise<VistaPreviaEnvIa>;
    escribirEnv(
      sitioId: string,
      proveedorId: string,
      opciones: OpcionesEnvIa,
    ): Promise<ResultadoEnvIa>;
  };
  mailpit: {
    noLeidos(): Promise<number>;
  };
  correo: {
    /** Los captadores locales (solo en 127.0.0.1) con su estado. */
    captadores(): Promise<EstadoCaptador[]>;
    /** Enciende el captador (apaga el que corriera) y lo deja como el de los proyectos. */
    elegir(id: IdCaptador): Promise<void>;
    /* ── Proveedores SMTP remotos (la clave nunca vuelve a la interfaz) ── */
    /** Proveedores con sus datos oficiales (host y puerto de la documentación de cada uno). */
    presets(): Promise<PresetSmtp[]>;
    proveedores(): Promise<ProveedorSmtpPublico[]>;
    /**
     * Crea o actualiza un proveedor. Un host de este equipo o de la red local falla con
     * `correo.host_local` salvo con `confirmarRedLocal`; cambiar host, puerto o usuario con clave
     * guardada falla con `correo.cambia_con_clave` salvo con `confirmarCambio`.
     */
    guardarProveedor(
      proveedor: Omit<ProveedorSmtp, 'redLocal'>,
      opciones?: { confirmarRedLocal?: true; confirmarCambio?: true },
    ): Promise<ProveedorSmtpPublico[]>;
    /** Borra el proveedor y su clave; los proyectos que lo usaban vuelven al captador. */
    borrarProveedor(id: string): Promise<void>;
    /** Va directo al almacén cifrado del proceso principal; solo devuelve el estado. */
    guardarClave(id: string, clave: string): Promise<EstadoClaveIa>;
    borrarClave(id: string): Promise<void>;
    /**
     * Manda UN correo de prueba a la dirección que escribe el usuario, con TLS verificado y plazo
     * de 20 s. Máximo uno cada 15 s por proveedor y 10 por hora. Falla con códigos fijos.
     */
    probarEnvio(id: string, para: string): Promise<ResultadoEnvio>;
    /** A dónde envía correo un proyecto: el captador local o un proveedor SMTP. */
    usarEnSitio(
      sitioId: string,
      modo: { modo: 'captador' } | { modo: 'smtp'; proveedor: string },
    ): Promise<void>;
    /** Lo que cambiaría en el `.env` del proyecto (la clave, si se incluye, va enmascarada). */
    vistaPreviaEnv(
      sitioId: string,
      proveedorId: string,
      incluirClave: boolean,
    ): Promise<{ diff: string; huella: string }>;
    /**
     * Escribe el bloque `MAIL_*` en el `.env` del proyecto. `confirmado` es el aviso de que la
     * clave, si se incluye, queda en texto plano; `huella` es la de `vistaPreviaEnv`.
     */
    escribirEnv(
      sitioId: string,
      proveedorId: string,
      opciones: {
        confirmado: true;
        incluirClave: boolean;
        huella: string;
        aceptarVersionado?: boolean;
        agregarGitignore?: boolean;
      },
    ): Promise<{ copia: string | null; gitignoreAgregado: boolean }>;
  };
  /**
   * Avisos de inicio pendientes (migración de la carpeta de datos, servicios que no encendieron),
   * o null. Se entregan una sola vez; el evento viso:inicio avisa que hay uno nuevo.
   */
  avisoInicio(): Promise<string | null>;
  instalador: {
    /** Vivo → caché → lista fija; `origen` y `fecha` dicen de dónde salió. */
    listarVersiones(
      servicio: VersionDisponible['servicio'],
      filtro?: FiltroVersiones,
    ): Promise<ListadoVersiones>;
    instalar(seleccion: SeleccionVersion): Promise<void>;
    instalados(servicio: string): Promise<string[]>;
    /** Solo los binarios (en servicios de datos, los datos quedan). */
    desinstalar(servicio: ServicioVersiones, version: string): Promise<void>;
  };
  /** Limpieza de versiones sin uso (D30): solo `bin/<servicio>/<versión>`, nunca `data/`. */
  limpiezaVersiones: {
    /** Vista previa: todas las instaladas con su tamaño y por qué no se pueden quitar. No borra. */
    sinUso(): Promise<VersionSinUso[]>;
    /**
     * Quita las elegidas (`confirmado` sale SOLO del diálogo que mostró la lista) a la papelera
     * (se purga a los 7 días) o de forma definitiva. Antes toma la instantánea del entorno.
     */
    /** Lo que está en la papelera de limpieza (se purga a los 7 días). */
    papelera(): Promise<VersionEnPapelera[]>;
    /** Devuelve una versión de la papelera a `bin/` (falla si esa carpeta ya existe). */
    recuperar(id: string): Promise<void>;
    limpiar(
      seleccion: SeleccionLimpieza[],
      confirmado: true,
      destino: DestinoLimpieza,
    ): Promise<ResultadoLimpieza>;
  };
  tuneles: {
    /**
     * `confirmado`: el usuario confirmó publicar. `tunel`: lo que se le mostró (proveedor, túnel,
     * dominio y modo de Tailscale): si el sitio ya no lo usa, el núcleo no abre.
     */
    abrir(sitioId: string, confirmado?: boolean, tunel?: TunelConfirmado): Promise<EstadoTunel>;
    cerrar(sitioId: string): Promise<void>;
    renovar(sitioId: string, confirmado?: boolean, tunel?: TunelConfirmado): Promise<EstadoTunel>;
    estados(): Promise<EstadoTunel[]>;
    /** ¿Hay una cuenta de Cloudflare conectada para túneles con nombre? */
    cuentaCloudflare(): Promise<{ disponible: boolean; conectada: boolean }>;
    /** `cloudflared tunnel login`: abre el navegador del usuario; puede tardar minutos. */
    conectarCloudflare(): Promise<{ cancelado: boolean }>;
    /** Cancela el `login` en curso (el navegador ya no hace falta). */
    cancelarConexionCloudflare(): Promise<void>;
    desconectarCloudflare(): Promise<void>;
    /** Borra la credencial guardada y el túnel en Cloudflare (exige `confirmado`). */
    olvidarCloudflare(
      nombre: string,
      confirmado: boolean,
      /** false = olvidar solo aquí (la credencial), sin tocar Cloudflare. */
      borrarEnCloudflare?: boolean,
    ): Promise<void>;
    /** Borra y crea de nuevo el túnel con nombre (exige `confirmado`). */
    recrearCloudflare(nombre: string, confirmado: boolean): Promise<void>;
    /** Crea el túnel, enruta el dominio y lo deja elegido para el sitio (no lo abre). */
    configurarCloudflare(sitioId: string, nombre: string, dominio: string): Promise<void>;
    /** Vuelve al túnel rápido (sin cuenta) en el sitio. */
    usarTunelRapido(sitioId: string): Promise<void>;
    /**
     * Elige ngrok, Expose o Tailscale para el sitio (`modo`: solo Tailscale, `serve` = solo la
     * tailnet, `funnel` = internet; por defecto `serve`). Cierra el túnel abierto; no abre nada.
     */
    usarProveedor(
      sitioId: string,
      proveedor: 'ngrok' | 'expose' | 'tailscale',
      modo?: 'serve' | 'funnel',
    ): Promise<void>;
    /** Del token de ngrok o Expose solo se ve si hay uno y sus 4 últimos caracteres. */
    estadoToken(proveedor: 'ngrok' | 'expose'): Promise<EstadoClaveIa>;
    guardarToken(proveedor: 'ngrok' | 'expose', token: string): Promise<EstadoClaveIa>;
    borrarToken(proveedor: 'ngrok' | 'expose'): Promise<void>;
  };
  hosts: {
    sincronizar(): Promise<ResultadoSync>;
  };
  detectarProyecto(carpeta: string): Promise<ProyectoDetectado>;
  config: {
    leer(): Promise<Config>;
  };
  ajustes: {
    /** Guarda puerto y trabajadores, regenera los vhosts y reinicia lo que haga falta. */
    guardar(ajustes: AjustesServicios): Promise<ResultadoAjustes>;
  };
  /* ───────────── Etapa B ───────────── */
  proyectos: {
    /** Detección ampliada de una carpeta existente (tipo, servicios, runtimes, dominio). */
    detectar(carpeta: string): Promise<Deteccion>;
    /** wolfcore.yml de la carpeta (null si no hay). */
    configLeer(carpeta: string): Promise<ConfigProyecto | null>;
    /** Escribe wolfcore.yml en la carpeta del proyecto (se valida en el núcleo). */
    configGuardar(sitioId: string, config: ConfigProyecto): Promise<void>;
    /** Receta que correría la carpeta (wolfcore.yml o la de por defecto) y su detección. */
    recetaPorDefecto(carpeta: string): Promise<RecetaPropuesta>;
    /** Exige "Confío en este repositorio"; el avance llega por `receta:progreso`. */
    ejecutarReceta(sitioId: string, opciones?: OpcionesRecetaIpc): Promise<ResultadoReceta>;
    /** Marca el paso como omitido y sigue con el siguiente. */
    omitirPaso(sitioId: string, pasoId: string): Promise<ResultadoReceta>;
    estadoReceta(sitioId: string): Promise<EstadoReceta>;
    /** false si no había receta en curso. */
    cancelarReceta(sitioId: string): Promise<boolean>;
    /** Comando real de cada paso y si la receta cambió desde que se marcó "Confío…". */
    resumenReceta(sitioId: string): Promise<ResumenReceta>;
    /**
     * Crea el proyecto del asistente (exige `confiado`) con los datos del paso `sitio-crear` de
     * la receta: un FastAPI o Node nace con su proceso, su puerto y su proxy.
     */
    crearSitio(
      datos: DatosSitio,
      receta: PasoReceta[],
    ): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }>;
    /**
     * Proyecto nuevo desde un generador. La carpeta padre debe haber salido de `elegirCarpeta`;
     * el progreso llega por `receta:progreso`. Un paso que falla no borra nada: el resultado
     * dice qué quedó creado.
     */
    crear(pedido: PedidoProyectoIpc): Promise<ResultadoCrearProyecto>;
    /** SHA-1 que wordpress.org publica para la versión (por defecto la del generador). */
    huellaWordpress(version?: string): Promise<string>;
    /** Vuelve a marcar "Confío…" y toma la huella de la receta actual (un solo guardado). */
    confiar(sitioId: string): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar }>;
  };
  /** Plantillas de proyecto: receta, ajustes y esquema sin datos; nunca secretos ni filas. */
  plantillas: {
    lista(): Promise<Plantilla[]>;
    /** Qué archivos entrarían y cuáles se dejan fuera, sin guardar nada. */
    vistaPrevia(
      sitioId: string,
      opciones: Partial<OpcionesPlantilla>,
    ): Promise<VistaPreviaPlantilla>;
    guardar(sitioId: string, opciones: OpcionesPlantilla): Promise<Plantilla>;
    /** Borra solo la plantilla (nunca un proyecto). */
    borrar(id: string): Promise<void>;
  };
  /**
   * Gestor de .env de un proyecto. El renderer nunca recibe un valor secreto: `ver` y
   * `vistaPrevia` los traen enmascarados y solo `revelar` (una clave, por un clic explícito del
   * usuario) devuelve un valor completo. Guardar exige confirmación, deja una copia con fecha y
   * escribe de forma atómica. La clave del usuario propio de la base la genera y la guarda el
   * proceso principal (nunca pasa por aquí).
   */
  env: {
    ver(sitioId: string): Promise<VistaEnv>;
    /** El valor completo de UNA variable (el botón "Mostrar"). */
    revelar(sitioId: string, clave: string): Promise<string>;
    /** El diff enmascarado y la huella del .env que se comparó (`guardar` la exige). */
    vistaPrevia(sitioId: string, pedido: PedidoEnv): Promise<{ diff: string; huella: string }>;
    guardar(
      sitioId: string,
      pedido: PedidoEnv,
      opciones: {
        confirmado: true;
        /** La de `vistaPrevia`: si el .env cambió desde entonces, falla con `env.cambio_externo`. */
        huella: string;
        aceptarVersionado?: boolean;
        agregarGitignore?: boolean;
      },
    ): Promise<{ copia: string | null; gitignoreAgregado: boolean }>;
    /** Copias de este .env (nombres, de la más nueva a la más vieja). */
    copias(sitioId: string): Promise<string[]>;
    restaurarCopia(
      sitioId: string,
      nombre: string,
      opciones: { confirmado: true },
    ): Promise<{ copia: string | null }>;
    /**
     * "Usar usuario propio": crea un usuario limitado a la base del proyecto (MySQL y MariaDB) y
     * lo pone en el .env, con copia previa.
     */
    usarUsuarioPropio(
      sitioId: string,
      opciones: { confirmado: true; aceptarVersionado?: boolean; compartirUsuario?: boolean },
    ): Promise<{ usuario: string; copia: string | null }>;
  };
  /**
   * Importar desde Laragon, XAMPP y Herd. Los sitios se identifican por el id de la vista previa
   * (nunca por rutas) y se vinculan en su lugar; las bases se vuelcan del servidor de origen que
   * enciende el usuario (la clave solo viaja en `ejecutar` y nunca se guarda).
   */
  importar: {
    /** Qué se puede importar y qué pasaría con cada sitio; no escribe nada. */
    vistaPrevia(instancia?: ObjetivoSqlIpc): Promise<VistaPreviaImportar>;
    ejecutar(
      seleccion: string[],
      opciones: Omit<OpcionesImportar, 'instancia'> & { instancia?: ObjetivoSqlIpc },
    ): Promise<ResultadoImportar>;
    /** Cancela la importación en curso (mata solo su volcado y deja cada base como estaba). */
    cancelar(): Promise<boolean>;
  };
  git: {
    disponible(): Promise<DisponibilidadGit>;
    /**
     * Clona (https://…, git@… u owner/name) en `destino`. Reglas del destino:
     * - ruta absoluta que no existe o es una carpeta vacía;
     * - su carpeta padre es la carpeta de proyectos (`config.proyectos.carpetaVigilada` o, si no
     *   hay, `C:\Proyectos` si existe) o una carpeta elegida con `sistema.elegirCarpeta`.
     *   Por defecto: `<carpeta de proyectos>\<nombre del repo>`.
     * Si hay un token guardado lo agrega el proceso principal (si no se puede leer, se clona
     * sin token y el error lo dice). Progreso: `git:progreso`.
     */
    clonar(url: string, destino: string): Promise<void>;
    estado(sitioId: string): Promise<EstadoGit>;
    /** Con cambios locales o ramas divergidas no toca nada y lo dice. */
    traerCambios(sitioId: string): Promise<ResultadoTraer>;
    /**
     * Mensaje de commit propuesto por el proveedor a partir de lo preparado (`git diff
     * --cached` sin `.env*`, claves ni binarios). La clave la pone el proceso principal.
     */
    sugerirCommit(sitioId: string, proveedorId: string, modelo: string): Promise<string>;
    /** "Hacer commit": solo lo preparado (`git commit -F -`); nunca `add` ni `push`. */
    commitPreparado(sitioId: string, mensaje: string): Promise<void>;
  };
  /** Agentes de programación. Ninguno se abre ni se instala sin un clic del usuario. */
  agentes: {
    /** Detección sin ejecutar programas del usuario (versión null = desconocida). */
    estado(): Promise<EstadoAgente[]>;
    /** Versión a pedido (un ejecutable suelto se ejecuta con `--version`). */
    version(id: IdAgente): Promise<string | null>;
    /** Última versión del paquete oficial con el Node propio; `confirmado` sale del diálogo. */
    instalar(id: IdAgente, confirmado: true): Promise<void>;
    /** Entrada `wolfcore` en su configuración, con copia previa del archivo. */
    registrarMcp(id: IdAgente, confirmado: true): Promise<ResultadoRegistroMcp>;
    quitarMcp(id: IdAgente, confirmado: true): Promise<ResultadoRegistroMcp>;
    /**
     * Terminal visible en la carpeta del proyecto con el agente. Con `proveedorId`, el proceso
     * principal pone la clave en el entorno de esa terminal (nunca pasa por aquí).
     */
    abrir(id: IdAgente, sitioId: string, proveedorId?: string): Promise<void>;
  };
  /**
   * PHP de cada rama instalada: php.ini (valores rápidos, diff, guardar con prueba y vuelta
   * atrás, copias) y extensiones. El renderer manda rama, texto o nombres; nunca rutas.
   */
  php: {
    iniLeer(rama: string): Promise<string>;
    /** Valor actual de cada valor rápido (null si no está en el archivo). */
    iniValores(rama: string): Promise<Record<ClaveRapida, string | null>>;
    /** Texto del ini (o del borrador `base`) con los valores aplicados; no escribe nada. */
    iniConValores(
      rama: string,
      valores: Partial<Record<ClaveRapida, string>>,
      base?: string,
    ): Promise<string>;
    /** Diff unificado contra lo guardado ('' si no hay cambios). */
    iniDiff(rama: string, nuevo: string): Promise<string>;
    /** Copia con fecha, prueba con php -v, escribe y reinicia el pool (vuelta atrás si falla). */
    iniGuardar(rama: string, nuevo: string): Promise<{ respaldo: string }>;
    iniRespaldos(rama: string): Promise<RespaldoIni[]>;
    iniRestaurar(rama: string, respaldo: string): Promise<{ respaldo: string }>;
    extensiones(rama: string): Promise<ExtensionPhp[]>;
    extensionActivar(rama: string, nombre: string, activa: boolean): Promise<void>;
    /** Solo del catálogo (variante de la compilación, host permitido y SHA-256). */
    extensionInstalar(rama: string, nombre: string): Promise<void>;
  };
  /** Editor del vhost de Nginx de un sitio (el renderer manda el id y el texto, nunca rutas). */
  nginx: {
    /** Vhost generado (solo lectura), reglas propias y vhost manual (null = el generado). */
    vista(id: string): Promise<VistaVhost>;
    /**
     * Revisa, prueba con `nginx -t` sobre una copia, guarda copia con fecha, escribe y recarga;
     * si Nginx no acepta o deja de responder, vuelve solo a lo anterior (`ok: false` + salida).
     */
    aplicar(id: string, cambio: CambioVhost): Promise<ResultadoEditorVhost>;
    historial(id: string): Promise<VersionVhost[]>;
    restaurar(id: string, version: string): Promise<ResultadoEditorVhost>;
    snippets(): Promise<SnippetNginx[]>;
  };
  github: {
    repos(opciones?: { buscar?: string; pagina?: number }): Promise<RepoGithub[]>;
    /** Se guarda cifrado en el proceso principal; nunca vuelve a la interfaz. */
    guardarToken(token: string): Promise<void>;
    borrarToken(): Promise<void>;
    /** Solo si hay un token guardado. */
    hayToken(): Promise<boolean>;
    instalarGh(): Promise<void>;
    iniciarSesionGh(): Promise<void>;
  };
  runtimes: {
    instalados(tipo: TipoRuntime): Promise<string[]>;
    /** Versiones que usará el proyecto y avisos (versión pedida que falta, rangos…). */
    proyecto(sitioId: string): Promise<RuntimesProyecto>;
  };
  procesos: {
    iniciar(sitioId: string, procesoId: string): Promise<void>;
    detener(sitioId: string, procesoId: string): Promise<void>;
    /** Sin la ruta del log (se ve con `registros`, fuente `proy-<sitio>-<proceso>`). */
    estados(sitioId: string): Promise<EstadoProcesoPublico[]>;
  };
  /** Laravel Reverb por sitio (D45a): proceso con `--host=127.0.0.1`, solo en sitios de confianza. */
  reverb: {
    estado(sitioId: string): Promise<EstadoReverb>;
    /** Da de alta el proceso con un puerto libre y lo enciende; exige `confirmado === true`. */
    activar(sitioId: string, confirmado: true): Promise<{ puerto: number }>;
    desactivar(sitioId: string): Promise<void>;
    /** Variables `REVERB_*` propuestas; se escriben con el gestor de `.env` (vista previa y confirmación). */
    variables(sitioId: string): Promise<Record<string, string>>;
  };
  preferencias: {
    /**
     * Tema, idioma, acento y asistente visto. La primera vez el idioma sale del sistema
     * (`app.getLocale()`) y queda guardado; el tema se aplica a la ventana (`nativeTheme`).
     */
    leer(): Promise<PreferenciasUi>;
    /** Guarda solo los campos dados y aplica el tema; devuelve las preferencias resultantes. */
    guardar(cambios: CambiosPreferenciasUi): Promise<PreferenciasUi>;
  };
  vigilar: {
    sugerencias(): Promise<SugerenciaProyecto[]>;
    /** Carpeta elegida con `sistema.elegirCarpeta`, o null para dejar de vigilar. */
    cambiarCarpeta(carpeta: string | null): Promise<void>;
  };
  metricas: {
    /** Empieza a muestrear cada 3 s mientras la ventana esté visible (`metricas:muestra`). */
    iniciar(): Promise<void>;
    pausar(): Promise<void>;
    /** Muestras de los últimos `min` minutos (1–5). */
    ultimos(min?: number): Promise<MuestraSistema[]>;
  };
  registros: {
    /** Fuentes sin ruta: la interfaz solo conoce el id. */
    fuentes(): Promise<FuenteRegistroPublica[]>;
    /** Empieza a recibir `registro:lineas` de la fuente (hasta que se llame a `dejar`). */
    seguir(id: string): Promise<void>;
    dejar(id: string): Promise<void>;
    /** Últimas líneas (saneadas), hasta 5000. */
    leerFinal(id: string, lineas?: number): Promise<string[]>;
    /** Abre la carpeta del archivo de la fuente. */
    abrirCarpeta(id: string): Promise<void>;
  };
  herramientas: {
    puertos(): Promise<PuertoEnUso[]>;
    /**
     * `confirmacion` es el nombre del proceso. `creado` es el de la lista de puertos (evita
     * matar un PID reutilizado); `forzar` permite los procesos propios.
     */
    finalizarProceso(
      pid: number,
      confirmacion: string,
      opciones?: { forzar?: boolean; creado?: string | null },
    ): Promise<{ pid: number; nombre: string }>;
    /** Rutas elegidas con `sistema.elegirArchivos` o `sistema.elegirCarpeta`. */
    limpiarBom(rutas: string[], simular: boolean): Promise<ResultadoBom[]>;
    /**
     * Emite un certificado de la CA local y lo guarda en `destino` (de `sistema.guardarArchivo`)
     * y su clave junto a él (.key). Los PEM nunca pasan por la interfaz.
     */
    emitirCertificado(dominios: string[], destino: string): Promise<CertificadoGuardado>;
    /** PATH, versiones de las herramientas y variables (los valores secretos llegan enmascarados). */
    entorno(): Promise<EntornoSistema>;
    /**
     * Imagen elegida con `sistema.elegirArchivo`: bytes más dimensiones y tipo leídos de la
     * cabecera. Rechaza lo que pesa más de 30 MB o supera 12000 px por lado (bombas de
     * descompresión) sin decodificarlo.
     */
    leerImagen(ruta: string): Promise<ImagenLeida>;
    /**
     * Guarda el resultado de una conversión o compresión en un archivo nuevo junto al destino
     * elegido con `sistema.guardarArchivo` (si existe, `nombre (1)`); la extensión debe ser de
     * imagen y coincidir con el contenido.
     */
    guardarImagen(destino: string, datos: Uint8Array): Promise<{ archivo: string; bytes: number }>;
    /**
     * Comprime archivos y carpetas (elegidos en diálogos) a un `.zip` nuevo sin seguir enlaces y
     * sin pisar uno existente. Devuelve el peso antes y después.
     */
    comprimirZip(origenes: string[], destino: string): Promise<ResultadoZip>;
    /**
     * Optimiza un PDF en un hilo aparte; solo escribe el archivo nuevo si pesa menos
     * (`mejoro: false` y `archivo: null` si no).
     */
    optimizarPdf(origen: string, destino: string): Promise<ResultadoPdf>;
    /**
     * Conversiones de documentos disponibles (D34). Las de `libreoffice` solo aparecen si
     * LibreOffice ya está instalado (WolfCore Dev no lo instala); `libreOffice` dice si lo está.
     */
    conversionesDocumento(): Promise<{ conversiones: Conversion[]; libreOffice: boolean }>;
    /**
     * Convierte un documento elegido con `sistema.elegirArchivo` al formato `a`, en un archivo
     * nuevo junto al destino de `sistema.guardarArchivo` (nunca pisa uno existente; la extensión
     * siempre es la de `a`). Todo en este equipo, con límites contra archivos maliciosos.
     */
    convertirDocumento(
      origen: string,
      a: Formato,
      destino: string,
    ): Promise<{ destino: string; bytes: number }>;
  };
  /**
   * Cliente HTTP de Herramientas (D48). Las peticiones salen del proceso principal, que compone la
   * petición e inserta los secretos: el renderer solo ve referencias (`ref`) y nunca un valor
   * guardado. `revelar` es la única vía para ver uno (botón «Mostrar»).
   */
  clienteHttp: {
    estado(): Promise<EstadoClienteHttp>;
    /** `idEnvio` permite cancelarla con `cancelar`. */
    enviar(
      peticion: PeticionHttp,
      opciones?: { entornoId?: string | null; idEnvio?: string },
    ): Promise<RespuestaHttp>;
    cancelar(idEnvio: string): Promise<void>;
    guardarPeticion(peticion: PeticionHttp): Promise<PeticionHttp>;
    borrarPeticion(id: string): Promise<void>;
    guardarEntorno(entorno: EntornoHttp): Promise<EntornoHttp>;
    borrarEntorno(id: string): Promise<void>;
    activarEntorno(id: string | null): Promise<void>;
    limpiarHistorial(): Promise<void>;
    revelar(ref: string): Promise<string | null>;
    /** Sin `incluirCredenciales`, los valores secretos salen como `<secreto>`. */
    copiarComoCurl(
      peticion: PeticionHttp,
      entornoId: string | null,
      incluirCredenciales: boolean,
    ): Promise<string>;
    importarCurl(texto: string): Promise<{ peticion: PeticionHttp; avisos: AvisoCurl[] }>;
  };
  /**
   * Servidor de ejemplo de la guía HTTP (D49): escucha solo en 127.0.0.1 y en un puerto aleatorio;
   * arranca al pulsar «Probar», se apaga al cerrar la guía o tras 10 min sin uso.
   */
  ejemploHttp: {
    iniciar(): Promise<{ puerto: number }>;
    detener(): Promise<void>;
  };
  memoria: {
    /**
     * Lista lo que se podría liberar en ese modo (solo lee). `cerrar-programa` viene desmarcado y
     * solo en `profundo`; nunca aparecen procesos del sistema, de otros usuarios, FlyEnv ni
     * WolfCore Dev.
     */
    plan(modo: ModoMemoria): Promise<PlanMemoria>;
    /**
     * Aplica las acciones elegidas del plan `planId` (el que devolvió `plan`; vale 5 minutos y solo
     * el último). `confirmado` debe ser `true`. Nunca mata procesos: a un programa solo se le pide
     * cerrar su ventana, y su memoria solo cuenta si de verdad se cerró.
     */
    aplicar(planId: string, ids: string[], confirmado: true): Promise<ResultadoMemoria>;
  };
  limpiezaDisco: {
    /**
     * Mide lo que se limpiaría (solo lee): por categoría, archivos, bytes y tamaño por carpeta.
     * Sin categorías, todas. Las cachés de un navegador abierto vienen bloqueadas.
     */
    analizar(categorias?: CategoriaLimpieza[]): Promise<ResumenCategoria[]>;
    /**
     * Limpia las categorías elegidas, ya analizadas. `confirmado` debe ser `true`. Solo toca rutas
     * seguras conocidas; nunca sigue enlaces ni toca datos, respaldos ni proyectos.
     */
    limpiar(categorias: CategoriaLimpieza[], confirmado: true): Promise<ResultadoLimpiezaDisco>;
    /** Corta el análisis o la limpieza en curso. */
    cancelar(): Promise<void>;
    /** Abre la carpeta con los registros de lo borrado. */
    abrirRegistros(): Promise<void>;
  };
  editorCodigo: {
    /** Diálogo nativo para elegir el archivo del editor: solo esa ruta se puede abrir y guardar. */
    elegir(): Promise<string | null>;
    /**
     * Abre un archivo de texto elegido con `elegir`. Nunca un
     * `.env`, un binario, uno de más de 2 MB ni nada de la carpeta de datos de WolfCore. Con forma
     * de secreto o de un sitio con datos reales devuelve `confirmar` (sin contenido) hasta que
     * llegue `confirmadoRiesgo: true`.
     */
    abrir(ruta: string, opciones?: OpcionesAbrirArchivo): Promise<ResultadoAbrirArchivo>;
    /**
     * Guarda con `confirmado: true`, la huella del archivo al abrirlo, copia previa y escritura
     * atómica. Si el archivo cambió por fuera devuelve `cambiado` (no escribe nada); `sobrescribir`
     * es una confirmación aparte. Si falta el refuerzo de un archivo delicado devuelve `reforzar`.
     */
    guardar(ruta: string, opciones: OpcionesGuardarArchivo): Promise<ResultadoGuardarEditor>;
    /**
     * La ventana avisa si el editor tiene cambios sin guardar: así «Salir» de la bandeja pregunta
     * antes de perderlos (el cierre de sesión del sistema nunca se bloquea).
     */
    avisarCambios(sinGuardar: boolean): Promise<void>;
  };
  diffCarpetas: {
    /**
     * Compara dos carpetas elegidas con el diálogo nativo (`sistema.elegirCarpeta`). Corre en un
     * proceso aparte, con topes y solo lectura; no sigue enlaces. Una a la vez.
     */
    comparar(a: string, b: string): Promise<ComparacionCarpetas>;
    /** Cancela la comparación o el diff de archivo en curso; false si no había. */
    cancelar(): Promise<boolean>;
    /** Diff de texto de un archivo del grupo «distintos» (por su número, nunca por su ruta). */
    archivo(idComparacion: string, idEntrada: number): Promise<ResultadoArchivoDiff>;
    /**
     * Prepara abrir un archivo de la comparación en el editor de código: el proceso principal
     * registra la ruta (propósito «editor») y la devuelve para `abrirEnEditor`.
     */
    prepararEditor(idComparacion: string, idEntrada: number, lado: 'a' | 'b'): Promise<string>;
  };
  captura: {
    /** Configuración, estado del sistema y del atajo global (D35). */
    leer(): Promise<EstadoCapturaUi>;
    /**
     * Guarda el atajo (null = sin atajo) y el formato. Si otro programa ya usa el atajo no se pisa:
     * `atajo.ok` es false con `captura.atajo_ocupado` y no se guarda nada.
     */
    guardarConfig(
      cambios: CambiosCaptura,
    ): Promise<{ config: CapturaConfig; atajo: ResultadoAtajo }>;
    /** Abre la captura (región, ventana o pantalla completa); las ventanas de la app se ocultan. */
    iniciar(modo: ModoCaptura): Promise<ResultadoIniciarCaptura>;
    /** La imagen que la captura dejó para el conversor de imágenes; se entrega una sola vez. */
    tomarPendiente(): Promise<ImagenPendiente | null>;
  };
  buscar: {
    /**
     * Empieza una búsqueda en segundo plano y devuelve su id. La raíz es la carpeta de un
     * proyecto (`sitioId`) o una ruta elegida en un diálogo (`rutaElegida`, archivo o carpeta);
     * nunca una ruta libre. Los resultados llegan por `busqueda:resultado` y el cierre, con el
     * resumen o el error, por `busqueda:fin`.
     */
    iniciar(opciones: OpcionesBusquedaIpc): Promise<string>;
    /** Cancela la búsqueda; false si ya había terminado. */
    cancelar(id: string): Promise<boolean>;
    /**
     * Prepara abrir un resultado en el editor de código (D43): el proceso principal toma la ruta
     * del resultado que produjo el núcleo (por su número, nunca la aporta la ventana), la registra
     * con el propósito «editor» y la devuelve para `abrirEnEditor`. Caduca a los 15 minutos.
     */
    prepararEditor(idBusqueda: string, idResultado: number): Promise<string>;
  };
  mcp: {
    estado(): Promise<EstadoMcp>;
    iniciar(): Promise<EstadoMcp>;
    detener(): Promise<void>;
    cambiarPuerto(puerto: number): Promise<EstadoMcp>;
    /** Copia al portapapeles la configuración para Claude Code (lleva el token: no se devuelve). */
    configuracion(): Promise<void>;
    /** Token nuevo: el anterior deja de valer al instante. */
    regenerarToken(): Promise<void>;
    /**
     * Respuesta al diálogo de `mcp:confirmar` (los `datos` se muestran como texto plano). false si
     * la confirmación ya no estaba pendiente.
     */
    responderConfirmacion(id: string, aprobado: boolean): Promise<boolean>;
  };
  depuracion: {
    /** Receptor de dumps: activo, puerto y cuántos hay en memoria. */
    estado(): Promise<EstadoReceptor>;
    /** Enciende o apaga el receptor; apagarlo quita la captura de todos los sitios. */
    activar(activa: boolean): Promise<EstadoReceptor>;
    /**
     * Captura de un sitio PHP o FastAPI. Encenderla exige `confirmacion: true`, que solo pasa el
     * diálogo que explicó qué se define (dump/dd/wd o wolfdump).
     */
    captura(
      sitioId: string,
      activa: boolean,
      confirmacion?: true,
    ): Promise<{ sitio: Sitio; aplicar: ResultadoAplicar | null }>;
    /** Resúmenes (los más nuevos primero), con filtro por sitio, origen y texto. */
    lista(filtro?: FiltroDumps): Promise<ResumenDump[]>;
    leer(id: string): Promise<Dump | null>;
    limpiar(): Promise<void>;
    /** Copia al portapapeles el volcado con los secretos enmascarados (no se devuelve). */
    copiar(id: string): Promise<void>;
  };
  errores: {
    /** Errores agrupados de los registros (sin traza), del más reciente al más viejo. */
    lista(filtro?: FiltroErrores): Promise<ResumenError[]>;
    /** Un error con la traza de la última vez (por su huella), o null. */
    leer(huella: string): Promise<ErrorAgrupado | null>;
  };
  editor: {
    /**
     * Abre un archivo del sitio en una línea con el editor elegido (o el predeterminado). El núcleo
     * exige que sea un archivo real dentro de la carpeta del sitio
     * (`depuracion.archivo_fuera_del_sitio` si no).
     */
    abrirEn(
      sitioId: string,
      archivo: string,
      linea: number,
      editor?: IdEditor | null,
    ): Promise<ResultadoAbrirEditor>;
    /** Editores instalados y el predeterminado (null = el primero detectado). */
    disponibles(): Promise<{ disponibles: EditorDisponible[]; porDefecto: IdEditor | null }>;
    cambiarPorDefecto(editor: IdEditor | null): Promise<void>;
  };
  contenedores: {
    /** Docker y Podman: ruta, si responden, versión y si se ignoró un host remoto. */
    motores(): Promise<EstadoMotor[]>;
    /** `ps -a` del motor (ids validados; textos saneados). */
    lista(motor: MotorContenedores): Promise<Contenedor[]>;
    /**
     * Inicia, detiene o reinicia. Detener y reiniciar exigen `confirmacion: true`, que solo pasa
     * el diálogo que lo preguntó. Nunca borra contenedores, imágenes ni volúmenes.
     */
    accion(
      motor: MotorContenedores,
      id: string,
      accion: AccionContenedor,
      confirmacion?: true,
    ): Promise<void>;
    /** Empieza a recibir `contenedor:lineas` (logs -f --tail 500) hasta `dejar`. */
    seguir(motor: MotorContenedores, id: string): Promise<void>;
    dejar(motor: MotorContenedores, id: string): Promise<void>;
  };
  avisos: {
    /** Historial (hasta 200, los más nuevos primero). */
    lista(): Promise<Aviso[]>;
    /** Sin ids marca todos como leídos. */
    marcarLeidos(ids?: string[]): Promise<void>;
    limpiar(): Promise<void>;
    /** Notificaciones nativas y tipos de aviso activos; devuelve la configuración guardada. */
    configurar(cambios: {
      nativas?: boolean;
      tipos?: Partial<Config['avisos']['tipos']>;
    }): Promise<Config['avisos']>;
  };
  doctor: {
    /** Corre las revisiones pedidas (todas por defecto). */
    revisar(ids?: IdRevision[]): Promise<Hallazgo[]>;
    /**
     * Aplica la reparación del hallazgo. `confirmacion` sale SOLO del diálogo que mostró qué se
     * hará; `reparacionId` elige la alternativa (`cambiar-puerto`); `seleccion` son las claves de
     * `Hallazgo.elementos` que el usuario dejó marcadas (todas si no se indica).
     */
    reparar(
      hallazgoId: string,
      confirmacion: true,
      reparacionId?: 'cambiar-puerto',
      seleccion?: string[],
    ): Promise<ResultadoReparacion>;
    ultimo(): Promise<Hallazgo[]>;
  };
  confianza: {
    estado(): Promise<EstadoConfianza>;
    /** NODE_EXTRA_CA_CERTS como variable del usuario (confirmado en un diálogo). */
    nodeGlobal(activar: boolean, confirmacion: true): Promise<EstadoConfianza>;
    /**
     * Bloque de WolfCore Dev en user.js de cada perfil (confirmado en un diálogo). Los perfiles
     * fuera de la carpeta de Firefox solo con `confirmacionFuera` (una casilla aparte).
     */
    firefox(
      activar: boolean,
      confirmacion: true,
      confirmacionFuera?: true,
    ): Promise<ResultadoFirefox[]>;
  };
  sistema: ApiSistema & ApiSistemaNucleo;
  /** Suscribe a un evento del núcleo; devuelve la función para cancelar. */
  on<K extends keyof EventosNucleo>(nombre: K, fn: (dato: EventosNucleo[K]) => void): () => void;
}

/**
 * Datos estructurados que pueden acompañar un error (lista blanca en el proceso principal):
 * `respaldoPrevio` es la copia de seguridad hecha antes de reemplazar una base; el resto son los
 * parámetros que declara el código del error (`PARAMETROS_ERROR` del núcleo).
 */
export type DatosError = Record<string, string | number>;

export type ResultadoIpc<T = unknown> =
  | { ok: true; valor: T }
  | { ok: false; error: { mensaje: string; codigo?: string; datos?: DatosError } };

export const CANAL_EVENTO = 'entorno:evento';
export const PREFIJO_CANAL = 'entorno:';

/** Rutas permitidas (también las únicas que el preload sabe invocar). */
export const RUTAS_IPC = [
  'estadoGeneral',
  'carpetaDatos',
  'perfiles.entorno',
  'perfiles.exportar',
  'perfiles.vistaPrevia',
  'perfiles.importar',
  'perfiles.instantaneas',
  'perfiles.quitarCaAnterior',
  'perfiles.instantanea',
  'sitios.listar',
  'sitios.guardar',
  'sitios.borrar',
  'sitios.aplicar',
  'sitios.phpSitio',
  'sitios.guardarPhpIni',
  'sitios.xdebug',
  'sitios.launchJsonVista',
  'sitios.launchJson',
  'nginx.vista',
  'nginx.aplicar',
  'nginx.historial',
  'nginx.restaurar',
  'nginx.snippets',
  'tareas.lista',
  'tareas.estado',
  'tareas.proximas',
  'tareas.permitirAislado',
  'tareas.guardar',
  'tareas.activar',
  'tareas.confirmar',
  'tareas.borrar',
  'tareas.ejecutarAhora',
  'tareas.historial',
  'tareas.log',
  'tareas.propuestas',
  'tareas.adoptar',
  'tareas.aWolfcoreYml',
  'workspaces.lista',
  'workspaces.estados',
  'workspaces.guardar',
  'workspaces.borrar',
  'workspaces.iniciar',
  'workspaces.detener',
  'servicios.estados',
  'servicios.iniciar',
  'servicios.detener',
  'servicios.iniciarTodo',
  'servicios.detenerTodo',
  'servicios.cambiarPuerto',
  'servicios.borrarDatos',
  'servicios.autoIniciar',
  'bd.listar',
  'bd.crear',
  'bd.borrar',
  'bd.conexion',
  'bd.revelar',
  'bd.revelarBloqueEnv',
  'servicios.conexion',
  'servicios.revelarSecreto',
  'bd.bloqueEnv',
  'bd.bloqueEnvSitio',
  'bd.lentasEstado',
  'bd.lentasCambiar',
  'bd.lentasLeer',
  'bd.lentasLiteral',
  'bd.esquema',
  'bd.carpetaRespaldos',
  'bd.tieneTablas',
  'bd.formato',
  'bd.restaurar',
  'bd.respaldar',
  'bd.importar',
  'instantaneas.lista',
  'instantaneas.tomar',
  'instantaneas.vistaPrevia',
  'instantaneas.volver',
  'instantaneas.borrar',
  'instantaneas.listaInstancia',
  'instantaneas.papelera',
  'instantaneas.recuperar',
  'auditoriaClaves.auditar',
  'auditoriaClaves.progreso',
  'auditoriaClaves.cancelar',
  'auditoriaClaves.vistaPrevia',
  'auditoriaClaves.restablecer',
  'pgvector.estado',
  'pgvector.instalarBuildTools',
  'pgvector.compilarEInstalar',
  'pgvector.activar',
  'https.estado',
  'https.instalarCA',
  'https.quitarCA',
  'https.cambiarPuerto',
  'composer.version',
  'composer.instalar',
  'composer.actualizar',
  'composer.cambiarPhpPorDefecto',
  'terminal.abrir',
  'terminal.disponibles',
  'terminal.cambiarPorDefecto',
  'path.estado',
  'path.cambiar',
  'cli.estado',
  'cli.cambiarPath',
  'adminer.instalar',
  'adminer.disponibilidad',
  'adminer.url',
  'adminer.proyecto',
  'phpmyadmin.instalar',
  'phpmyadmin.disponibilidad',
  'accesoBd.abrir',
  'ftp.activar',
  'ftp.desactivar',
  'ftp.regenerarClave',
  'ftp.soloLectura',
  'ftp.credenciales',
  'ftp.url',
  'ftp.redLocal',
  'lan.estado',
  'lan.activar',
  'lan.desactivar',
  'lan.comandoFirewall',
  'lan.abrirCaMovil',
  'lan.cerrarCaMovil',
  'ia.modelos',
  'ia.descargar',
  'ia.cancelar',
  'ia.borrar',
  'ia.probar',
  'ia.espacioUsado',
  'ia.bloqueEnv',
  'ia.sugeridos',
  'ia.proveedores',
  'ia.guardarProveedor',
  'ia.borrarProveedor',
  'ia.guardarClave',
  'ia.borrarClave',
  'ia.estadoClave',
  'ia.respaldosClave',
  'ia.probarConexion',
  'ia.probarMensaje',
  'ia.previsualizarEnv',
  'ia.escribirEnv',
  'agentes.estado',
  'agentes.version',
  'agentes.instalar',
  'agentes.registrarMcp',
  'agentes.quitarMcp',
  'agentes.abrir',
  'mailpit.noLeidos',
  'correo.captadores',
  'correo.elegir',
  'correo.presets',
  'correo.proveedores',
  'correo.guardarProveedor',
  'correo.borrarProveedor',
  'correo.guardarClave',
  'correo.borrarClave',
  'correo.probarEnvio',
  'correo.usarEnSitio',
  'correo.vistaPreviaEnv',
  'correo.escribirEnv',
  'avisoInicio',
  'instalador.listarVersiones',
  'instalador.instalar',
  'instalador.instalados',
  'instalador.desinstalar',
  'limpiezaVersiones.sinUso',
  'limpiezaVersiones.limpiar',
  'limpiezaVersiones.papelera',
  'limpiezaVersiones.recuperar',
  'catalogo.versiones',
  'catalogo.silenciar',
  'instancias.lista',
  'instancias.crear',
  'instancias.iniciar',
  'instancias.detener',
  'instancias.puerto',
  'instancias.predeterminar',
  'instancias.quitar',
  'instancias.borrarDatos',
  'instancias.desbloquear',
  'servicios.planActualizar',
  'servicios.actualizar',
  'servicios.nuevaRama',
  'servicios.predeterminada',
  'servicios.respaldosDatos',
  'servicios.borrarRespaldoDatos',
  'tuneles.abrir',
  'tuneles.cerrar',
  'tuneles.renovar',
  'tuneles.estados',
  'tuneles.cuentaCloudflare',
  'tuneles.conectarCloudflare',
  'tuneles.cancelarConexionCloudflare',
  'tuneles.desconectarCloudflare',
  'tuneles.olvidarCloudflare',
  'tuneles.recrearCloudflare',
  'tuneles.configurarCloudflare',
  'tuneles.usarTunelRapido',
  'tuneles.usarProveedor',
  'tuneles.estadoToken',
  'tuneles.guardarToken',
  'tuneles.borrarToken',
  'hosts.sincronizar',
  'detectarProyecto',
  'config.leer',
  'ajustes.guardar',
  'sistema.elegirCarpeta',
  'sistema.elegirArchivo',
  'sistema.abrirUrl',
  'sistema.abrirGrabadora',
  'sistema.abrirCarpeta',
  'sistema.copiar',
  'sistema.version',
  'proyectos.detectar',
  'proyectos.configLeer',
  'proyectos.configGuardar',
  'proyectos.recetaPorDefecto',
  'proyectos.ejecutarReceta',
  'proyectos.omitirPaso',
  'proyectos.estadoReceta',
  'proyectos.cancelarReceta',
  'proyectos.resumenReceta',
  'proyectos.crearSitio',
  'proyectos.crear',
  'proyectos.huellaWordpress',
  'proyectos.confiar',
  'plantillas.lista',
  'plantillas.vistaPrevia',
  'plantillas.guardar',
  'plantillas.borrar',
  'env.ver',
  'env.revelar',
  'env.vistaPrevia',
  'env.guardar',
  'env.copias',
  'env.restaurarCopia',
  'env.usarUsuarioPropio',
  'importar.vistaPrevia',
  'importar.ejecutar',
  'importar.cancelar',
  'git.disponible',
  'git.clonar',
  'git.estado',
  'git.traerCambios',
  'git.sugerirCommit',
  'git.commitPreparado',
  'github.repos',
  'github.guardarToken',
  'github.borrarToken',
  'github.hayToken',
  'github.instalarGh',
  'github.iniciarSesionGh',
  'runtimes.instalados',
  'runtimes.proyecto',
  'procesos.iniciar',
  'procesos.detener',
  'procesos.estados',
  'reverb.estado',
  'reverb.activar',
  'reverb.desactivar',
  'reverb.variables',
  'preferencias.leer',
  'preferencias.guardar',
  'vigilar.sugerencias',
  'vigilar.cambiarCarpeta',
  'metricas.iniciar',
  'metricas.pausar',
  'metricas.ultimos',
  'registros.fuentes',
  'registros.seguir',
  'registros.dejar',
  'registros.leerFinal',
  'registros.abrirCarpeta',
  'herramientas.puertos',
  'herramientas.finalizarProceso',
  'herramientas.limpiarBom',
  'herramientas.emitirCertificado',
  'herramientas.entorno',
  'herramientas.leerImagen',
  'herramientas.guardarImagen',
  'herramientas.comprimirZip',
  'herramientas.optimizarPdf',
  'herramientas.conversionesDocumento',
  'herramientas.convertirDocumento',
  'clienteHttp.estado',
  'clienteHttp.enviar',
  'clienteHttp.cancelar',
  'clienteHttp.guardarPeticion',
  'clienteHttp.borrarPeticion',
  'clienteHttp.guardarEntorno',
  'clienteHttp.borrarEntorno',
  'clienteHttp.activarEntorno',
  'clienteHttp.limpiarHistorial',
  'clienteHttp.revelar',
  'clienteHttp.copiarComoCurl',
  'clienteHttp.importarCurl',
  'ejemploHttp.iniciar',
  'ejemploHttp.detener',
  'memoria.plan',
  'memoria.aplicar',
  'limpiezaDisco.analizar',
  'limpiezaDisco.limpiar',
  'limpiezaDisco.cancelar',
  'limpiezaDisco.abrirRegistros',
  'editorCodigo.elegir',
  'editorCodigo.abrir',
  'editorCodigo.guardar',
  'editorCodigo.avisarCambios',
  'diffCarpetas.comparar',
  'diffCarpetas.cancelar',
  'diffCarpetas.archivo',
  'diffCarpetas.prepararEditor',
  'captura.leer',
  'captura.guardarConfig',
  'captura.iniciar',
  'captura.tomarPendiente',
  'buscar.iniciar',
  'buscar.cancelar',
  'buscar.prepararEditor',
  'mcp.estado',
  'mcp.iniciar',
  'mcp.detener',
  'mcp.cambiarPuerto',
  'mcp.configuracion',
  'mcp.regenerarToken',
  'mcp.responderConfirmacion',
  'sistema.guardarArchivo',
  'sistema.elegirArchivos',
  'sistema.abrirEditor',
  'depuracion.estado',
  'depuracion.activar',
  'depuracion.captura',
  'depuracion.lista',
  'depuracion.leer',
  'depuracion.limpiar',
  'depuracion.copiar',
  'errores.lista',
  'errores.leer',
  'editor.abrirEn',
  'editor.disponibles',
  'editor.cambiarPorDefecto',
  'contenedores.motores',
  'contenedores.lista',
  'contenedores.accion',
  'contenedores.seguir',
  'contenedores.dejar',
  'avisos.lista',
  'avisos.marcarLeidos',
  'avisos.limpiar',
  'avisos.configurar',
  'doctor.revisar',
  'doctor.reparar',
  'doctor.ultimo',
  'confianza.estado',
  'confianza.nodeGlobal',
  'confianza.firefox',
  'php.iniLeer',
  'php.iniValores',
  'php.iniConValores',
  'php.iniDiff',
  'php.iniGuardar',
  'php.iniRespaldos',
  'php.iniRestaurar',
  'php.extensiones',
  'php.extensionActivar',
  'php.extensionInstalar',
] as const;
/** Lo que manda el asistente de nuevo proyecto: la carpeta es la padre (de un diálogo). */
export type PedidoProyectoIpc = Omit<PedidoProyecto, 'carpeta'> & { carpetaPadre: string };

export type {
  EstadoCapturaUi,
  ImagenPendiente,
  ModoCaptura,
  ResultadoAtajo,
  ResultadoIniciarCaptura,
} from './captura';
export type {
  ConsultasLentasLeidas,
  EntradaLenta,
  EsquemaBase,
  EstadoConsultasLentas,
  RefTabla,
  TablaEsquema,
} from '@pel/core';
export type RutaIpc = (typeof RUTAS_IPC)[number];

/** Lo que manda la interfaz: la raíz va aparte (proyecto o diálogo). */
export type OpcionesBusquedaIpc = Omit<OpcionesBusqueda, 'raiz' | 'vetadas' | 'sitios'> &
  ({ sitioId: string; rutaElegida?: undefined } | { rutaElegida: string; sitioId?: undefined });

export const EVENTOS_IPC = [
  'servicio:estado',
  'sitio:cambio',
  'tunel:estado',
  'tunel:autorizacion',
  'instalacion:progreso',
  'perfil:progreso',
  'hosts:estado',
  'bd:progreso',
  'ia:progreso',
  'aviso:inicio',
  'aviso:nuevo',
  'aviso:abrir',
  'receta:progreso',
  'tarea:terminada',
  'git:progreso',
  'proyectos:sugerencias',
  'metricas:muestra',
  'registro:lineas',
  'mcp:confirmar',
  'mcp:confirmacion-cerrada',
  'dump:nuevo',
  'contenedor:lineas',
  'busqueda:resultado',
  'busqueda:fin',
  'captura:imagen',
] as const satisfies readonly (keyof EventosNucleo)[];

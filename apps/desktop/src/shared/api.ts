import type {
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
  ResultadoBusqueda,
  ResumenBusqueda,
  OpcionesBusqueda,
  LoteBusqueda,
  FinBusqueda,
  ResultadoReceta,
  PedidoProyecto,
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
  DisponibilidadAdminer,
  EstadoGeneral,
  EstadoHosts,
  EstadoHttps,
  EstadoServicio,
  EstadoTunel,
  EventosNucleo,
  FormatoRespaldo,
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
} from '@pel/core';

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
  ResultadoBusqueda,
  ResumenBusqueda,
  OpcionesBusqueda,
  LoteBusqueda,
  FinBusqueda,
  ResultadoReceta,
  PedidoProyecto,
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
  DisponibilidadAdminer,
  BaseProyecto,
  IdTerminal,
  TerminalDisponible,
  EstadoGeneral,
  EstadoHosts,
  EstadoHttps,
  EstadoServicio,
  EstadoTunel,
  EventosNucleo,
  FormatoRespaldo,
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
export type ObjetivoSqlIpc = MotorSql | IdInstancia;
export type {
  EstadoInstancia,
  IdInstancia,
  PlanActualizar,
  RespaldoDatos,
  ResultadoNuevaRama,
  ServicioVersiones,
  TablaVersiones,
  TipoRespaldoDatos,
};
/** Una copia de `data/<servicio>/` por sus ids (nunca por su ruta). */
export interface RefRespaldoDatos {
  servicio: IdServicioDatos;
  clave: string;
  tipo: TipoRespaldoDatos;
  sello: string;
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

/** Puerto fijo de Adminer (igual que `PUERTO_ADMINER` del núcleo; solo se muestra). */
export const PUERTO_ADMINER = 8090;

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

export interface ApiSistema {
  /** Abre el selector de carpetas; devuelve null si se cancela. */
  elegirCarpeta(): Promise<string | null>;
  /** Abre el selector de archivos (p. ej. un respaldo); devuelve null si se cancela. */
  elegirArchivo(): Promise<string | null>;
  /** Solo http/https. */
  abrirUrl(url: string): Promise<void>;
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
  /** Abre la carpeta del proyecto en VS Code; error claro si no está instalado. */
  abrirEditor(sitioId: string): Promise<void>;
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
  servicios: {
    estados(): Promise<EstadoServicio[]>;
    iniciar(id: string): Promise<void>;
    detener(id: string): Promise<void>;
    iniciarTodo(): Promise<void>;
    /** Cierra primero los túneles (devolviendo los .env) y luego detiene los servicios. */
    detenerTodo(): Promise<void>;
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
    /** Datos de conexión con la clave: solo para el diálogo "Datos de conexión". */
    conexion(motor: ObjetivoBdIpc): Promise<DatosConexion>;
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
  adminer: {
    instalar(): Promise<void>;
    disponibilidad(): Promise<DisponibilidadAdminer>;
    /** URL sin clave; null si Adminer no soporta el motor. */
    url(motor: MotorBd, usuario: string): Promise<string | null>;
    /** Base del proyecto (según su .env) y su URL de Adminer, sin clave; url null si no hay. */
    proyecto(sitioId: string): Promise<{ base: BaseProyecto | null; url: string | null }>;
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
  tuneles: {
    /** `confirmado`: el usuario confirmó publicar (exigido con datos reales). */
    abrir(sitioId: string, confirmado?: boolean): Promise<EstadoTunel>;
    cerrar(sitioId: string): Promise<void>;
    renovar(sitioId: string, confirmado?: boolean): Promise<EstadoTunel>;
    estados(): Promise<EstadoTunel[]>;
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
     * Abre un archivo del sitio en VS Code en una línea. El núcleo exige que sea un archivo real
     * dentro de la carpeta del sitio (`depuracion.archivo_fuera_del_sitio` si no).
     */
    abrirEn(sitioId: string, archivo: string, linea: number): Promise<void>;
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
     * hará; `reparacionId` elige la alternativa (`cambiar-puerto`).
     */
    reparar(
      hallazgoId: string,
      confirmacion: true,
      reparacionId?: 'cambiar-puerto',
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
  'bd.bloqueEnv',
  'bd.bloqueEnvSitio',
  'bd.carpetaRespaldos',
  'bd.tieneTablas',
  'bd.formato',
  'bd.restaurar',
  'bd.respaldar',
  'bd.importar',
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
  'adminer.instalar',
  'adminer.disponibilidad',
  'adminer.url',
  'adminer.proyecto',
  'ftp.activar',
  'ftp.desactivar',
  'ftp.regenerarClave',
  'ftp.soloLectura',
  'ftp.credenciales',
  'ftp.url',
  'ftp.redLocal',
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
  'avisoInicio',
  'instalador.listarVersiones',
  'instalador.instalar',
  'instalador.instalados',
  'instalador.desinstalar',
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
  'hosts.sincronizar',
  'detectarProyecto',
  'config.leer',
  'ajustes.guardar',
  'sistema.elegirCarpeta',
  'sistema.elegirArchivo',
  'sistema.abrirUrl',
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
  'buscar.iniciar',
  'buscar.cancelar',
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

export type RutaIpc = (typeof RUTAS_IPC)[number];

/** Lo que manda la interfaz: la raíz va aparte (proyecto o diálogo). */
export type OpcionesBusquedaIpc = Omit<OpcionesBusqueda, 'raiz'> &
  ({ sitioId: string; rutaElegida?: undefined } | { rutaElegida: string; sitioId?: undefined });

export const EVENTOS_IPC = [
  'servicio:estado',
  'sitio:cambio',
  'tunel:estado',
  'instalacion:progreso',
  'hosts:estado',
  'bd:progreso',
  'ia:progreso',
  'aviso:inicio',
  'aviso:nuevo',
  'aviso:abrir',
  'receta:progreso',
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
] as const satisfies readonly (keyof EventosNucleo)[];

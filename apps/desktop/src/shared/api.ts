import type {
  CierreConfirmacion,
  ConfigProyecto,
  Deteccion,
  DisponibilidadGit,
  EstadoGit,
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
  ResultadoReceta,
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
} from '@pel/core';

export type {
  CierreConfirmacion,
  ConfigProyecto,
  Deteccion,
  DisponibilidadGit,
  EstadoGit,
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
  ResultadoReceta,
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
};

export type MotorSql = Exclude<MotorBd, 'mongodb'>;

/** Puerto fijo de Adminer (igual que `PUERTO_ADMINER` del núcleo; solo se muestra). */
export const PUERTO_ADMINER = 8090;

export interface EstadoPgvector {
  buildTools: boolean;
  instalado: boolean;
  version: string | null;
}

/** Lo único que el renderer elige al instalar: el proceso principal re-resuelve la URL y la huella. */
export type SeleccionVersion = Pick<VersionDisponible, 'servicio' | 'version'>;

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
  };
  servicios: {
    estados(): Promise<EstadoServicio[]>;
    iniciar(id: string): Promise<void>;
    detener(id: string): Promise<void>;
    iniciarTodo(): Promise<void>;
    /** Cierra primero los túneles (devolviendo los .env) y luego detiene los servicios. */
    detenerTodo(): Promise<void>;
    /** 1024–65535 y libre; reinicia el servicio si estaba encendido. */
    cambiarPuerto(id: IdServicioDatos, puerto: number): Promise<void>;
    /** `confirmacion` debe ser el id del servicio. */
    borrarDatos(id: IdServicioDatos, confirmacion: string): Promise<void>;
    /** Encender (o no) el servicio al iniciar WolfCore Dev; no lo enciende ahora. */
    autoIniciar(id: IdServicioDatos, valor: boolean): Promise<void>;
  };
  bd: {
    listar(motor: MotorBd): Promise<BaseListada[]>;
    crear(motor: MotorBd, nombre: string, opciones?: OpcionesCrearBase): Promise<ResultadoCrear>;
    /** `confirmacion` debe ser el nombre exacto de la base. */
    borrar(motor: MotorBd, nombre: string, confirmacion: string): Promise<void>;
    /** Datos de conexión con la clave: solo para el diálogo "Datos de conexión". */
    conexion(motor: MotorBd): Promise<DatosConexion>;
    bloqueEnv(
      motor: MotorBd,
      base: string,
      tipoProyecto: TipoSitio | 'generico',
      envActual?: string,
    ): Promise<string>;
    /**
     * Bloque .env para el proyecto de un sitio: el núcleo lee el .env del sitio (para respetar
     * sus variables) y devuelve solo el bloque generado.
     */
    bloqueEnvSitio(sitioId: string, motor: MotorBd, base: string): Promise<string>;
    /** Carpeta real de respaldos y copias de seguridad automáticas (Documentos\WolfCore Dev\Respaldos). */
    carpetaRespaldos(): Promise<string>;
    tieneTablas(motor: MotorSql, base: string): Promise<boolean>;
    formato(archivo: string): Promise<FormatoRespaldo>;
    restaurar(
      motor: MotorSql,
      archivo: string,
      base: string,
      opciones?: OpcionesRestaurar,
    ): Promise<ResultadoRestaurar>;
    respaldar(motor: MotorSql, base: string, carpetaDestino?: string): Promise<{ archivo: string }>;
    /** Solo se lee el servidor de origen. */
    importar(
      motor: MotorSql,
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
    abrir(sitioId: string): Promise<void>;
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
  };
  ftp: {
    activar(sitioId: string): Promise<Credenciales>;
    desactivar(sitioId: string): Promise<void>;
    regenerarClave(sitioId: string): Promise<string>;
    soloLectura(sitioId: string, valor: boolean): Promise<void>;
    credenciales(sitioId: string): Promise<Credenciales | null>;
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
    listarVersiones(servicio: VersionDisponible['servicio']): Promise<VersionDisponible[]>;
    instalar(seleccion: SeleccionVersion): Promise<void>;
    instalados(servicio: string): Promise<string[]>;
  };
  tuneles: {
    abrir(sitioId: string): Promise<EstadoTunel>;
    cerrar(sitioId: string): Promise<void>;
    renovar(sitioId: string): Promise<EstadoTunel>;
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
  sistema: ApiSistema;
  /** Suscribe a un evento del núcleo; devuelve la función para cancelar. */
  on<K extends keyof EventosNucleo>(nombre: K, fn: (dato: EventosNucleo[K]) => void): () => void;
}

/**
 * Datos estructurados que pueden acompañar un error (lista blanca en el proceso principal):
 * `respaldoPrevio` es la copia de seguridad hecha antes de reemplazar una base.
 */
export interface DatosError {
  respaldoPrevio?: string;
}

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
  'path.estado',
  'path.cambiar',
  'adminer.instalar',
  'adminer.disponibilidad',
  'adminer.url',
  'ftp.activar',
  'ftp.desactivar',
  'ftp.regenerarClave',
  'ftp.soloLectura',
  'ftp.credenciales',
  'ftp.redLocal',
  'ia.modelos',
  'ia.descargar',
  'ia.cancelar',
  'ia.borrar',
  'ia.probar',
  'ia.espacioUsado',
  'ia.bloqueEnv',
  'ia.sugeridos',
  'mailpit.noLeidos',
  'avisoInicio',
  'instalador.listarVersiones',
  'instalador.instalar',
  'instalador.instalados',
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
  'git.disponible',
  'git.clonar',
  'git.estado',
  'git.traerCambios',
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
  'mcp.estado',
  'mcp.iniciar',
  'mcp.detener',
  'mcp.cambiarPuerto',
  'mcp.configuracion',
  'mcp.regenerarToken',
  'mcp.responderConfirmacion',
  'sistema.guardarArchivo',
  'sistema.elegirArchivos',
] as const;
export type RutaIpc = (typeof RUTAS_IPC)[number];

export const EVENTOS_IPC = [
  'servicio:estado',
  'sitio:cambio',
  'tunel:estado',
  'instalacion:progreso',
  'hosts:estado',
  'bd:progreso',
  'ia:progreso',
  'aviso:inicio',
  'receta:progreso',
  'git:progreso',
  'proyectos:sugerencias',
  'metricas:muestra',
  'registro:lineas',
  'mcp:confirmar',
  'mcp:confirmacion-cerrada',
] as const satisfies readonly (keyof EventosNucleo)[];

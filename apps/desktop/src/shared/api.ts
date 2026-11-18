import type {
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
] as const satisfies readonly (keyof EventosNucleo)[];

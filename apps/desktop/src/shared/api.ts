import type {
  Config,
  EstadoGeneral,
  EstadoHosts,
  EstadoServicio,
  EstadoTunel,
  EventosNucleo,
  ProgresoInstalacion,
  ProyectoDetectado,
  ResultadoAplicar,
  ResultadoSync,
  Sitio,
  VersionDisponible,
} from '@pel/core';

export type {
  Config,
  EstadoGeneral,
  EstadoHosts,
  EstadoServicio,
  EstadoTunel,
  EventosNucleo,
  ProgresoInstalacion,
  ProyectoDetectado,
  ResultadoAplicar,
  ResultadoSync,
  Sitio,
  VersionDisponible,
};

export type DatosSitio = Omit<Sitio, 'id'>;

export interface ApiSistema {
  /** Abre el selector de carpetas; devuelve null si se cancela. */
  elegirCarpeta(): Promise<string | null>;
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
    detenerTodo(): Promise<void>;
  };
  instalador: {
    listarVersiones(servicio: VersionDisponible['servicio']): Promise<VersionDisponible[]>;
    instalar(version: VersionDisponible): Promise<void>;
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
    guardar(config: Config): Promise<void>;
  };
  sistema: ApiSistema;
  /** Suscribe a un evento del núcleo; devuelve la función para cancelar. */
  on<K extends keyof EventosNucleo>(nombre: K, fn: (dato: EventosNucleo[K]) => void): () => void;
}

export type ResultadoIpc<T = unknown> =
  { ok: true; valor: T } | { ok: false; error: { mensaje: string; codigo?: string } };

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
  'config.guardar',
  'sistema.elegirCarpeta',
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
] as const satisfies readonly (keyof EventosNucleo)[];

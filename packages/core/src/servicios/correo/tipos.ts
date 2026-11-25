/** Captadores de correo locales que WolfCore Dev instala y supervisa. */
export const IDS_CAPTADOR = ['mailpit', 'smtp4dev', 'inbucket', 'papercut'] as const;
export type IdCaptador = (typeof IDS_CAPTADOR)[number];

/** Grupo de exclusión: solo uno de los captadores puede estar encendido. */
export const GRUPO_CORREO = 'correo';

/** Dirección en la que escuchan todos los captadores, en SMTP y en su interfaz web. */
export const DIRECCION_LOCAL = '127.0.0.1';

/** Puerto SMTP común a los captadores (solo uno corre a la vez). */
export const PUERTO_SMTP_POR_DEFECTO = 1025;

/**
 * Variables heredadas del entorno del usuario que nunca se pasan a un captador (prefijos, sin
 * distinguir mayúsculas): cambiarían su dirección de escucha o su configuración sin que se vea.
 */
export const QUITAR_ENTORNO_CAPTADOR: readonly string[] = [
  'KESTREL__',
  'KESTREL:',
  'ASPNETCORE_',
  'DOTNET_',
  'INBUCKET_',
  'MP_',
  'SERVEROPTIONS__',
  'SERVEROPTIONS:',
  'SMTPSERVER__',
  'SMTPSERVER:',
  'ALLOWEDHOSTS',
  'URLS',
];

/** Excepciones a `QUITAR_ENTORNO_CAPTADOR`: dónde está el runtime de .NET sí se hereda. */
export const CONSERVAR_ENTORNO_CAPTADOR: readonly string[] = ['DOTNET_ROOT'];

export interface OpcionesCaptador {
  smtp: number;
  web: number;
  /** Carpeta de datos del captador (`data/<id>/actual`). */
  datos: string;
  /** Ruta base secreta de la web (sin barras); vacía si el captador no la usa. */
  ruta: string;
}

export interface DefCaptador {
  id: IdCaptador;
  nombre: string;
  /** Se ofrece como instalación opcional (no es de los dos principales). */
  opcional: boolean;
  /** La interfaz avisa de que el proyecto casi no se mantiene. */
  avisoMantenimiento: boolean;
  puertoSmtp: number;
  puertoWeb: number;
  /** Ejecutable principal, relativo a la carpeta del paquete. */
  ejecutable: string;
  /** Argumentos: siempre `127.0.0.1` explícito, nunca la dirección por defecto del programa. */
  args(o: OpcionesCaptador): string[];
  /** Variables de entorno para los captadores que se configuran así (sin secretos). */
  env?(o: OpcionesCaptador & { bin: string }): Record<string, string>;
  /** Carpeta de trabajo del proceso; por defecto, la del paquete. */
  cwd?(o: { bin: string; datos: string }): string;
  /** Carpetas que hay que crear antes de arrancar. */
  carpetas?(datos: string): string[];
  /**
   * La web se sirve bajo una ruta base secreta y aleatoria por instalación: un `Host` ajeno
   * (DNS rebinding) no la conoce. Solo se marca donde la raíz no la delata.
   */
  rutaSecreta?: boolean;
  /** Archivos que se reescriben en la carpeta del paquete en cada arranque. */
  archivos?(o: OpcionesCaptador & { bin: string }): { nombre: string; contenido: string }[];
  /** Puertos propios adicionales (POP3 de Inbucket), también solo locales. */
  puertosExtra?: number[];
}

/**
 * Captador estudiado que no entra. Sin binario oficial para Windows con huella fuerte no se
 * descarga nada: la huella es lo único que une lo descargado con lo que publicó el autor.
 */
export interface CaptadorDescartado {
  id: string;
  nombre: string;
  motivo: string;
  fuente: string;
}

/** Un captador con su estado, para la pantalla Correo. */
export interface EstadoCaptador {
  id: IdCaptador;
  nombre: string;
  opcional: boolean;
  avisoMantenimiento: boolean;
  instalado: boolean;
  encendido: boolean;
  /** El que reciben los proyectos (`Config.correo.captador`). */
  elegido: boolean;
  puertoSmtp: number;
  puertoWeb: number;
  /** Siempre `http://127.0.0.1:<web>`. */
  urlWeb: string;
}

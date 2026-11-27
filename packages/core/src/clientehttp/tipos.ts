/**
 * Cliente HTTP de Herramientas (D48). Tipos compartidos con la interfaz: una petición guardada solo
 * lleva REFERENCIAS a secretos (`ref`, un id `http:<16 hex>` de `AlmacenSecretos`), nunca valores.
 */

export const METODOS_HTTP = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type MetodoHttp = (typeof METODOS_HTTP)[number];

/** Plazo por defecto y máximo de una petición, en segundos. */
export const PLAZO_HTTP_DEFECTO_SEG = 30;
export const PLAZO_HTTP_MAX_SEG = 120;
/** Respuesta más grande: se corta y se marca como truncada. */
export const MAX_RESPUESTA_HTTP = 10 * 1024 * 1024;
export const MAX_REDIRECCIONES_HTTP = 10;
/** Cuerpo de la petición (enviado o guardado). */
export const MAX_CUERPO_PETICION = 1024 * 1024;
export const MAX_HISTORIAL_HTTP = 100;
export const MAX_COLECCION_HTTP = 500;
export const MAX_ENTORNOS_HTTP = 50;
export const MAX_VARIABLES_ENTORNO = 100;
export const MAX_PARES_HTTP = 100;
/** Tope del texto de `curl` que se importa. */
export const MAX_CURL = 64 * 1024;

/** Fila de parámetros, cabeceras o campos. `ref`: el valor vive en `AlmacenSecretos`. */
export interface ParHttp {
  clave: string;
  valor: string;
  activo: boolean;
  ref?: string;
  /** Se perdió su secreto (ref ajena, copia o historial): hay que escribirlo antes de enviar. */
  faltante?: boolean;
}

export type CuerpoHttp =
  | { tipo: 'ninguno' }
  | { tipo: 'json'; texto: string }
  | { tipo: 'raw'; texto: string; tipoContenido?: string }
  | { tipo: 'form'; campos: ParHttp[] }
  | { tipo: 'multipart'; campos: ParHttp[] };

/** `valor` solo viaja del renderer al proceso principal (lo que el usuario acaba de escribir). */
export type AuthHttp =
  | { tipo: 'ninguna' }
  | { tipo: 'bearer'; valor?: string; ref?: string }
  | { tipo: 'basic'; usuario: string; valor?: string; ref?: string }
  | { tipo: 'apikey'; nombre: string; en: 'cabecera' | 'query'; valor?: string; ref?: string };

export interface PeticionHttp {
  /** '' mientras no se guarda en la colección. */
  id: string;
  nombre: string;
  metodo: MetodoHttp;
  url: string;
  params: ParHttp[];
  cabeceras: ParHttp[];
  cuerpo: CuerpoHttp;
  auth: AuthHttp;
  plazoSeg: number;
  ignorarCertificado: boolean;
}

export interface VariableHttp {
  nombre: string;
  valor: string;
  secreta: boolean;
  ref?: string;
}

export interface EntornoHttp {
  id: string;
  nombre: string;
  variables: VariableHttp[];
}

export interface SaltoHttp {
  /** URL de la petición de este salto (sin credenciales ni claves en la consulta). */
  url: string;
  estado: number;
  ubicacion: string;
}

export interface RespuestaHttp {
  estado: number;
  mensajeEstado: string;
  tiempoMs: number;
  /** Bytes del cuerpo recibido (los del corte si es truncada). */
  tamano: number;
  cabeceras: [string, string][];
  tipoContenido: string;
  /** El cuerpo siempre como texto; si no es texto, solo su tamaño y tipo. */
  cuerpo: { tipo: 'texto'; texto: string; json: string | null } | { tipo: 'binario' };
  truncada: boolean;
  saltos: SaltoHttp[];
  urlFinal: string;
  certificadoIgnorado: boolean;
  /** Se confió además en la CA de WolfCore para este host. */
  caWolf: boolean;
}

export interface EntradaHistorialHttp {
  id: string;
  fecha: string;
  /** Sin valores secretos: sus campos sensibles quedan como `***`. */
  peticion: PeticionHttp;
  estado: number | null;
  tiempoMs: number;
  tamano: number;
  /** Código de error de la petición que no llegó a tener respuesta. */
  error?: string;
}

export interface EstadoClienteHttp {
  coleccion: PeticionHttp[];
  historial: EntradaHistorialHttp[];
  entornos: EntornoHttp[];
  entornoActivo: string | null;
}

export interface AvisoCurl {
  codigo:
    | 'opcion_ignorada'
    | 'archivo_ignorado'
    | 'inseguro_ignorado'
    | 'comando_cortado'
    | 'sin_evaluar'
    | 'url_sin_esquema'
    | 'varias_urls'
    | 'cabecera_invalida'
    | 'secretos_guardados';
  dato?: string;
}

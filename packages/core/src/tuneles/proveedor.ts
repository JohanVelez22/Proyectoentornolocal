import { z } from 'zod';
import type { Sitio } from '../tipos';

export const IDS_PROVEEDOR_TUNEL = [
  'cloudflare-rapido',
  'cloudflare-nombre',
  'ngrok',
  'expose',
  'tailscale',
] as const;
export type IdProveedorTunel = (typeof IDS_PROVEEDOR_TUNEL)[number];

/** Nombre del túnel con nombre: minúsculas, números y guiones (nunca un argumento raro). */
export const NOMBRE_TUNEL = /^[a-z0-9][a-z0-9-]{0,62}$/;
/** Dominio público: nombre DNS en minúsculas, al menos dos etiquetas, sin comodines ni IP. */
const DOMINIO_PUBLICO =
  /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;
const TLD_NO_PUBLICOS = new Set(['test', 'localhost', 'local', 'invalid', 'internal', 'example']);

export function nombreTunelValido(n: unknown): n is string {
  return typeof n === 'string' && NOMBRE_TUNEL.test(n);
}

export function dominioPublicoValido(d: unknown): d is string {
  if (typeof d !== 'string' || !DOMINIO_PUBLICO.test(d)) return false;
  return !TLD_NO_PUBLICOS.has(d.slice(d.lastIndexOf('.') + 1));
}

/** Cómo se publica un sitio. Nunca lleva tokens ni credenciales (viven en `AlmacenSecretos`). */
export const MODOS_TAILSCALE = ['serve', 'funnel'] as const;
export type ModoTailscale = (typeof MODOS_TAILSCALE)[number];

export const TunelSitioSchema = z
  .object({
    proveedor: z.enum(IDS_PROVEEDOR_TUNEL),
    nombre: z.string().regex(NOMBRE_TUNEL).optional(),
    dominio: z
      .string()
      .refine((d) => dominioPublicoValido(d))
      .optional(),
    /** Solo Tailscale: `serve` (solo la tailnet) o `funnel` (internet). Ausente = `serve`. */
    modo: z.enum(MODOS_TAILSCALE).optional(),
  })
  .refine((t) => t.modo === undefined || t.proveedor === 'tailscale', {
    message: 'El modo solo existe con Tailscale',
  });
export type TunelSitio = z.infer<typeof TunelSitioSchema>;

/**
 * Hasta dónde llega el enlace: `internet` (cualquiera con él) o `tailnet` (solo los equipos de la
 * red privada Tailscale del usuario). Tailscale Serve es `tailnet`; Funnel y todo lo demás,
 * `internet`. La confirmación (interfaz y MCP) dice cuál es.
 */
export type AlcanceTunel = 'internet' | 'tailnet';

export function modoTailscaleDe(
  t: Pick<TunelSitio, 'proveedor' | 'modo'> | undefined,
): ModoTailscale {
  return t?.proveedor === 'tailscale' && t.modo === 'funnel' ? 'funnel' : 'serve';
}

export function alcanceDe(t: Pick<TunelSitio, 'proveedor' | 'modo'> | undefined): AlcanceTunel {
  return t?.proveedor === 'tailscale' && modoTailscaleDe(t) === 'serve' ? 'tailnet' : 'internet';
}

/** Token de ngrok o Expose: letras, números y `_ . -` (nunca algo que rompa un archivo o un entorno). */
export const TOKEN_TUNEL = /^[A-Za-z0-9_.-]{8,200}$/;
export const tokenTunelValido = (t: unknown): t is string =>
  typeof t === 'string' && TOKEN_TUNEL.test(t);

/** Quita los códigos de color ANSI de la salida de un CLI (`ESC [ … letra`). */
export const sinAnsi = (t: string): string =>
  t.replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;?]*[A-Za-z]', 'g'), '');

/** Id de sitio apto para nombrar archivos propios del túnel. */
export const idSitioSeguro = (id: unknown): id is string =>
  typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/.test(id);

export const PROVEEDOR_TUNEL_PREDETERMINADO: IdProveedorTunel = 'cloudflare-rapido';

export function proveedorDeSitio(s: Pick<Sitio, 'tunel'>): IdProveedorTunel {
  return s.tunel?.proveedor ?? PROVEEDOR_TUNEL_PREDETERMINADO;
}

export interface ResultadoDisponible {
  ok: boolean;
  codigo?: string;
  datos?: Record<string, string | number>;
}

export interface ProblemaTunel {
  codigo: string;
  datos?: Record<string, string | number>;
}

/** Lo que `Tuneles` necesita para lanzar el proceso de un túnel. */
export interface ContextoTunel {
  /** Ruta del ejecutable de cloudflared elegido. */
  cloudflared: string;
  /** Puerto de Nginx al que apunta el túnel. */
  puertoNginx: number;
  /** Archivo de log que escribe cloudflared (`--logfile`). */
  logCloudflared: string;
}

export interface LanzamientoTunel {
  comando: string;
  args: string[];
  /** Variables solo para ese proceso (nunca se persisten ni se muestran). */
  env?: Record<string, string>;
  /** Como `env`, pero secretas: nunca llegan a `run/estado.json` ni a ningún registro. */
  envSecreto?: Record<string, string>;
  /** Valores secretos del lanzamiento: se tapan en los logs y en los errores. */
  secretos?: string[];
  /**
   * Prefijos de variables heredadas del entorno que NO se pasan al proceso (p. ej. `NGROK_`,
   * `TS_`): las del usuario no deben pisar las nuestras. Sin esto, `TUNNEL_` (cloudflared).
   */
  quitarEntorno?: string[];
  /** Carpeta de trabajo del proceso (que no sea la de un proyecto con archivos de configuración). */
  cwd?: string;
}

/**
 * Un proveedor de túnel. `Tuneles` conserva el ciclo de vida (proceso, estado, `.env` y registro
 * de arranque); el proveedor decide qué se lanza, cuándo está listo y qué limpia al cerrar.
 */
export interface ProveedorTunel {
  readonly id: IdProveedorTunel;
  /** El proveedor no usa cloudflared: `Tuneles` no lo exige instalado. */
  readonly sinCloudflared?: boolean;
  /** ¿Se puede abrir ahora? Si no, el código del error (y los datos que lleva su texto). */
  disponible(sitio: Sitio): Promise<ResultadoDisponible>;
  /** Prepara lo necesario (config, credenciales temporales) y devuelve qué lanzar. */
  abrir(sitio: Sitio, c: ContextoTunel): Promise<LanzamientoTunel>;
  /** La URL pública si en `texto` (los logs del proceso) el túnel ya está listo. */
  url(sitio: Sitio, texto: string): string | null;
  /**
   * Un problema que el programa ya explicó en su salida (p. ej. Funnel sin habilitar, ngrok viejo):
   * `Tuneles` cierra el túnel y lo informa con ese código sin esperar el plazo.
   */
  problema?(sitio: Sitio, texto: string): ProblemaTunel | null;
  /** El túnel ya está listo (hay URL): lo que solo hacía falta para arrancar se puede borrar. */
  listo?(sitio: Sitio): Promise<void>;
  /** Borra lo temporal del sitio (idempotente; también tras una caída). */
  cerrar(sitioId: string): Promise<void>;
}

/** Lo que el núcleo usa del almacén de secretos del proceso principal. */
export interface SecretosTunel {
  disponible(): boolean;
  leer(id: string): Promise<string | null>;
  guardar(id: string, valor: string): Promise<void>;
  borrar(id: string): Promise<void>;
}

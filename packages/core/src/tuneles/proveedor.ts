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
export const TunelSitioSchema = z.object({
  proveedor: z.enum(IDS_PROVEEDOR_TUNEL),
  nombre: z.string().regex(NOMBRE_TUNEL).optional(),
  dominio: z
    .string()
    .refine((d) => dominioPublicoValido(d))
    .optional(),
});
export type TunelSitio = z.infer<typeof TunelSitioSchema>;

export const PROVEEDOR_TUNEL_PREDETERMINADO: IdProveedorTunel = 'cloudflare-rapido';

export function proveedorDeSitio(s: Pick<Sitio, 'tunel'>): IdProveedorTunel {
  return s.tunel?.proveedor ?? PROVEEDOR_TUNEL_PREDETERMINADO;
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
}

/**
 * Un proveedor de túnel. `Tuneles` conserva el ciclo de vida (proceso, estado, `.env` y registro
 * de arranque); el proveedor decide qué se lanza, cuándo está listo y qué limpia al cerrar.
 */
export interface ProveedorTunel {
  readonly id: IdProveedorTunel;
  /** ¿Se puede abrir ahora? Si no, el código del error. */
  disponible(sitio: Sitio): Promise<{ ok: boolean; codigo?: string }>;
  /** Prepara lo necesario (config, credenciales temporales) y devuelve qué lanzar. */
  abrir(sitio: Sitio, c: ContextoTunel): Promise<LanzamientoTunel>;
  /** La URL pública si en `texto` (los logs del proceso) el túnel ya está listo. */
  url(sitio: Sitio, texto: string): string | null;
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

import { z } from 'zod';

export const TIPOS_SITIO = [
  'laravel',
  'codeigniter3',
  'estatico',
  'proxy',
  'personalizado',
] as const;
export type TipoSitio = (typeof TIPOS_SITIO)[number];

export const SitioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  dominio: z.string(),
  alias: z.array(z.string()).default([]),
  carpeta: z.string(),
  tipo: z.enum(TIPOS_SITIO),
  php: z.string().nullable().default(null),
  puertoProxy: z.number().int().nullable().default(null),
  reglasExtra: z.string().default(''),
  urlBaseVar: z.string().nullable().default(null),
  datosReales: z.boolean().default(false),
  nota: z.string().default(''),
});
export type Sitio = z.infer<typeof SitioSchema>;

export const ConfigSchema = z.object({
  version: z.literal(1).default(1),
  sitios: z.array(SitioSchema).default([]),
  servicios: z
    .object({
      nginx: z
        .object({
          version: z.string().nullable().default(null),
          puerto: z.number().int().default(80),
        })
        .prefault({}),
      php: z
        .object({
          versiones: z.array(z.string()).default([]),
          trabajadores: z.number().int().min(1).default(2),
        })
        .prefault({}),
      cloudflared: z.object({ version: z.string().nullable().default(null) }).prefault({}),
    })
    .prefault({}),
});
export type Config = z.infer<typeof ConfigSchema>;

export function raizDeSitio(s: Sitio): string {
  return s.tipo === 'laravel' ? `${s.carpeta.replace(/[\\/]+$/, '')}/public` : s.carpeta;
}

export interface EstadoServicio {
  id: string;
  nombre: string;
  version: string | null;
  estado: 'apagado' | 'iniciando' | 'encendido' | 'error' | 'externo';
  puertos: number[];
  pid: number | null;
  mensaje?: string;
}

export interface EstadoTunel {
  sitioId: string;
  estado: 'apagado' | 'iniciando' | 'activo' | 'error';
  url: string | null;
  mensaje?: string;
}

export interface ProgresoInstalacion {
  servicio: string;
  version: string;
  fase: 'descargando' | 'verificando' | 'extrayendo' | 'listo' | 'error';
  porcentaje: number;
  mensaje?: string;
}

export interface EstadoHosts {
  pendientes: string[];
  duplicadosFuera: string[];
  mensaje?: string;
}

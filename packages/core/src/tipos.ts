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
  https: z.boolean().default(false),
  redirigirHttps: z.boolean().default(false),
});
export type Sitio = z.infer<typeof SitioSchema>;

/** Servicios no web administrados con un `DefServicio` (bases de datos, herramientas e IA). */
export const IDS_SERVICIO_DATOS = [
  'mysql',
  'mariadb',
  'postgresql',
  'redis',
  'mongodb',
  'mailpit',
  'ollama',
] as const;
export type IdServicioDatos = (typeof IDS_SERVICIO_DATOS)[number];

/** Puertos por defecto (Global Constraints). */
export const PUERTOS_POR_DEFECTO: Record<IdServicioDatos, number> = {
  mysql: 3306,
  mariadb: 3307,
  postgresql: 5432,
  redis: 6379,
  mongodb: 27017,
  mailpit: 1025,
  ollama: 11434,
};

const servicioDatos = (puerto: number) =>
  z
    .object({
      version: z.string().nullable().default(null),
      puerto: z.number().int().min(1).max(65535).default(puerto),
      autoIniciar: z.boolean().default(false),
    })
    .prefault({});

export const CredencialesSchema = z.object({
  usuario: z.string().min(1),
  clave: z.string().min(1),
});
export type Credenciales = z.infer<typeof CredencialesSchema>;

/** Contenido de etc/credenciales.json (fuera de config.json: nunca viaja por config.leer). */
export const ArchivoCredencialesSchema = z
  .partialRecord(z.enum(IDS_SERVICIO_DATOS), CredencialesSchema)
  .default({});
export type ArchivoCredenciales = z.infer<typeof ArchivoCredencialesSchema>;

export const ConfigSchema = z.object({
  version: z.literal(1).default(1),
  sitios: z.array(SitioSchema).default([]),
  https: z.object({ puerto: z.number().int().min(1).max(65535).default(443) }).prefault({}),
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
      datos: z
        .object({
          mysql: servicioDatos(PUERTOS_POR_DEFECTO.mysql),
          mariadb: servicioDatos(PUERTOS_POR_DEFECTO.mariadb),
          postgresql: servicioDatos(PUERTOS_POR_DEFECTO.postgresql),
          redis: servicioDatos(PUERTOS_POR_DEFECTO.redis),
          mongodb: servicioDatos(PUERTOS_POR_DEFECTO.mongodb),
          mailpit: servicioDatos(PUERTOS_POR_DEFECTO.mailpit),
          ollama: servicioDatos(PUERTOS_POR_DEFECTO.ollama),
        })
        .prefault({}),
    })
    .prefault({}),
});
export type Config = z.infer<typeof ConfigSchema>;

export function raizDeSitio(s: Sitio): string {
  return s.tipo === 'laravel' ? `${s.carpeta.replace(/[\\/]+$/, '')}/public` : s.carpeta;
}

export type CategoriaServicio = 'web' | 'php' | 'bd' | 'herramienta' | 'ia';

export interface EstadoServicio {
  id: string;
  nombre: string;
  /** Agrupación en la UI. */
  categoria?: CategoriaServicio;
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
  fase: 'descargando' | 'verificando' | 'extrayendo' | 'compilando' | 'listo' | 'error';
  porcentaje: number;
  mensaje?: string;
}

export interface EstadoHosts {
  pendientes: string[];
  duplicadosFuera: string[];
  mensaje?: string;
}

import { z } from 'zod';
import { esRutaAbsolutaDelSistema } from '../plataforma/sistema';
import { TIPOS_RUNTIME } from '../runtimes/runtimes';

/**
 * Lista blanca de órdenes del servidor de la CLI `wolf` (D31). Cada una valida sus argumentos con
 * un esquema `zod` estricto: un campo de más, de otro tipo o fuera de rango se rechaza entero
 * (`cli.argumentos_invalidos`) antes de tocar el núcleo.
 */
export const ORDENES_CLI = [
  'estado',
  'vincular',
  'vigilar',
  'usar',
  'asegurar',
  'compartir',
  'abrir',
  'registros',
  'doctor',
  'iniciar',
  'detener',
] as const;
export type OrdenCli = (typeof ORDENES_CLI)[number];

export const esOrdenCli = (v: unknown): v is OrdenCli =>
  typeof v === 'string' && (ORDENES_CLI as readonly string[]).includes(v);

/** Órdenes que cambian algo: se ejecutan de una en una, en el orden en que llegan. */
export const ORDENES_QUE_CAMBIAN: readonly OrdenCli[] = [
  'vincular',
  'vigilar',
  'usar',
  'asegurar',
  'compartir',
  'iniciar',
  'detener',
];

/** Cuánto puede tardar cada orden (ms) antes de que el servidor conteste `cli.plazo`. */
export const PLAZOS_ORDEN_MS: Record<OrdenCli, number> = {
  estado: 30_000,
  vincular: 120_000,
  vigilar: 30_000,
  usar: 120_000,
  asegurar: 120_000,
  compartir: 180_000,
  abrir: 15_000,
  registros: 15_000,
  doctor: 120_000,
  iniciar: 300_000,
  detener: 300_000,
};

/** Id de sitio: el mismo patrón que usan los archivos propios del sitio (nunca rutas). */
const idSitio = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/);
/** Id de servicio o instancia (`nginx`, `php-8.4`, `mysql@8.4`): sin separadores de ruta. */
const idServicio = z.string().regex(/^[a-z][a-z0-9@._-]{0,63}$/);
const idWorkspace = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/);
const version = z.string().regex(/^[0-9][0-9A-Za-z.+_-]{0,31}$/);

/**
 * Una carpeta que manda la CLI: ruta absoluta completa de este sistema, sin caracteres de control,
 * sin `\\servidor\recurso` (saldría del equipo) ni la forma `\\?\`. Que exista, sea una carpeta y no
 * sea del sistema lo comprueba la orden (necesita el disco).
 */
const carpeta = z
  .string()
  .min(1)
  .max(400)
  .refine((r) => [...r].every((c) => c.charCodeAt(0) >= 0x20 && c.charCodeAt(0) !== 0x7f))
  .refine((r) => !/^[\\/]{2}/.test(r))
  .refine((r) => esRutaAbsolutaDelSistema(r));

const dominioTest = z
  .string()
  .max(120)
  .regex(/^[a-z0-9][a-z0-9.-]*\.test$/);

const vacio = z.object({}).strict();

export const ESQUEMAS_ORDEN = {
  estado: vacio,
  vincular: z
    .object({
      carpeta,
      nombre: z.string().min(1).max(80).optional(),
      dominio: dominioTest.optional(),
    })
    .strict(),
  /** `carpeta: null` deja de vigilar (como "no vigilar" en la interfaz). */
  vigilar: z.object({ carpeta: carpeta.nullable() }).strict(),
  usar: z
    .object({
      servicio: z.enum(['php', ...TIPOS_RUNTIME]),
      version,
      /** Una carpeta dentro de un sitio vinculado (la de la terminal). */
      carpeta: carpeta.optional(),
      /** El PHP de las terminales (los shims de `bin/`): cambia todas las terminales, exige `si`. */
      global: z.boolean().optional(),
      si: z.boolean().optional(),
    })
    .strict()
    .refine((a) => (a.carpeta !== undefined) !== (a.global === true), {
      message: 'Use una carpeta o global, no los dos ni ninguno',
    })
    .refine((a) => a.global !== true || a.servicio === 'php', {
      message: 'Solo el PHP puede ser global',
    }),
  asegurar: z.object({ sitio: idSitio }).strict(),
  compartir: z
    .object({
      sitio: idSitio,
      /** Equivale a la confirmación de exposición de la interfaz (el sitio queda en internet). */
      si: z.boolean().optional(),
      /**
       * Solo con datos reales: el dominio del sitio, escrito por quien confirma. Es la
       * confirmación reforzada; un `si` o un "sí a todo" nunca la cubre.
       */
      confirmaDatosReales: z.string().max(200).optional(),
      /** Lo que el usuario vio al confirmar: si el sitio usa otro proveedor, no se abre. */
      proveedor: z.string().max(40).optional(),
      /** Cierra el túnel (no expone nada: no pide confirmación). */
      cerrar: z.boolean().optional(),
    })
    .strict(),
  abrir: z.object({ sitio: idSitio }).strict(),
  registros: z
    .object({
      sitio: idSitio,
      fuente: z.enum(['error', 'acceso', 'laravel', 'ci3', 'tunel']).optional(),
      lineas: z.number().int().min(1).max(2000).optional(),
    })
    .strict(),
  doctor: vacio,
  iniciar: z
    .object({ workspace: idWorkspace.optional(), servicio: idServicio.optional() })
    .strict()
    .refine((a) => a.workspace === undefined || a.servicio === undefined),
  detener: z
    .object({ workspace: idWorkspace.optional(), servicio: idServicio.optional() })
    .strict()
    .refine((a) => a.workspace === undefined || a.servicio === undefined),
} as const satisfies Record<OrdenCli, z.ZodType>;

export type ArgsOrden<O extends OrdenCli> = z.infer<(typeof ESQUEMAS_ORDEN)[O]>;

/** Cuerpo de `POST /orden`. */
export const CuerpoOrdenSchema = z
  .object({ orden: z.string().min(1).max(40), args: z.record(z.string(), z.unknown()).optional() })
  .strict();

/** Consulta de `GET /registros`. */
export const ConsultaRegistrosSchema = ESQUEMAS_ORDEN.registros;

/** Forma de las respuestas: nunca lleva secretos. */
export type RespuestaCli =
  | { ok: true; datos: unknown }
  | { ok: false; error: { codigo: string; datos?: Record<string, string | number> } };

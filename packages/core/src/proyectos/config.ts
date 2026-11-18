import { randomBytes } from 'node:crypto';
import { readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Document, isMap, isScalar, parseDocument } from 'yaml';
import { z } from 'zod';
import type { MotorBd } from '../bd/env';
import { ProcesoProyectoSchema, TIPOS_SITIO, type ProcesoProyecto } from '../tipos';

export { ProcesoProyectoSchema, type ProcesoProyecto };

/** Nombre del archivo de configuración del proyecto, en su raíz. */
export const ARCHIVO_CONFIG_PROYECTO = 'wolfcore.yml';

/* ───────────── Recetas (tipos que usa el motor de la Task 3) ───────────── */

export const TIPOS_PASO = [
  'composer-install',
  'env-crear',
  'key-generate',
  'bd-crear',
  'bd-restaurar',
  'migrar',
  'storage-link',
  'npm-ci',
  'npm-build',
  'python-venv',
  'pip-install',
  'pgvector-activar',
  'sitio-crear',
  'comando',
] as const;
export type TipoPaso = (typeof TIPOS_PASO)[number];

export const PasoRecetaSchema = z.object({
  id: z.string().min(1),
  tipo: z.enum(TIPOS_PASO),
  titulo: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
  opcional: z.boolean().optional(),
});
/** `{id; tipo: TipoPaso; titulo; args?: Record<string, unknown>; opcional?: boolean}` */
export type PasoReceta = z.infer<typeof PasoRecetaSchema>;

/* ───────────── Servicios que pide un proyecto ───────────── */

export const MOTORES_BD = [
  'mysql',
  'mariadb',
  'postgresql',
  'mongodb',
] as const satisfies readonly MotorBd[];
// Si MotorBd suma un motor, esto deja de compilar hasta agregarlo arriba.
const _motoresCompletos: Exclude<MotorBd, (typeof MOTORES_BD)[number]> extends never
  ? true
  : never = true;
void _motoresCompletos;

/** Bases de datos (MotorBd) más los servicios auxiliares que se sacan de `.env.example`. */
export const SERVICIOS_PROYECTO = [...MOTORES_BD, 'redis', 'mailpit'] as const;
export type ServicioProyecto = (typeof SERVICIOS_PROYECTO)[number];

/** El primer motor de base de datos de la lista (el que usa la receta), o null. */
export function motorBdDe(servicios: readonly ServicioProyecto[]): MotorBd | null {
  return servicios.find((s): s is MotorBd => (MOTORES_BD as readonly string[]).includes(s)) ?? null;
}

/* ───────────── wolfcore.yml ───────────── */

const version = z.string().min(1).nullable().default(null);

export const ConfigProyectoSchema = z
  .object({
    version: z.literal(1).default(1),
    tipo: z.enum(TIPOS_SITIO).nullable().default(null),
    /** Dominio local (termina en .test); null = el sugerido por la carpeta. */
    dominio: z.string().min(1).nullable().default(null),
    /** Versiones pedidas ("8.4", "22", ">=3.12"); null = la que detecte WolfCore Dev. */
    php: version,
    node: version,
    python: version,
    servicios: z.array(z.enum(SERVICIOS_PROYECTO)).default([]),
    /** Valores extra para el .env del proyecto. */
    env: z
      .record(
        z.string().min(1),
        z.union([z.string(), z.number(), z.boolean()]).transform((v) => String(v)),
      )
      .default({}),
    receta: z.array(PasoRecetaSchema).default([]),
    procesos: z.array(ProcesoProyectoSchema).default([]),
  })
  .superRefine((c, ctx) => {
    for (const campo of ['receta', 'procesos'] as const) {
      const vistos = new Set<string>();
      c[campo].forEach((x, i) => {
        if (vistos.has(x.id)) {
          ctx.addIssue({
            code: 'custom',
            path: [campo, i, 'id'],
            message: `El id "${x.id}" está repetido`,
          });
        }
        vistos.add(x.id);
      });
    }
  });
export type ConfigProyecto = z.output<typeof ConfigProyectoSchema>;

const CABECERA = [
  ' Configuración del proyecto para WolfCore Dev.',
  ' Puede editarse a mano y guardarse en el repositorio. Campos:',
  '   version   formato de este archivo (siempre 1).',
  '   tipo      laravel, codeigniter3, codeigniter4, wordpress, fastapi, node, estatico,',
  '             proxy o personalizado.',
  '   dominio   dominio local del sitio; termina en .test.',
  '   php, node, python',
  '             versión que pide el proyecto ("8.4", "22", "3.12"); null = la que detecte.',
  '   servicios mysql, mariadb, postgresql, mongodb, redis o mailpit.',
  '   env       valores extra para el .env (no ponga contraseñas reales ni tokens aquí).',
  '   receta    pasos de instalación, en orden. Solo se ejecutan si marca',
  '             "Confío en este repositorio" en ese proyecto.',
  '   procesos  comandos de larga duración (npm run dev, queue:work, uvicorn…) con',
  '             id, nombre, comando (lista), cwd, autoIniciar, reiniciar, puerto y proxy',
  '             (true en el proceso al que apunta el sitio, p. ej. uvicorn y no vite).',
].join('\n');

const CLAVES: readonly (keyof ConfigProyecto)[] = [
  'version',
  'tipo',
  'dominio',
  'php',
  'node',
  'python',
  'servicios',
  'env',
  'receta',
  'procesos',
];

const mensajeError = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function errorConfig(detalle: string): Error {
  return new Error(`${ARCHIVO_CONFIG_PROYECTO} no es válido: ${detalle}`);
}

/**
 * Convierte el documento a JS. Las versiones y los valores de `env` escritos como números
 * (`php: 8.10`) se toman del texto original para no perder ceros ni decimales.
 */
function aObjeto(doc: Document): unknown {
  let js: unknown;
  try {
    js = doc.toJS({ maxAliasCount: MAX_ALIAS });
  } catch (e) {
    throw errorConfig(mensajeError(e));
  }
  if (js === null || js === undefined) return {};
  if (typeof js !== 'object' || Array.isArray(js) || !isMap(doc.contents)) {
    throw errorConfig('el archivo debe ser un mapa de claves (clave: valor)');
  }
  const obj = js as Record<string, unknown>;
  const texto = (n: unknown): string | undefined =>
    isScalar(n) && (typeof n.value === 'number' || typeof n.value === 'boolean')
      ? (n.source ?? String(n.value))
      : undefined;
  for (const clave of ['php', 'node', 'python']) {
    const t = texto(doc.get(clave, true));
    if (t !== undefined) obj[clave] = t;
  }
  const env = doc.get('env', true);
  if (isMap(env) && obj.env && typeof obj.env === 'object') {
    for (const par of env.items) {
      const t = texto(par.value);
      const k = isScalar(par.key) ? String(par.key.value) : null;
      if (t !== undefined && k !== null) (obj.env as Record<string, unknown>)[k] = t;
    }
  }
  return obj;
}

function validar(datos: unknown): ConfigProyecto {
  const r = ConfigProyectoSchema.safeParse(datos);
  if (r.success) return r.data;
  const detalle = r.error.issues
    .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
    .join('; ');
  throw errorConfig(detalle);
}

/** Tamaño máximo de wolfcore.yml. */
export const MAX_BYTES_CONFIG = 1024 * 1024;
/** Alias YAML permitidos al convertir (evita la "bomba de alias"). */
const MAX_ALIAS = 100;

interface Leido {
  doc: Document;
  /** El original usaba fin de línea CRLF. */
  crlf: boolean;
}

/**
 * Lee y analiza el archivo: null si no existe; error en español si es demasiado grande, no es
 * YAML válido o usa etiquetas desconocidas (p. ej. !!js/function: nunca se ejecuta nada).
 */
async function leerDocumento(ruta: string): Promise<Leido | null> {
  let texto: string;
  try {
    if ((await stat(ruta)).size > MAX_BYTES_CONFIG) {
      throw errorConfig('el archivo pesa más de 1 MB');
    }
    texto = await readFile(ruta, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
  const sinBom = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  const doc = parseDocument(sinBom, { uniqueKeys: true });
  const problema = doc.errors[0] ?? doc.warnings[0];
  if (problema) throw errorConfig(problema.message.split('\n')[0]!);
  return { doc, crlf: texto.includes('\r\n') };
}

/** Lee `wolfcore.yml` de la carpeta. null si no existe; error en español si no es válido. */
export async function leerConfigProyecto(carpeta: string): Promise<ConfigProyecto | null> {
  const leido = await leerDocumento(path.join(carpeta, ARCHIVO_CONFIG_PROYECTO));
  if (!leido) return null;
  const { doc } = leido;
  try {
    return validar(aObjeto(doc));
  } catch (e) {
    throw e instanceof Error && e.message.startsWith(ARCHIVO_CONFIG_PROYECTO)
      ? e
      : errorConfig(mensajeError(e));
  }
}

/**
 * Escribe `wolfcore.yml`. Si ya existe, conserva sus comentarios, las claves que WolfCore Dev
 * no conoce y su fin de línea (CRLF o LF); si no, lo crea con una cabecera que explica los
 * campos. Un archivo existente que no se puede leer NO se reemplaza: se lanza el error y el
 * llamador decide.
 */
export async function escribirConfigProyecto(carpeta: string, c: ConfigProyecto): Promise<void> {
  const datos = validar(c);
  const ruta = path.join(carpeta, ARCHIVO_CONFIG_PROYECTO);
  const leido = await leerDocumento(ruta);
  let doc: Document;
  if (leido && leido.doc.contents !== null) {
    if (!isMap(leido.doc.contents)) {
      throw errorConfig('el archivo debe ser un mapa de claves (clave: valor)');
    }
    doc = leido.doc;
  } else {
    // Sin archivo, o vacío / solo comentarios: se arma con la cabecera.
    doc = new Document({});
    doc.commentBefore = CABECERA;
  }
  for (const clave of CLAVES) doc.set(clave, datos[clave]);

  let texto = doc.toString({ lineWidth: 0 });
  if (leido?.crlf) texto = texto.replace(/\r?\n/g, '\r\n');
  const tmp = `${ruta}.${randomBytes(4).toString('hex')}.tmp`;
  try {
    await writeFile(tmp, texto, 'utf8');
    await rename(tmp, ruta);
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  }
}

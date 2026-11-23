import { z } from 'zod';
import { TIPOS_AVISO, type TipoAviso } from './avisos/tipos';
import { ConfigIaSchema } from './ia/proveedores';
import { IDS_TERMINAL } from './plataforma/tipos';

export const TIPOS_SITIO = [
  'laravel',
  'codeigniter3',
  'estatico',
  'proxy',
  'personalizado',
  'codeigniter4',
  'wordpress',
  'fastapi',
  'node',
] as const;
export type TipoSitio = (typeof TIPOS_SITIO)[number];

/** Tipos que necesitan PHP (FastCGI). */
export const TIPOS_CON_PHP: readonly TipoSitio[] = [
  'laravel',
  'codeigniter3',
  'codeigniter4',
  'wordpress',
  'personalizado',
];
/** Tipos que Nginx sirve como proxy inverso hacia un puerto local. */
export const TIPOS_PROXY: readonly TipoSitio[] = ['proxy', 'fastapi', 'node'];

/**
 * Comando de larga duración del proyecto (npm run dev, queue:work, uvicorn…), supervisado.
 * `cwd`: 'raiz' (la carpeta del proyecto) o una ruta relativa a ella, dentro de la carpeta.
 * El id no lleva guiones (se cambian por `_`): el supervisor usa `proy-<sitio>-<proceso>` y el
 * id del sitio sí puede llevarlos, así que el último guion separa siempre las dos partes.
 * `proxy`: este proceso es el destino del proxy de Nginx (ver `procesoDelProxy`).
 */
export const ProcesoProyectoSchema = z.object({
  // Los guiones pasan a guiones bajos (un config.json viejo con 'npm-dev' no queda corrupto).
  id: z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(/-/g, '_') : v),
    z
      .string()
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9_]*$/,
        'El id del proceso lleva solo letras, números y guiones bajos',
      ),
  ),
  nombre: z.string().default(''),
  comando: z.array(z.string().min(1)).min(1, 'El comando no puede estar vacío'),
  cwd: z.string().min(1).default('raiz'),
  autoIniciar: z.boolean().default(false),
  reiniciar: z.boolean().default(false),
  puerto: z.number().int().min(1).max(65535).nullable().default(null),
  proxy: z.boolean().default(false),
});
export type ProcesoProyecto = z.infer<typeof ProcesoProyectoSchema>;

/**
 * Proceso al que apunta el proxy de un sitio FastAPI o Node cuando el sitio no fija
 * `puertoProxy`: el marcado con `proxy: true` (con puerto) y, si ninguno lo está, el primero con
 * puerto. En la receta de FastAPI, uvicorn lleva la marca: un vite agregado antes no la quita.
 */
export function procesoDelProxy(procesos: readonly ProcesoProyecto[]): ProcesoProyecto | undefined {
  return (
    procesos.find((p) => p.proxy && p.puerto !== null) ?? procesos.find((p) => p.puerto !== null)
  );
}

/** Modos de Xdebug que se pueden elegir por sitio. */
export const MODOS_XDEBUG = ['debug', 'develop', 'coverage', 'profile', 'trace'] as const;

/** Xdebug de un sitio (solo en su pool propio; nunca en el ini de la rama). */
export const XdebugSitioSchema = z.object({
  activo: z.boolean().default(false),
  modo: z.array(z.enum(MODOS_XDEBUG)).min(1).default(['debug']),
  puerto: z.number().int().min(1024).max(65535).default(9003),
  inicio: z.enum(['trigger', 'yes']).default('trigger'),
});
export type XdebugSitio = z.infer<typeof XdebugSitioSchema>;

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
  /** Acceso FTP del sitio. La clave NO va aquí: está en etc/credenciales.json (`ftp:<id>`). */
  ftp: z
    .object({
      activo: z.boolean().default(false),
      usuario: z.string(),
      soloLectura: z.boolean().default(false),
    })
    .nullable()
    .optional(),
  /** "Confío en este repositorio": sin esto no se ejecuta su receta. */
  confiado: z.boolean().default(false),
  /**
   * Huella (SHA-256) de la receta efectiva cuando se marcó "Confío…"; la fija el núcleo (nunca la
   * interfaz) y sirve para avisar si la receta cambió desde entonces. null = sin huella.
   */
  recetaConfiada: z.string().nullable().optional(),
  /** Remoto (siempre sin credenciales) y rama del repositorio, si es un clon de Git. */
  git: z
    .object({
      remoto: z.string().nullable().default(null),
      rama: z.string().nullable().default(null),
    })
    .nullable()
    .default(null),
  procesos: z.array(ProcesoProyectoSchema).default([]),
  /** Versiones fijadas para este sitio; mandan sobre wolfcore.yml y los archivos de versión. */
  runtimes: z
    .object({ node: z.string().min(1).optional(), python: z.string().min(1).optional() })
    .default({}),
  /**
   * Ajustes de php.ini propios del sitio (clave → valor). Con alguno (o con Xdebug activo) el
   * sitio usa su propio pool de php-cgi. Solo cambian con `Nucleo.guardarPhpIniSitio`.
   * Opcional en el tipo (los sitios de versiones anteriores no lo traen): ausente = `{}`.
   */
  phpIni: z.record(z.string(), z.string()).optional(),
  /** Xdebug del sitio (ausente = null); solo cambia con `Nucleo.xdebugSitio`. */
  xdebug: XdebugSitioSchema.nullable().optional(),
  /**
   * Vhost completo escrito por el usuario (modo avanzado del editor): se usa tal cual en vez del
   * generado, que ya no se regenera. Ausente o null = el generado. Solo cambia con el editor de
   * vhost (`EditorVhost`), igual que `reglasExtra`.
   */
  vhostManual: z.string().nullable().optional(),
  /**
   * Lo del usuario (reglas o manual) que Nginx rechazó al aplicar los sitios: queda guardado pero
   * fuera del vhost, sin volver a probarlo ni avisar, hasta que se aplique otra vez desde el editor.
   */
  vhostDesactivado: z.enum(['reglas', 'manual']).nullable().optional(),
  /**
   * Captura de `dump()`/`dd()`/`wd()` (PHP: `auto_prepend_file` en el pool propio del sitio) y de
   * `wolfdump` (Python: PYTHONPATH de sus procesos). Ausente = apagada. Solo cambia con
   * `Nucleo.capturaDumpsSitio` (con la confirmación de la ventana); nunca es global.
   */
  capturaDumps: z.boolean().optional(),
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

/**
 * Clave de una credencial: un servicio propio, el acceso FTP de un sitio (`ftp:<id>`) o el token
 * del servidor MCP (`mcp`, en `clave`).
 */
export type ClaveCredencial = IdServicioDatos | `ftp:${string}` | 'mcp';

const ClaveCredencialSchema = z.union([
  z.enum(IDS_SERVICIO_DATOS),
  z.templateLiteral(['ftp:', z.string()]),
  z.literal('mcp'),
]);

/**
 * Contenido de etc/credenciales.json (fuera de config.json: nunca viaja por config.leer). Las
 * claves conocidas se validan; las desconocidas (de una versión futura) se conservan tal cual
 * para que guardar no las borre.
 */
const CLAVES_PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);

export const ArchivoCredencialesSchema = z
  .record(z.string(), z.unknown())
  .transform((r, ctx): ArchivoCredenciales => {
    const res: Record<string, unknown> = {};
    for (const [clave, valor] of Object.entries(r)) {
      // Nunca se copian claves que tocan prototipos (un archivo editado a mano o malicioso).
      if (CLAVES_PELIGROSAS.has(clave)) continue;
      if (!ClaveCredencialSchema.safeParse(clave).success) {
        res[clave] = valor;
        continue;
      }
      const c = CredencialesSchema.safeParse(valor);
      if (!c.success) {
        ctx.addIssue({ code: 'custom', message: `Credencial no válida: ${clave}`, path: [clave] });
        return z.NEVER;
      }
      res[clave] = c.data;
    }
    return res as ArchivoCredenciales;
  })
  .prefault({} as never);
export type ArchivoCredenciales = Partial<Record<ClaveCredencial, Credenciales>>;

/** Temas de la interfaz: 'sistema' sigue al de Windows. */
export const TEMAS_UI = ['sistema', 'claro', 'oscuro'] as const;
export type TemaUi = (typeof TEMAS_UI)[number];
/** Idiomas de la interfaz. */
export const IDIOMAS_UI = ['es', 'en'] as const;
export type IdiomaUi = (typeof IDIOMAS_UI)[number];
/** Acento de la interfaz: un color #rrggbb. */
export const ACENTO_UI = /^#[0-9a-f]{6}$/i;

/**
 * Preferencias de la interfaz (`config.json` → `ui`). Cada campo cae a su valor por defecto si
 * viene mal (`catch`): un valor raro aquí nunca debe mandar todo el config a `corrupto`.
 */
export const PreferenciasUiSchema = z
  .object({
    tema: z.enum(TEMAS_UI).default('sistema').catch('sistema'),
    /** null = aún no se eligió: la ventana lo detecta con el idioma del sistema la primera vez. */
    idioma: z.enum(IDIOMAS_UI).nullable().default(null).catch(null),
    /** null = el acento por defecto (índigo). */
    acento: z.string().regex(ACENTO_UI).nullable().default(null).catch(null),
    /** El asistente de primer uso ya se completó u omitió. */
    asistenteVisto: z.boolean().default(false).catch(false),
    /** Ya se mostró el aviso de costo al abrir un agente por primera vez. */
    avisoCostoAgentes: z.boolean().default(false).catch(false),
  })
  .prefault({});
export type PreferenciasUi = z.infer<typeof PreferenciasUiSchema>;

/** Cambios que pide la interfaz: estrictos (un valor no válido es un error, no un reinicio). */
export const CambiosPreferenciasUiSchema = z.strictObject({
  tema: z.enum(TEMAS_UI).optional(),
  idioma: z.enum(IDIOMAS_UI).optional(),
  acento: z.string().regex(ACENTO_UI).nullable().optional(),
  asistenteVisto: z.boolean().optional(),
  avisoCostoAgentes: z.boolean().optional(),
});
export type CambiosPreferenciasUi = z.infer<typeof CambiosPreferenciasUiSchema>;

/**
 * Rango pasivo de FTP por defecto: fuera de los puertos efímeros de Windows (49152-65535), donde
 * el sistema puede estar usando cualquiera de ellos para conexiones salientes.
 */
export const PASIVOS_FTP_POR_DEFECTO: readonly [number, number] = [30000, 30100];
/** Rango por defecto anterior (hasta la Etapa B): se migra al leer el config. */
export const PASIVOS_FTP_VIEJOS: readonly [number, number] = [50000, 50100];

export const ConfigSchema = z.object({
  version: z.literal(1).default(1),
  sitios: z.array(SitioSchema).default([]),
  proyectos: z
    .object({
      /** Carpeta cuyas subcarpetas se sugieren como proyectos nuevos; null = no vigilar. */
      carpetaVigilada: z.string().nullable().default(null),
    })
    .prefault({}),
  https: z.object({ puerto: z.number().int().min(1).max(65535).default(443) }).prefault({}),
  ftp: z
    .object({
      puerto: z.number().int().min(1).max(65535).default(2121),
      /** false: solo 127.0.0.1. true: escucha en todas las interfaces (red local). */
      redLocal: z.boolean().default(false),
      /**
       * Rango de puertos del modo pasivo [mínimo, máximo]. Un config guardado con el rango viejo
       * por defecto (50000-50100, dentro de los puertos efímeros de Windows) pasa al nuevo; un
       * rango elegido por el usuario se respeta.
       */
      pasivos: z
        .tuple([z.number().int().min(1024).max(65535), z.number().int().min(1024).max(65535)])
        .default([...PASIVOS_FTP_POR_DEFECTO])
        .transform((r): [number, number] =>
          r[0] === PASIVOS_FTP_VIEJOS[0] && r[1] === PASIVOS_FTP_VIEJOS[1]
            ? [...PASIVOS_FTP_POR_DEFECTO]
            : r,
        ),
    })
    .prefault({}),
  /** Servidor MCP local (127.0.0.1); el token vive en etc/credenciales.json, nunca aquí. */
  mcp: z
    .object({
      activo: z.boolean().default(false),
      puerto: z.number().int().min(1024).max(65535).default(7790),
    })
    .prefault({}),
  herramientas: z
    .object({
      /** Rama de PHP de los shims de tools/bin; null = la más reciente instalada. */
      phpPorDefecto: z.string().nullable().default(null),
      /** Terminal de "Terminal" en los proyectos; null = la del sistema (PowerShell en Windows). */
      terminal: z.enum(IDS_TERMINAL).nullable().default(null).catch(null),
    })
    .prefault({}),
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
  /**
   * Receptor de dumps (127.0.0.1). `activa` = escucha al iniciar. La captura en sí se enciende por
   * sitio (`Sitio.capturaDumps`); apagar el receptor la apaga en todos los sitios.
   */
  depuracion: z
    .object({
      activa: z.boolean().default(false),
      puerto: z.number().int().min(1024).max(65535).default(9912),
    })
    .prefault({}),
  /** Avisos: notificaciones nativas y qué tipos se muestran. */
  avisos: z
    .object({
      nativas: z.boolean().default(true),
      tipos: z
        .object(
          Object.fromEntries(TIPOS_AVISO.map((t) => [t, z.boolean().default(true)])) as Record<
            TipoAviso,
            z.ZodDefault<z.ZodBoolean>
          >,
        )
        .prefault({}),
    })
    .prefault({}),
  /**
   * Proveedores de IA en la nube (id, tipo, nombre, URL base, modelo). Las claves NUNCA van
   * aquí: viven cifradas en etc/secretos/ y solo las lee el proceso principal.
   */
  ia: ConfigIaSchema,
  /** Preferencias de la interfaz (tema, idioma, acento, asistente de primer uso). */
  ui: PreferenciasUiSchema.catch(() => PreferenciasUiSchema.parse({})),
});
export type Config = z.infer<typeof ConfigSchema>;

/** Puerto al que Nginx envía un sitio FastAPI o Node: `puertoProxy` o el de `procesoDelProxy`. */
export function puertoDelProxy(s: Pick<Sitio, 'puertoProxy' | 'procesos'>): number | null {
  return s.puertoProxy ?? procesoDelProxy(s.procesos)?.puerto ?? null;
}

export function raizDeSitio(s: Sitio): string {
  return s.tipo === 'laravel' || s.tipo === 'codeigniter4'
    ? `${s.carpeta.replace(/[\\/]+$/, '')}/public`
    : s.carpeta;
}

export type CategoriaServicio = 'web' | 'php' | 'bd' | 'herramienta' | 'ia' | 'proyecto';

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

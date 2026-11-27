import { z } from 'zod';
import { IDIOMAS_UI } from './constantesUi';
import { TIPOS_AVISO, type TipoAviso } from './avisos/tipos';
import { ID_PROVEEDOR_SMTP, ListaProveedoresSmtpSchema } from './correo/proveedores';
import { TunelSitioSchema } from './tuneles/proveedor';
import { ConfigIaSchema } from './ia/proveedores';
import { IDS_EDITOR, IDS_TERMINAL } from './plataforma/tipos';

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
  'rails',
  'springboot',
  'aspnet',
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
export const TIPOS_PROXY: readonly TipoSitio[] = [
  'proxy',
  'fastapi',
  'node',
  'rails',
  'springboot',
  'aspnet',
];

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

/* ───────────── Tareas programadas por sitio (D29) ───────────── */

export const ID_TAREA = /^[A-Za-z0-9][A-Za-z0-9_]{0,39}$/;
/** Máximo de tareas por sitio, de argumentos por comando y de caracteres por argumento. */
export const MAX_TAREAS_SITIO = 50;
export const MAX_ARGS_TAREA = 50;
export const MAX_CARACTERES_ARG_TAREA = 500;
/** Tiempo máximo por ejecución: por omisión 5 minutos, nunca más de 1 hora. */
export const TIEMPO_TAREA_DEFECTO_S = 300;
export const TIEMPO_TAREA_MAX_S = 3600;
export const TIEMPO_TAREA_MIN_S = 5;

/**
 * Una tarea programada de un sitio: un comando del proyecto (lista de argumentos, sin shell) con
 * una expresión cron de 5 campos. `confirmada` es la huella (SHA-256, sin clave: un hash como
 * `confiado`, no una firma) del comando que el usuario aceptó en la interfaz: sin ella, o si no coincide con el comando actual, la tarea no se ejecuta
 * (un comando que llegó de un `wolfcore.yml`, de un config.json editado a mano o de otra fuente
 * nunca corre solo). Solo cambia con `Nucleo.guardarTarea` y `confirmarTarea`; `guardarSitio` la
 * conserva tal cual. Estricto: un campo de más invalida la tarea.
 */
export const TareaSitioSchema = z
  .object({
    id: z.string().regex(ID_TAREA),
    nombre: z
      .string()
      .trim()
      .min(1)
      .max(80)
      // eslint-disable-next-line no-control-regex
      .refine((n) => !/[\x00-\x1f\x7f]/.test(n)),
    /** Expresión cron de 5 campos; se valida con `interpretarCron` al guardar y al ejecutar. */
    cron: z.string().max(100),
    comando: z
      .array(
        z
          .string()
          .min(1)
          .max(MAX_CARACTERES_ARG_TAREA)
          // eslint-disable-next-line no-control-regex
          .refine((a) => !/[\x00-\x1f\x7f]/.test(a)),
      )
      .min(1)
      .max(MAX_ARGS_TAREA),
    activa: z.boolean().default(false),
    /** Huella del comando aceptado por el usuario; null = sin confirmar (no se ejecuta). */
    confirmada: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .nullable()
      .default(null),
    tiempoMaxS: z
      .number()
      .int()
      .min(TIEMPO_TAREA_MIN_S)
      .max(TIEMPO_TAREA_MAX_S)
      .default(TIEMPO_TAREA_DEFECTO_S),
    /** De dónde salió el comando (informativo): lo escribió el usuario o vino de wolfcore.yml. */
    origen: z.enum(['usuario', 'wolfcore.yml']).default('usuario'),
  })
  .strict();
export type TareaSitio = z.infer<typeof TareaSitioSchema>;

/** Lista de tareas de un sitio: una mal formada o repetida se descarta sola (nunca corre). */
export const ListaTareasSchema = z
  .array(z.unknown())
  .transform((lista): TareaSitio[] => {
    const vistos = new Set<string>();
    const res: TareaSitio[] = [];
    for (const x of lista.slice(0, MAX_TAREAS_SITIO)) {
      const t = TareaSitioSchema.safeParse(x);
      if (!t.success || vistos.has(t.data.id)) continue;
      vistos.add(t.data.id);
      res.push(t.data);
    }
    return res;
  })
  .catch([]);

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

/**
 * Acceso por la red local (D25). `activo` solo vale mientras la app corre: al salir (y al
 * arrancar) todo se apaga. `puerto` se conserva para que el QR siga siendo el mismo.
 */
export const LanSitioSchema = z.object({
  activo: z.boolean().default(false),
  puerto: z.number().int().min(1024).max(65535),
  https: z.boolean().default(false),
});
export type LanSitio = z.infer<typeof LanSitioSchema>;

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
  /** Tareas programadas (D29); ausente = ninguna. Solo cambian con `Nucleo.guardarTarea` y compañía. */
  tareas: ListaTareasSchema.optional(),
  /** Versiones fijadas para este sitio; mandan sobre wolfcore.yml y los archivos de versión. */
  runtimes: z
    .object({
      node: z.string().min(1).optional(),
      python: z.string().min(1).optional(),
      java: z.string().min(1).optional(),
      dotnet: z.string().min(1).optional(),
      go: z.string().min(1).optional(),
      rust: z.string().min(1).optional(),
      bun: z.string().min(1).optional(),
      deno: z.string().min(1).optional(),
      zig: z.string().min(1).optional(),
      kotlin: z.string().min(1).optional(),
      dart: z.string().min(1).optional(),
      ruby: z.string().min(1).optional(),
      maven: z.string().min(1).optional(),
      gradle: z.string().min(1).optional(),
    })
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
  /**
   * A dónde envía correo el proyecto: el captador local elegido (`Config.correo.captador`) o un
   * proveedor SMTP remoto (lo llena D22). Ausente = el captador.
   */
  correo: z
    .discriminatedUnion('modo', [
      z.object({ modo: z.literal('captador') }),
      z.object({ modo: z.literal('smtp'), proveedor: z.string().regex(ID_PROVEEDOR_SMTP) }),
    ])
    .optional(),
  /**
   * Cómo se publica el sitio (D23): proveedor y, con Cloudflare con nombre, el túnel y el dominio
   * público. Ausente = Cloudflare rápido. Nunca lleva tokens: viven en `AlmacenSecretos`.
   */
  tunel: TunelSitioSchema.optional(),
  /** Compartido en la red local (solo lo cambia `Nucleo.lan`, nunca el formulario del sitio). */
  lan: LanSitioSchema.optional(),
  /**
   * Importado de un perfil (D26) con algo por resolver: `carpeta` = su carpeta no existe en este
   * equipo (el usuario la busca con "buscar carpeta"). Ausente o null = nada pendiente.
   */
  pendiente: z.enum(['carpeta']).nullable().optional(),
  /**
   * `perfil`: el sitio llegó de un perfil de otro equipo (D26). Sus procesos no arrancan hasta que
   * el usuario marque "Confío en este repositorio".
   */
  origen: z.enum(['perfil']).optional(),
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
  'smtp4dev',
  'inbucket',
  'papercut',
  'ollama',
  'meilisearch',
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
  // Captadores de correo (D21): comparten el puerto SMTP (`Config.correo.puertoSmtp`); estos
  // valores solo son el de partida de su campo heredado.
  smtp4dev: 1025,
  inbucket: 1025,
  papercut: 1025,
  ollama: 11434,
  meilisearch: 7700,
};

/**
 * Clave de una instancia (`<servicio>@<clave>`): la de la carpeta de datos de su rama ("8.4",
 * "17", "actual"). Minúsculas, dígitos y puntos, hasta 16 caracteres y sin `..`.
 */
export const CLAVE_INSTANCIA = /^[0-9a-z][0-9a-z.]{0,15}$/;
export function claveInstanciaValida(clave: unknown): clave is string {
  return typeof clave === 'string' && CLAVE_INSTANCIA.test(clave) && !clave.includes('..');
}

/** `<servicio>@<clave>`: una instancia de un servicio de datos (p. ej. `mysql@8.4`). */
export type IdInstancia = `${IdServicioDatos}@${string}`;

export const InstanciaConfigSchema = z.object({
  /** Versión instalada que usa (los binarios); su rama es la de la clave. */
  version: z.string().min(1).max(40),
  puerto: z.number().int().min(1).max(65535),
  autoIniciar: z.boolean().default(false),
});
export type InstanciaConfig = z.infer<typeof InstanciaConfigSchema>;

/**
 * Instancias por clave. Una entrada mal formada (clave rara, puerto fuera de rango) se descarta
 * sola, sin mandar el config entero a `corrupto`: su carpeta de datos sigue en disco.
 */
const InstanciasSchema = z.record(z.string(), z.unknown()).transform((r) => {
  const res: Record<string, InstanciaConfig> = {};
  for (const [clave, valor] of Object.entries(r)) {
    if (!claveInstanciaValida(clave)) continue;
    const i = InstanciaConfigSchema.safeParse(valor);
    if (i.success) res[clave] = i.data;
  }
  return res;
});

/**
 * Configuración de un servicio de datos. `version`/`puerto`/`autoIniciar` son la forma de una
 * sola instancia (hasta la Task 18): sin `instancias` describen la única (implícita). Con
 * `instancias` (tras la migración) mandan las instancias y esos tres campos reflejan la
 * predeterminada (compatibilidad con lo que aún los lee y con versiones anteriores de la app).
 */
const servicioDatos = (puerto: number) =>
  z
    .object({
      version: z.string().nullable().default(null),
      puerto: z.number().int().min(1).max(65535).default(puerto),
      autoIniciar: z.boolean().default(false),
      /** Clave de la instancia predeterminada (la de `iniciar('mysql')`, `.env`, recetas). */
      predeterminada: z.string().nullable().optional().catch(undefined),
      instancias: InstanciasSchema.optional().catch(undefined),
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
export type ClaveCredencial = IdServicioDatos | IdInstancia | `ftp:${string}` | 'mcp';

/** `<servicio>@<clave>` con una clave válida (la misma regla que `parsearInstancia`). */
const ClaveInstanciaCredencialSchema = z.string().refine((x) => {
  const i = x.indexOf('@');
  if (i < 0) return false;
  return (
    (IDS_SERVICIO_DATOS as readonly string[]).includes(x.slice(0, i)) &&
    claveInstanciaValida(x.slice(i + 1))
  );
});

const ClaveCredencialSchema = z.union([
  z.enum(IDS_SERVICIO_DATOS),
  ClaveInstanciaCredencialSchema,
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
export { IDIOMAS_UI, ATAJO_CAPTURA_POR_DEFECTO, type IdiomaUi } from './constantesUi';
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
    /** Muestra en la barra lateral las secciones avanzadas (hoy, Contenedores). */
    seccionesAvanzadas: z.boolean().default(false).catch(false),
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
  seccionesAvanzadas: z.boolean().optional(),
});
export type CambiosPreferenciasUi = z.infer<typeof CambiosPreferenciasUiSchema>;

/** Formatos en que se guarda una captura de pantalla (D35). */
export const FORMATOS_CAPTURA = ['png', 'jpg'] as const;
export type FormatoCaptura = (typeof FORMATOS_CAPTURA)[number];

/**
 * Forma de un atajo global de Electron (aceleradora): de uno a tres modificadores y una tecla
 * (letra, dígito o F1-F24). Lo que no encaje aquí no llega nunca a `globalShortcut`.
 */
const FORMA_ATAJO_CAPTURA =
  /^(?:(?:Ctrl|Alt|Shift|Super)\+){1,3}(?:[A-Z0-9]|F(?:[1-9]|1[0-9]|2[0-4]))$/;

/**
 * Atajos del sistema y de casi cualquier programa que un atajo global no debe quitar (forma
 * canónica: modificadores en orden Ctrl, Alt, Shift, Super). Ctrl+Alt+Supr no puede escribirse
 * con la forma de arriba (Supr no es una tecla admitida), pero se deja anotado.
 */
const ATAJOS_COMUNES: ReadonlySet<string> = new Set([
  ...['A', 'C', 'V', 'X', 'Z', 'Y', 'S', 'P', 'F', 'N', 'W', 'T', 'O'].map((k) => `Ctrl+${k}`),
  ...['S', 'T', 'N', 'Z'].map((k) => `Ctrl+Shift+${k}`),
  'Alt+F4',
  'Ctrl+Alt+Supr',
]);

export type MotivoAtajoCaptura = 'invalido' | 'no_permitido';

/**
 * Por qué se rechaza un atajo (null = vale). `invalido`: no tiene la forma de un atajo.
 * `no_permitido`: la tiene, pero es poco seguro como atajo global:
 *  - exige Ctrl o Super y al menos dos modificadores (Super solo vale);
 *  - Ctrl+Alt sin Mayús es AltGr en los teclados europeos: con él se pierde la @ y otros símbolos;
 *  - ni los atajos comunes (copiar, pegar, guardar, cerrar...).
 */
export function motivoAtajoCaptura(v: unknown): MotivoAtajoCaptura | null {
  if (typeof v !== 'string' || !FORMA_ATAJO_CAPTURA.test(v)) return 'invalido';
  const partes = v.split('+');
  const tecla = partes.pop()!;
  const mods = new Set(partes);
  if (mods.size !== partes.length) return 'invalido';
  const ctrl = mods.has('Ctrl');
  const alt = mods.has('Alt');
  const shift = mods.has('Shift');
  const sup = mods.has('Super');
  if (!ctrl && !sup) return 'no_permitido';
  if (mods.size < 2 && !(sup && mods.size === 1)) return 'no_permitido';
  if (ctrl && alt && !shift) return 'no_permitido';
  const canonico = [ctrl && 'Ctrl', alt && 'Alt', shift && 'Shift', sup && 'Super', tecla]
    .filter((x): x is string => typeof x === 'string')
    .join('+');
  return ATAJOS_COMUNES.has(canonico) ? 'no_permitido' : null;
}

export function esAtajoCaptura(v: unknown): v is string {
  return motivoAtajoCaptura(v) === null;
}

/**
 * Captura de pantalla (`config.json` → `captura`). `atajo` null = sin atajo global: es lo que
 * hay hasta que el usuario lo activa. Un valor raro cae al por defecto en vez de dañar el config.
 */
export const CapturaConfigSchema = z
  .object({
    atajo: z.string().refine(esAtajoCaptura).nullable().default(null).catch(null),
    formato: z.enum(FORMATOS_CAPTURA).default('png').catch('png'),
  })
  .prefault({});
export type CapturaConfig = z.infer<typeof CapturaConfigSchema>;

/** Cambios que pide la interfaz: estrictos. */
export const CambiosCapturaSchema = z.strictObject({
  atajo: z.string().refine(esAtajoCaptura).nullable().optional(),
  formato: z.enum(FORMATOS_CAPTURA).optional(),
});
export type CambiosCaptura = z.infer<typeof CambiosCapturaSchema>;

/**
 * Rango pasivo de FTP por defecto: fuera de los puertos efímeros de Windows (49152-65535), donde
 * el sistema puede estar usando cualquiera de ellos para conexiones salientes.
 */
export const PASIVOS_FTP_POR_DEFECTO: readonly [number, number] = [30000, 30100];
/** Rango por defecto anterior (hasta la Etapa B): se migra al leer el config. */
export const PASIVOS_FTP_VIEJOS: readonly [number, number] = [50000, 50100];

/* ───────────── Workspaces de arranque (D28) ───────────── */

/** Servicios sueltos que un workspace puede encender (los de datos con una sola versión activa). */
export const SERVICIOS_WORKSPACE = [
  'nginx',
  'php',
  'mailpit',
  'smtp4dev',
  'inbucket',
  'papercut',
  'ollama',
] as const;
export type ServicioWorkspace = (typeof SERVICIOS_WORKSPACE)[number];

export const ID_WORKSPACE = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const ID_SITIO_WS = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;
const ID_PROCESO_WS = /^[A-Za-z0-9][A-Za-z0-9_]{0,59}$/;
const ID_INSTANCIA_WS = new RegExp(
  `^(mysql|mariadb|postgresql|redis|mongodb|mailpit|ollama|meilisearch)@([0-9a-z][0-9a-z.]{0,15})$`,
);
/** Máximo de elementos por workspace y de workspaces en total. */
export const MAX_ELEMENTOS_WORKSPACE = 40;
export const MAX_WORKSPACES = 200;

/**
 * Un elemento de un workspace: solo **referencias** (a una instancia, a un servicio, a un proceso
 * de un proyecto). Nunca lleva comandos, rutas ni variables: así un workspace puede viajar en un
 * perfil sin traer nada ejecutable. Un campo de más lo invalida.
 */
export const ElementoWorkspaceSchema = z.discriminatedUnion('tipo', [
  z
    .object({
      tipo: z.literal('instancia'),
      id: z.string().refine((v) => {
        const m = ID_INSTANCIA_WS.exec(v);
        return m !== null && !m[2]!.includes('..');
      }),
    })
    .strict(),
  z.object({ tipo: z.literal('servicio'), id: z.enum(SERVICIOS_WORKSPACE) }).strict(),
  z
    .object({
      tipo: z.literal('proceso'),
      sitioId: z.string().regex(ID_SITIO_WS),
      procesoId: z.string().regex(ID_PROCESO_WS),
    })
    .strict(),
]);
export type ElementoWorkspace = z.infer<typeof ElementoWorkspaceSchema>;

export const WorkspaceSchema = z
  .object({
    id: z.string().regex(ID_WORKSPACE),
    nombre: z
      .string()
      .trim()
      .min(1)
      .max(60)
      // eslint-disable-next-line no-control-regex
      .refine((n) => !/[\x00-\x1f\x7f]/.test(n)),
    elementos: z.array(ElementoWorkspaceSchema).max(MAX_ELEMENTOS_WORKSPACE),
  })
  .strict();
export type Workspace = z.infer<typeof WorkspaceSchema>;

/**
 * Lista de workspaces del config: uno mal formado o repetido se descarta solo, sin mandar el
 * config entero a `corrupto`.
 */
export const ListaWorkspacesSchema = z
  .array(z.unknown())
  .transform((lista): Workspace[] => {
    const vistos = new Set<string>();
    const res: Workspace[] = [];
    for (const x of lista.slice(0, MAX_WORKSPACES)) {
      const w = WorkspaceSchema.safeParse(x);
      if (!w.success || vistos.has(w.data.id)) continue;
      vistos.add(w.data.id);
      res.push(w.data);
    }
    return res;
  })
  .default([])
  .catch([]);

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
  /**
   * Servidor de órdenes de la CLI `wolf` (D31): apagado por defecto. Se enciende al agregar `wolf`
   * al PATH y se apaga en Ajustes; apagado no escucha ni existe `run/cli.json`.
   */
  cli: z.object({ activo: z.boolean().default(false) }).prefault({}),
  /** Editor de código: null = el primero detectado. */
  editor: z
    .object({
      predeterminado: z.enum(IDS_EDITOR).nullable().default(null).catch(null),
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
          // Un valor fuera de rango vuelve al de por defecto (nunca manda el config a corrupto).
          puerto: z.number().int().min(1).max(65535).default(80).catch(80),
        })
        .prefault({}),
      php: z
        .object({
          versiones: z.array(z.string()).default([]),
          trabajadores: z.number().int().min(1).max(16).default(2).catch(2),
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
          smtp4dev: servicioDatos(PUERTOS_POR_DEFECTO.smtp4dev),
          inbucket: servicioDatos(PUERTOS_POR_DEFECTO.inbucket),
          papercut: servicioDatos(PUERTOS_POR_DEFECTO.papercut),
          ollama: servicioDatos(PUERTOS_POR_DEFECTO.ollama),
          meilisearch: servicioDatos(PUERTOS_POR_DEFECTO.meilisearch),
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
  /** Correo local: el captador que reciben los proyectos (uno encendido a la vez). */
  correo: z
    .object({
      captador: z
        .enum(['mailpit', 'smtp4dev', 'inbucket', 'papercut'])
        .default('mailpit')
        .catch('mailpit'),
      /**
       * Puerto SMTP común a todos los captadores (solo uno corre a la vez): los `.env` de los
       * proyectos siguen valiendo al cambiar de captador. Cambia desde Servicios.
       */
      puertoSmtp: z.number().int().min(1024).max(65535).default(1025).catch(1025),
      /** Proveedores SMTP remotos (D22): sin clave, que vive en `AlmacenSecretos` (`smtp:<id>`). */
      proveedores: ListaProveedoresSmtpSchema,
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
  /** Catálogo en vivo: servicios de los que no se avisa de versiones nuevas. */
  catalogo: z
    .object({
      silenciados: z
        .array(z.string().regex(/^[a-z][a-z0-9-]{0,30}$/))
        .max(32)
        .default([])
        .catch([]),
      /**
       * Versión predeterminada (para proyectos nuevos y herramientas) de Node, Python, Java, .NET,
       * Go, Rust, Composer y cloudflared; si no está instalada se usa la más nueva instalada.
       */
      predeterminadas: z
        .partialRecord(
          z.enum([
            'node',
            'python',
            'java',
            'dotnet',
            'go',
            'rust',
            'bun',
            'deno',
            'zig',
            'kotlin',
            'dart',
            'ruby',
            'maven',
            'gradle',
            'composer',
            'cloudflared',
          ]),
          z.string().regex(/^[0-9a-z][0-9a-z.+-]{0,39}$/),
        )
        .default({})
        .catch({}),
    })
    .prefault({}),
  /**
   * Proveedores de IA en la nube (id, tipo, nombre, URL base, modelo). Las claves NUNCA van
   * aquí: viven cifradas en etc/secretos/ y solo las lee el proceso principal.
   */
  ia: ConfigIaSchema,
  /** Workspaces de arranque (D28): conjuntos con nombre de instancias, servicios y procesos. */
  workspaces: ListaWorkspacesSchema,
  /** Preferencias de la interfaz (tema, idioma, acento, asistente de primer uso). */
  ui: PreferenciasUiSchema.catch(() => PreferenciasUiSchema.parse({})),
  /** Captura de pantalla (D35): atajo global opcional y formato al guardar. */
  captura: CapturaConfigSchema.catch(() => CapturaConfigSchema.parse({})),
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

/** Estado de una instancia de un servicio de datos. */
export interface EstadoInstancia {
  id: IdInstancia;
  servicio: IdServicioDatos;
  clave: string;
  version: string;
  puerto: number;
  estado: 'apagado' | 'iniciando' | 'encendido' | 'error';
  pid: number | null;
  predeterminada: boolean;
  autoIniciar: boolean;
  /** Su carpeta de datos existe y está inicializada. */
  tieneDatos: boolean;
  /**
   * Bloqueada tras una actualización que no pudo devolver sus datos: no arranca hasta que el
   * usuario lo resuelva. null si no lo está.
   */
  bloqueo?: BloqueoInstancia | null;
}

export interface BloqueoInstancia {
  fecha: string;
  /** Dónde quedaron los datos que tocó la versión nueva. */
  fallida: string;
  /** Copia en frío de antes de actualizar. */
  respaldo: string;
  /** Versión a la que vuelve la configuración al resolver (si quedó con la que no arrancó). */
  version?: string;
  /** La marca existe pero no se pudo leer (sigue bloqueando; hay que elegir la versión). */
  ilegible?: boolean;
}

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
  /**
   * Instancias del servicio de datos (la del propio estado es la predeterminada). Solo cuando el
   * servicio tiene instancias configuradas (siempre tras la migración de la Task 18).
   */
  instancias?: EstadoInstancia[];
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

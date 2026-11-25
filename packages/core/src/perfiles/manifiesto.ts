import { z } from 'zod';
import { ErrorWolf } from '../errores';
import { hostDePreset, PRESETS_SMTP } from '../correo/proveedores';
import { DOMINIO_VALIDO } from '../hosts/bloque';
import { enmascararSecretos } from '../patronesSecretos';
import { VALORES_RAPIDOS } from '../php/ini';
import { validarPhpIni } from '../php/poolSitio';
import { validarXdebug } from '../php/xdebug';
import { llevaSecreto, sinSecretosPlantilla } from '../proyectos/plantillas';
import { enmascararComando, enmascararNginx } from './secretos';
import {
  claveInstanciaValida,
  ConfigSchema,
  IDS_SERVICIO_DATOS,
  ElementoWorkspaceSchema,
  MAX_ELEMENTOS_WORKSPACE,
  MAX_WORKSPACES,
  SitioSchema,
  WorkspaceSchema,
  type Config,
  type Sitio,
  type Workspace,
} from '../tipos';

/**
 * Perfil del entorno (D26): un ZIP `.wolfperfil` con `manifiesto.json` y, si el usuario los
 * incluye, plantillas, volcados de bases y la CA cifrada. Todo lo que entra o sale pasa por una
 * **lista blanca de rutas** (`rutaPermitidaEnPerfil`): nada de `etc/`, `run/`, `tmp/`,
 * `instantaneas/`, `papelera/` ni `respaldos/` puede viajar, aunque un perfil manipulado lo traiga.
 */

export const VERSION_PERFIL = 1;
export const EXTENSION_PERFIL = '.wolfperfil';

/**
 * Lo que un perfil **nunca** exporta ni importa (documentación y pruebas: el perfil se arma solo
 * con lo de `RUTAS_PERFIL`, así que nada de esto puede entrar aunque falte en la lista).
 */
export const EXCLUSIONES_PERFIL: readonly string[] = [
  // Secretos (D16, D22, D23, D24): claves de IA, SMTP, túneles, `bd:<sitio>`, token de GitHub.
  'etc/secretos/',
  'etc/github.token',
  // Credenciales de las instancias, del FTP y token del MCP.
  'etc/credenciales.json',
  // Registro de plantillas propias (D14): un perfil nunca puede declarar una plantilla "propia".
  'etc/plantillas-propias.json',
  // Copias de los .env con valores en claro (D16).
  'etc/respaldos/',
  // Secreto de proceso y puerto del canje de tokens de Adminer y phpMyAdmin (D18).
  'etc/acceso-bd/',
  // Túneles con nombre de Cloudflare: cert.pem y <sitio>.yml (D23).
  'etc/cloudflared/',
  // Registro de huellas de instantáneas (D19): un perfil no puede declarar un volcado propio.
  'etc/instantaneas-huellas.json',
  // Entornos de Python propios de este equipo.
  'etc/venvs-propios.json',
  // Vhosts auxiliares de túneles y red local (D23-D25): estado de este equipo.
  'etc/nginx/extras/',
  // Instantáneas y papelera de bases (D19): volcados completos sin cifrar.
  'instantaneas/',
  'papelera/',
  // Auditoría de contraseñas restablecidas (D20) y copias previas.
  'respaldos/',
  // Sesiones de phpMyAdmin (D18) y temporales.
  'tmp/',
  // Estado de procesos, túneles, cloudflared y ngrok de este equipo.
  'run/',
  // La CA y los certificados solo viajan cifrados (`ca.cifrada`).
  'ca/',
  'certs/',
  // Binarios y datos de los servicios (las versiones se vuelven a descargar con su huella).
  'bin/',
  'data/',
  'config.json',
];

const ID_PLANTILLA = '[a-z0-9][a-z0-9-]{0,79}';
const CLAVE_INSTANCIA = '[0-9a-z][0-9a-z.]{0,15}';
const BASE = '[A-Za-z0-9_$-]{1,64}';

/** Rutas que un perfil puede llevar (y las únicas que se leen al importar). */
const RUTAS_PERFIL: readonly RegExp[] = [
  /^manifiesto\.json$/,
  /^ca\.cifrada$/,
  new RegExp(
    `^plantillas/${ID_PLANTILLA}/(?:plantilla\\.json|archivos\\.zip|esquema\\.sql|esquema\\.dump)$`,
  ),
  // Cada motor con su formato (siempre cifrado con la frase): PostgreSQL, un `pg_dump`; MySQL y
  // MariaDB, la estructura y los datos por separado.
  new RegExp(`^bases/postgresql@${CLAVE_INSTANCIA}/${BASE}/volcado\\.dump\\.cifrado$`),
  new RegExp(
    `^bases/(?:mysql|mariadb)@${CLAVE_INSTANCIA}/${BASE}/(?:esquema|datos)\\.sql\\.cifrado$`,
  ),
];

/** Nombres de dispositivo de Windows y tramos que terminan en punto o espacio. */
const NOMBRE_RESERVADO = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$|[. ]$/i;

/** ¿Esta entrada del ZIP es de las que un perfil puede llevar? */
export function rutaPermitidaEnPerfil(ruta: string): boolean {
  if (ruta.includes('..') || ruta.split('/').some((t) => NOMBRE_RESERVADO.test(t))) return false;
  return RUTAS_PERFIL.some((r) => r.test(ruta));
}

/**
 * ¿La entrada es peligrosa por sí misma (zip-slip, ruta absoluta, unidad, flujo alterno,
 * controles, nombre reservado)? Una sola así y el perfil entero se rechaza.
 */
export function entradaPeligrosa(nombreCrudo: string): boolean {
  const nombre = nombreCrudo.replace(/\\/g, '/');
  return (
    nombre === '' ||
    nombre.length > 512 ||
    nombre.startsWith('/') ||
    /^[A-Za-z]:/.test(nombre) ||
    /[:\0]/.test(nombre) ||
    [...nombre].some((c) => c.charCodeAt(0) < 0x20) ||
    nombre
      .split('/')
      .filter((t, i, a) => !(t === '' && i === a.length - 1))
      .some((t) => t === '' || t === '..' || t === '.' || NOMBRE_RESERVADO.test(t))
  );
}

const HEX64 = /^[0-9a-f]{64}$/;
const VERSION = /^[0-9a-z][0-9a-z.+_-]{0,39}$/i;
const SERVICIO = /^[a-z][a-z0-9-]{0,39}$/;

export const ManifiestoPerfilSchema = z
  .object({
    formato: z.literal('wolfcore-perfil'),
    version: z.literal(VERSION_PERFIL),
    creado: z.string().max(40),
    origen: z.object({
      sistema: z.string().max(20),
      idCatalogo: z.string().max(80),
    }),
    /** config.json sin sitios ni nada secreto (se valida con `ConfigSchema` al importar). */
    config: z.record(z.string(), z.unknown()),
    sitios: z.array(z.unknown()).max(1000),
    versiones: z
      .array(
        z.object({
          servicio: z.string().regex(SERVICIO),
          version: z.string().regex(VERSION),
          /** Huella publicada (`algoritmo:hex`) con la que se instaló, si se sabe. Solo informa. */
          huella: z.string().max(200).nullable(),
        }),
      )
      .max(500),
    instancias: z
      .array(
        z.object({
          id: z.string().max(60),
          version: z.string().regex(VERSION),
          puerto: z.number().int().min(1).max(65535),
        }),
      )
      .max(200),
    plantillas: z.array(z.string().regex(new RegExp(`^${ID_PLANTILLA}$`))).max(500),
    /** D28: workspaces (solo referencias); D29 llena las tareas. Cada uno se valida al importar. */
    workspaces: z.array(z.unknown()).max(200).default([]),
    tareas: z.array(z.unknown()).max(1000).default([]),
    incluye: z.object({ bases: z.boolean(), certificados: z.boolean(), ca: z.boolean() }),
    /** Huella SHA-256 del certificado de la CA que viaja cifrada (se comprueba al descifrarla). */
    ca: z
      .object({
        huella: z.string().regex(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/),
        /** El certificado (público) de la CA: la vista previa ve sus restricciones sin la frase. */
        certificado: z.string().max(16 * 1024),
      })
      .nullable()
      .default(null),
    bases: z
      .array(
        z.object({
          instancia: z.string().max(60),
          base: z.string().regex(new RegExp(`^${BASE}$`)),
        }),
      )
      .max(500)
      .default([]),
    /** SHA-256 de cada archivo del perfil (menos el manifiesto): lo que no coincide, no se usa. */
    archivos: z.record(z.string().max(300), z.string().regex(HEX64)),
  })
  .strict();
export type ManifiestoPerfil = z.infer<typeof ManifiestoPerfilSchema>;

/** Valida el manifiesto: versión futura → `version_no_soportada`; lo demás mal formado → `danado`. */
export function leerManifiesto(bruto: unknown): ManifiestoPerfil {
  const v = (bruto as { version?: unknown } | null)?.version;
  if (typeof v === 'number' && v > VERSION_PERFIL) {
    throw new ErrorWolf(
      'perfiles.version_no_soportada',
      'El perfil es de una versión más nueva de WolfCore Dev: actualice la app para importarlo.',
      { version: v },
    );
  }
  const r = ManifiestoPerfilSchema.safeParse(bruto);
  if (!r.success) {
    throw new ErrorWolf('perfiles.danado', 'El perfil está dañado o fue modificado.');
  }
  for (const ruta of Object.keys(r.data.archivos)) {
    if (!rutaPermitidaEnPerfil(ruta)) {
      throw new ErrorWolf('perfiles.danado', 'El perfil está dañado o fue modificado.');
    }
  }
  return r.data;
}

/** `<servicio>@<clave>` válido. */
export function parsearInstanciaPerfil(
  id: string,
): { servicio: (typeof IDS_SERVICIO_DATOS)[number]; clave: string } | null {
  const i = id.indexOf('@');
  if (i < 0) return null;
  const servicio = id.slice(0, i);
  const clave = id.slice(i + 1);
  if (!(IDS_SERVICIO_DATOS as readonly string[]).includes(servicio)) return null;
  if (!claveInstanciaValida(clave)) return null;
  return { servicio: servicio as (typeof IDS_SERVICIO_DATOS)[number], clave };
}

/* ───────────── Sitios ───────────── */

/**
 * Sitio tal como viaja: sin lo que es estado de este equipo (red local, FTP, túnel con nombre,
 * confianza) y sin nada con nombre o forma de secreto (php.ini, reglas, comandos, remoto de git).
 */
export function sitioParaPerfil(s: Sitio): Sitio {
  const copia: Record<string, unknown> = sinSecretosPlantilla({ ...s }) as Record<string, unknown>;
  delete copia.lan;
  delete copia.ftp;
  delete copia.pendiente;
  if (s.tunel?.proveedor === 'cloudflare-nombre') delete copia.tunel;
  copia.confiado = false;
  copia.recetaConfiada = null;
  // Lo que no tiene forma de secreto pero lo es: el valor de directivas con nombre de secreto y
  // el argumento que sigue a `--token`, `--password`… Una nota con algo así no viaja.
  copia.reglasExtra = enmascararNginx(s.reglasExtra);
  if (typeof s.vhostManual === 'string') copia.vhostManual = enmascararNginx(s.vhostManual);
  copia.procesos = s.procesos.map((p) => ({ ...p, comando: enmascararComando(p.comando) }));
  copia.nota = llevaSecreto(s.nota) || enmascararSecretos(s.nota) !== s.nota ? '' : s.nota;
  // Los campos que el filtro pudo quitar por nombre (nunca debería) vuelven a su forma básica.
  copia.id = s.id;
  copia.carpeta = s.carpeta;
  return SitioSchema.parse(copia);
}

export interface SitioImportado {
  sitio: Sitio | null;
  /** Por qué no se pudo importar (sitio omitido) o qué se le quitó (sitio importado). */
  motivos: string[];
}

const ID_SITIO = /^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/;

/**
 * Sitio que llega de un perfil: siempre **importado**, nunca propio. Se valida con el esquema y se
 * le quita lo que nunca viaja (aunque el perfil lo traiga); no queda confiado, sus procesos no
 * arrancan solos, sus reglas de Nginx y su vhost manual quedan guardados pero fuera hasta que el
 * usuario los aplique desde el editor, y php.ini y Xdebug pasan por los mismos validadores que la
 * interfaz.
 */
export function sitioImportado(bruto: unknown): SitioImportado {
  const motivos: string[] = [];
  const r = SitioSchema.safeParse(bruto);
  if (!r.success) return { sitio: null, motivos: ['sitio_invalido'] };
  const s: Sitio = { ...r.data };
  if (!ID_SITIO.test(s.id)) return { sitio: null, motivos: ['sitio_invalido'] };
  s.dominio = s.dominio.trim().toLowerCase();
  s.alias = s.alias.map((a) => a.trim().toLowerCase());
  for (const d of [s.dominio, ...s.alias]) {
    if (!d.endsWith('.test') || d === '.test' || !DOMINIO_VALIDO.test(d)) {
      return { sitio: null, motivos: ['dominio_invalido'] };
    }
  }
  delete s.lan;
  delete s.ftp;
  delete s.capturaDumps;
  if (s.tunel?.proveedor === 'cloudflare-nombre') {
    delete s.tunel;
    motivos.push('tunel_con_nombre');
  }
  s.confiado = false;
  s.recetaConfiada = null;
  // Los comandos de los procesos son de otro equipo (de origen ajeno): no se importan.
  if (s.procesos.length > 0) motivos.push('procesos_quitados');
  s.procesos = [];
  s.origen = 'perfil';
  if (s.phpIni !== undefined) {
    try {
      const ini = validarPhpIni(s.phpIni);
      // De un perfil, solo los ajustes rápidos (con su validador de valores): nada que cargue
      // código, ejecute un comando o apunte a una ruta de otro equipo.
      for (const k of Object.keys(ini)) {
        if (!Object.hasOwn(VALORES_RAPIDOS, k)) {
          delete ini[k];
          if (!motivos.includes('php_ini')) motivos.push('php_ini');
        }
      }
      s.phpIni = ini;
    } catch {
      delete s.phpIni;
      motivos.push('php_ini');
    }
  }
  if (s.xdebug !== undefined && s.xdebug !== null) {
    try {
      s.xdebug = validarXdebug({ ...s.xdebug });
    } catch {
      s.xdebug = null;
      motivos.push('xdebug');
    }
  }
  // Lo del usuario en Nginx queda guardado, pero fuera, hasta que se aplique desde el editor.
  const manual = typeof s.vhostManual === 'string' && s.vhostManual.trim() !== '';
  if (manual || s.reglasExtra.trim() !== '') {
    s.vhostDesactivado = manual ? 'manual' : 'reglas';
    motivos.push('nginx_desactivado');
  } else {
    delete s.vhostDesactivado;
  }
  if (s.git?.remoto) s.git = { ...s.git, remoto: enmascararSecretos(s.git.remoto) };
  delete s.pendiente;
  return { sitio: SitioSchema.parse(s), motivos };
}

/* ───────────── Workspaces (D28) ───────────── */

/**
 * Workspaces para el perfil: solo `id`, `nombre` y referencias a instancias y servicios. Se
 * reconstruyen campo por campo: nada ejecutable (comandos, rutas, variables) puede viajar. Los
 * procesos de proyecto **no** viajan (como los comandos de los sitios, que el perfil quita): un
 * workspace que solo llevaba procesos no viaja.
 */
export function workspacesParaPerfil(lista: readonly Workspace[]): Workspace[] {
  const res: Workspace[] = [];
  for (const w of lista) {
    const elementos = w.elementos.filter((e) => e.tipo !== 'proceso').map((e) => ({ ...e }));
    if (w.elementos.length > 0 && elementos.length === 0) continue;
    res.push({ id: w.id, nombre: w.nombre, elementos });
  }
  return res;
}

/** Un workspace leído de un perfil y los elementos mal formados que se le quitaron. */
export interface WorkspaceDePerfil {
  workspace: Workspace;
  /** Elementos con forma inválida (campos de más, ids raros): no viajan. */
  descartados: number;
}

/**
 * Los workspaces bien formados de un manifiesto. Uno con la cáscara mal (id raro, campos de más) se
 * cuenta en `invalidos`; a uno bueno se le quitan solo los elementos mal formados.
 */
export function leerWorkspacesPerfil(brutos: readonly unknown[]): {
  validos: WorkspaceDePerfil[];
  invalidos: number;
} {
  const validos: WorkspaceDePerfil[] = [];
  const vistos = new Set<string>();
  let invalidos = 0;
  for (const b of brutos.slice(0, MAX_WORKSPACES)) {
    const crudo = typeof b === 'object' && b !== null ? (b as Record<string, unknown>) : null;
    const lista = Array.isArray(crudo?.['elementos']) ? (crudo['elementos'] as unknown[]) : null;
    const cascara = lista ? WorkspaceSchema.safeParse({ ...crudo, elementos: [] }) : null;
    if (!lista || !cascara?.success || vistos.has(cascara.data.id)) {
      invalidos++;
      continue;
    }
    vistos.add(cascara.data.id);
    const elementos: Workspace['elementos'] = [];
    let descartados = 0;
    for (const e of lista.slice(0, MAX_ELEMENTOS_WORKSPACE)) {
      const r = ElementoWorkspaceSchema.safeParse(e);
      if (r.success) elementos.push(r.data);
      else descartados++;
    }
    descartados += Math.max(0, lista.length - MAX_ELEMENTOS_WORKSPACE);
    validos.push({ workspace: { ...cascara.data, elementos }, descartados });
  }
  return { validos, invalidos };
}

/* ───────────── Configuración ───────────── */

/** config.json para el perfil: sin sitios (van aparte) y sin nada con nombre o forma de secreto. */
export function configParaPerfil(c: Config): Record<string, unknown> {
  // Los workspaces viajan aparte, en el manifiesto, como referencias (D28).
  const { sitios, workspaces, ...resto } = c;
  void sitios;
  void workspaces;
  const salida = sinSecretosPlantilla(resto) as Config;
  // El usuario de un proveedor SMTP no viaja (salvo el fijo de un proveedor conocido, que no dice
  // nada): sin él, el otro equipo no importa ese proveedor y lo lista en la vista previa.
  salida.correo = {
    ...salida.correo,
    proveedores: c.correo.proveedores.map((p) => {
      const { usuario, redLocal, ...resto2 } = p;
      void redLocal;
      const fijo = PRESETS_SMTP.find((x) => x.host === p.host)?.usuarioFijo;
      return (fijo && fijo === usuario ? { ...resto2, usuario } : resto2) as typeof p;
    }),
  };
  return salida as unknown as Record<string, unknown>;
}

/** Puerto global aceptable desde un perfil: el canónico o uno sin privilegios (≥ 1024). */
const puertoAceptable = (p: number, canonico: number | null): boolean =>
  (canonico !== null && p === canonico) || (p >= 1024 && p <= 65535);

/** ¿El host es el de un proveedor conocido (con la región de SES, si la lleva)? */
function hostDePresetConocido(host: string): boolean {
  return PRESETS_SMTP.some((p) =>
    p.host.includes('{region}')
      ? (p.regiones ?? []).some((r) => hostDePreset(p, r) === host)
      : p.host === host,
  );
}

/**
 * Configuración que llega de un perfil, ya validada con `ConfigSchema`:
 * - **carpeta con datos** (`actual`): se conserva la de este equipo entera (servicios, puertos,
 *   herramientas, catálogo, avisos, carpeta vigilada, IA, proveedores SMTP, interfaz); del perfil
 *   solo llegan los sitios y las instancias nuevas (los pone quien llama);
 * - **carpeta limpia**: la del perfil, con lo que abre algo hacia afuera apagado (FTP en la red
 *   local, MCP, receptor de dumps, autoarranques), puertos fuera de rango a su valor por
 *   defecto, sin la carpeta vigilada (es de otro equipo), sin proveedores de IA con URL propia ni
 *   SMTP con un host que no es de un proveedor conocido (y nunca `redLocal`). Lo quitado se
 *   devuelve en `quitados` (`ia:<id>`, `smtp:<id>`, `puerto:<campo>`, `carpeta_vigilada`).
 */
export function fusionarConfig(
  bruta: Record<string, unknown>,
  actual: Config | null,
): { config: Config; quitados: string[] } {
  if (actual) {
    const c = ConfigSchema.parse(structuredClone(actual));
    c.sitios = [];
    return { config: c, quitados: [] };
  }
  const quitados: string[] = [];
  const c = configImportada(bruta);
  // Proveedores SMTP que el esquema descartó (p. ej. sin usuario, que no viaja).
  const correoBruto = (bruta as { correo?: { proveedores?: unknown } }).correo?.proveedores;
  if (Array.isArray(correoBruto)) {
    const validos = new Set(c.correo.proveedores.map((p) => p.id));
    for (const x of correoBruto) {
      const id = (x as { id?: unknown } | null)?.id;
      if (typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,39}$/.test(id) && !validos.has(id)) {
        quitados.push(`smtp:${id}`);
      }
    }
  }
  const defecto = ConfigSchema.parse({});
  const puertos: [string, () => number, (v: number) => void, number | null][] = [
    ['nginx', () => c.servicios.nginx.puerto, (v) => (c.servicios.nginx.puerto = v), 80],
    ['https', () => c.https.puerto, (v) => (c.https.puerto = v), 443],
    ['mcp', () => c.mcp.puerto, (v) => (c.mcp.puerto = v), null],
    ['ftp', () => c.ftp.puerto, (v) => (c.ftp.puerto = v), null],
    ['depuracion', () => c.depuracion.puerto, (v) => (c.depuracion.puerto = v), null],
    ['smtp', () => c.correo.puertoSmtp, (v) => (c.correo.puertoSmtp = v), null],
  ];
  const porDefecto: Record<string, number> = {
    nginx: defecto.servicios.nginx.puerto,
    https: defecto.https.puerto,
    mcp: defecto.mcp.puerto,
    ftp: defecto.ftp.puerto,
    depuracion: defecto.depuracion.puerto,
    smtp: defecto.correo.puertoSmtp,
  };
  for (const [campo, leer, poner, canonico] of puertos) {
    if (!puertoAceptable(leer(), canonico)) {
      poner(porDefecto[campo]!);
      quitados.push(`puerto:${campo}`);
    }
  }
  if (c.proyectos.carpetaVigilada !== null) {
    c.proyectos.carpetaVigilada = null;
    quitados.push('carpeta_vigilada');
  }
  c.ia.proveedores = c.ia.proveedores.filter((p) => {
    if (p.urlBase === null) return true;
    quitados.push(`ia:${p.id}`);
    return false;
  });
  c.correo.proveedores = c.correo.proveedores
    .filter((p) => {
      if (hostDePresetConocido(p.host)) return true;
      quitados.push(`smtp:${p.id}`);
      return false;
    })
    .map((p) => {
      const { redLocal, ...resto } = p;
      void redLocal;
      return resto;
    });
  return { config: c, quitados };
}

/**
 * Configuración que llega de un perfil, ya validada. Lo que abre algo hacia afuera o arranca un
 * servidor no se importa encendido (FTP en la red local, MCP, receptor de dumps); las instancias se
 * ponen después, desde el manifiesto.
 */
export function configImportada(bruta: Record<string, unknown>): Config {
  const r = ConfigSchema.safeParse({ ...bruta, sitios: [] });
  const c = r.success ? r.data : ConfigSchema.parse({});
  c.ftp.redLocal = false;
  c.mcp.activo = false;
  c.depuracion.activa = false;
  for (const id of IDS_SERVICIO_DATOS) {
    const d = c.servicios.datos[id];
    delete d.instancias;
    d.autoIniciar = false;
  }
  return c;
}

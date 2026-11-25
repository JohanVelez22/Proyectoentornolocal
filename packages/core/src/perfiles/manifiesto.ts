import { z } from 'zod';
import { ErrorWolf } from '../errores';
import { DOMINIO_VALIDO } from '../hosts/bloque';
import { enmascararSecretos } from '../patronesSecretos';
import { validarPhpIni } from '../php/poolSitio';
import { validarXdebug } from '../php/xdebug';
import { sinSecretosPlantilla } from '../proyectos/plantillas';
import {
  claveInstanciaValida,
  ConfigSchema,
  IDS_SERVICIO_DATOS,
  SitioSchema,
  type Config,
  type Sitio,
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
const INSTANCIA = `(?:${IDS_SERVICIO_DATOS.join('|')})@[0-9a-z][0-9a-z.]{0,15}`;
const BASE = '[A-Za-z0-9_$-]{1,64}';

/** Rutas que un perfil puede llevar (y las únicas que se leen al importar). */
const RUTAS_PERFIL: readonly RegExp[] = [
  /^manifiesto\.json$/,
  /^ca\.cifrada$/,
  new RegExp(
    `^plantillas/${ID_PLANTILLA}/(?:plantilla\\.json|archivos\\.zip|esquema\\.sql|esquema\\.dump)$`,
  ),
  new RegExp(`^bases/${INSTANCIA}/${BASE}/(?:esquema\\.sql|datos\\.sql|volcado\\.dump)$`),
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
    /** D28 y D29 los llenan; hasta entonces van vacíos. */
    workspaces: z.array(z.unknown()).max(200).default([]),
    tareas: z.array(z.unknown()).max(1000).default([]),
    incluye: z.object({ bases: z.boolean(), certificados: z.boolean(), ca: z.boolean() }),
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

/** Ajustes de php.ini que no se importan de un perfil (código, comandos y rutas de otro equipo). */
const PHP_INI_NO_IMPORTABLE =
  /^(auto_prepend_file|auto_append_file|sendmail_path|sendmail_from|include_path|open_basedir|disable_functions|disable_classes|error_log|mail\.log|user_ini\.filename|.*_(path|dir|file))$/i;

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
      // De un perfil, además, nada que cargue código, ejecute un comando o apunte a una ruta.
      for (const k of Object.keys(ini)) {
        if (PHP_INI_NO_IMPORTABLE.test(k)) {
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

/* ───────────── Configuración ───────────── */

/** config.json para el perfil: sin sitios (van aparte) y sin nada con nombre o forma de secreto. */
export function configParaPerfil(c: Config): Record<string, unknown> {
  const { sitios, ...resto } = c;
  void sitios;
  return sinSecretosPlantilla(resto) as Record<string, unknown>;
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

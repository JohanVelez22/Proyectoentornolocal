import { realpathSync } from 'node:fs';
import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from './errores';

import { NOMBRE_CARPETA_ANTERIOR } from './plataforma/carpetas';
export { NOMBRE_CARPETA, NOMBRE_CARPETA_ANTERIOR, rutaBasePorDefecto } from './plataforma/carpetas';

/** "8.4.13" → "8.4"; si no tiene esa forma, la versión tal cual. */
export function claveMayorMenor(version: string): string {
  const m = /^(\d+)\.(\d+)/.exec(version);
  return m ? `${m[1]}.${m[2]}` : version;
}

/** "17.12" → "17"; si no empieza por un número, la versión tal cual. */
export function claveMayor(version: string): string {
  const m = /^(\d+)/.exec(version);
  return m ? m[1]! : version;
}

/** Variable de entorno para arrancar con otra carpeta de datos (D26). */
export const VARIABLE_DATOS = 'WOLFCORE_DATOS';

const normalizarRuta = (r: string): string =>
  r.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

/** ¿`hija` es `padre` o está dentro (sin distinguir mayúsculas ni separadores)? */
function dentroDe(padre: string, hija: string): boolean {
  const p = normalizarRuta(padre);
  const h = normalizarRuta(hija);
  return h === p || h.startsWith(`${p}/`);
}

/**
 * Carpeta del sistema donde nunca pueden vivir los datos: la raíz de una unidad, Windows, Program
 * Files, ProgramData, `Users` o el perfil entero (sí una carpeta dentro de él, como AppData), y
 * las del sistema en Linux y macOS.
 */
export function esCarpetaDeSistema(ruta: string): boolean {
  const n = normalizarRuta(ruta);
  if (n === '' || /^[a-z]:$/.test(n)) return true;
  if (
    /^[a-z]:\/(?:windows|program files(?: \(x86\))?|programdata|system volume information|\$recycle\.bin|recovery|boot)(?:\/|$)/.test(
      n,
    )
  ) {
    return true;
  }
  if (/^[a-z]:\/users(?:\/[^/]+)?$/.test(n)) return true;
  // POSIX: cualquier carpeta de primer nivel y los árboles del sistema; el perfil entero.
  if (/^\/[^/]+$/.test(n)) return true;
  if (
    /^\/(?:etc|usr|bin|sbin|lib|lib64|dev|proc|sys|boot|root|system|library|applications)\//.test(
      `${n}/`,
    )
  ) {
    return true;
  }
  return /^\/(?:home|users)\/[^/]+$/.test(n);
}

/**
 * Valida la carpeta de `WOLFCORE_DATOS`: absoluta y local (nunca relativa, UNC ni con `:` de más),
 * no del sistema, y nunca la carpeta de datos real (`real`) ni una que la contenga o esté dentro:
 * con la variable, la carpeta real no se lee ni se escribe. Devuelve la ruta sin barra final.
 */
export function validarCarpetaDatos(ruta: string, real: string): string {
  const invalida = (motivo: string): ErrorWolf =>
    new ErrorWolf(
      'perfiles.carpeta_datos_invalida',
      `${VARIABLE_DATOS} no es una carpeta de datos válida: ${motivo}.`,
    );
  const r = typeof ruta === 'string' ? ruta.trim() : '';
  const absoluta =
    r !== '' &&
    r.length <= 400 &&
    ![...r].some((c) => c.charCodeAt(0) < 0x20) &&
    !/^[\\/]{2}/.test(r) &&
    (/^[A-Za-z]:[\\/]/.test(r) ? !r.slice(2).includes(':') : r.startsWith('/') && !r.includes(':'));
  if (!absoluta) throw invalida('debe ser una ruta absoluta y local');
  if (r.split(/[\\/]+/).some((t) => t === '..' || t === '.')) {
    throw invalida('no puede llevar "." ni ".."');
  }
  if (esCarpetaDeSistema(r)) throw invalida('es una carpeta del sistema');
  // La real y la de antes del cambio de nombre, comparadas también por su ruta real (un enlace o
  // una unión que apunte a ellas tampoco vale).
  const reales = [real, path.join(path.dirname(real), NOMBRE_CARPETA_ANTERIOR)];
  const candidatas = [r, rutaReal(r)];
  for (const x of reales.flatMap((y) => [y, rutaReal(y)])) {
    for (const c of candidatas) {
      if (dentroDe(x, c) || dentroDe(c, x)) {
        throw invalida('no puede ser la carpeta de datos real ni contenerla');
      }
    }
  }
  if (esCarpetaDeSistema(rutaReal(r))) throw invalida('es una carpeta del sistema');
  return r.replace(/[\\/]+$/, '');
}

/**
 * Ruta real (sin enlaces ni uniones) de `ruta`: la de su parte que existe más el resto. Si no se
 * puede resolver, la misma.
 */
function rutaReal(ruta: string): string {
  let actual = path.resolve(ruta);
  const resto: string[] = [];
  for (let i = 0; i < 64; i++) {
    try {
      return path.join(realpathSync.native(actual), ...resto.reverse());
    } catch {
      const padre = path.dirname(actual);
      if (padre === actual) return ruta;
      resto.push(path.basename(actual));
      actual = padre;
    }
  }
  return ruta;
}

export class Rutas {
  constructor(readonly base: string) {}

  bin(servicio: string, version: string): string {
    return path.join(this.base, 'bin', servicio, version);
  }
  /**
   * Datos de un servicio: data/<servicio>/<clave>. La clave sale de `claveDatos(version)` (la
   * del DefServicio) o, por defecto, es "mayor.menor" de la versión instalada.
   */
  datos(servicio: string, version: string, claveDatos?: (version: string) => string): string {
    const clave = claveDatos ? claveDatos(version) : claveMayorMenor(version);
    if (!clave || clave === '.' || clave === '..' || /[\\/:]/.test(clave)) {
      throw new Error(`Clave de datos no válida: ${clave}`);
    }
    return path.join(this.base, 'data', servicio, clave);
  }
  /**
   * Puerto y token del servidor de órdenes de la CLI `wolf` (D31): `run/cli.json`, restringido al
   * usuario, regenerado en cada arranque y borrado al cerrar. Cada carpeta de datos tiene el suyo.
   */
  cliJson(): string {
    return path.join(this.base, 'run', 'cli.json');
  }
  /**
   * Carpeta del cliente `wolf` (D32): `bin/cli/wolf.cmd` y `wolf.cjs`. Es la entrada que se agrega
   * al PATH del usuario (aparte de `tools/bin`, la de PHP y Composer).
   */
  cliCliente(): string {
    return path.join(this.base, 'bin', 'cli');
  }
  /** Credenciales de los servicios propios (fuera de config.json). */
  credenciales(): string {
    return path.join(this.base, 'etc', 'credenciales.json');
  }
  /** Token de GitHub cifrado con safeStorage (lo escribe y lee solo el proceso principal). */
  tokenGithub(): string {
    return path.join(this.base, 'etc', 'github.token');
  }
  /** Secretos cifrados con safeStorage (token de GitHub, claves de IA): etc/secretos/. */
  secretos(): string {
    return path.join(this.base, 'etc', 'secretos');
  }
  /** Túneles de Cloudflare con nombre: `cert.pem` y un `<sitio>.yml` por sitio (sin secretos). */
  cloudflaredEtc(): string {
    return path.join(this.base, 'etc', 'cloudflared');
  }
  /** Credenciales temporales de un túnel con nombre (se borran al conectar y al cerrar). */
  cloudflaredRun(): string {
    return path.join(this.base, 'run', 'cloudflared');
  }
  /**
   * Carpeta de inicio temporal de `cloudflared tunnel login` (que siempre escribe en
   * `<inicio>/.cloudflared/cert.pem`): así nunca toca el `~/.cloudflared` real del usuario.
   */
  cloudflaredLogin(): string {
    return path.join(this.base, 'run', 'cloudflared-login');
  }
  /** ngrok: configuración mínima y política de tráfico por sitio (sin secretos; se borran al cerrar). */
  ngrokRun(): string {
    return path.join(this.base, 'run', 'ngrok');
  }
  /** Expose: archivo de configuración con el token por sitio y su inicio propio (se borran al cerrar). */
  exposeRun(): string {
    return path.join(this.base, 'run', 'expose');
  }
  /** Donde el usuario deja su `expose.phar` (WolfCore Dev no lo descarga: no hay huella oficial). */
  exposeBin(): string {
    return path.join(this.base, 'bin', 'expose');
  }
  /** Secreto de proceso y puerto del canje de tokens de Adminer y phpMyAdmin (solo este usuario). */
  accesoBd(): string {
    return path.join(this.base, 'etc', 'acceso-bd');
  }
  /** Sesiones de entrada de phpMyAdmin (guardan la clave de la base mientras dura la sesión). */
  sesionesPma(): string {
    return path.join(this.base, 'tmp', 'phpmyadmin', 'sesiones');
  }
  /**
   * Instantáneas de una base (D19): instantaneas/<instancia>/<base>/. Propias de WolfCore Dev y
   * fuera de data/<servicio>/ (ninguna operación borra los datos de los servicios).
   */
  instantaneas(instancia: string, base: string): string {
    if (!/^[A-Za-z0-9_$.-]{1,64}$/.test(base) || /^\.+$/.test(base)) {
      throw new Error(`Base no válida: ${base}`);
    }
    // Windows no admite como nombre de carpeta CON, NUL, COM1… ni nombres que acaben en punto:
    // se les antepone "%", que un nombre de base no puede llevar (no hay dos bases en una carpeta).
    const reservado = /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(base) || base.endsWith('.');
    return path.join(this.instantaneasDeInstancia(instancia), reservado ? `%${base}` : base);
  }
  /** instantaneas/<instancia>/ (todas las bases de esa instancia, existan o no). */
  instantaneasDeInstancia(instancia: string): string {
    if (!/^[a-z][a-z0-9-]{0,39}(@[A-Za-z0-9._-]{1,40})?$/.test(instancia)) {
      throw new Error(`Instancia no válida: ${instancia}`);
    }
    return path.join(this.base, 'instantaneas', instancia);
  }
  /** Huellas SHA-256 de las instantáneas, fuera de su carpeta: etc/instantaneas-huellas.json. */
  huellasInstantaneas(): string {
    return path.join(this.base, 'etc', 'instantaneas-huellas.json');
  }
  /** Lo que el usuario borró desde WolfCore Dev y aún se puede recuperar (7 días). */
  papelera(): string {
    return path.join(this.base, 'papelera');
  }
  /** Copia de la fila de usuario que cambia al restablecer una contraseña (D20): respaldos/auditoria/. */
  respaldosAuditoria(): string {
    return path.join(this.base, 'respaldos', 'auditoria');
  }
  /** Copias con fecha de los .env y .gitignore de proyectos antes de escribirlos. */
  respaldosEnv(): string {
    return path.join(this.base, 'etc', 'respaldos', 'env');
  }
  nginxConf(): string {
    return path.join(this.base, 'etc', 'nginx', 'nginx.conf');
  }
  vhost(id: string): string {
    return path.join(this.base, 'etc', 'nginx', 'sites', `${id}.conf`);
  }
  /** Vhosts auxiliares (túneles, red local): incluidos por nginx.conf aparte de los de los sitios. */
  vhostAux(id: string): string {
    return path.join(this.base, 'etc', 'nginx', 'extras', `${id}.conf`);
  }
  caCrt(): string {
    return path.join(this.base, 'ca', 'wolfcore-dev-ca.crt');
  }
  caKey(): string {
    return path.join(this.base, 'ca', 'wolfcore-dev-ca.key');
  }
  certCrt(id: string): string {
    return path.join(this.base, 'certs', id + '.crt');
  }
  certKey(id: string): string {
    return path.join(this.base, 'certs', id + '.key');
  }
  phpIni(version: string): string {
    return path.join(this.base, 'etc', 'php', version, 'php.ini');
  }
  logs(...p: string[]): string {
    return path.join(this.base, 'logs', ...p);
  }
  estado(): string {
    return path.join(this.base, 'run', 'estado.json');
  }
  /** Índice ya interpretado del catálogo en vivo de un servicio: run/catalogo/<servicio>.json. */
  cacheCatalogo(servicio: string): string {
    if (!/^[a-z][a-z0-9-]{0,39}$/.test(servicio)) {
      throw new Error(`Servicio no válido: ${servicio}`);
    }
    return path.join(this.base, 'run', 'catalogo', `${servicio}.json`);
  }
  /** Historial de las tareas programadas (50 ejecuciones por tarea): run/tareas-historial.json. */
  historialTareas(): string {
    return path.join(this.base, 'run', 'tareas-historial.json');
  }
  /** Registro de una tarea programada: logs/tareas/<sitio>-<tarea>.log (con ids validados). */
  logTarea(sitioId: string, tareaId: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(sitioId)) {
      throw new Error(`Id de sitio no válido: ${sitioId}`);
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9_]{0,39}$/.test(tareaId)) {
      throw new Error(`Id de tarea no válido: ${tareaId}`);
    }
    return path.join(this.base, 'logs', 'tareas', `${sitioId}-${tareaId}.log`);
  }
  /** Estado persistido de la receta de un sitio: run/receta-<id>.json. */
  receta(sitioId: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(sitioId) || sitioId.includes('..')) {
      throw new Error(`Id de sitio no válido: ${sitioId}`);
    }
    return path.join(this.base, 'run', `receta-${sitioId}.json`);
  }
  config(): string {
    return path.join(this.base, 'config.json');
  }
  /** Herramientas propias: tools/<...>. Los shims viven en tools/bin. */
  herramientas(...p: string[]): string {
    return path.join(this.base, 'tools', ...p);
  }
  tmp(): string {
    return path.join(this.base, 'tmp');
  }
  /**
   * Registro de las plantillas que guardó este equipo (id → huella de su plantilla.json). Está
   * fuera de `plantillas/`: una plantilla que llega copiada de otro lado no trae su entrada y es
   * "importada".
   */
  plantillasPropias(): string {
    return path.join(this.base, 'etc', 'plantillas-propias.json');
  }
  /** Plantillas de proyecto: plantillas/<id>/ (receta, esquema sin datos y archivos). */
  plantillas(): string {
    return path.join(this.base, 'plantillas');
  }

  /**
   * Borra de tmp/ lo que dejó una ejecución anterior interrumpida (cierre forzado, apagón):
   * carpetas importar-* y restaurar-* (pueden ser volcados de GB) y archivos lanzar-*.pid. Solo al
   * arrancar: la app es de instancia única, así que nada de eso está en uso.
   */
  async purgarTemporales(): Promise<void> {
    let nombres: string[];
    try {
      nombres = await readdir(this.tmp());
    } catch {
      return;
    }
    for (const n of nombres) {
      if (!/^(importar|restaurar|esquema|plantilla)-/.test(n) && !/^lanzar-.*\.pid$/.test(n))
        continue;
      await rm(path.join(this.tmp(), n), {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 200,
      }).catch(() => undefined);
    }
  }

  async asegurar(): Promise<void> {
    const dirs = [
      'bin',
      path.join('etc', 'nginx', 'sites'),
      path.join('etc', 'php'),
      path.join('logs', 'sitios'),
      path.join('logs', 'tuneles'),
      'run',
      'tmp',
    ];
    for (const d of dirs) await mkdir(path.join(this.base, d), { recursive: true });
  }
}

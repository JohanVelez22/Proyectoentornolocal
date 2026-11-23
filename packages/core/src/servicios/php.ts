import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { ErrorWolf } from '../errores';
import path from 'node:path';
import { limpiarDllApartadas } from '../php/extensiones';
import {
  codificarIni,
  copiaIni,
  decodificarIni,
  escribirIniAtomico,
  esUtf8,
  soloAscii,
  iniEditado,
  normalizarDirExt,
  rutaHuellaGenerado,
  rutaMarcaEditado,
} from '../php/ini';
import { puertosPhp } from '../nginx/principal';
import type { Plataforma } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { Config } from '../tipos';
import { verificarPuerto, type InstaladorServicios, type SupervisorServicios } from './nginx';

const EXTENSIONES = [
  'curl',
  'fileinfo',
  'gd',
  'intl',
  'mbstring',
  'openssl',
  'pdo_mysql',
  'pdo_pgsql',
  'pdo_sqlite',
  'pgsql',
  'sqlite3',
  'zip',
  'sodium',
];

const DIRECTIVAS: [string, string][] = [
  ['memory_limit', '512M'],
  ['upload_max_filesize', '64M'],
  ['post_max_size', '64M'],
  ['date.timezone', 'America/Bogota'],
  ['cgi.fix_pathinfo', '0'],
  // Desarrollo: la primera petición de un proyecto grande compila miles de clases; con 30 s
  // (y sin OPcache) Laravel daba 500 por "Maximum execution time".
  ['max_execution_time', '120'],
  ['realpath_cache_size', '4096K'],
];

/** OPcache para desarrollo: cachea, pero revisa cada archivo en cada petición (sin esperas). */
const DIRECTIVAS_OPCACHE: [string, string][] = [
  ['opcache.enable', '1'],
  ['opcache.enable_cli', '0'],
  ['opcache.validate_timestamps', '1'],
  ['opcache.revalidate_freq', '0'],
  ['opcache.memory_consumption', '256'],
  ['opcache.interned_strings_buffer', '16'],
  ['opcache.max_accelerated_files', '20000'],
];

/**
 * Activa `zend_extension=opcache` (descomenta la línea o la agrega). Solo si la rama trae
 * `php_opcache.dll`: en las que lo traen incorporado, cargarlo otra vez da un aviso.
 */
function activarOpcache(lineas: string[]): void {
  const activa = /^\s*zend_extension\s*=\s*"?(php_)?opcache(\.dll)?"?\s*$/i;
  if (lineas.some((l) => activa.test(l))) return;
  const i = lineas.findIndex((l) =>
    /^\s*;\s*zend_extension\s*=\s*"?(php_)?opcache(\.dll)?"?\s*$/i.test(l),
  );
  if (i >= 0) lineas[i] = 'zend_extension=opcache';
  else lineas.push('zend_extension=opcache');
}

const sha256 = (b: Buffer): string => createHash('sha256').update(b).digest('hex');

const escapar = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Máximo de trabajadores que se intenta detener (cubre cambios de configuración en caliente). */
const MAX_TRABAJADORES = 16;

/** Fija `clave=valor`: reemplaza la línea activa, si no la comentada, si no la agrega al final. */
function fijar(lineas: string[], clave: string, valor: string): void {
  const k = escapar(clave);
  const activa = lineas.findIndex((l) => new RegExp(`^\\s*${k}\\s*=`).test(l));
  const comentada =
    activa >= 0 ? -1 : lineas.findIndex((l) => new RegExp(`^\\s*;\\s*${k}\\s*=`).test(l));
  const i = activa >= 0 ? activa : comentada;
  const linea = `${clave}=${valor}`;
  if (i >= 0) lineas[i] = linea;
  else lineas.push(linea);
}

function activarExtension(lineas: string[], ext: string): void {
  const e = escapar(ext);
  const activa = new RegExp(`^\\s*extension\\s*=\\s*(php_)?${e}(\\.dll)?\\s*$`);
  if (lineas.some((l) => activa.test(l))) return;
  const i = lineas.findIndex((l) =>
    new RegExp(`^\\s*;\\s*extension\\s*=\\s*(php_)?${e}(\\.dll)?\\s*$`).test(l),
  );
  if (i >= 0) lineas[i] = `extension=${ext}`;
  else lineas.push(`extension=${ext}`);
}

export class ServicioPhp {
  constructor(
    private readonly rutas: Rutas,
    private readonly plataforma: Plataforma,
    private readonly supervisor: SupervisorServicios,
    private readonly instalador: InstaladorServicios,
    private readonly leerConfig: () => Promise<Config>,
  ) {}

  idTrabajador(version: string, i: number): string {
    return `php-${version}-${i}`;
  }

  /** Valor de extension_dir que corresponde al bin actual de la rama. */
  private extensionDir(version: string): string {
    return `"${this.rutas.bin('php', version).replace(/\\/g, '/')}/ext"`;
  }

  /**
   * Genera el php.ini de la rama desde php.ini-development. Si ya había uno distinto, primero lo
   * copia con fecha; guarda la huella de lo generado para detectar ediciones por fuera.
   */
  async generarIni(version: string): Promise<void> {
    const bin = this.rutas.bin('php', version);
    let base: string;
    try {
      base = await readFile(path.join(bin, 'php.ini-development'), 'utf8');
    } catch {
      throw new Error(`No se encontró php.ini-development de PHP ${version}. Reinstale PHP.`);
    }
    const lineas = base.replace(/^\uFEFF/, '').split(/\r?\n/);
    fijar(lineas, 'extension_dir', this.extensionDir(version));
    for (const ext of EXTENSIONES) activarExtension(lineas, ext);
    for (const [k, v] of DIRECTIVAS) fijar(lineas, k, v);
    if (existsSync(path.join(bin, 'ext', 'php_opcache.dll'))) activarOpcache(lineas);
    for (const [k, v] of DIRECTIVAS_OPCACHE) fijar(lineas, k, v);
    const nuevo = Buffer.from(lineas.join('\r\n'), 'utf8');
    const destino = this.rutas.phpIni(version);
    await mkdir(path.dirname(destino), { recursive: true });
    const previo = await readFile(destino).catch(() => null);
    if (previo && !previo.equals(nuevo)) await copiaIni(this.rutas, version, previo);
    // La huella nueva se anota ANTES que el ini (junto a las anteriores): un corte entre las dos
    // escrituras deja un ini que coincide con alguna y no se toma por editado a mano.
    const huella = rutaHuellaGenerado(this.rutas, version);
    const previas = await this.huellas(version);
    await writeFile(huella, [...new Set([...previas, sha256(nuevo)])].join('\n'), 'utf8');
    await escribirIniAtomico(destino, nuevo);
    await writeFile(huella, sha256(nuevo), 'utf8');
  }

  /** Huellas aceptadas del ini generado (la última y, tras un corte, la pendiente). */
  private async huellas(version: string): Promise<string[]> {
    const t = await readFile(rutaHuellaGenerado(this.rutas, version), 'utf8').catch(() => null);
    return (t ?? '')
      .split(/\r?\n/)
      .map((l) => l.trim().toLowerCase())
      .filter((l) => /^[0-9a-f]{64}$/.test(l));
  }

  /**
   * ¿El php.ini cambió desde la última vez que se generó (editado a mano por fuera)? Sin huella
   * guardada (ini de una versión anterior) no se puede saber: false.
   */
  private async editadoPorFuera(version: string): Promise<boolean> {
    const huellas = await this.huellas(version);
    if (huellas.length === 0) return false;
    const actual = await readFile(this.rutas.phpIni(version)).catch(() => null);
    return actual !== null && !huellas.includes(sha256(actual));
  }

  /** ¿Se respeta el ini tal cual (editado en la pantalla PHP o por fuera)? Marca el de fuera. */
  private async respetarIni(version: string): Promise<boolean> {
    if (!existsSync(this.rutas.phpIni(version))) return false;
    if (iniEditado(this.rutas, version)) return true;
    if (!(await this.editadoPorFuera(version))) return false;
    await writeFile(rutaMarcaEditado(this.rutas, version), '', 'utf8');
    return true;
  }

  /**
   * Ruta del php.ini de la rama; lo genera si todavía no existe o si su extension_dir no apunta al
   * bin actual (la carpeta de datos se movió o se renombró): si no, PHP no cargaría ninguna extensión.
   * Si el usuario lo editó (pantalla PHP o a mano), nunca se regenera: solo se corrige
   * `extension_dir`, con copia previa.
   */
  async asegurarPhpIni(version: string): Promise<string> {
    const ini = this.rutas.phpIni(version);
    const bytes = await readFile(ini).catch(() => null);
    const texto = bytes === null ? null : decodificarIni(bytes);
    const actual = texto === null ? null : /^\s*extension_dir\s*=(.*)$/m.exec(texto)?.[1];
    const esperado = this.extensionDir(version);
    // Un ini en cp1252 con la ruta con tildes tampoco sirve: PHP lee las rutas en UTF-8.
    const rutaSinUtf8 = bytes !== null && !esUtf8(bytes) && !soloAscii(esperado);
    if (normalizarDirExt(actual) === normalizarDirExt(esperado) && !rutaSinUtf8) return ini;
    if (bytes !== null && texto !== null && (await this.respetarIni(version))) {
      await this.corregirExtensionDir(version, bytes, texto);
    } else {
      await this.generarIni(version);
    }
    return ini;
  }

  /** Cambia solo `extension_dir` de un php.ini editado por el usuario (con copia con fecha). */
  private async corregirExtensionDir(version: string, bytes: Buffer, texto: string): Promise<void> {
    const salto = texto.includes('\r\n') ? '\r\n' : '\n';
    const lineas = texto.split(/\r?\n/);
    const dir = this.extensionDir(version);
    fijar(lineas, 'extension_dir', dir);
    await copiaIni(this.rutas, version, bytes);
    // Ruta con tildes: el archivo pasa a UTF-8 (la copia de arriba guarda los bytes originales).
    await escribirIniAtomico(
      this.rutas.phpIni(version),
      codificarIni(lineas.join(salto), bytes, { utf8: !soloAscii(dir) }),
    );
  }

  /** Antes de arrancar: un ini sin editar se regenera (toma ajustes nuevos, p. ej. OPcache). */
  private async prepararIni(version: string): Promise<void> {
    if (await this.respetarIni(version)) await this.asegurarPhpIni(version);
    else await this.generarIni(version);
  }

  async iniciar(version: string): Promise<void> {
    if (!(await this.instalador.instalado('php', version))) {
      throw new ErrorWolf(
        'servicios.no_instalado',
        `PHP ${version} no está instalado. Instálelo desde Servicios.`,
        { nombre: `PHP ${version}` },
      );
    }
    const cfg = await this.leerConfig();
    const puertos = puertosPhp(version, cfg.servicios.php.trabajadores);
    for (const [i, puerto] of puertos.entries()) {
      await verificarPuerto(
        this.plataforma,
        this.supervisor,
        this.idTrabajador(version, i),
        puerto,
      );
    }
    await this.prepararIni(version);
    const bin = this.rutas.bin('php', version);
    // DLL apartadas al actualizar una extensión: con la rama apagada ya no están cargadas.
    await limpiarDllApartadas(path.join(bin, 'ext'));
    for (const [i, puerto] of puertos.entries()) {
      await this.supervisor.iniciar({
        id: this.idTrabajador(version, i),
        nombre: `PHP ${version}`,
        comando: path.join(bin, this.plataforma.ejecutable('php-cgi')),
        args: ['-c', this.rutas.phpIni(version), '-b', `127.0.0.1:${puerto}`],
        cwd: bin,
        env: { PHP_FCGI_MAX_REQUESTS: '0' },
        puerto,
        log: this.rutas.logs(`php-${version}.log`),
        reiniciar: true,
      });
    }
  }

  async detener(version: string): Promise<void> {
    const cfg = await this.leerConfig();
    const n = Math.max(cfg.servicios.php.trabajadores, MAX_TRABAJADORES);
    for (let i = 0; i < n; i++) await this.supervisor.detener(this.idTrabajador(version, i));
  }
}

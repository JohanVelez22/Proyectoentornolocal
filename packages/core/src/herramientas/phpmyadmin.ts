import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { catalogo } from '../catalogo/catalogo';
import type { Instalador } from '../catalogo/instalador';
import { puertosPhp } from '../nginx/principal';
import type { Rutas } from '../rutas';
import { compararVersiones } from '../servicios/nginx';
import { escribirAtomico } from '../sitios/urlbase';
import type { Config } from '../tipos';
import { cadenaPhp, phpSignon } from './php/wolfcore-signon.php';

export const MOTIVO_SIN_PHP_PMA = 'Encienda PHP para usar phpMyAdmin';
export const MOTIVO_SIN_PHPMYADMIN = 'Instale phpMyAdmin para usarlo';

/** Extensiones de PHP sin las que phpMyAdmin no arranca. */
export const EXTENSIONES_PMA = ['mysqli', 'mbstring'] as const;

/** Cuánto dura una sesión de entrada de phpMyAdmin (igual que la limpieza de `AccesoBd`). */
export const VIGENCIA_SESION_S = 8 * 60 * 60;

/** Servidor MySQL o MariaDB de WolfCore Dev al que puede entrar phpMyAdmin. */
export interface ServidorPma {
  puerto: number;
  /** Nombre que ve el usuario (`MySQL 8.4`). */
  nombre: string;
}

const SECRETO_BLOWFISH = /\$cfg\['blowfish_secret'\] = '([0-9a-f]{32})';/;

/** Carpetas de phpMyAdmin que nunca se sirven y se quitan de la instalación. */
const CARPETAS_FUERA = ['setup'];

/** Parámetros de la cookie de la sesión de entrada (los mismos que usa `wolfcore-signon.php`). */
const COOKIE_ENTRADA =
  "array('lifetime' => 0, 'path' => '/', 'domain' => '', 'secure' => false, 'httponly' => true, 'samesite' => 'Strict')";

/**
 * `config.inc.php` de WolfCore Dev: un servidor por cada instancia de MySQL o MariaDB (host
 * 127.0.0.1 y su puerto), todos con `auth_type = 'signon'` (la entrada la hace el token de
 * `wolfcore-signon.php`), sin servidores arbitrarios, sin aviso de versiones ni informe de errores
 * y sin avisos de PHP en pantalla. Sin instancias, un único servidor marcador con un puerto que no
 * existe: phpMyAdmin nunca cae al servidor por defecto (`localhost:3306` con formulario).
 * `blowfish_secret` es aleatorio de 32 caracteres hexadecimales.
 */
export function generarConfigPma(o: {
  blowfish: string;
  servidores: readonly ServidorPma[];
  tmp: string;
  sesiones: string;
}): string {
  const lineas = [
    '<?php',
    '// Generado por WolfCore Dev. No lo edite: se rehace al abrir phpMyAdmin desde la aplicación.',
    // phpMyAdmin 5.2 con PHP 8.4 o más nuevo avisa de funciones obsoletas: nunca a la pantalla.
    'error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);',
    "ini_set('display_errors', '0');",
    `$cfg['blowfish_secret'] = '${o.blowfish}';`,
    `$cfg['TempDir'] = ${cadenaPhp(o.tmp)};`,
    `$cfg['SessionSavePath'] = ${cadenaPhp(o.sesiones)};`,
    `$cfg['LoginCookieValidity'] = ${VIGENCIA_SESION_S};`,
    "$cfg['AllowArbitraryServer'] = false;",
    "$cfg['ZeroConf'] = false;",
    "$cfg['VersionCheck'] = false;",
    "$cfg['SendErrorReports'] = 'never';",
    "$cfg['ShowPhpInfo'] = false;",
    "$cfg['CheckConfigurationPermissions'] = false;",
    "$cfg['DefaultLang'] = 'es';",
    '$i = 0;',
  ];
  const servidores =
    o.servidores.length > 0
      ? o.servidores
      : [{ puerto: 1, nombre: 'WolfCore Dev (sin servidores)' }];
  for (const s of servidores) {
    lineas.push(
      '$i++;',
      `$cfg['Servers'][$i]['verbose'] = ${cadenaPhp(s.nombre)};`,
      `$cfg['Servers'][$i]['host'] = '127.0.0.1';`,
      `$cfg['Servers'][$i]['port'] = ${Math.trunc(s.puerto)};`,
      `$cfg['Servers'][$i]['auth_type'] = 'signon';`,
      `$cfg['Servers'][$i]['SignonSession'] = 'WolfCoreSignon';`,
      `$cfg['Servers'][$i]['SignonCookieParams'] = ${COOKIE_ENTRADA};`,
      `$cfg['Servers'][$i]['SignonURL'] = 'wolfcore-signon.php';`,
      `$cfg['Servers'][$i]['LogoutURL'] = 'wolfcore-signon.php';`,
      `$cfg['Servers'][$i]['compress'] = false;`,
    );
  }
  return `${lineas.join('\n')}\n`;
}

export interface DepsPhpMyAdmin {
  rutas: Rutas;
  instalador: Pick<Instalador, 'instalar' | 'instalados'>;
  leerConfig: () => Promise<Config>;
  /** ¿Algún trabajador de esa rama de PHP está encendido? */
  phpEncendido: (rama: string) => boolean | Promise<boolean>;
  /** Instancias de MySQL y MariaDB de WolfCore Dev (con su puerto). */
  servidores: () => Promise<ServidorPma[]>;
  /** Deja una carpeta legible solo por el usuario (`Plataforma.restringirAlUsuario`). */
  restringir?: (ruta: string) => Promise<boolean>;
}

export type DisponibilidadPhpMyAdmin =
  | {
      disponible: true;
      rama: string;
      /** La rama de PHP elegida está fuera de lo que phpMyAdmin declara que soporta. */
      aviso?: 'php_fuera_de_rango';
    }
  | {
      disponible: false;
      motivo: string;
      causa: 'sin_instalar' | 'sin_php' | 'sin_extension';
      /** Extensiones de PHP que faltan (con `sin_extension`). */
      falta?: string[];
      rama?: string;
    };

/** ¿Está activa (sin `;`) la línea `extension=<ext>` de un php.ini? */
export function extensionActiva(ini: string, ext: string): boolean {
  return new RegExp(`^\\s*extension\\s*=\\s*"?(php_)?${ext}(\\.dll)?"?\\s*(;.*)?$`, 'im').test(ini);
}

/**
 * phpMyAdmin se instala del catálogo (zip oficial con su SHA-256 y su firma PGP) en
 * `bin/phpmyadmin/<v>/` y se sirve desde ahí en `127.0.0.1:8091`. A la carpeta instalada se le
 * agregan solo dos archivos generados: `config.inc.php` y `wolfcore-signon.php`; `setup/` se borra.
 */
export class PhpMyAdmin {
  constructor(private readonly d: DepsPhpMyAdmin) {}

  /** Versión instalada más reciente; null si no hay. */
  async version(): Promise<string | null> {
    const v = [...(await this.d.instalador.instalados('phpmyadmin'))]
      .sort(compararVersiones)
      .at(-1);
    return v ?? null;
  }

  /** Carpeta que sirve nginx (la de la versión instalada más reciente). */
  async raiz(): Promise<string | null> {
    const v = await this.version();
    const raiz = v ? this.d.rutas.bin('phpmyadmin', v) : null;
    return raiz && existsSync(path.join(raiz, 'index.php')) ? raiz : null;
  }

  async instalado(): Promise<boolean> {
    return (await this.raiz()) !== null;
  }

  async instalar(): Promise<void> {
    const v = catalogo.phpmyadmin[0];
    if (!v) throw new Error('phpMyAdmin no está en el catálogo');
    // La huella SHA-256 y la firma PGP las exige el instalador antes de dejar nada en bin/.
    await this.d.instalador.instalar({ servicio: 'phpmyadmin', ...v });
    await this.preparar();
  }

  /**
   * Deja la carpeta lista y al día (idempotente): `config.inc.php` con las instancias de ahora y
   * el mismo `blowfish_secret` de antes, `wolfcore-signon.php`, y sin `setup/`. Los dos archivos
   * se escriben de forma atómica y la carpeta de sesiones queda solo para el usuario.
   */
  async preparar(): Promise<void> {
    const raiz = await this.raiz();
    if (!raiz) return;
    for (const c of CARPETAS_FUERA) {
      await rm(path.join(raiz, c), { recursive: true, force: true }).catch(() => undefined);
    }
    const sesiones = this.d.rutas.sesionesPma();
    const tmp = path.dirname(sesiones);
    await mkdir(sesiones, { recursive: true });
    await this.d.restringir?.(sesiones).catch(() => false);
    const destino = path.join(raiz, 'config.inc.php');
    const previo = await readFile(destino, 'utf8').catch(() => '');
    const blowfish = SECRETO_BLOWFISH.exec(previo)?.[1] ?? randomBytes(16).toString('hex');
    const config = generarConfigPma({
      blowfish,
      servidores: await this.d.servidores(),
      tmp,
      sesiones,
    });
    if (config !== previo) await escribirAtomico(destino, Buffer.from(config, 'utf8'));
    const signon = phpSignon({ dirAcceso: this.d.rutas.accesoBd(), sesiones });
    const destinoSignon = path.join(raiz, 'wolfcore-signon.php');
    const previoSignon = await readFile(destinoSignon, 'utf8').catch(() => '');
    if (signon !== previoSignon) await escribirAtomico(destinoSignon, Buffer.from(signon, 'utf8'));
  }

  private async encendidas(): Promise<string[]> {
    const r: string[] = [];
    for (const rama of await this.ramas()) if (await this.d.phpEncendido(rama)) r.push(rama);
    return r;
  }

  private async ramas(): Promise<string[]> {
    return [...(await this.d.instalador.instalados('php'))].sort(compararVersiones).reverse();
  }

  /** ¿La rama entra en el rango de PHP que declara phpMyAdmin (`>=7.2 <8.4`)? */
  private enRango(rama: string): boolean {
    const r = catalogo.phpmyadmin[0]?.php;
    return (
      !r || (compararVersiones(rama, r.min) >= 0 && compararVersiones(rama, r.maxExclusivo) < 0)
    );
  }

  /** La rama más nueva dentro del rango; si ninguna lo está, la más nueva (con `fuera`). */
  private elegir(ramas: string[]): { rama: string; fuera: boolean } | null {
    const dentro = ramas.find((r) => this.enRango(r));
    if (dentro) return { rama: dentro, fuera: false };
    return ramas[0] ? { rama: ramas[0], fuera: true } : null;
  }

  /** Extensiones obligatorias que el php.ini de la rama no activa. */
  private async extensionesQueFaltan(rama: string): Promise<string[]> {
    const ini = await readFile(this.d.rutas.phpIni(rama), 'latin1').catch(() => null);
    // Sin php.ini todavía (PHP lo genera al arrancar): no se puede afirmar nada.
    if (ini === null) return [];
    return EXTENSIONES_PMA.filter((e) => !extensionActiva(ini, e));
  }

  async disponibilidad(): Promise<DisponibilidadPhpMyAdmin> {
    if (!(await this.instalado())) {
      return { disponible: false, motivo: MOTIVO_SIN_PHPMYADMIN, causa: 'sin_instalar' };
    }
    const elegida = this.elegir(await this.encendidas());
    if (!elegida) return { disponible: false, motivo: MOTIVO_SIN_PHP_PMA, causa: 'sin_php' };
    const falta = await this.extensionesQueFaltan(elegida.rama);
    if (falta.length > 0) {
      return {
        disponible: false,
        motivo: `PHP ${elegida.rama} no tiene activa la extensión ${falta.join(' y ')}: reinicie PHP o actívela en su php.ini`,
        causa: 'sin_extension',
        falta,
        rama: elegida.rama,
      };
    }
    return {
      disponible: true,
      rama: elegida.rama,
      ...(elegida.fuera ? { aviso: 'php_fuera_de_rango' as const } : {}),
    };
  }

  /**
   * Datos para el vhost interno de nginx; null si phpMyAdmin no está instalado, no hay PHP o no
   * hay ninguna instancia de MySQL o MariaDB a la que entrar. Usa el PHP más reciente encendido
   * que phpMyAdmin soporta y, si ninguno lo está, el más reciente instalado dentro del rango (el
   * vhost existe y responde 502 hasta que se encienda PHP).
   */
  async configNginx(): Promise<{ raiz: string; puertos: number[] } | null> {
    const raiz = await this.raiz();
    if (!raiz) return null;
    if ((await this.d.servidores()).length === 0) return null;
    const elegida = this.elegir(await this.encendidas()) ?? this.elegir(await this.ramas());
    if (!elegida) return null;
    const cfg = await this.d.leerConfig();
    return { raiz, puertos: puertosPhp(elegida.rama, cfg.servicios.php.trabajadores) };
  }
}

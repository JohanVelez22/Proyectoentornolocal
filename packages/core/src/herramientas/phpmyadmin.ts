import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { catalogo } from '../catalogo/catalogo';
import type { Instalador } from '../catalogo/instalador';
import { puertosPhp } from '../nginx/principal';
import type { Rutas } from '../rutas';
import { compararVersiones } from '../servicios/nginx';
import type { Config } from '../tipos';
import { cadenaPhp, phpSignon } from './php/wolfcore-signon.php';

export const MOTIVO_SIN_PHP_PMA = 'Encienda PHP para usar phpMyAdmin';
export const MOTIVO_SIN_PHPMYADMIN = 'Instale phpMyAdmin para usarlo';

/** Servidor MySQL o MariaDB de WolfCore Dev al que puede entrar phpMyAdmin. */
export interface ServidorPma {
  puerto: number;
  /** Nombre que ve el usuario (`MySQL 8.4`). */
  nombre: string;
}

const SECRETO_BLOWFISH = /\$cfg\['blowfish_secret'\] = '([0-9a-f]{32})';/;

/** Carpetas de phpMyAdmin que nunca se sirven y se quitan de la instalación. */
const CARPETAS_FUERA = ['setup'];

/**
 * `config.inc.php` de WolfCore Dev: un servidor por cada instancia de MySQL o MariaDB (host
 * 127.0.0.1 y su puerto), todos con `auth_type = 'signon'` (la entrada la hace el token de
 * `wolfcore-signon.php`), sin servidores arbitrarios, sin aviso de versiones nuevas ni informe de
 * errores. `blowfish_secret` es aleatorio de 32 caracteres hexadecimales.
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
    `$cfg['blowfish_secret'] = '${o.blowfish}';`,
    `$cfg['TempDir'] = ${cadenaPhp(o.tmp)};`,
    `$cfg['SessionSavePath'] = ${cadenaPhp(o.sesiones)};`,
    "$cfg['VersionCheck'] = false;",
    "$cfg['SendErrorReports'] = 'never';",
    "$cfg['ShowPhpInfo'] = false;",
    "$cfg['CheckConfigurationPermissions'] = false;",
    "$cfg['DefaultLang'] = 'es';",
    '$i = 0;',
  ];
  for (const s of o.servidores) {
    lineas.push(
      '$i++;',
      `$cfg['Servers'][$i]['verbose'] = ${cadenaPhp(s.nombre)};`,
      `$cfg['Servers'][$i]['host'] = '127.0.0.1';`,
      `$cfg['Servers'][$i]['port'] = ${Math.trunc(s.puerto)};`,
      `$cfg['Servers'][$i]['auth_type'] = 'signon';`,
      `$cfg['Servers'][$i]['SignonSession'] = 'WolfCoreSignon';`,
      `$cfg['Servers'][$i]['SignonURL'] = 'wolfcore-signon.php';`,
      `$cfg['Servers'][$i]['AllowArbitraryServer'] = false;`,
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
}

export type DisponibilidadPhpMyAdmin =
  { disponible: true; rama: string } | { disponible: false; motivo: string };

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
   * el mismo `blowfish_secret` de antes, `wolfcore-signon.php`, y sin `setup/`.
   */
  async preparar(): Promise<void> {
    const raiz = await this.raiz();
    if (!raiz) return;
    for (const c of CARPETAS_FUERA) {
      await rm(path.join(raiz, c), { recursive: true, force: true }).catch(() => undefined);
    }
    const destino = path.join(raiz, 'config.inc.php');
    const previo = await readFile(destino, 'utf8').catch(() => '');
    const blowfish = SECRETO_BLOWFISH.exec(previo)?.[1] ?? randomBytes(16).toString('hex');
    const tmp = path.join(this.d.rutas.tmp(), 'phpmyadmin');
    const sesiones = path.join(tmp, 'sesiones');
    await mkdir(sesiones, { recursive: true });
    const config = generarConfigPma({
      blowfish,
      servidores: await this.d.servidores(),
      tmp,
      sesiones,
    });
    if (config !== previo) await writeFile(destino, config, 'utf8');
    const signon = phpSignon({ dirAcceso: this.d.rutas.accesoBd(), sesiones });
    const destinoSignon = path.join(raiz, 'wolfcore-signon.php');
    const previoSignon = await readFile(destinoSignon, 'utf8').catch(() => '');
    if (signon !== previoSignon) await writeFile(destinoSignon, signon, 'utf8');
  }

  private async masNuevaEncendida(ramas: string[]): Promise<string | undefined> {
    for (const r of ramas) if (await this.d.phpEncendido(r)) return r;
    return undefined;
  }

  private async ramas(): Promise<string[]> {
    return [...(await this.d.instalador.instalados('php'))].sort(compararVersiones).reverse();
  }

  async disponibilidad(): Promise<DisponibilidadPhpMyAdmin> {
    if (!(await this.instalado())) return { disponible: false, motivo: MOTIVO_SIN_PHPMYADMIN };
    const rama = await this.masNuevaEncendida(await this.ramas());
    return rama ? { disponible: true, rama } : { disponible: false, motivo: MOTIVO_SIN_PHP_PMA };
  }

  /**
   * Datos para el vhost interno de nginx; null si phpMyAdmin no está instalado o no hay PHP. Usa
   * el PHP más reciente encendido y, si ninguno lo está, el más reciente instalado (el vhost
   * existe y responde 502 hasta que se encienda PHP).
   */
  async configNginx(): Promise<{ raiz: string; puertos: number[] } | null> {
    const raiz = await this.raiz();
    if (!raiz) return null;
    const ramas = await this.ramas();
    const rama = (await this.masNuevaEncendida(ramas)) ?? ramas[0];
    if (!rama) return null;
    const cfg = await this.d.leerConfig();
    return { raiz, puertos: puertosPhp(rama, cfg.servicios.php.trabajadores) };
  }
}

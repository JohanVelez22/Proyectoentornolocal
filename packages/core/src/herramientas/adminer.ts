import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { catalogo } from '../catalogo/catalogo';
import type { BaseProyecto } from '../bd/baseProyecto';
import type { Instalador } from '../catalogo/instalador';
import { PUERTO_ADMINER, puertosPhp } from '../nginx/principal';
import type { Rutas } from '../rutas';
import { compararVersiones } from '../servicios/nginx';
import { escribirAtomico } from '../sitios/urlbase';
import type { Config } from '../tipos';
import { phpAdminerLogin } from './php/adminer-login.php';

export const MOTIVO_SIN_PHP = 'Encienda PHP para usar Adminer';
export const MOTIVO_SIN_ADMINER = 'Instale Adminer para usarlo';

/**
 * URL de Adminer para un motor, sin clave (se la pide el propio Adminer).
 * MongoDB, Redis y el resto no los soporta Adminer: devuelve null.
 */
export function urlAdminer(motor: string, usuario: string, puerto: number): string | null {
  const u = encodeURIComponent(usuario);
  const base = `http://127.0.0.1:${PUERTO_ADMINER}/`;
  if (motor === 'mysql' || motor === 'mariadb') {
    return `${base}?server=127.0.0.1:${puerto}&username=${u}`;
  }
  if (motor === 'postgresql') return `${base}?pgsql=127.0.0.1:${puerto}&username=${u}`;
  return null;
}

/**
 * URL de Adminer con la base del proyecto elegida (servidor, usuario y base). Sin clave: Adminer
 * la pide al entrar, así nunca viaja en la URL, el historial ni los registros.
 */
export function urlAdminerProyecto(b: BaseProyecto, puerto: number): string {
  return `${urlAdminer(b.motor, b.usuario, puerto)!}&db=${encodeURIComponent(b.base)}`;
}

export interface DepsAdminer {
  rutas: Rutas;
  instalador: Pick<Instalador, 'instalar' | 'instalados'>;
  leerConfig: () => Promise<Config>;
  /** ¿Algún trabajador de esa rama de PHP está encendido? */
  phpEncendido: (rama: string) => boolean | Promise<boolean>;
  /** Puertos de las instancias de bases de datos de WolfCore Dev: los únicos a los que Adminer se conecta. */
  puertosPermitidos?: () => Promise<number[]>;
}

export type DisponibilidadAdminer =
  { disponible: true; rama: string } | { disponible: false; motivo: string };

/** Marca del index.php propio de WolfCore Dev (el de Adminer oficial no la tiene). */
const MARCA_ENTRADA = 'WolfCore Dev: entrada de Adminer';

/**
 * Adminer se instala en bin/adminer/<v>/adminer.php y se copia a tools/adminer/adminer.php, intacto
 * (con la misma suma). El index.php que sirve el vhost interno de nginx (solo 127.0.0.1:8090) es
 * un envoltorio generado que, con un token de un solo uso, entra ya autenticado (D18) y luego
 * carga adminer.php.
 */
export class Adminer {
  constructor(private readonly d: DepsAdminer) {}

  private raiz(): string {
    return this.d.rutas.herramientas('adminer');
  }

  instalado(): boolean {
    return existsSync(path.join(this.raiz(), 'index.php'));
  }

  async instalar(): Promise<void> {
    const v = catalogo.adminer[0];
    if (!v) throw new Error('Adminer no está en el catálogo');
    await this.d.instalador.instalar({ servicio: 'adminer', ...v });
    const version = [...(await this.d.instalador.instalados('adminer'))]
      .sort(compararVersiones)
      .at(-1);
    if (!version) throw new Error('No se pudo instalar Adminer.');
    await mkdir(this.raiz(), { recursive: true });
    await copyFile(
      path.join(this.d.rutas.bin('adminer', version), 'adminer.php'),
      path.join(this.raiz(), 'adminer.php'),
    );
    await this.preparar();
  }

  /**
   * Deja el envoltorio de entrada al día (idempotente). Una instalación anterior tiene el
   * Adminer oficial como index.php: pasa a adminer.php sin tocar su contenido.
   */
  async preparar(): Promise<void> {
    const entrada = path.join(this.raiz(), 'index.php');
    const nucleo = path.join(this.raiz(), 'adminer.php');
    const actual = await readFile(entrada, 'utf8').catch(() => null);
    if (actual === null && !existsSync(nucleo)) return;
    if (actual !== null && !actual.includes(MARCA_ENTRADA) && !existsSync(nucleo)) {
      await rename(entrada, nucleo);
    }
    const puertos = (await this.d.puertosPermitidos?.()) ?? [];
    const nuevo = phpAdminerLogin({ dirAcceso: this.d.rutas.accesoBd(), puertos });
    if (nuevo !== actual) await escribirAtomico(entrada, Buffer.from(nuevo, 'utf8'));
  }

  private async masNuevaEncendida(ramas: string[]): Promise<string | undefined> {
    for (const r of ramas) if (await this.d.phpEncendido(r)) return r;
    return undefined;
  }

  private async ramas(): Promise<string[]> {
    return [...(await this.d.instalador.instalados('php'))].sort(compararVersiones).reverse();
  }

  async disponibilidad(): Promise<DisponibilidadAdminer> {
    if (!this.instalado()) return { disponible: false, motivo: MOTIVO_SIN_ADMINER };
    // Los puertos permitidos del envoltorio siguen a las instancias (alta, baja o cambio de puerto).
    await this.preparar().catch(() => undefined);
    const rama = await this.masNuevaEncendida(await this.ramas());
    return rama ? { disponible: true, rama } : { disponible: false, motivo: MOTIVO_SIN_PHP };
  }

  /** Rama de PHP con la que correría Adminer ahora (null si no está instalado o no hay PHP). */
  async ramaDeUso(): Promise<string | null> {
    if (!this.instalado()) return null;
    const ramas = await this.ramas();
    return (await this.masNuevaEncendida(ramas)) ?? ramas[0] ?? null;
  }

  /**
   * Datos para el vhost interno de nginx; null si Adminer no está instalado o no hay PHP.
   * Usa el PHP más reciente encendido y, si ninguno lo está, el más reciente instalado (así el
   * vhost existe y responde 502 hasta que se encienda PHP).
   */
  async configNginx(): Promise<{ raiz: string; puertos: number[] } | null> {
    if (!this.instalado()) return null;
    const ramas = await this.ramas();
    const rama = (await this.masNuevaEncendida(ramas)) ?? ramas[0];
    if (!rama) return null;
    const cfg = await this.d.leerConfig();
    return { raiz: this.raiz(), puertos: puertosPhp(rama, cfg.servicios.php.trabajadores) };
  }

  /** URL de la base del proyecto con el puerto configurado de su motor. */
  async urlProyecto(b: BaseProyecto): Promise<string> {
    const cfg = await this.d.leerConfig();
    const datos = (cfg.servicios.datos as Record<string, { puerto: number } | undefined>)[b.motor];
    return urlAdminerProyecto(b, datos?.puerto ?? (b.motor === 'postgresql' ? 5432 : 3306));
  }

  /** URL lista para abrir según el puerto configurado del motor; null si Adminer no lo soporta. */
  async urlPara(motor: string, usuario: string): Promise<string | null> {
    const cfg = await this.d.leerConfig();
    const datos = (cfg.servicios.datos as Record<string, { puerto: number } | undefined>)[motor];
    return datos ? urlAdminer(motor, usuario, datos.puerto) : null;
  }
}

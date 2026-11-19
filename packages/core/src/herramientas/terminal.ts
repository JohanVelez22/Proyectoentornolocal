import { existsSync } from 'node:fs';
import { ErrorWolf } from '../errores';
import path from 'node:path';
import { nombreEjecutable } from '../plataforma/sistema';
import {
  abrirTerminalWindows,
  lanzarSeparado,
  type LanzadorSeparado,
} from '../plataforma/terminalWin';
import type { CapacidadesPlataforma } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { ResolutorRuntimes, SitioConRuntimes } from '../runtimes/runtimes';
import type { Sitio } from '../tipos';

export { lanzarSeparado, type LanzadorSeparado } from '../plataforma/terminalWin';

export interface DepsTerminal {
  rutas: Rutas;
  entorno?: NodeJS.ProcessEnv;
  existe?: (ruta: string) => boolean;
  lanzar?: LanzadorSeparado;
  /**
   * Quien abre la terminal (`Plataforma.abrirTerminal`). Sin ella, la de Windows con `entorno`,
   * `existe` y `lanzar` (compatibilidad con las pruebas anteriores).
   */
  plataforma?: Pick<CapacidadesPlataforma, 'abrirTerminal'>;
  /** php.ini de la rama (lo genera si falta). */
  asegurarPhpIni?: (rama: string) => Promise<string>;
  /** Rama de PHP por defecto cuando el sitio no tiene una instalada. */
  phpPorDefecto?: () => Promise<string | null>;
  /** Node y Python del proyecto: sus carpetas van tras PHP y antes de tools/bin. */
  runtimes?: ResolutorRuntimes;
}

const RAMA = /^\d+\.\d+$/;

export class Terminal {
  private readonly entorno: NodeJS.ProcessEnv;
  private readonly existe: (ruta: string) => boolean;
  private readonly plataforma: Pick<CapacidadesPlataforma, 'abrirTerminal'>;

  constructor(private readonly d: DepsTerminal) {
    this.entorno = d.entorno ?? process.env;
    this.existe = d.existe ?? existsSync;
    const lanzar = d.lanzar ?? lanzarSeparado;
    this.plataforma = d.plataforma ?? {
      abrirTerminal: (cwd, o = {}) =>
        abrirTerminalWindows(cwd, o, { entorno: this.entorno, existe: this.existe, lanzar }),
    };
  }

  /**
   * Entorno con PATH = [bin/php/<rama>] + [node, node_modules/.bin, python, Scripts] + tools/bin
   * + PATH actual (se respeta el nombre `Path`).
   */
  private async entornoConPath(
    php: string | null,
    sitio?: SitioConRuntimes,
  ): Promise<NodeJS.ProcessEnv> {
    const env: NodeJS.ProcessEnv = { ...this.entorno };
    const clave = Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'Path';
    const nuevo: string[] = [];
    let rama: string | null =
      php && RAMA.test(php) && this.existe(this.d.rutas.bin('php', php)) ? php : null;
    if (rama) nuevo.push(this.d.rutas.bin('php', rama));
    else rama = (await this.d.phpPorDefecto?.()) ?? null;
    if (rama && RAMA.test(rama) && this.d.asegurarPhpIni) {
      const ini = await this.d.asegurarPhpIni(rama);
      env.WOLFCORE_PHP = path.join(this.d.rutas.bin('php', rama), nombreEjecutable('php'));
      env.WOLFCORE_PHPINI = ini;
      env.PHPRC = path.dirname(ini);
    }
    if (sitio && this.d.runtimes) {
      nuevo.push(...this.d.runtimes.carpetasPath(await this.d.runtimes.paraProyecto(sitio)));
    }
    nuevo.push(this.d.rutas.herramientas('bin'));
    if (env[clave]) nuevo.push(env[clave]!);
    env[clave] = nuevo.join(';');
    return env;
  }

  /** Abre una terminal en la carpeta del sitio con su PHP, Composer y herramientas en el PATH. */
  async abrir(sitio: Pick<Sitio, 'carpeta' | 'php'> & SitioConRuntimes): Promise<void> {
    if (!this.existe(sitio.carpeta)) {
      throw new ErrorWolf(
        'herramientas.carpeta_sitio_inexistente',
        `La carpeta del sitio no existe: ${sitio.carpeta}`,
      );
    }
    const env = await this.entornoConPath(sitio.php, sitio);
    await this.plataforma.abrirTerminal(sitio.carpeta, { env });
  }
}

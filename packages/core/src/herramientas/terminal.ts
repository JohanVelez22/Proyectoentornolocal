import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { literalPowerShell } from '../plataforma/lanzarOculto';
import type { Rutas } from '../rutas';
import type { Sitio } from '../tipos';

/** Lanza un proceso separado de nosotros y con ventana propia (sin shell). */
export type LanzadorSeparado = (
  cmd: string,
  args: string[],
  opts: { cwd: string; env: NodeJS.ProcessEnv },
) => Promise<void>;

export const lanzarSeparado: LanzadorSeparado = (cmd, args, opts) =>
  new Promise((resolve, reject) => {
    const hijo = spawn(cmd, args, {
      cwd: opts.cwd,
      env: opts.env,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    hijo.once('error', reject);
    hijo.once('spawn', () => {
      hijo.unref();
      resolve();
    });
  });

export interface DepsTerminal {
  rutas: Rutas;
  entorno?: NodeJS.ProcessEnv;
  existe?: (ruta: string) => boolean;
  lanzar?: LanzadorSeparado;
  /** php.ini de la rama (lo genera si falta). */
  asegurarPhpIni?: (rama: string) => Promise<string>;
  /** Rama de PHP por defecto cuando el sitio no tiene una instalada. */
  phpPorDefecto?: () => Promise<string | null>;
}

const RAMA = /^\d+\.\d+$/;

export class Terminal {
  private readonly entorno: NodeJS.ProcessEnv;
  private readonly existe: (ruta: string) => boolean;
  private readonly lanzar: LanzadorSeparado;

  constructor(private readonly d: DepsTerminal) {
    this.entorno = d.entorno ?? process.env;
    this.existe = d.existe ?? existsSync;
    this.lanzar = d.lanzar ?? lanzarSeparado;
  }

  /** Entorno con PATH = [bin/php/<rama>] + tools/bin + PATH actual (se respeta el nombre `Path`). */
  private async entornoConPath(php: string | null): Promise<NodeJS.ProcessEnv> {
    const env: NodeJS.ProcessEnv = { ...this.entorno };
    const clave = Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'Path';
    const nuevo: string[] = [];
    let rama: string | null =
      php && RAMA.test(php) && this.existe(this.d.rutas.bin('php', php)) ? php : null;
    if (rama) nuevo.push(this.d.rutas.bin('php', rama));
    else rama = (await this.d.phpPorDefecto?.()) ?? null;
    if (rama && RAMA.test(rama) && this.d.asegurarPhpIni) {
      const ini = await this.d.asegurarPhpIni(rama);
      env.WOLFCORE_PHP = path.join(this.d.rutas.bin('php', rama), 'php.exe');
      env.WOLFCORE_PHPINI = ini;
      env.PHPRC = path.dirname(ini);
    }
    nuevo.push(this.d.rutas.herramientas('bin'));
    if (env[clave]) nuevo.push(env[clave]!);
    env[clave] = nuevo.join(';');
    return env;
  }

  /** Abre una terminal en la carpeta del sitio con su PHP, Composer y herramientas en el PATH. */
  async abrir(sitio: Pick<Sitio, 'carpeta' | 'php'>): Promise<void> {
    if (!this.existe(sitio.carpeta)) {
      throw new Error(`La carpeta del sitio no existe: ${sitio.carpeta}`);
    }
    const env = await this.entornoConPath(sitio.php);
    const local = this.entorno.LOCALAPPDATA;
    const wt = local ? path.win32.join(local, 'Microsoft', 'WindowsApps', 'wt.exe') : null;
    if (wt && this.existe(wt)) {
      // wt parte su línea de órdenes en cada `;` (aun entre comillas): la carpeta no viaja como
      // argumento; "-d ." es el directorio de trabajo, que ya es la del sitio. Ventana nueva para
      // que la pestaña reciba este entorno (PATH con PHP y tools/bin).
      await this.lanzar(wt, ['-w', 'new', '-d', '.'], { cwd: sitio.carpeta, env });
      return;
    }
    // Comillas simples de PowerShell, también las tipográficas (’ cierra una cadena '…').
    await this.lanzar(
      'powershell.exe',
      ['-NoExit', '-Command', `Set-Location -LiteralPath ${literalPowerShell(sitio.carpeta)}`],
      { cwd: sitio.carpeta, env },
    );
  }
}

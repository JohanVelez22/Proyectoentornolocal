import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { catalogo } from '../catalogo/catalogo';
import type { Instalador } from '../catalogo/instalador';
import type { Ejecutor, Plataforma } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { compararVersiones } from '../servicios/nginx';
import type { Config } from '../tipos';

export interface DepsComposer {
  rutas: Rutas;
  plataforma: Pick<Plataforma, 'ejecutable'>;
  instalador: Pick<Instalador, 'instalar' | 'instalados'>;
  exec: Ejecutor;
  leerConfig: () => Promise<Config>;
}

/** Rama de PHP: "8.4". Evita que una versión escape de bin/php. */
const RAMA = /^\d+\.\d+$/;
/** En un .cmd, `%` se duplica para que no se expanda. */
const paraCmd = (ruta: string): string => ruta.replace(/%/g, '%%');

export class Composer {
  constructor(private readonly d: DepsComposer) {}

  /** Descarga composer.phar (SHA-256 verificado) y regenera los shims si ya hay PHP. */
  async instalar(): Promise<void> {
    const v = catalogo.composer[0];
    if (!v) throw new Error('Composer no está en el catálogo');
    await this.d.instalador.instalar({ servicio: 'composer', ...v });
    const php = await this.phpPorDefecto();
    if (php) await this.crearShims(php);
  }

  /** La rama configurada si está instalada; si no, la más reciente; null si no hay PHP. */
  async phpPorDefecto(): Promise<string | null> {
    const cfg = await this.d.leerConfig();
    const instaladas = await this.d.instalador.instalados('php');
    const elegida = cfg.herramientas.phpPorDefecto;
    if (elegida && instaladas.includes(elegida)) return elegida;
    return [...instaladas].sort(compararVersiones).at(-1) ?? null;
  }

  private async rutaPhar(): Promise<string | null> {
    const v = [...(await this.d.instalador.instalados('composer'))].sort(compararVersiones).at(-1);
    return v ? path.join(this.d.rutas.bin('composer', v), 'composer.phar') : null;
  }

  private phpExe(rama: string): string {
    if (!RAMA.test(rama)) throw new Error(`Versión de PHP no válida: ${rama}`);
    return path.join(this.d.rutas.bin('php', rama), this.d.plataforma.ejecutable('php'));
  }

  async version(): Promise<string | null> {
    const php = await this.phpPorDefecto();
    const phar = await this.rutaPhar();
    if (!php || !phar) return null;
    const r = await this.d.exec(this.phpExe(php), [phar, '--version'], { timeoutMs: 30_000 });
    if (r.codigo !== 0) return null;
    return /Composer version (\S+)/.exec(r.stdout)?.[1] ?? null;
  }

  async actualizar(): Promise<string> {
    const php = await this.phpPorDefecto();
    const phar = await this.rutaPhar();
    if (!php || !phar) throw new Error('Instale PHP y Composer antes de actualizar.');
    const r = await this.d.exec(this.phpExe(php), [phar, 'self-update'], { timeoutMs: 120_000 });
    if (r.codigo !== 0) {
      throw new Error(`No se pudo actualizar Composer. ${(r.stderr || r.stdout).trim()}`.trim());
    }
    return r.stdout.trim();
  }

  /** Escribe tools/bin/php.cmd y, si Composer está instalado, tools/bin/composer.cmd. */
  async crearShims(phpPorDefecto: string): Promise<void> {
    const php = paraCmd(this.phpExe(phpPorDefecto));
    const dir = this.d.rutas.herramientas('bin');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'php.cmd'), `@"${php}" %*\r\n`, 'utf8');
    const phar = await this.rutaPhar();
    if (phar) {
      await writeFile(
        path.join(dir, 'composer.cmd'),
        `@"${php}" "${paraCmd(phar)}" %*\r\n`,
        'utf8',
      );
    }
  }

  /** Regenera los shims con el PHP por defecto actual (tras cambiarlo o instalar PHP/Composer). */
  async sincronizarShims(): Promise<void> {
    const php = await this.phpPorDefecto();
    if (php) await this.crearShims(php);
  }
}

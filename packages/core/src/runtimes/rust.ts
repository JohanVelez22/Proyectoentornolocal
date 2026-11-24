import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, open, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { URL_RUSTUP_INIT, URL_RUSTUP_INIT_SHA256, sumaRustup } from '../catalogo/fuentes/rust';
import { urlIndice, urlOficial, claveValida } from '../catalogo/comun';
import { huellaFuerte, type Huella } from '../catalogo/huellas';
import { leerAcotado, pedirConSaltos } from '../catalogo/red';
import { ErrorWolf } from '../errores';
import type { Eventos, EventosNucleo } from '../eventos';
import { nombreEjecutable } from '../plataforma/sistema';
import type { Ejecutor } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { ProgresoInstalacion } from '../tipos';

/** Toolchain que se instala: el de Windows x64 con el enlazador MSVC. */
export const TRIPLETE_RUST = 'x86_64-pc-windows-msvc';

/** Tope de `rustup-init` (hoy ~13 MB). */
const MAX_BYTES_RUSTUP_INIT = 100 * 1024 * 1024;
const PLAZO_DESCARGA_MS = 10 * 60_000;
const PLAZO_RUSTUP_MS = 30 * 60_000;

/** Carpeta raíz de Rust en la carpeta de datos: `bin/rust` (con `rustup/` y `cargo/`). */
export function carpetaRust(rutas: Rutas): string {
  return path.dirname(rutas.bin('rust', '_'));
}

/** `RUSTUP_HOME` y `CARGO_HOME` propios: Rust nunca usa `~/.rustup` ni `~/.cargo`. */
export function carpetasRustup(raiz: string): { rustupHome: string; cargoHome: string } {
  return { rustupHome: path.join(raiz, 'rustup'), cargoHome: path.join(raiz, 'cargo') };
}

/** "1.85.0-x86_64-pc-windows-msvc" → "1.85.0"; cualquier otra cosa, null. */
export function versionDeToolchain(nombre: string): string | null {
  const sufijo = `-${TRIPLETE_RUST}`;
  if (!nombre.endsWith(sufijo)) return null;
  const v = nombre.slice(0, -sufijo.length);
  return /^\d+\.\d+\.\d+$/.test(v) ? v : null;
}

/** Versiones de Rust con toolchain instalado en `bin/rust/rustup/toolchains`, ordenadas. */
export async function versionesRust(rutas: Rutas): Promise<string[]> {
  const dir = path.join(carpetasRustup(carpetaRust(rutas)).rustupHome, 'toolchains');
  let nombres: string[];
  try {
    nombres = await readdir(dir);
  } catch {
    return [];
  }
  const res: string[] = [];
  for (const n of nombres) {
    const v = versionDeToolchain(n);
    if (v && existsSync(path.join(dir, n, 'bin', nombreEjecutable('rustc')))) res.push(v);
  }
  return res.sort();
}

export interface OpcionesInstaladorRust {
  /** Inyectable para pruebas. */
  f?: typeof fetch;
}

/**
 * Instala toolchains de Rust con rustup dentro de la carpeta de datos de la app:
 * `rustup-init` verificado con su `.sha256` → `rustup-init -y --no-modify-path
 * --default-toolchain none --profile minimal` y `rustup toolchain install <versión>`, siempre con
 * `RUSTUP_HOME` y `CARGO_HOME` propios (`bin/rust/rustup` y `bin/rust/cargo`). Nunca toca el PATH
 * ni `~/.rustup` o `~/.cargo` del usuario.
 */
export class InstaladorRust {
  private readonly f: typeof fetch;

  constructor(
    private readonly rutas: Rutas,
    private readonly eventos: Eventos<EventosNucleo>,
    private readonly exec: Ejecutor,
    o: OpcionesInstaladorRust = {},
  ) {
    this.f = o.f ?? fetch;
  }

  private get raiz(): string {
    return carpetaRust(this.rutas);
  }

  /** Variables que llevan los procesos de rustup y cargo (también `Runtimes.entorno`). */
  entorno(): Record<string, string> {
    const { rustupHome, cargoHome } = carpetasRustup(this.raiz);
    return { RUSTUP_HOME: rustupHome, CARGO_HOME: cargoHome };
  }

  private rustupExe(): string {
    return path.join(carpetasRustup(this.raiz).cargoHome, 'bin', nombreEjecutable('rustup'));
  }

  private emitir(
    version: string,
    fase: ProgresoInstalacion['fase'],
    porcentaje: number,
    mensaje?: string,
  ): void {
    this.eventos.emit('instalacion:progreso', {
      servicio: 'rust',
      version,
      fase,
      porcentaje,
      ...(mensaje ? { mensaje } : {}),
    });
  }

  /** Versiones con toolchain instalado. */
  instalados(): Promise<string[]> {
    return versionesRust(this.rutas);
  }

  /**
   * La suma publicada junto a `rustup-init`. Si el servidor no responde, error reintentable; si
   * responde sin una suma (404, formato raro), null.
   */
  private async huellaPublicada(): Promise<Huella | null> {
    let res: Response;
    try {
      res = await pedirConSaltos(
        this.f,
        URL_RUSTUP_INIT_SHA256,
        { signal: AbortSignal.timeout(15_000), headers: { 'user-agent': 'WolfCoreDev' } },
        urlIndice,
      );
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      throw new ErrorWolf(
        'catalogo.huella_no_disponible',
        'No se pudo obtener la huella de rustup; vuelva a intentarlo',
        { servicio: 'rust', version: '' },
      );
    }
    if (res.status === 404) {
      await res.body?.cancel().catch(() => undefined);
      return null;
    }
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      throw new ErrorWolf(
        'catalogo.huella_no_disponible',
        `No se pudo obtener la huella de rustup (HTTP ${res.status})`,
        { servicio: 'rust', version: '' },
      );
    }
    return sumaRustup(await leerAcotado(res, 4096));
  }

  /** Descarga `rustup-init` a `destino` y devuelve su SHA-256. Cada salto, a hosts permitidos. */
  private async descargarRustupInit(destino: string): Promise<string> {
    const res = await pedirConSaltos(
      this.f,
      URL_RUSTUP_INIT,
      { signal: AbortSignal.timeout(PLAZO_DESCARGA_MS), headers: { 'user-agent': 'WolfCoreDev' } },
      urlOficial,
    );
    if (!res.ok || !res.body) {
      await res.body?.cancel().catch(() => undefined);
      throw new Error(`No se pudo descargar rustup (HTTP ${res.status})`);
    }
    const hash = createHash('sha256');
    const fh = await open(destino, 'w');
    let total = 0;
    try {
      const lector = res.body.getReader();
      try {
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          total += value.length;
          if (total > MAX_BYTES_RUSTUP_INIT) throw new Error('rustup-init es demasiado grande');
          hash.update(value);
          await fh.write(value);
        }
      } finally {
        await lector.cancel().catch(() => undefined);
      }
    } finally {
      await fh.close();
    }
    return hash.digest('hex');
  }

  /**
   * Instala el toolchain `version` ("1.85.0"). Sin huella fuerte del `.sha256` no instala, salvo
   * con `confirmarSinHuella` (el usuario lo confirmó). Si la descarga no coincide con la huella,
   * `rustup-init` no se ejecuta.
   */
  async instalar(version: string, o: { confirmarSinHuella?: true } = {}): Promise<void> {
    if (!claveValida(version) || !/^\d+\.\d+\.\d+$/.test(version)) {
      throw new ErrorWolf('catalogo.version_no_encontrada', `Versión no válida: ${version}`, {
        servicio: 'rust',
        version,
      });
    }
    if ((await this.instalados()).includes(version)) {
      this.emitir(version, 'listo', 100);
      return;
    }
    const tmp = this.rutas.tmp();
    const archivo = path.join(
      tmp,
      nombreEjecutable(`rustup-init-${randomBytes(4).toString('hex')}`),
    );
    try {
      let huella: Huella | null;
      try {
        huella = await this.huellaPublicada();
      } catch (e) {
        if (e instanceof ErrorWolf && e.codigo === 'catalogo.huella_no_disponible') {
          throw new ErrorWolf(e.codigo, e.message, { servicio: 'rust', version });
        }
        throw e;
      }
      if (!huellaFuerte(huella) && o.confirmarSinHuella !== true) {
        throw new ErrorWolf(
          'catalogo.sin_huella',
          'No hay huella publicada para verificar la descarga',
          { servicio: 'rust', version },
        );
      }
      const env = this.entorno();
      const rustup = this.rustupExe();
      await mkdir(carpetasRustup(this.raiz).rustupHome, { recursive: true });
      await mkdir(carpetasRustup(this.raiz).cargoHome, { recursive: true });
      if (!existsSync(rustup)) {
        await mkdir(tmp, { recursive: true });
        this.emitir(version, 'descargando', 0);
        const hash = await this.descargarRustupInit(archivo);
        this.emitir(version, 'verificando', 100);
        if (huella && hash !== huella.valor) {
          throw new ErrorWolf(
            'catalogo.huella_no_coincide',
            'La descarga no coincide con la huella publicada',
          );
        }
        this.emitir(version, 'extrayendo', 10);
        const r = await this.exec(
          archivo,
          ['-y', '--no-modify-path', '--default-toolchain', 'none', '--profile', 'minimal'],
          { timeoutMs: PLAZO_RUSTUP_MS, cwd: this.raiz, env },
        );
        if (r.codigo !== 0) throw new Error(`rustup-init terminó con el código ${r.codigo}`);
      }
      this.emitir(version, 'extrayendo', 50);
      const t = await this.exec(
        rustup,
        ['toolchain', 'install', version, '--profile', 'minimal', '--no-self-update'],
        { timeoutMs: PLAZO_RUSTUP_MS, cwd: this.raiz, env },
      );
      if (t.codigo !== 0)
        throw new Error(`rustup toolchain install terminó con el código ${t.codigo}`);
      if (!(await this.instalados()).includes(version)) {
        throw new Error(`rustup no dejó instalado Rust ${version}`);
      }
      this.emitir(version, 'listo', 100);
    } catch (e) {
      this.emitir(version, 'error', 0, e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      await rm(archivo, { force: true }).catch(() => undefined);
    }
  }

  /** Quita solo el toolchain (con `rustup toolchain uninstall`); rustup y cargo quedan. */
  async desinstalar(version: string): Promise<void> {
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new ErrorWolf('catalogo.version_no_encontrada', `Versión no válida: ${version}`, {
        servicio: 'rust',
        version,
      });
    }
    if (!(await this.instalados()).includes(version)) return;
    const r = await this.exec(this.rustupExe(), ['toolchain', 'uninstall', version], {
      timeoutMs: PLAZO_RUSTUP_MS,
      cwd: this.raiz,
      env: this.entorno(),
    });
    if (r.codigo !== 0) throw new Error(`No se pudo desinstalar Rust ${version}`);
  }
}

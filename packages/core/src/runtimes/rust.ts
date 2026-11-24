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
import type { Ejecutor, PlataformaCompleta } from '../plataforma/tipos';
import { sanear } from '../proyectos/recetas';
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

/**
 * Un toolchain solo cuenta si quedó completo (rustc, cargo y el manifiesto del canal): una
 * instalación cortada a medias deja la carpeta pero no todo esto.
 */
export function toolchainCompleto(dir: string): boolean {
  return (
    existsSync(path.join(dir, 'bin', nombreEjecutable('rustc'))) &&
    existsSync(path.join(dir, 'bin', nombreEjecutable('cargo'))) &&
    existsSync(path.join(dir, 'lib', 'rustlib', 'multirust-channel-manifest.toml'))
  );
}

/** Versiones de Rust con toolchain completo en `bin/rust/rustup/toolchains`, ordenadas. */
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
    if (v && toolchainCompleto(path.join(dir, n))) res.push(v);
  }
  return res.sort();
}

export interface OpcionesInstaladorRust {
  /** Inyectable para pruebas. */
  f?: typeof fetch;
  /** Para quitar la entrada de desinstalación que rustup-init deja en el registro. */
  plataforma?: Pick<PlataformaCompleta, 'limpiarEntradaRustup'>;
  /** Se llama con un código de aviso para mostrárselo al usuario. */
  alAvisar?: (codigo: 'avisos.rustup_entrada_ajena') => void;
}

export interface OpcionesInstalarRust {
  confirmarSinHuella?: true;
  /** Cancela la descarga y los procesos de rustup. */
  senal?: AbortSignal;
}

/** Final del stderr (o del stdout) de un proceso, saneado y corto, para el texto del error. */
function colaDe(r: { stdout: string; stderr: string }): string {
  return sanear(`${r.stderr || r.stdout}`.trim().split(/\r?\n/).slice(-3).join(' ')).slice(0, 300);
}

/** Instalaciones de Rust en curso por carpeta: una a la vez (rustup bloquea su propia carpeta). */
const colas = new Map<string, Promise<unknown>>();

/**
 * Instala toolchains de Rust con rustup dentro de la carpeta de datos de la app:
 * `rustup-init` verificado con su `.sha256` → `rustup-init -y --no-modify-path
 * --default-toolchain none --profile minimal` y `rustup toolchain install <versión>`, siempre con
 * `RUSTUP_HOME` y `CARGO_HOME` propios (`bin/rust/rustup` y `bin/rust/cargo`). Nunca toca el PATH
 * ni `~/.rustup` o `~/.cargo` del usuario. Las variables de rustup del usuario
 * (`RUSTUP_DIST_SERVER`, `RUSTUP_UPDATE_ROOT`, `RUSTUP_TOOLCHAIN`) se vacían en los procesos hijos.
 */
export class InstaladorRust {
  private readonly f: typeof fetch;

  constructor(
    private readonly rutas: Rutas,
    private readonly eventos: Eventos<EventosNucleo>,
    private readonly exec: Ejecutor,
    private readonly o: OpcionesInstaladorRust = {},
  ) {
    this.f = o.f ?? fetch;
  }

  private get raiz(): string {
    return carpetaRust(this.rutas);
  }

  /** Entorno de los procesos de instalación: homes propios y nada heredado que los desvíe. */
  entorno(): Record<string, string> {
    const { rustupHome, cargoHome } = carpetasRustup(this.raiz);
    return {
      RUSTUP_HOME: rustupHome,
      CARGO_HOME: cargoHome,
      RUSTUP_DIST_SERVER: '',
      RUSTUP_UPDATE_ROOT: '',
      RUSTUP_TOOLCHAIN: '',
    };
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

  /** Versiones con toolchain completo instalado. */
  instalados(): Promise<string[]> {
    return versionesRust(this.rutas);
  }

  private enCola<T>(fn: () => Promise<T>): Promise<T> {
    const previa = colas.get(this.raiz) ?? Promise.resolve();
    const p = previa.then(fn, fn);
    const marca = p.catch(() => undefined);
    colas.set(this.raiz, marca);
    void marca.then(() => {
      if (colas.get(this.raiz) === marca) colas.delete(this.raiz);
    });
    return p;
  }

  /**
   * La suma publicada junto a `rustup-init`. Si el servidor no responde, error reintentable; si
   * responde sin una suma (404, formato raro), null.
   */
  private async huellaPublicada(version: string, senal?: AbortSignal): Promise<Huella | null> {
    const noDisponible = (detalle: string): ErrorWolf =>
      new ErrorWolf(
        'catalogo.huella_no_disponible',
        `No se pudo obtener la huella de rustup; vuelva a intentarlo (${detalle})`,
        { servicio: 'rust', version },
      );
    let res: Response;
    try {
      res = await pedirConSaltos(
        this.f,
        URL_RUSTUP_INIT_SHA256,
        {
          signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(senal ? [senal] : [])]),
          headers: { 'user-agent': 'WolfCoreDev' },
        },
        urlIndice,
      );
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      throw noDisponible('sin conexión');
    }
    if (res.status === 404) {
      await res.body?.cancel().catch(() => undefined);
      return null;
    }
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      throw noDisponible(`HTTP ${res.status}`);
    }
    return sumaRustup(await leerAcotado(res, 4096));
  }

  /** Descarga `rustup-init` a `destino` y devuelve su SHA-256. Cada salto, a hosts permitidos. */
  private async descargarRustupInit(destino: string, senal?: AbortSignal): Promise<string> {
    const res = await pedirConSaltos(
      this.f,
      URL_RUSTUP_INIT,
      {
        signal: AbortSignal.any([
          AbortSignal.timeout(PLAZO_DESCARGA_MS),
          ...(senal ? [senal] : []),
        ]),
        headers: { 'user-agent': 'WolfCoreDev' },
      },
      urlOficial,
    );
    if (!res.ok || !res.body) {
      await res.body?.cancel().catch(() => undefined);
      throw new ErrorWolf(
        'rust.descarga_fallo',
        `No se pudo descargar rustup (HTTP ${res.status})`,
        { estado: res.status },
      );
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
          if (total > MAX_BYTES_RUSTUP_INIT) {
            throw new ErrorWolf('catalogo.respuesta_grande', 'rustup-init es demasiado grande');
          }
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
   * Instala el toolchain `version` ("1.85.0"). `rustup-init` solo se baja si rustup todavía no
   * está (y entonces su `.sha256` es obligatorio salvo con `confirmarSinHuella`); si la descarga
   * no coincide con la huella, no se ejecuta. `rustup toolchain install` corre siempre: es
   * idempotente y repara un toolchain a medias.
   */
  instalar(version: string, o: OpcionesInstalarRust = {}): Promise<void> {
    return this.enCola(() => this.instalarSerie(version, o));
  }

  private async instalarSerie(version: string, o: OpcionesInstalarRust): Promise<void> {
    if (!claveValida(version) || !/^\d+\.\d+\.\d+$/.test(version)) {
      throw new ErrorWolf('catalogo.version_no_encontrada', `Versión no válida: ${version}`, {
        servicio: 'rust',
        version,
      });
    }
    const tmp = this.rutas.tmp();
    const archivo = path.join(
      tmp,
      nombreEjecutable(`rustup-init-${randomBytes(4).toString('hex')}`),
    );
    const base = { timeoutMs: PLAZO_RUSTUP_MS, cwd: this.raiz, env: this.entorno() };
    const conSenal = o.senal ? { ...base, senal: o.senal } : base;
    try {
      const rustup = this.rustupExe();
      await mkdir(carpetasRustup(this.raiz).rustupHome, { recursive: true });
      await mkdir(carpetasRustup(this.raiz).cargoHome, { recursive: true });
      if (!existsSync(rustup)) {
        const huella = await this.huellaPublicada(version, o.senal);
        if (!huellaFuerte(huella) && o.confirmarSinHuella !== true) {
          throw new ErrorWolf(
            'catalogo.sin_huella',
            'No hay huella publicada para verificar la descarga',
            { servicio: 'rust', version },
          );
        }
        await mkdir(tmp, { recursive: true });
        this.emitir(version, 'descargando', 0);
        const hash = await this.descargarRustupInit(archivo, o.senal);
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
          conSenal,
        );
        await this.limpiarRegistro();
        if (r.codigo !== 0) {
          throw new ErrorWolf('rust.rustup_init_fallo', 'rustup-init no terminó bien', {
            codigo: r.codigo,
            detalle: colaDe(r),
          });
        }
      }
      this.emitir(version, 'extrayendo', 50);
      const t = await this.exec(
        rustup,
        ['toolchain', 'install', version, '--profile', 'minimal', '--no-self-update'],
        conSenal,
      );
      if (t.codigo !== 0) {
        throw new ErrorWolf('rust.toolchain_fallo', `No se pudo instalar Rust ${version}`, {
          version,
          codigo: t.codigo,
          detalle: colaDe(t),
        });
      }
      if (!(await this.instalados()).includes(version)) {
        throw new ErrorWolf('rust.toolchain_fallo', `rustup no dejó completo Rust ${version}`, {
          version,
          codigo: 0,
          detalle: '',
        });
      }
      this.emitir(version, 'listo', 100);
    } catch (e) {
      this.emitir(version, 'error', 0, e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      await rm(archivo, { force: true }).catch(() => undefined);
    }
  }

  /**
   * Quita la entrada de desinstalación de rustup si es nuestra (su desinstalador está en la
   * carpeta de datos); si apunta a otro sitio no se toca y se avisa. Nunca hace fallar la
   * instalación.
   */
  private async limpiarRegistro(): Promise<void> {
    try {
      const r = await this.o.plataforma?.limpiarEntradaRustup(this.rutas.base);
      if (r === 'ajena') this.o.alAvisar?.('avisos.rustup_entrada_ajena');
    } catch {
      // el registro es un detalle: la instalación no depende de él
    }
  }

  /** Quita solo el toolchain (con `rustup toolchain uninstall`); rustup y cargo quedan. */
  desinstalar(version: string): Promise<void> {
    return this.enCola(async () => {
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
      if (r.codigo !== 0) {
        throw new ErrorWolf('rust.desinstalar_fallo', `No se pudo desinstalar Rust ${version}`, {
          version,
          detalle: colaDe(r),
        });
      }
    });
  }
}

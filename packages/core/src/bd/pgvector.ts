import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { catalogo, type VersionDisponible } from '../catalogo/catalogo';
import type { Instalador } from '../catalogo/instalador';
import type { Eventos, EventosNucleo } from '../eventos';
import { lanzadorPorDefecto } from '../plataforma/lanzar';
import type { Ejecutor, Lanzador } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import type { ProgresoInstalacion } from '../tipos';

export interface DepsPgvector {
  rutas: Rutas;
  eventos: Eventos<EventosNucleo>;
  exec: Ejecutor;
  /** Procesos largos en streaming (por defecto `spawn`). */
  lanzar?: Lanzador;
  instalador: Pick<Instalador, 'instalar'>;
  /** Versión del PostgreSQL activo, o null si no hay ninguno instalado. */
  versionPostgres: () => Promise<string | null>;
  /** Inyectable para pruebas. */
  existe?: (ruta: string) => boolean;
  /** Por defecto %ProgramFiles(x86)%. */
  programFilesX86?: string;
  /** Detiene PostgreSQL de forma limpia; devuelve si estaba en marcha. */
  detenerPostgres: () => Promise<boolean>;
  iniciarPostgres: () => Promise<void>;
  /** Reloj en milisegundos (para pruebas). */
  ahora?: () => number;
}

export const MSG_SIN_HERRAMIENTAS = 'Instale primero las herramientas de compilación';
export const MSG_SIN_POSTGRES = 'PostgreSQL no está instalado';
export const MSG_EN_CURSO = 'Ya hay una instalación de pgvector en curso';
export const MSG_COPIA_PARADO =
  'No se pudo copiar pgvector a la carpeta de PostgreSQL (puede faltar permiso o un archivo seguir en uso).';
export const MSG_COPIA_REINICIADO =
  MSG_COPIA_PARADO + ' PostgreSQL se volvió a encender; inténtelo de nuevo.';
export const MSG_COPIA_SIN_PARAR =
  'No se pudo copiar pgvector a la carpeta de PostgreSQL (puede faltar permiso de escritura).';
const MSG_CANCELADO = 'Windows no concedió permiso de administrador o la instalación se canceló.';
const MARCA_INSTALAR = 'WOLFCORE-INSTALAR-PGVECTOR';
/** Winget: reinicio requerido (la instalación sí terminó). */
const CODIGO_REINICIO = 3010;
const INTERVALO_MS = 100;

export type ResultadoBuildTools =
  { ok: true } | { ok: false; motivo: 'winget-ausente' | 'fallo'; detalle?: string };

/** Los `%` se duplican para que el .cmd no los expanda. */
const lit = (t: string): string => t.replace(/%/g, '%%');
/** Líneas de relleno (spinners, barras) no aportan nada. */
const util = (l: string): boolean => l.replace(/[^\p{L}\p{N}]/gu, '').length >= 3;

/** Compila pgvector desde su código oficial con las Build Tools de Visual Studio. */
export class InstaladorPgvector {
  private enCurso = false;
  private ultimoEmitido = -Infinity;

  constructor(private readonly d: DepsPgvector) {}

  private get lanzar(): Lanzador {
    return this.d.lanzar ?? lanzadorPorDefecto;
  }

  private existe(p: string): boolean {
    return (this.d.existe ?? existsSync)(p);
  }

  /** Limita el ritmo del progreso a unas 10 líneas por segundo. */
  private permitir(): boolean {
    const t = (this.d.ahora ?? Date.now)();
    if (t - this.ultimoEmitido < INTERVALO_MS) return false;
    this.ultimoEmitido = t;
    return true;
  }

  private emitir(
    version: string,
    fase: ProgresoInstalacion['fase'],
    porcentaje: number,
    mensaje?: string,
    servicio = 'pgvector',
  ): void {
    this.d.eventos.emit('instalacion:progreso', {
      servicio,
      version,
      fase,
      porcentaje,
      ...(mensaje ? { mensaje } : {}),
    });
  }

  private vswhere(): string {
    const pf =
      this.d.programFilesX86 ?? process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
    return path.win32.join(pf, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
  }

  /** Carpeta de las Build Tools con el compilador de C++ para x64, o null. */
  private async rutaBuildTools(): Promise<string | null> {
    const exe = this.vswhere();
    if (!this.existe(exe)) return null;
    try {
      const r = await this.d.exec(exe, [
        '-latest',
        '-products',
        '*',
        '-requires',
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        '-property',
        'installationPath',
      ]);
      if (r.codigo !== 0) return null;
      return (
        r.stdout
          .split(/\r?\n/)
          .map((l) => l.trim())
          .find((l) => l !== '') ?? null
      );
    } catch {
      return null;
    }
  }

  private async carpetaPostgres(): Promise<string | null> {
    const v = await this.d.versionPostgres();
    return v ? path.join(this.d.rutas.bin('postgresql', v), 'pgsql') : null;
  }

  async estado(): Promise<{ buildTools: boolean; instalado: boolean; version: string | null }> {
    const buildTools = (await this.rutaBuildTools()) !== null;
    const pg = await this.carpetaPostgres();
    if (!pg) return { buildTools, instalado: false, version: null };
    const control = path.join(pg, 'share', 'extension', 'vector.control');
    try {
      const texto = await readFile(control, 'utf8');
      const m = /^\s*default_version\s*=\s*'([^']+)'/m.exec(texto);
      return { buildTools, instalado: true, version: m ? m[1]! : null };
    } catch {
      return { buildTools, instalado: false, version: null };
    }
  }

  private version(): VersionDisponible {
    const e = catalogo['pgvector-src'][0];
    if (!e) throw new Error('El catálogo no incluye el código de pgvector');
    return { servicio: 'pgvector-src', ...e };
  }

  /** Instala Visual Studio Build Tools con winget (pide permiso de administrador en pantalla). */
  async instalarBuildTools(): Promise<ResultadoBuildTools> {
    const version = this.version().version;
    // Con su propio "servicio": la interfaz no debe dar pgvector por instalado.
    const ev = (f: ProgresoInstalacion['fase'], p: number, m?: string): void =>
      this.emitir(version, f, p, m, 'buildtools');
    ev('compilando', 0, 'Instalando las herramientas de compilación…');
    let codigo: number;
    try {
      ({ codigo } = await this.lanzar(
        'winget',
        [
          'install',
          '--id',
          'Microsoft.VisualStudio.2022.BuildTools',
          '-e',
          '--accept-package-agreements',
          '--accept-source-agreements',
          '--override',
          '--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended',
        ],
        {
          alLinea: (l) => {
            if (util(l) && this.permitir()) ev('compilando', 0, l);
          },
        },
      ));
    } catch (e) {
      if ((e as { code?: unknown } | null)?.code === 'ENOENT') {
        ev('error', 0, 'winget no está disponible en este equipo.');
        return { ok: false, motivo: 'winget-ausente' };
      }
      const detalle = e instanceof Error ? e.message : String(e);
      ev('error', 0, detalle);
      return { ok: false, motivo: 'fallo', detalle };
    }
    // La verdad final: si las herramientas ya están (ya instaladas, sin actualización,
    // reinicio pendiente) es éxito aunque winget devuelva un código distinto de 0.
    if (codigo === 0 || codigo === CODIGO_REINICIO || (await this.rutaBuildTools()) !== null) {
      ev('listo', 100);
      return { ok: true };
    }
    ev('error', 0, MSG_CANCELADO);
    return { ok: false, motivo: 'fallo', detalle: MSG_CANCELADO };
  }

  /** Descarga el código, lo compila con nmake y lo instala en el PostgreSQL activo. */
  async compilarEInstalar(): Promise<{ version: string }> {
    if (this.enCurso) throw new Error(MSG_EN_CURSO);
    this.enCurso = true;
    try {
      return await this.compilar();
    } finally {
      this.enCurso = false;
    }
  }

  private async compilar(): Promise<{ version: string }> {
    const v = this.version();
    const pg = await this.carpetaPostgres();
    if (!pg) throw new Error(MSG_SIN_POSTGRES);
    const vs = await this.rutaBuildTools();
    const vcvars = vs ? path.win32.join(vs, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat') : null;
    if (!vcvars || !this.existe(vcvars)) throw new Error(MSG_SIN_HERRAMIENTAS);

    const tmp = this.d.rutas.tmp();
    const script = path.join(tmp, `pgvector-${randomUUID()}.cmd`);
    const ultimas: string[] = [];
    let detenido = false;
    let enCopia = false;
    let falloCopia = false;
    let falloReinicio: string | null = null;
    let error: unknown = null;
    try {
      const codigo = this.d.rutas.bin('pgvector-src', v.version);
      // Siempre desde una extracción limpia: sin objetos de una compilación anterior.
      await rm(codigo, { recursive: true, force: true });
      await this.d.instalador.instalar(v);
      this.emitir(v.version, 'compilando', 0, 'Compilando pgvector…');
      await mkdir(tmp, { recursive: true });
      // Un .cmd evita el doble escape de comillas de `cmd /c "..."` con rutas con espacios;
      // chcp 65001 hace que cmd lea las rutas con acentos (el archivo es UTF-8 sin BOM).
      const lineas = [
        '@chcp 65001 >nul',
        '@echo off',
        `call "${lit(vcvars)}" || exit /b 1`,
        `set "PGROOT=${lit(pg)}"`,
        'nmake /F Makefile.win || exit /b 1',
        `echo ${MARCA_INSTALAR}`,
        'nmake /F Makefile.win install || exit /b 1',
        '',
      ];
      await writeFile(script, lineas.join('\r\n'), 'utf8');
      // PostgreSQL mantiene abierto vector.dll si ya lo cargó: se detiene durante la copia.
      detenido = await this.d.detenerPostgres();
      const r = await this.lanzar(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', script], {
        cwd: codigo,
        alLinea: (l) => {
          if (l.trim() === MARCA_INSTALAR) {
            enCopia = true;
            return;
          }
          if (!util(l)) return;
          ultimas.push(l);
          if (ultimas.length > 3) ultimas.shift();
          if (this.permitir()) this.emitir(v.version, 'compilando', 50, l);
        },
      });
      if (r.codigo !== 0 && !enCopia) {
        const detalle = ultimas.join(' ');
        throw new Error(`No se pudo compilar pgvector${detalle ? `: ${detalle}` : '.'}`);
      }
      if (r.codigo !== 0 && enCopia) falloCopia = true;
    } catch (e) {
      error = e;
    } finally {
      await rm(script, { force: true }).catch(() => undefined);
      if (detenido) {
        try {
          await this.d.iniciarPostgres();
        } catch (e) {
          falloReinicio = e instanceof Error ? e.message : String(e);
        }
      }
    }
    if (falloCopia) {
      error = new Error(
        !detenido
          ? MSG_COPIA_SIN_PARAR
          : falloReinicio === null
            ? MSG_COPIA_REINICIADO
            : MSG_COPIA_PARADO,
      );
    }
    if (falloReinicio !== null) {
      const adicional = `Además, PostgreSQL no pudo volver a iniciar: ${falloReinicio}. Enciéndalo desde Servicios.`;
      error = new Error(
        error instanceof Error
          ? `${error.message} ${adicional}`
          : `pgvector se instaló. ${adicional}`,
      );
    }
    if (error) {
      this.emitir(v.version, 'error', 0, error instanceof Error ? error.message : String(error));
      throw error;
    }
    this.emitir(v.version, 'listo', 100);
    return { version: v.version };
  }
}

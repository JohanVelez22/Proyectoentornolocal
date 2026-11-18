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
}

export const MSG_SIN_HERRAMIENTAS = 'Instale primero las herramientas de compilación';
export const MSG_SIN_POSTGRES = 'PostgreSQL no está instalado';
const MSG_CANCELADO = 'Windows no concedió permiso de administrador o la instalación se canceló.';

export type ResultadoBuildTools =
  { ok: true } | { ok: false; motivo: 'winget-ausente' | 'fallo'; detalle?: string };

/** Los `%` se duplican para que el .cmd no los expanda. */
const lit = (t: string): string => t.replace(/%/g, '%%');

/** Compila pgvector desde su código oficial con las Build Tools de Visual Studio. */
export class InstaladorPgvector {
  constructor(private readonly d: DepsPgvector) {}

  private get lanzar(): Lanzador {
    return this.d.lanzar ?? lanzadorPorDefecto;
  }

  private existe(p: string): boolean {
    return (this.d.existe ?? existsSync)(p);
  }

  private emitir(
    version: string,
    fase: ProgresoInstalacion['fase'],
    porcentaje: number,
    mensaje?: string,
  ): void {
    this.d.eventos.emit('instalacion:progreso', {
      servicio: 'pgvector',
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
    this.emitir(version, 'compilando', 0, 'Instalando las herramientas de compilación…');
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
        { alLinea: (l) => this.emitir(version, 'compilando', 0, l) },
      ));
    } catch (e) {
      if ((e as { code?: unknown } | null)?.code === 'ENOENT') {
        this.emitir(version, 'error', 0, 'winget no está disponible en este equipo.');
        return { ok: false, motivo: 'winget-ausente' };
      }
      const detalle = e instanceof Error ? e.message : String(e);
      this.emitir(version, 'error', 0, detalle);
      return { ok: false, motivo: 'fallo', detalle };
    }
    if (codigo !== 0) {
      this.emitir(version, 'error', 0, MSG_CANCELADO);
      return { ok: false, motivo: 'fallo', detalle: MSG_CANCELADO };
    }
    this.emitir(version, 'listo', 100);
    return { ok: true };
  }

  /** Descarga el código, lo compila con nmake y lo instala en el PostgreSQL activo. */
  async compilarEInstalar(): Promise<{ version: string }> {
    const v = this.version();
    const pg = await this.carpetaPostgres();
    if (!pg) throw new Error(MSG_SIN_POSTGRES);
    const vs = await this.rutaBuildTools();
    const vcvars = vs ? path.win32.join(vs, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat') : null;
    if (!vcvars || !this.existe(vcvars)) throw new Error(MSG_SIN_HERRAMIENTAS);

    const tmp = this.d.rutas.tmp();
    const script = path.join(tmp, `pgvector-${randomUUID()}.cmd`);
    const ultimas: string[] = [];
    try {
      await this.d.instalador.instalar(v);
      const codigo = this.d.rutas.bin('pgvector-src', v.version);
      this.emitir(v.version, 'compilando', 0, 'Compilando pgvector…');
      await mkdir(tmp, { recursive: true });
      // Un .cmd evita el doble escape de comillas de `cmd /c "..."` con rutas con espacios.
      const lineas = [
        '@echo off',
        `call "${lit(vcvars)}" || exit /b 1`,
        `set "PGROOT=${lit(pg)}"`,
        'nmake /F Makefile.win || exit /b 1',
        'nmake /F Makefile.win install || exit /b 1',
        '',
      ];
      await writeFile(script, lineas.join('\r\n'), 'utf8');
      const r = await this.lanzar(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', script], {
        cwd: codigo,
        alLinea: (l) => {
          if (l.trim() === '') return;
          ultimas.push(l);
          if (ultimas.length > 3) ultimas.shift();
          this.emitir(v.version, 'compilando', 50, l);
        },
      });
      if (r.codigo !== 0) {
        const detalle = ultimas.join(' ');
        throw new Error(`No se pudo compilar pgvector${detalle ? `: ${detalle}` : '.'}`);
      }
      this.emitir(v.version, 'listo', 100);
      return { version: v.version };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emitir(v.version, 'error', 0, msg);
      throw e;
    } finally {
      await rm(script, { force: true }).catch(() => undefined);
    }
  }
}

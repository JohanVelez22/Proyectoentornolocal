import { execFile } from 'node:child_process';
import { entornoDelHijo } from '../procesos/entorno';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { open, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { arch, homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { rutaBasePorDefecto } from './carpetas';
import { editoresWindows } from './editoresWin';
import {
  bloquesPem,
  interpretarAntivirus,
  interpretarProfilesIni,
  interpretarRangosReservados,
  interpretarServiciosSistema,
  NOMBRE_SERVICIO,
  NOMBRE_VARIABLE,
  SCRIPT_ANTIVIRUS,
  SCRIPT_RAICES,
  scriptLeerVariableUsuario,
  SCRIPT_VCREDIST,
  scriptServicios,
  scriptVariableUsuario,
} from './diagnosticoWin';
import {
  codificarComando,
  MOTIVO_SALIDA_COPIA,
  literal,
  MOTIVO_SALIDA_SERVICIO,
  PREFIJO_TEMPORAL_HOSTS,
  SALIDA_COPIA,
  SALIDA_SERVICIO,
  scriptCopiaHosts,
  scriptElevar,
  sha256,
} from './hostsAdmin';
import {
  interpretarPerfilRed,
  interpretarReglasEntrada,
  SCRIPT_REGLAS_ENTRADA,
  scriptPerfilRed,
  type PerfilRed,
  type ReglasEntrada,
} from './firewallWin';
import { crearLanzadorOculto, type LanzadorOculto } from './lanzarOculto';
import { interpretarNetstatTodos, interpretarTasklist, interpretarTasklistTodos } from './netstat';
import { aBase64, codificarPowerShell, PathUsuarioWindows } from './pathUsuarioWin';
import {
  ProcesosWindows,
  descendientesEnTabla,
  rutaPowerShell,
  rutaSistema32,
} from './procesosWin';
import { ProcesosUsuarioWindows } from './procesosUsuarioWin';
import { navegadoresDeProcesos, rutasLimpiezaWindows, SCRIPT_ES_ADMIN } from './limpiezaWin';
import {
  abrirTerminalWindows,
  leerRutaDockerRegistro,
  leerRutaGitRegistro,
  existeEntrada,
  lanzarEnConsolaNueva,
  lanzarSeparado,
  raizSistema,
  terminalesWindows,
  type LanzadorSeparado,
} from './terminalWin';
import { CLAVE_DESINSTALAR_RUSTUP, desinstalarEnCarpeta } from './rustupRegistro';
import { nombreEjecutable, sistemaActual } from './sistema';

export { interpretarTasklist, interpretarTasklistTodos } from './netstat';
import type {
  AccesoPathUsuario,
  ComandoManual,
  EstadoAntivirus,
  EstadoCaptura,
  ConexionActiva,
  EstadoCierre,
  IdentidadUsuario,
  ProcesoUsuario,
  NavegadorLimpieza,
  RutasCategoriaLimpieza,
  Ejecutor,
  IdCatalogo,
  InstalacionAjena,
  MuestraPlataforma,
  OpcionesEscrituraAdmin,
  OpcionesAbrirTerminal,
  PerfilFirefoxSistema,
  TerminalDisponible,
  EditorDisponible,
  PlataformaCompleta,
  RangoPuertos,
  ResultadoEscritura,
  ServicioSistema,
  UsoProceso,
} from './tipos';

export const ejecutorPorDefecto: Ejecutor = (cmd, args, opts) =>
  new Promise((resolve) => {
    const hijo = execFile(
      cmd,
      args,
      {
        windowsHide: true,
        encoding: 'utf8',
        timeout: opts?.timeoutMs,
        cwd: opts?.cwd,
        maxBuffer: 16 * 1024 * 1024,
        ...(opts?.senal ? { signal: opts.senal } : {}),
        ...(opts?.env || opts?.quitarEntorno
          ? {
              env: entornoDelHijo(process.env, {
                env: opts.env,
                quitarEntorno: opts.quitarEntorno,
              }),
            }
          : {}),
      },
      (err, stdout, stderr) => {
        const code = (err as { code?: unknown } | null)?.code;
        const codigo = err === null ? 0 : typeof code === 'number' ? code : 1;
        resolve({
          codigo,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? '') || (err?.message ?? ''),
        });
      },
    );
    if (opts?.entrada !== undefined) {
      hijo.stdin?.on('error', () => undefined);
      hijo.stdin?.end(opts.entrada);
    }
  });

/** PID en escucha de cada puerto pedido (una sola pasada por la salida de netstat). */
export function interpretarNetstatVarios(salida: string, puertos: number[]): Map<number, number> {
  const res = new Map<number, number>();
  for (const p of new Set(puertos)) {
    const pid = interpretarNetstat(salida, p);
    if (pid !== null) res.set(p, pid);
  }
  return res;
}

/** Hosts locales que cuentan como "en escucha" para un servicio propio. */
const HOSTS_ESCUCHA = new Set(['0.0.0.0', '::', '::1', '127.0.0.1']);

/** PID TCP en escucha en el puerto (todas las interfaces o loopback), o null. */
export function interpretarNetstat(salida: string, puerto: number): number | null {
  const f = interpretarNetstatTodos(salida).find(
    (x) => x.protocolo === 'TCP' && x.puerto === puerto && HOSTS_ESCUCHA.has(x.direccion),
  );
  return f ? f.pid : null;
}

/* ───────────── Métricas (una sola consulta de PowerShell por muestra) ───────────── */

const MUESTRA_VACIA = (): MuestraPlataforma => ({ procesos: [], red: null });

/** Número finito y no negativo, o null. */
function numero(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
}

/** ConvertTo-Json desenvuelve los arreglos de un elemento y deja null los vacíos. */
function comoLista(v: unknown): Record<string, unknown>[] {
  const lista = Array.isArray(v) ? v : v === null || v === undefined ? [] : [v];
  return lista.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null);
}

/**
 * Interpreta la salida JSON del script de `muestraSistemaWindows` (`{p: procesos, n: adaptadores}`).
 * Nunca lanza: lo que no se entienda se descarta.
 */
export function interpretarMuestraWindows(salida: string): MuestraPlataforma {
  const i = salida.indexOf('{');
  if (i < 0) return MUESTRA_VACIA();
  let dato: unknown;
  try {
    dato = JSON.parse(salida.slice(i));
  } catch {
    return MUESTRA_VACIA();
  }
  if (typeof dato !== 'object' || dato === null || Array.isArray(dato)) return MUESTRA_VACIA();
  const { p, n } = dato as { p?: unknown; n?: unknown };
  const procesos: UsoProceso[] = [];
  for (const x of comoLista(p)) {
    const pid = numero(x.IDProcess);
    if (pid === null || !Number.isInteger(pid) || pid <= 0) continue;
    procesos.push({
      pid,
      cpu: numero(x.PercentProcessorTime) ?? 0,
      ramBytes: numero(x.WorkingSetPrivate) ?? numero(x.WorkingSet) ?? 0,
      uptimeS: numero(x.ElapsedTime) ?? 0,
    });
  }
  let rx = 0;
  let tx = 0;
  let adaptadores = 0;
  for (const x of comoLista(n)) {
    const r = numero(x.ReceivedBytes);
    const t = numero(x.SentBytes);
    if (r === null || t === null) continue;
    rx += r;
    tx += t;
    adaptadores++;
  }
  return { procesos, red: adaptadores > 0 ? { rx, tx } : null };
}

/**
 * Script de la muestra: CPU y RAM de los PIDs pedidos y los contadores de red de los adaptadores
 * físicos, en JSON compacto.
 */
export function scriptMuestraWindows(pids: number[]): string {
  const validos = [...new Set(pids)].filter((p) => Number.isInteger(p) && p > 0);
  const filtro = validos.map((p) => `IDProcess=${p}`).join(' OR ');
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    '$p = @()',
    ...(validos.length > 0
      ? [
          `$p = @(Get-CimInstance -ClassName Win32_PerfFormattedData_PerfProc_Process -Filter "${filtro}" | Select-Object IDProcess,PercentProcessorTime,WorkingSetPrivate,WorkingSet,ElapsedTime)`,
        ]
      : []),
    // Solo adaptadores físicos: los virtuales (Hyper-V, VPN, WSL) repiten el mismo tráfico.
    '$f = @(Get-NetAdapter -Physical | ForEach-Object Name)',
    '$n = @(Get-NetAdapterStatistics | Where-Object { $f -contains $_.Name } | Select-Object Name,ReceivedBytes,SentBytes)',
    'ConvertTo-Json -Compress -Depth 3 -InputObject ([pscustomobject]@{ p = $p; n = $n })',
  ].join('\n');
}

/**
 * Una muestra del sistema con un solo PowerShell oculto (`windowsHide` del ejecutor), nunca uno
 * por servicio. Si PowerShell falla o no responde, devuelve una muestra vacía (no lanza).
 */
export async function muestraSistemaWindows(
  ejecutar: Ejecutor,
  pids: number[],
): Promise<MuestraPlataforma> {
  try {
    const r = await ejecutar(
      'powershell',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-EncodedCommand',
        Buffer.from(scriptMuestraWindows(pids), 'utf16le').toString('base64'),
      ],
      { timeoutMs: 10_000 },
    );
    if (r.codigo !== 0) return MUESTRA_VACIA();
    return interpretarMuestraWindows(r.stdout);
  } catch {
    return MUESTRA_VACIA();
  }
}

/** ¿Existe el proceso? `process.kill(pid, 0)` no envía nada: solo lo consulta al sistema. */
export function pidExiste(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // EPERM: existe pero es de otro usuario o del sistema.
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * Ruta de un ejecutable en Windows: primero las carpetas del PATH (sin comillas, vacías ni
 * relativas), luego `extras`. Se prueba `<nombre>.exe` en cada una; null si no está.
 */
export function buscarEjecutableWindows(
  nombre: string,
  o: { entorno: NodeJS.ProcessEnv; existe: (ruta: string) => boolean; extras?: readonly string[] },
): string | null {
  const clave = Object.keys(o.entorno).find((k) => k.toLowerCase() === 'path') ?? 'Path';
  const dirs = (o.entorno[clave] ?? '')
    .split(';')
    .map((d) => d.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
  // Solo carpetas absolutas con unidad (`C:\…`): una entrada relativa (`.`, `bin`) o sin unidad
  // (`\x`) depende de la carpeta actual del proceso y podría ejecutar un programa del proyecto.
  for (const dir of [...dirs, ...(o.extras ?? [])].filter((d) => /^[A-Za-z]:[\\/]/.test(d))) {
    const r = path.win32.join(dir, nombreEjecutable(nombre));
    if (o.existe(r)) return r;
  }
  return null;
}

/** En un .cmd, `%` se duplica para que no se expanda. */
const paraCmd = (ruta: string): string => ruta.replace(/%/g, '%%');

/**
 * Ruta de `destino` vista desde la carpeta de un shim .cmd: `%~dp0..\..\bin\php\8.4\php.exe`.
 * Sin ruta relativa posible (otra unidad), la absoluta.
 */
export function relativaAlShim(dirShim: string, destino: string): string {
  const rel = path.win32.relative(dirShim, destino);
  if (rel === '' || path.win32.isAbsolute(rel)) return paraCmd(destino);
  return `%~dp0${paraCmd(rel)}`;
}

/** vswhere.exe del instalador de Visual Studio. */
export function rutaVswhere(programFilesX86?: string): string {
  const pf = programFilesX86 ?? process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
  return path.win32.join(pf, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
}

/** vcvars64.bat de una instalación de Visual Studio / Build Tools. */
export const rutaVcvars64 = (vs: string): string =>
  path.win32.join(vs, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');

/** Intérprete de comandos del sistema (para ejecutar un .cmd). */
export const interpreteComandos = (): string => process.env.ComSpec ?? 'cmd.exe';

/** tar.exe de Windows (bsdtar en System32, no el de Git). */
export const rutaTarSistema = (): string =>
  path.win32.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');

export interface OpcionesPlataformaWindows {
  /** Variables de entorno (por defecto, las del proceso). */
  entorno?: NodeJS.ProcessEnv;
  /**
   * ¿Existe el archivo? Por defecto, `existsSync` o, si dice que no, `lstat` (así se ven los
   * alias de la Tienda como `wt.exe`, cuyo `stat` da EACCES).
   */
  existeRuta?: (ruta: string) => boolean;
  /** Lanzador de las terminales visibles (programas de consola en una consola nueva). */
  lanzarSeparado?: LanzadorSeparado;
  /** Lanzador de programas con ventana propia (Windows Terminal). */
  lanzarGui?: LanzadorSeparado;
  arquitectura?: string;
  /** Carpeta de los temporales de hosts (por defecto, %TEMP%). */
  carpetaTemporal?: string;
  /** Escribe el temporal de la escritura elevada (por defecto `writeFile`; las pruebas lo detienen). */
  escribirTemporal?: (ruta: string, datos: Buffer) => Promise<void>;
  /**
   * ¿Leer del registro dónde está Git for Windows? Por defecto sí, salvo con `entorno` inyectado
   * (pruebas), para no ejecutar PowerShell real.
   */
  gitRegistro?: boolean;
}

const NOMBRE_REGLA_FIREWALL = /^[\w{}.\- @:()[\]]{1,200}$/;

export class PlataformaWindows implements PlataformaCompleta {
  private contador = 0;
  /** PowerShell exteriores que esperan un UAC (se cortan al cerrar la app). */
  private readonly elevaciones = new Set<AbortController>();
  /** Un solo UAC a la vez (hosts, servicios…): cada elevación espera a la anterior. */
  private colaElevacion: Promise<unknown> = Promise.resolve();
  private generacion = 0;
  private readonly carpetaTemporal: string;
  private readonly escribirTemporal: (ruta: string, datos: Buffer) => Promise<void>;
  private readonly entorno: NodeJS.ProcessEnv;
  private readonly existeRuta: (ruta: string) => boolean;
  private readonly lanzarSeparado: LanzadorSeparado;
  private readonly lanzarGui: LanzadorSeparado;
  private readonly arquitectura: string;
  private readonly gitRegistro: boolean;
  private rutaGitLeida: Promise<string | null> | null = null;
  private rutaDockerLeida: Promise<string | null> | null = null;
  /** SID del usuario actual (whoami), leído una vez. */
  private sidLeido: Promise<string | null> | null = null;

  constructor(
    private readonly ejecutar: Ejecutor = ejecutorPorDefecto,
    private readonly existe: (pid: number) => boolean = pidExiste,
    o: OpcionesPlataformaWindows = {},
  ) {
    this.entorno = o.entorno ?? process.env;
    this.existeRuta = o.existeRuta ?? ((r) => existsSync(r) || existeEntrada(r));
    this.lanzarSeparado = o.lanzarSeparado ?? lanzarEnConsolaNueva;
    this.lanzarGui = o.lanzarGui ?? lanzarSeparado;
    this.arquitectura = o.arquitectura ?? arch();
    this.carpetaTemporal = o.carpetaTemporal ?? tmpdir();
    this.escribirTemporal = o.escribirTemporal ?? ((ruta, datos) => writeFile(ruta, datos));
    this.gitRegistro = o.gitRegistro ?? o.entorno === undefined;
  }

  /** Carpeta de Git for Windows del registro (una lectura por sesión). */
  private rutaGit(): Promise<string | null> {
    if (!this.gitRegistro) return Promise.resolve(null);
    this.rutaGitLeida ??= leerRutaGitRegistro(this.ejecutar);
    return this.rutaGitLeida;
  }

  carpetaDatos(): string {
    return rutaBasePorDefecto(this.entorno, 'win32');
  }

  carpetaInicio(): string {
    return this.entorno.USERPROFILE || homedir();
  }

  idCatalogo(): IdCatalogo {
    return this.arquitectura === 'arm64' ? 'win-arm64' : 'win-x64';
  }

  nombreEjecutable(base: string): string {
    return nombreEjecutable(base);
  }

  carpetasNpmGlobal(): string[] {
    const appData = this.entorno.APPDATA;
    return appData ? [path.win32.join(appData, 'npm')] : [];
  }

  /**
   * `C:\laragon`, `C:\xampp` y las carpetas de Herd (`%USERPROFILE%\Herd` y su configuración
   * `%USERPROFILE%\.config\herd`), las que existan. Solo mira; no abre ningún archivo.
   */
  async instalacionesAjenas(): Promise<InstalacionAjena[]> {
    const sd = this.entorno.SystemDrive ?? '';
    const unidad = /^[A-Za-z]:$/.test(sd) ? sd : 'C:';
    const inicio = this.carpetaInicio();
    const candidatas: InstalacionAjena[] = [
      { programa: 'laragon', raiz: path.win32.join(unidad, '\\', 'laragon') },
      { programa: 'xampp', raiz: path.win32.join(unidad, '\\', 'xampp') },
      { programa: 'herd', raiz: path.win32.join(inicio, 'Herd') },
      { programa: 'herd', raiz: path.win32.join(inicio, '.config', 'herd') },
    ];
    const hay: InstalacionAjena[] = [];
    for (const c of candidatas) {
      try {
        if ((await stat(c.raiz)).isDirectory()) hay.push(c);
      } catch {
        // no está instalado
      }
    }
    return hay;
  }

  /**
   * Tailscale ya instalado: `tailscale.exe` del PATH o de `Program Files\Tailscale`. La sesión se
   * lee con `status --json` (solo lectura); sin ejecutable o sin sesión, `sesion` es false.
   */
  async tailscale(): Promise<{ ruta: string | null; sesion: boolean }> {
    const extras = [
      this.entorno.ProgramFiles,
      this.entorno.ProgramW6432,
      this.entorno['ProgramFiles(x86)'],
    ]
      .filter((d): d is string => typeof d === 'string' && d !== '')
      .map((d) => path.win32.join(d, 'Tailscale'));
    const ruta = await this.buscarEjecutable('tailscale', extras);
    if (!ruta) return { ruta: null, sesion: false };
    try {
      const r = await this.ejecutar(ruta, ['status', '--json'], {
        timeoutMs: 8000,
        // Variables de Tailscale del usuario (TS_SOCKET, TS_AUTHKEY…) no cambian a qué demonio se habla.
        quitarEntorno: ['TS_', 'TAILSCALE_'],
      });
      if (r.codigo !== 0) return { ruta, sesion: false };
      const estado = (JSON.parse(r.stdout) as { BackendState?: unknown }).BackendState;
      return { ruta, sesion: estado === 'Running' };
    } catch {
      return { ruta, sesion: false };
    }
  }

  async carpetasContenedores(motor: 'docker' | 'podman'): Promise<string[]> {
    // Se lee del registro solo donde también se lee el de Git (sin `entorno` inyectado en pruebas).
    const deRegistro = async (): Promise<string[]> => {
      if (!this.gitRegistro) return [];
      this.rutaDockerLeida ??= leerRutaDockerRegistro(this.ejecutar);
      const app = await this.rutaDockerLeida;
      return app ? [path.win32.join(app, 'resources', 'bin')] : [];
    };
    const pf = this.entorno.ProgramW6432 ?? this.entorno.ProgramFiles ?? 'C:\\Program Files';
    if (motor === 'docker') {
      return [...(await deRegistro()), path.win32.join(pf, 'Docker', 'Docker', 'resources', 'bin')];
    }
    const local = this.entorno.LOCALAPPDATA;
    return [
      path.win32.join(pf, 'RedHat', 'Podman'),
      ...(local
        ? [
            path.win32.join(local, 'Programs', 'Podman'),
            path.win32.join(local, 'Programs', 'RedHat', 'Podman'),
          ]
        : []),
    ];
  }

  async buscarEjecutable(nombre: string, extras: string[] = []): Promise<string | null> {
    return buscarEjecutableWindows(nombre, {
      entorno: this.entorno,
      existe: this.existeRuta,
      extras,
    });
  }

  pathUsuario(o: { respaldo?: string } = {}): AccesoPathUsuario {
    return new PathUsuarioWindows({ exec: this.ejecutar, ...o });
  }

  async leerVariableUsuario(nombre: string): Promise<string | null> {
    if (!NOMBRE_VARIABLE.test(nombre)) throw new Error(`Nombre de variable no válido: ${nombre}`);
    const r = await this.ejecutar(
      'powershell',
      codificarPowerShell(scriptLeerVariableUsuario(nombre)),
      {
        timeoutMs: 15_000,
      },
    );
    if (r.codigo !== 0) {
      throw new Error(`No se pudo leer la variable del usuario: ${r.stderr.trim() || r.codigo}`);
    }
    const b64 = r.stdout.trim();
    if (!b64) return null;
    const valor = Buffer.from(b64, 'base64').toString('utf16le');
    return valor === '' ? null : valor;
  }

  async variableUsuario(nombre: string, valor: string | null): Promise<ResultadoEscritura> {
    if (!NOMBRE_VARIABLE.test(nombre) || nombre.toLowerCase() === 'path') {
      return { ok: false, motivo: 'error', detalle: `Nombre de variable no válido: ${nombre}` };
    }
    try {
      const r = await this.ejecutar(
        'powershell',
        codificarPowerShell(scriptVariableUsuario(nombre, valor === null)),
        { timeoutMs: 30_000, ...(valor !== null ? { entrada: aBase64(valor) } : {}) },
      );
      if (r.codigo === 0) return { ok: true };
      const detalle = r.stderr.trim();
      return detalle ? { ok: false, motivo: 'error', detalle } : { ok: false, motivo: 'error' };
    } catch (e) {
      return { ok: false, motivo: 'error', detalle: e instanceof Error ? e.message : String(e) };
    }
  }

  async abrirTerminal(cwd: string, o: OpcionesAbrirTerminal = {}): Promise<void> {
    return abrirTerminalWindows(cwd, o, {
      entorno: this.entorno,
      rutaGit: await this.rutaGit(),
      existe: this.existeRuta,
      lanzar: this.lanzarSeparado,
      lanzarGui: this.lanzarGui,
    });
  }

  async terminalesInstaladas(): Promise<TerminalDisponible[]> {
    return terminalesWindows(this.entorno, this.existeRuta, await this.rutaGit());
  }

  async editoresInstalados(): Promise<EditorDisponible[]> {
    return editoresWindows(this.entorno, { existe: this.existeRuta });
  }

  /** Fuera de Windows (solo en pruebas) no hay PowerShell: ninguno. */
  lanzadorOculto(carpetaTmp: string): LanzadorOculto | null {
    if (sistemaActual() !== 'win32') return null;
    return crearLanzadorOculto({
      procesoVivo: (pid) => this.procesoVivo(pid),
      matarArbol: (pid) => this.matarArbol(pid),
      carpetaTmp,
    });
  }

  async descendientes(pids: number[]): Promise<Map<number, number[]>> {
    const tabla = await new ProcesosWindows(this.ejecutar, this.entorno).tabla();
    if (!tabla) throw new Error('No se pudo leer la tabla de procesos.');
    return descendientesEnTabla(tabla, pids);
  }

  async rangosReservados(protocolo: 'tcp'): Promise<RangoPuertos[]> {
    const r = await this.ejecutar(
      rutaSistema32(this.entorno, 'netsh.exe'),
      ['interface', 'ipv4', 'show', 'excludedportrange', `protocol=${protocolo}`],
      { timeoutMs: 15000 },
    );
    if (r.codigo !== 0) throw new Error(`netsh falló: ${r.stderr.trim() || r.codigo}`);
    return interpretarRangosReservados(r.stdout);
  }

  async serviciosSistema(nombres: string[]): Promise<ServicioSistema[]> {
    for (const n of nombres) {
      if (!NOMBRE_SERVICIO.test(n)) throw new Error(`Nombre de servicio no válido: ${n}`);
    }
    if (nombres.length === 0) return [];
    const r = await this.ejecutar('powershell', codificarPowerShell(scriptServicios(nombres)), {
      timeoutMs: 20000,
    });
    return interpretarServiciosSistema(r.stdout, nombres);
  }

  async limpiarEntradaRustup(carpetaDatos: string): Promise<'ausente' | 'quitada' | 'ajena'> {
    const clave = `HKCU:\\${CLAVE_DESINSTALAR_RUSTUP}`;
    const leer = await this.ejecutar(
      'powershell',
      codificarPowerShell(
        [
          "$ErrorActionPreference = 'SilentlyContinue'",
          `$k = ${literal(clave)}`,
          "if (-not (Test-Path -LiteralPath $k)) { [Console]::Out.Write('AUSENTE'); exit 0 }",
          "[Console]::Out.Write('U:' + [string](Get-ItemProperty -LiteralPath $k).UninstallString)",
        ].join('\n'),
      ),
      { timeoutMs: 15000 },
    );
    const salida = leer.stdout.trim();
    if (leer.codigo !== 0 || salida === 'AUSENTE') return 'ausente';
    if (!salida.startsWith('U:') || !desinstalarEnCarpeta(salida.slice(2), carpetaDatos)) {
      return 'ajena';
    }
    // Solo se borra la clave de Rustup cuyo desinstalador está en nuestra carpeta de datos.
    await this.ejecutar(
      'powershell',
      codificarPowerShell(
        `Remove-Item -LiteralPath ${literal(clave)} -Recurse -Force -ErrorAction SilentlyContinue`,
      ),
      { timeoutMs: 15000 },
    );
    return 'quitada';
  }

  async enlazadorMsvc(): Promise<boolean> {
    const exe = rutaVswhere(this.entorno['ProgramFiles(x86)']);
    if (!this.existeRuta(exe)) return false;
    try {
      const r = await this.ejecutar(
        exe,
        [
          '-latest',
          '-products',
          '*',
          '-requires',
          'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
          '-property',
          'installationPath',
        ],
        { timeoutMs: 15000 },
      );
      return r.codigo === 0 && r.stdout.trim() !== '';
    } catch {
      return false;
    }
  }

  async vcRedistInstalado(): Promise<boolean> {
    const r = await this.ejecutar('powershell', codificarPowerShell(SCRIPT_VCREDIST), {
      timeoutMs: 15000,
    });
    return r.codigo === 0 && r.stdout.trim() === '1';
  }

  /**
   * Corre `interno` en una PowerShell elevada (UAC) y espera su código. Se corta al cerrar la app
   * (`cancelarEscriturasAdmin`) o al vencer `tiempoLimiteMs`.
   */
  /**
   * Corre `fn` cuando terminó la elevación anterior. Si mientras esperaba se cerró la app
   * (`cancelarEscriturasAdmin`), no abre ningún UAC.
   */
  private enCola(
    fn: () => Promise<ResultadoEscritura>,
    vencimientoUnixMs?: number,
  ): Promise<ResultadoEscritura> {
    const generacion = this.generacion;
    const correr = (): Promise<ResultadoEscritura> =>
      generacion === this.generacion &&
      (vencimientoUnixMs === undefined || Date.now() < vencimientoUnixMs)
        ? fn()
        : Promise.resolve({ ok: false, motivo: 'tiempo' });
    const p = this.colaElevacion.then(correr, correr);
    this.colaElevacion = p.catch(() => undefined);
    return p;
  }

  private elevar(interno: string, tiempoLimiteMs = 120_000): Promise<ResultadoEscritura> {
    return this.enCola(() => this.elevarAhora(interno, tiempoLimiteMs));
  }

  private async elevarAhora(interno: string, tiempoLimiteMs: number): Promise<ResultadoEscritura> {
    const ctl = new AbortController();
    this.elevaciones.add(ctl);
    try {
      const r = await this.ejecutar(
        'powershell',
        ['-NoProfile', '-Command', scriptElevar(codificarComando(interno))],
        { timeoutMs: tiempoLimiteMs, senal: ctl.signal },
      );
      if (r.codigo === 0) return { ok: true };
      if (r.codigo === SALIDA_COPIA.cancelado || /cancel/i.test(r.stderr)) {
        return { ok: false, motivo: 'cancelado' };
      }
      if (ctl.signal.aborted) return { ok: false, motivo: 'tiempo' };
      const propio = MOTIVO_SALIDA_SERVICIO[r.codigo];
      if (propio) return propio;
      return { ok: false, motivo: 'error', detalle: `código ${r.codigo}` };
    } catch (e) {
      return { ok: false, motivo: 'error', detalle: e instanceof Error ? e.message : String(e) };
    } finally {
      this.elevaciones.delete(ctl);
    }
  }

  async detenerServicioSistema(nombre: string): Promise<ResultadoEscritura> {
    if (!NOMBRE_SERVICIO.test(nombre)) throw new Error(`Nombre de servicio no válido: ${nombre}`);
    // Solo .NET (sin Stop-Service, que vive en un módulo); espera STOPPED con plazo.
    const estado = '[ServiceProcess.ServiceControllerStatus]::Stopped';
    return this.elevar(
      [
        "$ErrorActionPreference = 'Stop'",
        "$null = [Reflection.Assembly]::LoadWithPartialName('System.ServiceProcess')",
        'try {',
        `  $s = [ServiceProcess.ServiceController]::new(${literal(nombre)})`,
        // Stop() también detiene los dependientes en marcha: si los hay, no se toca nada (igual
        // que `Stop-Service` sin -Force, el comando manual que se muestra).
        `  if (@($s.DependentServices | Where-Object { $_.Status -ne ${estado} }).Count -gt 0) { exit ${SALIDA_SERVICIO.dependientes} }`,
        `  if ($s.Status -ne ${estado}) { $s.Stop() }`,
        `  $s.WaitForStatus(${estado}, [TimeSpan]::FromSeconds(60))`,
        `} catch [System.ServiceProcess.TimeoutException] { exit ${SALIDA_SERVICIO.plazo} } catch { exit ${SALIDA_SERVICIO.fallo} }`,
        'exit 0',
      ].join('\n'),
      180_000,
    );
  }

  async quitarSoloLecturaHosts(): Promise<ResultadoEscritura> {
    return this.elevar(
      [
        "$ErrorActionPreference = 'Stop'",
        "$d = [IO.Path]::Combine([Environment]::SystemDirectory, 'drivers', 'etc', 'hosts')",
        '[IO.File]::SetAttributes($d, ([IO.File]::GetAttributes($d) -band -bnot [IO.FileAttributes]::ReadOnly))',
        'exit 0',
      ].join('\n'),
    );
  }

  async instalarVcRedist(): Promise<ResultadoEscritura> {
    const local = this.entorno.LOCALAPPDATA;
    // Primero el de WindowsApps (el de App Installer); si no, el del PATH.
    const deApps = local
      ? path.win32.join(local, 'Microsoft', 'WindowsApps', nombreEjecutable('winget'))
      : null;
    const winget =
      deApps && this.existeRuta(deApps) ? deApps : await this.buscarEjecutable('winget');
    if (!winget) {
      return { ok: false, motivo: 'error', detalle: 'winget no está disponible en este equipo' };
    }
    try {
      // El instalador de Microsoft pide su propio permiso de administrador.
      const r = await this.ejecutar(
        winget,
        [
          'install',
          '--id',
          'Microsoft.VCRedist.2015+.x64',
          '--exact',
          '--source',
          'winget',
          '--silent',
          '--disable-interactivity',
          '--accept-package-agreements',
          '--accept-source-agreements',
        ],
        { timeoutMs: 15 * 60_000 },
      );
      if (r.codigo === 0 || (await this.vcRedistInstalado())) return { ok: true };
      return { ok: false, motivo: 'error', detalle: `winget terminó con el código ${r.codigo}` };
    } catch (e) {
      return { ok: false, motivo: 'error', detalle: e instanceof Error ? e.message : String(e) };
    }
  }

  async antivirus(carpeta: string): Promise<EstadoAntivirus | null> {
    try {
      const r = await this.ejecutar('powershell', codificarPowerShell(SCRIPT_ANTIVIRUS), {
        timeoutMs: 20_000,
      });
      if (r.codigo !== 0) return null;
      return interpretarAntivirus(r.stdout, carpeta);
    } catch {
      return null;
    }
  }

  /**
   * `icacls` de System32 (nunca uno del PATH): quita los permisos heredados y deja solo al
   * usuario actual con control total. Lo usa el archivo del token de la captura de dumps.
   */
  async restringirAlUsuario(ruta: string, o: { carpeta?: boolean } = {}): Promise<boolean> {
    // Por SID (no por USERNAME/USERDOMAIN, que vienen del entorno) y con whoami e icacls de la
    // carpeta del sistema validada (una SystemRoot rara no elige qué ejecutable corre).
    const sistema32 = path.win32.join(raizSistema(this.entorno), 'System32');
    try {
      this.sidLeido ??= this.ejecutar(
        path.win32.join(sistema32, 'whoami.exe'),
        ['/user', '/fo', 'csv', '/nh'],
        { timeoutMs: 15_000 },
      ).then((r) => (r.codigo === 0 ? (/"(S-1-\d+(?:-\d+)+)"/.exec(r.stdout)?.[1] ?? null) : null));
      const sid = await this.sidLeido;
      if (!sid) {
        this.sidLeido = null;
        return false;
      }
      const r = await this.ejecutar(
        path.win32.join(sistema32, 'icacls.exe'),
        [ruta, '/inheritance:r', '/grant:r', `*${sid}:${o.carpeta ? '(OI)(CI)' : ''}(F)`],
        { timeoutMs: 15_000 },
      );
      return r.codigo === 0;
    } catch {
      this.sidLeido = null;
      return false;
    }
  }

  /** Dueño de la ruta (SID) contra el SID del usuario actual, en un solo PowerShell. */
  async duenoEsUsuario(ruta: string): Promise<boolean> {
    const script = [
      "$ErrorActionPreference = 'Stop'",
      `$o = (Get-Acl -LiteralPath '${ruta.replace(/'/g, "''")}').GetOwner([System.Security.Principal.SecurityIdentifier]).Value`,
      '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
      "if ($o -eq $yo) { [Console]::Out.Write('SI') } else { [Console]::Out.Write('NO') }",
    ].join('\n');
    try {
      const r = await this.ejecutar('powershell', codificarPowerShell(script), {
        timeoutMs: 20_000,
      });
      return r.codigo === 0 && r.stdout.trim() === 'SI';
    } catch {
      return false;
    }
  }

  comandoManual(c: ComandoManual): string {
    switch (c.tipo) {
      case 'liberar-rangos':
        // Reiniciar WinNAT reparte de nuevo los rangos reservados de Hyper-V/WSL/Docker.
        return 'net stop winnat; net start winnat';
      case 'exclusion-antivirus':
        return `Add-MpPreference -ExclusionPath ${literal(c.carpeta)}`;
      case 'quitar-solo-lectura-hosts':
        return "attrib -R ([IO.Path]::Combine([Environment]::SystemDirectory, 'drivers', 'etc', 'hosts'))";
      case 'detener-servicio':
        if (!NOMBRE_SERVICIO.test(c.nombre)) {
          throw new Error(`Nombre de servicio no válido: ${c.nombre}`);
        }
        return `Stop-Service -Name ${literal(c.nombre)}`;
      case 'instalar-vcredist':
        return 'winget install --id Microsoft.VCRedist.2015+.x64 --exact --source winget';
      case 'instalar-build-tools':
        return 'winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --source winget --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"';
      case 'regla-firewall-lan': {
        if (!Number.isInteger(c.puerto) || c.puerto < 1 || c.puerto > 65535) {
          throw new Error(`Puerto no válido: ${c.puerto}`);
        }
        const nombre = `WolfCore Dev red local ${c.puerto}`;
        // Solo la subred local y solo redes privadas (la de casa u oficina), nunca públicas. Si ya
        // hay una regla con ese nombre se reemplaza (no se acumulan).
        return [
          `Remove-NetFirewallRule -DisplayName ${literal(nombre)} -ErrorAction SilentlyContinue`,
          `New-NetFirewallRule -DisplayName ${literal(nombre)} -Direction Inbound -Protocol TCP -LocalPort ${c.puerto} -Action Allow -Profile Private -RemoteAddress LocalSubnet${c.programa ? ` -Program ${literal(c.programa)}` : ''}`,
        ].join('; ');
      }
      case 'quitar-reglas-firewall':
        return c.nombres
          .filter((n) => NOMBRE_REGLA_FIREWALL.test(n))
          .map((n) => `Remove-NetFirewallRule -Name ${literal(n)}`)
          .join('; ');
    }
  }

  async perfilRedDe(ip: string): Promise<PerfilRed | null> {
    try {
      const r = await this.ejecutar('powershell', codificarPowerShell(scriptPerfilRed(ip)), {
        timeoutMs: 15_000,
      });
      return r.codigo === 0 ? interpretarPerfilRed(r.stdout) : null;
    } catch {
      return null;
    }
  }

  /** LibreOffice ya instalado en Program Files (solo comprueba que soffice exista). */
  async libreOffice(): Promise<string | null> {
    const bases = [
      this.entorno.ProgramFiles,
      this.entorno.ProgramW6432,
      this.entorno['ProgramFiles(x86)'],
    ].filter((d): d is string => typeof d === 'string' && d !== '');
    for (const b of bases) {
      const ruta = path.win32.join(b, 'LibreOffice', 'program', 'soffice.exe');
      if (this.existeRuta(ruta)) return ruta;
    }
    return null;
  }

  /** Windows no pide permiso para capturar la pantalla (`desktopCapturer` basta). */
  async capturaDisponible(): Promise<EstadoCaptura> {
    return { disponible: true, permiso: 'no_aplica' };
  }

  private procesosUsuario(): ProcesosUsuarioWindows {
    return new ProcesosUsuarioWindows(this.ejecutar, this.entorno);
  }

  /** Procesos del usuario y la sesión actuales (solo lee; sin servicios de Windows). */
  procesosDelUsuario(): Promise<ProcesoUsuario[]> {
    return this.procesosUsuario().listar();
  }

  /** Cierre amable (CloseMainWindow) por PID: nunca termina el proceso. */
  cerrarVentanaPrincipal(pid: number, inicio: string, ruta: string): Promise<EstadoCierre> {
    return this.procesosUsuario().cerrarVentana(pid, inicio, ruta);
  }

  /** Conexiones TCP en curso (para no detener un servicio que se está usando). */
  conexionesActivas(): Promise<ConexionActiva[]> {
    return this.procesosUsuario().conexiones();
  }

  identidadActual(): Promise<IdentidadUsuario> {
    return this.procesosUsuario().identidad();
  }

  rutasProtegidas(): string[] {
    return this.procesosUsuario().rutasProtegidas();
  }

  // ---- Limpieza de disco (D37) ----

  private enviarAPapelera: ((ruta: string) => Promise<void>) | null = null;

  rutasLimpieza(carpetaDatos: string): Promise<RutasCategoriaLimpieza[]> {
    return rutasLimpiezaWindows(this.entorno, carpetaDatos, undefined, this.carpetaTemporal);
  }

  /** Navegadores abiertos según la lista de procesos del usuario; si no se lee, falla. */
  async navegadoresAbiertos(): Promise<NavegadorLimpieza[]> {
    const procesos = await this.procesosUsuario().listar();
    return navegadoresDeProcesos(procesos.map((p) => p.nombre));
  }

  async esAdministrador(): Promise<boolean> {
    try {
      const r = await this.ejecutar(
        rutaPowerShell(this.entorno),
        codificarPowerShell(SCRIPT_ES_ADMIN),
        { timeoutMs: 20_000 },
      );
      return r.codigo === 0 && r.stdout.trim().toLowerCase() === 'true';
    } catch {
      return false;
    }
  }

  registrarPapelera(enviar: (ruta: string) => Promise<void>): void {
    this.enviarAPapelera = enviar;
  }

  async aPapelera(ruta: string): Promise<boolean> {
    if (!this.enviarAPapelera) return false;
    try {
      await this.enviarAPapelera(ruta);
      return true;
    } catch {
      return false;
    }
  }

  async reglasEntradaPermitidas(): Promise<ReglasEntrada> {
    try {
      const r = await this.ejecutar('powershell', codificarPowerShell(SCRIPT_REGLAS_ENTRADA), {
        timeoutMs: 60_000,
      });
      if (r.codigo !== 0) return { ok: false, reglas: [] };
      return { ok: true, reglas: interpretarReglasEntrada(r.stdout) };
    } catch {
      return { ok: false, reglas: [] };
    }
  }

  async perfilesFirefox(): Promise<PerfilFirefoxSistema[]> {
    const appdata =
      this.entorno.APPDATA ?? path.win32.join(this.carpetaInicio(), 'AppData', 'Roaming');
    const base = path.win32.join(appdata, 'Mozilla', 'Firefox');
    let texto: string;
    try {
      texto = await readFile(path.win32.join(base, 'profiles.ini'), 'utf8');
    } catch {
      return [];
    }
    return interpretarProfilesIni(texto, base);
  }

  /**
   * Firefox abre `parent.lock` sin compartir y lo borra al cerrarse: si no se puede abrir, el
   * perfil está en uso. Uno que se abre es un resto de un cierre brusco.
   */
  async firefoxEnUso(perfil: string): Promise<boolean> {
    try {
      const f = await open(path.win32.join(perfil, 'parent.lock'), 'r+');
      await f.close();
      return false;
    } catch (e) {
      const codigo = (e as NodeJS.ErrnoException).code;
      return codigo === 'EBUSY' || codigo === 'EPERM' || codigo === 'EACCES';
    }
  }

  async raicesSistema(): Promise<string> {
    const r = await this.ejecutar('powershell', codificarPowerShell(SCRIPT_RAICES), {
      timeoutMs: 30_000,
    });
    if (r.codigo !== 0) {
      throw new Error(`No se pudieron leer las raíces del sistema: ${r.stderr.trim() || r.codigo}`);
    }
    return bloquesPem(r.stdout)
      .map(
        (b) => `${b}
`,
      )
      .join('');
  }

  rutaHosts(): string {
    const raiz = process.env.SystemRoot ?? 'C:\\Windows';
    return path.win32.join(raiz, 'System32', 'drivers', 'etc', 'hosts');
  }

  escribirComoAdmin(
    destino: string,
    contenido: string,
    o: OpcionesEscrituraAdmin = {},
  ): Promise<ResultadoEscritura> {
    return this.enCola(() => {
      // El plazo cuenta desde que la escritura sale de la cola, sin pasar el vencimiento.
      const restante =
        o.vencimientoUnixMs !== undefined ? o.vencimientoUnixMs - Date.now() : undefined;
      const plazo =
        restante === undefined
          ? o.tiempoLimiteMs
          : Math.max(1, Math.min(o.tiempoLimiteMs ?? restante, restante));
      return this.escribirComoAdminAhora(destino, contenido, {
        ...o,
        ...(plazo !== undefined ? { tiempoLimiteMs: plazo } : {}),
      });
    }, o.vencimientoUnixMs);
  }

  private async escribirComoAdminAhora(
    destino: string,
    contenido: string,
    o: OpcionesEscrituraAdmin,
  ): Promise<ResultadoEscritura> {
    const tmp = path.join(
      this.carpetaTemporal,
      `${PREFIJO_TEMPORAL_HOSTS}${process.pid}-${++this.contador}-${randomUUID().slice(0, 8)}.txt`,
    );
    const ctl = new AbortController();
    this.elevaciones.add(ctl);
    try {
      const datos = Buffer.from(contenido, 'utf8');
      await this.escribirTemporal(tmp, datos);
      // Cancelada mientras se preparaba el temporal (la app se cierra): no se abre ningún UAC.
      if (ctl.signal.aborted) return { ok: false, motivo: 'tiempo' };
      // El script elevado se comprueba a sí mismo antes de copiar: un UAC aceptado tarde (o un
      // temporal que no se pudo borrar) no escribe nada.
      // El hosts del sistema lo ubica el script elevado con la API (no con %SystemRoot%).
      const esHostsSistema = destino.toLowerCase() === this.rutaHosts().toLowerCase();
      const interno = scriptCopiaHosts({
        temporal: tmp,
        destino: esHostsSistema ? null : destino,
        limiteUnixMs: o.tiempoLimiteMs
          ? Math.min(Date.now() + o.tiempoLimiteMs, o.vencimientoUnixMs ?? Infinity)
          : (o.vencimientoUnixMs ?? null),
        hashTemporal: sha256(datos),
        hashPrevio: o.hashPrevio ?? null,
      });
      const externo = scriptElevar(codificarComando(interno));
      const desde = Date.now();
      const r = await this.ejecutar('powershell', ['-NoProfile', '-Command', externo], {
        ...(o.tiempoLimiteMs ? { timeoutMs: o.tiempoLimiteMs } : {}),
        senal: ctl.signal,
      });
      if (r.codigo !== 0 && /cancel/i.test(r.stderr)) return { ok: false, motivo: 'cancelado' };
      const mapeado = MOTIVO_SALIDA_COPIA[r.codigo];
      if (mapeado) return mapeado;
      const vencido =
        ctl.signal.aborted ||
        (o.tiempoLimiteMs !== undefined &&
          r.codigo !== 0 &&
          Date.now() - desde >= o.tiempoLimiteMs);
      let actual: Buffer | null = null;
      try {
        actual = await readFile(destino);
      } catch {
        actual = null;
      }
      if (actual !== null && actual.equals(datos)) return { ok: true };
      if (vencido) return { ok: false, motivo: 'tiempo' };
      const detalle = r.stderr.trim();
      return detalle
        ? { ok: false, motivo: 'denegado', detalle }
        : { ok: false, motivo: 'denegado' };
    } catch (e) {
      return { ok: false, motivo: 'error', detalle: e instanceof Error ? e.message : String(e) };
    } finally {
      this.elevaciones.delete(ctl);
      await rm(tmp, { force: true }).catch(() => undefined);
    }
  }

  /** Corta las PowerShell que esperan un UAC (al cerrar la app o terminar la sesión). */
  cancelarEscriturasAdmin(): void {
    this.generacion++;
    for (const c of this.elevaciones) c.abort();
    this.elevaciones.clear();
  }

  /** Borra los temporales de hosts que dejaron otras ejecuciones (otro PID que ya terminó). */
  async limpiarTemporalesAdmin(): Promise<void> {
    let nombres: string[];
    try {
      nombres = await readdir(this.carpetaTemporal);
    } catch {
      return;
    }
    for (const n of nombres) {
      const m = new RegExp(`^${PREFIJO_TEMPORAL_HOSTS}(\\d+)-[\\w-]+\\.txt$`).exec(n);
      // Solo los de procesos que ya no existen: otra instancia viva puede estar esperando su UAC.
      if (!m || Number(m[1]) === process.pid || this.existe(Number(m[1]))) continue;
      await rm(path.join(this.carpetaTemporal, n), { force: true }).catch(() => undefined);
    }
  }

  async quienUsaPuerto(puerto: number): Promise<{ pid: number; nombre: string } | null> {
    const r = await this.ejecutar('netstat', ['-ano', '-p', 'TCP'], { timeoutMs: 15000 });
    const pid = interpretarNetstat(r.stdout, puerto);
    if (pid === null) return null;
    const t = await this.ejecutar('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
      timeoutMs: 15000,
    });
    return interpretarTasklist(t.stdout) ?? { pid, nombre: 'desconocido' };
  }

  async duenosDePuertos(puertos: number[]): Promise<Map<number, { pid: number; nombre: string }>> {
    const res = new Map<number, { pid: number; nombre: string }>();
    if (puertos.length === 0) return res;
    const r = await this.ejecutar('netstat', ['-ano', '-p', 'TCP'], { timeoutMs: 15000 });
    const pids = interpretarNetstatVarios(r.stdout, puertos);
    if (pids.size === 0) return res;
    const t = await this.ejecutar('tasklist', ['/FO', 'CSV', '/NH'], { timeoutMs: 15000 });
    const nombres = interpretarTasklistTodos(t.stdout);
    for (const [puerto, pid] of pids)
      res.set(puerto, { pid, nombre: nombres.get(pid) ?? 'desconocido' });
    return res;
  }

  async instalarCertificadoUsuario(rutaCrt: string): Promise<ResultadoEscritura> {
    return this.certutil(['-user', '-addstore', 'Root', rutaCrt]);
  }

  async quitarCertificadoUsuario(huella: string): Promise<ResultadoEscritura> {
    if (!/^[0-9A-Fa-f]{40}$/.test(huella))
      return { ok: false, motivo: 'error', detalle: 'Huella no válida' };
    return this.certutil(['-user', '-delstore', 'Root', huella]);
  }

  async certificadoInstalado(huella: string): Promise<boolean> {
    if (!/^[0-9A-Fa-f]{40}$/.test(huella)) return false;
    const r = await this.ejecutar('certutil', ['-user', '-store', 'Root', huella], {
      timeoutMs: 15000,
    });
    return r.codigo === 0;
  }

  /**
   * certutil siempre sobre el almacén del usuario. Solo ERROR_CANCELLED (0x800704C7) es una
   * cancelación; "no encontrado" (0x80092004) al quitar ya es el resultado buscado.
   */
  private async certutil(args: string[]): Promise<ResultadoEscritura> {
    // Sin límite corto: Windows muestra su propio aviso de confirmación y espera al usuario.
    const r = await this.ejecutar('certutil', args, { timeoutMs: 120000 });
    if (r.codigo === 0) return { ok: true };
    const texto = `${r.stderr}${r.stdout}`.trim();
    const bajo = texto.toLowerCase();
    if (r.codigo === -2147023673 || bajo.includes('0x800704c7') || bajo.includes('cancel')) {
      return { ok: false, motivo: 'cancelado', detalle: texto };
    }
    if (
      args.includes('-delstore') &&
      (r.codigo === -2146885628 || bajo.includes('0x80092004') || bajo.includes('not found'))
    ) {
      return { ok: true };
    }
    return { ok: false, motivo: 'error', detalle: texto };
  }

  async procesoVivo(pid: number): Promise<{ vivo: boolean; ejecutable?: string }> {
    const t = await this.ejecutar('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
      timeoutMs: 15000,
    });
    const p = interpretarTasklist(t.stdout);
    if (p && p.pid === pid) return { vivo: true, ejecutable: p.nombre };
    // Con el sistema ocupado tasklist puede fallar o volver vacío con el proceso vivo: darlo
    // por muerto dejaba el servicio en "error" y su proceso huérfano. Se confirma antes.
    return this.existe(pid) ? { vivo: true } : { vivo: false };
  }

  async inicioProceso(pid: number): Promise<string | null> {
    if (!Number.isInteger(pid) || pid <= 0) return null;
    try {
      // CreationDate de Win32_Process como FILETIME UTC: no depende de la zona ni del idioma.
      const r = await this.ejecutar(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `$p = Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'; if ($p) { $p.CreationDate.ToFileTimeUtc() }`,
        ],
        { timeoutMs: 15000 },
      );
      const texto = r.stdout.trim();
      return r.codigo === 0 && /^\d+$/.test(texto) ? texto : null;
    } catch {
      return null;
    }
  }

  async rutaProceso(pid: number): Promise<string | null> {
    if (!Number.isInteger(pid) || pid <= 0) return null;
    try {
      // En Base64 UTF-8: la carpeta de datos puede tener tildes y la consola usa la página OEM.
      const r = await this.ejecutar(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `$p = Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'; if ($p -and $p.ExecutablePath) { [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($p.ExecutablePath)) }`,
        ],
        { timeoutMs: 15000 },
      );
      const texto = r.stdout.trim();
      if (r.codigo !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(texto)) return null;
      const ruta = Buffer.from(texto, 'base64').toString('utf8');
      return path.win32.isAbsolute(ruta) && !ruta.includes('\0') ? ruta : null;
    } catch {
      return null;
    }
  }

  async matarArbol(pid: number): Promise<void> {
    await this.ejecutar('taskkill', ['/PID', String(pid), '/T', '/F'], { timeoutMs: 15000 });
  }

  async abrirUrl(url: string): Promise<void> {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      throw new Error(`URL no permitida: ${url}`);
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error(`URL no permitida: ${url}`);
    }
    await this.ejecutar('rundll32', ['url.dll,FileProtocolHandler', u.href]);
  }

  ejecutable(nombre: 'nginx' | 'php-cgi' | 'php' | 'cloudflared'): string {
    return `${nombre}.exe`;
  }

  private documentos: string | null = null;

  async carpetaDocumentos(): Promise<string> {
    if (this.documentos) return this.documentos;
    try {
      // UTF-8 para que una carpeta con tildes (o redirigida a OneDrive) llegue bien.
      const r = await this.ejecutar(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          "[Console]::OutputEncoding=[Text.Encoding]::UTF8; [Environment]::GetFolderPath('MyDocuments')",
        ],
        { timeoutMs: 15000 },
      );
      const ruta = r.stdout.trim();
      if (r.codigo === 0 && path.win32.isAbsolute(ruta)) {
        this.documentos = ruta;
        return ruta;
      }
    } catch {
      // se usa la ruta de siempre
    }
    return path.win32.join(process.env.USERPROFILE ?? homedir(), 'Documents');
  }
}

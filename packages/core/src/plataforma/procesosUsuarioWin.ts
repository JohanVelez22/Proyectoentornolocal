import path from 'node:path';
import { codificarPowerShell } from './pathUsuarioWin';
import { rutaPowerShell } from './procesosWin';
import type { Ejecutor, IdentidadUsuario, ProcesoUsuario } from './tipos';

/**
 * Procesos del usuario actual para el optimizador de RAM (D36).
 *
 * - `listar` y `identidad` SOLO LEEN (`Get-CimInstance Win32_Process` filtrado por la sesión y el
 *   SID del usuario actual, sin servicios de Windows).
 * - `cerrarVentana` solo pide un cierre amable (`CloseMainWindow`, como la X) POR PID. Aquí no hay
 *   ni habrá `taskkill`, `Stop-Process`, `TerminateProcess` ni `Process.Kill`: lo guarda una
 *   prueba que lee este archivo.
 *
 * PowerShell va por ruta absoluta de System32 (nunca del PATH ni de la carpeta actual).
 */

const SEP = '|';

/** Una línea por proceso: pid|sesion|inicio|memoria|ventana|servicio|nombre(b64)|ruta(b64). */
export const SCRIPT_PROCESOS_USUARIO = [
  "$ErrorActionPreference = 'Stop'",
  '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
  '$ses = [System.Diagnostics.Process]::GetCurrentProcess().SessionId',
  '$serv = @{}',
  `Get-CimInstance Win32_Service -Filter "State='Running'" | ForEach-Object { $serv[[int]$_.ProcessId] = 1 }`,
  '$vent = @{}',
  'Get-Process | ForEach-Object { if ($_.MainWindowHandle -ne 0) { $vent[[int]$_.Id] = 1 } }',
  'function B($t) { if ($t) { [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$t)) } else { "" } }',
  'Get-CimInstance Win32_Process | Where-Object { $_.SessionId -eq $ses } | ForEach-Object {',
  '  $o = Invoke-CimMethod -InputObject $_ -MethodName GetOwnerSid -ErrorAction SilentlyContinue',
  '  if ($o -and $o.Sid -eq $yo) {',
  '    $c = ""; if ($_.CreationDate) { $c = $_.CreationDate.ToFileTimeUtc() }',
  '    $v = 0; if ($vent.ContainsKey([int]$_.ProcessId)) { $v = 1 }',
  '    $s = 0; if ($serv.ContainsKey([int]$_.ProcessId)) { $s = 1 }',
  `    [Console]::Out.WriteLine(($_.ProcessId, $_.SessionId, $c, $_.WorkingSetSize, $v, $s, (B $_.Name), (B $_.ExecutablePath)) -join '${SEP}')`,
  '  }',
  '}',
].join('\n');

/** `sid|sesion` del proceso actual. */
export const SCRIPT_IDENTIDAD = [
  "$ErrorActionPreference = 'Stop'",
  '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
  '$ses = [System.Diagnostics.Process]::GetCurrentProcess().SessionId',
  `[Console]::Out.WriteLine("$yo${SEP}$ses")`,
].join('\n');

/** Cierre amable de la ventana principal del proceso `pid` (entero ya validado). */
export function scriptCerrarVentana(pid: number): string {
  if (!Number.isInteger(pid) || pid <= 0) throw new Error(`PID no válido: ${pid}`);
  return [
    "$ErrorActionPreference = 'Stop'",
    '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
    '$ses = [System.Diagnostics.Process]::GetCurrentProcess().SessionId',
    `$w = Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'`,
    "if (-not $w -or $w.SessionId -ne $ses) { [Console]::Out.Write('NO'); exit 0 }",
    '$o = Invoke-CimMethod -InputObject $w -MethodName GetOwnerSid -ErrorAction SilentlyContinue',
    "if (-not $o -or $o.Sid -ne $yo) { [Console]::Out.Write('NO'); exit 0 }",
    `$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue`,
    "if (-not $p -or $p.MainWindowHandle -eq 0) { [Console]::Out.Write('NO'); exit 0 }",
    "if ($p.CloseMainWindow()) { [Console]::Out.Write('SI') } else { [Console]::Out.Write('NO') }",
  ].join('\n');
}

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

function deBase64(t: string): string | null {
  if (t === '') return null;
  if (!BASE64.test(t)) return null;
  const s = Buffer.from(t, 'base64').toString('utf8');
  return s.includes('\0') ? null : s;
}

/** Interpreta la salida de `SCRIPT_PROCESOS_USUARIO`; las líneas raras se ignoran. */
export function interpretarProcesosUsuario(salida: string): ProcesoUsuario[] {
  const res: ProcesoUsuario[] = [];
  for (const linea of salida.split(/\r?\n/)) {
    const t = linea.trim();
    if (t === '') continue;
    const c = t.split(SEP);
    if (c.length !== 8) continue;
    const [pid, sesion, inicio, memoria, ventana, servicio, nombre, ruta] = c as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    if (!/^\d+$/.test(pid) || !/^\d+$/.test(sesion)) continue;
    const n = deBase64(nombre);
    if (n === null) continue;
    const r = deBase64(ruta);
    res.push({
      pid: Number(pid),
      nombre: n,
      ruta: r !== null && path.win32.isAbsolute(r) ? r : null,
      inicio: /^\d+$/.test(inicio) ? inicio : null,
      memoria: /^\d+$/.test(memoria) ? Number(memoria) : 0,
      ventana: ventana === '1',
      sesion: Number(sesion),
      // El script solo deja pasar los del usuario actual; la identidad real se compara aparte.
      usuario: '',
      servicio: servicio === '1',
    });
  }
  return res;
}

export class ProcesosUsuarioWindows {
  constructor(
    private readonly ejecutar: Ejecutor,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  /** Usuario y sesión actuales; falla si no se pueden leer (sin ellos no se propone nada). */
  async identidad(): Promise<IdentidadUsuario> {
    const r = await this.ejecutar(rutaPowerShell(this.env), codificarPowerShell(SCRIPT_IDENTIDAD), {
      timeoutMs: 20_000,
    });
    const m = /^(S-[0-9-]+)\|(\d+)$/.exec(r.stdout.trim());
    if (r.codigo !== 0 || !m) throw new Error('No se pudo leer el usuario actual.');
    return { usuario: m[1]!, sesion: Number(m[2]) };
  }

  /** Solo lectura. Sin poder leer, lista vacía (nunca se propone nada a ciegas). */
  async listar(): Promise<ProcesoUsuario[]> {
    try {
      const yo = await this.identidad();
      const r = await this.ejecutar(
        rutaPowerShell(this.env),
        codificarPowerShell(SCRIPT_PROCESOS_USUARIO),
        { timeoutMs: 60_000 },
      );
      if (r.codigo !== 0) return [];
      return interpretarProcesosUsuario(r.stdout)
        .filter((p) => p.sesion === yo.sesion)
        .map((p) => ({ ...p, usuario: yo.usuario }));
    } catch {
      return [];
    }
  }

  /** Cierre amable por PID: nunca termina el proceso. */
  async cerrarVentana(pid: number): Promise<boolean> {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
      const r = await this.ejecutar(
        rutaPowerShell(this.env),
        codificarPowerShell(scriptCerrarVentana(pid)),
        { timeoutMs: 20_000 },
      );
      return r.codigo === 0 && r.stdout.trim() === 'SI';
    } catch {
      return false;
    }
  }

  /** Carpetas del sistema y del antivirus integrado que nunca se tocan. */
  rutasProtegidas(): string[] {
    const e = this.env;
    const windir = e.SystemRoot ?? e.SYSTEMROOT ?? e.windir ?? 'C:\\Windows';
    const pf = e.ProgramFiles ?? 'C:\\Program Files';
    const pf86 = e['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
    const pd = e.ProgramData ?? 'C:\\ProgramData';
    return [
      windir,
      path.win32.join(pf, 'Windows Defender'),
      path.win32.join(pf, 'Windows Defender Advanced Threat Protection'),
      path.win32.join(pf86, 'Windows Defender'),
      path.win32.join(pd, 'Microsoft', 'Windows Defender'),
    ];
  }
}

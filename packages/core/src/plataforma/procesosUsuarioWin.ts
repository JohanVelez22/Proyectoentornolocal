import path from 'node:path';
import { ErrorWolf } from '../errores';
import { codificarPowerShell } from './pathUsuarioWin';
import { interpretarNetstatEstablecidas, interpretarNetstatTodos } from './netstat';
import { rutaPowerShell, rutaSistema32 } from './procesosWin';
import type { ConexionActiva, Ejecutor, IdentidadUsuario, ProcesoUsuario } from './tipos';

/**
 * Procesos del usuario actual para liberar memoria (D54b).
 *
 * - `listar` y `identidad` SOLO LEEN (`Get-CimInstance Win32_Process` filtrado por la sesión y el
 *   SID del usuario actual, sin servicios de Windows).
 * - Aquí no hay ni habrá `taskkill`, `Stop-Process`, `TerminateProcess`, `Process.Kill` ni cierre de
 *   ventanas: lo guarda una prueba que lee este archivo.
 *
 * PowerShell va por ruta absoluta de System32 (nunca del PATH ni de la carpeta actual).
 */

const SEP = '|';

/**
 * Una línea por proceso: pid|sesion|inicio|memoria|privada|ventana|servicio|elevado|nombre(b64)|ruta(b64).
 * `sesion` es la del proceso actual, ya validada como entero (va en el filtro de la consulta, que
 * se hace en WMI y no procesando todo con `Where-Object`).
 *
 * `privada`: conjunto de trabajo privado (`WorkingSetPrivate` del contador de rendimiento por
 * clase WMI, cuyos nombres de propiedad no se traducen), sin administrador; vacío si no se pudo
 * leer. Es lo que de verdad quedaría libre al vaciar el proceso; `memoria` incluye lo compartido.
 *
 * `elevado`: para TODOS los procesos del usuario, con o sin ventana (uno elevado sin ventana
 * también es inalcanzable). Un proceso que este usuario no puede abrir con todos los derechos
 * (`Process.Handle` falla con acceso denegado) es uno elevado o protegido: no se puede ni
 * inspeccionar ni vaciar ni cerrarle la ventana (UIPI), y se trata como protegido. (`StartTime` no
 * sirve: solo pide PROCESS_QUERY_LIMITED_INFORMATION y no falla.) Leer el nivel de integridad del
 * token exigiría P/Invoke de más y no aporta nada a esta decisión.
 */
export function scriptProcesosUsuario(sesion: number): string {
  if (!Number.isInteger(sesion) || sesion < 0) throw new Error(`Sesión no válida: ${sesion}`);
  return [
    "$ErrorActionPreference = 'Stop'",
    '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
    '$serv = @{}',
    `Get-CimInstance Win32_Service -Filter "State='Running'" | ForEach-Object { $serv[[int]$_.ProcessId] = 1 }`,
    '$priv = @{}',
    'try { Get-CimInstance Win32_PerfRawData_PerfProc_Process | ForEach-Object { $priv[[int]$_.IDProcess] = [int64]$_.WorkingSetPrivate } } catch { }',
    '$vent = @{}',
    'Get-Process | ForEach-Object { if ($_.MainWindowHandle -ne 0) { $vent[[int]$_.Id] = 1 } }',
    'function B($t) { if ($t) { [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$t)) } else { "" } }',
    `Get-CimInstance Win32_Process -Filter "SessionId=${sesion}" | ForEach-Object {`,
    '  $o = Invoke-CimMethod -InputObject $_ -MethodName GetOwnerSid -ErrorAction SilentlyContinue',
    '  if ($o -and $o.Sid -eq $yo) {',
    '    $c = ""; if ($_.CreationDate) { $c = $_.CreationDate.ToFileTimeUtc() }',
    '    $v = 0; if ($vent.ContainsKey([int]$_.ProcessId)) { $v = 1 }',
    '    $s = 0; if ($serv.ContainsKey([int]$_.ProcessId)) { $s = 1 }',
    '    $pv = ""; if ($priv.ContainsKey([int]$_.ProcessId)) { $pv = $priv[[int]$_.ProcessId] }',
    '    $e = 0',
    '    try { $pr = [System.Diagnostics.Process]::GetProcessById([int]$_.ProcessId); try { $null = $pr.Handle } finally { $pr.Dispose() } } catch { $e = 1 }',
    `    [Console]::Out.WriteLine(($_.ProcessId, $_.SessionId, $c, $_.WorkingSetSize, $pv, $v, $s, $e, (B $_.Name), (B $_.ExecutablePath)) -join '${SEP}')`,
    '  }',
    '}',
  ].join('\n');
}

/** `sid|sesion` del proceso actual. */
export const SCRIPT_IDENTIDAD = [
  "$ErrorActionPreference = 'Stop'",
  '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
  '$ses = [System.Diagnostics.Process]::GetCurrentProcess().SessionId',
  `[Console]::Out.WriteLine("$yo${SEP}$ses")`,
].join('\n');

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
    if (c.length !== 10) continue;
    const [pid, sesion, inicio, memoria, privada, ventana, servicio, elevado, nombre, ruta] = c as [
      string,
      string,
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
      memoriaPrivada: /^\d+$/.test(privada) ? Number(privada) : null,
      ventana: ventana === '1',
      sesion: Number(sesion),
      // El script solo deja pasar los del usuario actual; la identidad real se compara aparte.
      usuario: '',
      servicio: servicio === '1',
      elevado: elevado === '1',
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
    if (r.codigo !== 0 || !m) {
      throw new ErrorWolf('memoria.no_disponible', 'No se pudo leer el usuario actual.');
    }
    return { usuario: m[1]!, sesion: Number(m[2]) };
  }

  /**
   * Solo lectura. Si no se puede leer FALLA (nunca se propone nada a ciegas): quien llama lo
   * trata como "listado fallido" y lo dice, en lugar de mostrar una lista vacía que parece cierta.
   */
  async listar(): Promise<ProcesoUsuario[]> {
    try {
      const yo = await this.identidad();
      const r = await this.ejecutar(
        rutaPowerShell(this.env),
        codificarPowerShell(scriptProcesosUsuario(yo.sesion)),
        { timeoutMs: 60_000 },
      );
      if (r.codigo !== 0) throw new Error(r.stderr.trim());
      return interpretarProcesosUsuario(r.stdout)
        .filter((p) => p.sesion === yo.sesion)
        .map((p) => ({ ...p, usuario: yo.usuario }));
    } catch (e) {
      if (e instanceof ErrorWolf) throw e;
      throw new ErrorWolf('memoria.no_disponible', 'No se pudieron leer los procesos del usuario.');
    }
  }

  /**
   * Hora de inicio (`ToFileTimeUtc`, como `ProcesoUsuario.inicio`) del PID, o null si no existe.
   * Falla si no se puede consultar.
   */
  async inicioDe(pid: number): Promise<string | null> {
    if (!Number.isInteger(pid) || pid <= 0) {
      throw new ErrorWolf('memoria.no_disponible', 'PID no válido.');
    }
    try {
      const script = [
        "$ErrorActionPreference = 'Stop'",
        `$w = Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'`,
        `if (-not $w) { [Console]::Out.Write('NO_EXISTE'); exit 0 }`,
        `if (-not $w.CreationDate) { exit 3 }`,
        '[Console]::Out.Write($w.CreationDate.ToFileTimeUtc())',
      ].join('\n');
      const r = await this.ejecutar(rutaPowerShell(this.env), codificarPowerShell(script), {
        timeoutMs: 20_000,
      });
      if (r.codigo !== 0) throw new Error(r.stderr.trim());
      const t = r.stdout.trim();
      if (t === 'NO_EXISTE') return null;
      if (/^\d+$/.test(t)) return t;
      throw new Error('salida inesperada');
    } catch {
      throw new ErrorWolf('memoria.no_disponible', 'No se pudo consultar el proceso.');
    }
  }

  /**
   * Conexiones TCP en curso (`netstat -ano`, sin `-p`: `-p TCP` solo lista IPv4 y un cliente en
   * `[::1]` quedaría sin verse); falla si no se pueden leer o la salida no parece completa.
   */
  async conexiones(): Promise<ConexionActiva[]> {
    try {
      const r = await this.ejecutar(rutaSistema32(this.env, 'NETSTAT.EXE'), ['-ano'], {
        timeoutMs: 15_000,
      });
      // Una salida parcial (código de error) o sin una sola fila TCP no es una lectura completa.
      if (r.codigo !== 0) throw new Error(r.stderr.trim());
      const enCurso = interpretarNetstatEstablecidas(r.stdout);
      const escuchando = interpretarNetstatTodos(r.stdout).filter((f) => f.protocolo === 'TCP');
      if (enCurso.length + escuchando.length === 0) throw new Error('sin filas TCP');
      return enCurso;
    } catch {
      throw new ErrorWolf('memoria.no_disponible', 'No se pudieron leer las conexiones.');
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

import path from 'node:path';
import { ErrorWolf } from '../errores';
import { codificarPowerShell } from './pathUsuarioWin';
import { interpretarNetstatEstablecidas, interpretarNetstatTodos } from './netstat';
import { rutaPowerShell, rutaSistema32 } from './procesosWin';
import type {
  ConexionActiva,
  Ejecutor,
  EstadoCierre,
  IdentidadUsuario,
  ProcesoUsuario,
} from './tipos';

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

/** Lo que el script de cierre dice por la salida estándar. */
const SALIDAS_CIERRE: Readonly<Record<string, EstadoCierre>> = {
  CERRADO: 'cerrado-pedido',
  CAMBIO: 'cambio',
  SIN_VENTANA: 'sin-ventana',
  NO_SE_PUDO: 'no-se-pudo',
};

/**
 * Cierre amable de la ventana principal del proceso `pid` (entero ya validado). Todo se comprueba
 * DENTRO del mismo script y justo antes de `CloseMainWindow`, sin que nada vuelva a Node entre una
 * cosa y otra: la sesión y el dueño, la hora de creación (`inicio`, entero de `ToFileTimeUtc`), la
 * ruta del ejecutable (`ruta`, en base64), que no sea un servicio y, con el propio objeto
 * `Process` que va a recibir el cierre, la hora de inicio otra vez. Salida: CERRADO (se pidió),
 * CAMBIO (no es el mismo proceso), SIN_VENTANA o NO_SE_PUDO (no se pudo abrir o pedir: elevado).
 */
export function scriptCerrarVentana(pid: number, inicio: string, ruta: string): string {
  if (!Number.isInteger(pid) || pid <= 0) throw new Error(`PID no válido: ${pid}`);
  if (!/^[1-9]\d{0,18}$/.test(inicio) || BigInt(inicio) > 9223372036854775807n) {
    throw new Error('Hora de inicio no válida.');
  }
  if (ruta === '' || ruta.includes('\0')) throw new Error('Ruta no válida.');
  const rutaB64 = Buffer.from(ruta, 'utf8').toString('base64');
  const salida = (clave: string): string => `[Console]::Out.Write('${clave}'); exit 0`;
  return [
    "$ErrorActionPreference = 'Stop'",
    '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
    '$ses = [System.Diagnostics.Process]::GetCurrentProcess().SessionId',
    `$w = Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'`,
    `if (-not $w -or $w.SessionId -ne $ses) { ${salida('CAMBIO')} }`,
    '$o = Invoke-CimMethod -InputObject $w -MethodName GetOwnerSid -ErrorAction SilentlyContinue',
    `if (-not $o -or $o.Sid -ne $yo) { ${salida('CAMBIO')} }`,
    '$c = 0; if ($w.CreationDate) { $c = $w.CreationDate.ToFileTimeUtc() }',
    `if ($c -ne [int64]${inicio}) { ${salida('CAMBIO')} }`,
    `$ruta = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${rutaB64}'))`,
    `if (-not $w.ExecutablePath -or $w.ExecutablePath -ine $ruta) { ${salida('CAMBIO')} }`,
    `if (Get-CimInstance Win32_Service -Filter 'ProcessId=${pid}') { ${salida('CAMBIO')} }`,
    `$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue`,
    `if (-not $p -or $p.MainWindowHandle -eq 0) { ${salida('SIN_VENTANA')} }`,
    `try { $null = $p.Handle } catch { ${salida('NO_SE_PUDO')} }`,
    `try { $t = $p.StartTime.ToFileTimeUtc() } catch { ${salida('NO_SE_PUDO')} }`,
    `if ([math]::Abs($t - [int64]${inicio}) -gt 100000) { ${salida('CAMBIO')} }`,
    `if ($p.CloseMainWindow()) { ${salida('CERRADO')} } else { ${salida('NO_SE_PUDO')} }`,
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
   * Cierre amable por PID, comprobando dentro del mismo script el mismo proceso (hora de inicio y
   * ruta). Nunca termina el proceso. Ante cualquier fallo: `no-se-pudo`.
   */
  async cerrarVentana(pid: number, inicio: string, ruta: string): Promise<EstadoCierre> {
    let script: string;
    try {
      script = scriptCerrarVentana(pid, inicio, ruta);
    } catch {
      return 'no-se-pudo';
    }
    try {
      const r = await this.ejecutar(rutaPowerShell(this.env), codificarPowerShell(script), {
        timeoutMs: 20_000,
      });
      if (r.codigo !== 0) return 'no-se-pudo';
      return SALIDAS_CIERRE[r.stdout.trim()] ?? 'no-se-pudo';
    } catch {
      return 'no-se-pudo';
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

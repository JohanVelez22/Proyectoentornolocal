import type { MemoriaSistema, ObjetivoVaciado, ResultadoVaciadoProceso } from './tipos';

/**
 * Liberar memoria en Windows (D54b). Tres piezas, todas con la PowerShell de System32 por ruta
 * absoluta y `-EncodedCommand` (las arma `win.ts`):
 *
 * - `SCRIPT_MEMORIA_SISTEMA`: SOLO LEE la memoria física (total, disponible, libre y lista de
 *   espera) con CIM, sin contadores de rendimiento (sus nombres se traducen y fallan en otros
 *   idiomas de Windows).
 * - `scriptVaciarWorkingSets`: vacía el conjunto de trabajo (`EmptyWorkingSet`) de los PIDs que se
 *   le dan, SIN elevar. Antes de cada uno comprueba, dentro del mismo script, sesión, dueño (SID),
 *   hora de creación y que no sea un servicio. No hay ni habrá aquí `taskkill`, `Stop-Process`,
 *   `TerminateProcess` ni `Process.Kill`: lo guarda una prueba que lee este archivo.
 * - `scriptPurgarListaEspera`: ELEVADO. Vacía la lista de espera y la caché de archivos del
 *   sistema. No devuelve nada (no escribe archivos ni el registro): la app mide después, sin
 *   elevar, cuánta memoria quedó libre.
 */

const SEP = '|';

export const SCRIPT_MEMORIA_SISTEMA = [
  "$ErrorActionPreference = 'Stop'",
  '$total = [int64](Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory',
  '$disp = [int64](Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory * 1024',
  "$libre = ''; $espera = ''",
  'try {',
  '  $m = Get-CimInstance Win32_PerfRawData_PerfOS_Memory',
  '  $libre = [int64]$m.FreeAndZeroPageListBytes',
  '  $espera = [int64]$m.StandbyCacheNormalPriorityBytes + [int64]$m.StandbyCacheReserveBytes + [int64]$m.StandbyCacheCoreBytes',
  '} catch { }',
  `[Console]::Out.WriteLine(($total, $disp, $libre, $espera) -join '${SEP}')`,
].join('\n');

const ENTERO = /^\d{1,15}$/;

/** `total|disponible|libre|espera` → memoria del sistema; null si algo no cuadra (nada se inventa). */
export function interpretarMemoriaSistema(salida: string): MemoriaSistema | null {
  const p = salida.trim().split(SEP);
  if (p.length !== 4 || !ENTERO.test(p[0]!) || !ENTERO.test(p[1]!)) return null;
  const total = Number(p[0]);
  const disponible = Number(p[1]);
  if (total <= 0 || disponible > total) return null;
  const opcional = (t: string): number | null =>
    ENTERO.test(t) && Number(t) <= total ? Number(t) : null;
  return { total, disponible, libre: opcional(p[2]!), listaEspera: opcional(p[3]!) };
}

const MAX_OBJETIVOS = 400;

/**
 * Una línea por PID: `pid|ESTADO|antes|despues` (bytes del conjunto de trabajo). ESTADO: VACIADO,
 * CAMBIO (no es el mismo proceso: otro dueño o sesión, otra hora de inicio o es un servicio) o
 * NO_SE_PUDO (no se pudo abrir con ese derecho: elevado o protegido).
 */
export function scriptVaciarWorkingSets(objetivos: ObjetivoVaciado[]): string {
  if (objetivos.length > MAX_OBJETIVOS) throw new Error('Demasiados procesos.');
  for (const o of objetivos) {
    if (!Number.isInteger(o.pid) || o.pid <= 4) throw new Error(`PID no válido: ${o.pid}`);
    if (!/^[1-9]\d{0,18}$/.test(o.inicio) || BigInt(o.inicio) > 9223372036854775807n) {
      throw new Error('Hora de inicio no válida.');
    }
  }
  const lista = objetivos.map((o) => `@(${o.pid}, [int64]${o.inicio})`).join(', ');
  const linea = (estado: string, antes = '0', despues = '0'): string =>
    `[Console]::Out.WriteLine(($pid_, '${estado}', ${antes}, ${despues}) -join '${SEP}')`;
  return [
    "$ErrorActionPreference = 'Stop'",
    `Add-Type -Namespace Wolf -Name Ws -MemberDefinition '[DllImport("kernel32.dll", SetLastError=true)] public static extern IntPtr OpenProcess(uint a, bool h, int p); [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h); [DllImport("psapi.dll", SetLastError=true)] public static extern bool EmptyWorkingSet(IntPtr h);'`,
    '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
    '$ses = [System.Diagnostics.Process]::GetCurrentProcess().SessionId',
    `$objetivos = @(${lista})`,
    'foreach ($x in $objetivos) {',
    '  $pid_ = [int]$x[0]; $ini = [int64]$x[1]',
    '  try {',
    '    $w = Get-CimInstance Win32_Process -Filter "ProcessId=$pid_"',
    `    if (-not $w -or $w.SessionId -ne $ses) { ${linea('CAMBIO')}; continue }`,
    '    $o = Invoke-CimMethod -InputObject $w -MethodName GetOwnerSid -ErrorAction SilentlyContinue',
    `    if (-not $o -or $o.Sid -ne $yo) { ${linea('CAMBIO')}; continue }`,
    '    $c = 0; if ($w.CreationDate) { $c = $w.CreationDate.ToFileTimeUtc() }',
    `    if ($c -ne $ini) { ${linea('CAMBIO')}; continue }`,
    `    if (Get-CimInstance Win32_Service -Filter "ProcessId=$pid_") { ${linea('CAMBIO')}; continue }`,
    '    $p = [System.Diagnostics.Process]::GetProcessById($pid_)',
    '    $antes = [int64]$p.WorkingSet64',
    '    $h = [Wolf.Ws]::OpenProcess(0x1100, $false, $pid_)',
    `    if ($h -eq [IntPtr]::Zero) { ${linea('NO_SE_PUDO', '$antes', '$antes')}; continue }`,
    '    try { $null = [Wolf.Ws]::EmptyWorkingSet($h) } finally { $null = [Wolf.Ws]::CloseHandle($h) }',
    '    $p.Refresh()',
    `    ${linea('VACIADO', '$antes', '[int64]$p.WorkingSet64')}`,
    `  } catch { ${linea('NO_SE_PUDO')} }`,
    '}',
  ].join('\n');
}

const ESTADOS: Readonly<Record<string, ResultadoVaciadoProceso['estado']>> = {
  VACIADO: 'vaciado',
  CAMBIO: 'cambio',
  NO_SE_PUDO: 'no-se-pudo',
};

/** Solo valen las líneas de los PIDs pedidos y con el formato esperado; lo demás se ignora. */
export function interpretarVaciado(
  salida: string,
  objetivos: ObjetivoVaciado[],
): ResultadoVaciadoProceso[] {
  const pedidos = new Set(objetivos.map((o) => o.pid));
  const vistos = new Set<number>();
  const res: ResultadoVaciadoProceso[] = [];
  for (const l of salida.split(/\r?\n/)) {
    const p = l.trim().split(SEP);
    if (p.length !== 4 || !/^\d{1,10}$/.test(p[0]!) || !ENTERO.test(p[2]!) || !ENTERO.test(p[3]!)) {
      continue;
    }
    const pid = Number(p[0]);
    const estado = ESTADOS[p[1]!];
    if (!estado || !pedidos.has(pid) || vistos.has(pid)) continue;
    vistos.add(pid);
    res.push({ pid, estado, antes: Number(p[2]), despues: Number(p[3]) });
  }
  return res;
}

/** Salidas propias del script elevado de la purga (fuera de los rangos de hosts y servicios). */
export const SALIDA_PURGA = {
  /** No se pudo activar un privilegio (la cuenta no es administradora, o Windows lo niega). */
  privilegio: 41,
  /** `NtSetSystemInformation` no vació la lista de espera. */
  listaEspera: 42,
  /** La lista de espera se vació, pero no la caché de archivos del sistema. */
  cacheArchivos: 43,
} as const;

/**
 * Comando ELEVADO (corto, de tamaño fijo, sin entradas del usuario): activa los privilegios
 * `SeProfileSingleProcessPrivilege` y `SeIncreaseQuotaPrivilege` de su propio token, vacía la lista
 * de espera (`NtSetSystemInformation`, `SystemMemoryListInformation`, `MemoryPurgeStandbyList`) y
 * la caché de archivos (`SetSystemFileCacheSize(-1, -1, 0)`). No toca ningún proceso, no escribe
 * nada y no devuelve datos: solo su código de salida.
 */
export function scriptPurgarListaEspera(): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    `Add-Type -Namespace Wolf -Name Pur -MemberDefinition '[DllImport("ntdll.dll")] public static extern int NtSetSystemInformation(int c, ref int i, int l); [DllImport("kernel32.dll")] public static extern bool SetSystemFileCacheSize(IntPtr a, IntPtr b, int f); [DllImport("advapi32.dll", SetLastError=true)] public static extern bool OpenProcessToken(IntPtr h, int a, out IntPtr t); [DllImport("advapi32.dll", CharSet=CharSet.Unicode)] public static extern bool LookupPrivilegeValue(string s, string n, out long l); [DllImport("advapi32.dll", SetLastError=true)] public static extern bool AdjustTokenPrivileges(IntPtr t, bool d, ref TP n, int l, IntPtr p, IntPtr r); [StructLayout(LayoutKind.Sequential, Pack=1)] public struct TP { public int Count; public long Luid; public int Attr; }'`,
    '$t = [IntPtr]::Zero',
    `if (-not [Wolf.Pur]::OpenProcessToken([System.Diagnostics.Process]::GetCurrentProcess().Handle, 0x28, [ref]$t)) { exit ${SALIDA_PURGA.privilegio} }`,
    'function Activar-Privilegio($nombre) {',
    '  $tp = New-Object Wolf.Pur+TP; $tp.Count = 1; $tp.Attr = 2',
    '  $l = [int64]0',
    '  if (-not [Wolf.Pur]::LookupPrivilegeValue($null, $nombre, [ref]$l)) { return $false }',
    '  $tp.Luid = $l',
    '  $null = [Wolf.Pur]::AdjustTokenPrivileges($t, $false, [ref]$tp, 0, [IntPtr]::Zero, [IntPtr]::Zero)',
    '  return ([System.Runtime.InteropServices.Marshal]::GetLastWin32Error() -eq 0)',
    '}',
    `if (-not (Activar-Privilegio 'SeProfileSingleProcessPrivilege')) { exit ${SALIDA_PURGA.privilegio} }`,
    '$orden = 4',
    `if ([Wolf.Pur]::NtSetSystemInformation(80, [ref]$orden, 4) -ne 0) { exit ${SALIDA_PURGA.listaEspera} }`,
    "if (-not (Activar-Privilegio 'SeIncreaseQuotaPrivilege')) { exit " +
      `${SALIDA_PURGA.cacheArchivos} }`,
    `if (-not [Wolf.Pur]::SetSystemFileCacheSize([IntPtr]::new(-1), [IntPtr]::new(-1), 0)) { exit ${SALIDA_PURGA.cacheArchivos} }`,
    'exit 0',
  ].join('\n');
}

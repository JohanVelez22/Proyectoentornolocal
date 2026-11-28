import { FIRMAS, lineasPInvoke } from './pinvokeWin';
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
/** Plazo propio del script de vaciado: al vencer se para y devuelve lo ya hecho (< el de Node). */
export const PLAZO_VACIADO_MS = 90_000;

/**
 * Una línea por PID: `pid|ESTADO|antes|despues` (bytes del conjunto de trabajo). ESTADO: VACIADO,
 * CAMBIO (no es el mismo proceso: otro dueño o sesión, otra hora de inicio o es un servicio) o
 * NO_SE_PUDO (no se pudo abrir con ese derecho: elevado o protegido).
 *
 * Win32_Process y Win32_Service se leen UNA vez al principio (no una consulta por proceso). La
 * hora de creación se comprueba sobre el MISMO handle que recibe `EmptyWorkingSet`, abierto antes
 * (mientras el handle esté abierto el PID no se puede reutilizar). Si se acaba el plazo, el script
 * deja de vaciar y sale bien: lo que ya imprimió es lo hecho y el resto no se cuenta.
 */
export function scriptVaciarWorkingSets(
  objetivos: ObjetivoVaciado[],
  plazoMs = PLAZO_VACIADO_MS,
): string {
  if (objetivos.length > MAX_OBJETIVOS) throw new Error('Demasiados procesos.');
  if (!Number.isInteger(plazoMs) || plazoMs < 1000 || plazoMs > 600_000) {
    throw new Error('Plazo no válido.');
  }
  for (const o of objetivos) {
    if (!Number.isInteger(o.pid) || o.pid <= 4) throw new Error(`PID no válido: ${o.pid}`);
    if (!/^[1-9]\d{0,18}$/.test(o.inicio) || BigInt(o.inicio) > 9223372036854775807n) {
      throw new Error('Hora de inicio no válida.');
    }
  }
  // Cadenas `pid:inicio`: un `@(@(a, b))` de un solo objetivo se aplanaría y fallaría.
  const lista = objetivos.map((o) => `'${o.pid}:${o.inicio}'`).join(', ');
  const linea = (estado: string, antes = '0', despues = '0'): string =>
    `[Console]::Out.WriteLine(($pid_, '${estado}', ${antes}, ${despues}) -join '${SEP}')`;
  return [
    "$ErrorActionPreference = 'Stop'",
    ...lineasPInvoke('Ws', 'WolfWs', FIRMAS.procesos),
    '$yo = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
    '$ses = [System.Diagnostics.Process]::GetCurrentProcess().SessionId',
    `$objetivos = @(${lista})`,
    '$reloj = [System.Diagnostics.Stopwatch]::StartNew()',
    '$procs = @{}',
    'Get-CimInstance Win32_Process -Filter "SessionId=$ses" | ForEach-Object { $procs[[int]$_.ProcessId] = $_ }',
    '$serv = @{}',
    `Get-CimInstance Win32_Service -Filter "State='Running'" | ForEach-Object { $serv[[int]$_.ProcessId] = 1 }`,
    'foreach ($x in $objetivos) {',
    `  if ($reloj.ElapsedMilliseconds -gt ${plazoMs}) { break }`,
    '  $q = $x.Split([char]58); $pid_ = [int]$q[0]; $ini = [int64]$q[1]',
    '  $h = [IntPtr]::Zero',
    '  try {',
    '    $w = $procs[$pid_]',
    `    if (-not $w) { ${linea('CAMBIO')}; continue }`,
    '    $o = Invoke-CimMethod -InputObject $w -MethodName GetOwnerSid -ErrorAction SilentlyContinue',
    `    if (-not $o -or $o.Sid -ne $yo) { ${linea('CAMBIO')}; continue }`,
    '    $c = 0; if ($w.CreationDate) { $c = $w.CreationDate.ToFileTimeUtc() }',
    `    if ($c -ne $ini) { ${linea('CAMBIO')}; continue }`,
    `    if ($serv.ContainsKey($pid_)) { ${linea('CAMBIO')}; continue }`,
    // Primero el handle; la hora de creación se lee de ESE handle justo antes de vaciar.
    '    $h = $Ws::OpenProcess(0x1100, $false, $pid_)',
    `    if ($h -eq [IntPtr]::Zero) { ${linea('NO_SE_PUDO')}; continue }`,
    '    $a = [int64]0; $b = [int64]0; $k = [int64]0; $u = [int64]0',
    `    if (-not $Ws::GetProcessTimes($h, [ref]$a, [ref]$b, [ref]$k, [ref]$u)) { ${linea('NO_SE_PUDO')}; continue }`,
    // El CIM redondea a microsegundos; el handle da cien nanosegundos: se admite una décima de segundo.
    `    if ([math]::Abs($a - $ini) -gt 1000000) { ${linea('CAMBIO')}; continue }`,
    '    $p = [System.Diagnostics.Process]::GetProcessById($pid_)',
    '    $antes = [int64]$p.WorkingSet64',
    '    $null = $Ws::EmptyWorkingSet($h)',
    '    $p.Refresh()',
    `    ${linea('VACIADO', '$antes', '[int64]$p.WorkingSet64')}`,
    `  } catch { ${linea('NO_SE_PUDO')} } finally { if ($h -ne [IntPtr]::Zero) { $null = $Ws::CloseHandle($h) } }`,
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

/** Privilegios que se piden con `RtlAdjustPrivilege` (números de ntdll, sin cadenas ni LUID). */
const PRIVILEGIO_CUOTA = 5; // SeIncreaseQuotaPrivilege
const PRIVILEGIO_PERFIL = 13; // SeProfileSingleProcessPrivilege

/**
 * Comando ELEVADO (corto, de tamaño fijo, sin entradas del usuario): activa los privilegios
 * `SeIncreaseQuotaPrivilege` y `SeProfileSingleProcessPrivilege` de su propio token
 * (`RtlAdjustPrivilege`), vacía PRIMERO la caché de archivos (`SetSystemFileCacheSize(-1, -1, 0)`)
 * y DESPUÉS la lista de espera (`NtSetSystemInformation`, `SystemMemoryListInformation`,
 * `MemoryPurgeStandbyList`): así lo que la caché suelta también sale de la lista. Si la caché falla
 * se sigue con la lista y al final sale con `cacheArchivos`. No toca ningún proceso, no escribe
 * nada y no devuelve datos: solo su código de salida. El P/Invoke es en memoria
 * (`System.Reflection.Emit`): sin `Add-Type`, sin compilador y sin archivos en %TEMP%.
 */
export function scriptPurgarListaEspera(): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    ...lineasPInvoke('Pur', 'WolfPur', FIRMAS.purga),
    'function Activar-Privilegio([int]$numero) {',
    '  $antes = [byte]0',
    '  return ($Pur::RtlAdjustPrivilege($numero, 1, 0, [ref]$antes) -eq 0)',
    '}',
    '$cache = $false',
    `if (Activar-Privilegio ${PRIVILEGIO_CUOTA}) { $cache = $Pur::SetSystemFileCacheSize([IntPtr]::new(-1), [IntPtr]::new(-1), 0) }`,
    `if (-not (Activar-Privilegio ${PRIVILEGIO_PERFIL})) { exit ${SALIDA_PURGA.privilegio} }`,
    '$orden = 4',
    `if ($Pur::NtSetSystemInformation(80, [ref]$orden, 4) -ne 0) { exit ${SALIDA_PURGA.listaEspera} }`,
    `if (-not $cache) { exit ${SALIDA_PURGA.cacheArchivos} }`,
    'exit 0',
  ].join('\n');
}

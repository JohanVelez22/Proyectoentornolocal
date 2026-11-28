import { literalPowerShell } from './literalPowerShell';
import { createHash } from 'node:crypto';
import type { ResultadoEscritura } from './tipos';

/** Prefijo de los temporales de hosts en %TEMP% (`pel-hosts-<pid>-…`). */
export const PREFIJO_TEMPORAL_HOSTS = 'pel-hosts-';
/** Prefijo propio de los temporales de la lectura de discos (`pel-discos-<pid>-…`). */
export const PREFIJO_TEMPORAL_DISCOS = 'pel-discos-';

export const sha256 = (b: Buffer | string): string =>
  createHash('sha256').update(b).digest('hex').toUpperCase();

/** Códigos de salida del script elevado. */
export const SALIDA_COPIA = {
  ok: 0,
  /** El usuario contestó "No" al UAC (ERROR_CANCELLED, 1223). */
  cancelado: 10,
  vencido: 11,
  sinTemporal: 12,
  temporalAlterado: 13,
  hostsCambiado: 14,
  /** Windows o un antivirus ("proteger hosts") no deja escribir, aun elevado. */
  denegado: 15,
  /** Otro programa tiene hosts abierto en exclusiva. */
  enUso: 16,
  /**
   * El lanzador sin elevar (la PowerShell de la app) ya no existe: la app dejó de esperar (plazo
   * vencido, cancelada o cerrada) y este permiso se aceptó tarde. Sale sin hacer nada (F7).
   */
  huerfano: 17,
} as const;

/** Salidas propias del script que detiene un servicio del sistema (fuera del rango de hosts). */
export const SALIDA_SERVICIO = {
  /** El servicio no llegó a STOPPED dentro del plazo. */
  plazo: 31,
  /** No existe, no se puede detener o falló al detenerse. */
  fallo: 32,
  /**
   * Hay servicios en marcha que dependen de él: `ServiceController.Stop()` los detendría también,
   * así que no se detiene nada y el usuario decide.
   */
  dependientes: 33,
} as const;

export const MOTIVO_SALIDA_SERVICIO: Record<number, ResultadoEscritura> = {
  [SALIDA_SERVICIO.plazo]: {
    ok: false,
    motivo: 'error',
    detalle: 'el servicio no se detuvo a tiempo',
  },
  [SALIDA_SERVICIO.fallo]: {
    ok: false,
    motivo: 'error',
    detalle: 'no se pudo detener el servicio',
  },
  [SALIDA_SERVICIO.dependientes]: {
    ok: false,
    motivo: 'error',
    detalle: 'hay otros servicios en marcha que dependen de este; no se detuvo nada',
  },
};

/** Cómo se informa cada salida del script (0 se confirma leyendo el archivo). */
export const MOTIVO_SALIDA_COPIA: Record<number, ResultadoEscritura> = {
  [SALIDA_COPIA.cancelado]: { ok: false, motivo: 'cancelado' },
  [SALIDA_COPIA.vencido]: { ok: false, motivo: 'tiempo' },
  [SALIDA_COPIA.huerfano]: { ok: false, motivo: 'tiempo' },
  [SALIDA_COPIA.sinTemporal]: {
    ok: false,
    motivo: 'error',
    detalle: 'el archivo temporal ya no estaba; no se copió nada',
  },
  [SALIDA_COPIA.temporalAlterado]: {
    ok: false,
    motivo: 'error',
    detalle: 'el archivo temporal cambió antes de copiarlo; no se copió nada',
  },
  [SALIDA_COPIA.hostsCambiado]: {
    ok: false,
    motivo: 'error',
    detalle: 'el archivo hosts cambió mientras se esperaba el permiso; vuelva a aplicar',
  },
  [SALIDA_COPIA.denegado]: {
    ok: false,
    motivo: 'denegado',
    detalle:
      'el archivo hosts está protegido contra escritura (permisos o un antivirus que protege hosts); no se cambió nada',
  },
  [SALIDA_COPIA.enUso]: {
    ok: false,
    motivo: 'error',
    detalle: 'otro programa tiene abierto el archivo hosts; no se cambió nada',
  },
};

/** Ruta del hosts del sistema calculada en el script elevado (no confía en %SystemRoot%). */
const DESTINO_SISTEMA =
  "[IO.Path]::Combine([Environment]::SystemDirectory, 'drivers', 'etc', 'hosts')";

/** Texto entre comillas simples de PowerShell (también duplica las comillas tipográficas). */
export const literal = literalPowerShell;

/**
 * Script que corre ELEVADO: antes de escribir comprueba que no venció el plazo (hora UTC
 * incrustada), que el temporal es el que se escribió (SHA-256) y que hosts sigue igual que
 * cuando se calculó el contenido nuevo (SHA-256; `NINGUNO` si no existía). Si algo no cuadra,
 * sale con su código sin tocar nada.
 *
 * - El temporal se lee UNA vez: se verifica y se escribe ese mismo arreglo de bytes.
 * - Con `destino: null` escribe el hosts del sistema, cuya ruta sale de
 *   `[Environment]::SystemDirectory` (la API), nunca de una variable de entorno.
 * - Un hosts de solo lectura (herramientas de antivirus "proteger hosts") se desbloquea para
 *   escribir y vuelve a quedar de solo lectura. Un acceso denegado real sale con `denegado`.
 */
export function scriptCopiaHosts(o: {
  temporal: string;
  destino: string | null;
  limiteUnixMs: number | null;
  hashTemporal: string;
  hashPrevio: string | null;
}): string {
  const lineas = [
    "$ErrorActionPreference = 'Stop'",
    ...(o.limiteUnixMs === null
      ? []
      : [
          `if ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -gt ${Math.floor(o.limiteUnixMs)}) { exit ${SALIDA_COPIA.vencido} }`,
        ]),
    // Solo .NET, sin cmdlets de módulos (Get-FileHash, Test-Path, Copy-Item): con un
    // PSModulePath de PowerShell 7 heredado, Windows PowerShell no puede cargarlos.
    'function Get-HuellaWolf([byte[]]$x) { $s = [Security.Cryptography.SHA256]::Create(); try { [BitConverter]::ToString($s.ComputeHash($x)).Replace([string][char]45, [string]::Empty) } finally { $s.Dispose() } }',
    `$t = ${literal(o.temporal)}`,
    `$d = ${o.destino === null ? DESTINO_SISTEMA : literal(o.destino)}`,
    `if (-not [IO.File]::Exists($t)) { exit ${SALIDA_COPIA.sinTemporal} }`,
    '$b = [IO.File]::ReadAllBytes($t)',
    `if ((Get-HuellaWolf $b) -ne ${literal(o.hashTemporal.toUpperCase())}) { exit ${SALIDA_COPIA.temporalAlterado} }`,
    ...(o.hashPrevio === null
      ? []
      : [
          `try { $h = if ([IO.File]::Exists($d)) { Get-HuellaWolf ([IO.File]::ReadAllBytes($d)) } else { 'NINGUNO' } } catch [UnauthorizedAccessException] { exit ${SALIDA_COPIA.denegado} }`,
          `if ($h -ne ${literal(o.hashPrevio.toUpperCase())}) { exit ${SALIDA_COPIA.hostsCambiado} }`,
        ]),
    '$sl = [IO.FileAttributes]::ReadOnly',
    '$ro = $false',
    '$c = 0',
    'try {',
    '  if ([IO.File]::Exists($d)) { $a = [IO.File]::GetAttributes($d); if (($a -band $sl) -ne 0) { $ro = $true; [IO.File]::SetAttributes($d, ($a -band (-bnot $sl))) } }',
    '  [IO.File]::WriteAllBytes($d, $b)',
    `} catch [UnauthorizedAccessException] { $c = ${SALIDA_COPIA.denegado} } catch [Security.SecurityException] { $c = ${SALIDA_COPIA.denegado} } catch [IO.IOException] { $c = ${SALIDA_COPIA.enUso} } finally {`,
    '  if ($ro) { try { [IO.File]::SetAttributes($d, ([IO.File]::GetAttributes($d) -bor $sl)) } catch { } }',
    '}',
    'if ($c -ne 0) { exit $c }',
    "$null = & ([IO.Path]::Combine([Environment]::SystemDirectory, 'ipconfig.exe')) /flushdns",
    `exit ${SALIDA_COPIA.ok}`,
  ];
  return lineas.join('\n');
}

/** Script en base64 UTF-16LE para `-EncodedCommand` (sin problemas de comillas). */
export const codificarComando = (script: string): string =>
  Buffer.from(script, 'utf16le').toString('base64');

/**
 * Guarda que va al principio del comando elevado (F7). Windows no deja cerrar desde un proceso sin
 * elevar la ventana del UAC (consent.exe): si la app deja de esperar (plazo vencido, cancelada o
 * cerrada), esa ventana puede seguir en pantalla y alguien aceptarla más tarde. Para que entonces
 * no haga nada, el comando elevado comprueba, antes de cualquier otra cosa, que el lanzador sin
 * elevar que lo pidió sigue vivo (mismo PID y misma hora de inicio): la app lo corta cuando deja de
 * esperar, y entonces el comando sale con `huerfano` sin tocar nada. No depende del reloj ni del
 * plazo incrustado en cada script. Los marcadores los rellena el lanzador al ejecutarse.
 */
export const GUARDA_LANZADOR = `try { if ([Diagnostics.Process]::GetProcessById(@@PID@@).StartTime.ToUniversalTime().Ticks -ne @@INICIO@@) { exit ${SALIDA_COPIA.huerfano} } } catch { exit ${SALIDA_COPIA.huerfano} }; `;

/**
 * PowerShell exterior (sin elevar) que pide el UAC y espera al script elevado. Solo .NET:
 * `Process.Start` con `runas` (sin `Start-Process`, que vive en un módulo). Se toma `Handle`
 * antes de esperar para que `ExitCode` no quede nulo, y se sale con `[int]`. Antepone al comando
 * elevado la guarda del lanzador (`GUARDA_LANZADOR`) con su propio PID y hora de inicio.
 */
export function scriptElevar(comandoCodificado: string): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    "$i = [Diagnostics.ProcessStartInfo]::new([IO.Path]::Combine([Environment]::SystemDirectory, 'WindowsPowerShell', 'v1.0', 'powershell.exe'))",
    '$y = [Diagnostics.Process]::GetCurrentProcess()',
    `$g = ${literal(GUARDA_LANZADOR)}.Replace('@@PID@@', [string]$y.Id).Replace('@@INICIO@@', [string]$y.StartTime.ToUniversalTime().Ticks)`,
    `$c = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${comandoCodificado}'))`,
    "$i.Arguments = '-NoProfile -NonInteractive -EncodedCommand ' + [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($g + $c))",
    "$i.Verb = 'runas'",
    '$i.UseShellExecute = $true',
    '$i.WindowStyle = [Diagnostics.ProcessWindowStyle]::Hidden',
    `try { $p = [Diagnostics.Process]::Start($i) } catch { $x = $_.Exception; while ($x.InnerException) { $x = $x.InnerException }; if ($x.NativeErrorCode -eq 1223) { exit ${SALIDA_COPIA.cancelado} }; throw }`,
    '$null = $p.Handle',
    '$p.WaitForExit()',
    'exit [int]$p.ExitCode',
  ].join('; ');
}

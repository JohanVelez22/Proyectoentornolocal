import { execFileSync, spawnSync } from 'node:child_process';

/**
 * PowerShell para el parser: Windows PowerShell en Windows y `pwsh` (PowerShell 7, mismo parser)
 * en macOS y Linux, donde lo traen los runners de CI. Null si no hay ninguno: la prueba se omite.
 */
function ejecutablePowerShell(): string | null {
  const candidatos = process.platform === 'win32' ? ['powershell.exe', 'pwsh'] : ['pwsh'];
  for (const exe of candidatos) {
    const r = spawnSync(
      exe,
      ['-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.Major'],
      {
        encoding: 'utf8',
        timeout: 30_000,
      },
    );
    if (r.status === 0) return exe;
  }
  return null;
}

let cacheEjecutable: string | null | undefined;
/** ¿Hay una PowerShell con la que analizar? (se consulta una vez). */
export function hayPowerShell(): boolean {
  if (cacheEjecutable === undefined) cacheEjecutable = ejecutablePowerShell();
  return cacheEjecutable !== null;
}

/** Lo que el parser de PowerShell (sin ejecutar nada) ve en un script. */
export interface AnalisisPowerShell {
  errores: string[];
  /** Valores de los literales de cadena entre comillas simples. */
  literales: string[];
  /** Nombres de los comandos invocados (`Write-Output`…). */
  comandos: string[];
}

const PROGRAMA = `
$ProgressPreference = 'SilentlyContinue'
$entrada = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()))
$scripts = $entrada | ConvertFrom-Json
$res = @()
foreach ($s in $scripts) {
  $e = $null; $t = $null
  $ast = [System.Management.Automation.Language.Parser]::ParseInput([string]$s, [ref]$t, [ref]$e)
  $lit = @($ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.StringConstantExpressionAst] -and $n.StringConstantType -eq 'SingleQuoted' }, $true) | ForEach-Object { [string]$_.Value })
  $cmd = @($ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true) | ForEach-Object { [string]$_.GetCommandName() })
  $res += [pscustomobject]@{ errores = @($e | ForEach-Object { [string]$_.Message }); literales = $lit; comandos = $cmd }
}
[Console]::Out.Write([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $res -Depth 4 -Compress))))
`;

/** Analiza varios scripts con UNA sola PowerShell (solo se parsean, jamás se ejecutan). */
export function analizarPowerShell(scripts: string[]): AnalisisPowerShell[] {
  const entrada = Buffer.from(JSON.stringify(scripts), 'utf8').toString('base64');
  const orden = Buffer.from(PROGRAMA, 'utf16le').toString('base64');
  if (!hayPowerShell())
    throw new Error('No hay PowerShell (powershell.exe ni pwsh) para el parser.');
  const salida = execFileSync(
    cacheEjecutable as string,
    ['-NoProfile', '-NonInteractive', '-EncodedCommand', orden],
    { input: entrada, encoding: 'utf8', timeout: 60_000, stdio: ['pipe', 'pipe', 'pipe'] },
  );
  const crudo = JSON.parse(Buffer.from(salida.trim(), 'base64').toString('utf8')) as unknown;
  const lista = (Array.isArray(crudo) ? crudo : [crudo]) as Array<Record<string, unknown>>;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? (v as string[]) : v == null ? [] : [String(v)];
  return lista.map((x) => ({
    errores: arr(x['errores']),
    literales: arr(x['literales']),
    comandos: arr(x['comandos']),
  }));
}

/** Valores hostiles: cada comilla que PowerShell trata como comilla simple, más el apóstrofo. */
export const VALORES_HOSTILES = [
  'O’; Write-Output INYECTADO; ’x',
  'O‘; Write-Output INYECTADO; ‘x',
  'O‚; Write-Output INYECTADO; ‚x',
  'O‛; Write-Output INYECTADO; ‛x',
  "O'; Write-Output INYECTADO; 'x",
] as const;

/**
 * Comprueba que `valor` llegó como literal: sin errores de sintaxis, ningún comando inyectado y
 * todo fragmento con la marca está dentro de un literal cuyo valor es EXACTAMENTE `valor`.
 */
export function esperarLiteralExacto(a: AnalisisPowerShell, valorCrudo: string): string[] {
  const valor = valorCrudo;
  const problemas: string[] = [];
  if (a.errores.length > 0) problemas.push(`errores de sintaxis: ${a.errores.join(' | ')}`);
  if (a.comandos.some((c) => /^write-output$/i.test(c))) problemas.push('comando inyectado');
  const conMarca = a.literales.filter((l) => l.includes('INYECTADO'));
  if (conMarca.length === 0) problemas.push('el valor no aparece como literal');
  for (const l of conMarca) if (l !== valor) problemas.push(`literal distinto: ${l}`);
  return problemas;
}

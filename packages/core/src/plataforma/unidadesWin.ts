import type { UnidadDisco } from './tipos';

/**
 * Unidades que se pueden analizar en «Uso del disco» (D51), en Windows. SOLO CONSULTA
 * (`Win32_LogicalDisk`): no abre las unidades en bruto, no lee la tabla de archivos (MFT) y no
 * pide permisos de administrador. Los tipos 3 (disco fijo) y 2 (extraíble) se ofrecen; las
 * unidades de red, los discos ópticos y los de RAM no.
 */
export const SCRIPT_UNIDADES = [
  "$ErrorActionPreference = 'Stop'",
  "$ProgressPreference = 'SilentlyContinue'",
  '$d = @(Get-CimInstance -ClassName Win32_LogicalDisk | ForEach-Object {',
  '  [pscustomobject]@{ id = [string]$_.DeviceID; tipo = [int]$_.DriveType; etiqueta = [string]$_.VolumeName; total = $_.Size; libre = $_.FreeSpace }',
  '})',
  '[Console]::Out.Write((ConvertTo-Json -InputObject $d -Compress))',
].join('\n');

const numero = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;

/** Interpreta la salida del script; lo que no se entiende se descarta (nunca lanza). */
export function interpretarUnidades(stdout: string): UnidadDisco[] {
  let datos: unknown;
  try {
    datos = JSON.parse(stdout.trim());
  } catch {
    return [];
  }
  const lista = Array.isArray(datos) ? datos : [datos];
  const salida: UnidadDisco[] = [];
  for (const x of lista) {
    if (typeof x !== 'object' || x === null) continue;
    const u = x as Record<string, unknown>;
    const m = typeof u['id'] === 'string' ? /^([A-Za-z]):$/.exec(u['id']) : null;
    if (!m || (u['tipo'] !== 3 && u['tipo'] !== 2)) continue;
    salida.push({
      ruta: `${m[1]!.toUpperCase()}:\\`,
      etiqueta: typeof u['etiqueta'] === 'string' ? u['etiqueta'].slice(0, 64) : '',
      tipo: u['tipo'] === 3 ? 'fijo' : 'extraible',
      total: numero(u['total']),
      libre: numero(u['libre']),
    });
  }
  return salida.sort((a, b) => (a.ruta < b.ruta ? -1 : 1));
}

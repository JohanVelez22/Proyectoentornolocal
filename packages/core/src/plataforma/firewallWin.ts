/**
 * Lecturas de solo lectura del cortafuegos y del perfil de red de Windows. Nada de lo de aquí
 * cambia una regla: WolfCore Dev solo lee y, si algo sobra, muestra un comando que el usuario
 * corre él mismo como administrador.
 */

export type PerfilRed = 'privado' | 'publico' | 'dominio';

/** Una regla de entrada que permite a un programa de WolfCore Dev recibir conexiones. */
export interface ReglaEntrada {
  /** `Name` de la regla (único): con él se quita sin tocar otras con el mismo nombre visible. */
  nombre: string;
  nombreVisible: string;
  /** `Public`, `Private`, `Domain`, `Any` o varios separados por coma. */
  perfil: string;
  programa: string;
}

export interface ReglasEntrada {
  /** false: no se pudo leer (sin permisos o sin cortafuegos): se informa, no es un error. */
  ok: boolean;
  reglas: ReglaEntrada[];
}

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

/** `Get-NetConnectionProfile` de la interfaz que tiene esa IP (solo lectura). */
export function scriptPerfilRed(ip: string): string {
  if (!IPV4.test(ip)) throw new Error(`IP no válida: ${ip}`);
  return [
    "$ErrorActionPreference = 'Stop'",
    `$i = (Get-NetIPAddress -IPAddress '${ip}' -AddressFamily IPv4 | Select-Object -First 1).InterfaceIndex`,
    '[Console]::Out.WriteLine([string](Get-NetConnectionProfile -InterfaceIndex $i).NetworkCategory)',
  ].join('\n');
}

export function interpretarPerfilRed(salida: string): PerfilRed | null {
  const t = salida.trim().toLowerCase();
  if (t === 'private') return 'privado';
  if (t === 'public') return 'publico';
  if (t === 'domainauthenticated') return 'dominio';
  return null;
}

/** Ejecutables de WolfCore Dev que no deberían tener una regla de entrada propia. */
export const PROGRAMAS_VIGILADOS = ['nginx', 'php-cgi', 'php', 'mysqld', 'postgres'] as const;

/**
 * Reglas de entrada habilitadas con acción Allow cuyo programa es uno vigilado. Una línea por
 * regla: `Name<TAB>DisplayName<TAB>Profile<TAB>Program`.
 */
export const SCRIPT_REGLAS_ENTRADA = [
  "$ErrorActionPreference = 'Stop'",
  String.raw`$filtros = Get-NetFirewallApplicationFilter | Where-Object { $_.Program -match '(?i)\\(${PROGRAMAS_VIGILADOS.join('|')})\.exe$' }`,
  'foreach ($f in $filtros) {',
  '  $r = $f | Get-NetFirewallRule',
  "  if ($r.Direction -eq 'Inbound' -and $r.Action -eq 'Allow' -and $r.Enabled -eq 'True') {",
  '    [Console]::Out.WriteLine(($r.Name, $r.DisplayName, [string]$r.Profile, $f.Program) -join [string][char]9)',
  '  }',
  '}',
].join('\n');

const NOMBRE_REGLA = /^[\w{}.\- @:()[\]]{1,200}$/;

export function interpretarReglasEntrada(salida: string): ReglaEntrada[] {
  const res: ReglaEntrada[] = [];
  for (const linea of salida.split(/\r?\n/)) {
    const [nombre, nombreVisible, perfil, programa] = linea.split('\t');
    if (!nombre || !programa || !NOMBRE_REGLA.test(nombre)) continue;
    res.push({
      nombre,
      nombreVisible: (nombreVisible ?? '').slice(0, 200),
      perfil: (perfil ?? '').slice(0, 60),
      programa: programa.slice(0, 500),
    });
  }
  return res;
}

/**
 * Lecturas del cortafuegos y del perfil de red de Windows. Nada de lo de aquí
 * cambia una regla (los cambios de D46 viven en firewallCambiosWin.ts). Si algo sobra se muestra un comando que el usuario
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
  /** Protocolo (`TCP`, `UDP`, `Any`, un número…); vacío si no se pudo leer. */
  protocolo?: string;
  /** Puertos locales separados por coma (`Any` si todos). */
  puertoLocal?: string;
  /** Direcciones remotas separadas por coma (`Any`, `LocalSubnet`…). */
  direccionRemota?: string;
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
export const PROGRAMAS_VIGILADOS = [
  'nginx',
  'php-cgi',
  'php',
  'mysqld',
  'mariadbd',
  'postgres',
  'mongod',
  'redis-server',
  'mailpit',
  'meilisearch',
  'inbucket',
] as const;

/**
 * Reglas de entrada habilitadas con acción Allow cuyo programa es uno vigilado. Una línea por
 * regla: `Name<TAB>DisplayName<TAB>Profile<TAB>Program<TAB>Protocol<TAB>LocalPort<TAB>RemoteAddress`.
 */
export const SCRIPT_REGLAS_ENTRADA = [
  "$ErrorActionPreference = 'Stop'",
  // Con un PSModulePath heredado de PowerShell 7, Windows PowerShell no cargaba NetSecurity.
  "$env:PSModulePath = [IO.Path]::Combine([Environment]::SystemDirectory, 'WindowsPowerShell', 'v1.0', 'Modules')",
  String.raw`$filtros = Get-NetFirewallApplicationFilter | Where-Object { $_.Program -match '(?i)\\(${PROGRAMAS_VIGILADOS.join('|')})\.exe$' }`,
  'foreach ($f in $filtros) {',
  '  $r = $f | Get-NetFirewallRule',
  "  if ($r.Direction -eq 'Inbound' -and $r.Action -eq 'Allow' -and $r.Enabled -eq 'True') {",
  '    $pf = $r | Get-NetFirewallPortFilter; $af = $r | Get-NetFirewallAddressFilter',
  '    $lp = @($pf.LocalPort | ForEach-Object { [string]$_ }) -join [string][char]44',
  '    $ra = @($af.RemoteAddress | ForEach-Object { [string]$_ }) -join [string][char]44',
  '    [Console]::Out.WriteLine(($r.Name, $r.DisplayName, [string]$r.Profile, $f.Program, [string]$pf.Protocol, $lp, $ra) -join [string][char]9)',
  '  }',
  '}',
].join('\n');

/**
 * Nombre de regla aceptado. Windows crea las del aviso "permitir acceso" con nombres como
 * `TCP Query User{GUID}C:\ruta\nginx.exe` (barras, dos puntos y llaves). Sin comodines
 * (`* ? [ ]`), comillas, acento grave ni caracteres de control: así nunca actúa como patrón ni
 * rompe un literal de PowerShell.
 */
// eslint-disable-next-line no-control-regex
export const NOMBRE_REGLA_LISTA = /^[^\x00-\x1f*?[\]`'"‘’‚‛]{1,400}$/;

export function interpretarReglasEntrada(salida: string): ReglaEntrada[] {
  const res: ReglaEntrada[] = [];
  for (const linea of salida.split(/\r?\n/)) {
    const [nombre, nombreVisible, perfil, programa, protocolo, puertoLocal, direccionRemota] =
      linea.split('\t');
    if (!nombre || !programa || !NOMBRE_REGLA_LISTA.test(nombre)) continue;
    res.push({
      nombre,
      nombreVisible: (nombreVisible ?? '').slice(0, 200),
      perfil: (perfil ?? '').slice(0, 60),
      programa: programa.slice(0, 500),
      ...(protocolo !== undefined
        ? {
            protocolo: protocolo.slice(0, 20),
            puertoLocal: (puertoLocal ?? '').slice(0, 200),
            direccionRemota: (direccionRemota ?? '').slice(0, 200),
          }
        : {}),
    });
  }
  return res;
}

/**
 * Regla acotada a la red local, como la que recomienda la propia app para compartir un sitio
 * (`regla-firewall-lan`): un solo perfil Private, TCP o UDP con puertos concretos y
 * `RemoteAddress LocalSubnet`. No deja el programa abierto a Internet: no es "peligrosa". Si
 * falta algún dato (no se pudo leer), no se da por acotada.
 */
export function esReglaAcotada(r: ReglaEntrada): boolean {
  if (r.protocolo === undefined || r.puertoLocal === undefined || r.direccionRemota === undefined) {
    return false;
  }
  const puertos = r.puertoLocal.split(',').map((x) => x.trim());
  return (
    r.perfil.trim().toLowerCase() === 'private' &&
    /^(tcp|udp|6|17)$/i.test(r.protocolo.trim()) &&
    puertos.length > 0 &&
    puertos.every((p) => /^\d{1,5}(-\d{1,5})?$/.test(p)) &&
    r.direccionRemota.trim().toLowerCase() === 'localsubnet'
  );
}

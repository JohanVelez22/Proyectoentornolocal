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
 * regla, como JSON compacto (`ConvertTo-Json -Compress`): un DisplayName con tabuladores o saltos
 * de línea no puede mover campos ni hacer pasar una regla por otra.
 */
export const SCRIPT_REGLAS_ENTRADA = [
  "$ErrorActionPreference = 'Stop'",
  // La salida se lee en Node como UTF-8: con una página OEM (850) los acentos llegarían rotos.
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
  // Con un PSModulePath heredado de PowerShell 7, Windows PowerShell no cargaba NetSecurity.
  "$env:PSModulePath = [IO.Path]::Combine([Environment]::SystemDirectory, 'WindowsPowerShell', 'v1.0', 'Modules')",
  String.raw`$filtros = Get-NetFirewallApplicationFilter | Where-Object { $_.Program -match '(?i)\\(${PROGRAMAS_VIGILADOS.join('|')})\.exe$' }`,
  'foreach ($f in $filtros) {',
  '  $r = $f | Get-NetFirewallRule',
  "  if ($r.Direction -eq 'Inbound' -and $r.Action -eq 'Allow' -and $r.Enabled -eq 'True') {",
  '    $pf = $r | Get-NetFirewallPortFilter; $af = $r | Get-NetFirewallAddressFilter',
  '    $o = [ordered]@{ nombre = [string]$r.Name; nombreVisible = [string]$r.DisplayName; perfil = [string]$r.Profile; programa = [string]$f.Program; protocolo = [string]$pf.Protocol; puertoLocal = @($pf.LocalPort | ForEach-Object { [string]$_ }); direccionRemota = @($af.RemoteAddress | ForEach-Object { [string]$_ }) }',
  '    [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress))',
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

const texto = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.length <= max ? v : null;
const listaTexto = (v: unknown): string[] | null =>
  Array.isArray(v) && v.length <= 64 && v.every((x) => typeof x === 'string' && x.length <= 200)
    ? (v as string[])
    : null;

/** Una línea JSON por regla; lo que no tiene la forma esperada se descarta. */
export function interpretarReglasEntrada(salida: string): ReglaEntrada[] {
  const res: ReglaEntrada[] = [];
  for (const linea of salida.split(/\r?\n/)) {
    if (!linea.trim()) continue;
    let o: Record<string, unknown>;
    try {
      const v: unknown = JSON.parse(linea);
      if (typeof v !== 'object' || v === null || Array.isArray(v)) continue;
      o = v as Record<string, unknown>;
    } catch {
      continue;
    }
    const nombre = texto(o.nombre, 400);
    const programa = texto(o.programa, 500);
    const puertos = listaTexto(o.puertoLocal);
    const remotas = listaTexto(o.direccionRemota);
    const protocolo = texto(o.protocolo, 20);
    if (!nombre || !programa || !NOMBRE_REGLA_LISTA.test(nombre)) continue;
    res.push({
      nombre,
      nombreVisible: (texto(o.nombreVisible, 2000) ?? '').slice(0, 200),
      perfil: (texto(o.perfil, 200) ?? '').slice(0, 60),
      programa,
      // Si falta o viene mal cualquiera de los tres, no hay datos de alcance: nunca "acotada".
      ...(protocolo !== null && puertos !== null && remotas !== null
        ? {
            protocolo,
            puertoLocal: puertos.join(',').slice(0, 200),
            direccionRemota: remotas.join(',').slice(0, 200),
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
/** Un puerto, o un rango que cubre como mucho 100 puertos. */
function puertoAcotado(p: string): boolean {
  const m = /^(\d{1,5})(?:-(\d{1,5}))?$/.exec(p);
  if (!m) return false;
  const desde = Number(m[1]);
  const hasta = m[2] === undefined ? desde : Number(m[2]);
  return desde >= 1 && hasta <= 65535 && hasta >= desde && hasta - desde + 1 <= 100;
}

export function esReglaAcotada(r: ReglaEntrada): boolean {
  if (r.protocolo === undefined || r.puertoLocal === undefined || r.direccionRemota === undefined) {
    return false;
  }
  const puertos = r.puertoLocal.split(',').map((x) => x.trim());
  return (
    r.perfil.trim().toLowerCase() === 'private' &&
    /^(tcp|udp|6|17)$/i.test(r.protocolo.trim()) &&
    puertos.length > 0 &&
    puertos.every(puertoAcotado) &&
    r.direccionRemota.trim().toLowerCase() === 'localsubnet'
  );
}

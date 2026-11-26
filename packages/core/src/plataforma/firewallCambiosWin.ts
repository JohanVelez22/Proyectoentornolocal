/**
 * D46: scripts que cambian el cortafuegos de Windows (quitar y recrear reglas de entrada Allow
 * peligrosas de WolfCore Dev) y la lectura que las exporta. Solo los corre la plataforma,
 * ELEVADOS (UAC), tras la confirmación explícita del usuario: nunca en segundo plano ni por su
 * cuenta.
 *
 * - Siempre por el `Name` exacto de cada regla (sin comodines) y, justo antes de tocarla, el
 *   script elevado vuelve a comprobar que sigue siendo de entrada, Allow y con un programa
 *   vigilado (`.exe`) bajo la raíz de WolfCore Dev (uniones y nombres 8.3 resueltos).
 * - La copia con la que se puede recrear una regla NO sale de ningún archivo que el usuario (o
 *   un programa suyo) pueda editar ni plantar: la guarda el propio script elevado en el registro,
 *   `HKLM\SOFTWARE\WolfCoreDev\Cortafuegos` (un valor REG_SZ por regla). Un usuario normal no puede
 *   crear claves ahí y los valores no admiten enlaces. El script comprueba que la clave es de
 *   Administradores o SYSTEM y que solo ellos pueden escribirla (si no, sale con 21 sin tocar
 *   nada); el de restaurar solo lee de ahí, comprueba el SHA-256 de lo que se mostró al usuario
 *   y valida cada campo antes de crear nada.
 * - El cuerpo de cada script viaja en un archivo temporal con SHA-256 comprobado dentro del
 *   comando elevado (como el flujo de hosts): el comando no crece con el número de reglas.
 */
import { createHash } from 'node:crypto';
import { NOMBRE_REGLA_LISTA, PROGRAMAS_VIGILADOS } from './firewallWin';

/** Regla completa tal como se exportó antes de quitarla (para poder recrearla). */
export interface ReglaExportada {
  nombre: string;
  nombreVisible: string;
  descripcion: string;
  habilitada: boolean;
  /** `Public`, `Private`, `Domain`, `Any` o varios separados por coma. */
  perfil: string;
  direccion: string;
  accion: string;
  programa: string;
  protocolo: string;
  puertoLocal: string[];
  puertoRemoto: string[];
  direccionLocal: string[];
  direccionRemota: string[];
}

/** Dónde puede estar la raíz de una regla: la carpeta de datos o un resto de pruebas bajo TEMP. */
export type TipoRaiz = 'propia' | 'prueba';

/** Una regla que el script elevado debe quitar solo si sigue siendo la misma. */
export interface ReglaPorQuitar {
  /** Identificador de su copia protegida (`idRegistro(nombre)`). */
  id: string;
  nombre: string;
  /** Programa tal como lo vio el usuario en la lista: si cambió, no se toca. */
  programa: string;
  /** Carpeta (ya resuelta) bajo la que tiene que seguir el programa. */
  raiz: string;
  tipo: TipoRaiz;
  /** Carpeta temporal (ya resuelta): la raíz de un resto de pruebas tiene que estar bajo ella. */
  temporal: string;
}

/** Copia protegida de una regla quitada: lo único de lo que se puede recrear. */
export interface RegistroProtegido {
  id: string;
  /** SHA-256 (hex) del archivo tal como está en la carpeta protegida. */
  sha256: string;
  regla: ReglaExportada;
}

export interface ReglaPorRestaurar {
  id: string;
  /** SHA-256 de la copia protegida que se mostró al usuario: si cambió, no se crea nada. */
  sha256: string;
  raiz: string;
  tipo: TipoRaiz;
  temporal: string;
}

/** Salidas propias de los scripts elevados de este módulo. */
export const SALIDA_FIREWALL = {
  vencido: 11,
  sinTemporal: 12,
  temporalAlterado: 13,
  /** La carpeta protegida no es de fiar (permisos, dueño o enlace): no se tocó nada. */
  almacenInseguro: 21,
  /** Alguna regla se saltó o no se pudo cambiar (no es un fallo total). */
  saltadas: 41,
} as const;

/** `detalle` con el que la plataforma informa que la carpeta protegida no es de fiar. */
export const DETALLE_ALMACEN_INSEGURO = 'almacen-inseguro';

/**
 * Nombre que se puede pasar a `-Name` sin que actúe como patrón (ver `NOMBRE_REGLA_LISTA`): lo
 * que no cumpla no se quita desde aquí.
 */
export const NOMBRE_REGLA_EXACTO = NOMBRE_REGLA_LISTA;

/** Identificador estable de la copia protegida de una regla (nombre de archivo, sin nada raro). */
export const idRegistro = (nombre: string): string =>
  createHash('sha256').update(nombre, 'utf8').digest('hex').slice(0, 32);

export const sha256Hex = (b: Buffer | string): string =>
  createHash('sha256').update(b).digest('hex');

const lit = (t: string): string => `'${t.replace(/['‘’‚‛]/g, '$&$&')}'`;
const lista = (xs: string[]): string => `@(${xs.map(lit).join(', ')})`;

const PREAMBULO = [
  "$ErrorActionPreference = 'Stop'",
  // Con un PSModulePath heredado de PowerShell 7, Windows PowerShell no cargaba NetSecurity.
  "$env:PSModulePath = [IO.Path]::Combine([Environment]::SystemDirectory, 'WindowsPowerShell', 'v1.0', 'Modules')",
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
];
export const PREAMBULO_MODULOS = PREAMBULO[1]!;
/** La salida se lee en Node como UTF-8: con una página OEM (850) los acentos y el € llegarían rotos. */
export const CODIFICACION_UTF8 = '[Console]::OutputEncoding = [Text.Encoding]::UTF8';

/** `$o`: la regla `$r` exportada con todo lo necesario para recrearla. */
const FUNCION_EXPORTAR = [
  'function Export-ReglaWolf($r) {',
  '  $a = $r | Get-NetFirewallApplicationFilter',
  '  $p = $r | Get-NetFirewallPortFilter',
  '  $d = $r | Get-NetFirewallAddressFilter',
  '  [ordered]@{',
  '    nombre = [string]$r.Name; nombreVisible = [string]$r.DisplayName; descripcion = [string]$r.Description',
  '    habilitada = ([string]$r.Enabled -eq [string]$true); perfil = [string]$r.Profile',
  '    direccion = [string]$r.Direction; accion = [string]$r.Action; programa = [string]$a.Program',
  '    protocolo = [string]$p.Protocol',
  '    puertoLocal = @($p.LocalPort | ForEach-Object { [string]$_ }); puertoRemoto = @($p.RemotePort | ForEach-Object { [string]$_ })',
  '    direccionLocal = @($d.LocalAddress | ForEach-Object { [string]$_ }); direccionRemota = @($d.RemoteAddress | ForEach-Object { [string]$_ })',
  '  }',
  '}',
];

/**
 * Una línea JSON por regla que existe (con cualquier dirección o acción) con todo lo necesario
 * para recrearla. Las que no existen no dan línea: así se sabe qué sigue en pie. Solo lee.
 */
export function scriptExportarReglas(nombres: string[]): string {
  for (const n of nombres) {
    if (!NOMBRE_REGLA_EXACTO.test(n)) throw new Error(`Nombre de regla no válido: ${n}`);
  }
  return [
    ...PREAMBULO,
    ...FUNCION_EXPORTAR,
    `foreach ($n in ${lista(nombres)}) {`,
    '  $r = Get-NetFirewallRule -Name $n -ErrorAction SilentlyContinue',
    '  if ($null -eq $r) { continue }',
    '  [Console]::Out.WriteLine((Export-ReglaWolf $r | ConvertTo-Json -Compress))',
    '}',
  ].join('\n');
}

const esTexto = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const esLista = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= 64 && v.every((x) => esTexto(x, 200));

/** Comprueba la forma de una regla exportada (del script o de la copia en disco). */
export function reglaExportadaDe(v: unknown): ReglaExportada | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  if (
    !esTexto(o.nombre, 400) ||
    !NOMBRE_REGLA_LISTA.test(o.nombre) ||
    !esTexto(o.nombreVisible, 500) ||
    !esTexto(o.descripcion, 2000) ||
    typeof o.habilitada !== 'boolean' ||
    !esTexto(o.perfil, 60) ||
    !esTexto(o.direccion, 20) ||
    !esTexto(o.accion, 20) ||
    !esTexto(o.programa, 500) ||
    !esTexto(o.protocolo, 20) ||
    !esLista(o.puertoLocal) ||
    !esLista(o.puertoRemoto) ||
    !esLista(o.direccionLocal) ||
    !esLista(o.direccionRemota)
  ) {
    return null;
  }
  return {
    nombre: o.nombre,
    nombreVisible: o.nombreVisible,
    descripcion: o.descripcion,
    habilitada: o.habilitada,
    perfil: o.perfil,
    direccion: o.direccion,
    accion: o.accion,
    programa: o.programa,
    protocolo: o.protocolo,
    puertoLocal: o.puertoLocal,
    puertoRemoto: o.puertoRemoto,
    direccionLocal: o.direccionLocal,
    direccionRemota: o.direccionRemota,
  };
}

/** Lee una línea JSON del script de exportar; null si no tiene la forma esperada. */
export function interpretarReglaExportada(linea: string): ReglaExportada | null {
  try {
    return reglaExportadaDe(JSON.parse(linea));
  } catch {
    return null;
  }
}

export function interpretarReglasExportadas(salida: string): ReglaExportada[] {
  const res: ReglaExportada[] = [];
  for (const l of salida.split(/\r?\n/)) {
    const t = l.trim();
    if (!t) continue;
    const r = interpretarReglaExportada(t);
    if (r) res.push(r);
  }
  return res;
}

const PERFILES = new Set(['any', 'domain', 'private', 'public']);
const TOKEN_PUERTO = /^(any|\d{1,5}(-\d{1,5})?|[A-Za-z]{2,30})$/;
const TOKEN_DIRECCION = /^[\w.:/*-]{1,100}$/;
const PROTOCOLO = /^(any|tcp|udp|\d{1,3})$/i;

/** ¿El protocolo lleva puertos? (TCP o UDP, por nombre o por número). */
export const protocoloConPuertos = (p: string): boolean => /^(tcp|udp|6|17)$/i.test(p);

/**
 * ¿Se puede recrear esta regla? Solo una de entrada Allow con campos de forma conocida: lo que
 * sale de un archivo nunca se pasa tal cual a PowerShell.
 */
export function reglaRestaurable(r: ReglaExportada): boolean {
  return (
    NOMBRE_REGLA_EXACTO.test(r.nombre) &&
    r.direccion.toLowerCase() === 'inbound' &&
    r.accion.toLowerCase() === 'allow' &&
    r.programa !== '' &&
    r.perfil.split(',').every((x) => PERFILES.has(x.trim().toLowerCase())) &&
    PROTOCOLO.test(r.protocolo) &&
    [...r.puertoLocal, ...r.puertoRemoto].every((x) => TOKEN_PUERTO.test(x)) &&
    [...r.direccionLocal, ...r.direccionRemota].every((x) => TOKEN_DIRECCION.test(x))
  );
}

/**
 * `WolfRuta.Real`: ruta real (uniones y enlaces resueltos, nombres 8.3 expandidos) de lo que
 * exista; lo que falte al final se añade tal cual. Null si no se puede resolver.
 */
export const AYUDA_RUTA = [
  "Add-Type -TypeDefinition @'",
  'using System; using System.IO; using System.Runtime.InteropServices; using System.Text; using Microsoft.Win32.SafeHandles;',
  'public static class WolfRuta {',
  '  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]',
  '  static extern SafeFileHandle CreateFileW(string n, uint a, uint s, IntPtr c, uint d, uint f, IntPtr t);',
  '  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]',
  '  static extern uint GetFinalPathNameByHandleW(SafeFileHandle h, StringBuilder b, uint l, uint f);',
  '  public static string Real(string p) {',
  '    char B = (char)92; string resto = null; string cur = p;',
  '    while (!File.Exists(cur) && !Directory.Exists(cur)) {',
  '      string par = Path.GetDirectoryName(cur); string nom = Path.GetFileName(cur);',
  '      if (string.IsNullOrEmpty(par) || string.IsNullOrEmpty(nom)) return null;',
  '      resto = resto == null ? nom : nom + B + resto; cur = par;',
  '    }',
  '    using (SafeFileHandle h = CreateFileW(cur, 0, 7, IntPtr.Zero, 3, 0x02000000, IntPtr.Zero)) {',
  '      if (h.IsInvalid) return null;',
  '      StringBuilder b = new StringBuilder(1024);',
  '      uint n = GetFinalPathNameByHandleW(h, b, 1024, 0);',
  '      if (n == 0 || n >= 1024) return null;',
  '      string r = b.ToString();',
  '      string pre = new string(B, 2) + "?" + B;',
  '      if (r.StartsWith(pre + "UNC" + B)) return null;',
  '      if (r.StartsWith(pre)) r = r.Substring(4);',
  '      return resto == null ? r : r.TrimEnd(B) + B + resto;',
  '    }',
  '  }',
  '}',
  "'@",
];

const VIGILADOS_PS = `@(${PROGRAMAS_VIGILADOS.map(lit).join(', ')})`;

/** Carpetas temporales de pruebas de WolfCore (mismo patrón que `origenDeRegla`). */
const PATRON_PRUEBA = '^(pel-int-|pel-etapa-|pel-vhost-real-)';

/**
 * Comprobación común (quitar y restaurar): el programa es un `.exe` vigilado y, con uniones y
 * 8.3 resueltos, sigue bajo `$raiz`. Para un resto de pruebas, `$raiz` además tiene que ser una
 * carpeta `pel-*` (o `scratchpad\ngx*`) que cuelga de la carpeta temporal `$tmp`.
 */
const FUNCION_PROGRAMA_PROPIO = [
  `$vigilados = ${VIGILADOS_PS}`,
  'function Test-ProgramaPropio([string]$prog, [string]$raiz, [string]$tipo, [string]$tmp) {',
  '  if ([string]::IsNullOrWhiteSpace($prog) -or $prog.Contains([string][char]37)) { return $false }',
  '  $real = [WolfRuta]::Real($prog); $base = [WolfRuta]::Real($raiz)',
  '  if (-not $real -or -not $base) { return $false }',
  '  $rl = $real.ToLowerInvariant(); $bl = $base.ToLowerInvariant().TrimEnd([char]92)',
  '  if (-not $rl.StartsWith($bl + [string][char]92)) { return $false }',
  "  if ([IO.Path]::GetExtension($rl) -ne '.exe') { return $false }",
  '  if ($vigilados -notcontains [IO.Path]::GetFileNameWithoutExtension($rl)) { return $false }',
  "  if ($tipo -eq 'prueba') {",
  '    $t = [WolfRuta]::Real($tmp)',
  '    if (-not $t) { return $false }',
  '    $tl = $t.ToLowerInvariant().TrimEnd([char]92)',
  '    if (-not $bl.StartsWith($tl + [string][char]92)) { return $false }',
  '    $hoja = [IO.Path]::GetFileName($bl); $padre = [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($bl))',
  `    return (($hoja -match '${PATRON_PRUEBA}') -or (($padre -eq 'scratchpad') -and ($hoja -match '^ngx')))`,
  '  }',
  "  return ($tipo -eq 'propia')",
  '}',
];

const FUNCION_HUELLA =
  'function Get-HuellaWolf([byte[]]$x) { $s = [Security.Cryptography.SHA256]::Create(); try { [BitConverter]::ToString($s.ComputeHash($x)).Replace([string][char]45, [string]::Empty).ToLowerInvariant() } finally { $s.Dispose() } }';

/**
 * Clave del registro donde el script elevado guarda la copia de cada regla quitada: un valor
 * `REG_SZ` por regla, con el id como nombre y el JSON de la regla. Es una CONSTANTE: la usan igual
 * la lectura para mostrar y los scripts elevados (nada sale de variables de entorno). Un usuario
 * normal no puede crear claves bajo `HKLM\SOFTWARE` y los valores del registro no admiten
 * enlaces: no hay enlaces simbólicos, uniones, archivos plantados ni handles previos.
 */
export const RUTA_BASE_ALMACEN = 'SOFTWARE\\WolfCoreDev';
export const RUTA_CLAVE_ALMACEN = 'SOFTWARE\\WolfCoreDev\\Cortafuegos';

/**
 * Comprobación de la clave (y de la superior): el dueño es Administradores o SYSTEM y en su DACL
 * solo ellos (y TrustedInstaller) pueden escribir, borrar o cambiar permisos. Una clave que no
 * cumple no se usa: el script sale con 21 sin tocar nada.
 */
const ALMACEN = [
  "$sidSistema = 'S-1-5-18'; $sidAdmins = 'S-1-5-32-544'; $sidUsuarios = 'S-1-5-32-545'",
  "$sidInstalador = 'S-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464'; $sidCreador = 'S-1-3-0'",
  `$rutaBase = '${RUTA_BASE_ALMACEN}'`,
  `$rutaClave = '${RUTA_CLAVE_ALMACEN}'`,
  // Más GENERIC_ALL (0x10000000) y GENERIC_WRITE (0x40000000), que una ACE puede traer sin mapear.
  // Como entero: un enum de PowerShell no admite esos bits genéricos, que no tienen nombre.
  "$derechosPeligrosos = [int][Security.AccessControl.RegistryRights]'SetValue, CreateSubKey, CreateLink, Delete, ChangePermissions, TakeOwnership' -bor 0x50000000",
  // Siempre la vista de 64 bits: la misma clave para leer, comprobar y escribir.
  '$hklm = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64)',
  'function Test-ClaveWolf($k) {',
  '  if ($null -eq $k) { return $false }',
  // Si la máscara de derechos peligrosos no se pudo calcular, nada es de confianza.
  '  if ($derechosPeligrosos -eq 0) { return $false }',
  '  $a = $k.GetAccessControl()',
  '  $dueno = $a.GetOwner([Security.Principal.SecurityIdentifier]).Value',
  '  if (@($sidSistema, $sidAdmins) -notcontains $dueno) { return $false }',
  '  foreach ($r in $a.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier])) {',
  "    if ($r.AccessControlType -ne 'Allow') { continue }",
  // También cuentan las ACE que solo se heredan: lo que se herede a una clave nueva viene de ahí.
  // CREATOR OWNER solo da derechos al dueño, que ya se comprobó que es de confianza.
  '    if (@($sidSistema, $sidAdmins, $sidInstalador, $sidCreador) -contains $r.IdentityReference.Value) { continue }',
  '    if (([int]$r.RegistryRights -band $derechosPeligrosos) -ne 0) { return $false }',
  '  }',
  '  return $true',
  '}',
  // Abre la clave con derecho de escritura. `$crear`: si no existía, la crea y le pone una ACL
  // propia (herencia cortada; SYSTEM y Administradores control total, Users solo lectura).
  'function Open-ClaveWolf([bool]$crear) {',
  '  $previa = $hklm.OpenSubKey($rutaClave)',
  '  $nueva = ($null -eq $previa)',
  '  if ($null -ne $previa) { $previa.Dispose() }',
  '  if ($nueva) {',
  '    if (-not $crear) { return $null }',
  // Primero la clave superior (con lo que herede de HKLM\\SOFTWARE: se comprueba más abajo) y
  // luego la propia con su seguridad completa en la MISMA llamada: no hay un instante con la ACL
  // heredada.
  '    $hklm.CreateSubKey($rutaBase).Dispose()',
  '    $seg = [Security.AccessControl.RegistrySecurity]::new()',
  '    $seg.SetAccessRuleProtection($true, $false)',
  "    $h = [Security.AccessControl.InheritanceFlags]'ContainerInherit'",
  '    $n = [Security.AccessControl.PropagationFlags]::None',
  '    $allow = [Security.AccessControl.AccessControlType]::Allow',
  '    $seg.AddAccessRule([Security.AccessControl.RegistryAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sidSistema), [Security.AccessControl.RegistryRights]::FullControl, $h, $n, $allow))',
  '    $seg.AddAccessRule([Security.AccessControl.RegistryAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sidAdmins), [Security.AccessControl.RegistryRights]::FullControl, $h, $n, $allow))',
  '    $seg.AddAccessRule([Security.AccessControl.RegistryAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sidUsuarios), [Security.AccessControl.RegistryRights]::ReadKey, $h, $n, $allow))',
  '    try { $seg.SetOwner([Security.Principal.SecurityIdentifier]::new($sidAdmins)) } catch { }',
  '    $hklm.CreateSubKey($rutaClave, [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, $seg).Dispose()',
  '  }',
  '  $k = $hklm.OpenSubKey($rutaClave, [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, [Security.AccessControl.RegistryRights]::FullControl)',
  '  if ($null -eq $k) { return $null }',
  '  $base = $hklm.OpenSubKey($rutaBase)',
  '  $baseBien = Test-ClaveWolf $base',
  '  if ($null -ne $base) { $base.Dispose() }',
  '  if ((-not $baseBien) -or (-not (Test-ClaveWolf $k))) { $k.Dispose(); return $null }',
  '  return $k',
  '}',
];

/**
 * Lectura SIN elevar, solo para mostrar: una línea por copia, `<id> <json>`. No cambia nada. El
 * script elevado vuelve a leer la clave y exige que su SHA-256 sea el de lo mostrado.
 */
export const SCRIPT_LEER_ALMACEN = [
  "$ErrorActionPreference = 'Stop'",
  CODIFICACION_UTF8,
  '$hklm = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64)',
  `$k = $hklm.OpenSubKey('${RUTA_CLAVE_ALMACEN}')`,
  'if ($null -eq $k) { exit 0 }',
  'foreach ($n in $k.GetValueNames()) {',
  '  $v = $k.GetValue($n, $null)',
  '  if ($v -is [string]) { [Console]::Out.WriteLine($n + [string][char]32 + $v) }',
  '}',
].join('\n');

/** Lee la salida de `SCRIPT_LEER_ALMACEN`: id, huella (SHA-256 del texto UTF-8) y regla válida. */
export function interpretarAlmacen(salida: string): RegistroProtegido[] {
  const res: RegistroProtegido[] = [];
  for (const l of salida.split(/\r?\n/)) {
    const i = l.indexOf(' ');
    if (i !== 32) continue;
    const id = l.slice(0, 32);
    if (!/^[0-9a-f]{32}$/.test(id)) continue;
    const texto = l.slice(33);
    const regla = interpretarReglaExportada(texto);
    if (regla && idRegistro(regla.nombre) === id) {
      res.push({ id, sha256: sha256Hex(texto), regla });
    }
  }
  return res;
}

const comprobarPlazo = (limiteUnixMs: number | null): string[] =>
  limiteUnixMs === null
    ? []
    : [
        `if ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -gt ${Math.floor(limiteUnixMs)}) { exit ${SALIDA_FIREWALL.vencido} }`,
      ];

/** Antes de CADA regla: si venció el plazo, se para sin tocar más (el resto queda sin hacer). */
const PLAZO_POR_REGLA = (limiteUnixMs: number | null): string[] =>
  limiteUnixMs === null
    ? []
    : [
        `  if ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -gt ${Math.floor(limiteUnixMs)}) { $vencido = $true; break }`,
      ];

/**
 * Comando elevado (corto y de tamaño fijo): lee el cuerpo del script del archivo temporal,
 * comprueba su SHA-256 (incrustado aquí, que no se puede cambiar) y lo ejecuta. Un archivo
 * alterado o que ya no está sale sin ejecutar nada.
 */
export function scriptCargador(archivo: string, sha256: string): string {
  return [
    ...PREAMBULO,
    FUNCION_HUELLA,
    `$t = ${lit(archivo)}`,
    `if (-not [IO.File]::Exists($t)) { exit ${SALIDA_FIREWALL.sinTemporal} }`,
    '$b = [IO.File]::ReadAllBytes($t)',
    `if ((Get-HuellaWolf $b) -ne ${lit(sha256.toLowerCase())}) { exit ${SALIDA_FIREWALL.temporalAlterado} }`,
    '& ([scriptblock]::Create([Text.UTF8Encoding]::new($false).GetString($b)))',
    'exit $LASTEXITCODE',
  ].join('\n');
}

/**
 * Cuerpo ELEVADO que quita reglas por su `Name` exacto. Para cada una, justo antes de borrar,
 * vuelve a comprobar que sigue siendo de entrada y Allow, con el MISMO programa que vio el
 * usuario, y que ese programa sigue bajo la raíz. Antes de borrarla guarda su copia completa en
 * la carpeta protegida (si no puede, no la borra). Revisa el plazo antes de cada regla.
 */
export function cuerpoQuitarReglas(reglas: ReglaPorQuitar[], limiteUnixMs: number | null): string {
  for (const r of reglas) {
    if (!NOMBRE_REGLA_EXACTO.test(r.nombre)) {
      throw new Error(`Nombre de regla no válido: ${r.nombre}`);
    }
    if (!/^[0-9a-f]{32}$/.test(r.id)) throw new Error(`Identificador no válido: ${r.id}`);
  }
  const filas = reglas.map(
    (r) =>
      `  [pscustomobject]@{ n = ${lit(r.nombre)}; p = ${lit(r.programa)}; r = ${lit(r.raiz)}; k = ${lit(r.tipo)}; t = ${lit(r.temporal)}; i = ${lit(r.id)} }`,
  );
  return [
    ...PREAMBULO,
    ...comprobarPlazo(limiteUnixMs),
    FUNCION_HUELLA,
    ...AYUDA_RUTA,
    ...FUNCION_PROGRAMA_PROPIO,
    ...FUNCION_EXPORTAR,
    ...ALMACEN,
    '$k = Open-ClaveWolf $true',
    `if ($null -eq $k) { exit ${SALIDA_FIREWALL.almacenInseguro} }`,
    '$saltadas = 0; $vencido = $false',
    '$reglas = @(',
    filas.join(',\n'),
    ')',
    'foreach ($e in $reglas) {',
    ...PLAZO_POR_REGLA(limiteUnixMs),
    '  try {',
    '    $r = Get-NetFirewallRule -Name $e.n -ErrorAction Stop',
    '    $f = @($r | Get-NetFirewallApplicationFilter)',
    "    $igual = ($r.Direction -eq 'Inbound') -and ($r.Action -eq 'Allow') -and ($f.Count -eq 1) -and ([string]$f[0].Program -eq $e.p)",
    '    if ($igual -and (Test-ProgramaPropio ([string]$f[0].Program) $e.r $e.k $e.t)) {',
    '      $json = Export-ReglaWolf $r | ConvertTo-Json -Compress',
    '      $k.SetValue($e.i, $json, [Microsoft.Win32.RegistryValueKind]::String)',
    '      $leido = [string]$k.GetValue($e.i, $null)',
    '      if (($leido -ceq $json) -and ((Get-HuellaWolf ([Text.UTF8Encoding]::new($false).GetBytes($leido))) -eq (Get-HuellaWolf ([Text.UTF8Encoding]::new($false).GetBytes($json))))) {',
    '        Remove-NetFirewallRule -Name $e.n -ErrorAction Stop',
    '      } else { $saltadas++ }',
    '    } else { $saltadas++ }',
    '  } catch { $saltadas++ }',
    '}',
    `if ($vencido) { exit ${SALIDA_FIREWALL.vencido} }`,
    `if ($saltadas -gt 0) { exit ${SALIDA_FIREWALL.saltadas} }`,
    'exit 0',
  ].join('\n');
}

/** Validación en el propio script de lo que se va a crear (misma que `reglaRestaurable`). */
const FUNCION_RESTAURABLE = [
  'function Test-ReglaRestaurable($x) {',
  "  if ([string]$x.nombre -notmatch '^[^\\x00-\\x1f*?\\[\\]`]{1,400}$') { return $false }",
  "  if (([string]$x.direccion -ne 'Inbound') -or ([string]$x.accion -ne 'Allow')) { return $false }",
  '  if ([string]::IsNullOrWhiteSpace([string]$x.programa)) { return $false }',
  "  foreach ($t in ([string]$x.perfil -split ',')) { if (@('any', 'domain', 'private', 'public') -notcontains $t.Trim().ToLowerInvariant()) { return $false } }",
  "  if ([string]$x.protocolo -notmatch '^(any|tcp|udp|\\d{1,3})$') { return $false }",
  "  foreach ($t in (@($x.puertoLocal) + @($x.puertoRemoto))) { if ([string]$t -notmatch '^(any|\\d{1,5}(-\\d{1,5})?|[A-Za-z]{2,30})$') { return $false } }",
  "  foreach ($t in (@($x.direccionLocal) + @($x.direccionRemota))) { if ([string]$t -notmatch '^[\\w.:/*-]{1,100}$') { return $false } }",
  '  return $true',
  '}',
];

/**
 * Cuerpo ELEVADO que recrea reglas. Lee SOLO de la carpeta protegida (que comprueba antes:
 * dueño, enlaces, ACL), por id, y solo si el SHA-256 del archivo es el que se mostró al usuario.
 * Valida cada campo y el programa antes de crear la regla; lo que no cuadra se salta.
 */
export function cuerpoRestaurarReglas(
  reglas: ReglaPorRestaurar[],
  limiteUnixMs: number | null,
): string {
  for (const r of reglas) {
    if (!/^[0-9a-f]{32}$/.test(r.id)) throw new Error(`Identificador no válido: ${r.id}`);
    if (!/^[0-9a-f]{64}$/.test(r.sha256)) throw new Error(`Huella no válida: ${r.sha256}`);
  }
  const filas = reglas.map(
    (r) =>
      `  [pscustomobject]@{ i = ${lit(r.id)}; h = ${lit(r.sha256)}; r = ${lit(r.raiz)}; k = ${lit(r.tipo)}; t = ${lit(r.temporal)} }`,
  );
  return [
    ...PREAMBULO,
    ...comprobarPlazo(limiteUnixMs),
    FUNCION_HUELLA,
    ...AYUDA_RUTA,
    ...FUNCION_PROGRAMA_PROPIO,
    ...ALMACEN,
    ...FUNCION_RESTAURABLE,
    // Sin clave no hay nada que recrear: "sin cambios", no una clave que no es de fiar.
    '$existe = $hklm.OpenSubKey($rutaClave)',
    `if ($null -eq $existe) { exit ${SALIDA_FIREWALL.saltadas} }`,
    '$existe.Dispose()',
    '$k = Open-ClaveWolf $false',
    `if ($null -eq $k) { exit ${SALIDA_FIREWALL.almacenInseguro} }`,
    '$saltadas = 0; $vencido = $false',
    '$reglas = @(',
    filas.join(',\n'),
    ')',
    'foreach ($e in $reglas) {',
    ...PLAZO_POR_REGLA(limiteUnixMs),
    '  try {',
    '    $texto = $k.GetValue($e.i, $null)',
    '    if ($texto -isnot [string]) { $saltadas++; continue }',
    '    $bytes = [Text.UTF8Encoding]::new($false).GetBytes($texto)',
    '    if ((Get-HuellaWolf $bytes) -ne $e.h) { $saltadas++; continue }',
    '    $x = $texto | ConvertFrom-Json',
    '    if (-not (Test-ReglaRestaurable $x)) { $saltadas++; continue }',
    '    if ($null -ne (Get-NetFirewallRule -Name ([string]$x.nombre) -ErrorAction SilentlyContinue)) { $saltadas++; continue }',
    '    if (-not (Test-ProgramaPropio ([string]$x.programa) $e.r $e.k $e.t)) { $saltadas++; continue }',
    '    $p = [ordered]@{',
    '      Name = [string]$x.nombre; Direction = "Inbound"; Action = "Allow"; Program = [string]$x.programa',
    '      Enabled = $(if ($x.habilitada) { "True" } else { "False" }); Profile = @(([string]$x.perfil -split ",") | ForEach-Object { $_.Trim() })',
    '      Protocol = [string]$x.protocolo',
    '    }',
    '    if ([string]$x.nombreVisible -ne "") { $p.DisplayName = [string]$x.nombreVisible } else { $p.DisplayName = [string]$x.nombre }',
    '    if ([string]$x.descripcion -ne "") { $p.Description = [string]$x.descripcion }',
    "    $conPuertos = @('tcp', 'udp', '6', '17') -contains ([string]$x.protocolo).ToLowerInvariant()",
    "    $lp = @($x.puertoLocal | Where-Object { [string]$_ -ne 'Any' }); if ($conPuertos -and $lp.Count -gt 0) { $p.LocalPort = $lp }",
    "    $rp = @($x.puertoRemoto | Where-Object { [string]$_ -ne 'Any' }); if ($conPuertos -and $rp.Count -gt 0) { $p.RemotePort = $rp }",
    "    $la = @($x.direccionLocal | Where-Object { [string]$_ -ne 'Any' }); if ($la.Count -gt 0) { $p.LocalAddress = $la }",
    "    $ra = @($x.direccionRemota | Where-Object { [string]$_ -ne 'Any' }); if ($ra.Count -gt 0) { $p.RemoteAddress = $ra }",
    '    $null = New-NetFirewallRule @p -ErrorAction Stop',
    '    $k.DeleteValue($e.i, $false)',
    '  } catch { $saltadas++ }',
    '}',
    `if ($vencido) { exit ${SALIDA_FIREWALL.vencido} }`,
    `if ($saltadas -gt 0) { exit ${SALIDA_FIREWALL.saltadas} }`,
    'exit 0',
  ].join('\n');
}

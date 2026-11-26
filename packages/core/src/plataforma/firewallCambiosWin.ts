/**
 * D46: scripts que cambian el cortafuegos de Windows (quitar y recrear reglas de entrada Allow
 * peligrosas de WolfCore Dev) y la lectura que las exporta. Solo los corre la plataforma, ELEVADOS
 * (UAC), tras la confirmación explícita del usuario: nunca en segundo plano ni por su cuenta.
 * Siempre actúan por el `Name` exacto de cada regla (sin comodines) y, justo antes de tocarla,
 * vuelven a comprobar dentro del script elevado que sigue siendo de entrada, Allow y con un
 * programa vigilado bajo la carpeta de WolfCore Dev (con uniones y nombres 8.3 resueltos).
 */
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

/** Una regla que el script elevado debe quitar solo si sigue siendo la misma. */
export interface ReglaPorQuitar {
  nombre: string;
  /** Programa tal como lo vio el usuario en la lista: si cambió, no se toca. */
  programa: string;
  /** Carpeta (ya resuelta) bajo la que tiene que seguir el programa. */
  raiz: string;
}

export interface ReglaPorRestaurar {
  regla: ReglaExportada;
  raiz: string;
}

/** Salida propia del script elevado: alguna regla se saltó (no es un fallo total). */
export const SALIDA_FIREWALL = { saltadas: 41, vencido: 11 } as const;

/**
 * Nombre que se puede pasar a `-Name` sin que actúe como patrón (ver `NOMBRE_REGLA_LISTA`): lo
 * que no cumpla no se quita desde aquí.
 */
export const NOMBRE_REGLA_EXACTO = NOMBRE_REGLA_LISTA;

const lit = (t: string): string => `'${t.replace(/['‘’‚‛]/g, '$&$&')}'`;
const lista = (xs: string[]): string => `@(${xs.map(lit).join(', ')})`;

/**
 * Una línea JSON por regla que existe (con cualquier dirección o acción) con todo lo necesario
 * para recrearla. Las que no existen no dan línea: así se sabe qué sigue en pie. Solo lee.
 */
export function scriptExportarReglas(nombres: string[]): string {
  for (const n of nombres) {
    if (!NOMBRE_REGLA_EXACTO.test(n)) throw new Error(`Nombre de regla no válido: ${n}`);
  }
  const texto = (e: string): string => `@(${e} | ForEach-Object { [string]$_ })`;
  return [
    "$ErrorActionPreference = 'Stop'",
    `foreach ($n in ${lista(nombres)}) {`,
    '  $r = Get-NetFirewallRule -Name $n -ErrorAction SilentlyContinue',
    '  if ($null -eq $r) { continue }',
    '  $a = $r | Get-NetFirewallApplicationFilter',
    '  $p = $r | Get-NetFirewallPortFilter',
    '  $d = $r | Get-NetFirewallAddressFilter',
    '  $o = [ordered]@{',
    '    nombre = [string]$r.Name; nombreVisible = [string]$r.DisplayName; descripcion = [string]$r.Description',
    '    habilitada = ([string]$r.Enabled -eq [string]$true); perfil = [string]$r.Profile',
    '    direccion = [string]$r.Direction; accion = [string]$r.Action; programa = [string]$a.Program',
    '    protocolo = [string]$p.Protocol',
    `    puertoLocal = ${texto('$p.LocalPort')}; puertoRemoto = ${texto('$p.RemotePort')}`,
    `    direccionLocal = ${texto('$d.LocalAddress')}; direccionRemota = ${texto('$d.RemoteAddress')}`,
    '  }',
    '  [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress))',
    '}',
  ].join('\n');
}

const esTexto = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const esLista = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= 64 && v.every((x) => esTexto(x, 200));

/** Comprueba la forma de una regla exportada (del script o del registro en disco); null si no la tiene. */
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

/** Lee una línea JSON del script anterior; null si no tiene la forma esperada. */
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

/**
 * ¿Se puede recrear esta regla? Solo una de entrada Allow con campos de forma conocida: lo que
 * sale de un archivo editable a mano nunca se pasa tal cual a PowerShell.
 */
export function reglaRestaurable(r: ReglaExportada): boolean {
  return (
    NOMBRE_REGLA_EXACTO.test(r.nombre) &&
    r.direccion.toLowerCase() === 'inbound' &&
    r.accion.toLowerCase() === 'allow' &&
    r.programa !== '' &&
    r.perfil.split(',').every((x) => PERFILES.has(x.trim().toLowerCase())) &&
    /^(any|tcp|udp|\d{1,3})$/i.test(r.protocolo) &&
    [...r.puertoLocal, ...r.puertoRemoto].every((x) => TOKEN_PUERTO.test(x)) &&
    [...r.direccionLocal, ...r.direccionRemota].every((x) => TOKEN_DIRECCION.test(x))
  );
}

const PREAMBULO = [
  "$ErrorActionPreference = 'Stop'",
  // Con un PSModulePath heredado de PowerShell 7, Windows PowerShell no cargaba NetSecurity.
  "$env:PSModulePath = [IO.Path]::Combine([Environment]::SystemDirectory, 'WindowsPowerShell', 'v1.0', 'Modules')",
];

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

/** Comprobación común (quitar y restaurar): el programa sigue bajo `$raiz` y es un vigilado. */
const FUNCION_PROGRAMA_PROPIO = [
  `$vigilados = ${VIGILADOS_PS}`,
  'function Test-ProgramaPropio([string]$prog, [string]$raiz) {',
  '  if ([string]::IsNullOrWhiteSpace($prog) -or $prog.Contains([string][char]37)) { return $false }',
  '  $real = [WolfRuta]::Real($prog); $base = [WolfRuta]::Real($raiz)',
  '  if (-not $real -or -not $base) { return $false }',
  '  $rl = $real.ToLowerInvariant(); $bl = $base.ToLowerInvariant().TrimEnd([char]92)',
  '  if (-not $rl.StartsWith($bl + [string][char]92)) { return $false }',
  '  return ($vigilados -contains [IO.Path]::GetFileNameWithoutExtension($rl))',
  '}',
];

const comprobarPlazo = (limiteUnixMs: number | null): string[] =>
  limiteUnixMs === null
    ? []
    : [
        `if ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -gt ${Math.floor(limiteUnixMs)}) { exit ${SALIDA_FIREWALL.vencido} }`,
      ];

/**
 * Script ELEVADO que quita reglas por su `Name` exacto. Para cada una, justo antes de borrar,
 * vuelve a comprobar que sigue siendo de entrada y Allow, con el MISMO programa que vio el
 * usuario, y que ese programa (con uniones y 8.3 resueltos) sigue bajo la raíz de WolfCore Dev.
 * Si algo no cuadra la salta sin tocarla; al final sale con `SALIDA_FIREWALL.saltadas`.
 */
export function scriptQuitarReglas(reglas: ReglaPorQuitar[], limiteUnixMs: number | null): string {
  for (const r of reglas) {
    if (!NOMBRE_REGLA_EXACTO.test(r.nombre)) {
      throw new Error(`Nombre de regla no válido: ${r.nombre}`);
    }
  }
  const filas = reglas.map(
    (r) =>
      `  [pscustomobject]@{ n = ${lit(r.nombre)}; p = ${lit(r.programa)}; r = ${lit(r.raiz)} }`,
  );
  return [
    ...PREAMBULO,
    ...comprobarPlazo(limiteUnixMs),
    ...AYUDA_RUTA,
    ...FUNCION_PROGRAMA_PROPIO,
    '$saltadas = 0',
    '$reglas = @(',
    filas.join(',\n'),
    ')',
    'foreach ($e in $reglas) {',
    '  try {',
    '    $r = Get-NetFirewallRule -Name $e.n -ErrorAction Stop',
    '    $f = @($r | Get-NetFirewallApplicationFilter)',
    "    $igual = ($r.Direction -eq 'Inbound') -and ($r.Action -eq 'Allow') -and ($f.Count -eq 1) -and ([string]$f[0].Program -eq $e.p)",
    '    if ($igual -and (Test-ProgramaPropio ([string]$f[0].Program) $e.r)) {',
    '      Remove-NetFirewallRule -Name $e.n -ErrorAction Stop',
    '    } else { $saltadas++ }',
    '  } catch { $saltadas++ }',
    '}',
    `if ($saltadas -gt 0) { exit ${SALIDA_FIREWALL.saltadas} }`,
    'exit 0',
  ].join('\n');
}

/** Script ELEVADO que recrea reglas exportadas, con las mismas comprobaciones de programa. */
export function scriptRestaurarReglas(
  reglas: ReglaPorRestaurar[],
  limiteUnixMs: number | null,
): string {
  for (const { regla } of reglas) {
    if (!reglaRestaurable(regla)) throw new Error(`Regla no restaurable: ${regla.nombre}`);
  }
  const sinAny = (xs: string[]): string[] => xs.filter((x) => x.toLowerCase() !== 'any');
  const bloques = reglas.map(({ regla: r, raiz }) => {
    const protocolo = r.protocolo.toLowerCase();
    const conPuertos = protocolo === 'tcp' || protocolo === 'udp';
    const args = [
      `-Name ${lit(r.nombre)}`,
      `-DisplayName ${lit(r.nombreVisible || r.nombre)}`,
      `-Description ${lit(r.descripcion)}`,
      `-Enabled ${r.habilitada ? 'True' : 'False'}`,
      `-Profile ${lista(r.perfil.split(',').map((x) => x.trim()))}`,
      '-Direction Inbound',
      '-Action Allow',
      `-Program ${lit(r.programa)}`,
      `-Protocol ${lit(r.protocolo)}`,
      ...(conPuertos && sinAny(r.puertoLocal).length
        ? [`-LocalPort ${lista(sinAny(r.puertoLocal))}`]
        : []),
      ...(conPuertos && sinAny(r.puertoRemoto).length
        ? [`-RemotePort ${lista(sinAny(r.puertoRemoto))}`]
        : []),
      ...(sinAny(r.direccionLocal).length
        ? [`-LocalAddress ${lista(sinAny(r.direccionLocal))}`]
        : []),
      ...(sinAny(r.direccionRemota).length
        ? [`-RemoteAddress ${lista(sinAny(r.direccionRemota))}`]
        : []),
    ];
    return [
      '  try {',
      `    if ($null -ne (Get-NetFirewallRule -Name ${lit(r.nombre)} -ErrorAction SilentlyContinue)) { $saltadas++ }`,
      `    elseif (Test-ProgramaPropio ${lit(r.programa)} ${lit(raiz)}) { $null = New-NetFirewallRule ${args.join(' ')} -ErrorAction Stop }`,
      '    else { $saltadas++ }',
      '  } catch { $saltadas++ }',
    ].join('\n');
  });
  return [
    ...PREAMBULO,
    ...comprobarPlazo(limiteUnixMs),
    ...AYUDA_RUTA,
    ...FUNCION_PROGRAMA_PROPIO,
    '$saltadas = 0',
    ...bloques,
    `if ($saltadas -gt 0) { exit ${SALIDA_FIREWALL.saltadas} }`,
    'exit 0',
  ].join('\n');
}

import path from 'node:path';
import type { PerfilFirefoxSistema, RangoPuertos, ServicioSistema } from './tipos';

/**
 * Rangos de `netsh interface ipv4 show excludedportrange protocol=tcp`. No depende del idioma:
 * cuenta cada línea con dos números (y quizá el `*` de las exclusiones administradas).
 */
export function interpretarRangosReservados(salida: string): RangoPuertos[] {
  const res: RangoPuertos[] = [];
  for (const linea of salida.split(/\r?\n/)) {
    const m = /^\s*(\d{1,5})\s+(\d{1,5})(?:\s+\*)?\s*$/.exec(linea);
    if (!m) continue;
    const desde = Number(m[1]);
    const hasta = Number(m[2]);
    if (desde < 1 || hasta > 65535 || hasta < desde) continue;
    res.push({ desde, hasta });
  }
  return res;
}

/** Nombre de servicio de Windows aceptable en una consulta (sin comillas ni comodines). */
export const NOMBRE_SERVICIO = /^[A-Za-z0-9_.-]{1,80}$/;

/** Script de una sola consulta: `nombre|estado` por cada servicio que existe. */
export function scriptServicios(nombres: string[]): string {
  const lista = nombres.map((n) => `'${n}'`).join(',');
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    `Get-Service -Name ${lista} | ForEach-Object { '{0}|{1}' -f $_.Name,$_.Status }`,
  ].join('\n');
}

/** Estado de cada servicio pedido; los que no aparecen en la salida no existen. */
export function interpretarServiciosSistema(salida: string, nombres: string[]): ServicioSistema[] {
  const vistos = new Map<string, string>();
  for (const linea of salida.split(/\r?\n/)) {
    const m = /^([^|]+)\|(\w+)$/.exec(linea.trim());
    if (m) vistos.set(m[1]!.toLowerCase(), m[2]!);
  }
  return nombres.map((nombre) => {
    const e = vistos.get(nombre.toLowerCase());
    return {
      nombre,
      estado:
        e === undefined
          ? 'no-existe'
          : e === 'Running'
            ? 'corriendo'
            : e === 'Stopped'
              ? 'detenido'
              : 'otro',
    };
  });
}

/** Valor `Installed` del Visual C++ 2015+ x64 (también bajo WOW6432Node). */
export const SCRIPT_VCREDIST = [
  "$ErrorActionPreference = 'SilentlyContinue'",
  "$r = 'SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64'",
  "$w = 'SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64'",
  '$v = (Get-ItemProperty -Path "HKLM:\\$r").Installed',
  'if ($v -ne 1) { $v = (Get-ItemProperty -Path "HKLM:\\$w").Installed }',
  '[Console]::Out.Write([string]$v)',
].join('\n');

/** Nombre de variable de entorno del usuario que se puede fijar (nunca Path: tiene su propio acceso). */
export const NOMBRE_VARIABLE = /^[A-Za-z_][A-Za-z0-9_]{0,99}$/;

const comillas = (t: string): string => `'${t.replace(/'/g, "''")}'`;

/**
 * Lee el valor de la variable en HKCU\Environment tal como está guardado (sin expandir `%VAR%`),
 * en Base64 de UTF-16LE; nada si no existe.
 */
export function scriptLeerVariableUsuario(nombre: string): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    "$k = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment')",
    'if ($null -eq $k) { exit 0 }',
    'try {',
    `  $v = $k.GetValue(${comillas(nombre)}, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)`,
    '  if ($null -ne $v) { [Console]::Out.Write([Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes([string]$v))) }',
    '} finally { $k.Close() }',
  ].join('\n');
}

/** Fija la variable con el valor que llega por la entrada (Base64 de UTF-16LE), o la borra. */
export function scriptVariableUsuario(nombre: string, borrar: boolean): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    "$k = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment')",
    'try {',
    borrar
      ? `  $k.DeleteValue(${comillas(nombre)}, $false)`
      : [
          '  $b = [Console]::In.ReadToEnd().Trim()',
          '  $v = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($b))',
          `  $k.SetValue(${comillas(nombre)}, $v, [Microsoft.Win32.RegistryValueKind]::String)`,
        ].join('\n'),
    '} finally { $k.Close() }',
  ].join('\n');
}

/**
 * Carpetas de los perfiles de `profiles.ini` de Firefox (`base` es la carpeta del .ini). Se
 * descartan las rutas con `..`, las de red (`\\servidor`, `\\?\UNC`, `\\.\`…) y las absolutas
 * que no son de una unidad local. `fuera` marca un perfil absoluto fuera de `base`: no se toca
 * sin una confirmación aparte.
 */
export function interpretarProfilesIni(texto: string, base: string): PerfilFirefoxSistema[] {
  const res: PerfilFirefoxSistema[] = [];
  let actual: { esPerfil: boolean; ruta?: string; relativa?: boolean } = { esPerfil: false };
  const raiz = path.win32
    .normalize(base)
    .replace(/[\\/]+$/, '')
    .toLowerCase();
  const cerrar = (): void => {
    if (!actual.esPerfil || !actual.ruta) return;
    const ruta = actual.ruta;
    const partes = ruta.split(/[\\/]/).filter(Boolean);
    if (partes.some((p) => p === '..')) return;
    if (actual.relativa === false) {
      // Solo una unidad local (C:\…); nada que empiece por \ o / (red, dispositivos, raíz).
      if (!/^[A-Za-z]:[\\/]/.test(ruta)) return;
      const normal = path.win32.normalize(ruta);
      res.push({ ruta: normal, fuera: !normal.toLowerCase().startsWith(`${raiz}\\`) });
      return;
    }
    if (/^[A-Za-z]:/.test(ruta) || /^[\\/]/.test(ruta)) return;
    res.push({ ruta: path.win32.join(base, ...partes), fuera: false });
  };
  for (const cruda of texto.split(/\r?\n/)) {
    const linea = cruda.trim();
    const seccion = /^\[(.+)\]$/.exec(linea);
    if (seccion) {
      cerrar();
      actual = { esPerfil: /^Profile\d+$/i.test(seccion[1]!) };
      continue;
    }
    const kv = /^([^=]+)=(.*)$/.exec(linea);
    if (!kv || !actual.esPerfil) continue;
    const clave = kv[1]!.trim().toLowerCase();
    if (clave === 'path') actual.ruta = kv[2]!.trim();
    else if (clave === 'isrelative') actual.relativa = kv[2]!.trim() !== '0';
  }
  cerrar();
  return res;
}

/** Defender: protección en tiempo real y carpetas excluidas, una por línea. */
export const SCRIPT_ANTIVIRUS = [
  "$ErrorActionPreference = 'Stop'",
  '$s = Get-MpComputerStatus',
  "[Console]::Out.WriteLine('activo=' + [int][bool]$s.RealTimeProtectionEnabled)",
  "foreach ($e in @((Get-MpPreference).ExclusionPath)) { if ($e) { [Console]::Out.WriteLine('excl=' + $e) } }",
].join('\n');

const sinBarraFinal = (r: string): string =>
  r
    .trim()
    .replace(/[\\/]+$/, '')
    .toLowerCase();

/**
 * Salida de `SCRIPT_ANTIVIRUS` → estado para `carpeta`. Sin permiso de administrador Defender
 * contesta "N/A: …" en lugar de las exclusiones: entonces `excluida` es null.
 */
export function interpretarAntivirus(
  salida: string,
  carpeta: string,
): { activo: boolean; excluida: boolean | null } | null {
  let activo: boolean | null = null;
  const exclusiones: string[] = [];
  let ilegible = false;
  for (const linea of salida.split(/\r?\n/)) {
    const t = linea.trim();
    if (t.startsWith('activo=')) activo = t.slice(7) === '1';
    else if (t.startsWith('excl=')) {
      const e = t.slice(5);
      if (/^N\/A\b/i.test(e)) ilegible = true;
      else exclusiones.push(e);
    }
  }
  if (activo === null) return null;
  const objetivo = sinBarraFinal(carpeta);
  const cubre = exclusiones.some((e) => {
    const x = sinBarraFinal(e);
    return x !== '' && (objetivo === x || objetivo.startsWith(x + '\\'));
  });
  return { activo, excluida: cubre ? true : ilegible ? null : false };
}

/**
 * Raíces de confianza del usuario (que incluyen las del equipo) en PEM, solo con .NET (sin el
 * proveedor `Cert:`, que vive en un módulo). Se omiten las vencidas y las repetidas.
 */
export const SCRIPT_RAICES = [
  "$ErrorActionPreference = 'Stop'",
  '$vistas = @{}',
  '$sb = [Text.StringBuilder]::new()',
  "foreach ($u in 'CurrentUser','LocalMachine') {",
  "  $s = [Security.Cryptography.X509Certificates.X509Store]::new('Root', $u)",
  "  $s.Open('ReadOnly')",
  '  foreach ($c in $s.Certificates) {',
  '    if ($c.NotAfter -lt [DateTime]::Now -or $vistas.ContainsKey($c.Thumbprint)) { continue }',
  '    $vistas[$c.Thumbprint] = 1',
  '    [void]$sb.Append("-----BEGIN CERTIFICATE-----`n")',
  "    [void]$sb.Append([Convert]::ToBase64String($c.RawData, 'InsertLineBreaks'))",
  '    [void]$sb.Append("`n-----END CERTIFICATE-----`n")',
  '  }',
  '  $s.Close()',
  '}',
  '[Console]::Out.Write($sb.ToString())',
].join('\n');

/** Bloques `CERTIFICATE` de un texto, normalizados con `\n` (lo demás se descarta). */
export function bloquesPem(texto: string): string[] {
  return (texto.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? []).map(
    (b) => b.replace(/\r\n?/g, '\n'),
  );
}

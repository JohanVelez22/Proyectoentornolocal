import { literalPowerShell } from './literalPowerShell';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AccesoPathUsuario, Ejecutor } from './tipos';
import { rutaPowerShell } from './procesosWin';

/** Texto ↔ Base64 de sus bytes UTF-16LE: viaja como ASCII puro, sin depender de la página de códigos. */
export const aBase64 = (t: string): string => Buffer.from(t, 'utf16le').toString('base64');
const deBase64 = (b: string): string => Buffer.from(b, 'base64').toString('utf16le');

const comillas = literalPowerShell;

/** Script de PowerShell como -EncodedCommand (UTF-16LE en Base64). */
export const codificarPowerShell = (script: string): string[] => [
  '-NoProfile',
  '-NonInteractive',
  '-ExecutionPolicy',
  'Bypass',
  '-EncodedCommand',
  aBase64(script),
];

/**
 * Lee el valor Path SIN expandir los %VARIABLES% y con su tipo. Salida en ASCII:
 * `SIN` (no hay valor), o `OK <String|ExpandString> <base64 UTF-16LE>`; código 3 si no hay clave.
 */
export function scriptLeer(subclave: string): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    `$k = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey(${comillas(subclave)})`,
    'if ($null -eq $k) { exit 3 }',
    'try {',
    "  if (-not ($k.GetValueNames() -contains 'Path')) { [Console]::Out.Write('SIN'); exit 0 }",
    "  $v = $k.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)",
    "  $t = $k.GetValueKind('Path').ToString()",
    "  [Console]::Out.Write('OK ' + $t + ' ' + [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes([string]$v)))",
    '} finally { $k.Close() }',
  ].join('\n');
}

/** Escribe el valor que llega por la entrada estándar (Base64 de UTF-16LE) con el tipo indicado. */
export function scriptEscribir(subclave: string, tipo: 'String' | 'ExpandString'): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    '$b = [Console]::In.ReadToEnd().Trim()',
    '$v = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($b))',
    `$k = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey(${comillas(subclave)})`,
    `try { $k.SetValue('Path', $v, [Microsoft.Win32.RegistryValueKind]::${tipo}) } finally { $k.Close() }`,
  ].join('\n');
}

/**
 * Avisa a las ventanas abiertas (el Explorador, que lanza las terminales nuevas) de que el
 * entorno cambió: WM_SETTINGCHANGE (0x1A) con "Environment" a todas las ventanas de primer nivel
 * (HWND_BROADCAST = 0xFFFF), esperando 5 s como mucho a cada una (SMTO_ABORTIFHUNG = 2). Todo
 * ASCII. Es un extra: si falla, el PATH ya está guardado.
 */
export const SCRIPT_DIFUNDIR_ENTORNO = [
  "$ErrorActionPreference = 'Stop'",
  'Add-Type -Namespace WolfNat -Name Msg -MemberDefinition \'[DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);\'',
  '$r = [UIntPtr]::Zero',
  "[void][WolfNat.Msg]::SendMessageTimeout([IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$r)",
].join('\n');

export type TipoPath = 'String' | 'ExpandString';

export interface OpcionesPathUsuarioWindows {
  exec: Ejecutor;
  /** Subclave de HKCU con el valor Path (por defecto "Environment"; otra solo en pruebas). */
  subclave?: string;
  /** Archivo con el valor ORIGINAL (no se pisa en cambios posteriores). */
  respaldo?: string;
}

/**
 * PATH del USUARIO (HKCU\Environment\Path). Se lee y escribe con PowerShell y .NET (no con
 * reg.exe, cuya salida sale en la página de códigos OEM y estropea rutas con tildes o ñ): el valor
 * viaja en Base64 de UTF-16LE, sin expandir los %VARIABLES% y conservando su tipo. No se difunde
 * WM_SETTINGCHANGE al terminar, para que el Explorador pase el PATH nuevo a las terminales que abra.
 */
export class PathUsuarioWindows implements AccesoPathUsuario {
  private readonly subclave: string;
  /** Última lectura: `escribir` la usa como valor anterior (tipo y respaldo) sin releer. */
  private ultima: { valor: string; tipo: TipoPath } | null = null;

  constructor(private readonly o: OpcionesPathUsuarioWindows) {
    this.subclave = o.subclave ?? 'Environment';
  }

  /** Valor actual ('' si el usuario no tiene Path); falla si no se puede leer con seguridad. */
  async valorCrudo(): Promise<{ valor: string; tipo: TipoPath }> {
    const r = await this.o.exec(
      rutaPowerShell(process.env),
      codificarPowerShell(scriptLeer(this.subclave)),
      {
        timeoutMs: 30_000,
      },
    );
    const salida = r.stdout.trim();
    if (r.codigo === 0 && salida === 'SIN') {
      this.ultima = { valor: '', tipo: 'ExpandString' };
      return this.ultima;
    }
    const m = /^OK (String|ExpandString)(?: ([A-Za-z0-9+/=]*))?$/.exec(salida);
    if (r.codigo !== 0 || !m) {
      throw new Error('No se pudo leer el PATH del usuario. No se cambió nada.');
    }
    const valor = deBase64(m[2] ?? '');
    if (valor.includes('�')) {
      throw new Error(
        'El PATH del usuario contiene caracteres que no se pudieron leer bien. No se cambió nada.',
      );
    }
    this.ultima = { valor, tipo: m[1] as TipoPath };
    return this.ultima;
  }

  async leer(): Promise<string[]> {
    return (await this.valorCrudo()).valor.split(';').filter((p) => p.trim() !== '');
  }

  async escribir(entradas: string[]): Promise<void> {
    const anterior = this.ultima ?? (await this.valorCrudo());
    this.ultima = null;
    const valor = entradas.join(';');
    if (this.o.respaldo) {
      await mkdir(path.dirname(this.o.respaldo), { recursive: true });
      // Se conserva el ORIGINAL: el respaldo no se pisa en cambios posteriores.
      await writeFile(this.o.respaldo, anterior.valor, { encoding: 'utf8', flag: 'wx' }).catch(
        (e: unknown) => {
          if ((e as { code?: string }).code !== 'EEXIST') throw e;
        },
      );
    }
    // REG_SZ se respeta salvo que el valor lleve %VARS%; si no, REG_EXPAND_SZ.
    const tipo: TipoPath =
      anterior.tipo === 'String' && !valor.includes('%') ? 'String' : 'ExpandString';
    const r = await this.o.exec(
      rutaPowerShell(process.env),
      codificarPowerShell(scriptEscribir(this.subclave, tipo)),
      { timeoutMs: 30_000, entrada: aBase64(valor) },
    );
    if (r.codigo !== 0) {
      throw new Error(`No se pudo guardar el PATH del usuario. ${r.stderr.trim()}`.trim());
    }
    // Se comprueba que quedó exactamente lo que se quiso escribir.
    const escrito = await this.valorCrudo();
    this.ultima = null;
    if (escrito.valor !== valor) {
      throw new Error('El PATH del usuario no quedó como se esperaba. Revise el respaldo en etc/.');
    }
    // Las terminales que se abran desde ahora ven el cambio sin cerrar sesión (si no se puede, el PATH ya está).
    await this.o
      .exec(rutaPowerShell(process.env), codificarPowerShell(SCRIPT_DIFUNDIR_ENTORNO), {
        timeoutMs: 30_000,
      })
      .catch(() => undefined);
  }
}

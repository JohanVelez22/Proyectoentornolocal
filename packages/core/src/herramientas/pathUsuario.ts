import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Ejecutor } from '../plataforma/tipos';
import { ejecutorPorDefecto } from '../plataforma/win';
import type { Rutas } from '../rutas';

export const AVISO_TERMINAL_NUEVA = 'Abra una terminal nueva para ver el cambio.';

export interface DepsPathUsuario {
  rutas: Rutas;
  exec?: Ejecutor;
  /** Subclave de HKCU con el valor Path (por defecto "Environment"; otra solo en pruebas). */
  subclave?: string;
}

const normalizar = (e: string): string =>
  e.trim().replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();

/** Texto ↔ Base64 de sus bytes UTF-16LE: viaja como ASCII puro, sin depender de la página de códigos. */
const aBase64 = (t: string): string => Buffer.from(t, 'utf16le').toString('base64');
const deBase64 = (b: string): string => Buffer.from(b, 'base64').toString('utf16le');

const comillas = (t: string): string => `'${t.replace(/'/g, "''")}'`;

/** Script de PowerShell como -EncodedCommand (UTF-16LE en Base64). */
const codificar = (script: string): string[] => [
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

type TipoPath = 'String' | 'ExpandString';

/**
 * PATH del USUARIO (HKCU\Environment\Path). Se lee y escribe con PowerShell y .NET (no con
 * reg.exe, cuya salida sale en la página de códigos OEM y estropea rutas con tildes o ñ): el valor
 * viaja en Base64 de UTF-16LE, sin expandir los %VARIABLES% y conservando su tipo. No se difunde
 * WM_SETTINGCHANGE: las terminales nuevas lo leen al abrirse; por eso se avisa al usuario.
 */
export class PathUsuario {
  private readonly exec: Ejecutor;
  private readonly subclave: string;
  constructor(private readonly d: DepsPathUsuario) {
    this.exec = d.exec ?? ejecutorPorDefecto;
    this.subclave = d.subclave ?? 'Environment';
  }

  private entrada(): string {
    return this.d.rutas.herramientas('bin');
  }

  /** Valor actual ('' si el usuario no tiene Path); falla si no se puede leer con seguridad. */
  async leer(): Promise<{ valor: string; tipo: TipoPath }> {
    const r = await this.exec('powershell', codificar(scriptLeer(this.subclave)), {
      timeoutMs: 30_000,
    });
    const salida = r.stdout.trim();
    if (r.codigo === 0 && salida === 'SIN') return { valor: '', tipo: 'ExpandString' };
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
    return { valor, tipo: m[1] as TipoPath };
  }

  private async escribir(
    valor: string,
    anterior: { valor: string; tipo: TipoPath },
  ): Promise<void> {
    const respaldo = path.join(this.d.rutas.base, 'etc', 'path-usuario.respaldo.txt');
    await mkdir(path.dirname(respaldo), { recursive: true });
    // Se conserva el ORIGINAL: el respaldo no se pisa en cambios posteriores.
    await writeFile(respaldo, anterior.valor, { encoding: 'utf8', flag: 'wx' }).catch(
      (e: unknown) => {
        if ((e as { code?: string }).code !== 'EEXIST') throw e;
      },
    );
    // REG_SZ se respeta salvo que el valor lleve %VARS%; si no, REG_EXPAND_SZ.
    const tipo: TipoPath =
      anterior.tipo === 'String' && !valor.includes('%') ? 'String' : 'ExpandString';
    const r = await this.exec('powershell', codificar(scriptEscribir(this.subclave, tipo)), {
      timeoutMs: 30_000,
      entrada: aBase64(valor),
    });
    if (r.codigo !== 0) {
      throw new Error(`No se pudo guardar el PATH del usuario. ${r.stderr.trim()}`.trim());
    }
    // Se comprueba que quedó exactamente lo que se quiso escribir.
    const escrito = await this.leer();
    if (escrito.valor !== valor) {
      throw new Error('El PATH del usuario no quedó como se esperaba. Revise el respaldo en etc/.');
    }
  }

  private partes(valor: string): string[] {
    return valor.split(';').filter((p) => p.trim() !== '');
  }

  async estado(): Promise<boolean> {
    const mia = normalizar(this.entrada());
    return this.partes((await this.leer()).valor).some((p) => normalizar(p) === mia);
  }

  async agregar(): Promise<{ aviso: string }> {
    const actual = await this.leer();
    const partes = this.partes(actual.valor);
    if (!partes.some((p) => normalizar(p) === normalizar(this.entrada()))) {
      await this.escribir([...partes, this.entrada()].join(';'), actual);
    }
    return { aviso: AVISO_TERMINAL_NUEVA };
  }

  async quitar(): Promise<{ aviso: string }> {
    const actual = await this.leer();
    const partes = this.partes(actual.valor);
    const resto = partes.filter((p) => normalizar(p) !== normalizar(this.entrada()));
    if (resto.length !== partes.length) await this.escribir(resto.join(';'), actual);
    return { aviso: AVISO_TERMINAL_NUEVA };
  }
}
